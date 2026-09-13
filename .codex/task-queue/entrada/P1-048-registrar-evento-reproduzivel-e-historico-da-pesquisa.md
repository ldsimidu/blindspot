# ✅ Concluída — Registrar evento reproduzível e histórico da pesquisa

> Prioridade: P1
>
> Área afetada: persistência, API, observabilidade, auditoria e interface
>
> Origem ou referência: proposta (2), seções 18, 19, 35, 36, 45, 47 e 72
>
> Arquitetura: `APPROVED — retenção de 180 dias e eliminação automática autorizadas por Lucas em 2026-09-12.`
>
> Triagem automática: `Material — adiciona ledger de execução, retenção e leitura de auditoria.`
>
> Segurança: `Aplicável — dados de organização, conteúdo não confiável, retenção e exposição de logs.`

## Pedido

Criar um histórico append-only e sanitizado por sessão de pesquisa que permita entender e reproduzir a decisão técnica: plano/política versionados, tarefas, transições, orçamento, stop condition, revisões produzidas e resultado. O histórico de produto não pode armazenar prompt, URL completa, trechos brutos, tokens ou segredos.

## Critérios de aceite

- [x] Cada sessão tem eventos ordenados e correlação estável para planejamento, execução, cancelamento, exaustão, falha e publicação.
- [x] Plano, regras, versão de runtime/política, orçamento e condição de parada são registrados como metadados sanitizados e versionados.
- [x] A leitura autorizada explica o que ocorreu sem retornar prompt, conteúdo bruto de provider, URL, segredo ou identificadores de outro tenant.
- [x] Retry é distinguido de nova execução; o histórico não duplica publicação nem permite editar retroativamente um evento.
- [x] Retenção, acesso e eliminação de dados são decididos no Architecture Gate e testados com fixtures de isolamento e sanitização.

## Restrições ou contexto

- Depende de P0-012, P0-014, P1-013, P1-044 e avaliação de conformidade aplicável.
- `audit_events`, telemetria e medição de consumo não podem ser reutilizados como substitutos sem confirmar semântica, retenção e acesso.
- Não implementar provider real, coleta de conteúdo bruto, replay automático ou exportação de logs nesta task.

## Resultado do agente

## Preflight e Architecture Gate — 2026-09-12

### Fatos confirmados

- `research_sessions` já preserva organização, ficha, revisão-base, chave de idempotência, focus, alvos, versões de política/runtime/plano, orçamento, estado e motivos terminais.
- `research_session_tasks` mantém sequência, estratégia, alvos, orçamento e estado de cada tarefa; `field_research_states` e `research_session_quality_impacts` cobrem facetas específicas, não um histórico ordenado.
- `createResearchSession`, `executeResearchSession`, cancelamento, exaustão e publicação atualizam essas estruturas, porém não emitem um ledger append-only correlacionável.
- `audit_events`, telemetria e logs do provider têm outra semântica e não podem ser reutilizados como histórico de produto: podem ser agregados, ter retenção distinta ou conter fronteiras de sanitização diferentes.
- P0-014 e P1-044 estão entregues; o fluxo em questão permanece simulated e não deve chamar provider real nesta task.

### Decisão proposta

Criar uma tabela de eventos de sessão, exclusivamente append-only, e uma leitura autenticada por sessão. Cada evento registra somente:

- `research_session_id`, `organization_id`, ordinal monotônico por sessão, tipo enumerado e instante;
- correlação sanitizada (`request_id` já existente, sem token/cookie), versões já persistidas, contagens de orçamento e estados/motivos enumerados;
- referências internas da própria sessão (`base_revision_id`, `result_revision_id` quando publicado) para explicar a decisão sem expor conteúdo da ficha, prompt, URL, título/trecho externo, resposta bruta, token, header ou segredo.

Eventos propostos: `session_planned`, `execution_started`, `task_started`, `task_finished`, `session_cancelled`, `session_exhausted`, `session_failed`, `revision_published` e `impact_recorded`. Nova tentativa só existe por nova sessão/chave de idempotência; o endpoint de execução não poderá criar um segundo `revision_published` para a mesma sessão. Não haverá update/delete de evento pela API de produto.

### Fluxo e contrato de leitura

```text
ação autenticada → pesquisa existente atualiza estado
  → mesma transação grava evento sanitizado com ordinal
  → GET autenticado por research_session_id filtra organization_id
  → histórico ordenado explica plano, orçamento, transições e revisão
```

O endpoint de leitura será para `analyst|admin`, seguirá o filtro de organização existente e retornará no máximo metadados allowlisted. `404`/`403` não distinguirão sessões de outro tenant. Não há interface nesta task; a UI consumidora só será criada posteriormente.

### Revisão de segurança proporcional

- **Gatilhos:** persistência, auditoria, API autenticada, logs/histórico e retenção.
- **Fronteira:** sessão autenticada → RBAC → serviço de pesquisa → transação PostgreSQL → leitura tenant-scoped. Conteúdo de provider continua externo/não confiável e fica fora do ledger.
- **Controles:** allowlist de tipo/motivo/campos; JSON restrito a contagens e versões; `organizationId` e `researchSessionId` obrigatórios; índice/unique `(research_session_id, sequence_number)`; sem endpoint de mutação; resposta limitada/paginada; testes de sanitização e isolamento.
- **Risco residual:** referências internas podem ser dados organizacionais; acesso e descarte devem ser definidos antes da persistência. Lucas é o responsável por aceitar esse risco após a política ser decidida.

