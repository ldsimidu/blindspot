# AGENTS.md

## BlindSpot

Leia `docs/architecture/`, o perfil do PDK e as instruções do domínio antes de alterar fluxo, schema, IA, API ou interface. O runtime canônico de prompt e schema fica em `packages/agent-runtime/assets/`; documentos em `docs/architecture/` não são fonte de runtime.

## Segurança

Nunca copie ou publique `.env`, logs, snapshots brutos de LLM, tokens ou credenciais. Mudanças de schema, prompt, endpoint público, provider, persistência ou contrato exigem Architecture Gate aprovado.

Antes de alterar autenticação, autorização, dados sensíveis, segredos, APIs públicas, integrações, dependências, CI/CD, infraestrutura ou IA com ferramentas, consulte `.codex/skills/project-security-assurance/SKILL.md`.

<!-- project-delivery-kit:start -->
## Project Delivery Kit

- Antes de alterar feature, fluxo, integração, contrato, dado, automação ou comportamento material, consulte `.codex/skills/project-architecture/SKILL.md` e aplique o Architecture Gate.
- Uma mudança só pode começar após arquitetura `APPROVED` ou justificativa explícita de `Não aplicável` na task; em ambos os casos, respeite as regras específicas deste repositório.
- Quando o usuário disser “tenho uma tarefa para você” ou indicar uma task em `.codex/task-queue/entrada/`, consulte `.codex/skills/project-task-queue/SKILL.md` e `.codex/task-queue/INSTRUCOES.md`.
- Antes de implementar, leia `.codex/project-delivery-kit/project-profile.md` e as instruções de domínio aplicáveis. Não sobrescreva, sincronize ou instale padrões sem pedido explícito.
<!-- project-delivery-kit:end -->

