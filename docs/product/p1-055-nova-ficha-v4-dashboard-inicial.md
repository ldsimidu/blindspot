# P1-055 — Nova Ficha V4: dashboard inicial sem scroll

> Estado: `IMPLEMENTADO TECNICAMENTE — aguarda checkpoint visual humano em desktop e mobile`.

## Evidência que reabriu a arquitetura

As capturas em dark e warm-light mostram uma evolução útil do overview, mas reprovam a composição da tela inicial por quatro razões estruturais:

1. o `AppFrame` ainda é percebido como uma moldura gigante com borda e margens laterais, desperdiçando largura útil em ambos os temas;
2. o formulário fica aberto antes de a pessoa decidir pesquisar, roubando a primeira dobra de quem quer ler a ficha já existente;
3. `Ford Ranger Raptor` e sua qualidade aparecem em dois agrupamentos distintos: overview e workspace técnico; a repetição não explica uma nova decisão;
4. a combinação formulário + overview + workspace detalhado supera a altura da primeira dobra e obriga scroll para entender o estado principal.

Esses não são defeitos de margem ou tipografia. Eles alteram propósito, fluxo e agrupamento de informação; por isso invalidam a aprovação visual anterior e exigem este sub-gate antes de um novo JSX/CSS.

## Objetivo de experiência

Ao abrir `Nova ficha` com uma ficha em contexto, a pessoa deve conseguir responder sem rolar: **qual configuração está em leitura, quão confiável/completa ela está, quando foi pesquisada e qual ação deseja fazer agora**. A criação de uma nova ficha é uma intenção explícita, não conteúdo permanente da página.

O primeiro viewport é um dashboard operacional, não um formulário no topo nem uma prévia duplicada do workspace. O detalhe permanece disponível, porém entra por ação deliberada.

## Direção visual e canvas

- O canvas autenticado ocupa todo o espaço útil do viewport. `AppFrame` deixa de desenhar uma borda, radius e margens decorativas que contenham toda a aplicação; ele continua sendo apenas a estrutura semântica/layout do shell.
- A contenção acontece dentro dos módulos e no grid, não em um cartão gigante ao redor da página. Em desktop, usar padding responsivo de borda (aprox. `24–40px`) e largura máxima apenas onde preservar a leitura exige, sem criar duas faixas vazias simétricas.
- O header mantém presença compacta. Marca, navegação e utilidades continuam em suas regiões atuais; ele não ganha uma nova faixa alta.
- A linguagem material continua warm-light no tema claro e grafite no tema escuro, com os mesmos pesos de informação. Trocar tema não deve alterar ordem, densidade, conteúdo ou ações.
- Não há imagem de carro, asset externo, telemetria inventada ou placeholder que pareça representar a configuração. A identidade textual é o elemento editorial grande desta tela.

## Arquitetura de informação do estado com ficha

### Cabeçalho de página

`Ficha técnica` identifica a tarefa. À direita:

- **Primária:** `Pesquisar ficha`, que abre o diálogo de geração.
- **Secundária:** `Exportar`, somente se já houver um identificador de versão que o contrato atual reconheça como exportável. Não mostrar CTA meramente decorativo.

### Grade principal em 12 colunas

| Módulo | Colunas desktop | Informação permitida | Decisão que sustenta |
| --- | ---: | --- | --- |
| Identidade da ficha | 6 | marca, modelo, versão, ano-modelo, mercado e uma explicação factual curta | confirmar que a ficha em contexto é a desejada |
| Completude | 3 | anel calculado, percentual e razão `preenchidas/total` | entender cobertura sem interpretar uma contagem solta |
| Qualidade | 3 | três tiles autônomas: fontes, sem informação e conflitos | identificar limite ou risco de leitura |
| Atualidade e acesso ao detalhe | 12, faixa baixa compacta | primeira pesquisa e última atualização reais, quando existirem; estado factual; `Abrir ficha completa` | decidir aprofundamento sem duplicar o resumo |

Cada número de qualidade é um pequeno bloco separado, como na referência: tem label, valor tabular e significado textual. O anel não é decoração: seu arco representa exclusivamente a mesma razão exibida no centro. Se o total não for calculável, o anel cede lugar a `Completude indisponível` e não sugere uma porcentagem.

O único bloco editorial grande é **Identidade da ficha**. Ele substitui a área de imagem da referência pela configuração real, sem tentar fingir que o produto possui foto verificável do veículo. O nome aparece uma única vez nesta primeira tela; versão, ano e mercado formam metadados compactos abaixo.

### Temporalidade sem invenção

`Primeira pesquisa` e `Última atualização` são exibidas apenas a partir de timestamps existentes no histórico retornado. Caso não haja histórico válido, a faixa não recebe datas fictícias; mostra somente o estado disponível e preserva o ritmo do grid. A regra de agregação (menor/maior `finishedAt` válido) será documentada junto ao código, sem alterar persistência ou contrato.

### Detalhe técnico fora da primeira dobra

