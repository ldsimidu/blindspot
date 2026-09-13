# Aceite determinístico — pesquisa e fichas técnicas

## Escopo

Este aceite verifica o fluxo canônico `Vehicle → Sheet → Revision → Session` com fixtures sintéticas e modo `simulated`. Ele não consulta provider, não usa fichas reais de fabricante e não publica dados. As fixtures de cenário usam a identidade nominal BYD apenas para reproduzir a situação descrita na proposta; modelo, versão, organização, contas e identificadores são aleatórios e descartados ao final.

O resultado não substitui o Architecture Gate: qualquer falha que revele mudança de comportamento, schema, prompt, endpoint ou provider abre uma task própria antes de correção.

## Execução

Execute `npm run verify:research-acceptance`. Os verificadores que usam banco requerem o `DATABASE_URL` já configurado. Eles inserem somente dados sintéticos sob `example.test` e os removem em `finally`; não devem ser executados contra uma base que proíba esse tipo de fixture.

## Matriz de cenários

| Cenário | Contrato/tarefa | Verificador | Resultado esperado |
| --- | --- | --- | --- |
| Ficha existente, criação de sessão, foco limitado e revisão publicada parcial | P0-012, P0-013, P0-014, P1-044 a P1-047 | `verify:research-acceptance-db` | A sessão `VARIABLES` publica revisão, mantém estado `partial` e não torna a recomendação mandatória. |
| Nova ficha e isolamento de workspace | P1-044, P1-045 | `verify:workspace-contract-db` | A criação não cria revisão implícita nem ficha em outra organização. |
| Continuação concorrente e conflito de base | P1-046 | `verify:research-session-execution-db` | Uma execução publica a revisão; a concorrente termina em `needs_rebase`, sem sobrescrever a anterior. |
| Campo desconhecido e não aplicável | P1-047 | `verify:research-acceptance-contract`, `verify:field-states` | Estados canônicos são projetados sem inventar valor ou evidência. |
| Pesquisa esgotada | P1-046, P1-047 | `verify:research-acceptance-db`, `verify:research-plan` | Um alvo inexistente encerra em `research_exhausted` com orçamento zero. |
| Cancelamento | P1-046, P1-048 | `verify:research-acceptance-db` | Sessão em fila e tarefas associadas tornam-se `cancelled`; impacto permanece auditável. |
| Histórico/evidência e impacto de qualidade | P1-047, P1-048 | `verify:research-acceptance-db`, `verify:research-session-history` | Evidência e impacto são persistidos; histórico ordenado é sanitizado e isolado por organização. |
| `latest`, `primary` e `recommended` | P1-045 | `verify:research-acceptance-db`, `verify:technical-sheet-governance-db` | `latest` é temporal, `primary` exige seleção administrativa e `recommended` permanece indisponível até existir política explícita. |
| Fichas distintas e organizações distintas | P1-044, P1-045 | `verify:technical-sheet-lineage-db`, `verify:research-acceptance-db` | Revisões e workspace não cruzam organização nem alteram ficha irmã. |
| Fonte ausente, identidade incompatível e resposta inválida | P0-012, P0-014 | `verify:research-acceptance-contract` | A validação falha de forma controlada, sem vazar prompt, URL, resposta bruta ou segredo. |
| Fonte oficial indisponível | P1-046 | `verify:research-plan` | O plano termina controladamente com `official_source_unavailable`. |

## Limites declarados

- Não há recomendação automática: o contrato retorna `recommended.state = not_available` até que uma política de seleção seja implementada e aprovada.
- O cenário de falha parcial é coberto pelo resultado `partial` publicado e pela falha controlada de validação. Falha de provider real fica bloqueada por decisão de produto/integração: esta suíte não chama provider externo.
- O processamento é de uma tarefa direcionada por sessão. Orquestração de múltiplas tarefas, fila distribuída, retry temporal e agendamento não são declarados como aceitos enquanto não houver task e Architecture Gate específicos.
- A evidência simulada valida contratos de proveniência e saneamento; não comprova cobertura factual de um veículo de fabricante.
