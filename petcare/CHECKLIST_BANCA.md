# PetCare — Checklist de apresentação e plano B

**Grupo:** Lucas, Gabriel Luan e Leonardo · **Turma:** 3A  
**Objetivo:** reduzir riscos durante a apresentação e deixar claro o que está validado e o que depende do ambiente.

## Antes do dia da apresentação

- [ ] Baixar o ZIP mais recente da branch petcare/correcoes-devolutiva.
- [ ] Extrair o ZIP em uma pasta simples, sem executar diretamente dentro do ZIP.
- [ ] Confirmar no CMD: node --version (Node 20 ou superior).
- [ ] Abrir petcare/escola-node20/ e executar INICIAR_ESCOLA_WINDOWS.bat.
- [ ] Confirmar a mensagem “PetCare iniciado em 0.0.0.0:3000 (json).”
- [ ] No computador, abrir http://localhost:3000.
- [ ] Testar cadastro/login com conta fictícia.
- [ ] Cadastrar um pet fictício.
- [ ] Consultar serviços e preços.
- [ ] Fazer um agendamento para uma data futura.
- [ ] Repetir o mesmo dia e horário e confirmar que aparece o conflito.
- [ ] Cancelar ou concluir o agendamento antes de arquivar o pet.
- [ ] Confirmar que o histórico permanece após arquivar.
- [ ] Testar o acesso pelo celular, se a rede local permitir.
- [ ] Ensaiar a fala de cada integrante e as transições.
- [ ] Levar o ZIP do projeto e os documentos em uma pasta acessível.
- [ ] Deixar o PowerPoint disponível no computador e, se possível, em uma cópia de segurança.

## Acesso pelo celular

1. O computador e o celular devem estar na mesma rede Wi-Fi.
2. O arquivo INICIAR_ESCOLA_WINDOWS.bat configura HOST=0.0.0.0.
3. No computador, executar ipconfig e identificar o IPv4 da rede Wi-Fi.
4. No celular, abrir http://IP-DO-COMPUTADOR:3000.
5. Não usar localhost no celular.
6. Manter o computador ligado e a janela do servidor aberta.
7. Se o Windows perguntar, permitir Node.js apenas em redes privadas.

O acesso pelo IPv4 é local, não é hospedagem pública. Se o Wi-Fi da escola impedir comunicação entre dispositivos, usar a demonstração no computador.

## Na hora de apresentar

- [ ] Abrir os slides e confirmar que estão na ordem correta.
- [ ] Fechar programas e abas que não serão usados.
- [ ] Abrir o PetCare antes da banca começar.
- [ ] Não deixar a janela preta do servidor ser fechada.
- [ ] Usar apenas dados fictícios.
- [ ] Cada integrante explica a sua parte; não atribuir tarefas sem que a pessoa consiga explicá-las.
- [ ] Mostrar os testes reais do GitHub Actions, sem fabricar capturas ou resultados.
- [ ] Reservar alguns minutos para perguntas.

## Plano B se algo falhar

**Se o celular não abrir**
- Continuar a demonstração no computador usando http://localhost:3000.
- Explicar que o acesso móvel depende da rede local e das regras do Wi-Fi.
- Não gastar o tempo da banca tentando alterar configurações da rede.

**Se o PetCare não iniciar**
- Verificar se a versão Node 20+ está instalada.
- Abrir a pasta petcare/escola-node20 correta.
- Executar novamente INICIAR_ESCOLA_WINDOWS.bat.
- Conferir a mensagem ou erro na janela preta.
- Não fechar a janela antes de registrar o erro.
- Se continuar sem iniciar, usar a apresentação de slides e explicar que a demonstração prática depende da disponibilidade do ambiente. Não dizer que a execução ocorreu se ela não ocorreu.

**Se a reserva retornar conflito**
- Conferir se o mesmo horário já foi reservado; isso pode ser o resultado esperado.
- Escolher outro dia/horário para continuar o fluxo normal.
- Para demonstrar a regra, manter a primeira reserva e repetir exatamente o mesmo dia/horário.

**Se não houver internet**
- A versão escolar pode funcionar localmente, desde que o servidor e os arquivos estejam disponíveis.
- A consulta offline do PWA depende de dados já salvos anteriormente e não permite cadastro ou atualização.
- O GitHub Actions deve ser mostrado por uma captura real preparada antes, caso a internet da escola não esteja disponível. Não inventar resultados.

## O que cada modo usa

| Situação | Modo | Armazenamento |
|---|---|---|
| Computador escolar com Node 20 | escola-node20 | JSON local |
| Execução SQLite | online-sqlite com Node 22.13+ (Node 24 recomendado) | SQLite relacional |
| GitHub Actions Node 20 | ambiente de teste | JSON |
| GitHub Actions Node 24 | ambiente de teste | SQLite |

Não misturar os modos na explicação. O modo escolar JSON é uma alternativa de compatibilidade; o modo SQLite é a demonstração do banco relacional.

## Dados e privacidade

- Usar nome, e-mail e senha fictícios.
- Não usar dados de clientes, familiares ou colegas.
- Não exibir tokens, arquivos .env, senhas ou dados reais.
- Não publicar capturas que mostrem dados pessoais.
- Não compartilhar o endereço IPv4 local como se fosse um endereço público.

## Itens validados no código e no CI em 24/11/2026

- Formatação e testes automatizados no Node 20 com JSON: aprovados.
- Formatação e testes automatizados no Node 24 com SQLite: aprovados.
- Cobertura dos testes inclui autenticação, autorização, data passada, conflito concorrente, histórico, logout e limite por IP.
- O acesso pelo celular foi testado manualmente pelo grupo e funcionou; repetir o teste no local da escola, pois redes diferentes podem impor restrições.

## Pendências que não devem ser escondidas

- Pelo menos um integrante diferente do autor deve revisar e aprovar o Pull Request #3 usando a própria conta.
- A apresentação ainda deve ser ensaiada pelos três integrantes.
- Capturas reais da interface devem ser acrescentadas à pasta petcare/docs/screenshots/ apenas depois de serem feitas.
- O site não está publicado na internet automaticamente. A hospedagem Railway é opcional e exige conferir custos, configurar segredo, volume persistente e HTTPS.
- CI verde indica que os testes definidos passaram; não é garantia absoluta de ausência de defeitos em qualquer computador ou rede.
