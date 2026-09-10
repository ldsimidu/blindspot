# Backlog detalhado do BlindSpot

> Estado: **produto e implementação atualizados em 2026-09-08**. Comportamentos marcados como implementados têm evidência no checkout; os demais continuam planejamento e não alteram runtime por si só.
>
> Fonte principal: `C:\Users\lucas\Documents\bedrock\knowledge\01-fiap\corventures\blindspot\fontes\2026-09-07-cf-backlog-ford-280426-232211-docling.md`, conversão Docling do PDF `CF-Backlog Ford-280426-232211.pdf` (hash registrado na própria conversão). É contexto de produto, não prova de implementação. A conversão termina ao abrir a task 3.3.2; as features listadas no índice, mas sem corpo extraído, foram detalhadas como **propostas**, não como transcrição.
>
> Para capacidade atual, prevalecem `packages/agent-runtime/assets/`, `services/api/`, `apps/web/` e `evidence/`. Consulte [matriz de cobertura](coverage-matrix.md), [catálogo](features/README.md), [roadmap](roadmap.md) e `../architecture/agent-core/`.

## Convenções e visão executiva

`Implementado` exige evidência local; `Parcial` tem código sem prontidão corporativa; `Planejado` é requisito aceito; `Proposta` é refinamento desta P0; `A decidir` exige autoridade. Uma entrada não inicia código: cada mudança futura pede task e Architecture Gate.

| Fase proposta | Resultado | PBIs críticos | Saída necessária |
|---|---|---|---|
| R0 Qualidade | schema, fontes, validação e IA mensuráveis | E02-01–E02-03 | versão do schema e baseline aprovados |
| R1 Persistência | ficha imutável/versionada | E02-04–E02-05 | dados, migração e retenção decididos |
| R2 Consulta | busca, leitura, comparação/exportação rastreáveis | E03-01–E03-04 | R1 e contrato de comparação |
| R3 Corporativo | conta, login, organização, cota | E01-01–E01-06, E04-01–E04-03 | Parcial: solicitação, aprovação e convite inicial; identidade/tenancy ainda pendentes |
| R4 Operação/piloto | telemetria, recuperação e comunicação | E05-01–E05-03 | metas, ambiente e responsáveis |
| R5 Escala | integrações e expansão | futuros | evidência de piloto |

Dependências: `qualidade → persistência → consulta/comparação`; `identidade + organização → exportação/consumo`; todos exigem operação proporcional. Os números da fonte Ford (duas fontes, score 0,75, alertas 70/90/100%, p95 2 s, erro 1%, disponibilidade 99,5%) são **propostas**, não regras nem SLA.

## Fluxos completos propostos

### Conta e acesso corporativo

1. **P0-008 implementado:** na tela inicial, responsável clica em **Cadastrar minha empresa**, informa empresa, CNPJ, responsável, e-mail corporativo, senha, confirmação e aceite de privacidade. `POST /api/organizacoes/cadastro` cria, em uma transação, solicitação `received`, organização `pending_review`, conta e membro inicial `pending` e credencial `scrypt` com salt e pepper. A resposta é neutra (`202 received`), sem sessão, token, protocolo público ou confirmação de duplicidade.
2. A tela **Cadastro recebido / Estamos verificando sua empresa** oferece atualização, retorno ao login e suporte. Atualizar repete o login apenas com e-mail/senha preservados somente na memória da interface; não há endpoint público por CNPJ, e-mail ou protocolo.
3. Operador MVP lista somente solicitações `received` com paginação, por `GET /api/operacoes/organizacoes/solicitacoes`, e decide por cURL com `x-operator-approval-key`. Aprovar torna solicitação `approved` e organização, conta e membro `active`; recusar torna todos `rejected`, sempre na mesma transação. Consulte `../operations/api-collections/` para comandos sem segredo.
4. Login com e-mail/senha inválidos permanece neutro. Depois de verificar corretamente a senha, cadastro pendente recebe `403 pending_review` e tela de espera; recusado recebe `403 rejected` e orientação de suporte; ativo recebe cookie de sessão opaca `HttpOnly`. O limite local continua cinco tentativas em 15 minutos.
5. O convite P1-010 não aparece para novo cadastro: ele continua apenas para registros legados `pending_activation`. Não há envio real de e-mail neste corte. **P1-013 pendente:** RBAC, tenant e recurso ainda precisam ser verificados pelo servidor antes de proteger o produto corporativamente.
5. Administrador convida, troca papel ou desativa membro; servidor revoga sessão e conserva auditoria conforme retenção aprovada.
6. Cada recurso resolve organização e autorização no servidor; UI nunca é a barreira de segurança.

