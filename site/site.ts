// Identidade do site e os textos que o leitor vê. Ao adaptar para o seu setor, comece por este arquivo.
// O site e o backend leem daqui; depois de mudar, reconstrua (docker compose up --build) para valer.
// O domínio não fica aqui: no deploy, defina a variável de ambiente SITE_URL.

import type { Founder } from "@aihot/contracts/site-config";

/**
 * Quando saem o diário, o semanal e o mensal (horário de Brasília, HH:mm): o diário cobre as 24 horas antes deste horário, o semanal sai na segunda depois de cada semana,
 * e o mensal no dia 1º de cada mês. Agendamento, janela das edições, alerta de edição faltando e todos os textos com horário leem daqui (os arquivos de public/ usam os marcadores
 * {{dailyTime}}, {{weeklyTime}}, {{monthlyTime}}); o agendamento verifica a cada meia hora, então use hora cheia ou meia hora.
 */
export const EDITION_TIMES = { daily: "08:00", weekly: "10:00", monthly: "10:30" };

/** "todo dia às 08:00", "toda segunda às 10:00", "todo dia 1º às 10:30": o horário de publicação escrito dentro das frases. */
export const EDITION_WHEN = {
  daily: `todo dia às ${EDITION_TIMES.daily}`,
  weekly: `toda segunda-feira às ${EDITION_TIMES.weekly}`,
  monthly: `todo dia 1º às ${EDITION_TIMES.monthly}`,
};

export const SITE = {
  /** Nome do site: navegação, títulos das páginas, imagens de compartilhamento, RSS, MCP e painel usam este nome. */
  name: "MyHOT",
  /**
   * Termo do setor: entra nos textos padrão. No original chinês virava algo como "Resumo de IA";
   * trocando por "direito", "RH" ou "agro", a página passa a falar do novo setor.
   */
  subject: "tecnologia",
  /** Título completo da página inicial (aba do navegador, resultados de busca). */
  homeTitle: "MyHOT — Notícias de tecnologia · Seleção diária e resumo do dia",
  /** Título do diretório de tópicos (/topics). */
  topicsTitle: "Tópicos de tecnologia: últimas notícias por empresa, área e formato",
  /** Exemplo no campo de texto do formulário de feedback. */
  feedbackExample: "Por exemplo: ao buscar uma palavra-chave aconteceu… eu queria…",
  /** A frase sob o título da página de feedback. */
  feedbackLead: "Achou um bug, quer um recurso ou algo te incomodou? Conta pra gente.",
  /** A dica no campo de e-mail do formulário de feedback. */
  feedbackEmailHint: "Deixe seu e-mail se quiser resposta",
  /** Apresentação em uma frase: buscadores, cartões de compartilhamento, RSS e llms.txt usam. */
  description: `Seleciona as notícias de tecnologia que valem a leitura, junta as matérias sobre o mesmo assunto e publica um resumo ${EDITION_WHEN.daily}.`,
  /** Apresentação detalhada abaixo da frase de apresentação no llms.txt (opcional). */
  llmsIntro: null as string | null,
  /** Uma linha em letra pequena: embaixo das imagens de compartilhamento e dos pôsteres. */
  tagline: "As notícias de tecnologia que importam",
  /** Palavras-chave lidas pelos buscadores (dados estruturados da página inicial). */
  keywords: ["notícias de tecnologia", "tecnologia", "celulares", "games", "inteligência artificial", "resumo de tecnologia"] as string[],
  /**
   * Verificação do site em plataformas de webmaster (opcional): nome do meta → código da plataforma, colocado no head da página inicial.
   * Por exemplo "google-site-verification": "…", "msvalidate.01": "…". Mantenha depois de verificado: a plataforma confere de tempos em tempos.
   */
  siteVerification: {} as Record<string, string>,
  /** Ano em que o site começou a coletar (intervalo de tempo dos dados estruturados, opcional). */
  since: null as string | null,
  /** Idioma da interface (HTML lang, og:locale). */
  locale: "pt-BR",
  /** Domínio padrão, usado só quando SITE_URL não está definido. */
  defaultUrl: "http://localhost:3000",
  /** Ícones extras na raiz do site além dos padrão (favicon.ico, icon.png, icon-192.png, apple-icon.png, logo.svg), pelo nome do arquivo em site/brand/ (opcional); para quando o manifest.webmanifest ou outros sites os referenciam. */
  rootIcons: [] as string[],
  /**
   * Prefixo dos nomes das ferramentas MCP (letras minúsculas, números, sublinhado); as ferramentas se chamam myhot_get_latest, myhot_search…
   * Não mude depois que alguém se conectar.
   */
  mcpPrefix: "myhot",
  /**
   * Versão das interfaces públicas (MCP, OpenAPI, llms.txt); só sobe, nunca desce.
   * Ao mudar um campo existente ou o significado dele, suba a versão principal e explique nas notas de deploy.
   */
  interfaceVersion: "4.0.0",
  /** E-mail de contato público (opcional): aparece no llms.txt e nas instruções para agentes. */
  contactEmail: null as string | null,
  /** Uma linha em letra pequena no fim da página Sobre (opcional). */
  footerNote: "Feito com o framework open source AIHOT",
  /** Número de registro ICP de sites da China continental (opcional); preenchido, aparece no fim da barra lateral e da página "Meu", com link para o sistema de registro do MIIT. */
  icp: null as string | null,
  /** Registro na segurança pública de sites da China continental (opcional); preenchido, aparece no fim da barra lateral e da página "Meu". */
  psb: null as string | null,
  /** Endereço do repositório no GitHub (opcional); preenchido, aparece "Código aberto no GitHub" no fim da barra lateral e da página "Meu". */
  github: null as string | null,
  /** O "Feito com X" do rodapé (opcional): preenchido, aparece no fim da barra lateral e da página "Meu", com link para o endereço. O padrão aponta para o AIHOT original; para tirar, use null. */
  poweredBy: { name: "AIHOT", url: "https://aihot.news" } as { name: string; url: string } | null,
  /** O operador do site nos dados estruturados (para buscadores). */
  organization: {
    name: "MyHOT",
    /** Fundador (opcional). */
    founder: null as Founder | null,
  },
  /** Nome e versão informados ao coletar as fontes (no User-Agent); não use o nome de outro site. */
  crawlerName: "MyHOTBot/1.0",
} as const;

