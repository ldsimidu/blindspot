# ✅ Concluída — Expor e recalcular impacto da Session e qualidade

> Prioridade: P1
>
> Área afetada: dados, API, observabilidade e interface
>
> Origem ou referência: proposta (2), seções 8, 17, 20, 40, 45 e 67
>
> Arquitetura: `APPROVED — Lucas autorizou “pode seguir” em 2026-09-12.`
>
> Triagem automática: `Material — métricas derivadas e recomendação explicável.`

## Pedido

Persistir métricas antes/depois por Session e expor vetores de qualidade realmente calculados a partir de resoluções/evidências. Recomendar Next Best Research Action como sugestão revisável, não como comando automático.

## Critérios de aceite

- [x] O contrato visual foi extraído para `P1-051`, sem alterar ou colidir com o frontend PEK em andamento.
- [x] Recomendação apresenta razão, impacto esperado, versão de política e alternativa de não executar.
- [x] Métricas são recalculáveis e não contam ausência, conflito ou fonte sem evidência como positivo.
- [x] Telemetria não contém URLs, prompts, conteúdo ou segredo.

## Restrições ou contexto

- Depende de P0-013 e P1-044; não criar score único decisório ou reputação de fonte.

## Architecture Gate — impacto verificável e qualidade revisável (2026-09-12)

### Fatos confirmados

- `quality-vector-v1` é um cálculo puro: usa `field_resolutions`, `field_evidence` e data da revisão para vetores separados de completude, evidência, consistência, atualidade e validação humana. Ausência, conflito e confirmação sem evidência não contam positivamente.
- A recomendação atual é derivada e não mandatória, mas não é persistida por sessão, não guarda o antes/depois de uma execução e não existe rota tenant-scoped que exponha o cálculo no workspace.
- P1-044 passou a criar plano/tarefas dirigidos, a registrar `partial` e `research_exhausted`, e a preservar a revisão-base. Isso fornece a identidade necessária para comparar `base_revision_id` com a revisão publicada, sem inferir impacto quando não existe publicação.
- `TechnicalFichaWorkspace` já possui card de qualidade e abas de histórico/conflitos; o `VehicleWorkspace` ainda é protótipo de UUID. Há alterações paralelas do modelo PEK em `apps/web/src/**`; este Gate não autoriza sobrescrever esses arquivos.

### Decisão e fluxo

Criar um serviço server-owned de avaliação por sessão. Ao terminar uma sessão, ele lê de modo tenant-scoped as resoluções/evidências da revisão-base e, quando publicada, da revisão resultante. Calcula os dois `QualityVector` com a mesma política versionada e persiste em `research_session_quality_impacts` um snapshot sanitizado: `base_revision_id`, `result_revision_id|null`, `before_vector`, `after_vector|null`, `delta`, `outcome_kind`, recomendação e versão de política.

`outcome_kind` é enumerado: `published`, `partial_published`, `research_exhausted`, `failed`, `cancelled` ou `needs_rebase`. Não há vetor “depois” nem ganho positivo fabricado quando não existe versão resultante. Para `partial_published`, o delta contabiliza somente mudanças que passaram por resolução/evidência; campos ausentes, conflitantes ou sem evidência continuam fora dos numeradores positivos.

O cálculo será idempotente por sessão e reexecutável a partir de dados persistidos. A API autenticada expõe resumo de impacto apenas à organização dona da ficha/sessão: vetores, deltas por dimensão, razão/impacto esperado da recomendação, versão da política e a alternativa explícita `not_execute`. A recomendação permanece sugestão: não cria sessão, não muda `primary`, não escolhe fonte e não altera a ficha.

### Impacto técnico e contrato

- **Persistência:** migration aditiva para `research_session_quality_impacts`, com chave única por sessão, FKs de revisão e checks de `outcome_kind`. Vetores/deltas são JSON sanitizado e versionado; não guardam URL, prompt, conteúdo de provider, fonte bruta ou segredo.
- **Serviço:** separar leitura de resoluções/evidências, cálculo puro e comparação de vetores. O orquestrador da P1-044 chama o serviço após todo terminal, inclusive exaustão/falha, para tornar o resultado auditável sem reexecutar provider.
- **API:** rota tenant-scoped para o impacto da sessão e inclusão de um resumo no histórico autorizado. Entradas são somente IDs; tenant, organização e revisão são resolvidos no servidor. P1-048 continuará responsável pelo histórico reproduzível detalhado, não por esta telemetria.
- **Observabilidade:** evento allowlisted contém sessão, estado, versão de política e contagens/deltas; nunca caminhos de URL, prompt, payload, conteúdo externo, token ou segredo.
- **Sem escopo:** score único, ranking/reputação de fonte, decisão automática, `primary`, Knowledge Base, provider real e alteração do schema técnico canônico.

