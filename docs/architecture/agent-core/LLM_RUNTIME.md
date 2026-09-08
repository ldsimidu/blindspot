# Execução do LLM (lógica adicional)

Origem: `services/api/llm.ts`.

## Variável `LLM_PROVIDER`

- **`simulated`** (padrão se ausente): não chama API externa.
  - Lê `mock-response.json` de `packages/agent-runtime/assets/` pelo resolvedor `services/api/runtime-assets.ts`.
  - Faz parse JSON, clona o objeto, injeta dados do `VehicleInput` em `veiculo_alvo` e em campos de identificação em `ficha_tecnica` (marca, modelo, versão, ano_modelo, mercado) ajustando `valor`, `status`, `fonte_ref`, etc.

- **`claude`**: chama `https://api.anthropic.com/v1/messages`.

## Claude — requisitos e opções

- **API key**: `ANTHROPIC_API_KEY` (obrigatória para Claude).
- **Modelo**: `CLAUDE_MODEL` (padrão `claude-sonnet-4-5`).
- **Ferramenta web**: `CLAUDE_WEB_SEARCH_TOOL_TYPE` (padrão `web_search_20250305`), `name: "web_search"`.
- **Limites**: `CLAUDE_MAX_TOKENS` (padrão 16384), `CLAUDE_WEB_SEARCH_MAX_USES` (padrão 3), `CLAUDE_MAX_TURNS` (padrão 6).
- **Beta header opcional**: `CLAUDE_BETA_HEADER` → header `anthropic-beta`.
- **Domínios**: `CLAUDE_ALLOWED_DOMAINS` **ou** `CLAUDE_BLOCKED_DOMAINS` (CSV), nunca ambos — senão erro 500.
- **Fallback**: se `LLM_FALLBACK_TO_MOCK=true` e a chamada Claude falhar, usa o fluxo simulado.

## System prompt (Claude), fixo no código

Texto único (inglês), resumindo: agente automotivo; seguir `BASE_AGENT_PROMPT`; usar web search; priorizar fontes confiáveis e oficiais; retornar só JSON válido conforme `OUTPUT_SCHEMA_JSON`; sem comentário, planejamento ou cercas markdown.

## Mensagens

- Primeira mensagem **user**: o `finalPrompt` completo (como descrito em `PROMPT_COMPOSITION.md`).

## Tratamento de `stop_reason`

- **`pause_turn`**: empilha assistant + user `"Continue. Return only valid JSON according to OUTPUT_SCHEMA_JSON."`
- **`max_tokens`**: continua pedindo o **JSON completo** do início ao fim, sem markdown nem texto extra.
- Caso contrário: extrai blocos `type === "text"`, junta em string; faz parse JSON (aceita JSON puro ou JSON dentro de um fenced code block rotulado como json).

## Localização da busca (ferramenta web)

`user_location` é derivado de `mercado` (string): heurística para Brasil (`BR`, São Paulo TZ) ou EUA (`US`, New York TZ); default Brasil.

## Logs

Execuções Claude podem ser persistidas em `var/logs/` (hash SHA-256 do prompt, preview, turns, resultado, erro). Falha ao logar apenas gera `console.warn`.
