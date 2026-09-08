# Fluxograma visual do BlindSpot e guia para desenvolvimento do agente

> **Referência principal de fluxo.** Este documento consolidou o fluxograma anteriormente mantido em HTML em um Markdown navegável e acrescenta o fluxo técnico que uma pessoa desenvolvedora deve seguir ao evoluir o agente. É a única referência de fluxograma ativa em `docs/product`.

## Como ler

| Marca | Significado |
|---|---|
| 🟢 Implementado | Há evidência no checkout atual. |
| 🟠 Parcial | Há parte do caminho, mas não prontidão corporativa completa. |
| 🔵 Planejado | Está no backlog; não existe como capacidade comprovada. |
| 🟣 Proposta / a decidir | Precisa de decisão antes de implementação. |
| 🔴 Gate | Segurança, qualidade ou autorização; a falha deve bloquear o avanço. |

**Precedência:** comportamento atual vem de `services/api/`, `packages/agent-runtime/assets/`, `apps/web/` e evidências locais. O [backlog](backlog.md) descreve intenção; os documentos em [arquitetura](../architecture/agent-core/) podem ter nomenclatura histórica e não substituem o runtime.

## 1. Mapa consolidado da jornada

```mermaid
flowchart LR
  semConta([Sem conta]) --> pedir[Solicitar acesso corporativo\nE01-01 · RF09]
  pedir --> empresa{Empresa aprovada?}
  empresa -- não --> recusa[Recusa segura\nsem sessão]
  empresa -- sim --> convite[Convite único e ativação\nE01-02]
  convite --> identidade{Senha ou SSO/MFA válidos?}
  identidade -- não, expirado ou IdP indisponível --> recuperar[Recuperar ou reenviar ativação]
  identidade -- sim --> acesso{Servidor valida\nsessão + tenant + papel + recurso\nE01-03/E01-06}
  acesso -- negado --> bloqueio[Ação bloqueada\nfalha fechada]
  acesso -- autorizado --> consultar[Consultar ficha\nidentidade exata · RF01]

  consultar --> qualidade[Gerar/localizar, normalizar\ne validar schema + fonte_ref\nRF02–RF06]
  qualidade --> utilizavel{Ficha utilizável?}
  utilizavel -- inválida/ausente --> coleta[Solicitar ou reprocessar coleta\nsem sucesso falso]
  coleta --> qualidade
  utilizavel -- conflito/baixa confiança --> qa[QA revisa evidência\nreprocessa ou não confirma]
  qa --> qualidade
  utilizavel -- sim --> leitura[Ver campos, status,\nfontes, versão e completude\nRF04/RF06/RF12]

  leitura --> acao{Próxima ação}
  acao -- comparar --> compat{Fichas compatíveis?\nRF07}
  compat -- não --> semComparacao[Explicar incompatibilidade\nsem vencedor automático]
  compat -- sim --> comparativo[Comparar e salvar\nversões preservadas]
  acao -- exportar/compartilhar --> exportar{Papel, tenant e\nconteúdo autorizados?}
  exportar -- não --> semExportacao[Não gerar arquivo/link]
  exportar -- sim --> artefato[Exportar ou compartilhar\nfontes + versão + auditoria\nRF08]
  acao -- reportar --> reporte[Reportar ficha, versão e campo]
  reporte --> resolver[QA resolve: corrigido,\ndevolvido ou não confirmado]

  acesso --> admin{Administrador?}
  admin -- sim --> membros[Gerir membros\nconvite, papel, desativação]
  admin -- sim --> consumo[Registrar/agregar consumo\nRF10]
  consumo --> limite{Limiar atingido?}
  limite -- sim --> alerta[Notificar destinatário\nautorizado · RF11]
  limite -- não --> sair([Logout])
  membros --> sair
  comparativo --> sair
  artefato --> sair
  resolver --> sair
  leitura --> sair

  health[Health, logs sanitizados,\nlatência e correlação · RF13] -. indisponibilidade .-> incidente[Classificar incidente e\ncomunicar estado seguro]
  incidente -. impacto .-> recuperar

  classDef atual fill:#153b2b,stroke:#40c986,color:#fff;
  classDef parcial fill:#523814,stroke:#e7a43c,color:#fff;
  classDef futuro fill:#1b315e,stroke:#6f93ff,color:#fff;
  classDef decidir fill:#432859,stroke:#b780e3,color:#fff;
  classDef gate fill:#542126,stroke:#ff626b,color:#fff;
  class qualidade,consultar,health parcial;
  class convite,coleta,qa,comparativo,artefato,reporte,resolver,membros,consumo,alerta,incidente futuro;
  class pedir,empresa,identidade,utilizavel,acao,admin,limite decidir;
  class acesso,compat,exportar gate;
```

