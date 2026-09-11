# Catálogo de features

Cada item tem um estado de produto. `Implementado` significa que há evidência no checkout atual; `planejado` ou `em validação` exige uma task própria e Architecture Gate antes de mudar código, dados, API, IA ou interface.

## E01 — Coleta e ficha técnica rastreável

**Objetivo:** transformar a identificação de um veículo em uma ficha técnica estruturada, validada e defensável.

**Requisitos relacionados:** RF01, RF02, RF03, RF04, RF05 e RF06.

**Estado:** parcial. A solicitação, geração, schema e validação existem; baseline de qualidade, cobertura de testes e versão oficial do schema continuam pendentes.

### Stories

#### E01-S01 — Solicitar a ficha de um veículo

Como analista, quero informar marca, modelo, versão, mercado e ano-modelo para receber uma ficha do veículo exato.

- Task: manter e testar validação dos formatos plano e aninhado.
  - Subtask: cobrir campos obrigatórios, trim e ano entre 1900 e 2100.
  - Subtask: registrar respostas 400 sem detalhes internos.
  - Evidência atual: [`VEHICLE_INPUT_SPEC.md`](../../architecture/agent-core/VEHICLE_INPUT_SPEC.md).
- Task: impedir mistura de configuração de veículo no pipeline.
  - Subtask: criar fixtures por mercado, versão, motorização e ano.
  - Subtask: validar identificação também na resposta do agente.

#### E01-S02 — Gerar uma saída estruturada pela IA

Como analista, quero receber JSON aderente ao contrato, sem texto livre que impeça uso posterior.

- Task: manter composição determinística de prompt, schema e payload.
  - Subtask: preservar cabeçalhos e ordem definidos pelo runtime.
  - Subtask: versionar artefatos antes de qualquer mudança incompatível.
  - Evidência atual: [`PROMPT_COMPOSITION.md`](../../architecture/agent-core/PROMPT_COMPOSITION.md).
- Task: definir baseline do provider de IA.
  - Subtask: comparar simulated, Claude e OpenRouter no mesmo conjunto seguro.
  - Subtask: medir cobertura, fonte, erro de schema, custo e latência sem generalizar experimento isolado.

#### E01-S03 — Evidenciar qualidade por campo

Como analista, quero saber se cada dado foi confirmado, está parcial, conflita, não foi encontrado ou não se aplica.

- Task: validar a resposta por AJV e a coerência de `fonte_ref`.
  - Subtask: rejeitar referência que não exista em `fontes_utilizadas`.
  - Subtask: manter erros de validação como 422.
  - Evidência atual: [`VALIDATION_AND_TYPES.md`](../../architecture/agent-core/VALIDATION_AND_TYPES.md).
- Task: fechar métrica oficial de completude.
  - Subtask: reconciliar contagens de schema, router e resumo final.
  - Subtask: documentar fórmula, denominador e tratamento de campos condicionais.

#### E01-S04 — Evoluir o domínio sem perder aplicabilidade

Como responsável por qualidade de dados, quero que o schema represente veículos diferentes sem transformar campos condicionais em dados falsamente ausentes.

- Task: versionar o contrato e o dicionário de variáveis.
  - Subtask: classificar campos como gerais, condicionais ou exclusivos.
  - Subtask: registrar unidade, enum, compatibilidade e política de mudança.
- Task: testar regras condicionais por propulsão, carroceria, tração e conectividade.
  - Subtask: cobrir combustão, elétrico, híbrido/PHEV e carrocerias relevantes.
  - Subtask: exigir `nao_aplicavel` quando uma característica não se aplicar.
  - Estado: em validação; as variáveis sugeridas no acervo não entram no runtime sem Gate próprio.

## E02 — Catálogo, histórico e comparação

**Objetivo:** reutilizar fichas validadas sem repetir coleta e permitir análise entre veículos.

**Requisitos relacionados:** RF07 e RF12; RF01–RF06 são pré-requisitos.

**Estado:** histórico local parcial; catálogo, versionamento imutável e comparador planejados.

### Stories

#### E02-S01 — Consultar ficha e histórico

Como analista, quero abrir a última ficha e versões anteriores para reutilizar conhecimento validado.

- Task: substituir snapshots locais por persistência versionada (P1).
  - Subtask: modelar veículo, execução, ficha e fontes.
  - Subtask: preservar data, schema e rastreabilidade de cada versão.
  - Subtask: decidir retenção e migração de dados locais antes do corte.
