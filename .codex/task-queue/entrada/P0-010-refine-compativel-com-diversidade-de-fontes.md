# ✅ Concluída — Preservar diversidade de fontes no refine compatível

> Prioridade: P0
>
> Área afetada: runtime de IA, prompt de refine, roteamento multipasse, evidência e documentação
>
> Origem ou referência: auditoria da Ford Ranger Raptor 2025 Brasil em 11/09/2026; modo `ex_prompt_compat` observou 8 fontes, mas publicou somente 1
>
> Arquitetura: `APPROVED — Lucas autorizou seguir a ordem das tasks em 11/09/2026`
>
> Triagem automática: `Material — altera prompt e comportamento de IA com ferramenta web`
>
> Segurança: `Aplicável — revisão proporcional registrada abaixo`

## Pedido

Corrigir o refine exclusivo do modo `ex_prompt_compat` para que ele não reintroduza a orientação restritiva de fontes pré-aprovadas. O modo deve manter pesquisa web aberta, priorizar materiais oficiais quando encontrados e permitir fontes externas observadas e rastreáveis para cobrir lacunas.

O objetivo não é impor uma quantidade artificial de fontes. É fazer com que fontes distintas, efetivamente usadas para sustentar grupos diferentes de variáveis, sejam preservadas na ficha final. A cobertura continua sendo o critério principal; diversidade é qualidade complementar.

## Critérios de aceite

- [ ] O refine em `ex_prompt_compat` não instrui que somente parceiros pré-aprovados possam complementar a resposta final.
- [ ] O prompt preserva a prioridade por página, ficha, catálogo, manual e configurador oficiais, sem exigir que existam para a ficha ser entregue.
- [ ] Fontes externas observadas, HTTPS e não explicitamente divergentes podem permanecer quando sustentarem lacunas reais.
- [ ] O refine pede a devolução de todas as fontes efetivamente usadas, sem incentivar preenchimento artificial da lista.
- [ ] O resultado de maior cobertura não perde por exigir diversidade; em empate, a decisão pode considerar qualidade de proveniência apenas se houver métrica verificável.
- [ ] Não há novo fetch server-side, allowlist obrigatória, marca codificada, mudança de schema ou aumento de orçamento.
- [ ] Fixtures cobrem quick/refine com pesquisa ampla e fontes observadas; typecheck, build e verificadores de evidência/sanitização passam.

## Restrições ou contexto

- Ler primeiro `AGENTS.md`, perfil do PDK, `services/api/llm.ts`, assets canônicos e `docs/architecture/agent-core/EX_PROMPT_COMPATIBILITY_MODE.md`.
- A ficha Ranger motivadora teve 111/199 variáveis preenchidas, 8 fontes observadas no refine e 1 fonte final. Não concluir que uma fonte é insuficiente quando ela for a única evidência realmente aplicável.
- Preservar URLs somente observadas pelo provider, validação de schema, isolamento de fonte explicitamente divergente e limites atuais de tool calls/resultados.
- Fora do escopo: trocar modelo/provider, alterar `.env` real, leitura/fetch de PDF, descoberta oficial bloqueante, persistência, endpoint público ou interface.

## Dependências

- Esta é a primeira etapa do ciclo de diversidade. As tasks P1-027 e P1-028 não devem ser executadas antes de sua auditoria pós-implementação.

## Preflight, arquitetura e revisão de segurança — 2026-09-11

### Fatos confirmados

- `services/api/llm.ts` usa `appendExPromptCompatibilityOverlay` no quick quando o modo é `ex_prompt_compat`; esse overlay permite fontes externas observadas e rastreáveis para lacunas.
- O mesmo runtime chama `buildOpenRouterRefinePrompt` sem informar o modo. O texto desse builder impõe que somente parceiros pré-aprovados complementem a evidência final.
- A Ranger Raptor 2025 Brasil observou 3 fontes no quick e 8 no refine, mas publicou uma única fonte final; a telemetria não registrou remoção por autoridade ou aderência.
- O schema não limita o número de fontes. O router compatível seleciona a resposta inteira por cobertura bruta; não haverá merge nem alteração de score neste corte.

### Decisão e fluxo

Adicionar ao builder de refine um parâmetro fechado de modo de pesquisa. Em `ex_prompt_compat`, o texto deve:

