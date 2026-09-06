---
name: project-automation-audit
description: Avaliar em modo somente leitura automações adequadas a um repositório consumidor do Project Delivery Kit.
---

# Project Automation Audit

Leia `AGENTS.md`, `.codex/project-delivery-kit/project-profile.md`, a estratégia local de verificação, o contrato da extensão e o contexto técnico aplicável. Inspecione somente o necessário para entender processos repetidos, falhas recorrentes, verificações ausentes e automações já existentes.

Produza uma auditoria conforme `AUDIT-TEMPLATE.md`. Recomende no máximo duas opções por categoria: skills, hooks, comandos rápidos, conectores, subagentes, templates ou verificações. Para cada uma, registre evidência, benefício, esforço, risco, autorização necessária e próximo passo.

Não instale, configure, edite, execute serviço externo, crie skill, hook, conector, comando ou task como efeito colateral. A auditoria não é aprovação de implementação: qualquer recomendação material passa pelo Architecture Gate.
