# P1-055 — Motion pass das superfícies autenticadas

> Estado: `IMPLEMENTADO TECNICAMENTE — aguardando checkpoint visual humano`.

## Diagnóstico atual

O cadastro já tem uma linguagem de movimento correta: direção efêmera (`forward`/`backward`), entrada curta do conteúdo que mudou, marcador de etapa e uma única camada ambiente abstrata. Esses efeitos não são evidência de servidor e possuem fallback de reduced motion.

No shell autenticado, os controles têm hover/press, o toast entra no overlay e a abertura do diálogo usa foco nativo; porém troca de seção, entrada do overview, abertura da ficha completa e troca de aba técnica acontecem sem continuidade visual. A falta de transição faz o sistema parecer fragmentado apesar da composição ter sido aprovada.

## Objetivo

Dar continuidade espacial às ações reais do produto, sem transformar dados técnicos em espetáculo ou sugerir pesquisa/validação em andamento.

## Eventos e decisões

| Evento real | Estado sem movimento | Movimento local proposto | Rejeições explícitas |
| --- | --- | --- | --- |
| Navegação entre seções autenticadas | nova seção já legível e focável | entrada única da região de conteúdo: opacidade + deslocamento vertical de até 8 px, 220 ms; sem atrasar foco | transição de página longa, saída bloqueante, animação da navegação inteira |
| Abrir ficha completa | workspace já renderizado com botão de voltar | `forward`: resumo fica fora da árvore e a visão dedicada entra em 220 ms; foco segue para a visão | barra de progresso, animação do score/atributos, skeleton fictício |
| Voltar à última ficha | overview já renderizado e foco retorna à CTA | `backward`: mesma receita em direção reversa, 220 ms | recarregar ou gerar novamente a ficha |
| Trocar aba da ficha técnica | painel da aba selecionada já disponível | fade/translate curto apenas no painel, 140 ms; tabs e foco permanecem estáveis | animar valores, fontes, conflitos ou cada linha da tabela |
| Abrir diálogo de pesquisa | diálogo utilizável imediatamente | entrada curta de superfície/opacity, 140 ms; backdrop já ativo; Escape e foco nativo preservados | modal com spring, blur pesado ou atraso de campo |
| Resultado de uma geração concluída | dados retornados e já confirmados | overview entra uma única vez, com módulos em sequência de no máximo 80 ms total | ring “preenchendo”, shimmer, contadores subindo, animação que sugira qualidade/progresso factual |

## Arquitetura de implementação

1. Introduzir um estado efêmero de apresentação para a visão autenticada, separado de `activeView`. Ele registra `forward`, `backward` ou `neutral` somente quando uma ação local muda de contexto.
2. Encapsular o conteúdo ativo do `<main>` em uma região com chave de visão. O shell, navegação, tema, sessão, toast e skip link não serão remontados nem animados.
3. A passagem request → technical recebe `forward`; technical → request recebe `backward`; navegação de menu recebe `neutral` para não inventar direção entre áreas sem relação hierárquica.
4. No `TechnicalFichaWorkspace`, aplicar a receita ao painel de aba, não ao cabeçalho, tabs, dados persistentes ou fontes.
5. O diálogo de pesquisa recebe apenas entrada; sua saída usa o fechamento nativo imediato para não reter foco/overlay depois de Escape ou cancelamento.
6. A entrada do overview após sucesso é puramente contextual: ocorre depois de resposta existente, não substitui o loading confirmado nem modifica o anel de completude.

## Especificação visual

- **Receitas e tokens:** reutilizar `flow.forward`, `flow.backward`, `control.feedback` e durações existentes do Motion System; adicionar apenas uma receita local `view.neutral` se ela não puder ser expressa pelas classes existentes.
- **Propriedades:** somente `opacity` e `transform` nas transições de conteúdo; `transform` máximo 8 px; sem transição de layout, altura, largura, dados ou cores de status.
- **Ritmo:** 140 ms para dialog/tab, 220 ms para troca de visão; entrada de módulos com atraso cumulativo máximo de 80 ms e nunca em textos campo a campo.
- **Camada ambiente:** nenhuma nova camada ambiente nas superfícies autenticadas. O ambiente atual do cadastro não é copiado ao dashboard.
- **Dark/light:** mesma cinemática e tokens, sem cor como sinal de movimento ou estado.

## Acessibilidade, estados e integridade

- `prefers-reduced-motion`: troca imediata ou fade imperceptível, sem deslocamento, delay ou loop.
- Foco é movido pela ação existente, não pela animação; Tab/Shift+Tab e Escape funcionam antes, durante e depois da transição.
- Loading, erro, vazio, dados indisponíveis, conflito e fonte continuam estáticos e legíveis. Toast mantém papel transversal e nunca desloca layout.
- Não adicionar biblioteca, template, asset, rede, conta ou dependência. Magic UI, Velora, Cult e demais referências permanecem **referência apenas**; a solução é CSS/React local.

## Impacto e verificação

- Arquivos previstos: `apps/web/src/App.tsx`, `apps/web/src/styles.css`, `apps/web/src/TechnicalFichaWorkspace.tsx`, `apps/web/src/technical-ficha-workspace.css`, `docs/design-system/motion.md` e esta task.
- Segurança proporcional: `Não aplicável`; não toca API, sessão, RBAC, persistência, provider, payload ou dados.
- Verificar 1440, 1024, 768 e 390 px; dark/light; navegação rápida; request → technical → request; troca de abas; diálogo; sucesso/erro; teclado e reduced motion. Capturas devem mostrar estado estático e decisão de movimento, mas não provar semântica de servidor.

## Double-check

- Cada movimento deriva de evento conhecido; nenhum representa pesquisa, aprovação, confiabilidade, fonte ou completude.
- A proposta anima regiões que mudam, preservando shell, ação, valores, foco e feedback.
- O dashboard não ganha loop, glitter, parallax, blur decorativo ou “progresso” falso.
- A composição V10 não é alterada; este corte acrescenta continuidade, não novos cards, dados ou navegação.

## Architecture Gate

`APPROVED — Lucas autorizou a implementação em 2026-09-13. Nenhuma mudança de contrato, API, esquema, sessão, autorização ou dependência foi necessária.`
