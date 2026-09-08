# ✅ Concluída — E02-02 Normalizar dados com proveniência

> Prioridade: P1
>
> Área afetada: agente, normalização, schema e validação
>
> Origem ou referência: `docs/product/backlog.md` E02-02; fluxo de consulta detalhado
>
> Arquitetura: `APPROVED — Lucas autorizou em 08/09/2026`
>
> Triagem automática: `Material — altera semântica de dados produzidos pelo agente.`
>
> Segurança: `Aplicável — revisão proporcional registrada abaixo.`

## Pedido

Implementar normalização determinística de valores e unidades sem perder valor original, status, contexto ou `fonte_ref`.

## Critérios de aceite

- [x] Conversões aprovadas são determinísticas e testáveis.
- [x] Ausência, conflito e não aplicabilidade não viram confirmação.
- [x] AJV e referências de fonte continuam obrigatórios antes da resposta.

## Restrições ou contexto

- Depende da política de fontes/identidade da P1-002.
- Provider real só pode ser usado em ambiente autorizado.

## Arquitetura proposta

### Decisão e escopo

**Fatos confirmados:** os campos técnicos usam `valor` no schema, sem unidade separada; o prompt pede medidas como strings com unidade; o validator já normaliza forma de status antes do AJV, mas não normaliza medidas. A P1-002 já garante identidade e procedência declarada, porém não prova equivalência entre valores em unidades diferentes.

**Decisão proposta:** criar `packages/agent-runtime/assets/normalization-policy.json`, versionado e canônico, e normalizar somente campos/unidades explicitamente definidos nele. Quando houver conversão, manter o texto observado em `valor_original` e gravar em `valor` a representação canônica. O schema passa a permitir `valor_original` apenas nos estados que possuem valor (`confirmado`, `parcial`, `inferido_minimamente`).

O normalizador será local, determinístico, sem rede e executará antes da validação AJV. Não irá inventar unidade, inferir sistema de medida, preencher lacuna, mudar `status`, alterar `fonte_ref` ou resolver conflito.

### Política v1 proposta

| Campo | Unidade canônica | Entradas convertíveis | Regra |
|---|---|---|---|
| `cilindrada_l` | `L` | `L`, `cm³`/`cc` | `cc ÷ 1000`; até 3 casas decimais sem arredondamento inventado. |
| `potencia_cv` | `cv` | `cv`, `kW`, `hp` | `kW × 1,35962`; `hp × 1,01387`; resultado com até 1 casa decimal. |
| `torque_nm` | `Nm` | `Nm`, `kgfm` | `kgfm × 9,80665`; resultado com até 1 casa decimal. |
| `consumo_valor` | `km/l` | `km/l`, `L/100 km`, `mpg_us`, `mpg_uk` | `L/100 km → 100 ÷ valor`; MPG só converte quando o sistema for explicitamente declarado. `mpg` sem origem é ambíguo e não converte. |

Valores já canônicos continuam sem `valor_original`; valores convertidos retêm a forma observada. Valor sem unidade, unidade ambígua, zero/negativo em consumo ou formato com múltiplas medidas não sofre conversão e retorna erro de validação controlado quando o campo exige uma unidade canônica.

### Fluxo de usuário e do agente

1. A pessoa solicita a configuração exata; P1-002 governa identidade e fontes.
2. O agente retorna valor, status e `fonte_ref` usando a política de normalização recebida no prompt.
3. O servidor lê a política, percorre apenas campos configurados e interpreta uma medida inequívoca.
4. Se a unidade é reconhecida, registra `valor_original` e substitui `valor` pela unidade canônica; status e fonte permanecem intactos.
5. AJV, `fonte_ref`, identidade e política de fontes validam a resposta normalizada.
6. Se a medida não é segura para converter, a resposta falha com 422; não é estimada, arredondada silenciosamente ou confirmada artificialmente.

### Impacto técnico, dados e confiabilidade

- Novo asset de política com versão, campos, unidades de entrada e fórmula declarada.
- `runtime-assets.ts` lê a política; `prompt-builder.ts` a inclui como `NORMALIZATION_POLICY_JSON`.
- `validator.ts` passa a executar normalização determinística antes do AJV e a preservar `valor_original` somente quando conversão ocorrer.
- `schema.json` aceita esse campo opcional nos três formatos com valor. O hash de schema já gravado pela P1-001 diferencia automaticamente versões de ficha; não há migration de tabela nesta task.
- Fixtures cobrem conversão válida, unidade ambígua, número inválido, status sem valor, conflito e preservação de `fonte_ref`.

### Segurança e risco proporcional

**Gatilhos:** IA que produz dados, alteração de schema/contrato e persistência de valores normalizados. Não há segredo, provider novo, dependência nova ou tráfego externo.

