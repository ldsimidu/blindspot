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
  avaliacao_politica?: {
    status: "na_lista_aprovada" | "fora_da_lista_aprovada" | "nao_rastreavel_com_seguranca" | "sem_politica_para_mercado" | "fonte_simulada_local";
    versao: string;
    motivos?: string[];
  };
}
```

A estrutura detalhada de `ficha_tecnica` e demais campos está em `packages/agent-runtime/assets/schema.json`.

## Passo 1: normalização determinística de medidas

Na geração, antes do AJV, `services/api/normalizer.ts` lê a política canônica `packages/agent-runtime/assets/normalization-policy.json`. A versão atual só normaliza os campos allowlisted `motorizacao.cilindrada_l`, `motorizacao.potencia_cv`, `motorizacao.torque_nm` e `motorizacao.consumo_valor`.

- A conversão é local, determinística e não consulta rede.
- Conversões preservam o texto observado em `valor_original`; o campo `valor` recebe a unidade canônica.
- Em modo estrito, o normalizador não muda `status`, `fonte_ref`, identidade ou completude; ausência, conflito e não aplicabilidade permanecem sem valor.
- Em importações e demais validações estritas, unidade ausente, formato livre, valor não positivo onde a medida exige positividade e `mpg` sem o sufixo `us`/`uk` retornam `422` sanitizado, com código `normalization_invalid_measurement` e caminho do campo, sem expor payload do modelo.
- Na rota de geração por LLM, a mesma falha é isolada: o campo allowlisted vira `nao_encontrado` com `obs_ref: "NF1"`, sem `fonte_ref` nem valor original, e uma observação sanitizada é adicionada aos metadados. A ficha continua para as validações seguintes e a completude é recalculada.

`valor_original` é opcional somente nos estados de campo que contêm valor (`confirmado`, `parcial` e `inferido_minimamente`). Fichas persistidas antes desta versão continuam compatíveis porque o novo campo é aditivo.

## Passo 2: política de campos e cobertura

Na geração, `field-policy.json` é validada antes do AJV. `tipo_carroceria` e `motor_tipo` aceitam somente o vocabulário genérico aprovado quando confirmados. Quando `motor_tipo` está confirmado, extensões incompatíveis — por exemplo autonomia elétrica em combustão — precisam declarar `nao_aplicavel`; se a propulsão não estiver confirmada, o servidor não inventa aplicabilidade.

Antes da conferência 204/199/5, o servidor completa somente propriedades obrigatórias ausentes dentro de uma `ficha_tecnica` já existente: campos de status viram `nao_encontrado` com `valor: null` e `obs_ref: "NF1"`; coleções de adicionais viram `[]`. Não cria valor técnico, fonte ou inferência e não substitui uma propriedade presente porém malformada, que continua inválida. O resumo expõe a contagem agregada `campos_estruturais_completados` para separar omissão estrutural do modelo de cobertura por evidência.

O servidor também preenche no `resumo_completude` os indicadores aditivos `total_caminhos`, `caminhos_presentes`, `campos_status_total`, `campos_status_resolvidos`, `colecoes_total` e `colecoes_presentes`. A política v1 exige 204/204 caminhos, 199/199 campos com estado e 5/5 coleções de adicionais. Os indicadores são opcionais no schema para manter fichas históricas compatíveis.

## Passo 3: política local de qualidade para conflitos

Antes do AJV, `quality-policy.json` valida cada campo com status `conflitante`. Ele deve ter `valor: null`, no mínimo duas referências de fonte distintas e `obs_ref: "CF1"` ou uma observação não vazia. Essa camada preserva a divergência para revisão: não há escolha automática de valor ou fonte vencedora.

A fila de decisão humana append-only não é criada neste corte: ela depende de autenticação (P1-011) e RBAC (P1-013), para obter o ator da sessão em vez de aceitá-lo do cliente.

## Passo 4: JSON Schema (AJV)

- Biblioteca: **Ajv 2020** (`ajv/dist/2020`) com **`ajv-formats`**.
- Opções: `allErrors: true`, `strict: false`.
- O schema compilado é o mesmo objeto canônico carregado de `packages/agent-runtime/assets/schema.json`.
- Se inválido: erro `422` com mensagem do tipo "Resposta do LLM invalida para o schema.", lista compatível `ajvErrors` e `schemaIssues` estruturado. Cada issue contém somente `path` e `keyword`, limitado a vinte itens; valores do payload nunca entram nesse diagnóstico. A interface mostra no máximo cinco caminhos.

## Passo 5: identidade e classificação de fontes

- A rota de geração compara `veiculo_alvo` com os cinco campos solicitados: marca, modelo, versão, ano-modelo e mercado. Não aplica aliases ou aproximações silenciosas.
- `packages/agent-runtime/assets/source-policy.json` é a política canônica e versionada para classificar tipos e hosts de fonte. A classificação é calculada no servidor; qualquer avaliação enviada pelo LLM é descartada.
- Cada fonte recebe `avaliacao_politica` com a versão da política e um dos estados: `na_lista_aprovada`, `fora_da_lista_aprovada`, `nao_rastreavel_com_seguranca`, `sem_politica_para_mercado` ou `fonte_simulada_local`.
- Host ou tipo fora da lista não bloqueia a ficha: torna-se `fora_da_lista_aprovada`, com motivo sanitizado. A lista é uma sinalização ao analista, não uma afirmação de que a fonte fora dela seja falsa.
- URL que não seja HTTPS é preservada como evidência declarada, mas recebe `nao_rastreavel_com_seguranca`; a interface não a transforma em link clicável. Não há consulta de URL, fallback de provider ou promoção automática de fonte.
- Violação de identidade, schema ou consistência de `fonte_ref` continua retornando `422` sanitizado.

## Passo 6: Consistência `fonte_ref` × `fontes_utilizadas`

Após passar no AJV:

1. A raiz deve ser um objeto.
2. `fontes_utilizadas` deve ser um **array** (senão falha).
3. Coleta-se o conjunto de `id` string de cada item em `fontes_utilizadas` (objetos com `id` string).
4. Percorre-se recursivamente todo o JSON; em qualquer chave `fonte_ref` que seja **array**, cada elemento string deve existir no conjunto de ids válidos.
5. Caso contrário: erro `422` com `missingFonteRefs` listando caminhos do tipo `$....fonte_ref[i]: <id>`.

## Proveniência e aderência da evidência

`fontes_utilizadas[]` possui dimensões independentes: `avaliacao_politica` indica a posição no catálogo local; `avaliacao_aderencia` compara a evidência com marca/modelo, versão/motorização, ano-modelo e mercado; `evidencia_busca` preserva metadados mínimos do que foi observado durante a geração.

Os estados de aderência são `exata`, `compativel`, `ambigua`, `divergente` e `nao_verificada`. Uma fonte externa pode ser exata; uma fonte oficial pode ser divergente. Campos `confirmado` sustentados apenas por divergência viram `parcial`. Nos grupos críticos definidos por `source-evidence-policy.json`, fonte ambígua ou não verificada também não sustenta confirmação.

O resumo básico é recalculado antes do roteamento e novamente pelo validador final. Registros históricos continuam compatíveis porque os blocos novos são opcionais no schema.

## Erros HTTP relacionados

- `HttpError` — status configurável (ex.: 400 entrada).
- `ValidationError` estende `HttpError` com **status 422** para falhas pós-LLM.
# Proveniência de identidade e cobertura pesquisável

Os cinco identificadores que delimitam a pesquisa são server-owned na geração: `marca`, `modelo`, `versao`, `ano_modelo` e `mercado`. Após a resposta do provider, o validador substitui esses campos por `{ valor, status: "informado_na_entrada", origem: "entrada_usuario" }`.

Esse status é permitido somente nesses cinco caminhos. Qualquer tentativa de usá-lo em especificação técnica é rejeitada. O resumo acrescenta `informadas_na_entrada` e `total_pesquisaveis`; portanto a cobertura de pesquisa não é inflada por dados já fornecidos no pedido.
