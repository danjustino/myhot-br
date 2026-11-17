# Site

O que é só deste site: nome, textos, marca, páginas e quais módulos estão ativos. O passo a passo está em [Adapte ao seu setor](../docs/customize.md).

| Arquivo | Conteúdo |
|---|---|
| `site.ts` | Nome do site, termo do setor, horários das edições, textos da página inicial e da página Sobre, textos das imagens de compartilhamento, termos usados nos itens e nos resumos diário, semanal e mensal, categorias da API pública, registro do site |
| `models.ts` | Modelos com nome e qual cada etapa usa por padrão (etapas não listadas usam o modelo configurado no `.env`) |
| `brand/` | Ícones, logo (`Logo.tsx`), a marca escrita das imagens de compartilhamento e pôsteres (`wordmark.svg`, `wordmark-dark.svg`, opcionais), os cabeçalhos dos resumos diário, semanal e mensal (`nameplates/`), o QR code da página Sobre (`contact/`, opcional) |
| `pages/` | Termos de uso e política de privacidade (modelos; reescreva conforme a sua realidade antes de colocar no ar) |
| `public/` | Arquivos fixos publicados na raiz do site (publicados depois de trocar os marcadores de nome, endereço etc.): `robots.txt`, `manifest.webmanifest`, `openapi-v1.json` e, opcionalmente, `.well-known/security.txt` |
| `changelog.json` | Novidades do site |
| `modules/` | Quais módulos estão ativos: três listas, `index.ts`, `server.ts` e `web.ts`, com os módulos de `modules/<nome>/` na raiz do repositório que serão usados; vazias por padrão. Veja "Módulos" em [Arquitetura](../docs/architecture.md#módulos) |
