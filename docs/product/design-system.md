# Design System — BlindSpot

> Estado: `DIRECAO_DE_REFATORACAO_APROVADA` em 2026-09-11. Este documento governa a experiência-alvo; o CSS em `apps/web/src/styles.css` continua sendo a fonte do comportamento visual já entregue até que cada fatia de refatoração seja aprovada e implementada. Valores abaixo são contratos de intenção, não tokens já implementados.

## Propósito e autoridade

O Design System impede que novas telas decidam cor, densidade, espaçamento, tipografia, estados ou componentes de modo isolado. Screenshots atuais e referências externas são evidências; não são especificações executáveis nem autorização para copiar identidade, conteúdo, assets ou código.

Precedência para decisões visuais:

1. instrução explícita mais recente de Lucas;
2. este documento e decisões registradas;
3. contratos PEK e adapter BlindSpot;
4. padrões implementados e comprovados;
5. referências visuais catalogadas;
6. inferência local.

Quando o comportamento funcional, o schema, a API ou a regra de segurança entrarem em conflito com uma decisão visual, prevalecem os contratos do BlindSpot. `fonte_ref`, status, completude, conflito e elegibilidade de ação nunca podem ser escondidos para reproduzir uma referência.

## Direção visual alvo

- **Veículo como objeto central:** a ficha começa por identidade, imagem ou representação permitida, contexto e métricas essenciais; o detalhe técnico vem por densidade progressiva.
- **Navegação superior de produto:** páginas principais ficam no topo e o contexto de sessão permanece explícito, sem transformar a interface em uma cópia de um dashboard de locação ou manutenção.
- **Superfícies claras e calmas:** fundo quente-neutro, cards com borda discreta, profundidade baixa e destaque de marca pontual. A interface não deve competir visualmente com a ficha.
- **Dados comparáveis e legíveis:** números, unidade, fonte, versão, status e conflito ficam alinhados e escaneáveis. A comparação coloca as duas fichas lado a lado e não escolhe vencedora automaticamente.
- **Ação por contexto:** pesquisar, comparar, exportar, reportar, gerir equipe e sair aparecem onde a decisão ocorre, com pré-requisitos e consequência explicados.
- **Mobile preserva a tarefa:** não é apenas uma redução do desktop; a navegação, o contexto do veículo e ações críticas precisam continuar acessíveis.

## Referências e princípios extraídos

| Evidência | Princípio aproveitável | Limite obrigatório |
|---|---|---|
| `evidence/ux-ui/references/inspiracoes-gerais/WhatsApp Image 2026-09-08 at 22.22.14.jpeg` | composição ampla, card central de veículo e métricas em blocos | não transformar o BlindSpot em painel de manutenção ou telemetria fictícia |
| `.../WhatsApp Image 2026-09-11 at 02.55.43.jpeg` | navegação superior e catálogo visual de veículos | filtros e cards não podem ocultar identidade exata, versão ou mercado |
| `.../WhatsApp Image 2026-09-11 at 02.59.17.jpeg` e `02.59.42.jpeg` | veículo como âncora, tabs por contexto e detalhamento progressivo | métricas só são exibidas se tiverem fonte ou status compatíveis com o schema |
| `.../ef8dfe53-1267-4474-94c3-3d2aa1388dc8-506436c8-3155-4f5c-9.jpg` | comparação lado a lado por atributo | não usar apelo comercial, preço ou destaque como vencedor automático |
| `evidence/ux-ui/references/login-cadastro/WhatsApp Image 2026-09-11 at 03.08.29.jpeg` | espera com progresso, pendência e próximo passo claros | o status vem do servidor; não prometer prazo ou análise que o runtime não oferece |

## Estado atual e alvo

| Área | Estado atual observado | Direção de refatoração |
|---|---|---|
| Navegação | sidebar vertical | navegação superior responsiva com sessão e ações globais claras |
| Ficha | formulário seguido de painel lateral e tabela longa | workspace do veículo, resumo primeiro e seções técnicas progressivas |
| Catálogo | busca ou descoberta separada da leitura | catálogo com filtros, grid ou lista de fichas e rail de fichas já geradas no contexto da consulta |
| Comparação | seleção funcional de duas versões | duas fichas simétricas: X à esquerda, Y à direita, diferença e qualidade por atributo |
| Cadastro | formulário único | etapas curtas por assunto, validação local, revisão e espera de aprovação |
| Espera | mensagem textual de status | linha de progresso com feito, estado atual, bloqueio e próximo passo real |
| Orientação | fluxo separado, sem objetivo de produto confirmado | candidato a remoção; substituir apenas se cada função necessária reaparecer em ajuda contextual |