- Task: manter estados vazios e erros claros.
  - Subtask: responder 404 quando não houver ficha.
  - Subtask: não usar fallback silencioso que crie duas fontes de verdade.

#### E02-S02 — Comparar veículos validados

Como analista, quero comparar versões lado a lado, com diferenças e fontes visíveis.

- Task: definir contrato de comparação apenas sobre fichas validadas e versionadas.
  - Subtask: entrada conceitual com dois ou mais veículos identificados por marca, modelo, versão, ano-modelo, mercado e versão da ficha.
  - Subtask: saída lado a lado com campo, unidade, valor, status, `fonte_ref`, observação e diferença detectada.
  - Subtask: preservar versão, mercado, ano e motorização em cada lado; impedir comparação de configurações incompatíveis.
- Task: definir semântica de qualidade da diferença.
  - Subtask: `nao_aplicavel` não é ausência nem igualdade; mostrar a razão de não aplicabilidade.
  - Subtask: `nao_encontrado`, `parcial`, `conflitante` e `inferido_minimamente` devem permanecer visíveis e não gerar vencedor automático.
  - Subtask: fonte divergente deve permitir leitura da evidência de cada lado.
- Task: desenhar fluxo e falhas antes de UI/API.
  - Subtask: cobrir seleção incompleta, ficha inexistente, ficha inválida, versões históricas, ausência de dado e fonte divergente.
  - Subtask: definir limite de veículos, ordenação e meta de desempenho somente após medição.
  - Estado: planejado; não há comparador implementado neste checkout.

## E03 — Plataforma web e exportações

**Objetivo:** permitir que pessoas autorizadas consultem, interpretem, compartilhem e exportem informação sem operar a API diretamente.

**Requisitos relacionados:** RF08; suporta RF01–RF07.

**Estado:** visualização de ficha parcial; comparador, compartilhamento e exportações planejados.

### Stories

#### E03-S01 — Ler uma ficha com contexto

Como analista, quero visualizar seções, status, observações, fontes e completude para avaliar a qualidade antes de usar o dado.

- Task: manter paridade de rastreabilidade entre ficha recém-gerada e histórico.
  - Subtask: exibir `fonte_ref`, status e observações em ambos os fluxos.
  - Subtask: destacar ausência e conflito sem converter em confirmação.
- Task: validar estados de carregamento, sucesso, vazio e erro.
  - Subtask: manter acessibilidade de controles expansíveis.
  - Subtask: não esconder erro de validação atrás de conteúdo desatualizado.

#### E03-S02 — Exportar ou compartilhar com controle

Como analista autorizado, quero gerar PDF, Excel ou JSON sem perder a proveniência.

- Task: definir contrato de exportação após identidade e autorização.
  - Subtask: incluir fontes, versão e data de geração.
  - Subtask: aplicar autorização organizacional a download e compartilhamento.
- Task: definir política de conteúdo exportável.
  - Subtask: evitar incluir segredos, logs, prompts ou dados de outra organização.
  - Subtask: registrar auditoria de exportação quando houver identidade.

## E04 — Identidade, organizações e consumo

**Objetivo:** preparar uso corporativo multiempresa com acesso mínimo necessário e consumo auditável.

**Requisitos relacionados:** RF09, RF10 e RF11.

**Estado:** planejado. Não há autenticação, perfis, organização ou tenancy implementados no checkout atual.

### Stories

#### E04-S01 — Acessar somente recursos autorizados

Como integrante de uma organização, quero que minhas permissões limitem consulta, administração, exportação e gestão de pessoas.

- Task: arquitetar autenticação e autorização antes de introduzir dados corporativos.
  - Subtask: definir perfis Administrador, Analista e Visualizador com matriz de permissões.
  - Subtask: definir expiração, revogação, convite e recuperação de conta.
- Task: implementar isolamento de organização.
  - Subtask: adicionar tenancy ao modelo de dados antes de dados privados.
  - Subtask: testar acesso cruzado, IDOR e recursos não autenticados.

#### E04-S02 — Controlar consumo de consultas

Como administrador, quero acompanhar uso e receber alerta antes do limite da organização.

- Task: definir unidade de consumo e eventos auditáveis.
  - Subtask: separar tentativas, sucesso, falha e custo do provider.
  - Subtask: decidir política de reprocessamento e deduplicação.
- Task: criar cotas e alertas após identidade estar disponível.
  - Subtask: validar limiares antes de tratá-los como política final.
  - Subtask: impedir que alertas revelem dados entre organizações.

