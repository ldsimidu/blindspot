# Fila de tarefas em Markdown

Cada arquivo em `entrada/` é uma task independente. Mantenha pedido, estado e resultado no mesmo arquivo para preservar a evidência de execução.

## Uso

1. Copie `MODELO-TAREFA.md` para `entrada/` e renomeie para `P<prioridade>-<ordem>-<nome>.md`.
2. Preencha pedido, critérios de aceite, restrições e o campo **Arquitetura**.
3. Deixe o estado como `❌ Pendente`.
4. Diga “tenho uma tarefa para você” ou indique o arquivo desejado.

O agente escolhe uma única task pendente por prioridade `P0` a `P3` e, em empate, pela menor ordem no nome. Não retoma automaticamente tasks em execução, concluídas ou bloqueadas.

## Architecture Gate

Antes de mover a task para `🚧 Em execução`, o agente lê `.codex/project-delivery-kit/project-profile.md` e aplica o Architecture Gate.

- `Não aplicável`: registrar por que a mudança é mecânica e isolada.
- `APPROVED`: incluir link ou referência à arquitetura aprovada.
- Caso contrário: a task continua pendente enquanto o agente produz e revisa a arquitetura; não há implementação.

## Resultado

Após implementar e verificar conforme `.codex/project-delivery-kit/verification-strategy.md`, registre estado final, comportamento entregue, arquivos alterados, verificações executadas, verificações bloqueadas, limitações e próximo passo. Só então use `✅ Concluída`. Use `❌ Bloqueada` se faltar decisão, acesso, evidência ou autorização.
