# Como contribuir

Problemas reproduzíveis, correções na documentação e melhorias úteis são bem-vindos. Pode escrever em português ou inglês.

## Onde conversar

- [Issues](https://github.com/danjustino/myhot-br/issues/new/choose): bugs reproduzíveis e sugestões de recurso com um caso de uso claro.
- Falhas de segurança: envie de forma privada, como explica o [guia de segurança](SECURITY.md).
- Melhorias do framework em si (que valem para qualquer setor e idioma) podem ir direto para o projeto original, o [AIHOT](https://github.com/KKKKhazix/AIHOT), seguindo o guia de contribuição de lá.

## O que entra

Têm prioridade melhorias na experiência de deploy, nas fontes brasileiras, na qualidade dos textos em pt-BR, na acessibilidade, na documentação e em falhas reproduzíveis. Antes de mudar muito a arquitetura ou o comportamento do produto, explique o caso e a proposta numa Issue, para não descobrir tarde que a direção não serve.

Fontes e critérios de seleção que só servem ao seu setor ficam no seu próprio repositório, em `industry/`; nome, marca e páginas ficam em `site/`; um recurso que só o seu site precisa vira módulo em `modules/` (veja [Arquitetura](docs/architecture.md#módulos)). O passo a passo está em [Personalizar](docs/customize.md).

## Enviando mudanças

1. Faça um fork deste repositório e crie sua branch a partir da `pt-br-tecnologia` mais recente.
2. Leia o [AGENTS.md](AGENTS.md) e a documentação da parte que vai mudar. Um PR resolve um problema claro: sem refatorações de carona e sem mudanças no `package-lock.json` vindas de reinstalar dependências.
3. Configure o ambiente local seguindo o [guia de deploy](docs/deploy.md). Use um banco de testes separado e mantenha desligados coleta, chamadas de modelo e envios externos durante o desenvolvimento; não teste com banco de produção nem com serviços pagos reais.
4. Verifique o comportamento que a mudança toca e escreva no PR o resultado. Para código, rode `npm run typecheck`, `npm test`, o build do site e os testes web. O nome do banco de testes do backend precisa terminar em `_test` ou `_ci` (se não existir, é criado e migrado sozinho); cada arquivo de teste roda em paralelo numa cópia dele, então a conta do banco precisa da permissão `CREATEDB`. Com o site no ar, `node scripts/smoke.ts --base http://localhost:3000` faz uma checagem rápida. Mudanças só de documentação ou modelo pedem apenas conferir links, sintaxe e como aparece.
   Ao mudar o banco, migrações já publicadas não mudam: a correção vai num arquivo novo, com uma única instrução que possa rodar com o sistema no ar. Rode localmente `node scripts/check-migrations.ts --base pt-br-tecnologia`. As regras estão nas [convenções de migração](docs/architecture.md#migrações-do-banco).
   O teste de backup e restauração precisa de `tar` e de `pg_dump`/`pg_restore` compatíveis com a versão do servidor.
5. Abra o PR para a branch `pt-br-tecnologia` e marque "Allow edits by maintainers". Se ainda está trabalhando, abra como rascunho. Mudanças de página vêm com captura de tela; mudanças de configuração ou de atualização vêm com a documentação atualizada.

Não envie `.env`, chaves, senha do admin, cookies, dados de produção nem material sem autorização; tire as informações sensíveis de logs e capturas também. O código segue a [licença MIT](LICENSE); a marca e o material de terceiros estão explicados no [NOTICE](NOTICE).
