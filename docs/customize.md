# Adaptar para o seu setor

Por padrão este repositório é um site de exemplo de **tecnologia geral para o público brasileiro**: as fontes de exemplo são veículos de tecnologia brasileiros, e o critério de seleção foi adaptado do AIHOT, que o calibrou por muito tempo para notícias de IA. Para transformar o site em "notícias de direito", "notícias de RH" ou "notícias de agronegócio", quase tudo o que muda fica em duas pastas: [`site/`](../site/) (nome, textos, marca e páginas deste site) e [`industry/`](../industry/) (categorias, fontes, prompts e limites do setor). O código quase não muda.

Se você usa um agente como Claude Code ou Codex, pode mandar o texto abaixo direto para ele e depois responder às perguntas que ele fizer:

```text
Leia o AGENTS.md e o docs/customize.md e transforme este site num site de notícias do setor "XX".
O que me importa: … (as fontes que quero acompanhar, o que considero notícia importante e o que não é; quanto mais específico, melhor).
No fim, rode npm run typecheck, npm test e node scripts/smoke.ts e me diga o que ainda preciso decidir.
```

Abaixo está, em ordem, o que ele (ou você) precisa fazer.

## 1. Nome e textos: `site/site.ts`

Cada exportação e campo de [`site/site.ts`](../site/site.ts) tem um comentário ao lado (onde é usado, se pode ficar vazio, o que o padrão significa); é só ir de cima para baixo seguindo os comentários. Depois, reconstrua (`docker compose up -d --build`) para valer no front e no back. Só estes pontos envolvem outros arquivos ou cuidado depois do lançamento:

- **O endereço do site não fica no `site.ts`**: no deploy, defina a variável de ambiente `SITE_URL` (`SITE.defaultUrl` é só o valor local quando `SITE_URL` não existe).
- **Nomes que mudam juntos**: ao mudar `SITE.name`, mude também `SITE.organization.name` (dados estruturados para buscadores); em `SITE.crawlerName`, ponha a sua própria identificação de robô, sem usar o nome de outro site.
- **Identificadores que não mudam depois do lançamento ou de alguém se conectar**: `SITE.mcpPrefix` (prefixo das ferramentas MCP), `PUBLIC_CATEGORIES` (fusão e renomeação de categorias nas interfaces públicas e feeds) e `ABOUT.termsAnchor` (âncora que outros sites podem ter fixado); `SITE.interfaceVersion` só sobe, e sobe a versão principal quando um campo público existente muda de forma ou significado.
- **Horários de publicação em hora cheia ou meia hora**: `EDITION_TIMES` (`HH:mm` no horário de Brasília) é verificado pelo agendamento a cada meia hora; a janela do resumo diário, o alerta de edição faltando e todos os textos com horário leem dele.
- **O que a navegação pode esconder**: `NAV.hidden` aceita por enquanto só `"/hot"` e `"/topics"` (cuida junto da barra lateral, da barra inferior, da página "Meu", dos links de voltar, das trilhas de navegação e, ao esconder `"/hot"`, da faixa de em alta na página inicial e das posições na página do fato; o endereço continua acessível diretamente).
- **O aviso de limite de acesso precisa ser verdadeiro**: só preencha `ACCESS.ratePerMinute` se o proxy reverso à frente realmente limita por IP.

## 2. Categorias, tags e tópicos: `industry/taxonomy.ts`, `industry/topics.json`

[`industry/taxonomy.ts`](../industry/taxonomy.ts) define as categorias (`CATEGORIES`), a contagem de lançamentos de destaque do cabeçalho (`RELEASE`), termos comuns dispensados de checagem no resumo geral (`PLAIN_TERMS`), os tipos de conteúdo (`ITEM_TYPES`), o vocabulário de tags e sinônimos (`CATEGORY_TAGS`, `TOPIC_TAGS`, `ENTITY_TAGS`, `TAG_SYNONYMS`) e o cadastro de empresas e o dicionário contra atribuição errada (`ENTITIES`, `IDENTITY_LEXICON`, `PUBLISHER_DOMAINS`, `IDENTITY_CONTEXT_ALIASES`). O significado de cada campo está nos comentários do arquivo; ao mudar, preste atenção nestes vínculos:

