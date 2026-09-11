# ✅ Concluída — Medir diversidade e vínculo de evidências sem alterar o score

> Prioridade: P1
>
> Área afetada: telemetria sanitizada, auditoria de pesquisa e documentação operacional
>
> Origem ou referência: nova telemetria `result_summary` e auditoria da Ford Ranger Raptor 2025 Brasil em 11/09/2026
>
> Arquitetura: `APPROVED — Lucas autorizou a próxima task em 11/09/2026`
>
> Triagem automática: `Material — altera retenção local de telemetria de IA`
>
> Segurança: `Aplicável — revisão proporcional e conformidade registradas abaixo`

## Pedido

Evoluir a observabilidade sanitizada para medir, por execução, se a diversidade de fontes final corresponde a campos efetivamente vinculados e quais grupos da ficha dependem de uma única fonte. A etapa é de medição: não deve modificar prompt, pesquisa, score do roteador ou resposta pública.

## Critérios de aceite

- [x] O evento sanitizado informa contagens agregadas de fontes finais, aderência e campos com referências de fonte válidas.
- [x] A auditoria consegue distinguir fontes observadas, fontes publicadas e fontes realmente referenciadas por campos, sem expor URL, hostname, ID de fonte, valor, título, prompt, resposta bruta ou trecho de evidência.
- [x] O relatório agregado indica concentração por grupo somente por contagem, nunca por conteúdo de campo.
- [x] Dados malformados do provider não são serializados livremente nem causam falha na geração.
- [x] O teste de sanitização cobre `fonte_ref` como array de IDs e tentativa de injeção de texto/chave arbitrária.
- [x] Atualizar o ledger de evolução com métricas comparáveis, sem atribuir causalidade quando alvo, mercado, modelo ou orçamento variarem.

## Restrições ou contexto

- Ler primeiro `AGENTS.md`, perfil do PDK, `services/api/logger.ts`, schema canônico, `scripts/verify-telemetry-sanitization.ts` e a skill `technical-sheet-search-auditor`.
- A telemetria atual já registra `result_summary`; esta task a aprimora somente depois de P0-010 ou de uma justificativa explícita para medi-la isoladamente.
- Fora do escopo: reter snapshots brutos, alterar a política de fontes, mudar UI, criar endpoint, banco, custo de provider ou critério de seleção de resposta.

## Dependências

- P0-010 deve estar concluída e ter ao menos uma geração manual auditada antes de decidir se P1-027 altera a telemetria.
- P1-028 usa as métricas desta task como pré-requisito de decisão.

## Preflight, arquitetura e revisão proporcional — 2026-09-11

### Fatos confirmados

- P0-010 está concluída e sua geração posterior registrou 3 fontes observadas no quick, 9 no refine, 2 fontes finais e 114 campos confirmados com `fonte_ref` válido.
- `result_summary` atual já retém completude, estados por grupo, campos com referência e fontes por aderência. Ele não retém valores, URLs, títulos, IDs de fonte, prompt ou resposta bruta.
- `fonte_ref` no schema canônico é uma lista de IDs com formato `F<inteiro>`. O logger pode usar esses IDs somente em memória para cardinalidades; eles não entram no evento.

### Decisão e fluxo

O sanitizador do logger continuará percorrendo a ficha uma única vez. Para cada campo com `fonte_ref` estruturalmente válido, ele calculará somente:

1. total de fontes finais publicadas;
2. total de fontes finais efetivamente referenciadas por ao menos um campo;
3. total de referências de campo inválidas ou apontando para fonte não publicada;
4. por grupo seguro do schema: campos com referência, fontes distintas usadas, campos sustentados por uma fonte e campos sustentados por múltiplas fontes.

Os IDs servem apenas para conjuntos efêmeros durante a sanitização. O evento recebe contagens inteiras e chaves de grupos já presentes no schema. Não há mudança de prompt, pesquisa, score, UI, endpoint, schema, banco, provider, orçamento ou `.env`.

