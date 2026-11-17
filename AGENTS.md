# Instruções para agentes

Este é um framework de site de notícias de um setor: coleta fontes, usa modelos para selecionar e escrever, agrupa fatos, publica resumos diários, semanais e mensais, e entrega tudo pelo site, RSS, API pública, Agent Markdown e MCP. A configuração padrão é um site de exemplo de tecnologia geral para o público brasileiro. Leia primeiro o README e depois, conforme a tarefa, o documento correspondente em `docs/`.

## A tarefa mais comum: adaptar para outro setor

Siga a ordem de `docs/customize.md`. O que é deste site fica em `site/`: nome e textos (`site.ts`), o modelo de cada etapa (`models.ts`), marca e logo (`brand/`), páginas de termos (`pages/`), arquivos fixos publicados na raiz do site (`public/`, publicados depois de trocar os marcadores) e o histórico de mudanças (`changelog.json`). O conhecimento do setor fica em `industry/`: categorias e tags (`taxonomy.ts`), tópicos (`topics.json`), fontes de exemplo (`sources.json`), prompts (`prompts/`) e limites (`selection.ts`). Em geral não é preciso mexer em `apps/` e `packages/`; um recurso que o framework não tem e só este site precisa vira um módulo em `modules/` (veja "Módulos" em `docs/architecture.md`).

Estas decisões são do usuário, não as tome por ele: o nome do site; quais fontes acompanhar; o que é notícia importante e o que é ruído; como dividir as categorias; o conteúdo dos termos de uso e da política de privacidade (`site/pages/` é um modelo e precisa da confirmação dele antes de ir ao ar).

Ao mudar o critério de nota, mantenha a estrutura existente (tipo de conteúdo, cinco dimensões ponderadas, supressão de ruído, limites de segurança) e troque só os exemplos do que "é importante" e do que "é ruído". Os limites precisam ser recalibrados com amostras rotuladas pelo usuário (`docs/selection.md`); não mude os números no chute.

## Rodar e verificar

- O Node.js 24 roda TypeScript direto; o backend não tem etapa de build. npm workspaces: `apps/*`, `packages/*`, `industry`, `site`, `modules/*`.
- Para rodar localmente ou com Docker, veja `docs/deploy.md`.
- Depois de mudar algo, rode pelo menos:
  ```bash
  npm run typecheck
  DATABASE_URL=postgres://127.0.0.1:5432/<nome>_test npm test   # o nome precisa terminar em _test ou _ci; se não existir, é criado e migrado sozinho (a conta precisa poder criar bancos)
  npm run build -w @aihot/web && npm run test:web
  node scripts/smoke.ts --base http://localhost:3000             # com o site no ar
  ```
- Parte dos testes em `tests/` usa as categorias, tags e empresas do setor de exemplo; se mudar `industry/taxonomy.ts`, troque esses exemplos pelos equivalentes do novo setor.

## Regras a respeitar

