# Decisões pendentes — racionalização de variáveis

> Produzido pela P0-006 e aplicado de forma compatível na P0-007. Nenhuma opção abaixo removeu os 204 caminhos obrigatórios do schema atual (199 campos com status e 5 coleções).

## Decisão 1 — modelo de corpo do veículo

Recomendação: manter `categoria` e `tipo_carroceria` como núcleo genérico, com vocabulário controlado que comporte sedan, hatch, SUV, crossover, cupê, picape/caminhonete, van, utilitário e outros tipos aprovados. `cabine_tipo` permanece condicional para configurações que possuem cabine.

Motivo: a pergunta “qual a estrutura do carro?” deve ter uma resposta no mesmo campo independentemente de ser sedan ou caminhonete; detalhes de cabine não devem competir com a taxonomia principal.

Decisão solicitada: aprovar vocabulário controlado e manter os três campos, ou consolidar `categoria` e `tipo_carroceria` em um único campo futuro.

## Decisão 2 — arquitetura de propulsão

Recomendação: tratar `motor_tipo` como campo pai genérico de arquitetura de propulsão, com valores como combustão, elétrico, híbrido, híbrido plug-in e célula de combustível quando aplicável. Manter `motor_combustivel`, `motor_eletrificacao_tipo`, `motor_eletrico_presente` e `autonomia_eletrica_km` como detalhes condicionais.

Motivo: hoje `motor_eletrico_presente` tende a exigir pesquisa para uma característica ausente na maioria dos carros. O campo pai resolve a pergunta principal em toda ficha; os detalhes só são coletados quando a propulsão os torna pertinentes.

Decisão solicitada: manter a extensão atual, fundir `motor_eletrico_presente` em `motor_tipo`, ou criar objeto de propulsão numa futura versão incompatível do contrato.

## Decisão 3 — serviços de eletrificação

Recomendação: conservar garantia de bateria e conectividade EV como extensões condicionais, nunca como defaults de `false`/zero. Elas só têm significado depois da arquitetura de propulsão e da disponibilidade por mercado serem conhecidas.

Decisão solicitada: mantê-las na ficha plana atual ou movê-las futuramente para uma extensão `eletrificacao`.

## Decisão 4 — capacidade geral versus pacote off-road

Recomendação: manter tração, transmissão, pneus, dimensões e capacidade de carga como núcleo/condicionais gerais; classificar diferenciais blocantes, proteções, ganchos, modos específicos e piloto off-road como extensão. Isso evita medir uma picape e um sedan pelo mesmo conjunto de acessórios, sem apagar os detalhes quando existirem.

Decisão solicitada: aprovar a família de extensão `offroad_utilitario` para uma versão futura ou manter os campos planos até existir catálogo/consulta por domínio.

## Decisão 5 — conectividade e opcionais

Recomendação: manter conectividade de base como condicional por mercado/sistema e mover recursos de aplicativo, OTA, hotspot, som premium e assistente digital para extensões. Serviços podem expirar ou variar por plano; portanto não são características permanentes do veículo.

Decisão solicitada: definir se o produto prioriza ficha de engenharia (menos serviços) ou ficha comercial por mercado (mantém serviços com data de referência obrigatória).

## Invariantes aprovados para qualquer decisão

- A ficha conserva 204/204 caminhos até que uma migração de contrato seja aprovada; 199/199 campos de status precisam de resolução explícita.
- Um campo especializado não pode desaparecer; enquanto existir, recebe estado terminal e evidência/razão apropriada.
- Nenhuma redução de variável pode quebrar fontes, histórico, comparação, exportação ou dados persistidos; mudança futura exige versão, migração e Architecture Gate.
- A métrica de confirmação não pode ser usada para substituir cobertura estrutural/resolvida de 100%.
