# 🚧 Em execução — E05-01 Telemetria sanitizada e readiness

> Prioridade: P1
>
> Área afetada: observabilidade, API, logs e operação
>
> Origem ou referência: `docs/product/backlog.md` E05-01; fluxo operacional
>
> Arquitetura: `APPROVED — Lucas disse “pode seguir” em 2026-09-09.`
>
> Triagem automática: `Material — logs, telemetria e endpoint operacional.`
>
> Segurança: `Aplicável — revisão proporcional registrada em 2026-09-09.`

## Pedido

Estruturar telemetria sanitizada, correlação, health/readiness e critérios de alerta técnico sem registrar prompts, snapshots brutos, tokens ou host interno.

## Critérios de aceite

- [ ] Health e readiness distinguem dependência indisponível de aplicação saudável.
- [ ] Eventos possuem correlação e minimização de dados.
- [ ] Logs não expõem segredos, payload LLM bruto ou dado de outro tenant.

## Restrições ou contexto

- Não prometer SLO/SLA nem instalar observabilidade externa sem decisão e autorização.

## Preflight, arquitetura e revisão de segurança — 2026-09-09

### Fatos confirmados

- `GET /api/health` hoje retorna somente `{ ok: true }`; ele não distingue processo Express disponível de dependência PostgreSQL configurada e acessível.
- O middleware HTTP já cria e devolve `x-request-id`, mas o log atual inclui endereço IP e URL original. A sanitização cobre alguns tokens de convite, porém query strings e outros identificadores ainda podem aparecer.
- `services/api/logger.ts` também persiste execuções e respostas brutas de LLM sob `var/logs/llm-responses` e `var/data/llm-responses`. O modo `file` ainda lê esses arquivos para `latest` e `history`; em `postgres`, essas leituras já usam o repositório canônico.
- P1-025 está em desenvolvimento e reivindica somente a interface de catálogo/comparação. Ela não deve ser afetada por esta task, mas `services/api/index.ts` é um arquivo de integração compartilhado.

### Decisão e escopo propostos

Implementar observabilidade **local, estruturada e sanitizada**, sem SDK, coleta remota, dashboard, alerta externo, novo schema ou migração. O corte passa a ter:

1. `GET /api/health`: liveness público mínimo, que confirma somente que o processo aceita requisições; resposta constante e sem host, URL, provider, segredo ou detalhe interno.
2. `GET /api/readiness`: prontidão técnica com estado `ready | not_ready`. No modo `postgres`, verifica uma operação limitada da dependência configurada; em falha controlada responde `503` com código técnico estável e sem `DATABASE_URL`, hostname ou mensagem do driver. No modo `file`, declara a limitação de modo local de forma estável, sem alegar disponibilidade de persistência canônica.
3. Eventos locais estruturados, com `request_id`, instante, método, rota normalizada, status, duração arredondada e categoria de resultado. Não incluir IP, query string, cookie, authorization header, corpo, e-mail, organização, ator, token, prompt, payload LLM, resposta LLM bruta ou stack trace no evento persistido.
4. Erros internos recebem correlação e categoria segura no log; a resposta HTTP continua genérica. Detalhes de diagnóstico ficam apenas no console de desenvolvimento controlado, nunca no evento estruturado nem na resposta.
5. `logLLMExecution` deixa de gerar novo arquivo de execução bruta em `var/logs`. O fluxo funcional de histórico em modo `file` não será removido nesta task: snapshots de compatibilidade existentes em `var/data` não são telemetria e sua descontinuação, retenção ou eliminação exige decisão própria junto da P1-001. Não migrar, apagar ou inspecionar artefatos históricos nesta entrega.

### Fluxo e fronteira de confiança

`requisição não confiável -> middleware gera request_id -> rota/serviço -> resposta -> evento sanitizado local`.

- O navegador recebe somente `x-request-id` e as respostas já contratadas; readiness não expõe a causa detalhada de indisponibilidade.
- O servidor decide rota normalizada, categoria, estado de prontidão e os campos que podem ser persistidos; nenhuma entrada do cliente é serializada livremente em log.
- A sonda de prontidão não cria schema, dados de negócio, requisição ao LLM ou tráfego para serviço novo. A verificação PostgreSQL é somente leitura e limitada.

### Impacto técnico e isolamento concorrente

| Área | Alteração proposta | Regra de integração |
|---|---|---|
| `services/api/logger.ts` | formato sanitizado, allowlist e remoção de novos logs LLM brutos | exclusiva da P1-021 |
| `services/api/readiness.ts` | módulo novo para checagem limitada de prontidão | exclusiva da P1-021 |
| `services/api/index.ts` | middleware e duas rotas operacionais | arquivo protegido; integrar depois da P1-025 |
| testes/fixtures seguros | cenários de sanitização e readiness | exclusivos da P1-021 |
| `docs/architecture/agent-core/HTTP_PIPELINE.md` | contrato comprovado de health/readiness e log | arquivo protegido; integrar depois da P1-025 |

