# 🚧 Em execução — consolidar fundação visual e refatoração sistêmica do BlindSpot

> Prioridade: P1
>
> Área afetada: Design System em runtime, shell autenticado, composição de páginas, navegação, responsividade, acessibilidade, estados de UI e documentação UX/UI
>
> Origem ou referência: `C:\Users\lucas\Downloads\visual-refactor\FUTURE-DESIGN.jpeg`; `BLINDSPOT_VISUAL_NORTH_STAR.md`; `NEW_FICHA_SCREEN_REFACTOR_SPEC.md`; `docs/product/blindspot-visual-north-star.md`; `docs/product/design-system.md`; `docs/product/image-system.md`; `docs/design-system/motion.md`; P1-037 a P1-042; feedback humano de 2026-09-12
>
> Arquitetura: `APPROVED — Lucas autorizou as Fases 0 e 1 em 2026-09-12; JSX/CSS produtivo continua fora deste corte`
>
> Triagem automática: `Material — muda linguagem visual global, primitives, shell e composição de áreas autenticadas; não deve alterar contratos de domínio por padrão`
>
> Segurança: `Aplicável por partes — a fundação visual não altera autorização; qualquer integração com sessão, logout, papel, destino administrativo ou API exige revisão proporcional no corte correspondente`

## Pedido

Transformar a direção visual do BlindSpot em uma fundação executável e verificável, capaz de produzir telas no nível de composição, material, densidade e refinamento da referência `FUTURE-DESIGN.jpeg`, sem copiar sua marca, conteúdo, asset, funcionalidades de manutenção, telemetria, mapa, localização, datas, métricas ou código.

O resultado não é uma troca de tema, uma coleção de cards claros nem uma única tela isolada. O resultado é uma pequena plataforma visual para o produto autenticado: shell, tokens, tipografia, ícones, padrões de layout, padrões de dados, estados, responsividade e gates de aceitação capazes de sustentar Nova Ficha, workspace técnico, catálogo, comparação, histórico, equipe e consumo.

## Problema confirmado

O BlindSpot acumulou direção visual correta em documentação, primitives semânticas e telas funcionais, mas ainda não possui uma fundação de composição unificada no runtime. A tentativa inicial de reestilizar a P1-040 falhou porque tratou a ficha como um workspace claro isolado dentro de um shell escuro legado. Ela inseriu componentes individuais sem alterar o canvas, a grade, o material, a tipografia, a topologia das regiões ou a linguagem visual do aplicativo inteiro. O feedback humano reprovou essa composição e a implementação foi revertida.

As evidências confirmam que a referência de qualidade não é sobre “cards bonitos”. Ela combina:

- frame claro e quente que envolve a aplicação inteira;
- hierarquia de módulos assimétrica, com proximidade e gaps reduzidos;
- veículo como objeto visual central;
- superfícies quase brancas, bordas discretas, pouca sombra e raio hierárquico;
- header leve com destinos compactos e utilidades separadas;
- métricas, listas e painéis que têm responsabilidades distintas;
- densidade eficiente dentro de uma página arejada;
- acabamento tipográfico, icônico e de estados que parece intencional em todos os detalhes.

O BlindSpot precisa extrair esses princípios e traduzi-los exclusivamente para fatos de seu domínio: configuração exata, versão, mercado, `fonte_ref`, estado por variável, completude, conflitos, elegibilidade de ação, histórico, pesquisa e permissões reais.

## Resultado de produto esperado

Após os cortes de implementação aprovados desta task, uma pessoa autenticada deve perceber em poucos segundos:

1. que está em uma plataforma de inteligência automotiva contemporânea, e não em ERP, portal de concessionária, dashboard de telemetria ou planilha;
2. onde está, para onde pode ir e qual é sua sessão ativa, sem o shell competir com a tarefa;
3. qual veículo/configuração está em contexto antes de ler campos extensos;
4. qual resumo, qualidade, conflito e próximo passo são factuais;
5. como aprofundar detalhe e evidência sem perder contexto;
6. que a mesma linguagem visual se mantém entre Nova Ficha, ficha, catálogo, comparação e áreas administrativas, mesmo com grades próprias.

## Critérios de aceite — fundação visual

### Direção, precedência e documentação

