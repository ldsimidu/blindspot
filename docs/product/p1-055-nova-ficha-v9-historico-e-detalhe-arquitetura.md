# P1-055 — Nova Ficha V9: histórico modular e abertura da ficha completa

> Estado: `IMPLEMENTADO TECNICAMENTE — aguardando checkpoint visual humano`.

## Alvo, pessoa usuária e objetivo

- **Tela/estado:** overview autenticado da Nova Ficha, com uma ficha técnica exata já carregada.
- **Pessoa usuária:** analista que acabou de pesquisar ou retomou a última configuração disponível.
- **Objetivo:** reconhecer imediatamente a ação de pesquisar outra configuração, entender qual foi a última ficha pesquisada e abrir a leitura técnica completa sem confundir o dashboard-resumo com uma página de detalhe.
- **Ação primária:** `Pesquisar por nova ficha técnica`, na command surface.
- **Ação secundária:** `Abrir ficha completa`, que leva à visão dedicada da ficha já carregada.

## Evidência atual e problema concreto

- A captura aprovada da V6/V7 confirma o dashboard operacional e a command surface como direção correta; ela também expõe que o bloco único `Histórico da configuração` tem um título decorativo e agrega três fatos independentes em uma superfície só.
- O título superior `Ficha técnica` descreve o objeto, mas não a tarefa inicial. Para quem chega ao overview, a ação de iniciar nova pesquisa perde prioridade semântica.
- Hoje `Abrir ficha completa` troca um booleano local (`isTechnicalDetailOpen`) dentro da mesma visão `request`. O conteúdo aberto é o `TechnicalFichaWorkspace` real, porém a estrutura de navegação não o trata como uma tela própria.
- Fatos confirmados no código: pesquisas compatíveis são filtradas por identidade exata da configuração; `TechnicalFichaWorkspace` já é a leitura completa de resumo, especificações, fontes, histórico, pesquisa e conflitos. Não há roteador ou URL de rota no app atual.

## Referências e princípios reutilizados

- **Referência visual Future Design / dashboard:** módulos autônomos, leitura rápida por blocos e ritmo horizontal. Reutilizar separação por fatos; não copiar veículo, mapa, métricas fictícias ou conteúdo telemático.
- **Direção geral do BlindSpot e Design System:** uma configuração exata, completude, fontes e conflitos continuam fatos decisórios, não decoração. A pesquisa deve ser reconhecível e o detalhe preserva rastreabilidade.
- **Imagem:** `NO_IMAGE`. A identidade da configuração permanece textual e os números mostrados são dados carregados.

## Arquitetura visual e de fluxo

1. O cabeçalho passa a se chamar **Pesquisar por nova ficha técnica**. O subtítulo continua descrevendo o estado, não promete geração já concluída.
2. A command surface mantém título, critérios e sua única CTA com lupa. Não haverá CTA duplicada no cabeçalho.
3. Abaixo da command surface entra um divisor horizontal de largura útil. Logo abaixo, um label menor `Última ficha pesquisada` apresenta a região de contexto do resultado.
4. O dashboard de resultado preserva identidade, completude, fontes, lacunas, conflitos e leitura técnica rápida.
5. O antigo card `Histórico da configuração` deixa de existir. Quando houver histórico compatível, três blocos irmãos na mesma linha exibem, nesta ordem: **Pesquisas**, **Primeira pesquisa** e **Última atualização**. Não há título de agrupamento redundante. Cada bloco usa apenas o dado factual já calculado; se o histórico não estiver disponível, a região mostra uma única mensagem explícita, sem fabricar datas.
6. `Abrir ficha completa` deixa o overview e entra em uma **visão dedicada `technical`** do App. Essa visão renderiza o `TechnicalFichaWorkspace` existente com a mesma ficha em memória, preservando suas abas e dados de proveniência. Um retorno explícito leva à overview `request` sem disparar nova pesquisa. Não criar URL/roteador, endpoint, persistência ou carga adicional neste corte.

### Layout desktop

- Canvas e largura útil continuam os da V7 aprovada, sem moldura externa decorativa.
- Command surface ocupa a faixa completa; divisor e label ficam imediatamente abaixo, antes da grade de resultado.
- Na grade de 12 colunas, identidade e completude/qualidade conservam as proporções atuais. Os três fatos de histórico passam a ocupar uma única faixa com três colunas equivalentes, cada uma em sua própria superfície; em larguras intermediárias podem ocupar a largura restante do grid, sem deixar uma coluna vazia intencional.
- A ação de detalhe fica alinhada ao fim da faixa inferior, fora dos três fatos para não competir com eles.

### Responsividade, acessibilidade e estados

- Em tablet, os fatos de histórico podem virar 3/2+1 conforme o grid disponível; em mobile, passam a uma coluna, preservando ordem e labels.
- O divisor é estrutural, não dependente de cor isolada. Labels e valores mantêm contraste, `font-variant-numeric` e quebra segura.
- A CTA de pesquisa permanece botão nativo, com ícone decorativo e nome acessível. A ação de detalhe muda a visão e move foco ao título da ficha; voltar devolve foco ao botão que abriu o detalhe.
- Sem resultado: comando, vazio e CTA continuam; a região `Última ficha pesquisada` e os módulos não aparecem. Loading/erro não inventam histórico nem escondem o próximo passo.
- Dark e warm-light usam os mesmos tokens sem alterar significado de fonte, lacuna ou conflito.

## Impacto técnico, dados e segurança

- **Arquivos previstos:** `apps/web/src/App.tsx`, `apps/web/src/styles.css`, esta arquitetura e a task P1-055; ajustar `docs/product/design-system.md` apenas se a composição revelar uma regra compartilhável.
- **Dados:** reutiliza `result`, `history`, `resultHistoryDates` e `TechnicalFichaWorkspace`; sem mudança em payload, schema, API, persistência, exportação, provider, sessão ou RBAC.
- **Segurança proporcional:** `Não aplicável` neste corte. A visão dedicada não concede capacidade, não altera autorização e não expõe dado além do já visível à sessão autenticada.

## Critérios de aceite

1. O cabeçalho diz `Pesquisar por nova ficha técnica`; há uma só CTA de pesquisa, na command surface.
2. Há divisor e label `Última ficha pesquisada` entre a pesquisa e a grade, somente com resultado disponível.
3. Pesquisas, primeira pesquisa e última atualização aparecem em três blocos independentes; nenhum título `Histórico da configuração` permanece.
4. `Abrir ficha completa` abre a visão dedicada que renderiza o workspace técnico real da mesma ficha; voltar conserva o resultado e retorna ao overview.
5. Não ocorre nova chamada de geração, alteração de dados, perda de fontes/status/conflitos ou mudança de permissão.
6. Typecheck, build e `git diff --check` passam; o checkpoint humano compara ao menos desktop e mobile nos dois temas.

## Double-check da arquitetura

- A proposta aumenta a clareza de tarefa sem reduzir a densidade factual aprovada na V6.
- Três blocos são justificados por três fatos distintos, não por decoração. Não foram adicionados dados sintéticos.
- A “página real” é atendida por uma visão de aplicação dedicada que reutiliza o workspace de ficha já existente. Criar uma rota de URL seria uma ampliação de contrato não pedida e sem roteador atual.
- O retorno, foco e ausência de novo request estão explicitados para que a transição não pareça uma nova pesquisa nem destrua contexto.

## Architecture Gate

`APPROVED — Lucas autorizou a implementação em 2026-09-13. Nenhuma mudança de contrato, API, esquema, sessão ou autorização foi necessária.`