A implementação ocorrerá em worktree/branch isolada. Não alterar `apps/web/src/FichaDiscovery.tsx`, `App.tsx`, `ComparisonPanel.tsx`, `api.ts`, `types.ts` ou `styles.css`, que pertencem à P1-025. Antes da integração, registrar handoff com claim, arquivos protegidos, base, checks e riscos; rebasear sobre a conclusão da P1-025 e revisar manualmente `index.ts` e `HTTP_PIPELINE.md`.

### Revisão de segurança proporcional

- **Aplicável:** endpoints operacionais, logs, informações de infraestrutura e acesso ao PostgreSQL.
- **Ameaças principais:** vazamento de token/PII/payload em logs; readiness revelando topologia ou credencial; indisponibilidade do banco mascarada como aplicação saudável; abuso de sonda para produzir dados ou tráfego; alteração concorrente apagando controles de sanitização.
- **Controles:** allowlist de campos; remoção de IP e query; redaction antes da persistência; resposta pública estável; `503` sanitizado para indisponibilidade; query limitada e somente leitura; nenhum provider, scanner ou integração externa; worktree e integração por handoff.
- **Risco residual:** snapshots brutos legados em `var/data` continuam fora do escopo de telemetria desta task até decisão específica da P1-001. Lucas aceita ou rejeita esse risco no gate; a task não deve afirmar que arquivos históricos foram saneados.

### Conformidade proporcional

`Não aplicável neste corte.` A proposta reduz dados em log e não cria coleta, cookie, analytics, retenção nova, compartilhamento ou transferência a terceiro. Reabrir avaliação de conformidade se telemetria remota, retenção formal, exportação de evento ou novos identificadores pessoais entrarem no escopo.

### Plano incremental e verificações

1. Criar tipos e funções puras de normalização/allowlist para eventos e readiness, com fixtures sintéticas que contenham valores proibidos.
2. Integrar middleware e rotas sem mudar contratos de catálogo, comparação, autenticação ou UI.
3. Parar a geração de novos logs LLM brutos e preservar a compatibilidade de histórico de arquivo sem tocar em artefatos existentes.
4. Executar `npm run typecheck`, `npm run build`, `git diff --check` e smokes locais: health, readiness em modo file, readiness PostgreSQL sem configuração/indisponível, correlação, ausência de campos proibidos e erro interno sanitizado. A validação PostgreSQL saudável fica bloqueada até ambiente autorizado/configurado.
5. Atualizar a documentação somente após comportamento comprovado e produzir handoff concorrente antes da integração.

### Double-check da arquitetura

- Health e readiness têm propósitos distintos; uma falha de PostgreSQL não será reportada como prontidão completa.
- A task não usa o estado visual, os filtros ou a seleção de comparação da P1-025; o único arquivo potencialmente concorrente é `index.ts`, isolado por worktree e integração posterior.
- O desenho não introduz endpoint autenticado, schema, prompt, provider, dependência, telemetria externa ou promessa de SLO/SLA.
- O log atual possui caminhos de dados brutos. O plano impede novas execuções brutas no diretório de logs, mas não apaga nem declara saneados arquivos históricos; essa limitação é explícita e rastreável.
- Segurança é aplicável; conformidade não é aplicável pelas restrições do corte. Estado do gate: `READY`; a implementação só pode começar após novo `APPROVED` explícito de Lucas para esta arquitetura.

## Resultado do agente

- Estado: `🚧 Em execução`; Arquitetura: `APPROVED`; Segurança: `Aplicável — revisão registrada acima`.
- Implementação parcial entregue: `services/api/readiness.ts` separa liveness de prontidão; `GET /api/readiness` devolve somente estado/código sanitizado; logs HTTP e de erro usam eventos estruturados allowlisted; novos eventos de execução LLM não persistem prompt, payload, resposta, veículo, turnos ou configuração de runtime. O histórico de compatibilidade em `var/data` não foi alterado.
- Arquivos alterados nesta frente: `services/api/logger.ts`, `services/api/readiness.ts`, `services/api/index.ts`, `scripts/verify-telemetry-sanitization.ts` e `package.json`, além desta task. Não foram alterados arquivos de interface da P1-025.
- Verificações executadas: `npm run typecheck` passou; `npm run verify:telemetry-sanitization` passou (`TELEMETRY_SANITIZATION=PASS`); `npm run build` passou; `git diff --check` passou; smoke local de `checkReadiness()` em modo file retornou `{"status":"not_ready","code":"persistence_mode_file"}`.
- Verificações bloqueadas: prontidão PostgreSQL saudável e indisponibilidade de PostgreSQL não foram exercitadas, pois requerem ambiente/configuração autorizados. A integração documental em `HTTP_PIPELINE.md` permanece protegida até o handoff da P1-025.
- Próximo passo: após o handoff da P1-025, revisar a integração de `index.ts`/documentação, executar smokes HTTP e registrar se os snapshots legados requerem decisão de retenção na P1-001 antes de concluir esta task.
