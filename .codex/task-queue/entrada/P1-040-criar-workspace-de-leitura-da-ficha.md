# ❌ Pendente — criar workspace de leitura da ficha

> Prioridade: P1
>
> Área afetada: interface de ficha técnica
>
> Origem ou referência: UX-BS-002; P1-035; `docs/product/design-system.md`
>
> Arquitetura: `A avaliar na ativação`
>
> Triagem automática: `Material — leitura de dado rastreável`
>
> Segurança: `Não aplicável inicialmente — reavaliar se tocar exportação, sessão ou API`

## Pedido

Transformar a leitura da ficha em workspace do veículo: hero de identidade, resumo técnico/qualidade e seções progressivas de atributos.

## Critérios de aceite

- [ ] Marca, modelo, versão, ano-modelo e mercado aparecem antes de detalhes extensos.
- [ ] Valor, unidade, status, `fonte_ref`, completude e conflito continuam legíveis por atributo.
- [ ] Carregando, vazio, parcial, conflito, indisponível e erro têm mensagem e próximo passo seguros.
- [ ] Ações de comparar, exportar ou reportar continuam condicionadas à elegibilidade real.
- [ ] A leitura é utilizável por teclado, leitor de tela e viewport compacto.

## Restrições ou contexto

- Não alterar schema, prompt, normalização, política de fonte ou contratos de API.
- Não inventar imagem, preço, métrica ou qualidade ausente.
- Reutilizar primitives de P1-037 e preservar o fluxo canônico de consulta.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar na ativação`.
- Triagem automática: `Material — leitura de dado rastreável`.
- Segurança: `Não aplicável inicialmente; reavaliar no gate`.
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: Architecture Gate da UI da ficha.