- **A `key` que vai na URL não muda depois do lançamento**: a `key` de `CATEGORIES` entra nas URLs e nos endereços de feed (`/all?category=`, `/feed/category/<key>.xml`). Para que uma categoria seja publicada junto com outra na API pública, no RSS e no MCP (continuando separada no site), configure `PUBLIC_CATEGORIES` em `site/site.ts`.
- **Sincronize com os prompts**: se mudar `CATEGORIES`, o vocabulário de tags ou `ITEM_TYPES`, ajuste também `industry/prompts/structure.md` (regras de categoria e de tags), `content-understanding.md` (lista de tipos de conteúdo) e `selection-score.md` (tabela de pesos das cinco dimensões por tipo de conteúdo).
- **Pode esvaziar se não precisar da proteção contra atribuição errada**: `IDENTITY_LEXICON`, `PUBLISHER_DOMAINS` e `IDENTITY_CONTEXT_ALIASES` garantem que a empresa citada no título e no resumo aparece no original; se o seu setor não precisa disso, use a lista vazia `[]`.
- **`industry/topics.json`** (diretório de tópicos `/topics`): lido quando o site sobe; depois de mudar, reconstrua (`docker compose up -d --build`). Tem três grupos, `company` (empresas e instituições), `field` (áreas) e `genre` (formatos de conteúdo); o `slug` não muda depois do lançamento:
  - Tópicos `company` usam `entityId` (o id em `ENTITIES`) para reunir matérias cujo assunto principal é aquela empresa; quando uma matéria tem várias empresas como assunto, só conta se o título citar o nome dela. `aliases` é opcional: buscar só esse termo na caixa de busca também encontra as matérias da empresa.
  - Tópicos `field` e `genre` usam `tags` para reunir as matérias com essas tags.

## 3. Fontes: `industry/sources.json`

São as fontes de exemplo importadas na primeira execução; as que já existem não são sobrescritas. Nas execuções seguintes, só entram as que estão no arquivo e ainda não estão no banco; apagar do arquivo não apaga do banco (pause no painel as que não quiser). Depois do lançamento, o mais prático é a página "Fontes" do painel: criar, testar a coleta, ajustar a frequência, pausar e ver o motivo das falhas.

Os campos principais de cada fonte:

| Campo | Significado |
|---|---|
| `kind` | `rss`, `web_list` (página de listagem, com seletores), `json_list` (API JSON), `x_search` (conta do X, precisa de SocialData), `mp_account` (conta oficial do WeChat, precisa de Dajiala), `external` (envio externo) |
| `config` | A configuração de cada tipo; veja [Fontes](sources.md) |
| `tier` | Nível da fonte: `T1` oficial de primeira mão, `T1_5` contas oficiais e semioficiais, `T2` imprensa e pessoas, `EXCLUDE_MP` não participa da seleção. Cada nível tem um limite diferente para entrar. `T1` já é "primeira mão", não precisa marcar à parte |
| `owner_entity_id` | Opcional: a qual empresa a fonte pertence (o id em `ENTITIES`). Várias fontes da mesma empresa contam como um só participante na popularidade; uma conta oficial `T1_5` que deve servir de matéria representativa também precisa disso (veja [Fontes](sources.md)) |
| `participation_mode` | `editorial` entra na seleção e em todas as notícias; `hot_signal` serve só como evidência de popularidade; `isolated` não aparece em nenhuma página pública |
| `site_fulltext` | Se o site pode mostrar o texto completo. **Desligado por padrão**: mostra só o resumo e o link do original. Ligue apenas quando a fonte permitir explicitamente |
| `syndicate_fulltext` | Se o RSS de texto completo pode levar o corpo. **Desligado por padrão**; só vale quando o site também mostra o texto completo, e só deve ser ligado quando a fonte permitir explicitamente a republicação |

