# 🚧 Em execução — E02-03 Validar qualidade, conflitos e revisão humana

> Prioridade: P1
>
> Área afetada: validação, dados, API, UI de QA e auditoria
>
> Origem ou referência: `docs/product/backlog.md` E02-03; fluxo de QA
>
> Arquitetura: `APPROVED — Lucas autorizou o corte A em 08/09/2026`
>
> Triagem automática: `Material — introduz decisões humanas, estados e dados de qualidade.`
>
> Segurança: `Aplicável — controles do corte A implementados; corte B depende de identidade e RBAC.`

## Pedido

Implementar regras de qualidade e conflito, preservando evidências, e uma fila de revisão humana que decide aprovar, reprocessar ou não confirmar sem sobrescrever a versão original.

## Critérios de aceite

- [x] Dados inválidos falham controladamente antes de publicação.
- [x] Conflito preserva fontes e estado; não elege vencedor automaticamente.
- [ ] Revisão registra decisão, ator autorizado e evidência mínima.

## Restrições ou contexto

- Depende de P1-002 e P1-003.
- Limiares numéricos não são políticas definitivas sem aprovação humana.

## Arquitetura proposta

### Decisão e escopo

**Fatos confirmados:** P1-002 já valida identidade e política de fontes; P1-003/P0-007 validam normalização, aplicabilidade e cobertura. O schema permite `conflitante`, mas não exige duas fontes para esse estado. O repositório PostgreSQL preserva fichas e fontes, porém não tem tabela de revisão. A API não tem autenticação, organizações ou RBAC — essas capacidades estão planejadas nas P1-011 e P1-013.

**Decisão proposta:** dividir a entrega em dois cortes, preservando a mesma task e sem fingir que existe revisão autorizada hoje:

1. **P1-004A — qualidade local e conflito seguro (agora):** política canônica de qualidade sem limiares numéricos de negócio; conflito exige ao menos duas `fonte_ref` distintas; o servidor cria alertas de qualidade sanitizados e mantém `conflitante` sem eleger vencedor. Nenhuma decisão humana, escrita de revisão ou endpoint de QA é criado neste corte.
2. **P1-004B — fila de revisão humana autorizada (depois de P1-011 e P1-013):** tabela append-only de decisões, ator autenticado, papel servidor, versão da ficha, evidência mínima, transições e auditoria. Sem identidade/RBAC, esse corte não é seguro e permanece bloqueado por dependência, não por ausência de esforço.

Após concluir P1-004A, a task continuará `🚧 Em execução` até o corte B ser liberado, ou será desdobrada formalmente caso Lucas prefira não manter tarefa aberta. Esta arquitetura não permite marcar a feature inteira como concluída antes da revisão autenticada.

### Fluxo de pessoa usuária e qualidade

1. O analista solicita a ficha exata; o runtime coleta, normaliza e valida cobertura/fonte.
2. A política de qualidade analisa somente invariantes determinísticos: formato, fonte, estado, conflito e cobertura. Não inventa score, faixa numérica, vencedor ou correção.
3. Se há conflito: a ficha retorna `conflitante`, `valor: null`, ao menos duas fontes e CF1; a resposta segue legível, mas não é promovida a confirmada.
4. Se há alerta estrutural: a publicação falha em 422 ou a resposta traz alerta sanitizado conforme a gravidade definida em política. Nenhuma resposta inválida é persistida.
5. Quando identidade/RBAC existirem, um revisor autorizado consulta a versão e o alerta, registra `aprovar`, `reprocessar` ou `nao_confirmar` com evidência mínima. A decisão cria nova versão/registro; jamais sobrescreve a ficha original.

### Impacto técnico do corte A

- Novo asset `quality-policy.json`: versão, regras estruturais e códigos de alerta; sem score, ML, limiar comercial ou fonte externa.
- `schema.json`: `campo_conflitante.fonte_ref` passa a exigir pelo menos duas fontes distintas; metadados de qualidade/alertas, se necessários, são aditivos e sanitizados.
- `validator.ts`/módulo puro: valida a política após fonte/aplicabilidade e antes de publicar; preserva `status`, `fonte_ref` e payload original.
- `prompt-builder.ts`/prompt: inclui política para o modelo declarar conflito em vez de escolher vencedor.
- Sem alteração de persistência, endpoint de revisão, UI de QA ou tabela nesta fase. A leitura atual continuará mostrando status/fonte; a interface de fila é explicitamente posterior.