- [ ] `docs/product/blindspot-visual-north-star.md`, Design System, Image System e Motion System são lidos e aplicados antes de cada corte visual; uma task não usa tokens isolados como justificativa de composição.
- [ ] Há uma matriz versionada “princípio de referência → tradução BlindSpot → dado/estado real → anti-cópia”, cobrindo cada módulo adotado.
- [ ] A direção de tema é inequívoca: jornada de acesso pode continuar no canvas próprio aprovado; aplicação autenticada recebe um frame claro, quente e coerente, sem um workspace claro perdido dentro de shell dark legado.
- [ ] O Design System distingue direção proposta, token implementado, primitive implementada, padrão de layout implementado e tela migrada. Nenhum documento afirma runtime concluído antes de render verificável.
- [ ] O rollback da primeira tentativa da P1-040 é registrado como aprendizado: documentos sem wireframe/render aprovado não autorizam composição de alto impacto.

### Fundamentos de runtime

- [ ] Fonte de interface aprovada é carregada ou hospedada com fallback definido, sem bloquear renderização; escala tipográfica, line-height, pesos, tracking e números tabulares são observáveis no runtime.
- [ ] Uma única família de ícones outline é usada no shell e nos componentes novos; ícones não são emoji, texto decorativo ou mistura de famílias. Todo ícone acionável tem nome acessível e alvo mínimo de 42 px.
- [ ] Tokens semânticos reais cobrem canvas autenticado claro, superfícies, texto, borda, ação, foco, elevação, raio, grid, spacing, z-index, movimento e breakpoints. Valores recorrentes não são introduzidos arbitrariamente em telas.
- [ ] O produto possui styles de acabamento compartilhados: foco, seleção de texto, scrollbar quando customizada, underline de links, caret, números tabulares, estados disabled/loading e `prefers-reduced-motion`.
- [ ] CSS legado tem inventário e rota de substituição por owner. Nenhuma regra nova depende de ordem acidental ou sobrescreve tela alheia de modo global.

### App frame e navegação

- [ ] A aplicação autenticada possui `AppFrame`/shell claro de viewport inteiro, com canvas quente, contenção visual, raio proporcional ao viewport e borda/moldura de marca discreta; o frame não reduz área útil de forma indevida nem cria rolagem horizontal.
- [ ] Header é integrado ao frame, leve e silencioso: marca, destinos de produto, utilidades e sessão formam regiões distintas. Não existe barra escura pesada acima de uma área clara sem intenção aprovada.
- [ ] Desktop pode apresentar destinos por ícones no estado compacto, mas cada destino tem `aria-label`, tooltip em hover/foco, estado ativo além de cor e alvo mínimo. Um gatilho de seta revela, sem layout shift, todos os nomes, grupos e destino ativo em painel ancorado.
- [ ] O painel de destinos fecha por seleção, clique externo quando aplicável e `Escape`, devolve foco ao gatilho e não bloqueia acesso à sessão/logout. Em mobile, o menu apresenta rótulos explícitos e mantém item ativo, destinos por papel e saída acessíveis.
- [ ] Visibilidade de Equipe, Consumo e Comparar preserva o papel real. A navegação nunca vira mecanismo de autorização e não expõe cookie, token, e-mail desnecessário ou dado organizacional novo.

### Sistema de composição e dados

- [ ] Layout primitives existem com responsabilidades claras: `AppFrame`, `PageHeader`, `ModuleGrid`, `VehicleStage`, `MetricTile`, `PriorityList`, `DataPanel`, `ContextTabs`, `SourceEvidence` e estados de operação. Não são uma coleção de wrappers equivalentes a `Card`.
- [ ] A grade desktop trabalha com 12 colunas, tablet com 8 e mobile com 4; módulos têm tamanhos proporcionais à informação. Gaps aproximam módulos que fazem parte de uma mesma decisão e espaço livre tem função declarada.
- [ ] `VehicleStage` torna o veículo/configuração protagonista quando uma ficha está em contexto. A identidade textual exata é canônica; imagem exata exige asset verificável. Sem asset aprovado, o fallback é local, abstrato, não-identitário e não reintroduz provider, curadoria, stock, IA, hotlinking ou falsa representação.
- [ ] Métricas seguem uma matriz de verdade: completude usa apenas valores/razão calculáveis; fontes contam fontes devolvidas; conflitos usam estado real; campos ausentes não são erro automaticamente; pesquisa, versões e recomendações só aparecem se o contrato atual as fornecer.
- [ ] `PriorityList` traduz somente prioridades reais: conflito, campo sem fonte, dado parcial, sessão/pesquisa autorizada, versão recente ou próxima ação factual. Não inventar reminders, manutenção, velocidade, custo, bateria, localização, mapa, previsão ou calendário.
- [ ] Ficha detalhada preserva `veículo → resumo → qualidade/decisão → detalhe → evidência`. Tabs mantêm contexto persistente e usam semântica acessível; atributos continuam com nome, valor, unidade, status textual/ícone e fonte/observação próximos.
- [ ] Catálogo usa grade/lista de reconhecimento de fichas reais; comparação mantém simetria X/Y e nunca cria vencedor visual; equipe e consumo usam composição administrativa própria sem herdar hero de veículo sem contexto.

