# Estratégia de verificação do BlindSpot

## Gate padrão

- `npm run typecheck`
- `npm run build`
- Smoke manual de `GET /api/health`, `POST /api/ficha-tecnica` no modo simulated e leitura da última ficha.

## Mudanças de contrato

Validar AJV, `fonte_ref`, status e completude com fixtures seguras antes de provider real.

## Mudanças com gatilho de segurança

Use `project-security-assurance` antes de alterar endpoint público, autenticação, provider LLM, schema, prompt, persistência, integração, dependência, CI/CD ou infraestrutura. Registre a fronteira de confiança, controles, checks executados, checks bloqueados e o responsável pelo risco residual.

Para API, validar cenários de entrada inválida, acesso não autorizado quando a autenticação existir, ausência de segredo nas respostas e isolamento entre ambientes. Para provider LLM, usar modo simulated ou ambiente autorizado; não enviar logs ou snapshots brutos para serviços externos durante a verificação.

## Limites

Provider real, dados externos e snapshots não são verificados sem autorização e ambiente configurado. Registre separadamente checks aprovados e bloqueados.
