# 🚧 Em execução — refatorar Workspace organizacional em galeria de fichas

> Prioridade: P1  
> Área afetada: interface autenticada, seleção de configuração e leitura de fichas da organização  
> Origem: evidências humanas de 2026-09-13 — Workspace ativo (ícone de grade), não Catálogo global  
> Dependência visual: P1-055, fundações/tema, primitives, Motion System e Design System do BlindSpot  
> Architecture Gate: `APPROVED — Lucas autorizou a implementação em 2026-09-13`  
> Segurança: `Não aplicável na proposta visual — reutiliza endpoints, filtros organizacionais e RBAC existentes; reabrir se versão, rota, escopo, papel ou resposta da API mudar.`

## Pedido

Transformar o atual Workspace organizacional — hoje uma página vertical que mistura escolha de veículo, fichas, sessões, governança e uma cópia visual da ficha técnica — numa jornada de galeria clara. A pessoa deve escolher uma configuração já trabalhada pela organização, ver todas as fichas reais daquela configuração, selecionar uma delas e abrir a ficha técnica verdadeira em uma leitura dedicada, sem renderizá-la como cópia no fim do mesmo scroll.

## Delimitação de superfícies

As evidências recebidas mostram `VehicleWorkspace`:

- o ícone ativo é a grade (`Workspace`), enquanto `Catálogo` global é o ícone de lista;
- os cards retornam apenas configurações que a organização pode acessar;
- a segunda captura mistura seleção, `primary/latest/recommended`, fichas, sessões, governança e uma ficha técnica final numa mesma página.

Portanto, esta task não substitui P1-041. O Catálogo global permanece a superfície de descoberta autenticada entre configurações; esta tarefa é a galeria organizada por configuração dentro do escopo da organização. Se uma futura descoberta global precisar abrir uma versão histórica exata, ela exigirá um gate próprio de contrato/autorização: o endpoint de leitura de catálogo atual abre a versão mais recente da configuração, inclusive quando a busca lista `all_versions`.

## Evidência e diagnóstico

### Estado atual confirmado

1. `VehicleWorkspace.tsx` lista `VehicleWorkspaceOption`, abre um workspace por configuração, escolhe automaticamente `primary` ou a primeira ficha e, em sequência vertical, mostra contexto, fichas, sessões, governança e `TechnicalFichaWorkspace`.
2. `VehicleWorkspaceData` separa fatos que não podem ser fundidos pela interface: `latest` é temporal, `primary` é escolha autorizada da organização e `recommended` continua indisponível. `VehicleWorkspaceSheet` expõe estado, tags, revisão mais recente e se é primária.
3. A seleção de ficha já busca a revisão por `obterFichaTecnicaPorVersao`; ela é a trilha correta para abrir uma revisão de ficha da organização. Não há necessidade de chamar o detalhe de Catálogo global, nem de inventar uma cópia de resposta.
4. Sessões e impacto são específicos de uma ficha selecionada; governança depende de capacidades retornadas pelo servidor. Essas regiões não devem competir com a escolha inicial nem aparecer como conteúdo obrigatório numa galeria.
5. As capturas revelam canvas estreito, muitos contornos genéricos, duas hierarquias de ficha concorrentes e excesso de leitura vertical. O que a pessoa quer — localizar uma ficha de um veículo e abri-la — não é o centro visual.

### Princípios reaproveitados da Nova Ficha aprovada

- canvas útil amplo, sem moldura externa decorativa ou grandes margens sem função;
- uma ação evidente e contextual, sem CTA duplicado;
- bloco principal para o objeto real, blocos pequenos para fatos reais e sem KPIs ou imagens fictícias;
- hierarquia em três momentos: intenção, contexto selecionado, próxima decisão;
- dados técnicos, completude, conflito, origem e elegibilidade continuam textuais e acessíveis, nunca apenas cromáticos;
- modo claro e escuro usam a mesma topologia e o mesmo nível de contraste/legibilidade;
- diálogo/drawer só é usado quando reduz competição; filtros não ocupam a tela quando não há busca a fazer;
- entrada/saída de contexto apenas com receitas `view.neutral` ou `flow.forward/backward`, sem simular pesquisa, progresso ou atualização factual.

### Referências e decisão de imagem

