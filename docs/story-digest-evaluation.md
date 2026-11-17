# Avaliação do prompt da visão geral dos fatos

A visão geral na página do fato é gerada por `industry/prompts/story-digest.md`. Antes de mudar esse prompt, rode o atual e o candidato lado a lado no mesmo lote de fatos e compare à mão, em vez de julgar pela impressão da página.

## 1. Preparar os casos

```bash
node --env-file=.env scripts/eval-story-digests.ts --stories <id-do-fato>,<id-do-fato> --out .data/story-digest-cases.jsonl
```

O id do fato é o trecho do endereço `/story/<id>` da página. A exportação só lê o banco: não chama modelo e não muda fato nenhum. As matérias são escolhidas pelas mesmas regras que o site usa para gerar a visão geral, sem contar as que só citam o fato de passagem, as sínteses, as retiradas e as ainda não públicas. Fatos que já têm visão geral são montados como "reescrita depois de correção" (sem a versão anterior), e os que ainda não têm, como primeira escrita. Fatos não encontrados, já mesclados ou sem matérias utilizáveis dão erro direto.

O arquivo exportado tem um fato por linha e pode ser revisado antes. Para testar a atualização incremental quando chegam matérias novas, mude `inputMode` para `incremental` e preencha `story.previousDigest` e `knownArticleIds` (os ids das matérias que a versão anterior já incluía). Também dá para escrever casos à mão; o formato está em `industry/story-digest-eval.example.jsonl` (exemplo fictício).

## 2. Comparar lado a lado

```bash
node --env-file=.env scripts/eval-story-digests.ts --cases .data/story-digest-cases.jsonl --system meu-candidato.md
```

- Cada caso roda uma vez com o prompt atual e uma com o candidato: o mesmo modelo (por padrão o que a etapa "Visão geral do fato" usa agora; `--models` escolhe outro) e a mesma entrada. O prompt de sistema, a entrada e os parâmetros de amostragem enviados ao modelo são exatamente os que o site usa ao gerar a visão geral.
- O arquivo candidato segue o mesmo formato de `industry/prompts/`: `{{siteName}}` vira o nome do site e `{{> nome-do-arquivo}}` insere regras compartilhadas; valores faltando dão erro. Se o candidato renderizado for idêntico ao atual, a execução é recusada. Sem `--system`, só o prompt atual roda.
- Antes de começar, mostra o número de chamadas (casos × modelos × prompts); se passar de `--max-calls` (padrão 18), nenhuma é enviada. Cada chamada é registrada e conta no orçamento como as outras requisições de modelo do site; repetir sem mudanças reaproveita os resultados já recebidos, sem pagar de novo. Então, ao mudar o candidato e rodar de novo, a metade do prompt atual não custa nada.

O resultado vai para `.data/eval/` (`--out-dir` muda o local), em um JSON e um Markdown: títulos e visões gerais dos dois lados lado a lado, com o uso de tokens e o número de registro de cada chamada, e o motivo das chamadas que falharam.

## 3. O que olhar à mão

Não há nota automática confiável, e esta ferramenta também não deixa um modelo dar nota a outro. Veja item por item:

- se explica primeiro a mudança central e a conclusão atual, em vez de recontar por data a linha do tempo que está logo abaixo;
- se há tom vago de propaganda ou clichês;
- se condições, a quem se aplica, preço e cotas, região e outras limitações continuam ligadas ao objeto certo;
- se há conteúdo que não está nas matérias nem nas evidências dos fatos, se comenta a própria matéria ("a matéria não informou…") ou se escreve as regras de escrita no texto;
- na reescrita depois de correção, se as afirmações antigas que deixaram de valer foram removidas.

## 4. Depois de mudar o prompt

Trocar a versão do prompt não reescreve sozinho as visões gerais existentes. Um fato só é gerado de novo quando as matérias dele mudam, e com matéria nova a visão geral antiga serve de versão anterior para a reescrita incremental; assim o prompt novo passa a valer aos poucos, com as matérias novas, sem gerar muitas chamadas de modelo de uma vez.

Para reescrever alguns fatos agora com o prompt novo, chame `rewriteStoryDigest` na raiz do repositório (uma chamada de modelo por fato, registrada na auditoria do painel):

```bash
node --env-file=.env --input-type=module -e '
const { rewriteStoryDigest } = await import("@aihot/backend/events/corrections");
const { sql } = await import("@aihot/backend/db");
const [s] = await sql`SELECT id FROM stories WHERE public_id = ${"<id-do-fato>"}`;
if (!s) throw new Error("Não existe fato com esse id");
console.log(await rewriteStoryDigest(s.id, "Prompt da visão geral atualizado", "ops-script"));
await sql.end();'
```
