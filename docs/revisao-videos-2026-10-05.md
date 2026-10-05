# Aplicação dos cinco vídeos à JOJO

Análise em 05/10/2026, a partir das legendas e imagens. Não é uma transcrição integral do áudio. Os arquivos 4 e 5 são cópias idênticas, verificadas por SHA-256, dos dois vídeos analisados em 03/10; as correções anteriores foram preservadas.

## Vídeos novos

1. `b8360cb595f574bf4796352e28ddcb1c.mp4`: consultas SQL parametrizadas, segurança por linha (RLS) e autorização. O código público da JOJO não tem backend, SQL, Supabase, login ou servidor MCP. Não há um banco remoto para configurar. As generalizações do vídeo sobre todo banco criado com IA não foram tomadas como diagnóstico. A revisão anterior já protegeu o HTML da agenda, restringiu scripts e a seleção de arquivos publicados. Se houver backend no futuro, exigir autorização no servidor, consultas parametrizadas e políticas de acesso adequadas antes de disponibilizar dados.
2. `9808a87d52d7e1158906b755f25a3e60.mp4`: imagem de compartilhamento, títulos/descrições e Search Console. A imagem local existente foi preservada; os metadados foram completados em todas as páginas indexáveis. O Search Console depende de uma propriedade verificada pelo titular e não foi configurado sem esses dados.
3. `2e203a10e310b5211232d0855214384d.mp4`: lista de 20 itens para lançamento, com aplicação abaixo.

## Os 20 itens e a decisão para a JOJO

| Item do vídeo | Aplicação |
| --- | --- |
| 1. Página 404 | Criada `404.html`, com links de recuperação, sem indexação. Caminhos absolutos para funcionar em URLs inexistentes profundas no domínio próprio atual. |
| 2. CTAs claros | Mantidos Jogos/Ferramentas na home; ações “Escolher um jogo” e “Abrir agenda” na ajuda e retorno aos jogos no erro 404. |
| 3. Links personalizados | Preservadas URLs legíveis, links diretos e redirecionamentos antigos. Acrescentados links de ajuda na home e catálogo. |
| 4. Seção de casos | Adaptada para três exemplos de uso em sala; não são depoimentos nem alegações de resultados comprovados. |
| 5. Página de obrigado | Não há formulário de captação, compra ou envio pelo servidor. A agenda já mostra confirmação ao gerar PDF. Não foi criada uma página sem fluxo correspondente. |
| 6. Breadcrumbs | Caminho “Início / Ajuda” na página nova; preservados os botões de retorno dos jogos para não ocupar a área das atividades. |
| 7. FAQ com cinco perguntas | Criada em `ajuda.html`: gratuidade, escolha de atividades, instalação, offline e registros/relatórios. Usa HTML nativo, inclusive sem JavaScript. |
| 8. Promessa de resposta | Mantido contato por e-mail. Nenhum prazo de atendimento foi inventado. |
| 9. CTA fixo mobile | Preservados os controles existentes de instalação/contato. Não foi acrescentada uma faixa sobre as áreas dos jogos. |
| 10. robots.txt | Já existente, com referência ao sitemap; preservado. Não é usado como controle de acesso. |
| 11. Títulos únicos | Verificados por teste em todas as páginas do sitemap, incluindo ajuda. |
| 12. Metadescriptions | Verificadas; ajuda recebeu descrição própria e metadados coerentes. |
| 13. Imagem de compartilhamento | Preservada a imagem 1200 × 630 já existente; completos dimensões, tipo, texto alternativo e metadados Twitter/Open Graph. |
| 14. Mapas e rotas | Não se aplica à plataforma online; não há endereço de estabelecimento fornecido. |
| 15. Avaliações reais | Não foram fornecidas avaliações verificáveis para publicar. Nenhuma avaliação ou estrela fictícia foi criada. |
| 16. Texto alternativo | Imagens HTML das páginas indexáveis conferidas por teste; imagens decorativas mantêm `alt=""`. Isso não certifica toda a acessibilidade dos jogos ou substitui transcrição dos cartões que contêm texto em imagem. |
| 17. Marcação local | Mantida a identidade de plataforma educacional; não foi inventado um negócio local. |
| 18. Política de privacidade | Já existia. Agora acessível pela home e ajuda, com explicação factual mais precisa sobre armazenamento local e perda de registros ao limpar o navegador. Não é uma revisão jurídica. |
| 19. Google Analytics | Não adicionado: não há propriedade/ID ou objetivo de medição fornecido. Não é necessário para o site funcionar ou para configurar o Search Console. |
| 20. Foto real da equipe | Mantida a autoria existente. Não há foto autorizada fornecida e ela não foi substituída por uma imagem fictícia. |

## Verificações realizadas

- `node --test tests/*.test.cjs`: 20 testes passaram, incluindo os jogos e a segurança anterior.
- Verificados metadados, títulos únicos, links locais e inclusão dos arquivos novos no pacote público.
- Prévia gerada em `_local/preview-videos-20261005/`, com 382 arquivos; a publicação padrão continua usando `_site/` no GitHub Actions.
- Navegação móvel e desktop inspecionada visualmente. Home e ajuda sem rolagem horizontal a 390 px.
- Servidor de prévia simulando a resposta 404 do GitHub Pages: URL profunda devolveu status 404, carregou os recursos e permitiu voltar ao catálogo.
- FAQ com cinco itens, interação sem JavaScript e ajuda offline após carregar a home: aprovados.
- Nenhum erro de JavaScript nos fluxos novos. O erro HTTP 404 provocado no teste é esperado.
- Nenhuma publicação, envio de e-mail, cadastro no Google ou inserção de rastreamento foi realizado.

## Search Console: etapa dependente da conta

Depois de publicar:

1. Acessar https://search.google.com/search-console com a conta que administra a JOJO.
2. Selecionar uma propriedade já verificada ou adicionar o prefixo `https://jojo.profanaclara.com.br/`.
3. Se necessário, obter a tag HTML de verificação fornecida pelo Google e incluí-la no `head` de `index.html`. Usar exatamente a tag daquela propriedade; não inserir um código de exemplo. Outra opção é a verificação de domínio por DNS feita pelo administrador do domínio.
4. Publicar a tag, concluir a verificação no Google e cadastrar `https://jojo.profanaclara.com.br/sitemap.xml` em Sitemaps.
5. Inspecionar a home e as páginas principais, incluindo gêneros textuais e ajuda. Acompanhar os relatórios de indexação; envio não garante inclusão ou posição nos resultados.

A verificação deve permanecer no site/DNS para manter a propriedade. A tag de verificação não requer adicionar Google Analytics. O workflow atual não publica arquivos HTML de verificação arbitrários da raiz; se for usado o método de arquivo em vez de tag, o nome exato precisa entrar na lista de arquivos públicos.

## Referências

- GitHub, página 404: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site
- Google, verificação de propriedade: https://support.google.com/webmasters/answer/9008080
- W3C, imagens decorativas: https://www.w3.org/WAI/tutorials/images/decorative/
- Revisão anterior: `revisao-videos-seguranca-seo.md`.