- A referência de dashboard aprovada inspira grade de módulos, leitura em blocos e densidade equilibrada; ela não autoriza foto, telemetria, datas ou métricas sem origem real.
- Não há imagem de veículo aprovada e vinculada à identidade exata. Decisão desta task: `NO_IMAGE`. A identidade textual é o objeto visual; mídia não deve sugerir que um carro/revisão foi comprovado quando não foi.

## Decisão de experiência

### Pessoa e objetivo

Pessoa autenticada da organização chega ao Workspace para retomar uma configuração já pesquisada. Ela precisa reconhecer o veículo, encontrar a ficha correta dentre as fichas autorizadas e abrir a leitura técnica real; eventualmente, consultar sessões/impacto ou operar governança, quando a capacidade estiver disponível.

### Fluxo alvo

```text
Workspace
  → Galeria de configurações da organização
  → escolher configuração exata
  → Galeria de fichas dessa configuração
  → selecionar ficha explicitamente
  → Abrir ficha técnica
  → leitura dedicada da revisão real
  → Voltar para galeria da mesma configuração (foco preservado)

Na ficha selecionada, sob demanda:
  Fichas | Sessões | Governança
```

Nenhuma escolha dispara pesquisa, criação, comparação, alteração de estado ou definição de primária automaticamente.

## Arquitetura visual por estado

### A. Galeria de configurações — entrada do Workspace

1. **Cabeçalho de página.** Eyebrow curto `Workspace organizacional`; título `Fichas da organização`; apoio: `Escolha uma configuração já trabalhada para consultar as fichas autorizadas.` Não usar título que prometa iniciar pesquisa.
2. **Faixa de intenção.** Uma superfície horizontal discreta explica que a lista é limitada à organização e que novas pesquisas começam na área própria de Nova Ficha. Sem formulário duplicado, sem rail vazio e sem botão que pareça criar pesquisa.
3. **Galeria.** Grid de 3 colunas em desktop amplo, 2 em tablet e 1 em mobile. Cada card inteiro é uma única ação `Ver fichas` e contém, nesta ordem: marca/modelo; versão, ano-modelo e mercado; contagem real de fichas; estado de contexto somente se o dado existir. O card não usa indicadores de qualidade que pertencem à ficha/revisão.
4. **Estados.** Loading usa skeleton de card sem números falsos; vazio ensina que a configuração aparece após haver ficha; erro ocupa a região da galeria e oferece nova tentativa. A configuração selecionada, caso o usuário retorne, recebe borda/ação clara e texto, não apenas cor.

### B. Galeria de fichas de uma configuração — objeto principal

1. **Retorno e identidade.** Ação `Todas as configurações` no topo; bloco de identidade curto com `Ford Ranger`, `Raptor · 2025 · Brasil` e contagem real de fichas. Não repetir uma hero gigante ou colocar uma ficha técnica completa antes de a pessoa escolher uma revisão.
2. **Resumo sem inferência.** No máximo três fatos compactos: ficha primária quando existir, semântica temporal de latest e indisponibilidade explícita de recommended. Esses três conceitos não se misturam e `is_default` nunca recebe rótulo de primária sem confirmação do servidor.
3. **Galeria de fichas.** Três cards por linha no desktop quando a largura permitir; dois em tablet; um no mobile. Cada card corresponde a uma `TechnicalSheet` real e mostra: número da última revisão ou `Sem revisão`, estado do ciclo de vida, tag `Primária da organização` quando verdadeira, tags manuais/derivadas com origem textual, data da revisão quando retornada e ação `Selecionar ficha`. Seleção não abre automaticamente.
4. **Ação de leitura.** Depois da seleção explícita, o CTA primário visível é `Abrir ficha técnica`. Ele fica desabilitado com explicação quando não houver `latest_revision`; não abre uma aproximação, não reconsulta Catálogo e não usa uma resposta copiada.
5. **Painéis sob demanda.** Abaixo do grid, tabs ou um seletor de contexto de uma coluna: `Ficha`, `Sessões`, `Governança`. Só o painel ativo é carregado/mostrado. `Sessões` exige ficha selecionada; `Governança` respeita `available_actions`, estado e papel existente. A visualização padrão é `Ficha`; ela apresenta o resumo e a ação de abertura, não o `TechnicalFichaWorkspace` inteiro.

