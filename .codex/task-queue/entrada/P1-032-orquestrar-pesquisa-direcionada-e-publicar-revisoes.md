# ✅ Concluída — Orquestrar pesquisa direcionada e publicar revisões

> Prioridade: P1
>
> Área afetada: runtime de IA, API, persistência, custo e observabilidade
>
> Origem ou referência: P1-031; proposta, seções 18 a 25 e 45 a 48
>
> Arquitetura: `APPROVED — Lucas autorizou “pode seguir” em 2026-09-11.`
>
> Triagem automática: `Material — altera execução de pesquisa e publicação de dados.`
>
> Segurança: `Aplicável — provider, orçamento, concorrência, persistência e telemetria.`

## Pedido

Implementar o Research Orchestrator V1 como módulo do monólito: ele transforma uma sessão em plano determinístico, executa uma rodada direcionada, revalida o resultado e cria uma nova revisão apenas ao finalizar com integridade.

## Critérios de aceite

- [x] O plano explicita campos-alvo, política de fontes, orçamento de uma tentativa e condição de parada no registro server-owned da sessão.
- [x] A execução usa estados allowlisted e expõe transições V1 para execução e cancelamento pendente.
- [x] Sessões concorrentes não publicam sobre base divergente: `expectedBaseRevisionId` produz `needs_rebase` sem sobrescrita.
- [x] O resultado é sempre validado pelas políticas canônicas; ausência e conflito permanecem estados explícitos, sem valor inventado.
- [x] O executor não adiciona telemetria de conteúdo; registra somente estado/código sanitizado e não transmite provider real.

## Restrições ou contexto

- Depende de P1-031; reutilizar validação AJV, `fonte_ref`, políticas de qualidade e evidência atuais.
- V1 é uma fila local/worker modular com uma sessão por ficha como padrão seguro; fila distribuída, autopilot e paralelismo amplo ficam fora.
- Requer smoke simulated, fixtures de concorrência/idempotência e checks de tipo/build.

## Architecture Gate — orquestrador V1 (2026-09-11)

### Decisão

O orquestrador permanece módulo local do monólito. Uma chamada autenticada inicia somente sessão `queued` da própria organização, transita para `running` dentro de transação e executa uma rodada no provider `simulated` já existente. O plano é o registro server-owned da sessão: alvos resolvidos, versão da política de fontes/schema, orçamento `{ max_attempts: 1, provider_calls: 0|1 }` e parada por tentativa única, cancelamento, falha, validação ou revisão-base obsoleta.

O resultado sempre passa pelo mesmo AJV, `fonte_ref`, identidade, normalização, política de evidência e qualidade da geração atual. Só um resultado íntegro publica nova revisão na mesma `technical_sheet`; nenhuma mutação acontece na revisão-base. Antes da publicação, a transação compara a última revisão da ficha com `base_revision_id`: divergência termina em `needs_rebase`, sem last-write-wins. V1 impede duas sessões `running` na mesma ficha; `queued` pode coexistir, mas uma delas falhará controladamente ao tentar iniciar.

### Segurança, conformidade e verificações

- Gatilhos: API autenticada, persistência, IA/provider, custo, telemetria e auditoria. Foco/evidência continuam não confiáveis; o servidor mantém tenant, orçamento, política e estado.
- A telemetria registra apenas identificador de sessão, estado, contadores e código sanitizado; nunca prompt, conteúdo bruto, URL, segredo ou payload. O provider real continua fora do corte e sem autorização.
- A finalidade é pesquisa técnica autorizada; ator/organização são os únicos dados pessoais persistidos. Não há texto livre nem nova transmissão a terceiro neste recorte. Retenção e transparência do texto livre continuam bloqueadas como em P1-031.
- Testar transições inválidas, idempotência, sessão concorrente, base obsoleta, resultado inválido e ausência de provider; executar modo simulated, `typecheck` e check de contrato. O build é evidência separada e permanece bloqueado no checkout enquanto não houver `vite.config.ts`.

### Double-check

O plano não introduz worker distribuído, cron, autopilot, fila externa, prompt novo ou provider novo. `partial`, `failed`, `cancelled` e `needs_rebase` não publicam revisão; estados de ausência/conflito continuam explícitos no payload validado. Conclusão: `APPROVED` para implementação V1 simulada.

## Resultado do agente

- Estado: `✅ Concluída — remanescente dirigido entregue e validado em 2026-09-12.`
- Arquitetura: `APPROVED — execução V1 simulada autorizada em 2026-09-11.`
- Triagem automática: `Material — provider, execução assíncrona e estados.`
- Segurança: `Aplicável — custo, conteúdo externo, autorização e observabilidade.`
- Implementação: o executor V1 inicia somente sessão `queued` autorizada, fixa `running`, monta o prompt canônico e chama exclusivamente `callLLMSimulated`. O resultado passa por `validateResponse`; a publicação reutiliza a transação de persistência com ficha-alvo e `expectedBaseRevisionId`, produzindo `needs_rebase` em conflito e `failed` em falha, sem sobrescrita. A rota autenticada é `POST /api/research-sessions/:id/executar`.
- Arquivos alterados: `services/api/research-sessions.ts`, `services/api/db/repository.ts`, `services/api/index.ts` e esta task.
- Verificação: `npm run typecheck`, `npm run verify:research-sessions` e `git diff --check` passaram. A fixture autorizada `npm run verify:research-session-execution-db` passou com `RESEARCH_EXECUTION=PASS`: cria sessão/ficha isoladas, executa o módulo real em simulated, confirma `succeeded` e exatamente uma nova revisão, e remove as fixtures. Provider real, dados externos, smoke HTTP autenticado e build global não foram executados; o build segue previamente bloqueado pela ausência de `vite.config.ts`.
- Próximo passo: concluído; evolução de retry, agendamento ou provider real exige task e Architecture Gate próprios.

## Reconciliação P0-012 — 2026-09-12

O corte simulated de transição, validação e publicação com revisão-base foi entregue. A auditoria confirmou inicialmente que o executor ainda não aplicava `focus` ou `resolved_targets`; esse remanescente foi detalhado na P1-044 e integrado ao executor. A validação posterior de P1-049 confirmou, em fixture sintética, plano dirigido, publicação parcial íntegra, cancelamento, exaustão, `needs_rebase`, isolamento organizacional e histórico sanitizado. `npm run verify:research-session-execution-db`, `npm run verify:research-acceptance-db`, `npm run typecheck` e `npm run build` passaram em 2026-09-12. Nenhuma execução de provider real é autorizada por esta nota.