- Ameaças: conversão errada parecer dado confirmado; perda de valor observado; uso de `mpg` ambíguo; overflow/NaN; alteração de fonte/status durante a normalização; erro expondo payload do modelo.
- Controles: allowlist por campo/unidade; parser estrito de uma única medida finita; limites positivos quando a métrica exigir; fórmulas declaradas/versionadas; `valor_original`; invariante de status e `fonte_ref`; erro sanitizado por código/campo, sem payload nem URL.
- Verificações: testes locais das fórmulas e bordas; AJV/ref de fonte; simulated sem rede; typecheck/build; revisão de que valor não convertido não vira confirmado. Provider real continua bloqueado sem ambiente/autorização.
- Risco residual: valores formatados em texto livre ou unitariamente ambíguos serão rejeitados, reduzindo cobertura em favor de confiabilidade. Lucas aceita ou ajusta esse trade-off ao aprovar a task.

### Plano incremental e reversível

1. Confirmar unidades canônicas, precisão e tratamento de MPG ambíguo.
2. Criar política, adaptar schema e compor a regra no prompt.
3. Implementar normalizador puro e fixtures de regressão; integrar antes do AJV.
4. Rodar checks locais no modo simulated; não chamar provider/URL externa.
5. Atualizar backlog, fluxograma e contrato técnico conforme comportamento comprovado.
6. Reverter removendo a política, campo opcional e etapa de normalização; fichas existentes preservam seu hash de schema e payload original.

## Decisões pendentes antes da implementação

- Aprovar a política v1, especialmente equivalência `hp → cv`, precisão proposta e uso de `valor_original` como campo opcional do schema.
- Confirmar que `mpg` sem sufixo é ambíguo e deve ser rejeitado, exigindo `mpg_us` ou `mpg_uk`.
- Confirmar que a v1 não normaliza outros campos além dos quatro listados; expansões entram em política/task posterior.

## Double-check da arquitetura

- Confirmado: P1-002 está concluída e valida identidade/fonte antes de persistência; P1-003 pode se encaixar depois dela sem provider real.
- Confirmado: schema exige status/fonte conforme o tipo de campo, mas não possui `unidade` ou campo de valor observado.
- Confirmado: a normalização atual de status não converte unidades; ela já é anterior ao AJV, ponto adequado para a nova etapa.
- Confirmado: `consumo_valor` não distingue sistema de MPG; conversão de `mpg` simples seria uma inferência insegura.
- Estados revistos: número/unidade válida, unidade já canônica, unidade ambígua, valor negativo/zero, campo sem valor, conflito e fonte ausente.
- Conclusão: arquitetura `READY`, aguardando aprovação explícita das três decisões; a task permanece pendente.

## Resultado do agente

### Revisão de segurança — P1-003

Data: `2026-09-08`

- Escopo e gatilhos: alteração de schema, prompt e tratamento local de saída de IA; sem novo provider, dependência, segredo, rede ou endpoint.
- Fronteira e risco: conteúdo do LLM cruza para contrato de ficha; uma unidade ambígua ou conversão errada poderia parecer um dado confirmado ou apagar a proveniência observada.
- Controles: allowlist canônica por caminho/unidade, parser de medida única e finita, positividade onde aplicável, rejeição de `mpg` sem sistema, `valor_original` aditivo, e invariantes de `status` e `fonte_ref`.
- Verificações: `npm run verify:normalization`, `npm run verify:source-policy`, `npm run typecheck`, `npm run build` e smoke HTTP exclusivamente com `LLM_PROVIDER=simulated` e `PERSISTENCE_MODE=file`.
- Risco residual aceito por Lucas: formatos livres e unidades ambíguas são rejeitados com 422, diminuindo cobertura para impedir inferência silenciosa. Provider real não foi chamado.

- Estado: `✅ Concluída`; Arquitetura: `APPROVED — Lucas autorizou em 08/09/2026`; Segurança: `Aplicável — revisão proporcional executada acima`.
- Implementação: criada a política canônica `normalization-policy.json`; o normalizador local roda antes do AJV somente na geração; valores convertidos guardam `valor_original`; schema, prompt e documentação passaram a declarar o contrato.
- Arquivos alterados: `packages/agent-runtime/assets/normalization-policy.json`, `packages/agent-runtime/assets/schema.json`, `packages/agent-runtime/assets/base-agent-prompt.txt`, `services/api/normalizer.ts`, `services/api/runtime-assets.ts`, `services/api/prompt-builder.ts`, `services/api/validator.ts`, `services/api/index.ts`, `scripts/verify-normalization.ts`, `package.json` e documentação `agent-core`.
- Verificação: `RUNTIME_ASSETS_JSON=PASS`; `npm run typecheck` passou; `npm run verify:normalization` passou; `npm run verify:source-policy` passou; `npm run build` passou fora do sandbox após bloqueio de leitura interno do Vite; smoke `GET /api/health` e `POST /api/ficha-tecnica` passou em porta isolada com provider simulated, fonte `mock_local` e 199 variáveis. O processo temporário foi encerrado.
- Bloqueios: nenhum. A primeira tentativa de build no sandbox foi bloqueada pelo acesso a `vite.config.ts`, e o build autorizado fora dele passou.
- Próximo passo: ativar a P0-006 para revisar defaults das fichas; a expansão de unidades/campos deve entrar em nova política/task, não nesta P1.
