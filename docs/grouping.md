# Agrupamento em fatos e avaliação das relações

O site primeiro usa título e resumo para buscar fatos candidatos das últimas duas semanas (com serviço de embeddings, compara vetores; sem ele, compara a sobreposição de texto) e depois pede ao modelo para julgar a relação entre as matérias e, ao mesmo tempo, se a matéria traz informação nova em relação ao que já está na seleção (matérias com nota suficiente dependem disso para entrar na seleção; veja [Seleção e calibração](selection.md)). As definições das relações e os prompts que o site usa ficam em `industry/prompts/group-*.md`, e o código começa em `packages/backend/src/events/relate.ts` e `group.ts`.

São quatro relações:

- `SAME_OCCURRENCE`: o mesmo acontecimento real, como o texto oficial de um lançamento e a matéria da imprensa sobre ele.
- `SAME_STORY`: não é o mesmo acontecimento, mas é um desdobramento direto do mesmo fato, como a chegada às lojas, um review ou uma resposta depois do lançamento.
- `UNRELATED`: assuntos diferentes, mesmo com a mesma empresa, produto ou tema.
- `ROUNDUP`: um dos lados é um compilado com vários assuntos.

## Avaliar o julgamento de pares com amostras próprias

`scripts/eval-relations.ts` só avalia o julgamento do modelo sobre a relação entre duas matérias. Ele reaproveita direto o `PAIR_SYSTEM`, o `pairUser()`, o `PairSchema` e a versão do prompt que o site usa ao agrupar; então, se o prompt muda, a avaliação muda junto. Ele não refaz a busca de candidatos nem grava o resultado no agrupamento.

Coloque suas amostras marcadas em `.data/` (essa pasta não vai para o Git). `industry/relation-gold.example.jsonl` traz quatro exemplos fictícios. Uma linha por amostra:

```json
{"caseId":"release-001","a":{"title":"...","source":"...","firstParty":true,"publishedAt":"2026-09-01T09:00:00-03:00","summary":"..."},"b":{"title":"...","source":"...","firstParty":false,"publishedAt":"2026-09-01T09:20:00-03:00","summary":"..."},"samplingContext":{"benchmarkSplit":"development","samplingStratum":"same-release"},"gold":{"relation":"SAME_OCCURRENCE"}}
```

`a` e `b` também aceitam um `frame` opcional, igual ao `ReportView` interno do site:

```json
{"subject":"Acme","action":"lança","object":"Acme-2","occurredAt":"2026-09-01"}
```

Coloque no conjunto de desenvolvimento os casos de fronteira que confundem fácil, e reserve uma parte com `benchmarkSplit: "holdout"` para conferir no fim. `samplingStratum` é um rótulo de grupo opcional para ver em que tipo há erro; não afeta a entrada do modelo.

### Rodar

Configure banco e modelo como num deploy normal e rode:

```bash
node --env-file=.env scripts/eval-relations.ts \
  --gold .data/relation-gold.jsonl \
  --split development
```

Por padrão usa o modelo atual da etapa "Revisão do agrupamento": primeiro o trocado na página "Modelos e avaliação" do painel, depois a variável `GROUP_REVIEW_MODEL`, depois `DEFAULTS.groupReview` em `site/models.ts`, e por fim o modelo padrão. Também dá para comparar explicitamente vários modelos configurados:

```bash
node --env-file=.env scripts/eval-relations.ts \
  --gold .data/relation-gold.jsonl \
  --models default,deepseek-flash \
  --split development \
  --n 200 \
  --seed 7 \
  --thresholds 0.75,0.8
```

Parâmetros:

| Parâmetro | Padrão | O que é |
|---|---:|---|
| `--gold` | `.data/relation-gold.jsonl` | Arquivo de amostras marcadas (JSONL) |
| `--models` | O modelo atual da "Revisão do agrupamento" | Nomes de modelo separados por vírgula |
| `--split` | `all` | `development`, `holdout` ou um grupo seu |
| `--n` | `200` | Máximo de amostras avaliadas |
| `--seed` | `7` | Semente aleatória da amostragem; com a mesma semente, as amostras sorteadas são as mesmas |
| `--concurrency` | `6` | Requisições de modelo simultâneas |
| `--thresholds` | `STORY_REVIEW_MIN_CONFIDENCE,TIE_MIN_CONFIDENCE` de produção | Limites de confiança para decidir que duas matérias "vão para o mesmo fato"; passar o parâmetro substitui o padrão |

O relatório completo vai para `.data/eval/relations-*.json`. Para cada modelo:

- uma tabela 4 × 4: em qual relação o modelo classificou cada relação marcada;
- precisão, revocação, F1 e número de amostras por relação (só amostras com julgamento estruturado);
- `coverage`: a proporção de amostras com julgamento estruturado entre todas as marcadas;
- `accuracy` e o macro-F1 das quatro classes: medem só a qualidade dos julgamentos estruturados obtidos; `completeAccuracy` usa todas as amostras marcadas como denominador e conta falhas de chamada ou respostas fora do formato como não concluídas;
- considerando `SAME_OCCURRENCE` e `SAME_STORY` como "vão para o mesmo fato", precisão, revocação e F1 para cada limite de confiança, junto com `coverage` e `completeAccuracy` do mesmo lote;
- número de chamadas com erro, uso de tokens, tempo médio por requisição e tempo total;
- o julgamento de cada amostra, a confiança, a explicação de diferença escrita pelo modelo (`difference`) e o número do recibo.

As chamadas de modelo passam normalmente pelo recibo e pelo disjuntor de orçamento. Avaliações repetidas com o mesmo modelo, prompt e entrada reaproveitam os recibos existentes; numa mesma execução, amostras com a mesma entrada compartilham o resultado de uma requisição e cada uma conta pela sua marcação; falhas também são compartilhadas, sem repetir a requisição naquela execução. O `reused` do relatório inclui resultados compartilhados (de sucesso ou falha) e recibos de sucesso reaproveitados. Os recibos da avaliação usam um uso próprio, `eval_relation_pair`, e não entram nas estatísticas das etapas de agrupamento do site no painel.

O uso de tokens e o tempo médio somam todas as tentativas de requisição dos recibos citados no relatório, inclusive respostas que antes falharam na leitura; o mesmo recibo não é contado de novo por várias amostras. Ao rodar de novo com resultados existentes, esses usos históricos continuam aparecendo e não representam custo novo.

A CI verifica a leitura do JSONL, a amostragem com semente fixa, as métricas, e a reutilização concorrente e a contagem de uso em novas tentativas com um serviço de modelo falso local, sem acessar serviços externos.
