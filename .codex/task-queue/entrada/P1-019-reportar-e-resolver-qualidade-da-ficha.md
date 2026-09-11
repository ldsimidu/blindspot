# ❌ Pendente — E03-04b Reportar e resolver qualidade da ficha

> Prioridade: P1
>
> Área afetada: reporte, QA, API, UI e auditoria
>
> Origem ou referência: `docs/product/backlog.md` E03-04; fluxo de reporte
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — dados de reporte, antiabuso e revisão humana.`
>
> Segurança: `A avaliar — autorização, privacidade e auditoria.`

## Pedido

Permitir reporte de qualidade por ficha, versão e campo, encaminhando-o por `recebido → em análise → corrigido | não confirmado` sem alterar a ficha automaticamente.

## Critérios de aceite

- [ ] Reporte identifica contexto e tem proteção antiabuso definida.
- [ ] QA registra decisão e evidência; correção gera nova versão, não sobrescrita.
- [ ] Notificação não revela dados a destinatário não autorizado.

## Restrições ou contexto

- Depende de P1-004 e P1-013; não incluir suporte genérico ou SLA de atendimento.

## Resultado do agente

- Estado: `❌ Pendente`; Arquitetura: `A avaliar`; Segurança: `A avaliar`.
- Implementação: ainda não iniciada.
