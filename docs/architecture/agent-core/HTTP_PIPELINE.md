# Pipeline HTTP (servidor Express)

Origem: `services/api/index.ts`.

## Endpoint

- `GET /api/health` — `{ "ok": true }`.
- `POST /api/ficha-tecnica` — corpo JSON conforme `VEHICLE_INPUT_SPEC.md` (nesta pasta `docs/`).
- `GET /api/catalogo/fichas?q=&page=&page_size=` — descoberta paginada no PostgreSQL; devolve candidatas ou `not_registered`, sem selecionar veículo aproximado.
- `GET /api/catalogo/fichas/:id?marca=&modelo=&versao=&ano_modelo=&mercado=` — abre a ficha atual somente quando o UUID e a identidade canônica completa coincidem; devolve `incompatible` se divergem.

As rotas de catálogo exigem `PERSISTENCE_MODE=postgres`; elas não usam snapshots de arquivo como fallback. `loading` é estado da interface; `found`, `not_registered` e `incompatible` são estados explícitos de resposta.

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

## Erros

- `HttpError` — status e JSON `{ message, details? }`.
- Erros não mapeados — **500** com mensagem genérica e `details: null`.
