# PetCare — 10 fundamentos de Desenvolvimento de Sistemas

**Grupo:** Lucas, Gabriel Luan e Leonardo · **Turma:** 3A.

Este documento mostra dez conhecimentos trabalhados no curso técnico e onde a banca pode observá-los no PetCare. As funcionalidades listadas abaixo são concretas; não são apenas conceitos mencionados em slides.

| Nº | Fundamento | Onde está no projeto | Demonstração prática |
|---:|---|---|---|
| 1 | HTML semântico | `public/index.html`: `<main>`, `<nav>`, `<section>`, formulários e rótulos | Abrir a estrutura HTML no editor |
| 2 | CSS e responsividade | `public/style.css`: grades, layouts, `@media` | Reduzir a janela do navegador |
| 3 | JavaScript/DOM | `public/app.js`: eventos, atualização de listas, abertura de diálogos | Cadastrar e editar um pet sem recarregar a página |
| 4 | Acessibilidade | Link “Pular para o conteúdo”, foco visível, labels, alto contraste, fonte ampliada, mensagens acessíveis | Navegar com Tab, ativar ◐ e A+ |
| 5 | UX/UI e prototipagem | Telas com menu consistente e fluxo Pets → Serviços → Agendamento | Mostrar o fluxo de uma reserva |
| 6 | Validação e feedback | `required`, tamanhos de campo, validações JS e de servidor, avisos de sucesso/erro | Tentar cadastrar dados inválidos e reservar horário ocupado |
| 7 | APIs REST/HTTP | `server.js` e `public/app.js`: GET, POST, PUT, PATCH e DELETE | DevTools → Rede/Network durante uma ação |
| 8 | Persistência e CRUD | Endpoints de pets e agendamentos + arquivo de armazenamento | Criar, consultar, editar e excluir pet; reiniciar servidor |
| 9 | Login e segurança | Hash de senha com `scrypt`, token assinado, checagem de permissão por dono | Entrar e sair de contas diferentes |
| 10 | Testes e versionamento | `test.js`, comando `npm test` e Git/GitHub após envio ao repositório | Executar testes; mostrar commits quando publicados |

## Recurso extra: integridade de agendamento

Dois usuários tentam reservar **a mesma data e hora**. A primeira requisição é confirmada (HTTP 201); a segunda recebe conflito (HTTP 409). O teste automatizado também verifica esse cenário.

## Diferença entre as versões

- **Escola / Node.js 20:** dados em `data/petcare-escola.json`, apropriado para uma demonstração local em um único processo; não é banco de dados SQL e não deve ser publicado na internet.
- **Principal / Node.js 22+:** SQLite (`data/petcare.sqlite`) e APIs Node.js; versão indicada para explicar o banco de dados relacional e preparar a hospedagem.

## Como apresentar para o professor

1. Abra o PetCare e mostre **“10 fundamentos”** mesmo sem login pelo botão na página inicial.
2. Aumente a fonte (A+) e ative alto contraste (◐).
3. Pressione **Tab** várias vezes para demonstrar o foco visível e o link “Pular para o conteúdo”.
4. Cadastre um usuário fictício, entre, cadastre e edite um pet.
5. Faça um agendamento e tente repetir a mesma data e hora em uma segunda conta.
6. Mostre `public/index.html`, `public/style.css`, `public/app.js`, `server.js` e `test.js` no editor.
7. Execute `npm test` (ou `node test.js`) para mostrar os testes automatizados.
8. Mostre no GitHub os arquivos e o histórico de versões **somente depois que o grupo realmente fizer o upload e os commits**.

**Nota:** alguns fundamentos combinam áreas distintas do currículo para formar exatamente dez itens. Isso é uma seleção demonstrativa; o professor pode ter uma lista oficial diferente.