| Entidade | Implementado | Transições permitidas nesta fase |
|---|---|---|
| Solicitação | `received`, `approved`, `rejected` | `received → approved \| rejected` por operador; repetição falha fechada |
| Organização | `pending_review`, `active`, `rejected` | acompanha a decisão da solicitação; `pending_activation` é legado de convite |
| Conta/membro inicial | `pending`, `active`, `rejected` | acompanha a decisão; não cria sessão enquanto pendente/recusado |
| Sessão | inexistente, ativa, revogada/expirada | só nasce com as três identidades `active`; logout a revoga |
| Planejado | `suspended`, MFA pendente, IdP indisponível | dependem de P1-012 a P1-014 |

### Consulta, qualidade e análise

1. Analista identifica veículo por marca, modelo, versão, ano-modelo e mercado; o produto impede misturas.
2. Catálogo devolve ficha validada/versionada ou estado de ausência; coleta nova só entra em fila aprovada.
3. Cada campo mantém valor, unidade, status e `fonte_ref`; validação ocorre antes de disponibilizar.
4. Ausência, conflito e inaplicabilidade seguem visíveis. Não geram confirmação ou vencedor automático.
5. Comparador só usa fichas compatíveis e versionadas; exportação/share exige tenant e permissão.

### Persistência, catálogo e recuperação operacional

1. Uma resposta só entra na persistência depois de validação estrutural, de `fonte_ref` e dos estados de qualidade; falha de validação nunca cria versão parcial.
2. A gravação identifica a configuração exata do veículo, registra schema, fontes, data e execução e cria uma nova versão append-only na mesma transação.
3. Leitura de ficha recupera a versão atual ou histórica sem sobrescrever a original. Na migração aprovada, arquivo local e banco não permanecem como fontes concorrentes.
4. Entrada por lote começa em dry-run: valida identidade, colisão, duplicata e fontes. Lote inválido não grava parcialmente; duplicata segue decisão revisável, nunca merge automático irreversível.
5. Catálogo usa identidade canônica, aliases e slug apenas como identificador legível. Busca retorna loading, encontrado, não cadastrado, incompatível ou erro — nunca um veículo aproximado em silêncio.
6. Operação mede saúde; alerta acionável abre runbook, contém o impacto, restaura em ambiente autorizado e registra revisão pós-incidente. Metas, backup, RPO/RTO e canais permanecem a decidir.

### Critérios transversais de jornada

- **Acesso:** aprovação não concede credencial; convite é único, HMAC, expirável e revogável; sua ativação é atômica e não abre sessão. Login só aceita conta, membro e organização ativos, emite token opaco HMAC por cookie `HttpOnly` e logout o revoga. Recuperação revoga sessões; MFA obrigatório impede sessão incompleta; SSO só associa claim validada ao tenant correto.
- **Dados:** ausência, conflito e não aplicabilidade não viram confirmação, nem alimentam vencedor automático em comparação.
- **Autorização:** conta, tenant, papel e recurso são verificados no servidor em todas as ações sensíveis; revogar membro encerra suas sessões sem apagar a trilha aprovada.
- **Qualidade reportada:** reporte identifica ficha, versão e campo e percorre `recebido → em análise → corrigido | não confirmado`, sem saltos.
- **Operação:** falha de banco, provider ou canal tem estado explícito, correlação e comunicação segura; não expõe segredo, prompt, resposta LLM bruta ou dado de outro tenant.

## E01 — Autenticação e gestão de acesso corporativo

**Objetivo:** somente clientes autorizados acessam dados no menor privilégio. **Estado:** Parcial — P0-008 cobre cadastro, análise e sessão; MFA, SSO, RBAC e proteção de recursos continuam pendentes. **RF:** RF09–RF11; habilita RF08.

