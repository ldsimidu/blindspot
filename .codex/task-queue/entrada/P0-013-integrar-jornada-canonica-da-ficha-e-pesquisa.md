# 🚧 Em execução — Integrar jornada canônica da ficha e pesquisa

> Prioridade: P0
>
> Área afetada: API, persistência, interface e autorização
>
> Origem ou referência: proposta (2), seções 6, 10, 12 a 19, 63 a 66
>
> Arquitetura: `APPROVED — Lucas autorizou seguir com a P0-013 em 2026-09-12; frontend continua sob ownership do modelo PEK.`
>
> Triagem automática: `Material — substitui fluxo pontual por jornada integrada.`
>
> Segurança: `Aplicável — segurança e conformidade proporcionais avaliadas; sem mudança implementada.`

## Pedido

Unificar descoberta, confirmação da configuração, workspace de Vehicle, seleção/criação de Sheet, Focus, execução e retorno à revisão numa única jornada; remover dependência de UUID digitado e a geração pontual como caminho principal.

## Critérios de aceite

- [ ] A partir de uma descoberta exata, a pessoa chega ao workspace da configuração sem informar UUID.
- [ ] A interface distingue continuar Sheet, criar nova Sheet e criar a partir de revisão antes da confirmação.
- [ ] O Focus selecionado é enviado ao contrato estruturado e a sessão/revisão resultante volta ao mesmo workspace.
- [ ] Vazio, erro, acesso negado, configuração incompatível e sessão parcial têm estados acessíveis.

## Restrições ou contexto

- Depende de P0-012; preservar catálogo global apenas para descoberta.
- Não introduzir fork, merge, custom instruction ou provider novo.
- **Alerta de colisão front-end:** `apps/web/src/**`, inclusive `App.tsx`, `VehicleWorkspace.tsx`, `api.ts`, tipos e estilos relacionados, está reservado ao modelo PEK informado por Lucas. Esta task não pode escrever nesses paths até receber handoff/integração explícitos; o corte backend é separado e não declara a jornada visual como entregue sozinho.

## Architecture Gate — jornada canônica integrada (2026-09-12)

### Decisão e fluxo

Preservar o catálogo global como descoberta de uma `VehicleConfiguration` exata e criar uma transição explícita, autenticada e tenant-scoped para o workspace da organização. O workspace será a única superfície para selecionar/criar `TechnicalSheet`, escolher uma revisão-base e iniciar `ResearchSession`; o catálogo não ganha estado de ficha, sessão ou preferência organizacional.

```text
catálogo global (identidade exata)
  → abrir workspace da organização para a configuração
  → listar fichas, inclusive ficha sem revisão
  → continuar | criar vazia | criar a partir de revisão
  → criar sessão com Focus estruturado
  → executar e retornar ao mesmo workspace
  → mostrar estado sanitizado; impacto/qualidade permanecem no contrato da P1-045
```

O backend deve expor um contrato único de workspace contendo somente identidade exata, fichas do tenant, última revisão por ficha e estados seguros. A abertura pelo catálogo usa somente o ID de configuração retornado por uma descoberta/entrada exata; nenhuma rota aceita identidade aproximada, organização, ator, versão vencedora ou configuração de provider no corpo HTTP. Criar ficha e continuar permanecem ações distintas e auditadas. A execução usa a sessão existente e não promete pesquisa realmente dirigida: P1-044 continua responsável por transformar Focus em plano executável.

### Contratos e impacto técnico

- `GET /api/configuracoes-veiculo/:id/workspace` deve incluir fichas sem revisão e distinguir resposta `not_found`, `forbidden` e `found` por contrato sanitizado, sem enumerar recursos de outro tenant.
- `POST /api/configuracoes-veiculo/:id/fichas` cria somente ficha tenant-scoped, vazia ou a partir de revisão autorizada; não cria fork/merge nem promove `primary`.
- A resposta de criação/listagem de sessão deve permitir retorno ao workspace sem expor prompt, URL, texto de provider, segredo ou metadado interno. O contrato de impacto/recomendação é aditivo e pertence à P1-045.
- O frontend consumirá esses contratos por adaptador próprio do PEK depois do handoff. Esta task não escreve `apps/web/src/**` enquanto o owner externo estiver ativo.
- A geração genérica `POST /api/ficha-tecnica` permanece por compatibilidade até a jornada integrada passar por aceite; só então pode deixar de ser o caminho principal na interface. Ela não será removida nesta task.

### Coordenação de ownership

Execução concorrente autorizada somente como divisão semântica, sem workers adicionais criados por esta task:

