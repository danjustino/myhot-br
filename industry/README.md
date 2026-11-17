# Pacote do setor

Todo o conhecimento do setor fica aqui: categorias, temas, fontes, critérios e limites da seleção. Para trocar de setor, basicamente se mexe nesta pasta e em [`site/`](../site/) (nome do site, textos, marca e páginas). O passo a passo está em [Adapte ao seu setor](../docs/customize.md).

| Arquivo | Conteúdo |
|---|---|
| `taxonomy.ts` | Categorias, tags, empresas e instituições, a lista de nomes que impede o modelo de errar empresas e o tipo de lançamento que mais importa neste setor (`RELEASE`) |
| `topics.json` | Diretório de temas (`/topics`), lido quando o site inicia |
| `sources.json` | Fontes de exemplo importadas na primeira inicialização |
| `prompts/` | Os prompts de cada etapa: pré-filtro, nota, redação, estruturação, agrupamento, resumo de evento, resumo semanal e mensal, tradução |
| `selection.ts` | Limites para entrar na seleção |
| `gold.example.jsonl` | Exemplo de formato das amostras de avaliação da seleção |
| `relation-gold.example.jsonl` | Exemplo de formato das amostras de avaliação da relação entre eventos |
| `story-digest-eval.example.jsonl` | Exemplo de formato dos casos de avaliação do resumo de evento |
