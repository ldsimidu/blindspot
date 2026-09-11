# Decisões do BlindSpot

## DEC-BS-001 — Fonte canônica do runtime

Estado: `approved`
Data: `2026-09-06`

`packages/agent-runtime/assets/` é a única fonte de prompt, schema e mock. Documentos antigos não são runtime.

## DEC-BS-002 — Retenção de evidência

Estado: `approved`
Data: `2026-09-06`

Somente baseline documental sanitizado e fixtures simuladas entram no destino. Logs e snapshots brutos permanecem na origem.

## DEC-BS-003 — Estrutura oficial

Estado: `approved`
Data: `2026-09-06`

O projeto usa `apps/`, `services/`, `packages/`, `tests/`, `docs/` e `evidence/`.
