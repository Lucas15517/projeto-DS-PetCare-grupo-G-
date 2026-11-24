# PetCare — Roteiro de fala para a banca

**Grupo:** Lucas, Gabriel Luan e Leonardo · **Turma:** 3A  
**Duração sugerida:** 10 a 12 minutos, ajustável ao tempo dado pelo professor.

Este roteiro é uma base de ensaio. Cada integrante deve compreender e explicar a própria parte, em vez de apenas ler o texto.

## 1. Abertura — Lucas

“Boa tarde. Nosso projeto é o PetCare, um sistema web educacional pensado para pet shops de bairro. Ele permite que o usuário crie uma conta, cadastre seus animais, consulte os serviços e faça agendamentos. A ideia central é organizar os cuidados dos pets e evitar que dois atendimentos ocupem o mesmo horário.”

“Também organizamos o projeto para demonstrar dez fundamentos de Desenvolvimento de Sistemas, desde HTML, CSS e JavaScript até API, persistência de dados, segurança, testes e versionamento.”

## 2. Problema, proposta e fluxo — Lucas

“O problema que escolhemos foi a organização dos cadastros e horários de um pet shop. Quando as reservas são anotadas sem controle, pode ocorrer conflito de horário ou perda de histórico. O PetCare concentra essas informações em uma interface web.”

“Nosso fluxo é: o usuário cria uma conta ou entra, cadastra um pet, consulta os serviços, escolhe uma data futura e tenta reservar um horário. O sistema verifica os dados e bloqueia um horário que já esteja reservado.”

Demonstração sugerida:
- Abrir a tela inicial e mostrar “Conhecer os 10 fundamentos”.
- Criar ou usar uma conta fictícia.
- Cadastrar um pet fictício.
- Abrir Serviços e mostrar os valores cadastrados.

## 3. Acessibilidade, UX/UI e validação — Gabriel Luan

“Na parte de acessibilidade, trabalhamos com estrutura de página identificável, rótulos nos campos, foco visível, link para pular ao conteúdo principal, aumento do tamanho do texto e opção de alto contraste. Isso ajuda diferentes pessoas a navegar pelo sistema, inclusive usando o teclado.”

“Na experiência do usuário, organizamos as ações em etapas: entrar, visualizar os pets, consultar serviços e agendar. A interface se adapta a telas menores.”

“Também validamos os dados no navegador e novamente no servidor. A validação do servidor é importante porque os dados enviados pelo navegador não devem ser considerados confiáveis.”

Demonstração sugerida:
- Pressionar Tab para mostrar o foco.
- Ativar A+ e alto contraste.
- Tentar enviar um campo obrigatório vazio ou dados fora dos limites e mostrar o feedback.
- Mostrar a interface em uma tela estreita ou celular.

## 4. API, banco de dados e segurança — Leonardo

“A comunicação entre a interface e o servidor acontece por uma API HTTP organizada em rotas. Por exemplo, usamos POST para criar uma reserva, GET para consultar, PUT para atualizar um pet e PATCH para alterar o status de um agendamento.”

“Na versão SQLite, o modelo relacional tem quatro tabelas: USERS, PETS, SERVICES e APPOINTMENTS. Uma conta pode ter vários pets e agendamentos; um pet pode ter vários atendimentos. O histórico é preservado quando um pet é arquivado.”

“Há dois modos de armazenamento para compatibilidade. A pasta escola-node20 usa JSON local para funcionar em computadores com Node 20. A pasta online-sqlite usa o banco relacional SQLite com Node 22.5 ou superior, com Node 24 recomendado. As duas usam a mesma interface, as mesmas rotas e as mesmas regras. Por isso, na demonstração pela pasta escola-node20, não devemos dizer que estamos usando SQLite.”

“Na segurança, as senhas são protegidas com scrypt e salt individual; os tokens são assinados com HMAC e expiram em oito horas. As rotas privadas verificam a conta autenticada e o logout invalida tokens anteriores.”

Demonstração sugerida:
- Mostrar uma reserva e repetir o mesmo dia/horário para observar o conflito HTTP 409.
- Mostrar a organização das pastas routes/ e storage/.
- Explicar as tabelas da versão SQLite.
- Mostrar a validação dos testes no GitHub Actions.

## 5. Testes e versionamento — Lucas

“Além de testar as funções no navegador, criamos testes automatizados para cadastro, autenticação, separação dos dados entre usuários, datas inválidas, agendamentos concorrentes, histórico, logout e limite de tentativas.”

“Na automação do GitHub, validamos dois ambientes: Node 20 com armazenamento JSON e Node 24 com SQLite. As execuções verificadas em 24 de novembro de 2026 passaram nos dois ambientes, incluindo formatação e testes automatizados.”

“O GitHub também registra o trabalho em branches e Pull Requests, permitindo revisar alterações antes de incorporá-las à branch principal de desenvolvimento.”

## 6. Assistente e uso no celular — Gabriel Luan / Lucas

“O assistente de cuidados é baseado em regras explícitas que consideram a espécie e a idade cadastradas. Ele oferece lembretes educativos gerais, não faz diagnóstico e não substitui um médico-veterinário.”

“Também ajustamos o iniciador escolar para permitir acesso de outro dispositivo na mesma rede local. Para acessar pelo celular, o computador precisa continuar ligado, o servidor aberto e os dois dispositivos conectados à mesma rede. O endereço é o IPv4 do computador com a porta 3000.”

“Existe ainda suporte a PWA: em um endereço HTTPS e navegador compatível, o aplicativo pode ser instalado. A consulta offline usa os últimos dados salvos no mesmo dispositivo, mas alterações exigem conexão.”

## 7. Encerramento — Lucas

“Concluindo, o PetCare reúne interface, acessibilidade, API, regras de negócio, persistência de dados, segurança e testes em um único projeto. O principal aprendizado foi integrar esses fundamentos e entender que um sistema precisa ser validado em diferentes cenários, não apenas parecer funcionar na tela. Obrigado.”

## Transições entre integrantes

- Lucas → Gabriel: “Agora o Gabriel vai mostrar como pensamos na acessibilidade, na experiência e na validação.”
- Gabriel → Leonardo: “Com a interface e as validações apresentadas, o Leonardo vai explicar como os dados e as rotas funcionam.”
- Leonardo → Lucas: “Depois da parte técnica, vou mostrar como verificamos o projeto com testes e versionamento.”

## Observações para não dar informação incorreta

- Na demonstração Node 20 da escola, o armazenamento é JSON local; não chamar isso de SQLite.
- SQLite é o modo online-sqlite, Node 22.5+ (recomendado Node 24), e foi coberto pelo CI.
- O site não está publicado automaticamente por estar no GitHub.
- O PWA instalável exige HTTPS e navegador compatível; a consulta offline é somente leitura.
- O assistente usa regras; não é IA generativa, diagnóstico ou aconselhamento veterinário.
- Não dizer que o projeto está “100% livre de erros” nem que a acessibilidade foi certificada.
