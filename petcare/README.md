# PetCare — Projeto de Desenvolvimento de Sistemas | Grupo G

**Equipe:** Lucas, Gabriel Luan e Leonardo — **Turma 3A**.

O PetCare é um sistema web educacional para pet shops de bairro. Permite criar uma conta, cadastrar animais, consultar serviços e reservar horários. A ideia principal continua sendo simplificar o acompanhamento dos cuidados dos pets e evitar reservas duplicadas.

## O que foi melhorado após a devolutiva

- Limite de 20 tentativas por minuto por IP; o primeiro IP de X-Forwarded-For só é aceito quando TRUST_PROXY=1, e entradas antigas são limpas a cada minuto.
- Fuso horário de Brasília interpretado explicitamente como UTC-03:00 e TZ=America/Sao_Paulo no contêiner.
- POST /api/logout incrementa token_version no banco, invalidando tokens emitidos anteriormente.
- Código separado em auth.js, db.js, routes/ e storage/; o server.js fica responsável por iniciar o servidor e encaminhar as rotas.
- Migração SQLite com created_at, ON DELETE RESTRICT, deleted_at para arquivar pets e preços em centavos (INTEGER).
- A coluna role sem uso foi removida do modelo.
- O índice parcial mantém a regra de **um atendimento por horário para o pet shop inteiro**. Isso representa a capacidade de uma única equipe de atendimento; dois serviços diferentes não podem ocupar o mesmo horário.
- Testes adicionais para senha incorreta (401), acesso ao pet de outra conta (404), agendamento no passado (400), logout e preservação do histórico.
- Assistente educativo baseado em regras por espécie e idade; não usa modelo generativo e não substitui um veterinário.
- PWA instalável com manifesto, ícone, service worker e consulta somente leitura dos últimos dados salvos no mesmo dispositivo.
- Workflow do GitHub Actions para testar a versão Node 20/JSON e a versão Node 24/SQLite. Dependabot configurado para atualizações semanais.

## Uma base de código, dois modos de armazenamento

A interface, as rotas, a autenticação e as regras de negócio agora são compartilhadas. Só o adaptador de persistência muda:

| Como executar | Armazenamento | Node.js | Uso |
|---|---|---|---|
| escola-node20/ | JSON local | 20 ou superior | Demonstração no computador da escola |
| online-sqlite/ | SQLite | 22.5 ou superior; recomendado 24 | Demonstração relacional e hospedagem |

As pastas antigas agora têm apenas atalhos para a aplicação compartilhada. A interface única está em public/; a lógica de dados está em storage/.

## Como executar na escola (Node.js 20)

1. Abra petcare/escola-node20/.
2. Clique em INICIAR_ESCOLA_WINDOWS.bat ou execute node server.js.
3. Acesse http://localhost:3000.
4. Crie uma conta e um pet fictícios, consulte os serviços e faça um agendamento.

O armazenamento escolar é um arquivo JSON local. Ele é útil para a demonstração em Node 20, mas não substitui o banco relacional SQLite e não deve ser publicado como serviço multiusuário.

## Como executar a versão SQLite

Na pasta petcare/online-sqlite/, execute node server.js com Node 22.5+ (Node 24 recomendado). O SQLite usa petcare/data/petcare.sqlite localmente.

Para testar, na pasta petcare execute:

    npm test

Para formatar o código:

    npm run format
    npm run format:check

## Banco de dados

O banco SQLite tem quatro tabelas e estas relações:

- USERS 1:N PETS — uma conta pode cadastrar vários animais.
- USERS 1:N APPOINTMENTS — cada agendamento pertence à conta que o criou.
- PETS 1:N APPOINTMENTS — um pet pode ter vários atendimentos ao longo do tempo.
- SERVICES 1:N APPOINTMENTS — um serviço pode aparecer em vários agendamentos.

Tabelas principais:
- USERS: id, name, email, salt, password_hash, token_version, created_at.
- PETS: id, user_id, name, species, breed, age, created_at, deleted_at.
- SERVICES: id, name, price_cents, created_at.
- APPOINTMENTS: id, user_id, pet_id, service_id, date, time, status, note, created_at.

Os pets são arquivados com deleted_at, sem apagar os atendimentos anteriores. Os preços são armazenados como centavos inteiros para evitar erros de arredondamento de ponto flutuante. O índice único parcial em (date, time) vale somente para status='agendado'.

Exemplo de cálculo financeiro para a banca (atendimentos concluídos):

    SELECT s.name,
           COUNT(a.id) AS quantidade,
           SUM(s.price_cents) AS total_centavos
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    WHERE a.status = 'concluido'
    GROUP BY s.id, s.name;