### Frontend — handoff PEK e Design System obrigatório

Esta task **terá alteração de frontend** para cumprir o primeiro critério de aceite, mas somente depois do backend validado e de handoff explícito ao owner PEK. O adapter exige arquitetura visual por tela, checkpoint de primeira renderização e evidência em breakpoints antes de declarar a parte visual concluída.

O handoff propõe uma extensão funcional do card “Qualidade da ficha” em `TechnicalFichaWorkspace`, sem trocar identidade visual nem introduzir dependências, imagens ou movimento:

- cinco métricas separadas com numerador/denominador e razão legível; cor nunca é o único sinal;
- bloco “Impacto da última pesquisa” com antes/depois/delta e estado factual (`partial`, `research_exhausted`, falha etc.);
- recomendação com razão, impacto esperado, versão de política e ação secundária explícita “Não pesquisar agora”; nenhum CTA executa pesquisa automaticamente;
- estado vazio quando não há sessão elegível e erro/indisponibilidade persistentes no painel, sem toast como fonte única de verdade;
- desktop preserva card lateral do header; tablet/mobile refluem para lista vertical com labels e valores íntegros; teclado e leitor de tela recebem texto equivalente.

Decisão de imagem: `NO_IMAGE`. Decisão de movimento: nenhum movimento novo; o estado factual é estático. O frontend não pode usar UUID manual, inventar impacto, ocultar conflito por cor ou apresentar a recomendação como aprovação/certeza. A implementação visual deverá consultar o manifesto PEK, o adapter e o Design System local, registrar `VISUAL_READY` separado do Gate técnico e não tocar em trabalho paralelo sem ownership.

### Revisão de segurança proporcional

**Gatilhos:** dados derivados, API autenticada, persistência, auditoria e exposição na interface. Fronteira: membro autenticado → RBAC/API → leitura tenant-scoped de sessão/revisões/evidências → cálculo puro → PostgreSQL → resumo autorizado.

**Risco e controles:** IDOR ou uma métrica de organização A exposta a B, falso ganho de qualidade, ou telemetria que revele conteúdo/fonte. Controles: filtro organizacional em todas as leituras e FKs; cálculo determinístico e versionado; outcome explícito sem vetor pós-publicação inexistente; ausência/conflito sem crédito positivo; recommendation read-only; schema/checks/único por sessão; respostas e auditoria sanitizadas; fixtures de duas organizações e de cada estado terminal. A revisão segue o contrato de segurança do PDK e não declara segurança completa.

### Revisão de conformidade proporcional

Jurisdição Brasil. A [LGPD consolidada no Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), consultada em 2026-09-12, orienta finalidade, necessidade, transparência e segurança. A finalidade específica é explicar a qualidade da pesquisa técnica autorizada. Persistem somente IDs internos já existentes, métricas derivadas, estados e versões de política; não há novo dado sensível, texto livre, criança/adolescente, terceiro ou provider real.

O responsável competente ainda deve definir controlador, base legal concreta, retenção/descarte e transparência geral das sessões. Esta arquitetura não valida juridicamente essas decisões; como não amplia destino nem categoria de dados, o recorte pode seguir depois de aprovação humana. O conteúdo bruto segue proibido em vetores, API e telemetria.

### Plano incremental e verificações

1. Extrair leitura tenant-scoped e cálculo/recomparação determinísticos, com fixtures de ausência, conflito, evidência, parcial e sem publicação.
2. Adicionar migration/serviço de impacto e conectá-lo aos estados terminais de P1-044 sem provider real.
3. Expor resumo autenticado, testar IDOR, idempotência, recomputação, ausência de URL/prompt/conteúdo e executar PostgreSQL autorizado.
4. Entregar handoff PEK/Design System; o owner frontend implementa o painel e registra arquitetura visual, primeira renderização desktop/tablet/mobile e teclado.
5. Executar verificadores específicos, `typecheck`, `git diff --check`; falhas externas do PEK são registradas sem edição cruzada.

### Double-check da arquitetura

