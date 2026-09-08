# ✅ Concluída — aplicar política de variáveis genéricas e cobertura completa

> Prioridade: P0
>
> Área afetada: contrato de ficha, runtime de IA, validação, persistência e leitura futura
>
> Origem ou referência: decisão de Lucas para seguir `docs/product/decisoes-racionalizacao-variaveis.md` após P0-006
>
> Arquitetura: `APPROVED — Lucas autorizou em 08/09/2026`
>
> Triagem automática: `Material — schema, prompt, validação e dados produzidos por IA`
>
> Segurança: `Aplicável — IA, contrato público e proveniência de dados`

## Pedido

Aplicar as recomendações de racionalização sem quebrar a cobertura obrigatória da ficha: a estrutura do veículo deve ser respondida por campos genéricos, a arquitetura de propulsão deve orientar os detalhes condicionais, recursos de eletrificação/off-road/conectividade devem tornar-se extensões explícitas e toda ficha deve manter 204/204 caminhos presentes e 199/199 campos de status resolvidos.

## Critérios de aceite

- [x] `categoria` e `tipo_carroceria` usam vocabulário genérico versionado; `cabine_tipo` permanece condicional no catálogo.
- [x] `motor_tipo` é a arquitetura de propulsão genérica; combustível, eletrificação, motor elétrico e autonomia seguem regras condicionais explícitas.
- [x] Detalhes de eletrificação, off-road e conectividade recebem política de extensão/aplicabilidade, sem default falso e sem omissão.
- [x] O runtime recebe política canônica de campos sem duplicar a documentação editorial da P0-006.
- [x] A validação garante 204/204 caminhos e mede 199/199 estados terminais, sem promover ausência ou conflito a confirmação.
- [x] Schema, prompt, normalizador, persistência e documentação permanecem compatíveis; mudança incompatível não foi introduzida.
- [x] Verificações locais cobrem carroceria inválida, combustão, elétrico, detalhe elétrico indevido em combustão, caminho omitido e cobertura; fonte incompatível continua coberta por `verify:source-policy`.
- [x] Revisão de segurança, typecheck, build e smoke simulated foram registrados; provider real não foi chamado.

## Restrições ou contexto

- Ler primeiro `AGENTS.md`, perfil e estratégia do PDK, P0-006, catálogo de variáveis e dossiê de decisões.
- O schema e prompt canônicos ficam em `packages/agent-runtime/assets/`; documentos de produto não substituem runtime.
- Preservar identidade exata, `valor`, `valor_original`, `status`, `fonte_ref`, histórico, hash de schema e política de fontes.
- Não remover nem renomear caminho sem versão de contrato, migração de fichas persistidas, rollback e aprovação explícita.
- Não chamar provider real, banco externo, web search ou migrar dados nesta task sem autorização/ambiente específico.

## Arquitetura proposta

### Decisão e escopo

**Fatos confirmados:** o schema atual exige 204 caminhos: 199 campos com `status` e 5 coleções de `adicionais`. AJV já rejeita caminho omitido, mas `resumo_completude` só expõe contadores de status e não prova estruturalmente os 204 caminhos. `motor_tipo`, `categoria` e `tipo_carroceria` aceitam qualquer string; não há política em runtime para relacionar propulsão a campos condicionais. A persistência JSONB da P1-001 armazena hash de schema por versão, portanto adições opcionais ao contrato não exigem migration de tabela.

**Decisão proposta:** fazer uma evolução **aditiva e não quebradora** do contrato:

1. Criar `packages/agent-runtime/assets/field-policy.json`, versão canônica compacta, que contém vocabulário para carroceria e arquitetura de propulsão, regras de aplicabilidade para os detalhes de eletrificação, famílias de extensão e as contagens 204/199/5. Ele referencia os nomes exatos do schema e deriva do catálogo P0-006, sem replicar sua documentação editorial.
2. Injetar essa política no prompt como `FIELD_POLICY_JSON`; reforçar que `tipo_carroceria` responde a estrutura genérica e que `motor_tipo` responde à arquitetura de propulsão. Campos especializados continuam presentes e recebem status explícito.
3. No validador, aplicar a política depois da normalização de status e antes do AJV: validar vocabulário quando um campo pai estiver confirmado; exigir `nao_aplicavel` para extensões incompatíveis com pai confirmado; não inferir estado quando o pai estiver ausente, parcial ou conflitante.
4. Estender `resumo_completude` com contadores opcionais de cobertura: `total_caminhos`, `caminhos_presentes`, `campos_status_total`, `campos_status_resolvidos`, `colecoes_total` e `colecoes_presentes`. A API os preenche para novas respostas; fichas antigas seguem válidas porque os campos novos são opcionais no schema.
5. Manter todos os 204 caminhos, o modelo de persistência e os nomes públicos. Não haverá fusão, remoção, objeto aninhado novo, backfill ou migration de banco nesta versão.

