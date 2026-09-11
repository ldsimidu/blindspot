# ❌ Pendente — Projetar conhecimento compartilhado e reuso controlado

> Prioridade: P2
>
> Área afetada: dados, evidência, custo, API e isolamento organizacional
>
> Origem ou referência: proposta, seções 54 a 56
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — cria nova camada de dados e reuso entre fichas.`
>
> Segurança: `Aplicável — isolamento, retenção e reuso de evidência.`

## Pedido

Desenhar e, somente se métricas comprovarem economia segura, implementar um repositório de evidências compartilháveis por Vehicle. A camada deve reutilizar evidência, nunca copiar uma decisão/resolução privada de uma ficha para outra.

## Critérios de aceite

- [ ] O reuso é opt-in por sessão/ficha e mostra origem, escopo, compatibilidade de identidade e data da evidência.
- [ ] Evidência incompatível por mercado, ano-modelo, versão ou política não é aplicada automaticamente.
- [ ] Uma ficha conserva sua própria revisão, decisões e qualidade mesmo quando consulta conhecimento compartilhado.
- [ ] Regras de organização, retenção e acesso impedem vazamento entre tenants.

## Restrições ou contexto

- Depende de P1-033 e de dados de custo/duplicação; inicialmente preferir cache de descoberta com TTL e chave explícita, se aprovado.
- Não criar “verdade global” nem substituição automática do payload de ficha.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — dados compartilhados e isolamento.`
- Segurança: `Aplicável — tenancy, proveniência e retenção.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar evidência de necessidade e Architecture Gate próprio.
