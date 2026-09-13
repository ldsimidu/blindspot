# ✅ Concluída — Endurecer publicação de revisão e concorrência por ficha

> Prioridade: P0
>
> Área afetada: persistência, transação, API e auditoria
>
> Origem ou referência: proposta (2), seções 3, 21 a 25, 46, 61 e 72
>
> Arquitetura: `APPROVED — Lucas autorizou seguir com a próxima task em 2026-09-12.`
>
> Triagem automática: `Material — integridade de revisões e execução concorrente.`
>
> Segurança: `Aplicável — revisão proporcional registrada; persistência e concorrência ainda não foram alteradas.`

## Pedido

Tornar a publicação de Revision monotônica por Sheet, com base revision, plano/sessão idempotentes e transições transacionais; corrigir qualquer numeração global ou estado que permita mistura entre Sheets.

## Critérios de aceite

- [x] Revision tem sequência por Sheet e nunca substitui payload/evidência anterior.
- [x] Concorrência gera `needs_rebase` ou conflito explícito, nunca last-write-wins.
- [x] Session registra budget, motivo de parada e versão de runtime/políticas suficientes para rastreabilidade.
- [x] Fixtures provam duas organizações, duas Sheets do mesmo Vehicle e duas sessões concorrentes.

## Restrições ou contexto

- Não executar provider real; preservar IDs públicos já exportados.
- Esta task não altera `apps/web/src/**`; não há colisão prevista com o modelo PEK.

## Architecture Gate — publicação monotônica e concorrência (2026-09-12)

### Fatos confirmados

- `technical_sheet_versions.version_number` é atualmente calculado por `vehicle_configuration_id`, embora a revisão pertença semanticamente a `technical_sheet_id`.
- Há uma constraint única por configuração/versão e índice por ficha/data, mas não há constraint única por ficha/versão.
- `expectedBaseRevisionId` evita publicação sobre revisão já conhecida como obsoleta, porém duas transações podem observar a mesma última revisão antes de inserir.
- `research_sessions` persiste foco, alvos, versão da política de fonte, schema e orçamento; faltam `runtime_contract_version`, `stop_reason` e check de estados no banco.
- O executor V1 permanece somente simulated; nenhuma chamada real de provider é necessária para a correção.

### Decisão

Fazer uma migration aditiva e compatível que troca a unicidade de `technical_sheet_versions` de `(vehicle_configuration_id, version_number)` para `(technical_sheet_id, version_number)`. IDs das versões, payloads, hashes, fontes, exportações e relações existentes permanecem intactos; números históricos continuam válidos, apenas passam a ter semântica local à ficha.

Antes de calcular a próxima revisão, a transação de publicação bloqueia a linha da `technical_sheet` alvo com `FOR UPDATE`. Só então ela lê a última revisão daquela ficha e compara `expectedBaseRevisionId`. Assim, o primeiro escritor publica a próxima sequência e o segundo observa a base desatualizada, terminando em `needs_rebase`; não há last-write-wins.

`research_sessions` recebe `runtime_contract_version` e `stop_reason`, e uma constraint allowlisted para estados. O servidor, não o cliente, preenche orçamento efetivo, motivo de parada e versões de contrato. Transições permitidas no corte V1 são `queued → running → succeeded|failed|cancelled|needs_rebase`; `partial` e `research_exhausted` ficam reservados e não são emitidos até a P1-044 definir plano/stop conditions reais.

### Impacto técnico e compatibilidade

- Migration nova: remover somente a constraint global de versão e adicionar a constraint por ficha; adicionar colunas de rastreabilidade com default compatível para sessões históricas; adicionar check de estados.
- Repositório: bloquear ficha antes de ler/escrever versão e calcular `versionNumber` por `technical_sheet_id`.
- Orquestrador: registrar `runtime_contract_version`, `budget.provider_calls`, `stop_reason` sanitizado e transições server-owned.
- API pública: não recebe novos campos sensíveis do cliente; respostas existentes permanecem compatíveis. A eventual exposição detalhada de plano/histórico é da P1-048.
- Frontend: nenhum arquivo ou contrato visual é alterado nesta task.

### Segurança e conformidade proporcional