### Segurança

- Gatilhos: IA com conteúdo externo e retenção de logs locais.
- Ameaça principal: uma resposta do provider tentar induzir retenção de URL, título, ID, valor ou chave arbitrária por meio de `fonte_ref`/objetos aninhados.
- Controles: enum/regex fechados para status e IDs, limite de profundidade e coleções, grupos com chave segura, interseção com fontes publicadas e saída exclusivamente numérica. Dados malformados são contabilizados como inválidos, sem serialização livre nem falha de geração.
- Risco residual: as contagens não provam que o conteúdo de uma fonte é verdadeiro; elas apenas tornam a concentração auditável. Lucas é responsável pelo risco residual.

### Conformidade proporcional

- Jurisdição: Brasil; referência consultada em 11/09/2026: LGPD, arts. 5º, 6º e 46, na fonte oficial do Planalto.
- Finalidade: auditoria técnica de cobertura e proveniência de fichas automotivas; controlador/responsável pela decisão: BlindSpot/Lucas.
- Dados de titulares: nenhum intencionalmente. A entrada não inclui pessoa, conta, URL, título, valor ou resposta do provider; a saída retida são contagens agregadas.
- Minimização/retenção: mantém o ciclo e local de retenção já existente de eventos; não cria compartilhamento, transferência, exportação, coleta remota ou novo prazo de retenção.
- Base legal e transparência: a validade de eventual base legal permanece a validar pelo responsável competente; a mudança reduz, não amplia, conteúdo identificável no evento.
- Decisão: `seguir`; reavaliar se forem incluídos identificadores, conteúdo externo, telemetria remota ou exportação de eventos.

### Verificação e reversibilidade

- Expandir `verify-telemetry-sanitization` com fontes válidas, não publicadas e valores/títulos/IDs proibidos.
- Executar typecheck, verificador de sanitização, build e diff check; não chamar provider real.
- Reversão: remover os campos agregados do resumo; não há migração ou dado funcional a desfazer.

### Double-check da arquitetura

- Fontes observadas continuam exclusivamente nas métricas por passe; fontes publicadas e referenciadas passam a ser medidas sem vincular identidade de fonte ao evento.
- Um grupo com uma única fonte pode ser legítimo; a telemetria descreve o fato, não reduz score nem rebaixa campo.
- A P1-028 permanece bloqueada até que métricas de múltiplas execuções indiquem ausência recorrente de fonte oficial ou concentração problemática.

## Resultado do agente

_Preenchido pelo agente. Não apague o pedido original._

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — autorização explícita de 11/09/2026, registrada acima.`
- Triagem automática: `Material` — logs/auditoria de IA; sem mudança de comportamento de pesquisa.
- Segurança: `Aplicável` — revisão de segurança e conformidade proporcionais registradas acima.
- Implementação: `result_summary.source_usage` mede somente cardinalidades agregadas: fontes finais referenciadas, referências inválidas e, por grupo, campos vinculados a uma ou múltiplas fontes. IDs são usados apenas em conjuntos efêmeros e nunca serializados no evento.
- Arquivos alterados: `services/api/logger.ts`, `scripts/verify-telemetry-sanitization.ts`, `docs/architecture/agent-core/LLM_RUNTIME.md`, `docs/operations/technical-sheet-research-evolution.md` e esta task.
- Verificação: `npm run verify:telemetry-sanitization` ✅; `npm run typecheck` ✅; `npm run build` ✅; `git diff --check` ✅.
- Validação real: pendente de uma nova geração manual. Ela não altera a busca; apenas registrará as métricas que a P1-028 utilizará para avaliar concentração recorrente.
- Próximo passo: executar uma ficha equivalente da Ford Ranger Raptor 2025 Brasil e auditar o novo `result_summary.source_usage` antes da P1-028.
