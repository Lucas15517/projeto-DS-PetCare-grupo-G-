# PetCare — Projeto de Desenvolvimento de Sistemas | Grupo G

**Equipe:** Lucas, Gabriel Luan e Leonardo — **Turma:** 3A.

O PetCare é um sistema web educacional para pet shops de bairro. Permite criar uma conta, cadastrar animais, consultar serviços e reservar horários. A ideia principal é simplificar o acompanhamento dos cuidados dos pets e evitar reservas duplicadas.

## O que foi melhorado após a devolutiva

- Limite de 20 tentativas de cadastro/login por minuto e por IP.
- O cabeçalho X-Forwarded-For só é confiável quando TRUST_PROXY=1 e a aplicação está atrás do proxy confiável da hospedagem.
- Datas e horários de agendamento interpretados no fuso de Brasília (UTC-03:00).
- Logout com invalidação dos tokens anteriores por token_version.
- Código separado em auth.js, db.js, routes/ e storage/.
- Migração SQLite com created_at, ON DELETE RESTRICT, deleted_at para arquivar pets e preços em centavos (INTEGER).
- Um horário ativo por vez para o pet shop inteiro, representando a capacidade de uma única equipe de atendimento.
- Testes de autenticação, autorização, datas, concorrência, histórico e limite por IP.
- Assistente educativo baseado em regras por espécie e idade; não usa modelo generativo e não substitui um veterinário.
- PWA instalável em HTTPS e consulta offline somente leitura dos últimos dados salvos no mesmo dispositivo.
- GitHub Actions para validar Node 20/JSON e Node 24/SQLite; Dependabot configurado para atualizações semanais.

## Uma base de código, dois modos de armazenamento

A interface, as rotas, a autenticação e as regras de negócio são compartilhadas. O adaptador de persistência muda conforme o ambiente.

| Modo | Armazenamento | Node.js | Uso |
|---|---|---|---|
| escola-node20/ | JSON local | 20 ou superior | Demonstração escolar em computador com Node 20 |
| online-sqlite/ | SQLite relacional | 22.5 ou superior; Node 24 recomendado | Demonstração do banco relacional e hospedagem |

**Importante para a apresentação:** se o grupo iniciar pela pasta escola-node20, a demonstração usa armazenamento JSON local. O banco relacional SQLite existe no modo online-sqlite e foi validado na automação com Node 24. Não afirmem que a demonstração Node 20 está conectada ao SQLite.

## Como executar na escola (Node.js 20)

1. Baixe a versão atual da branch petcare/correcoes-devolutiva e extraia o ZIP.
2. Abra petcare/escola-node20/.
3. Dê dois cliques em INICIAR_ESCOLA_WINDOWS.bat.
4. Mantenha a janela preta aberta durante a demonstração.
5. No computador, acesse http://localhost:3000.

O arquivo .bat define HOST=0.0.0.0 antes de iniciar o servidor, permitindo conexões de outros dispositivos na rede local, desde que o firewall e a rede permitam.

### Acesso pelo celular na mesma rede Wi-Fi

1. Conecte o celular e o computador à mesma rede Wi-Fi.
2. No computador, abra o CMD e execute ipconfig.
3. Localize o Endereço IPv4 da placa Wi-Fi.
4. No celular, abra o navegador e acesse http://IP-DO-COMPUTADOR:3000, substituindo pelo IPv4 real. Não use localhost no celular.
5. Se o Windows perguntar, permita Node.js em redes privadas. Não marque redes públicas sem necessidade.

O computador deve permanecer ligado e o servidor deve continuar aberto. O endereço local não é um site publicado na internet; ele funciona apenas enquanto o servidor está ativo e a rede permite a comunicação entre os dispositivos.

Se a rede Wi-Fi da escola isolar os dispositivos, use a demonstração local no computador como plano B.

O armazenamento escolar é um arquivo JSON local. Ele é útil para a demonstração em Node 20, mas não substitui o banco relacional SQLite nem deve ser publicado como serviço multiusuário.

## Como executar a versão SQLite

Na pasta petcare/online-sqlite/, execute node server.js com Node 22.5 ou superior (Node 24 recomendado). O SQLite usa petcare/data/petcare.sqlite localmente. Em produção, configure volume persistente e PETCARE_SECRET.

Para testar, na pasta petcare execute:

```bash
npm test
```

Para verificar a formatação:

```bash
npm run format:check
```

## Banco de dados

A versão SQLite utiliza quatro tabelas:

- USERS: id, name, email, salt, password_hash, token_version, created_at.
- PETS: id, user_id, name, species, breed, age, created_at, deleted_at.
- SERVICES: id, name, price_cents, created_at.
- APPOINTMENTS: id, user_id, pet_id, service_id, date, time, status, note, created_at.

Relações:
- USERS 1:N PETS — uma conta pode cadastrar vários animais.
- USERS 1:N APPOINTMENTS — cada agendamento pertence à conta que o criou.
- PETS 1:N APPOINTMENTS — um pet pode ter vários atendimentos.
- SERVICES 1:N APPOINTMENTS — um serviço pode aparecer em vários agendamentos.

