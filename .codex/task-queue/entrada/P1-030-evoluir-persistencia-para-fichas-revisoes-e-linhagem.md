# ❌ Pendente — Evoluir persistência para fichas, revisões e linhagem

> Prioridade: P1
>
> Área afetada: dados, API, migração e auditoria
>
> Origem ou referência: P1-029; proposta de pesquisa contínua
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — altera persistência e contratos de leitura.`
>
> Segurança: `Aplicável — dados persistidos, migração, auditoria e API.`

## Pedido

Evoluir a fundação PostgreSQL para que uma mesma configuração de veículo possa possuir várias fichas independentes, cada uma com revisões imutáveis e linhagem opcional. Migrar as versões atuais sem perda de payload, hash, fonte, acesso ou histórico.

## Critérios de aceite

- [ ] Uma `technical_sheet` pertence a uma configuração de veículo e pode coexistir com outras fichas da mesma configuração.
- [ ] Cada resultado publicado é uma `revision` imutável, ordenada por ficha e vinculada ao snapshot/execução que a originou.
- [ ] A migração converte o histórico atual de forma determinística, reversível e auditável.
- [ ] `latest`, `recommended` e `primary` não são sinônimos e têm escopo/precedência explícitos.
- [ ] Escritas usam idempotência, transação e optimistic locking ou equivalência aprovada; colisões não sobrescrevem dados.

## Restrições ou contexto

- Depende de P1-029 `APPROVED` e da conclusão/compatibilidade de P1-001.
- Não criar Knowledge Base, ranking, fork de UI ou merge nesta entrega.
- Preservar `fonte_ref`, hashes, `schema_contract`, organização/ator e respostas sanitizadas; nunca copiar prompt ou snapshot bruto para novas tabelas.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — migration e contrato de leitura.`
- Segurança: `Aplicável — revisão de migração, isolamento organizacional, retenção e rollback.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar P1-029 aprovado e Architecture Gate próprio.
