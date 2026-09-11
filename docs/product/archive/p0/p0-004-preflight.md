# Change preflight — fluxograma consolidado da jornada

Data: `2026-09-07`

## Pedido e recorte

- **Resultado esperado:** representar visualmente a jornada corporativa por todo o backlog, incluindo gates, exceções, atores, estados e dependências.
- **Paths e contratos consultados:** `AGENTS.md`, perfil/estratégia PDK, task P0-004, backlog P0-003, catálogo, roadmap, matriz, inventário e contratos `agent-core`.
- **Fatos confirmados:** ficha/API/validação têm evidência parcial; auth, tenancy, persistência corporativa, comparador, exportação, consumo e observabilidade corporativa não são comprovados.
- **Hipóteses e lacunas:** fluxos futuros servem a planejamento; provider, SSO, MFA, banco, cotas e SLAs seguem indecididos.

## Impacto e risco

- **Afetados:** documentação e interpretação de produto, sem runtime.
- **Riscos:** confundir proposta com implementação, omitir saída de erro ou representar fronteira de segurança como detalhe opcional.
- **Reversibilidade e condição de abortar:** arquivos estáticos locais e reversíveis por Git; parar se a visualização exigir decisão de contrato/segurança ou dependência externa.

## Verificação prevista

- Conferir cobertura E01–E05/RF01–RF13, estados, caminhos alternativos, legenda, links, acessibilidade textual, segredo documental e diffs.

## Próximo passo

`Architecture Gate aprovado por Lucas em 2026-09-07 para a criação documental/visual estática.`