### F01.1 Cadastro e onboarding

#### E01-01 — Solicitar e aprovar organização

- **Problema/pessoa/fluxo:** responsável se cadastra pela interface com CNPJ, contato, e-mail e senha; espera análise e usa as mesmas credenciais para receber estado pendente, recusa segura ou sessão ativa.
- **Fora do escopo:** validação fiscal automática, preço, cobrança e provider de e-mail.
- **Tasks/subtasks:** definir minimização/consentimento, estados e aprovador; validar campos e duplicidade; criar protocolo; prevenir enumeração; registrar decisão sanitizada.
- **Aceite, evidência e DoD:** acesso não existe antes da aprovação; duplicidade e erro têm resposta segura; decisão atualiza solicitação, organização, conta e membro atomicamente; trilha mostra ator/data sem segredo; login válido comunica pendência/recusa sem enumeração; coleção MVP não contém chave. **Estado comprovado: P0-008 implementado.**
- **Prioridade/dependência/risco/fonte:** Próximo; modelo de organização; fraude e coleta excessiva; Ford 1.1.1–1.1.2.

#### E01-02 — Convidar e ativar administrador inicial

- **Problema/pessoa/fluxo:** fluxo legado: operador autorizado emite ou revoga convite para contato de organização pré-P0-008 `pending_activation`. Novo cadastro usa E01-01 e não cria convite.
- **Fora do escopo:** envio real de credenciais/e-mail, sessão, login, MFA, SSO, gestão de mais membros, retenção final e automação comercial.
- **Tasks/subtasks:** token aleatório de 32 bytes, HMAC com segredo distinto, expiração de 72 horas, reemissão que revoga o anterior, revogação explícita, credencial `scrypt` com salt e pepper, eventos sanitizados e tela/rota de primeiro acesso retomável.
- **Aceite, evidência e DoD:** convite expirado/revogado/reutilizado não ativa conta; token e senha nunca são persistidos ou auditados em claro; ativação inválida não revela empresa; emissão/revogação/uso têm evento sanitizado; criação de membro, consumo do token e ativação da organização são atômicos; smoke de válido, replay, expiração, revogação e senha fraca, além de revisão de segurança, passam.
- **Prioridade/dependência/risco/fonte:** Concluído no P1-010; E01-01; tomada de conta; Ford 1.1.2–1.1.5, 4.1.2–4.1.3. A evidência inclui migration `0004`, smoke de emissão, revogação, senha fraca, ativação e replay e sanitização do caminho de ativação nos logs.

### F01.2 Login, recuperação e MFA

#### E01-03 — Login por senha e sessão segura

- **Problema/pessoa/fluxo:** pessoa ativa entra com e-mail/senha; servidor valida conta, membro e organização, verifica `scrypt` e abre sessão ou falha genericamente; logout a encerra.
- **Fora do escopo:** SSO, MFA, recuperação, seleção de tenant, rate limit distribuído e RBAC de recursos.
- **Tasks/subtasks:** identidade global `accounts`, associação de membro, token opaco HMAC, cookie/session, expiração absoluta de 12 h, logout idempotente e limite local de cinco tentativas em 15 min por HMAC de e-mail/IP.
- **Aceite, evidência e DoD:** erro não enumera conta; conta/membro/tenant inativos não acessam; JSON de login não contém token; logout revoga sessão; testes de senha incorreta, sessão, logout e força bruta passam; logs não recebem senha, cookie ou token.
- **Prioridade/dependência/risco/fonte:** Concluído no P1-011; P1-010; credential stuffing; Ford 1.2.1, 1.2.5. O limite é deliberadamente local até haver infraestrutura distribuída; P1-013 ainda deve proteger recursos e tenancy no servidor.

#### E01-04 — Recuperar acesso e MFA por organização