## E05 — Observabilidade, segurança e operação

**Objetivo:** tornar o serviço mensurável, recuperável e seguro para operação controlada.

**Requisitos relacionados:** RF13; transversal a todos os épicos.

**Estado:** parcial para health endpoint e logs locais; segurança operacional, métricas, traces, alertas e SLA são planejados.

### Stories

#### E05-S01 — Operar a API com evidência

Como equipe operadora, quero correlacionar uma solicitação com falha, latência e resultado sem expor dados sensíveis.

- Task: padronizar logs estruturados e correlação.
  - Subtask: reter `x-request-id` e campos sanitizados.
  - Subtask: não gravar tokens, prompts, respostas cruas ou stacks em respostas HTTP.
- Task: definir métricas, health checks e alertas.
  - Subtask: separar disponibilidade, latência, erro, qualidade e custo.
  - Subtask: testar alertas acionáveis em ambiente autorizado.
- Task: estabilizar baseline de provider antes de assumir qualidade operacional.
  - Subtask: comparar providers com os mesmos veículos, schema e métrica.
  - Subtask: registrar custo, latência, cobertura, conflitos e fontes como evidência, não como SLA.
  - Subtask: resolver divergência entre contadores de router, schema e resumo de completude.

#### E05-S02 — Proteger fronteiras e dados

Como responsável pelo produto, quero controles proporcionais para API, integrações, banco e ciclo de desenvolvimento.

- Task: manter segredo fora do repositório e exigir configuração segura por ambiente.
  - Subtask: secret scanning, validação de env e rotação como procedimentos aprovados.
  - Subtask: revisar CORS, limites, autenticação e mensagens de erro antes de produção.
- Task: estabelecer backup, recuperação e resposta a incidente.
  - Subtask: definir RPO/RTO a partir de requisito real.
  - Subtask: praticar restauração em ambiente descartável antes de assumir SLA.

## Requisitos funcionais transcritos para rastreabilidade

Fonte primária de requisitos: `planejamento/backlog-requisitos-e-roadmap-blindspot.md`; a [matriz de cobertura](../coverage-matrix.md) registra a classificação e fontes complementares.

| ID | Requisito | Épico / story | Estado | Dependência crítica |
|---|---|---|---|---|
| RF01 | Consultar ficha por marca, modelo, versão, mercado e ano-modelo. | E01-S01 | Parcial. | Validação de entrada e configuração exata do veículo. |
| RF02 | Gerar ficha técnica com IA. | E01-S02 | Parcial. | Provider autorizado e baseline de qualidade. |
| RF03 | Validar resposta contra schema JSON. | E01-S03 | Implementado no protótipo. | Governança/versionamento do schema. |
| RF04 | Registrar fontes utilizadas. | E01-S03 / E02-S01 | Parcial. | Validação de fonte e persistência versionada. |
| RF05 | Associar `fonte_ref` por variável. | E01-S03 | Implementado no protótipo. | Fonte deve existir em `fontes_utilizadas`. |
| RF06 | Registrar status por variável. | E01-S03 / E01-S04 | Parcial. | Regras condicionais e métrica de completude. |
| RF07 | Comparar veículos. | E02-S02 | Planejado. | Fichas validadas, versionadas e comparáveis. |
| RF08 | Exportar PDF, Excel e JSON. | E03-S02 | Planejado. | Identidade, autorização e política de exportação. |
| RF09 | Gerenciar usuários, perfis e organizações. | E04-S01 | Planejado. | Arquitetura de identidade e tenancy. |
| RF10 | Controlar consumo por organização. | E04-S02 | Planejado. | Organização, eventos de uso e política de cota. |
| RF11 | Alertar limites de consumo. | E04-S02 | Planejado. | RF10, canal de alerta e isolamento organizacional. |
| RF12 | Manter histórico imutável de versões. | E02-S01 | Planejado; histórico local é parcial. | Persistência versionada e retenção definida. |
| RF13 | Registrar logs, health checks, métricas, traces e alertas. | E05-S01/E05-S02 | Parcial. | Logs locais existentes; telemetria/alerta operacional planejados. |

## Fora do catálogo implementado

Metas numéricas de SLA, latência, confiabilidade, cobertura, custo, consumo e cronograma precisam de evidência recente e decisão explícita. Integrações com bases pagas, cache Redis, BetterAuth, Vercel, WAF, ELK, Prometheus, Grafana e OpenTelemetry são direções discutidas, não dependências instaladas ou aprovadas neste checkout.