### Estados, movimento e acessibilidade

- [ ] Loading, vazio, parcial, conflito, bloqueado, indisponível, erro e sucesso possuem composição específica e próxima ação verdadeira. Toast continua overlay fixo, complementar e sem deslocar CTA/estrutura.
- [ ] Estado de maior gravidade recebe contraste, escala e posição proporcionais; revisão, espera, confirmação e conflito não viram card auxiliar pálido dentro de tela vazia.
- [ ] Movimento tem evento real, estado estático e reduced-motion documentados. Pode acompanhar entrada de região já carregada, mudança de tab e abertura de menu; não pode atrasar conteúdo, fingir pesquisa/aprovação/confiança, gerar contagem de cassino ou criar loops decorativos concorrentes.
- [ ] Navegação por teclado, foco, leitura por leitor de tela, contraste, alvos de toque, labels, `tablist`, disclosure, menu, sessão e status são testados em todos os módulos novos. Cor/tooltip não são o único canal para informação decisória.

### Aceite visual e qualidade de execução

- [ ] Antes de integrar qualquer screen refactor, existe protótipo/wireframe renderizado de tela inteira com dados sanitizados e aprovação humana de canvas, frame, grade, proporção, vazios, regiões e hierarquia.
- [ ] Primeiro render estrutural é comparado lado a lado com a referência e com a arquitetura em 1440, 1024, 768 e 390 px; uma reprovação retorna à arquitetura, não é tratada como polimento de margem.
- [ ] Capturas verificam desktop, tablet/mobile, estado de maior densidade, keyboard/focus e reduced motion. Build e typecheck são necessários, mas não são aceitação visual.
- [ ] Typecheck, build e `git diff --check` passam em cada corte. Não há regressão de payload, schema, API, fonte, status, conflito, histórico, elegibilidade, RBAC ou logout.

### Conteúdo, performance, compatibilidade e governança de rollout

- [ ] Existe uma linguagem de conteúdo operacional: títulos descrevem objeto/tarefa, ações nomeiam consequência real, textos auxiliares explicam limite/próximo passo e status não depende de jargão decorativo. A referência não autoriza “Welcome”, slogans ou dados celebratórios em jornadas operacionais sem objetivo confirmado.
- [ ] Cada primitive registra contrato de responsabilidade, estados, conteúdo permitido, semântica, breakpoints, tokens consumidos, estados proibidos e exemplo sanitizado. Um componente não recebe nova responsabilidade apenas por ser visualmente parecido.
- [ ] Há orçamento de performance visual: sem vídeo, canvas pesado, mapa, imagem remota, blur grande, animação contínua ou biblioteca de ícones/efeitos nova sem decisão própria. Transições usam propriedades baratas e têm alternativa reduzida; mobile não depende de backdrop-filter para legibilidade.
- [ ] Compatibilidade mínima é declarada antes de CSS avançado: suporte/fallback para `color-mix`, `backdrop-filter`, `env(safe-area-inset-*)`, rolagem horizontal de tabs, fontes e `prefers-reduced-motion`. Uma melhora visual não pode tornar tarefa/foco ilegível no fallback.
- [ ] Cada corte possui baseline anterior e captura posterior sanitizada. Rollback visual é reversível por módulo/consumer, sem apagar documentação, contratos ou evidência e sem usar reset destrutivo do repositório.
- [ ] P1-038 a P1-042, P2-004 e P2-006 são reconciliadas após a fundação: cada task declara se consome, é substituída, é reescrita ou permanece independente. Nenhuma task antiga continua autorizando uma direção visual contraditória apenas porque foi escrita antes desta fundação.
- [ ] A rollout não usa feature flag, analytics, A/B test, preferência persistente ou telemetria apenas para testar estética. Se o produto precisar de qualquer um desses mecanismos no futuro, eles entram em task separada com contrato, segurança, conformidade e aprovação humana.

## Escopo por fases

### Fase 0 — congelar o alvo e a governança

1. Reunir as evidências de `visual-refactor`, imagens atuais, fluxos e feedback humano em índice rastreável; não duplicar assets de terceiros sem licença/necessidade.
2. Consolidar a matriz de tradução da referência. Cada padrão registra: responsabilidade visual, dado BlindSpot que o justifica, estados, componente candidato, princípio de acessibilidade, motion permitido, anti-exemplo e tela consumidora.
3. Declarar o recorte de tema: acesso continua seguindo sua direção aprovada; shell autenticado é a primeira migração da linguagem warm-light.
4. Determinar ownership de `App.tsx`, `styles.css`, `design-system.css`, primitives e workspaces. P1-039, P1-040, P1-041 e P1-042 já possuem mudanças/planejamento: não sobrescrever, mesclar ou “corrigir” seus arquivos sem handoff explícito.

