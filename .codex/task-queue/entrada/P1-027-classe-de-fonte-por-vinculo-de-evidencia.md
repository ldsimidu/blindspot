# 🚧 Em execução — Medir uso de fonte oficial por vínculo de evidência

> Prioridade: P1
>
> Área afetada: telemetria sanitizada, runtime de log e auditoria de pesquisa
>
> Origem ou referência: auditorias da Ford Ranger Raptor 2025 Brasil em 11/09/2026
>
> Arquitetura: `APPROVED — Lucas autorizou a sugestão nesta sessão em 11/09/2026`
>
> Triagem automática: `Material — altera retenção local de telemetria derivada de IA`
>
> Segurança: `Aplicável — IA, auditoria e retenção local de logs`

## Pedido

Medir, por execução, se fontes oficiais publicadas são efetivamente vinculadas a campos resolvidos, sem registrar identificadores de fonte, URLs, títulos, valores, prompts, respostas brutas ou qualquer conteúdo de evidência.

## Critérios de aceite

- [x] O `result_summary` informa, por classe `official`, `partner` e `other`, fontes publicadas, fontes referenciadas, campos com vínculo e campos resolvidos com vínculo.
- [x] Uma fonte só é contada como `official` quando seu tipo pertence à política carregada pelo servidor e sua avaliação de política é `na_lista_aprovada`.
- [x] Referências com mais de uma classe são contadas de forma agregada, sem serializar IDs de fonte ou caminhos/valores de campos.
- [x] Dados malformados, tipo desconhecido ou política ausente degradam para `other` e não interrompem a geração.
- [x] O teste de sanitização cobre uma fonte oficial aprovada, parceira aprovada, fonte não classificada e tentativa de injeção de texto/ID.
- [x] Atualizar a documentação de runtime, revisão de segurança e ledger de auditoria para a próxima amostra comparável.

## Restrições ou contexto

- Ler `AGENTS.md`, perfil PDK, estratégia de verificação, `source-policy.json`, `services/api/validator.ts`, `services/api/logger.ts` e o contrato de telemetria existente.
- Fora do escopo: prompt, modelo, provider, web search, score, UI, schema público, endpoint, banco, `.env`, URL/fetch adicional e chamada real ao provider.
- `source-policy.json` permanece a fonte de verdade para tipos oficiais; documentação não o substitui.

## Preflight, arquitetura e revisão proporcional — 2026-09-11

### Fatos confirmados

- O runtime já classifica uma fonte como `na_lista_aprovada` apenas quando tipo e host atendem à política server-owned. A lista de tipos oficiais está no asset canônico `source-policy.json`.
- A P1-027 mede fontes finais e cardinalidade de `fonte_ref`, mas remove IDs e tipos do evento. Por isso, ela não responde se a fonte oficial publicada foi usada em campos.
- Na última amostra, duas fontes finais foram referenciadas, mas os 117 vínculos válidos tiveram uma única fonte por campo. Não há mapeamento fonte-campo retido em log.

### Decisão e fluxo

`callOpenRouterLLM` e `callClaudeLLM` passam somente a lista server-owned de tipos oficiais para a configuração efêmera do logger. O sanitizador cruza, exclusivamente em memória, `fonte_ref` válido com fontes finais e deriva a classe:

1. `official`: tipo presente na lista oficial carregada e avaliação server-owned `na_lista_aprovada`;
2. `partner`: fonte aprovada cujo tipo pertence à lista de parceiros carregada;
3. `other`: qualquer fonte restante, ausente ou malformada.

O evento receberá apenas contagens fixas por classe: fontes publicadas, fontes referenciadas, campos com vínculo, campos resolvidos (`confirmado`, `parcial` ou `inferido_minimamente`) e campos com vínculos de mais de uma classe. A geração, o resultado público e as regras de seleção permanecem idênticos.

### Segurança

- Gatilhos: conteúdo externo de IA, auditoria e retenção local de logs.
- Fronteira: resposta não confiável do provider → validação/política server-owned → sanitizador → `llm-events.log` local.
- Ameaça: `tipo`, `fonte_ref` ou objetos aninhados tentarem introduzir ID, URL, texto ou chave arbitrária no evento.
- Controles: listas de classes fechadas; classificação oficial exige política aprovada e tipo server-owned; IDs ficam em conjuntos efêmeros; saída só contém inteiros/chaves fixas; limites atuais de árvore/coleções permanecem; entrada inválida cai em `other` ou contador de referência inválida.
- Risco residual: contagem de vínculo prova proveniência declarada/validada, não a correção factual do conteúdo. Responsável pela aceitação do risco residual: Lucas.

