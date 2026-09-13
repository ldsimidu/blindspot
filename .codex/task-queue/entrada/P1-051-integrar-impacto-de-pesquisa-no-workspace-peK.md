# ❌ Bloqueada — Integrar impacto de pesquisa no workspace pelo PEK

> Prioridade: P1
>
> Área afetada: frontend, UX/UI e API de leitura
>
> Origem ou referência: remanescente visual extraído da P1-045 em 2026-09-12
>
> Arquitetura: `A revalidar quando o frontend PEK estiver estabilizado.`
>
> Triagem automática: `Material — apresenta dados decisórios e estados de pesquisa.`
>
> Segurança: `Aplicável — leitura autenticada de impacto tenant-scoped.`

## Pedido

Exibir no `TechnicalFichaWorkspace` o impacto verificável da última sessão de pesquisa: vetores antes/depois, deltas, estado factual e recomendação não mandatória.

## Critérios de aceite

- [ ] A UI mostra campos/indicadores validados, conflitos preservados e mudanças dos vetores sem depender apenas de cor.
- [ ] `partial`, `research_exhausted`, falha, cancelamento e `needs_rebase` possuem estados factuais próprios; `not_applicable` não aparece como sucesso ou zero.
- [ ] A recomendação apresenta razão, impacto esperado, versão de política e a alternativa explícita de não pesquisar agora; não executa pesquisa automaticamente.
- [ ] PEK e Design System registram arquitetura visual, `NO_IMAGE`, sem movimento novo, checkpoint desktop/tablet/mobile e teclado.

## Contrato backend já disponível

`GET /api/research-sessions/:id/impacto` autenticado para `analyst|admin` retorna `{ research_session_id, base_revision_id, result_revision_id|null, policy_version, outcome_kind, before, after|null, delta, recommendation{ focus, reason, expected_impact, alternative:"not_execute" }, updated_at }`.

## Restrições ou contexto

- Depende de P1-045 concluída; não alterar runtime, schema, migrations, políticas de qualidade ou rotas da API.
- Requer ownership explícito do frontend: o modelo PEK já altera `apps/web/src/**`.
- Antes de implementar, consultar manifesto PEK, adapter BlindSpot, Design System e estado atual da tela; `VISUAL_READY` e o Architecture Gate técnico continuam independentes.

## Resultado do agente

## Reescrita UX/UI — 2026-09-12

Esta task adota `docs/product/ux-ui-future-task-redesign-standard.md`: o impacto será composto como contexto da ficha → before/after factual → razão e alternativa não automática, com estados próprios e `NO_IMAGE`. O gate deve revalidar endpoint, tela atual e render desktop/tablet/mobile antes de JSX/CSS.

- Estado: `❌ Pendente — adiada por decisão de Lucas até a estabilização do frontend PEK.`
- Próximo passo: revalidar tela, referências e ownership; então produzir Architecture Gate visual/técnico antes de alterar JSX/CSS.

## Architecture Gate revalidado — 2026-09-12

### Fatos e decisão

- O endpoint existente `GET /api/research-sessions/:id/impacto` exige `analyst|admin`, resolve a sessão pelo contexto autorizado e registra auditoria. O cliente web ainda não possui tipo/função explícitos para consumi-lo.
- O `TechnicalFichaWorkspace` já oferece hero de identidade, qualidade, tabs e painéis progressivos; o impacto deve entrar como contexto de sessão/painel, nunca substituir ficha, status por atributo ou fonte.
- Decisão: adicionar somente tipo/fetch autenticado já existente e um painel de impacto ligado a uma sessão selecionada/autorizada. Não altera endpoint, runtime, schema, política, cálculo, execução de pesquisa ou persistência.

### Arquitetura visual

- **Tela/objetivo:** na ficha, a pessoa entende o resultado factual da última sessão antes/depois e pode optar por não pesquisar agora; `NO_IMAGE`.
- **Composição:** contexto da sessão e outcome no topo do painel; grade before/after/delta no centro; recomendação abaixo com razão, impacto esperado, versão de política e alternativa textual `não executar agora`. Valores ausentes, `partial`, `research_exhausted`, cancelada, falha e `needs_rebase` recebem painel próprio, nunca métrica zero/sucesso.
- **Estados e a11y:** texto, ícone e cor semântica; foco segue sessão → impacto → recomendação; loading local sem falso progresso, erro persistente com recuperação e reduced motion sem transição adicional. Desktop 1440, tablet 768 e mobile 390 recompõem before/after em blocos, sem tabela espremida.