## Tokens e implementação

Tokens atuais em `apps/web/src/styles.css` são uma fotografia do runtime, não a escala final. A refatoração deve criar tokens semânticos reais em código antes de novas telas consumirem valores recorrentes:

```text
cor: background, surface, text, border, brand, success, warning, danger, info e status de qualidade
tipografia: display, heading, body, label, metadata e numero
escala: spacing, tamanho, radius, border, shadow, z-index, motion e breakpoints
componente: navigation, button, input, card, ficha-row, status-pill, empty-state e loading
```

Regras:

- componente usa token semântico, não hexadecimal ou espaçamento novo arbitrário;
- novo valor recorrente precisa de decisão registrada antes de entrar no CSS;
- cor jamais é o único canal para qualidade ou estado;
- ícone isolado recebe nome acessível; tooltip não contém informação essencial;
- movimentos respeitam `prefers-reduced-motion`.

## Fundamentos de design

### Cor e significado

| Token semântico | Uso | Não usar para |
|---|---|---|
| `color.background.canvas` | fundo da aplicação | informar criticidade sozinho |
| `color.surface.default` / `raised` | cards, painéis e menus | diferenciar dados confirmados de conflito |
| `color.text.primary` / `secondary` / `muted` | hierarquia de leitura | substituir rótulos ou ícones acessíveis |
| `color.border.subtle` / `strong` | separar superfícies e foco auxiliar | criar grade visual pesada |
| `color.action.primary` / `secondary` / `danger` | ação intencional, alternativa e destrutiva | status de qualidade do dado |
| `color.status.confirmed`, `partial`, `conflict`, `not-found`, `not-applicable`, `inferred` | estado técnico da variável | único sinal de estado; sempre combinar texto/ícone |
| `color.feedback.success`, `warning`, `error`, `info` | retorno da interface | equivaler automaticamente à qualidade de uma ficha |

O alvo visual é claro, com base quente-neutra, contraste alto para texto e uma cor de marca usada com moderação. A paleta concreta só entra no código com contraste medido e tokens semânticos; referências externas não definem hexadecimal, fonte ou asset do BlindSpot.

### Tipografia e escala

| Papel | Uso | Regra |
|---|---|---|
| `type.display` | nome do veículo e títulos de marco | no máximo um por viewport principal |
| `type.heading` | títulos de seção e painel | estrutura a leitura, sem capitalização decorativa |
| `type.body` | explicação e conteúdo | contraste e linha confortável para leitura prolongada |
| `type.label` | rótulos de formulário e atributo | sempre próximo ao controle/valor correspondente |
| `type.meta` | versão, mercado, data e proveniência curta | não carregar informação decisória exclusiva |
| `type.numeric` | potência, medidas, cobertura e contagem | unidades visíveis e alinhamento comparável |

Usar uma escala de espaçamento compartilhada (`space.1` a `space.10`) e raios/elevations discretos. O código não deve introduzir margens, sombras ou tamanhos repetidos fora dessa escala sem decisão no registro.

### Layout e responsividade

- **Desktop:** conteúdo central com largura legível; o veículo, os resultados ou as duas colunas de comparação recebem o espaço prioritário.
- **Tablet:** painéis auxiliares descem ou se tornam drawers; a ação principal permanece visível.
- **Mobile:** navegação vira menu acessível; ficha preserva identidade e resumo; comparação alterna entre X/Y mantendo o atributo como âncora, sem esconder fonte/status.
- Breakpoints serão tokens (`breakpoint.compact`, `medium`, `wide`), não decisões espalhadas por página.
- O foco visível não pode ser cortado por `overflow`, sticky header ou drawer.

## Contratos de componentes

