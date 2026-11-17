// The engine's ways in, one panel each: what it is for, the steps to connect, then the details folded away.
// Addresses are the site's configured public address (`base`); what visitors copy carries the site's tag
// (CopyTag) when it has one.
import { Fragment, useState } from "react";
import { Link } from "react-router";
import { PUBLIC_INTERFACE_VERSION } from "@aihot/contracts/http-policy";
import { MCP_TOOL_NAMES as T, MCP_TOOLS } from "@aihot/contracts/mcp";
import { feedCategoryLabel, PUBLIC_API_CATEGORY_KEYS } from "@aihot/contracts/taxonomy";
import { ACCESS, AGENT, EDITION_WHEN, POLICY, REPORTS, SITE, subjectAfter, withSubject } from "@aihot/site";
import { CodeBlock, CopyButton } from "./CodeBlock";
import { PillTabs } from "../../components/ui/Tabs";
import type { AgentPanelProps } from "../../modules";
import { AGENT_PARTS, GUIDE_CLIENTS, TAG } from "./module-parts";
import { Address, Ask, Block, Bullets, Details, Mono, PanelHead, Step, Steps, Table, Tips } from "./parts";

const V = PUBLIC_INTERFACE_VERSION;

/** Every MCP tool: the engine's and the modules'. */
export const mcpToolCount = () => MCP_TOOLS.length + AGENT_PARTS.reduce((n, a) => n + (a.tools?.length ?? 0), 0);
const link = "text-accent hover:underline";

/** An address on this site as the copy buttons copy it, with the tag. */
function addressOf({ base, tag }: AgentPanelProps, path: string): string {
  return TAG && tag ? `${base}${path}?${TAG.query}=${tag}` : `${base}${path}`;
}

const MCP_CLIENTS = [
  { key: "claude", label: "Claude Code" },
  { key: "codex", label: "Codex" },
  { key: "json", label: "Configuração JSON" },
  { key: "other", label: "Outros clientes" },
] as const;

