# Roadmap UX/UI de refatoração — BlindSpot

> Estado: `PLANEJADO`. A ordem reduz retrabalho e não autoriza implementação automática. Cada task permanece pendente até seu próprio Architecture Gate.

## Sequência recomendada

| Fase | Resultado | Tasks derivadas | Dependências e gates |
|---|---|---|---|
| 0. Fundação | tokens semânticos, primitives e contrato de estados | P1-037 | não alterar regra funcional; validar contraste, foco e responsividade |
| 1. Entrada | login, cadastro por etapas e espera compreensíveis | P1-038 | autenticação e dados pessoais: security + compliance obrigatórias |
| 2. Casca do produto | navegação superior, sessão e responsividade da estrutura | P1-039 | preservar rotas, papel e logout já existente; não alterar autorização |
| 3. Leitura da ficha | workspace do veículo e detalhe progressivo | P1-040 | preservar schema, fontes, qualidade e ações elegíveis |
| 4. Descoberta | catálogo com resultados e rail de fichas geradas | P1-041 | compatível com descoberta/P1-024 a P1-025 e com escopo real de persistência |
| 5. Comparação | seleção e leitura X/Y | P1-042 | reutilizar elegibilidade de servidor/P1-017; sem vencedor automático |
| 6. Administração | equipe e consumo claros | P2-004 | ações administrativas continuam protegidas pelo servidor |
| 7. Orientação | inventário e remoção/migração consciente | P2-005 | não remover conteúdo sem destino ou evidência |
| 8. Aceite de experiência | validação transversal de acessibilidade e responsividade | P2-006 | executada após cada fatia e consolidada no fim |

## Marcos de aceite

### M0 — Fundação

- tokens e componentes recebem nomes semânticos e não introduzem valores recorrentes arbitrários;
- estados `loading`, `empty`, `partial`, `conflict`, `error`, `unavailable` e `disabled` têm contrato visual e textual;
- navegação por teclado, foco, contraste e redução de movimento estão contemplados no sistema base.

### M1 — Acesso confiável

- cada etapa do cadastro explica dados necessários, progresso e retorno;
- nenhuma senha, token ou dado pessoal é persistido no cliente por conveniência visual;
- a timeline usa exclusivamente estados retornados pelo servidor.

### M2 — Entendimento antes do detalhe

- a pessoa identifica veículo, versão, mercado, qualidade e fonte antes de percorrer a ficha;
- detalhes são navegáveis sem ocultar conflito ou ausência;
- a mesma semântica funciona em desktop e mobile.

### M3 — Decisão e continuidade

- catálogo permite encontrar, reconhecer e reabrir fichas sem ambiguidade de identidade;
- comparação mostra X/Y de modo simétrico e explica bloqueios;
- equipe e consumo deixam ações críticas e consequências inequívocas.

## Critérios de priorização

1. Não quebrar integridade de dado, sessão, papel ou elegibilidade por uma melhoria visual.
2. Construir tokens/primitives antes de telas para reduzir duplicação.
3. Implementar primeiro a leitura e o acesso, que sustentam as jornadas recorrentes.
4. Tratar catálogo e comparação como consumidores dos contratos de descoberta e compatibilidade existentes, não como contratos paralelos.
5. Considerar `Orientação` uma decisão de conteúdo, não uma exclusão cosmética.

## Rastreabilidade

| Origem | Aplicação no roadmap |
|---|---|
| Auditoria atual | define problemas e critérios observáveis |
| Direção alvo | define a informação e os fluxos propostos |
| Design System | define a linguagem e os componentes reutilizáveis |
| Fluxograma funcional | preserva contratos, segurança e capacidades comprovadas |
| Tasks PDK | tornam cada fatia executável, verificável e reversível |

## Atualização de estado

Ao concluir uma task, atualizar o arquivo da task, a evidência visual correspondente, este roadmap e o documento de direção somente para refletir comportamento comprovado. Nenhuma documentação de planejamento vira afirmação de capacidade implementada sem evidência de runtime.
