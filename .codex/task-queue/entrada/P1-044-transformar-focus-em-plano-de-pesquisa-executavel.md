# ✅ Concluída — Transformar Focus em plano de pesquisa executável

> Prioridade: P1
>
> Área afetada: IA, runtime, API, persistência e custo
>
> Origem ou referência: proposta (2), seções 14 a 23, 45 a 48
>
> Arquitetura: `APPROVED — Lucas autorizou “pode seguir” em 2026-09-12.`
>
> Triagem automática: `Material — Focus passa a alterar estratégia, não só interface.`
>
> Segurança: `Aplicável — IA, orçamento, fontes e conteúdo não confiável.`

## Pedido

Implementar Research Plan/Task determinísticos por sessão: alvos, razão, estratégia de fonte, orçamento e stop condition. Presets devem restringir execução real; `MISSING_VARIABLES`, `CONFLICT_RESOLUTION` e `OFFICIAL_SOURCES` não podem disparar uma pesquisa geral disfarçada.

## Critérios de aceite

- [x] Cada Session conserva plano sanitizado e tasks planejadas, sem prompt ou conteúdo bruto.
- [x] O runtime recebe apenas os caminhos elegíveis e política compatível com o Focus.
- [x] Official Sources altera estratégia server-owned; ausência de fonte oficial encerra com estado explícito.
- [x] Resultado parcial/research exhausted mantém estados sem inventar valores.

## Restrições ou contexto

- Depende de P0-014; custom instruction só após decisão de retenção, transparência e destino.

## Architecture Gate — plano determinístico por Focus (2026-09-12)

### Fatos confirmados

- `research_sessions` já preserva ficha, revisão-base, organização, ator, foco, alvos resolvidos, orçamento, estado, política de fonte, schema e versão de runtime; P0-014 tornou a publicação monotônica por ficha e protegeu a base com `FOR UPDATE`.
- `resolveTargets` já limita `MISSING_VARIABLES`, `CONFLICT_RESOLUTION`, `CATEGORY` e `VARIABLES` aos caminhos da revisão-base, mas `GENERAL`, `OFFICIAL_SOURCES`, `LOW_CONFIDENCE` e `VALIDATE_EXISTING` acabam no conjunto completo.
- `executeResearchSession` ainda monta o mesmo prompt de geração completa e chama somente `callLLMSimulated`; o foco e os alvos não chegam ao runtime nem definem uma estratégia de fontes, orçamento por tarefa ou stop condition real.
- Os assets canônicos ficam em `packages/agent-runtime/assets/`. `source-policy.json` já traz versão, domínios oficiais por marca/mercado e tipos oficiais; documentos de arquitetura não serão usados como fonte de runtime.
- Não há instrução livre neste contrato. O corpo autenticado não pode escolher provider, política, orçamento efetivo, actor, organização, revisão-base ou resultado vencedor.

### Decisão e fluxo

Introduzir o módulo local `research-plan` e o asset canônico versionado `research-plan-policy.json`. Na criação da sessão, o servidor resolve e persiste um snapshot sanitizado do plano, derivado exclusivamente de `{ focus, requested_targets allowlisted, base_revision, source-policy }`. O plano contém somente versão, foco, paths elegíveis, estratégia de fonte, limites numéricos, condições enumeradas de parada e hashes/versões de contrato; não contém prompt, texto de usuário, conteúdo de página, URL capturada, segredo ou payload bruto.

Persistir também `research_session_tasks`, uma ou mais tarefas ordenadas e imutáveis por sessão, com: sequência, tipo allowlisted, `target_paths`, estratégia de fonte, orçamento de chamadas, estado e motivo terminal sanitizado. O registro normalizado permite demonstrar que cada execução respeitou o plano sem transformar o JSON da sessão em log de conteúdo. A sessão continua sendo o agregado de autorização e transição; as tarefas não recebem actor ou organização escolhidos pelo cliente.

O resolvedor aplica os presets abaixo antes de qualquer execução:

| Focus | Alvos permitidos | Estratégia server-owned | Saída sem elegibilidade |
| --- | --- | --- | --- |
| `GENERAL` | todos os paths da revisão-base | evidência compatível com política vigente | `research_exhausted/no_eligible_targets` |
| `MISSING_VARIABLES` | somente `ausente` ou `nao_encontrado` | evidência compatível, sem ampliar paths | `research_exhausted/no_missing_targets` |
| `CONFLICT_RESOLUTION` | somente `conflitante` | preservar conflito; nunca escolher vencedor | `research_exhausted/no_conflicting_targets` |
| `OFFICIAL_SOURCES` | paths da revisão-base que ainda precisam de validação | somente tipos/domínios oficiais do asset para marca+mercado | `research_exhausted/official_source_unavailable` |
| `LOW_CONFIDENCE` e `VALIDATE_EXISTING` | somente paths com estado/evidência elegível definido pela política versionada | revalidação compatível; não vira `GENERAL` | `research_exhausted/no_eligible_targets` |
| `CATEGORY` e `VARIABLES` | interseção estrita com paths existentes | estratégia compatível com política | `research_exhausted/no_eligible_targets` |

