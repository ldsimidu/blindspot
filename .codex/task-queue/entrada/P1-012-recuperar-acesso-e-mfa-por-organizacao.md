# ⏸️ Postergada — E01-04 Recuperar acesso e MFA por organização

> Prioridade: P1
>
> Área afetada: autenticação, sessão, API e UI
>
> Origem ou referência: `docs/product/backlog.md` E01-04
>
> Arquitetura: `Em refinamento — postergada por prioridade em 2026-09-08.`
>
> Triagem automática: `Material — recuperação de credencial e segundo fator.`
>
> Segurança: `A avaliar — account takeover, tokens e MFA.`

## Pedido

Implementar recuperação com token único e MFA exigível pela organização, revogando sessões anteriores após redefinição de credencial.

## Critérios de aceite

- [ ] Token é expirável, de uso único e não aparece em logs/respostas.
- [ ] Reset bem-sucedido revoga sessões anteriores.
- [ ] MFA obrigatório impede sessão incompleta e cobre falha/recuperação.

## Restrições ou contexto

- Depende de P1-011 e decisão de método/canal MFA.

## Preflight e Architecture Gate — 2026-09-08

### Fatos confirmados

- P1-011 já possui contas globais, credenciais `scrypt` com salt e `PASSWORD_PEPPER`, sessões opacas persistidas e logout por revogação.
- P0-008 adicionou cadastro pendente/aprovado/recusado; somente conta, membro e organização `active` podem obter sessão.
- Não há provider ou configuração de e-mail transacional, canal de entrega de token, biblioteca/protocolo de MFA, tabela de fatores, token de recuperação ou política de recuperação definida no runtime e no `.env.example`.
- O fluxo atual registra `401`/`403` esperados como erro técnico; P1-012 não deve ampliar logs com token, código, senha ou segredo de MFA.

### Segurança aplicável

- **Gatilhos:** autenticação, senha, token único, MFA, sessões, dados pessoais, API pública e persistência.
- **Ameaça principal:** tomada de conta por enumeração, vazamento/replay de token, bypass de MFA, reset concorrente ou sessão antiga ainda utilizável.
- **Controles mínimos que qualquer decisão precisa preservar:** resposta neutra para solicitação desconhecida; token/código aleatório, com HMAC no banco, expiração curta e uso único; não registrar segredo em URL/log/resposta; redefinição e revogação de todas as sessões em transação; MFA obrigatório bloqueia emissão de sessão até desafio válido; limitação de taxa e testes de replay/expiração.

### Decisões necessárias antes de READY

1. **Canal de recuperação:** qual canal autorizado entrega o token à pessoa usuária? Sem provider/canal não há como entregar um token sem expô-lo na API. Opções usuais são e-mail transacional aprovado, operação manual interna temporária ou postergar recuperação.
2. **Método MFA:** TOTP em aplicativo autenticador, código por e-mail, ou outro método corporativo aprovado. Cada escolha muda armazenamento, UX, dependências e recuperação do segundo fator.
3. **Política:** MFA é opt-in por organização ou obrigatório para todas? Quem pode exigir/desativar antes de P1-013/RBAC?

### Estado do Gate

- **Triagem:** material.
- **Segurança:** aplicável; revisão proporcional iniciada nesta task.
- **Arquitetura:** ainda não `READY`; não é seguro assumir delivery, MFA ou autoridade administrativa.
- **Próximo passo:** Lucas decide canal de recuperação, método de MFA e política de exigência; então registrar arquitetura completa, realizar double-check e aguardar `APPROVED` para implementar.

## Resultado do agente

- Estado: `⏸️ Postergada por decisão de Lucas`; Arquitetura: `Em refinamento — decisões de identidade pendentes`; Segurança: `Aplicável — controles mínimos registrados`.
- Implementação: ainda não iniciada; postergada para priorizar P1-013.
