# ✅ Concluída — Governar tags, ficha primária e ciclo de vida

> Prioridade: P1
>
> Área afetada: dados, API, interface, autorização e auditoria
>
> Origem ou referência: proposta (2), seções 5, 7, 9 a 12, 40 a 42 e 50 a 53
>
> Arquitetura: `APPROVED — Lucas autorizou “perfeito, pode seguir” em 2026-09-12.`
>
> Triagem automática: `Material — introduz preferências organizacionais, transições de ficha e ações autorizadas.`
>
> Segurança: `Aplicável — tenant, RBAC, integridade de estado e auditoria.`

## Pedido

Formalizar tags automáticas e manuais, a escolha explícita de ficha `primary` e o ciclo de vida de uma ficha (`active`, `stale/outdated`, `archived`, quando aplicável). `latest`, `recommended` e `primary` devem permanecer dimensões independentes e explicáveis.

## Critérios de aceite

- [x] O contrato versionado distingue tags derivadas de tags manuais, origem, motivo, autor e data, sem apagar a evidência da pesquisa.
- [x] Apenas papel autorizado pode definir ou substituir `primary`; a troca é auditável, tenant-scoped e não altera `latest` ou `recommended`.
- [x] Transições de ciclo de vida são allowlisted, preservam fichas/revisões anteriores e expõem estado/razão no contrato do workspace.
- [x] O contrato de workspace apresenta alternativas/capacidades factuais; a renderização visual foi extraída para P1-053, sem promover automaticamente ficha desatualizada.
- [x] Fixtures provam isolamento entre organizações, duas fichas válidas no mesmo veículo e reversão controlada de `primary`.

## Restrições ou contexto

- Depende de P0-012, P0-013, P1-013, P1-034 e da validação real do workspace de P1-035/P1-036.
- Não criar ranking de fonte, merge, autopilot ou mudança automática de ficha primária.
- Ler runtime canônico, schema, política de qualidade e contratos de autorização antes do Architecture Gate.

## Architecture Gate — governança organizacional de ficha (2026-09-12)

### Fatos confirmados

- `TechnicalSheet` já é uma linha de trabalho tenant-scoped, porém seu `state` é texto sem transições e `is_default` é um artefato de criação, não uma escolha `primary` auditável. O workspace retorna `recommended: null` e `primary: null`.
- A revisão mais recente é uma propriedade temporal de uma ficha. O vetor de qualidade já fornece razões/frescor/recomendação de foco, mas não existe política segura que transforme isso em ficha vencedora.
- P1-046 passou a preservar estado/proveniência por campo e P1-044/P1-045 preservam sessão, impacto e próxima ação. Nenhuma dessas capacidades pode escolher `primary`, arquivar uma ficha ou converter uma recomendação em decisão.
- A proposta pede múltiplas fichas legítimas para o mesmo veículo, tags automáticas/manuais, `latest` separado de `recommended`, `primary` com escopo explícito e ciclo de vida. Ela também cita projetos, fork e permissão fina como futuros; não existem agregados de projeto nem política de merge neste checkout.
- Há trabalho paralelo do PEK em `apps/web/src/**`. Lucas autorizou adiar alterações visuais; este Gate não autoriza editar frontend.

### Decisão e modelo de dados

O escopo V1 é **organization primary**: uma única ficha primária ativa por `{organization, vehicle_configuration}`. Não haverá `global`, `user` ou `project primary`; `VehicleConfiguration` continua global e não recebe preferência do tenant. Somente `admin` pode definir ou substituir a primary. A troca é append-only, tenant-scoped e revogável: a nova seleção encerra a seleção ativa anterior na mesma transação, guarda ator/data/motivo enumerado e emite auditoria. `is_default` deixa de ter significado de primary e é mantido apenas para compatibilidade de criação/leitura legada.

Criar um asset `technical-sheet-governance-policy.json` com versão e allowlists para:

