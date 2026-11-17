# Seleção e calibração

## Como um item vira destaque

1. **Entrada**: o mesmo endereço e o mesmo conteúdo ficam uma vez só. Artigos comuns que só têm título ou resumo têm o corpo buscado conforme a regra da fonte; páginas de vídeo usam o texto já fornecido, sem tratar a página do player como corpo. Material sem data de publicação confiável fica fora do ar até que a data do original seja lida (veja "Matéria velha não inunda a tela" em [Fontes](sources.md#regra-matéria-velha-não-inunda-a-tela)).
2. **Triagem** (`prefilter.md`): o item é do setor ou não. Entra amplo e só barra o claramente fora do tema: itens `BLOCK` não aparecem em nenhuma página pública; `PASS` e os incertos `UNKNOWN` seguem adiante. Artigos comuns só com título, sem corpo, resumo de feed ou texto de post, esperam o material: não recebem nota, não ganham texto escrito a partir do título nem entram no conjunto público; quando o material chega e gera uma nova revisão, são avaliados. Posts originais exibíveis sem texto ou só com link seguem as regras atuais de nota e de exibição como estão.
3. **Nota** (`selection-score.md`): o mesmo critério dá duas notas independentes (0–100). **Soma das duas ≥ 2 × o limite** basta; o limite depende do nível da fonte, e a classe da fonte pode subir o limite de certas fontes oficiais. Quem passa ainda precisa sobreviver à remoção de repetidos da etapa 6 para entrar na seleção. A nota exibida na página é a média das duas (arredondada para baixo).
4. **Estrutura** (`structure.md`): roda junto com a nota. Dá a categoria e as tags (as que aparecem na página), a empresa principal, e diz se o texto é uma notícia específica, uma síntese de vários assuntos, ou se falta material para dizer; se for notícia específica, extrai os fatos (quem, fez o quê, com o quê, quando), com a fonte e as condições no original. Tópicos, agrupamento e resumo diário dependem disso.
5. **Título e resumo**: escritos depois da estrutura. Os selecionados e os quase selecionados (média acima de `understandFloor`) seguem `content-understanding.md`: título em pt-BR, resumo que responde primeiro e motivo para ler; os demais seguem `summarize-*.md`, com título e resumo curtos, e vão para "Todas as notícias". A navegação em "Todas as notícias" (lista do site, API, lista de mais recentes para agentes, o modo tudo do MCP e o RSS de todas as notícias) só mostra itens com média ≥ `browseFloor`; itens ainda sem nota aparecem normalmente; com termo de busca, procura em tudo. Posts do X sem corpo ou só com link mantêm os links, imagens e citações do original, sem chamar modelo de escrita ou tradução e sem gerar texto pedindo "complemente o corpo"; artigos longos do X com corpo real seguem o fluxo normal. Se o texto escrito usar palavras listadas em `industry/wording.ts`, o modelo troca só essas palavras, uma vez (`mend-wording.md`).
6. **Agrupamento e repetidos** (`group-*.md`): matérias de fontes diferentes sobre o mesmo assunto viram um fato; a página do fato tem uma visão geral (`story-digest.md`), e "Em alta" ordena por fato. Antes de mudar o prompt da visão geral, compare o atual com o candidato lado a lado no mesmo lote de fatos com a [avaliação da visão geral](story-digest-evaluation.md). Itens com nota suficiente só entram na seleção depois do agrupamento: o modelo decide ao mesmo tempo se ele é a mesma notícia que uma matéria já selecionada e se traz alguma informação concreta que a seleção ainda não deu.
   - Várias matérias da mesma notícia podem entrar: no site viram um grupo de leitura; API, RSS e endpoints de sincronização mostram cada notícia uma vez, pela matéria representativa: primeiro a oficial de primeira mão; depois a conta oficial verificada (uma conta `T1_5` com `publisherRole` e `owner_entity_id`, quando a empresa é justamente o assunto principal; instituição antes de pessoa); depois as com texto completo, nota mais alta e publicação mais cedo.
   - Itens que não são a mesma notícia, mas não trazem informação nova (apresentar de novo uma capacidade já divulgada com outras palavras, só chegar a outra plataforma, um compilado que só repete pontos já selecionados), não entram na seleção e ficam em "Todas as notícias". Sínteses de vários assuntos não viram fato próprio: ficam ligadas aos fatos que citam e só entram na seleção se trouxerem algo importante que a seleção não cobriu; itens sem material suficiente para dizer de qual notícia se trata não entram.
   - Matérias explicitamente retiradas mantêm o vínculo histórico, mas deixam de participar de buscas de agrupamento futuras, da escolha de representante, do início do fato e da comparação automática de fatos; o mesmo endereço e respostas/citações no X também não podem usá-las como base de identidade. Se o mesmo fato ainda tem matérias válidas, usa-se a válida; se todas foram retiradas, ele não é buscado por enquanto; ao voltar a ser público, pode participar de novo. Registros só com resumo ou ainda não publicados não contam como retirados e mantêm o direito. Relações e julgamentos existentes não são apagados, e não há reagrupamento em massa.
   - Até a confirmação, o item fica só em "Todas as notícias" e não é liberado sozinho, por mais que espere. Se a chamada do modelo falhar ou a resposta vier fora do formato, o item fica parado: depois de 10 minutos de espera há alerta, a página "Execuções" do painel lista esses itens, e em "Diagnóstico de conteúdo" dá para abrir o item e clicar em "Reagrupar". Por isso, o modelo do agrupamento precisa responder no formato de forma estável.
7. **Resumos diário, semanal e mensal**:
   - O **diário** sai todo dia às 08:00 (os horários de diário, semanal e mensal ficam em `EDITION_TIMES` no `site/site.ts`; abaixo, os valores padrão), cobre das 08:00 do dia anterior às 08:00 do dia, é montado por regras e não chama modelo. Um assunto por item, usando a matéria mais confiável da notícia com mais matérias; os outros desdobramentos do mesmo fato no dia vêm embaixo, e sínteses de vários assuntos ficam sob o assunto mais importante que citam. O que saiu nas últimas 7 edições não volta; um fato já noticiado com desdobramento só entra no corpo se a própria parte envolvida fez algo novo (tutoriais, opinião e outros da classe `commentary` não contam) ou se o desdobramento teve 4 ou mais fontes; o resto vai para as notas rápidas. Fatos sem matéria selecionada, mas com post oficial original e 3 ou mais participantes independentes, também entram (só no diário, sem seleção nem envio). A ordem é por importância (maior nota das matérias selecionadas, participantes independentes que falaram dele no dia, se há post oficial original; desdobramentos perdem pontos); os 12 primeiros vão para o corpo, no máximo 2 por fonte, e depois até 10 notas rápidas de uma linha. O primeiro é a manchete, cuja chamada é o próprio título e resumo; do 2º ao 4º são os "Vale ver hoje".
   - O **semanal** (toda segunda às 10:00) e o **mensal** (todo dia 1º às 10:30) são compilados dos diários da semana e do mês: o mesmo fato em dias diferentes conta uma vez, ordenado pela posição que o diário deu a ele (manchete, vale ver, quantos dias saiu), pela cobertura e pela nota; o semanal pega os 20 primeiros e o mensal os 30, divididos nas seções do diário. O modelo (`report-period.md`, `report-period-sections.md`) só escreve o resumo geral e uma frase de introdução para seções com três ou mais itens, sem tirar nem pôr itens; se escrever um nome ou número que não está nos itens (nomes em letras latinas, números com três dígitos ou mais, com casa decimal ou porcentagem, empresas do vocabulário), aquele trecho é descartado: o resumo geral vira uma frase gerada por modelo de texto, e a seção fica sem introdução. Termos comuns do setor (`PLAIN_TERMS` em `taxonomy.ts`) e o nome do site não têm essa restrição.
   - Cada destaque entra em uma edição só: conta pela hora dele; se a confirmação da seleção veio depois, conta pela hora da confirmação; confirmado depois do fechamento, vai para a próxima edição.
   - A verificação roda a cada meia hora: a edição que chegou na hora sai uma vez, e a que já saiu não é reescrita; edições perdidas com o sistema parado ou que falharam são feitas nas verificações seguintes. Se no período do diário houve itens avaliados, mas nenhum fato novo, sai uma edição vazia normalmente; se nenhum item foi avaliado, conta como falha, e a edição faltante gera alerta conforme a [documentação de deploy](deploy.md#atualizar). No período de um semanal ou mensal, se todos os diários esperados existem e todos os itens originais do corpo estão vazios, a edição é pulada: não se escreve semanal ou mensal vazio, não se chama modelo e não se registra como gerada nem como falha; o primeiro período começa a ser verificado a partir do diário mais antigo do site. Se não há itens para compilar porque faltam diários ou porque itens antigos deixaram de poder ser públicos, o erro continua. Pular não grava marca permanente: corrigindo os diários dentro da faixa de reposição atual, a edição pode ser gerada de novo.

Os prompts de todas as etapas ficam em `industry/prompts/`; mudar prompt não exige mudar código. A versão de um prompt é o hash do conteúdo: mudou o prompt, os itens novos seguem a nova versão, e os já avaliados não são recalculados.

## Limites: `industry/selection.ts`

```ts
export const SELECTION = {
  thresholds: { T1: 60, T1_5: 65, T2: 76 },   // a média das duas notas precisa chegar a este número
  classes: {                                  // classes de fonte: o limite dessas fontes não fica abaixo deste número
    ecosystem: { label: "Ecossistema e infraestrutura", threshold: 70 },
    leaderboard: { label: "Rankings e benchmarks", threshold: 76 },
  },
  understandFloor: 50,                        // itens não selecionados com média acima disto também são escritos como os selecionados
  browseFloor: 40,                            // "Todas as notícias" só mostra itens com média a partir disto; a busca não tem limite
};
```

Fontes oficiais de primeira mão (T1) têm limite mais baixo, e imprensa e pessoas (T2) mais alto: no mesmo assunto, o texto oficial merece ser visto primeiro. Níveis sem limite (`EXCLUDE_MP`) não participam da seleção.

O nível só diz se a fonte é oficial e de primeira mão. Algumas fontes oficiais publicam no dia a dia principalmente para desenvolvedores ou para o mercado (chips e nuvem, frameworks e ferramentas, rankings de benchmark…), e o leitor só quer as grandes notícias delas: na página "Fontes" do painel, escolha uma classe para ela, e o limite sobe para no mínimo o da classe. Só sobe, nunca desce; níveis com limite já mais alto não mudam; sem classe, vale só o nível. A chave da classe fica gravada na fonte, então não a renomeie depois do lançamento: uma classe renomeada deixa de valer sem aviso; amostras de avaliação não têm classe e usam o limite do nível.

Com `browseFloor` em `0`, "Todas as notícias" volta a listar todo o material público.

Esses números são os limites que o AIHOT sempre usou em IA, e são rígidos: melhor selecionar menos do que deixar ruído entrar. Trocou de setor ou de critério de nota? Recalibre como explicado abaixo.

## Calibração

### 1. Preparar as amostras

Escolha de 100 a 200 itens das suas fontes, marque um por um "deve entrar / não deve entrar" e salve como `.data/gold.jsonl` (`.data/` não vai para o Git). Uma linha por item:

```json
{"caseId":"tec-001","material":{"title":"Título do original","originalTitle":null,"publishedAt":"2026-10-01T09:00:00-03:00","sourceName":"Nome da fonte","bodyZh":null,"bodyOriginal":"Corpo…"},"sourceFacts":{"sourceKind":"rss","sourceTier":"T1","firstParty":true,"language":"pt"},"samplingContext":{"benchmarkSplit":"development","samplingStratum":"lancamento"},"gold":{"decision":"select"}}
```

| Campo | O que é |
|---|---|
| `caseId` | Identificador único |
| `material` | Título, título original, data de publicação, nome da fonte, corpo (o corpo já no idioma do site vai em `bodyZh`, o original em `bodyOriginal`; basta um) |
| `sourceFacts` | Tipo da fonte, nível, se é de primeira mão (no ar só `T1` conta como primeira mão; marque igual), idioma. O nível decide qual limite vale |
| `samplingContext` | Opcional. `benchmarkSplit` separa o conjunto de desenvolvimento do reservado, e `samplingStratum` é o seu agrupamento (como "lançamento", "review", "propaganda"), para ver em que tipo erra |
| `gold.decision` | `select` deve entrar, `reject` não deve entrar, `either` tanto faz (não conta na acurácia) |

`industry/gold.example.jsonl` traz dois exemplos.

Algumas dicas:

- Coloque bastante **caso difícil**: quase deveria entrar, quase não deveria. Muitos casos óbvios inflam a acurácia.
- Separe uma parte como **conjunto reservado** (`benchmarkSplit: "holdout"`): ajuste o prompt olhando só o conjunto de desenvolvimento e, no fim, confira com o reservado, para não deixar o prompt bom só nessas questões.
- O ideal é que quem marca seja quem vai ler o site, ou alguém com o mesmo gosto.
- A avaliação só roda a triagem e as duas notas, sem a remoção de repetidos da etapa 6: marque pelo próprio item, sem marcar "não deve entrar" só porque outra matéria do mesmo assunto já entrou.

### 2. Rodar a avaliação

```bash
node --env-file=.env scripts/eval-selection.ts --gold .data/gold.jsonl --split development --label "Primeira versão do critério"
```

Roda a triagem e as duas notas em cada amostra, e mostra:

- **Acurácia, precisão, revocação e F1 das saídas válidas**: só as amostras fora de `either` que tiveram decisão de seleção, para medir o acerto quando o modelo responde;
- **Cobertura**: a proporção de amostras com decisão entre todas as amostras marcadas fora de `either`; a **acurácia completa** usa todas as amostras marcadas fora de `either` como denominador e conta falhas do modelo ou respostas fora do formato como não concluídas;
- `either` nunca entra no denominador dessas métricas; o relatório registra à parte as falhas em amostras com decisão e em `either`. O `goldSelectRate` usa todas as amostras marcadas fora de `either`, então o mesmo lote deve dar o mesmo valor para modelos diferentes;
- o resultado para cada limite de 40 a 90, de 2 em 2 (a faixa pode ser mudada em `DEPLOYMENT.selectionGold`, explicado abaixo); a varredura de limites também mostra acurácia das saídas válidas, cobertura e acurácia completa;
- os itens julgados errado: o relatório completo vai para `.data/eval/` e também é importado para o SelectBench do painel (`--no-import` não importa).

Sem `--models`, a avaliação usa o modelo que a etapa "Nota da seleção" usa no ar: primeiro o trocado na página "Modelos e avaliação" do painel, depois a variável `SCORE_MODEL`, depois `DEFAULTS.score` em `site/models.ts`, e por fim o modelo padrão (`LLM_*` no `.env`). `--models default,deepseek-flash` compara vários modelos no mesmo lote. Outros parâmetros úteis: `--n 200` para o máximo de amostras, `--split holdout` para rodar só o conjunto reservado, `--no-import` para não importar no SelectBench. Em `DEPLOYMENT.selectionGold` no `site/site.ts`, defina o arquivo de amostras, a quantidade, qual parte usar e a faixa de limites; depois, rodar sem parâmetros usa essa configuração.

Numa mesma avaliação, quando amostras diferentes geram exatamente a mesma entrada de nota, só a nota do modelo é compartilhada; cada amostra continua contando com sua própria triagem, limite do nível da fonte e marcação. Resultados com falha também são compartilhados naquela execução, para que a primeira rodada e uma nova rodada com resultados existentes cubram as mesmas amostras. Rodar de novo reaproveita os recibos existentes. O uso de tokens e o tempo médio do relatório somam todas as tentativas dos recibos envolvidos, inclusive novas tentativas depois de erro de leitura; ao rodar de novo com resultados existentes, o uso mostrado é o acumulado desses recibos, não o custo novo da rodada.

### 3. Ver os erros, mudar o critério e rodar de novo

No SelectBench do painel, veja um por um os itens julgados errado e o motivo dado pelo modelo:

Ao enviar relatórios de vários modelos, o mesmo `caseId` precisa ter a mesma marcação `gold` em todos os modelos; a `decision` do modelo pode variar. Relatórios com marcações em conflito são recusados antes de gravar, para não haver respostas humanas diferentes para o mesmo item na comparação lado a lado; relatórios sem `cases` por item ainda podem ser importados.

- Deveria entrar e não entrou: em geral o critério não diz por que aquilo é importante. Escreva esse tipo de valor na parte "deve ser avaliado normalmente" de `selection-score.md`, com exemplos.
- Não deveria entrar e entrou: em geral o ruído não foi contido. Escreva na parte "deve ser contido".
- Tudo está frouxo ou rígido demais e os erros têm nota colada no limite: aí ajuste os limites em `industry/selection.ts`.

Mude o critério primeiro e os limites depois: o limite só move tudo junto e não resolve "que tipo está errando". Rode a cada mudança; o SelectBench mostra a comparação de cada versão. Ao comparar modelos, não olhe só o F1 das saídas válidas: se a cobertura for bem diferente, veja também a acurácia completa; um modelo com nota alta que muitas vezes não consegue concluir a avaliação estruturada não deve ter as falhas "escondidas" do denominador.

## Trocar de modelo

A página "Modelos e avaliação" do painel mostra qual modelo cada etapa usa agora, a taxa de sucesso recente, o tempo e o uso de tokens, e permite trocar direto (só afeta tarefas novas). Antes de trocar o modelo de nota, compare no mesmo lote de amostras com `--models`.
