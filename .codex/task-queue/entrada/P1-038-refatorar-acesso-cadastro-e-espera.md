# ❌ Pendente — refatorar acesso, cadastro e espera

> Prioridade: P1
>
> Área afetada: interface, autenticação e dados pessoais de cadastro
>
> Origem ou referência: UX-BS-005; `docs/product/ux-ui-direcao-alvo-e-decisoes.md`
>
> Arquitetura: `A avaliar na ativação`
>
> Triagem automática: `Material — autenticação e fluxo de dados pessoais`
>
> Segurança: `Aplicável — revisar autenticação, sessão, validação e armazenamento no cliente`

## Pedido

Refatorar as telas de login, cadastro corporativo e espera de aprovação para uma jornada em etapas, mantendo os contratos e estados reais do servidor.

## Critérios de aceite

- [ ] Cadastro separa empresa, responsável, credencial/privacidade e revisão sem perder dados em erro local.
- [ ] A espera mostra etapas concluídas, estado atual e próximo passo somente a partir de estados confirmados pelo servidor.
- [ ] Login, aprovação, recusa, erro neutro e atualização de status preservam a não enumeração e não vazam dados.
- [ ] Senha, token e dados de cadastro não são colocados em URL, logs, `localStorage` ou mensagens de erro.
- [ ] Desktop, mobile, teclado e leitores de tela preservam a tarefa.

## Restrições ou contexto

- Ler e aplicar `project-security-assurance` e `project-compliance-assurance` antes de implementar.
- Preservar fluxos, limites de senha, cookie HttpOnly e estados documentados no fluxograma canônico.
- Não criar prazo, push, e-mail ou etapa de aprovação inexistente no runtime.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar na ativação`.
- Triagem automática: `Material — autenticação e dados pessoais`.
- Segurança: `Aplicável — revisão obrigatória`.
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: gate com security/compliance e contrato atual de cadastro/sessão.
