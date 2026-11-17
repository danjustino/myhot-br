<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/licen%C3%A7a-MIT-176b75?style=flat-square" alt="Licença MIT"></a>
  <img src="https://img.shields.io/badge/Node.js-24-176b75?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 24">
  <img src="https://img.shields.io/badge/PostgreSQL-17-176b75?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 17">
  <img src="https://img.shields.io/badge/Docker-Compose-176b75?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose">
</p>

<h1 align="center">MyHOT</h1>

<p align="center">
  <b>As notícias de tecnologia que importam, escolhidas e resumidas automaticamente, em português.</b><br>
  Um site que acompanha as principais fontes de tecnologia, seleciona o que vale a pena ler e publica um resumo todo dia.
</p>

<p align="center">
  <a href="#como-rodar">Como rodar</a> ·
  <a href="#como-funciona">Como funciona</a> ·
  <a href="#personalizar">Personalizar</a> ·
  <a href="#créditos-e-licença">Créditos e licença</a>
</p>

## O que é

O MyHOT é um agregador de notícias de **tecnologia geral para o público brasileiro**: celulares e aparelhos, software e sistemas, IA, games, mercado, ciência, dicas e análises.

Todo dia ele coleta matérias de um conjunto de fontes. Um modelo de linguagem faz uma triagem de cada item, dá duas notas independentes aos promissores para escolher o que realmente vale a leitura, e escreve título e resumo em pt-BR. Matérias de fontes diferentes sobre o mesmo assunto são agrupadas num único fato, e os fatos são ordenados pela quantidade de fontes que falam deles. Todo dia às 08:00 (horário de Brasília) sai o resumo do dia.

É uma adaptação do framework open source [AIHOT](https://github.com/KKKKhazix/AIHOT), que foi feito originalmente em chinês para notícias de IA. Esta versão traz:

- **Interface pública e painel `/admin` em português.**
- **Horário de Brasília** (`America/Sao_Paulo`) em datas, edições e agendamentos.
- **26 fontes de tecnologia brasileiras** pré-configuradas em [`industry/sources.json`](industry/sources.json).
- **Taxonomia nova:** dispositivos, software, IA, games, mercado, ciência, dicas e análises, com empresas como Apple, Samsung, Google, Microsoft, Xiaomi, Motorola e outras ([`industry/taxonomy.ts`](industry/taxonomy.ts)).
- **Prompts editoriais reescritos em pt-BR** ([`industry/prompts/`](industry/prompts/)): critérios de seleção, escrita de títulos e resumos, tradução de conteúdo estrangeiro para português.

## Como funciona

1. **Coleta:** RSS, páginas de listagem, APIs JSON, contas do X e conteúdo enviado por scripts. A frequência de coleta se ajusta ao ritmo de cada fonte.
2. **Triagem:** descarta duplicados e itens fora do tema.
3. **Duas notas:** os itens promissores recebem duas notas independentes pela mesma régua; só entram na seleção os que passam do limite do nível da fonte (oficial, semioficial, imprensa).
4. **Escrita:** título, resumo que responde primeiro, "por que ler" e tradução integral de textos em outros idiomas.
5. **Agrupamento:** matérias sobre o mesmo fato viram um só item, com as atualizações embaixo.
6. **Popularidade e publicação:** quanto mais fontes independentes falando de um fato, mais alto ele fica. Resumo diário às 08:00, semanal às segundas e mensal no dia 1º.

Também tem páginas de tópicos, busca, RSS, API pública, MCP e `llms.txt` para agentes.

## Como rodar

Você precisa de [Docker](https://docs.docker.com/get-started/get-docker/), [Node.js 24](https://nodejs.org/en/download) (só para gerar a configuração) e uma chave de API de qualquer modelo compatível com a API da OpenAI (DeepSeek, OpenAI, OpenRouter etc.).

```bash
git clone https://github.com/danjustino/myhot-br.git
cd myhot-br
node scripts/init-env.ts --llm-key <sua chave de API>
docker compose up -d --build
```

Abra <http://localhost:3000>. O painel fica em `/admin`, e a senha é o `ADMIN_PASSWORD` gerado no `.env`. O conteúdo começa a aparecer em um ou dois minutos; a primeira importação leva cerca de meia hora.

O `init-env` configura o DeepSeek por padrão. Para outro provedor, ajuste `LLM_BASE_URL`, `LLM_MODEL` e `LLM_EXTRA_JSON` no `.env`, seguindo os exemplos do `.env.example`.

> O `.env` guarda sua chave e a senha do admin. Ele já está no `.gitignore`: nunca o envie para o GitHub.

## Personalizar

Quase tudo o que se muda fica nas pastas [`site/`](site/) e [`industry/`](industry/):

| Arquivo | O que muda |
|---|---|
| `site/site.ts` | Nome do site, textos, horários de publicação, página "sobre" |
| `industry/sources.json` | Fontes importadas na primeira execução |
| `industry/taxonomy.ts`, `industry/topics.json` | Categorias, tags e tópicos |
| `industry/prompts/` | Critério de seleção e regras de escrita: **é aqui que entra o conhecimento editorial** |
| `industry/selection.ts` | Limites de nota para entrar na seleção |
| `site/brand/`, `site/pages/` | Ícones e logo, termos de uso e privacidade |

A documentação técnica detalhada em [`docs/`](docs/) é a do projeto original, em chinês; agentes de código (Claude Code, Codex) leem sem problema.

Stack: Node.js 24 · TypeScript · React Router (SSR) · Fastify · PostgreSQL · pg-boss · Tailwind CSS · Docker Compose.

## Créditos e licença

Baseado no [AIHOT](https://github.com/KKKKhazix/AIHOT), de 数字生命卡兹克 (Khazix), publicado sob a [licença MIT](LICENSE). O código continua sob a mesma licença.

O nome "AIHOT" e o logo do AIHOT **não** fazem parte da licença e não são usados como marca deste projeto. As fontes tipográficas têm licenças próprias; veja o [NOTICE](NOTICE). O conteúdo das matérias pertence aos respectivos veículos: o site mostra só o resumo e o link para o original.

O README original do projeto, em inglês, está em [README.en.md](README.en.md).