### C. Leitura dedicada — ficha técnica real

1. Abertura desloca a aplicação para uma visão técnica dedicada e reutiliza o componente canônico `TechnicalFichaWorkspace`, alimentado por `obterFichaTecnicaPorVersao(selectedSheet.latest_revision.id)`.
2. O topo contém `Voltar para fichas de {marca} {modelo}`; retorno preserva configuração, ficha selecionada e foco no CTA originador.
3. Não renderizar a ficha como último bloco de `VehicleWorkspace`; não criar uma segunda versão do componente, converter resposta em mock ou usar o endpoint global de Catálogo para uma ficha organizacional.
4. Exportação/comparação, se existirem nessa leitura, continuam apenas quando os pré-requisitos de papel, versão, integridade e contrato atual forem satisfeitos. Esta task não cria elegibilidade nova.

### D. Layout, tokens, responsividade e tema

- **Canvas:** largura útil máxima do shell autenticado já aprovado; conteúdo alinhado ao grid, sem cartão envolvendo todo o viewport e sem margens laterais que não sirvam à leitura.
- **Módulos:** fundos, bordas, raios, tipografia e botões vêm de `foundation.css`, `design-system.css` e primitives locais. `UiButton` é obrigatório para ações; botão nativo só para card semântico quando sua semântica for integralmente preservada.
- **Tema:** a estrutura de módulos é idêntica em dark/light; não reduzir contraste, peso textual, contorno de foco ou indicação de selecionado no modo claro.
- **Desktop ≥ 1200:** 3 cards por galeria, blocos de contexto compactos, nenhuma coluna lateral fixa que comprima a seleção.
- **Tablet 768–1199:** 2 cards, cabeçalho e contexto reorganizados em duas linhas; tabs permanecem legíveis.
- **Mobile < 768:** 1 card, CTA em largura disponível, retorno acima da identidade, foco e ordem de teclado: retorno → seleção → painel → abrir ficha.
- **Overflow:** identidade longa quebra em texto; tags quebram em linha; cards não deformam ícones/controles. Nenhuma tabela/rail horizontal é obrigatória para escolher ficha.

## Estados, acessibilidade e movimento

- Todo card expõe nome acessível completo: identidade, revisão/ausência, estado e ação. A seleção tem `aria-pressed` ou `aria-current` conforme a semântica final; o botão de abrir tem relação textual com a ficha selecionada.
- Empty, erro e loading distinguem `sem configuração`, `sem ficha`, `sem revisão`, `sem sessões`, `sem acesso a governança` e falha transitória de leitura. Nenhum estado mascara ausência como sucesso.
- Tags/cores de estado mantêm texto, origem e explicação; estado arquivado não se parece com ação disponível.
- `view.neutral` acompanha configuração ou aba diferente; `flow.forward` abre leitura dedicada; `flow.backward` volta. Entrada de cards pode usar atraso curto somente uma vez por mudança de contexto. `prefers-reduced-motion` remove deslocamento. Sem shimmer, barra animada, contador ou loop em qualidade/sessões.
- Toast continua no overlay de viewport. Governança mantém feedback persistente junto do objeto; nenhum toast empurra cards/CTA.

## Impacto técnico e limites

### Alterações previstas

- `apps/web/src/VehicleWorkspace.tsx` e `vehicle-workspace.css`: topologia em duas galerias, seleção explícita, painéis sob demanda e estados.
- `apps/web/src/App.tsx`: somente se necessário para elevar a abertura da revisão a uma visão técnica dedicada/reutilizável, com retorno e foco preservados.
- possivelmente um componente local de card/galeria, desde que não crie uma biblioteca paralela e que tenha contrato de uso documentado.
- `docs/product/design-system.md`, `docs/design-system/motion.md` e esta task somente se a implementação revelar um padrão realmente reutilizável.

### Fora do escopo

- endpoints, banco, schema, prompt/runtime de IA, provider, sessão, RBAC, comparação, exportação, imagens, favoritos, ranking e recomendação;
- criar ficha, iniciar/continuar sessão de pesquisa e alterar tags;
- reinterpretação de `latest`, `recommended`, `primary`, `is_default`, `state` ou origem de tags;
- mudança de Catálogo global (P1-041) ou promessa de abrir versões históricas globais sem novo contrato autorizado.