### Conformidade proporcional

- Jurisdição: Brasil; LGPD, arts. 5º, 6º e 46, fonte oficial Planalto consultada em 11/09/2026.
- Finalidade: auditoria técnica da cobertura/proveniência de fichas automotivas; responsável pela decisão: BlindSpot/Lucas.
- Dados: nenhum dado pessoal é incluído intencionalmente. Não há novo envio, terceiro, transferência, exportação, endpoint ou prazo de retenção; somente contagens agregadas são anexadas ao log local existente.
- Base legal, transparência e retenção permanecem responsabilidade de validação humana competente. Reavaliar se identificadores, conteúdo externo, telemetria remota ou exportação forem incluídos.
- Decisão: `seguir`.

### Plano de coordenação simultânea

| Fatia | Estado | Owner | Recursos permitidos | Dependência e bloqueio |
| --- | --- | --- | --- | --- |
| T-01 Telemetria por classe | trabalhando | integrador desta task | `services/api/logger.ts`, `services/api/llm.ts`, teste e docs de telemetria | gate aprovado; não altera runtime de pesquisa |
| T-02 Arquitetura contínua P1-029 | aguardando | Lucas | task P1-029 e documentos de arquitetura | já está `READY`, mas as cinco decisões pendentes não receberam `APPROVED`; nenhum worker elegível |

Não há recurso compartilhado entre as fatias elegíveis e nenhum worker/worktree é criado por este plano. O checkpoint de integração de T-01 é typecheck, sanitização, build e revisão do diff; T-02 só pode avançar após aprovação humana própria.

### Verificação e reversibilidade

- Expandir `verify-telemetry-sanitization` com classes e tentativa de injeção.
- Executar `npm run verify:telemetry-sanitization`, `npm run typecheck`, `npm run build` e `git diff --check`; não chamar provider real.
- A próxima geração equivalente avaliará a métrica; sem ela não haverá alteração de prompt/refine/P1-028.
- Reversão: reverter o commit isolado desta task; não há migration, dado funcional ou mudança de comportamento de busca para desfazer.

### Double-check da arquitetura

- A classificação não aceita o rótulo de tipo isoladamente: ela exige a avaliação server-owned aprovada, preservando a política atual.
- A lista oficial vem do asset canônico já carregado, sem cadastro manual de marca ou domínio e sem duplicar URLs no logger.
- `other` protege a disponibilidade em ausência de política/configuração, sem omitir dado nem quebrar geração.
- P1-028 continua fora desta implementação: a métrica é a evidência que decidirá se descoberta oficial é necessária ou se o próximo problema é uso/corroboramento.
- Conclusão: gate `APPROVED`; alteração limitada à observabilidade sanitizada.

## Resultado do agente

_Preenchido pelo agente. Não apague o pedido original._

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — autorização explícita de Lucas registrada acima.`
- Triagem automática: `Material` — telemetria derivada de IA; sem mudança de busca.
- Segurança: `Aplicável` — revisão de segurança e conformidade proporcionais registradas acima.
- Implementação: `result_summary.source_usage.by_source_class` fornece contadores fixos para `official`, `partner` e `other`; a classe oficial requer simultaneamente tipo da política carregada e avaliação de política aprovada pelo servidor. OpenRouter e Claude repassam apenas as listas server-owned em memória ao logger.
- Arquivos alterados: `services/api/logger.ts`, `services/api/llm.ts`, `scripts/verify-telemetry-sanitization.ts`, documentação de runtime/segurança/ledger e esta task.
- Verificação: `npm run verify:telemetry-sanitization` ✅; `npm run typecheck` ✅; `npm run build` ✅; `git diff --check` ✅.
- Validação real: pendente de duas gerações equivalentes autorizadas pelo operador; não houve chamada ao provider durante esta task.
- Próximo passo: executar a primeira geração controlada e auditar `by_source_class` antes de decidir entre P1-028 (descoberta) e ajuste futuro de uso/corroboramento.
