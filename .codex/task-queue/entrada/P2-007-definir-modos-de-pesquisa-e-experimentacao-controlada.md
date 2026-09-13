# ❌ Pendente — Definir modos de pesquisa e experimentação controlada

> Prioridade: P2
>
> Área afetada: IA, políticas, dados, API, custo, auditoria e interface
>
> Origem ou referência: proposta (2), seções 39, 43, 44, 46 a 48, 75 a 77
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — muda estratégia de IA, custo e reprodutibilidade.`
>
> Segurança: `Aplicável — provider, orçamento, dados não confiáveis, permissão e auditoria.`

## Pedido

Depois de estabilizar sessões manuais, definir modos explícitos para pesquisa nova, refresh temporal, reprocessamento por runtime/política e experimento controlado. A task deve decidir se cada modo é necessário e, se aprovado, impedir comparação enganosa ou gasto sem orçamento.

## Critérios de aceite

- [ ] Cada modo tem objetivo, entrada, saída, custo/orçamento, condição de parada e relação de linhagem definidos; refresh não é reprocessamento.
- [ ] Um experimento registra hipótese, coorte/escopo, versões de runtime/política, métricas, data de expiração e decisão humana, sem alterar silenciosamente a ficha recomendada.
- [ ] Resultados comparáveis preservam identidade, mercado, ano-modelo, versão e evidência; divergências ficam visíveis.
- [ ] Permissões, cancelamento, limites e auditoria são server-owned; não há seleção de provider/modelo livre pelo cliente.
- [ ] A arquitetura pode concluir por não implementar experimentação até existir evidência operacional suficiente.

## Restrições ou contexto

- Depende de P1-044, P1-045, P1-048, P2-003, P1-015/P1-016 e RBAC concluído.
- Não implementar A/B em produção, provider real, job distribuído ou autopilot nesta task sem nova autorização explícita.
- Reputação de fonte e base de conhecimento compartilhada permanecem nas P2-001/P2-002.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — política de IA, custo e comparação.`
- Segurança: `Aplicável — provider, autorização, auditoria e contenção.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar métricas das sessões manuais e Architecture Gate.