Pets são arquivados por deleted_at e os atendimentos anteriores são preservados. Preços são armazenados em centavos inteiros. Um índice único parcial em (date, time) impede duas reservas ativas no mesmo horário.

## API e regras de negócio

Rotas de referência:
- GET /api/health — verificação básica do serviço.
- GET /api/services — consulta dos serviços.
- POST /api/register e POST /api/login — cadastro e autenticação.
- POST /api/logout e GET /api/me — sessão.
- GET/POST /api/pets e PUT/DELETE /api/pets/:id — operações de pets.
- GET/POST /api/appointments e PATCH /api/appointments/:id — agendamentos.
- GET /api/care-advice?pet_id=... — orientações educativas.

Respostas demonstradas/testadas incluem 201 (criado), 400 (dados inválidos), 401 (não autenticado/credenciais inválidas), 404 (recurso não encontrado ou sem autorização) e 409 (conflito de horário).

## Segurança

- Senhas armazenadas com scrypt e salt individual.
- Tokens HMAC com validade de 8 horas.
- Logout invalida tokens anteriores.
- Rotas privadas filtram os dados pelo usuário autenticado.
- Entradas são validadas no servidor e consultas SQLite são parametrizadas.
- Limite de 20 tentativas de login/cadastro por minuto por IP.
- A versão online exige PETCARE_SECRET com pelo menos 32 caracteres e volume persistente.
- Use apenas contas e dados fictícios na apresentação. Não inclua senhas, tokens, arquivos .env ou dados reais no GitHub ou nos slides.

## Assistente educativo e Biologia

O assistente usa regras explícitas que consideram espécie e idade cadastradas. Ele apresenta lembretes gerais para cães, gatos e outros animais. Não é diagnóstico nem recomendação veterinária individual.

## PWA e uso offline

Em endereço HTTPS e navegador compatível, o PetCare pode oferecer instalação como aplicativo. O service worker guarda arquivos estáticos e o aplicativo mantém uma cópia local dos últimos pets, serviços e agendamentos para consulta sem conexão. Cadastro e atualização exigem conexão com o servidor. Não apresentem a consulta offline como sincronização completa.

## Testes e status do GitHub

Em 24/11/2026, o GitHub Actions concluiu com sucesso os testes e a verificação de formatação em:
- Node 20 com armazenamento JSON.
- Node 24 com armazenamento SQLite.

Isso comprova os testes automatizados desses ambientes, mas não significa que o site esteja publicado na internet nem substitui o teste presencial da escola.

O Pull Request #3 permanece aberto para revisão do grupo. Pelo menos um integrante diferente do autor deve fazer a revisão/aprovação pela própria conta. O merge deve ocorrer depois da validação do grupo.

## Roteiro de demonstração

1. Abrir “Conhecer os 10 fundamentos”.
2. Demonstrar A+, alto contraste e navegação com Tab.
3. Criar uma conta fictícia e cadastrar um pet.
4. Consultar serviços e preços.
5. Cadastrar um agendamento futuro.
6. Tentar reservar novamente o mesmo horário e mostrar o conflito HTTP 409.
7. Cancelar/concluir o agendamento antes de arquivar o pet e mostrar que o histórico é preservado.
8. Explicar a API, os adaptadores de armazenamento, SQLite e segurança.
9. Apresentar a execução verde do GitHub Actions.
10. Demonstrar o acesso pelo celular, se a rede local estiver funcionando.

## Divisão dos 10 fundamentos

| Nº | Fundamento | Responsável | Evidência |
|---:|---|---|---|
| 1 | HTML semântico | Lucas | public/index.html, landmarks e formulários |
| 2 | CSS e responsividade | Lucas | public/style.css e visualização em celular |
| 3 | JavaScript/DOM | Lucas | public/app.js, eventos e atualização das telas |
| 4 | Acessibilidade | Gabriel Luan | foco, contraste, texto ampliado e navegação por teclado |
| 5 | UX/UI | Gabriel Luan | fluxo de cadastro, consulta e agendamento |
| 6 | Validação e feedback | Gabriel Luan | validação no navegador/servidor e mensagens |
| 7 | APIs REST/HTTP | Leonardo | routes/, métodos HTTP e respostas |
| 8 | Banco de dados e CRUD | Leonardo | db.js, storage/, tabelas, migração e histórico |
| 9 | Login e segurança | Leonardo | auth.js, scrypt, HMAC e logout |
| 10 | Testes e versionamento | Lucas | test.js, Actions, branches e Pull Requests |

A divisão é uma proposta para a apresentação. Cada integrante deve praticar a explicação da própria parte e participar dos commits e Pull Requests com sua própria conta.

## Materiais de apresentação

- FUNDAMENTOS_DO_CURSO.md — relação dos 10 fundamentos.
- ROTEIRO_FALA_BANCA.md — fala sugerida e divisão da equipe.
- CHECKLIST_BANCA.md — preparação, demonstração e plano B.
- GUIA_HOSPEDAGEM_RAILWAY.md — publicação opcional; revisar custos antes de ativar qualquer serviço.
