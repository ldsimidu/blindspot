# Revisão de segurança — fluxograma consolidado da jornada

Data: `2026-09-07`

## Escopo e gatilhos

- **Mudança:** representação documental de autenticação, autorização, tenancy, exportação, auditoria e operação futuras.
- **Gatilhos:** identidade, dados corporativos, exportação, logs e IA aparecem no fluxo; nenhum contrato, endpoint, dado ou integração é alterado.
- **Não aplicável:** não há implementação, provider, dependência, segredo, rede ou serviço externo novo.

## Fronteiras e riscos

- **Fronteiras:** pessoa usuária/administradora, organização, QA, operação e recursos de ficha/exportação.
- **Abuso principal:** fluxograma sugerir que UI é barreira de autorização, que tenant pode ser misturado ou que segredo/detalhe operacional pode ser exposto.
- **Controles:** gates explícitos de servidor/tenant/papel, erros genéricos, estados de expiração/negação e proibição de credenciais, logs e detalhes exploráveis.

## Verificação planejada ou executada

- A ser executada: leitura de rotas/gates no diagrama, alternativa textual e varredura documental de segredo.

## Achados, exceções e risco residual

- Escolhas de SSO, MFA, retenção, cota e resposta a incidente permanecem `a decidir`. Lucas aceita o risco residual de planejamento, não de implementação.

## Bloqueios e próximo passo

- Uma task futura de auth, persistência, exportação ou integração deve atualizar esta revisão e passar por Gate próprio.

## Emenda documental — detalhamento de fluxo em 2026-09-07

### Escopo e gatilhos

- **Mudança:** ampliação de `backlog.md` e `fluxograma-desenvolvimento-agente.md` com persistência/catálogo, autenticação detalhada, estados de consulta/reporte, revogação e recuperação de incidente.
- **Gatilhos representados:** autenticação, autorização, tenant, persistência, migração, exportação, auditoria, retenção e operação. Nenhum endpoint, dado, integração, dependência, segredo ou runtime foi alterado.

### Fronteiras, controles e verificação

- **Cenários principais:** conta indevida, replay de convite/reset, claim SSO para tenant incorreto, sessão residual, versão parcial, duplicata mesclada automaticamente, vazamento em falha operacional e estado de reporte adulterado.
- **Controles documentados:** falha fechada, token único/revogação, MFA antes de sessão, autorização no servidor, transação/append-only, dry-run/idempotência, correlação sanitizada e estados de QA sem salto.
- **Check executado:** leitura cruzada entre backlog e fluxograma; os novos nós estão marcados como planejados ou a decidir e não prometem capacidades atuais.

### Risco residual e próximo passo

- Provider de identidade, MFA, SSO, tenancy, banco, retenção, backup, RPO/RTO, fila QA, notificações e SLI/SLO continuam sem decisão. Lucas autorizou apenas a documentação de planejamento; uma implementação futura exige Gate e revisão próprios.