- **Problema/pessoa/fluxo:** usuário pede recuperação; token único troca credencial e revoga sessões; organização pode exigir MFA antes de finalizar login.
- **Fora do escopo:** escolher canal/provedor/método MFA ou expiração de 1 h como política final.
- **Tasks/subtasks:** token/expiração/replay, limitação de taxa, matrícula/desafio/recuperação MFA, sessões pós-reset e testes de token vencido.
- **Aceite, evidência e DoD:** token não reutiliza nem aparece em log; recuperação bem-sucedida revoga sessões anteriores; MFA obrigatório bloqueia sessão incompleta; casos de abuso são testados e revisão de segurança é aprovada.
- **Prioridade/dependência/risco/fonte:** Próximo; E01-03; account takeover; Ford 1.2.3–1.2.4.

#### E01-05 — SSO corporativo opt-in

- **Problema/pessoa/fluxo:** admin configura integração aprovada; usuário retorna do IdP com claims validadas, entra no tenant correto ou recebe falha segura.
- **Fora do escopo:** ativar Google Workspace/Microsoft Entra sem contrato, credenciais e revisão de integração.
- **Tasks/subtasks:** escolher protocolo, issuer/audience/redirect URI, claims e grupos, desligamento e contingência de IdP indisponível.
- **Aceite, evidência e DoD:** callback/issuer inválido falha fechado; claim não cria tenant indevido; testes de redirect, associação e IDOR passam; revisão de integração registrada.
- **Prioridade/dependência/risco/fonte:** Depois; E01-03/provider decidido; configuração insegura; Ford 1.2.2.

### F01.3 Papéis e auditoria

#### E01-06 — RBAC no servidor e trilha de atividade

- **Problema/pessoa/fluxo:** servidor deriva papel e organização da sessão opaca. Visualizador lê catálogo global; analista/admin geram fichas e operam somente importações da própria organização; eventos estruturados registram ações sensíveis sem payload.
- **Fora do escopo:** papéis customizados, ABAC complexo, SIEM e retenção final.
- **Tasks/subtasks:** matriz `viewer|analyst|admin`; middleware por sessão/papel; `organization_id` para importações; contexto de ator na execução global; eventos allowlisted e sanitizados; gestão de membros segue P1-014.
- **Aceite, evidência e DoD:** catálogo global exige sessão ativa; visualizador não gera ficha; IDs de importação de outro tenant retornam ausência; log/auditoria não contém senha, token, prompt ou LLM bruto; smoke com duas organizações e papéis passa. **Estado comprovado: P1-013 implementado.**
- **Prioridade/dependência/risco/fonte:** Concluído no P1-013; E01-03; escalada/IDOR e privacidade; Ford 1.3.1–1.3.4. Aprovação de empresas mantém chave operacional MVP separada; não é papel de cliente.

## E02 — Motor de coleta, qualidade, catálogo e persistência

**Objetivo:** fichas comparáveis, rastreáveis e versionadas. **Estado:** geração e validação parciais; banco/catálogo corporativo planejados. **RF:** RF01–RF06, RF12.

#### E02-01 — Governar fontes e identidade do veículo

- **Problema/pessoa/fluxo:** analista não pode receber ficha de ano, mercado ou versão errados; entrada completa é associada a fontes permitidas e `fonte_ref` verificável.
- **Fora do escopo:** contratar JATO/NHTSA, coletar fonte externa sem autorização ou declarar cobertura global.
- **Tasks/subtasks:** hierarquia e score de fontes por fabricante/campo; regra de identidade; fixtures de conflito/ausência; política de fonte secundária.
- **Aceite, evidência e DoD:** cada referência existe; fonte não aprovada é marcada/rejeitada por política; veículo é inequivocamente identificado; schema/fixtures/documentação passam.
- **Prioridade/dependência/risco/fonte:** Agora; schema governado; falsa precisão; Ford 2.1.1, 2.1.3; RF01/RF04/RF05.

#### E02-02 — Coletar e normalizar mantendo proveniência

- **Problema/pessoa/fluxo:** agente extrai especificações; normalizador converte unidades sem apagar dado/origem; resposta preserva status e fonte por campo.
- **Fora do escopo:** provider final, autonomia contínua e qualidade prometida.
- **Tasks/subtasks:** baseline simulated, parsing semântico sob provider autorizado, cv/hp/kW, kgfm/Nm, km/l/l/100km/mpg, arredondamento e regressões seguras.
- **Aceite, evidência e DoD:** conversão é determinística/testada; sem evidência permanece ausente/conflitante; AJV e `fonte_ref` passam; provider real só em ambiente autorizado.
- **Prioridade/dependência/risco/fonte:** Agora; E02-01; alucinação/normalização indevida; Ford 2.1.2–2.1.4; RF02.

