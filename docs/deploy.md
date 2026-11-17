# Deploy

## Com Docker (recomendado)

Você precisa de uma máquina com Docker (com Compose). Num servidor na nuvem, use pelo menos 2 núcleos e 4 GB de memória, necessários para construir as imagens.

```bash
git clone https://github.com/danjustino/myhot-br.git myhot
cd myhot
node scripts/init-env.ts --llm-key <sua chave de API do modelo>
```

O `init-env.ts` gera o `.env`, preenche chaves aleatórias e a senha do admin, e mostra a senha uma vez. Sem Node na máquina, copie `.env.example` para `.env` e preencha você mesmo `ADMIN_PASSWORD` (pelo menos 12 caracteres), `SESSION_SECRET`, `IMG_PROXY_SIGN_SECRET`, `POSTGRES_PASSWORD` (gere cada um com `openssl rand -hex 32`) e `LLM_API_KEY`.

Antes de subir, confira o `SITE_URL` no `.env`: para testar na própria máquina, deixe `http://localhost:3000`; num servidor, troque pelo endereço que o leitor vai usar. Por exemplo, acessando pelo IP do servidor (troque o IP do exemplo pelo seu):

```dotenv
SITE_URL=http://192.0.2.10:3000
```

Os links absolutos do RSS, dos links de compartilhamento, do sitemap e do Agent Markdown usam esse valor, e ele não muda conforme o endereço usado no navegador. Com domínio e HTTPS, siga "Domínio e HTTPS" abaixo.

Configurado, suba:

```bash
docker compose up -d --build
```

Depois, abra `http://endereço-do-servidor:3000`; o painel fica em `/admin`, com a senha do admin. Na primeira execução as fontes de exemplo são importadas e o conteúdo começa a aparecer em um ou dois minutos; os cerca de cem itens da primeira importação levam mais ou menos meia hora (cada um passa por triagem, nota, estrutura, título e resumo, e agrupamento).

O `docker compose` sobe cinco contêineres: `db` (PostgreSQL 17), `setup` (a cada subida roda as migrações e os dados iniciais e termina), `api`, `worker` (coleta, processamento com modelos, tarefas agendadas) e `web` (site). O `web` só recebe a configuração do site, como endereço do site e da API, e lê a API por HTTP; banco, modelos, chaves do admin e volumes de dados ficam só com os contêineres do backend.

### Em servidores na China continental

- No build, use o espelho do npm: `docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com` e depois `docker compose up -d`.
- Se baixar imagens do Docker estiver lento, configure um espelho de imagens no Docker.
- Se fontes do exterior não forem coletadas, defina `EGRESS_PROXY_URL` no `.env`: coleta de fontes e imagens passa por esse proxy, e as chamadas de modelo não.
- Oferecer o site ao público exige registro ICP antes; o número vai em `icp` no `site/site.ts`.

### Domínio e HTTPS

Aponte o domínio para o servidor e defina no `.env`:

```bash
SITE_URL=https://example.com
SITE_DOMAIN=example.com
PORT=127.0.0.1:3000        # a porta 3000 fica só para o Caddy local, sem acesso externo direto
TRUST_PROXY=true           # o endereço do visitante vem do cabeçalho repassado pelo Caddy
```

E suba com HTTPS; o Caddy pede e renova o certificado sozinho:

```bash
docker compose --profile https up -d --build
```

Se você já tem Nginx, dispense o Caddy: faça proxy reverso do site para `http://127.0.0.1:3000`, com `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` e `proxy_set_header X-Forwarded-Proto $scheme;` (o login do painel usa isso para saber se o acesso é HTTPS; sem ele, o cookie de login perde o Secure), e defina `TRUST_PROXY=true` no `.env`. O `SITE_URL` precisa ser o endereço que o leitor realmente usa: links gerados, RSS, imagens de compartilhamento e MCP dependem dele.

Por padrão, o MCP aceita o host do `SITE_URL` e também `localhost`, `127.0.0.1` e `[::1]`. Hosts extras vão em `MCP_ALLOWED_HOSTS`, separados por vírgula, por exemplo `extra.example:8443,[2001:db8::1]`. Os nomes não diferenciam maiúsculas, IPv6 precisa de colchetes, e a porta decimal de 0 a 65535 é opcional e ignorada na comparação. Configurações com caminho, informação de usuário ou porta inválida não valem. Apelidos como `127.1` precisam ser listados explicitamente; isso só afeta a verificação do Host e não amplia a permissão de Origin do navegador.

Com cache à frente, como Nginx ou CDN, respeite o prazo de cache devolvido pela aplicação (`Cache-Control`): páginas públicas, dados de navegação, API, RSS, Markdown dos itens, imagens de compartilhamento dos resumos, sitemap e as instruções de conexão `/api/v1/agent` e `/openapi-v1.json` (que também revalidam depois de cinco minutos) não devem ganhar prazo de cache maior, não devem servir conteúdo velho offline depois de vencer e não devem ter a idade recontada ao repassar respostas antigas; não deixe proxy e CDN empilharem cache de conteúdo dinâmico. O framework não administra a CDN do seu site nem limpa o cache dela.

### Atualizar