/** As páginas de termos de uso e de privacidade (o texto fica em pages/). */
export const POLICY = {
  terms: {
    /** Nome da página: navegação, rodapé e título da página usam. */
    name: "Termos de uso",
    description: "Regras de uso das páginas, do RSS, da API pública e do MCP deste site.",
    /** Frase sobre esta página no llms.txt (opcional). */
    covers: null as string | null,
    /** Lembretes de uso nas colunas de RSS e API da página de conexão para agentes (opcional). */
    notes: null as null | { rss: string; api: string },
    /**
     * Texto que explica quais usos exigem autorização prévia (opcional): llms vem depois do aviso de direitos autorais em "Instruções de uso" do llms.txt,
     * e agent vai no início da seção "Regras de uso" das instruções para agentes.
     */
    license: null as null | { llms: string; agent: string },
    /**
     * Cabeçalhos de resposta que declaram as regras de uso na API pública, no RSS e no arquivo OpenAPI (opcional): são anexados como estão, mais um cabeçalho
     * Link apontando para esta página (rel="terms-of-service"); quem chama pelo navegador também consegue lê-los.
     */
    headers: null as null | Record<string, string>,
  },
  privacy: {
    description: "Como este site trata dados locais do navegador, feedbacks e registros de acesso.",
    /** Frase sobre esta página no llms.txt (opcional). */
    covers: null as string | null,
  },
  /**
   * Se o texto e as imagens do próprio post do X contam como texto completo: se contam, só aparecem quando o item permite texto completo no site (a fonte permite e o corpo foi obtido);
   * se não contam, aparecem sempre, como o título e o resumo.
   */
  xPostIsFullText: true,
} as const;

/** Navegação (barra lateral do computador, barra inferior do celular, página "Meu"). */
export const NAV = {
  /**
   * Entradas do motor que ficam fora da navegação; por enquanto só em alta ("/hot") e tópicos ("/topics"). A página continua abrindo; botões de voltar e links que levavam a ela passam a levar à seleção,
   * e com "/hot" a página inicial também deixa de mostrar o que está em alta.
   */
  hidden: [] as Array<"/hot" | "/topics">,
};

