# Auditoria UX/UI do estado atual — BlindSpot

> Estado: `BASELINE_OBSERVADO` em 2026-09-11. Esta auditoria descreve a evidência disponível; não altera o runtime nem conclui o comportamento de interações que não foram exercitadas.

## Método e confiança

- **Modo PEK:** `AUDITORIA_ORIENTADA_A_JORNADA`.
- **Escopo lido:** capturas das oito jornadas atuais, referências de produto, comparação, gestão de equipe, login/cadastro e os quatro direcionamentos textuais em `evidence/ux-ui/`.
- **Confiança alta:** hierarquia visual, densidade, organização de cada tela e mensagens mostradas nas capturas.
- **Confiança limitada:** comportamento de teclado e mobile, tempos de carregamento, erros de rede, responsividade, permissões reais e transições que não aparecem nas evidências estáticas.
- **Regra de interpretação:** screenshot comprova aparência, não autorização de servidor nem implementação completa de uma ação.

## O que já funciona como linguagem do produto

O BlindSpot tem uma base funcional de grande valor para uma experiência de pesquisa competitiva: a ficha preserva identidade do veículo, versão, mercado, fontes, estados de qualidade e seções técnicas; a comparação deixa explícitos avisos de contexto; histórico, equipe e consumo expõem capacidades distintas. Essa informação não deve ser simplificada a ponto de ocultar incerteza ou permitir uma decisão enganosa.

Também há consistência de formulário, cards, botões e uso de laranja como ação/destaque. O problema não é falta de dados: é a ausência de uma hierarquia que permita compreender primeiro e aprofundar depois.

## Diagnóstico por jornada

| Jornada | Evidência observada | Problema de experiência | Severidade | Direção de melhoria |
|---|---|---|---|---|
| Login | card estreito isolado em uma tela quase vazia | entrada parece protótipo e não comunica produto, segurança ou próximo passo | Alta | composição de acesso com marca, contexto automotivo permitido e formulário legível |
| Cadastro | formulário longo em uma única etapa | mistura empresa, responsável, credencial e privacidade; aumenta esforço e dificulta correção | Alta | etapas curtas, revisão final e preservação segura do que foi preenchido |
| Espera de aprovação | mensagem textual e botão de atualizar | não informa claramente o que já ocorreu, o estado atual e o que depende do usuário | Alta | timeline de estados reais, suporte e próximo passo explícito |
| Solicitar e ler ficha | formulário, hero estreito e tabela muito longa | o veículo não ancora a leitura; informação decisória aparece com a mesma densidade da informação de detalhe | Alta | workspace da ficha: identidade, resumo e qualidade primeiro; seções progressivas depois |
| Comparar | seleção, filtros, resultados e saída competem na mesma coluna; resultado é uma lista longa | o usuário não consegue ler os dois veículos como pares equivalentes | Crítica | X à esquerda e Y à direita, atributo a atributo, com diferença e proveniência |
| Catálogo | filtros, candidatas e abertura da ficha dividem a tela de forma pouco equilibrada | descoberta, coleção gerada e leitura não têm papéis visuais claros | Alta | filtros + resultados + rail de fichas já geradas, com abertura contextual |
| Histórico | lista densa, hero repetido e fontes detalhadas em uma mesma superfície | bom conteúdo, mas sem priorização entre seleção, contexto e evidência | Média | lista de versões escaneável e detalhe da ficha reutilizando o mesmo workspace |
| Equipe | formulário horizontal muito largo e membros sem estrutura de tabela/ações claras | convite, papel e estado ficam visualmente misturados | Média | listagem de pessoas com colunas, status, ações por linha e convite contextual |
| Consumo | métricas, política e detalhamento em sequência plana | a relação entre consumo, alerta e histórico mensal não é imediata | Média | resumo mensal, status de política e detalhamento progressivo |
| Orientação | modal de primeiro acesso afirma um cenário de protótipo e duplica a descoberta | propósito de produto não está comprovado; a página/fluxo não parece conectado à tarefa atual | Média | inventariar conteúdo; remover a página autônoma somente depois de redistribuir ajuda necessária |

## Achados transversais

1. **Navegação compete com a tarefa.** A sidebar ocupa presença permanente e empurra a área útil, inclusive em fluxos com tabelas extensas. A navegação alvo deve ser superior, responsiva e manter sessão/saída em local previsível.
2. **Densidade sem progressão.** A ficha tem seções e badges corretos, porém os detalhes recebem peso visual semelhante ao resumo. É necessário divulgar qualidade e fonte sem obrigar leitura de centenas de linhas antes de entender o veículo.
3. **Espaço não usado para contexto.** Há grandes áreas vazias simultaneamente a colunas comprimidas. O espaço deve passar a servir ao veículo, aos resultados ou à comparação, não a contêineres inertes.
4. **Ação e consequência pouco conectadas.** Seleção, filtros, exportação, convite e política aparecem próximos de seus controles, mas frequentemente sem explicar pré-requisito, impacto ou próximo passo.
5. **Estados importantes precisam de narrativa.** Cadastro em análise, resultados vazios, incompatibilidade de comparação, ausência de ficha e indisponibilidade precisam explicar o estado e oferecer uma ação segura.
6. **Consistência visual não é ainda um sistema.** Valores e componentes recorrentes existem, mas não há tokens semânticos e contratos de componentes que impeçam divergência na refatoração.

## Requisitos que a refatoração não pode perder

- identidade exata: marca, modelo, versão, ano-modelo e mercado;
- `fonte_ref`, proveniência, completude, conflito, versão e status por variável;
- bloqueio explicado para identidade inconsistente ou comparação inelegível;
- autorização no servidor por sessão, tenant e papel; a UI não autoriza;
- exportação e comparação apenas quando os pré-requisitos reais forem satisfeitos;
- ausência, parcialidade, conflito, não aplicabilidade e erro legíveis sem depender apenas de cor.

## Limites e validações pendentes

- Executar revisão em desktop estreito e mobile depois que houver protótipos/renders da nova linguagem.
- Validar foco de teclado, ordem de leitura, contraste, zoom de 200% e `prefers-reduced-motion` por tela implementada.
- Exercitar estados reais de carregamento, vazio, falha, sem permissão, pendente, aprovado e recusado sem criar dados indevidos.
- Confirmar, no runtime, o conteúdo que pode ser removido de `Orientação` antes de sua retirada.

## Fontes de evidência

- `evidence/ux-ui/current/01-login-e-cadastro/` até `08-orientacao/`;
- `evidence/ux-ui/references/inspiracoes-gerais/references.txt`;
- `evidence/ux-ui/references/login-cadastro/reference.txt`;
- [Fluxograma funcional canônico](fluxograma-desenvolvimento-agente.md).
