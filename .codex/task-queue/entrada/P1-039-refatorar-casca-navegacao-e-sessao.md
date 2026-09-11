# ❌ Pendente — refatorar casca, navegação e sessão

> Prioridade: P1
>
> Área afetada: interface e autenticação
>
> Origem ou referência: UX-BS-001; Design System; P0-011
>
> Arquitetura: `A avaliar na ativação`
>
> Triagem automática: `Material — estrutura global e sessão`
>
> Segurança: `Aplicável — logout e visibilidade de destinos dependem de sessão/papel`

## Pedido

Substituir progressivamente a sidebar pela navegação superior responsiva e por um menu de sessão claro, preservando todas as rotas e controles de autorização.

## Critérios de aceite

- [ ] Destinos principais, item ativo, versão compacta e foco por teclado funcionam em desktop e mobile.
- [ ] Equipe e Consumo aparecem somente conforme o papel real; a ocultação visual não substitui validação de servidor.
- [ ] O logout existente continua acessível, possui estado de carregamento/erro e só limpa a interface após sucesso confirmado.
- [ ] A área útil das fichas, catálogo e comparação aumenta sem criar rolagem horizontal indevida.

## Restrições ou contexto

- Aplicar revisão de segurança proporcional para qualquer alteração de sessão/logout.
- Não alterar endpoints, RBAC ou semântica de rotas sem task/gate adicional.
- Integrar somente após P1-037 ou registrar exceção visual justificada.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar na ativação`.
- Triagem automática: `Material — estrutura global e sessão`.
- Segurança: `Aplicável — revisão proporcional`.
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: Architecture Gate com contrato de navegação e sessão.
