# Publicação do PetCare na Railway

Este guia usa a aplicação compartilhada em petcare/. A publicação não acontece automaticamente ao enviar arquivos para o GitHub.

## Antes de começar

- Confirme com o grupo quem é responsável pela conta de hospedagem.
- Confira os preços, limites e eventuais cobranças da Railway antes de ativar um serviço.
- Use apenas dados fictícios na demonstração.
- A versão escolar Node 20 continua disponível como plano B local.

## Configuração

1. Entre na Railway com a conta autorizada pelo grupo.
2. Crie um projeto e conecte o repositório Lucas15517/projeto-DS-PetCare-grupo-G-.
3. Configure a Root Directory como /petcare (pasta que contém o Dockerfile).
4. Garanta que o deploy use petcare/Dockerfile, baseado em Node 24 Alpine com tzdata.
5. Adicione um volume persistente com Mount Path /data. A Railway deve fornecer RAILWAY_VOLUME_MOUNT_PATH.
6. Configure as variáveis:
   - PETCARE_STORAGE=sqlite
   - TRUST_PROXY=1 (somente porque a aplicação está atrás do proxy da Railway)
   - PETCARE_SECRET com pelo menos 32 caracteres aleatórios
   - NODE_ENV=production
7. Gere um domínio HTTPS nas configurações de Networking e faça o deploy.
8. Abra /api/health; a resposta deve indicar ok: true, storage: sqlite e timezone: America/Sao_Paulo.
9. Teste cadastro, login, logout, cadastro de pet, agendamento e conflito 409.
10. Reinicie o serviço e confirme que os dados continuam no volume.

Para gerar um segredo localmente no Windows:

    node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

Cole o valor diretamente em Variables da Railway. Nunca o coloque no GitHub, no README ou no PowerPoint.

## Por que o proxy importa?

Com TRUST_PROXY=1, o servidor usa somente o primeiro endereço válido de X-Forwarded-For, recebido do proxy configurado. Sem essa variável, o cabeçalho é ignorado e o servidor usa o endereço da conexão. Não habilite essa opção em uma instalação exposta diretamente à internet sem um proxy confiável.

## Verificação de segurança

- Não publique .env, banco SQLite, tokens ou senhas.
- Confirme que o volume está realmente montado em /data.
- Confirme que PETCARE_SECRET está configurado.
- Verifique os logs do deploy sem compartilhar dados pessoais.
- Ative Dependabot e, se disponível no plano do repositório, secret scanning e push protection em Settings → Security.

## Referências oficiais

- https://docs.railway.com/guides/monorepo
- https://docs.railway.com/reference/volumes
- https://docs.railway.com/guides/dockerfiles
