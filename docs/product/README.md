# BlindSpot — produto e backlog

O BlindSpot é uma plataforma de inteligência competitiva automotiva. Ela transforma fontes técnicas dispersas em fichas estruturadas, rastreáveis e comparáveis, para apoiar decisões de produto, engenharia, marketing, preço e posicionamento.

Este diretório é a referência navegável para produto e planejamento. O contrato executável não mora aqui: prompt, schema e mock canônicos ficam em [`../../packages/agent-runtime/assets/`](../../packages/agent-runtime/assets/). A documentação técnica do comportamento hoje implementado fica em [`../architecture/agent-core/`](../architecture/agent-core/).

## Como navegar

| Documento | Uso |
|---|---|
| [Catálogo de features](features/README.md) | Épicos, stories, tasks, subtasks, requisitos e estados. |
| [Roadmap e estado atual](roadmap.md) | Fases, dependências e leitura correta da maturidade do produto. |
| [Inventário de fontes](source-inventory.md) | Procedência, classificação e limites do material consolidado. |
| [Matriz de cobertura](coverage-matrix.md) | Fontes efetivamente auditadas, destino, classificação e lacunas. |
| [Backlog detalhado](backlog.md) | Decomposição proposta de épicos, capabilities, PBIs e entregas verificáveis. |
| [Fluxograma visual para desenvolvimento do agente](fluxograma-desenvolvimento-agente.md) | Referência principal em Markdown: jornada, exceções, requisitos e fluxo técnico verificável do agente. |
| [Fluxo de refatoração da experiência](fluxograma-refatoracao-experiencia.md) | Proposta de jornadas e arquitetura de informação para UX/UI; não substitui o fluxo funcional comprovado. |
| [Auditoria UX/UI do estado atual](ux-ui-auditoria-estado-atual.md) | Baseline visual, achados por jornada, evidências e limites de validação. |
| [Direção UX/UI alvo e decisões](ux-ui-direcao-alvo-e-decisoes.md) | Arquitetura de informação, jornadas alvo, decisões e invariantes da refatoração. |
| [Roadmap UX/UI de refatoração](ux-ui-roadmap-e-backlog.md) | Ordem de implementação, marcos e tasks PDK derivadas. |
| [Design System](design-system.md) | Fonte de verdade da refatoração visual, dos tokens futuros, componentes e referências aprovadas. |
| [Image System](image-system.md) | Linguagem visual, papéis, seleção, rastreabilidade e fallback de imagens/ilustrações. |
| [Arquitetura visual P1-038](p1-038-arquitetura-visual-acesso-cadastro-espera.md) | Composição e experiência aprováveis para acesso, cadastro e espera antes da implementação. |
| [Arquivo de decisões P0](archive/README.md) | Preflights e revisões de segurança preservados para auditoria, fora da navegação diária. |
| [Contrato HTTP atual](../architecture/agent-core/HTTP_PIPELINE.md) | Rotas implementadas e pipeline da API. |
| [Contrato de entrada](../architecture/agent-core/VEHICLE_INPUT_SPEC.md) | Payload de veículo aceito pela API. |
| [Validação e tipos](../architecture/agent-core/VALIDATION_AND_TYPES.md) | Schema, fontes e erros de validação. |

## Problema e proposta de valor

Equipes de montadoras consultam sites oficiais, catálogos, PDFs, mídia especializada e planilhas para pesquisar veículos concorrentes. Esse processo tende a ser manual, repetitivo e difícil de auditar; também facilita mistura de mercado, versão, ano-modelo ou motorização.

O BlindSpot recebe a identidade do veículo, coleta evidências com apoio de IA, normaliza a saída no schema, expõe o status de cada dado e mantém os vínculos de fonte. A geração por IA não é, sozinha, o valor do produto: validação, padronização, rastreabilidade e capacidade futura de comparação são partes obrigatórias da proposta.

Caso inicial: Ford. A arquitetura e o catálogo não restringem o produto à Ford nem assumem que todas as capacidades corporativas já existam.

## Estado do produto — leitura em 2026-09-06

| Capacidade | Estado | Evidência |
|---|---|---|
| Solicitar ficha técnica por veículo | Implementado em protótipo | `POST /api/ficha-tecnica`; UI web. |
| Compor prompt e chamar LLM | Implementado parcialmente | Providers simulated, Claude e OpenRouter. |
| Validar schema e referências de fonte | Implementado | AJV e validação de `fonte_ref`. |
| Exibir ficha, status e fontes | Implementado parcialmente | UI e rotas de última ficha/histórico. |
| Persistência versionada em banco | Planejado | Histórico atual usa arquivos locais; ver task P1. |
| Comparador, exportação, organizações e consumo | Planejado | Requisitos de produto, sem implementação comprovada neste checkout. |
| Observabilidade operacional, segurança e SLA | Planejado | Há logs locais e health endpoint; não há evidência de operação produtiva. |

Os estados são deliberadamente conservadores: um pitch, uma decisão de arquitetura ou um experimento não comprovam uma capacidade produtiva.

O catálogo é sustentado por uma [matriz de cobertura](coverage-matrix.md): documentação histórica dá contexto, mas assets, API, UI e evidências locais prevalecem quando houver divergência.

## Princípios de produto e dados

1. Não misturar ano-modelo, mercado, versão ou motorização.
2. Não apresentar dado sem evidência como confirmado.
3. Preservar ausência, conflito e inaplicabilidade em vez de preencher artificialmente lacunas.
4. Priorizar fontes oficiais; fontes secundárias servem de apoio conforme a hierarquia documentada.
5. Apenas fichas validadas podem alimentar comparações e histórico reutilizável.
6. Mudanças de schema, prompt, provider, endpoint ou persistência passam pelo Architecture Gate.
7. Segredos, logs e snapshots brutos de LLM não entram nesta documentação nem no Git.

## Convenção de backlog

- **Épico**: resultado de produto persistente, por exemplo gerar fichas rastreáveis.
- **Story**: necessidade observável de uma pessoa usuária ou operadora.
- **Task**: mudança verificável, com dono, escopo e critério de aceite.
- **Subtask**: passo técnico ou de pesquisa que reduz a task sem criar uma entrega independente.

Uma entrada de backlog não altera o estado do código. O catálogo usa `implementado`, `parcial`, `planejado`, `em validação` ou `futuro`; cada alteração material deve virar task na fila com arquitetura aprovada.