#### E02-03 — Validar qualidade, conflito e revisão humana

- **Problema/pessoa/fluxo:** regra estrutural e plausibilidade classificam campo; conflito não é ocultado; item sinalizado entra em revisão QA com decisão rastreável.
- **Fora do escopo:** adotar 0,75 ou duas fontes como limiar definitivo, SLA de revisão.
- **Tasks/subtasks:** campos obrigatórios/faixas condicionais; proposta de score e método; cruzamento de fontes; fila QA; painel de aprovação/reprovação; auditoria.
- **Aceite, evidência e DoD:** dado inválido falha controladamente; conflito preserva fontes; `nao_aplicavel`, `nao_encontrado`, `parcial`, `conflitante` não viram confirmado; testes de limiar/ausência passam.
- **Prioridade/dependência/risco/fonte:** Agora; E02-01/02; confiança enganosa/backlog QA; Ford 2.2.1–2.2.5; RF03/RF06.

#### E02-04 — Persistir versões imutáveis e fontes

- **Problema/pessoa/fluxo:** ficha validada é gravada com identidade, schema, fontes, data e versão; leitura retorna atual ou histórica sem sobrescrever original.
- **Fora do escopo:** escolher banco, retenção, migration ou provider de backup nesta P0.
- **Tasks/subtasks:** Gate de dados, veículo/ficha/campo/fonte, append-only, migração de snapshots, rollback, restauração descartável; definir o corte que desativa o arquivo local como fonte de leitura.
- **Aceite, evidência e DoD:** atualização cria nova versão; fonte/data são recuperáveis; falha transacional não publica versão parcial; não há duas fontes de verdade após o corte; migration/integridade/restauração são verificadas e segurança aprovada.
- **Prioridade/dependência/risco/fonte:** Próximo; schema/retenção; perda/corrupção; Ford 2.2.6; RF12.

#### E02-05 — Catálogo, índice, slug, lote e duplicata

- **Problema/pessoa/fluxo:** catálogo cria identidade canônica e slug legível; busca não mistura versões; lote faz dry-run, cria/atualiza ou sinaliza duplicata; atualização periódica gera versão.
- **Fora do escopo:** slug como chave global, merge automático irreversível, fontes pagas e agenda final.
- **Tasks/subtasks:** índices/paginação/aliases; chave de deduplicação; import idempotente; dry-run, fila e progresso; merge revisável; captura de facelift/versão; estados de loading/encontrado/não cadastrado/incompatível/erro.
- **Aceite, evidência e DoD:** colisão não sobrescreve; lote inválido não escreve parcialmente; busca não devolve veículo aproximado silenciosamente; merge é auditável/reversível conforme política; testes de unicidade/idempotência e estados de resultado passam.
- **Prioridade/dependência/risco/fonte:** Próximo/Depois; E02-04; corrupção/custo; Ford 2.1.5–2.1.6, 2.3.1–2.3.5.

## E03 — Plataforma web, comparação, exportação e qualidade reportada

**Objetivo:** consulta e análise sem API direta. **Estado:** visualização parcial; comparador/exportação planejados. **RF:** RF07/RF08, suporte RF01–RF06.

#### E03-01 — Base web e primeiro acesso acessíveis

- **Problema/pessoa/fluxo:** pessoa autenticada navega por consulta, comparações, qualidade e conta, com header de organização e orientação inicial.
- **Fora do escopo:** substituir stack atual por Next.js ou prometer design system porque a fonte o menciona.
- **Tasks/subtasks:** rotas/layout/sidebar; desktop 1080p+; foco, teclado, contraste; tour guiado retomável; notificações in-app sob política.
- **Aceite, evidência e DoD:** rótulos/foco/feedback são verificáveis; sessão expirada/sem organização têm estado claro; testes UI e revisão a11y proporcional passam.
- **Prioridade/dependência/risco/fonte:** Próximo; E01; UI esconder acesso negado; Ford 3.1.1–3.1.5.

