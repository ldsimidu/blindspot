# ✅ Concluída — E04-02 Medir consumo reproduzível

> Prioridade: P1
>
> Área afetada: eventos, persistência, API e organização
>
> Origem ou referência: `docs/product/backlog.md` E04-02; fluxo de consumo
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-08.`
>
> Triagem automática: `Material — dados de uso multi-tenant.`
>
> Segurança: `Aplicável — isolamento, privacidade, integridade de medição e auditoria.`

## Pedido

Registrar e agregar consumo por organização e período de forma reproduzível, deduplicada e acessível apenas a pessoas autorizadas.

## Critérios de aceite

- [ ] Eventos têm correlação e não são contados duas vezes em retry.
- [ ] Agregação não vaza consumo entre organizações.
- [ ] Método, período e estados de falha são documentados.

## Restrições ou contexto

- Depende de P1-013; limites comerciais não são inventados nesta task.

## Preflight, arquitetura e revisão de segurança — 2026-09-08

### Fatos confirmados

- P1-013 já vincula uma geração persistida a `organization_id`, `account_id`, `member_id` e `collection_run`; o mesmo servidor aplica sessão/papel e auditoria sanitizada. A ficha e o catálogo continuam globais, mas a execução que os produziu tem ator/organização.
- A única ação de consumo material existente no corte atual é gerar/publicar ficha técnica. Comparação, exportação e cotas/alertas ainda não existem e não devem ser simulados como uso real.
- `audit_events` é trilha de segurança, não um ledger de consumo: não possui unidade, definição da métrica nem chave única de consumo. Contar logs/auditoria faria o dado depender de retry de escrita e misturaria propósitos.
- Administrador já possui rota/UI de equipe; viewer e analyst não administram dados de organização. Não há preço, franquia, cobrança, limite contratual, retenção aprovada ou canal de alerta configurado.

### Decisão de arquitetura

#### Unidade e fluxo

1. **Unidade inicial:** `technical_sheet_persisted = 1` para cada `collection_run` concluída e persistida com sucesso por sessão `analyst|admin`. A unidade mede trabalho técnico persistido, não clique, visualização, tamanho de resposta, token de IA, preço ou cobrança.
2. O repositório cria o evento de consumo no mesmo transaction que cria `collection_runs` e a versão de ficha. A chave natural única é `collection_run_id`: reexecução interna, retry do insert ou reconsulta não duplicam a unidade.
3. Falha antes de persistir uma ficha cria evento `technical_sheet_persist_failed` com `units = 0`, resultado `failed`, request ID e organização/ator autenticados. Ela fica separada do total de unidades e não vira cobrança. Falha de autorização não cria consumo.
4. Administrador abre **Consumo**, informa período mensal `YYYY-MM` (mês corrente por padrão) e recebe somente agregado de sua organização: definição da unidade, início/fim do período, total de unidades de sucesso e totais por ação/resultado. A API não devolve membros, e-mails, request IDs, prompts, tokens, fichas ou eventos brutos.

#### Dados e contrato

- Migration aditiva cria `usage_events`: IDs de organização/conta/membro opcionais ao ator, `collection_run_id` opcional e único quando há sucesso, ação allowlisted, resultado (`succeeded|failed`), `units >= 0`, request ID e data. Índices suportam organização/período e a unicidade da execução.
- `collection_run_id` é a correlação primária do sucesso; `request_id` correlaciona a tentativa/falha com o log HTTP sanitizado. Nenhuma rota aceita organização, unidades, resultado ou ator enviados pelo cliente.
- `GET /api/organizacoes/consumo?period=YYYY-MM` exige `admin`, valida período e agrega no banco filtrando `organization_id = actor.organizationId`. Período inválido recebe `400`; nenhum evento de outro tenant é enumerado.
- A interface adiciona **Consumo** apenas para admin. Ela exibe o método, mês consultado, cartões/tabela de totais e estados sem dados/erro; não cria limite, alerta, preço ou download.

#### Segurança proporcional

| Risco | Controle |
|---|---|
| Forjar ou inflar unidades | servidor calcula ação, ator e unidade; sucesso nasce com a transação da ficha; cliente não escreve ledger |
| Duplicar em retry | `collection_run_id` único para sucesso e constraint no banco; agregação não usa log nem contador mutável |
| Vazamento entre organizações | filtro obrigatório no repositório e rota admin; resposta somente agregada, sem eventos brutos |
| Confundir telemetria com cobrança | definição retornada e documentada diz explicitamente que não é preço/cota/cobrança; P1-016 decide alertas depois |
| Privacidade em consumo | sem e-mail, IP, token, prompt, conteúdo de ficha ou texto livre em `usage_events`/resposta |
| Falha de ledger | geração persistida e evento de sucesso são atômicos; falha de gravação aborta a persistência. Evento de falha é melhor esforço, sem alterar unidade |

### Plano incremental e verificações

1. Criar migration/schema/serviço de uso com taxonomia fechada e agregação mensal por tenant.
2. Integrar sucesso à transação de persistência e falha controlada ao handler autenticado, sem mudar provider nem contrato de ficha.
3. Expor consulta de consumo para admin e tela acessível com a definição da unidade.
4. Atualizar pipeline, backlog e fluxograma para distinguir medição de preço/cota/alerta.
5. Aplicar migration no Neon autorizado; rodar `typecheck`, `build` e smoke com duas organizações: uma execução conta uma vez, retry interno não duplica, falha tem zero unidade, viewer/analyst e outro tenant são negados e resposta não contém identificadores pessoais/segredos.

### Double-check da arquitetura

- A fonte de verdade será uma tabela própria, não `audit_events` nem logs, pois segurança e medição têm semânticas/retenções diferentes.
- O sucesso é ancorado em `collection_run` já criado no transaction; portanto, não se promete idempotência completa de uma nova requisição de geração que efetivamente executa o provider de novo. Esse comportamento continua uma solicitação distinta; esta task apenas impede dupla contagem da mesma execução persistida.
- Importação já cria múltiplas fichas/execuções; cada `collection_run` persistida segue a mesma unidade, o que mantém a regra reproduzível sem inventar tarifa de lote.
- Não há limiar, alerta, preço, pagamento, exportação de relatório ou retenção definitiva nesta task. P1-016 depende desta base e decide essas políticas.
- O desenho usa a matriz P1-013/P1-014 e mantém a API, dados e UI dentro do escopo. Está `READY`, mas só pode ser implementado após `APPROVED` explícito.

## Resultado do agente

- Estado: `✅ Concluída`; Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-08`; Segurança: `Aplicável — controles implementados e verificados proporcionalmente`.
- Implementação: migrations `0009_usage_events` e `0010_usage_event_request_dedupe` aplicadas ao Neon. `usage_events` é ledger separado de auditoria; uma ficha persistida cria `1` unidade na mesma transação de `collection_runs`, e falha cria evento de `0` unidade sem mascarar o erro original.
- Acesso e interface: `GET /api/organizacoes/consumo?period=YYYY-MM` e a tela **Consumo** exigem `admin`, filtram organização no serviço e devolvem somente agregados mensais/definição da unidade.
- Verificações: `npm run typecheck` e `npm run build` concluídos; migrations concluídas; smoke no Neon confirmou unidade persistida, falha com zero unidade, isolamento entre organizações e retry de falha contado uma única vez.
- Limites deliberados: não há preço, cota, cobrança, alerta, exportação, retenção comercial nem contagem de comparação/exportação antes das features correspondentes.
