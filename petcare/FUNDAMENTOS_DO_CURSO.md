# PetCare — 10 fundamentos de Desenvolvimento de Sistemas

**Grupo:** Lucas, Gabriel Luan e Leonardo · **Turma:** 3A.

| Nº | Fundamento | Onde aparece no projeto | Demonstração |
|---:|---|---|---|
| 1 | HTML semântico | public/index.html: header, nav, main, section, formulários e rótulos | Inspecionar a estrutura HTML |
| 2 | CSS e responsividade | public/style.css: grades, layout flexível e media queries | Reduzir a largura da janela |
| 3 | JavaScript/DOM | public/app.js: eventos, renderização e chamadas fetch | Cadastrar e editar um pet |
| 4 | Acessibilidade | Link para pular conteúdo, foco visível, labels, alto contraste e fonte ampliável | Navegar com Tab e ativar A+/◐ |
| 5 | UX/UI | Fluxo de login, pets, serviços e agendamento | Realizar uma reserva |
| 6 | Validação e feedback | Validação no cliente e no servidor, mensagens e limites de campos | Tentar dados inválidos |
| 7 | APIs REST/HTTP | routes/auth.js, routes/pets.js, routes/appointments.js e routes/care.js | Mostrar requisições no DevTools |
| 8 | Banco de dados e CRUD | db.js, storage/sqlite-store.js e storage/json-store.js | Criar, consultar, editar e arquivar pet |
| 9 | Login e segurança | auth.js, scrypt, HMAC, token_version, rate limit e autorização por usuário | Login, logout e tentativa de acesso cruzado |
| 10 | Testes e versionamento | test.js, GitHub Actions, branches e Pull Requests | Executar testes e abrir histórico real |

## Recurso de regras para cuidados

O assistente educativo analisa espécie e idade cadastradas e apresenta orientações gerais. É um sistema de regras transparente, não um modelo generativo ou diagnóstico veterinário. A ligação com Biologia está na consideração das características gerais de cães, gatos e outros animais.

## Banco e integridade

- SQLite é o banco relacional da versão online.
- price_cents é INTEGER, evitando valores monetários em ponto flutuante.
- created_at registra a criação de usuários, pets, serviços e agendamentos.
- Chaves estrangeiras usam ON DELETE RESTRICT.
- deleted_at arquiva pets e mantém o histórico.
- O índice parcial em (date, time) bloqueia duas reservas ativas no mesmo horário para a equipe do pet shop.

## Duas formas de executar

- escola-node20: usa JSON local para compatibilidade com Node 20 e apresentação sem instalar dependências.
- online-sqlite: usa SQLite com Node 22.5+ (Node 24 recomendado).
- As duas usam a mesma interface, rotas, autenticação e regras de negócio.

## Testes automatizados

npm test verifica cadastro, login com senha errada (401), isolamento de dados entre usuários (404), agendamento no passado (400), concorrência (201/409), preservação do histórico, orientações por regras, logout e limite por IP.

## Demonstração

1. Mostrar os 10 fundamentos antes de entrar.
2. Aumentar o texto, ativar alto contraste e navegar com Tab.
3. Criar uma conta fictícia e cadastrar um pet.
4. Gerar orientações e explicar as regras.
5. Fazer uma reserva e tentar repetir o horário em outra conta.
6. Arquivar um pet e mostrar que os atendimentos antigos continuam no histórico.
7. Executar os testes e mostrar a execução real do Actions.