Gatilhos: persistência, API autenticada, concorrência, auditoria, dados de organização e IA simulated. Controles: tenant/ator continuam derivados da sessão; lock e constraint evitam perda de atualização; campos novos são enumerados e sanitizados; nenhuma URL, prompt, conteúdo de provider, segredo ou dado adicional entra na sessão. A finalidade continua pesquisa técnica por membro autorizado da própria organização. Sem texto livre, novo terceiro, retenção nova ou dado sensível/criança, não há novo bloqueio de conformidade; base legal, controlador e retenção já permanecem decisão humana registrada na P0-013. Referência: LGPD consolidada no Planalto e ANPD, consultadas em 2026-09-12; isto não é parecer jurídico.

### Verificação e double-check

- Migration em PostgreSQL autorizado com duas fichas da mesma configuração, cada qual iniciando em sequência local `1`.
- Duas sessões concorrentes na mesma ficha: uma publica; a outra termina `needs_rebase`, sem modificar payload/evidência anteriores.
- Duas organizações e duas fichas do mesmo veículo não cruzam leitura, criação ou publicação.
- Sessões históricas recebem defaults compatíveis; transição/estado inválido é rejeitado pelo banco/servidor.
- Rodar verificadores de linhagem/concorrência/sessão, `typecheck`, `git diff --check` e smoke simulated quando o ambiente permitir. Sem provider real.

Double-check: a mudança não reescreve versões, não apaga payload, não altera assets canônicos, prompt, schema JSON, provider, catálogo global, UI, fork, merge, `primary`, Knowledge Base ou autopilot. A migração é reversível por migration de compensação de constraint/colunas somente enquanto não houver dependência de dados novos; rollback de versões publicadas não é necessário. Conclusão: `READY`.

## Resultado do agente

- Estado: `✅ Concluída em 2026-09-12.`
- Arquitetura: `APPROVED — Lucas autorizou seguir com a próxima task em 2026-09-12.`
- Triagem automática: `Material — migration, transação, sessão e integridade de dados.`
- Segurança: `Aplicável — isolamento, concorrência, auditoria e rastreabilidade.`
- Conformidade: `Aplicável — sem novo dado/transmissão; decisões humanas de finalidade e retenção permanecem registradas.`
- Implementação: migration `0023_sheet_revision_sequence_and_session_trace` aplicada no PostgreSQL configurado. A versão é única e numerada por `technical_sheet_id`; a publicação bloqueia a ficha com `FOR UPDATE` antes de comparar revisão-base e publicar. O catálogo passou a resolver `latest` temporal por data, pois o número deixou de ser global. Sessions registram `runtime_contract_version`, `stop_reason`, orçamento efetivo e estados com constraint allowlisted. Não houve alteração de `apps/web/src/**`, provider, prompt ou assets canônicos.
- Arquivos alterados: `drizzle/0023_sheet_revision_sequence_and_session_trace.sql`, `drizzle/meta/_journal.json`, `services/api/db/schema.ts`, `services/api/db/repository.ts`, `services/api/research-sessions.ts`, `scripts/verify-technical-sheet-lineage.ts`, `scripts/verify-research-session-execution-db.ts` e esta task.
- Verificação: `npm run db:migrate` aplicou a migration com sucesso; `npm run verify:technical-sheet-lineage`, `npm run verify:research-sessions`, `npm run typecheck` e `git diff --check` passaram. No PostgreSQL configurado, `npm run verify:technical-sheet-lineage-db` passou com `TENANT_ISOLATION=PASS`, `npm run verify:technical-sheet-concurrency-db` passou com `SHEET_CONCURRENCY=PASS` e `npm run verify:research-session-execution-db` passou com `RESEARCH_EXECUTION=PASS`. O último executa duas sessões concorrentes sobre a mesma ficha e confirma exatamente uma publicação (`1000`) e uma sessão `needs_rebase`.
- Correção do fixture: o modelo do veículo de teste passou a usar sufixo aleatório por execução; isso elimina colisão com execuções abortadas sem tocar em dados preexistentes.
- Frontend: nenhuma alteração em `apps/web/src/**` foi feita nesta task.
- Próximo passo: P1-044 pode definir o plano de pesquisa dirigido e condições reais de parada; qualquer etapa de interface continuará dependente de handoff explícito ao PEK.
