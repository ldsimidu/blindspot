#!/usr/bin/env sh
# Requer BLINDSPOT_API_URL e OPERATOR_APPROVAL_KEY configurados localmente.

# Listar empresas em análise (campos mínimos, página 1, até 20 resultados).
curl --fail-with-body "$BLINDSPOT_API_URL/api/operacoes/organizacoes/solicitacoes?state=received&page=1&page_size=20" \
  -H "x-operator-approval-key: $OPERATOR_APPROVAL_KEY"

# Defina REQUEST_PROTOCOL com a referência devolvida pela listagem, somente no terminal.
# export REQUEST_PROTOCOL='ORG-referencia-da-listagem'

# Aprovar. A mesma transação ativa organização, conta e membro inicial.
curl --fail-with-body -X POST "$BLINDSPOT_API_URL/api/organizacoes/solicitacoes/$REQUEST_PROTOCOL/decisao" \
  -H "Content-Type: application/json" \
  -H "x-operator-approval-key: $OPERATOR_APPROVAL_KEY" \
  --data '{"decision":"approved"}'

# Recusar. A mesma transação recusa organização, conta e membro inicial.
curl --fail-with-body -X POST "$BLINDSPOT_API_URL/api/organizacoes/solicitacoes/$REQUEST_PROTOCOL/decisao" \
  -H "Content-Type: application/json" \
  -H "x-operator-approval-key: $OPERATOR_APPROVAL_KEY" \
  --data '{"decision":"rejected"}'
