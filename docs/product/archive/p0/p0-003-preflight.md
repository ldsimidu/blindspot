# Change preflight — revisão ampliada do P0-003

Data: `2026-09-07`

## Pedido e recorte

- **Resultado esperado:** refazer o backlog com a fonte Docling Ford, incluindo fluxos corporativos básicos como conta, login e gestão de acesso.
- **Consultados:** `AGENTS.md`, perfil/estratégia PDK, contratos agent-core, task P0-003, catálogo, roadmap, matriz, inventário e fonte indicada.
- **Fatos:** API/ficha/validação existem parcialmente; auth, tenancy, persistência corporativa, comparador e exportação não são comprovados. A fonte lista 5 épicos e 12 features, mas termina no início de 3.3.2.
- **Lacunas:** detalhe depois desse ponto é proposta; provider, retenção, tenancy, cota, SLA e integrações não estão decididos.

## Impacto e risco

- **Afetados:** documentação e planejamento; escopos futuros de identidade, dados, exportação e operação.
- **Riscos:** confundir documento histórico com runtime, transformar metas em SLA e inferir decisão de segurança.
- **Reversibilidade:** mudança é documental e reversível por Git. Qualquer implementação futura para até Architecture Gate e revisão de segurança específicos.

## Verificação prevista

- Conferir fonte/RFs/features, links, padrões de segredo, coerência de estados e `git diff --check`.

## Próximo passo

`Architecture Gate aprovado pelo pedido explícito de Lucas em 2026-09-07 para esta revisão documental; executar somente a documentação.`