Faça antes o backup da seção [Backup](#backup). Com o build pronto, pare os serviços antigos e rode a migração e os serviços novos:

```bash
git pull
docker compose build
docker compose stop api worker web
docker compose run --rm setup && docker compose up -d
```

Só suba os serviços depois que a migração der certo; se falhar, veja o erro antes de continuar. Sites com HTTPS continuam com `--profile https`. A API e o worker antigos precisam parar antes da migração: ela pode apagar tabelas e colunas, e o código antigo rodando daria erro; um desligamento normal do worker espera as chamadas pagas em andamento terminarem (até pouco mais de três minutos). Deploys sem Docker seguem a mesma ordem: backup, build, parar API/worker/web, migração (`scripts/migrate.ts`), dados iniciais (`scripts/seed.ts`) e subir.

Se uma migração nova encontrar uma trava longa, ela mostra o nome do arquivo e o tempo de espera esgotado; resolva primeiro a transação que segura a trava e rode o setup de novo, sem pular a migração nem alterar o registro de migrações. Uma criação de índice concorrente interrompida pode deixar um índice inválido: confira o objeto do erro, limpe esse índice com `DROP INDEX CONCURRENTLY <nome-do-índice>` e rode de novo; se houver um índice válido de mesmo nome com definição diferente, compare as diferenças antes. Essas proteções não mudam a ordem de atualização acima, e saltar de versões antigas ainda pode rodar migrações destrutivas do histórico.

As notas abaixo trazem o que observar em cada atualização do framework original, da mais nova para a mais antiga.

#### Painel só com senha do admin (15 de novembro de 2026)

O painel não oferece mais login pelo Feishu, só a senha do admin. Ao atualizar, o `setup` roda duas migrações que apagam as identidades do Feishu guardadas no banco (`admin_users.feishu_union_id`, `admin_sessions.auth_claims`), sem nada a fazer à mão. Quem usava o login do Feishu deve definir `ADMIN_PASSWORD` no `.env` (no mínimo 12 caracteres) antes de atualizar; sem isso, sites com páginas de painel se recusam a iniciar em produção. Depois de atualizar, entre com a senha; as sessões antigas do Feishu deixam de valer. `FEISHU_LOGIN_APP_ID`, `FEISHU_LOGIN_APP_SECRET`, `ADMIN_FEISHU_UNION_IDS` e `ADMIN_EMAILS` não são mais lidos e podem sair do `.env`; o aplicativo criado só para login na plataforma aberta do Feishu pode ser desativado. Alertas, encaminhamento de feedback e envio de conteúdo pelo Feishu não mudam. Sites com `ADMIN` igual a `null` em `site/site.ts` (sem páginas de painel) não oferecem mais login no painel nem exigem a senha do admin.

#### Sincronização do motor de 31 de outubro de 2026

Três migrações (`0090`–`0092`), rodadas pelo setup ao atualizar com os comandos acima: as fontes ganham a coluna opcional de classe `selection_class`, e o feedback ganha as colunas `kind` (tipo) e `idea` (sugestão em que se encaixa), todas anuláveis; dados antigos não mudam. Nenhuma variável de ambiente obrigatória nova. Mudanças a observar:

- **`industry/selection.ts` ganhou `classes` e `browseFloor`**, veja [Seleção e calibração](selection.md#limites-industryselectionts); se você mudou esse arquivo, acrescente os dois ao mesclar, senão a verificação de tipos falha.
  - `classes`: classes de fonte e o limite mínimo de cada uma. Na página "Fontes" do painel dá para escolher uma classe para fontes oficiais, e o limite sobe para no mínimo o da classe, nunca desce; fontes sem classe continuam iguais.
  - `browseFloor` (padrão 40): a navegação em "Todas as notícias" (lista do site, `mode=all` de `/api/v1/items` e `/api/v1/agent/latest`, `all` da lista de mais recentes do MCP, RSS de todas as notícias) só mostra itens com média a partir dele; os sem nota aparecem normalmente, e com termo de busca procura em tudo. Para listar tudo como antes, use `0`.
- **Alertas**:
  - Novo alerta "muitas fontes com falha de coleta": com a coleta ligada, se pelo menos 50 fontes falharam na última coleta e elas são mais de 15% das fontes coletadas recentemente, há alerta de nível "leitores afetados"; geralmente a conexão do servidor com a internet ou o proxy caiu.
  - Opcionais `WEBHOOK_HUB_URL` e `WEBHOOK_HUB_KEY` (protocolo no `.env.example`): configurados (e com `FEISHU_INTERNAL_ENABLED=true`), alertas dos níveis "leitores afetados" e "resolver hoje" vão primeiro para o seu serviço de tratamento automático; só chegam a você se não se resolverem 1 hora (leitores afetados) ou 3 horas (resolver hoje) depois, ou se o mesmo problema for repassado pela terceira vez no dia; o que só você pode resolver (por exemplo, o serviço de modelo recusando chamadas, conferir conta ou cota) continua chegando na hora. O relatório do sistema das 09:00, se aceito pelo serviço, não é enviado a você. Mensagens para você também passam antes pelo `/tell` dele e, se não forem aceitas, vão pelo Feishu. Se ficar mais de 30 minutos sem conseguir entregar, sai o alerta "tratamento automático temporariamente fora", e nesse período os alertas vão direto para você. Sem configurar, tudo continua como antes. `AGENT_WEBHOOK_URL` e `AGENT_WEBHOOK_KEY`, que o código lia sem estar documentados, não são mais lidos, e o formato da requisição mudou; se você usava, ajuste conforme o `.env.example`.
  - O robô do grupo de alertas (`FEISHU_ALERT_WEBHOOK_URL`) manda uma mensagem por vez e espera a resposta ou a falha da anterior, mais 600 milissegundos, antes da próxima, sem passar do limite de frequência dos robôs personalizados do Feishu.
- **Pausa depois de recusa do serviço de modelo**: se uma requisição enviada antes da recusa der certo depois, a pausa não é mais desfeita (ela pode ter usado a última cota); só o sucesso de uma requisição enviada depois da recusa desfaz. A recusa também não apaga mais, de carona, registros de pausa vencidos há mais de um dia de outros modelos: dois modelos recusados ao mesmo tempo esperariam a trava de linha um do outro, e o impasse perderia aquela recusa; pausas vencidas já não valem, ficam em `settings` e são apagadas no próximo sucesso daquele modelo.
- **Imagens**: as imagens do site são servidas primeiro em AVIF (`<picture>`; navegadores sem suporte usam o formato original). A versão AVIF é gerada pelo worker em segundo plano conforme a necessidade e só fica se for pelo menos 10% menor que o original; até ficar pronta, vai o formato original; o cache de imagens ocupa um pouco mais de espaço. Imagens recusadas ou apagadas na origem (401, 403, 404, 410) têm a falha guardada em cache por 6 horas, sem ir à origem a cada minuto.
- **Backup**: cada arquivo é enviado uma vez só, num prefixo (veja [Backup](#backup)); antes, todo dia ia uma cópia para `daily/`, e domingo e dia 1º iam cópias extras. Se você definiu regras de expiração por prefixo, confira. Sem anexos, só o `.dump` é enviado, sem gerar pacote de arquivos vazio.
- **Painel de feedback**: o feedback pode ter tipo (BUG, sugestão, pergunta, outro); sugestões podem ser agrupadas sob um nome, com o mesmo nome para o mesmo pedido, e o "banco de sugestões" ordena pelo número de pessoas que pediram.

Novo opcional `PRIVATE_FEED_HOSTS`: quando o endereço de feed ou de lista de uma fonte é um serviço próprio na rede interna (como um RSSHub), coloque o nome do host aqui, sem precisar ligar o `ALLOW_PRIVATE_NETWORK_FETCH` do site inteiro; uso em [Fontes](sources.md). Sem definir, nada muda; não há migração.

No período de um semanal ou mensal, se todos os diários esperados existem e todos os itens originais do corpo estão vazios, a edição é pulada, evitando erros repetidos a cada meia hora; o arquivo não ganha semanal ou mensal vazio. O primeiro período é verificado a partir do diário mais antigo do site; sem itens para compilar porque faltam diários, porque itens antigos não podem mais ser públicos ou porque há correção manual em andamento, o erro continua. Sem migração nem mudança de configuração; vale a partir da próxima verificação agendada depois de atualizar.

A correção de vídeos nativos no corpo acrescenta controles de reprodução a vídeos utilizáveis já existentes e remove players vazios, sem regravar artigos nem chamar modelos. Endereços de mídia descartados na limpeza de versões antigas não podem ser recuperados do arquivo; a atualização não reextrai em massa, corpos já extraídos com sucesso são pulados, e com o mesmo hash de conteúdo uma reextração pode manter o HTML original. Corpos novos mantêm vídeos nativos conforme o [guia de fontes](sources.md); os arquivos continuam carregados direto do site original pelo navegador, e endereços assinados podem expirar.

Gráficos SVG embutidos nas ilustrações do corpo passaram a ser trocados pela descrição em texto do site original (veja o [guia de fontes](sources.md)), só para corpos extraídos daqui em diante; corpos já guardados não mudam e não há reextração em massa.

#### Envio ativo para o Baidu (8 de novembro de 2026)

Sem migração. Duas variáveis opcionais novas, `BAIDU_PUSH_ENABLED` e `BAIDU_PUSH_TOKEN`: depois de verificar o site na plataforma de busca do Baidu, coloque em `BAIDU_PUSH_TOKEN` o token do fim do endereço de envio "普通收录 · API提交", defina a chave como `true`, e o worker envia de hora em hora as páginas novas para o Baidu. Na primeira vez só registra as páginas existentes, sem enviar (elas dependem do sitemap); depois, cada endereço é enviado uma vez, sem passar da cota diária do Baidu; um dia seguido de falhas aparece na lista diária de acompanhamento. Sem usar, não preencha, e nada é enviado.

#### Verificação do site em plataformas de webmaster (8 de novembro de 2026)

Sem migração e sem variáveis novas. `site/site.ts` ganhou `SITE.siteVerification`: os códigos de verificação por tag HTML de plataformas como Baidu, Bing, 360, Sogou, Shenma e Toutiao (e também Google Search Console) vão como "nome do meta → código" e aparecem no head da página inicial; mantenha mesmo depois de verificado. Quem mantém o próprio `site/site.ts` deve acrescentar essa linha ao mesclar; se não usar, escreva `siteVerification: {}`; sem ela, o build não encontra `siteVerification`.

#### "Feito com AIHOT" no rodapé (8 de novembro de 2026)

Sem migração e sem variáveis novas. `site/site.ts` ganhou `SITE.poweredBy`: preenchido, aparece "Feito com X" no fim da barra lateral e da página "Meu", com link para o endereço; o modelo aponta para o AIHOT por padrão. Quem mantém o próprio `site/site.ts` deve acrescentar a linha ao mesclar; para não mostrar, use `poweredBy: null`. Sem ela, o build não encontra `poweredBy`.

#### Títulos nos resultados de busca (8 de novembro de 2026)

Sem migração e sem variáveis novas. `site/site.ts` ganhou o obrigatório `SEO_TITLES`: os títulos de em alta, todas as notícias, conexão para agentes, sobre, a edição mais recente de diário, semanal e mensal e as páginas de tópico nos resultados de busca, com as palavras que o leitor procura primeiro; a página acrescenta " · nome do site" no fim; a página inicial continua usando `SITE.homeTitle`. Quem mantém o próprio `site/site.ts` deve copiar esse trecho do modelo ao mesclar e adaptar para o seu setor; sem ele, o build não encontra `SEO_TITLES`.

#### Envio de conteúdo para o DingTalk (6 de novembro de 2026)

Novo canal de envio opcional: os cartões da seleção podem ir para um grupo do DingTalk (robô personalizado, mensagem em markdown, com assinatura). Sem passos de migração obrigatórios; o `setup` roda sozinho ao subir, e deploys com envio para o Feishu continuam iguais. Para usar, defina no `.env` `DINGTALK_CONTENT_PUSH_ENABLED=true` e `DINGTALK_PUSH_WEBHOOK_URL` (com assinatura ligada no robô, também `DINGTALK_PUSH_SECRET`) e ative "Grupo de conteúdo do DingTalk" em "Configurações → Destinos de notificação" no painel; é independente do envio para o Feishu e os dois podem ficar ligados. Detalhes no `.env.example`.

O alerta de diário faltando acompanha a data específica no fuso do site, e não se resolve sozinho ao passar da meia-noite; só há aviso de recuperação quando o diário correspondente existe. A verificação de faltas novas olha os últimos 7 dias corridos (incluindo hoje), não antes do diário mais antigo ou do registro mais antigo de reports.compose; sem histórico, só verifica hoje. Datas já alertadas são acompanhadas durante esses 7 dias, e desligar coleta ou modelos, ou o período de carência na subida do worker, não contam como recuperação; passados 7 dias sem diário, sai um aviso de "não deu para repor, lembretes encerrados" e não há mais lembretes. O antigo estado report.daily é migrado sozinho pela hora do primeiro alerta, mantendo o intervalo de lembretes. O alerta duas horas depois da publicação, os lembretes de hora em hora e a chave do Feishu não mudam; sem migração. Um responder personalizado que comparava exatamente `report.daily` precisa passar a reconhecer a chave com data `report.daily:YYYY-MM-DD`.

#### Ajuste de palavras no texto para o leitor (9 de outubro de 2026)

Sem migração e sem variáveis obrigatórias novas. O pacote do setor ganhou `industry/wording.ts` (palavras que não devem aparecer no texto para o leitor; vazio no modelo) e o prompt `mend-wording.md`; ao mesclar, os dois chegam com a atualização, sem conflito com o seu pacote. Com a lista vazia, nada é verificado e não há chamadas extras; com palavras na lista, títulos, resumos e motivos para ler que as usem ganham uma chamada de modelo a mais (etapa "Ajuste de palavras"; o opcional `WORDING_MODEL` escolhe um modelo à parte). Explicação em [Adaptar para o seu setor](customize.md).

#### Esconder entradas da navegação

Sem migração e sem variáveis novas. `site/site.ts` ganhou `NAV.hidden` (por enquanto só aceita em alta `"/hot"` e tópicos `"/topics"`; veja [Adaptar para o seu setor](customize.md)); o framework lê de `@aihot/site`, então **quem mantém o próprio `site/site.ts` precisa acrescentar `NAV` como no modelo ao mesclar**, senão a verificação de tipos falha. No modelo fica vazio, e a navegação continua igual; esconder uma entrada não desliga a página nem a interface pública.

#### Exibição de posts originais e sincronização do motor (6 de outubro de 2026)

Sem variáveis obrigatórias novas nem migração. Quem mantém o próprio `site/site.ts` precisa acrescentar `REPORTS.quiet`, comparando com a configuração de exemplo: quando, no período do diário, houve itens avaliados mas nenhuma notícia grande nova, a edição sai normalmente com essas duas frases como título e chamada; `{start}` e `{end}` na chamada são o início e o fim do período. Se nenhum item foi avaliado, ainda conta como falha de coleta ou de avaliação, e não se disfarça de dia calmo.

Posts do X sem corpo ou só com link mantêm os links, imagens e citações originais, sem chamar modelo de escrita ou tradução; quando a fonte permite mostrar o texto completo, posts só com imagem também aparecem, e as permissões atuais de exibição e republicação continuam valendo. Artigos longos do X com corpo real seguem o fluxo normal. Traduções antigas deixam de aparecer nas páginas públicas desses posts. Para posts que já tinham título e resumo errados, depois de atualizar dá para refazer o conteúdo público com `publishArticle(id)` de `packages/backend/src/publication/publish.ts`, sem chamar modelo de novo.

O `subscriptions/listen` do MCP agora devolve na hora HTTP 404 e JSON-RPC `-32601 Method not found`. O serviço nunca enviou mudanças, e as chamadas comuns de ferramentas continuam iguais; ao receber essa resposta, o cliente não deve tentar de novo criar uma assinatura permanente.

Testes que não precisam de banco passaram a se chamar `*.standalone.test.ts`; `npm test` continua rodando todos os testes do backend e só cria cópias do banco para os arquivos que precisam. `npm run test:standalone` roda só esses testes.

#### Correções da comunidade, regras de horário e otimização de leitura (4 de outubro de 2026)

A versão da interface pública continua 4.0.0. Sem variáveis obrigatórias novas; há um opcional novo, `LLM_REASONING_TOKENS`, veja o item de `site/models.ts` abaixo.

**Chaves só aceitam `true`**: todas as chaves `*_ENABLED` do `.env` (`COLLECT_ENABLED`, `MODEL_CALLS_ENABLED`, `FEISHU_*_ENABLED`, `INDEXNOW_SUBMIT_ENABLED` etc.) só ligam com `true` em minúsculas. Antes, `1` ou `TRUE` também ligavam; agora valem como desligado. Confira o `.env` antes de atualizar e troque por `true`.

**Migrações**: sete migrações novas; basta esperar o setup terminar, seguindo os passos acima. Nenhuma apaga dados, reescreve artigos ou vetores existentes, ou chama modelos; as migrações são registradas pelo nome completo do arquivo, e arquivos diferentes com o mesmo número rodam cada um.

- `0055_publication_selected_published_idx.sql`, `0056_analyses_composite_id_idx.sql`, `0056_publications_pool_category_timeline_idx.sql`, `0057_publications_pool_channel_timeline_idx.sql`: criam índices de consulta de forma concorrente, sem bloquear leitura e escrita normais.
- `0056_publication_release_selection_stats.sql`, `0057_analyze_publication_release_selection.sql`: criam e coletam estatísticas de consulta para as listas públicas.
- `0083_publications_selected_source_idx.sql`: cria de forma concorrente um índice de cobertura para contar a seleção por fonte, reduzindo leituras nas estatísticas do painel.

Junto com esses índices, esta versão reduz o custo de banco da leitura pública e da busca de fatos, sem mudar o conteúdo das interfaces, os pesos da busca nem o alcance dos candidatos.

**Quem mudou estes arquivos deve comparar com os novos ao mesclar**:

- `site/site.ts` ganhou alguns itens:
  - `EDITION_TIMES` e `EDITION_WHEN`: horários de publicação do diário, semanal e mensal, antes fixos no código; o agendamento, a janela do diário, o alerta de edição faltando e os textos com horário leem deles. Os arquivos de `public/` usam os marcadores `{{dailyTime}}`, `{{weeklyTime}}` e `{{monthlyTime}}`.
  - `ITEM_COPY`: o nome do motivo para ler e se a nota aparece no site e nas imagens de compartilhamento.
  - `REPORTS.descriptions`, `entry`, `metricUnits`, `shareUnit`: descrições e termos usados nas páginas dos resumos.
  - Os textos de `ABOUT` e `CARDS` que citam horários e o motivo para ler passaram a usar os itens acima.
  - `DEPLOYMENT.directImageHosts` virou `directFetchHosts`, e a coleta e as imagens usam a mesma lista de acesso direto.
  - `SITE.feedbackLead` e `SITE.feedbackEmailHint`: a frase sob o título da página de feedback e a dica do campo de e-mail, antes fixas no código.
  - `SITE.psb`: número opcional de registro na segurança pública chinesa; sem registro ou se não se aplica, `null`.
  - `ABOUT.lead` não tem mais espaços em volta de `{sources}`; a página acrescenta sozinha.
- `site/models.ts`: os parâmetros da chamada de nota agora vêm do `scoreCall` da predefinição com nome; se mantiver `glm-5.3-flash-selection`, sincronize temperatura, cota de saída e tempo limite com o exemplo. Modelos personalizados sem esse item usam o padrão do motor.
- O tipo `ModelPreset` de `site/models.ts` e o tipo `Founder` de `site/site.ts` passaram a ser importados de `@aihot/contracts/site-config`, mantendo os valores de configuração; se personalizou esses dois arquivos, sincronize as importações de tipo para não perder campos opcionais novos do motor.
- Uma migração que encontra um `pg_dump` exportando espera, no máximo o mesmo tempo de esvaziamento do worker; esgotado o tempo, sai antes de rodar a migração, e você roda de novo o comando de atualização quando a exportação acabar. Outras travas continuam dando erro rápido.
- A migração apaga a coluna desativada `translation_attempts.request_tag`; corpos traduzidos, registros de tentativa e recibos pagos ficam. A precisão original da data de publicação da fonte passa a ser guardada à parte; para material antigo em que não dá para saber, fica desconhecida, sem tratar meia-noite como "a fonte só informou a data".
- `site/models.ts`: a cota dos modelos de raciocínio passou a ser configurada explicitamente. O modelo padrão usa `LLM_REASONING_TOKENS`, e modelos com nome usam `reasoningTokens`. Antes, só modelos com nome terminado em `-think` ganhavam 4000 a mais; isso acabou, e quem tinha modelos assim precisa acrescentar `reasoningTokens: 4000` para manter a cota. Quando um modelo de raciocínio esgota a cota, o erro mostra `finish_reason=length` e qual item ajustar.
- `industry/prompts/story-digest.md`: a visão geral do fato mudou de estilo: a primeira frase explica a mudança central e a conclusão atual, depois vem o contexto necessário, em parágrafos curtos, sem recontar por data a linha do tempo de baixo, sem comentar a própria matéria e sem fixar o setor. Visões gerais existentes não são reescritas em massa e mudam aos poucos com matérias novas; para reescrever alguns fatos agora, veja a última seção da [avaliação da visão geral](story-digest-evaluation.md) (`rewriteStoryDigest`, uma chamada de modelo por fato).
- Arquivos Compose próprios podem remover `LOCAL_ROUTER_URL`: o pré-aquecimento das imagens de compartilhamento agora reaproveita direto o renderizador do backend, sem requisitar uma porta local fixa, e nenhum código lê mais esse item; o `docker-compose.yml` que vem com o projeto já tirou. Endereço, formato e regras de cache das imagens não mudam.

**Coleta e datas de publicação**:

- **Depois da primeira importação, o acervo das fontes não é mais recolhido**: antes, depois da primeira importação de uma fonte nova, a segunda coleta recolhia todos os itens antigos restantes do feed como histórico, cada um com análise paga (as fontes de exemplo davam mais de mil de uma vez). Agora, as coletas seguintes só recolhem itens publicados a partir de 48 horas antes da primeira importação; itens sem data entram, e contas do X não são afetadas; veja "Matéria velha não inunda a tela" em [Fontes](sources.md#regra-matéria-velha-não-inunda-a-tela). Itens antigos recolhidos antes da atualização ficam arquivados pela data original, fora de "Hoje" e do diário, com a análise já feita; não precisa fazer nada.
- **Material novo sem data de publicação confiável fica fora do ar**: fora das listas públicas, da seleção, dos resumos, de em alta e dos envios, até a data ser lida na fonte ou na página original. Com data desconhecida, a página do artigo, os dados estruturados e o Agent Markdown marcam "hora de entrada", o RSS não escreve `pubDate`, e o OpenAPI informa que, nesse caso, o `publishedAt` da linha do tempo dos fatos e das notas rápidas do diário é a hora de entrada.
- **Horários sem fuso em APIs JSON** (como `2026-09-30 17:43:58`) são lidos pelo `publishedAtUtcOffset` da fonte (padrão deste site: `-03:00`). Antes eram lidos pelo fuso do servidor, que no Docker é UTC.
- **Datas da página do artigo usam o mesmo fuso da fonte**: o complemento de data da página de detalhe e a extração do corpo usam primeiro `detail.publishedAtUtcOffset`, senão o `publishedAtUtcOffset` da fonte, e por fim o padrão (`-03:00` neste site). Vale só para coletas e complementos futuros, sem reescrever em massa datas existentes.
- **Complemento de detalhes**: datas, títulos e resumos que falharam ou passaram do limite da rodada são completados nas coletas seguintes, mantendo o corpo já confirmado; quando a requisição da fonte dá certo mas faltam data, título ou corpo, também há complemento, registrado na saúde da fonte. As regras de detalhe do Jina precisam bater com o formato real devolvido; configurações de início fixo da coleta, seções com data do Intercom e descrições de vídeo estão em [Fontes](sources.md).
- **Páginas de player de vídeo não viram corpo**: vale para todas as fontes; páginas de player do YouTube e do Vimeo deixam de ser coletadas como corpo, e páginas de vídeo do YouTube deixam de ser tratadas como imagem. A descrição de vídeo do RSS fica só como resumo, e texto real fornecido pelo feed é mantido. A atualização não apaga nem reanalisa corpos em massa; registros antigos de vídeo com navegação do player misturada devem ser conferidos um a um, e em "Diagnóstico de conteúdo" no painel dá para marcar o detalhe como só resumo, parando de mostrar o corpo errado.
- **RSS**: feeds de texto cujo resumo se confirma ser o texto completo podem usar `summaryIsBody` (o `summary` do Atom também conta). Episódios de podcast sem página passam a ter como link do original o arquivo de áudio ou vídeo, sem buscar página.
- **Prévia e coleta real usam os mesmos filtros**: "Pré-visualizar coleta" no painel também aplica prefixos de endereço, categorias, palavras de ruído, reescrita de endereço e `publishedAfter`; o que aparece na prévia é o que a coleta real vai guardar.
- **Com a coleta desligada, os ícones das fontes não são mais buscados**: com `COLLECT_ENABLED` diferente de `true`, a tarefa diária das 04:40 que busca ícones também para e não acessa os sites das fontes.
- **Datas históricas verificadas podem ser corrigidas**: o script de operação chama primeiro `previewPublicationDateCorrection` de `admin/content.ts` e depois `correctPublicationDate` com a versão e o valor de verificação da prévia, registrando quem fez e o motivo. Só aceita correções explícitas em que as datas nova e antiga são anteriores à janela de sete dias; mantém revisões do material, seleção e agrupamento, sem rodar modelos de novo. Se o material ou a data mudaram, ou a correção alteraria outras decisões públicas, a operação é recusada e pede nova conferência; não há preenchimento em massa nem interface pública nova.
- **Notas públicas podem ser corrigidas ou anuladas à mão**: o detalhe do conteúdo no painel tem "Pelo modelo", "Anular nota" e "Nota manual". A nota manual aceita 0–100, anular deixa o valor público como `null`, e limpar a substituição volta à nota do modelo guardada. A correção exige motivo e confere a versão, mantém a análise original e o registro de auditoria, e atualiza junto site, API, RSS, Agent Markdown e MCP, sem rodar modelos. Artigos existentes não mudam de nota nem voltam à seleção em massa por causa da atualização.

**Saídas públicas**:

- **Filtro por categoria segue `PUBLIC_CATEGORIES`**: o `category` de API, RSS e MCP pega todas as categorias que contam como aquela na interface pública. Em sites sem fusão de categorias (o padrão), buscar por `tip` não traz mais opinião; setores sem a categoria `tip` também passam na verificação de tipos.
- **Edições antigas ainda precisam ser revalidadas**: data, semana e mês dizem qual edição é, não que o conteúdo nunca muda. A edição mantém o título e o resumo escritos na publicação, e o nome da fonte e a hora da citação seguem os dados públicos atuais; citações retiradas e as introduções e capas que dependiam delas deixam de ser distribuídas. Clientes que guardam cópias das edições devem pedir de novo com `If-None-Match` quando o `Cache-Control` vencer.
- **Sites com cache próprio em Nginx ou CDN devem conferir as regras**: siga o fim de [Domínio e HTTPS](#domínio-e-https) e, ao atualizar, limpe o cache existente de proxy e CDN desses caminhos, inclusive as instruções de conexão `/api/v1/agent` e `/openapi-v1.json`.
- **Falha ao refazer o sitemap não mantém mais o arquivo velho para sempre**: processo, cópia em disco e resposta HTTP compartilham o prazo de cinco minutos; vencido e sem conseguir refazer, devolve `503` com `Retry-After`. O MCP continua com `no-store`; API e conteúdo para agentes revalidam ao vencer.

**Ferramentas e correções**:

- **Avaliação da visão geral**: `scripts/eval-story-digests.ts` exporta fatos reais do banco e roda o prompt atual e o candidato lado a lado no mesmo lote; veja a [avaliação da visão geral](story-digest-evaluation.md). Os três scripts de avaliação compartilham `scripts/eval-tools.ts`; `--n`, `--concurrency` e nomes de modelo errados em `eval-selection.ts` dão erro direto.
- **Migrações não bloqueiam leitura e escrita**: cada arquivo de migração novo tem uma única instrução que pode rodar com o sistema no ar, sem preencher ou reescrever tabelas inteiras, e índices usam `CREATE INDEX CONCURRENTLY IF NOT EXISTS`; a CI verifica com `scripts/check-migrations.ts`. A manutenção de estatísticas é só para tabelas e colunas definidas; regras em [Arquitetura](architecture.md#migrações-do-banco).
- Requisições MCP têm limite de tamanho, e os logs de erro não mostram credenciais.
- A barra lateral do desktop mostra uma barra de rolagem fina quando ampliada.
- Os testes reconhecem as requisições pelo prompt real de cada etapa e leem os limites de `industry/selection.ts`, então trocar de setor e reescrever prompts e limites não gera falso alarme; o teste de arquitetura não depende mais do separador de caminho.

#### Arquivos do site movidos para `site/` (4 de outubro de 2026)

A interface pública não mudou; a versão continua 4.0.0.

- **Os arquivos próprios do site saíram de `industry/` para `site/`**: `site.ts`, `models.ts`, `brand/`, `pages/`, `public/`, `changelog.json`. `industry/` fica só com o conhecimento do setor: `taxonomy.ts`, `topics.json`, `sources.json`, `prompts/`, `selection.ts`. Se você mudou esses arquivos, leve as mudanças para os arquivos de mesmo nome em `site/` ao mesclar.
- **`site.ts` ganhou itens**, todos opcionais: `SITE.github`, `SITE.llmsIntro`, `SITE.rootIcons`, `POLICY.terms.license`, `POLICY.terms.headers`, `ABOUT.termsAnchor` (cartões de QR code aceitam `alias`), além de `ACCESS`, `ADMIN`, `DEPLOYMENT`, `FEED_COPY` e `PUBLIC_CATEGORIES`; explicações em [Adaptar para o seu setor](customize.md). `PUBLIC_CATEGORIES` substitui o `publicAs` da 4.0.0: quem escrevia `publicAs: "tip"` numa categoria passa a escrever em `PUBLIC_CATEGORIES.merge` (a chave é a key da categoria, e o valor é `"tip"`).
- **`DEPLOYMENT.requiredSecrets`** é a lista de credenciais conferidas a mais quando a API de produção sobe, vazia por padrão; as verificações básicas de sessão, assinatura de imagem e login do admin continuam valendo. Só preencha se o seu deploy exige alguma integração opcional configurada.
- **Recursos só do seu site podem virar módulos**: em `modules/<nome>/`, ligados nas listas de `site/modules/`; veja "Módulos" em [Arquitetura](architecture.md). O framework não traz módulos.
- **A página de conexão para agentes abre no MCP por padrão** e lista as três formas: MCP, RSS e API. A interface de Agent Markdown continua em `/api/v1/agent`, acessível por "Instruções para agentes" no pé da página.
- **O proxy de imagens aceita limite de tráfego**: `IMGPROXY_UPSTREAM_MB_PER_MINUTE`, `IMGPROXY_UPSTREAM_GB_PER_DAY` (ou `DEPLOYMENT.imageUpstreamBudget` no `site.ts`), sem limite por padrão.
- **Correções**: os mesmos dados sempre geram os mesmos bytes (empates na ordenação ganham um desempate único, e o ETag de API e RSS não muda à toa); as requisições do site repassadas à api não levam mais cabeçalhos hop-by-hop, e `Connection: close` não faz mais o POST seguinte falhar; o `llms.txt` conta as formas de conexão reais, sem dizer que são quatro.

#### Atualização para a interface pública 4.0.0 (3 de outubro de 2026)

- **Ranking de modelos, monitor de reset do Codex e linha do tempo das páginas de tópico deixaram de fazer parte do framework** e ficam só no AIHOT. Páginas (`/leaderboard`, `/codex-reset`), interfaces (`/api/v1/codex-resets`, `/api/v1/codex-resets/recent`, `/api/v1/agent/codex-resets`) e a ferramenta MCP `<prefixo>_get_codex_resets` foram removidas, e a versão do MCP e do `/openapi-v1.json` subiu para 4.0.0. A migração `0053` apaga as tabelas (`lb_*`, `monitor_*`, `fx_rates`) e configurações delas, e as tarefas agendadas e filas são retiradas sozinhas quando o worker sobe; os registros de execução no painel ficam. Se quiser guardar esses dados, faça backup antes de atualizar. O logo das páginas de tópico de empresa virou a inicial do nome da empresa.
- **O pacote do setor mudou em alguns pontos**; quem mudou `industry/` deve comparar com os arquivos novos ao mesclar:
  - `site.ts` ganhou `topicsTitle`, `feedbackExample`, `keywords`, `since`, `interfaceVersion`, `POLICY` (nome e descrição das páginas de termos e privacidade, e se posts do X contam como texto completo), `ABOUT.description`, `ABOUT.sourcesFallback`, `AGENT`, `REPORTS`, `ALERTS`, `SOURCE_DEFAULTS`, `COMMUNITY_FEEDS` e `CARDS`; os dois cartões de QR code do bloco do autor ganharam `kind`, e `ABOUT.copyright` virou os dois trechos antes e depois do link para a página de feedback.
  - Novo `models.ts`: modelos com nome e qual cada etapa usa por padrão, antes no código.
  - O logo do canto superior esquerdo passou de `apps/web/app/components/Logo.tsx` para `industry/brand/Logo.tsx` (depois foi para `site/`, veja acima).
  - Novo `public/`: `robots.txt` e `manifest.webmanifest` eram gerados no código, e a descrição do OpenAPI ficava em `reference/`; agora são arquivos daqui. O `/.well-known/security.txt`, antes gerado ao preencher `contactEmail`, agora exige um `public/.well-known/security.txt` seu (depois foi para `site/`, veja acima).
  - `features.ts`, `chronicle.ts` e `chronicles/` foram apagados; `orgNames`, `leaderboardProvider` e `chronicleTerms` em `topics.json` não são mais usados e podem sair.
  - As categorias de `taxonomy.ts` aceitam `feedLabel` (o nome no título do RSS por categoria; o site original usava algo como "Modelos de IA"); `ENTITIES` ganhou algumas empresas. Naquela época as categorias também aceitavam `publicAs`, para entrar em outra categoria na interface pública; esse campo foi removido e virou `PUBLIC_CATEGORIES.merge` em `site/site.ts` (veja acima), e escrever `publicAs` falha na verificação de tipos.
- **Limite configurável na interface de envio**: quantos envios por minuto cada cliente pode fazer em `/api/ingest/items` é definido por `INGEST_RATE_LIMIT`; no `docker compose` o padrão é 10, como antes; sem Docker, sem limite por padrão, então, se não houver limite no proxy à frente, defina no `.env`.
- **Variáveis que não são mais usadas**: `ARTIFICIAL_ANALYSIS_API_KEY` e `MONITOR_MODEL` podem sair do `.env`.

#### Atualização para a interface pública 3.0.0 (3 de outubro de 2026)

- **Travas de segurança desligadas por padrão**: `COLLECT_ENABLED` e `MODEL_CALLS_ENABLED` só ligam com `true`; ausentes, ficam desligadas. O `.env` gerado por `scripts/init-env.ts` já tem as duas linhas; num `.env` escrito à mão sem elas, acrescente, senão depois de atualizar não há mais coleta nem chamadas de modelo.
- **As interfaces de semanal e mensal mudaram de forma**: a lista e cada edição de `/api/v1/weeklies` e `/api/v1/monthlies` trazem `periodStart` e `periodEnd`, o corpo virou `sections[]` (cada seção com `label`, `summary` e `items`), sem `title` e `themes`, e o `limit` da lista vai até 60. Programas que leem essas interfaces precisam mudar; a versão do MCP e do `/openapi-v1.json` subiu para 3.0.0.
- **Saídas para máquinas da seleção mostram cada notícia uma vez**: no `mode=selected` da API, nas interfaces de sincronização e no RSS da seleção, a mesma notícia fica só com a matéria representativa, e as outras aparecem como `remove` nas mudanças da sincronização (continuam no `mode=all`). Matérias antigas já selecionadas antes da atualização não são reorganizadas; só se juntam quando a notícia tiver matéria nova publicada.
- **A seleção espera a confirmação de repetidos**: itens com nota suficiente só entram depois que o agrupamento confirma que não repetem uma notícia já selecionada e que trazem informação nova; até lá, ficam só em "Todas as notícias". Se o modelo do agrupamento responder fora do formato, o item fica parado, e a página "Execuções" do painel mostra.
- **Primeira mão depende só do nível**: `T1` é primeira mão, e `first_party` deixou de ser um ajuste à parte; fontes `T1_5` e `T2` antes marcadas à parte como primeira mão deixam de contar, e para contar precisam virar `T1`.
- **O pacote do setor ganhou itens**: `taxonomy.ts` ganhou `RELEASE` e `PLAIN_TERMS`, categorias de opinião levam `commentary: true`, `ENTITIES` aceita `otherNames`, e `CATEGORY_BY_ITEM_TYPE` não é mais usado. Sites já adaptados a outro setor devem completar ao mesclar, seguindo [Adaptar para o seu setor](customize.md).
- **Os tópicos só vêm de `industry/topics.json`**: a migração apaga a tabela `topics` do banco. Tópicos mudados só no banco, sem mudar o arquivo, devem ir para o arquivo antes de atualizar. Tópicos de empresa só olham `entityId`, e `related` não é mais usado.
- **O diário não chama mais modelo**: é montado por regras, semanal e mensal são compilados dos diários, e o modelo só escreve o resumo geral e as introduções das seções; edições já publicadas não são reescritas.
- **Os prompts mudaram**: em `industry/prompts/`, `structure.md`, `group-*.md`, `story-digest.md` e `report-period.md` ganharam outro estilo, `report-daily-lead.md` foi apagado e `report-period-sections.md` foi criado. Quem mudou esses prompts deve levar as próprias mudanças para os novos, comparando.
- **Scripts removidos**: `scripts/delete-sources.ts`, `scripts/regroup-events.ts` e `scripts/enqueue-analysis.ts`. Pause no painel as fontes que não quer; para reavaliar ou reagrupar um item, abra-o em "Diagnóstico de conteúdo" no painel.
- **A sessão do admin fica ligada à forma de login** (migração `0041`): ao atualizar de uma versão sem esse vínculo, sessões antigas sem vínculo precisam fazer login de novo. Bancos que já tinham testado a migração de vínculo de sessão podem atualizar direto, mantendo colunas e vínculos, sem mexer à mão no registro de migrações. As regras seguintes estão em "Sessões do admin e mudanças de configuração" abaixo.
- **Na 3.x, `/agent` abria no Agent Markdown**, e as instruções do MCP ficavam em `/agent?tab=mcp`; a página atual está descrita em "Arquivos do site movidos para `site/`" acima.
- **O grupo de conteúdo do Feishu só recebe a seleção das fontes `T1` e `T1_5`.**

### Backup

Configure `DB_BACKUP_STORE_*` no `.env` (qualquer armazenamento de objetos compatível com S3), e todo dia às 04:10 é feito um backup automático para lá. Os quatro itens `DB_BACKUP_STORE_SECRET_ID`, `DB_BACKUP_STORE_SECRET_KEY`, `DB_BACKUP_STORE_BUCKET` e `DB_BACKUP_STORE_REGION` são obrigatórios; sem `DB_BACKUP_STORE_DOMAIN`, o endereço é montado no padrão do Tencent Cloud COS (`<bucket>.cos.<região>.myqcloud.com`); para outro armazenamento compatível com S3, coloque em `DB_BACKUP_STORE_DOMAIN` o domínio de acesso do bucket (com o nome do bucket, por exemplo `<bucket>.s3.<região>.amazonaws.com` no AWS S3).

Um backup completo tem o `.dump` do banco e o pacote de arquivos `.tar.gz` com o mesmo horário, com nome tirado do nome do banco: no Docker o banco se chama `aihot`, então ficam `aihot-<hora>.dump` e `aihot-files-<hora>.tar.gz`. O pacote guarda `uploads/` e as `feedback-screenshots/` ainda locais, sem o cache de imagens nem a pasta de backup local; se essas pastas estiverem vazias, só há o `.dump`. Imagens já repassadas ao Feishu ficam só como referência externa no banco, e o pacote não guarda as imagens que estão no Feishu.

Cada arquivo é enviado uma vez só, num prefixo: dia 1º vai para `monthly/`, domingo para `weekly/` e os outros dias para `daily/`. Dá para definir no armazenamento prazos de expiração diferentes por prefixo.

Para restaurar, pegue o par de arquivos (se só houver `.dump`, restaure só o banco): restaure o `.dump` num banco vazio com um `pg_restore` compatível com a versão do banco e depois extraia o pacote na raiz da pasta de dados (no Docker, `/data`; sem Docker, `AIHOT_DATA_DIR`, por padrão `.data`), mantendo a estrutura de subpastas e garantindo que o processo consiga ler os arquivos. Restaurar só o banco não recupera capturas de tela de feedback ainda referenciadas como `local:`, e arquivos que não estavam em backups antigos também não podem ser recuperados pela referência no banco.

A exportação manual abaixo só inclui o banco, sem as pastas de anexos citadas:

```bash
docker compose exec -T db pg_dump -U aihot aihot | gzip > myhot-$(date +%F).sql.gz
```

Os dados ficam em três volumes do Docker: `db` (banco), `data` (imagens enviadas, cache de imagens, backup local) e `caddy` (certificados). `docker compose down` não os apaga; `docker compose down -v` apaga.

### Ver os logs

```bash
docker compose logs -f --tail 100 api worker web
```

A página "Execuções" do painel mostra o resultado mais recente de cada tarefa agendada, e a página "Fontes" mostra a situação da coleta de cada fonte.

### Sessões do admin e mudanças de configuração

A sessão fica ligada à senha do admin usada no login. Depois de mudar a senha do admin ou a chave de sessão, reinicie todos os processos da API para que carreguem a mesma configuração nova; editar o arquivo de configuração não significa que os processos em execução já a usam, e processos com código ou configuração antigos misturados não garantem uma revogação uniforme.

Quando a configuração em vigor muda, as sessões deixam de aceitar a autorização da senha antiga; trocar ou remover o `SESSION_SECRET` também invalida as sessões.

Sessões confirmadas como inválidas na autenticação são apagadas, e voltar a configuração antiga não as revive. O sistema não guarda histórico global de mudanças de credenciais: se uma mudança de configuração nunca foi carregada por um processo, ou nunca foi notada por uma verificação de sessão antes de ser desfeita, não dá para revogar sessões retroativamente por ela.

## Quanto custa

- **Modelos**: cada item novo passa uma vez pela triagem; os aprovados recebem duas notas, uma estrutura e um título com resumo, e depois o agrupamento (só chamado quando há matérias parecidas); há ainda a visão geral dos fatos, os resumos gerais do semanal e do mensal e a tradução completa da seleção. Posts do X sem corpo ou só com link não chamam modelos de escrita ou tradução. O diário é montado por regras, sem modelo. No teste local do AIHOT original com as fontes de exemplo, os 152 itens da primeira importação usaram cerca de 930 chamadas de modelo. O uso diário depois disso depende de quantos itens as suas fontes publicam por dia. A página "Modelos e avaliação" do painel mostra o número de chamadas e os tokens de entrada e saída de cada etapa.
- **Coleta paga** (X, contas oficiais do WeChat, Jina): cobrada por requisição, desligada por padrão; só é usada se você preencher a chave.
- Todos os serviços pagos têm limites de chamadas por minuto, hora e dia (painel, "Configurações → Limites de requisições pagas"); passou, pausa, sem estourar a conta da noite para o dia. 0 desliga o serviço na hora.

Para economizar, nesta ordem:

1. Veja primeiro a página "Modelos e avaliação" do painel, que mostra as chamadas e os tokens de entrada e saída de cada etapa, e ataque o que mais pesa.
2. Confirme que o modo de raciocínio está desligado: o raciocínio é cobrado como token de saída, e o `LLM_EXTRA_JSON` no `.env.example` mostra como desligar.
3. Use modelos mais baratos nas etapas de maior volume: no `.env` dá para escolher por etapa (`PREFILTER_MODEL`, `SCORE_MODEL`, `STRUCTURE_MODEL`…), ou mudar na página "Modelos e avaliação". Antes de trocar o modelo de nota, compare no mesmo lote de amostras com `scripts/eval-selection.ts`, para não economizar e escolher mal.
4. Deixe entrar menos material irrelevante: o custo é praticamente proporcional ao número de itens por dia. Em portais de notícias gerais, assine só as seções da sua área, diminua a frequência na página "Fontes" e pause fontes com muito volume e pouca seleção.

## Sem Docker

Precisa de Node.js 24.11 ou mais recente e PostgreSQL 16 ou 17, em Linux ou macOS; no Windows, rode dentro do WSL2 ou use o Docker como acima.

```bash
npm ci
node scripts/init-env.ts --llm-key <sua chave de API do modelo>
createdb myhot
```

Acrescente no `.env`:

```bash
DATABASE_URL=postgres://seu-usuario@127.0.0.1:5432/myhot
API_BASE_URL=http://127.0.0.1:3001
```

E então:

```bash
node --env-file=.env scripts/migrate.ts
node --env-file=.env scripts/seed.ts
npm run build -w @aihot/web

NODE_ENV=production node --env-file=.env apps/api/src/main.ts          # API, porta 3001
NODE_ENV=production node --env-file=.env apps/worker/src/main.ts       # tarefas em segundo plano
cd apps/web && NODE_ENV=production node --env-file=../../.env server.ts   # site, porta 3000
```

Os três processos precisam de `NODE_ENV=production`. Sem ele, api e worker rodam como desenvolvimento: não conferem as chaves de produção e a senha do admin na subida, e o login dispensado por `DEV_AUTH_ROLE` passa a valer.

Os três processos precisam ficar sempre no ar; em produção, use systemd ou pm2 (com `NODE_ENV=production` também na configuração). Ao parar o worker, dê 515 segundos a ele (`TimeoutStopSec=515` no systemd; `kill_timeout: 515000` e `treekill: false` no pm2), cobrindo os 470 segundos de esvaziamento da fila e a limpeza do banco; no systemd, defina também `KillMode=mixed`, para avisar só o processo principal que pare de pegar tarefas e deixar `pg_dump` e `tar` de um backup em andamento terminarem. Chamadas mortas antes da hora ficam com resultado incerto e só são repetidas depois de pelo menos meia hora, quando são liberadas sozinhas.

Para desenvolvimento, com recarga automática: `npm run dev:api`, `npm run dev:worker`, `npm run dev:web`. Para entrar no painel sem login durante o desenvolvimento, defina `DEV_AUTH_ROLE=admin` no `.env` (a produção se recusa a subir assim).
