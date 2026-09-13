# ✅ Concluída — refatorar experiências de Equipe e Consumo

> Prioridade: P2
>
> Área afetada: interface, autorização e dados operacionais
>
> Origem ou referência: auditoria UX/UI; referência de gestão de usuários
>
> Arquitetura: `A avaliar na ativação`
>
> Triagem automática: `Material — ações administrativas e visibilidade por papel`
>
> Segurança: `Aplicável — equipe, papéis, revogação e consumo exigem revisão proporcional`

## Pedido

Refatorar as telas de Equipe e Consumo para que listas, status, ações administrativas, alertas e detalhamento mensal sejam compreensíveis e acionáveis.

## Critérios de aceite

- [ ] Equipe apresenta pessoa, papel, estado e ações permitidas de forma escaneável.
- [ ] Convite, alteração de papel, revogação e desativação deixam consequência e restrição claras.
- [ ] Consumo apresenta período, totais, política/alertas e detalhe sem confundir medição com cobrança.
- [ ] Acesso, dados e ações continuam restritos pelo papel e tenant no servidor.
- [ ] Nenhuma informação de outro tenant, token de convite ou detalhe sensível aparece na interface/erros.

## Restrições ou contexto

- Consultar fluxograma canônico, P1-013 a P1-016 e aplicar security assurance.
- Aplicar compliance assurance se o escopo alterar tratamento, retenção ou transparência de dados de membros.
- Não criar cobrança, e-mail automático ou nova política de cota.

## Resultado do agente

## Reescrita UX/UI — 2026-09-12

Esta task adota `docs/product/ux-ui-future-task-redesign-standard.md`: Equipe e Consumo serão superfícies operacionais de densidade progressiva, ação por contexto e consequências explícitas; as revisões PEK precisam incluir estados por papel, teclado, dados sensíveis e responsividade.

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar na ativação`.
- Triagem automática: `Material — administração, dados e autorização`.
- Segurança: `Aplicável — revisão obrigatória`.
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: Architecture Gate com controles de papel, tenant e dados pessoais.

## Architecture Gate — 2026-09-12

### Decisão e escopo

Refatorar Equipe e Consumo como duas superfícies operacionais: contexto primeiro, lista/detalhe depois e ação no objeto correto. Reutilizar exclusivamente os endpoints e permissões existentes. Não criar cobrança, e-mail, política nova, retenção, endpoint ou automação.

### Arquitetura visual

- **Equipe:** cabeçalho com propósito e convite; membros ativos em lista escaneável (pessoa, e-mail, papel, estado e ação); convites em região própria com estado e revogação. Alterar papel e desativar pedem confirmação contextual curta e retornam feedback persistente junto da linha; link de ativação aparece uma vez em superfície protegida, sem toast, log ou cópia automática.
- **Consumo:** período e definição no topo; resumo de unidades e falhas como leitura operacional, não preço; política/alertas em painel contextual e detalhamento abaixo. Alerta reconhecido mantém estado textual; período vazio, falha e ausência recebem próximo passo explícito.
- **Responsividade:** desktop em duas regiões apenas quando houver responsabilidade distinta; tablet empilha rail; mobile transforma linhas em blocos com pessoa/período e ação abaixo. Teclado segue cabeçalho → filtro → listas → ação de linha; foco, texto e ícone acompanham todos os estados.
- `NO_IMAGE`; sem movimento além de feedback local/reduced motion.

### Segurança e conformidade

- Gatilho: e-mails, papéis, convites, desativação e consumo tenant-scoped. Manter `credentials: same-origin`, autorização server-owned e mensagens neutras em falhas; nunca renderizar token de convite, dado de outro tenant ou detalhe interno de erro.
- Não há novo tratamento de dados, retenção, terceiro ou transferência; compliance não aplicável ao recorte visual. Reabrir se criar convite por e-mail, analytics ou nova transparência/retencão.

### Verificações e decisão

- Verificar typecheck/build/diff, admin versus não-admin, convite/revogação/desativação/papel, período/alerta/erro/vazio, teclado e renders 1440/768/390.
- `APPROVED — Lucas autorizou a implementação em 2026-09-12.`

## Resultado

- Implementação: componentes `TeamWorkspace` e `UsageWorkspace` extraídos para superfície operacional própria; ações existentes, RBAC e endpoints foram preservados.
- Arquivos: `apps/web/src/AdminWorkspaces.tsx`, `apps/web/src/admin-workspaces.css`, `apps/web/src/App.tsx` e esta task.
- Verificação: `npm run typecheck`, `npm run build` e `git diff --check` passaram; aceite visual concedido por Lucas em 2026-09-12.
