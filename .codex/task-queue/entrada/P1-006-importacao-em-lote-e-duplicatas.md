# ❌ Bloqueada — E02-05b Importação em lote e duplicatas

> Prioridade: P1
>
> Área afetada: catálogo, persistência, jobs e revisão operacional
>
> Origem ou referência: `docs/product/backlog.md` E02-05; fluxo de lote/dry-run
>
> Arquitetura: `BLOCKED — depende da P1-005/Neon transacional`
>
> Triagem automática: `Material — escrita em lote e risco de corrupção de dados.`
>
> Segurança: `Aplicável — persistência, integração e auditoria; revisão registrada nesta task.`

## Pedido

Implementar importação por lote com dry-run, idempotência, progresso e encaminhamento revisável de colisões/duplicatas.

## Critérios de aceite

- [ ] Lote inválido não grava parcialmente.
- [ ] Reexecução idempotente não cria versões ou veículos duplicados.
- [ ] Colisão não faz merge irreversível automático e gera diagnóstico seguro.

## Restrições ou contexto

- Depende do catálogo P1-005 e de política de identidade aprovada.
- Não conectar fontes externas nem automatizar merge sem autorização.

## Preflight e Architecture Gate — 2026-09-08

### Fatos, lacunas e decisão

- **Confirmado:** a P1-005A implementou o contrato local de catálogo e a migration aditiva, mas está `❌ Bloqueada` porque o `Pool` do Neon não consegue concluir o transporte WebSocket neste ambiente. A P1-001/P1-005 são a fundação PostgreSQL prevista para leitura e escrita canônicas.
- **Confirmado:** não há fila de jobs, contrato de arquivo/linhas de importação, autenticação de operador, RBAC, política de retenção, nem decisão de merge. O runtime canônico continua em `packages/agent-runtime/assets/`; lote não pode contornar schema, fonte, identidade, qualidade ou versionamento.
- **Decisão:** não implementar importação em lote em modo `file`, não fazer dry-run que diverge da escrita futura e não criar fallback de snapshots. Isso violaria a transação, a idempotência e a regra de uma fonte de verdade.

### Revisão de segurança proporcional

- **Gatilhos:** escrita persistente em lote, endpoint/API, dados de produto, futura operação e auditoria.
- **Fronteira:** entrada de lote não confiável → parsing/validação → staging/dry-run → decisão de colisão → transação PostgreSQL → versão/fonte/progresso → resposta sanitizada.
- **Riscos principais:** gravação parcial, replay criando versões duplicadas, colisão convertida em merge, payload malformado/volumoso causando exaustão, detalhe de banco exposto e operação sem ator autorizado.
- **Controles necessários antes de implementar:** limite de tamanho/linhas e formato contratado; chave idempotente fornecida pelo cliente; staging transacional; validação da linha pelo mesmo pipeline de identidade/fonte/schema; estado `valid | duplicate | collision | invalid`; nenhuma escrita no dry-run; importação confirmada atômica ou com compensação explícita; diagnóstico sanitizado; ator e auditoria somente depois de P1-011/P1-013.

### Desenho reservado para quando a dependência for liberada

1. Criar upload/entrada estruturada explicitamente contratada, inicialmente somente JSON seguro e limitado; CSV, fontes externas e agendamento ficam fora do corte.
2. `POST /api/importacoes/dry-run` cria execução persistida, calcula hash do lote/chave de idempotência e devolve resumo por linha sem gravar veículos/fichas.
3. Cada linha recebe identidade completa e payload já validado; igualdade de hash/identidade é `duplicate`, ambiguidade é `collision`, e qualquer falha estrutural é `invalid`. Nenhum estado promove merge.
4. `POST /api/importacoes/:id/confirmar` é idempotente, revalida o dry-run e persiste somente linhas válidas em transação; colisões continuam pendentes para revisão humana futura.
5. A UI mostra progresso, resumo e diagnósticos seguros. Auditoria de ator, filas assíncronas e recuperação operacional exigem os Gates de identidade/RBAC/operação próprios.

### Double-check e estado

- A condição de aceite “lote inválido não grava parcialmente” não pode ser comprovada sem transação PostgreSQL funcional.
- A condição de reexecução idempotente exige uma tabela/índice de execução persistente, que não deve ser simulada no arquivo local.
- A condição de colisão revisável exige persistência confiável; merge automático permanece proibido.
- Conclusão: **Architecture Gate bloqueado por dependência real P1-005/Neon**. A task não está pronta para implementação e não é pulada silenciosamente; após desbloquear a P1-005, esta arquitetura deve ser reaberta para definir formato do lote, limites e operador autorizado.

## Resultado do agente

- Estado: `❌ Bloqueada`; Arquitetura: `BLOCKED — depende da P1-005/Neon transacional`; Segurança: `Aplicável — revisão proporcional registrada acima`.
- Implementação: não iniciada. Nenhuma rota, tabela, job, parser, arquivo externo ou escrita local foi criada.
