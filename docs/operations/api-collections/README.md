# Operação MVP — aprovação de empresas

Esta coleção é interna e temporária: substitua-a por painel com RBAC em P1-013/P1-014. Nunca versione chave, cookie, senha, CNPJ ou e-mail reais.

No terminal local, configure somente valores locais:

```sh
export BLINDSPOT_API_URL="http://localhost:3001"
export OPERATOR_APPROVAL_KEY="valor-configurado-no-env-local"
```

Use os comandos de [organizacoes-curl.sh](organizacoes-curl.sh). A listagem retorna referências operacionais temporárias; use uma delas em `REQUEST_PROTOCOL` apenas no terminal. Chave ausente/inválida, referência malformada e decisão repetida não alteram estado. O serviço mascara referência de decisão no log HTTP.