- tags derivadas: `latest`, `has_conflicts`, `incomplete`, `outdated`, `archived`; cada uma é calculada de fatos persistidos/qualidade e retorna razão e versão de política;
- tags manuais fechadas: `needs_review` e `pinned_for_review`; não há texto livre, tag de fonte, ranking, URL, prompt ou rótulo arbitrário;
- estados de ficha: `active`, `stale`, `archived`, com transições `active↔stale`, `active|stale→archived` e `archived→active` exclusivamente sob ação `admin` e razão enumerada. `stale` é permitido somente por avaliação server-owned do frescor (`quality-vector-v1`); `archived` nunca remove a ficha, revisão, evidência, sessão ou histórico.

Persistir tags em `technical_sheet_tags` com origem (`derived|manual`), versão de política, razão allowlisted, ator opcional, criação e revogação. Persistir ciclo e primary em históricos próprios append-only (`technical_sheet_lifecycle_events`, `technical_sheet_primary_assignments`), com uma única primary não revogada por organização/configuração. A migration é aditiva, marca legados como `active` e não converte `is_default` em primary.

### Semântica e fluxo

1. Ao ler o workspace, o servidor resolve `latest` somente pela revisão temporal mais recente de cada ficha; tags derivadas são calculadas/read-through a partir de revisões, vetores e estado, sem alterar a ficha.
2. `recommended` permanece uma sugestão de pesquisa/qualidade versionada e pode ficar `not_available`; este corte não cria ranking nem seleciona ficha automaticamente.
3. Um admin pode definir a primary apenas para ficha `active` ou `stale` da própria organização/configuração. A ação não altera `latest`, `recommended`, payload, revisão, qualidade, fonte ou estado da outra ficha.
4. Um admin pode aplicar tag manual allowlisted ou transição de lifecycle. `archived` sai das escolhas elegíveis de primary/continuação, mas continua listável com razão/histórico. Reativação é explícita; não há exclusão.
5. A API de workspace expõe dimensões independentes, tags/sua origem/razão, lifecycle e capacidades do ator. A interface futura apenas renderiza esse contrato e nunca inventa primary, recomenda ficha arquivada ou realiza uma ação automática.

### Segurança e conformidade proporcionais

**Gatilhos:** RBAC, tenant, persistência, endpoints de mutação, auditoria e retenção de decisões organizacionais. Fronteira: pessoa autenticada → API/RBAC → resolução server-owned de veículo/ficha → transação PostgreSQL → workspace autorizado. Riscos: IDOR, elevação de analista para primary/admin, múltiplas primaries por corrida, arquivamento destrutivo ou confusão entre tag derivada e decisão humana.

Controles: filtros de organização em toda leitura/escrita; `admin` exclusivo para primary/lifecycle; policy/enum server-owned; `FOR UPDATE` no escopo da seleção e índice único parcial para a primary ativa; eventos append-only e auditoria allowlisted; transição sem delete; tag manual fechada; `latest`/`recommended` read-only. Fixtures cobrirão duas organizações, duas fichas válidas, troca/reversão da primary, papel não autorizado, transição inválida e ausência de segredo/resposta bruta. Esta revisão não declara segurança completa.

Pela LGPD, a finalidade é governar a escolha e ciclo de fichas técnicas já autorizadas dentro da organização. Persistem somente IDs existentes, papel, razão enumerada, estado/tag e timestamps; não há provider novo, dado sensível, conteúdo de fonte ou texto livre. A [LGPD consolidada no Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), consultada em 2026-09-12, orienta finalidade, necessidade, transparência e segurança. Controlador, base legal concreta e retenção geral continuam sob validação do responsável competente; este Gate não é parecer jurídico.

### Frontend — explicitamente adiado para PEK

O backend entregará o contrato, mas **não alterará `apps/web/src/**`**. Após a estabilização do PEK, a integração visual deverá receber task/Gate próprios: labels textuais de `latest`/`recommended`/`primary`, tags com origem/razão, alternativas, estados vazio/erro/sem permissão e confirmação explícita de ações administrativas. Cor não será o único sinal e nenhuma ficha `stale`/`archived` será promovida por padrão.

