# P1-055 — Nova Ficha V10: histórico compacto na coluna de qualidade

> Estado: `IMPLEMENTADO TECNICAMENTE — aguardando checkpoint visual humano`.

## Evidência e achado

A captura desktop de 2026-09-13 mostra que os três fatos de histórico foram corretamente separados, mas a grade os posicionou como uma terceira faixa abaixo dos atributos técnicos. Isso aumenta a altura do dashboard e quebra a leitura desejada: fontes, lacunas, conflitos e atualização pertencem ao mesmo trilho de qualidade/atualidade da ficha.

## Decisão visual

- Preservar os três fatos individuais: `Pesquisas`, `Primeira pesquisa` e `Última atualização`.
- Mover o grupo para a coluna direita, diretamente após os três módulos de qualidade existentes (`Fontes`, `Sem informação`, `Conflitos`).
- Os três novos módulos terão a mesma largura da coluna e altura compacta, mas tipografia reduzida o suficiente para datas não quebrarem a composição.
- A faixa inferior permanece reservada à leitura técnica rápida e à ação `Abrir ficha completa`; não haverá uma quarta faixa de cards.

## Composição

No desktop de 12 colunas: identidade ocupa 5, completude 3 e a coluna lateral ocupa 4. Essa coluna passa a conter, em ordem vertical, Fontes, Sem informação, Conflitos, Pesquisas, Primeira pesquisa e Última atualização. A leitura natural continua: identidade → qualidade → atualidade.

Em tablet, a coluna lateral pode integrar a faixa abaixo da completude; em mobile, todos os módulos continuam em uma coluna sem omitir fatos.

## Limites e verificação

- Apenas JSX/CSS de composição local; nenhuma API, dado, schema, sessão, RBAC ou nova pesquisa.
- As datas continuam originadas de `resultHistoryDates`; nenhuma informação é sintetizada.
- Verificar desktop 1920/1440, mobile, ambos os temas, ausência de overflow em datas e preservação da ação de detalhe.

## Architecture Gate

`APPROVED — Lucas autorizou a implementação em 2026-09-13. Nenhuma mudança de contrato, API, esquema, sessão ou autorização foi necessária.`
