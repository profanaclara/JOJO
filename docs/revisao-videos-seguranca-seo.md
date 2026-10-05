# Revisão dos vídeos: segurança e descoberta da JOJO

Data: 03/10/2026. Análise das legendas e imagens dos dois vídeos enviados, cruzada com os arquivos do projeto. Não é uma transcrição integral do áudio nem uma certificação de segurança.

## O que os vídeos abordam

O primeiro vídeo apresenta XSS, autorização de APIs, exposição de chaves, banco aberto, SQL injection, falta de limites de requisições, prompt injection e dependências inventadas. A porcentagem citada no vídeo não foi adotada como diagnóstico da JOJO.

O segundo recomenda sitemap.xml, robots.txt e llms.txt. Os três já existiam no projeto. A afirmação de que sua ausência impede necessariamente a presença no Google é incorreta: o Google não exige llms.txt e sitemaps também não garantem indexação.

## Aplicação ao projeto

| Tema | Situação e ação |
| --- | --- |
| XSS | Os nomes e as anotações da agenda já eram escapados. Corrigidos os atributos de mês e data lidos do armazenamento local. É uma proteção adicional contra dados adulterados; não foi identificado um formulário público que injete esses valores remotamente. |
| Política de conteúdo | CSP em todas as páginas públicas, inclusive páginas auxiliares: scripts locais e hashes dos poucos scripts embutidos, sem liberar scripts inline arbitrários ou eval. Fontes Google e estilos inline continuam permitidos por compatibilidade com a interface. |
| Chaves e arquivos internos | Busca por formatos comuns de credenciais nos arquivos versionados não encontrou correspondências. Arquivos .env e chaves foram acrescentados ao .gitignore. A publicação passa a copiar somente arquivos permitidos para _site; testes, referências, rascunhos e JOJO Cidade ficam fora. A busca não cobre o histórico Git nem garante ausência de todo tipo de segredo. |
| APIs, banco e login | Não há backend, banco remoto, login ou APIs pagas no site publicado. Autorização de API, RLS, SQL injection e limite de tentativas não têm um componente atual em que aplicar uma correção. Reavaliar se esses recursos forem adicionados. |
| Prompt injection | O site publicado não possui integração de IA que execute instruções recebidas de usuários. |
| Dependências | Biblioteca local jsPDF atualizada de 3.0.4 para 4.2.1, obtida da tag oficial. Nenhuma dependência de execução foi adicionada. O código Node é somente uma ferramenta de publicação e teste. |
| Descoberta | Incluídos gêneros textuais no sitemap e metadados de compartilhamento; gêneros textuais e Cabo de Guerra no llms.txt. A home tem links reais com fallback e o catálogo oferece links estáticos para todos os jogos e ferramentas. |
| PWA | Versão do cache atualizada para distribuir os arquivos corrigidos após a publicação. |

## Manutenção e limites

Validação concluída: 18 testes automatizados passaram. No navegador, 16 páginas/rotas foram carregadas sem erros de JavaScript ou violações CSP durante a navegação normal. Foram verificados o fluxo de salvar um registro fictício e baixar seu PDF com jsPDF 4.2.1, a abertura da home offline e os links do catálogo com JavaScript desativado. Um script inline de teste foi bloqueado pela CSP; uma data com HTML adulterado foi exibida sem criar elementos nem executar código, inclusive em contexto isolado com a CSP removida para validar o escape independentemente.

- Rodar `node --test tests/*.test.cjs` antes de publicar. Os testes também conferem os hashes CSP e a coerência do sitemap.
- Mudanças em scripts embutidos exigem atualizar seu hash SHA-256 na CSP da página; os testes falham se houver divergência. A quebra de linha usada para calcular o hash é LF, como no parser HTML.
- A CSP em meta não configura cabeçalhos HTTP como HSTS, X-Content-Type-Options ou frame-ancestors. Esses controles dependem da hospedagem/proxy e não são alegados como implantados.
- Os registros pedagógicos continuam no navegador. Não foi criada uma camada de autenticação, criptografia ou sincronização dos registros.
- O filtro de publicação não torna privado um repositório público e não remove dados já existentes do histórico Git.
- Alterações locais não alteram o domínio público até serem enviadas e publicadas pelo fluxo do GitHub Pages. Search Console e indexação real não foram configurados nesta revisão.

## Origem da biblioteca

- jsPDF: https://github.com/parallax/jsPDF/releases/tag/v4.2.1
- Arquivo: https://raw.githubusercontent.com/parallax/jsPDF/v4.2.1/dist/jspdf.umd.min.js
- SHA-256: `e6551fcdc32f09d6853b2c5126d18d01d9447e0da618a41a11ebeee0f6c20d54`
- Licença mantida em `assets/vendor/jspdf/LICENSE`.
- Os avisos do jsPDF abrangem APIs e ambientes diferentes. Atualizar a biblioteca não significa que a JOJO explorava todos os caminhos vulneráveis descritos nesses avisos.

## Referências técnicas

- Google, links rastreáveis: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- Google, recursos de IA e llms.txt: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- OWASP, prevenção de XSS: https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html
- MDN, CSP: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
- GitHub Pages, publicação por workflow: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
