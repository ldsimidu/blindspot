# Variáveis de ambiente — operação de organizações

Este guia cobre o cadastro, aprovação e recusa de empresas no MVP. Não coloque valores reais em arquivos versionados, capturas de tela, exports de collection ou chats.

## 1. Servidor BlindSpot (`.env`)

Copie `.env.example` para `.env` e configure os valores abaixo antes de iniciar `npm run dev`.

| Variável | Obrigatória para | O que informar | Exemplo seguro de formato |
|---|---|---|---|
| `PERSISTENCE_MODE` | cadastro, login e operação | `postgres` | `postgres` |
| `DATABASE_URL` | acesso ao Neon | URL de conexão do Neon, mantida apenas no `.env`/secret manager | `postgresql://...` |
| `DATABASE_POOL_MAX` | pool Neon | inteiro entre `1` e `10`; para desenvolvimento, `4` | `4` |
| `OPERATOR_APPROVAL_KEY` | listar, aprovar e recusar pelo Postman/cURL | segredo aleatório com pelo menos 32 caracteres; use exatamente o mesmo valor no Postman | não versione o valor |
| `ORGANIZATION_HASH_KEY` | hash de CNPJ, e-mail, protocolo e limite de login | segredo aleatório, diferente das demais chaves, com pelo menos 32 caracteres | não versione o valor |
| `PASSWORD_PEPPER` | derivar/verificar senhas de cadastro | segredo aleatório com pelo menos 32 caracteres; nunca o altere sem plano de rotação | não versione o valor |
| `SESSION_TOKEN_HASH_KEY` | sessão após aprovação | segredo aleatório com pelo menos 32 caracteres | não versione o valor |
| `INVITATION_TOKEN_HASH_KEY` | apenas fluxo legado de convite P1-010 | segredo aleatório com pelo menos 32 caracteres | não versione o valor |

As cinco chaves devem ser distintas. Gere valores localmente ou em um secret manager; não reutilize senha humana, CNPJ, token de provider ou chave de outro sistema.

## 2. Postman

Importe o arquivo `blindspot.local.postman_environment.json`, selecione **BlindSpot — Local** e informe os valores em **Current value**. A collection espera estes nomes exatamente:

| Variável Postman | Valor a preencher | Origem |
|---|---|---|
| `baseUrl` | `http://localhost:3001` | API Express; **não** use `http://localhost:5173`, que é a interface Vite |
| `operatorApprovalKey` | valor literal de `OPERATOR_APPROVAL_KEY` existente no `.env` | `.env` local |
| `requestProtocol` | campo `protocol` devolvido por **Listar empresas em espera** | resposta da API; use somente enquanto decide aquela solicitação |

O environment deve estar ativo no seletor superior direito. Ao editar, preencha **Current value**; um valor somente em *Initial value* pode não ser enviado pelo cliente local.

## 3. Sequência de operação

1. Inicie a API e confirme `Server running at http://localhost:3001`.
2. Execute **Listar empresas em espera**. A resposta `200` traz solicitações `received`.
3. Copie o campo `protocol` da empresa desejada para `requestProtocol`.
4. Execute **Aprovar empresa** ou **Recusar empresa** uma única vez.
5. Uma aprovação faz o mesmo e-mail/senha criar sessão no próximo login; uma recusa apresenta a tela de suporte sem liberar acesso.

`404 Solicitação indisponível para decisão` é deliberadamente neutro: acontece para chave ausente/incorreta, referência inválida ou decisão já consumida. Não tente descobrir a causa com dados reais; confira primeiro environment ativo, nome da variável, **Current value** e se o protocolo veio da listagem atual.

## Limites do MVP

Essa chave de operador é temporária e interna. Não há painel administrativo, RBAC, MFA, e-mail transacional, recuperação de senha ou rate limit distribuído nesta fase. P1-012, P1-013 e P1-014 substituem esses limites progressivamente.
