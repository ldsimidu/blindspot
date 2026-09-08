# Validação da resposta e tipos (lógica adicional)

Origem: `services/api/validator.ts`, `services/api/types.ts`.

## Tipos de entrada (TypeScript)

```ts
interface VehicleInput {
  marca: string;
  modelo: string;
  versao: string;
  ano_modelo: number;
  mercado: string;
}
```

## Forma esperada da resposta (alto nível)

```ts
interface FichaTecnicaResponse {
  veiculo_alvo: VehicleInput;
  metadados_coleta: Record<string, unknown>;
  fontes_utilizadas: FonteUtilizada[];
  ficha_tecnica: Record<string, unknown>;
  resumo_completude: Record<string, unknown>;
}

interface FonteUtilizada {
  id: string;
  url: string;
  titulo: string;
  tipo: string;
}
```

A estrutura detalhada de `ficha_tecnica` e demais campos está em `packages/agent-runtime/assets/schema.json`.

## Passo 1: normalização determinística de medidas

Na geração, antes do AJV, `services/api/normalizer.ts` lê a política canônica `packages/agent-runtime/assets/normalization-policy.json`. A versão atual só normaliza os campos allowlisted `motorizacao.cilindrada_l`, `motorizacao.potencia_cv`, `motorizacao.torque_nm` e `motorizacao.consumo_valor`.

- A conversão é local, determinística e não consulta rede.
- Conversões preservam o texto observado em `valor_original`; o campo `valor` recebe a unidade canônica.
- O normalizador não muda `status`, `fonte_ref`, identidade ou completude; ausência, conflito e não aplicabilidade permanecem sem valor.
- Unidade ausente, formato livre, valor não positivo onde a medida exige positividade e `mpg` sem o sufixo `us`/`uk` retornam `422` sanitizado, com código `normalization_invalid_measurement` e caminho do campo, sem expor payload do modelo.

`valor_original` é opcional somente nos estados de campo que contêm valor (`confirmado`, `parcial` e `inferido_minimamente`). Fichas persistidas antes desta versão continuam compatíveis porque o novo campo é aditivo.

## Passo 2: política de campos e cobertura

Na geração, `field-policy.json` é validada antes do AJV. `tipo_carroceria` e `motor_tipo` aceitam somente o vocabulário genérico aprovado quando confirmados. Quando `motor_tipo` está confirmado, extensões incompatíveis — por exemplo autonomia elétrica em combustão — precisam declarar `nao_aplicavel`; se a propulsão não estiver confirmada, o servidor não inventa aplicabilidade.

O servidor preenche no `resumo_completude` os indicadores aditivos `total_caminhos`, `caminhos_presentes`, `campos_status_total`, `campos_status_resolvidos`, `colecoes_total` e `colecoes_presentes`. A política v1 exige 204/204 caminhos, 199/199 campos com estado e 5/5 coleções de adicionais. Os indicadores são opcionais no schema para manter fichas históricas compatíveis.

## Passo 3: JSON Schema (AJV)

- Biblioteca: **Ajv 2020** (`ajv/dist/2020`) com **`ajv-formats`**.
- Opções: `allErrors: true`, `strict: false`.
- O schema compilado é o mesmo objeto canônico carregado de `packages/agent-runtime/assets/schema.json`.
- Se inválido: erro `422` com mensagem do tipo "Resposta do LLM invalida para o schema." e lista `ajvErrors` formatada (`instancePath` + mensagem).

## Passo 4: identidade e política de fontes

- A rota de geração compara `veiculo_alvo` com os cinco campos solicitados: marca, modelo, versão, ano-modelo e mercado. Não aplica aliases ou aproximações silenciosas.
- `packages/agent-runtime/assets/source-policy.json` é a política canônica e versionada para tipos e hosts de fonte.
- URLs devem usar HTTPS. Fontes oficiais exigem host oficial aprovado para marca/mercado; parceiras usam tipo não oficial e host da allowlist; a fonte `mock_local` só é aceita com provider `simulated`.
- Violação de identidade ou política retorna `422` sanitizado, sem consulta de URL, fallback de provider ou publicação da ficha.

## Passo 5: Consistência `fonte_ref` × `fontes_utilizadas`

Após passar no AJV:

1. A raiz deve ser um objeto.
2. `fontes_utilizadas` deve ser um **array** (senão falha).
3. Coleta-se o conjunto de `id` string de cada item em `fontes_utilizadas` (objetos com `id` string).
4. Percorre-se recursivamente todo o JSON; em qualquer chave `fonte_ref` que seja **array**, cada elemento string deve existir no conjunto de ids válidos.
5. Caso contrário: erro `422` com `missingFonteRefs` listando caminhos do tipo `$....fonte_ref[i]: <id>`.

## Erros HTTP relacionados

- `HttpError` — status configurável (ex.: 400 entrada).
- `ValidationError` estende `HttpError` com **status 422** para falhas pós-LLM.
