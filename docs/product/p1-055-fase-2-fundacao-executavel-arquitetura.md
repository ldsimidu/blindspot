# P1-055 / Fase 2 — arquitetura da fundação visual executável

> Estado: `IMPLEMENTADA — aguarda checkpoint de render antes de qualquer consumidor produtivo`.
>
> Escopo aprovado anteriormente: Fases 0 e 1 (matriz e protótipo estático). Este documento abre o sub-gate independente para tokens e primitives.

## Decisão e recorte

Criar uma fundação visual **theme-capable** para o produto autenticado: o modo claro usa a direção warm-light aprovada; o modo escuro é sua equivalência semântica, de alta legibilidade e mesma hierarquia. A fundação não migrará views, não mudará API, não alterará a jornada de acesso nem modificará o mecanismo atual de tema, sessão ou comportamento de qualquer rota. A implementação será uma camada de tokens e primitives isoladas, preparada para ser consumida depois por cortes que tenham seus próprios gates.

A escolha é incremental porque os arquivos atuais mostram que `apps/web/src/design-system.css` é dark-first, `body.theme-light` é uma variação fria e `apps/web/src/App.tsx` concentra estado de tema, sessão e navegação. Trocar valores globais ou reescrever o shell agora mudaria comportamento e consumidores fora do objetivo desta fase.

## Fatos confirmados

- `design-system.css` já contém tokens semânticos, primitives (`ui-card`, `ui-button`, `ui-field`, `ui-status`, `ui-state`, `ui-toast`) e reduced-motion; eles precisam de evolução compatível, não de remoção cega.
- `App.tsx` persiste preferência de tema em `localStorage`, consulta sessão, fecha menus por `Escape`/clique externo e controla logout. Nada disso será modificado pela Fase 2.
- A referência aprovada requer canvas quente, superfícies branco-quente, grafite, coral pontual, grades assimétricas e componentes com responsabilidade diferente; não requer dependência, fonte remota, asset externo ou provider de imagem.
- P1-038 mantém sua jornada de acesso; esta fase não altera seus seletores, sua composição ou seu canvas.

## Proposta técnica

### 1. Tokens de tema por escopo, não por substituição global

Manter os tokens existentes como contrato de compatibilidade e adicionar aliases de fundação autenticada sob um escopo explícito de futuro `AppFrame`, por exemplo `--app-canvas`, `--app-frame`, `--app-surface`, `--app-surface-muted`, `--app-ink`, `--app-ink-muted`, `--app-border`, `--app-accent`, `--app-accent-on`, `--app-frame-radius`, `--app-module-radius`, `--app-control-radius`, `--app-grid-gap` e `--app-content-max`.

Os aliases terão dois mapas explícitos: claro quente e escuro profundo. Os dois preservam a mesma semântica — canvas, frame, superfície, texto, borda, ação, foco e status —; cor de marca não muda de significado e nenhum estado depende exclusivamente de luminosidade. A Fase 2 não troca `--color-background-canvas`, não remove `theme-dark`/`theme-light`, não muda `localStorage` e não aplica classe no `body`; o consumidor futuro apenas poderá resolver seus aliases pelo modo já estabelecido.

### 2. Primitives de layout sem dado ou efeito colateral

Criar, em módulo novo e isolado de `apps/web/src/ui/`, apenas as primitives abaixo. Elas recebem `children` e atributos visuais/semânticos mínimos; não fazem fetch, não leem storage, não decidem RBAC, não formatam ficha e não escondem conteúdo.

| Primitive | Responsabilidade | Estados permitidos | Proibido |
| --- | --- | --- | --- |
| `AppFrame` | Limite visual warm-light de uma área autenticada | padrão, compacto | Tema global, sessão, navegação e overflow horizontal implícito |
| `PageHeader` | Título, apoio e ações relacionadas à página | padrão, ação ausente | Saudação fictícia ou ações sem consequência |
| `ModuleGrid` | Grade semântica 12/8/4 e gaps | padrão, compacta | Ordenar dados, inventar breakpoints de conteúdo |
| `MetricTile` | Uma métrica factual com rótulo, valor e estado | confirmado, parcial, conflito, indisponível | Calcular métricas, animar números, cor como único sinal |
| `PriorityList` | Lista de itens factuais prioritários | vazia, itens, bloqueada | Criar lembrete/urgência fictícia ou decidir ação |
| `DataPanel` | Agrupar dados densos correlatos | padrão, vazio, loading | Virar wrapper genérico de qualquer card |

`VehicleStage`, rail de navegação, disclosure, tabs e composer ficam **fora** desta fase: cada um toca responsabilidade de tela/shell e depende do checkpoint posterior.

### 3. CSS e compatibilidade

