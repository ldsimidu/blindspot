# 🚧 Em execução — Registrar resumo de evidências após validação final

> Prioridade: P1
>
> Área afetada: API, telemetria sanitizada e auditoria de pesquisa
>
> Origem ou referência: auditoria de execução OpenRouter em 11/09/2026
>
> Arquitetura: `APPROVED — Lucas autorizou a correção nesta sessão em 11/09/2026`
>
> Triagem automática: `Material — altera retenção local derivada de resposta de IA validada`
>
> Segurança: `Aplicável — IA, auditoria e retenção local de logs`

## Pedido

Fazer com que a auditoria de classe de fonte descreva a ficha depois de `validateResponse`, isto é, a mesma resposta que pode ser persistida e exibida, sem alterar busca, prompt, política, schema, endpoint, provider ou resposta pública.

## Critérios de aceite

- [x] `llm_execution` mantém métricas de passes/provider, sem apresentar `result_summary` pré-validação como se fosse resultado final.
- [x] Um evento sanitizado próprio registra a completude e os vínculos de fonte da resposta validada, usando o `request_id` HTTP já existente.
- [x] O novo evento inclui classes de fonte somente a partir da política server-owned aplicada por `validateResponse`.
- [x] A falha de telemetria não impede validação, persistência nem resposta da ficha.
- [x] Nenhum valor, URL, hostname, título, ID, tipo declarado, prompt, resposta bruta ou conteúdo de evidência entra no evento.
- [x] Testes e documentação distinguem explicitamente estágio do provider e estágio validado; ledger fica pronto para a próxima amostra.

## Restrições ou contexto

- Ler `AGENTS.md`, perfil PDK, estratégia de verificação, `services/api/index.ts`, `services/api/llm.ts`, `services/api/logger.ts`, `validator.ts` e `source-policy.json`.
- Fora do escopo: alterar pesquisa, modelo, web search, refino, política de fonte, schema, banco, UI, endpoint, `.env`, chamada real ao provider ou retenção de conteúdo bruto.

## Preflight, arquitetura e revisão proporcional — 2026-09-11

### Fatos confirmados

- `callOpenRouterLLM` grava `llm_execution` antes de retornar para `services/api/index.ts`.
- `validateResponse` ocorre depois, no endpoint `/api/ficha-tecnica`, e é onde a avaliação de política server-owned é aplicada à resposta que será persistida/exibida.
- A última execução mostrou 4 fontes e 125 vínculos no estágio provider, mas todas como `other`; esse resultado não é uma medida válida da resposta final por classe.

### Decisão e fluxo

1. `llm_execution` continua sendo evento de execução do provider: modo, duração, budgets, passes e falha/sucesso. Ele deixa de publicar `result_summary` para evitar interpretar dados pré-validação como ficha final.
2. Após `validateResponse` e antes de persistir/responder, o endpoint chama `logValidatedTechnicalSheetResult` em bloco não bloqueante.
3. O novo evento `validated_technical_sheet_result` usa o `request_id` HTTP, provider e `result_summary` já sanitizado. A lista de tipos oficial/parceira, carregada do asset canônico, é usada apenas em memória para classificar a resposta já avaliada pelo servidor.
4. Se a gravação falhar, o endpoint registra aviso local e continua a ficha validada; a telemetria não muda disponibilidade nem resultado funcional.

### Segurança

- Gatilhos: IA, conteúdo externo, auditoria e retenção local de logs.
- Fronteira: provider não confiável → validação/política server-owned → sanitizador agregado → arquivo local de evento.
- Risco: uma resposta/provider tentar introduzir conteúdo arbitrário ou o log pré-validação induzir decisão errada.
- Controles: resumo gerado somente da resposta validada; classes derivadas após política; saída numérica/chaves fechadas; `request_id` existente sem conteúdo do veículo; try/catch não bloqueante; sem serialização de strings do provider.
- Risco residual: o evento prova o estágio validado e o vínculo declarado, não a veracidade factual do conteúdo. Responsável: Lucas.

### Conformidade proporcional

- Jurisdição: Brasil; LGPD, arts. 5º, 6º e 46, fonte oficial Planalto consultada em 11/09/2026.
- Finalidade: auditoria técnica de pesquisa automotiva; responsável: BlindSpot/Lucas.
- Dados e retenção: não coleta nem envia dados novos. Mantém arquivo local existente e troca apenas o estágio de uma contagem agregada; valores, URLs, IDs e conteúdo externo permanecem excluídos.
- Base legal, transparência e retenção detalhada continuam sob validação humana competente. Reavaliar se houver exportação, telemetria remota ou conteúdo identificável.
- Decisão: `seguir`.

### Verificação e reversibilidade

- Adaptar o verificador de telemetria para o resumo validado e para ausência de resumo no evento do provider.
- Executar typecheck, sanitização, build e diff check; provider real fica fora da verificação automática.
- Reversão: reverter o commit isolado desta task; não há migration nem alteração da busca.

### Double-check da arquitetura

- A resposta usada pelo novo evento é exatamente `validatedResponse`, antes de persistência e resposta HTTP; portanto, as classes correspondem ao que o usuário recebe.
- O log de provider continua útil para custo/passes, mas não carrega resultado estrutural que possa contradizer a publicação.
- Não há nova rota, dado público, chamada de rede, schema, credencial ou mudança de política.
- O `request_id` é existente e já é usado em logs HTTP/erros; ele permite correlação local sem expor conteúdo.
- Conclusão: gate `APPROVED`; alteração limitada à ordem e ao conteúdo sanitizado da observabilidade.

## Resultado do agente

_Preenchido pelo agente. Não apague o pedido original._

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — autorização explícita de Lucas registrada acima.`
- Triagem automática: `Material` — telemetria de IA validada; sem mudança de pesquisa.
- Segurança: `Aplicável` — revisão de segurança e conformidade registradas acima.
- Implementação: `llm_execution` deixou de publicar resumo pré-validação; `validated_technical_sheet_result` é emitido após `validateResponse` em bloco não bloqueante e usa a mesma sanitização agregada/classes de fonte.
- Arquivos alterados: `services/api/index.ts`, `services/api/logger.ts`, documentação de runtime/segurança/ledger e esta task.
- Verificação: `npm run verify:telemetry-sanitization` ✅; `npm run typecheck` ✅; `npm run build` ✅; `git diff --check` ✅.
- Validação real: pendente de uma geração equivalente autorizada pelo operador; não houve chamada ao provider durante esta task.
- Próximo passo: executar uma ficha controlada, então auditar o par `llm_execution`/`validated_technical_sheet_result` antes de alterar a estratégia de busca.
