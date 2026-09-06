# Pipeline HTTP (servidor Express)

Origem: `server/index.ts`.

## Endpoint

- `GET /api/health` — `{ "ok": true }`.
- `POST /api/ficha-tecnica` — corpo JSON conforme `VEHICLE_INPUT_SPEC.md` (nesta pasta `docs/`).

## Sequência do handler principal

1. `parseVehicleInput(req.body)` — validação 400 se faltar campo ou ano inválido.
2. Em paralelo: `readBaseAgentPrompt()` e `readOutputSchema()` a partir de `prompt-assets/` (não desta pasta).
3. `buildVehiclePayload(vehicleInput)` — monta `context.vehicle`.
4. `composeFinalPrompt({ baseAgentPrompt, outputSchema, vehiclePayload })` — ver `PROMPT_COMPOSITION.md`.
5. `callLLM(finalPrompt, vehicleInput)` — ver `LLM_RUNTIME.md`.
6. `validateResponse(llmRawResponse, outputSchema)` — ver `VALIDATION_AND_TYPES.md`; em falha, **422**.
7. Resposta **200** com JSON validado.

## Middleware

- CORS habilitado.
- `express.json` com limite **1mb**.
- Cabeçalho `x-request-id` e log de requisição ao finalizar a resposta (`server/logger`).

## Erros

- `HttpError` — status e JSON `{ message, details? }`.
- Erros não mapeados — **500** com mensagem genérica e detalhe opcional.