Na execução, o runtime recebe um `ResearchExecutionPlan` sanitizado: `target_paths`, `source_strategy`, política de fontes reduzida ao necessário, orçamento e stop conditions. O composer não recebe instrução livre. `OFFICIAL_SOURCES` só recebe a allowlist oficial daquele contexto; se não houver âncora oficial no asset, não chama provider e termina explicitamente. A chamada continua `simulated` neste corte; provider real, crawling, ferramenta de busca, worker externo, experimento de modelo e autopilot permanecem fora.

Após cada tarefa, o orquestrador atualiza contador server-owned. Falha de validação, base obsoleta, cancelamento, orçamento exaurido, ausência de alvos ou ausência de fonte oficial terminam em estados/motivos enumerados. `partial` só é possível quando uma tarefa válida produz resultado incompleto com status/evidência explícitos; `research_exhausted` não publica revisão. Nenhum caminho converte ausência/conflito em valor confirmado. A publicação continua condicionada à validação existente, à identidade, à evidência e à revisão-base; a P1-048 exporá histórico detalhado e a P1-045 o impacto de qualidade.

### Impacto técnico e compatibilidade

- **Runtime:** novo asset de política, leitor tipado e composição de prompt com plano sanitizado. O schema JSON, o prompt-base e as políticas canônicas atuais não são reescritos; o plano acrescenta restrição de execução.
- **Persistência:** migration aditiva para snapshot `research_plan`/`research_plan_version` na sessão e a tabela de tarefas. Sessões históricas recebem plano `legacy` explícito e não passam a ser reexecutáveis automaticamente.
- **API:** criação continua autenticada e idempotente; a resposta pode expor apenas resumo sanitizado de plano/contadores. Nenhum endpoint público, campo livre ou contrato visual entra neste corte.
- **Custos:** o budget é lido da política versionada e decrementado pelo servidor. Uma ausência de elegibilidade encerra antes de qualquer chamada; nunca há fallback silencioso para pesquisa genérica.
- **Frontend:** nenhum arquivo `apps/web/src/**` faz parte da P1-044. A apresentação futura de plano, impacto e histórico pertence às P1-045/P1-048 e exigirá handoff explícito ao PEK e ao Design System.

### Revisão de segurança proporcional

**Escopo e gatilhos.** IA simulated, persistência, API autenticada, autorização tenant, orçamento, conteúdo externo não confiável e auditoria. A fronteira é: membro autenticado → API/RBAC → planner server-owned → runtime simulated → validação/políticas → PostgreSQL → leitura autorizada.

**Risco principal e controles.** Um cliente ou conteúdo externo pode tentar ampliar alvos, relaxar fontes, esgotar orçamento, injetar instruções ou publicar resposta fora da revisão-base. Controles: enum e interseção estrita de paths; plano e tarefas criados no servidor; política/versionamento canônico; allowlist oficial contextual; contadores e stop reasons enumerados; tenant/RBAC/idempotência; lock e comparação de base da P0-014; validação AJV/identidade/evidência existentes; telemetria e auditoria somente sanitizadas. Não serão persistidos prompt, conteúdo bruto, URL privada, token ou segredo.

**Verificações planejadas.** Fixtures cobrirão cada Focus, conjunto vazio, foco oficial sem âncora, orçamento zero/exaurido, resultado parcial, resposta inválida, cancelamento, base obsoleta, idempotência e duas organizações. Serão executados somente o runtime simulated e PostgreSQL autorizado; provider real e conteúdo externo não serão usados. A revisão segue a estratégia local e o contrato de segurança do PDK; ela não declara segurança completa. O risco residual de política mal calibrada ou fonte oficial desatualizada será aceito por Lucas com a evidência de P1-049.

### Revisão de conformidade proporcional

**Aplicabilidade e fontes.** Jurisdição Brasil. A [LGPD consolidada no Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), consultada em 2026-09-12, orienta finalidade, necessidade, transparência, segurança e prestação de contas; a página de regulamentos da ANPD foi consultada na mesma data, mas retornou erro interno e não substitui validação jurídica.

**Dados, finalidade e fronteiras.** A finalidade é limitar e tornar auditável a pesquisa técnica autorizada dentro da organização. Permanecem apenas IDs de conta/membro/organização já necessários, identidade técnica do veículo, foco allowlisted, paths técnicos, versões de políticas, contadores e motivos enumerados. Não há dado sensível, criança/adolescente, texto livre ou nova categoria de dado pessoal. O runtime simulated não transmite dados a terceiro; provider real fica fora do corte. Plano e tarefas seguem a retenção já aplicável à sessão, sem criar nova política de descarte.

**Pendência humana e bloqueio.** Controlador, base legal concreta, transparência e retenção/descarte de qualquer futura instrução livre ou transmissão a provider devem ser definidos pelo responsável competente antes desse escopo futuro. Como esta task não introduz texto livre nem novo terceiro, o recorte determinístico pode seguir após aprovação humana do Gate; isso não é parecer jurídico nem aprovação da futura integração externa.