### Fase 1 — protótipo de composição antes do runtime

1. Produzir wireframe/protótipo visual estático da Nova Ficha em estado sem ficha, carregado, ficha parcial e ficha com conflito, usando somente dados sanitizados/placeholder abstrato.
2. Produzir frame de aplicação autenticada com header, rail de destinos compacto, painel de rótulos, utilidades e menu de sessão.
3. Produzir variações 1440/1024/768/390. Validar: frame, densidade, proporcionalidade, composer, VehicleStage, métricas, lista de prioridades, tabs e resumo.
4. Realizar aprovação humana explícita de composição antes de JSX/CSS. Uma imagem de referência externa não substitui esse aceite.

### Fase 2 — fundação executável sem migração de comportamento

1. Adicionar/ajustar tokens reais e documentados, com fallback e contraste mensuráveis.
2. Estabelecer fonte e ícones sem introduzir CDN, SDK, provider, conta ou dependência externa não aprovada. Se uma dependência for considerada, executar intake PEK e security/dependency review antes.
3. Criar layout primitives isoladas, sem `fetch`, storage, RBAC, cálculo de qualidade, side effect ou conteúdo factual fabricado.
4. Criar story/fixture sanitizado para render de cada primitive e seus estados.
5. Desativar/remover CSS legado apenas quando o consumidor correspondente estiver migrado e visualmente aceito; nunca por limpeza global cega.

### Fase 3 — shell autenticado e sessão

1. Migrar `AppFrame` e header em corte coordenado com P1-039.
2. Preservar rotas/views atuais, gates de papel, foco programático, tema, sessão e logout confirmados pelo servidor.
3. Implementar icon rail/painel de rótulos somente após protótipo aprovado. Não comprimir destinos em mobile nem substituir rótulos acessíveis por ícones opacos.
4. Aplicar `project-security-assurance` e, se necessário, conformidade proporcional antes de tocar fluxo de sessão/logout, conteúdo de membro ou visibilidade por papel.

### Fase 4 — Nova Ficha e overview factual

1. Migrar composer para command surface compacta sem mudar payload, validação ou momento da requisição.
2. Criar overview de última ficha com VehicleStage, métricas verdadeiras e PriorityList factual. Sem ficha, mostrar estado de entrada útil; não preencher a página com hero falso.
3. Separar visualmente iniciar pesquisa de ler a ficha sem criar nova rota/estado de domínio não autorizado.
4. Executar checkpoint PEK antes de integrar o comportamento real.

### Fase 5 — workspace técnico e evidência

1. Reabrir P1-040 com uma arquitetura específica derivada do protótipo aprovado.
2. Migrar hero, resumo, grupos técnicos, fonte, conflito, tabs e estados preservando a resposta já autorizada.
3. Não reintroduzir curadoria de imagem. O veículo continua verdadeiro por identidade textual; placeholder só é usado segundo decisão de imagem aprovada.

### Fase 6 — catálogo, comparação e áreas administrativas

1. P1-041: traduzir catálogo em módulos de descoberta/reconhecimento de fichas, filtros e rail real apenas quando ele existir no fluxo; não transformar em vitrine de venda.
2. P1-042: compor comparação X/Y com simetria, atributos alinhados e qualidade ao lado de cada valor; não usar gradiente, tamanho ou posição para escolher vencedor.
3. P2-004: tratar equipe/consumo como operações de alta densidade e contexto, sem VehicleStage artificial; usar linhas/ações claras e estados de segurança.
4. Cada tela recebe seu próprio Architecture Gate visual, protótipo e checkpoint. A fundação não autoriza copiar um layout para todo o produto.

### Fase 7 — retirada de legado e aceite transversal

1. Mapear selectors/tokens legados que ainda vencem a nova camada, por tela e owner.
2. Retirar regras somente após captura e smoke da tela consumidora; não efetuar reformat/cleanup massivo como substituto de refactor.
3. Atualizar P2-006 com matriz final de viewport, foco, contraste, zoom, reduced-motion, loading/erro/vazio/parcial/conflito e origem factual.

### Fase 8 — reconciliação de backlog, baseline e operação contínua

