# ❌ Bloqueada — E03-02 Consultar e ler ficha com qualidade explícita

> Prioridade: P1
>
> Área afetada: API de consulta e interface de ficha
>
> Origem ou referência: `docs/product/backlog.md` E03-02; fluxo detalhado de consulta
>
> Arquitetura: `BLOCKED — depende da P1-005/consulta PostgreSQL exata`
>
> Triagem automática: `Material — altera API/UI e apresentação de dados rastreáveis.`
>
> Segurança: `Aplicável — API e dados de ficha; revisão registrada nesta task.`

## Pedido

Permitir localizar e ler fichas pela identidade exata, exibindo campos, unidade, status, fontes, versão e completude, com ausência e incompatibilidade explícitas.

## Critérios de aceite

- [ ] A leitura não confirma dados ausentes, conflitantes ou não aplicáveis.
- [ ] Estados de encontrado, não cadastrado, incompatível e erro são distintos.
- [ ] A ficha exibida identifica versão e fontes usadas.

## Restrições ou contexto

- Depende de P1-005 e P1-007; futuramente deve acoplar autorização server-side.

## Preflight e Architecture Gate — 2026-09-08

### Fatos, decisão e dependência

- **Confirmado:** P1-007A entregou a base acessível; `FichaDashboard` já representa campos, status e fontes quando a resposta contém rastreabilidade. A P1-005A criou o contrato local de descoberta/abertura exata, porém está `❌ Bloqueada` porque o transporte WebSocket do Neon falha antes da consulta transacional.
- **Confirmado:** os endpoints `latest/history` não identificam a ficha por uma consulta canônica nem fornecem os estados de catálogo exigidos. Usar snapshots locais para preencher essa lacuna violaria a restrição da P1-005 e poderia devolver uma resposta global/errada.
- **Decisão:** não implementar busca aproximada, autocomplete falso, fallback ao arquivo ou UI que trate a ficha mais recente como ficha solicitada. A leitura desta task só começa quando a abertura exata de P1-005 estiver comprovada em PostgreSQL.

### Revisão de segurança proporcional

- **Gatilhos:** API de leitura e dados de ficha; no futuro, dados corporativos/tenant.
- **Riscos:** identidade parcial abrir veículo errado; UI confirmar ausência/conflito; erro interno ou dado de outra organização ser exibido; controle visual ser confundido com autorização.
- **Controles reservados:** reutilizar exclusivamente a resposta discriminada de P1-005; detalhes somente após UUID + cinco campos canônicos; preservar `valor`, unidade, status, `fonte_ref`, fontes, versão e completude; renderizar ausência/conflito/não aplicável sem valor vencedor; erros sanitizados e estado `incompatible`; RBAC no servidor antes da exposição corporativa.

### Desenho reservado

1. Usar a descoberta paginada do catálogo para listar candidatas, exigindo escolha explícita.
2. Abrir com UUID e identidade completa; `found` mostra cabeçalho com versão/data/fontes/completude, `not_registered` oferece solicitação de coleta, `incompatible` explica a divergência e `error` preserva correlação sem detalhe interno.
3. A tabela de especificações mostra unidade/valor apenas quando o status permite; `nao_encontrado`, `nao_aplicavel` e `conflitante` permanecem visualmente distintos e nunca recebem confirmação artificial.
4. Filtros de categoria, tooltip de qualidade e histórico de busca só entram depois de definir privacidade e contrato próprio; comparação, exportação e reporte continuam fora de escopo.

### Double-check e estado

- A P1-007 satisfaz a base de acessibilidade, mas não substitui a fonte de dados exata.
- P1-005 não pode ser considerada concluída nem reutilizada como catálogo corporativo até o smoke Neon passar.
- As três condições de aceite dependem de resposta versionada e rastreável; não podem ser demonstradas com a última ficha local.
- Conclusão: **Architecture Gate bloqueado pela P1-005/Neon**. Ao liberar a dependência, reabrir esta task para confirmar contrato, autorização e cenários de ausência/conflito.

## Resultado do agente

- Estado: `❌ Bloqueada`; Arquitetura: `BLOCKED — depende da P1-005/consulta PostgreSQL exata`; Segurança: `Aplicável — revisão proporcional registrada acima`.
- Implementação: não iniciada; nenhuma API, UI ou contrato foi alterado para evitar uma leitura aproximada ou fallback silencioso.