### Segurança proporcional

- Gatilho: leitura autenticada tenant-scoped e exposição de impacto derivado. Fronteira: identificador de sessão vindo da interface → endpoint existente autorizado → painel local.
- Controles: reutilizar `credentials: same-origin`, não armazenar resposta fora do estado efêmero, não exibir identificadores internos como conteúdo principal, nem copiar resposta para logs/toast. `403/404` usam mensagem neutra; UI não deduz acesso pelo ID.
- Check futuro: smoke com sessão autorizada e negação por papel/tenant em ambiente permitido; typecheck/build/diff; renders e teclado. Não há novo tratamento de dados pessoais, retenção, terceiro ou transferência: compliance não aplicável neste recorte.

### Double-check e decisão humana

- A UI não calcula impacto, não transforma recomendação em CTA de execução e não apresenta qualidade/confiança não devolvida pelo servidor.
- Sem sessão elegível, o painel explica indisponibilidade sem prometer pesquisa ou bloquear a leitura da ficha.
- `APPROVED — Lucas autorizou a implementação em 2026-09-12.`

## Resultado da integração

- Estado: `🚧 Em execução — integração encontrada e validada; checkpoint visual pendente`.
- Handoff confirmado: `VehicleWorkspace` já lista sessões autorizadas por ficha, exige seleção explícita, consome `obterImpactoSessao` autenticado e entrega ao workspace painel com before/after/delta, outcomes factuais, recomendação não mandatória, alternativa de não executar e estados vazio/loading/erro.
- Preservado: nenhuma sessão é inferida, nenhuma pesquisa é iniciada, e API/runtime/schema/política permanecem fora desta task.
- Verificação: `npm run typecheck` e `git diff --check` passaram em 2026-09-12.
- Pendência: checkpoint PEK com renderizações reais em 1440/768/390 px e smoke autorizado de seleção de sessão, indisponibilidade, `partial_published`, `research_exhausted`, `needs_rebase`, teclado e reduced motion.

## Resultado do agente — 2026-09-12

- Implementação entregue: tipos e cliente autenticado para workspace, sessões, revisão e impacto; seleção explícita de ficha/sessão; aba `Pesquisa` no `TechnicalFichaWorkspace`; painel de outcome, vetores before/after/delta, estados sem revisão publicada e recomendação não mandatória com alternativa “não pesquisar agora”.
- Segurança aplicada: `credentials: same-origin`, IDs só no contexto de rota, estado local efêmero, mensagens neutras para indisponibilidade e nenhum URL/prompt/query/modelo/metadado interno apresentado.
- Arquivos: `apps/web/src/api.ts`, `types.ts`, `VehicleWorkspace.tsx`, `vehicle-workspace.css`, `TechnicalFichaWorkspace.tsx` e `technical-ficha-workspace.css`.
- Verificações aprovadas: `npm run typecheck`, `npm run build` fora do sandbox e `git diff --check`. O checkpoint PEK no app em execução confirmou desktop do estado vazio, hierarquia sem CTA automático e tabulação input → “Abrir workspace”; a ficha existente também confirmou a aba `Pesquisa` no shell real.
- Bloqueio real: a consulta de leitura ao PostgreSQL configurado não encontrou `vehicle_configuration` disponível para montar um workspace da sessão autenticada. Sem uma ficha/sessão autorizada, não é correto fabricar impacto, usar UUID alheio ou criar dado persistente apenas para captura. Faltam os renders preenchidos desktop 1440/tablet 768/mobile 390, além da sessão autorizada e dos estados terminais.
- Próximo passo objetivo: fornecer uma configuração de teste já autorizada, ou autorizar uma fixture efêmera vinculada à organização de teste; então reabrir a task somente para checkpoint visual final.
- Commit: não criado, pois os componentes do workspace e as tasks já estavam não rastreados junto de alterações paralelas do PEK; um commit agora misturaria ownerships.
