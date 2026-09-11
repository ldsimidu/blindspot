# ❌ Pendente — fundação do Design System e primitives

> Prioridade: P1
>
> Área afetada: interface
>
> Origem ou referência: `docs/product/design-system.md` e `docs/product/ux-ui-roadmap-e-backlog.md`
>
> Arquitetura: `A avaliar na ativação — UX-BS-001/002 e Design System aprovam somente a direção`
>
> Triagem automática: `Material — interface compartilhada`
>
> Segurança: `Não aplicável inicialmente — não altera identidade, API, dados ou integração; reavaliar se o escopo tocar sessão ou telemetria`

## Pedido

Criar tokens semânticos e primitives reutilizáveis para a refatoração UX/UI, sem alterar contratos de dados, rotas ou autorização.

## Critérios de aceite

- [ ] Tokens de cor, tipografia, espaço, raio, borda, elevação, movimento e breakpoints têm nomes semânticos e documentação de uso.
- [ ] Componentes base de ação, campo, card, status, loading, empty e error state reutilizam tokens, inclusive foco e estados desabilitados.
- [ ] Não há regressão de contraste, teclado ou `prefers-reduced-motion` nos componentes alterados.
- [ ] Inventário distingue tokens propostos dos valores ainda existentes no CSS.

## Restrições ou contexto

- Não reescrever telas de produto nesta task.
- Não esconder `fonte_ref`, status, completude ou conflito em primitives visuais.
- Ler `docs/product/design-system.md`, a auditoria UX/UI, `AGENTS.md`, perfil e estratégia de verificação antes de implementar.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar na ativação`.
- Triagem automática: `Material — interface compartilhada`.
- Segurança: `Não aplicável inicialmente; reavaliar no gate`.
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: Architecture Gate da fundação visual.
