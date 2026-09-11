# ❌ Pendente — Governar reputação e feedback de fontes

> Prioridade: P2
>
> Área afetada: políticas, dados, qualidade, API e auditoria
>
> Origem ou referência: P1-027/P1-028 e proposta, seções 28 a 33
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — altera governança de fonte e feedback humano.`
>
> Segurança: `Aplicável — políticas organizacionais, autorização e auditoria.`

## Pedido

Após evidência de uso suficiente, evoluir o bootstrap atual para reputação contextual, explicável e governada de fontes. Separar classificação de política, confiança observada e feedback autorizado; nenhuma pontuação pode alterar sozinha a validade estrutural de uma ficha.

## Critérios de aceite

- [ ] Reputação tem escopo e versão explícitos (por marca/mercado/categoria quando comprovadamente necessário), com expiração e razões auditáveis.
- [ ] Feedback humano é autorizado, append-only e separado de política organizacional e observação automática.
- [ ] Bloqueio de fonte exige papel, motivo e efeito definido; não apaga evidência histórica nem produz bloqueio global acidental.
- [ ] Fontes não aprovadas continuam classificadas sem bloquear pesquisa ampla, conforme política vigente.

## Restrições ou contexto

- Depende de P1-033, P1-034, RBAC e métricas agregadas que comprovem o benefício.
- Não usar aprendizado implícito por clique, coleta de dados pessoais ou modelo opaco nesta fase.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — política, persistência e permissões.`
- Segurança: `Aplicável — ação administrativa e trilha de auditoria.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar evidência de uso e Architecture Gate próprio.