### Plano incremental e verificações

1. Adicionar contrato/asset tipado de plano e fixtures puras para cada preset, inclusive ausência de elegibilidade e estratégia oficial.
2. Adicionar migration, snapshot e tarefas imutáveis; preservar sessões legadas como `legacy` sem execução automática.
3. Alterar criação/execução para consumir somente o plano e registrar transições/contadores por tarefa.
4. Cobrir simulated + PostgreSQL com tenant, idempotência, custo, estados terminais, validação e concorrência; rodar `npm run typecheck`, verificadores específicos e `git diff --check`.
5. Só após evidência aprovada, P1-045/P1-048 podem apresentar impacto/histórico; provider real continua exigindo task/gate próprios.

### Double-check da arquitetura

- O desenho corrige exatamente a lacuna confirmada pela P0-012: `Focus` passa a dirigir targets, estratégia, orçamento e parada, não apenas a coluna persistida.
- `OFFICIAL_SOURCES` falha de modo explícito quando a política não possui âncora oficial contextual; não há rebaixamento implícito para fontes parceiras ou pesquisa geral.
- Ausência, conflito, falha de validação e exaustão não são traduzidos em confirmação positiva e não reescrevem a revisão-base.
- O plano não cria Knowledge Base, ranking de fonte, merge, fork, fila distribuída, busca real, custom prompt, provider/modelo selecionável, worker, cron, UI ou alteração de assets fora da política nova.
- O schema/prompt-base canônicos permanecem preservados; qualquer alteração deles exigirá Gate próprio. Conclusão: `READY` para implementação somente após `APPROVED` explícito de Lucas.

## Resultado do agente

- Estado: `✅ Concluída em 2026-09-12.`
- Triagem automática: `Material — IA, runtime, persistência, API, custo e estados de execução.`
- Segurança: `Aplicável — revisão proporcional registrada para tenant, conteúdo não confiável, orçamento e auditoria.`
- Conformidade: `Aplicável — plano determinístico sem texto livre/novo terceiro; escopos futuros continuam bloqueados até decisão humana.`
- Implementação: criado o asset canônico `research-plan-policy.json` e o módulo `research-plan`. Cada criação de sessão resolve um plano versionado no servidor e persiste um resumo sanitizado em `research_sessions`, além de tarefas ordenadas em `research_session_tasks`. O plano limita paths, tipos/domínios de fonte, orçamento e condição de parada por Focus; não armazena prompt, instrução livre, conteúdo bruto, URL, token ou segredo.
- Execução: `executeResearchSession` recebe uma tarefa do plano, inclui somente essa tarefa na composição de runtime e atualiza contadores/transições server-owned. `OFFICIAL_SOURCES` restringe a política aos domínios/tipos oficiais contextuais; sem âncora, a sessão nasce `research_exhausted`, e sem evidência oficial válida ela encerra no mesmo estado sem publicar revisão. Resultado validado com paths ainda não confirmados termina `partial` preservando os status; nenhuma ausência ou conflito é convertido em valor confirmado.
- Persistência: migration `0024_research_session_plans` aplicada no PostgreSQL configurado, com colunas compatíveis `research_plan_version`/`research_plan` e a tabela de tarefas com sequência, estratégia, orçamento, estados e checks de integridade. Sessões anteriores permanecem explicitamente `legacy` e não são reexecutadas automaticamente.
- Arquivos alterados: `packages/agent-runtime/assets/research-plan-policy.json`, `services/api/research-plan.ts`, `services/api/runtime-assets.ts`, `services/api/prompt-builder.ts`, `services/api/research-sessions.ts`, `services/api/db/schema.ts`, `drizzle/0024_research_session_plans.sql`, `drizzle/meta/_journal.json`, `scripts/verify-research-plan.ts`, `scripts/verify-research-sessions.ts`, `scripts/verify-research-session-execution-db.ts`, `package.json` e esta task.
- Verificação: `npm run verify:research-plan` passou com `RESEARCH_PLAN_CONTRACT=PASS`; `npm run verify:research-sessions` passou com `RESEARCH_SESSION_CONTRACT=PASS`; `npm run db:migrate` aplicou `0024`; `npm run verify:research-session-execution-db` passou com `RESEARCH_EXECUTION=PASS`, incluindo plano/tarefas persistidos, resultado `partial`, uma publicação e uma sessão concorrente `needs_rebase`; `git diff --check` passou.
- Check bloqueado externo: `npm run typecheck` encontra quatro erros em `apps/web/src/App.tsx` (`CampoStatus | null`), surgidos no trabalho paralelo do PEK. Não houve alteração deste agente em `apps/web/src/**`; a correção é de ownership do frontend e não bloqueia as verificações específicas de backend acima.
- Frontend: nenhuma alteração em `apps/web/src/**` nesta task.
- Próximo passo: P1-045 pode calcular e expor impacto/qualidade do plano; qualquer apresentação visual dependerá de handoff explícito ao PEK e ao Design System.
