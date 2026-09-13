# Auditoria e contrato canônico da pesquisa técnica continuada

Data: `2026-09-12`
Task: `P0-012`
Escopo: auditoria estática de runtime, schema, migrations, API e interface. Não houve chamada de provider, migration, alteração de `.env`, banco ou runtime.

## Resultado executivo

O BlindSpot já possui identidade exata de configuração, ficha por organização, revisões imutáveis, sessões autenticadas, evidência por campo, reportes de qualidade e um workspace inicial. Isso ainda não é uma jornada canônica integrada de pesquisa contínua.

Os bloqueios confirmados são: a sequência de revisões é calculada por `VehicleConfiguration`, não por ficha; o executor de sessão usa o fluxo simulated genérico, sem transformar `Focus` em plano/estratégia; e o workspace exige UUID manual e não expõe qualidade, `recommended` ou `primary`. A descoberta no catálogo é global por configuração/versão e não substitui o workspace organizacional.

## Preflight

### Fatos confirmados

- O runtime canônico permanece em `packages/agent-runtime/assets/`; este documento não o substitui.
- `vehicle_configurations` guarda `{ marca, modelo, versao, ano_modelo, mercado }`; aliases são auxiliares de descoberta.
- `technical_sheets` possui configuração, organização, estado, `is_default`, linhagem e datas (`drizzle/0017` a `0019`).
- `technical_sheet_versions`, `collection_runs`, `research_sessions`, `field_evidence`, `field_resolutions` e `quality_reports` existem (`drizzle/0020` a `0022`).
- Há rotas autenticadas para criar/listar/executar/cancelar sessão e ler/criar ficha no workspace, com filtro de organização no servidor.
- O `VehicleWorkspace` atual solicita UUID manual e cria/executa sessão por botão; o catálogo global é outro fluxo.

### Lacunas confirmadas

- `persistTechnicalSheetInTransaction` obtém a última versão por `vehicle_configuration_id`; a sequência não é monotônica por `technical_sheet_id`.
- `executeResearchSession` chama `callLLMSimulated` com prompt de geração completa. `focus` e `resolved_targets` persistem, mas não modificam materiais, limites, estratégia ou payload do runtime.
- Estado de sessão é `text` sem constraint de banco; a resposta de histórico não contém plano, impacto, stop condition ou revisão publicada.
- `readVehicleWorkspace` retorna `recommended: null` e `primary: null`; o `leftJoin` seguido de `innerJoin(collection_runs)` exclui fichas sem revisão. A UI não usa a rota de criar ficha.
- O vetor de qualidade é cálculo puro sem rota ou apresentação no workspace.
- `is_default` não é `primary` autorizada; `latest` do catálogo é global por configuração.

### Impacto e reversibilidade

- Esta task altera apenas documentação e estado das tasks; é reversível por edição/commit.
- Schema, migrations, endpoint, prompt, provider e políticas permanecem fora do escopo.
- Qualquer correção de produto exige o Architecture Gate da task consumidora.

## Revisão de segurança proporcional

### Gatilhos e fronteiras

O contrato auditado inclui autorização por organização, persistência, API, IA com conteúdo externo, auditoria e retenção. A fronteira é: pessoa autenticada → RBAC/API → sessão/plano server-owned → provider/conteúdo externo não confiável → validação/políticas → PostgreSQL → leitura autorizada.

| Risco | Controle observado | Remanescente |
| --- | --- | --- |
| IDOR entre organizações | filtro de organização na criação/leitura de sessão e workspace | P0-013/P0-014 devem testar o isolamento |
| sobrescrita concorrente | `expectedBaseRevisionId` na publicação | numeração e transições precisam de endurecimento na P0-014 |
| custo/estratégia forjada | Focus allowlisted e alvos resolvidos no servidor | plano/budget/stop condition reais pertencem à P1-044 |
| conteúdo externo como instrução | schema/políticas server-owned e validação posterior | P1-048 não pode reter prompt, URL privada, conteúdo bruto ou segredo |
| seleção enganosa de ficha | `recommended`/`primary` não são fabricados | P1-045/P1-047 exigem RBAC, política e auditoria |

Não foram abertos ou copiados segredos, logs brutos ou snapshots de LLM. Não houve ferramenta externa, scanner, rede ou alteração de dados. O risco residual é a divergência entre task e runtime; Lucas é o responsável pela sua aceitação após as correções propostas.

## Matriz de cobertura

