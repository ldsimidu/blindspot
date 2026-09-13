# ✅ Concluída — Validar cenários de aceite da pesquisa e fichas

> Prioridade: P1
>
> Área afetada: testes, fixtures, API, interface e documentação de aceite
>
> Origem ou referência: proposta (2), seções 70 a 72 e 81 a 83
>
> Arquitetura: `APPROVED — 2026-09-12. Escopo de verificacao deterministica: fixtures sinteticas, testes e documento de aceite. Nao altera runtime, schema, provider, endpoint ou interface.`
>
> Triagem automática: `Material — consolida contratos ponta a ponta e pode revelar mudanças necessárias.`
>
> Segurança: `Aplicável — testes de isolamento, evidência e ausência de vazamento.`

## Pedido

Construir uma suíte de aceite determinística para a jornada canônica Vehicle → Sheet → Revision → Session, incluindo o cenário BYD descrito na proposta e suas bordas. A suíte valida contrato e comportamento; não simula sucesso por alterar os dados esperados para caber no runtime atual.

## Critérios de aceite

- [x] Fixtures seguras cobrem ficha existente, nova ficha, continuação, conflito, campo desconhecido/não aplicável, pesquisa esgotada, cancelamento, revisão publicada e falha parcial.
- [x] O cenário BYD cobre criação/seleção de ficha, foco limitado, persistência de evidência, impacto de qualidade e recomendação não mandatória.
- [x] Testes distinguem `latest`, `recommended` e `primary`, e provam que uma ficha não altera outra nem cruza organizações.
- [x] Casos de fonte ausente, identidade incompatível, sessão concorrente e resposta inválida falham de forma controlada e sem segredo.
- [x] O documento de aceite liga cada caso às tasks/contratos e declara os cenários bloqueados por dependências não implementadas.

## Restrições ou contexto

- Depende de P0-012, P0-013, P0-014, P1-044 a P1-048 e das capacidades efetivamente entregues; não antecipar requisitos futuros em verde.
- Usar modo simulated e fixtures locais; não chamar provider real, banco externo ou publicar dados de fabricante.
- Não é substituto do Architecture Gate de mudanças reveladas pelos testes.

## Resultado do agente

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — 2026-09-12. Verificacao isolada, sem mudanca de contrato de producao.`
- Triagem automática: `Material — valida integração de contratos e possíveis correções.`
- Segurança: `Aplicável — fixtures, tenancy e não exposição de dados.`
- Implementação: suíte de aceite determinística criada, incluindo contrato de falhas seguras, jornada BYD sintética, cancelamento, pesquisa esgotada, histórico sanitizado, seleção de ficha e isolamento organizacional. A fixture concorrente preexistente passou a remover eventos de histórico antes da sessão.
- Arquivos alterados: `scripts/verify-research-acceptance-contract.ts`, `scripts/verify-research-acceptance-db.ts`, `scripts/verify-research-session-execution-db.ts`, `package.json`, `docs/operations/research-acceptance-scenarios.md`.
- Verificação: `npm run typecheck`, `npm run build`, `npm run verify:research-acceptance-contract`, `npm run verify:research-acceptance-db`, `npm run verify:research-session-execution-db` e os verificadores componentes da suíte (`field-states`, `research-plan`, `research-session-history`, `workspace-contract-db`, `technical-sheet-lineage-db`, `technical-sheet-governance-db`) passaram. `git diff --check` sem erros.
- Próximo passo: nenhuma pendência desta task; próximas evoluções de retry/agendamento, recomendação automática ou provider real exigem task e Architecture Gate próprios.
