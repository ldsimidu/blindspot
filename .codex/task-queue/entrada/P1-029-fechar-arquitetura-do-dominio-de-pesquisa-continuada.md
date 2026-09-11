# ❌ Pendente — Fechar arquitetura do domínio de pesquisa técnica continuada

> Prioridade: P1
>
> Área afetada: arquitetura, domínio, dados, API, IA e documentação
>
> Origem ou referência: proposta `Arquitetura Completa do Sistema de Pesquisa e Fichas Técnicas do BlindSpot (1).md`, analisada em 2026-09-11
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — define contratos futuros de dados, IA, API e interface.`
>
> Segurança: `Aplicável — persistência, API e pesquisa com IA exigem revisão proporcional.`

## Pedido

Produzir e aprovar a arquitetura canônica para transformar a geração pontual em pesquisa contínua, compatível com os assets de runtime e a persistência já existente. A decisão deve separar `Vehicle` (identidade da configuração), `Technical Sheet` (linha de trabalho independente), `Revision` (snapshot imutável) e `Research Session` (tentativa orientada por foco).

## Critérios de aceite

- [ ] Um glossário e diagrama de relações distinguem inequivocamente Vehicle, Sheet, Revision, Session, Evidence e Source.
- [ ] A decisão preserva `vehicle_configurations`, versões e fontes existentes por uma migração compatível, sem reescrever histórico.
- [ ] Continuação, nova ficha, refresh, reprocessamento e fork têm semânticas, permissões e efeitos de linhagem explícitos.
- [ ] A arquitetura define fronteira para evidência compartilhada sem permitir que uma ficha altere silenciosamente outra.
- [ ] A revisão de segurança registra confiança, dados de pesquisa, idempotência, concorrência, retenção e risco residual.

## Restrições ou contexto

- Ler `AGENTS.md`, perfil PDK, estratégia de verificação, `packages/agent-runtime/assets/`, `services/api/db/schema.ts`, `repository.ts`, P1-001 a P1-004 e a proposta de origem.
- Documentação não substitui runtime; não alterar prompt, schema, banco, endpoint ou provider nesta task de arquitetura.
- Decisões esperadas: monólito modular; `vehicle_configurations` evolui como identidade de configuração; Sheet é nova entidade; Revision é append-only; Session é auditável e pode produzir uma ou mais revisions.

## Dependências

- Estado e compatibilidade reais de P1-001, P1-002, P1-003 e P1-004A revalidados.

## Resultado do agente

_Preenchido pelo agente. Não apague o pedido original._

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — Architecture Gate obrigatório antes de qualquer contrato.`
- Segurança: `Aplicável — usar project-security-assurance; compliance a avaliar se houver retenção de instruções/identificadores de usuários.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: ativar, produzir Architecture Gate e aguardar `APPROVED`.
