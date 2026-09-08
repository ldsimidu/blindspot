# ✅ Concluída — Alinhar assets canônicos e contratos de runtime

> Prioridade: P0
>
> Área afetada: runtime do agente, mock, documentação técnica e testes
>
> Origem ou referência: `docs/product/fluxograma-desenvolvimento-agente.md`, `packages/agent-runtime/assets/`, `services/api/llm.ts`
>
> Arquitetura: `APPROVED — Lucas aprovou P0-005 em 2026-09-08`
>
> Triagem automática: `Material — altera caminho/contrato de asset usado em runtime.`
>
> Segurança: `Aplicável — revisão proporcional registrada abaixo.`

## Pedido

Resolver de forma canônica o desvio entre `services/api/llm.ts`, que procura o mock em `prompt-assets/`, e os assets oficiais em `packages/agent-runtime/assets/`. Atualizar somente contratos/documentos comprovadamente afetados, sem duplicar assets para mascarar o problema.

## Critérios de aceite

- [x] Provider simulated lê o mock canônico e preserva o contrato validado.
- [x] Prompt, schema e mock possuem uma única fonte de verdade declarada.
- [x] Documentação técnica afetada reflete o runtime comprovado.

## Restrições ou contexto

- Ler `AGENTS.md`, contratos em `docs/architecture/agent-core/`, assets e fluxo do agente antes do Gate.
- Não alterar schema, prompt ou provider sem decisão explícita no Architecture Gate.

## Arquitetura proposta

### Decisão e escopo

**Fato confirmado:** `services/api/prompt-builder.ts` já lê `base-agent-prompt.txt` e `schema.json` de `packages/agent-runtime/assets/`; `services/api/llm.ts` usa o caminho histórico inexistente `prompt-assets/` exclusivamente ao carregar `mock-response.json`. Como consequência, `LLM_PROVIDER=simulated` falha com `ENOENT` antes da validação.

**Decisão proposta:** criar um módulo interno único, por exemplo `services/api/runtime-assets.ts`, que resolve `packages/agent-runtime/assets/` e expõe leitura tipada para prompt base, schema e mock. `prompt-builder.ts` e `llm.ts` passam a consumi-lo. O diretório de teste `tests/fixtures/` continua sendo fixture de teste, não fallback de runtime.

**Fora de escopo:** modificar conteúdo de prompt/schema/mock, mudar provider, habilitar OpenRouter/Claude, duplicar assets, alterar contrato HTTP, persistência, UI ou chamar serviços externos.

### Fluxo de usuário e do runtime

1. Pessoa usuária solicita uma ficha e a API valida a identidade do veículo.
2. O runtime lê prompt, schema e, no modo simulated, mock da mesma origem canônica.
3. O mock recebe a identidade solicitada, passa pelo validador AJV e por `fonte_ref`, e só então a API responde a ficha.
4. Se um asset canônico estiver ausente ou inválido, a API responde pelo fluxo de erro controlado; não procura cópia histórica e não faz fallback silencioso.
5. A documentação técnica passa a declarar os paths atuais `services/api/` e `packages/agent-runtime/assets/`, preservando o aviso de que documentação não é fonte de runtime.

### Impacto técnico, dados e confiabilidade

- Criar um ponto único para o caminho de assets elimina divergência entre provider simulated e composição de prompt.
- Manter os assets no pacote canônico impede que mock, prompt e schema evoluam em cópias independentes.
- O conteúdo dos assets e a estrutura validada não mudam; a alteração é de resolução de arquivo e documentação técnica comprovada.
- Adicionar testes/checagens locais para a leitura do mock, a resposta simulated validada e o erro explícito de asset ausente. A suite formal de testes ainda é limitada a fixtures; a task não deve alegar cobertura que não exista.

### Segurança e risco proporcional

**Gatilho:** runtime de IA e contrato de API. Não há nova credencial, provider ou tráfego externo.

