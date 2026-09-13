# 🚧 Em execução — Priorizar evidência oficial por variável no refine compatível

> Prioridade: P1
>
> Área afetada: prompt de refine OpenRouter e auditoria de pesquisa
>
> Origem ou referência: auditoria validada de Ford Ranger Raptor 2025 Brasil em 11/09/2026
>
> Arquitetura: `APPROVED — Lucas autorizou seguir nesta sessão em 11/09/2026`
>
> Triagem automática: `Material — altera orientação de IA com web search, sem alterar contrato`
>
> Segurança: `Aplicável — integração de IA e conteúdo externo não confiável`

## Pedido

No modo `ex_prompt_compat` do OpenRouter, orientar somente o refine a usar, por variável, a evidência de primeira parte já observada quando ela for aderente ao alvo e puder responder o campo. Fontes externas observadas, HTTPS e rastreáveis continuam válidas para complementar lacunas e não podem ser bloqueadas, descartadas nem substituídas apenas por sua classe.

## Critérios de aceite

- [x] A nova orientação é aplicada apenas ao prompt de refine OpenRouter em `ex_prompt_compat`; quick, `strict_evidence` e Claude permanecem inalterados.
- [x] O prompt pede preferência por fonte de primeira parte observada e aderente quando ela cobre a variável, sem exigir que toda variável tenha fonte oficial.
- [x] O prompt preserva explicitamente a complementaridade de fontes externas observadas, HTTPS e rastreáveis.
- [x] O prompt permite múltiplos vínculos somente quando houver evidência independente adequada, sem inventar corroboracão.
- [x] Não há hardcode de marca, modelo, URL, domínio, documento, turno, token, engine, chamada de web search ou bloqueio de domínio.
- [x] O verificador de capacidades prova a orientação genérica, a permanência da pesquisa externa no compatível e a ausência da regra restritiva do modo estrito.
- [x] A telemetria validada já existente permite comparar, numa geração futura equivalente, cobertura e vínculos `official`/`partner`/`other` sem registrar conteúdo sensível.

## Restrições ou contexto

- Ler `AGENTS.md`, perfil PDK, estratégia de verificação, runtime canônico, `services/api/llm.ts`, `scripts/verify-research-capabilities.ts`, `source-policy.json`, política de evidência e auditoria/ledger recentes.
- A amostra validada tem 109 variáveis resolvidas de 194 pesquisáveis: 14 vínculos resolvidos em fonte `official`, 95 em `other`, duas fontes efetivamente referenciadas e nenhum campo com múltiplas classes. Logo, a descoberta oficial existe; a lacuna é a alocação/corroboracão no refine.
- `ex_prompt_compat` devolve o resultado do refine por compatibilidade histórica. Esta task não troca isso por merge server-side, pois isso muda a semântica e a cobertura do fluxo legado.
- Fora do escopo: exigir ficha técnica, restringir pesquisa a domínios oficiais, alterar política/schema/API/UI/provider/modelo/budgets, chamar provider real, mudar o resultado por pós-processamento ou criar fonte fixa de uma marca.

## Preflight, arquitetura e revisão proporcional — 2026-09-11

### Decisão e fluxo

1. Mantém-se o quick e a busca ampla do modo compatível.
2. No refine compatível, após a primeira rodada já ter exposto fontes observadas, o prompt passa a instruir uma decisão local por variável: evidência de primeira parte observada e aderente é preferida quando cobre o campo; evidência externa rastreável cobre o restante.
3. Quando houver evidência independente adequada em mais de uma fonte, o modelo pode vinculá-las; a instrução proíbe fabricar corroboracão ou listar fonte meramente decorativa.
4. A validação e a telemetria sanitizada existentes continuam sendo a fronteira server-owned e a forma de medir o efeito na próxima amostra.

### Segurança

- Fronteira: conteúdo e citações retornados pelo provider/web search continuam não confiáveis; prompt é apenas orientação e não autoridade de política.
- Controles preservados: `validateResponse`, política de fontes/evidências server-owned, exigência de fonte real observada, schema, sanitização agregada e logs sem URLs ou conteúdo.
- Não são adicionados dados enviados, ferramentas, destinos, permissões, segredos, chamadas nem custos. A mudança não aceita conteúdo externo como instrução.
- Risco residual: o modelo pode priorizar mal uma fonte declarada como primeira parte. A resposta permanece sujeita à política e a auditoria mede vínculo, não verdade factual. Responsável residual: Lucas.

### Conformidade proporcional

- Jurisdição: Brasil; LGPD, arts. 5º, 6º e 46, referência oficial do Planalto consultada em 11/09/2026.
- Finalidade: melhorar a rastreabilidade de pesquisa automotiva sem coletar, reter ou compartilhar dados pessoais adicionais.
- Não há alteração de dados pessoais, retenção, destinatários, transferência internacional, conteúdo bruto ou telemetria remota. Reavaliar se houver exportação de logs, coleta identificável ou nova integração.
- Decisão: `seguir`.

### Verificação e reversibilidade

- Estender o verificador estático de capacidades do prompt; rodar `npm run verify:research-capabilities`, `npm run typecheck`, `npm run build` e `git diff --check`.
- Não chamar o provider durante a implementação. Após a entrega, Lucas gera uma ficha equivalente e a auditoria compara apenas agregados com a linha-base 14 `official` / 95 `other` / 109 resolvidas.
- Sinal positivo inicial: aumento de campos resolvidos por `official` sem queda relevante de cobertura e sem sumiço de fontes externas complementares. Uma única execução é indicativa, não conclusão causal.
- Reversão: reverter o commit isolado desta task; não há migration nem alteração persistida.

### Double-check da arquitetura

- A alteração não reintroduz o filtro que já levou a fichas vazias: o compatível continua permitindo fontes externas observadas.
- Não pressupõe Ford/BYD/Volkswagen nem documento conhecido; a regra é genérica para toda marca e mercado.
- A orientação ocorre no refine, quando há mais contexto de pesquisa, sem aumentar orçamento ou número de turnos.
- A telemetria agora é pós-validação, portanto a próxima comparação representa a ficha persistida/exibida, não uma resposta intermediária do provider.
- Conclusão: gate `APPROVED`; experimento mínimo, reversível e mensurável antes de qualquer mudança estrutural de merge ou busca.

## Resultado do agente

_Preenchido pelo agente. Não apague o pedido original._

- Estado: `✅ Concluída`
- Implementação: o refine OpenRouter em `ex_prompt_compat` agora escolhe por variável a fonte de primeira parte observada e aderente quando ela cobre o campo, preservando fontes externas rastreáveis como complemento e proibindo corroboracão inventada.
- Arquivos alterados: `services/api/llm.ts`, `scripts/verify-research-capabilities.ts`, documentação de compatibilidade e esta task.
- Verificação: `npm run verify:research-capabilities` ✅; `npm run typecheck` ✅; `npm run build` ✅; `git diff --check` ✅ (somente avisos de CRLF em arquivos preexistentes/compartilhados, sem erro de diff).
- Validação real: pendente de uma geração equivalente autorizada pelo operador; não houve chamada ao provider nesta task.
