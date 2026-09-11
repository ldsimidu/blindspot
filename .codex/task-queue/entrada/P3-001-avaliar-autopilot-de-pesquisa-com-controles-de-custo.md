# ❌ Pendente — Avaliar Research Autopilot com controles de custo

> Prioridade: P3
>
> Área afetada: IA, orçamento, jobs, permissões e observabilidade
>
> Origem ou referência: proposta, seções 46 a 48 e 68
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — automação de IA com custo e ações encadeadas.`
>
> Segurança: `Aplicável — provider, orçamento, permissões, contenção e logs.`

## Pedido

Somente após medir a eficácia das sessões manuais e recomendações, avaliar um modo Autopilot que encadeie focos permitidos até atingir condições explícitas de parada. A entrega pode concluir que não deve ser implementado.

## Critérios de aceite

- [ ] A decisão usa dados de sucesso, custo, erro e revisão humana de sessões anteriores, não promessa teórica.
- [ ] Objetivo, orçamento, número máximo de sessões, políticas permitidas, aprovação e critérios de parada são explícitos e auditáveis.
- [ ] Não há execução sem autorização/papel adequados, limite de consumo e cancelamento efetivo.
- [ ] Cada ação conserva o mesmo contrato de sessão, evidência e revisão; falha parcial não inicia cadeia infinita.

## Restrições ou contexto

- Depende de P1-032, P1-034, P1-036, P1-015/P1-016 e controles de acesso concluídos.
- Sem provider real, fila distribuída, notificação externa ou coleta de dados adicionais durante arquitetura.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — automação de IA e custo.`
- Segurança: `Aplicável — guardrails, autorização, orçamento e observabilidade.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar evidência operacional e Architecture Gate próprio.
