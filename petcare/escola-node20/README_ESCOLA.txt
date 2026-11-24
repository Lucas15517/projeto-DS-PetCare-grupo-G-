PETCARE — DEMONSTRAÇÃO NA ESCOLA
Grupo: Lucas, Gabriel Luan e Leonardo — Turma 3A

COMPATIBILIDADE
Node.js 20 ou superior. Não precisa instalar bibliotecas externas.

INICIAR NO COMPUTADOR
1. Baixe e extraia a versão atual do projeto.
2. Abra a pasta petcare\escola-node20.
3. Dê dois cliques em INICIAR_ESCOLA_WINDOWS.bat.
4. Mantenha a janela preta aberta.
5. No computador, acesse http://localhost:3000.

ACESSO PELO CELULAR
1. Conecte computador e celular à mesma rede Wi-Fi.
2. No computador, abra o CMD e execute: ipconfig
3. Procure o Endereço IPv4 da placa Wi-Fi.
4. No celular, acesse: http://IP-DO-COMPUTADOR:3000
   Substitua pelo IPv4 real. Não use localhost no celular.
5. Se o Windows perguntar, permita Node.js em redes privadas.
6. Mantenha o computador ligado e a janela do servidor aberta.

O iniciador define HOST=0.0.0.0 para aceitar conexões na rede local. Isso não publica o PetCare na internet. Se a rede Wi-Fi bloquear a comunicação entre dispositivos, faça a demonstração no próprio computador como plano B.

ARMAZENAMENTO
Esta versão usa JSON local para funcionar no computador da escola com Node 20.
A versão SQLite é executada separadamente em online-sqlite com Node 22.13 ou superior (Node 24 recomendado).
As duas usam a mesma interface, API, autenticação e regras de negócio.
Não afirme que esta execução Node 20 está usando SQLite.

DADOS DA DEMONSTRAÇÃO
Use somente nomes, e-mails, senhas e pets fictícios. Não use dados de clientes ou credenciais pessoais.

TESTES
Execute npm test na pasta petcare. O GitHub Actions também verifica Node 20/JSON e Node 24/SQLite.

FUNDAMENTOS
Consulte ../FUNDAMENTOS_DO_CURSO.md.
GUIA COMPLETO
Consulte ../README.md, ../ROTEIRO_FALA_BANCA.md e ../CHECKLIST_BANCA.md.