As setas tracejadas indicam operação e indisponibilidade. A autorização é sempre uma decisão de servidor; controles da interface nunca bastam para liberar um recurso.

## 2. Consulta de ficha: detalhe que orienta o agente

```mermaid
flowchart LR
  v[1. Informar veículo\nmarca, modelo, versão, ano-modelo, mercado] --> entrada[2. Validar entrada\ntrim; ano inteiro 1900–2100]
  entrada -- erro 400 --> corrigir[Corrigir dados e reenviar]
  entrada --> localizar[3. Localizar ficha/histórico\nidentidade, versão e mercado]
  localizar --> existe{4. Há versão válida,\nrastreável e permitida?}
  existe -- sim --> abrir[5. Abrir ficha\nvalor, unidade, status, fonte e completude]
  existe -- não --> fila[5a. Solicitar coleta\nfila/progresso explícitos]
  fila --> fontes[5b. Coletar fontes\norigem, data e identidade exata]
  fontes --> governar[5c. Conferir identidade exata\ne política de fontes]
  governar --> normalizar[5d. Normalizar\nvalores/unidades sem perder origem]
  normalizar --> validar[5e. Validar saída\nschema, fonte_ref, ausência e conflito]
  validar --> estado{Confirmada e utilizável?}
  estado -- sim --> abrir
  estado -- conflito/ausência --> revisao[Expor estado ou encaminhar QA\nNunca confirmar artificialmente]
  revisao --> fila
  abrir --> proxima[6. Comparar, exportar, reportar ou sair]
```

O endpoint atual aceita corpo plano ou `{ "vehicle": { ... } }`. Campos obrigatórios: `marca`, `modelo`, `versao`, `ano_modelo` e `mercado`. Na experiência planejada, a busca mostra estados de **carregando**, **encontrado**, **não cadastrado**, **incompatível** ou **erro**; nunca devolve uma configuração aproximada em silêncio. O histórico local não deve ser confundido com persistência corporativa/versionada em banco, que ainda é planejada.

## 3. Persistência, catálogo e versões (planejado)

```mermaid
flowchart LR
  validada[Resposta validada\nAJV + fonte_ref + status] --> gravar{Transação de persistência\nautorizada?}
  gravar -- falha --> erroBanco[Erro explícito com correlação\nsem URL, SQL ou segredo]
  gravar -- sim --> identidade[Localizar/criar configuração\nmarca, modelo, versão, ano, mercado]
  identidade --> duplicata{Identidade/versão\njá existem?}
  duplicata -- não --> versao[Nova ficha append-only\npayload, schema, fontes, data]
  duplicata -- atualização válida --> novaVersao[Criar nova versão\nsem sobrescrever a anterior]
  duplicata -- colisão/incerteza --> revisar[Encaminhar duplicata\npara revisão; não mesclar sozinho]
  versao --> atual[Marcar leitura atual\ne manter histórico]
  novaVersao --> atual
  atual --> catalogo[Atualizar catálogo, índice,\nalias e slug legível]
  lote[Importação por lote] --> dryrun[Dry-run: identidade,\nfontes, duplicata e validação]
  dryrun -- inválido --> semParcial[Não gravar parcialmente\nretornar diagnóstico seguro]
  dryrun -- aprovado --> filaLote[Fila, progresso e\nimportação idempotente]
  filaLote --> identidade
  atual --> corte{Corte de migração aprovado?}
  corte -- não --> planejar[Não declarar banco como\nfonte única ainda]
  corte -- sim --> unica[Repositório canônico\nsem fallback silencioso ao arquivo]
```

Este fluxo implementa a intenção de E02-04/E02-05. Banco, retenção, migration, backup, formato de slug e política de merge continuam decisões de task e Architecture Gate próprios.

## 4. Conta, sessão e autorização (planejado; não implementar por inferência)

