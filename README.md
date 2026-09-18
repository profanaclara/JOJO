# JOJO

Plataforma de jogos e ferramentas assistivas da JOJO.

## Padrao tecnico

- app web estatico
- PWA instalavel
- HTML, CSS e JavaScript puros
- hospedagem no GitHub Pages
- sem backend
- sem banco de dados
- sem login
- sem Node obrigatorio para rodar
- sem build complexo
- sem variaveis de ambiente
- sem painel externo
- facil de editar com arquivos estaticos

## Estrutura

- `index.html`: entrada da plataforma
- `assets/`: identidade visual compartilhada
- `styles/`: estilos da home da plataforma
- `scripts/`: dados e comportamento da home
- `jogos/`: jogos e ferramentas integrados
- `agenda/`: ferramenta de registro pedagogico
- `docs/`: anotacoes rapidas de publicacao
- `referencias/`: arquivos de referência e fontes originais

## Jogos atuais

Linkados no menu (home e `jogos/`):

- `jogos/palavras/`
- `jogos/textos/`
- `jogos/timer/`
- `jogos/popit-soma/`
- `jogos/popit-subtracao/`
- `jogos/tabuada-pitagoras/`
- `jogos/cabo-de-guerra-operacoes-fracoes/` (versao com operacoes e fracoes juntas - versao final)

Nao publicado (so na maquina local, ainda nao commitado no Git):

- `jogos/jojo-cidade/`

O unico Cabo de Guerra mantido e `jogos/cabo-de-guerra-operacoes-fracoes/`, com os dois modos. O codigo e as midias das versoes antigas foram removidos. Os caminhos `jogos/cabo-de-guerra/` e `jogos/cabo-de-guerra-fracoes/` contem apenas um `index.html` de redirecionamento para preservar favoritos e links compartilhados. Todas as futuras alteracoes do jogo devem ser feitas na versao unificada.

Teste de regressao do Cabo de Guerra (Node, apenas para desenvolvimento): `node --test tests/cabo-de-guerra.test.cjs`.

## Fluxo de trabalho

1. Ajustar localmente os arquivos do jogo ou da plataforma.
2. Testar a versão antes de publicar.
3. Atualizar este repositório.
4. Publicar no GitHub Pages.

## Publicação

A JOJO foi pensada para publicar como site estatico no GitHub Pages, sem backend e sem build.

- `manifest.webmanifest` na raiz
- `service-worker.js` na raiz
- cache versionado no service worker
- funciona como site e como app instalavel pelo navegador

Mais detalhes em `docs/deploy-github-pages.md`.
