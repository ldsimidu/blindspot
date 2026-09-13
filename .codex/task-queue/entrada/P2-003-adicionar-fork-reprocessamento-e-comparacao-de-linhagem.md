# ❌ Pendente — Adicionar fork, reprocessamento e comparação de linhagem

> Prioridade: P2
>
> Área afetada: dados, API, interface, autorização e auditoria
>
> Origem ou referência: proposta, seções 10, 11, 37 a 39 e 42 a 44
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — cria operações de cópia, linhagem e comparação.`
>
> Segurança: `Aplicável — autorização, custo e integridade de dados.`

## Pedido

Implementar operações explicitamente distintas para fork e reprocessamento depois que o ciclo normal de ficha/sessão estiver estável. Um fork inicia nova ficha com revisão-base rastreável; reprocessamento inicia sessão com runtime/política diferentes sem confundir resultado com refresh.

## Critérios de aceite

- [ ] Fork registra ficha/revisão de origem, razão, ator e instante; não compartilha estado mutável nem altera a origem.
- [ ] Reprocessamento registra versão de runtime/modelo/políticas e permite comparar resultado com a revisão-base.
- [ ] Comparação mostra diferenças de identidade, valores, estados, evidências e qualidade; não presume que veículos distintos são erro.
- [ ] Merge não é implementado; a task registra critérios, visualização de divergências e decisão humana assistida que seriam exigidos antes de uma futura implementação.
- [ ] Refresh, fork e reprocessamento permanecem operações distintas, com regra explícita para `stale/outdated`, atualização temporal e preservação de revisão-base.

## Restrições ou contexto

- Depende de P1-030 a P1-036 e RBAC.
- Não incluir autopilot, merge automático, exportação nova ou alteração de fontes.
- Esta task não autoriza escolher vencedor de conflito ou promover uma revisão sem decisão humana registrada.

## Resultado do agente

## Reescrita UX/UI — 2026-09-12

Esta task adota `docs/product/ux-ui-future-task-redesign-standard.md`: refresh, fork e reprocessamento terão jornadas e consequências visualmente distintas, com linhagem legível e comparação sem vencedor. A tela exige arquitetura PEK, security e renderizações reais antes de implementação.

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — operações de linhagem e acesso.`
- Segurança: `Aplicável — permissão, auditoria e custo de provider.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar fluxo base validado e Architecture Gate próprio.
