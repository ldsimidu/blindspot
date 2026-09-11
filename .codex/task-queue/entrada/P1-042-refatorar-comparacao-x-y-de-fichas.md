# ❌ Pendente — refatorar comparação X/Y de fichas

> Prioridade: P1
>
> Área afetada: interface, comparação e exportação contextual
>
> Origem ou referência: UX-BS-003; P1-017; referência de comparação em `evidence/ux-ui/references/inspiracoes-gerais/`
>
> Arquitetura: `A avaliar na ativação`
>
> Triagem automática: `Material — elegibilidade e leitura comparativa`
>
> Segurança: `Aplicável se tocar análise salva, exportação, autorização ou endpoints`

## Pedido

Refatorar seleção e leitura de comparação para veículos X e Y lado a lado por atributo, sem diluir bloqueios, fontes ou diferenças de qualidade.

## Critérios de aceite

- [ ] Seleção deixa claro o papel de X e Y, a versão e o mercado de cada ficha.
- [ ] Comparação elegível alinha valor, unidade, status, fonte e diferença por atributo.
- [ ] Bloqueio por identidade, mercado ou motorização é explicado sem exibir comparação inválida.
- [ ] Ausência, conflito e não aplicabilidade não recebem vencedor automático.
- [ ] Exportar/salvar aparecem apenas quando o contrato atual permitir.

## Restrições ou contexto

- Reutilizar a decisão de elegibilidade do servidor; a UI não pode reimplementar ou contornar a regra.
- Não alterar contratos de análise salva ou exportação nesta task sem gate adicional.
- Garantir alternativa compacta acessível para viewport pequeno.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar na ativação`.
- Triagem automática: `Material — elegibilidade e leitura comparativa`.
- Segurança: `A avaliar no gate`.
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: Architecture Gate com P1-017 e contratos de exportação.
