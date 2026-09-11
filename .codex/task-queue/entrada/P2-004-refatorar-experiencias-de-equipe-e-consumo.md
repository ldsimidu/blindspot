# ❌ Pendente — refatorar experiências de Equipe e Consumo

> Prioridade: P2
>
> Área afetada: interface, autorização e dados operacionais
>
> Origem ou referência: auditoria UX/UI; referência de gestão de usuários
>
> Arquitetura: `A avaliar na ativação`
>
> Triagem automática: `Material — ações administrativas e visibilidade por papel`
>
> Segurança: `Aplicável — equipe, papéis, revogação e consumo exigem revisão proporcional`

## Pedido

Refatorar as telas de Equipe e Consumo para que listas, status, ações administrativas, alertas e detalhamento mensal sejam compreensíveis e acionáveis.

## Critérios de aceite

- [ ] Equipe apresenta pessoa, papel, estado e ações permitidas de forma escaneável.
- [ ] Convite, alteração de papel, revogação e desativação deixam consequência e restrição claras.
- [ ] Consumo apresenta período, totais, política/alertas e detalhe sem confundir medição com cobrança.
- [ ] Acesso, dados e ações continuam restritos pelo papel e tenant no servidor.
- [ ] Nenhuma informação de outro tenant, token de convite ou detalhe sensível aparece na interface/erros.

## Restrições ou contexto

- Consultar fluxograma canônico, P1-013 a P1-016 e aplicar security assurance.
- Aplicar compliance assurance se o escopo alterar tratamento, retenção ou transparência de dados de membros.
- Não criar cobrança, e-mail automático ou nova política de cota.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar na ativação`.
- Triagem automática: `Material — administração, dados e autorização`.
- Segurança: `Aplicável — revisão obrigatória`.
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: Architecture Gate com controles de papel, tenant e dados pessoais.
