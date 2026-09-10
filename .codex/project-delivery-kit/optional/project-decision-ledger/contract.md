# Project Decision Ledger Contract

## Propósito

O ledger preserva decisões duráveis para que contexto, alternativas, evidência e consequências não virem conhecimento implícito.

## Estados

`proposta`, `approved`, `superseded` e `reaberta`. Somente uma decisão `approved` pode sustentar uma arquitetura ou release; uma descoberta material a reabre.

## Conteúdo mínimo

Cada decisão possui ID estável, data, contexto, opções, decisão, evidência, consequências, owner e condição de reabertura. O ledger é histórico: decisões superseded não são apagadas.

## Limites

Não duplicar documentação de produto, expor segredos ou tratar ausência de registro como aprovação. O ledger não substitui o Architecture Gate.
