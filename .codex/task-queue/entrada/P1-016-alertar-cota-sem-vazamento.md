# ✅ Concluída — E04-03 Alertar cota sem vazamento

> Prioridade: P1
>
> Área afetada: consumo, notificações e autorização
>
> Origem ou referência: `docs/product/backlog.md` E04-03
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-09.`
>
> Triagem automática: `Material — notificação e dados corporativos.`
>
> Segurança: `Aplicável — autorização, privacidade, persistência e notificações.`

## Pedido

Notificar apenas destinatários autorizados quando limiares de consumo aprovados forem atingidos, sem revelar consumo de outros tenants.

## Critérios de aceite

- [x] Limiar, destinatário e canal são configurados por política aprovada.
- [x] Alerta é deduplicado e auditável.
- [x] Falha de canal não expõe conteúdo ou segredo.

## Restrições ou contexto

- Depende de P1-015; não escolher provedor de notificação sem autorização.

## Preflight, arquitetura e revisão de segurança — 2026-09-09

### Fatos confirmados

- P1-015 mede somente `technical_sheet_persisted`: cada ficha persistida com sucesso vale uma unidade; falhas valem zero; não há preço, cobrança, franquia, limite padrão ou canal de notificação.
- A agregação atual já é filtrada por `organization_id` no servidor e só `admin` a consulta. P1-014 permite identificar administradores ativos da própria organização; membro inativo e sessão revogada não devem receber ou ler alertas.
- Não há provider de e-mail, fila, webhook, credencial de comunicação nem autorização para enviar dados a serviço externo. Não é seguro registrar um canal externo ou afirmar entrega de e-mail.
- O fluxo documental exige que política, limiar e destinatário tenham fonte explícita e que falha do canal não altere consumo. Os percentuais Ford são apenas proposta, não uma regra aprovada.

### Decisão de arquitetura

#### Política MVP e fluxo de pessoa usuária

1. O administrador abre **Consumo** e configura opcionalmente uma política mensal: `threshold_units` inteiro positivo para a unidade já definida por P1-015. A política nasce **desativada**, sem limiar implícito; configurar é a aprovação explícita da empresa para aquele tenant.
2. Após a transação que persiste a nova ficha e seu uso, o servidor agrega o mês corrente da organização. Se o total alcançar/superar a política ativa, cria um alerta interno deduplicado para aquele período/limiar. Uma falha nessa avaliação não desfaz a ficha nem o lançamento de uso.
3. Todos os administradores `active` da mesma organização veem o alerta dentro de **Consumo**. O conteúdo mostra somente período, total da própria organização, limiar e ação “revisar consumo”; não mostra membros, eventos brutos, fichas, prompts, custo ou dados de outro tenant.
4. A leitura marca o destinatário como reconhecido, mas não remove a trilha do alerta. Alterar/desativar política não apaga alertas anteriores. Não há e-mail, push, SMS, webhook, bloqueio de geração ou cobrança nesta task.

#### Dados, deduplicação e contratos

- Migration cria `organization_usage_policies` (uma por organização: limiar, ativo, versão e timestamps), `usage_alerts` (organização, período, limiar aplicado, total no disparo, estado) e `usage_alert_recipients` (alerta, membro, reconhecido em). Nenhuma tabela recebe e-mail, token, prompt, ficha, IP ou texto livre.
- O par `(organization_id, period, threshold_units)` de alerta é único. Reprocessar a mesma execução ou novas execuções acima do mesmo limiar não gera alertas duplicados; só a primeira transição para atingido cria alerta e destinatários.
- Novo contrato admin: consultar/atualizar política, listar alertas do tenant e reconhecer alerta próprio. A criação de alerta é interna; cliente nunca informa total, destinatário, organização, período ou estado.
- Se falhar a criação do alerta, a unidade de consumo permanece correta e a persistência de ficha não é revertida. A falha recebe evento sanitizado de auditoria/log técnico; uma avaliação posterior pode criar o alerta ausente de modo idempotente. Entrega in-app não depende de rede externa.

#### Matriz de autorização

| Ação | viewer | analyst | admin |
|---|---:|---:|---:|
| Consultar/alterar política da própria organização | não | não | sim |
| Ler/reconhecer alerta da própria organização | não | não | sim |
| Ler/alterar política ou alerta de outro tenant | nunca | nunca | nunca |
| Enviar e-mail/webhook externo | fora do escopo | fora do escopo | fora do escopo |

#### Segurança proporcional

| Risco | Controle |
|---|---|
| Vazamento de consumo entre empresas | todas as queries filtram `organization_id` do contexto; alertas não aceitam tenant no corpo/query |
| Limiar manipulado pelo cliente | validação inteira positiva no servidor; política só por admin; alteração auditada |
| Spam por repetição/retry | unicidade de alerta por tenant/período/limiar; destinatários únicos; reconhecimento idempotente |
| Destinatário revogado ainda ver alerta | leitura exige membro ativo; nova lista é criada apenas para admins ativos |
| Falha de canal afetar medição | canal é in-app/persistido; erro de alerta não muda ledger de consumo e não reverte ficha |
| Conteúdo sensível em notificação | payload fechado, sem e-mail, prompt, token, provider, custo ou ficha; nada é enviado para rede externa |

### Plano incremental e verificações

1. Criar schema/migration de política, alerta e destinatário com unicidade e índices por organização/período.
2. Criar serviço que avalia o total P1-015 após uso persistido e cria alerta/destinatários idempotentemente; registrar auditoria allowlisted.
3. Expor rotas admin e estender **Consumo** com configuração/lista/reconhecimento in-app.
4. Atualizar pipeline, backlog e fluxograma, distinguindo alerta interno de e-mail/cobrança/cota bloqueante.
5. Aplicar migration no Neon autorizado; rodar `typecheck`, `build` e smoke com duas organizações: sem política não alerta; ao atingir limiar alerta uma vez; admin do tenant lê/reconhece; viewer/analyst e tenant alheio recebem negação/ausência; desativar admin bloqueia leitura; falha simulada não muda consumo.

### Double-check da arquitetura

- O limiar não é inventado: não existe default e a organização o configura explicitamente. Isso permite o MVP sem transformar os números Ford em contrato.
- O canal é conscientemente **in-app**; nenhum provider, e-mail ou segredo externo é introduzido. A entrega não afirma que alguém foi notificado fora do sistema.
- O alerta é deduplicado por período e limiar, não por cada unidade, evitando ruído após o consumo já superar a meta.
- Alertas históricos não são apagados por mudança de política; a versão/limiar aplicado preserva a explicação. Política de retenção continua pendente.
- P1-015 permanece fonte da unidade; P1-016 não cria preço, bloqueio ou ajuste de consumo. O desenho está `READY`, mas exige `APPROVED` explícito antes de alterar dados, API e interface.

## Resultado do agente

- Estado: `✅ Concluída`; Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-09`; Segurança: `Aplicável — controles implementados e verificados proporcionalmente`.
- Implementação: migration `0011_usage_alerts` aplicada ao Neon. Política mensal é criada/alterada somente por admin, começa sem limiar padrão e é avaliada contra o ledger P1-015. Quando alcançada, cria alerta in-app único por organização/período/limiar e destinatários admin ativos.
- Acesso e auditoria: admins leem/reconhecem somente alertas da própria organização; reconhecimento é idempotente e eventos de política/criação/reconhecimento são sanitizados. Falha de alerta não altera ledger, preço, cota ou geração.
- Interface: tela **Consumo** configura política, exibe estado e permite reconhecer alerta interno. Não há e-mail, webhook, SMS, provider externo ou bloqueio de uso.
- Verificações: `npm run typecheck` e `npm run build` concluídos; migration concluída; smoke no Neon confirmou política ativa, alerta deduplicado, bloqueio cross-tenant e reconhecimento.
- Limites deliberados: política de retenção, entrega externa, quotas comerciais, preço/cobrança e suspensão automática seguem fora do escopo.
