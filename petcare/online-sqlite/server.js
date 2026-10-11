'use strict';
// PETCARE ONLINE (Node 22+): API HTTP + banco de dados SQLite.
// Veja README.md para entender a função de cada arquivo e as rotas disponíveis.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
// No Railway, a variável RAILWAY_VOLUME_MOUNT_PATH aponta para o disco persistente.
// Localmente, mantém a pasta data/ usada na versão apresentada ao professor.
// 1. Banco de dados: escolher pasta persistente (volume da hospedagem ou data/ local).
const persistentDir=process.env.PETCARE_DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname,'data');
if(process.env.NODE_ENV==='production' && !process.env.PETCARE_DATA_DIR && !process.env.RAILWAY_VOLUME_MOUNT_PATH){
  throw new Error('Configure um volume persistente no Railway antes de publicar o PetCare.');
}
fs.mkdirSync(persistentDir,{recursive:true});
const db=new DatabaseSync(path.join(persistentDir,'petcare.sqlite'));
// 2. Modelo relacional: usuários, pets, serviços e agendamentos.
// UNIQUE no horário ativo impede duas reservas do mesmo horário.
db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'cliente');
CREATE TABLE IF NOT EXISTS pets(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), name TEXT NOT NULL, species TEXT NOT NULL, breed TEXT DEFAULT '', age INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS services(id INTEGER PRIMARY KEY, name TEXT NOT NULL, price REAL NOT NULL);
CREATE TABLE IF NOT EXISTS appointments(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), pet_id INTEGER NOT NULL REFERENCES pets(id), service_id INTEGER NOT NULL REFERENCES services(id), date TEXT NOT NULL, time TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'agendado', note TEXT DEFAULT '');
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_slot ON appointments(date,time) WHERE status='agendado';`);
for(const [id,name,price] of [[1,'Banho',45],[2,'Tosa',55],[3,'Consulta',90],[4,'Corte de unhas',20]])db.prepare('INSERT OR IGNORE INTO services(id,name,price) VALUES(?,?,?)').run(id,name,price);
if(process.env.NODE_ENV==='production' && (!process.env.PETCARE_SECRET || process.env.PETCARE_SECRET.length<32)){
  throw new Error('Configure PETCARE_SECRET com pelo menos 32 caracteres em Railway > Variables.');
}
// 3. Autenticação: token assinado e senha transformada em hash scrypt.
const secret=process.env.PETCARE_SECRET||crypto.randomBytes(32).toString('hex');
const tokens=new Map();const rate=new Map();
function send(res,status,data,extra={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra});res.end(JSON.stringify(data))}
function hash(p,s){return crypto.scryptSync(p,s,64).toString('hex')}
function token(u){const exp=Date.now()+8*3600e3;const raw=`${u.id}.${exp}.${crypto.randomBytes(12).toString('hex')}`;const sig=crypto.createHmac('sha256',secret).update(raw).digest('hex');return `${raw}.${sig}`}
function auth(req){const t=(req.headers.authorization||'').replace(/^Bearer /,'');const bits=t.split('.');if(bits.length!==4)return null;const raw=bits.slice(0,3).join('.');const sig=crypto.createHmac('sha256',secret).update(raw).digest('hex');if(sig.length!==bits[3].length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(bits[3]))||Number(bits[1])<Date.now())return null;return db.prepare('SELECT id,name,email,role FROM users WHERE id=?').get(Number(bits[0]))||null}
function input(req){return new Promise((ok,no)=>{let s='';req.on('data',c=>{s+=c;if(s.length>30000){no(Error('Dados muito grandes'));req.destroy()}});req.on('end',()=>{try{ok(JSON.parse(s||'{}'))}catch{no(Error('JSON inválido'))}});req.on('error',no)})}
function validDate(d,t){return /^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00'))&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t)&&new Date(d+'T'+t+':00')>new Date()}
// 4. Rotas HTTP: arquivos HTML/CSS/JS e endpoints da API /api/.
const root=path.join(__dirname,'public');
const server=http.createServer(async(req,res)=>{try{
const url=new URL(req.url,'http://localhost');const p=url.pathname,m=req.method;
if(!p.startsWith('/api/')){if(m!=='GET'){res.writeHead(405);return res.end()}const file=p==='/'?'index.html':p.slice(1);if(file.includes('..')||file.includes('/')||!['index.html','app.js','style.css'].includes(file)){res.writeHead(404);return res.end('Não encontrado')}const ext=path.extname(file);res.writeHead(200,{'Content-Type':ext==='.js'?'text/javascript; charset=utf-8':ext==='.css'?'text/css; charset=utf-8':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; base-uri 'none'; object-src 'none'"});return fs.createReadStream(path.join(root,file)).pipe(res)}
if(p==='/api/health'&&m==='GET')return send(res,200,{ok:true});
if(p==='/api/services'&&m==='GET')return send(res,200,db.prepare('SELECT * FROM services').all());
if((p==='/api/register'||p==='/api/login')&&m==='POST'){
 const ip=req.socket.remoteAddress||'local', now=Date.now(),r=rate.get(ip)||[];const recent=r.filter(x=>now-x<60000);if(recent.length>=20)return send(res,429,{error:'Muitas tentativas. Aguarde um minuto.'});recent.push(now);rate.set(ip,recent);
 const b=await input(req),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');if(!/^\S+@\S+\.\S+$/.test(email)||password.length<8||password.length>128)return send(res,400,{error:'Informe e-mail válido e senha de 8 a 128 caracteres.'});
 if(p==='/api/register'){const name=String(b.name||'').trim();if(name.length<2||name.length>80)return send(res,400,{error:'Nome inválido'});if(db.prepare('SELECT id FROM users WHERE email=?').get(email))return send(res,409,{error:'E-mail já cadastrado'});const salt=crypto.randomBytes(16).toString('hex');const info=db.prepare('INSERT INTO users(name,email,salt,password_hash) VALUES(?,?,?,?)').run(name,email,salt,hash(password,salt));const u=db.prepare('SELECT id,name,email,role FROM users WHERE id=?').get(info.lastInsertRowid);return send(res,201,{token:token(u),user:u})}
 const row=db.prepare('SELECT * FROM users WHERE email=?').get(email);const fake=hash(password,'0'.repeat(32));const actual=row?hash(password,row.salt):fake;if(!row||!crypto.timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(row.password_hash,'hex')))return send(res,401,{error:'Credenciais inválidas'});const u={id:row.id,name:row.name,email:row.email,role:row.role};return send(res,200,{token:token(u),user:u})}
const u=auth(req);if(!u)return send(res,401,{error:'Faça login novamente.'});
if(p==='/api/me'&&m==='GET')return send(res,200,u);
if(p==='/api/pets'&&m==='GET')return send(res,200,db.prepare('SELECT id,name,species,breed,age FROM pets WHERE user_id=? ORDER BY id DESC').all(u.id));
if(p==='/api/pets'&&m==='POST'){const b=await input(req),name=String(b.name||'').trim(),species=String(b.species||'').trim(),breed=String(b.breed||'').trim(),age=Number(b.age||0);if(!name||name.length>80||!['Cachorro','Gato','Outro'].includes(species)||breed.length>80||!Number.isInteger(age)||age<0||age>40)return send(res,400,{error:'Dados do pet inválidos'});const x=db.prepare('INSERT INTO pets(user_id,name,species,breed,age) VALUES(?,?,?,?,?)').run(u.id,name,species,breed,age);return send(res,201,{id:Number(x.lastInsertRowid)})}
const pet=p.match(/^\/api\/pets\/(\d+)$/);if(pet){const id=Number(pet[1]),row=db.prepare('SELECT id FROM pets WHERE id=? AND user_id=?').get(id,u.id);if(!row)return send(res,404,{error:'Pet não encontrado'});if(m==='PUT'){const b=await input(req),name=String(b.name||'').trim(),species=String(b.species||''),breed=String(b.breed||''),age=Number(b.age||0);if(!name||name.length>80||!['Cachorro','Gato','Outro'].includes(species)||breed.length>80||!Number.isInteger(age)||age<0||age>40)return send(res,400,{error:'Dados inválidos'});db.prepare('UPDATE pets SET name=?,species=?,breed=?,age=? WHERE id=?').run(name,species,breed,age,id);return send(res,200,{ok:true})}if(m==='DELETE'){if(db.prepare("SELECT id FROM appointments WHERE pet_id=? AND status='agendado'").get(id))return send(res,409,{error:'Cancele os agendamentos ativos antes de excluir o pet.'});db.prepare('DELETE FROM appointments WHERE pet_id=?').run(id);db.prepare('DELETE FROM pets WHERE id=?').run(id);return send(res,200,{ok:true})}}
if(p==='/api/appointments'&&m==='GET')return send(res,200,db.prepare('SELECT a.*,p.name AS pet_name,s.name AS service_name FROM appointments a JOIN pets p ON p.id=a.pet_id JOIN services s ON s.id=a.service_id WHERE a.user_id=? ORDER BY a.date DESC,a.time DESC').all(u.id));
// 5. Agendamento: o SQLite rejeita conflito de horário com erro HTTP 409.
if(p==='/api/appointments'&&m==='POST'){const b=await input(req),pet=Number(b.pet_id),service=Number(b.service_id),date=String(b.date||''),time=String(b.time||''),note=String(b.note||'').trim();if(!validDate(date,time)||note.length>300||!db.prepare('SELECT id FROM pets WHERE id=? AND user_id=?').get(pet,u.id)||!db.prepare('SELECT id FROM services WHERE id=?').get(service))return send(res,400,{error:'Confira pet, serviço, data e horário futuro.'});try{const x=db.prepare('INSERT INTO appointments(user_id,pet_id,service_id,date,time,note) VALUES(?,?,?,?,?,?)').run(u.id,pet,service,date,time,note);return send(res,201,{id:Number(x.lastInsertRowid)})}catch(e){if(e.code==='ERR_SQLITE_ERROR'&&String(e).includes('UNIQUE'))return send(res,409,{error:'Este horário já foi reservado. Escolha outro.'});throw e}}
const ag=p.match(/^\/api\/appointments\/(\d+)$/);if(ag&&m==='PATCH'){const id=Number(ag[1]),b=await input(req);if(!['cancelado','concluido'].includes(b.status))return send(res,400,{error:'Status inválido'});const r=db.prepare("UPDATE appointments SET status=? WHERE id=? AND user_id=? AND status='agendado'").run(b.status,id,u.id);return send(res,r.changes?200:404,r.changes?{ok:true}:{error:'Agendamento não encontrado ou já encerrado'})}
return send(res,404,{error:'Rota não encontrada'});
}catch(e){console.error(e);if(!res.headersSent)send(res,500,{error:'Erro interno no servidor'})}});
// 6. Inicialização: porta fornecida pela hospedagem ou 3000 no computador.
if(require.main===module){
  const port=Number(process.env.PORT||3000);
  const host=process.env.HOST||(process.env.NODE_ENV==='production'?'0.0.0.0':'127.0.0.1');
  server.listen(port,host,()=>console.log('PetCare: servidor iniciado na porta '+port));
}
module.exports={server,db};