```mermaid
flowchart LR
  conta[Solicitar conta\nempresa, contato, e-mail corporativo] --> pedido{Entrada válida e\nempresa não duplicada?}
  pedido -- não --> respostaSegura[Protocolo/erro seguro\nsem enumeração]
  pedido -- sim --> aprovar{Operação aprova empresa?}
  aprovar -- não --> recusar[Recusar sem liberar acesso]
  aprovar -- sim --> token[Convite único\nexpira, revoga, ativa admin]
  token --> ativar{Convite válido\ne ainda não usado?}
  ativar -- não --> novoConvite[Nova ativação\nsem expor dados]
  ativar -- sim --> senha[Definir credencial e\nconcluir onboarding retomável]
  senha --> entradaLogin{Login por senha\nou SSO aprovado?}
  entradaLogin -- senha --> credencial{Credencial, conta e\norganização ativas?}
  entradaLogin -- SSO --> idp{Callback, issuer, audience\ne claims válidos?}
  credencial -- não --> recuperar[Recuperar acesso\ntoken único, rate limit]
  recuperar --> revogar[Trocar credencial e\nrevogar sessões anteriores]
  idp -- não/indisponível --> erroSSO[Falha fechada\nsem criar tenant]
  credencial -- sim --> mfa{MFA exigido\npela organização?}
  idp -- sim --> mfa
  mfa -- sim --> desafio[Matrícula/desafio/recuperação MFA]
  desafio -- incompleto --> semSessao[Sem sessão]
  desafio -- concluído --> autorizar
  mfa -- não --> autorizar{Servidor confere sessão,\ntenant, papel e recurso próprio}
  autorizar -- não --> negar[Negar por padrão e auditar]
  autorizar -- sim --> executar[Consultar, gerir, exportar\nou comparar]
  executar --> auditoria[Evento sanitizado]
  membros[Admin altera papel\nou desativa membro] --> revogaMembro[Revogar sessão imediatamente\npreservar trilha aprovada]
  revogaMembro --> negar
  auditoria --> logout[Logout revoga sessão]
```

SSO, MFA, modelo de tenancy, recuperação, retenção de sessão, canais e papéis finais continuam **a decidir**. Qualquer implementação desses nós requer task própria, Architecture Gate e revisão de segurança.

## 5. Análise, exportação, compartilhamento e reporte (planejado)

```mermaid
flowchart LR
  selecionar[Selecionar fichas\nversão, mercado e motorização explícitos] --> compativel{Compatíveis?}
  compativel -- não --> explicar[Explicar a incompatibilidade\nsem comparar]
  compativel -- sim --> campos[Comparar: valor, unidade,\nstatus, fonte e diferença]
  campos --> salvar[Salvar análise\nowner, tenant e versões]
  salvar --> permissao{Autorizar exportação?\npapel + tenant + conteúdo}
  permissao -- não --> negar[Sem arquivo nem link]
  permissao -- sim --> gerar[Gerar PDF/Excel/JSON\ncom fontes e versão]
  gerar --> compartilhar{Compartilhar?}
  compartilhar -- sim --> link[Link com expiração,\nrevogação e escopo de tenant]
  compartilhar -- não --> fim[Manter análise privada]
  campos --> reportar[Reportar campo\nficha + versão + campo + justificativa]
  reportar --> recebido[Recebido\nvalidar contexto e antiabuso]
  recebido --> analiseQA[Em análise\nQA avalia evidência]
  analiseQA --> qa{Decisão QA}
  qa -- corrigido --> corrigido[Nova versão e\nreporte corrigido]
  qa -- evidência insuficiente --> naoConfirmado[Reporte não confirmado\ncom motivo seguro]
  corrigido --> historico[Preservar decisão, versão\ne notificar conforme política]
  naoConfirmado --> historico
```

Uma comparação não escolhe vencedora para valores ausentes ou conflitantes. Um reporte não altera a ficha por si só: ele cria uma pendência de revisão com evidência e versão identificáveis.

## 6. Consumo, alertas, saúde e incidentes

```mermaid
flowchart LR
  evento[Registrar tentativa, sucesso,\nfalha ou retry] --> agregar[Agregar por tenant e período\ncom deduplicação]
  agregar --> politica{Política/limiar definido?}
  politica -- não --> medir[Continuar medindo\nsem bloquear por regra inventada]
  politica -- sim --> atingiu{Limite atingido?}
  atingiu -- não --> medir
  atingiu -- sim --> notificar[Notificar somente\ndestinatário autorizado]
  health[Health + logs sanitizados\nlatência e erro] --> detectar{Indisponibilidade/erro\nacima do limiar?}
  detectar -- não --> health
  detectar -- sim --> classificar[Classificar impacto,\nresponsável e runbook]
  classificar --> conter[Conter impacto\nsegundo runbook]
  conter --> restaurar[Restaurar em ambiente\nautorizado e verificar]
  restaurar --> comunicar[Comunicar estado seguro]
  comunicar --> posIncidente[Revisar incidente,\nlacunas e risco residual]
  posIncidente --> encerrar[Encerrar com auditoria]
```

