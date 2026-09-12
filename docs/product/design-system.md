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

Este é o documento de consulta obrigatória antes de criar ou alterar uma tela, layout, componente visual, estado, ícone, asset ou microinteração. O [Image System](image-system.md) é obrigatório quando a decisão envolve fotografia, ilustração, render, textura, avatar ou provider de imagem.

## Regra de adoção e fontes PEK

Antes de criar um padrão local, a task verifica este documento, a jornada, os contratos de domínio e o catálogo PEK. Ferramentas/referências do PEK são apoio, não dependências aprovadas.

| Fonte PEK | Papel permitido | Estado no BlindSpot |
|---|---|---|
| `Magic UI`, `Velora UI`, `Spell UI` | candidato para microinteração ou componente React específico | não adotado; exige intake, licença, versão, acessibilidade e decisão humana |
| `Skiper UI`, `Cult UI`, `Originkit` | candidato a avaliar | não adotar sem verificar conta, licença e compatibilidade |
| `Landingfolio`, `Awwwards`, `Inspora`, `Refero Styles`, `Cruip` | referência de princípio | extração de hierarquia, densidade e ritmo; nunca cópia de UI/asset/código |
| Pexels, Unsplash, Pixabay, Openverse | fontes candidatas de imagery | regidas pelo Image System; nenhuma API/provider integrada hoje |

O intake de dependência/componente externo precisa registrar finalidade, URL, versão/commit, licença, dependências, impacto, tráfego de dados, acessibilidade, alternativa local, rollback e decisão humana. Uma referência visual não satisfaz esse intake.

## Direção visual alvo

- **Veículo como objeto central:** a ficha começa por identidade, imagem ou representação permitida, contexto e métricas essenciais; o detalhe técnico vem por densidade progressiva.
- **Navegação superior de produto:** páginas principais ficam no topo e o contexto de sessão permanece explícito, sem transformar a interface em uma cópia de um dashboard de locação ou manutenção.
- **Superfícies claras e calmas:** fundo quente-neutro, cards com borda discreta, profundidade baixa e destaque de marca pontual. A interface não deve competir visualmente com a ficha.
- **Dados comparáveis e legíveis:** números, unidade, fonte, versão, status e conflito ficam alinhados e escaneáveis. A comparação coloca as duas fichas lado a lado e não escolhe vencedora automaticamente.
- **Ação por contexto:** pesquisar, comparar, exportar, reportar, gerir equipe e sair aparecem onde a decisão ocorre, com pré-requisitos e consequência explicados.
- **Mobile preserva a tarefa:** não é apenas uma redução do desktop; a navegação, o contexto do veículo e ações críticas precisam continuar acessíveis.

## Recalibração de identidade e acesso — 2026-09-11

> Esta decisão substitui, para as próximas telas e para a reabertura da P1-038, qualquer leitura anterior que associe a linguagem do BlindSpot a verde, serifas editoriais ou ao painel de acesso como peça publicitária. Ela não altera retroativamente o runtime; torna a direção anterior um estado a migrar.

### Identidade que deve aparecer no produto

O BlindSpot é uma ferramenta contemporânea de inteligência automotiva. Sua âncora visual é **preto, branco e laranja**: preto/grafite para contraste e dados críticos, branco ou superfícies neutras para leitura e laranja para marca, ação, progresso de tarefa e foco. Verde continua reservado a significado semântico positivo — por exemplo, um dado confirmado — e não pode substituir a cor de marca em CTAs, stepper, foco ou elementos de navegação.

O produto deve ser técnico e moderno, não vintage, editorial ou “premium clássico”. A interface usa tipografia sans-serif contemporânea, hierarquia direta e densidade controlada. Serifas só podem entrar em uma peça de campanha ou introdução explicitamente aprovada; não entram em login, cadastro, ficha, comparação, tabela, estado operacional ou painel administrativo.

| Papel | Direção aprovada | Limite |
| --- | --- | --- |
| `brand.primary` / ação principal | laranja BlindSpot, com texto preto ou branco validado em contraste | não usar verde, azul ou gradiente como substituto de marca |
| `surface.canvas` | preto/grafite profundo ou neutro muito claro conforme a jornada | o contraste do conteúdo não pode depender de transparência |
| `surface.content` | branco, grafite ou vidro translúcido com fallback opaco | nunca reduzir legibilidade para parecer “glass” |
| `text.interface` | sans-serif moderna (`Manrope`/fallback já definido) | sem títulos serifados em fluxo operacional |
| `status.confirmed` | verde semântico, com texto e ícone/rótulo | não representa marca, etapa ativa ou CTA |

