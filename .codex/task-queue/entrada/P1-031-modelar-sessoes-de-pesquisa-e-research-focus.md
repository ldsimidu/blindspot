# ✅ Concluída — Modelar Research Sessions e Research Focus estruturado

> Prioridade: P1
>
> Área afetada: dados, API, runtime de IA e auditoria
>
> Origem ou referência: P1-029 e proposta, seções 13 a 23
>
> Arquitetura: `APPROVED — Lucas autorizou “pode seguir” em 2026-09-11; instrução livre continua bloqueada por conformidade.`
>
> Triagem automática: `Material — cria contrato de API, persistência e orientação de IA.`
>
> Segurança: `Aplicável — endpoint, instrução livre, orçamento e integração com provider.`

## Pedido

Adicionar sessões de pesquisa rastreáveis a uma ficha, com foco estruturado e instrução complementar limitada. A primeira versão deve oferecer presets: `GENERAL`, `MISSING_VARIABLES`, `OFFICIAL_SOURCES`, `CONFLICT_RESOLUTION`, `LOW_CONFIDENCE`, `VALIDATE_EXISTING`, `CATEGORY` e `VARIABLES`.

## Critérios de aceite

- [x] Uma sessão registra ficha/revisão-base, foco estruturado, alvos resolvidos no servidor, política de fontes, orçamento, versão de runtime e estados de execução.
- [x] A instrução livre é deliberadamente indisponível neste corte; portanto não é persistida, logada nem capaz de relaxar qualquer controle.
- [x] O endpoint cria operação idempotente e retorna apenas identificador/estado sanitizado; ator e organização derivam da sessão autenticada.
- [x] Focos `MISSING_VARIABLES` e `CONFLICT_RESOLUTION` recebem somente os campos elegíveis, não uma lista genérica de toda a ficha.
- [x] O modelo reserva estados de falha/cancelamento/parcial sem publicar revisão; as transições e sua auditoria operacional pertencem à P1-032.

## Restrições ou contexto

- Depende de P1-030 e de P1-011/P1-013 para expor operação autenticada ao produto; pode preparar serviço interno antes disso se o Gate permitir.
- Reutilizar políticas canônicas em `packages/agent-runtime/assets/`; não transformar texto de usuário em instrução de sistema.
- Não executar provider real no desenvolvimento/verificação sem ambiente e autorização específicos.

## Architecture Gate — sessões estruturadas (2026-09-11)

### Decisão e fluxo

Criar o agregado `research_sessions` no mesmo PostgreSQL, vinculado a `technical_sheets`, revisão-base, organização e ator. A única operação deste corte será `POST /api/technical-sheets/:sheetId/research-sessions`, protegida para `analyst|admin`. Ela recebe `idempotency_key` e um foco allowlisted; resolve os alvos a partir da revisão-base autorizada e das políticas canônicas, grava estado inicial `queued` e devolve somente `id`, `state` e `request_id`.

`GENERAL`, `OFFICIAL_SOURCES`, `LOW_CONFIDENCE` e `VALIDATE_EXISTING` obtêm seus alvos do snapshot autorizado. `MISSING_VARIABLES` considera somente campos com ausência explícita; `CONFLICT_RESOLUTION`, somente campos cujo status é `conflitante`; `CATEGORY` e `VARIABLES` aceitam valores allowlisted e são intersectados com caminhos existentes no schema. O corpo nunca escolhe organização, ator, revisão vencedora, política de fontes, runtime, orçamento ou alvos efetivos.

Não haverá chamada a provider, publicação de revisão, worker, reprocessamento automático ou texto livre neste corte. A sessão é uma operação preparada e auditável; P1-032 será a única responsável pela orquestração/publicação.

### Dados, invariantes e compatibilidade

- `research_sessions`: `technical_sheet_id`, `base_revision_id`, organização/ator, foco, alvos resolvidos, versões de políticas/runtime, orçamento server-owned, estado, chave de idempotência, motivo sanitizado e timestamps.
- A chave é única por organização, ficha e idempotência; mesma intenção retorna a sessão existente e uma intenção incompatível não a sobrescreve.
- A ficha e a revisão-base são consultadas com filtro organizacional na mesma transação. Ficha de outro tenant e inexistente têm resposta neutra idêntica.
- Estados V1 são allowlisted: `queued`, `running`, `succeeded`, `partial`, `failed`, `cancelled`, `needs_rebase`. Nesta task só é possível criar `queued`; nenhuma sessão publica uma revisão.
- `technical_sheet_versions` e os assets canônicos são somente leitura; não se altera schema JSON, prompt, política de fonte ou provider.

