# ✅ Concluída — Transformar catálogo de features em backlog detalhado do BlindSpot

> Prioridade: P0
>
> Área afetada: produto, planejamento, rastreabilidade e documentação
>
> Origem ou referência: `docs/product/features/README.md`, P0-002 e acervo BlindSpot auditado
>
> Arquitetura: `APPROVED — Lucas autorizou a execução após a conclusão da P0-002; revisão documental ampliada explicitamente autorizada em 2026-09-07`

## Pedido

Transformar todo o catálogo de features do BlindSpot em um backlog completo, detalhado e navegável. A entrega deve aprofundar os épicos e stories existentes, decompondo-os em capabilities, Product Backlog Items, tasks e subtasks com prioridades, dependências, riscos, critérios de aceite e definição de pronto.

O agente pode assumir itens de planejamento quando isso destravar uma decomposição útil, desde que cada suposição seja explícita, rastreável, proporcional ao risco e revisável por Lucas. O resultado passará primeiro por double-check do agente e depois por double-check humano antes de ser aceito como backlog de referência.

## Resultado esperado

Criar em `docs/product/` um backlog que permita responder, para cada iniciativa:

1. qual problema ou resultado de produto ela atende;
2. qual épico, feature, RF e fonte a sustentam;
3. para quem ela gera valor e qual é o fluxo esperado;
4. qual estado atual foi comprovado, qual é planejado e o que é apenas proposta;
5. quais dependências, riscos, fronteiras de segurança e decisões pendentes existem;
6. qual entrega mínima verificável cabe em uma task; e
7. em que release ou fase de roadmap ela pode entrar, sem transformar plano em promessa de implementação.

## Estrutura obrigatória do backlog

- Índice executivo por épico, estado, prioridade e dependência crítica.
- Um capítulo para cada épico E01–E05 já presente no catálogo, com capacidade, story, PBI, task e subtask.
- Matriz RF01–RF13 com origem, épico, story, estado, dependências, prioridade e destino no backlog.
- Para cada PBI: problema, pessoa usuária/operadora, fluxo, fora do escopo, critérios de aceite observáveis, riscos, evidência necessária e Definition of Done.
- Trilhas transversais de qualidade de dados, segurança, privacidade, testes, acessibilidade, observabilidade, documentação e governança.
- Sequência de releases/fases apenas como proposta: núcleo de qualidade, persistência, comparação/exportação, identidade/consumo, operação/piloto e escala.
- Registro de suposições com identificador, racional, impacto, confiança, como validar e condição que a invalida.
- Registro de decisões pendentes que não podem ser assumidas com segurança, incluindo provider final, tenancy, retenção, política de release, versão de schema, metas quantitativas e integrações externas.

## Critérios de aceite

- [x] O backlog cobre todos os épicos E01–E05 e RF01–RF13, sem requisito órfão nem item sem origem.
- [x] Cada PBI contém valor, fluxo, estado, prioridade, dependências, riscos, critérios de aceite e Definition of Done.
- [x] Itens implementados, parciais, planejados, propostas, experimentos e pendências ficam visualmente distintos.
- [x] Comparação (RF07), persistência/histórico (RF12), identidade/organizações/consumo (RF09–RF11) e observabilidade (RF13) têm decomposição suficiente, mas não são declarados implementados sem evidência local.
- [x] Suposições estão identificadas e não substituem decisões de segurança, contrato, provider, schema, persistência ou dados corporativos.
- [x] A priorização explica valor, risco, dependência e redução de incerteza; não é apenas uma ordenação intuitiva.
- [x] O backlog cita a matriz da P0-002 e o catálogo/roadmap de produto, sem duplicar nem contradizer a fonte de runtime.
- [x] O double-check interno registra cobertura, coerência de dependências, estados de ausência/erro, riscos e lacunas reais.
- [x] O double-check humano de Lucas está solicitado e registrado antes de marcar a task como `✅ Concluída`.
- [x] Nenhum segredo, log, snapshot bruto de LLM, `.env` ou configuração externa é copiado.