1. Criar uma tabela de transição que relacione cada task UX/UI existente ao padrão novo: `consome fundação`, `reabre arquitetura`, `sem impacto`, `substituída` ou `bloqueada por decisão`.
2. Para cada tela migrada, manter baseline sanitizada do estado anterior, arquitetura aprovada, captura estrutural e captura final. A comparação visual aponta o que mudou e por que, não apenas se a tela “parece mais bonita”.
3. Documentar contratos de cada primitive/layout em `docs/product` ou no módulo correspondente: responsabilidade, dados necessários, estados, semântica, tokens, comportamento compacto, reduced motion e não-escopo.
4. Estabelecer uma revisão periódica apenas documental de drift: token novo sem documentação, CSS literal recorrente, componente com responsabilidade duplicada, task antiga contraditória ou referência externa usada sem tradução. Não instalar detector, serviço ou telemetria automaticamente.

## Arquitetura proposta e decisões

### Arquitetura de informação

O shell autenticado é uma moldura discreta. A página contém uma responsabilidade dominante. Para objetos automotivos: configuração exata → overview factual → detalhe/evidência. Para tarefas administrativas: pessoa/período → decisão operacional → detalhe correspondente. Navegação não compete com o objeto; ações ficam junto da decisão, com pré-requisito e consequência explícitos.

### Frame e material

O frame usa canvas marfim/areia, superfícies branco-quente, grafite para leitura e laranja pontual de marca/ação. A moldura coral da referência é traduzida como detalhe de identidade de baixa intensidade e jamais como painel colorido dominante. Borda, diferença de superfície e espaço fazem mais trabalho que sombras. Radius diferencia frame, módulo maior, módulo padrão, controle e pill; não é um número uniforme aplicado em tudo.

### Grade e densidade

Desktop: 12 colunas com máximo legível; uma tile de veículo pode ocupar 5–6 colunas e duas linhas lógicas. Tiles de métrica ocupam 2–3 colunas; lista de prioridade recebe largura para texto. Tablet: 8 colunas, módulos auxiliares descem sem tornar a tarefa estreita. Mobile: 4 colunas; objeto, ação e estado vêm antes, métricas usam 2×2 quando legíveis, tabs rolam horizontalmente com rótulos e detalhe vira blocos sem esconder evidência.

### Dados e verdade

Cada composição visual declara a fonte factual. Campos de ficha preservam `valor + unidade + status + fonte_ref + observação` próximos. Métricas mostram “não informado”/“indisponível” quando não calculáveis. Conflito não recebe vencedor visual. A imagem não substitui identidade técnica. Ação de comparar/exportar/reportar só aparece ou habilita conforme a regra existente; a UI não toma essa decisão.

### Imagem e placeholder

O corte atual é `NO_EXTERNAL_IMAGE`. Caso o wireframe necessite de massa visual, usar placeholder local abstrato como parte da composição, com fallback sem mídia e texto/semântica que não sugira representação exata. Um asset de veículo só pode entrar em task específica com Image Intent, identidade/proveniência/licença verificáveis, crops desktop/tablet/mobile e decisão humana. Não criar provider, baixar, hotlinkar, usar stock ou geração IA implicitamente.

### Movimento

Menu, tab e troca de região podem ter transição breve e reversível. O estado sem movimento é funcionalmente idêntico. Skeleton espelha a estrutura final; valores, contagens e indicadores não animam para aparentar progresso. Nenhum efeito ambiente/blur contínuo é adicionado sem uma decisão de composição/legibilidade e sua alternativa reduzida.

### Conteúdo e linguagem operacional

O BlindSpot usa linguagem factual, curta e brasileira. O título identifica objeto ou tarefa; supporting text explica limite, consequência ou próximo passo real; botão usa verbo e resultado; erro diz o que falhou e como recuperar; estados de qualidade usam termos consistentes (`Confirmado`, `Parcial`, `Conflito`, `Não encontrado`, `Não aplicável`, `Inferido`) sem eufemismo visual. Marketing, saudação ampla e personalidade editorial só entram em tela de entrada explicitamente aprovada, nunca para preencher módulos de uma tarefa autenticada.

### Performance e fallback técnico visual

O frame e módulos precisam manter legibilidade com CSS básico: superfície opaca antes de `backdrop-filter`, contraste antes de transparência e estrutura antes de animação. Proibir por padrão efeitos com canvas, vídeo, WebGL, mapas, imagem remota, fontes bloqueantes, sombra/blur de grande área e listeners globais de cursor. Novas bibliotecas, fonts, ícones, assets ou polyfills só entram após intake que registre versão, licença, bundle, fallback, dados de rede, acessibilidade, rollback e decisão humana.

## Segurança, conformidade e confiabilidade

### Segurança proporcional