export function McpPanel(props: AgentPanelProps) {
  const url = addressOf(props, "/api/mcp");
  const name = SITE.mcpPrefix;
  const [client, setClient] = useState<string>("claude");
  return (
    <>
      <PanelHead label={`MCP · ${V}`} title={`Informe um endereço e seu agente ganha ${mcpToolCount()} ferramentas`}>
        Streamable HTTP padrão, anônimo e só de leitura, sem token e sem ler o seu login. Serve para clientes com MCP remoto, como Claude Desktop, Cursor e Cherry Studio.
      </PanelHead>
      <Steps>
        <Step n={1} title="Copie o endereço do serviço">
          <Address url={url} />
          {TAG && <p className="mt-2 text-[13px] text-ink-3">{TAG.mcp}</p>}
        </Step>
        <Step n={2} title="Adicione ao seu cliente">
          <PillTabs className="mt-3" size="xs" layoutId="agent-mcp-client" label="Cliente" active={client} onSelect={setClient} items={MCP_CLIENTS.map((c) => ({ key: c.key, label: c.label }))} />
          {client === "claude" && <CodeBlock className="mb-0 mt-3" lang="bash" code={`claude mcp add --transport http ${name} '${url}'`} />}
          {client === "codex" && <CodeBlock className="mb-0 mt-3" lang="bash" code={`codex mcp add ${name} --url '${url}'`} />}
          {client === "json" && <CodeBlock className="mb-0 mt-3" title="Cursor, Cherry Studio e outros clientes configurados por JSON" lang="json" code={JSON.stringify({ mcpServers: { [name]: { type: "http", url } } }, null, 2)} />}
          {client === "other" && <p className="mt-3">{`Nas configurações de MCP ou conectores do cliente, crie um item: nome ${name}, endereço igual ao link acima, autenticação "nenhuma", sem API Key. Clientes que só aceitam comandos locais precisam usar antes o proxy de MCP remoto que eles oferecem.`}</p>}
        </Step>
        <Step n={3} title="Peça para o agente usar uma vez">
          <Ask text={`Use ${T.latest} e me diga as 5 notícias mais importantes das últimas 24 horas, com os links do ${SITE.name}.`} />
          <p className="mt-2 text-[13px] text-ink-3">{`Se o cliente mostrar que chamou ${T.latest} e a resposta trouxer o período, resumos em português e links de ${new URL(props.base).host}, está conectado.`}</p>
        </Step>
      </Steps>

      <Block title={`${mcpToolCount()} ferramentas`}>
        <Table
          head={["Ferramenta", "O que faz", "Pergunte assim"]}
          minWidth={600}
          rows={[
            [<Mono>{T.latest}</Mono>, "Destaques ou todas as notícias das últimas 24 horas ou 7 dias", "Quais as novidades de hoje?"],
            [<Mono>{T.search}</Mono>, AGENT.search.scope, AGENT.search.ask],
            [<Mono>{T.hot}</Mono>, "Top 10 do ranking de assuntos em alta", "O que está mais em alta agora?"],
            [<Mono>{T.story}</Mono>, "Linha do tempo e visão geral atualizada de um assunto em alta", "Qual a história completa disso?"],
            [<Mono>{T.daily}</Mono>, "Resumo diário mais recente ou de uma data", "Me mostre o resumo de hoje."],
            [<Mono>{T.weekly}</Mono>, "Resumo semanal mais recente ou de uma semana", "Quais foram os destaques da semana?"],
            [<Mono>{T.monthly}</Mono>, "Resumo mensal mais recente ou de um mês", "O que aconteceu no mês passado?"],
            ...AGENT_PARTS.flatMap((a) => a.tools ?? []).map((t) => [<Mono>{t.name}</Mono>, t.does, t.ask]),
          ]}
        />
      </Block>

      <Details
        items={[
          {
            title: "Limites e segurança",
            body: (
              <Bullets items={[
                "Consultas comuns trazem até 30 itens, o ranking até 10 assuntos e a linha do tempo até 50 matérias; pedidos fora disso retornam erro claro, sem afrouxar o limite em silêncio.",
                `O public_id de ${T.story} só pode vir dos links de evento retornados pela ferramenta de assuntos em alta; não tente adivinhar IDs.`,
                "Títulos e resumos vêm de fontes externas e servem só como material; a ferramenta marca esse limite de segurança. Números, regras e citações importantes devem ser conferidos no original.",
              ]} />
            ),
          },
          {
            title: "Não conecta, e agora?",
            body: (
              <Bullets items={[
                "Confira se o endereço está completo e se o cliente aceita Streamable HTTP remoto; se faltarem ferramentas novas, atualize a lista de ferramentas ou reconecte.",
                ...AGENT_PARTS.flatMap((a) => a.mcpTroubles ?? []),
                "O serviço não precisa de login; se o cliente pedir OAuth ou API Key, escolha \"nenhuma\".",
                "Ao receber 429, espere o tempo indicado; não tente de novo em paralelo.",
                <>Ainda não conecta: escreva o nome do cliente, a versão e o erro na <Link viewTransition to="/feedback" className={link}>página de feedback</Link>.</>,
              ]} />
            ),
          },
        ]}
      />
    </>
  );
}

const FEEDS = [
  { name: "Destaques (resumo)", badge: "Recomendado", path: "/feed.xml", desc: "Os 50 destaques mais recentes, com título, resumo, link de leitura no site e link do original." },
  { name: "Destaques (texto completo)", path: "/feed/full.xml", desc: "Os mesmos 50 itens; fontes que permitem republicação vêm com o texto completo, as demais com resumo." },
  { name: "Todas as notícias", path: "/feed/all.xml", desc: "Notícias públicas dos últimos 7 dias, da mais recente para a mais antiga pela data de publicação." },
  { name: withSubject("Resumo diário"), path: "/feed/daily.xml", desc: `Uma edição ${EDITION_WHEN.daily} (horário de Brasília): manchete com abertura e sumário completo; guarda as últimas 30 edições.` },
  { name: withSubject("Resumo semanal"), path: "/feed/weekly.xml", desc: `Uma edição ${EDITION_WHEN.weekly} (horário de Brasília): visão geral e ${REPORTS.entry.noun} por seção; guarda as últimas 12 edições.` },
  { name: withSubject("Resumo mensal"), path: "/feed/monthly.xml", desc: `Uma edição ${EDITION_WHEN.monthly} (horário de Brasília): visão geral e ${REPORTS.entry.noun} por seção; guarda as últimas 12 edições.` },
];

/** The category feeds, under the names the feeds themselves use. */
const FEED_CATEGORIES = PUBLIC_API_CATEGORY_KEYS.map((key) => [key, feedCategoryLabel(key)] as const);

