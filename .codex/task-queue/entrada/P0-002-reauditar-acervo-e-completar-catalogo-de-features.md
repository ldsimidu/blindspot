# ✅ Concluída — Reauditar acervo BlindSpot e completar catálogo de features

> Prioridade: P0
>
> Área afetada: documentação de produto, backlog, rastreabilidade de fontes e contratos documentais
>
> Origem ou referência: auditoria de 2026-09-06 sobre a P0-001 e acervo em `C:\Users\lucas\Documents\bedrock\knowledge\01-fiap\corventures\blindspot`
>
> Arquitetura: `APPROVED — Lucas autorizou a execução em 2026-09-06`

## Pedido

Revisar novamente todo o conteúdo consolidado do BlindSpot no Bedrock e corrigir/completar o catálogo de features em `docs/product/`. A P0-001 criou uma base útil, mas não registrou na própria task a comparação de fichas técnicas e não demonstrou, por uma matriz auditável, quais fontes do acervo foram realmente analisadas e em que parte do catálogo cada uma aparece.

O resultado deve tornar recuperável a relação entre cada capacidade, requisito, decisão, incerteza, evidência técnica e fonte. A entrega é documental e de planejamento: não implementa comparador, exportação, autenticação, banco, provider, schema, prompt, API, UI, CI/CD ou infraestrutura.

## Fontes obrigatórias a reanalisar

Ler e registrar a cobertura de, no mínimo:

- `desenvolvimento-do-blindspot.md`;
- `produto/contexto-do-produto-blindspot.md` e `produto/proposta-de-valor-completa-blindspot.md`;
- `planejamento/backlog-requisitos-e-roadmap-blindspot.md`, `planejamento/roadmap-consolidado-blindspot.md`, `planejamento/insumos-para-backlog-tecnico-ex-prompt.md`, `planejamento/pendencias-e-incertezas-blindspot.md` e `planejamento/2026-08-31-entregas-sprints-3-e-4-challenge-ford.md`;
- `dados-ia/agente-de-ia-e-qualidade-de-dados-blindspot.md`, `dados-ia/variaveis-tecnicas-e-schema-blindspot.md`, `dados-ia/ex-prompt-agente-schema-e-prompts.md` e `dados-ia/contexto-ia-precificacao-atualizada-blindspot.md`;
- `arquitetura/arquitetura-e-stack-blindspot.md`, `arquitetura/prototipo-ex-prompt-arquitetura-e-estado.md` e `arquitetura/ingestao-documental-docling.md`;
- `decisoes/decisoes-estruturantes.md`;
- `negocio/` completo;
- `fontes/2026-06-11-blindspot-contexto-consolidado-original.md`, o pitch/transcrição e o material das Sprints 3 e 4 como fontes de contexto, não como comprovação de runtime;
- `visuais/` somente quando trouxer contexto de produto não presente nas fontes textuais.

Também confrontar cada afirmação de capacidade atual com `packages/agent-runtime/assets/`, `services/api/`, `apps/web/`, `docs/architecture/agent-core/` e `evidence/`. Código e assets de runtime vencem documentação histórica quando houver divergência.

## Escopo de correção e completude

1. Criar uma matriz de cobertura em `docs/product/` que contenha, para cada fonte: caminho no Bedrock, data de leitura, temas aproveitados, documento/seção destino, classificação (`implementado`, `parcial`, `planejado`, `proposta`, `experimento`, `a revisar` ou `fora do escopo`) e lacuna restante.
2. Revisar `docs/product/README.md`, `features/README.md`, `roadmap.md` e `source-inventory.md` para que o catálogo não afirme cobertura integral sem evidência.
3. Preservar os RF01–RF13 e explicitar para cada um: épico, story, estado, dependências e fonte de origem. Requisito acadêmico, meta, métrica, stack discutida, preço ou decisão de negócio não pode virar capacidade implementada sem evidência no checkout.
4. Registrar as frentes que hoje não aparecem com detalhe suficiente: domínio de variáveis gerais/condicionais/exclusivas; regras por propulsão, carroceria, tração e conectividade; hierarquia de fontes; qualidade por campo; baseline de provider; divergência de completude; versionamento e sincronização de schema/prompt; persistência e histórico; segurança, observabilidade, piloto e operação comercial.
5. Corrigir referências documentais que apontem para caminhos obsoletos, como `server/` ou `prompt-assets/`, quando o runtime atual usar `services/api/` e `packages/agent-runtime/assets/`. Não alterar runtime para fazer a documentação parecer correta.

