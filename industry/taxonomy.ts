// Taxonomia do nicho (tecnologia em geral, público brasileiro): categorias, vocabulário de tags, empresas e o
// dicionário de identidade que impede o modelo de atribuir uma notícia à empresa errada.
// O modelo marca tags com este vocabulário, os tópicos (topics.json) agrupam por tag e a barra de filtros agrupa por categoria.
// A key de cada categoria aparece na URL (/all?category=…): depois de publicar o site, não mude. Tags e empresas podem mudar à vontade.

/**
 * Categorias do site (barra de filtros, selo do card, RSS por categoria). A key é a identidade na URL e na API.
 * section é o título da seção no resumo diário (várias categorias podem dividir uma seção, na ordem daqui); guide diz ao
 * modelo de estrutura o que entra em cada categoria e onde fica a fronteira com as vizinhas (o princípio geral está em prompts/structure.md).
 * commentary marca as categorias de comentário (dicas, análises): um assunto já coberto pelo resumo diário que volta só em
 * forma de comentário ocupa uma linha de "rápidas" (a não ser que muitas fontes falem dele).
 * Itens sem categoria vão para a seção da categoria de key "mercado" no resumo diário (veja reports/edition.ts).
 * tagColor é a cor da etiqueta no card enviado ao Feishu (nome de cor do text_tag do Feishu).
 * feedLabel é o nome no título do RSS por categoria (sem ele, usa label).
 */