#### E03-02 — Buscar e ler ficha com qualidade explícita

- **Problema/pessoa/fluxo:** analista usa cascata Marca→Modelo→Ano→Versão ou texto livre, seleciona ficha e lê categorias, fontes, data, versão, status e completude.
- **Fora do escopo:** autocomplete realtime sem catálogo; histórico das 20 buscas sem decisão de privacidade.
- **Tasks/subtasks:** filtros/autocomplete; histórico; motor/transmissão/desempenho/dimensões/capacidades/segurança/equipamentos; tooltip de score; loading/encontrado/não cadastrado/erro.
- **Aceite, evidência e DoD:** busca incompatível não devolve veículo errado; fonte/status visíveis; vazio não tem fallback silencioso; testes de erro, ausência e conflito passam.
- **Prioridade/dependência/risco/fonte:** Próximo; E02-04/05; interpretação errada; Ford 3.2.1–3.2.7.

#### E03-03 — Comparar e salvar fichas compatíveis

- **Problema/pessoa/fluxo:** analista seleciona exatamente duas versões imutáveis; o servidor bloqueia mercado, identidade ou motorização incompatíveis e mostra campo/unidade/valor/status/fonte/diferença sem vencedor; pode salvar a análise no tenant correto.
- **Fora do escopo:** mais de duas fichas, vencedor automático, exportação, compartilhamento, edição, exclusão e colaboração externa.
- **Tasks/subtasks:** contrato puro `comparison-contract-v1`, compatibilidade conservadora, par canônico/idempotente, ownership/visibilidade por tenant e tabela lado a lado.
- **Aceite, evidência e DoD:** não aplicável/ausência/conflito não tem vencedor; cada lado mostra versão/fonte; recurso de outro tenant é negado; migration `0012_saved_comparisons`, typecheck e build passam. **Estado comprovado: P1-017 implementado.**
- **Prioridade/dependência/risco/fonte:** Concluído no P1-017; E01/E02-04; benchmark enganoso/vazamento; Ford 3.3.1–3.3.2 e 3.3.5; RF07.

#### E03-04 — Exportar, compartilhar e reportar qualidade

- **Problema/pessoa/fluxo:** usuário autorizado gera PDF/Excel/JSON com fontes/versão/data, recebe link só no tenant permitido e pode reportar campo incorreto, acompanhando recebido/em análise/corrigido/não confirmado.
- **Fora do escopo:** gerar arquivo/link público real, anexos sensíveis e SLA de QA nesta P0.
- **Tasks/subtasks:** contrato/conteúdo de exportação, download/re-download e expiração; auditoria; formulário contextual/antiabuso; fila/status/motivo QA e notificação; transições explícitas `recebido → em análise → corrigido | não confirmado`.
- **Aceite, evidência e DoD:** arquivo não contém segredo/prompt/dado alheio; link expirado falha fechado; reporte referencia campo/versão; estados não saltam; testes de autorização e validação passam.
- **Prioridade/dependência/risco/fonte:** Depois; E01, E02-04, E03-03; exfiltração/spam; Ford 3.3.6, 3.4.1–3.4.5, 3.5.1–3.5.3; RF08.

## E04 — Gestão de usuários, organizações e consumo

**Objetivo:** autonomia de equipe sem cruzar tenants. **Estado:** Planejado. **RF:** RF09–RF11.

#### E04-01 — Administrar membros e revogar acesso

- **Problema/pessoa/fluxo:** administrador lista somente sua equipe, gera link único de convite, altera papel e desativa membro; desativação revoga sessão e preserva histórico conforme política. No MVP o administrador transmite o link por canal corporativo, sem provider de e-mail.
- **Fora do escopo:** exclusão física, SCIM e sincronização automática.
- **Tasks/subtasks:** painel, convite/ativação, alteração, desativação, revogação imediata de sessão e auditoria; testes de tenant/IDOR.
- **Aceite, evidência e DoD:** admin não atua em outro tenant; membro desativado não mantém sessão; convite vencido falha; trilha sanitizada mostra ator/motivo; testes passam. **Estado comprovado: P1-014 implementado.**
- **Prioridade/dependência/risco/fonte:** Concluído no P1-014; E01-02/E01-06; privilégio residual; Ford 4.1.1–4.1.4; RF09.