## 4. Critério de seleção: `industry/prompts/`

É a etapa que mais vale o seu tempo: o seu conhecimento do setor entra aqui.

| Arquivo | Para que serve |
|---|---|
| `prefilter.md` | Triagem: o item é do setor ou não. Recolhe amplo e só barra o claramente fora do tema |
| `selection-score.md` | **Critério de nota**: de 0 a 100. Traz os tipos de conteúdo, as cinco dimensões, os pesos por tipo, os valores que precisam ser avaliados normalmente e o ruído que precisa ser contido |
| `content-understanding.md` | Como escrever os itens selecionados e os quase selecionados: título em pt-BR, resumo que responde primeiro, motivo para ler (também sugere tags, mas as categorias e tags da página vêm de `structure.md`) |
| `rules-domain.md` | Regras de tradução e de manter termos do setor (o exemplo é de tecnologia: nomes de produtos e marcas ficam no original…) |
| `mend-wording.md` | Ajuste de palavras: quando título, resumo ou motivo para ler usam palavras listadas em `industry/wording.ts`, o modelo troca só essas palavras |
| `summarize-*.md` | Como escrever título e resumo dos demais conteúdos |
| `structure.md` | Categoria, tags, empresa principal, se é uma notícia específica ou um texto de síntese sobre vários assuntos, e os fatos da notícia (quem, fez o quê, com o quê, com a fonte no original e as condições). As categorias e tags da página, os tópicos, o agrupamento e o resumo diário dependem dele |
| `group-*.md` | Agrupamento: se duas matérias tratam do mesmo acontecimento, de um desdobramento do mesmo fato ou de dois assuntos; e se a matéria traz informação nova em relação ao que já está na seleção (sem novidade, não entra) |
| `story-digest.md` | A visão geral na página do fato (antes de mudar, compare versões lado a lado com a [avaliação da visão geral](story-digest-evaluation.md)) |
| `report-period.md`, `report-period-sections.md` | O resumo geral e as introduções das seções dos resumos semanal e mensal (o diário é montado por regras, sem prompt) |
| `translate-*.md` | Tradução do texto completo |

Se o seu site tem palavras que não devem aparecer no texto para o leitor (exageros, regionalismos, jargão que o leitor não entende), coloque-as em `industry/wording.ts`: cada item é uma expressão regular e a forma de trocar. Depois de escrever título, resumo e motivo para ler, cada um é verificado; se usar alguma, o modelo troca só essas palavras, uma vez (etapa "Ajuste de palavras"; a variável `WORDING_MODEL` escolhe um modelo à parte). Se depois do ajuste algum número mudar, o título ou resumo ficar vazio, ou o serviço de modelo se recusar a reescrever, o texto original é mantido. Com a lista vazia, nada é verificado, não há chamadas extras e essa etapa não aparece no alerta de recusa do serviço de modelo.

Nos prompts, `{{siteName}}` é o nome do site e `{{> nome-do-arquivo}}` inclui outro prompt. Mudar um prompt não exige mudar código.

**Sugestão**: mantenha primeiro a estrutura (cinco dimensões ponderadas, regras de supressão de ruído, limites de segurança) e troque só os exemplos do que "é importante" e do que "é ruído" pelos do seu setor. No setor jurídico, por exemplo, "lei nova publicada, decisão importante, punição de órgão regulador" deve ser avaliada normalmente, e "publieditorial de escritório, propaganda de curso" deve ser contida.

## 5. Limites e calibração: `industry/selection.ts`