## Comparação de fichas técnicas — requisito obrigatório

Documentar a comparação como capacidade planejada, rastreável e dependente do núcleo de qualidade de dados. O catálogo deve conter, no mínimo:

- RF07 ligado a um épico e story próprios, com origem explícita no backlog do Bedrock;
- pré-requisito de fichas validadas, versionadas e com fonte/status por campo;
- entrada conceitual: dois ou mais veículos/configurações identificados por marca, modelo, versão, ano-modelo, mercado e versão da ficha;
- saída conceitual: campos comparáveis lado a lado, unidade, valor, status, `fonte_ref`, observação e diferença detectada;
- regra para `nao_aplicavel`, `nao_encontrado`, `parcial`, `conflitante` e `inferido_minimamente`, sem transformar ausência em equivalência;
- preservação de mercado, ano, versão e motorização em cada lado para impedir comparação inválida;
- estados de interface previstos: seleção incompleta, ficha inexistente, ficha inválida, versões históricas, fonte divergente e ausência de dado;
- dependências explícitas de persistência versionada, autorização, limites de desempenho, exportação e auditoria;
- confirmação explícita de que não há comparador implementado neste checkout.

## Critérios de aceite

- [x] Há matriz de cobertura para todas as fontes obrigatórias, sem alegação de que fonte não lida foi sintetizada.
- [x] Cada RF01–RF13 possui destino rastreável, estado e fonte; RF07 aparece tanto na P0-002 quanto no catálogo de features.
- [x] A comparação de fichas técnicas contém pré-requisitos, contrato conceitual, regras de qualidade, estados de falha e dependências, e permanece marcada como planejada.
- [x] Capacidades do protótipo foram conferidas contra runtime, API, UI e evidências locais; divergências documentais foram marcadas como pendentes quando fora do recorte.
- [x] Decisões, métricas, preço, stack, requisitos acadêmicos e pitch recebem classificação correta e não são apresentados como funcionalidade entregue.
- [x] Não foram copiados `.env`, tokens, prompts privados, logs ou snapshots brutos de LLM.
- [x] Links relativos em `docs/product/` passaram, `git diff --check` passou e o resultado registra verificações, bloqueios e lacunas.

## Restrições ou contexto

- Antes de executar, ler `AGENTS.md`, perfil do PDK, estratégia de verificação, esta task e as fontes obrigatórias.
- Esta task altera somente documentação de produto/planejamento e a própria task, salvo Architecture Gate posterior aprovar outro recorte.
- Não modificar P0-001 concluída; registrar nesta task as lacunas encontradas e as correções realizadas.
- Não consultar Jira, Confluence, providers LLM, banco, deploy ou repositórios externos sem autorização específica.
- Alterações materiais de contrato, schema, prompt, API, UI, persistência, segurança ou automação exigem Architecture Gate próprio e permanecem fora do escopo.

## Arquitetura proposta

### Decisão e escopo

Executar uma reauditoria documental em duas camadas, sem alterar runtime:

1. **Camada de evidência técnica atual** — `packages/agent-runtime/assets/`, `services/api/`, `apps/web/`, `docs/architecture/agent-core/` e `evidence/` definem o que pode ser chamado de implementado ou parcial neste checkout.
2. **Camada de contexto e planejamento** — o acervo Bedrock fornece requisitos, decisões, hipóteses, métricas, histórico acadêmico e direções de produto. Nenhuma dessas afirmações substitui código, assets de runtime ou evidência local.

