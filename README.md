<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/licen%C3%A7a-MIT-176b75?style=flat-square" alt="LicenÃ§a MIT"></a>
  <img src="https://img.shields.io/badge/Node.js-24-176b75?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 24">
  <img src="https://img.shields.io/badge/PostgreSQL-17-176b75?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 17">
  <img src="https://img.shields.io/badge/Docker-Compose-176b75?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose">
</p>

<h1 align="center">MyHOT</h1>

<p align="center">
  <b>As notÃ­cias de tecnologia que importam, escolhidas e resumidas automaticamente, em portuguÃªs.</b><br>
  Um site que acompanha as principais fontes de tecnologia, seleciona o que vale a pena ler e publica um resumo todo dia.
</p>

<p align="center">
  <a href="#como-rodar">Como rodar</a> Â·
  <a href="#como-funciona">Como funciona</a> Â·
  <a href="#personalizar">Personalizar</a> Â·
  <a href="#crÃ©ditos-e-licenÃ§a">CrÃ©ditos e licenÃ§a</a>
</p>

## O que Ã©

O MyHOT Ã© um agregador de notÃ­cias de **tecnologia geral para o pÃºblico brasileiro**: celulares e aparelhos, software e sistemas, IA, games, mercado, ciÃªncia, dicas e anÃ¡lises.

Todo dia ele coleta matÃ©rias de um conjunto de fontes. Um modelo de linguagem faz uma triagem de cada item, dÃ¡ duas notas independentes aos promissores para escolher o que realmente vale a leitura, e escreve tÃ­tulo e resumo em pt-BR. MatÃ©rias de fontes diferentes sobre o mesmo assunto sÃ£o agrupadas num Ãºnico fato, e os fatos sÃ£o ordenados pela quantidade de fontes que falam deles. Todo dia Ã s 08:00 (horÃ¡rio de BrasÃ­lia) sai o resumo do dia.

Ã‰ uma adaptaÃ§Ã£o do framework open source [AIHOT](https://github.com/KKKKhazix/AIHOT), que foi feito originalmente em chinÃªs para notÃ­cias de IA. Esta versÃ£o traz:

- **Interface pÃºblica e painel `/admin` em portuguÃªs.**
- **HorÃ¡rio de BrasÃ­lia** (`America/Sao_Paulo`) em datas, ediÃ§Ãµes e agendamentos.
- **26 fontes de tecnologia brasileiras** prÃ©-configuradas em [`industry/sources.json`](industry/sources.json).
- **Taxonomia nova:** dispositivos, software, IA, games, mercado, ciÃªncia, dicas e anÃ¡lises, com empresas como Apple, Samsung, Google, Microsoft, Xiaomi, Motorola e outras ([`industry/taxonomy.ts`](industry/taxonomy.ts)).
- **Prompts editoriais reescritos em pt-BR** ([`industry/prompts/`](industry/prompts/)): critÃ©rios de seleÃ§Ã£o, escrita de tÃ­tulos e resumos, traduÃ§Ã£o de conteÃºdo estrangeiro para portuguÃªs.

## Como funciona

1. **Coleta:** RSS, pÃ¡ginas de listagem, APIs JSON, contas do X e conteÃºdo enviado por scripts. A frequÃªncia de coleta se ajusta ao ritmo de cada fonte.
2. **Triagem:** descarta duplicados e itens fora do tema.
3. **Duas notas:** os itens promissores recebem duas notas independentes pela mesma rÃ©gua; sÃ³ entram na seleÃ§Ã£o os que passam do limite do nÃ­vel da fonte (oficial, semioficial, imprensa).
4. **Escrita:** tÃ­tulo, resumo que responde primeiro, "por que ler" e traduÃ§Ã£o integral de textos em outros idiomas.
5. **Agrupamento:** matÃ©rias sobre o mesmo fato viram um sÃ³ item, com as atualizaÃ§Ãµes embaixo.
6. **Popularidade e publicaÃ§Ã£o:** quanto mais fontes independentes falando de um fato, mais alto ele fica. Resumo diÃ¡rio Ã s 08:00, semanal Ã s segundas e mensal no dia 1Âº.

TambÃ©m tem pÃ¡ginas de tÃ³picos, busca, RSS, API pÃºblica, MCP e `llms.txt` para agentes.

## Como rodar

VocÃª precisa de [Docker](https://docs.docker.com/get-started/get-docker/), [Node.js 24](https://nodejs.org/en/download) (sÃ³ para gerar a configuraÃ§Ã£o) e uma chave de API de qualquer modelo compatÃ­vel com a API da OpenAI (DeepSeek, OpenAI, OpenRouter etc.).

```bash
git clone https://github.com/danjustino/myhot-br.git
cd myhot-br
node scripts/init-env.ts --llm-key <sua chave de API>
docker compose up -d --build
```

Abra <http://localhost:3000>. O painel fica em `/admin`, e a senha Ã© o `ADMIN_PASSWORD` gerado no `.env`. O conteÃºdo comeÃ§a a aparecer em um ou dois minutos; a primeira importaÃ§Ã£o leva cerca de meia hora.

O `init-env` configura o DeepSeek por padrÃ£o. Para outro provedor, ajuste `LLM_BASE_URL`, `LLM_MODEL` e `LLM_EXTRA_JSON` no `.env`, seguindo os exemplos do `.env.example`.

> O `.env` guarda sua chave e a senha do admin. Ele jÃ¡ estÃ¡ no `.gitignore`: nunca o envie para o GitHub.

## Personalizar

Quase tudo o que se muda fica nas pastas [`site/`](site/) e [`industry/`](industry/):

| Arquivo | O que muda |
|---|---|
| `site/site.ts` | Nome do site, textos, horÃ¡rios de publicaÃ§Ã£o, pÃ¡gina "sobre" |
| `industry/sources.json` | Fontes importadas na primeira execuÃ§Ã£o |
| `industry/taxonomy.ts`, `industry/topics.json` | Categorias, tags e tÃ³picos |
| `industry/prompts/` | CritÃ©rio de seleÃ§Ã£o e regras de escrita: **Ã© aqui que entra o conhecimento editorial** |
| `industry/selection.ts` | Limites de nota para entrar na seleÃ§Ã£o |
| `site/brand/`, `site/pages/` | Ãcones e logo, termos de uso e privacidade |

A documentaÃ§Ã£o tÃ©cnica detalhada em [`docs/`](docs/) Ã© a do projeto original, em chinÃªs; agentes de cÃ³digo (Claude Code, Codex) leem sem problema.

Stack: Node.js 24 Â· TypeScript Â· React Router (SSR) Â· Fastify Â· PostgreSQL Â· pg-boss Â· Tailwind CSS Â· Docker Compose.

## CrÃ©ditos e licenÃ§a

Baseado no [AIHOT](https://github.com/KKKKhazix/AIHOT), de æ•°å­—ç”Ÿå‘½å¡å…¹å…‹ (Khazix), publicado sob a [licenÃ§a MIT](LICENSE). O cÃ³digo continua sob a mesma licenÃ§a.

O nome "AIHOT" e o logo do AIHOT **nÃ£o** fazem parte da licenÃ§a e nÃ£o sÃ£o usados como marca deste projeto. As fontes tipogrÃ¡ficas tÃªm licenÃ§as prÃ³prias; veja o [NOTICE](NOTICE). O conteÃºdo das matÃ©rias pertence aos respectivos veÃ­culos: o site mostra sÃ³ o resumo e o link para o original.

O README original do projeto, em inglÃªs, estÃ¡ em [README.en.md](README.en.md).