## Critérios de aceite

- [ ] A entrada mostra uma galeria clara de configurações acessíveis da organização, com identidade e contagem reais, sem layout de formulário ou região vazia dominante.
- [ ] Ao escolher uma configuração, a pessoa vê uma galeria de todas as fichas reais daquela configuração antes de qualquer leitura técnica completa.
- [ ] Selecionar uma ficha e abrir sua ficha técnica leva a uma visão dedicada alimentada pela revisão organizacional real, não a uma cópia no fim da página nem a uma resposta global aproximada.
- [ ] `primary`, `latest`, `recommended`, ciclo de vida e tags preservam semântica/origem comprovadas; nada é inferido visualmente.
- [ ] Sessões e governança aparecem apenas sob demanda e respeitam capacidades/estado existentes.
- [ ] Dark/light, 1440, 1024, 768 e 390 px preservam a mesma ordem de decisão, foco, contraste, labels e ação principal.
- [ ] Teclado, retorno de foco, loading, vazio, erro, ausência de revisão, ficha arquivada, sem sessões, sem permissão de governança e `prefers-reduced-motion` foram revisados.
- [ ] `npm run typecheck`, `npm run build` e `git diff --check` passam; capturas sanitizadas são revisadas por Lucas antes de marcar visualmente concluída.

## Double-check da arquitetura

- A superfície evidenciada é Workspace, não Catálogo global; a solução não altera por engano a descoberta transversal da P1-041.
- A galeria resolve a tarefa central antes de exibir sessões, governança ou detalhes técnicos; não existem três jornadas longas no mesmo scroll.
- O desejo de “abrir a ficha verdadeira” é atendido pelo identificador da revisão organizacional já retornado. A proposta não afirma suporte a deep-link URL nem versões históricas globais, pois isso não foi confirmado.
- Espaço livre serve à grade, escaneabilidade e leitura; não há moldura externa, coluna estreita, CTA isolado, dado decorativo, imagem genérica, qualidade inventada ou duplicação da identidade.
- A arquitetura falha se a implementação carregar ficha antes da seleção explícita, transformar `recommended` indisponível em recomendação, usar Catálogo global para abrir a ficha da organização, ocultar origem/estado ou deixar cartões ilegíveis em tablet/mobile.

## Próximo gate

`APPROVED — Lucas autorizou a implementação em 2026-09-13.` Qualquer necessidade de rota/URL permanente, leitura de versão global específica ou mudança de autorização exige nova arquitetura e Security Assurance antes de código.

## Resultado parcial de implementação — 2026-09-13

- `VehicleWorkspace` agora inicia na galeria de configurações e não autoabre uma ficha. Cada configuração exibe apenas identidade real, mercado/ano/versão e contagem real de fichas, com uma única ação `Ver fichas`.
- A configuração selecionada abre uma segunda superfície: identidade curta, fatos separados de `latest`, `primary` e `recommended`, galeria de fichas e seleção explícita. A ficha técnica completa não é mais renderizada ao fim do scroll.
- Depois da seleção, a pessoa escolhe `Ficha`, `Sessões` ou `Governança`; sessões só são carregadas ao abrir esse contexto e governança continua respeitando capabilities, estado e confirmações existentes.
- `Abrir ficha técnica` leva a uma leitura dedicada do `TechnicalFichaWorkspace`, alimentada pelo `technical_sheet_version_id` da revisão organizacional selecionada. O retorno conserva a configuração/ficha em memória e devolve foco ao CTA originador.
- O CSS foi reconstruído em grade de três/dois/um cards, usa canvas útil do shell, módulos reais e os dois temas existentes. Não foram adicionadas imagens, dependências, endpoints, persistência, filtros, ranking, RBAC ou alteração de contrato.
- Verificações executadas: `npm run typecheck` passou; `npm run build` passou; `git diff --check` passou. Avisos de CRLF pertencem a arquivos já presentes na árvore e não indicaram erro de diff.
- Pendente para encerramento visual: checkpoint humano com capturas sanitizadas de entrada, galeria de fichas, ficha dedicada, estados sem dados/erro, dark/light e mobile. Build não confirma a composição renderizada.

## Reabertura de composição V2 — aprovada junto ao pedido de implementação em 2026-09-13

