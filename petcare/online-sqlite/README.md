# PetCare — modo SQLite

Esta pasta é um atalho compatível com a organização anterior do projeto.

- Iniciar: node server.js (Node 22.13+, Node 24 recomendado).
- Iniciador Windows: INICIAR_WINDOWS.bat verifica a versão mínima do Node e preserva o banco antigo se encontrar petcare/online-sqlite/data/petcare.sqlite.
- Testes: node --test test.js.
- A aplicação compartilhada está em ../server.js, ../auth.js, ../routes/, ../storage/ e ../public/.
- Para hospedagem, use o Dockerfile em ../Dockerfile e siga ../GUIA_HOSPEDAGEM_RAILWAY.md.

Por padrão, o banco local fica em petcare/data/petcare.sqlite. Se existir um banco legado em petcare/online-sqlite/data/petcare.sqlite, o iniciador e o adaptador preservam esse arquivo para a migração. Em produção, monte volume persistente e configure PETCARE_SECRET.