- Fronteira: arquivos versionados locais → runtime da API → resposta HTTP. `.env`, logs e snapshots brutos permanecem fora do escopo e não devem ser lidos/copied.
- Ameaça relevante: fallback implícito para asset histórico ou fixture de teste pode ocultar divergência de contrato e gerar ficha inválida. Controle: uma única origem canônica, sem fallback; falha explícita e validação existente preservada.
- Verificações: `npm run typecheck`; smoke simulated com fixture canônico; 400 de entrada inválida; 422 de schema/fonte inválidos quando fixture segura estiver disponível; revisão de que erro HTTP não mostra path interno desnecessário.
- Risco residual: documentos técnicos legados podem conter outras referências históricas. O recorte inclui busca e correção das referências `server/`/`prompt-assets/` encontradas em `docs/architecture/agent-core/`, mas não reescreve documentos sem divergência comprovada. Responsável por aceitar risco residual: Lucas.

### Plano incremental e reversível

1. Criar o resolvedor interno e migrar as duas leituras de assets para ele.
2. Executar typecheck e smokes locais exclusivamente no modo simulated.
3. Atualizar documentos `agent-core` que descrevem paths/pipeline antigos, confrontando cada afirmação com o código atual.
4. Registrar arquivos, evidências e qualquer verificação bloqueada; não alterar provider, secret ou ambiente externo.
5. Reverter, se necessário, removendo apenas o módulo/resolvedor e restaurando os imports anteriores; não há migration, dado externo ou asset duplicado para desfazer.

## Double-check da arquitetura

- Confirmado: os três assets canônicos existem em `packages/agent-runtime/assets/`; `tests/fixtures/mock-response.json` também existe, mas é destinado a testes.
- Confirmado: apenas `llm.ts` usa `prompt-assets` no runtime observado; `prompt-builder.ts` já usa o caminho canônico.
- Confirmado: `docs/architecture/agent-core/PROMPT_COMPOSITION.md`, `HTTP_PIPELINE.md` e `VALIDATION_AND_TYPES.md` ainda descrevem `server/`/`prompt-assets/`, portanto a atualização documental é necessária e delimitada.
- Confirmado: o fluxo não cria chamadas OpenRouter/Gemini/Claude, não lê `.env` e não altera schema/prompt/provider.
- Estados revistos: asset ausente, JSON inválido, entrada inválida, resposta inválida e fonte não declarada permanecem explícitos; a proposta não introduz fallback oculto.
- Conclusão arquitetural: estava `READY` e recebeu `APPROVED` explícito de Lucas em 2026-09-08; a implementação e as verificações registradas abaixo concluíram o recorte.

## Resultado do agente

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — Lucas aprovou P0-005 em 2026-09-08`
- Triagem automática: `Material`.
- Segurança: `Aplicável — revisão proporcional registrada nesta task.`
- Implementação: criado `services/api/runtime-assets.ts` como resolvedor único de `packages/agent-runtime/assets/`. `prompt-builder.ts` passou a ler prompt/schema por ele e `llm.ts` passou a ler o mock pelo mesmo resolvedor. Não foram duplicados assets, alterados schema/prompt/provider, lidos segredos ou feitas chamadas externas.
- Arquivos alterados: `services/api/runtime-assets.ts`, `services/api/prompt-builder.ts`, `services/api/llm.ts`, `docs/architecture/agent-core/PROMPT_COMPOSITION.md`, `HTTP_PIPELINE.md`, `LLM_RUNTIME.md`, `VALIDATION_AND_TYPES.md`, `VEHICLE_INPUT_SPEC.md` e este arquivo.
- Verificação: `npm run typecheck` passou; `git diff --check` passou; smoke local com `LLM_PROVIDER=simulated` e `PERSISTENCE_MODE=file` confirmou `GET /api/health`, `POST /api/ficha-tecnica` e `GET /api/ficha-tecnica/latest` com Ford Ranger; entrada vazia retornou 400. Nenhum provider externo foi chamado.
- Verificação de build atualizada (2026-09-08): `vite.config.ts` existe e `npm run build` passou fora do sandbox em 867 ms. A falha anterior era limitação de permissão do ambiente de validação ao ler um diretório ancestral, não condição preexistente do projeto.
- Segurança: revisão proporcional aplicada. A alteração remove fallback implícito e mantém uma única origem canônica; não houve novo segredo, provider, tráfego de rede ou conteúdo externo. Risco residual de referências históricas fora dos documentos corrigidos permanece para tasks documentais futuras.
- Próximo passo: iniciar a próxima task pendente por prioridade, P1-002, quando Lucas solicitar; ela deverá passar por Architecture Gate próprio.
