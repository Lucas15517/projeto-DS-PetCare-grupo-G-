'use strict';
// Versão de demonstração OFFLINE para Node.js 20 (sem node:sqlite).
// Banco de dados PRINCIPAL permanece SQLite na versão Node 22+.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const dir=process.env.PETCARE_DATA_DIR || path.join(__dirname,'data');fs.mkdirSync(dir,{recursive:true});
const file=path.join(dir,'petcare-escola.json');
const initial=()=>({users:[],pets:[],services:[{id:1,name:'Banho',price:45},{id:2,name:'Tosa',price:55},{id:3,name:'Consulta',price:90},{id:4,name:'Corte de unhas',price:20}],appointments:[],lastId:{users:0,pets:0,appointments:0}});
let db;
try {db=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):initial();
 if(!Array.isArray(db.users)||!Array.isArray(db.pets)||!Array.isArray(db.appointments)||!Array.isArray(db.services))throw Error('Dados inválidos');
 if(!db.lastId)db.lastId={users:Math.max(0,...db.users.map(v=>v.id)),pets:Math.max(0,...db.pets.map(v=>v.id)),appointments:Math.max(0,...db.appointments.map(v=>v.id))};
} catch(e){console.error('Não foi possível abrir o armazenamento local:',e.message);process.exit(1)}
function persist(){const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2));fs.renameSync(tmp,file)}
if(!fs.existsSync(file))persist();
function nextId(table){return ++db.lastId[table]}
const secret=crypto.randomBytes(32).toString('hex');
const rate=new Map();
function send(res,status,data,extra={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra});res.end(JSON.stringify(data))}
function hash(p,s){return crypto.scryptSync(p,s,64).toString('hex')}
function token(u){const exp=Date.now()+8*3600e3,raw=`${u.id}.${exp}.${crypto.randomBytes(12).toString('hex')}`,sig=crypto.createHmac('sha256',secret).update(raw).digest('hex');return `${raw}.${sig}`}
function publicUser(u){return {id:u.id,name:u.name,email:u.email,role:u.role}}
function auth(req){const t=(req.headers.authorization||'').replace(/^Bearer /,''),bits=t.split('.');if(bits.length!==4)return null;const raw=bits.slice(0,3).join('.'),sig=crypto.createHmac('sha256',secret).update(raw).digest('hex');if(sig.length!==bits[3].length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(bits[3]))||Number(bits[1])<Date.now())return null;const u=db.users.find(x=>x.id===Number(bits[0]));return u?publicUser(u):null}
function input(req){return new Promise((ok,no)=>{let s='',done=false;req.on('data',c=>{s+=c;if(s.length>30000&&!done){done=true;no(Error('Dados muito grandes'));req.destroy()}});req.on('end',()=>{if(done)return;try{ok(JSON.parse(s||'{}'))}catch{no(Error('JSON inválido'))}});req.on('error',no)})}
function validDate(d,t){return /^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00'))&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t)&&new Date(d+'T'+t+':00')>new Date()}
const root=path.join(__dirname,'public');
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),p=url.pathname,m=req.method;
 if(!p.startsWith('/api/')){if(m!=='GET'){res.writeHead(405);return res.end()}const name=p==='/'?'index.html':p.slice(1);if(name.includes('..')||name.includes('/')||!['index.html','app.js','style.css'].includes(name)){res.writeHead(404);return res.end('Não encontrado')}const ext=path.extname(name);res.writeHead(200,{'Content-Type':ext==='.js'?'text/javascript; charset=utf-8':ext==='.css'?'text/css; charset=utf-8':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; base-uri 'none'; object-src 'none'"});return fs.createReadStream(path.join(root,name)).pipe(res)}
 if(p==='/api/health'&&m==='GET')return send(res,200,{ok:true,storage:'demo-json'});
 if(p==='/api/services'&&m==='GET')return send(res,200,db.services);
 if((p==='/api/register'||p==='/api/login')&&m==='POST'){
  const ip=req.socket.remoteAddress||'local',now=Date.now(),recent=(rate.get(ip)||[]).filter(x=>now-x<60000);if(recent.length>=20)return send(res,429,{error:'Muitas tentativas. Aguarde um minuto.'});recent.push(now);rate.set(ip,recent);
  const b=await input(req),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');if(!/^\S+@\S+\.\S+$/.test(email)||password.length<8||password.length>128)return send(res,400,{error:'Informe e-mail válido e senha de 8 a 128 caracteres.'});
  if(p==='/api/register'){const name=String(b.name||'').trim();if(name.length<2||name.length>80)return send(res,400,{error:'Nome inválido'});if(db.users.some(x=>x.email===email))return send(res,409,{error:'E-mail já cadastrado'});const salt=crypto.randomBytes(16).toString('hex'),row={id:nextId('users'),name,email,salt,password_hash:hash(password,salt),role:'cliente'};db.users.push(row);persist();const u=publicUser(row);return send(res,201,{token:token(u),user:u})}
  const row=db.users.find(x=>x.email===email),actual=hash(password,row?row.salt:'0'.repeat(32));if(!row||!crypto.timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(row.password_hash,'hex')))return send(res,401,{error:'Credenciais inválidas'});const u=publicUser(row);return send(res,200,{token:token(u),user:u});
 }
 const u=auth(req);if(!u)return send(res,401,{error:'Faça login novamente.'});
 if(p==='/api/me'&&m==='GET')return send(res,200,u);
 if(p==='/api/pets'&&m==='GET')return send(res,200,db.pets.filter(x=>x.user_id===u.id).map(({id,name,species,breed,age})=>({id,name,species,breed,age})).sort((a,b)=>b.id-a.id));
 if(p==='/api/pets'&&m==='POST'){
  const b=await input(req),name=String(b.name||'').trim(),species=String(b.species||'').trim(),breed=String(b.breed||'').trim(),age=Number(b.age||0);
  if(!name||name.length>80||!['Cachorro','Gato','Outro'].includes(species)||breed.length>80||!Number.isInteger(age)||age<0||age>40)return send(res,400,{error:'Dados do pet inválidos'});
  const row={id:nextId('pets'),user_id:u.id,name,species,breed,age};db.pets.push(row);persist();return send(res,201,{id:row.id});
 }
 const pet=p.match(/^\/api\/pets\/(\d+)$/);
 if(pet){const id=Number(pet[1]),row=db.pets.find(x=>x.id===id&&x.user_id===u.id);if(!row)return send(res,404,{error:'Pet não encontrado'});
  if(m==='PUT'){const b=await input(req),name=String(b.name||'').trim(),species=String(b.species||''),breed=String(b.breed||''),age=Number(b.age||0);if(!name||name.length>80||!['Cachorro','Gato','Outro'].includes(species)||breed.length>80||!Number.isInteger(age)||age<0||age>40)return send(res,400,{error:'Dados inválidos'});Object.assign(row,{name,species,breed,age});persist();return send(res,200,{ok:true})}
  if(m==='DELETE'){if(db.appointments.some(a=>a.pet_id===id&&a.status==='agendado'))return send(res,409,{error:'Cancele os agendamentos ativos antes de excluir o pet.'});db.appointments=db.appointments.filter(x=>x.pet_id!==id);db.pets=db.pets.filter(x=>x.id!==id);persist();return send(res,200,{ok:true})}
 }
 if(p==='/api/appointments'&&m==='GET'){const rows=db.appointments.filter(x=>x.user_id===u.id).map(x=>({...x,pet_name:db.pets.find(p=>p.id===x.pet_id)?.name||'',service_name:db.services.find(s=>s.id===x.service_id)?.name||''})).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));return send(res,200,rows)}
 if(p==='/api/appointments'&&m==='POST'){
  const b=await input(req),pet=Number(b.pet_id),service=Number(b.service_id),date=String(b.date||''),time=String(b.time||''),note=String(b.note||'').trim();
  if(!validDate(date,time)||note.length>300||!db.pets.some(x=>x.id===pet&&x.user_id===u.id)||!db.services.some(x=>x.id===service))return send(res,400,{error:'Confira pet, serviço, data e horário futuro.'});
  // Trecho síncrono entre checagem e gravação: impede duplicação na mesma instância.
  if(db.appointments.some(x=>x.date===date&&x.time===time&&x.status==='agendado'))return send(res,409,{error:'Este horário já foi reservado. Escolha outro.'});
  const row={id:nextId('appointments'),user_id:u.id,pet_id:pet,service_id:service,date,time,status:'agendado',note};db.appointments.push(row);persist();return send(res,201,{id:row.id});
 }
 const ag=p.match(/^\/api\/appointments\/(\d+)$/);
 if(ag&&m==='PATCH'){const id=Number(ag[1]),b=await input(req);if(!['cancelado','concluido'].includes(b.status))return send(res,400,{error:'Status inválido'});const a=db.appointments.find(x=>x.id===id&&x.user_id===u.id&&x.status==='agendado');if(!a)return send(res,404,{error:'Agendamento não encontrado ou já encerrado'});a.status=b.status;persist();return send(res,200,{ok:true})}
 return send(res,404,{error:'Rota não encontrada'});
}catch(e){console.error(e);if(!res.headersSent)send(res,500,{error:'Erro interno no servidor'})}});
if(require.main===module){const port=Number(process.env.PORT||3000);server.listen(port,'127.0.0.1',()=>console.log('PetCare Escola (Node 20): http://localhost:'+port))}
module.exports={server};
