# ✅ Concluída — Consolidar estados de variável e explicação de proveniência

> Prioridade: P1
>
> Área afetada: schema, validação, dados, API e interface
>
> Origem ou referência: proposta (2), seções 24 a 27, 34, 35, 69 a 71
>
> Arquitetura: `APPROVED — Lucas autorizou “perfeito, pode seguir” em 2026-09-12.`
>
> Triagem automática: `Material — contrato semântico de dados e evidência.`

## Pedido

Definir e aplicar a máquina de estados de variável (`unknown`, `not_found`, `not_applicable`, `conflicting`, `research_exhausted`, `pending`, `blocked`, confirmado/inferido/calculado quando aprovados), com explicação segura de por que um valor ou conflito foi mantido.

## Critérios de aceite

- [x] Schema, validador e persistência usam o mesmo vocabulário versionado; a integração visual foi extraída para P1-052 por decisão explícita de Lucas.
- [x] Uma explicação liga resolução a evidências permitidas sem expor trecho/prompt/metadado interno.
- [x] Conflito novo mantém alternativas; inferido/calculado nunca se apresenta como confirmado.
- [x] Migração de dados legados é auditável e não converte ausência em certeza.

## Restrições ou contexto

- Depende de P0-014 e P1-044; não implementar merge ou reputação nesta task.

## Architecture Gate — estados semânticos e proveniência explicável (2026-09-12)

### Fatos confirmados

- O schema canônico atual só reconhece `confirmado`, `parcial`, `inferido_minimamente`, `conflitante`, `nao_encontrado`, `nao_aplicavel` e `informado_na_entrada`. O normalizador e os consumidores de qualidade repetem subconjuntos desse vocabulário.
- `field_resolutions` persiste `status`, valor, referências de evidência e `resolution_kind`; `field_evidence` liga a versão, caminho e fonte. Isso já permite rastrear a evidência permitida de um campo, mas não mantém alternativas valor-a-valor para um conflito nem uma explicação segura para leitura.
- `research_sessions` e suas tasks agora expressam `queued`, `research_exhausted`, `failed` e `needs_rebase`, mas esses estados de trabalho não podem ser silenciosamente convertidos em um valor de ficha ou em `confirmado`.
- A proposta pede distinguir valor encontrado, inferido, calculado e informado pelo usuário; também pede que `unknown`, `not_found`, `not_applicable`, `conflicting`, `research_exhausted`, `pending` e `blocked` tenham significado no banco. Ela também pede proveniência mais ampla (URL, query, trecho e agente). URL, trecho, query, prompt e metadados internos não são necessários nem seguros para a explicação de produto desta task; o histórico reproduzível detalhado continua na P1-048.
- Há trabalho paralelo do PEK em `apps/web/src/**`. Lucas autorizou adiar alterações visuais; este Gate não autoriza editar esses arquivos.

### Decisão e contrato de estados

Introduzir `field-state-policy.json` como asset canônico versionado (`field-state-v1`) e uma projeção versionada `resolution_state` para cada resolução. O `status` histórico da ficha continua sendo aceito durante a migração, mas passa a ter um único mapeamento server-owned para o contrato novo; nenhum cliente escolhe livremente o estado, origem, evidência, versão ou explicação.

O estado de apresentação/persistência será uma enumeração fechada: `confirmed`, `partial`, `inferred`, `calculated`, `user_provided`, `unknown`, `not_found`, `not_applicable`, `conflicting`, `research_exhausted`, `pending` e `blocked`.

- `confirmed` exige valor e ao menos uma evidência aderente; é o único estado que comunica confirmação direta.
- `partial`, `inferred`, `calculated` e `user_provided` preservam valor quando aplicável, mas são rótulos mutuamente exclusivos e nunca são apresentados como `confirmed`. `calculated` exige regra/formula versionada e caminhos de entrada confirmados; sem isso, é inválido e não será produzido automaticamente neste corte.
- `unknown`, `not_found`, `not_applicable`, `research_exhausted`, `pending` e `blocked` não carregam valor. `research_exhausted`, `pending` e `blocked` são projeções da sessão/tarefa dirigida vinculada ao caminho, não uma mutação retroativa da revisão imutável.
- `conflicting` mantém valor publicado nulo e exige pelo menos duas alternativas, cada uma com valor e referências de evidência permitidas. Não há vencedor automático, regra de maioria, reputação ou merge nesta task.

