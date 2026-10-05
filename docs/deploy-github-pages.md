# Deploy no GitHub Pages

## Modelo usado pela JOJO

- site estatico
- sem backend
- sem banco de dados
- sem build
- sem Node para rodar
- publicado pelo GitHub Actions, com seleção dos arquivos públicos

## Estrutura esperada na raiz

- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- `offline.html`
- `assets/`
- `jogos/`
- `scripts/`
- `styles/`

## Como publicar

1. Fazer as alteracoes no repositório.
2. Confirmar que os arquivos continuam estaticos.
3. Rodar `node --test tests/*.test.cjs` (Node 22 ou superior, apenas para desenvolvimento).
4. Enviar para a branch `main`.
5. Em Settings > Pages, selecionar `GitHub Actions` como fonte de publicação.

O workflow testa o código e executa `node scripts/prepare-site.cjs`. O artefato publicado é somente `_site/`, nunca a raiz inteira do repositório. A ferramenta recusa uma pasta de saída já existente. Para criar outra prévia local sem apagar a anterior, use `node scripts/prepare-site.cjs _local/preview-nova` com um nome de pasta ainda não usado. Os jogos autorizados estão listados em `scripts/prepare-site.cjs` e novos jogos precisam ser incluídos explicitamente.

Não copie referências, registros de alunos, credenciais ou rascunhos para as pastas públicas. `robots.txt` orienta robôs, mas não restringe acesso a arquivos. A exclusão do artefato não torna privados arquivos de um repositório público.

## Observacoes

- O projeto usa caminhos relativos para funcionar tanto em dominio proprio quanto em GitHub Pages.
- Quando houver mudanca de arquivos estaticos importantes, atualizar a versao do cache em `service-worker.js`.
- Para o iPhone, a instalacao continua sendo pela opcao `Adicionar a Tela de Inicio`.