#### E04-02 — Medir consumo reproduzível

- **Problema/pessoa/fluxo:** eventos técnicos classificam geração persistida e falha por organização/resultado; admin vê período e definição de unidade, sem eventos brutos.
- **Fora do escopo:** preço/cobrança e histórico de seis meses como política fechada.
- **Tasks/subtasks:** unidade `technical_sheet_persisted`; evento idempotente por execução/request; falha com zero unidade; agregação mensal privada; definição explícita; preço/cota seguem fora do escopo.
- **Aceite, evidência e DoD:** definição da unidade é explícita; retry não duplica; admin só vê o próprio tenant; totais conciliam com eventos; falha não vira sucesso; testes passam. **Estado comprovado: P1-015 implementado.**
- **Prioridade/dependência/risco/fonte:** Concluído no P1-015; E01/E04-01; sobrecontagem/privacidade; Ford 4.2.1, 4.2.2, 4.2.4; RF10.

#### E04-03 — Alertar cota sem vazar consumo

- **Problema/pessoa/fluxo:** agregador avalia política mensal configurada explicitamente pelo admin e cria alerta interno para admins ativos da própria organização, com período, limiar e ação de revisão.
- **Fora do escopo:** fixar 70/90/100% ou suspender serviço automaticamente.
- **Tasks/subtasks:** política sem default, destinatários admin ativos, alerta in-app deduplicado, reconhecimento idempotente e auditoria; canal externo segue fora do escopo.
- **Aceite, evidência e DoD:** alerta não revela tenant; duplicado é suprimido; falha de alerta não muda consumo; limiar é configurado explicitamente pela organização e testes passam. **Estado comprovado: P1-016 implementado.**
- **Prioridade/dependência/risco/fonte:** Concluído no P1-016; E04-02; comunicação indevida; Ford 3.1.5, 4.2.3; RF11.

## E05 — Observabilidade, segurança, incidentes e SLA

**Objetivo:** operar com evidência, recuperação e comunicação proporcional. **Estado:** health/logs locais parciais; operação corporativa planejada. **RF:** RF13, transversal.

#### E05-01 — Telemetria sanitizada e readiness

- **Problema/pessoa/fluxo:** cada requisição ganha correlação; serviço emite logs/métricas/traces sanitizados; operador vê saúde, latência, erro, qualidade e volume.
- **Fora do escopo:** instalar Prometheus/Grafana/ELK/CloudWatch/OpenTelemetry ou escolher stack.
- **Tasks/subtasks:** taxonomia, `/health`/`/ready`, SLIs, trace, mascaramento e testes de segredo em log.
- **Aceite, evidência e DoD:** health distingue vivo/pronto após gate; métricas têm definição; logs não têm token/prompt/resposta bruta; testes de sanitização e revisão de segurança passam.
- **Prioridade/dependência/risco/fonte:** Agora; arquitetura operacional; vazamento/cegueira; Ford 5.1.1–5.1.4; RF13.

#### E05-02 — Alertar, restaurar e aprender com incidente

- **Problema/pessoa/fluxo:** regra baseada em medição aciona plantão e runbook; operador contém, restaura em ambiente autorizado e registra revisão.
- **Fora do escopo:** p95 2 s/1%/99,5%, RPO/RTO e backup provider como compromisso atual.
- **Tasks/subtasks:** SLI/SLO, janela/ruído, severidade, playbook, contenção, backup/restauração descartável, exercício e pós-incidente.
- **Aceite, evidência e DoD:** alerta é acionável e ligado a runbook; contenção, restauração e revisão pós-incidente são rastreáveis; restauração é exercitada sem dado indevido; lacuna não é chamada SLA; responsável aceita risco residual.
- **Prioridade/dependência/risco/fonte:** Próximo antes de piloto; E05-01/E02-04; indisponibilidade/perda; Ford 5.1.3 e objetivo E05.

#### E05-03 — Status page e comunicação segura

