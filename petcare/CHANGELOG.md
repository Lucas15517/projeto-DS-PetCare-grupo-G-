# Changelog

As alterações relevantes do PetCare são registradas aqui.

## 2.1.0 — Revisão da devolutiva

- Compartilhamento do servidor, rotas, autenticação e interface entre os modos JSON e SQLite.
- Rate limit por IP com proxy confiável opcional e limpeza periódica.
- Logout com invalidação por token_version.
- Data/hora de agendamento interpretadas no fuso de Brasília.
- Migração SQLite com created_at, ON DELETE RESTRICT, preços em centavos e arquivamento de pets.
- Testes de autenticação, autorização, datas, concorrência, histórico e rate limit.
- Assistente educativo por regras e PWA instalável com shell offline.
- Workflow CI e Dependabot.

## 2.0.0 — Versão SQLite

- Banco SQLite para a versão online.
- API HTTP e controle de agendamento concorrente.
- Dockerfile e guia inicial de hospedagem.

## 1.0.0 — Protótipo inicial

- Primeira interface de cadastro de pets e agendamento.
- Versão de demonstração local.