O mapeamento de legado é explícito: `confirmado→confirmed`, `parcial→partial`, `inferido_minimamente→inferred`, `informado_na_entrada→user_provided`, `conflitante→conflicting`, `nao_encontrado→not_found`, `nao_aplicavel→not_applicable` e ausência/linha histórica sem status→`unknown`. Linhas existentes de conflito sem alternativas tornam-se `conflicting` com `alternatives_state: legacy_unavailable`: mantêm as fontes já registradas, mas não inventam valores alternativos. Elas exigem nova pesquisa ou revisão humana para ganhar alternativas detalhadas.

### Fluxo e explicação segura

1. O runtime/validador recebe somente o contrato de estado versionado e rejeita combinações incompatíveis: por exemplo, `calculated` sem inputs/fórmula, `confirmed` sem evidência ou `conflicting` sem alternativas.
2. A publicação achata cada campo em resolução, evidência e, quando necessário, alternativas normalizadas. A migration é aditiva e preserva payload, revisão, fonte e timestamps existentes.
3. A sessão dirigida cria somente projeções `pending`, `blocked` ou `research_exhausted` para seus paths elegíveis; uma nova revisão publicada substitui a projeção por sua resolução versionada, sem reescrever o passado.
4. Uma rota autenticada e tenant-scoped de explicação resolve `{sheet revision, field path}` no servidor e retorna apenas: estado/versão, tipo de resolução, IDs ou rótulos permitidos de fonte já autorizada, datas, referências de evidência, alternativas permitidas e razões enumeradas. Ela não retorna URL privada, trecho, conteúdo de fonte, prompt, query, modelo, agente, token, log ou metadado interno.

### Impacto técnico, segurança e conformidade

- **Runtime e dados:** schema, prompt canônico, normalizador, regras de fonte/evidência, `field_resolutions` e `field_evidence` passam a consumir a política. Nova tabela de alternativas e tabela/projeção de estado de pesquisa por campo guardam somente identificadores, valores técnicos, referências de evidência, razões enumeradas e versões. `field_resolutions` ganha `state_version` e `resolution_state`; o legado continua legível pelo adaptador.
- **API:** a explicação usa RBAC existente (`analyst|admin`), resolve organização e versão no servidor e gera auditoria allowlisted. Não há endpoint público, parâmetro de filtro livre, provider real ou exposição de conteúdo bruto.
- **Qualidade e pesquisa:** vetores e presets passam a ler a semântica central, sem contar `partial`, `inferred`, `calculated`, `user_provided`, ausência ou conflito como confirmação/evidência positiva. O planner pode materializar somente estados de trabalho permitidos pelos seus targets.
- **Segurança aplicável:** persistência, API autenticada, auditoria, estados derivados e IA/runtime. Riscos principais: IDOR de explicação, inversão de semântica para parecer confirmado, e vazamento de fonte/conteúdo interno. Controles: tenant em toda consulta, enum/versionamento/validação server-owned, alternativas sem vencedor, explicação allowlisted, auditoria sanitizada e fixtures de duas organizações/estados inválidos. Não serão instaladas ferramentas externas nem usados provider real ou conteúdo externo na verificação.
- **Conformidade aplicável:** a finalidade é transparência da pesquisa técnica autorizada. Permanecem dados técnicos, IDs organizacionais existentes, estados e referências já permitidas; não entra conteúdo de terceiros ou nova transmissão a provider. A [LGPD consolidada no Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), consultada em 2026-09-12, orienta finalidade, necessidade, transparência e segurança. Controlador, base legal concreta, retenção/descarte e transparência geral continuam sob validação do responsável competente; esta arquitetura não é parecer jurídico.

### Frontend — explicitamente adiado para handoff PEK

Há impacto de interface, mas **nenhum arquivo `apps/web/src/**` será alterado nesta task**. Depois da estabilização da refatoração PEK, uma task de integração consumirá somente o contrato de explicação e o Design System: rótulos textuais para todo estado, alternativas de conflito, estados vazio/erro, teclado e responsividade. Ela não poderá inferir estado, usar cor como sinal único, esconder conflito, nem chamar pesquisa automaticamente. O handoff será criado ao concluir o backend, com ownership e Gate visual próprios.

### Plano incremental e verificações

1. Criar a política canônica, tipos/adaptador de legado e fixtures para cada estado/combinação inválida.
2. Evoluir schema/validador/prompt e persistência aditiva de resolução, alternativas e projeções de sessão; fazer backfill auditável sem mudar payload histórico.
3. Centralizar consumo no planner, qualidade e serviço de explicação tenant-scoped com auditoria sanitizada.
4. Executar verificadores de contrato/migração/API, casos de duas organizações, conflito, cálculo sem inputs, dados legados e ausência de conteúdo sensível; depois `npm run typecheck`, `npm run build`, smoke simulated e `git diff --check`.

