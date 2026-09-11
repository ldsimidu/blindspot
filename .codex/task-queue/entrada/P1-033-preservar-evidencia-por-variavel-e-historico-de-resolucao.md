# ❌ Pendente — Preservar evidência por variável e histórico de resolução

> Prioridade: P1
>
> Área afetada: schema, dados, validação, API e qualidade
>
> Origem ou referência: P1-004, P1-027 e proposta, seções 24 a 35
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — altera semântica de proveniência e resolução.`
>
> Segurança: `Aplicável — dados de proveniência, API e retenção.`

## Pedido

Evoluir o vínculo atual de fonte por versão para evidência consultável por variável, preservando o payload validado e os estados sem inventar um “fato vencedor” automático. Criar histórico de resolução que explique por que uma revisão escolheu, manteve conflito ou declarou desconhecimento.

## Critérios de aceite

- [ ] Cada valor publicado referencia evidências imutáveis com `source_ref`, localização/trecho seguro quando disponível, método e momento de observação.
- [ ] A fonte continua canônica por URL e sua classificação de política permanece server-owned.
- [ ] Conflitos mantêm alternativas e motivos; uma resolução automática só é possível por regra aprovada, explicável e reversível.
- [ ] Edição/decisão humana futura não altera evidência original e deixa ator, motivo e revisão resultante auditáveis.
- [ ] APIs não expõem conteúdo bruto, dados proibidos de fonte ou metadados internos de provider.

## Restrições ou contexto

- Depende de P1-030 e deve integrar o corte B de P1-004, não duplicar a fila de revisão humana.
- Não introduzir scraping, download de URL arbitrária ou nova reputação de fonte nesta task.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — schema de proveniência e revisão.`
- Segurança: `Aplicável — retenção, exposição de conteúdo e autorização de revisão.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar arquitetura de P1-029 e Gate próprio.
