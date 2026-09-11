# ✅ Concluída — E01-02 Convidar e ativar administrador inicial

> Prioridade: P1
>
> Área afetada: identidade, API, UI de onboarding e auditoria
>
> Origem ou referência: `docs/product/backlog.md` E01-02
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-08.`
>
> Triagem automática: `Material — tokens de ativação e risco de tomada de conta.`
>
> Segurança: `Aplicável — controles e verificações proporcionais definidos abaixo.`

## Pedido

Criar convite único, expirável e revogável para ativação do administrador da organização aprovada, com onboarding retomável.

## Critérios de aceite

- [x] Convite expirado, revogado ou reutilizado não ativa conta.
- [x] Ativação não expõe dados da organização ao destinatário inválido.
- [x] Criação e revogação possuem auditoria sanitizada.

## Restrições ou contexto

- Depende de P1-009 e da decisão de canal de envio.
- Não enviar e-mail/credencial real sem integração e autorização próprias.

## Preflight, arquitetura e revisão de segurança — 2026-09-08

### Decisão proposta

- O operador temporário da P1-009 cria ou revoga convite somente para organização `pending_activation`. O endpoint devolve token/URL uma única vez à chamada interna protegida por `OPERATOR_APPROVAL_KEY`; ele nunca entra em log, auditoria, resposta pública ou banco em texto puro.
- O token aleatório terá 32 bytes, será armazenado como HMAC com `INVITATION_TOKEN_HASH_KEY`, expira em 72 horas e é marcado `used` na mesma transação que cria o primeiro membro. Reuso, revogação, expiração ou token inválido devolvem a mesma resposta neutra.
- A ativação recebe token, nome e senha. A senha tem mínimo de 12 caracteres, usa `crypto.scrypt` nativo com salt aleatório e `PASSWORD_PEPPER` no ambiente; só salt, parâmetros e derivação são persistidos. Não haverá sessão, cookie, login, MFA ou SSO neste corte.
- A organização muda de `pending_activation` para `active` somente quando o convite é consumido e o membro inicial `admin` é criado. P1-011 autentica essa credencial; P1-013 substitui a chave temporária por RBAC.

### Segurança proporcional

- **Gatilhos:** segredo, token de uso único, credencial, dados pessoais, API, persistência, autorização e auditoria.
- **Ameaças:** roubo/replay do convite, enumeração de token/e-mail, senha em log, ativação de tenant errado e emissão indevida pelo cliente.
- **Controles:** HMAC de token, comparação em tempo constante, expiração/revogação/uso atômicos, senha nunca registrada, mensagens neutras, endpoint de emissão interno, `scrypt` fixo e pepper não persistido.
- **Risco residual:** não há rate limiter, envio por e-mail, MFA, sessão ou RBAC. A exposição fica limitada ao ambiente técnico local até P1-011/P1-013.

### Plano e verificações

1. Migration aditiva para membros, credenciais e convites; eventos append-only.
2. Emissão/revogação interna e ativação pública sem enumeração.
3. Smoke: token válido, replay, expirado/revogado, senha fraca, organização não ativada antes da transação e ausência de segredo nas respostas/logs.
4. Typecheck, build e revisão da fronteira de confiança.

### Double-check

- Não cria sessão nem habilita o catálogo para o membro ativado.
- Não envia e-mail, não registra token/senha em claro e não assume SSO/MFA.
- A arquitetura é reversível por revogar convites e desativar a organização, preservando auditoria mínima.
- Arquitetura: `APPROVED`; Lucas autorizou a implementação em 2026-09-08. `INVITATION_TOKEN_HASH_KEY` e `PASSWORD_PEPPER` foram configurados no ambiente e nunca registrados neste arquivo.

## Resultado do agente

- Estado: `✅ Concluída`; Arquitetura: `APPROVED`; Segurança: `Aplicável`.
- Implementação: migration `0004`, emissão/revogação interna, ativação transacional, membro `admin`, credencial `scrypt`, sanitização de caminho de token e documentação de produto.
- Verificações: `npm run db:migrate` passou no Neon; `npm run typecheck` passou; smoke retornou `202 → 200 → 201 → 200 → 404 → 400 → 200 → 404` para solicitação, aprovação, emissão, revogação, tentativa revogada, senha fraca, ativação e replay. O log confirmou caminho mascarado. `npm run build` permanece bloqueado pela ausência preexistente de `vite.config.ts`, fora deste escopo.
