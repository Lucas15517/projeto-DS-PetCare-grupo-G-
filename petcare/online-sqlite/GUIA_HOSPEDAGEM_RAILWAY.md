# Como colocar o PetCare na internet — Railway

Este guia serve **para o repositório do Grupo G**, que tem duas versões do PetCare: `petcare/escola-node20` e `petcare/online-sqlite`.

**Atenção:** o código no GitHub **não significa** que o site já esteja hospedado. Para gerar uma URL, a conta da hospedagem precisa ser configurada. Confira planos e custos antes de criar serviços. Use somente dados fictícios para os testes.

## Passo a passo

1. Entre em [railway.com](https://railway.com/) na conta autorizada pelo grupo.
2. Crie um projeto e conecte o repositório `Lucas15517/projeto-DS-PetCare-grupo-G-` do GitHub.
3. Nas **Settings** do serviço, configure **Root Directory** para `/petcare/online-sqlite`. Isso é indispensável porque o arquivo `Dockerfile` está nessa subpasta.
4. Garanta que o serviço use o `Dockerfile` desta pasta. Ele executa o servidor em Node.js 24.
5. Adicione ao serviço um **volume persistente** com **Mount Path** igual a `/data`. O SQLite ficará nesse volume. O servidor recusa iniciar em produção se não houver um diretório de dados persistentes configurado.
6. Na aba **Variables**, crie `PETCARE_SECRET` com um valor aleatório **de pelo menos 32 caracteres**. Para gerar um valor seguro no Windows, rode localmente:

   ```bat
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Copie o valor para **Variables**, nunca para arquivos do GitHub. A Railway define `RAILWAY_VOLUME_MOUNT_PATH` automaticamente quando o volume está anexado.
7. Reimplante (Redeploy) o serviço. Confira **Deployments → Logs**; o servidor deve iniciar normalmente.
8. Em **Settings → Networking**, use **Generate Domain**. Abra o endereço HTTPS gerado e teste login, cadastro e reserva duplicada.

## Se aparecer um erro

| Sintoma | Verificação |
|---|---|
| Site não encontra o código/Dockerfile | Confira **Root Directory = `/petcare/online-sqlite`**. |
| Servidor não inicia | Confira o volume em `/data`, `PETCARE_SECRET` e os logs. |
| Erro 502 no endereço | Confira o domínio, deploy e porta definida pela variável `PORT`. |
| Agendamentos desaparecem após reinício | Confira se há volume persistente conectado ao serviço correto. |

O endpoint `/api/health` pode ser usado como verificação de saúde.

## Importante para dezembro

- Hospede perto da data da apresentação para reduzir custos e riscos de esgotar créditos.
- **Mantenha a versão `escola-node20` como plano B**: ela já funciona no computador da escola sem internet.
- Não publique informações de clientes reais, banco de dados, senhas nem tokens.
- Antes de cadastrar, confirme preços e limites da Railway para sua conta.

Fontes da plataforma:
- [Publicar um monorepositório e configurar a Root Directory](https://docs.railway.com/deployments/monorepo)
- [Armazenamento persistente](https://docs.railway.com/volumes)
- [Dockerfiles](https://docs.railway.com/builds/dockerfiles)
