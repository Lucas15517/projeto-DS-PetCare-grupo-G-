# PetCare — modo SQLite

Esta pasta é um atalho compatível com a organização anterior do projeto.

- Iniciar: node server.js (Node 22.5+, Node 24 recomendado).
- Testes: node --test test.js.
- A aplicação compartilhada está em ../server.js, ../auth.js, ../routes/, ../storage/ e ../public/.
- Para hospedagem, use o Dockerfile em ../Dockerfile e siga ../GUIA_HOSPEDAGEM_RAILWAY.md.

O banco SQLite é criado em petcare/data/petcare.sqlite localmente. Em produção, monte volume persistente e configure PETCARE_SECRET.
