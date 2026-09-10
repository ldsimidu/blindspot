---
name: project-task-queue
description: Executar uma única task Markdown pendente após aplicar o Architecture Gate, quando o usuário disser "tenho uma tarefa para você" ou indicar arquivo em `.codex/task-queue/entrada/`.
---

# Project Task Queue

Leia `.codex/task-queue/INSTRUCOES.md`, `.codex/project-delivery-kit/project-profile.md`, `.codex/project-delivery-kit/verification-strategy.md` e a task escolhida.

Quando o usuário disser “tenho uma tarefa para você”, selecione somente uma task `❌ Pendente`, por prioridade `P0` a `P3` e ordem no nome. Um arquivo indicado tem precedência. Não retome automaticamente tasks em outro estado e não invente trabalho quando a fila estiver vazia.

Antes de mudar o estado, refine o pedido e registre a triagem: mecânica e isolada, ou material. Para mudança material, acione automaticamente o Architecture Gate e produza a arquitetura; não é necessário a pessoa usuária pedir “arquitetar”. Aplique também a avaliação de aplicabilidade de segurança e use `project-security-assurance` quando houver gatilho. Sem `APPROVED` ou `Não aplicável` justificado, mantenha a task pendente e produza somente a arquitetura. Com gate liberado, marque `🚧 Em execução`, implemente somente o escopo, verifique conforme a estratégia local e atualize o próprio arquivo. Use `✅ Concluída` somente após registrar implementação, arquivos, verificações, bloqueios e pendências; use `❌ Bloqueada` quando houver bloqueio real.

Se `.codex/project-delivery-kit/project-profile.md` ainda não estiver configurado, não execute a task: informe a lacuna e peça o perfil ou uma exceção explícita.
