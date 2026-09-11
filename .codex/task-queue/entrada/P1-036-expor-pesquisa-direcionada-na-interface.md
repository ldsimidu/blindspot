# ❌ Pendente — Expor pesquisa direcionada, progresso e histórico na interface

> Prioridade: P1
>
> Área afetada: interface, API e acessibilidade
>
> Origem ou referência: P1-031/P1-032 e proposta, seções 14 a 17 e 65 a 66
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — nova jornada com operações assíncronas.`
>
> Segurança: `Aplicável — autorização de execução, instrução livre e exposição de progresso.`

## Pedido

Na página de ficha, substituir “pesquisar novamente” genérico por uma jornada orientada de Research Focus, com presets, seleção de categorias/variáveis autorizadas, recomendação explicável, progresso seguro e histórico de sessões.

## Critérios de aceite

- [ ] A pessoa entende a diferença entre continuar a ficha e criar outra ficha antes de confirmar a ação.
- [ ] Presets exibem alvo e política de fonte efetivos; configuração avançada valida combinações impossíveis e limites no servidor.
- [ ] Progresso exibe etapa, objetivo, contagem agregada e estado sem revelar prompt, conteúdo bruto, URL privada ou segredo.
- [ ] Sessões concluídas/fracassadas/parciais mostram resultado e revisão gerada, quando houver; não fingem sucesso.
- [ ] Fluxo atende navegação por teclado, rótulos, carregamento, erro, cancelamento e retorno à ficha.

## Restrições ou contexto

- Depende de P1-032 e P1-034; não criar polling, websocket ou analytics sem decisão própria no Gate.
- PEK não é solicitado nesta task; aplicar somente padrões de acessibilidade e UI existentes.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — UI conectada a operação e dados.`
- Segurança: `Aplicável — autorização e informação exibida.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar dependências e Architecture Gate próprio.
