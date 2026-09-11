# Operação MVP — aprovação de empresas

Esta coleção é interna e temporária: substitua-a por painel com RBAC em P1-013/P1-014. Nunca versione chave, cookie, senha, CNPJ ou e-mail reais.

No terminal local, configure somente valores locais:

```sh
export BLINDSPOT_API_URL="http://localhost:3001"
export OPERATOR_APPROVAL_KEY="valor-configurado-no-env-local"
```

## Postman

Importe [blindspot-operacao-organizacoes.postman_collection.json](blindspot-operacao-organizacoes.postman_collection.json) e o template [blindspot.local.postman_environment.json](blindspot.local.postman_environment.json) pelo botão **Import** do Postman. Em seguida, selecione o environment **BlindSpot — Local** no canto superior direito do Postman e preencha seus **Current values**.

Veja o guia completo em [variaveis-de-ambiente.md](variaveis-de-ambiente.md). Resumo das variáveis Postman:

- `baseUrl`: por exemplo, `http://localhost:3001`;
- `operatorApprovalKey`: o valor local de `OPERATOR_APPROVAL_KEY`;
- `requestProtocol`: a referência retornada por **Listar empresas em espera**.

A collection possui três requests: listar em espera, aprovar e recusar. Seus valores padrão são vazios e nenhum segredo, cookie, senha, CNPJ ou e-mail real é versionado.

## Terminal

Use os comandos de [organizacoes-curl.sh](organizacoes-curl.sh). A listagem retorna referências operacionais temporárias; use uma delas em `REQUEST_PROTOCOL` apenas no terminal. Chave ausente/inválida, referência malformada e decisão repetida não alteram estado. O serviço mascara referência de decisão no log HTTP.