### Evidência que reabriu a arquitetura

As capturas da primeira renderização de 2026-09-13 confirmaram que o fluxo passou a ser progressivo, mas reprovaram a composição: os módulos usavam `--color-surface-*` quase indistinguível do canvas autenticado, a página tinha grandes vazios entre título, contexto e galeria, os fatos de seleção pareciam texto solto e duas fichas deixavam uma coluna residual. A confirmação humana também consolidou que a superfície deve se comportar como biblioteca/galeria de trabalho — não como uma lista genérica nem como um dashboard de métricas inventadas.

### Composição V2 a implementar

1. A entrada passa a ter título de ação `Escolha uma configuração`, com `Biblioteca de fichas da organização` como contexto compacto e uma só frase de escopo; não usar hero narrativo ou quebra de título que roube o primeiro viewport.
2. Configurações e fichas passam a usar módulos visíveis do mapa autenticado (`--app-surface`, `--app-surface-muted`, `--app-border`, `--app-module-radius`), com borda discreta e sem sombra decorativa. A grade é `auto-fit`: três módulos quando houver espaço, dois módulos largos quando só existirem duas fichas e uma coluna em compacto.
3. Cada card mantém somente dados comprovados, mas organiza identidade, metadados, contagem/revisão, tags e CTA no mesmo bloco. O rodapé de ação permanece ancorado; não existe texto ou botão perdido em área negativa.
4. A configuração escolhida ganha um bloco de identidade principal. `Última`, `Primária` e `Recomendada` tornam-se três módulos auxiliares compactos, sempre explicando sua semântica e sem converter `recommended` indisponível em sugestão.
5. Ficha ativa/primária mantém maior reconhecimento por ordem, rótulo e estado textual; ficha arquivada continua acessível e legível, porém sem competir com a ação de abertura da ficha selecionada.
6. O retorno da leitura mantém configuração e ficha destacadas. A mudança de superfície usa somente a transição contextual já aprovada; não anima dados, status ou métricas como progresso.
7. Estados futuros são previstos sem implementá-los com dados fictícios: card comporta nomes longos, tags longas e ausência de revisão; `sem configuração`, `sem ficha`, `sem revisão`, `sem sessão` e `sem permissão` permanecem semanticamente distintos.

### Limites reafirmados

Não há alteração de URL persistente/deep-link, endpoint, versão global, autorização, schema, RBAC, imagem, ranking, filtro, ordenação persistida ou dados de qualidade. O rótulo de navegação `Workspace` versus `Catálogo` fica documentado como decisão transversal futura, pois modificar destinos/cópia do shell exige arquitetura própria.

### Double-check V2

Reprova se cards ainda se confundirem com o fundo, se houver coluna residual para duas fichas, se o título principal quebrar sem restrição real de viewport, se a área de escopo ocupar mais peso que a galeria, se estados técnicos forem escondidos para “limpar” o layout ou se qualquer módulo introduzir métrica/atributo não retornado pelo servidor.

### Implementação V2 e verificação

- A entrada agora comunica `Biblioteca de fichas da organização` e orienta a ação `Escolha uma configuração`; a nota de escopo é uma linha de apoio, não uma região dominante.
- As galerias passaram de colunas fixas para `auto-fit` com largura mínima de módulo. Três configurações permanecem em grade; duas fichas preenchem duas colunas largas sem coluna residual.
- Cards de configuração, ficha, fatos de seleção, ficha escolhida, sessões e impacto agora usam as superfícies `--app-*` e bordas da fundação autenticada. Isso restaura blocos percebidos em dark/light sem imagem, sombra decorativa ou KPI não comprovado.
- A identidade do veículo selecionado passou a ser módulo principal; os três critérios aparecem em módulos auxiliares. Ficha ativa e arquivada permanecem diferentes por texto, ordem e estado, sem ocultação.
- `docs/product/design-system.md` registrou os padrões `DS-BS-007` e `DS-BS-008` para que futuras superfícies não repitam cards invisíveis, fluxo vertical misturado ou galeria rígida.
- `npm run typecheck`, `npm run build` e `git diff --check` passaram após a recomposição. A task continua `🚧 Em execução` até a nova captura humana aprovar desktop, light, mobile e a leitura dedicada.
