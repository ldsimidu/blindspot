# ❌ Bloqueada — Integrar governança de fichas no workspace PEK

> Prioridade: P1
>
> Área afetada: interface
>
> Origem ou referência: P1-047; proposta (2), seções 5, 7, 9 a 12 e 50 a 53
>
> Arquitetura: `A avaliar — depende de estabilização e ownership explícito do frontend PEK.`
>
> Triagem automática: `Material — visualização e ações administrativas de ficha.`

## Pedido

Consumir no workspace o contrato de tags, lifecycle e primary da P1-047, deixando claras as dimensões `latest`, `recommended` e `primary` sem ação automática.

## Critérios de aceite

- [ ] Tags apresentam origem/razão por texto e não dependem só de cor.
- [ ] Ação de primary/lifecycle/manual tag respeita capacidades do servidor, confirmação explícita, vazio/erro/sem permissão e não inventa estado no cliente.
- [ ] Ficha `stale` ou `archived` não é promovida automaticamente; alternativas permanecem disponíveis para leitura.
- [ ] Há evidência PEK/Design System para desktop, tablet, mobile e teclado.

## Restrições ou contexto

- Consumir apenas o workspace e endpoints da P1-047; não tocar em runtime, migrations, políticas, API ou autorização.
- Executar após estabilização do frontend PEK e Architecture Gate visual próprio.

## Resultado do agente

- Estado: `❌ Pendente — frontend explicitamente adiado por decisão de Lucas.`
- Próximo passo: aplicar Gate PEK/Design System quando houver ownership visual.

## Architecture Gate visual e técnico — 2026-09-12

### Fatos, decisão e escopo

- O workspace autenticado já retorna `latest_kind`, `recommended`, `primary`, estado da ficha, tags com origem/razão e as capacidades `manage_primary` e `manage_lifecycle` resolvidas pelo servidor.
- Os endpoints de primary, lifecycle e tag manual exigem administrador no servidor. O contrato de workspace não expõe uma capability específica para mutar tag manual; a interface não pode supor autorização a partir de um papel local.
- Decisão: deixar tags manuais e derivadas sempre legíveis com origem textual; disponibilizar primary e lifecycle somente pelas capabilities retornadas; registrar a ausência de capability de tags como leitura sem ação. Não há alteração de endpoint, autorização, runtime, schema, política ou persistência.

### Arquitetura PEK

- **Tela e composição:** cards de ficha exibem estado, tags, `latest` temporal, `recommended` indisponível e `primary` organizacional como dimensões separadas. Um painel administrativo contextual à ficha selecionada reúne confirmação explícita antes de primary/lifecycle. `NO_IMAGE`; nenhum movimento novo.
- **Sistema e responsividade:** usa status/texto e controles existentes, sem dependência externa. Desktop mantém card e painel em largura de leitura; tablet/mobile empilha informação e preserva controles de 44px. Teclado alcança ficha → governança → confirmação; cor nunca é o único sinal.
- **Estados:** sem capacidade, a ação não aparece; erro fica persistente no painel; `stale`/`archived` continuam legíveis e não são promovidos. Ações não atualizam o estado otimisticamente: recarregam o workspace autorizado após a resposta.

### Segurança, conformidade e double-check

- **Segurança aplicável:** ações administrativas autenticadas e tenant-scoped. A fronteira é ficha selecionada do workspace → capability server-owned → endpoint RBAC. A interface reutiliza `same-origin`, pede confirmação, não mostra IDs como conteúdo e usa erro neutro para negação/ausência.
- **Conformidade:** não aplicável neste recorte visual; não há nova coleta, retenção, transferência ou categoria de dado.
- **Double-check:** `latest` nunca vira `primary`/`recommended`; `recommended` indisponível não recebe CTA; ficha arquivada não se promove; tags preservam origem/razão textual; a ausência de capability de tag bloqueia corretamente a mutação no cliente.

`VISUAL_READY` e `APPROVED — Lucas autorizou a retomada das pendências de frontend em 2026-09-12.`

## Resultado do agente — 2026-09-12

- Implementação entregue: cards de ficha apresentam estado, tags com origem, primary organizacional e latest/recommended como conceitos independentes. O painel de governança consome capabilities server-owned, pede confirmação explícita para primary/lifecycle e recarrega o workspace após resposta — sem atualização otimista.
- Limite deliberado: a UI não oferece mutação de tag manual porque o contrato de workspace não expõe `manage_tags`; exibe a lacuna de forma textual em vez de supor autorização pelo papel local.
- Verificações aprovadas: `npm run typecheck`, `npm run build` fora do sandbox e `git diff --check`.
- Bloqueio real compartilhado com P1-051: falta ficha organizacional autorizada para validar visualmente os estados active/stale/archived, capabilities e diálogos de confirmação nos breakpoints definidos. Não foram criadas ou alteradas fichas persistentes apenas para teste.
- Commit: não criado para preservar o ownership de alterações paralelas já presentes em `apps/web/src/**`.
