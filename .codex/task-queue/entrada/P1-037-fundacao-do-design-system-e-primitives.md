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

## Arquitetura, segurança e coordenação — 2026-09-11

### Decisão e escopo

Criar uma camada de Design System isolada em `apps/web/src/design-system.css` e `apps/web/src/ui/primitives.tsx`. A folha define tokens semânticos e estilos das primitives; o módulo React expõe `UiButton`, `UiCard`, `UiField`, `UiStatus`, `UiLoadingState`, `UiEmptyState` e `UiErrorState` com nomes acessíveis e estados explícitos. `apps/web/src/main.tsx` passa a carregar a camada antes dos estilos legados.

Esta task não migra tela, rota, formulário de produto, contrato de dados, endpoint, sessão ou regra de autorização. Os aliases legados em `styles.css` passam a consumir tokens semânticos para permitir migração incremental sem mudança de comportamento intencional.

### Fluxo, dados e confiabilidade

Pessoa desenvolvedora escolhe uma primitive e um token semântico; a tela futura consome a primitive sem criar valor recorrente próprio. Status técnicos sempre usam texto visível e classe semântica, não cor isolada. Os componentes não recebem, persistem nem transmitem dados de domínio.

### Impacto técnico e ownership

- Owner único: esta execução em modo único.
- Recursos permitidos: `apps/web/src/main.tsx`, `apps/web/src/styles.css`, `apps/web/src/design-system.css`, `apps/web/src/ui/primitives.tsx`, esta task e `docs/product/design-system.md` se necessário para inventário.
- Recursos proibidos: `services/`, `packages/agent-runtime/assets/`, contratos HTTP, autenticação, persistência e telas de produto.
- Dependências: nenhuma alteração de runtime; tasks posteriores P1-038 a P1-042 consomem esta fundação.

### Segurança e conformidade

**Segurança: não aplicável.** A alteração é local à camada visual compartilhada e não toca autenticação, autorização, dados sensíveis, segredo, API, integração, persistência, dependência, CI/CD ou infraestrutura.

**Conformidade: não aplicável.** Não cria nem altera coleta, persistência, compartilhamento, retenção ou tratamento de dados pessoais.

### Verificação e double-check

- Executar `npm run typecheck` e `npm run build`.
- Revisar o CSS para foco visível, estados desabilitados, contraste textual e `prefers-reduced-motion`.
- Confirmar que o módulo de primitives não importa API, tipos de domínio ou sessão.
- Confirmar que nenhuma tela de produto foi reescrita nesta fatia.

**Double-check:** o escopo mantém o comportamento atual, preserva a visibilidade futura de fonte/status/conflito e não cria uma segunda fonte de verdade para contratos do BlindSpot.

### Architecture Gate

`APPROVED — Lucas autorizou a execução da primeira task UX/UI em 2026-09-11.`

### Revisão documental posterior — 2026-09-11

Após orientação de Lucas, o Design System foi aprofundado como especificação central de composição, grid, componentes, assets, adoção de referências PEK e checkpoints. O Image System complementar foi criado em `docs/product/image-system.md`. Esta revisão não altera a conclusão técnica da P1-037: a integração de provider/imagem ficou isolada na P1-043, com gate próprio.

## Resultado do agente

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — arquitetura registrada nesta task em 2026-09-11`.
- Triagem automática: `Material — interface compartilhada`.
- Segurança: `Não aplicável — justificado na arquitetura`.
- Implementação: adicionados `apps/web/src/design-system.css` e `apps/web/src/ui/primitives.tsx`; `main.tsx` carrega a camada antes dos estilos legados; aliases existentes e status de ficha passaram a consumir tokens semânticos sem reescrever tela de produto.
- Arquivos alterados: `apps/web/src/design-system.css`, `apps/web/src/ui/primitives.tsx`, `apps/web/src/main.tsx`, `apps/web/src/styles.css`, `docs/product/design-system.md` e esta task.
- Verificação: `npm run typecheck` passou; `npm run build` passou fora do sandbox após o bloqueio de leitura do Vite no sandbox. Revisão estática confirmou foco visível, estado desabilitado/carregando, texto nos status e `prefers-reduced-motion`.
- Verificação não executada: smoke de API não é aplicável; nenhuma rota, contrato ou dado foi alterado. Render de tela consumindo as novas primitives é responsabilidade das tasks P1-038 a P1-042.
- Limitações: regras legadas com valores literais continuam documentadas como inventário de transição; esta task não as substitui globalmente nem prova aceitação visual de telas futuras.
- Próximo passo: P1-038 ou P1-039 consome a fundação em uma jornada de produto com Architecture Gate próprio.