O resultado será um catálogo de produto auditável em `docs/product/`: uma matriz por fonte, links de cada RF01–RF13 para épico e story, e um contrato conceitual completo para comparação de fichas (RF07). A P0-001 concluída será preservada; as correções e lacunas serão registradas nesta task e nos documentos de produto existentes. O escopo não inclui implementação de capacidade alguma.

### Fluxo da pessoa operadora

1. A equipe abre o índice de produto e localiza uma capacidade ou RF.
2. O catálogo apresenta o estado (`implementado`, `parcial`, `planejado`, `proposta`, `experimento`, `a revisar` ou `fora do escopo`), dependências e vínculo com sua fonte.
3. A matriz de cobertura informa que fonte foi lida, em que data, quais temas foram aproveitados e para que seção do catálogo ela aponta.
4. Quando a pessoa precisar confirmar se algo funciona hoje, ela segue para a evidência técnica local, e não para pitch, backlog histórico ou material acadêmico.
5. Antes de derivar código do catálogo, uma nova task recebe Architecture Gate específico.

### Organização da informação

- Criar `docs/product/coverage-matrix.md` como índice de auditoria de fontes e destinos documentais.
- Revisar `source-inventory.md` para conter somente uma visão resumida; a matriz é a fonte detalhada de cobertura.
- Revisar `features/README.md` para: mapear cada RF01–RF13 para épico, story, estado, dependências e fonte; separar capacidades atuais, planejadas, propostas e experimentos; detalhar RF07 sem sugerir comparador implementado.
- Revisar `README.md` e `roadmap.md` apenas onde houver divergência, lacuna de rastreabilidade ou afirmação excessiva de maturidade.
- Referências internas devem usar os caminhos atuais (`services/api/` e `packages/agent-runtime/assets/`). Caminhos de `server/` e `prompt-assets/` são preservados somente como contexto histórico, rotulados como tal.

### Regras de confiabilidade

- Leitura não equivale a comprovação: a matriz deve registrar `lida e sintetizada`, `lida somente como contexto`, `não aplicável` ou `pendente de inspeção visual`, conforme cada fonte.
- PDFs, pitch e requisitos de Sprint são evidência de contexto ou de entrega acadêmica, não de runtime. Arquivos visuais são lidos somente quando adicionarem informação não disponível em texto, e sua contribuição é registrada.
- Não copiar `.env`, tokens, prompts privados, logs, snapshots ou arquivos gerados. Documentos sobre prompt serão consultados apenas para identificar contrato histórico, divergência de caminho ou decisão; o conteúdo executável continua sob os assets canônicos.
- Números de preço, prazo, custo, SLA, latência, cobertura e metas receberão `proposta`, `medição pontual` ou `a validar` até terem fonte, método, data e evidência operacional atuais.

### Comparação de fichas — contrato conceitual planejado

RF07 será registrado como capacidade planejada em épico e story próprios. A entrada conceitual contém dois ou mais identificadores de configuração: marca, modelo, versão, ano-modelo, mercado e versão da ficha. A saída apresenta campos comparáveis lado a lado, unidade, valor, status, `fonte_ref`, observação e diferença detectada.

O comparador não deduz equivalência quando um campo é `nao_aplicavel`, `nao_encontrado`, `parcial`, `conflitante` ou `inferido_minimamente`; mostra a condição e a evidência de cada lado. Mercado, ano, versão e motorização são invariantes de cada ficha e precisam permanecer visíveis. Estados previstos: seleção incompleta, ficha inexistente, ficha inválida, versões históricas, fonte divergente e ausência de dado.

Suas dependências explícitas são fichas validadas e versionadas, persistência, autorização organizacional antes de dados corporativos, política de desempenho, exportação autorizada e auditoria. Nenhuma rota, componente, tabela ou algoritmo de comparação será criado nesta task.