export function RssPanel(props: AgentPanelProps) {
  const { base } = props;
  const lead = `${["Compatível com os leitores RSS 2.0 mais usados e com ferramentas de automação como n8n e Zapier. Os endereços não mudam", ...AGENT_PARTS.flatMap((a) => a.rssLead ?? [])].join("; ")}.`;
  return (
    <>
      <PanelHead label="RSS" title="Copie o endereço e assine no seu leitor">
        {lead}
      </PanelHead>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FEEDS.map((f) => (
          <div key={f.path} className="card flex flex-col p-4">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-ink">{f.name}</span>
              {f.badge && <span className="inline-flex h-[18px] items-center rounded-full bg-accent-soft px-2 text-[11px] font-medium text-accent">{f.badge}</span>}
            </div>
            <p className="mt-1 flex-1 text-[13px] leading-[1.7] text-ink-3">{f.desc}</p>
            <div className="mt-3 flex items-center gap-2 border-t border-line-soft pt-3">
              <code className="mono min-w-0 flex-1 truncate text-[12px] text-ink-4">{base}{f.path}</code>
              <CopyButton text={addressOf(props, f.path)} label="Copiar endereço" className="shrink-0" />
            </div>
          </div>
        ))}
      </div>
      {TAG && <p className="mt-3 text-[12.5px] text-ink-4">{TAG.rss}</p>}

      <Block title="Assinar por categoria">
        <Table
          head={["Categoria", "Resumo", "Texto completo"]}
          minWidth={420}
          rows={FEED_CATEGORIES.map(([slug, label]) => [
            <span className="font-medium text-ink">{label}</span>,
            <span className="inline-flex items-center gap-2"><Mono>{`/feed/category/${slug}.xml`}</Mono><CopyButton text={addressOf(props, `/feed/category/${slug}.xml`)} className="!h-6 !px-1.5" /></span>,
            <span className="inline-flex items-center gap-2"><Mono>{`/feed/full/category/${slug}.xml`}</Mono><CopyButton text={addressOf(props, `/feed/full/category/${slug}.xml`)} className="!h-6 !px-1.5" /></span>,
          ])}
        />
      </Block>

      <Block title="Com que frequência atualizar">
        <p>O leitor manda o ETag da última vez; se nada mudou, recebe só um 304 pequeno, sem baixar tudo de novo. Atualizar a cada 30 minutos basta; mais rápido não traz nada novo.</p>
        <p className="mt-3 text-[13px] text-ink-3">{`Os links dos itens apontam para a página de leitura no site; o link do original fica no resumo. Poder assinar de forma anônima não significa que todo uso é permitido${POLICY.terms.notes ? `: ${POLICY.terms.notes.rss}` : ""}; veja os `}<Link viewTransition to="/terms" className={link}>{POLICY.terms.name}</Link>.</p>
      </Block>
    </>
  );
}

const RECIPES = [
  { key: "latest", label: "Acompanhar as últimas" },
  { key: "sync", label: "Sincronizar todos os destaques" },
];

