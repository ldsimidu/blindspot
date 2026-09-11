# ❌ Pendente — E03-02 Descoberta orientada no catálogo

> Prioridade: P1
>
> Área afetada: catálogo, API autenticada, comparação e interface
>
> Origem ou referência: `docs/product/backlog.md` E03-02; `docs/product/fluxograma-desenvolvimento-agente.md`; P1-005 e P1-017
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-09.`
>
> Triagem automática: `Material — altera contrato público autenticado e jornada de interface; não altera schema, IA, prompt ou persistência.`
>
> Segurança: `Aplicável — novos parâmetros e rota de API autenticada; sem novo dado pessoal, integração externa ou rastreamento.`

## Pedido

Permitir descobrir fichas já existentes sem obrigar a pessoa a conhecer um texto de busca: listar fichas recentes, filtrar o catálogo e apresentar recomendações explicáveis a partir da ficha aberta. A pessoa `analyst` ou `admin` deve conseguir levar uma ficha encontrada diretamente para a seleção de comparação.

## Critérios de aceite

- [x] Ao abrir o catálogo sem termo ou filtro, a interface mostra fichas recentes que possuem versão técnica persistida; estado vazio é explícito.
- [x] A pessoa pode combinar texto livre opcional com filtros de marca, modelo, ano-modelo e mercado; entradas inválidas recebem `400` sanitizado, paginação continua limitada e nenhum filtro gera abertura aproximada de ficha.
- [x] A ficha aberta pode exibir até seis fichas relacionadas, somente por critérios determinísticos e visíveis: mesma marca, modelo, ano-modelo e mercado, excluindo a própria ficha e ordenadas pela versão mais recente. Se não houver variante relacionada, a interface explica a ausência.
- [x] Recomendações não usam histórico de navegação, perfil corporativo, IA, rede externa, pontuação de “melhor veículo” nem inferência de motorização.
- [x] Em catálogo, recentes, filtros e relacionadas, `analyst` e `admin` podem enviar a ficha retornada pelo servidor para **Comparar**; a comparação continua exigindo exatamente duas versões e conserva todas as proteções de P1-017. `viewer` pode ler catálogo, mas não recebe ação de comparar.
- [x] Catálogo e recomendações preservam a decisão atual de recurso global autenticado; não expõem organização que gerou a ficha, ator, e-mail, prompt, cookie, token, payload bruto ou evento de auditoria.
- [x] Backlog, fluxograma e pipeline HTTP são atualizados somente após o comportamento estar implementado e verificado.

## Restrições ou contexto

- Não criar migration, tabela de favoritos, perfil de recomendação, telemetria, exportação, compartilhamento, alerta, LLM ou consulta externa.
- `motor_tipo` permanece fora dos filtros e da regra de recomendação neste corte: está em payload JSON técnico, pode estar ausente/conflitante e não deve gerar uma consulta frágil ou inferência silenciosa.
- A regra de compatibilidade de P1-017 continua sendo aplicada exclusivamente no servidor ao comparar; encontrar ou recomendar uma ficha não afirma que ela é comparável.

## Preflight, arquitetura e revisões proporcionais — 2026-09-09

### Fatos confirmados

- `GET /api/catalogo/fichas` já exige sessão corporativa ativa, recebe `q`, `page` e `page_size`, e expõe configurações automotivas globais; a busca atual ordena alfabeticamente e a UI depende de um envio manual de texto.
- `technical_sheet_versions` já preserva versões imutáveis e o catálogo já expõe `latestTechnicalSheetVersionId`; fichas persistidas em PostgreSQL podem ser ordenadas por sua versão mais recente sem gravar dado novo.
- A abertura da ficha continua exata: o cliente envia os cinco identificadores da configuração selecionada e o servidor não deve escolher uma alternativa aproximada.
- P1-017 compara somente duas versões resolvidas no servidor e limita criação/leitura de análises a `analyst|admin` da própria organização. O catálogo, por decisão prévia, é global para qualquer sessão corporativa ativa.

### Decisão proposta

#### Jornada da pessoa usuária

1. Ao acessar **Catálogo**, a interface solicita a primeira página em `sort=recent` e apresenta “Fichas recentes”, sem perfil, cookie adicional ou histórico de uso. Somente entradas com uma versão técnica vigente aparecem; catálogo vazio e erro possuem mensagens distintas.
2. A pessoa pode preencher, isolada ou conjuntamente, busca livre, marca, modelo, ano-modelo e mercado. Ao selecionar **Aplicar filtros**, a UI reinicia na primeira página e mostra os critérios ativos; **Limpar filtros** retorna à lista recente. Um resultado vazio informa que não há ficha cadastrada para aqueles critérios e sugere solicitar nova coleta, sem substituir a configuração.
3. Ao escolher uma entrada, a UI mantém a confirmação exata de identidade existente e abre a ficha. Abaixo dela, solicita relacionadas determinísticas. Cada cartão informa a razão fixa: “mesma marca, modelo, ano-modelo e mercado”; não existe ranking comercial, recomendação personalizada ou equivalência de motorização.
4. Se a pessoa for `analyst` ou `admin`, cada cartão elegível de recente, filtro ou relacionada oferece **Adicionar à comparação**. A ação transporta apenas a entrada retornada pela API e seu `latestTechnicalSheetVersionId` para a área **Comparar**; ela não salva nem executa a comparação automaticamente. `viewer` continua somente com leitura.
5. Na comparação, a pessoa seleciona a segunda ficha ou remove a seleção. Ao comparar, P1-017 recarrega ambas as versões e pode retornar incompatibilidade por mercado, motorização ou identidade; a recomendação não contorna esse bloqueio.

#### Contratos e dados

- Estender `GET /api/catalogo/fichas` com `sort=recent|alphabetical`, `marca`, `modelo`, `ano_modelo` e `mercado`, além de `q`, `page` e `page_size`. Todos são opcionais; sem `q` e sem filtros, o padrão é `recent`. Com termo ou filtro e sem `sort`, o padrão permanece `alphabetical`, preservando o comportamento de busca já entregue.
- Validar `sort` contra allowlist, ano-modelo como inteiro razoável e cada texto após `trim` com limite curto, sem curingas interpretados pelo banco. Construir predicados parametrizados no repositório; nenhuma entrada do navegador compõe SQL, ordenação ou coluna dinâmica.
- A consulta de recentes considera somente configurações com versão técnica mais recente, ordena por `latest_version_created_at DESC` e usa desempate estável por identificação. Filtros atuam em colunas de identidade da configuração; texto livre mantém aliases determinísticos existentes.
- Criar `GET /api/catalogo/fichas/:id/recomendacoes` com os mesmos cinco identificadores exatos já requeridos para abrir a ficha. O servidor primeiro resolve a configuração exatamente; então retorna no máximo seis configurações distintas que tenham versão vigente e coincidam em marca, modelo, ano-modelo e mercado, exceto o próprio ID, em ordem determinística por versão recente e desempate estável. Não há fallback mais amplo.
- Não há alteração de schema, migration, evento de auditoria, tabela, retenção, provider, prompt ou runtime canônico. Estado de filtro e seleção fica somente na memória da interface durante a sessão visual.

#### Autorização e fronteiras

| Ação | viewer | analyst | admin |
|---|---:|---:|---:|
| Ler recentes, filtros e relacionadas do catálogo global | sim | sim | sim |
| Abrir ficha pela identidade exata | sim | sim | sim |
| Adicionar uma ficha à seleção local de comparação | não | sim | sim |
| Criar/ler comparação privada da própria organização | não | sim | sim |

- A API aplica a sessão ativa já existente antes de consultar catálogo ou relacionadas. A UI apenas oculta a ação de comparação para `viewer`; o servidor de P1-017 continua sendo a autorização definitiva de salvar/comparar.
- Respostas continuam sem organização de origem, membro, e-mail, credenciais, prompt, resposta LLM bruta ou identificador de sessão. ID inexistente ou identidade divergente conserva resposta neutra/exata já praticada pelo catálogo.

### Revisão de segurança

- **Gatilhos e fronteira:** alteração de endpoint público autenticado e novo endpoint de recomendações. O navegador controla somente filtros limitados e identidade solicitada; o servidor controla sessão, parsing, predicados, ordenação, limite e dados devolvidos.
- **Cenários e controles:** abuso de paginação/filtros é limitado por validação, max page size e paginação existente; injeção é mitigada por Drizzle/predicados parametrizados e allowlists; enumeração não cria acesso a dados de tenant porque o catálogo já é global e a resposta não contém origem; escalonamento por UI é impedido porque o servidor de comparação exige papel; personalização/opacidade é evitada por regra determinística sem coleta comportamental.
- **Verificações planejadas:** typecheck, build e `git diff --check`; testes/smokes para ausência de filtros (recentes), cada filtro, combinação, paginação, `sort`/ano/texto inválidos (`400`), sem resultados, exclui item atual, máximo seis relacionadas, resposta de identidade divergente e ação de comparação indisponível para `viewer`; confirmação manual de que a API não devolve atributos de tenant ou dados de sessão.
- **Risco residual:** o catálogo global autenticado é uma decisão anterior e permanece visível a todas as organizações ativas. A task não amplia essa exposição; Lucas é o responsável por aceitar esse risco no gate.

### Revisão de conformidade proporcional

`Não aplicável neste corte.` Não haverá coleta, perfil, analytics, cookie novo, dado pessoal, dado sensível, envio a terceiro ou retenção nova. A recomendação é uma ordenação técnica determinística de dados automotivos já globais. Se personalização, telemetria ou favoritos persistentes entrarem no escopo, reabrir avaliação de conformidade antes de implementar.

### Plano incremental

1. Tipar e validar o contrato de filtros, ordenação e recomendações; adaptar o repositório para recentes e filtros apenas em dados existentes.
2. Expor as rotas autenticadas e testar resultados determinísticos, limites e erros sanitizados.
3. Ajustar catálogo e comparação para iniciar em recentes, aplicar/limpar filtros, exibir relacionadas e carregar seleção local entre as áreas, respeitando o papel.
4. Atualizar `docs/architecture/agent-core/HTTP_PIPELINE.md`, backlog e fluxograma com o comportamento comprovado; executar as verificações previstas.

### Double-check da arquitetura

- “Recente” é derivado da data da versão técnica persistida, e não da data de navegação, de uma conta ou de uma organização; portanto atende a descoberta sem criar perfil comportamental.
- A identidade exata continua o único caminho para abrir ficha; filtros e relacionadas apenas apresentam candidatas e nunca escolhem uma ficha no lugar da pessoa.
- A regra de relacionadas exige os quatro atributos persistidos e não usa `motor_tipo`; isso evita sugerir equivalência baseada em campo técnico ausente ou conflituoso. Uma recomendação pode mesmo assim ser incompatível para comparação, e a UI deve explicar esse limite.
- Nenhum dado novo precisa ser persistido, nem existe mudança no schema canônico em `packages/agent-runtime/assets/`.
- Segurança é aplicável por contrato de API; conformidade não é aplicável pelas restrições explícitas deste corte. Não há dependência externa, ferramenta adicional ou migration.
- Estado do gate: `APPROVED — Lucas autorizou a implementação em 2026-09-09.`

## Resultado do agente

- Estado: `✅ Concluída`.
- Implementação: a consulta de catálogo passou a aceitar filtros opcionais e `sort`; sem critério, devolve somente configurações com versão técnica persistida em ordem recente. A rota de relacionadas exige a identidade exata, devolve no máximo seis variantes da mesma marca/modelo/ano/mercado e não possui fallback amplo. A interface inicia a descoberta ao entrar no catálogo, permite aplicar/limpar filtros, explica ausência, mostra relacionadas e transporta apenas a candidata retornada pelo servidor para a seleção local de comparação.
- Arquivos principais: `services/api/db/repository.ts`, `services/api/index.ts`, `services/api/types.ts`, `apps/web/src/api.ts`, `apps/web/src/types.ts`, `apps/web/src/App.tsx`, `apps/web/src/ComparisonPanel.tsx`, `docs/architecture/agent-core/HTTP_PIPELINE.md`, `docs/product/backlog.md` e `docs/product/fluxograma-desenvolvimento-agente.md`.
- Verificações executadas: `npm run typecheck`, `npm run verify:catalog-contract`, `git diff --check` e `npm run build` passaram. O primeiro build falhou somente pela restrição de leitura do sandbox do esbuild; foi repetido em ambiente autorizado e concluiu com sucesso.
- Verificação bloqueada: smoke autenticado de recentes/filtros/recomendações com papéis `viewer`, `analyst` e `admin` não foi executado nesta sessão, pois não há três credenciais/fixtures autorizadas para exercitar os papéis sem alterar dados compartilhados. Antes de release externo, validar também `400` de filtros inválidos, zero resultado, máximo de seis relacionadas e que `viewer` não recebe ação de comparar.
