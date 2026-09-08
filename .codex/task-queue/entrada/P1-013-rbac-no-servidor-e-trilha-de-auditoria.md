# ✅ Concluída — E01-06 RBAC no servidor e trilha de auditoria

> Prioridade: P1
>
> Área afetada: autorização, API, dados e auditoria
>
> Origem ou referência: `docs/product/backlog.md` E01-06; jornada de autorização
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-08.`
>
> Triagem automática: `Material — autorização e isolamento multi-organização.`
>
> Segurança: `A avaliar — RBAC, IDOR, auditoria e dados corporativos.`

## Pedido

Definir matriz de permissões e aplicar no servidor a verificação de sessão, tenant, papel e recurso, com eventos sanitizados para ações sensíveis.

## Critérios de aceite

- [ ] Negação é o padrão; recurso de outra organização é inacessível.
- [ ] Visualizador, analista e administrador têm permissões verificáveis.
- [ ] Auditoria não contém senha, token, prompt ou resposta LLM bruta.

## Restrições ou contexto

- Depende de P1-011 e do modelo de organização aprovado.
- UI nunca é a única barreira de autorização.

## Preflight, arquitetura e revisão de segurança — 2026-09-08

### Fatos confirmados

- P1-011/P0-008 possuem sessão opaca, conta, membro e organização; `readCurrentSession` só reconhece as três entidades `active`, mas as rotas de catálogo, ficha técnica e importação ainda não a exigem.
- `organization_members.role` existe e o primeiro membro recebe `admin`; ainda não há matriz de papéis, middleware de autorização, recurso vinculado à organização ou tabela de auditoria.
- Fichas técnicas, versões, veículos, fontes e catálogo atuais não têm proprietário corporativo: são dados automotivos compartilhados da plataforma. Importações possuem execução própria, mas hoje também não têm organização/ator.
- A chave `OPERATOR_APPROVAL_KEY` continua fronteira temporária de operação BlindSpot para aprovar empresas. Ela não representa nem deve ser confundida com administrador de uma empresa cliente.
- A UI faz a barreira visual de login, mas nenhum controle no cliente pode satisfazer isolamento ou RBAC.

### Decisão de arquitetura

#### 1. Dois escopos explícitos de recurso

| Escopo | Recursos | Regra P1-013 |
|---|---|---|
| **Catálogo global da plataforma** | configuração de veículo, ficha técnica validada, versão, fonte e busca | qualquer sessão corporativa `active` autenticada pode consultar; conteúdo não é dado privado de outro tenant. Geração/publicação exige `analyst` ou `admin` e é auditada com a organização/ator que a iniciou. |
| **Privado por organização** | `import_runs`, itens de importação e ações futuras de equipe/consumo/exportação/reporte | recebem `organization_id`; toda leitura, confirmação e mutação filtra pela organização da sessão. Identificador de outra organização retorna resposta de ausência/autorização neutra e não executa ação. |
| **Operação BlindSpot** | listar e decidir cadastro corporativo; convite legado | permanece protegida pela chave operacional nesta task; trocar essa fronteira por identidade de operador/painel requer task própria e não será fingido como RBAC de cliente. |

Essa decisão permite proteção real onde há propriedade corporativa sem declarar que especificações automotivas públicas são dados privados. P1-014 cria recursos de membros e P1-015+ devem nascer já no escopo privado.

#### 2. Papéis e matriz mínima

| Ação | `viewer` | `analyst` | `admin` |
|---|---:|---:|---:|
| Ler catálogo, ficha, versão e histórico global | sim | sim | sim |
| Solicitar geração/publicação de ficha global | não | sim | sim |
| Criar dry-run ou confirmar importação da própria organização | não | sim | sim |
| Consultar execução de importação da própria organização | não | sim | sim |
| Administrar membros da própria organização | futuro P1-014 | futuro P1-014 | futuro P1-014 |
| Aprovar empresas de terceiros | não | não | não |

O servidor normaliza o papel para `viewer | analyst | admin` e nega valor/estado desconhecido. O primeiro administrador existente permanece `admin`. Não há papel customizado, ABAC, seleção de tenant pelo cliente ou superadmin corporativo nesta task.

#### 3. Contrato de autorização

1. Middleware lê apenas o cookie opaco, chama uma versão enriquecida de `readCurrentSession` e cria um contexto imutável `{ accountId, memberId, organizationId, role }`.
2. `requireAuthenticated` bloqueia toda rota de negócio com sessão ausente, expirada, revogada, conta/membro/organização não ativos ou papel desconhecido.
3. `requireRole(...roles)` é aplicado por rota; IDs de recurso privado são sempre buscados junto de `organization_id = context.organizationId`, nunca confiados do corpo, query ou interface.
4. Rotas atuais mudam como segue: catálogo/leitura/histórico exigem sessão; geração e importação exigem `analyst|admin`; leitura/confirmação de importação adiciona filtro de organização. Health, login, logout, cadastro, espera e fluxo de operador preservam suas fronteiras próprias.
5. Falha não retorna lista, proprietário, papel, organização ou detalhe interno. `401` representa ausência/sessão inválida; `403` representa sessão válida sem papel suficiente; recurso privado fora do tenant responde `404` neutro.

#### 4. Persistência e auditoria

- Migration aditiva cria `audit_events` com `organization_id`, `account_id`, `member_id`, ação allowlisted, tipo/id do recurso, resultado (`allowed|denied|failed`), `request_id` e data. Não recebe senha, cookie, token, CNPJ/e-mail, prompt, resposta LLM bruta, IP ou corpo livre.
- Migration adiciona `organization_id` e ator inicial a `import_runs`; dados existentes sem dono ficam tecnicamente legados e não são retornados por rotas autenticadas até uma decisão explícita de backfill/retensão.
- A criação/confirmacão de importação grava seu evento permitido/negado na transação do negócio quando há mutação. Eventos de negação e autenticação são append-only e sanitizados; falha ao persistir auditoria de mutação sensível falha fechada.
- Publicação global de ficha registra quem/qual organização a iniciou na execução e no evento, mas não torna sua ficha privada.

#### 5. Segurança proporcional

| Ameaça | Controle obrigatório |
|---|---|
| IDOR e leitura/mutação cruzada de importação | filtro `organization_id` no repositório, não apenas middleware; UUID externo nunca basta |
| UI contornar RBAC | contexto vem do cookie validado e papéis são checados em cada rota |
| escalonamento por papel adulterado | papel só vem do membro persistido `active`; enum allowlist e negação padrão |
| auditoria virar vazamento | eventos estruturados allowlisted, sem payload, segredo, URL sensível ou texto livre |
| ação sensível sem trilha | mutação e evento no mesmo transaction; indisponibilidade de auditoria bloqueia mutação |
| chave operacional confundida com cliente | chave fica isolada e documentada como fronteira MVP residual |
| logs ruidosos exporem falhas esperadas | `401/403/404` esperados deixam de gerar stack trace de erro; mantêm log HTTP sanitizado e, quando aplicável, evento de auditoria |

Risco residual aceito somente para desenvolvimento: a chave de operador não possui RBAC, catálogo é deliberadamente compartilhado, e não há painel de auditoria, MFA, SSO, rate limit distribuído ou recuperação. Lucas aceita/reavalia antes de produção.

### Plano incremental e verificações

1. Criar migration/schema de papéis allowlisted, propriedade das importações, atribuição de ator à execução e eventos de auditoria; revisar dados legados e rollback lógico.
2. Implementar contexto de sessão, guardas de papel e repositórios com filtro de organização; proteger todas as rotas de negócio existentes conforme a matriz.
3. Propagar contexto para geração/importação e gravar eventos sanitizados/atômicos; ajustar o manipulador de erro para não tratar negações esperadas como erro interno.
4. Ajustar UI para estados `401`/`403` e não depender de esconder botões como autorização; atualizar pipeline, backlog e fluxograma com escopos global/privado e matriz.
5. Executar typecheck, migration no Neon autorizado, smoke com pelo menos duas organizações (viewer/analyst/admin, leitura global permitida, geração negada/permitida, importação cruzada ausente, confirmação cruzada ausente, evento sem segredo), logout/sessão revogada e inspeção sanitizada de auditoria/logs. `npm run build` fica registrado se o bloqueio de sandbox persistir.

### Double-check da arquitetura

- A rota atual de catálogo e ficha não tem `organization_id`; tratá-la como privada sem migration inventaria uma garantia inexistente. A separação global/privado acima é explícita e auditável.
- `import_runs` é o primeiro recurso de negócio privado já existente; por isso recebe filtro no repositório e não somente verificação no controller.
- O administrador corporativo não pode aprovar outra empresa: aprovação continua operação BlindSpot e a chave não é declarada como solução final.
- P1-014 não é antecipada: esta task reconhece os três papéis e protege ações atuais; gestão de membros continua futura.
- Nenhuma rota retorna conteúdo de auditoria nesta task, evitando expor eventos antes de existir autorização de leitura apropriada.
- Arquitetura e segurança estão suficientes para o corte proposto; implementação ainda exige `APPROVED` explícito.

## Resultado do agente

- Estado: `✅ Concluída`; Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-08`; Segurança: `Aplicável — controles aplicados e verificados proporcionalmente`.
- Implementação: migration `0007_rbac_tenant_audit` aplicada ao Neon; contexto autenticado contém organização, membro e papel allowlisted. Catálogo, ficha mais recente e histórico exigem sessão ativa; geração e importações exigem `analyst` ou `admin`; `import_runs` e suas ações são filtradas pela organização no repositório.
- Auditoria: `audit_events` recebe somente ator, ação/tipo/id de recurso, resultado, request ID e data. Eventos permitidos de criação/confirmação de importação e geração de ficha são gravados na mesma transação da mutação; negações de papel também são registradas sem payload, segredo ou texto livre. `401`/`403`/`404` esperados não produzem stack trace.
- Documentação: pipeline HTTP, backlog e fluxograma distinguem catálogo global de recursos privados por organização e descrevem a matriz `viewer|analyst|admin`.
- Verificações: `npm run db:migrate` (Neon) concluído; `npm run typecheck` concluído; `npm run build` concluído fora do sandbox; smoke com duas organizações confirmou catálogo para `viewer`, geração negada para `viewer`, filtro cross-tenant de importação e persistência sanitizada de auditoria.
- Limites deliberados: `OPERATOR_APPROVAL_KEY` continua a fronteira temporária da operação BlindSpot; não há leitura de auditoria, gestão de membros (P1-014), recuperação/MFA (P1-012 postergada) ou SSO nesta entrega.