### Desenho reservado para o corte B

- Tabela `quality_reviews`: id, `technical_sheet_version_id`, estado (`pending`, `approved`, `reprocess_requested`, `not_confirmed`), razão sanitizada, evidência de fonte, `actor_user_id`, timestamps e vínculo de decisão anterior quando houver.
- Criação de revisão só para ficha/versionamento existente; transições são validadas no servidor e append-only.
- Rotas e UI exigem tenant, usuário e papel de revisor; o ator vem da sessão validada, nunca do corpo HTTP.
- P1-011/P1-013 definem identidade, sessão, papéis, auditoria e isolamento antes de esse desenho ser implementado.

### Segurança e risco proporcional

- Gatilhos: IA que retorna dados, alteração de schema/prompt, persistência de alertas e futura auditoria/controle de acesso.
- Fronteira: fontes/LLM → validação de qualidade → ficha/persistência → futura ação de revisor.
- Ameaças: conflito reduzido a valor vencedor; fonte única declarada como conflito; corpo HTTP forjando ator; revisão sobrescrevendo versão; alerta expondo prompt/URL/payload bruto.
- Controles A: duas fontes distintas para conflito, `valor: null`, CF1, erros sanitizados, policy local versionada, sem endpoint de decisão e sem novo tráfego.
- Controles B: sessão/RBAC no servidor, `actor_user_id` derivado da sessão, transição allowlisted, append-only, evidência mínima e auditoria sem segredo.
- Risco residual: corte A não substitui revisão humana; ele apenas evita publicação enganosa e prepara estado rastreável. Lucas decide aceitar o corte ou esperar P1-011/P1-013.

### Plano incremental e verificações

1. Confirmar aprovação do corte A e o adiamento explícito da fila autenticada.
2. Criar policy, regra de conflito e fixtures de duas fontes/uma fonte, ausência, aplicabilidade e fonte incompatível.
3. Validar AJV, `fonte_ref`, status, typecheck, build e smoke simulated; nenhuma chamada de provider real.
4. Atualizar docs somente para marcar qualidade local como implementada e QA humana como dependente de identidade/RBAC.
5. Ao concluir P1-011/P1-013, reabrir o corte B com Architecture Gate que cubra tabela, rota, UI, autorização, auditoria e retenção.

### Double-check da arquitetura

- Confirmado: fonte e identidade já são validadas antes de persistir, ponto correto para a política local.
- Confirmado: o schema atual não exige duas fontes em conflito; essa lacuna é determinística e pode ser corrigida no corte A.
- Confirmado: não há sessão/usuário/papel no runtime; aceitar `actor` no request violaria a exigência de ator autorizado.
- Estados revistos: resposta válida, conflito com duas fontes, conflito com uma fonte, ausência, aplicabilidade, alerta estrutural, reprocessamento futuro, não confirmação e acesso indevido futuro.
- Conclusão: arquitetura `READY`. A implementação segura agora é o corte A; o corte B aguarda identidade/RBAC. Aguarda aprovação explícita de Lucas.

## Resultado do agente

- Estado: `🚧 Em execução`; Arquitetura: `APPROVED — corte A autorizado por Lucas`; Segurança: `Aplicável — revisão proporcional aplicada`.
- Corte A implementado: `quality-policy.json`, validação determinística pré-AJV, `campo_conflitante` com ao menos duas fontes distintas, valor nulo e observação (`CF1` ou texto); prompt e documentação canônicos atualizados. Não há eleição automática de vencedor, endpoint de decisão, persistência de revisão nem UI de QA.
- Verificações: `npm run typecheck`, `npm run verify:quality-policy`, `npm run verify:field-policy`, `npm run verify:normalization`, `npm run verify:source-policy`, `npm run verify:technical-sheet-catalog` e `npm run build` passaram em 08/09/2026. Smoke simulated em `POST /api/ficha-tecnica` para Ford Ranger XL 2024/Brasil retornou 200 com cobertura 204/204, 199/199 e 5/5.
- Corte B permanece pendente de P1-011 e P1-013: fila append-only, decisão humana, ator derivado da sessão e RBAC no servidor. A task não é concluída antes disso.