/** Alguns termos e exibições nos cartões dos itens e na página de detalhe. */
export const ITEM_COPY = {
  /** O nome da frase de motivo escrita pelo modelo: cartões, página de detalhe, exportação em Markdown, respostas para agentes e envios para grupos usam. */
  reasonLabel: "Por que ler",
  /** Se o leitor vê a nota da IA no site e nas imagens de compartilhamento. Só controla a exibição: a API pública e o MCP continuam trazendo score, e o painel continua mostrando. */
  showScore: true,
};

/** Um cartão de QR code da página Sobre. */
interface ContactCard {
  kind: string;
  title: string;
  note: string;
  /** Nome de arquivo na raiz já linkado por outros sites (opcional), como qr-wechat.jpg: esse endereço sempre redireciona para o QR code atual. */
  alias?: string;
}

/** Textos da página Sobre. Os números (fontes, itens coletados, destaques, edições do diário) vêm das estatísticas em tempo real do site e não precisam ser escritos aqui. */
export const ABOUT = {
  kicker: `Sobre o ${SITE.name}`,
  /** Descrição da página (resultados de busca, cartões de compartilhamento). */
  description: `Sobre o ${SITE.name}: ${SITE.description}`,
  /** Título grande: a primeira linha na cor normal e a segunda na cor de destaque. */
  headline: ["Todo dia sai muita notícia de tecnologia.", "Só algumas valem o seu tempo."] as [string, string],
  /** O parágrafo sob o título. {sources} vira o número de fontes em tempo real (com espaços acrescentados dos dois lados, então não escreva espaços em volta de {sources}); se a estatística não vier, usa sourcesFallback. */
  lead: `O ${SITE.name} acompanha{sources}fontes por você: coleta, agrupa, pontua e seleciona, e publica um resumo ${EDITION_WHEN.daily}. Grátis, sem cadastro.`,
  sourcesFallback: "dezenas de",
  /** As quatro etapas sob a animação do rio de fontes. */
  steps: {
    collect: "Acompanha blogs oficiais, veículos de imprensa e criadores; quem publica mais é visitado com mais frequência, até a cada 15 minutos.",
    store: "Tudo o que é coletado fica guardado, e as matérias sobre o mesmo assunto são agrupadas; é daí que sai a lista do que está em alta.",
    select: `A IA primeiro confere se é assunto de tecnologia e se tem informação de verdade, depois escreve título, resumo e "${ITEM_COPY.reasonLabel}" em português; publieditorial e repost repetido ficam de fora.`,
    publish: `Resumo diário ${EDITION_WHEN.daily}, semanal ${EDITION_WHEN.weekly} e mensal ${EDITION_WHEN.monthly}.`,
  },
  /**
   * Bloco do autor (opcional); com null, não aparece.
   * avatarSourceId: id de uma fonte de conta do X, de onde vem a foto (opcional).
   * Os QR codes são enviados em "Configurações" no painel ou colocados em site/brand/contact/; sem QR code, o cartão não aparece.
   */
  maker: null as null | {
    name: string;
    avatarSourceId?: string | null;
    greeting: string[];
    wechat?: ContactCard;
    feishu?: ContactCard;
  },
  /** O aviso de direitos autorais e de remoção no fim da página, com o link da "página de feedback" no meio. */
  copyright: [`O ${SITE.name} é um agregador de resumos e índice de leitura; os direitos dos originais pertencem a cada fonte. Se você representa uma fonte e quer corrigir, remover ou mudar a forma de exibição, use a`, "página de contato."] as [string, string],
  /** O id da âncora do link "Termos de uso" no fim da página (opcional): preencha se documentos externos já fixaram essa âncora, e não mude depois. */
  termsAnchor: null as string | null,
} as const;

/** Dicas para o administrador nas páginas do painel (opcional). */
export const ADMIN = {
  /** Uma linha sob o título da página "Feedback". */
  feedbackNote: null as string | null,
  /** Uma frase com a regra do site acrescentada na caixa de confirmação: ao bloquear a origem de um feedback. */
  banNote: null as string | null,
  /** Uma frase com a regra do site acrescentada na caixa de confirmação: ao ajustar o limite de requisições de um serviço pago. */
  budgetNote: null as string | null,
};