## Restrições e contexto

- Dependência de ordenação: P0-002 deve estar concluída ou ter sua matriz de cobertura explicitamente aceita antes da consolidação final, para evitar backlog baseado em fonte não auditada.
- Ler antes de executar: `AGENTS.md`, perfil/estratégia do PDK, P0-002, `docs/product/features/README.md`, `roadmap.md`, `source-inventory.md`, matriz de cobertura quando existir e contratos técnicos em `docs/architecture/agent-core/`.
- Código e assets em `packages/agent-runtime/assets/`, `services/api/`, `apps/web/` e `evidence/` vencem documentos históricos quando houver conflito sobre capacidade atual.
- Esta task altera apenas documentação de produto/planejamento e a própria task. Não cria schema, prompt, provider, endpoint, UI, banco, dependência, automação, release publicada ou integração externa.
- Mudanças materiais derivadas do backlog exigem task própria, Architecture Gate e, quando aplicável, revisão de segurança e release management.

## Protocolo de suposições

O agente pode preencher lacunas de planejamento apenas quando a hipótese não decidir contrato técnico, acesso, segurança, dado sensível, custo, SLA ou integração externa. Cada hipótese deve usar o formato:

`A-<número> | hipótese | racional/evidência | impacto | confiança | como validar | condição de invalidação`.

Exemplos aceitáveis: agrupamento inicial de PBIs, ordem de investigação ou granularidade de task. Exemplos não assumíveis: política de retenção, autorização multi-tenant, fornecedor final, custo, meta de SLA, schema final, criptografia de aplicação ou acesso a dados de clientes.

## Double-check obrigatório do agente

Antes de declarar `READY` para a revisão humana, o agente deve:

1. reabrir o backlog, catálogo, roadmap, matriz de cobertura e contratos técnicos citados;
2. conferir que RF01–RF13 aparecem uma vez na matriz de rastreabilidade e pelo menos uma vez em um PBI pertinente;
3. verificar que cada PBI tem estado, dependência, critério observável e evidência esperada;
4. procurar dependências circulares, prioridade incompatível, feature sem fluxo e plano apresentado como implementação;
5. revisar cenários de ausência, erro, conflito de fonte, acesso indevido, indisponibilidade e rollback nos itens onde forem aplicáveis;
6. confrontar afirmações de capacidade com runtime, API, UI e evidências locais;
7. rodar verificação de links relativos, varredura documental de segredo e `git diff --check`; e
8. registrar achados, lacunas e suposições que exigem decisão de Lucas.

## Double-check humano de Lucas

Após o double-check interno, o agente deve apresentar uma síntese contendo: mapa de épicos, prioridades, releases/fases propostas, decisões pendentes, suposições e riscos. A task fica `🚧 Em execução — aguardando double-check de Lucas` até que Lucas aprove ou peça ajustes. Somente então o resultado pode ser marcado como `✅ Concluída`.

## Arquitetura proposta

### Decisão e escopo

Criar um backlog de referência em `docs/product/backlog.md`, derivado do catálogo E01–E05, dos RF01–RF13 e da matriz auditável produzida pela P0-002. O documento será a camada de planejamento detalhado: não substitui o catálogo de features, o roadmap, os contratos técnicos ou os assets canônicos de runtime.

O backlog usa quatro níveis estáveis: **Épico → Capability → Product Backlog Item (PBI) → Task/Subtask**. Cada PBI recebe identificador, estado, prioridade, objetivo, pessoa usuária/operadora, fluxo, dependências, riscos, fronteiras, critérios de aceite, Definition of Done, evidência e ligação para fonte/RF. A granularidade deve permitir que PBIs futuros sejam convertidos em tasks de fila sem reescrever a decisão de produto.

O escopo documental permite suposições de organização e fatiamento; decisões que mudem contrato, segurança, provider, schema, persistência, preço, SLA, dados corporativos ou integração permanecem como pendências. P0-002 é dependência obrigatória: sem sua matriz concluída ou aceita, a P0-003 produz no máximo um rascunho não consolidado e não pode declarar o backlog como referência.

