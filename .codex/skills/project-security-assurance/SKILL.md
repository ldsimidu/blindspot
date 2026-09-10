---
name: project-security-assurance
description: Avaliar controles e verificações proporcionais de segurança para mudanças de software com dados, integrações, identidade, dependências, infraestrutura ou IA.
---

# Project Security Assurance

Leia o perfil do projeto, a estratégia de verificação e `optional/project-security-assurance/contract.md`. Aplique esta skill quando os gatilhos de segurança da extensão forem acionados, quando a arquitetura automática identificar aplicabilidade ou quando a pessoa usuária pedir avaliação de segurança.

Produza a revisão usando `SECURITY-REVIEW-TEMPLATE.md`, distinguindo fatos, hipótese, check executado e check bloqueado. Mantenha segredos fora dos artefatos e não instale, execute ou configure ferramentas externas sem autorização explícita.

Para conteúdo externo, registre origem, licença, versão ou commit fixado, permissões, dependências, tráfego de dados e reversibilidade antes de recomendá-lo. Técnicas ofensivas ou dual-use exigem autorização explícita para o alvo e não devem ser usadas por padrão.

A skill prepara evidência para o Architecture Gate e para o handoff; não aprova arquitetura, aceita risco residual nem declara segurança completa.