- A fundação de tokens/layout não toca API, schema, persistência, segredo, provider, integração ou autorização: nesta subfase, `Não aplicável`, com justificativa registrada.
- Shell, sessão, logout, membro, papel, destinos admin, exportação, conteúdo de fonte e possíveis dependências externas acionam `project-security-assurance` no corte dono. A task não permite agrupar esses riscos em uma única implementação visual.
- Controles obrigatórios: não ler/exibir cookie/token; não criar `localStorage` de papel/menu; não registrar e-mail/payload em captura; não substituir RBAC por ocultação visual; não abrir link de fonte inseguro; não colocar estado interno de pesquisa em UI como fato.
- Checks: inspeção de diff, typecheck/build, smoke autenticado autorizado, verificação de `viewer/analyst/admin`, logout confirmado, teclado/foco e revisão de ausência de segredo/dado pessoal em evidências.

### Conformidade proporcional

Não há nova coleta, analytics, tracking, perfil, persistência ou transferência nesta fundação. Se uma fase introduzir telemetry, preference persistente, asset/provider, pessoa/membro adicional, nova exportação ou conteúdo externo, aplicar a revisão de conformidade própria antes de implementação. Evidência visual deve ser sanitizada: sem token, cookie, e-mail, organização real, logs ou snapshots brutos de LLM.

## Dependências, ownership e coordenação

- P1-037 fornece tokens/primitives existentes; esta task pode evoluí-los somente por corte aprovado e sem invalidar consumidores ativos.
- P1-038 mantém acesso/cadastro como jornada própria; não aplicar o shell autenticado ou tema de workspace nela automaticamente.
- P1-039 é dona do shell/navegação/sessão atual; qualquer mudança em `App.tsx`/`styles.css` requer handoff/diff planejado e revisão de segurança.
- P1-040 está reaberta visualmente; ela consome a fundação, não deve ser reimplementada antes do protótipo aprovado.
- P1-041/P1-042/P2-004 consomem padrões de grade e dados, mas possuem escopos funcionais próprios.
- Trabalho simultâneo somente com plano válido, owner explícito por arquivo, checkpoint de integração e autorização humana. Sem isso, execução é sequencial.

## Fora do escopo

- Alterar payload, schema, prompt, runtime de IA, fonte/política, normalização, persistência, API, endpoint, migrations ou provider.
- Criar telemetria, mapa, localização, manutenção, custo, bateria, preço, calendário, recommendation score, alerta ou dashboard fictício para imitar a referência.
- Reintroduzir curadoria, Unsplash, Pexels, banco de imagens, hotlinking, download, IA de imagem ou asset externo.
- Migrar todas as telas em um único commit, apagar CSS legado globalmente ou impor o mesmo layout a catálogo, ficha, comparação e administração.
- Declarar aceite visual por build/typecheck ou por screenshot sem estado/viewport/fluxo correspondente.

## Plano de verificação e evidência

1. Verificação estática: `npm run typecheck`, `npm run build`, `git diff --check`; checks de contrato existentes quando o corte toca view/ação correspondente.
2. Primeira renderização: capturas sanitizadas de 1440, 1024, 768 e 390 em estado de maior densidade e sem ficha; comparação lado a lado com wireframe e referência.
3. Acessibilidade: Tab/Shift+Tab, foco visível, `Escape`, leitor de tela para menu/tabs/status, zoom 200%, contraste e targets de toque.
4. Movimento: estado normal e `prefers-reduced-motion`; shell, foco, valores e CTA não deslocam ou desaparecem.
5. Integridade: payload da Nova Ficha, leitura de ficha, fonte/status/conflito, elegibilidade de comparação/exportação e logout permanecem comprovadamente iguais antes/depois.
6. Segurança: se um corte tocar sessão/papel, smoke autorizado com papéis disponíveis e ausência de token/cookie/dado sensível em UI/evidência.
7. Evidência: registrar caminhos, viewport, estado, dados sanitizados, achados, decisão e próximo passo. CUA indisponível (`os error 3`) é bloqueio de aceite visual, não desculpa para marcar concluída.
8. Baseline e compatibilidade: comparar o módulo antes/depois, validar fallback sem propriedades visuais avançadas quando aplicável e registrar navegador/dispositivo disponível; uma diferença de render não é “aceita” por não haver ambiente automatizado.

## Critérios de bloqueio e rollback

Bloquear/reabrir quando: não houver protótipo aprovado; não for possível definir dado real de uma tile; uma imagem sugerir identidade falsa; menus ocultarem rótulos/foco; CSS de outra task for sobrescrito sem handoff; viewport produzir áreas vazias sem função/labels truncadas; fonte/conflito sumir; alteração visual demandar contrato funcional novo; ou render humano reprovar composição/propósito.

