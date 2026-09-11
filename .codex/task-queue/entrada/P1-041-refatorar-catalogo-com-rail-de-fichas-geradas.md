# ❌ Pendente — refatorar catálogo com rail de fichas geradas

> Prioridade: P1
>
> Área afetada: interface e descoberta de catálogo
>
> Origem ou referência: UX-BS-004; `evidence/ux-ui/current/04-catalog-fichas/fluxo.txt`
>
> Arquitetura: `A avaliar na ativação`
>
> Triagem automática: `Material — descoberta e escopo de dados`
>
> Segurança: `Aplicável se alterar consulta autenticada, filtros ou acesso a fichas; avaliar no gate`

## Pedido

Refatorar o catálogo para separar filtros, resultados e um rail contextual de fichas já geradas, mantendo confirmação de identidade exata antes de abrir conteúdo.

## Critérios de aceite

- [ ] Resultados de busca, recentes e fichas já geradas têm função e origem claras.
- [ ] Rail de geradas respeita o escopo real de sessão/organização e não sugere compatibilidade automática.
- [ ] Filtros, paginação, vazio, erro e abertura de ficha preservam os contratos existentes.
- [ ] Identidade, versão, mercado e status permitem distinguir candidatas sem aproximação silenciosa.

## Restrições ou contexto

- Ler P1-024, P1-025, contrato de busca técnica e fluxo canônico antes da arquitetura.
- Não criar fonte de persistência, ranking pessoal ou inferência de compatibilidade nesta task.
- Aplicar security assurance se houver mudança de rota, autorização ou escopo de consulta.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar na ativação`.
- Triagem automática: `Material — descoberta e escopo de dados`.
- Segurança: `A avaliar no gate`.
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: Architecture Gate com contratos de catálogo.
