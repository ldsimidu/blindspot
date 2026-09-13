# ✅ Concluída — Reconciliar estado real e contratos da pesquisa continuada

> Prioridade: P0
>
> Área afetada: arquitetura, API, dados, interface e governança de tasks
>
> Origem ou referência: proposta (2), seções 2 a 4, 73 a 81; auditoria de integração de 2026-09-11
>
> Arquitetura: `APPROVED — Lucas autorizou seguir com a primeira task em 2026-09-12; o recorte é documental e read-only.`
>
> Triagem automática: `Material — corrige divergência entre tasks concluídas e jornada entregue.`
>
> Segurança: `Aplicável — revisão proporcional registrada; não houve alteração de dados, runtime ou integração.`

## Pedido

Inventariar runtime, migrations, rotas e UI da pesquisa de fichas; declarar o que existe, o que é protótipo e o que falta. Produzir contrato canônico único de Vehicle → Sheet → Revision → Session antes de novas features.

## Critérios de aceite

- [x] Matriz rastreável relaciona cada capacidade proposta ao código/rota/UI e seu estado real.
- [x] Tasks com resultado incorreto ou incompleto são reabertas/corrigidas sem apagar evidência histórica.
- [x] Um contrato canônico define IDs, tenant, estados, latest/recommended/primary e transições permitidas.
- [x] Nenhuma nova task usa catálogo global como substituto de workspace organizacional.
- [x] A matriz separa explicitamente V1, pós-V1, decisões irreversíveis, dependências e itens deliberadamente fora do escopo, cobrindo as seções 73 a 85 da proposta (2).

## Restrições ou contexto

- Não refatorar produto nesta task; documento de proposta não é autoridade de runtime.
- Ler assets canônicos, schema, repositórios, API, `App.tsx`, P1-029 a P1-036 e tasks P2 existentes.
- Não transformar sugestões de futuro da proposta em promessa de runtime; a saída deve apontar a task correspondente ou registrar a lacuna de fila.

## Resultado do agente

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — arquitetura/documentação read-only autorizada por Lucas em 2026-09-12.`
- Triagem automática: `Material — auditoria de contrato, governança de tasks e fronteiras para mudanças futuras; sem alteração de produto nesta entrega.`
- Segurança: `Aplicável — revisão proporcional de tenancy, IA, persistência, auditoria e retenção registrada no artefato.`
- Implementação: inventário estático e contrato canônico consolidados em `docs/architecture/CONTINUOUS_TECHNICAL_RESEARCH_CONTRACT_AUDIT.md`. Foram reabertas P1-030 (revisão numerada por configuração), P1-032 (Focus não altera o executor) e P1-035 (workspace técnico, não integrado), preservando o histórico dos cortes já entregues.
- Arquivos alterados: `docs/architecture/CONTINUOUS_TECHNICAL_RESEARCH_CONTRACT_AUDIT.md`, esta task e as tasks P1-030, P1-032 e P1-035.
- Verificação: releitura dos assets canônicos, migrations `0017` a `0022`, schema, repositório, API, sessões, qualidade, workspace e tasks P1-029 a P1-036; `git diff --check` passou para estes artefatos. Nenhum provider, migration, banco, `.env`, log bruto ou snapshot foi acessado/escrito.
- Limitações: a auditoria estática não prova migrations aplicadas no ambiente atual nem smoke autenticado; os fatos de runtime devem ser revalidados nas tasks consumidoras. A task não altera schema, prompt, endpoint, provider, dados ou interface.
- Próximo passo: P0-013 — integrar jornada canônica da ficha e pesquisa, usando o contrato auditado e seu Architecture Gate próprio.