## Assistente de cuidados e relação com Biologia

O assistente usa regras explícitas que consideram espécie e idade cadastradas. Por exemplo, apresenta lembretes gerais diferentes para cães, gatos, animais jovens e animais em faixas etárias mais avançadas. O resultado explica que é um recurso educativo, não um diagnóstico nem uma recomendação veterinária individual.

## PWA e uso no celular

O manifest.webmanifest descreve o aplicativo, o sw.js guarda os arquivos estáticos e o ícone é icon.svg. Em um endereço HTTPS, o navegador compatível oferece a opção de instalar o PetCare. O aplicativo guarda uma cópia local dos últimos pets, serviços e agendamentos para consulta sem conexão; operações de cadastro e atualização continuam exigindo internet. O logout remove a cópia local e solicita a invalidação do token no servidor.

## Segurança e publicação

- Senhas são armazenadas com scrypt e salt individual.
- Tokens são assinados com HMAC e têm validade de 8 horas; o logout incrementa a versão do token.
- As consultas de pets e agendamentos são filtradas pelo usuário autenticado.
- As entradas são validadas no servidor e as consultas SQLite são parametrizadas.
- A aplicação online exige PETCARE_SECRET com pelo menos 32 caracteres e volume persistente.
- TRUST_PROXY=1 deve ser usado somente quando a aplicação estiver atrás do proxy confiável da hospedagem.
- Não envie .env, senhas, tokens, dados reais ou arquivos SQLite ao GitHub.

O código está preparado para implantação via Docker, mas **o site não fica publicado automaticamente só por estar no GitHub**. A configuração da Railway, o volume persistente, o segredo e o domínio HTTPS precisam ser confirmados na conta do grupo. Consulte GUIA_HOSPEDAGEM_RAILWAY.md antes de ativar qualquer serviço pago.

## Roteiro de demonstração

1. Abrir a tela de login e mostrar “Conhecer os 10 fundamentos”.
2. Demonstrar A+, alto contraste e navegação com Tab.
3. Criar uma conta fictícia e cadastrar um cão ou gato.
4. Gerar orientações do assistente e explicar as regras usadas.
5. Consultar serviços e preços; cadastrar um agendamento futuro.
6. Em outra conta, tentar reservar o mesmo horário e mostrar o conflito HTTP 409.
7. Arquivar um pet sem apagar o histórico de atendimentos.
8. Mostrar os módulos auth.js, routes/, storage/ e o modelo de dados.
9. Executar npm test e apresentar o resultado do GitHub Actions.
10. Instalar o PWA em um celular com HTTPS e demonstrar a consulta offline, se a implantação estiver ativa.

## Divisão dos 10 fundamentos e da explicação técnica

| Nº | Fundamento | Responsável | O que demonstrar |
|---:|---|---|---|
| 1 | HTML semântico | Lucas | public/index.html, landmarks e formulários |
| 2 | CSS e responsividade | Lucas | public/style.css e visualização em celular |
| 3 | JavaScript/DOM | Lucas | public/app.js, eventos e atualização das telas |
| 4 | Acessibilidade | Gabriel Luan | foco, contraste, texto ampliado e leitor de tela |
| 5 | UX/UI | Gabriel Luan | fluxo de cadastro, consulta e agendamento |
| 6 | Validação e feedback | Gabriel Luan | validação no navegador/servidor e mensagens |
| 7 | APIs REST/HTTP | Leonardo | routes/, métodos HTTP e respostas 201/400/401/404/409 |
| 8 | Banco de dados e CRUD | Leonardo | db.js, storage/, tabelas, migração e histórico |
| 9 | Login e segurança | Leonardo | auth.js, routes/auth.js, scrypt, HMAC e logout |
| 10 | Testes e versionamento | Lucas | test.js, Actions, branches e Pull Requests |

A divisão é uma proposta para a apresentação. Cada integrante deve ler e praticar a explicação da sua parte e participar dos próprios commits e Pull Requests. Não criem commits em nome de colegas nem aprovem o próprio PR.

## Histórico e colaboração

A correção será enviada em uma branch de revisão e proposta por Pull Request para RamoDoProf. Depois da revisão do grupo, façam o merge. Cada integrante deve criar pelo menos um PR próprio e receber revisão de outro integrante, usando a própria conta GitHub. Criem as tags v1.0.0 e v2.0.0 após definirem os marcos reais de cada versão.

## Capturas de tela para anexar

Guardem em docs/screenshots/ capturas reais da tela inicial, cadastro de pet, agendamento, conflito de horário, assistente de cuidados e PWA no celular. Não usem imagens simuladas como se fossem telas executadas. O roteiro de captura está em docs/screenshots/README.md.