A soma das duas notas precisa ser ≥ 2 × o limite para passar (e quem passa ainda precisa sobreviver à remoção de repetidos no agrupamento; veja [Seleção e calibração](selection.md)). Os limites padrão (T1 60, T1_5 65, T2 76) foram calibrados pelo AIHOT para notícias de IA e ainda não foram recalibrados para tecnologia geral BR. `classes` são categorias de fonte que sobem o limite (no original, "ecossistema e infraestrutura" e "rankings de avaliação" do setor de IA; ao trocar de setor, use as suas categorias ou deixe vazio), e `browseFloor` é a nota mínima para aparecer em "Todas as notícias" (padrão 40). Ao trocar de setor e de prompts, recalibre:

1. Escolha de 100 a 200 itens das suas fontes, marque você mesmo "deve entrar / não deve entrar" e salve como `.data/gold.jsonl` (formato em [Seleção e calibração](selection.md); `industry/gold.example.jsonl` traz dois exemplos).
2. Rode `node --env-file=.env scripts/eval-selection.ts --gold .data/gold.jsonl` e veja acurácia, precisão, revocação e os resultados com limites diferentes.
3. No SelectBench do painel, veja um por um os itens julgados errado, volte e ajuste o prompt de nota ou os limites, e rode de novo.

É esta etapa que decide se o seu site "escolhe bem".

## 6. Marca: `site/brand/`

- `logo.svg`, `icon.png` (512), `icon-192.png`, `apple-icon.png` (180), `favicon.ico`: ícones do site.
- `Logo.tsx`: a marca no canto superior esquerdo do site, por padrão escrita com o nome do site; se tiver um logo próprio, troque `Wordmark` pelo seu SVG, mantendo os parâmetros.
- `wordmark.svg`, `wordmark-dark.svg` (opcionais): a marca nas imagens de compartilhamento e nos pôsteres; a versão escura vai nas imagens escuras. Sem eles, usa o nome do site em texto.
- Fontes das imagens de compartilhamento (opcional, em `assets/og-fonts/`): as imagens usam um subconjunto da Noto Sans SC (GB2312 + latim básico), então chinês tradicional, kanji japonês, kana, coreano e letras latinas com acento podem não sair. Como textos em português têm acentos, vale colocar uma fonte com latim estendido como `<nome>-400.ttf` e `<nome>-700.ttf`: os caracteres que faltam são buscados nessas fontes, em ordem de nome de arquivo. Ao trocar a fonte, reinicie o serviço; o cache das imagens é renovado junto. Sem isso, nada muda.
- `nameplates/`: as palavras do cabeçalho no topo das páginas dos resumos diário, semanal e mensal. Depois de trocar os termos do setor, gere de novo:
  ```bash
  npm pack @fontsource/noto-sans-sc@5.3.0 && tar xzf fontsource-noto-sans-sc-5.3.0.tgz
  node scripts/nameplates.ts package
  ```
- QR codes da página "Sobre": primeiro escreva o bloco do autor em `ABOUT.maker` no `site.ts`, com os cartões `wechat` e `feishu` (título e descrição); depois envie as imagens no painel em "Configurações → QR codes da página Sobre", ou coloque-as em `site/brand/contact/` com nome começando por `qr-wechat` ou `qr-feishu`, em png, jpg ou webp. Se faltar o bloco do autor, o cartão ou a imagem, aquele QR code não aparece.

Não use o nome nem o logo do AIHOT.

Na página "Meu", o leitor pode trocar a fonte de "Fonte padrão" para "Fonte padrão do navegador". Essa opção usa a fonte padrão configurada no navegador do leitor para o texto comum, formulários e textos dos gráficos dinâmicos; código continua em fonte monoespaçada, e logo, cabeçalhos e imagens de compartilhamento continuam com a marca do site. A escolha fica salva só naquele navegador. O backup versão 1 da página de salvos ganhou o campo opcional `font`; backups antigos continuam importáveis, e importar não sobrescreve a fonte do navegador que o leitor já escolheu.

## 7. Textos das páginas: `site/pages/`, `site/public/`, `site/changelog.json`

