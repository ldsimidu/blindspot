# P1-055 — Nova Ficha V12: fatos de histórico em linha única

> Estado: `IMPLEMENTADO TECNICAMENTE — aguardando checkpoint visual humano`.

## Evidência e correção

A captura de 2026-09-13 confirma que os fatos foram realocados para baixo de Conflitos, mas a implementação os colocou na mesma coluna vertical. A intenção de leitura é uma única faixa curta com três fatos irmãos.

## Composição aprovada para implementação

- A coluna de qualidade permanece à direita, com `Fontes`, `Sem informação` e `Conflitos` empilhados.
- Imediatamente abaixo de `Conflitos`, um contêiner compacto ocupa a largura integral da coluna.
- Dentro dele, `Pesquisas`, `Primeira pesquisa` e `Última atualização` ocupam três colunas iguais, lado a lado, nesta ordem.
- O contêiner não vira nova faixa da grade principal e não participa da altura de cada card de qualidade; é uma faixa interna própria.
- Tablet pode manter três colunas quando couber; mobile reorganiza os fatos verticalmente sem omiti-los.

## Limites

Somente JSX/CSS de grade local; mesmos dados factuais, sem mudança de API, estado, navegação, motion, autorização ou schema.

## Architecture Gate

`APPROVED — Lucas autorizou a implementação em 2026-09-13. Nenhuma mudança de contrato, API, esquema, sessão ou autorização foi necessária.`