### Decisões de domínio aplicadas

| Tema | Decisão v1 | Efeito |
|---|---|---|
| Estrutura | `tipo_carroceria` recebe vocabulário genérico controlado: sedan, hatch, SUV, crossover, cupê, picape, van, utilitário e outros valores documentados. `categoria` continua complementar; `cabine_tipo` é condicional. | A pergunta de estrutura usa o mesmo campo para sedan e caminhonete/picape. |
| Propulsão | `motor_tipo` vira campo pai, com combustao, eletrico, hibrido, hibrido_plugin e celula_combustivel. | A ficha resolve primeiro a arquitetura, não um detalhe elétrico isolado. |
| Detalhes elétricos | `motor_eletrico_presente`, `motor_eletrificacao_tipo`, `autonomia_eletrica_km`, `app_conectividade_ev` e garantias de bateria são extensões condicionais. | Em combustão confirmada, precisam terminar em `nao_aplicavel`; em EV/PHEV, são pesquisados e resolvidos sem default. |
| Off-road | Diferenciais, proteções, ganchos, recursos/modos off-road e piloto off-road são extensões. | Continuam nos 204 caminhos; ausência não vira `false` nem omissão. |
| Conectividade | Serviços de app, OTA, hotspot, som premium e assistente digital são condicionais por mercado/sistema/plano. | Não são tratados como capacidade permanente ou default da linha. |

### Fluxo de pessoa usuária e agente

1. A pessoa solicita marca, modelo, versão, ano-modelo e mercado exatos.
2. O runtime compõe prompt com schema, política de fontes, normalização e política de campos.
3. O agente pesquisa as fontes permitidas; primeiro resolve carroceria e `motor_tipo` com evidência da configuração.
4. Para cada detalhe condicional, aplica a regra: pesquisa quando aplicável; retorna valor/fonte, conflito ou não encontrado; usa `nao_aplicavel` apenas quando o pai confirmado torna o detalhe incompatível.
5. O servidor normaliza somente medidas allowlisted, normaliza formatos de status, valida política de campo, calcula cobertura 204/199/5, aplica AJV e checa `fonte_ref`, identidade e fontes permitidas.
6. Uma resposta com caminho omitido, campo incompatível marcado como confirmado, valor genérico fora do vocabulário ou cobertura inferior a 100% falha com 422 sanitizado; não é persistida nem exibida.
7. Resposta aprovada é persistida como nova versão com hash do schema; leitura de histórico mantém payload antigo compatível, sem backfill silencioso.

### Impacto técnico e dados

- `runtime-assets.ts`: tipo e leitor de `FieldPolicy`.
- `prompt-builder.ts` e `index.ts`: carregar e injetar `FIELD_POLICY_JSON`; passar a política ao validador.
- `validator.ts`: aplicar regras de pai/filho, vocabulário e cobertura; manter fonte, status e identidade sem mutação indevida.
- Novo módulo puro `field-policy-validator.ts`: não faz rede, não consulta provider e retorna `ValidationError` com código/campo sanitizados.
- `schema.json`: propriedades opcionais e inteiras no resumo de completude; nenhuma alteração em nomes, `required` existentes ou valores já armazenados.
- `base-agent-prompt.txt`: regras de cobertura e aplicabilidade; `mock-response.json` permanece uma fixture de ausência e novos fixtures seguros cobrem as configurações representativas.
- `normalizer.ts`, fonte e persistência: preservados; a política ocorre após normalização e antes de AJV. O hash de schema já diferencia novas fichas; não há migration SQL.

### Segurança e risco proporcional

#### Escopo e gatilhos

- Gatilhos: contrato/schema, prompt, dados produzidos por IA, validação pública e persistência de payload validado.
- Sem novo provider, dependência, segredo, endpoint, rede, banco remoto ou ferramenta externa.

#### Fronteiras, abusos e controles

- Fronteira: LLM/fontes externas → política de campo → resposta de ficha → JSONB/histórico.
- Abuso/falha: o modelo usa `false` ou valor de outro veículo em detalhe condicional; ou o servidor transforma ausência em não aplicabilidade/confirmado e a informação é exportada/comparada como fato.
- Controles: allowlist de vocabulário; regra declarativa pai/filho; falha fechada para inconsistência comprovada; sem inferir quando pai não está confirmado; 204/199/5 calculados pelo servidor; fontes e identidade preservadas; erro sem payload, URL ou segredo.
- Risco residual: algumas regras de aplicabilidade dependem de pacote/mercado não presente no input. Nesses casos o servidor não força `nao_aplicavel`; exige um status explícito e mantém a lacuna visível. Lucas é o responsável por aceitar esse trade-off.

#### Verificações planejadas

