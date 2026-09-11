# Manifesto do Project Delivery Kit

| Campo | Valor |
| --- | --- |
| Versão do PDK | 1.17.0 |
| Adaptador local | Genérico |
| Fonte canônica opcional | `C:\Users\lucas\Documents\bedrock\tools\project-delivery-kit` |
| Estado da instalação | Configurar perfil do projeto e bloco do AGENTS.md |

## Componentes instalados

- `.codex/skills/project-architecture/SKILL.md`
- `.codex/skills/project-task-queue/SKILL.md`
- `.codex/task-queue/`
- `.codex/project-delivery-kit/project-profile.md`
- `.codex/project-delivery-kit/handoff-contract.md`
- `.codex/project-delivery-kit/HANDOFF-TEMPLATE.md`
- `.codex/project-delivery-kit/verification-strategy-contract.md`
- `.codex/project-delivery-kit/verification-strategy.md`

## Atualizações

Use a auditoria do PDK antes de atualizar. A cópia local é a referência operacional deste repositório até uma atualização explícita. Consumidores gerenciados são incluídos no relatório de impacto da fonte canônica, mas uma atualização continua exigindo diff e autorização de escrita.

## Extensões opt-in disponíveis

- `project-context-map`: mapa técnico, brief limitado e checagem documental de frescor.
- `project-automation-audit`: recomendações read-only de automações.
- `project-change-preflight`, `project-decision-ledger` e `project-release-management`: impacto, decisões e releases rastreáveis.
- `project-security-assurance`: revisão e evidência proporcionais de segurança, sem instalar scanners ou ferramentas externas.
- `project-compliance-assurance`: revisão proporcional de LGPD e obrigações declaradas, com fontes oficiais e sem substituir orientação jurídica.
- `project-multiagent-coordination`: plano de trabalho concorrente com dependências, ownership e checkpoints de integração, sem iniciar workers ou Git.

Instale extensões somente com a opção explícita do instalador.
