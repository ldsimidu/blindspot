# Pipeline HTTP (servidor Express)

Origem: `services/api/index.ts`.

## Endpoint

- `GET /api/health` — `{ "ok": true }`.
- `POST /api/auth/login` — e-mail e senha; credencial inválida recebe `401` neutro; credencial válida de cadastro pendente/recusado recebe `403 pending_review|rejected`, sem sessão; as três identidades `active` recebem somente cookie de sessão opaca. A resposta não contém token.
- `GET /api/auth/session` — valida cookie, expiração, revogação, conta, membro e organização; retorna somente estado e identidade mínima da sessão.
- `POST /api/auth/logout` — revoga a sessão indicada pelo cookie e a limpa; é idempotente e não enumera sessão.
- `POST /api/organizacoes/cadastro` — cadastro público com empresa, CNPJ, responsável, e-mail, senha, confirmação e versão de privacidade; retorna `202 received` neutro e cria organização/conta/membro pendentes sem sessão.
- `GET /api/operacoes/organizacoes/solicitacoes?state=received&page=&page_size=` — rota interna temporária, paginada e protegida por `x-operator-approval-key`; devolve somente dados de análise necessários e referência operacional.
- `POST /api/organizacoes/solicitacoes/:protocol/decisao` — rota interna temporária para aprovar/recusar usando `x-operator-approval-key`; para o cadastro novo, a decisão atualiza solicitação, organização, conta e membro na mesma transação. O convite continua só para registros legados `pending_activation`.
- `POST /api/ficha-tecnica` — exige sessão `analyst|admin`; corpo conforme `VEHICLE_INPUT_SPEC.md`, registra ator/organização sanitizados na execução e evento de auditoria.
- `GET /api/catalogo/fichas?q=&page=&page_size=` e `GET /api/catalogo/fichas/:id?...` — exigem qualquer sessão corporativa ativa; catálogo automotivo é recurso global compartilhado, sem seleção aproximada.
- `POST /api/importacoes/dry-run`, `GET /api/importacoes/:id` e `POST /api/importacoes/:id/confirmar` — exigem `analyst|admin`, vinculam a execução à organização da sessão e filtram a leitura/confirmação pelo mesmo tenant.

As rotas de catálogo exigem `PERSISTENCE_MODE=postgres`; elas não usam snapshots de arquivo como fallback. `loading` é estado da interface; `found`, `not_registered` e `incompatible` são estados explícitos de resposta.

As rotas de importação também exigem PostgreSQL. P1-013 vincula ator/organização no servidor; IDs de outra organização não são recursos acessíveis. Eventos de auditoria são estruturados e não contêm senha, cookie, token, prompt, resposta LLM bruta ou corpo da requisição.

## Sequência do handler principal

1. `parseVehicleInput(req.body)` — validação 400 se faltar campo ou ano inválido.
2. Em paralelo: `readBaseAgentPrompt()`, `readOutputSchema()`, `readSourcePolicy()`, `readNormalizationPolicy()`, `readFieldPolicy()` e `readQualityPolicy()` a partir de `packages/agent-runtime/assets/` por `runtime-assets.ts` (não desta pasta).
3. `buildVehiclePayload(vehicleInput)` — monta `context.vehicle`.
4. `composeFinalPrompt({ baseAgentPrompt, outputSchema, vehiclePayload })` — ver `PROMPT_COMPOSITION.md`.
5. `callLLM(finalPrompt, vehicleInput)` — ver `LLM_RUNTIME.md`.
6. `validateResponse(llmRawResponse, outputSchema, contexto)` — normaliza medidas allowlisted, aplica propulsão/extensões e cobertura 204/199/5, valida conflitos (duas fontes distintas, valor nulo e observação, sem vencedor automático), então valida AJV, fonte e identidade; ver `VALIDATION_AND_TYPES.md`; em falha, **422**.
7. Resposta **200** com JSON validado.

## Middleware

- CORS habilitado.
- `express.json` com limite **1mb**.
- Cabeçalho `x-request-id` e log de requisição ao finalizar a resposta (`services/api/logger.ts`).
- Contexto de sessão e papel no servidor: `viewer` lê recursos globais; `analyst` e `admin` também geram fichas e operam importações da própria organização. Negação é padrão.

## Erros

- `HttpError` — status e JSON `{ message, details? }`; `401`, `403` e `404` esperados não são registrados como stack trace de erro interno.
- Erros não mapeados — **500** com mensagem genérica e `details: null`.
