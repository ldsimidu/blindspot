# Contrato de entrada (payload do veículo)

Este documento espelha a validação feita em `server/index.ts` (`parseVehicleInput`).

## Campos obrigatórios

| Campo       | Tipo   | Regras |
|------------|--------|--------|
| `marca`    | string | não vazio após trim |
| `modelo`   | string | não vazio após trim |
| `versao`   | string | não vazio após trim |
| `mercado`  | string | não vazio após trim |
| `ano_modelo` | number ou string | inteiro entre **1900** e **2100** |

## Formatos aceitos no body JSON

1. **Plano**: objeto raiz com os cinco campos (ver `../source/examples/vehicle-input.example.json`).
2. **Aninhado**: `{ "vehicle": { ...mesmos campos... } }` (ver `../source/examples/vehicle-input.nested.example.json`).

## O que o servidor injeta no prompt

Após validação, o backend monta o bloco `VEHICLE_PAYLOAD_JSON` com a forma de `../source/examples/vehicle-payload.embedded.example.json` (`context.vehicle`).

## Endpoint de referência (app atual)

`POST /api/ficha-tecnica` — body JSON conforme acima.