| Componente | Responsabilidade | Estados obrigatórios |
|---|---|---|
| `TopNavigation` | destinos principais, destino ativo e menu compacto | desktop, compacto, foco, item inelegível/oculto por papel |
| `SessionMenu` | identidade mínima da sessão e logout | aberto, carregando saída, erro de saída |
| `VehicleIdentityHero` | veículo, versão, mercado e contexto visual permitido | com imagem, sem imagem, identidade incompleta, carregando |
| `TechnicalFichaSummary` | métricas e qualidade de leitura inicial | dados completos, parciais, conflito, vazio |
| `TechnicalFichaSection` | agrupar atributos progressivamente | aberta, fechada, carregando, indisponível |
| `TechnicalFieldRow` | valor, unidade, status e fonte por variável | confirmado, parcial, conflito, não encontrado, não aplicável, inferido |
| `QualityStatus` / `SourceEvidence` | explicar qualidade e proveniência | texto visível, ícone nomeado, fonte ausente/conflitante |
| `CatalogFilters` | filtro sem ambiguidade de identidade | default, aplicado, sem resultado, erro |
| `FichaCatalogCard` / `GeneratedFichaRail` | reconhecer e abrir ficha existente | carregando, vazio, item inelegível, paginação |
| `FichaComparisonWorkspace` | alinhar X e Y por atributo | seleção incompleta, bloqueada, comparável, sem diferenças |
| `RegistrationStepper` / `ApprovalTimeline` | progresso de cadastro e aprovação | atual, concluído, pendente, recusado, erro de consulta |
| `EmptyState`, `ErrorState`, `LoadingState` | comunicar ausência/falha/espera | mensagem, causa segura, ação disponível e próxima etapa |

## Regras de acessibilidade e conteúdo

- Todo controle tem nome acessível; ícone isolado não é ação sem rótulo alternativo.
- Cor, posição ou hover não são o único canal para status, qualidade ou permissão.
- Erros de formulário ficam associados ao campo, anunciados de forma compreensível e não apagam dados preenchidos.
- Tabelas extensas precisam de cabeçalhos, associação semântica e alternativa de leitura compacta em telas pequenas.
- O foco retorna a uma origem previsível após modal, drawer, envio ou mudança de etapa.
- Animação é opcional, curta e desligável por `prefers-reduced-motion`; ela nunca comunica informação exclusiva.
- Conteúdo de fonte, conflito e bloqueio usa linguagem objetiva: o que se sabe, o que não se sabe e qual ação ainda é possível.

## Governança e adoção

1. P1-037 cria tokens e primitives em código, com inventário dos valores atuais e migração incremental.
2. Cada task de tela reutiliza o componente adequado; exceção visual é registrada neste arquivo antes de virar padrão.
3. O primeiro render de cada componente é comparado contra a intenção do Design System e contra os invariantes de domínio.
4. Uma mudança de contrato visual compartilhado exige atualização deste documento, evidência visual e teste proporcional.
5. Este arquivo não é prova de implementação: a task concluída e a evidência de runtime são a fonte de estado entregue.

## Componentes prioritários da refatoração

1. `TopNavigation` e `SessionMenu`;
2. `VehicleIdentityHero`;
3. `TechnicalFichaSummary`, `TechnicalFichaSection` e `TechnicalFieldRow`;
4. `QualityStatus` e `SourceEvidence`;
5. `CatalogFilters`, `FichaCatalogCard` e `GeneratedFichaRail`;
6. `FichaComparisonWorkspace` e `ComparisonFieldRow`;
7. `RegistrationStepper` e `ApprovalTimeline`;
8. estados `Loading`, `Empty`, `Partial`, `Conflict`, `Error` e `Unavailable`.

## Registro de decisões

| ID | Decisão | Motivação | Estado |
|---|---|---|---|
| DS-BS-001 | Veículo e ficha são o centro visual, não o formulário de geração | reforça a proposta de inteligência competitiva automotiva | Aprovada para arquitetura |
| DS-BS-002 | Navegação superior substitui a sidebar na refatoração | alinhamento com as referências e melhor hierarquia para o workspace | Aprovada para arquitetura; implementação por task |
| DS-BS-003 | Comparação usa colunas X e Y por versão imutável | permite decisão lado a lado sem esconder qualidade e proveniência | Aprovada para arquitetura |
| DS-BS-004 | Orientação é candidata a remoção | não há objetivo de produto comprovado; ajuda precisa ser contextual | Pendente de inventário de conteúdo |

## Verificação antes de implementar uma tela

- A jornada e o estado foram mapeados em `fluxograma-refatoracao-experiencia.md`?
- Há componente e token oficiais ou decisão de exceção rastreável?
- Fonte, completude, conflito, status e elegibilidade continuam visíveis?
- Desktop e mobile preservam ação, leitura e foco por teclado?
- A referência externa foi traduzida em princípio, sem cópia?
- A mudança recebeu Architecture Gate quando altera fluxo, contrato, dado, API ou comportamento?