`TechnicalFichaWorkspace` não é renderizado junto do dashboard inicial. `Abrir ficha completa` revela/muda para o detalhe técnico existente, que é a única região responsável por tabs, atributos, fontes, pesquisa e conflitos por variável. O workspace não deve reintroduzir outro hero de identidade imediatamente antes de seus tabs; ele recebe um cabeçalho compacto de contexto ou consome o contexto persistente da página.

## Pesquisa como diálogo focado

`Pesquisar ficha` abre um diálogo modal acessível. É a forma escolhida porque os cinco campos pertencem a uma ação concentrada e não precisam reduzir a leitura do dashboard enquanto estão ociosos.

- Conteúdo: marca, modelo, versão, ano-modelo e mercado; a mesma validação, os mesmos valores, o mesmo payload e o mesmo `handleSubmit` atuais.
- Ação: `Gerar ficha técnica`; alternativa explícita `Cancelar`.
- Foco: ao abrir, o primeiro campo recebe foco; `Tab`/`Shift+Tab` permanecem no diálogo; após fechar, o foco volta a `Pesquisar ficha`.
- Teclado: `Escape` fecha somente quando não há requisição em andamento; loading bloqueia fechar por acidente e comunica que a geração foi iniciada.
- Erro: validação fica junto ao campo. Falha transversal continua na camada de toast/painel já definida, sem deslocar a estrutura do dashboard.
- Sem mudança de domínio: não cria rota, storage, API, telemetria, estado persistido ou critério de elegibilidade novo.

## Estados da tela

| Estado | Composição | Ação disponível |
| --- | --- | --- |
| Sem ficha | mensagem curta de contexto + `Pesquisar ficha`; não cria módulos de métricas vazios | abrir diálogo |
| Gerando | diálogo permanece estável, CTA em loading; dashboard anterior não declara resultado novo | aguardar ou cancelar somente se o comportamento atual suportar |
| Ficha parcial | identidade + completude + qualidade; ausências explicadas em texto | abrir detalhe e evidência |
| Ficha com conflito | tile `Conflitos` recebe status textual além de cor; não escolhe vencedor | abrir detalhe/conflitos |
| Ficha pronta | mesma grade, sem trocar para dashboard comemorativo | abrir detalhe / exportar se elegível |
| Erro de pesquisa | retorno contextual preserva os valores no diálogo e a tela base | corrigir e tentar novamente |

## Responsividade e dobra

- **1440×900:** cabeçalho, grade inteira e faixa de detalhe cabem na primeira dobra com uma ficha existente. Não há scroll vertical inicial; isso é critério de aceite visual, não promessa para conteúdo aberto no detalhe.
- **1024/768:** identidade ocupa a linha dominante; completude e qualidade passam para linha seguinte em proporção legível. Ações não ficam isoladas fora do viewport.
- **390:** scroll é permitido, pois a sequência prioriza legibilidade. Ordem: título/ação → identidade → completude → tiles de qualidade → atualização → detalhe. O diálogo usa largura segura e não corta foco/CTA.
- Nenhum breakpoint reduz rótulos a ícones opacos, espreme números ou repete identidade para resolver espaço.

## Impacto técnico e limites

- Consumidores prováveis: `apps/web/src/App.tsx`, `apps/web/src/styles.css` e, se necessário, uma primitive local de diálogo. `foundation.tsx/css` só muda se o contrato de primitive provar reutilização; não criar wrapper genérico para uma única tela.
- Preservar sessão, logout, RBAC, tema, campos, payload, validação, API, schema, histórico e regras de exportação. Esta fatia não altera segurança, dados pessoais, integrações ou dependências; avaliação de segurança: **não aplicável ao layout/modal local**, desde que esses limites sejam preservados.
- Não introduzir biblioteca de modal, imagens, fontes, assets, analytics, provider ou movimento. Abertura/fechamento pode usar a transição local já permitida, com estado estático equivalente e `prefers-reduced-motion`.

## Double-check da arquitetura

- [x] As duas evidências informadas confirmam o problema de moldura, scroll e duplicação nos dois temas.
- [x] A referência foi traduzida em modularidade, assimetria e informação factual; não em telemetria, carro, datas ou métricas copiadas.
- [x] O fluxo preserva o fato de que pesquisar ficha e ler ficha são intenções diferentes.
- [x] O layout só exibe porcentagem, datas e exportação quando houver dado/eligibilidade comprováveis.
- [x] Antes de implementar: `Abrir ficha completa` passa a revelar localmente o `TechnicalFichaWorkspace`; o contrato atual não expõe identificador exportável no overview, portanto `Exportar` não foi exibido; `history.finishedAt` é o único timestamp usado para temporalidade.
- [ ] Depois do primeiro render: comparar dark/light em 1440×900, 1024/768 e 390; checar foco do diálogo, ausência de scroll na dobra desktop, leitura por teclado e não duplicação.

## Architecture Gate

`IMPLEMENTADO TECNICAMENTE — Lucas autorizou em 2026-09-13. A implementação altera somente AppFrame, composição local da Nova Ficha e diálogo nativo; não altera payload, schema, API, sessão, RBAC, histórico ou exportação. O checkpoint de primeira renderização PEK continua obrigatório antes de aceite visual.`