### Double-check da arquitetura

- O desenho separa estado de campo de estado de execução: `research_exhausted`, `pending` e `blocked` podem ser explicados sem adulterar uma revisão histórica.
- Encontrado, inferido, calculado e fornecido pelo usuário são semanticamente distintos; somente `confirmed` declara confirmação direta.
- Conflitos novos preservam alternativas e os legados permanecem honestamente incompletos, sem valor inventado ou vencedor implícito.
- A explicação atende à transparência da proposta usando evidência permitida, enquanto URL, query, trecho, prompt e metadados internos permanecem fora do contrato; a auditabilidade detalhada segue P1-048.
- A interface foi isolada por decisão explícita de Lucas, eliminando colisão com o PEK. Não entram merge, reputação, Knowledge Base, provider real, crawling ou alteração visual. Conclusão: `READY` para implementação backend somente após `APPROVED` explícito de Lucas.

## Resultado do agente

- Estado: `✅ Concluída em 2026-09-12 — recorte backend; interface extraída para P1-052.`
- Segurança: `Aplicável — API autenticada, persistência, auditoria e estados derivados; verificação tenant-scoped executada.`
- Conformidade: `Aplicável — não há nova categoria/destino de dados; explicação minimizada e sanitizada.`
- Frontend: `Nenhum arquivo apps/web/src/** foi alterado. Handoff PEK criado em P1-052.`

### Entrega backend — 2026-09-12

- Contrato: criado o asset canônico `field-state-policy.json` (`field-state-v1`) e a projeção central que mapeia os estados legados para `confirmed`, `partial`, `inferred`, `calculated`, `user_provided`, `unknown`, `not_found`, `not_applicable`, `conflicting`, `research_exhausted`, `pending` e `blocked`. `confirmed` exige evidência; `calculated` exige fórmula/inputs; conflito não aceita vencedor e exige alternativas novas.
- Runtime e validação: o prompt/schema aceitam alternativas de conflito; o validador rejeita confirmação sem evidência e conflito novo sem alternativas. As entradas legadas continuam legíveis e são mapeadas sem fabricar certeza.
- Persistência: migration `0026_field_states_and_explanations` adiciona estado/versão/razões a `field_resolutions`, alternativas normalizadas e projeções de estado de pesquisa por campo. Aplicada com sucesso no PostgreSQL configurado.
- Explicação e segurança: `GET /api/ficha-tecnica/versoes/:id/explicacao-variavel?path=<grupo.campo>` exige `analyst|admin`, resolve o tenant no servidor, audita leitura allowlisted e retorna apenas estado, razões, evidência permitida, título/tipo de fonte, data e alternativas. URL, trecho, prompt, query, modelo, agente, token, conteúdo bruto e metadados internos não entram na resposta.
- Pesquisa e qualidade: sessões passam a projetar `pending`, `research_exhausted` ou `blocked` pelos paths elegíveis. Os valores de ficha continuam imutáveis por revisão; a projeção explica a execução sem reescrever o payload histórico.
- Verificações: `npm run verify:field-states` (`FIELD_STATE_CONTRACT=PASS`), `npm run verify:quality-policy` (`QUALITY_POLICY_CHECK=PASS`), `npm run verify:research-plan` (`RESEARCH_PLAN_CONTRACT=PASS`), `npm run verify:quality-vector` (`QUALITY_VECTOR=PASS`), `npm run verify:research-session-execution-db` (`RESEARCH_EXECUTION=PASS`, incluindo duas organizações, estado projetado e resposta sem URL/prompt) e `git diff --check` passaram.
- Check bloqueado externo: `npm run typecheck` está bloqueado por `apps/web/src/ComparisonPanel.tsx:38` (índice de `missing_on_left`/`missing_on_right`), alteração paralela do PEK. Não houve edição de frontend nesta task; os arquivos backend desta entrega passam no TypeScript quando o erro externo é removido.
- Commit: não criado. O worktree já contém alterações não commitadas e sobrepostas de tasks anteriores nos mesmos arquivos de runtime/API/schema; um commit agora misturaria escopos paralelos. A entrega permanece delimitada nesta task para commit seguro após a integração da árvore de trabalho.
- Próximo passo: P1-047; P1-052 somente após frontend PEK estabilizado e novo Gate visual.
