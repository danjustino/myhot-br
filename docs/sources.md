# Fontes

As fontes são gerenciadas na página "Fontes" do painel: criar, testar uma coleta para ver o que vem, mudar a frequência, ligar e desligar, ver o motivo das falhas e os itens recentes. Na primeira execução, as fontes de exemplo de `industry/sources.json` são importadas.

## Seis tipos de fonte

| Tipo | Serve para | Precisa de |
|---|---|---|
| `rss` | Blogs, veículos, Substack e serviços que convertem contas em RSS, com RSS / Atom | Nada |
| `web_list` | Páginas de listagem sem RSS (página de notícias, lista do blog, changelog) | Escrever seletores; se precisar, configurar a renderização do Jina Reader (cobrada por uso) |
| `json_list` | APIs que devolvem JSON (GitHub Releases etc.) | Escrever os caminhos dos campos |
| `x_search` | Contas do X (Twitter) | Chave da SocialData, cobrada por requisição |
| `mp_account` | Contas oficiais do WeChat | Chave da Dajiala, cobrada por requisição |
| `external` | Conteúdo enviado pelos seus próprios scripts | `INGEST_TOKEN`; veja abaixo |

O endereço ou a configuração de `json_list` pode levar credenciais, então só segue redirecionamentos para a mesma origem (mesmo protocolo, host e porta). Se a API mudar de origem, atualize o endereço da fonte; não dependa de redirecionamento entre origens para levar a autenticação.

Por padrão, a coleta não acessa endereços da rede interna. Se o endereço do feed ou da lista aponta para um serviço próprio na rede interna (por exemplo um RSSHub na mesma rede Docker, com endereço `http://rsshub:1200/...`), defina no `.env` `PRIVATE_FEED_HOSTS=rsshub` (nomes de host completos separados por vírgula, sem diferenciar maiúsculas) e reinicie a API e o worker. A liberação vale só para o `feedUrl` do `rss` e para o próprio `url` de `web_list` e `json_list`; esses hosts são acessados direto, sem passar pelo `EGRESS_PROXY_URL`. Redirecionamentos para outros hosts, corpo dos artigos, páginas de detalhe, imagens e ícones continuam recusando endereços internos, e endereços link-local e de metadados de nuvem (`169.254.0.0/16`, `100.100.100.200` etc.) são recusados sempre.

Os itens de configuração aceitos por cada tipo estão em [`config-keys.ts`](../packages/backend/src/sources/config-keys.ts). Um item desconhecido faz o salvamento ser recusado e a coleta falhar direto, com o motivo no painel, sem voltar em silêncio para a leitura genérica.

## Primeiro pré-visualizar, depois criar

