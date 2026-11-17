// Palavras que este site não usa no texto para o leitor; cada item é a forma a procurar e como trocar (por exemplo [/bomb[áa]stico|chocante/iu, "sem exagero: diga direto o que aconteceu"]).
// Depois que a etapa de escrita produz título, resumo e motivo para ler, cada um é verificado; se usar alguma, o modelo troca só esses trechos, uma vez (mendWording em packages/backend/src/editorial/
// analyze.ts). Liste só formas óbvias: na dúvida, não liste, senão palavras normais serão trocadas por engano. Vazio, nada é verificado.

export const READER_WORDING: ReadonlyArray<readonly [RegExp, string]> = [];