### Material contemporâneo: Liquid Glass como princípio, não cópia

O estudo de Liquid Glass confirma que o valor aproveitável é hierarquia por material, adaptabilidade e uso comedido de cor em controles — não reproduzir a estética Apple nem depender de blur para a tarefa. A aplicação web pode usar uma camada de **vidro operacional**: superfícies translúcidas controladas em navegação, painel flutuante, chip, modal ou overlay sobre uma imagem rica; campos de texto, tabelas, revisão de cadastro, alertas e evidência técnica permanecem superfícies estáveis e contrastadas.

Toda aplicação desse material declara: fundo que aparece sob o vidro, fallback opaco, contraste, estado sem blur, custo de renderização, comportamento em `prefers-reduced-transparency` quando disponível e alternativa em mobile. O vidro não pode esconder `fonte_ref`, status, erro, senha ou CTA. A referência conceitual é a orientação oficial de [Liquid Glass da Apple](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass), que recomenda preservar foco no conteúdo e usar cor de modo criterioso; não há adoção de assets, SDK ou código Apple.

### Arquitetura de acesso: introdução não é formulário

Há três responsabilidades que não devem competir na mesma tela:

1. **Tela de entrada/boas-vindas (opcional):** apresenta slogan, benefício e convite para entrar ou criar conta. É o único local para narrativa de marca ampla.
2. **Login e cadastro:** resolvem uma tarefa segura. Em desktop, uma imagem ou placeholder ocupa aproximadamente 60% à esquerda e o painel de tarefa 40% à direita; o painel é claro, moderno e sem slogan publicitário. Em tablet/mobile, a imagem vira faixa/crop curto ou desaparece de modo declarado, sem reduzir o formulário.
3. **Espera de aprovação:** comunica somente fatos confirmados, próxima ação real e suporte. Não reintroduz propaganda nem simula análise.

O painel direito de acesso tem título de tarefa, instrução curta, campos, feedback e CTA. A imagem esquerda precisa de `Image Intent`, crop e fallback definidos no Image System; antes do asset aprovado, ela é um placeholder de composição declarado, não uma imagem improvisada. A troca entre login e cadastro é sempre possível por ação secundária clara.

### Formulários, progresso e movimento vivo

“Uma decisão por etapa” não significa “um campo por etapa”. Campos que a pessoa precisa conferir conjuntamente ficam juntos: **senha e confirmação de senha são uma mesma tela**, junto do aviso de privacidade quando o espaço e a leitura permanecerem claros. Empresa, identificação e contato podem continuar em etapas curtas quando isso reduz erro cognitivo.

O BlindSpot deve parecer vivo por resposta, não por distração. O sistema prevê três camadas:

- **interação:** hover, foco, pressionamento e validação respondem imediatamente;
- **transição contextual:** ao avançar/voltar, painel de formulário, indicador de etapa e conteúdo trocam com movimento curto e coordenado;
- **ambiente opcional:** apenas em entrada/boas-vindas ou sobre uma imagem, uma variação visual muito sutil pode existir se declarada na arquitetura, não competir com texto e parar em `prefers-reduced-motion`.

Nenhuma animação pode fingir progresso de servidor, aprovação, pesquisa ou confiabilidade técnica. A tela em repouso deve continuar integralmente compreensível, com movimento reduzido e sem qualquer loop obrigatório para uso.

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

### Inventário de implementação — P1-037

| Camada | Estado | Fonte executável |
|---|---|---|
| Tokens semânticos | Implementada | `apps/web/src/design-system.css`: cor, tipografia, espaço, raio, borda, elevação, z-index, movimento e breakpoints documentados |
| Aliases da interface atual | Migrados | `apps/web/src/styles.css`: `--bg-*`, `--text-*`, `--border-*` e `--accent-*` agora apontam para tokens semânticos, sem reescrever telas |
| Primitives React | Implementadas | `apps/web/src/ui/primitives.tsx`: botão, card, campo, status e estados loading/empty/error |
| Foco e movimento reduzido | Implementados | `design-system.css`: `:focus-visible` e `prefers-reduced-motion` globais |
| Migração de tela | Pendente | P1-038 a P1-042 devem consumir primitives sem alterar contratos de domínio |

