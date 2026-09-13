# P1-055 — Nova Ficha V5: densidade operacional e pesquisa reconhecível

> Estado: `READY — reabertura por evidência visual de 2026-09-13; não alterar JSX/CSS até aprovação humana`.

## Diagnóstico da captura

A V4 resolveu a moldura externa, a repetição de identidade e o scroll da primeira dobra. A captura seguinte revela um excesso de redução:

- o botão `Pesquisar ficha` está isolado no canto direito, pequeno em relação ao espaço disponível e não explica que abre uma tarefa de cinco campos;
- os módulos existentes ocupam apenas a faixa superior, deixando uma área inferior grande sem função de leitura, ação, contexto ou ritmo declarado;
- a qualidade está factual, mas sua representação por três barras largas colore superfície sem acrescentar leitura proporcional ao seu conteúdo;
- `Abrir ficha completa` está distante do resumo que ele aprofunda e visualmente parece uma ação residual;
- a tela deixou de sinalizar com clareza que o BlindSpot permite iniciar uma pesquisa, acompanhar a ficha atual e aprofundar evidência.

O objetivo não é retornar ao formulário aberto permanentemente nem recolocar o workspace inteiro na primeira dobra. É recuperar **densidade operacional real**: mais contexto útil, uma busca que se reconhece imediatamente e conexões claras entre resumo e detalhe.

## Decisão de experiência

A pesquisa continua sendo um diálogo para preservar foco, validação e leitura inicial. Porém, antes do diálogo ela ganha uma **superfície de comando visível**, não apenas um botão:

1. no cabeçalho, a ação primária passa a ser maior e recebe o texto `Pesquisar nova ficha`;
2. logo abaixo, uma faixa de pesquisa de largura total explica `Pesquise uma configuração exata` e mostra os cinco critérios como chips/labels estáticos (`marca`, `modelo`, `versão`, `ano-modelo`, `mercado`) — são convite e escopo, não inputs duplicados;
3. a faixa possui a mesma ação primária. Ela abre o diálogo existente e é o ponto de entrada dominante da página;
4. o dashboard de ficha vem abaixo como segundo bloco: identidade, completude e qualidade; a área de detalhe é ligada visualmente a esse bloco, não abandonada no canto.

Assim, a pessoa entende em segundos que pode pesquisar sem perder a leitura da ficha atual. Não há formulário duplicado, payload alternativo, nova rota ou informação inventada.

## Composição desktop revisada

| Ordem | Região | Grade / conteúdo | Propósito |
| --- | --- | --- | --- |
| 1 | Cabeçalho | título + explicação curta + CTA grande | orienta a tarefa |
| 2 | Command surface | 12 colunas, título de busca, critérios visíveis, CTA | torna pesquisa descoberta e acionável |
| 3 | Contexto atual | identidade 5 colunas, completude 3, qualidade 4 | explica configuração e confiança |
| 4 | Faixa de leitura | atualidade real, estado e `Abrir ficha completa` próximo | encaminha ao detalhe |

### Qualidade como módulos de informação

`Fontes`, `Sem informação` e `Conflitos` continuam separados, mas deixam de usar barras horizontais decorativas. Cada tile mostra label, número e texto curto; conflito permanece explicitamente textual e não depende da cor. A completude mantém o anel calculado porque o arco corresponde à razão exibida; não deve competir em cor ou tamanho com a identidade.

### Densidade sem conteúdo falso

A faixa de comando e a realocação dos quatro blocos ocupam a primeira dobra com tarefas reais. Não adicionar alertas, recomendações, gráficos, dados de manutenção, previsões, cards de calendário, imagem de veículo ou narrativas para preencher espaço. Se uma data não vier do histórico compatível, ela não aparece.

## Modal e acessibilidade preservados

As duas CTAs abrem o mesmo diálogo. O diálogo continua dono dos inputs, validação, erro, `Gerar ficha técnica`, foco inicial, trap de foco, `Escape` condicionado por loading e retorno de foco ao gatilho. Os chips da command surface não são botões, campos, estado salvo ou uma segunda origem de payload.

## Responsividade

- **Desktop 1440×900:** cabeçalho, command surface, contexto atual e faixa de leitura devem caber na primeira dobra sem scroll.
- **Tablet:** command surface quebra ação para abaixo de seus critérios antes de comprimi-los; identidade continua prioritária.
- **Mobile:** CTA ocupa toda a largura; critérios quebram em linhas; contexto segue identidade → completude → qualidade → detalhe. Scroll é permitido para leitura.

## Double-check

- [x] A arquitetura aceita o feedback humano: reduzido demais, pesquisa pouco evidente e espaço vazio sem função.
- [x] Não reintroduz duplicação da identidade, formulário permanente ou workspace detalhado inicial.
- [x] Mantém somente dados verificáveis do contrato atual.
- [ ] Após implementação: comparar dark/light em 1440×900 e 390; confirmar que a busca é reconhecível em cinco segundos, que a primeira dobra não rola e que o modal conserva teclado/foco.

## Architecture Gate

`READY — esta reabertura é material por alterar composição, agrupamento e prioridade de ação. Aguarda aprovação humana explícita antes de mudar JSX/CSS.`
