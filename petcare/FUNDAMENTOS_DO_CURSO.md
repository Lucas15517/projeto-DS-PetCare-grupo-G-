# PetCare — 10 fundamentos de Desenvolvimento de Sistemas

**Grupo:** Lucas, Gabriel Luan e Leonardo · **Turma:** 3A.

O PetCare é um sistema web educacional para cadastro de animais, consulta de serviços e agendamento de atendimentos em pet shops.

| Nº | Fundamento | Responsável | Onde aparece | O que demonstrar |
|---:|---|---|---|---|
| 1 | HTML semântico | Lucas | public/index.html: header, nav, main, section, formulários e labels | Inspecionar a estrutura HTML |
| 2 | CSS e responsividade | Lucas | public/style.css: grades, layout flexível e media queries | Reduzir a largura da janela e abrir no celular |
| 3 | JavaScript/DOM | Lucas | public/app.js: eventos, renderização e chamadas fetch | Cadastrar/editar um pet e observar a tela |
| 4 | Acessibilidade | Gabriel Luan | Link para pular conteúdo, foco visível, labels, alto contraste e fonte ampliável | Navegar com Tab e ativar A+/alto contraste |
| 5 | UX/UI | Gabriel Luan | Fluxo de login, pets, serviços e agendamento | Realizar uma reserva |
| 6 | Validação e feedback | Gabriel Luan | Validação no cliente e no servidor, mensagens e limites de campos | Tentar dados inválidos e observar a mensagem |
| 7 | APIs REST/HTTP | Leonardo | routes/auth.js, routes/pets.js, routes/appointments.js e routes/care.js | Mostrar requisições e respostas no DevTools |
| 8 | Banco de dados e CRUD | Leonardo | db.js, storage/sqlite-store.js e storage/json-store.js | Explicar criar, consultar, editar e arquivar pet |
| 9 | Login e segurança | Leonardo | auth.js, scrypt, HMAC, token_version, rate limit e autorização por usuário | Login, logout e tentativa de acesso sem autorização |
| 10 | Testes e versionamento | Lucas | test.js, GitHub Actions, branches e Pull Requests | Mostrar testes e histórico real do GitHub |

## Observação sobre os dois modos de armazenamento

- **escola-node20:** usa armazenamento JSON local para funcionar no computador da escola com Node 20.
- **online-sqlite:** usa o banco relacional SQLite com Node 22.5 ou superior (Node 24 recomendado).
- As duas formas usam a mesma interface, rotas, autenticação e regras de negócio.

Não afirmem que a execução em escola-node20 usa SQLite. Na apresentação, expliquem que o modo JSON foi escolhido como alternativa compatível com o computador da escola e que o modo SQLite é separado.

## Banco de dados relacional

A versão SQLite possui quatro tabelas: USERS, PETS, SERVICES e APPOINTMENTS.

- USERS 1:N PETS.
- USERS 1:N APPOINTMENTS.
- PETS 1:N APPOINTMENTS.
- SERVICES 1:N APPOINTMENTS.

Integridade e histórico:
- price_cents é INTEGER, evitando valores monetários em ponto flutuante.
- created_at registra a criação dos registros.
- Chaves estrangeiras usam ON DELETE RESTRICT.
- deleted_at arquiva pets e mantém o histórico.
- O índice parcial em (date, time) bloqueia duas reservas ativas no mesmo horário para o pet shop.

## Assistente educativo

O assistente usa regras explícitas de espécie e idade e apresenta orientações gerais. Não é um modelo generativo, não faz diagnóstico e não substitui avaliação veterinária.

## Testes automatizados

O comando npm test executa verificações de preços, cadastro, login com senha incorreta (401), isolamento de dados entre usuários (404), agendamento no passado (400), concorrência (201/409), preservação do histórico, orientações por regras, logout e limite por IP.

## Roteiro de demonstração dos fundamentos

1. Abrir “Conhecer os 10 fundamentos”.
2. Aumentar texto, ativar alto contraste e navegar com Tab.
3. Criar uma conta fictícia e cadastrar um pet.
4. Consultar serviços e preços.
5. Fazer uma reserva e tentar repetir o mesmo horário.
6. Cancelar/concluir o agendamento antes de arquivar o pet.
7. Mostrar que o histórico continua disponível.
8. Explicar API, persistência e controles de segurança.
9. Apresentar a execução bem-sucedida dos testes Node 20 e Node 24.
