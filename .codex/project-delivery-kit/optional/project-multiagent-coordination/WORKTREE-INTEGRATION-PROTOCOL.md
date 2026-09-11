# Protocolo de worktree e integração coordenada

## Antes de isolar

O orquestrador confirma task, Architecture Gate, autorização humana, plano válido, base de integração, owner de cada recurso crítico e estado limpo ou alterações preexistentes registradas. Sem esses dados, permaneça em execução única.

## Worker isolado

Cada worktree recebe ID da fatia, branch proposta, base, recursos permitidos/proibidos, dependências, contratos, verificações e formato de handoff. O worker não cria, remove ou troca worktree/branch sem autorização explícita para o alvo. Também não comita, faz merge, rebase, push, reset ou exclusão automaticamente.

## Handoff

Antes de integração, registre recursos efetivamente alterados, contrato produzido/consumido, dependências novas, verificações executadas/bloqueadas, divergência da base, riscos semânticos e próximo passo. Worker interrompido, branch divergente, conflito textual, conflito semântico ou validação bloqueada impede integração automática.

## Integração e revisão

O integrador confere a base declarada, sobreposição com ownership, compatibilidade de contratos, diffs, verificações por fatia e aceite conjunto. Só então pode sugerir uma operação Git; a pessoa autorizada decide e executa a operação. Após integração, o revisor confirma aceitação e o responsável decide sobre limpeza de worktree com alvo e recuperação explícitos.