| Capacidade proposta | Evidência atual | Estado real | Task responsável |
| --- | --- | --- | --- |
| Identidade exata de veículo | `vehicle_configurations`, validador e catálogo | entregue como identidade; catálogo é global | P0-013 preserva a separação |
| Múltiplas fichas | `technical_sheets`, `createWorkspaceSheet` | parcial; UI não conduz criação/seleção | P0-013, P1-047 |
| Revisões por ficha | versões e `expectedBaseRevisionId` | parcial; número ainda é por configuração | P0-014, P1-030 reaberta |
| Sessão com foco/base | `research_sessions`, `resolveTargets` | preparação entregue, plano executável ausente | P1-044, P1-032 reaberta |
| Pesquisa dirigida por Focus | `executeResearchSession` | ausente; geração simulated é genérica | P1-044 |
| Evidência/resolução por campo | migration `0021`, persistência | estrutura entregue; explicação não | P1-046, P1-048 |
| Qualidade/próxima ação | `quality-vector.ts` | cálculo puro não integrado | P1-045 |
| Tags, seleção e ciclo | `state`, `is_default`, workspace | tags ausentes; `recommended`/`primary` indisponíveis | P1-047 |
| Revisão humana/reportes | `quality_reports` e rotas | estrutura parcial; fluxo de produto pendente | P1-004, P1-019, P1-046 |
| Histórico reprodutível | auditoria sanitizada e sessão | insuficiente para plano/etapas/orçamento | P1-048 |
| Refresh/fork/reprocess/merge | comparação salva e linhagem | comparação existe; operações canônicas não | P2-003, P2-007 |
| Reputação, KB, autopilot | políticas/âncoras limitadas | futuro deliberado | P2-001, P2-002, P3-001 |
| Cenários de aceite/BYD | ledger agregado | não há suíte ponta a ponta | P1-049 |

## Contrato canônico a partir deste gate

| Entidade | Identidade/escopo | Invariante |
| --- | --- | --- |
| `VehicleConfiguration` | chave exata automotiva compartilhada | não carrega tenant, linha de trabalho ou preferência de ficha |
| `TechnicalSheet` | `id`, organização, configuração | linha de trabalho independente e tenant-scoped |
| `TechnicalSheetVersion` | `id`, ficha, base/origem | snapshot imutável, número monotônico por ficha, nunca editado in place |
| `ResearchSession` | ficha, revisão-base, organização | tentativa idempotente com plano, orçamento, stop condition e transições server-owned |
| `FieldEvidence` | versão, caminho, fonte | evidência rastreável, não confirmação automática |
| `FieldResolution` | versão, caminho | valor/estado ou conflito/ausência preservados sem expor conteúdo bruto |

Seleções independentes:

- `latest`: revisão temporal mais recente da mesma ficha.
- `recommended`: sugestão por política versionada e explicável; não altera dado.
- `primary`: escolha autorizada e auditável da organização; não é `is_default`, `latest` ou `recommended`.

Estados alvo, ainda não inteiramente runtime:

- Ficha: `active`, `stale`, `archived`, `legacy_imported`, `legacy_unassigned`.
- Sessão: `queued → running → succeeded | partial | failed | cancelled | needs_rebase | research_exhausted`.
- Campo: vocabulário versionado P1-046; ausência, conflito, não aplicabilidade e exaustão nunca são confirmação positiva.

Fluxo alvo:

```text
VehicleConfiguration exata
  → workspace da organização
  → escolher/criar TechnicalSheet
  → selecionar Revision-base
  → criar ResearchSession com Focus/plano server-owned
  → executar sob orçamento e stop condition
  → validar schema, identidade, evidência e qualidade
  → publicar Revision ou encerrar sem publicação
  → expor impacto, explicação e próxima ação revisável
```

O catálogo global é somente descoberta/leitura. Ele não cria sessão, não escolhe ficha primária e não substitui o workspace organizacional.

## V1, futuro e decisões caras

| Classe | Conteúdo |
| --- | --- |
| V1 pendente | publicação/integridade, jornada workspace, plano dirigido, qualidade/impacto, proveniência, tags/primary e cenários de aceite |
| Pós-V1 por métrica | reputação contextual, conhecimento compartilhado, experimentação e operações completas de fork/reprocessamento |
| Futuro deliberado | merge automático, ranking opaco, autopilot, worker distribuído e provider/modelo livre no cliente |
| Decisão irreversível por gate | migration de estados/revisão, retenção de histórico, política de fonte/evidência, texto livre ou transmissão a provider |

## Double-check e decisão

- P1-030, P1-032 e P1-035 foram reabertas porque declaravam, respectivamente, sequência por ficha, execução dirigida e workspace integrado que o runtime não confirma.
- P1-031 permanece concluída como corte estrutural; P1-033 como persistência estrutural; P1-034 como cálculo puro. As integrações pendentes são explicitamente P1-044 a P1-048.
- A proposta e `docs/architecture/` orientaram o desenho, mas os fatos foram confirmados nos assets/migrations/código.
- Verificação: releitura estática de assets, migrations `0017`–`0022`, schema, repository, API, sessões, qualidade, workspace e tasks P1-029–P1-036. O ledger de evolução foi consultado apenas em forma agregada; nenhum conteúdo sensível foi reproduzido.

**GO** para P0-013 e P0-014 após seus Architecture Gates. **NO-GO** para provider real dirigido, merge, Knowledge Base, experimento de provider e autopilot antes das tasks e decisões indicadas.