- O front-end (`apps/web`) só lê `apps/api` por HTTP; banco de dados, chamadas de modelo e chaves ficam só no backend.
- Toda saída pública lê pela mesma camada de leitura, `packages/backend/src/publication/`, inclusive saídas novas.
- Abrir uma página não dispara chamada de modelo; modelos só são chamados nas tarefas do worker.
- Toda requisição paga passa pelo recibo (`providers/receipts.ts`) e pelo disjuntor de orçamento; não contorne.
- As travas de segurança só abrem quando definidas como `true`. Em desenvolvimento, mantenha fechadas: `COLLECT_ENABLED`, `MODEL_CALLS_ENABLED`, `FEISHU_*_ENABLED`, `DINGTALK_CONTENT_PUSH_ENABLED`, `INDEXNOW_SUBMIT_ENABLED`, `BAIDU_PUSH_ENABLED`. Nos testes os envios ficam sempre desligados, e coleta e modelos só falam com serviços falsos locais, sem acessar nada externo.
- Por padrão, as fontes mostram só o resumo e o link do original (`site_fulltext` desligado); só ligue o texto completo quando a fonte permitir explicitamente.
- O conteúdo público é anônimo: administradores e visitantes veem a mesma coisa; o painel é só para administradores.
- Ao desativar ou substituir um recurso ou mecanismo, a mesma mudança remove o código, os testes, a documentação e o estado guardado (tabelas e colunas, tarefas agendadas, settings, variáveis de ambiente e itens do `.env.example`); se isso apagar dados que o usuário já tem, registre nas notas de atualização de `docs/deploy.md`. Travas, novas tentativas, compatibilidade com formatos antigos, chaves e planos B precisam de evidência antes: ter acontecido num deploy real, ou a semântica da plataforma garantir que vai acontecer.
- As migrações do banco ficam em `database/migrations/` (tabelas de um módulo ficam no `migrations/` dele) e rodam e são registradas pela ordem do nome completo do arquivo; arquivos diferentes com o mesmo número rodam separadamente, migrações novas usam um nome novo, e migrações já publicadas não mudam. A partir de `0055`, cada arquivo traz uma única instrução que possa rodar com o sistema no ar, e o PR verifica isso; índices usam `CONCURRENTLY IF NOT EXISTS`, e preenchimentos grandes de dados não entram em migrações publicadas. Validação de restrições e mudanças destrutivas seguem primeiro as [convenções de migração](docs/architecture.md#migrações-do-banco); não altere arquivos antigos nem desligue a verificação para contornar.
- Não faça commit do `.env`, de chaves nem de `.data/`.
- Não use o nome nem o logo do AIHOT.

## Escrever código

Siga o estilo, a nomenclatura e a densidade de comentários do código ao redor. Escolha a solução simples que resolve com clareza e só defina as abstrações que estão em uso. Verifique os comportamentos importantes que a mudança toca; não escreva testes para mudanças simples de estilo.

## Enviar PR

Este repositório é um fork em pt-BR do [AIHOT](https://github.com/KKKKhazix/AIHOT). Antes de mandar mudanças, leia `CONTRIBUTING.md`. Os casos mais devolvidos em revisão:

- **Só entram melhorias que valem para qualquer site.** Chaves novas, novos pontos de configuração e recursos novos, por menores que sejam, são comportamento de produto: abra uma Issue primeiro explicando o caso. As regras, números e exemplos do seu site ficam no seu `industry/` e `site/`, não nos modelos de prompt compartilhados, nos comentários ou nos testes.
- **Procure o que já existe.** Antes de criar uma função, um ponto de extensão ou uma configuração, pesquise: o recurso comum provavelmente já existe. Um módulo que serve seus próprios arquivos usa o `sendFile` de `apps/api/src/routes/static.ts`; para usar um proxy de API, preencha `LLM_BASE_URL`. Uma segunda cópia acaba divergindo da primeira.
- **Os testes só provam os casos em que você pensou.** Se mexeu em coleta, datas, limpeza de texto, seleção ou agrupamento, rode um lote de feeds e páginas públicas reais antes e depois da mudança e diga no PR quantos resultados mudaram e se todas as mudanças estão certas. Páginas brasileiras muitas vezes trazem horário sem fuso: leia pelo fuso da fonte (padrão deste site: `-03:00`, horário de Brasília). O resultado dos testes não pode depender do fuso da máquina.
- **Testes protegem comportamento, não a forma de escrever.** O teste que reproduz o problema entra no arquivo de testes já existente do recurso; não abra um arquivo novo para uma correção. Não afirme constantes privadas, classes CSS, posições em pixels nem comportamento do próprio navegador, e não congele a saída de antes de uma refatoração como teste permanente.
- **Estes arquivos não aceitam mudanças por PR externo:** dependências e arquivos de lock (atualizações vêm do dependabot), `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `SECURITY.md` e as regras em `.agents/` e `.claude/`, além de arquivos binários (amostras para testes devem ser geradas por código). Se precisar mudar, abra uma Issue explicando, e o mantenedor faz a mudança.
- **Mude tudo o que precisa.** Variáveis de ambiente novas vão para o `.env.example`, configurações novas do site vão para `site/`; se mudar o significado de um campo de configuração, ajuste também a configuração de exemplo, para que sites já no ar mantenham o comportamento depois de atualizar. Se mudar um nome ou entrada que o leitor vê, mude em todos os lugares onde aparece. Ao criar ou mudar a navegação, confira com a configuração padrão e com outras a barra lateral do computador, a barra inferior do celular, o voltar e a entrada "Meu", e veja no navegador o layout das abas quando houver menos entradas.