### Fluxo da pessoa operadora

1. A pessoa abre o índice executivo e identifica a fase/release proposta, épico, estado e dependência crítica.
2. Seleciona um PBI e encontra valor, fluxo esperado, RFs, fontes, riscos, critérios e a menor task verificável.
3. Confere no catálogo e nos contratos técnicos se a capacidade já existe, é parcial ou só planejada.
4. Usa a seção de suposições e decisões pendentes para distinguir planejamento útil de escolha que requer autoridade.
5. Depois do double-check interno, Lucas revisa prioridades, fases, suposições e riscos; somente sua aprovação torna o documento backlog de referência.

### Organização e modelo de informação

- `docs/product/backlog.md`: índice executivo, convenções, fases/releases propostas, épicos e PBIs detalhados.
- Se a profundidade exigir, `docs/product/backlog/` pode conter um arquivo por épico, mantendo `backlog.md` como índice e matriz de rastreabilidade. A decisão de dividir depende de legibilidade após o primeiro rascunho.
- Uma matriz RF01–RF13 fica no próprio backlog ou em arquivo adjacente, mas cada requisito deve apontar para fonte, épico, capability, PBI, estado, dependências e prioridade.
- A matriz da P0-002 continua sendo a fonte de cobertura de documentos; o backlog apenas aponta para ela, sem duplicar seu inventário por fonte.
- Estados obrigatórios: `implementado`, `parcial`, `planejado`, `proposta`, `experimento`, `a revisar`, `fora do escopo`. Prioridade proposta: `agora`, `próximo`, `depois` e `futuro`, sempre acompanhada de justificativa de valor, risco e dependência.

### Fatiamento inicial proposto

| Fase proposta | Foco | Épicos principais | Critério de transição |
|---|---|---|---|
| Núcleo de qualidade | Schema, fixtures, validação, completude e baseline de IA. | E01, E05 transversal | Dados rastreáveis e validação mensurável. |
| Fundação de persistência | Histórico e versões de fichas validadas. | E01/E02/E05 | Release de banco aprovada e verificada. |
| Consulta e comparação | Consulta, histórico, comparação planejada e exportação preparada. | E02/E03 | Fichas versionadas e regras de comparação aprovadas. |
| Identidade e consumo | Organizações, papéis, isolamento e cotas. | E04 | Modelo de autorização e tenancy aprovados. |
| Operação e piloto | Observabilidade, segurança operacional, recuperação e piloto. | E05 | Controles e métricas evidenciados. |
| Escala | Expansão comercial e integrações. | Todos | Benefício, custo e qualidade comprovados no piloto. |

Essas fases são uma hipótese de planejamento, não cronograma, release publicada ou compromisso de escopo.

### Dados, confiabilidade, segurança e riscos

- O backlog só referencia caminhos, títulos, estados e decisões; não copia `.env`, credenciais, prompts privados, logs, snapshots ou configurações externas.
- A origem de uma afirmação de capacidade é sempre runtime/API/UI/evidence local; fontes Bedrock, pitch e material acadêmico são contexto classificado.
- PBIs de E04 e E05 devem registrar gates de segurança antes de propor mudança de autenticação, autorização, dados corporativos, provider, persistência, integração, CI/CD ou infraestrutura.
- Riscos centrais: requisitos duplicados, dependência circular, falsa aparência de implementação, backlog excessivamente granular e suposição indevida. Controles: ID único, matriz RF, estados explícitos, justificativa de prioridade, registro de suposições e double-check.

### Plano incremental e verificações

1. Confirmar que P0-002 concluiu ou recebeu aceite explícito para sua matriz de cobertura; se não, manter P0-003 pendente.
2. Extrair épicos, stories, RFs, estados e dependências do catálogo/roadmap já auditados.
3. Montar a matriz RF e o índice executivo; decompor por fases, capabilities e PBIs.
4. Registrar suposições permitidas e decisões pendentes; não preencher lacunas de segurança ou contrato por inferência.
5. Fazer o double-check interno exigido na task e corrigir todos os achados documentais possíveis.
6. Verificar links relativos, padrões de segredo e `git diff --check`; então apresentar a síntese para o double-check humano de Lucas.