/** Exemplos da página de conexão para agentes. */
export const AGENT = {
  /** A linha "busca" da tabela de ferramentas MCP: o que dá para buscar e como perguntar. */
  search: { scope: "Busca dos últimos 7 dias por empresa, produto, pessoa ou assunto", ask: "O que essa empresa lançou recentemente?" },
};

/** Termos usados nos resumos diário, semanal e mensal. */
export const REPORTS = {
  /** A linha do editor sob o cabeçalho. */
  imprint: SITE.name.toUpperCase(),
  /** Uma palavra ao lado do cabeçalho. */
  motto: SITE.subject as string,
  /** Descrição da página de cada tipo de resumo (resultados de busca, cartões de compartilhamento), sem ponto final; o llms.txt também usa ao apresentar o semanal e o mensal. */
  descriptions: {
    daily: `Resumo diário do ${SITE.name}, publicado ${EDITION_WHEN.daily} (horário de Brasília)`,
    weekly: `Resumo semanal de ${SITE.subject}`,
    monthly: `Balanço mensal de ${SITE.subject}`,
  },
  /**
   * Como chamar um item da edição ("4 notícias principais"): o título quando não há manchete ("As 4 notícias principais do dia"), a contagem no cabeçalho e no índice de edições,
   * a frase do semanal e do mensal sem resumo geral, e as "notícias principais por seção" das instruções de assinatura usam.
   */
  entry: { measure: "", noun: "notícias principais" },
  /** O termo depois dos outros números do cabeçalho; o número de destaques e de edições do diário também aparecem assim nas páginas Sobre e de tópico. */
  metricUnits: { sourcesCount: "fontes", firstPartyEvents: "anúncios oficiais", selectedCount: "selecionadas", reportsCovered: "resumos diários" },
  /** O termo de "quantos itens no total" na imagem de compartilhamento do resumo. */
  shareUnit: "notícias principais",
  /** Título e chamada quando, no período do diário, houve itens avaliados mas nenhuma notícia grande nova. */
  quiet: { title: "Dia tranquilo, nada de grande aconteceu", paragraph: "Entre {start} e {end} (horário de Brasília), nenhuma notícia importante nova." },
};

/** Alguns termos dos alertas de operação (só para o dono do site) que mudam conforme o deploy. */
export const ALERTS = {
  /** Quantos minutos sem artigo novo geram o alerta "o site parou de coletar conteúdo novo" (no máximo um dia); a variável de ambiente ALERT_QUIET_MINUTES tem prioridade. */
  quietMinutes: 360,
  /** Quantos minutos até alertar quando as fontes editoriais seguem coletando com sucesso, mas sem artigo novo (no máximo um dia). */
  quietWhileFetchingMinutes: 720,
  /** No mesmo alerta, uma frase depois de "nenhum" com o volume normal de coleta; com null, não escreve. */
  usualFlow: null as string | null,
  /** No alerta de worker parado, como ver os logs dele. */
  workerLogs: "veja os logs do worker (docker compose logs worker)",
};

/** Configuração padrão ao criar uma fonte no painel. */
export const SOURCE_DEFAULTS = {
  /** Mostrar o texto completo no site; com false, só o resumo e o link do original. */
  siteFulltext: false,
};

/**
 * Fontes de comunidade (pelo id da fonte): na popularidade, cada conta que publica conta como uma fonte independente, em vez de a fonte inteira contar como uma só.
 * dev é o fluxo de artigos do dev.to, e hn é o fluxo de posts do Hacker News.
 */
export const COMMUNITY_FEEDS: { dev: string[]; hn: string[] } = {
  dev: [],
  hn: [],
};

