---
name: project-architecture
description: Arquitetar uma mudança de projeto antes da implementação, com decisão, fluxo, impacto técnico e double-check que libera ou bloqueia o Architecture Gate.
---

# Project Architecture

Use esta skill antes de alterar feature, fluxo, integração, contrato, dado, automação ou comportamento material. Leia `AGENTS.md`, `.codex/project-delivery-kit/project-profile.md` e os arquivos reais afetados. Não implemente, não crie estrutura de produto e não modifique serviços externos durante a arquitetura.

Se o perfil do projeto estiver incompleto, trate regras técnicas, fontes de verdade e limites como desconhecidos. A arquitetura pode explicitar essa lacuna, mas não libera implementação até que o perfil seja configurado ou o decisor registre a exceção.

## Arquitetura necessária

Apresente decisão e escopo, pessoa usuária/operador e fluxo, informação e organização, impacto técnico, dados/confiabilidade, segurança/riscos e plano incremental com verificações. Diferencie fatos confirmados, propostas, hipóteses e decisões pendentes.

Se uma incerteza de problema, público, processo ou hipótese impedir o desenho, pare e proponha a investigação adequada em vez de congelar uma solução.

## Double-check

Antes de declarar `READY`, reabra os arquivos citados, confirme contratos e fontes, releia o fluxo por quem o usa, procure estados de ausência/erro, valide riscos e dependências e confirme que o plano não promete etapas futuras como se já existissem. Registre os achados em `Double-check da arquitetura`.

`READY` não permite implementar sozinho. Aguarde decisão humana explícita e registre `APPROVED` na arquitetura ou na task. Só então a task pode mudar para `🚧 Em execução`. Para alteração mecânica e isolada, registre `Não aplicável` e a justificativa na task.