- Fixtures: sedan, picape, combustão, EV/PHEV, campo opcional, conflito, fonte incompatível e caminho faltante.
- Script que valida correspondência entre política e schema, sem caminhos extras/faltantes.
- `npm run typecheck`, verificadores de política, build e smoke `simulated`; sem provider real.

### Compatibilidade, rollout e reversão

- A mudança é compatível: campos de resumo novos são opcionais; os 204 caminhos e seis status permanecem.
- Fichas antigas continuam validadas porque o schema aceita ausência dos novos contadores; fichas novas armazenam hash de schema diferente.
- Não executar backfill nem converter respostas antigas. Se o resumo novo for ausente em histórico, a leitura deve tratar como metadado legado, não como falha da ficha.
- Reverter removendo a política do prompt/validador e os campos opcionais de resumo; não há migration SQL ou mudança de endpoint para desfazer.

### Plano incremental

1. Criar política canônica e verificador de alinhamento com catálogo/schema.
2. Integrar política à composição de prompt e validador puro.
3. Adicionar contadores aditivos ao schema e cálculo de cobertura no servidor.
4. Criar fixtures e scripts de regressão para as regras de domínio e cobertura.
5. Atualizar documentação técnica/produto apenas com comportamento comprovado.
6. Rodar validações locais e smoke simulated; registrar a revisão de segurança e resultado na task.

### Double-check da arquitetura

- Confirmado: os caminhos especializados já existem; preservar todos é a forma compatível de aplicar as recomendações sem quebrar histórico/comparação futura.
- Confirmado: o schema sozinho garante presença, mas o resumo atual não separa 204 caminhos, 199 campos de status e 5 coleções; a extensão opcional resolve a observabilidade sem migrar payload antigo.
- Confirmado: `motor_tipo` e `tipo_carroceria` hoje são strings livres; a policy e o validator são necessários para impedir respostas genéricas inconsistentes.
- Estados revisados: pai confirmado/incompatível, pai confirmado/aplicável mas ausente, pai ausente, EV/PHEV, combustão, pacote opcional, campo omitido e fonte não permitida.
- Conclusão: arquitetura `READY`; não há bloqueio técnico, mas implementação exige `APPROVED` explícito de Lucas.

## Resultado do agente

_Preenchido pelo agente. Não apague o pedido original._

### Revisão de segurança — P0-007

Data: `2026-09-08`

- Escopo e gatilhos: schema, prompt, validador de API, dados retornados por IA e payload persistido; nenhum provider, segredo, dependência, banco remoto ou endpoint novo.
- Fronteira e risco: LLM/fontes → política de campos → ficha/histórico. O risco principal era campo especializado virar `false`, confirmação ou omissão indevida e contaminar comparação/exportação futura.
- Controles: vocabulário allowlisted, regras pai/filho declarativas, `nao_aplicavel` obrigatório somente quando pai confirmado prova incompatibilidade, cobertura calculada pelo servidor, preservação de fonte/status e erros 422 sanitizados.
- Checks: scripts locais para política de campos, normalização, fontes e catálogo; typecheck; build; smoke exclusivamente com `LLM_PROVIDER=simulated` e `PERSISTENCE_MODE=file`.
- Risco residual: pacote/mercado não inteiramente identificado não força `nao_aplicavel`; mantém estado explícito em vez de inferir. Lucas aceita esse trade-off ao aprovar a P0-007.

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — Lucas autorizou em 08/09/2026`.
- Triagem automática: `Material — schema, prompt, validação e semântica de dados produzidos pela IA`.
- Segurança: `Aplicável — revisão proporcional executada acima`.
- Implementação: `field-policy.json` entrou como asset canônico; prompt recebe a política; validador aplica vocabulário/aplicabilidade e preenche cobertura 204/199/5; schema aceita os indicadores aditivos; documentação técnica e de produto foi alinhada.
- Arquivos alterados: esta task; `field-policy.json`; `field-policy-validator.ts`; `runtime-assets.ts`; `prompt-builder.ts`; `index.ts`; `validator.ts`; `schema.json`; `base-agent-prompt.txt`; `verify-field-policy.ts`; `package.json`; documentação `agent-core` e documentação de produto P0-006.
- Verificação: `npm run typecheck`, `npm run verify:field-policy`, `npm run verify:normalization`, `npm run verify:source-policy` e `npm run verify:technical-sheet-catalog` passaram. `npm run build` passou fora do sandbox. Smoke isolated passed: health e POST simulated retornaram `204/204`, `199/199`, `5/5`, com fonte `mock_local`; processo temporário encerrado.
- Bloqueios: nenhum. A porta 3002 continha processo temporário antigo; ele foi identificado e encerrado antes do smoke isolado na porta 3003.
- Próximo passo: seguir para P1-004, que pode acrescentar plausibilidade e revisão humana sobre a política, ou criar task específica quando houver decisão de fundir/remover caminhos do contrato.