Políticas de cota, destinatários, SLI/SLO/SLA, severidade e canais de comunicação são decisões pendentes. Logs e comunicação não podem expor segredo, prompt, resposta bruta de LLM, host interno ou dado de outro tenant.

## 7. Fluxo canônico do agente no runtime atual

```mermaid
flowchart TB
  cliente[Cliente/UI] --> req[POST /api/ficha-tecnica]
  req --> parse{parseVehicleInput\ncorpo e campos válidos?}
  parse -- não --> e400[400 · mensagem e detalhes]
  parse -- sim --> assets[Em paralelo: ler base-agent-prompt.txt\ne schema.json]
  assets --> payload[buildVehiclePayload]
  payload --> prompt[composeFinalPrompt\nBASE_AGENT_PROMPT\nOUTPUT_SCHEMA_JSON\nVEHICLE_PAYLOAD_JSON\nSCHEMA_VARIABLES_TARGET\nEXECUTION_RULES]
  prompt --> provider{LLM_PROVIDER}
  provider -- simulated --> mock[Carregar mock e injetar veículo]
  provider -- claude/openrouter --> remoto[Chamar provider\ncom tratamento de falha/fallback configurado]
  mock --> normalizar[validateResponse\nnormaliza status e completude]
  remoto --> normalizar
  normalizar --> schema{AJV válido?}
  schema -- não --> e422a[422 · schema inválido]
  schema -- sim --> fontes{Cada fonte_ref existe em\nfontes_utilizadas?}
  fontes -- não --> e422b[422 · referência inválida]
  fontes -- sim --> snapshot[Salvar snapshot local\nsem expor conteúdo em documentação]
  snapshot --> ok[200 · FichaTecnicaResponse]
  req -. correlação .-> log[request id + log sanitizado]
```

Rotas hoje presentes: `GET /api/health`, `POST /api/ficha-tecnica`, `GET /api/ficha-tecnica/latest` e `GET /api/ficha-tecnica/history`. Todas devem conservar o contrato de erro de `HttpError`: `{ message, details }`; exceções não mapeadas retornam `500` com mensagem genérica.

### Mapa de implementação — onde mudar, o que preservar

| Necessidade | Ponto atual | Invariante que não pode quebrar | Verificação mínima |
|---|---|---|---|
| Entrada de veículo/contrato HTTP | `services/api/index.ts` e `types.ts` | identidade exata; corpo inválido dá 400 | testes de corpo plano/aninhado, vazios e limites de ano |
| Prompt e schema | `packages/agent-runtime/assets/base-agent-prompt.txt`, `schema.json` | schema, instrução e payload são explicitamente compostos | fixture válida e inválida; inspeção do prompt sem registrar conteúdo sensível |
| Composição | `services/api/prompt-builder.ts` | cinco seções e variáveis obrigatórias continuam presentes | teste unitário de composição e caminhos |
| Roteamento de LLM | `services/api/llm.ts` | provider não pode burlar validação; fallback só quando configurado | mock, erro do provider e resposta cercada por Markdown |
| Normalização/validação | `services/api/validator.ts` | ausência/conflito não viram confirmado; `fonte_ref` sempre aponta para fonte declarada | AJV, status e referências inexistentes retornam 422 |
| Histórico/snapshots locais | `services/api/logger.ts` e rotas de histórico | não publicar segredos, logs ou snapshot bruto | respostas `latest/history` validadas; revisão de conteúdo gravado |
| UI | `apps/web/` | UI mostra estado/fonte, mas não é camada de autorização | fluxo de sucesso, 400, 422, 500 e vazio |

### Desvio técnico que deve ser resolvido por task, não silenciosamente

`prompt-builder.ts` lê os assets canônicos em `packages/agent-runtime/assets/`, porém `llm.ts` ainda declara `PROMPT_ASSETS_DIR` como `prompt-assets` para o mock. Isso é uma **inconsistência observada no checkout**, não uma decisão deste fluxograma. Antes de modificar provider, mock, prompt ou schema: abrir uma task com Architecture Gate, decidir o caminho canônico e provar o comportamento em teste. Não copiar assets ou criar duplicação implícita apenas para ocultar o problema.

## 8. Decisão antes de mexer no agente