Rollback é por corte: remover somente primitives/tokens/estilos ainda não consumidos ou restaurar o consumidor ao padrão anterior testado. Nunca usar `git reset --hard`, nunca apagar evidência/decisão histórica e nunca remover controles de sessão/RBAC como efeito colateral de uma mudança estética.

## Double-check da arquitetura

- A referência fornece material, proporção e ritmo; a task proíbe explicitamente copiar dados de manutenção, mapas, conteúdo, imagem ou marca.
- O problema anterior foi arquitetural, não falta de um card ou CSS específico. Por isso o primeiro entregável é protótipo de tela inteira e aprovação humana, não JSX.
- A prioridade vehicle-first continua verdadeira para ficha e contexto automotivo, mas não é aplicada a equipe, consumo ou outras áreas sem veículo.
- O placeholder local resolve massa/composição provisória sem tratar carro genérico como configuração exata e sem reabrir integração externa removida por decisão humana.
- Navegação por ícones só é aceita com descoberta reversível, labels acessíveis, painel de rótulos, foco e mobile textual; não é redução cega de informação.
- A fundação é deliberadamente incremental para respeitar arquivos compartilhados, tarefas ativas, contratos de domínio e feedback humano. Ela não promete migração total sem gates por tela.

## Architecture Gate

`APPROVED — Lucas autorizou em 2026-09-12 as Fases 0 e 1 (matriz de tradução e protótipo estático). Cada fase que tocar runtime, sessão/papel, componente compartilhado ou tela produtiva abre seu sub-gate, plano de integração e revisão proporcional antes do código.`

### Sub-gate — Fase 2

`APPROVED — Lucas autorizou a Fase 2 em 2026-09-13. O recorte adiciona tokens aliases e primitives isoladas com mapas semânticos warm-light e dark, preservando o seletor de tema já existente; não toca App.tsx, styles.css, sessão, tema persistido, API, dependência ou migração de tela.`

### Sub-gate — Fase 3

`APPROVED — arquitetura e revisão de segurança proporcional em docs/product/p1-055-fase-3-shell-autenticado-arquitetura.md; Lucas autorizou em 2026-09-13. Preservar sessão, RBAC, logout, tema e destinos; não alterar contratos nem API.`

### Reabertura — Nova Ficha após render

`READY — a captura 2026-09-13 reprovou duplicação de métricas, composer legado, grade uniforme e hierarquia vertical. Arquitetura corretiva em docs/product/p1-055-nova-ficha-rearquitetura-pos-render.md; não alterar JSX/CSS da Nova Ficha até aceite explícito.`

### Reabertura V4 — dashboard inicial e pesquisa sob demanda

`IMPLEMENTADO TECNICAMENTE — Lucas autorizou em 2026-09-13. O corte remove a moldura visual externa do AppFrame autenticado, traz a pesquisa para um diálogo nativo focado, mantém somente o overview inicial e abre o workspace técnico por ação explícita. Build/typecheck/diff estático foram aprovados; o checkpoint visual dark/light desktop/mobile ainda é obrigatório.`

### Reabertura V5 — densidade operacional e pesquisa reconhecível

`READY — a captura 2026-09-13 aprovou a remoção da moldura e da duplicação, mas reprovou a redução excessiva: pesquisa pouco evidente, ação de detalhe desconectada e vazio sem função. A arquitetura corretiva está em docs/product/p1-055-nova-ficha-v5-densidade-e-pesquisa.md. Aguardar aprovação explícita antes de alterar JSX/CSS.`

### Sub-gate V6 — dashboard operacional completo

`IMPLEMENTADO TECNICAMENTE — Lucas autorizou em 2026-09-13 a composição em docs/product/p1-055-nova-ficha-v6-dashboard-operacional.md. O corte reorganiza apenas dados já carregados e o diálogo existente; não altera API, schema, sessão, RBAC, exportação, persistência ou provider. Typecheck/build/diff passaram; aguarda checkpoint visual humano.`

### Aceite visual V6 e sub-gate V7

`V6 APROVADA NO DESKTOP — Lucas aprovou a captura 2026-09-13 como avanço visual. V7 está READY em docs/product/p1-055-shadcn-button-intake.md: corrigir nomenclatura/ícone de pesquisa, remover CTA duplicada e trocar pontos de atenção por histórico factual. O intake do shadcn/ui Button recomenda adaptação local sem dependência; instalação/CLI permanecem bloqueadas até decisão humana explícita.`

### Resultado V7

