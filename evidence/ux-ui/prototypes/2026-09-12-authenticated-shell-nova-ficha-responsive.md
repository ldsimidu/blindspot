# Variações responsivas — protótipo Nova Ficha

> Complementa `2026-09-12-authenticated-shell-nova-ficha.svg`. É uma especificação visual estática, não CSS de produção.

## 1440 px — composição de referência

- Frame inteiro, borda coral discreta, header em uma única linha.
- Composer compacto em faixa horizontal: contexto à esquerda, cinco campos compactos ao centro e ação à direita.
- Grade de conteúdo em 12 colunas: `VehicleStage` 6 colunas; métricas 4 colunas em matriz 2×2; prioridades 2 colunas.
- Resumo técnico ocupa a linha seguinte inteira; tabs textuais permanecem no contexto persistente.

## 1024 px — desktop compacto

- Frame continua visível, mas reduz padding externo e não cria barra horizontal.
- Composer vira duas linhas: identidade/contexto e ação na primeira; campos em segunda linha com tamanho mínimo legível.
- Grade de 8 colunas: `VehicleStage` 5; coluna auxiliar 3, contendo primeiro métricas 2×2, depois prioridades.
- Resumo continua abaixo; tabs usam rolagem horizontal apenas se os rótulos não couberem, sem cortar o item ativo.

## 768 px — tablet

- Header preserva marca, rail e sessão; disclosure continua ancorado, nunca empurra a página.
- Composer vira painel de duas regiões: título/ajuda e formulário em grade 2×2; CTA ocupa largura total na última linha.
- Grade de 8 colunas: `VehicleStage` ocupa 8; métricas ocupam 4+4 em duas linhas; prioridades ocupa 8.
- A representação abstrata diminui antes da identidade textual. Estado, completude e ação continuam acima do fold.

## 390 px — mobile

- Canvas e superfícies continuam claros; frame perde moldura decorativa grossa para preservar área útil e safe area.
- Navegação abre painel/modal rotulado: ícones sem texto não são o único modo de navegação no mobile.
- Composer tem uma coluna; cada label é persistente e o CTA fica imediatamente após o último pré-requisito.
- Ordem: título/contexto → composer → `VehicleStage` curto → quatro métricas 2×2 → prioridades → tabs horizontais com rótulos → resumo por grupos.
- A imagem/placeholder nunca é necessária para entender o veículo. Fonte, conflito, estado e unidade não podem ser truncados nem escondidos.

## Estados do mesmo wireframe

| Estado | Regiões que mudam | Regiões que permanecem |
| --- | --- | --- |
| Sem ficha | Stage explica a ausência; métricas e resumo mostram indisponibilidade, não zero fabricado | Shell, composer, navegação e CTA |
| Carregando | Skeleton reproduz blocos de stage, métricas, prioridades e resumo; não altera o layout | Identidade digitada, ação e ordem de leitura |
| Parcial | Métricas e prioridades mostram ausência factual; resumo usa `Não informado` | Identidade, fonte disponível e tabs |
| Conflito | Prioridade e atributo afetado recebem status textual/ícone; não existe vencedor visual | Todos os valores não afetados e a evidência |

## Double-check para aceite

1. O shell parece um único produto, e não um painel claro inserido num site dark?
2. Em cada largura, a tarefa e a identidade do veículo aparecem antes de detalhe ou decoração?
3. A área de estágio deixa claro que não representa o veículo exato?
4. Métricas e prioridades poderiam ser preenchidas apenas por contratos existentes?
5. Fonte, conflito e menu continuam descobríveis por teclado, foco e texto?