/** Textos das imagens de compartilhamento das páginas (/og/pages/*.png). A do diretório de tópicos é gerada sozinha pelo número de tópicos. */
export const CARDS: Record<string, { kicker: string; title: string; subtitle: string; accent?: "hot" | "amber" }> = {
  site: { kicker: "Seleção do dia", title: SITE.tagline, subtitle: SITE.description },
  all: { kicker: "Todas as notícias", title: "As últimas de todas as fontes, num lugar só", subtitle: "Notícias de todas as fontes em ordem cronológica, com filtro por categoria e tag." },
  hot: { kicker: "Em alta", title: "O que todo mundo está discutindo nas últimas 48 horas", subtitle: "Índice de popularidade, tendência e as fontes públicas por trás dele.", accent: "hot" },
  daily: { kicker: "Resumo diário", title: `Todo dia às ${spokenTime(EDITION_TIMES.daily)}, um resumo que dá pra ler inteiro`, subtitle: "O que valeu a pena no dia anterior." },
  weekly: { kicker: "Resumo semanal", title: "As notícias principais da semana, de uma vez", subtitle: "Os grandes temas, os lançamentos importantes e as discussões que valem rever." },
  monthly: { kicker: "Resumo mensal", title: "O que mudou no mês", subtitle: "Os grandes temas do mês e os fatos-chave." },
  about: { kicker: "Sobre", title: `Sobre o ${SITE.name}`, subtitle: SITE.description },
  terms: { kicker: "Termos de uso", title: `Termos de uso do ${SITE.name}`, subtitle: "O que é permitido nas páginas, na API, no RSS e no MCP." },
  privacy: { kicker: "Privacidade", title: `Política de privacidade do ${SITE.name}`, subtitle: "Como tratamos registros de acesso, dados locais do navegador e feedbacks." },
  changelog: { kicker: "Novidades", title: `Novidades do ${SITE.name}`, subtitle: "Recursos novos, melhorias, avisos e desativações." },
  feedback: { kicker: "Feedback", title: "Conte o que podemos melhorar", subtitle: "Conteúdo, recursos, integração, ou pedidos de correção e remoção de fontes." },
  agent: { kicker: "Para agentes", title: `Conecte o ${SITE.name} ao seu agente de IA`, subtitle: "MCP, RSS e API: anônimo, somente leitura, sem API Key." },
};

/** Pontos do acordo de acesso às interfaces públicas que mudam conforme o deploy: aparecem nas instruções para agentes e no llms.txt. */
export const ACCESS = {
  /** Quantas requisições por minuto o mesmo IP consegue fazer antes de receber 429 com Retry-After (opcional, limitado pelo proxy reverso do deploy); null significa sem limite, e as instruções não mencionam. */
  ratePerMinute: null as number | null,
  /** O User-Agent pedido a quem escreve programas para sincronizar dados (opcional), escrito depois das instruções das interfaces JSON. */
  userAgent: null as string | null,
};

/** Alguns arranjos próprios deste deploy (opcional). */
export const DEPLOYMENT = {
  /** Pasta padrão dos arquivos de credenciais por grupo (models.env, collectors.env…), relativa à raiz do repositório; a variável AIHOT_CREDENTIALS_DIR tem prioridade, e sem nenhuma das duas só as variáveis de ambiente são lidas. */
  credentialsDir: null as string | null,
  /** Nomes dos arquivos de credenciais por grupo (na pasta de credenciais, opcional): grupos sem nome usam "grupo.env", como models.env. */
  credentialFiles: {} as Partial<Record<string, string>>,
  /** Credenciais exigidas a mais por este deploy ([grupo, nome da variável]); conferidas quando a API de produção sobe; por padrão não há exigência extra. */
  requiredSecrets: [] as const,
  /** O Host recebido pela api em produção (o domínio de origem usado pela CDN, opcional); no desenvolvimento local, as requisições do servidor de desenvolvimento do site para a api também passam a usá-lo, igual à produção. */
  originHost: null as string | null,
  /** Qual cabeçalho leva o endereço original quando o proxy reverso manda acessos sem login do painel para o login (opcional; depois do login, volta para lá). */
  loginReturnHeader: null as string | null,
  /**
   * Limite de tráfego do proxy de imagens ao buscar no site original: passou, imagens sem cache devolvem 503 até aquele minuto ou dia passar, e a cota diária esgotada entra no relatório de operação;
   * com null, sem limite. As variáveis IMGPROXY_UPSTREAM_MB_PER_MINUTE e IMGPROXY_UPSTREAM_GB_PER_DAY têm prioridade.
   */
  imageUpstreamBudget: null as null | { mbPerMinute: number; gbPerDay: number },
  /**
   * Domínios que, testados, devem ser acessados direto pelo servidor, sem o proxy de saída (EGRESS_PROXY_URL); valem para coleta e imagens (opcional).
   * A cada redirecionamento a rota é escolhida de novo pelo domínio de destino, e o acesso direto ainda confere o endereço real da conexão.
   */
  directFetchHosts: [] as string[],
  /**
   * O conjunto marcado usado pela avaliação da seleção (scripts/eval-selection.ts) sem parâmetros: arquivo (relativo à raiz do repositório), número de amostras, qual parte usar e faixa da varredura de limites.
   * Com null, usa todas as amostras de .data/gold.jsonl (até 200) e varre de 40 a 90.
   */
  selectionGold: null as null | { file: string; sample: number; split: string; sweep: [number, number] },
};