1. pesquisar o veículo exato e priorizar página, ficha, catálogo, manual e configurador de primeira parte quando observados;
2. permitir fontes externas observadas, HTTPS, rastreáveis e não explicitamente divergentes para lacunas;
3. pedir que a resposta final liste todas as fontes efetivamente usadas para sustentar campos, sem exigir contagem mínima ou listar fonte decorativa;
4. preservar os campos pendentes e o retorno de JSON completo.

Em `strict_evidence`, o texto atual e suas restrições permanecem inalterados. Não haverá mudança de ferramenta, domínio, orçamento, endpoint, schema, persistência, modelo, provider ou `.env`.

### Segurança proporcional

- Gatilho: IA com ferramenta web e conteúdo externo não confiável.
- Fronteira: apenas instrução server-owned adicionada ao prompt; nenhuma URL, conteúdo ou resposta externa é inserida no novo texto.
- Risco: ampliar a aceitação de fonte externa no modo compatível pode elevar diversidade com evidência fraca.
- Controles: manter URL HTTPS observada, avaliação server-owned, bloqueio de divergência explícita, schema/`fonte_ref`, budgets existentes e telemetria sanitizada. O prompt proíbe fonte decorativa e oficialidade declarada pelo modelo.
- Risco residual: fontes externas aderentes continuam possíveis no modo amplo, como decisão de produto revisável. Responsável: Lucas.

### Verificação e reversibilidade

- Adicionar asserções em `verify-research-capabilities` e `verify-source-evidence` para os dois textos de refine.
- Executar verificadores de pesquisa/evidência, typecheck, build e diff check; smoke apenas no modo simulated. Não chamar provider real.
- Reversão: remover a ramificação de prompt; não há migração, dado persistido ou alteração de ambiente a desfazer.

### Double-check da arquitetura

- O escopo corrige a contradição de prompt sem introduzir caça de documento, fetch, allowlist, score de diversidade ou consumo adicional.
- O caminho estrito permanece com seu texto atual; o modo compatível continua aberto, mas apenas para fontes observadas e não explicitamente divergentes.
- A P1-027 continua responsável por medir concentração antes de qualquer mudança de score, e P1-028 continua dependente dessas métricas.

## Resultado do agente

_Preenchido pelo agente. Não apague o pedido original._

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — autorização explícita de 11/09/2026, registrada acima.`
- Triagem automática: `Material` — IA com ferramenta web e prompt; escopo limitado ao refine OpenRouter.
- Segurança: `Aplicável` — revisão proporcional registrada acima; sem nova integração, credencial ou chamada externa.
- Implementação: `buildOpenRouterRefinePrompt` agora recebe o modo de pesquisa. Em `ex_prompt_compat`, remove a restrição de parceiros pré-aprovados, preserva a prioridade por fontes de primeira parte quando observadas, permite fontes externas observadas/HTTPS/rastreáveis para lacunas não divergentes e exige listar apenas fontes realmente usadas. `strict_evidence` mantém a instrução anterior.
- Arquivos alterados: `services/api/llm.ts`, `scripts/verify-research-capabilities.ts`, `docs/architecture/agent-core/EX_PROMPT_COMPATIBILITY_MODE.md` e esta task.
- Verificação: `npm run verify:research-capabilities`, `npm run verify:source-evidence`, `npm run verify:telemetry-sanitization`, `npm run typecheck`, `npm run build` e `git diff --check` passaram.
- Verificação bloqueada: geração real não executada, pois requer chamada externa adicional autorizada pelo operador.
- Limitações: a mudança não garante um número mínimo de fontes e não altera o score/merge entre quick e refine; ela remove a contradição que induzia a síntese restrita. A P1-027 deve medir o resultado antes de qualquer critério de diversidade no roteador.
- Validação real posterior: o operador gerou Ford Ranger Raptor 2025 Brasil. A telemetria mostrou 3 fontes observadas no quick, 9 no refine, duas fontes finais (uma `exata` e uma `ambigua`), 114 campos confirmados com `fonte_ref` válido e nenhum isolamento por política. O recorte de pesquisa exibiu 107 variáveis porque exclui os sete campos de identificação do total estrutural de 114.
- Próximo passo: P1-027 está liberada para ativação por ordem da fila; ela mede concentração e vínculo por grupo antes de qualquer alteração de score ou nova descoberta oficial.