export const CATEGORIES = [
  { key: "dispositivos", tagColor: "indigo", label: "Dispositivos", section: "Lançamentos e aparelhos", guide: "Celulares, tablets, notebooks, PCs, relógios e pulseiras, fones, TVs e componentes (chips, processadores, placas de vídeo): lançamentos, especificações oficiais, preço e chegada ao Brasil, recalls e defeitos. Vazamento de aparelho ainda não anunciado também entra aqui. Jogos e consoles vão para games; o software do aparelho, para software." },
  { key: "software", tagColor: "turquoise", label: "Apps e software", section: "Apps, sistemas e serviços", guide: "Sistemas operacionais (Android, iOS, Windows, macOS), aplicativos, redes sociais, streaming, serviços online e recursos novos: lançamentos, atualizações, mudanças de preço ou de regras de uso. Produto de IA vai para ia; app que é jogo vai para games." },
  { key: "ia", tagColor: "violet", label: "IA", section: "Inteligência artificial", guide: "Modelos de IA (lançamentos, versões, preço, desempenho em testes) e produtos cujo centro é a IA (assistentes, chatbots, geradores de imagem, vídeo e voz). Um recurso de IA dentro de um aparelho vai para dispositivos se o assunto principal é o aparelho." },
  { key: "games", tagColor: "green", label: "Games", section: "Games", guide: "Consoles, jogos, lançamentos e datas, atualizações, serviços de assinatura (Game Pass, PS Plus), eventos e a indústria de games (estúdios, demissões, aquisições do setor)." },
  { key: "mercado", tagColor: "orange", label: "Mercado", section: "Mercado e negócios", guide: "Fatos já ocorridos no mundo das empresas de tecnologia: resultados financeiros, aquisições, investimentos, demissões, mudanças de executivos, parcerias, processos na justiça, regulação (Anatel, governo, União Europeia), ataques hackers, vazamentos de dados e incidentes de segurança. Notícia anunciada pela própria empresa num post opinativo continua sendo notícia." },
  { key: "ciencia", tagColor: "wathet", label: "Ciência", section: "Ciência e espaço", guide: "Pesquisas científicas, descobertas, estudos acadêmicos, missões espaciais, astronomia, energia e saúde ligadas à tecnologia. Teste de produto não é pesquisa: vai para analises." },
  { key: "dicas", tagColor: "lime", label: "Dicas", section: "Dicas e análises", guide: "Tutoriais, passo a passo, truques, configurações e guias de compra que o leitor pode seguir. Só anunciar um produto não é dica.", commentary: true },
  { key: "analises", tagColor: "purple", label: "Análises", section: "Dicas e análises", guide: "Reviews, testes práticos, comparativos, opinião, análise e entrevistas: o centro é a avaliação ou o ponto de vista do autor. Discutir o mercado não vira mercado automaticamente; autor famoso não vira análise automaticamente.", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; tagColor: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

/**
 * O tipo de lançamento que mais interessa ao nicho: conta o número no cabeçalho do resumo diário ("N novos aparelhos")
 * e na revisão de relatórios já publicados quando a categoria muda. Categoria e tag precisam bater; unit vem depois do número.
 */
export const RELEASE: { category: string; tag: string; unit: string } | null = { category: "dispositivos", tag: "Lançamento de aparelho", unit: "novos aparelhos" };

/** Termos gerais do nicho que a abertura do semanal/mensal pode usar sem precisar de fonte (minúsculas). O nome do site já entra. */
export const PLAIN_TERMS: readonly string[] = ["ia", "ai", "api", "app", "apps", "pc", "pcs", "gpu", "cpu", "ceo", "5g", "tv", "ios", "android", "games"];

/**
 * Tipo de conteúdo que a etapa de compreensão atribui a cada item (definido em prompts/content-understanding.md; mudou aqui, mude lá).
 * O prompt de pontuação (prompts/selection-score.md) dá pesos diferentes às cinco dimensões conforme o tipo.
 */
export const ITEM_TYPES = ["device_launch", "product_launch", "tool_or_tip", "research_paper", "industry_event", "opinion_analysis", "review_explainer"] as const;

// ── Vocabulário de tags ─────────────────────────────────────────────────────────────────

/** A primeira tag de cada item precisa ser uma destas "tags de categoria". */
export const CATEGORY_TAGS = [
  "Lançamento de aparelho", "Atualização de software", "Novo app/serviço", "IA", "Games", "Preço/promoção", "Vazamento/rumor",
  "Review/teste", "Tutorial/dica", "Mercado/negócios", "Regulação/justiça", "Segurança/privacidade", "Ciência/espaço", "Opinião/análise",
  "Outros",
] as const;

/** Tags de tema opcionais. */
export const TOPIC_TAGS = [
  "Smartphones", "Tablets", "Notebooks", "PCs/hardware", "Chips", "Wearables", "TV/streaming", "Áudio", "Casa inteligente", "Carros elétricos",
  "Consoles", "PC gaming", "Jogos mobile", "Redes sociais", "Sistemas operacionais", "IA generativa", "Internet/5G", "Espaço",
] as const;

/** Tags de entidade opcionais (empresas e plataformas). */
export const ENTITY_TAGS = ["Apple", "Samsung", "Google", "Microsoft", "Xiaomi", "Motorola", "Meta", "Amazon", "Nintendo", "Sony", "OpenAI", "NVIDIA", "Intel", "AMD", "Qualcomm", "Tesla"] as const;

/** Sinônimos que o modelo costuma escrever, trocados pela forma do vocabulário. */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  lançamento: "Lançamento de aparelho", aparelho: "Lançamento de aparelho", hardware: "PCs/hardware",
  atualização: "Atualização de software", update: "Atualização de software", software: "Atualização de software",
  app: "Novo app/serviço", aplicativo: "Novo app/serviço", serviço: "Novo app/serviço",
  "inteligência artificial": "IA", ai: "IA", jogos: "Games", jogo: "Games", gaming: "Games",
  preço: "Preço/promoção", promoção: "Preço/promoção", oferta: "Preço/promoção", desconto: "Preço/promoção",
  vazamento: "Vazamento/rumor", rumor: "Vazamento/rumor", rumores: "Vazamento/rumor",
  review: "Review/teste", teste: "Review/teste", análise: "Opinião/análise", comparativo: "Review/teste",
  tutorial: "Tutorial/dica", dica: "Tutorial/dica", dicas: "Tutorial/dica", "como fazer": "Tutorial/dica",
  mercado: "Mercado/negócios", negócios: "Mercado/negócios", empresa: "Mercado/negócios", aquisição: "Mercado/negócios", demissões: "Mercado/negócios",
  regulação: "Regulação/justiça", justiça: "Regulação/justiça", lei: "Regulação/justiça", anatel: "Regulação/justiça",
  segurança: "Segurança/privacidade", privacidade: "Segurança/privacidade", hacker: "Segurança/privacidade", "vazamento de dados": "Segurança/privacidade",
  ciência: "Ciência/espaço", espaço: "Ciência/espaço", pesquisa: "Ciência/espaço",
  opinião: "Opinião/análise", outros: "Outros",
  celular: "Smartphones", celulares: "Smartphones", smartphone: "Smartphones", notebook: "Notebooks", tablet: "Tablets",
  console: "Consoles", streaming: "TV/streaming", "carro elétrico": "Carros elétricos", "5g": "Internet/5G",
};

// ── Empresas ────────────────────────────────────────────────────────────────────────────

/**
 * Tópicos de empresa: id → nome, tag mostrada no card (null = só agrupa por entity:<id>) e apelidos.
 * aliases vai para o modelo de estrutura; orgNames são os nomes de organização que a empresa usa ao anunciar;
 * otherNames são outros nomes (contas oficiais, submarcas). Todos servem para reconhecer de qual empresa se fala.
 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; orgNames?: string[]; otherNames?: string[] }> = {
  apple: { name: "Apple", displayTag: "Apple", aliases: ["Apple", "iPhone", "iPad", "Mac", "Apple Watch"], orgNames: ["Apple"], otherNames: ["AirPods", "Vision Pro"] },
  samsung: { name: "Samsung", displayTag: "Samsung", aliases: ["Samsung", "Galaxy"], orgNames: ["Samsung Electronics", "Samsung"] },
  google: { name: "Google", displayTag: "Google", aliases: ["Google", "Android", "Pixel", "Gemini", "YouTube"], orgNames: ["Google", "Alphabet", "Google DeepMind"] },
  microsoft: { name: "Microsoft", displayTag: "Microsoft", aliases: ["Microsoft", "Windows", "Xbox", "Copilot"], orgNames: ["Microsoft"] },
  xiaomi: { name: "Xiaomi", displayTag: "Xiaomi", aliases: ["Xiaomi", "Redmi", "POCO"], orgNames: ["Xiaomi"] },
  motorola: { name: "Motorola", displayTag: "Motorola", aliases: ["Motorola", "Moto G", "Razr", "Edge"], orgNames: ["Motorola", "Lenovo"] },
  meta: { name: "Meta", displayTag: "Meta", aliases: ["Meta", "Facebook", "Instagram", "WhatsApp", "Threads"], orgNames: ["Meta"] },
  amazon: { name: "Amazon", displayTag: "Amazon", aliases: ["Amazon", "AWS", "Alexa", "Kindle", "Prime Video"], orgNames: ["Amazon"] },
  nintendo: { name: "Nintendo", displayTag: "Nintendo", aliases: ["Nintendo", "Switch 2"], orgNames: ["Nintendo"] },
  sony: { name: "Sony / PlayStation", displayTag: "Sony", aliases: ["Sony", "PlayStation", "PS5"], orgNames: ["Sony", "Sony Interactive Entertainment", "PlayStation"] },
  openai: { name: "OpenAI / ChatGPT", displayTag: "OpenAI", aliases: ["OpenAI", "ChatGPT", "GPT", "Sora"], orgNames: ["OpenAI"] },
  anthropic: { name: "Anthropic / Claude", displayTag: null, aliases: ["Anthropic", "Claude"], orgNames: ["Anthropic"] },
  nvidia: { name: "NVIDIA", displayTag: "NVIDIA", aliases: ["NVIDIA", "GeForce", "RTX"], orgNames: ["NVIDIA"] },
  intel: { name: "Intel", displayTag: "Intel", aliases: ["Intel", "Core Ultra"], orgNames: ["Intel"] },
  amd: { name: "AMD", displayTag: "AMD", aliases: ["AMD", "Ryzen", "Radeon"], orgNames: ["AMD", "Advanced Micro Devices"] },
  qualcomm: { name: "Qualcomm", displayTag: "Qualcomm", aliases: ["Qualcomm", "Snapdragon"], orgNames: ["Qualcomm"] },
  tesla: { name: "Tesla", displayTag: "Tesla", aliases: ["Tesla"], orgNames: ["Tesla"] },
  huawei: { name: "Huawei", displayTag: null, aliases: ["Huawei", "HarmonyOS"], orgNames: ["Huawei"] },
};

/**
 * Dicionário de identidade: uma empresa citada no título ou resumo precisa aparecer também no original; se não aparecer,
 * volta o título original e o resumo é descartado (evita o modelo atribuir a notícia à empresa errada).
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "apple", name: "Apple", patterns: [/\bapple\b|\biphone|\bipad|\bmacbook|\bimac\b|\bmac\s?(?:os|mini|studio|pro)\b|\bios\s?\d|\bairpods\b|\bvision\s?pro\b/i] },
  { id: "samsung", name: "Samsung", patterns: [/samsung|\bgalaxy\s?(?:s|z|a|tab|watch|buds|ring)\b/i] },
  { id: "google", name: "Google", patterns: [/google|\bandroid\b|\bpixel\s?\d|\bgemini\b|youtube|alphabet|deepmind/i] },
  { id: "microsoft", name: "Microsoft", patterns: [/microsoft|\bwindows\s?\d|\bxbox\b|\bcopilot\b|\bsurface\b/i] },
  { id: "xiaomi", name: "Xiaomi", patterns: [/xiaomi|\bredmi\b|\bpoco\s?[a-z]?\d/i] },
  { id: "motorola", name: "Motorola", patterns: [/motorola|\bmoto\s?g\d|\brazr\b/i] },
  { id: "meta", name: "Meta", patterns: [/\bMeta\b/, /facebook|instagram|whatsapp|\bthreads\b|\bquest\s?\d/i] },
  { id: "amazon", name: "Amazon", patterns: [/amazon|\baws\b|\balexa\b|\bkindle\b|prime\s?video/i] },
  { id: "nintendo", name: "Nintendo", patterns: [/nintendo|\bswitch\s?2\b/i] },
  { id: "sony", name: "Sony / PlayStation", patterns: [/\bsony\b|playstation|\bps[45]\b|\bps\s?plus\b/i] },
  { id: "openai", name: "OpenAI", patterns: [/openai|chatgpt|\bgpt-?[o\d]|\bsora\b/i] },
  { id: "anthropic", name: "Anthropic", patterns: [/anthropic|\bclaude\b/i] },
  { id: "nvidia", name: "NVIDIA", patterns: [/nvidia|geforce|\brtx\s?\d/i] },
  { id: "intel", name: "Intel", patterns: [/\bintel\b|core\s?ultra/i] },
  { id: "amd", name: "AMD", patterns: [/\bamd\b|\bryzen\b|\bradeon\b/i] },
  { id: "qualcomm", name: "Qualcomm", patterns: [/qualcomm|snapdragon/i] },
  { id: "tesla", name: "Tesla", patterns: [/\btesla\b/i] },
  { id: "huawei", name: "Huawei", patterns: [/huawei|harmonyos/i] },
];

/** Artigos nestes domínios são publicados pela empresa correspondente (plataformas como GitHub não contam). */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "apple", domains: ["apple.com"] },
  { entityId: "samsung", domains: ["samsung.com"] },
  { entityId: "google", domains: ["blog.google", "android-developers.googleblog.com", "deepmind.google"] },
  { entityId: "microsoft", domains: ["microsoft.com", "xbox.com"] },
  { entityId: "xiaomi", domains: ["mi.com", "xiaomi.com"] },
  { entityId: "motorola", domains: ["motorola.com"] },
  { entityId: "meta", domains: ["about.fb.com", "meta.com"] },
  { entityId: "amazon", domains: ["aboutamazon.com", "aboutamazon.com.br"] },
  { entityId: "nintendo", domains: ["nintendo.com"] },
  { entityId: "sony", domains: ["sony.com", "playstation.com"] },
  { entityId: "openai", domains: ["openai.com"] },
  { entityId: "anthropic", domains: ["anthropic.com"] },
  { entityId: "nvidia", domains: ["nvidia.com"] },
  { entityId: "intel", domains: ["intel.com"] },
  { entityId: "amd", domains: ["amd.com"] },
  { entityId: "qualcomm", domains: ["qualcomm.com"] },
  { entityId: "tesla", domains: ["tesla.com"] },
];

/** Estas formas no original também contam como menção à empresa correspondente. */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "sony", pattern: /@PlayStation\b/i },
  { entityId: "microsoft", pattern: /@Xbox\b/i },
];