- **Problema/pessoa/fluxo:** operador abre incidente/janela; audiência autorizada vê estado aprovado; clientes afetados recebem aviso mínimo e encerramento auditável.
- **Fora do escopo:** página pública, e-mail real e severidades P1/P2/P3 finais nesta P0.
- **Tasks/subtasks:** audiência, conteúdo não explorável, templates, manutenção, teste de destinatário/isolamento.
- **Aceite, evidência e DoD:** status não expõe host/token/outro cliente/causa explorável; somente público autorizado vê detalhe; testes de incidente e manutenção passam.
- **Prioridade/dependência/risco/fonte:** Depois; E01/E05-02; disclosure/reputação; Ford 5.2.1–5.2.3.

## Matriz RF01–RF13

| RF | PBI(s) | Estado | Dependência |
|---|---|---|---|
| RF01 consulta | E02-01/E02-05/E03-02 | Parcial | identidade do veículo, persistência |
| RF02 IA | E02-02 | Parcial | provider/baseline |
| RF03 schema | E02-03 | Implementado no protótipo | governança do schema |
| RF04 fontes | E02-01/E02-04/E03-02 | Parcial | política/persistência |
| RF05 `fonte_ref` | E02-01/E02-03 | Implementado no protótipo | fonte válida |
| RF06 status | E02-03/E03-02 | Parcial | regras condicionais |
| RF07 comparação | E03-03 | Planejado | fichas compatíveis/versionadas |
| RF08 exportação | E03-04 | Planejado | autorização/política |
| RF09 usuários/orgs | E01-01–06/E04-01 | Planejado | identidade/tenancy |
| RF10 consumo | E04-02 | Planejado | eventos/organização |
| RF11 limites | E04-03 | Planejado | RF10/canal |
| RF12 histórico | E02-04 | Planejado | persistência/retenção |
| RF13 operação | E05-01–03 | Parcial | telemetria/backup |

## Trilhas, assunções e decisões

| Trilha | Regra |
|---|---|
| Dados/IA | Runtime é canônico; sem fonte não há confirmação; provider, score e duas fontes pedem baseline e decisão. |
| Segurança/privacidade | Gate + revisão de segurança para auth, tenant, exportação, persistência, provider e integração; negar por padrão e log sanitizado. |
| Testes | Fixtures seguras para schema, fonte, conflito, ausência, replay, expiração e acesso cruzado; offline não prova produção. |
| Acessibilidade | teclado, foco, rótulo e feedback não apenas visual; revisar exportações/gráficos quando existirem. |
| Governança | task futura tem fonte, estado, owner, decisão, evidência, rollback e risco residual. |

| ID | Hipótese | Confiança | Validação / invalida se |
|---|---|---|---|
| A-001 | R0→R5 é ordem, não cronograma. | Média | revisão de dependências / piloto exigir outro corte |
| A-002 | três papéis bastam para descoberta. | Média | matriz com stakeholders / precisar política por recurso |
| A-003 | comparar só ficha validada/versionada. | Alta | contrato/fixtures / negócio aprovar modo experimental |
| A-004 | números Ford são propostas. | Alta | baseline aprovado / decisão registrada |
| A-005 | Docling serve a texto, não citação visual. | Alta | inspeção do PDF / conversão corrigida |

Não podem ser assumidos: provider de identidade/SSO/MFA/e-mail, tenancy, banco/migração/retenção, provider e fontes de IA, política de score, preço/cota, exportação/share, observabilidade, RPO/RTO, SLI/SLO/SLA, severidade e integrações.

## Double-check interno

- A fonte Ford foi relida: os 5 épicos e 12 features do índice foram cobertos; tasks extraídas 1.1.1 até a abertura de 3.3.2 foram mapeadas. O fim da conversão está explicitado.
- RF01–RF13 aparecem na matriz e em PBIs pertinentes; cada PBI inclui problema/pessoa, fluxo, fora de escopo, tasks, aceite, evidência/DoD, dependência e risco.
- Estados de ausência, conflito, erro, acesso indevido, expiração, indisponibilidade e restauração aparecem onde aplicáveis.
- Nenhuma capacidade sem evidência local é declarada implementada. Próximos checks: links, segredo documental, cobertura e `git diff --check`.