Valores literais ainda encontrados em regras de componentes legados de `styles.css` são inventário de transição, não autorização para novos valores arbitrários. Eles serão substituídos pela primitive/token correspondente quando a tela dona for migrada; P1-037 não muda seu layout ou comportamento visual deliberadamente.

## Fundamentos de design

### Linguagem e composição alvo

O BlindSpot deve parecer uma ferramenta de inteligência automotiva séria, calma e contemporânea — não um portal de locação, painel de telemetria ou vitrine de venda. A identidade é construída por superfície, informação e ritmo de leitura:

- **Canvas:** marfim/areia muito claro em telas futuras; superfícies próximas, não branco puro contra cinza frio.
- **Contraste:** texto grafite profundo; metadados em cinza azulado discreto; bordas quentes e sutis.
- **Marca:** laranja-terra usado para ação primária, foco de fluxo e detalhes de marca; nunca como preenchimento dominante da página.
- **Profundidade:** borda e variação de superfície primeiro; sombra curta e difusa apenas para overlay, menu, diálogo ou card que realmente se eleva.
- **Densidade:** uma área principal por viewport; informação de qualidade compacta, detalhe sob demanda e whitespace com função.
- **Hierarquia:** identidade do veículo > estado/qualidade > decisão primária > resumo > detalhe técnico > metadados.

Esses são tokens-alvo de intenção, ainda não uma alteração global das telas existentes. A camada implementada preserva o tema atual como compatibilidade até uma task de shell/tela migrar visualmente a experiência.

| Grupo alvo | Papel visual | Direção de valor para futura adoção |
|---|---|---|
| `color.background.canvas` | área externa | marfim/areia claro, sem gradiente dramático |
| `color.surface.default` | conteúdo principal | branco quente, contraste sutil com canvas |
| `color.surface.raised` | painel auxiliar/menu | um degrau acima da superfície, sem brilho |
| `color.text.primary` | leitura crítica | grafite profundo, contraste AA/AAA conforme tamanho |
| `color.action.primary` | ação principal | laranja-terra controlado, com texto legível |
| `color.status.*` | qualidade de evidência | semântica estável, texto/ícone obrigatório e nunca usada como marca |

#### Referência de tokens-alvo

Estes valores definem a direção visual a ser adotada pelas próximas telas após validação de contraste no render. Eles não substituem imediatamente os valores de compatibilidade do runtime atual.

| Token alvo | Valor de referência | Uso |
|---|---:|---|
| `color.background.canvas` | `#F5F0E7` | plano de fundo principal quente-neutro |
| `color.background.subtle` | `#FAF7F1` | áreas de respiro e agrupamentos leves |
| `color.surface.default` | `#FFFDF9` | superfícies de leitura e formulário |
| `color.surface.raised` | `#FFFFFF` | menu, diálogo e card que exige elevação |
| `color.text.primary` | `#1F2630` | títulos, dados e ação crítica |
| `color.text.secondary` | `#526171` | descrição, campo auxiliar e label secundário |
| `color.text.muted` | `#738093` | metadado não decisório |
| `color.border.subtle` | `#E7DED2` | separação de superfícies |
| `color.border.strong` | `#CEC1B1` | seleção, agrupamento ou divisão relevante |
| `color.action.primary` | `#CC5A2A` | CTA principal e marca pontual |
| `color.action.primary-hover` | `#A9451D` | hover/active de CTA |
| `color.action.primary-soft` | `#FCE7DC` | seleção/realce não crítico |
| `color.focus.ring` | `#B84D22` | foco visível em fundo claro |
| `color.status.confirmed` | `#236B4E` | dado confirmado, sempre com rótulo |
| `color.status.partial` | `#9A5C17` | dado parcial/ressalva, sempre com rótulo |
| `color.status.conflict` | `#A43836` | conflito/bloqueio, sempre com rótulo |
| `color.status.not-found` | `#5B6673` | ausência de dado, sempre com rótulo |
| `color.status.not-applicable` | `#4D5393` | inaplicabilidade, sempre com rótulo |
| `color.status.inferred` | `#6A4AA1` | inferência mínima, sempre com rótulo |

