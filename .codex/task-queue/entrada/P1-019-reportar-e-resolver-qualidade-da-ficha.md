# 🚧 Em execução — E03-04b Reportar e resolver qualidade da ficha

> Prioridade: P1
>
> Área afetada: reporte, QA, API, UI e auditoria
>
> Origem ou referência: `docs/product/backlog.md` E03-04; fluxo de reporte
>
> Arquitetura: `APPROVED — Lucas autorizou seguir para a próxima task em 2026-09-11.`
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

## Architecture Gate — reporte de qualidade (2026-09-11)

Criar `quality_reports` append-only, tenant-scoped, para versão e caminho de campo opcionais, com estados allowlisted `received`, `under_review`, `corrected`, `not_confirmed`. Analista/admin abre reporte com motivo enumerado e nota sanitizada limitada; somente admin altera estado, registra decisão e referência à revisão corretiva futura. Uma decisão jamais altera a versão reportada. Antiabuso: máximo de um reporte aberto por organização/versão/campo/motivo e limite de tamanho; não há notificação externa, SLA ou suporte genérico. Auditoria registra apenas ação/estado/ID. Conclusão: `APPROVED`.

## Resultado do agente

- Estado: `🚧 Em execução`; Arquitetura: `APPROVED`; Segurança: `Aplicável — tenant, RBAC e auditoria.`
- Implementação: em andamento.