Entre em `/admin/sources/new`, preencha o ID e o nome, escolha o tipo e cole em "Configuração da coleta (JSON)" o JSON da [próxima seção](#como-configurar-cada-tipo). O que vai ali é o objeto de configuração, sem envolver em `kind` ou `config`. Trocar o tipo apaga a configuração, então escolha o tipo antes de colar.

Observações entre parênteses de largura total no nome (por exemplo "Veículo（RSS de destaques）") são só para o painel; o leitor vê o nome sem a observação no site, RSS, Agent Markdown, MCP e busca. Contas do X escritas como `X：Nome (@handle)` aparecem para o leitor só com o nome. O JSON da API pública continua com o nome completo.

`rss`, `web_list`, `json_list` e `x_search` têm o botão "Pré-visualizar coleta": mostra o total de itens e, dos 20 primeiros, título, link do original, data de publicação e resumo, sem gravar nada no acervo. Confira se veio artigo e não navegação e se as datas batem com o original, e então clique em "Criar". A prévia aplica os mesmos filtros da coleta real (prefixos de endereço, categorias, palavras de ruído, reescrita de endereço, `publishedAfter`), então mostra exatamente o que a coleta real recolheria; mas não equivale a uma coleta de produção completa e não passa pelo complemento de detalhes, pela seleção nem pela publicação.

A prévia faz requisições de verdade; prévias de X e Jina podem gerar custo e passam pelo recibo pago e pelo orçamento. `COLLECT_ENABLED=false` só desliga a coleta automática em segundo plano e não garante que a prévia manual deixe de acessar serviços externos. Os exemplos locais de HTML/JSON abaixo não precisam de chave de API.

## Como configurar cada tipo

### rss

```json
{ "feedUrl": "https://example.com/feed.xml" }
```

Opcionais: `summaryIsBody` (quando se confirma que o resumo do feed é o texto completo, usa o `description` do RSS ou o `summary` do Atom como corpo, sem buscar a página original) e `allowCategories` / `denyCategories` (filtram pelas categorias do feed).

Páginas de player do YouTube e do Vimeo nunca são extraídas como corpo de artigo, em nenhuma fonte. A descrição do vídeo no Media RSS fica como resumo e, mesmo com `summaryIsBody`, não vira legenda do vídeo; texto real que o feed entregue em `content` / `content:encoded` continua valendo. Vídeos embutidos em outros artigos não afetam a leitura do corpo do artigo.

Vídeos nativos no corpo do artigo mantêm o endereço de mídia seguro e os formatos alternativos, com reprodução manual pelos controles do navegador. O arquivo de vídeo é carregado direto do site original pelo navegador, e a capa usa o proxy de imagens; sem reprodução automática nem repetição, e com pré-carregamento `none`, embora o navegador não garanta zero requisições antes da interação. Players sem endereço de mídia e sem capa utilizável ficam só com o texto alternativo. O Markdown e o RSS de texto completo com republicação permitida mantêm a estrutura do vídeo, e a reprodução depende do leitor; players dinâmicos de plataformas e iframes ficam de fora.

Gráficos SVG embutidos nas ilustrações do artigo não são mantidos como imagem (as cores e fontes dependem das folhas de estilo do site original); no lugar, entra como texto simples a descrição acessível que o site original escreveu para a imagem (`aria-label`, o texto apontado por `aria-labelledby`, ou `<title>` e `<desc>` dentro do gráfico); se a mesma imagem tiver versões larga e estreita, fica só uma, e textos já visíveis na ilustração (legenda, subtítulo) não se repetem. Imagens sem descrição e ícones SVG fora das ilustrações continuam sendo removidos.

Episódios de podcast sem página (sem `<link>`, e com `guid` que não é endereço) usam como link do original o arquivo de áudio ou vídeo, que o navegador consegue tocar direto; esses episódios não buscam página e são tratados pelo texto do feed.

### web_list

Aceita seletores CSS comuns, e listas de `div` também funcionam. O essencial é que `itemSelector` selecione **cada notícia**, e não o contêiner que envolve todas. Por exemplo:

```html
<div class="news-list">
  <div class="news-item">
    <h2><a href="/posts/first">Primeira notícia de exemplo</a></h2>
    <time datetime="2026-10-01T09:00:00-03:00">1º de outubro</time>
  </div>
  <div class="news-item">
    <h2><a href="/posts/second">Segunda notícia de exemplo</a></h2>
    <time datetime="2026-10-01T10:00:00-03:00">1º de outubro</time>
  </div>
</div>
```

A configuração correspondente (`example.com` é um endereço de exemplo; troque pela página de verdade; a versão que roda está no [exemplo local](#exemplo-local-com-htmljson)):

```json
{
  "url": "https://example.com/news",
  "parseMode": "html",
  "itemSelector": ".news-list > .news-item",
  "linkSelector": "h2 a",
  "titleSelector": "h2 a",
  "publishedAtSelector": "time",
  "allowUrlPrefixes": ["https://example.com/posts/"]
}
```

- `itemSelector` procura os itens na página inteira; `linkSelector` e `titleSelector` pegam o primeiro nó correspondente dentro de cada item, e também podem corresponder ao próprio item. Escolher `.news-list` dá um contêiner só, e em geral só a primeira notícia sai; escrever só `div` mistura contêineres aninhados. Selecione o nó que se repete a cada notícia.
- O link vem do `href`; links relativos como `/posts/first` são resolvidos pelo endereço final da lista depois dos redirecionamentos, ou por `baseUrl`. O título é o texto do nó. Links repetidos são unidos; se numa lista em Markdown aparece primeiro um botão como "Read more" e depois o título de verdade, fica o título de verdade. Links que apontam para a própria lista geralmente são pulados.
- A data é buscada em `publishedAtSelector` dentro do item, tentando na ordem os atributos `datetime`, `content` e `title` e o texto; textos que não dão para ler como data não escondem uma data válida no mesmo nó. Datas e horas sem fuso usam `publishedAtUtcOffset` (padrão `-03:00`, horário de Brasília); horários com fuso mantêm o fuso original, e um `YYYY-MM-DD` puro é lido como meia-noite UTC. Meses incompletos, números de versão de produto e dias que não existem no calendário não viram data de publicação.
- `parseMode`: páginas comuns usam `html` por padrão; `markdown` lê links em Markdown; `docusaurus_changelog` lê títulos de changelog; `intercom_changelog` lê títulos e corpo pelas seções com data da central de ajuda do Intercom, cada seção com sua âncora no endereço, por padrão no dia do calendário UTC, ou com `publishedAtUtcOffset`. Para usar o Jina, escreva explicitamente o `url` como `https://r.jina.ai/https://site-alvo/caminho` e configure `JINA_API_KEY`; não há troca automática quando a coleta falha. O Jina devolve Markdown por padrão; para continuar com seletores CSS, defina `parseMode: "html"`.
- `detail`: quando a lista não tem data, título ou resumo, busca a página de detalhe para completar (`publishedAtSelector`, `titleSelector`, `summarySelector` etc.). `maxFetches` é o máximo de páginas de detalhe lidas por rodada; sem ele é 0, ou seja, nenhuma: cada página lida é mais uma requisição, então a fonte precisa declarar. Itens com falha de leitura ou que ficaram de fora porque o `maxFetches` da rodada acabou são completados nas coletas seguintes; ao completar metadados, o corpo já confirmado é mantido. Um título de verdade já existente não volta a ser o texto do botão só porque a lista ainda diz "Read the Blog", nem é relido só por ser comprido. Para forçar o título da página de detalhe, use `titleAuthoritative: true`. Quando a página de detalhe ou a extração do corpo trazem horário sem fuso, usa-se primeiro `detail.publishedAtUtcOffset`, senão o `publishedAtUtcOffset` da fonte, e sem nenhum dos dois, `-03:00`. Listas RSS e JSON também aceitam `detail`.
- Em listas via Jina, `detail.titleRegex` e `publishedAtRegex` buscam no texto do Jina e podem reaproveitar a mesma resposta de detalhe; seletores CSS leem o HTML do site original. Escolha a regra conforme a página que realmente dá para ler.
- `allowUrlPrefixes` / `denyUrlPrefixes`: recolhem só artigos de certos caminhos.

### json_list

Supondo que a API devolva a estrutura abaixo, `itemsPath` aponta para o array, e os outros caminhos são relativos a **cada elemento** do array. Os caminhos são separados por ponto; não é JSONPath, então não use `$` nem `[*]`.

```json
{
  "data": {
    "items": [
      {
        "id": "first",
        "title": "Primeira notícia de exemplo",
        "url": "https://example.com/posts/first",
        "summary": "Resumo da primeira notícia.",
        "published_at": "2026-10-01T09:00:00-03:00"
      }
    ]
  }
}
```

A configuração correspondente:

```json
{
  "url": "https://example.com/api/news",
  "mode": "json_api",
  "itemsPath": "data.items",
  "titlePaths": ["title"],
  "urlTemplate": "{raw:url}",
  "summaryPaths": ["summary"],
  "publishedAtPath": "published_at",
  "externalIdPath": "id"
}
```

- Se a API já devolve um array, omita `itemsPath`. `titlePaths`, `summaryPaths` e `authorPaths` são listas de caminhos candidatos, usando na ordem o primeiro valor não vazio, por exemplo `["title", "name"]`.
- Com o endereço completo, use `{raw:url}`; só com o slug, dá para usar `https://example.com/posts/{slug}`. `{caminho}` codifica o valor do campo e `{raw:caminho}` insere como está. A lista JSON não completa endereços relativos sozinha; o modelo precisa gerar um endereço HTTP(S) completo.
- `summaryIsBody`: quando se confirma que o resumo da API é o texto completo, use `true` para tratar o texto de `summaryPaths` como corpo, sem buscar a página original.
- O ideal é a data vir como texto ISO com fuso; horários sem fuso como `2026-09-30 17:43:58` são lidos, como na lista de páginas, pelo `publishedAtUtcOffset` (padrão `-03:00`); timestamps numéricos usam `publishedAtUnit: "epoch_s"` (segundos) ou `"epoch_ms"` (milissegundos), e datas como `20261001` usam `"yyyymmdd"`.
- Itens sem título ou sem como gerar o link são pulados. Se todo um array não vazio falhar no mapeamento, aparece `no items mapped (check title/url paths)`; se o caminho não for um array, aparece `items path did not resolve to an array`.

### Exemplo local com HTML/JSON

O repositório traz dois exemplos fictícios, [news.html](examples/sources/news.html) e [news.json](examples/sources/news.json), cada um com duas notícias. Servem para conferir seletores e mapeamento de campos, não são fontes de verdade; os links dos artigos de exemplo não têm corpo.

Na raiz do repositório, com Node.js 24.11 ou mais recente, rode o comando abaixo. O servidor escuta só na própria máquina e só entrega esses dois arquivos; pare com `Ctrl+C`.

```bash
node --input-type=module -e '
import http from "node:http";
import { readFileSync } from "node:fs";
const files = {
  "/news.html": ["text/html; charset=utf-8", readFileSync("docs/examples/sources/news.html")],
  "/news.json": ["application/json", readFileSync("docs/examples/sources/news.json")]
};
http.createServer((req, res) => {
  const file = files[req.url];
  res.writeHead(file ? 200 : 404, { "content-type": file ? file[0] : "text/plain" });
  res.end(file ? file[1] : "Not found");
}).listen(8787, "127.0.0.1");'
```

Na mesma máquina, prepare o banco como no [deploy sem Docker](deploy.md#sem-docker) e rode a API e o site de desenvolvimento com `npm run dev:api` e `npm run dev:web`, com as chaves de coleta, modelo, Feishu e IndexNow desligadas e sem subir o worker. Só para este exemplo local, defina `ALLOW_PRIVATE_NETWORK_FETCH=true` no processo da API de desenvolvimento e reinicie; por padrão a coleta em endereços internos é proibida, a produção se recusa a ligar essa opção, e você deve removê-la depois de testar. Se a API está num contêiner ou em outro servidor, `127.0.0.1` aponta para ela mesma, e o endereço deste comando não serve para esse deploy.

Escolha `web_list` e depois `json_list`, cole a configuração e clique em "Pré-visualizar coleta", sem precisar criar a fonte:

```json
{
  "url": "http://127.0.0.1:8787/news.html",
  "parseMode": "html",
  "itemSelector": ".news-list > .news-item",
  "linkSelector": "h2 a",
  "titleSelector": "h2 a",
  "publishedAtSelector": "time",
  "allowUrlPrefixes": ["http://127.0.0.1:8787/posts/"]
}
```

```json
{
  "url": "http://127.0.0.1:8787/news.json",
  "mode": "json_api",
  "itemsPath": "data.items",
  "titlePaths": ["title"],
  "urlTemplate": "http://127.0.0.1:8787/posts/{id}",
  "summaryPaths": ["summary"],
  "publishedAtPath": "published_at",
  "externalIdPath": "id"
}
```

Nas duas vezes devem aparecer **2 itens**, na ordem da tabela abaixo. O exemplo JSON também mostra o resumo; o HTML não configura extração de resumo. As datas da API de prévia são UTC, e o painel mostra 09:00 e 10:00 no horário de Brasília.

| Título | Link do original | publishedAt da API de prévia |
|---|---|---|
| Primeira notícia de exemplo | `http://127.0.0.1:8787/posts/first` | `2026-10-01T12:00:00.000Z` |
| Segunda notícia de exemplo | `http://127.0.0.1:8787/posts/second` | `2026-10-01T13:00:00.000Z` |

Para comparar, mude por um momento o `itemSelector` do HTML para `.news-list`: só a primeira volta. Voltando para `.news-list > .news-item`, voltam as duas; essa é a diferença entre "o contêiner da lista" e "cada notícia".

Ao coletar uma página real, veja primeiro se os nós das notícias estão na resposta HTTP bruta. O modo HTML comum não executa JavaScript; conteúdo que aparece no navegador mas não na resposta não surge trocando o seletor CSS. Procure antes um RSS ou uma API JSON, ou configure o Jina ou uma coleta externa sua. `no items matched (html)` também pode ser seletor que não corresponde, falta de `href` ou de título, ou link barrado pelas regras de prefixo; confira a resposta e a configuração antes de trocar de coletor.

### x_search

Esse tipo usa a busca da SocialData; não é colocar a URL do perfil do X numa lista de páginas. Para `https://x.com/SomeAccount`, use o nome de usuário `SomeAccount`, sem `@` e sem a URL inteira:

```json
{ "query": "from:SomeAccount -filter:replies", "searchType": "Latest" }
```

`SomeAccount` é um nome de exemplo; troque pela conta real que quer acompanhar. `-filter:replies` exclui respostas, e `Latest` busca o mais recente.

Configure `SOCIALDATA_API_KEY` no `.env` do ambiente do backend e reinicie a API (prévia) e o worker (coleta agendada); não coloque a chave no JSON da fonte nem no repositório. Antes, confira a cota da SocialData no painel em "Configurações → Limites de requisições pagas" e só então faça a prévia. Sem a chave, aparece `SOCIALDATA_API_KEY is not configured`; se o serviço recusar ou o disjuntor de orçamento disparar, veja o motivo no painel. A prévia pode ter requisições pagas; este texto não exige testar com o serviço real, e o resultado depende da conta e da resposta do serviço no momento.

Na coleta automática de produção, contas comuns são juntadas numa só busca (até umas vinte e poucas contas por vez) para economizar requisições; a prévia manual de uma fonte não é uma coleta juntada.

### mp_account

```json
{ "ghid": "gh_xxxxxxxx", "nickname": "Nome da conta oficial" }
```

Cada conta oficial do WeChat é verificada no seu intervalo de coleta (a consulta da lista é cobrada por uso), e o corpo dos artigos novos vem junto.

Precisa de `DAJIALA_KEY` no `.env` do backend, e `ghid` é o ID original da conta. Use os campos `ghid` / `nickname` como acima, não `biz` / `name`. Hoje `mp_account` não tem "Pré-visualizar coleta"; `external` também não tem teste ativo de coleta e se conecta pela interface de envio abaixo.

## Nível, forma de participação e texto completo

- **Nível** `tier`: `T1` oficial de primeira mão (site oficial, blog oficial, instituição), `T1_5` contas oficiais e criadores semioficiais, `T2` imprensa e pessoas, `EXCLUDE_MP` não participa da seleção. O limite para entrar depende do nível (`industry/selection.ts`).
- **Classe da fonte** (opcional): fontes oficiais que publicam no dia a dia sobretudo para desenvolvedores ou para o mercado podem receber uma classe na página "Fontes" do painel (`classes` em `industry/selection.ts`), e o limite sobe para no mínimo o da classe; veja [Seleção e calibração](selection.md#limites-industryselectionts). `industry/sources.json` não traz esse item; defina no painel depois de importar.
- **Forma de participação** `participation_mode`: `editorial` entra na seleção e em todas as notícias; `hot_signal` não aparece sozinho e serve só como evidência de popularidade, do "que todo mundo está comentando"; `isolated` não aparece em nenhuma página pública.
- **Primeira mão**: só `T1` conta como primeira mão, sem ajuste à parte. Quando a mesma notícia tem várias matérias, a representativa é preferencialmente a de primeira mão, e a página do fato também mostra primeiro as de primeira mão.
- **Publicador** (opcional, dentro de `config`):
  - `publisherUrlPrefixes`: prefixos dos endereços dos artigos da própria fonte `T1`, como `["https://example.com/blog/"]`. Artigos com esses endereços trazidos por outras fontes (agregadores, republicações) passam para o nome dela quando dá para atribuí-los a uma única fonte oficial. Em fontes de lista de páginas, sem isso vale o caminho onde fica a própria lista (e o artigo também precisa ter aparecido nessa lista).
  - `publisherRole`: o papel de uma conta `T1_5`, `organization` (conta oficial da instituição) ou `person` (pessoa oficial). Preenchendo também o `owner_entity_id` da fonte (o id em `ENTITIES` de `industry/taxonomy.ts`), as notícias dessa conta cujo assunto principal é essa empresa podem ser a matéria representativa (depois de `T1`).
- **Texto completo**: `site_fulltext` decide se o site pode mostrar o texto completo, e `syndicate_fulltext` se o RSS de texto completo pode levar o corpo. **Os dois vêm desligados**, mostrando só o resumo e o link do original; ligue quando a fonte permitir explicitamente. Conteúdo de contas oficiais e atrás de paywall não ganha exibição completa só porque tecnicamente dá para coletar.

## Frequência de coleta

Cada fonte tem seu intervalo de coleta. Todo dia às 04:20 ele é ajustado pela produção dos últimos 7 dias: quem produz mais é coletado com mais frequência, no mínimo a cada 15 minutos (listas de páginas lidas via Jina, no mínimo 60 minutos); no máximo, 60 minutos para fontes comuns, 120 minutos para contas do X e listas via Jina, e 180 minutos para as que só servem de evidência de popularidade. Contas do X em busca juntada seguem o ritmo da busca: a cada meia hora as que entram na seleção, a cada hora as que só servem de evidência de popularidade.

Uma coleta com falha não avança a posição, e a próxima continua do mesmo ponto; fontes com falhas seguidas ficam em vermelho no painel, e toda segunda-feira sai um relatório semanal das fontes no grupo de operação (se os alertas do Feishu estiverem configurados).

"Sem conteúdo novo há 7 dias" é julgado pelo **ritmo da própria fonte**, não por uma janela fixa: os resumos diário e semanal dividem em dois tipos. As que **passaram do próprio ritmo** vêm primeiro e devem ser conferidas no site original (os **dias de produção** dos últimos 90 dias são reduzidos a "dias" únicos, e a mediana do intervalo entre dias vizinhos é o ritmo; é preciso ter ao menos 4 desses dias para haver ritmo, e o silêncio precisa passar de 4 vezes a mediana para contar). O dia de produção é a data de publicação do item; se a página não traz data, vale o dia em que o encontramos; **uma primeira importação conta como um dia**: é uma entrega única, por mais longe no passado que as datas cheguem (senão uma fonte que nunca produziu pareceria pontual, e uma primeira importação de vários meses esticaria a mediana e esconderia uma fonte já parada). A janela só conta os dias de produção desses 90 dias, porque histórico mais antigo não diz com que frequência ela publica hoje; data de descoberta e de publicação não têm ordem fixa, basta uma delas cair na janela, e o dia de produção é limitado à janela de novo. **As de ritmo indeterminado continuam listadas**, sem contar como defeito, em dois casos: não há produção comparável na janela (produziu, mas tudo fora dela) ou nunca chegou conteúdo (aí é problema de coleta); as que estão dentro do próprio ritmo não aparecem. O intervalo de coleta `interval_minutes` não entra no julgamento: ele diz de quanto em quanto tempo olhamos, não de quanto em quanto tempo ela publica.

## Regra: matéria velha não inunda a tela

Material que, quando encontrado pela primeira vez, já tinha sido publicado há mais de 48 horas, o acervo da primeira importação de uma fonte nova e os envios marcados como retroativos vão todos para o arquivo pela data original: não entram em "Hoje" e não geram envio de notificação. Material sem data de publicação confiável fica fora do ar (fora das listas públicas, da seleção, dos resumos, de em alta e dos envios) até a data ser lida na fonte ou na página original. A regra vale para todas as entradas e impede que uma importação de conteúdo antigo inunde a tela de uma vez.

Na primeira importação de uma fonte nova, só entram os primeiros `_aihot.initialBackfillLimit` itens da lista (padrão 30) dentro de `_aihot.initialBackfillMonths` meses (padrão 12). Coletas seguintes só recolhem itens publicados a partir de 48 horas antes da primeira importação da fonte; o acervo mais antigo da lista não entra, e você não paga para arquivar o feed inteiro; itens publicados depois da primeira importação entram em qualquer posição de uma lista longa. Itens sem data na lista entram e esperam a data, como na regra acima. Contas do X leem a partir da posição da coleta e não têm essa limitação.

Para começar a acompanhar só a partir de um momento fixo, defina `publishedAfter` na configuração de RSS, lista de páginas ou JSON, por exemplo `"2026-10-01T00:00:00.000Z"`. Precisa ser um horário UTC completo (os milissegundos são opcionais); prévia, primeira coleta e coletas seguintes só aceitam itens **estritamente posteriores** a ele e com data de publicação confiável, e itens sem data também ficam de fora. Se as atualizações de uma página única no dia do início continuarem usando a mesma data de publicação, o conteúdo acrescentado depois também não entra; leve essa limitação em conta ao escolher o início.

## Interface de envio externo

O conteúdo coletado por scripts seus pode ser enviado ao site e passa pelos mesmos duplicados, seleção e agrupamento da coleta normal.

```
POST /api/ingest/items
Authorization: Bearer <INGEST_TOKEN>
Content-Type: application/json

{
  "sourceId": "my-crawler",
  "sourceName": "Meu script de coleta",
  "items": [
    { "title": "obrigatório", "url": "obrigatório", "publishedAt": "2026-10-01T08:00:00-03:00", "author": "opcional" }
  ]
}
```

- `INGEST_TOKEN` é definido no `.env`, com pelo menos 16 caracteres; sem ele, a interface sempre devolve 401.
- No máximo 50 itens por vez; acima disso, 413. Quantos envios por minuto cada cliente pode fazer é definido por `INGEST_RATE_LIMIT`: no `docker compose` o padrão é 10, e acima disso vem 429 (com `Retry-After: 60`); sem Docker, o padrão é sem limite, então, se não houver limite no proxy reverso à frente, defina no `.env` (0 significa sem limite).
- Devolve `{"ok": true, "created": <itens novos>}`. Itens que não são objeto JSON, ou sem título ou endereço, são pulados, e endereços repetidos na mesma requisição só contam a primeira vez.
- Se o `sourceId` não existe, uma fonte `external` é criada automaticamente, fora das páginas públicas por padrão: mude a forma de participação dela para `editorial` no painel para aparecer no site.
- Com a fonte pausada no painel, a interface devolve 409 e não recebe artigos novos; retomando a fonte, os envios voltam a ser aceitos.
- Itens com `raw._aihot.backfill` igual a `true` são tratados como envio retroativo (não entram em "Hoje" e não geram notificação).