export function ApiPanel(props: AgentPanelProps) {
  const { base, tag } = props;
  const userAgent = [ACCESS.userAgent, TAG && tag ? TAG.userAgent(tag) : null].filter(Boolean).join(" ");
  const curl = `curl --compressed${userAgent ? ` -A '${userAgent}'` : ""}`;
  let pace = `Com que frequência o conteúdo muda: notícias novas chegam o dia todo, os destaques mudam de algumas a dezenas de vezes por dia, e sai uma edição do resumo diário ${EDITION_WHEN.daily}, do semanal ${EDITION_WHEN.weekly} e do mensal ${EDITION_WHEN.monthly} (horário de Brasília).`;
  if (ACCESS.ratePerMinute) pace += ` Um mesmo IP que passar de cerca de ${ACCESS.ratePerMinute} requisições por minuto recebe 429; espere o Retry-After e não tente de novo em paralelo.`;
  const [recipe, setRecipe] = useState<string>("latest");
  const recipes = AGENT_PARTS.flatMap((a) => a.recipes ?? []);
  const items = `${base}/api/v1/items?mode=selected&window=24h&limit=20`;
  return (
    <>
      <PanelHead label={`REST API · ${V}`} title="GET anônimo, pronto para usar">
        Sem token; funciona direto no navegador (CORS), no curl e no cliente HTTP padrão de qualquer linguagem. O caminho é /api/v1; campos e códigos de erro seguem o <a href="/openapi-v1.json" className={link}>OpenAPI</a>.
      </PanelHead>
      <CodeBlock className="mt-6" title="Primeira requisição" lang="bash" code={`${curl} '${items}'`} />

      <Block title="Filtrar por categoria">
        <p>Acrescente <Mono>category</Mono> à requisição de notícias para trazer só aquela categoria; sem ele, vêm todas. O campo <Mono>category</Mono> dos itens retornados usa os mesmos valores da tabela.</p>
        <Table head={["Categoria", "Parâmetro"]} rows={FEED_CATEGORIES.map(([key, name]) => [name, <Mono>{`category=${key}`}</Mono>])} />
      </Block>

      <Block title="Mais econômico e mais rápido">
        <Tips
          items={[
            { title: "Use compressão", text: <>No curl, acrescente <Mono>--compressed</Mono>; em outros clientes, ative gzip ou br. O JSON comprimido fica com 1/4 a 1/8 do tamanho.</> },
            { title: "Envie o ETag", text: <>Guarde o ETag da resposta e mande <Mono>If-None-Match</Mono> na próxima vez; se nada mudou, volta 304 sem corpo.</> },
            { title: "Respeite o ritmo", text: `Notícias e ranking no máximo uma vez por minuto; o resumo diário uma vez depois de ${EDITION_WHEN.daily}, o semanal e o mensal uma vez depois de publicados; ao paginar para trás, pare quando chegar a um item que você já tem.` },
          ]}
        />
        <p className="mt-3 text-[13px] leading-[1.75] text-ink-3">{pace}</p>
      </Block>

      <Block title="Endpoints">
        <Table
          head={["Caminho", "Para que serve", "Com que frequência"]}
          minWidth={640}
          rows={[
            { group: "Notícias" },
            [<Mono>/api/v1/items</Mono>, "Destaques ou todas as notícias dos últimos 7 dias, com filtro por categoria, período e palavra-chave", "No máximo 1 vez por minuto"],
            { group: "Em alta e eventos" },
            [<Mono>/api/v1/hot-topics</Mono>, "Top 10 do ranking de assuntos em alta", "No máximo 1 vez por minuto"],
            [<Mono>{"/api/v1/stories/{publicId}"}</Mono>, "Linha do tempo das matérias, visão geral da IA e eventos relacionados de um assunto", "Quando precisar"],
            { group: "Resumo diário" },
            [<Mono>/api/v1/dailies/latest</Mono>, "Edição mais recente do resumo diário", `Uma vez depois de ${EDITION_WHEN.daily}`],
            [<Mono>{"/api/v1/dailies/{date}"}</Mono>, "Resumo diário de uma data; matérias retiradas são removidas", "Valide o ETag depois que o cache expirar"],
            [<Mono>/api/v1/dailies</Mono>, "Índice de datas dos resumos diários", "Uma vez por dia"],
            { group: "Resumos semanal e mensal" },
            [<Mono>/api/v1/weeklies/latest</Mono>, "Edição mais recente do resumo semanal: manchete, visão geral e destaques da semana por seção", `Uma vez depois de ${EDITION_WHEN.weekly}`],
            [<Mono>{"/api/v1/weeklies/{week}"}</Mono>, "Uma semana específica, em semana ISO como 2026-W39; matérias retiradas são removidas", "Valide o ETag depois que o cache expirar"],
            [<Mono>/api/v1/weeklies</Mono>, "Índice dos resumos semanais", "Uma vez por semana"],
            [<Mono>/api/v1/monthlies/latest</Mono>, "Edição mais recente do resumo mensal", `Uma vez depois de ${EDITION_WHEN.monthly}`],
            [<Mono>{"/api/v1/monthlies/{month}"}</Mono>, "Um mês específico, como 2026-09", "Valide o ETag depois que o cache expirar"],
            [<Mono>/api/v1/monthlies</Mono>, "Índice dos resumos mensais", "Uma vez por mês"],
            ...AGENT_PARTS.flatMap((a) => (a.api ? [{ group: a.api.group }, ...a.api.rows.map(([path, does, often]) => [<Mono>{path}</Mono>, does, often])] : [])),
            { group: "Para assistentes de IA" },
            [<Mono>/api/v1/agent</Mono>, `Instruções para agentes; os endereços listados retornam Markdown organizado em português${GUIDE_CLIENTS ? `; ${GUIDE_CLIENTS} usam esses mesmos` : ""}`, "Quando precisar"],
            { group: "Sincronizar todos os destaques" },
            [<Mono>/api/v1/selected/snapshot</Mono>, "Todos os destaques atuais, paginados para pegar tudo", "Só na primeira vez"],
            [<Mono>/api/v1/selected/changes</Mono>, "O que foi acrescentado, alterado ou retirado depois", "A cada poucos minutos"],
          ]}
        />
      </Block>

      <Block title="Usos comuns">
        <PillTabs size="xs" layoutId="agent-api-recipe" label="Uso" active={recipe} onSelect={setRecipe} items={[...RECIPES, ...recipes].map((r) => ({ key: r.key, label: r.label }))} />
        {recipe === "latest" && (
          <>
            <CodeBlock className="mb-3 mt-3" lang="bash" code={`# Primeira vez: guarde o ETag do cabeçalho da resposta\n${curl} -i '${items}'\n# Depois, no máximo uma vez por minuto, envie o ETag; 304 quer dizer que nada mudou\n${curl} -i -H 'If-None-Match: <ETag anterior>' '${items}'`} />
            <p>Para paginar para trás, devolva <Mono>page.nextCursor</Mono> como cursor e pare quando chegar a um item que você já tem; não percorra os 7 dias inteiros toda vez.</p>
          </>
        )}
        {recipe === "sync" && (
          <>
            <CodeBlock className="mb-3 mt-3" lang="bash" code={`# Primeira vez: pagine até pegar tudo. Guarde o cursor da resposta da primeira página (é igual em todas)\n${curl} '${base}/api/v1/selected/snapshot?fields=minimal&limit=500'\n# Se hasMore for true, continue com nextPage até o fim\n${curl} '${base}/api/v1/selected/snapshot?fields=minimal&limit=500&page=<nextPage da página anterior>'\n# Depois: devolva o cursor como está e receba só o que foi acrescentado, alterado ou retirado\n${curl} '${base}/api/v1/selected/changes?cursor=<cursor da primeira página>&limit=100'`} />
            <p>Só guarde o novo cursor depois de gravar cada página localmente. O cursor marca a posição no registro e não expira; se vier 409 <Mono>snapshot_required</Mono>, pegue o snapshot de novo, sem perder dados em silêncio.</p>
          </>
        )}
        {recipes.map((r) => recipe === r.key && <r.Body key={r.key} base={base} curl={curl} />)}
      </Block>

      <Block title="Deu erro, e agora?" id="agent-api-recovery">
        <dl className="grid grid-cols-[76px_minmax(0,1fr)] gap-x-3 gap-y-2.5">
          <dt className="mono text-[13px] text-ink">400</dt>
          <dd>Parâmetro errado: corrija conforme o OpenAPI e o code retornado, sem trocar automaticamente por uma consulta mais ampla. Cursor inválido ou fora do período retorna invalid_cursor; recomece da primeira página.</dd>
          <dt className="mono text-[13px] text-ink">409</dt>
          <dd>snapshot_required: não dá para continuar o incremental com segurança; pegue o snapshot completo de novo.</dd>
          <dt className="mono text-[13px] text-ink">429</dt>
          <dd>Requisições demais: espere o Retry-After e não tente de novo em paralelo.</dd>
          <dt className="mono text-[13px] text-ink">5xx</dt>
          <dd>Use backoff exponencial e, enquanto isso, o último resultado bem-sucedido; o serviço público não garante SLA.</dd>
          {AGENT_PARTS.flatMap((a) => a.apiErrors ?? []).map(([status, what]) => (
            <Fragment key={status}>
              <dt className="mono text-[13px] text-ink">{status}</dt>
              <dd>{what}</dd>
            </Fragment>
          ))}
        </dl>
        <p className="mt-4 text-[13px] text-ink-3">{`Poder chamar de forma anônima não significa que todo uso é permitido${POLICY.terms.notes ? `: ${POLICY.terms.notes.api}` : ""}; veja os `}<Link viewTransition to="/terms" className={link}>{POLICY.terms.name}</Link>.</p>
      </Block>

    </>
  );
}
