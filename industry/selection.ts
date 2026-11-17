// Limites da seleção. O critério de nota fica em prompts/selection-score.md; aqui só se decide "quanto é preciso para entrar".
// Cada item recebe duas notas independentes do modelo de nota (0–100), e só vira candidato à seleção se a soma das duas for ≥ 2 × o limite;
// confirmada a identidade da notícia e o valor novo, as regras de publicação decidem a exibição (veja docs/selection.md), e o cartão mostra a média das duas.
// O limite depende do nível da fonte: fontes oficiais de primeira mão têm limite mais baixo, imprensa e pessoas mais alto; a classe da fonte ainda sobe o limite de certas fontes oficiais.
// Mudou o limite ou o prompt de nota? Rode de novo scripts/eval-selection.ts nas suas amostras marcadas antes de colocar no ar (veja docs/selection.md).

export const SELECTION = {
  /**
   * Nível da fonte → limite para entrar (média). O nível de cada fonte é definido em "Fontes" no painel:
   *   T1 oficial de primeira mão (site oficial, blog oficial, instituição) · T1_5 contas oficiais, criadores semioficiais · T2 imprensa e pessoas
   * O nível EXCLUDE_MP e níveis não listados aqui não recebem nota de seleção (só entram em "Todas as notícias").
   */
  thresholds: { T1: 60, T1_5: 65, T2: 76 } as Record<string, number>,
  /**
   * Classe da fonte → limite mínimo. O nível só diz se a fonte é oficial e de primeira mão; algumas fontes oficiais publicam no dia a dia sobretudo para desenvolvedores ou para o mercado,
   * e o leitor só quer as grandes notícias delas; então, em "Fontes" no painel, dê uma classe a ela, e o limite sobe para no mínimo o número daqui.
   * Só sobe, nunca desce: níveis com limite já mais alto (imprensa) não mudam. Fontes sem classe usam só o nível.
   *   ecosystem Ecossistema e infraestrutura: chips e hardware, inferência e nuvem, hospedagem de modelos, frameworks e ferramentas de desenvolvimento, empresas de pesquisa em segurança, blogs de engenharia e de desenvolvedores
   *   leaderboard Rankings e benchmarks: instituições que medem e classificam modelos e produtos
   */
  classes: {
    ecosystem: { label: "Ecossistema e infraestrutura", threshold: 70 },
    leaderboard: { label: "Rankings e benchmarks", threshold: 76 },
  } as Record<string, { label: string; threshold: number }>,
  /**
   * Itens que não entraram, mas têm média acima deste número, também são escritos como a seleção (compreensão do conteúdo: título, resumo, motivo para ler);
   * os demais usam a etapa mais barata de "título, resumo e tradução".
   */
  understandFloor: 50,
  /**
   * A navegação em "Todas as notícias" (lista do site, modo tudo da API e do RSS) só mostra itens com média a partir deste número; itens ainda sem nota aparecem normalmente;
   * a busca continua cobrindo tudo. Abaixo de 40 ficam sobretudo repasses e enxurradas de contas de notícias (no original, mais de um terço de todas as notícias), e a seleção nunca recebeu nada abaixo de 60.
   */
  browseFloor: 40,
} as const;