**Tipografia-alvo:** `Manrope` para interface, dados e formulários; `Raleway` permanece restrita ao wordmark até a task de identidade decidir sua continuidade. Se `Manrope` for adotada no runtime, ela deve ser hospedada ou carregada segundo decisão de dependência/performance, com fallback `Inter, "Segoe UI", sans-serif` e sem bloquear renderização.

**Escala-alvo:** texto `12/14/16/20/24/32/40/56px`; espaço `4/8/12/16/20/24/32/40/48/64px`; radius `8/12/16/24px`; área de toque mínima `42px`; sombra somente em `raised`, `overlay` e `modal`. A tarefa que migrar os tokens para estes valores mede contraste e revisa os três viewports antes de promovê-los ao runtime.

### Grid, largura e densidade

| Contexto | Grid/limite | Regra de densidade |
|---|---|---|
| Workspace desktop | 12 colunas, conteúdo de leitura com máximo de 1280px | hero/contexto ocupa 4–6 colunas; detalhe ocupa o restante |
| Catálogo desktop | filtro 3 colunas, resultados 6, rail 3 quando houver contexto | rail desaparece/empilha antes de comprimir resultado abaixo de leitura útil |
| Comparação desktop | duas colunas equivalentes com atributo âncora | não usar coluna lateral persistente competindo com X/Y |
| Tablet | 8 colunas | filtros/rails viram drawer ou faixa horizontal, não terceira coluna estreita |
| Mobile | 4 colunas e margens mínimas de 16px | preservar ação e identidade; conteúdo secundário vira seção/drawer, não miniaturização |

Nenhuma tela nova deve abrir com três painéis estreitos e uma área vazia. O container só existe se carregar uma responsabilidade de leitura, ação ou contexto.

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

### Contrato de cada componente

Todo componente novo ou alterado declara no mínimo: objetivo, pessoa/fluxo, conteúdo obrigatório, variantes, estados, ação primária/secundária, responsividade, semântica/teclado, tokens consumidos, dados de domínio visíveis, evidência visual e owner da task. Componente sem esse contrato é local e não pode ser promovido à biblioteca.

| Primitive implementada | Uso permitido agora | Fora do escopo |
|---|---|---|
| `UiButton` | ação primária/secundária/perigosa, loading e disabled | decidir autorização ou esconder pré-requisito de servidor |
| `UiCard` | superfície agrupadora com elevação explícita | criar card apenas para preencher espaço |
| `UiField` | label, hint/erro e associação acessível do controle | validar ou persistir dado de negócio |
| `UiStatus` | texto + cor para estado de qualidade | converter estado técnico em decoração ou única fonte de verdade |
| `UiLoadingState`, `UiEmptyState`, `UiErrorState` | mensagens e próxima ação por estado | mascarar indisponibilidade, conflito ou ausência |

### Ícones e assets

- Ícone vem acompanhado de texto quando for ação primária; ícone isolado tem nome acessível e tooltip complementar.
- Ícones de navegação usam traço/volume coerentes, 20–24px e área de toque mínima de 42px.
- Não introduzir biblioteca de ícones ou componente externo sem intake PEK e task aprovada.
- Fotografia, render e ilustração seguem o [Image System](image-system.md); screenshots são evidência, não arte de produto.

## Regras de acessibilidade e conteúdo

- Todo controle tem nome acessível; ícone isolado não é ação sem rótulo alternativo.
- Cor, posição ou hover não são o único canal para status, qualidade ou permissão.
- Erros de formulário ficam associados ao campo, anunciados de forma compreensível e não apagam dados preenchidos.
- Tabelas extensas precisam de cabeçalhos, associação semântica e alternativa de leitura compacta em telas pequenas.
- O foco retorna a uma origem previsível após modal, drawer, envio ou mudança de etapa.
- Animação é opcional, curta e desligável por `prefers-reduced-motion`; ela nunca comunica informação exclusiva.
- Conteúdo de fonte, conflito e bloqueio usa linguagem objetiva: o que se sabe, o que não se sabe e qual ação ainda é possível.

## Governança e adoção

Uma task que altera materialmente uma tela consulta este Design System e aplica o contrato de arquitetura visual por tela do PEK pelo adapter local antes de código. A especificação descreve a composição e a experiência da tela; tokens e primitives isolados não provam que ela segue este sistema.

