# Project Release Management Contract

## Propósito

O Release Ledger registra versão, conteúdo, evidência e estado de cada entrega sem depender de plataforma externa.

## Política

O consumidor define a fonte da versão e sua convenção em `release-policy.md`. O PDK não presume SemVer, tags Git, CI ou publicação.

## Estados

`draft`, `candidate`, `released`, `withdrawn` e `superseded`. Uma release só fica `released` com aprovação declarada e links para tasks, handoffs, decisões e verificações relevantes.

## Limites

O ledger não publica, cria tags, altera versão, faz deploy nem infere inclusão por commit. Retirada e substituição preservam histórico.