- `pages/terms.md`, `pages/privacy.md`: termos de uso e política de privacidade. **Hoje são modelos**: reescreva conforme a sua situação antes do lançamento e, se necessário, peça para um profissional revisar (no Brasil, observe a LGPD).
- `public/`: os quatro arquivos fixos da raiz do site, publicados depois de trocar os marcadores: `robots.txt`, `manifest.webmanifest` (nome e ícone quando instalado na tela do celular), `openapi-v1.json` (descrição da API pública) e o opcional `.well-known/security.txt` (contato para segurança). Só esses quatro são publicados; outros arquivos colocados ali não aparecem no site, e os que faltam dão 404. Os arquivos aceitam estes marcadores: `{{siteName}}`, `{{siteUrl}}`, `{{description}}`, `{{tagline}}`, `{{locale}}`, os horários `{{dailyTime}}`, `{{weeklyTime}}`, `{{monthlyTime}}`, a versão da interface pública `{{version}}` e as categorias públicas separadas por vírgula `{{categoryList}}`; em arquivos JSON, `"{{categories}}"` dentro de listas `enum` ou `examples` vira a lista de keys das categorias públicas.
- `changelog.json`: o histórico de mudanças. Vem com um exemplo "Site no ar"; antes do lançamento, mude `date`, `time` e `latestVersion` para a data e hora do seu lançamento. A menção ao framework no texto do exemplo ("O site foi montado com o framework de código aberto AIHOT") pode ficar ou sair. Entradas novas vão no início, e `latestVersion` passa a ser a data e hora delas. `kind` é um de "Novidade", "Melhoria", "Aviso" ou "Desativado"; o que o leitor precisa ver de qualquer jeito leva `"urgent": true` (vermelho, marcado como "Importante").

## 8. Modelos e deploy

- Modelos: `LLM_BASE_URL`, `LLM_API_KEY` e `LLM_MODEL` no `.env`; qualquer API compatível com a da OpenAI serve, e todas as etapas usam esse modelo por padrão. `site/models.ts` lista modelos com nome (cada um com seu endereço e variáveis de chave) e qual cada etapa usa por padrão; no deploy, ainda dá para trocar etapa por etapa pelas variáveis de ambiente (veja `.env.example`) ou na página "Modelos e avaliação" do painel. Com um modelo de raciocínio (que pensa antes de responder), reserve a cota de raciocínio: `LLM_REASONING_TOKENS` para o modelo padrão e `reasoningTokens` no `site/models.ts` para modelos com nome; sem isso, o raciocínio consome toda a cota de saída da etapa, a resposta sai vazia e toda chamada falha. Predefinições de nota também aceitam `scoreCall: { temperature, maxTokens, timeoutMs }`, para temperatura, cota de saída e tempo limite em milissegundos; a predefinição de exemplo já define esses valores. O `fallbackFor` de um modelo reserva indica, pelo nome da capacidade, qual modelo principal ele substitui; avalie essa combinação com os seus próprios dados antes. O site de exemplo não traz combinação reserva.
- Deploy: veja [Deploy](deploy.md).

## Verificar depois de mudar

```bash
npm run typecheck
DATABASE_URL=postgres://…/myhot_test npm test     # o nome do banco precisa terminar em _test ou _ci, e a conta precisa poder criar bancos
npm run build -w @aihot/web && npm run test:web
node scripts/smoke.ts --base http://localhost:3000   # com o site no ar
```

Reescrever prompts ou recalibrar limites não faz os testes falharem: os testes reconhecem as requisições pelo prompt efetivamente gerado em cada etapa, e os limites vêm de `industry/selection.ts`. Alguns testes em `tests/` usam as categorias, tags e empresas do setor de exemplo (como `dispositivos`, "Lançamento de aparelho", Samsung). Se mudar `industry/taxonomy.ts`, esses testes vão falhar; basta trocar os exemplos pelos equivalentes do seu setor, sem mudar a regra testada.

Depois, abra o site e dê uma olhada na página inicial, em todas as notícias, no resumo diário, nos tópicos e na página "Sobre"; e confira na página "Fontes" do painel se todas as fontes foram coletadas com sucesso.