### Plano e verificações

1. Adicionar política/tipos, migration aditiva, restrições de integridade e adaptador de legado.
2. Implementar serviço transacional para tags, lifecycle e primary, além de API RBAC/auditoria e leitura do workspace.
3. Executar fixtures de dois tenants, duas fichas, corrida/troca/reversão de primary, transições e tags; validar respostas sanitizadas.
4. Rodar verificadores específicos, PostgreSQL autorizado, `npm run typecheck`, `npm run build` e `git diff --check`. Falhas do PEK serão registradas sem edição cruzada.

### Double-check da arquitetura

- `primary` é decisão humana de organização, não derivação de `is_default`, `latest`, qualidade ou fonte.
- `recommended` continua explicável e não mandatória; a ausência de política de seleção não é preenchida por ranking inventado.
- Ciclo/arquivo preservam toda linhagem e permitem reversão controlada; `stale` não é confirmação de obsolescência de conteúdo.
- Projeto, fork, reprocessamento, merge, reputação e autopilot ficam fora deste corte.
- O frontend foi isolado por decisão de Lucas. Conclusão: `READY` para backend somente após `APPROVED` explícito de Lucas.

## Resultado do agente

- Estado: `✅ Concluída em 2026-09-12 — recorte backend; interface extraída para P1-053.`
- Arquitetura: `APPROVED — backend autorizado em 2026-09-12.`
- Triagem automática: `Material — estado organizacional e decisão autorizada.`
- Segurança: `Aplicável — RBAC, tenancy, integridade e trilha de auditoria.`
- Implementação: asset canônico `technical-sheet-governance-policy.json`, serviço transacional de primary/lifecycle/tags, migration `0027` e API autenticada para definir/remover primary, transicionar lifecycle e aplicar/remover tags manuais. `primary` é uma seleção organizacional de admin; `latest` é temporal e `recommended` fica explicitamente `not_available`, sem ranking ou escolha automática.
- Dados: `technical_sheet_tags`, `technical_sheet_lifecycle_events` e `technical_sheet_primary_assignments` preservam origem, versão/motivo, ator e datas. A migration é aditiva; fichas legadas permanecem `active` e `is_default` não foi convertido em primary. `archived` preserva todos os dados e revoga somente a seleção primary ativa.
- API/segurança: as mutações exigem `admin`, resolvem tenant no servidor, usam transação/lock para troca de primary e registram auditoria allowlisted. O workspace retorna tags derivadas/manuais, lifecycle, `is_primary`, capacidades do ator e dimensões independentes, sem URL, prompt, conteúdo bruto ou segredo.
- Frontend: nenhum arquivo `apps/web/src/**` foi alterado. A integração PEK foi extraída para P1-053.
- Verificação: `npm run typecheck` passou; `npm run verify:technical-sheet-governance-db` retornou `TECHNICAL_SHEET_GOVERNANCE=PASS`, cobrindo duas fichas, troca/limpeza/reversão de primary, lifecycle, tags e bloqueio de analyst. A migration 0027 foi aplicada transacionalmente no PostgreSQL configurado depois de tornar idempotente a constraint que o Drizzle havia aplicado parcialmente. `git diff --check` passou com avisos CRLF preexistentes.
- Check bloqueado externo: `npm run build` falha porque `vite.config.ts` não existe no checkout e o Vite recebe acesso negado ao resolver o caminho; não houve mudança de frontend nesta task.
- Commit: não criado. O worktree contém alterações não commitadas e sobrepostas de tasks paralelas nos arquivos de API/schema/runtime; um commit agora misturaria escopos. A entrega está delimitada nesta task para commit seguro após a integração da árvore.
- Próximo passo: P1-048; P1-053 somente após o frontend PEK estabilizar e receber Gate visual próprio.