## Double-check da arquitetura

- Confirmado: o catálogo contém E01–E05 e RF01–RF13, com estados que distinguem implementação parcial de planejamento.
- Confirmado: roadmap já define dependências entre qualidade, persistência, comparação, identidade e operação; a arquitetura preserva essa sequência como proposta, não como cronograma.
- Confirmado: P0-002 produziu a matriz de cobertura auditada e foi concluída; a dependência documental para consolidar o backlog foi satisfeita.
- Conferido: a task proíbe alterações em runtime, API, schema, prompt, UI, banco e integrações; o plano limita a entrega a documentação e à própria task.
- Estados de ausência tratados: fonte não auditada, RF sem destino, PBI sem evidência, dependência circular, hipótese de alto risco e backlog aguardando revisão humana.
- Risco residual: a priorização proposta pode não refletir decisão de negócio atual; ela ficará explicitamente como hipótese até o double-check de Lucas. Responsável por aceitar o risco residual: Lucas.

## Resultado do agente

_Preenchido pelo agente. Não apague o pedido original._

- Estado: `✅ Concluída — aprovada explicitamente por Lucas em 2026-09-07 após double-check humano.`
- Arquitetura: `APPROVED — revisão documental ampliada autorizada explicitamente por Lucas em 2026-09-07`. O preflight está em `docs/product/archive/p0/p0-003-preflight.md`; a revisão proporcional de segurança está em `docs/product/archive/p0/security-review-p0-003.md`.
- Implementação: backlog refeito em `docs/product/backlog.md` a partir da conversão Docling Ford indicada por Lucas, com fluxo corporativo de cadastro, aprovação, convite, login, recuperação, MFA, SSO, RBAC, auditoria, gestão de membros, consumo, alertas, qualidade, catálogo, comparação, exportação e operação. Não houve alteração de runtime, API, schema, prompt, UI, banco, provider, integração ou release publicada.
- Rastreabilidade: 5 épicos, 12 features listadas na fonte e as tasks extraídas 1.1.1 até a abertura de 3.3.2 foram incorporados. A conversão possui 328 linhas e termina nesse ponto; partes posteriores foram tratadas como propostas explícitas, sem alegar que vieram do PDF.
- Arquivos alterados: `docs/product/backlog.md`, `docs/product/archive/p0/p0-003-preflight.md`, `docs/product/archive/p0/security-review-p0-003.md`, `docs/product/README.md`, `docs/product/source-inventory.md` e esta task.
- Verificação: AGENTS, perfil, estratégia, task, catálogo, roadmap, matriz, inventário, contratos agent-core e fonte externa relidos. Checagem estática encontrou 21 PBIs, todos com problema/pessoa/fluxo, fora do escopo, tasks/subtasks, aceite/evidência/DoD e prioridade/dependência/risco/fonte; RF01–RF13 estão presentes. Links do README, varredura dos novos documentos e `git diff --no-index --check` passaram. A varredura conjunta também encontra o literal `.env` em duas restrições preexistentes da própria task; é texto de política, não segredo.
- Achados/lacunas: provider, schema final, tenancy, retenção, sessões, MFA/SSO, métricas, SLI/SLO/SLA, integrações, cotas, política de exportação e release continuam como decisões pendentes. A arquitetura técnica ainda contém caminhos históricos fora do escopo desta task. O backlog Ford convertido não contém o detalhe textual após o início da task 3.3.2; usar o PDF original se for necessária confirmação visual ou conteúdo posterior.
- Próximo passo: selecionar uma task futura da fila para uma mudança material específica; não iniciar automaticamente auth, persistência, comparação, exportação, integração ou operação apenas porque constam do backlog.