```mermaid
flowchart TD
  mudar([Nova mudança]) --> tipo{Muda prompt, schema, provider,\nendpoint, dado ou comportamento?}
  tipo -- não, apenas documento --> docs[Atualizar esta referência\ne checar links/estado]
  tipo -- sim --> gate[Aplicar Architecture Gate]
  gate --> risco{Inclui identidade, acesso,\nsegredo, integração ou IA com ferramentas?}
  risco -- sim --> seguranca[Consultar revisão de segurança\ne definir controles/testes]
  risco -- não --> contrato[Definir contrato, invariantes\ne plano reversível]
  seguranca --> contrato
  contrato --> aprovado{Arquitetura aprovada?}
  aprovado -- não --> parar[Documentar decisão; não implementar]
  aprovado -- sim --> implementar[Alterar o menor conjunto\nde arquivos canônicos]
  implementar --> validar[Rodar testes, typecheck e\nsmokes proporcionais]
  validar --> evidencia[Registrar evidência e atualizar\nbacklog/fluxograma se o estado mudou]
```

## 9. Matriz de rastreabilidade para desenvolvimento

| Requisito | Fluxo/resultado que a implementação deve preservar |
|---|---|
| RF01 | Consulta identifica marca, modelo, versão, ano-modelo e mercado sem mistura. |
| RF02 | Geração/coleta retorna estrutura rastreável, não texto solto. |
| RF03 | A resposta é validada no schema antes de responder. |
| RF04–RF05 | Fontes são exibidas e cada `fonte_ref` aponta para uma fonte declarada. |
| RF06 | Confirmado, parcial, inferido, não encontrado, não aplicável e conflito permanecem legíveis. |
| RF07 | Comparação futura exige compatibilidade explícita e preserva versões. |
| RF08 | Exportação/compartilhamento futuro exige autorização servidor/tenant e trilha auditável. |
| RF09 | Conta, sessão, papel e organização são gates; negar por padrão. |
| RF10–RF11 | Consumo é agregado por organização; alertas não vazam informação. |
| RF12 | Ficha/histórico futuro preserva identidade, versão e proveniência. |
| RF13 | Health, logs sanitizados, correlação e incidente são estados operacionais distintos. |

## 10. Melhorias de fluxo pendentes de decisão

| Lacuna agora explicitada | Onde acompanhar | Condição para implementação |
|---|---|---|
| Banco canônico, migração, backup e retenção | E02-04 e P1-001 | Architecture Gate de dados, revisão de segurança, ambiente autorizado e plano de corte sem duas fontes de verdade. |
| Lote, aliases, slug e merge revisável | E02-05 | Contrato de identidade, idempotência, política de colisão e testes de lote parcial. |
| Recuperação, MFA, SSO e revogação | E01-03 a E01-06 | Decisão de identidade, modelo de tenancy, threat model e revisão de integração. |
| Estados do reporte e notificações | E03-04 | Fila de QA, política antiabuso, retenção e regras de notificação. |
| Contenção, restauração e pós-incidente | E05-02 | Runbook, responsável, ambiente descartável, SLI/SLO e decisão de backup/RPO/RTO. |

## Checklist de handoff

- [ ] Declarei se o nó alterado é implementado, parcial, planejado ou a decidir?
- [ ] Mantive `schema.json` e `base-agent-prompt.txt` como ativos controlados, sem dados secretos?
- [ ] Testei sucesso, entrada inválida (400), schema/fonte inválida (422) e falha inesperada (500)?
- [ ] Confirmei que status de ausência/conflito não foi convertido em confirmação?
- [ ] Se a mudança toca autenticação, tenant, provider, persistência, exportação ou integrações, há Architecture Gate e revisão de segurança aprovados?
- [ ] Atualizei este guia, backlog e evidências somente quando o runtime realmente comprovou a mudança?

## Referências e manutenção

- [Backlog detalhado](backlog.md), [roadmap](roadmap.md), [matriz de cobertura](coverage-matrix.md) e [catálogo](features/README.md) explicam a intenção de produto.
- [Pipeline HTTP](../architecture/agent-core/HTTP_PIPELINE.md), [composição de prompt](../architecture/agent-core/PROMPT_COMPOSITION.md) e [validação/tipos](../architecture/agent-core/VALIDATION_AND_TYPES.md) explicam contratos; conferir sempre contra o código quando houver divergência.
- Os fluxogramas HTML e Markdown anteriores foram removidos após esta consolidação. Atualize este documento quando fluxo, contrato ou estado comprovado mudar.
