# PetCare | Versão online com banco SQLite

**Projeto do Grupo G:** Lucas, Gabriel Luan e Leonardo — Turma 3A.

> **Situação:** código preparado para hospedagem. **Ainda não existe link público** até configurar a plataforma de hospedagem.

## O que esse site faz?

É um site de pet shop para cadastrar conta, entrar com login, registrar pets e agendar serviços. Se duas pessoas tentarem reservar o mesmo horário, apenas uma reserva é aceita.

## O que cada arquivo faz?

| Arquivo ou pasta | Explicação simples |
|---|---|
| `public/index.html` | Estrutura visível do site, formulários e botões (HTML). |
| `public/style.css` | Cores, tamanhos, layout responsivo e acessibilidade (CSS). |
| `public/app.js` | Reação aos cliques e comunicação com a API (JavaScript do navegador). |
| `server.js` | API, login, segurança, regras do agendamento e banco de dados (Node.js). |
| `test.js` | Testes automáticos para verificar os recursos principais. |
| `package.json` | Comandos para iniciar e testar o projeto. |
| `Dockerfile` | Instruções para executar o site no servidor de hospedagem. |
| `GUIA_HOSPEDAGEM_RAILWAY.md` | Passo a passo para publicar no endereço HTTPS. |
| `FUNDAMENTOS_DO_CURSO.md` | Relação dos 10 fundamentos de DS presentes no projeto. |

## Como iniciar no seu computador

**Requer Node.js 22 ou superior** (recomendado Node.js 24 LTS). Na escola, onde há Node 20, use a pasta `../escola-node20/`, não esta versão.

1. Abra um terminal nesta pasta `online-sqlite`.
2. Execute `node server.js` ou clique em `INICIAR_WINDOWS.bat` no Windows.
3. Acesse `http://localhost:3000` no navegador.
4. Crie uma **conta fictícia**, cadastre um pet fictício e agende um serviço.

O banco de dados SQLite é criado automaticamente em `data/petcare.sqlite`. **Não é necessário MySQL, npm install ou bibliotecas externas.**

## Como demonstrar para o professor

1. Cadastre um usuário, entre e crie um pet.
2. Agende banho em um dia e horário futuro.
3. Abra uma janela anônima, crie outra conta e tente reservar exatamente o mesmo dia e horário.
4. A segunda tentativa recebe **409 — horário já reservado**. Isso acontece porque o banco SQLite tem uma regra de unicidade para horários ativos.
5. Mostre no GitHub os arquivos `public/index.html`, `public/style.css`, `public/app.js` e `server.js`.

## Banco de dados e APIs

O `server.js` cria quatro tabelas: `users`, `pets`, `services` e `appointments`.

| Método | Rota | Finalidade |
|---|---|---|
| `POST` | `/api/register` | Criar conta |
| `POST` | `/api/login` | Entrar |
| `GET` | `/api/me` | Obter dados da conta |
| `GET/POST` | `/api/pets` | Listar/cadastrar pets |
| `PUT/DELETE` | `/api/pets/:id` | Editar/excluir pet |
| `GET` | `/api/services` | Listar serviços |
| `GET/POST` | `/api/appointments` | Listar/criar agendamentos |
| `PATCH` | `/api/appointments/:id` | Cancelar/concluir agendamento |
| `GET` | `/api/health` | Verificar se o servidor está ativo |

## Segurança básica

O projeto usa hash de senha com **scrypt**, autenticação por token assinado, autorização para acessar apenas os próprios pets e agendamentos, validação de dados e comandos SQL parametrizados. **Não é um sistema comercial auditado.** Faça testes apenas com dados inventados.

## Como testar

Com Node.js 22+ nesta pasta, execute:

```bash
node test.js
```

## Publicação na internet

Leia **[GUIA_HOSPEDAGEM_RAILWAY.md](GUIA_HOSPEDAGEM_RAILWAY.md)**. Na Railway, o projeto é publicado a partir do repositório GitHub e esta pasta precisa ser definida como a raiz do serviço: `/petcare/online-sqlite`.

Para o banco não perder os dados, anexe um volume persistente em `/data` e configure o segredo `PETCARE_SECRET` na hospedagem (nunca coloque o segredo no GitHub). Confirme as condições de cobrança antes de ativar qualquer serviço.

**Nota:** esta versão usa SQLite e Node.js 22+; a versão `escola-node20` usa JSON local e Node.js 20. São **duas alternativas diferentes**, não execute as duas ao mesmo tempo na porta 3000.