| Fatia | Owner | Paths permitidos | Paths proibidos | Checkpoint |
| --- | --- | --- | --- | --- |
| API/contrato do workspace | P0-013 | `services/api/**`, testes/fixtures próprios e esta task | `apps/web/src/**`, assets de runtime, migrations sem gate | contrato HTTP e teste tenant-scoped antes do handoff |
| Jornada e apresentação | modelo PEK externo | `apps/web/src/**` e estilos/primitives definidos por ele | schema, API, migrations e contratos server-owned | handoff com APIs consumidas, tipos e verificação visual/funcional |
| Integração | um único integrador após handoff | somente arquivos explicitamente acordados | alterações paralelas não revisadas | diff, contrato e verificações finais |

Se o handoff mudar endpoint, tipo compartilhado, `App.tsx` ou `VehicleWorkspace.tsx`, a integração para e o plano é revisto. Não há lock de filesystem; a regra de ownership é a proteção contra colisão.

### Segurança e conformidade proporcional

**Gatilhos:** API autenticada, tenant, persistência, auditoria, UI que inicia IA e dados pessoais de conta/membro já presentes na sessão.

**Controles:** papel/organização derivam da sessão; UUIDs são validados; leitura e escrita filtram tenant; ações têm auditoria sanitizada; não há texto livre, provider novo, URL arbitrária, telemetria de conteúdo, cookies novos ou retenção nova. `Focus` é allowlisted e não concede estratégia, orçamento ou provider ao cliente.

**Conformidade:** a finalidade é permitir que membros autenticados operem pesquisa técnica de fichas da própria organização. Categorias pessoais se limitam aos identificadores mínimos já existentes de conta/membro/organização; não há dado sensível ou de criança/adolescente no novo contrato. Controlador, base legal, retenção/descarte e transparência da sessão permanecem responsabilidade de Lucas/organização e não são decididos por esta task. A referência é a [LGPD consolidada no Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), consultada em 2026-09-12, especialmente finalidade, necessidade, transparência e segurança; a [ANPD](https://www.gov.br/anpd/) foi consultada como fonte institucional. Não é parecer jurídico.

### Verificação e double-check

- Teste de contrato com dois tenants: UUID de configuração válido não pode revelar/criar ficha de outro tenant; respostas são neutras quando apropriado.
- Testes para ficha sem revisão, criação vazia, criação a partir de revisão própria, revisão de outro tenant, estado de sessão `partial|failed|cancelled|needs_rebase` e retorno ao workspace.
- Smoke authenticated somente em ambiente autorizado; modo simulated, sem provider real.
- `npm run typecheck`, `npm run build` quando o bloqueio preexistente for resolvido, `git diff --check` e revisão de contrato frontend/backend após o handoff PEK.

Double-check: o desenho não altera assets canônicos, schema JSON, provider, prompt, migração, fork, merge, `primary`, reputação, KB ou autopilot. O catálogo continua global apenas como descoberta e a UI não é modificada neste gate. Conclusão: `READY`.

## Resultado do agente

- Estado: `🚧 Em execução — corte backend concluído; integração frontend aguarda handoff PEK.`
- Arquitetura: `APPROVED — Lucas autorizou a P0-013 em 2026-09-12; implementação limitada ao corte backend enquanto o frontend estiver reservado.`
- Triagem automática: `Material — API, persistência, interface, autorização e jornada de IA.`
- Segurança: `Aplicável — revisão proporcional registrada; controles de tenant, conteúdo e auditoria definidos.`
- Conformidade: `Aplicável — finalidade, minimização e transparência registradas; base legal, retenção/descarte e responsável permanecem validação humana.`
- Coordenação: `frontend reservado ao modelo PEK externo; nenhum arquivo em apps/web será alterado nesta task sem handoff e checkpoint de integração.`
- Implementação: o contrato `vehicle-workspace-v2` agora lista fichas vazias e a última revisão por ficha sem duplicar fichas por versão; devolve identidade exata da configuração e capacidades server-owned por papel. A criação de ficha passa a retornar a referência de workspace e grava auditoria sanitizada. A execução de sessão devolve ficha/configuração para o retorno ao mesmo workspace. Não houve alteração de `apps/web/src/**`, assets canônicos, schema, migration, prompt ou provider.
- Arquivos alterados: `services/api/db/repository.ts`, `services/api/index.ts`, `services/api/research-sessions.ts`, `services/api/audit.ts`, `scripts/verify-workspace-contract.ts`, `scripts/verify-workspace-contract-db.ts`, `package.json` e esta task.
- Verificação: `npm run verify:workspace-contract`, `npm run typecheck` e `git diff --check` passaram. `npm run verify:workspace-contract-db` passou no PostgreSQL configurado com fixtures efêmeras de duas organizações, criação de ficha sem revisão, isolamento tenant e limpeza final. A primeira tentativa foi bloqueada pelo sandbox de rede; a repetição autorizada fora dele passou. Não houve provider real.
- Bloqueio de integração: o restante dos critérios é frontend e depende do handoff/checkpoint do modelo PEK para `apps/web/src/**`. Esta task não toca nesses arquivos para evitar colisão.
- Próximo passo: receber handoff PEK e integrar por um único owner; até lá, a próxima task independente de backend pode ser P0-014.
