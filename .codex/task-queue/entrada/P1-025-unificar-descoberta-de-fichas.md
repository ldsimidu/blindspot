# ❌ Pendente — Unificar descoberta de fichas no catálogo e comparação

> Prioridade: P1
>
> Área afetada: interface de catálogo e comparação
>
> Origem ou referência: P1-024; `docs/product/backlog.md` E03-02/E03-03
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-09.`
>
> Triagem automática: `Material — altera a jornada de descoberta e seleção na interface, sem alterar API, schema, IA ou persistência.`
>
> Segurança: `Não aplicável — reutiliza rotas autenticadas, RBAC e dados já entregues; não cria endpoint, permissão, dado pessoal, telemetria ou armazenamento.`

## Pedido

Corrigir a comparação que começa sem fichas recentes e criar uma experiência única, reutilizável e coerente de descoberta de fichas em todos os pontos atuais que precisam localizá-las.

## Fatos confirmados

- O Catálogo da P1-024 chama `buscarCatalogo({ sort: "recent" })` ao ser aberto e já possui texto, marca, modelo, ano-modelo e mercado.
- `ComparisonPanel` chama `buscarCatalogo` somente ao submeter seu campo textual; portanto inicia com `candidates=[]`, mesmo com fichas persistidas.
- No checkout atual, os únicos pontos de interface que procuram uma ficha existente são **Catálogo** e **Comparar**. Requisitar ficha cria nova coleta; Histórico somente abre respostas já listadas; Equipe, Consumo, cadastro e convites não pesquisam fichas.
- Os atributos de identidade estão em colunas pesquisáveis e são estáveis. Os campos técnicos do payload são heterogêneos, podem ter ausência/conflito/não aplicabilidade e não constituem um índice/faceta aprovada.

## Decisão proposta

Criar um componente de interface `FichaDiscovery` reutilizado por Catálogo e Comparar, alimentado exclusivamente pelo contrato já existente de `GET /api/catalogo/fichas`.

1. Ao montar em Catálogo ou Comparar, o componente busca a primeira página de fichas recentes (`sort=recent`) e mostra carregando, resultado, vazio e erro explicitamente.
2. Texto livre, marca, modelo, ano-modelo e mercado têm o mesmo comportamento nos dois locais. Aplicar filtros reinicia na primeira página; limpar retorna a recentes; paginação preserva os filtros atuais.
3. Cada candidata mostra tags de **identidade** retornadas pelo servidor: marca/modelo, versão, ano-modelo, mercado e versão técnica. Tags de filtros ativos explicam por que a lista mudou, mas não são dados persistidos nem perfil de usuário.
4. No Catálogo, selecionar candidata continua exigindo abertura por identidade exata e pode mostrar relacionadas. Em Comparar, selecionar candidata apenas preenche uma das duas posições; o servidor de P1-017 ainda valida versões, papel e compatibilidade quando a pessoa aciona comparar/salvar.
5. `viewer` continua sem ação de comparação. A interface não substitui `requireRole` nem envia tenant, resultado de comparação, payload de ficha ou qualquer campo técnico calculado.

## Deliberação sobre filtros do payload técnico

- **Fora deste corte:** transformar cada chave do payload em tag/filtro, filtrar JSON arbitrário, inferir `motor_tipo`, criar ranking, autocomplete remota, favoritos, histórico de pesquisa ou recomendação personalizada.
- **Motivo:** as aproximadamente 204 variáveis têm status e aplicabilidade diferentes; filtrar “motor elétrico”, por exemplo, mistura ausência com não aplicável, exige semântica por campo e pode induzir uma falsa equivalência. Além disso, não há índice/faceta ou contrato de consulta técnica aprovado.
- **Evolução posterior possível:** uma task específica pode escolher poucas facetas técnicas normalizadas, declarar status elegíveis (`confirmado`/`parcial`), modelar índice/contrato e provar consultas determinísticas. Essa decisão exigirá Architecture Gate, segurança por novo contrato/persistência e revisão de desempenho.

## Critérios de aceite

- [x] Entrar em **Comparar** carrega recentes automaticamente, sem termo prévio, com estado de loading/vazio/erro acessível.
- [x] Catálogo e Comparar usam os mesmos cinco controles de descoberta, mesmos limites, rótulos, limpar filtros e paginação.
- [x] Cada candidata apresenta tags de identidade; filtros ativos ficam visíveis e removíveis/limpáveis.
- [x] Abrir ficha continua exato; selecionar para comparação não salva, não compara automaticamente e não promete compatibilidade.
- [x] `viewer` não visualiza ação de seleção/comparação, e o servidor permanece o gate definitivo.
- [x] Não há nova rota, migration, dado pessoal, telemetria, provider, prompt, payload técnico filtrável ou consulta externa.
- [x] Backlog e fluxograma registram a descoberta compartilhada depois da verificação.

## Revisão de segurança proporcional

- **Aplicabilidade:** não aplicável nesta implementação proposta, pois ela reutiliza as rotas autenticadas e o RBAC existentes sem modificar contrato HTTP, autorização, persistência ou dados devolvidos.
- **Invariantes:** estado de filtro fica em memória da interface; IDs e `latestTechnicalSheetVersionId` continuam vindo do servidor; `viewer` não recebe CTA de comparação; P1-017 continua revalidando no servidor.
- **Reabrir revisão:** se o corte introduzir filtro técnico de payload, endpoint/faceta nova, persistência de preferências, analytics ou compartilhamento de busca.

## Plano incremental

1. Extrair tipos/estado/controles de descoberta para componente compartilhado, sem duplicar a lógica de P1-024.
2. Montar o componente em Comparar com carregamento de recentes e seleção de duas candidatas; adaptar Catálogo para o mesmo contrato visual.
3. Exibir tags de identidade e de filtros ativos; preservar abertura exata, relacionadas e papéis.
4. Verificar typecheck, build, contrato de catálogo e smoke manual de recentes, filtros, limpar, paginação, `viewer` e comparação incompatível; atualizar documentação conforme comprovado.

## Double-check da arquitetura

- A causa da lista vazia não é ausência de persistência nem falha no endpoint: é a ausência de chamada inicial em `ComparisonPanel`.
- A solução não amplia a visibilidade global já existente do catálogo e não transforma tags em fonte de autorização.
- Reutilizar somente filtros de identidade evita uma semântica incompleta para campos técnicos ausentes/conflitantes e não requer schema/migration.
- Não há bloqueio técnico ou decisão de produto pendente que impeça este escopo. Estado: `APPROVED — Lucas autorizou a implementação em 2026-09-09.`

## Resultado do agente

- Estado: `✅ Concluída`.
- Implementação: `FichaDiscovery` é o único componente de descoberta de fichas na interface e é montado em Catálogo e Comparar. Ele carrega recentes na montagem, aplica/limpa os cinco critérios de identidade, mostra filtros ativos, paginação, estados explícitos e tags de identidade da candidata. Comparar só preenche a seleção local; não executa nem salva automaticamente.
- Arquivos: `apps/web/src/FichaDiscovery.tsx`, `apps/web/src/ComparisonPanel.tsx`, `apps/web/src/App.tsx`, `docs/product/backlog.md` e `docs/product/fluxograma-desenvolvimento-agente.md`.
- Verificações: `npm run typecheck`, `npm run build`, `npm run verify:catalog-contract` e `git diff --check` passaram. O build exigiu execução autorizada fora do sandbox por limitação de leitura do esbuild.
- Pendência: smoke autenticado manual de recent/filtros/paginação e perfis continua necessário antes de release externo; não foi feito nesta sessão sem fixtures autorizadas.
