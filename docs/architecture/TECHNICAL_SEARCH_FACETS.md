# Busca técnica por facetas

## Escopo V1

A busca técnica é um caminho independente da busca textual do catálogo. Ela filtra apenas a versão mais recente de cada configuração por três facetas derivadas:

- `identificacao.tipo_carroceria`;
- `motorizacao.motor_tipo`;
- `motorizacao.potencia_cv` em `cv` canônico.

Os valores e o contrato de extração estão em `packages/agent-runtime/assets/technical-search-facet-policy.json`. O arquivo é um ativo de runtime, mas não é incluído no prompt nem altera o schema de geração da ficha.

## Evidência e persistência

Após a validação da ficha, a persistência extrai somente campos com `status: confirmado`, referência de fonte não vazia e valor compatível com a política. Cada faceta fica vinculada a `technical_sheet_versions`, registra os identificadores de fonte e a versão da política usada. Valores inferidos, conflitantes, não encontrados, não aplicáveis ou fora do formato canônico não produzem faceta pesquisável.

A projeção não muda o payload histórico da ficha. Uma nova geração cria uma versão nova e sua própria projeção; a consulta sempre correlaciona cada configuração com sua versão técnica mais recente. Fichas anteriores à migração não aparecem em busca técnica até receberem uma nova versão ou passarem por um backfill aprovado separadamente.

## Contrato HTTP

`GET /api/catalogo/fichas/pesquisa-tecnica` exige sessão autenticada e ao menos uma faceta técnica.

Parâmetros permitidos: `tipo_carroceria`, `motor_tipo`, `potencia_min_cv`, `potencia_max_cv`, `ano_modelo`, `mercado`, `page` e `page_size`. Valores enumerados são allowlisted pela política; números têm formato decimal estrito, intervalo coerente e limites de paginação. A resposta contém apenas candidatas de catálogo e os filtros efetivamente aplicados. Abrir o conteúdo continua exigindo a consulta exata existente da ficha.

Não há JSON-path dinâmico, nome de coluna dinâmico ou termo livre nesta rota; os predicados usam chaves de faceta fixas e valores parametrizados pelo repositório.
