# Matriz de cobertura do acervo BlindSpot

Data da reauditoria: `2026-09-06`.

Esta matriz registra fontes efetivamente consultadas, seu uso no catálogo e as lacunas restantes. Ela não é fonte de runtime: para capacidade atual, `packages/agent-runtime/assets/`, `services/api/`, `apps/web/`, `docs/architecture/agent-core/` e `evidence/` prevalecem sobre documentação histórica.

| Fonte consultada | Temas aproveitados | Destino documental | Classificação | Lacuna restante |
|---|---|---|---|---|
| `desenvolvimento-do-blindspot.md` | Estado consolidado, MVP parcial e sequência de estabilização. | README, roadmap, features E01/E02/E05. | Parcial. | Revalidar com código a cada mudança de runtime. |
| `produto/contexto-do-produto-blindspot.md` | Problema, caso Ford, stakeholders e proposta de valor. | README e features E01–E03. | Proposta contextual. | Não prova métrica ou capacidade entregue. |
| `produto/proposta-de-valor-completa-blindspot.md` | Ganhos, riscos de qualidade e metas discutidas. | README, roadmap e features E03–E05. | Proposta. | Metas exigem método e evidência atual. |
| `planejamento/backlog-requisitos-e-roadmap-blindspot.md` | RF01–RF13, regras de negócio e épicos iniciais. | Features — matriz RF01–RF13. | Planejado, salvo evidência local. | Refinar PBIs na P0-003. |
| `planejamento/roadmap-consolidado-blindspot.md` | Fases, maturidade e dependências. | Roadmap. | Parcial/planejado por fase. | Não é cronograma confirmado. |
| `planejamento/insumos-para-backlog-tecnico-ex-prompt.md` | Lacunas técnicas e ordem de estabilização. | Roadmap e features E01/E05. | Planejado. | Converter em tasks após gates. |
| `planejamento/pendencias-e-incertezas-blindspot.md` | Decisões e métricas abertas. | Source inventory e roadmap. | A revisar. | Resolver por decisão/evidência futura. |
| `planejamento/2026-08-31-entregas-sprints-3-e-4-challenge-ford.md` | Evidências acadêmicas de Sprint 3/4. | Roadmap e features E04/E05. | Contexto acadêmico. | Não comprova runtime; datas devem ser revalidadas. |
| `dados-ia/agente-de-ia-e-qualidade-de-dados-blindspot.md` | Hierarquia de fontes, status e risco de falsa confiança. | Features E01/E02. | Parcial; confrontado com schema. | Baseline e limiares permanecem abertos. |
| `dados-ia/variaveis-tecnicas-e-schema-blindspot.md` | Grupos e aplicabilidade geral/condicional/exclusiva. | Features E01 e roadmap. | Em validação. | Lista final e regras condicionais precisam de contrato/teste. |
| `dados-ia/ex-prompt-agente-schema-e-prompts.md` | 14 grupos/204 variáveis, prompt histórico e baseline. | Features E01/E05 e roadmap. | Parcial. | Runtime atual é a fonte de contrato; contagem de completude diverge. |
| `dados-ia/contexto-ia-precificacao-atualizada-blindspot.md` | Custos e precificação acadêmica. | Source inventory. | Proposta/medição contextual. | Não usar para release, custo ou preço atual sem revisão. |
| `arquitetura/arquitetura-e-stack-blindspot.md` | Componentes e stack discutidos. | Roadmap e features E04/E05. | Direcionamento. | Tecnologias não estão aprovadas/instaladas por esta fonte. |
| `arquitetura/prototipo-ex-prompt-arquitetura-e-estado.md` | Auditoria de API, UI, providers e persistência local. | README, features E01–E03/E05. | Evidência histórica confrontada com checkout. | Testes, banco, auth e observabilidade corporativa ausentes. |
| `arquitetura/ingestao-documental-docling.md` | Proveniência de PDF e limite de conversão. | Esta matriz e source inventory. | Contexto de documentação. | Não implica feature de produto BlindSpot. |
| `decisoes/decisoes-estruturantes.md` | Decisões preservadas e alternativas descartadas. | Roadmap e features E01/E05. | Decisão histórica. | Novas decisões exigem ADR/Gate local. |
| `negocio/modelo-de-receita-e-ponto-de-equilibrio-blindspot.md` | Planos, custos e breakeven históricos. | Source inventory. | Proposta/modelo histórico. | Premissas e números conflitantes exigem validação financeira. |
| `negocio/negocio-canvas-e-pitch-blindspot.md` | Canvas, narrativa e canais. | README e features E03/E04. | Proposta contextual. | Não comprova mercado ou implementação. |
| `negocio/pitch-ultimo-semestre-blindspot.md` | Pitch, promessa e roadmap narrativo. | README, roadmap e source inventory. | Experimento/narrativa. | Metas e datas não são evidência operacional. |
| `negocio/precificacao-operacional-do-mvp-blindspot.md` | Cenário acadêmico de custo operacional. | Source inventory. | Proposta/estimativa. | Requer revisão antes de decisão comercial. |
| `fontes/2026-06-11-blindspot-contexto-consolidado-original.md` | Contexto histórico consolidado. | Source inventory. | Histórico. | Não prevalece sobre fontes específicas ou runtime. |
| `fontes/2026-08-20-blindspot-pitch-ultimo-semestre-transcricao.md` | Conteúdo textual do pitch. | Source inventory e roadmap. | Contexto de pitch. | Não comprova runtime. |
| `fontes/2026-08-20-blindspot-pitch-ultimo-semestre.pdf` | Fonte visual do pitch, coberta pela transcrição para esta auditoria. | Source inventory. | Contexto de pitch. | Inspeção visual pendente se for necessária citação de slide/diagrama. |
| `fontes/2026-08-31-ford-v2-challenge-sprints-3-e-4-docling.md` | Requisitos acadêmicos e material textual de Sprint. | Roadmap e features E04/E05. | Contexto acadêmico. | Não comprova implementação. |
| `fontes/2026-08-31-ford-v2-challenge-sprints-3-e-4.pdf` | Fonte visual das Sprints, coberta pela conversão e síntese textual nesta auditoria. | Source inventory. | Contexto acadêmico. | Inspeção visual pendente se for necessária citação de página/diagrama. |
| `visuais/contexto-recuperado.md` | Material recuperado do BrightSpot. | Esta matriz. | Fora do escopo. | Não deve orientar produto automotivo BlindSpot. |
| `visuais/Excalidraw/drawing-2026-06-10-21-24-21-excalidraw.md` | Não inspecionado: a nota textual já identifica o desenho como BrightSpot. | Esta matriz. | Fora do escopo. | Inspecionar somente se surgir evidência de conteúdo BlindSpot não presente em texto. |
| `packages/agent-runtime/assets/` | Prompt, schema e mock realmente lidos em runtime. | README, features e contratos técnicos. | Implementado/canônico. | Governança de versão e sincronização ainda pendentes. |
| `services/api/`, `apps/web/`, `docs/architecture/agent-core/`, `evidence/` | API, UI, validação, rotas, baseline e evidência local. | README, features e roadmap. | Implementado parcial. | `agent-core` ainda cita `server/` e `prompt-assets/`; o runtime atual usa `services/api/` e `packages/agent-runtime/assets/`. Correção fica pendente em task documental própria, pois esta P0 limita alterações a `docs/product/`. |

## Leitura da cobertura

- **Implementado** requer evidência do checkout local, não apenas fonte do Bedrock.
- **Parcial** indica que há código ou experimento, mas faltam testes, governança, segurança operacional ou prontidão corporativa.
- **Planejado**, **proposta** e **experimento** descrevem intenção ou evidência limitada e não autorizam alteração de runtime.
- A P0-003 deve consumir esta matriz para transformar o catálogo em backlog sem perder a origem de cada item.