- Estilos de foundation entram em arquivo dedicado, importado explicitamente pelo consumer futuro, sem seletores globais em `styles.css` e sem `:has()` para determinar comportamento de produto.
- Grade usa CSS Grid com 12/8/4 colunas e colunas mínimas; 1024 e 768 refluem por CSS, sem JavaScript de viewport. A 390 px, módulos ocupam quatro colunas e dados nunca são removidos para caber.
- Superfícies são opacas por padrão. Não usar `backdrop-filter`, imagem remota, vídeo, canvas, WebGL ou nova biblioteca.
- Modo claro e escuro devem ter o mesmo grid, ordem, tamanho de alvo, foco, conteúdo e estados; muda somente o material. Não criar componente, layout, fonte, ícone, contraste insuficiente ou informação exclusiva de um dos modos.
- Foco usa o token existente e targets acionáveis permanecem >=42 px. A primitive não inclui ação decorativa.
- Movimento é nulo nesta fase. `prefers-reduced-motion` existente continua intacto.

## Arquivos previstos e ownership

| Arquivo | Ação | Motivo |
| --- | --- | --- |
| `apps/web/src/design-system.css` | Adição compatível de aliases e documentação de tokens | Fonte local de tokens/primitives atuais |
| `apps/web/src/ui/foundation.tsx` | Novo, primitives sem side effects | Evita acoplamento com `App.tsx` |
| `apps/web/src/ui/foundation.css` | Novo, estilos scoped das primitives | Evita cascade sobre acesso e workspaces legados |
| `docs/product/design-system.md` | Atualizar estado: proposto vs implementado | Não prometer runtime antes de entrega |
| fixture/teste local da primitive, se a stack existente o comportar | Novo e sanitizado | Verificar sem API/sessão |

Nesta fase, **não** tocar: `apps/web/src/App.tsx`, `apps/web/src/styles.css`, `TechnicalFichaWorkspace`, API, contratos, schema, providers, assets, dependências ou `.env`.

## Dados, segurança e conformidade

Segurança: `Não aplicável nesta subfase`. A proposta não modifica autenticação, autorização, sessão, dados pessoais, API, persistência, logs, dependências ou integração. O isolamento é uma condição de aceite: se a implementação precisar importar sessão, ler `localStorage`, criar uma navegação ou instalar pacote, ela para e abre revisão de segurança antes.

Conformidade: `Não aplicável`. Não há coleta, tracking, transferência, asset externo ou novo dado.

## Execução registrada

1. Aliases `--app-*` foram adicionados em `design-system.css`: dark como mapa padrão e warm-light em `body.theme-light`, sem substituir tokens legados ou a preferência persistida.
2. `foundation.tsx` e `foundation.css` fornecem seis primitives isoladas; `main.tsx` carrega somente seu CSS compartilhado.
3. `App.tsx`, `styles.css`, jornada de acesso, sessão, RBAC, API, contrato e dependências não foram alterados por este corte.
4. Typecheck, build e `git diff --check` são executados ao fim do corte. O checkpoint de render permanece obrigatório antes da primeira integração.

## Verificação executada

- `npm run typecheck`: aprovado em 2026-09-13.
- `npm run build`: aprovado em 2026-09-13. A primeira execução no sandbox não teve permissão de leitura do Vite; a repetição autorizada fora do sandbox concluiu o bundle.
- `git diff --check`: aprovado em 2026-09-13, sem erro de whitespace no diff.
- Render/checkpoint: não executado. As primitives não foram conectadas a uma tela de produção e o ambiente CUA permanece indisponível; não há alegação de aceite visual ou responsivo de runtime.

## Critérios de aceite da Fase 2

- Nenhuma alteração em `App.tsx`, `styles.css`, fluxo de login/cadastro, tema persistido, sessão, RBAC, logout, API ou contratos.
- Tokens novos têm nome semântico, fallback e uso definido; tokens legados continuam válidos.
- Cada primitive declara responsabilidade e não aceita dado de domínio como atalho de layout.
- Nenhuma dependência, fonte remota, imagem, provider ou efeito visual pesado entra.
- Todo token de foundation possui valor claro e escuro testável; ação, foco, texto secundário, borda e status continuam distinguíveis em ambos os modos.
- A grade se adapta em 1440/1024/768/390 sem rolagem horizontal e sem ocultar texto decisório.
- Typecheck, build e diff check passam; render humano continua requisito para aceitar composição de produção.

## Double-check da arquitetura

- O escopo cria base reutilizável, mas não finge ter migrado o produto: a primeira consumidora continua bloqueada por checkpoint de render.
- A separação em arquivo novo evita o problema anterior de estilo claro isolado competir com cascade dark legado.
- O tema persistido é uma fronteira comportamental; preservá-lo impede uma mudança visual de virar regressão de preferência.
- O modo claro é a expressão inicial da referência, mas não é o único tema do sistema: o modo escuro usa a mesma topologia e semântica, não um produto visualmente diferente.
- `VehicleStage` e navegação são deliberadamente adiados porque exigem identidade factual, RBAC e foco/menu verificáveis.
- A proposta reproduz material e proporção da referência, não seu conteúdo de telemetria, imagem ou marca.