### Revisão de conformidade proporcional

- **Jurisdição/fonte:** LGPD, Lei nº 13.709/2018 consolidada, consultada em 2026-09-12: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm; portal ANPD consultado na mesma data: https://www.gov.br/anpd/pt-br.
- **Finalidade proposta:** transparência operacional, reprodutibilidade técnica e suporte à revisão de pesquisa por pessoas autorizadas da organização.
- **Dados:** o desenho exclui conteúdo bruto de provider e dados pessoais explícitos; ainda assim, IDs de membro/conta existentes e correlação podem constituir dado organizacional ou permitir associação. Dados sensíveis, de crianças/adolescentes, analytics, cookies novos, transferência internacional e terceiros não entram no escopo.
- **Minimização/transparência:** responder apenas tipo, momento, estado, contagens, versões e referências internas; nunca persistir prompt, URL, trecho, token ou segredo. A tela futura deverá explicar que o histórico é operacional e tenant-scoped.
- **Bloqueio de conformidade:** a duração de retenção, mecanismo de eliminação e responsável pela decisão não estão definidos. O contrato de conformidade exige bloquear a implementação nessas condições; não é possível escolher essa política em nome da organização.

### Double-check

- O ledger não substitui `audit_events`, telemetria, `research_sessions`, tarefas, impacto ou a futura UI; ele os correlaciona sem copiar conteúdos sensíveis.
- Append-only vale para a janela de retenção; eliminação posterior precisa ser uma rotina administrativa rastreável, não alteração retroativa de eventos.
- O desenho não aumenta orçamento, não reexecuta provider, não exporta logs e não altera schema/runtime enquanto o gate estiver bloqueado.
- A leitura por sessão preserva organização e não oferece enumeração global.

### Decisão do Gate

`BLOCKED — falta decisão humana sobre retenção e descarte do ledger.`

Para liberar a implementação, registrar: prazo de retenção; se haverá exclusão automática, anonimização ou eliminação por solicitação; quem é responsável por validar a política; e se eventos em investigação/obrigação devem ter exceção documentada.

- Estado: `❌ Pendente — Architecture Gate bloqueado por política de retenção.`
- Implementação: não iniciada; nenhuma migration, endpoint ou dado foi criado.
- Arquivos alterados: esta task, com preflight/gate e revisão de segurança/conformidade.
- Verificação: releitura de `research-sessions.ts`, `research-plan.ts`, schema/migrations `0020`, `0024` e `0025`, contratos PDK e fontes oficiais indicadas.
- Próximo passo: Lucas define a política de retenção/descarte e o responsável; então mudar o gate para `APPROVED` e implementar somente o contrato aprovado.

## Decisão humana e implementação — 2026-09-12

### Decisão do Gate

Lucas autorizou prosseguir após a proposta de política. Fica registrada a política operacional: **retenção de 180 dias**, **eliminação automática após expiração** e **Lucas como responsável pela política**. A decisão substitui o bloqueio de arquitetura anterior; nenhuma interpretação jurídica adicional é declarada por esta task.

### Entrega

- Criada a migration `0028_research_session_events` e o schema correspondente. O ledger possui `sequence_number` único por sessão, tipo enumerado em constraint, `organization_id`, correlação, metadata JSON objeto e data de expiração indexada.
- Criado `research-session-history.ts`: append-only com bloqueio da sessão durante a alocação do ordinal; endpoint de leitura tenant-scoped; allowlist de metadata; purge na inicialização e a cada 24 horas, além da leitura. A expiração remove o evento fisicamente; a aplicação não expõe mutação/edição de evento.
- Integrados eventos de planejamento, exaustão na criação, início de execução/tarefa, conclusão, publicação com revisão efetiva, falha, cancelamento e cálculo de impacto. Repetição pela mesma idempotency key devolve a sessão existente e não recria o evento de planejamento; publicação só ocorre após a persistência idempotente da revisão.
- Exposto `GET /api/research-sessions/:id/historico` para `analyst|admin`, com filtro obrigatório de organização e auditoria `research_session.history_read`. A resposta contém apenas sequência, tipo, correlação server-generated, metadata sanitizada, momento e expiração.
- A migration foi aplicada com sucesso no PostgreSQL configurado.

### Verificações

- `npm run typecheck` — aprovado.
- `npm run build` — aprovado.
- `npm run verify:research-sessions`, `npm run verify:research-plan` e `npm run verify:research-session-quality-impact` — aprovados.
- `npm run verify:research-session-history` — aprovado; comprova allowlist, ausência de campos proibidos na migration, eventos terminais, retenção de 180 dias e predicado de organização da leitura.
- Smoke sem sessão para `/api/research-sessions/:id/historico` — `401`.
- `git diff --check` — aprovado.

### Limites e handoff

- Não houve provider real, replay, exportação de logs ou armazenamento de prompt/URL/conteúdo bruto.
- A suíte exercita sanitização e isolamento de contrato sem criar dados persistentes de segundo tenant; a prova integrada multi-tenant permanece coberta pela P1-049, que consolida os cenários end-to-end com fixtures controladas.
- Commit não criado: o worktree mantém alterações paralelas e arquivos não rastreados de outras tasks; um commit isolado misturaria ownerships.
