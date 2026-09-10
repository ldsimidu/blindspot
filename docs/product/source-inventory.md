# Inventário de fontes de produto

Consulta realizada em `2026-09-06`. Este inventário permite separar conteúdo comprovado no checkout atual de contexto acadêmico e de propostas ainda abertas.

Para a cobertura completa — incluindo fonte lida, destino, classificação e lacuna — consulte a [matriz de cobertura](coverage-matrix.md). Este arquivo permanece como guia resumido de procedência.

## Fontes locais canônicas

| Fonte | Papel | Classificação |
|---|---|---|
| `packages/agent-runtime/assets/` | Prompt, schema e mock lidos em runtime. | Canônica de runtime. |
| `services/api/` | API Express, validação, LLM, logs e tipos. | Evidência de implementação. |
| `apps/web/` | Interface de solicitação, leitura de ficha e histórico. | Evidência de implementação. |
| `docs/architecture/agent-core/` | Contratos técnicos que espelham o código. | Documentação técnica local. |
| `docs/migration/2026-09-06-ex-prompt.md` | Limites da migração e baseline do repositório. | Histórico de migração. |

## Fontes consolidadas importadas como contexto

Os documentos abaixo foram lidos no acervo `C:\Users\lucas\Documents\bedrock\knowledge\01-fiap\corventures\blindspot`. O conteúdo foi sintetizado em `docs/product/`, mantendo seus estados e incertezas; não foram copiados segredos, dependências, logs ou snapshots.

| Origem | Conteúdo aproveitado | Tratamento |
|---|---|---|
| `planejamento/backlog-requisitos-e-roadmap-blindspot.md` | Épicos iniciais, RF01–RF13, regras de negócio e não funcionais. | Backlog de produto; requisitos futuros permanecem planejados. |
| `planejamento/roadmap-consolidado-blindspot.md` | Fases, estado do protótipo e ordem de evolução. | Roadmap com status conservador. |
| `planejamento/insumos-para-backlog-tecnico-ex-prompt.md` | Lacunas técnicas e sequência recomendada para estabilizar o núcleo. | Dependências de tasks futuras. |
| `planejamento/2026-08-31-entregas-sprints-3-e-4-challenge-ford.md` | Evidências acadêmicas esperadas. | Contexto de entrega; não comprova implementação. |
| `planejamento/pendencias-e-incertezas-blindspot.md` | Decisões e métricas ainda abertas. | Riscos e pendências explícitos. |
| `produto/contexto-do-produto-blindspot.md` | Problema, stakeholders, caso inicial e proposta. | Contexto de produto. |
| `produto/proposta-de-valor-completa-blindspot.md` | Benefícios, metas propostas e riscos de qualidade. | Metas numéricas tratadas como propostas. |
| `arquitetura/arquitetura-e-stack-blindspot.md` | Componentes e tecnologias discutidas. | Direcionamento, não contrato de runtime. |
| `dados-ia/agente-de-ia-e-qualidade-de-dados-blindspot.md` | Regras de qualidade, status e hierarquia de fontes. | Regras de domínio, confrontadas com o schema local. |
| `decisoes/decisoes-estruturantes.md` | Decisões preservadas e propostas abertas. | Referência de decisão, sujeita ao Gate deste repo. |
| `fontes/2026-09-07-cf-backlog-ford-280426-232211-docling.md` | Backlog Ford com 5 épicos, 12 features e tasks até a abertura de 3.3.2. | Contexto da P0-003; conversão técnica de PDF, não evidência de runtime nem substituto de inspeção visual. |

## Regras de importação e manutenção

1. Uma fonte externa nunca substitui runtime, contrato ou evidência de teste local.
2. Informações marcadas como proposta, experimento ou alvo continuam com esse status em `docs/product/`.
3. Números de preço, custo, latência, SLA, cobertura ou cronograma precisam de fonte, data e validação atual antes de orientar decisão de implementação.
4. Nova importação deve registrar caminho, data de leitura, finalidade e classificação neste arquivo.
5. PDFs e material visual devem ser citados pela fonte original; conversões textuais ajudam busca, mas não substituem inspeção visual quando ela for necessária.
6. Material marcado como pertencente ao BrightSpot ou a outro produto é `fora do escopo` e não pode orientar decisões do BlindSpot.