### Impacto técnico, dados e segurança

- Alteração limitada a Markdown em `docs/product/` e a esta task; sem alteração de endpoint, schema, prompt, provider, UI, persistência, dependência ou automação.
- A matriz armazena somente metadados de documentação (caminho, data de leitura, temas, destino, classificação e lacuna); não replica conteúdo sensível da origem.
- A revisão confronta contratos documentados contra assets e código, mas não executa providers LLM, banco, deploy, Jira, Confluence ou outros serviços externos.
- Risco principal: documentação histórica pode atribuir maturidade indevida ao produto. Controle: status explícito, fonte por afirmação e precedência de evidência técnica local.

### Plano incremental e verificações

1. Inventariar as fontes obrigatórias e definir a classificação inicial de cada uma, sem alegar síntese antes da leitura.
2. Ler as fontes textuais obrigatórias e as evidências técnicas locais; inspecionar apenas os visuais necessários para lacunas não resolvidas por texto.
3. Criar a matriz de cobertura e corrigir inventário, índice, roadmap e catálogo.
4. Mapear RF01–RF13 e detalhar RF07 contra o backlog de origem, marcando estado e dependências.
5. Reabrir documentos alterados, conferir cada link relativo, procurar referências obsoletas e executar `git diff --check`.
6. Executar varredura documental por padrões de segredo. `npm run typecheck` e `npm run build` não são necessários se a entrega continuar limitada a Markdown.

## Double-check da arquitetura

- Confirmado: a P0-002 é uma revisão documental e proíbe alterações de runtime, API, schema, prompt, UI, banco e integrações.
- Confirmado: o acervo Bedrock citado existe e contém as fontes obrigatórias; também há fontes de runtime, API, UI, arquitetura e baseline de evidência neste checkout para confronto.
- Confirmado: a P0-001 já possui catálogo, roadmap e inventário, mas não matriz detalhada nem contrato conceitual completo de comparação. A reauditoria deve corrigir essa lacuna sem alterar a P0-001 concluída.
- Estados de ausência cobertos: fonte não lida, fonte somente histórica, PDF que exige inspeção visual, referência obsoleta, afirmação sem evidência local e capacidade planejada sem implementação.
- Dependências e riscos foram delimitados; não há bloqueio para a revisão documental. O risco residual é a interpretação de fontes históricas, mitigado por classificação explícita e precedência do runtime. Responsável por aceitar o risco residual: Lucas.

## Resultado do agente

_Preenchido pelo agente. Não apague o pedido original._

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — Lucas autorizou a execução em 2026-09-06`
- Implementação: criada a matriz de cobertura do acervo; revisados índice, inventário, roadmap e catálogo de features; detalhados domínio condicional, baseline, RF01–RF13 e comparação planejada.
- Arquivos alterados: esta task; `docs/product/coverage-matrix.md`; `docs/product/README.md`; `docs/product/source-inventory.md`; `docs/product/features/README.md`; `docs/product/roadmap.md`.
- Verificação: fontes obrigatórias reanalisadas e classificadas; confronto com assets, API, UI, contratos técnicos e baseline local; 13/13 linhas RF encontradas; links relativos válidos; varredura documental de segredo sem ocorrências; `git diff --check` passou.
- Verificações bloqueadas: inspeção visual dos PDFs de pitch/Sprint não foi necessária para a classificação textual; a matriz registra essa limitação para qualquer citação futura de slide, página ou diagrama.
- Limitações: `docs/architecture/agent-core/` ainda possui referências legadas a `server/` e `prompt-assets/`; isso foi documentado como pendência porque o recorte desta task limita alterações a `docs/product/`.
- Próximo passo: a P0-003 pode usar a matriz concluída para consolidar o backlog detalhado, após seu Architecture Gate/APPROVED condicionado.
