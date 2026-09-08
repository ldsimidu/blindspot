# ✅ Concluída — E01-01 Solicitar e aprovar organização

> Prioridade: P1
>
> Área afetada: identidade, dados de organização, API e auditoria
>
> Origem ou referência: `docs/product/backlog.md` E01-01; fluxo de conta
>
> Arquitetura: `APPROVED — Lucas aprovou operador temporário por chave de ambiente em 08/09/2026`
>
> Triagem automática: `Material — introduz dados corporativos e processo de aprovação.`
>
> Segurança: `A avaliar — dados pessoais/corporativos, API e auditoria.`

## Pedido

Implementar solicitação de organização, protocolo seguro, revisão por operador autorizado e aprovação/recusa sem conceder acesso diretamente.

## Critérios de aceite

- [ ] Pedido não cria sessão nem acesso antes da aprovação.
- [ ] Duplicidade e falhas não enumeram organizações ou e-mails.
- [ ] Decisão é auditável sem gravar segredo ou dados excessivos.

## Restrições ou contexto

- Exige decisão de tenancy, minimização de dados e responsável aprovador.
- Não inclui validação fiscal automática, preço, cobrança ou e-mail real.

## Preflight, arquitetura e revisão de segurança — 2026-09-08

### Fatos e lacunas

- Não há autenticação, sessão, organização, tenant, RBAC, operador ou política de retenção implementados. A UI atual não é fronteira de segurança.
- O backlog exige que aprovação não crie credencial: somente P1-010 poderá emitir convite único; P1-011/P1-013 estabelecerão login, sessão e autorização de longo prazo.
- A solicitação precisa de CNPJ, nome da empresa, responsável e e-mail corporativo; validação fiscal automática, e-mail real, preço e cobrança estão fora do escopo.

### Proposta de decisão e fluxo

1. `POST /api/organizacoes/solicitacoes` aceita somente nome empresarial, CNPJ normalizado (14 dígitos), nome de contato, e-mail e versão do aviso de privacidade. Retorna sempre um protocolo aleatório e a mensagem neutra **"Solicitação recebida para análise"**; não retorna existência, estado anterior ou dados de outra solicitação.
2. A persistência cria uma solicitação `received` com hash de CNPJ/e-mail para deduplicação interna, dados mínimos de revisão e protocolo armazenado somente como hash. Nenhuma organização, membro, senha, sessão, convite ou acesso é criada nessa etapa.
3. Um operador autorizado revisa a solicitação e decide `approved` ou `rejected`; a decisão grava identificador do operador, data e motivo padronizado/sanitizado. A aprovação cria uma organização `pending_activation`, mas não emite convite — P1-010 o fará.
4. Repetição de mesma empresa/e-mail recebe a mesma resposta externa neutra. Internamente, o evento é contabilizado sem apagar a primeira solicitação nem expor enumeração.
5. Retenção proposta: solicitações recusadas expiram após 90 dias; solicitações aprovadas preservam somente a trilha mínima de decisão enquanto a organização existir. Antes de job de retenção, a expiração será um campo e não uma exclusão automática.

### Segurança proporcional

- **Gatilhos:** dados pessoais/corporativos, API pública, persistência, autorização de operador e auditoria.
- **Ameaças principais:** enumeração de CNPJ/e-mail, criação prematura de conta, aprovação por cliente, replay do protocolo, coleta excessiva e logs com PII.
- **Controles:** limites de tamanho/formato, hash de campos usados para dedupe, protocolo aleatório de alta entropia armazenado como hash, mensagens neutras, erros sanitizados, nenhum segredo/token em log/resposta, decisão append-only e negação por padrão.
- **Limite crítico:** o checkout ainda não tem uma identidade autenticada para afirmar quem é operador. Aceitar `operator_id` no corpo ou confiar em botão de UI seria inseguro e foi rejeitado.

### Decisão pendente que bloqueia implementação

É necessário definir a autoridade temporária do aprovador antes de criar a rota de decisão. Proposta: um endpoint interno local protegido por `OPERATOR_APPROVAL_KEY` somente no ambiente (hash comparado em tempo constante), removido/substituído por sessão+RBAC na P1-013. A alternativa é não implementar aprovação até P1-011/P1-013, entregando agora somente a solicitação.

### Double-check

- O desenho não cria senha, sessão, convite, e-mail real, cobrança ou validação fiscal.
- A organização só nasce em estado `pending_activation`; acesso continua impossível até P1-010/P1-011.
- Nenhum mecanismo de operador foi presumido como seguro sem decisão explícita.
- Arquitetura: `READY`; aguarda `APPROVED` explícito para implementar.

## Resultado do agente

- Estado: `✅ Concluída`; Arquitetura: `APPROVED`; Segurança: `Aplicável — controles proporcionais registrados nesta task`.
- Implementação: schema/migration aditiva, HMAC de deduplicação, protocolo aleatório, rotas de solicitação/decisão, mensagens neutras e comparação em tempo constante. A aprovação cria somente organização `pending_activation`; não cria sessão, senha, convite ou acesso.
- Verificações: `npm run typecheck` e `npm run build` aprovados; migration P1-009 aplicada no Neon. Smoke contra a API local/Neon: criação 202/`received`, repetição com mesma resposta externa neutra, chave inválida 404 sanitizado, aprovação 200/`approved`, organização `pending_activation` e dois eventos de auditoria. Nenhum provider foi chamado.
- Limites e pendências: há uma organização de smoke `pending_activation` no Neon como evidência; P1-010 é responsável por convite/ativação e P1-011/P1-013 substituirão o operador temporário por sessão/RBAC. Retenção de 90 dias continua como política documentada, sem job automático neste corte.
