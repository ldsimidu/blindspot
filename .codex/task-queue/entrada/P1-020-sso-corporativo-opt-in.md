# ❌ Pendente — E01-05 SSO corporativo opt-in

> Prioridade: P1
>
> Área afetada: autenticação, integração IdP, API e administração
>
> Origem ou referência: `docs/product/backlog.md` E01-05; fluxo SSO
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — integração externa e autenticação.`
>
> Segurança: `A avaliar — issuer, audience, redirect, claims e tenancy.`

## Pedido

Adicionar SSO corporativo somente como configuração opt-in aprovada, validando issuer, audience, callback e claims antes de associar usuário à organização correta.

## Critérios de aceite

- [ ] Callback, issuer ou audience inválidos falham fechados.
- [ ] Claim não cria organização ou membro indevido.
- [ ] Indisponibilidade do IdP tem estado seguro e auditável.

## Restrições ou contexto

- Depende de P1-011 e P1-013.
- Não escolher/ativar Google, Microsoft ou outro IdP sem contrato e autorização.

## Resultado do agente

- Estado: `❌ Pendente`; Arquitetura: `A avaliar`; Segurança: `A avaliar`.
- Implementação: ainda não iniciada.
