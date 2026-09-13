# 🚧 Em execução — refatorar catálogo com rail de fichas geradas

> Prioridade: P1
>
> Área afetada: interface e descoberta de catálogo
>
> Origem ou referência: UX-BS-004; `evidence/ux-ui/current/04-catalog-fichas/fluxo.txt`
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-12`
>
> Triagem automática: `Material — descoberta e escopo de dados`
>
> Segurança: `Aplicável se alterar consulta autenticada, filtros ou acesso a fichas; avaliar no gate`

## Pedido

Refatorar o catálogo para separar filtros, resultados e um rail contextual de fichas já geradas, mantendo confirmação de identidade exata antes de abrir conteúdo.

## Critérios de aceite

- [ ] Resultados de busca, recentes e fichas já geradas têm função e origem claras.
- [ ] Rail de geradas respeita o escopo real de sessão/organização e não sugere compatibilidade automática.
- [ ] Filtros, paginação, vazio, erro e abertura de ficha preservam os contratos existentes.
- [ ] Identidade, versão, mercado e status permitem distinguir candidatas sem aproximação silenciosa.

## Restrições ou contexto

- Ler P1-024, P1-025, contrato de busca técnica e fluxo canônico antes da arquitetura.
- Não criar fonte de persistência, ranking pessoal ou inferência de compatibilidade nesta task.
- Aplicar security assurance se houver mudança de rota, autorização ou escopo de consulta.

## Arquitetura visual, segurança e composição — 2026-09-12

### Fatos confirmados

- A captura `evidence/ux-ui/current/04-catalog-fichas/screencapture-localhost-5173-2026-09-11-02_44_37.png` mostra dois formulários longos empilhados numa coluna estreita, candidatos pequenos no rodapé e um painel de detalhe vazio ocupando a maior parte do viewport. O problema é de composição e hierarquia, não de ausência de filtros.
- `FichaDiscovery` já consulta o catálogo autenticado com recentes, busca por identidade, filtros de marca/modelo/ano/mercado, escopo de versão e paginação. `TechnicalFichaDiscovery` consulta facetas técnicas confirmadas por fonte rastreável em endpoint existente e separado. Ambos preservam seleção de identidade exata antes de abrir uma ficha.
- P1-024/P1-025 definem que catálogo é global para sessão corporativa ativa; ele não revela organização de origem, ator ou histórico pessoal. Relacionadas são determinísticas (marca, modelo, ano e mercado), não recomendação, ranking ou confirmação de compatibilidade.
- O pedido humano quer opções de fichas já geradas no lado direito, mas o fluxo pode evoluir. Com o contrato atual, o rail pode mostrar somente "Fichas recentes no catálogo"; não pode ser chamado de "suas", "da sua organização", "recomendadas" ou "compatíveis".
- A referência `WhatsApp Image 2026-09-11 at 02.55.43.jpeg` ensina filtros organizados, grid de resultados homogêneo e leitura rápida. O Design System e a análise visual determinam navegação superior, superfícies claras, foco no veículo e nenhum uso de sidebar pesada nessa jornada.
- Nenhuma imagem de veículo está aprovada ou vinculada a identidade exata. Esta task é `NO_IMAGE`: cards usam identidade textual e metadados até P1-043 curar assets, sem foto genérica que prometa uma configuração específica.

### Decisão e escopo

Refatorar a experiência visual de catálogo como uma jornada em dois estados, sobre os contratos atuais:

1. **Descoberta:** filtros à esquerda, resultados no centro e rail de fichas recentes à direita no desktop. O rail é uma segunda porta de descoberta de escopo global autenticado, não uma recomendação; ele mostra identidade, ano-modelo, mercado e versão técnica retornada pelo servidor.
2. **Leitura exata:** depois de escolher uma candidata, a confirmação existente abre a P1-040 em largura útil, com ação clara de voltar aos resultados preservando os critérios em memória. A ficha não é comprimida em uma terceira coluna nem exibida ao lado de uma área vazia.

Esta task reorganiza JSX/CSS e estado local de interface. Não cria endpoint, filtro, ranking, persistência, telemetria, provider, imagem, preferência salva, escopo de organização ou regra de compatibilidade. A abertura continua enviando a identidade exata existente; comparar/exportar continuam condicionados pelo runtime e papel já implementados.

### Pessoa usuária, objetivo e fluxo

- **Pessoa:** sessão corporativa ativa que quer encontrar uma ficha persistida ou entender que ela ainda não existe, sem depender de saber uma consulta exata previamente.
- **Objetivo:** distinguir rapidamente candidatas por identidade, filtrar apenas por critérios comprovados, abrir uma ficha exata e alcançar ações elegíveis sem inferência visual.
- **Fluxo de descoberta:** abrir catálogo → recentes aparecem em resultados e rail → escolher modo de filtro (`Identidade` ou `Características técnicas`) → aplicar/limpar/paginar → selecionar candidata → servidor confirma identidade exata → abrir workspace da ficha ou explicar `não cadastrado`/`incompatível` → voltar à descoberta preservando consulta.
- **Regra do rail:** click em uma linha apenas seleciona a candidata e segue a mesma confirmação exata. Ele não altera filtros, não autoabre, não afirma relação com o resultado central e não transporta seleção para comparação automaticamente.

### Especificação visual da tela

**Canvas de descoberta (desktop, 12 colunas, máximo 1280 px):**

1. Após a navegação superior, cabeçalho curto com título `Catálogo de fichas`, descrição de escopo e contagem/estado dos resultados. Não usar narrativa de aquisição, KPI fictício ou espaço hero vazio.
2. Coluna esquerda (3 colunas): um único painel de filtros. A escolha `Por identidade` / `Por características técnicas` troca o conjunto de controles e explica a semântica da busca. Em identidade, texto, marca, modelo, ano-modelo, mercado e escopo de versão; em características, somente facetas já suportadas pelo endpoint e a regra explícita de que correspondência é técnica confirmada. Aplicar e limpar ficam no fim do grupo, sempre próximos aos filtros.
3. Região central (6 colunas): cabeçalho de resultados e grid/lista responsiva de cards homogêneos. Cada card expõe como texto de interface: marca/modelo, versão, ano-modelo, mercado, versão técnica e data apenas quando retornada. Um status de ausência de versão impede ação de abrir/comparar e explica o limite. Sem imagem, preço, saúde, autonomia, nota, selo de qualidade ou característica não retornada.
4. Rail direito (3 colunas): `Fichas recentes no catálogo`, carregado com a mesma consulta existente de recentes e limite curto. Cada item é uma linha densa, com identidade e versão. Um link/ação `Ver resultados recentes` muda a região central para os recentes; não há ranking, favoritos, relação automática ou card de marketing.
5. Paginação pertence aos resultados centrais. Filtros ativos aparecem como texto/chips removíveis acima do grid, com alternativa de limpar; chips não são fonte de verdade nem substituem inputs.

**Estado de leitura:** ao abrir uma candidata, a tela passa ao `TechnicalFichaWorkspace` da P1-040 em largura de leitura, sob o mesmo cabeçalho/navegação, com `Voltar ao catálogo`. Filtros/rail permanecem no estado de navegação, não espremem a ficha. Relacionadas determinísticas, quando vierem do fluxo existente, entram como seção explicitamente intitulada dentro do contexto da ficha e repetem a regra de não compatibilidade.

**Superfícies e tipografia:** canvas quente-neutro, superfícies claras, borda discreta e profundidade baixa; laranja somente em ação, foco e item selecionado. O card central não usa sombra decorativa, imagem falsa ou material glass. Identidade recebe maior peso tipográfico que metadados; status e limitação usam texto/ícone além de cor. O ritmo é de catálogo automotivo técnico, não ERP, concessionária ou dashboard de telemetria.

**Responsividade:** em tablet (8 colunas), filtro vira faixa/drawer controlado e rail passa abaixo dos resultados ou em faixa horizontal, antes de reduzir a largura dos cards. Em mobile (4 colunas), filtros abrem por botão com foco protegido e resumo dos critérios; resultados ficam em uma coluna; rail aparece como seção colapsável após os resultados. A leitura exata continua independente e de uma coluna, sem miniaturizar a P1-040.

### Estados, acessibilidade e movimento

- `loading` de recentes, resultado central, rail e abertura de ficha identifica qual região está carregando; skeleton/estado não usa veículos ou números fictícios.
- `vazio` de identidade e `sem correspondência técnica` são distintos, explicam a regra aplicada e oferecem limpar filtros ou solicitar nova coleta conforme o fluxo existente.
- `erro` é persistente na região afetada, com nova tentativa; toast apenas complementa resultado de ação confirmada e nunca desloca grid/filtros.
- `não cadastrado` e `incompatível` continuam confirmação de abertura, não resultado silencioso de filtro. A identidade candidata permanece visível junto da explicação.
- Filtros têm labels, controles nativos e anúncio de contagem; cards são botões/links com nome acessível completo; rail possui landmark próprio; ordem de teclado acompanha filtro → resultado → rail; nenhum estado depende apenas de cor.
- Movimento fica limitado a `control.feedback`, `flow.forward/backward` ao entrar/sair da leitura e `toast.*` já aprovados. Sem scroll hijacking, shimmer, imagem, ambient novo ou animação que faça parecer que busca técnica foi confirmada antes da resposta.

### Impacto técnico, segurança e conformidade

- Arquivos previstos: `apps/web/src/FichaDiscovery.tsx`, `apps/web/src/TechnicalFichaDiscovery.tsx`, componente CSS/local de catálogo (preferencialmente isolado), `apps/web/src/App.tsx` apenas para alternar descoberta/leitura e callbacks existentes, evidência sanitizada e esta task.
- A UI pode chamar as funções atuais `buscarCatalogo`, `buscarCatalogoTecnico`, `abrirFichaCatalogo` e `obterRecomendacoesCatalogo` com os mesmos parâmetros e credenciais; não adiciona rota, query param, cabeçalho, cache persistente ou armazenamento local.
- **Segurança: não aplicável nesta refatoração prevista.** A fronteira autenticada, o catálogo global existente, a identidade exata, RBAC e as respostas retornadas não mudam. Estado de filtro/rail fica em memória. Reabrir `project-security-assurance` se houver mudança de endpoint, escopo/tenant, papel, filtro aceito, resultado retornado, persistência ou ação de comparação/exportação.
- **Conformidade: não aplicável.** Não há coleta, perfil, personalização, favorito, telemetria, transferência, retenção ou dado pessoal novo. A expressão visual `recentes` deriva somente da versão já persistida, não da navegação da pessoa.

### Plano incremental e verificações

1. Extrair/normalizar layout de descoberta em componentes visuais sem alterar funções de API ou tipos de catálogo.
2. Implementar primeiro estado de recentes com rail estático de dados existentes e executar checkpoint PEK de primeira renderização em 1440, 768 e 390 px antes de polir cards/filtros.
3. Integrar os dois modos de filtro e resultados/estados existentes, mantendo semântica diferente para identidade e característica técnica.
4. Integrar a transição para leitura P1-040 com retorno ao catálogo; não misturar o rail com o workspace de detalhe.
5. Rodar `npm run typecheck`, `npm run build`, `git diff --check` e smoke sanitizado de recentes, filtros, limpar, paginação, vazio, erro, candidato sem versão, identidade incompatível, teclado e reduced motion.

### Double-check da arquitetura

- A grande área vazia observada é substituída por uma região central responsável por descoberta; filtro e rail têm papéis delimitados, sem duplicar formulário ou concentrar tudo numa coluna estreita.
- O rail atende ao pedido de fichas já geradas, mas o texto preserva o fato de que o catálogo atual é global autenticado. Ele não afirma organização, preferência, recomendação ou compatibilidade que o contrato não comprova.
- A referência visual foi traduzida em proporção, grade, densidade e clareza; nenhuma foto, marca, preço, telemetria ou sidebar foi copiada.
- O detalhe de ficha não é comprimido pela composição de catálogo. Ele reutiliza a P1-040 e volta ao contexto de filtros sem perder identidade ou estado local.
- Falha se a UI cria filtro técnico fora do endpoint, se um card/rail abre aproximação silenciosa, se um status de qualidade é inventado, se a versão/mercado somem da candidata ou se o mobile reduz a tarefa a cards ilegíveis.

### Architecture Gate

`APPROVED — Lucas autorizou a implementação em 2026-09-12.`

## Resultado do agente

- Estado: `🚧 Em execução`
- Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-12`.
- Triagem automática: `Material — descoberta e escopo de dados`.
- Segurança: `Não aplicável — refatoração de apresentação reutiliza contratos, RBAC e respostas existentes; reavaliar se expandir fronteira`.
- Implementação: criado `CatalogWorkspace` com filtros por identidade/características, resultados centrais, rail de fichas recentes, paginação de identidade, estados de loading/vazio/erro e retorno ao catálogo após a leitura. A abertura segue a confirmação exata existente; a ficha detalhada usa a P1-040 em largura própria; comparação/exportação continuam condicionadas pelos callbacks/papel atuais. Não há imagem, ranking, recomendação ou persistência nova.
- Arquivos alterados: `apps/web/src/CatalogWorkspace.tsx`, `apps/web/src/catalog-workspace.css`, `apps/web/src/App.tsx` e esta task.
- Verificação: `npm run typecheck` passou; `npm run build` passou; `git diff --check` passou. Captura atual do catálogo, referência específica, análise de referências visuais, Image System, Design System, P1-024/P1-025, fluxo canônico, contrato de facetas e APIs consumidoras foram revisados.
- Pendências: executar checkpoint PEK com render sanitizado em 1440, 768 e 390 px; revisar teclado, filtros, paginação, vazio, erro, ficha sem versão, identidade incompatível e reduced motion. O navegador automatizado deste ambiente permanece indisponível, portanto build não constitui aprovação visual.
- Próximo passo: Lucas fornecer/validar evidência renderizada; tratar os achados antes de concluir visualmente a task.