### Segurança e conformidade proporcional

- **Gatilhos:** endpoint autenticado, persistência, auditoria, orçamento e futura IA. A fronteira é pessoa autenticada → RBAC → resolver server-owned → PostgreSQL/auditoria; conteúdo de foco é dado não confiável.
- **Abusos relevantes:** IDOR de ficha/revisão, custo ilimitado, injeção para relaxar política e publicação parcial. Controles: papéis, tenant no repositório, enum/UUID estritos, limites, alvo derivado, orçamento fixado no servidor, transição allowlisted, idempotência e evento sanitizado.
- **Conformidade:** há identificadores de ator/organização e eventual texto livre poderia conter dado pessoal. A finalidade é preparar pesquisa técnica autorizada; Lucas é responsável por base legal, transparência, retenção/descarte e destino de qualquer texto livre. À luz dos princípios e medidas de segurança da LGPD (Lei nº 13.709/2018, [Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), consultada em 2026-09-11), texto livre fica proibido de persistir, logar ou transmitir até essa definição humana. Não há dado sensível, de criança/adolescente, provider ou terceiro neste corte.

### Verificação e double-check

- Fixtures seguras cobrirão cada preset, alvos ausentes/conflitantes, categorias/variáveis inválidas, idempotência e não publicação.
- Testes de duas organizações cobrirão leitura/criação cross-tenant, papéis e resposta sanitizada; nenhum teste usa provider real, prompt, logs ou snapshot bruto.
- `npm run typecheck`, verificadores estáticos do contrato e teste dinâmico no PostgreSQL autorizado são necessários. `npm run build` é evidência separada e segue bloqueado enquanto `vite.config.ts` estiver ausente do checkout.
- Double-check: o fluxo não cria nova ficha, não confunde `latest` com revisão-base e não permite ao foco alterar a política; estados futuros não são anunciados como executados.

### Decisão de gate

O desenho está `READY` para a parte estruturada. A autorização ampla de Lucas para seguir com a arquitetura é registrada para esse recorte; a aceitação de instrução livre permanece bloqueada até serem definidos finalidade, retenção/descarte, transparência e destino do dado. A implementação só pode entregar o endpoint sem esse campo.

## Resultado do agente

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — recorte estruturado autorizado em 2026-09-11; instrução livre bloqueada por conformidade.`
- Triagem automática: `Material — IA com foco, endpoint e persistência.`
- Segurança: `Aplicável — input não confiável, custo, autorização e logs sanitizados.`
- Implementação: criada `research_sessions`, com ficha/revisão-base, organização, ator, idempotência, foco, alvos solicitados/resolvidos, versões de política/schema, orçamento preparado e máquina de estados. `POST /api/technical-sheets/:id/research-sessions` exige `analyst|admin`, resolve a ficha e a revisão dentro do tenant, cria apenas `queued` e responde só com id, estado e request id. O resolvedor trata ausências/conflitos estritamente pelos status da revisão; nenhum foco altera prompt, política, orçamento ou provider. Texto livre continua rejeitado por desenho e não é persistido, logado ou transmitido.
- Arquivos alterados: `services/api/db/schema.ts`, `services/api/research-sessions.ts`, `services/api/index.ts`, `services/api/audit.ts`, `drizzle/0020_research_sessions.sql`, `drizzle/meta/_journal.json`, `scripts/verify-research-sessions.ts`, `package.json` e esta task.
- Verificação: migration `0020` aplicada no PostgreSQL autorizado; `npm run verify:research-sessions`, `npm run typecheck` e `git diff --check` passaram. O verificador assegura schema, unicidade por tenant/ficha/idempotência, tenant scope, enum de foco, ausência de provider e auditoria. `npm run build` não foi reexecutado: permanece previamente bloqueado pela ausência de `vite.config.ts` no checkout, sem relação com este corte.
- Limitações: a sessão é preparada, não orquestrada; P1-032 fará transições, execução simulada, cancelamento/falha operacional e publicação condicional de revisão. Habilitar instrução livre exige decisão humana sobre finalidade, retenção/descarte, transparência e destino do dado.
- Próximo passo: P1-032 — orquestrar pesquisa direcionada e publicar revisões.
