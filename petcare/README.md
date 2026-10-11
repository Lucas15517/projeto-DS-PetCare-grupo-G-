# PetCare — Projeto de Desenvolvimento de Sistemas | Grupo G

**Grupo:** Lucas, Gabriel Luan e Leonardo — Turma 3A.

Este repositório guarda o código do PetCare, um site de pet shop com login, cadastro de pets, serviços e agendamentos. O projeto foi feito para demonstrar os fundamentos do curso técnico de Desenvolvimento de Sistemas.

## Qual pasta devo abrir?

| Pasta | Quando usar | Banco de dados | Node.js |
|---|---|---|---|
| [`escola-node20`](escola-node20/) | **Apresentação no computador da escola**, sem precisar instalar programas. | Arquivo JSON local | Node 20 |
| [`online-sqlite`](online-sqlite/) | **Versão para hospedar na internet**, com banco relacional SQLite. | SQLite | Node 22+ (Docker usa Node 24) |

> **O site ainda não está hospedado na internet.** O código da versão online está pronto, mas falta configurar uma conta de hospedagem e gerar o link HTTPS.

## Onde estão as linhas de código?

Nas duas versões, os arquivos principais são:

- `public/index.html`: HTML — estrutura, campos e botões.
- `public/style.css`: CSS — aparência, responsividade e acessibilidade.
- `public/app.js`: JavaScript — interações e requisições à API.
- `server.js`: Node.js — API, autenticação e armazenamento de dados.
- `test.js`: testes automatizados.

## Como iniciar na escola

Entre em [`escola-node20/`](escola-node20/) e execute `INICIAR_ESCOLA_WINDOWS.bat` (ou `node server.js`). Abra `http://localhost:3000` e use **contas fictícias**.

## Como publicar a versão online

Leia o [guia simplificado de hospedagem](online-sqlite/GUIA_HOSPEDAGEM_RAILWAY.md). Na Railway, a **Root Directory** é `/petcare/online-sqlite`. Para não perder agendamentos ao reiniciar, a versão online precisa de **volume persistente** e da variável secreta `PETCARE_SECRET`.

**Segurança:** não envie senhas, tokens, arquivos `.env` ou bases locais (`data/`, `*.sqlite`) para o GitHub. Os arquivos `.gitignore` foram configurados para ajudar a evitar isso.

O código e os dados de testes são educacionais; não use dados reais de clientes sem uma revisão completa de privacidade e segurança.