- A proposta usa o cálculo já entregue, mas fecha a lacuna real: snapshot antes/depois por sessão, deltas recalculáveis e acesso autorizado.
- Não confunde `latest`, `recommended` e `primary`; a recomendação não modifica dado nem inicia pesquisa.
- `research_exhausted`, falha, cancelamento e base obsoleta permanecem finais factuais sem crédito de qualidade ou revisão fabricada.
- A parte de frontend foi explicitamente separada e marcada para PEK/Design System, evitando colisão com o modelo que já refatora `apps/web/src/**`.
- Não introduz provider, prompt, schema de ficha, reputação, ranking opaco, merge, automação ou conhecimento compartilhado. Conclusão: `READY` para implementação somente após `APPROVED` explícito de Lucas.

## Resultado do agente

- Estado: `✅ Concluída em 2026-09-12 — recorte backend; interface adiada para P1-051.`
- Segurança: `Aplicável — API, persistência, dados derivados e telemetria.`
- Conformidade: `Aplicável — métricas vinculadas a sessões organizacionais; sem nova categoria/destino de dado.`
- Frontend: `Previsto — exige handoff PEK/Design System e checkpoint visual; nenhum arquivo de interface foi alterado neste Gate.`
- Próximo passo: `P1-051` quando a refatoração PEK do frontend estiver estabilizada e houver ownership explícito.

### Entrega backend — 2026-09-12

- Implementação: criada a tabela `research_session_quality_impacts` e o serviço `research-session-quality-impact`. Cada estado terminal da sessão recalcula o vetor da revisão-base e, quando houver publicação, o vetor da revisão resultante; persiste o delta, a recomendação e o estado factual. O outcome sem publicação guarda `delta: { state: "not_applicable" }`, sem fabricar ganho ou revisão.
- Qualidade: `quality-vector-v1` foi endurecido para que conflitos também não contem positivamente em completude. Evidência só credita campos confirmados com `field_evidence`; recomendação continua read-only, traz política/razão/impacto e a API inclui `alternative: "not_execute"`.
- API e segurança: `GET /api/research-sessions/:id/impacto` exige `analyst|admin`, filtra a organização no servidor e registra somente auditoria allowlisted. O contrato expõe vetores, delta, estado, versão de política e recomendação; não expõe URL, prompt, conteúdo externo, token ou segredo.
- Migration: `0025_research_session_quality_impacts` aplicada com sucesso no PostgreSQL configurado.
- Verificação: `npm run verify:quality-vector` (`QUALITY_VECTOR=PASS`), `npm run verify:research-session-quality-impact` (`RESEARCH_SESSION_QUALITY_IMPACT=PASS`), `npm run typecheck` e `git diff --check` passaram. `npm run verify:research-session-execution-db` passou após a migration, comprovando plano/tarefas, publicação parcial, `needs_rebase` concorrente e dois impactos sanitizados com fixtures efêmeras removidas.
- Arquivos backend: `drizzle/0025_research_session_quality_impacts.sql`, `drizzle/meta/_journal.json`, `services/api/db/schema.ts`, `services/api/research-session-quality-impact.ts`, `services/api/research-sessions.ts`, `services/api/quality-vector.ts`, `services/api/index.ts`, `services/api/audit.ts`, `scripts/verify-research-session-quality-impact.ts`, `scripts/verify-research-session-execution-db.ts`, `package.json` e esta task.

### Handoff PEK adiado — interface

**Estado:** `extraído para P1-051 por decisão de Lucas em 2026-09-12`; esta execução não alterou frontend.

**Contrato disponibilizado:** `GET /api/research-sessions/:id/impacto` retorna `{ research_session_id, base_revision_id, result_revision_id|null, policy_version, outcome_kind, before, after|null, delta, recommendation{ focus, reason, expected_impact, alternative:"not_execute" }, updated_at }`. `delta` pode ser `{ state:"not_applicable" }`; isso deve aparecer como ausência factual de impacto, nunca como zero/sucesso.

**Recursos permitidos ao owner PEK:** `apps/web/src/TechnicalFichaWorkspace.tsx`, stylesheet específico e tipos/cliente de API estritamente necessários. **Proibidos:** runtime, schema, migrations, políticas de qualidade, rotas API e alterações nos arquivos backend desta task.

**Verificações da fatia visual:** arquitetura visual PEK/Design System, `NO_IMAGE`, sem movimento novo, checkpoint de primeira renderização em desktop/tablet/mobile, teclado, estados vazio/erro/parcial/exausto e `npm run typecheck`. A integração só poderá ser aceita após o owner informar os paths efetivamente alterados e o contrato consumido; não há merge/commit automático.
