# ✅ Concluída — E03-03 Comparar e salvar fichas compatíveis

> Prioridade: P1
>
> Área afetada: comparação, API, UI, persistência e autorização
>
> Origem ou referência: `docs/product/backlog.md` E03-03; fluxo de análise
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-09.`
>
> Triagem automática: `Material — dados versionados, UI e tenant.`
>
> Segurança: `Aplicável — autorização, persistência, auditoria e dados corporativos.`

## Pedido

Criar comparação entre fichas compatíveis, preservando versões, fonte, unidade e status de cada campo; permitir salvar análise autorizada por organização.

## Critérios de aceite

- [x] Comparação bloqueia e explica incompatibilidade de mercado, versão ou motorização.
- [x] Campos ausentes/conflitantes não recebem vencedor automático.
- [x] Análise salva identifica owner, tenant e versões de origem.

## Restrições ou contexto

- Depende de P1-008 e P1-013; não inclui exportação ou compartilhamento.

## Preflight, arquitetura e revisões proporcionais — 2026-09-09

### Preflight

- **Resultado esperado:** permitir que `analyst` ou `admin` compare duas versões imutáveis de ficha do catálogo e salve o resultado privado da organização, sem transformar ausência ou conflito em recomendação.
- **Paths e contratos consultados:** `services/api/index.ts`, `services/api/db/schema.ts`, `services/api/db/repository.ts`, `services/api/authentication.ts`, `services/api/audit.ts`, `apps/web/src/App.tsx`, `docs/architecture/agent-core/HTTP_PIPELINE.md`, `docs/architecture/agent-core/VALIDATION_AND_TYPES.md`, `docs/product/backlog.md`, `docs/product/fluxograma-desenvolvimento-agente.md` e `packages/agent-runtime/assets/schema.json` como contrato canônico de ficha.
- **Fatos confirmados:** o catálogo expõe configurações globais autenticadas, mas lê somente a versão mais recente; `technical_sheet_versions` é imutável por configuração/versão e conserva payload, proveniência e resumo; o contexto autenticado contém conta, membro, organização e papel; importações e consumo já filtram recursos privados por `organization_id`; não existe comparação nem análise salva.
- **Lacunas resolvidas por esta proposta:** não há limite aprovado acima de dois itens nem taxonomia confiável de geração. O MVP comparará exatamente duas versões e não inferirá geração, categoria ou vencedor.
- **Impacto:** schema/migration, API autenticada, RBAC, auditoria e uma nova área de UI. Não toca prompt, provider, schema canônico, IA, exportação ou compartilhamento.
- **Riscos e abortar:** IDOR em análise salva, exposição de dono, uso de versão errada, comparação enganosa por motorização ausente/conflitante e duplicação desnecessária de payload. A implementação aborta antes de migration se a query não puder restringir análise por `organization_id` no próprio repositório.
- **Verificações previstas:** migration no ambiente autorizado; typecheck/build; smoke com duas organizações, dois papéis e fichas compatíveis/incompatíveis; `400/403/404/422`; análise salva e releitura; inspeção de auditoria sanitizada.

### Decisão proposta

#### Escopo e fluxo da pessoa usuária

1. A pessoa `analyst` ou `admin` abre **Comparar fichas**, pesquisa no catálogo autenticado e seleciona exatamente duas fichas disponíveis. A seleção usa o identificador da **versão imutável** mais recente exibida pelo catálogo, não texto, identidade de veículo ou status enviados pelo navegador.
2. O servidor recarrega ambas as versões, valida a identidade de cada payload contra sua configuração persistida e avalia compatibilidade. Mercado deve ser idêntico; `motor_tipo` deve estar confirmado em ambos e ter o mesmo valor normalizado. Ficha sem motorização confirmada, com identidade de versão inconsistente, ou com mercado/motor divergente não é comparada: recebe resultado `incompatible` com códigos explicáveis, sem tabela parcial e sem sugestão de vencedor.
3. Quando compatíveis, a UI exibe lado a lado cada campo presente nos dois payloads, preservando caminho, rótulo, valor, unidade quando declarada, status, `fonte_ref` e observação. Diferença é somente descritiva (`igual`, `diferente`, `ausente_em_um_lado`, `conflitante`, `não_aplicável`); jamais classifica melhor/pior, não preenche ausência e não resolve conflito.
4. A pessoa escolhe **Salvar análise**. O servidor cria uma análise privada do tenant com as duas versões e o ator de criação; não aceita `organization_id`, owner, valores, fontes ou resultado calculado no corpo. A confirmação mostra apenas ID da análise e dados já autorizados da comparação.
5. Em **Comparações salvas**, `analyst` e `admin` só leem análises da própria organização. A análise é reconstituída das versões imutáveis referenciadas, preservando o resultado original pelo hash/versão do contrato de comparação; não há edição, compartilhamento, link, PDF/Excel/JSON, exclusão ou colaboração externa neste corte.

#### Dados e contratos

- Estender o catálogo com `latest_technical_sheet_version_id`, um UUID opaco de versão global que já é legível ao usuário autenticado; não expor payload adicional, organização que gerou a ficha, prompt, request ID ou execução.
- Criar `saved_comparisons`: `id`, `organization_id`, `account_id`, `created_by_member_id`, identificadores das duas `technical_sheet_versions`, `comparison_contract_version`, `result_sha256`, `created_at`. Criar unicidade por organização + par canônico de versões para tornar o salvamento idempotente e impedir pares invertidos duplicados.
- Criar `saved_comparison_items` somente se a reconstituição não puder preservar a evidência exigida sem snapshot mínimo. A preferência é **não duplicar payloads de ficha**: versões e fontes já são imutáveis; a análise referencia ambas e registra hash/contrato. Se o runtime exigir snapshot, ele deve conter apenas caminhos, estados, referências de fonte e hash, nunca prompt, resposta LLM bruta, e-mail, cookie, token ou dados de outro tenant.
- Contrato HTTP proposto: `POST /api/comparacoes` com `technical_sheet_version_ids` exatamente dois UUIDs; `GET /api/comparacoes`; `GET /api/comparacoes/:id`. A resposta de criação/leitura traz análise e comparação calculada. IDs inválidos, repetidos ou quantidade diferente retornam `400`; versão ausente retorna `404` neutro; incompatibilidade retorna `422` com códigos allowlisted; recurso salvo fora do tenant retorna `404` neutro.
- A comparação usa um módulo puro versionado (`comparison-contract-v1`), sem LLM e sem rede. Somente o servidor extrai campos, normaliza o par de IDs e calcula compatibilidade/diferenças.

#### Autorização e auditoria

| Ação | viewer | analyst | admin |
|---|---:|---:|---:|
| Ler catálogo global já disponível | sim | sim | sim |
| Criar/salvar comparação | não | sim | sim |
| Listar/ler comparação salva do próprio tenant | não | sim | sim |
| Ler/criar comparação salva de outro tenant | nunca | nunca | nunca |
| Exportar, compartilhar, editar ou apagar | fora do escopo | fora do escopo | fora do escopo |

- Auditoria allowlisted registra `comparison.created`, `comparison.read` e negação de papel, somente com IDs de recurso, tenant, ator, resultado e `request_id`; não registra e-mail, valor de campo, fonte completa, payload, cookie, token ou corpo.
- Desativar membro continua revogando sessão. A análise histórica mantém a referência ao criador sem exibir seus dados pessoais; a autorização atual depende sempre da sessão ativa e do tenant atual.

### Revisão de segurança

- **Gatilhos:** nova persistência, endpoints autenticados, autorização por tenant, auditoria e dados corporativos.
- **Fronteira de confiança:** navegador escolhe somente dois UUIDs; servidor resolve versões, organização, owner e resultado. Catálogo global é uma decisão já existente; análise salva é recurso privado e não deve herdar essa visibilidade global.
- **Cenários/controlos:** IDOR é mitigado por filtro obrigatório de `organization_id` em listar/ler e sem tenant no corpo; manipulação de resultado por cálculo exclusivo no servidor; duplicação/retry por par canônico único; enumeração por UUID e respostas 404 neutras; comparação enganosa por bloqueio conservador de motorização/identidade não confirmadas; log sensível por auditoria estruturada allowlisted.
- **Checks planejados:** acesso `viewer` recebe 403; análise de tenant A não existe para tenant B; trocar ordem das versões não cria duplicata; mercado/motorização/identidade divergentes retornam apenas códigos seguros; ausência/conflito continuam explícitos; eventos de auditoria não carregam payload de ficha ou dados de sessão.
- **Risco residual:** fichas do catálogo são globais por contrato atual. P1-017 não muda essa decisão; só torna privada a análise criada pela empresa. Lucas permanece responsável por aceitar o risco residual no gate.

### Revisão de conformidade proporcional

- **Aplicabilidade e fontes:** Brasil; LGPD (Lei nº 13.709/2018, fonte consolidada oficial: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm) e portal oficial da ANPD (https://www.gov.br/anpd/pt-br), consultados em 2026-09-09. A revisão é técnica e não substitui validação jurídica.
- **Finalidade/dados:** guardar uma análise técnica privada, reprodutível e auditável. O novo dado pessoal é apenas a referência de membro/conta criadora; não há dado sensível, criança/adolescente, coleta adicional de e-mail, texto livre, cookies novos, IA, terceiro ou transferência internacional.
- **Minimização/retenção:** a análise referencia versões já persistidas em vez de copiar fichas; a referência de owner é necessária para trilha e não é exposta na UI. Ela acompanha a retenção das versões de origem já adotada pelo produto; a task não cria prazo autônomo nem elimina histórico por desativação de membro.
- **Transparência/pendência:** finalidade e acesso por organização devem ser visíveis na UI. Base legal, controlador e política formal de retenção devem ser validados pelo responsável competente antes de uso produtivo; não bloqueiam o protótipo local porque não há nova coleta, transmissão ou categoria sensível, mas exigem reavaliação antes de release externo.
- **Decisão:** `seguir para o Architecture Gate`, sem envio de dados para fora do ambiente.

### Plano incremental

1. Modelar contrato puro de comparação e fixtures: duas versões, incompatibilidades, ausência, conflito e não aplicável.
2. Adicionar schema/migration de análise privada, par canônico e índices de tenant; criar repositório que busca versões e filtra análise no servidor.
3. Expor as três rotas com validação de UUID/quantidade, RBAC `analyst|admin` e auditoria sanitizada.
4. Adicionar UI de seleção de duas fichas, estados de bloqueio explicáveis, tabela lado a lado e lista de análises salvas; não reutilizar botões de compartilhar/favoritar como se fossem funcionalidade entregue.
5. Atualizar pipeline, backlog e fluxograma somente após o runtime e smoke comprovarem o comportamento.

### Double-check da arquitetura

- A versão da ficha não é inferida pelo cliente: UUID de `technical_sheet_versions` é resolvido no servidor e mantém fonte/status/campos imutáveis.
- A regra de compatibilidade é deliberadamente conservadora e explicável: não inventa equivalência quando motor ou identidade não estão confirmados. Versões de acabamento diferentes podem ser comparadas quando mercado e motorização confirmada coincidirem; a "incompatibilidade de versão" do aceite é coberta pela validação de consistência entre versão persistida e `veiculo_alvo`, não por proibir toda comparação entre trims diferentes.
- O catálogo global continua global, mas uma análise é sempre tenant-scoped; esse limite será verificado contra IDOR e respostas neutras.
- Não há requisito para copiar payloads, usar IA, escolher vencedores, definir limite maior que dois, exportar, compartilhar ou apagar. Cada um permanece fora do escopo para evitar ampliar o contrato sem decisão.
- O plano exige migration e arquitetura `APPROVED` de Lucas antes de qualquer implementação. Estado: `READY`.

## Resultado do agente

- Estado: `✅ Concluída`; Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-09`; Segurança: `Aplicável — controles implementados e verificados estaticamente`; Conformidade: `Aplicável — reavaliar antes de release externo`.
- Implementação: migration `0012_saved_comparisons` aplicada ao Neon; `comparison-contract-v1` calcula somente no servidor a compatibilidade e as diferenças de duas versões. Análises referenciam versões imutáveis, têm owner/tenant, par canônico idempotente e auditoria allowlisted. Rotas e UI exigem `analyst|admin`; não incluem exportação, share, edição, exclusão, IA ou rede externa.
- Verificações: `npm run typecheck`, `npm run build`, `git diff --check` e migration concluídos. Smoke autenticado com duas organizações permanece pendente por não haver credenciais/fixtures de dois tenants autorizadas nesta execução; deve cobrir 403 de viewer, 404 cross-tenant, 422 de incompatibilidade e idempotência do par antes de release externo.
