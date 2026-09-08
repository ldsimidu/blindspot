# ✅ Concluída — E01-03 Login, sessão segura e logout

> Prioridade: P1
>
> Área afetada: autenticação, API, UI, sessão e logs
>
> Origem ou referência: `docs/product/backlog.md` E01-03; fluxo de sessão
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-08.`
>
> Triagem automática: `Material — autenticação e endpoint público.`
>
> Segurança: `Aplicável — autenticação, credenciais, sessão, dados pessoais, API e logs.`

## Pedido

Implementar login por senha, sessão segura e logout, validando conta e organização ativas e respondendo de forma não enumerável.

## Critérios de aceite

- [x] Conta desativada ou tenant suspenso não obtêm sessão.
- [x] Logout revoga a sessão conforme política aprovada.
- [x] Falhas de login, força bruta e logs são tratados sem expor segredo.

## Restrições ou contexto

- Depende de P1-010 e ADR de identidade/senha/sessão.
- Não inclui SSO ou MFA; são tasks separadas.

## Preflight, arquitetura e revisão de segurança — 2026-09-08

### Fatos confirmados

- P1-010 cria `organization_members`, `password_credentials` e uma organização `active`, mas não cria sessão, cookie, rota de login ou identidade global.
- A credencial atual usa `scrypt-v1:N=16384,r=8,p=1,dkLen=64`, salt aleatório e `PASSWORD_PEPPER`; a verificação deve preservar esse contrato e não recalcular ou registrar senha em claro.
- `organization_members` permite o mesmo e-mail em organizações diferentes. Login somente por e-mail não pode escolher um tenant silenciosamente.
- A API usa Express, PostgreSQL/Neon e middleware de log sanitizado; não há Redis, IdP, MFA ou serviço de e-mail autorizados.

### Decisão proposta

1. Introduzir identidade global mínima e aditiva: `accounts` guarda e-mail normalizado e HMAC com escopo de conta; `organization_members` recebe `account_id`. A migration retrocompatível cria contas para membros existentes, associa-os por e-mail normalizado e mantém a credencial existente ligada ao membro nesta task. Assim, o P1-010 continua válido e P1-014 poderá adicionar membros sem duplicar identidade.
2. Criar `auth_sessions` com token opaco aleatório de 32 bytes, HMAC via nova `SESSION_TOKEN_HASH_KEY`, `account_id`, `organization_id`, `member_id`, emissão, expiração absoluta de 12 horas, último uso e revogação. O token nunca é persistido em claro, devolvido no JSON ou enviado a logs/auditoria.
3. `POST /api/auth/login` recebe e-mail e senha. Valida conta, membro e organização `active`, verifica `scrypt` em tempo constante e cria sessão somente para uma associação ativa. Se a conta tiver mais de uma organização ativa, a rota falha fechada com resposta genérica neste corte; seleção explícita de tenant só entra com P1-013/RBAC.
4. A sessão será transportada exclusivamente pelo cookie `HttpOnly`, `SameSite=Lax`, `Path=/`, sem `Domain`; em produção será `Secure` e terá prefixo `__Host-`. O ambiente local mantém cookie sem `Secure` apenas fora de produção para permitir smoke HTTP, sem alterar a regra de produção.
5. `POST /api/auth/logout` lê o cookie, revoga a sessão correspondente e limpa o cookie. Cookie ausente, inválido, expirado ou já revogado retorna sucesso neutro e não enumera sessão.
6. Limitação de força bruta será local e conservadora: até 5 tentativas por combinação HMAC do e-mail + IP em 15 minutos; acima disso responde `429` genérico. Não haverá bloqueio permanente de conta. Sem Redis, esse controle não cobre múltiplas instâncias nem reinícios; é risco residual explícito, não uma alegação de proteção distribuída.

### Fluxo proposto

`e-mail + senha → validação limitada → localizar identidade → verificar membro/organização ativos → scrypt + comparação em tempo constante → criar sessão hashada → cookie HttpOnly → acesso futuro`.

Falha em qualquer verificação de identidade, senha, membro, tenant ou sessão retorna mensagem neutra. Logout faz `cookie → HMAC → revogação idempotente → limpar cookie`; não desativa membro nem altera senha.

### Segurança proporcional

- **Gatilhos:** autenticação, credencial, sessão, cookie, API pública, persistência, logs e dado pessoal.
- **Ameaças:** credential stuffing, enumeração de conta/tenant, roubo/replay de sessão, fixation, IDOR por tenant, vazamento de senha/token em logs e invalidação incompleta.
- **Controles:** HMAC com segredo distinto para token; CSPRNG; cookies `HttpOnly`/`SameSite`/`Secure` em produção; rotação de token por login; expiração/revogação persistentes; login/logout neutros; `scrypt` com salt e pepper; rate limit por HMAC/IP; caminho de sessão sanitizado; rejeição de conta, membro ou organização inativa; transações para sessão e auditoria mínima sem segredo.
- **Risco residual:** não há MFA, SSO, recuperação, CSRF token, rate limit distribuído, detecção de anomalia ou RBAC. Lucas aceita ou reavalia esse risco antes de produção; P1-012/P1-013 e infraestrutura futura reduzem as lacunas.

### Impacto técnico e de dados

- Migration aditiva `0005`: contas, associação `account_id` e sessões; backfill transacional de membros existentes. Nenhuma senha, token, `.env`, log ou snapshot será migrado para o Git.
- Alterar `services/api/organizations.ts` somente para associar o administrador inicial a uma conta; criar módulo isolado de autenticação/sessão; expor somente as rotas de login/logout e middleware de leitura de sessão, sem proteger catálogo nesta task.
- Atualizar `.env.example` com `SESSION_TOKEN_HASH_KEY`, sem valor real; atualizar `docs/product/backlog.md`, fluxograma e pipeline HTTP somente após comportamento comprovado.
- UI mínima: formulário de login e ação de logout com estados de carregamento/erro neutro; nenhum dado de organização antes de sessão válida. Não haverá tela de seleção de tenant, recuperação, MFA ou SSO.

### Plano de verificações

1. Typecheck e inspeção da migration; aplicar no Neon somente após `SESSION_TOKEN_HASH_KEY` existir no `.env`.
2. Smoke isolado: login válido cria cookie sem token no JSON; senha/e-mail inexistente, membro inativo e organização inativa falham igualmente; sexto erro recebe `429`; logout revoga e segunda chamada é idempotente.
3. Consultar apenas contagens/estados no Neon para comprovar conta, sessão hashada e revogação, sem ler senha/token/e-mail.
4. Verificar que logs HTTP e de erro não contêm senha, cookie ou token; `npm run typecheck`; registrar separadamente qualquer bloqueio preexistente de build.

### Double-check da arquitetura

- Não confunde ativação (P1-010) com login: ativar continua sem sessão; somente login cria cookie.
- Não cria tenant por claim, não escolhe tenant duplicado em silêncio e não habilita RBAC antes da P1-013.
- Não usa token JWT autoportante; a revogação precisa de estado servidor porque logout e desativação futura devem ter efeito imediato.
- Não promete rate limit distribuído nem produção segura sem `NODE_ENV=production`, TLS e a chave nova configurada.
- A arquitetura está limitada a senha, sessão e logout; recuperação, MFA, SSO, gestão de membros e autorização de recursos permanecem fora do escopo.

## Resultado do agente

- Estado: `✅ Concluída`; Arquitetura: `APPROVED`; Segurança: `Aplicável`.
- Implementação: migration `0005` com `accounts`, associação de membro e `auth_sessions`; login/logout/sessão por cookie opaco, HMAC, expiração de 12 h e limite local; UI mínima de login/logout.
- Verificações: chave de sessão confirmada sem leitura do valor; migration no Neon passou; `npm run typecheck` passou; smoke retornou login inválido `401`, login válido `200` sem token no JSON, sessão `200`, logout `204`, sessão revogada `401`, segundo logout `204` e seis falhas `401,401,401,401,401,429`. Build permanece bloqueado pela ausência preexistente de `vite.config.ts`.