/** Termos das descrições dos feeds RSS que mudam conforme o site. */
export const FEED_COPY = {
  /** Na descrição do feed "Todas as notícias", o que mais ele não traz além de conteúdo não avaliado, itens pouco relevantes, itens com nota baixa e repetidos já unidos (opcional). */
  allLeavesOut: [] as string[],
};

/**
 * Categorias das interfaces públicas (API, RSS, MCP) diferentes das do site (opcional). Não mude depois do lançamento: a key da categoria aparece em parâmetros e endereços de feed.
 * merge: categorias publicadas dentro de outra; a chave é a categoria do pacote do setor e o valor é a categoria em que ela entra (para quando a interface pública tem uma categoria a menos que o site);
 * feedLabels: o nome no título do RSS por categoria, substituindo o feedLabel do pacote do setor (ao entrar em outra categoria, o nome muitas vezes também precisa mudar).
 */
export const PUBLIC_CATEGORIES = {
  merge: {},
  feedLabels: {},
} as const;

/**
 * Names such as "Resumo diário". The Chinese original glued the subject onto the noun ("AI daily"); in Portuguese the
 * site name already says what the site covers, so the noun stands alone.
 */
export function withSubject(noun: string): string {
  return noun;
}

/** "Todas as" + "notícias" → "Todas as notícias"; without a noun the text is followed by the subject ("…de tecnologia"). */
export function subjectAfter(text: string, noun?: string): string {
  return [text, noun ? withSubject(noun) : SITE.subject].filter(Boolean).join(" ");
}

/** "8h", "10h30": HH:mm as spoken in Brazil. */
function spokenTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number) as [number, number];
  return `${hour}h${minute ? String(minute).padStart(2, "0") : ""}`;
}

/**
 * Títulos das páginas de entrada nos resultados de busca: as palavras que o leitor procura vêm primeiro, e a página acrescenta " · nome do site" no fim (a página inicial usa SITE.homeTitle).
 * As datas são sempre as do conteúdo daquela edição ou página, não a de hoje. Ao trocar de setor, troque também os termos daqui.
 */
export const SEO_TITLES = {
  /** Em alta (/hot). */
  hot: "Em alta: os assuntos de tecnologia mais comentados hoje",
  /** Todas as notícias (/all), sem os resultados de busca e de filtro. */
  all: "Últimas notícias de tecnologia: atualização contínua",
  /** Página de conexão para agentes (/agent). */
  agent: "API, MCP e RSS de notícias de tecnologia: conecte ao seu agente",
  /** Título completo da página Sobre (/about), já com o nome do site. */
  about: `Sobre o ${SITE.name}: ${SITE.tagline}`,
  /** Edição mais recente do diário, semanal e mensal (/daily, /weekly, /monthly); date é a data da edição: "7 nov", "26 out – 1 nov", "outubro de 2026". */
  latestReport: (kind: "daily" | "weekly" | "monthly", date: string): string =>
    ({ daily: `Resumo diário de tecnologia (${date})`, weekly: `Resumo semanal: as notícias principais da semana (${date})`, monthly: `Resumo mensal: as notícias principais de ${date}` })[kind],
  /** Primeira página de um tópico: empresas buscam "últimas notícias", áreas e formatos buscam "últimos avanços"; updated é a data do destaque mais recente ("7 nov"), ou null. */
  topic: (name: string, group: "company" | "field" | "genre", updated: string | null): string =>
    `${name}: ${group === "company" ? "últimas notícias e novidades" : "últimas notícias e avanços"}${updated ? ` (atualizado em ${updated})` : ""}`,
};