1. P1-037 cria tokens e primitives em código, com inventário dos valores atuais e migração incremental.
2. Cada task de tela reutiliza o componente adequado; exceção visual é registrada neste arquivo antes de virar padrão.
3. O primeiro render de cada componente é comparado contra a intenção do Design System e contra os invariantes de domínio.
4. Uma mudança de contrato visual compartilhado exige atualização deste documento, evidência visual e teste proporcional.
5. Este arquivo não é prova de implementação: a task concluída e a evidência de runtime são a fonte de estado entregue.

### Checkpoints obrigatórios por tela

| Momento | Evidência mínima |
|---|---|
| Antes de desenhar | jornada, decisão UX, estados, componentes/tokens e necessidade de imagem |
| Antes de implementar | Architecture Gate aplicável, contrato de domínio preservado e intake de dependência/asset quando houver |
| Durante implementação | render por viewport, teclado/foco, estado vazio/erro/loading e revisão de densidade |
| Antes de concluir | antes/depois no mesmo fluxo, build/typecheck e achados remanescentes registrados |

## Changelog de governança

| Data | Alteração | Estado |
|---|---|---|
| 2026-09-11 | P1-037 implementou tokens semânticos e primitives sem migrar telas | Implementado |
| 2026-09-11 | Design System passou a ser a especificação central de linguagem, componentes, grid, adoção PEK e checkpoints | Aprovado para documentação |
| 2026-09-11 | Image System complementar formalizado | Aprovado para documentação |

## Padrão de qualidade pós-render: densidade, feedback e estados de marco

Captura visual não valida apenas que elementos “cabem” no viewport. Depois de cada render, a revisão deve responder se a superfície dedicada está usando sua área para a tarefa e se o estado de maior importância ganhou uma composição própria. Espaço vazio só é positivo quando sustenta imagem, foco, navegação ou ritmo explicitamente definido; não é uma aprovação automática de minimalismo.

### Contrato de feedback de ação

`Toast` é um componente transversal de retorno de uma ação que terminou e não pertence exclusivamente a um campo: sucesso de envio, falha de rede/envio, salvamento e alteração de estado confirmada. Ele deve ter título, mensagem curta, tom semântico, região `aria-live` apropriada, duração que permita leitura e opção de dispensar quando persistente. Verde comunica sucesso de operação; vermelho comunica falha de operação. Toast não substitui erro de validação associado ao campo, explicação de bloqueio ou estado persistente de página; esses continuam próximos ao objeto afetado.

### Estados que exigem composição dedicada

| Estado | Regra de composição | Reprova quando |
| --- | --- | --- |
| revisão antes de envio | resumo com identidade dos grupos preenchidos, valores legíveis, ação de editar por grupo quando aplicável e consequência explícita do envio | vira apenas um card pálido com labels/valores de baixo contraste |
| espera/timeline | o estado atual é o objeto principal, com escala, sequência, conectores, texto e ação próximos | a timeline parece uma lista auxiliar abaixo de um título dominante ou não sustenta o olhar no estado atual |
| erro de envio | alerta próximo à ação + toast de falha; os valores locais permanecem disponíveis | o retorno se perde em cor clara, só em toast ou apaga a tentativa da pessoa |
| sucesso de envio | confirmação persistente da tela + toast de sucesso; próximo passo factual | confunde sucesso do envio com aprovação/acesso ou se reduz a uma notificação efêmera |

### Regra de gravidade visual e densidade

Em cada viewport, identificar `objeto primário`, `estado primário`, `ação primária` e `região de apoio`. A soma visual (área, contraste, tamanho de texto, proximidade e movimento) deve favorecer o objeto/estado primário. Um painel com 40% da tela que contém somente dois inputs pode aumentar tamanhos, ritmo vertical, material ou contexto operacional, mas não deve receber conteúdo inventado para “preencher”.

Um label de progresso composto usa unidade tipográfica: `Empresa · etapa 1 de 4`, sem espaçamento artificial entre letras/palavras além do token normal de label. Tracking amplo é reservado a eyebrow curto em caixa alta, nunca a informação que a pessoa precisa ler rapidamente.

### Marca no campo visual

Quando uma mídia decorativa tiver uma forma central dominante (por exemplo, orbe/placeholder), a marca pode ocupar seu centro se houver contraste e finalidade de reconhecimento. Não duplicar a mesma marca em canto e centro. Logo, título e subtítulo formam uma unidade com escala definida; a etapa/progresso pertence ao painel de tarefa quando orienta o preenchimento.

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