`IMPLEMENTADO TECNICAMENTE — Lucas aprovou a adaptação local inspirada no Button do shadcn/ui. A navegação usa lupa/nome acessível, a command surface concentra a única CTA de pesquisa e o histórico factual substitui pontos de atenção. Nenhuma dependência, CLI, Tailwind ou código externo foi instalado/incorporado. Typecheck, build e diff passaram; aguarda captura humana.`

### Sub-gate V8 — controles fundacionais locais

`IMPLEMENTADO TECNICAMENTE — Lucas autorizou em 2026-09-13 a arquitetura em docs/product/p1-055-controles-fundacionais-v1-arquitetura.md. UiButton recebeu variantes, tamanhos, ícones, loading e forwardRef sem romper o contrato legado tone; UiTextarea foi criado como controle nativo temático e acessível. A Nova Ficha passou a consumir UiButton em sua CTA, diálogo e retorno/detalhe. Não houve instalação de shadcn, CLI, Tailwind, dependência, nem mudança de API/schema/sessão/RBAC.`

### Reabertura V9 — histórico modular e página de ficha

`IMPLEMENTADO TECNICAMENTE — Lucas autorizou em 2026-09-13. O overview agora tem título orientado à pesquisa, divisor/label de última ficha e três fatos de histórico em módulos independentes. Abrir ficha completa deixa de ser subestado e passa a visão dedicada technical do App, que renderiza o TechnicalFichaWorkspace real com a ficha já carregada; retorno preserva contexto/foco e não gera nova ficha. Typecheck e diff passaram; build e checkpoint visual humano seguem obrigatórios.`

### Reabertura V10 — realocação factual na coluna de qualidade

`IMPLEMENTADO TECNICAMENTE — Lucas autorizou em 2026-09-13. Pesquisas, primeira pesquisa e última atualização foram movidos para a coluna de qualidade, abaixo de Conflitos, com módulos compactos. A coluna passa a atravessar as duas faixas de conteúdo, preservando a leitura técnica à esquerda e eliminando a faixa extra. Typecheck, build e diff passaram; aguarda captura humana.`

### Sub-gate V11 — Motion pass autenticado

`IMPLEMENTADO TECNICAMENTE — Lucas autorizou em 2026-09-13. O shell agora tem entrada neutra de contexto; request → ficha completa usa forward e retorno usa backward; abas técnicas, diálogo e overview confirmado recebem entradas curtas. Reduced motion desliga todas as animações novas. Não há dependência, loop decorativo, dados animados, falso progresso, API ou mudança de autorização. Typecheck, build e diff passaram; aguarda checkpoint visual humano.`

### Reabertura V12 — linha única de histórico

`IMPLEMENTADO TECNICAMENTE — Lucas autorizou em 2026-09-13. Os fatos abaixo de Conflitos agora estão em request-overview__history-inline: uma única faixa interna de três colunas iguais, sem voltar a ocupar uma nova faixa da grade principal. Em tablet/mobile há rearranjo responsivo. Typecheck, build e diff passaram; aguarda captura humana.`

## Resultado do agente

- Estado: `🚧 Em execução — Fases 0 a 3 concluídas tecnicamente; próxima fase requer novo sub-gate`.
- Arquitetura: `APPROVED para Fases 0 a 3; sub-gates obrigatórios por fase produtiva`.
- Triagem automática: `Material — fundação visual global e múltiplos consumidores`.
- Segurança: `Aplicável por partes — documentação/planejamento não altera fronteira; subfases de sessão, papel, dependência ou integração exigem revisão`.
- Implementação: Fases 0 e 1 registradas como documentação/protótipo; Fase 2 adiciona foundation isolada; Fase 3 migra o shell autenticado sem alterar seus contratos.
- Arquivos alterados: esta task; matriz/protótipo; `apps/web/src/design-system.css`; `apps/web/src/main.tsx`; `apps/web/src/ui/foundation.tsx`; `apps/web/src/ui/foundation.css`; documentação de Design System.
- Verificação: matriz registrada em `docs/product/visual-refactor-translation-matrix.md`; protótipo desktop em `evidence/ux-ui/prototypes/2026-09-12-authenticated-shell-nova-ficha.svg`; variações e estados em `evidence/ux-ui/prototypes/2026-09-12-authenticated-shell-nova-ficha-responsive.md`; SVG XML, `npm run typecheck`, `npm run build` e `git diff --check` aprovados em 2026-09-13. CUA segue indisponível para captura de browser, portanto não há aceite visual de runtime.
- Próximo passo: abrir sub-gate de consumidor (shell ou Nova Ficha), integrar somente após arquitetura e executar checkpoint de render antes de marcar a migração visual como aceita.
