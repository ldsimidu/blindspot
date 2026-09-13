# P1-042 — Proposta profunda para a experiência de comparação

> Estado: arquitetura de produto e UX pronta para aprovação humana.
>
> Escopo: seleção, compreensão, evidência e retorno de comparações técnicas X/Y. Não autoriza mudança de API, schema, autorização ou persistência.

## 1. Diagnóstico: a comparação ainda é uma funcionalidade correta com uma jornada fragmentada

As capturas de 2026-09-13 mostram que o problema não é somente estética. A tela atual contém os dados e as ações necessárias, mas distribui a responsabilidade da pessoa usuária entre regiões concorrentes:

1. dois slots vazios, grandes e pouco informativos;
2. uma ação de comparar isolada, entre slots e descoberta;
3. um formulário/lista de descoberta com linguagem e primitives antigas;
4. um rail de análises salvas sem identidade legível;
5. uma página de resultado que começa por contagens e expõe quase 200 linhas antes de estabelecer uma leitura técnica.

O efeito é uma experiência que pede muito esforço antes de devolver entendimento. A pessoa precisa descobrir qual slot está ativo, lembrar o que cada linha representa, supor o que “Comparar fichas” também salva, interpretar filtros de estado, procurar os valores relevantes e, por fim, abrir evidências repetidamente.

O modelo mental correto deve ser simples:

```text
escolher duas versões exatas
→ confirmar o contexto e os limites da comparação
→ entender o retrato factual
→ investigar diferenças e evidências necessárias
→ exportar ou retomar uma análise privada
```

## 2. Verdades de domínio que a experiência não pode distorcer

### 2.1 Comparar não é escolher vencedor

O BlindSpot confronta versões técnicas imutáveis. `igual`, `diferente`, `ausente`, `conflitante` e `não aplicável` descrevem o estado da evidência; não são nota, recomendação, compatibilidade comercial, preço ou superioridade de um veículo.

### 2.2 O runtime atual permite contexto diferente, mas o explicita

O código canônico em `services/api/comparisons.ts` confirma o comportamento atual:

- identidade persistida que contradiz `veiculo_alvo` bloqueia a análise (`422`, `version_identity_inconsistent`);
- mercados distintos são `compatibility_warnings`;
- motorização distinta ou não confirmada também é `compatibility_warnings`;
- a tabela ainda é calculada para comparações com avisos.

Isso substitui a premissa histórica de que mercado ou motorização sempre bloqueiam. A UI deve mostrar o aviso antes do resumo e nunca esconder os mercados/motores de X e Y. Ela não pode transformar o aviso em bloqueio local, nem tratá-lo como selo verde de compatibilidade.

### 2.3 A análise salva é privada; a descoberta de fichas é global autenticada

Fichas candidatas pertencem ao catálogo autenticado global já existente. Já uma comparação salva é tenant-scoped e só pode ser lida por `analyst` e `admin` da organização. A interface não pode chamar fichas do catálogo de “suas”, nem chamar uma análise salva de compartilhada, pública ou recomendada.

### 2.4 A lista de análises salvas tem pouco contexto por contrato

`listarComparacoes` retorna `id`, `created_at`, `left_version_id` e `right_version_id`; não retorna as identidades dos veículos. Portanto, um card de histórico não pode inventar `Ford Ranger × BYD King`, criador, assunto, relevância ou status. Para um histórico identificável, será necessária uma task de contrato/RBAC separada, com resposta mínima e avaliação de segurança.

## 3. Principais falhas encontradas

| Prioridade | Falha | Consequência para a pessoa usuária | Direção de correção |
| --- | --- | --- | --- |
| P0 | Semântica de elegibilidade historicamente divergente do runtime | a interface pode impedir, explicar ou desenhar como inválida uma comparação que o servidor aceita com aviso | alinhar cópia/estados ao contrato v2; bloqueio somente para integridade de identidade e erros reais retornados |
| P0 | Seleção A/B não é compartilhada entre Catálogo, ficha e Comparar | a jornada obriga redescoberta e rompe a continuidade entre superfícies | concluir P1-026 com bandeja local de duas versões, sem persistência e sem contornar servidor |
| P1 | Slots, CTA e descoberta não formam uma sequência espacial | é preciso inferir qual lado está ativo e por que o CTA está desabilitado | montar uma composição única slots → condição → descoberta contextual |
| P1 | Resultado abre como planilha estreita | diferenças, limites e evidências competem; a pessoa perde o objeto de comparação durante leitura longa | cabeçalho persistente X/Y, resumo factual, grupos e detalhe progressivo em largura útil |
| P1 | “Diferenças em foco” destaca os primeiros campos por ordem técnica | mesmo com disclaimer, a posição dominante sugere importância que o contrato não fornece | substituir por mapa de grupos e filtros factuais, ou chamar explicitamente de primeiras diferenças dentro de um módulo secundário |
| P1 | Histórico salvo é uma rail alta com cartões genéricos | desperdiça área e não permite reconhecer uma análise antes de abri-la | mover para seção compacta de acesso; criar melhoria de contrato se identificação for necessária |
| P2 | Controles e superfícies de legado quebram o sistema | botões claros, chips e tabelas discordam dos temas dark/warm-light e do padrão Catalog | migrar para tokens `--app-*`, `UiButton`, `UiField` e estados acessíveis existentes |
| P2 | Evidência é repetida em cada linha como microação | aumenta ruído em centenas de atributos e compromete escaneabilidade | exibir resumo de referências junto ao valor e abrir painel de evidência apenas sob demanda |

## 4. Arquitetura de jornada proposta

### 4.1 Seleção é uma jornada, não um formulário com lista abaixo

O estado inicial deve apresentar dois objetos em relação explícita:

```text
Ficha X (ativa ou preenchida)  ←→  VS  ←→  Ficha Y (ativa ou preenchida)
```

Cada slot tem a mesma área e mostra:

- papel `Ficha X` ou `Ficha Y`;
- identidade completa quando disponível: marca, modelo, versão, ano-modelo, mercado e versão técnica;
- frase curta de próximo passo quando vazio;
- estado de foco/seleção também por texto (“Você está preenchendo a ficha X”), não apenas borda laranja;
- ação secundária de trocar/remover, jamais um descarte silencioso.

Depois dos slots, uma faixa de decisão mantém CTA e condição no mesmo bloco:

- vazio: `Selecione uma ficha para cada lado`;
- completo: `Comparar e salvar análise` + “O servidor validará a integridade e salvará uma análise privada.”;
- carregando: “Validando e salvando comparação”, sem porcentagem ou simulação de etapas;
- bloqueado: alerta persistente com a identidade de ambos os lados preservada e ações de trocar/remover.

### 4.2 A descoberta deve operar em favor do slot ativo

A descoberta não é um segundo produto dentro da página. Ela recebe um título contextual como `Escolha a ficha X` e cada card possui uma única ação compatível: `Adicionar como ficha X`. Ao trocar o slot, o mesmo catálogo passa a dizer `Adicionar como ficha Y`.

O padrão visual deve reutilizar a linguagem adotada no Catálogo:

- busca por identidade em uma linha de comando;
- filtros detalhados sob disclosure;
- `Última por veículo` / `Todas as versões` como escopo explícito;
- separação entre valores em edição e busca aplicada;
- galeria responsiva de candidatas, e não lista de linhas;
- identidade, mercado, versão técnica e data visíveis;
- candidata sem versão técnica explicita impossibilidade de comparação;
- terceira ficha não substitui X/Y: mostra capacidade completa e direciona para troca explícita.

### 4.3 A seleção deve sobreviver à navegação de produto durante a sessão

O fluxo ideal começa muitas vezes fora da tela Comparar. P1-026 deve entregar uma bandeja de comparação em memória para `analyst`/`admin`:

```text
Catálogo ou ficha exata
→ adicionar X ou Y
→ bandeja mostra 1/2 ou 2/2
→ Ir para comparar
→ ComparisonPanel recebe a mesma seleção
```

Limites obrigatórios:

- exatamente duas versões;
- somente `CatalogCandidate` retornada pelo servidor;
- sem `localStorage`, URL, compartilhamento, histórico pessoal ou payload técnico;
- recarregar/logout limpa a seleção;
- servidor continua validando papel, UUIDs, integridade e comparação.

P1-042 deve consumir esse fluxo quando P1-026 for concluída; não deve duplicar uma segunda seleção local incompatível.

### 4.4 Análises salvas são acesso secundário, não concorrente da seleção

No contrato atual, o bloco deve ser `Análises salvas recentemente` após a descoberta, em auto-fit de itens densos com data real e `Abrir análise`. Ele não recebe uma altura fixa nem ocupa rail permanente.

Para transformar histórico em objeto de trabalho reconhecível, abrir task posterior de contrato que retorne, somente para a própria organização autorizada, a identidade mínima X/Y e números de versão já presentes na análise. Essa mudança requer arquitetura de API, RBAC, enumeração/IDOR e revisão proporcional de privacidade; não cabe em refatoração visual.

## 5. Arquitetura de leitura de uma análise salva

### 5.1 Ordem de leitura obrigatória

```text
contexto X/Y e ações
→ avisos factuais do servidor
→ panorama da análise
→ filtro/consulta local
→ grupos técnicos
→ atributo X/Y
→ fonte e observação sob demanda
```

Essa ordem deixa o usuário saber *o que está vendo* antes de processar centenas de linhas.

### 5.2 Contexto persistente

No topo, dois blocos simétricos preservam X e Y durante leitura. Eles apresentam os mesmos campos e não diminuem o lado direito. `VS` é separador, não métrica. `Nova comparação` retorna à seleção sem apagar histórico. Exportações CSV/JSON ficam agrupadas à direita e somente aparecem porque a análise já está salva e autorizada.

Avisos do servidor (`market_mismatch`, `motorization_mismatch`, `motorization_not_confirmed`) vivem logo abaixo da identidade. Eles explicam contexto, não interrompem a leitura. O único bloqueio real não chega a esse estado: mantém a pessoa no fluxo de seleção.

### 5.3 Panorama factual, sem dashboard inventado

Substituir cartões brancos e métricas soltas por uma única superfície de resumo:

- total de atributos analisados;
- contagens reais de iguais, diferentes, ausentes, conflitos e não aplicáveis;
- cada contagem é filtro local acessível e deixa claro que é uma contagem, não uma nota;
- o filtro selecionado possui texto e `aria-pressed`, não depende da cor;
- nenhuma porcentagem, completude, saúde, vencedor ou “melhor escolha”.

Não promover os “primeiros quatro diferentes” a destaque principal. Quando existir, pode haver um módulo secundário chamado `Primeiras diferenças retornadas`, com ordem estável declarada. A opção preferencial é usar a distribuição por grupos de apresentação, porque ela orienta sem sugerir relevância que não existe no contrato.

### 5.4 Exploração progressiva

A toolbar une busca por rótulo, filtro de diferença e opção de ocultar somente linhas sem informação em ambos os lados. Ela não consulta novamente o servidor nem persiste preferências. Em desktop fica sticky dentro do conteúdo, sem competir com a navegação; em mobile volta ao fluxo normal.

Os grupos são uma taxonomia de apresentação local e explícita, com fallback `Outras especificações`. O nome do grupo não deve fingir ser categoria persistida ou filtro de domínio. Cada grupo exibe contagem de atributos e diferenças derivadas do próprio array.

No desktop, cada linha ocupa quatro regiões:

| Região | Conteúdo |
| --- | --- |
| Atributo | rótulo humano e caminho técnico secundário |
| Ficha X | valor, unidade, status e total de referências |
| Ficha Y | valor, unidade, status e total de referências |
| Comparação | estado textual e ação de evidência quando houver |

O cabeçalho da tabela permanece visível durante o grupo aberto. Em tablet, o caminho técnico e a contagem de fontes podem migrar para detalhe expansível. Em mobile, cada atributo vira bloco: rótulo + estado comparativo → Ficha X → Ficha Y → evidência; não existe tabela horizontal ou swipe obrigatório.

### 5.5 Evidência como aprofundamento, não ruído

Cada valor continua informando status humano, unidade e número de referências. `Ver evidências` expande uma região abaixo do atributo com títulos de fontes e observações existentes. Não abrir tooltips que escondam informação decisória nem repetir texto técnico em todos os campos quando não há fonte.

## 6. Estados que precisam de composição própria

| Estado | Composição correta | Reprova se |
| --- | --- | --- |
| nenhum slot | X/Y visíveis, indicação do lado ativo e descoberta contextual | CTA isolado ou slots grandes sem próximo passo |
| um slot | identidade selecionada + destaque textual do lado restante | a pessoa não sabe qual lado preencher |
| dois slots | CTA e consequência de salvar análise próximos | comparação parece automática ou sem persistência |
| validação | CTA com estado factual e slots estáveis | barra/contador inventado ou slots desaparecem |
| integridade bloqueada | alerta persistente, X/Y legíveis, trocar/remover | tabela/resumo parcial ou diagnóstico culpabilizador |
| comparação com avisos | X/Y + avisos antes do panorama | aviso vira bloqueio visual ou se perde no rodapé |
| zero diferenças | panorama afirma o fato e permite inspeção dos grupos | diferença inventada para preencher a tela |
| ausência/conflito/não aplicável | texto, status e evidência próximos ao lado correspondente | cor isolada ou vencedor automático |
| histórico vazio | explicação curta e ação de montar a primeira | rail alto e vazio |
| erro de histórico | erro local, nova tentativa, seleção preservada | erro interrompe uma comparação em andamento |

## 7. Responsividade, acessibilidade e qualidade de interface

### Desktop (1440 e acima)

- seleção X/VS/Y em duas colunas equivalentes;
- descoberta em largura integral; galeria com três cards;
- histórico em linha abaixo;
- resultado em largura útil do shell, não limitado a 940–1440 px dentro de um canvas maior;
- tabela só aparece quando as quatro colunas preservarem leitura real.

### Tablet (768–1024)

- X/Y permanecem lado a lado se seus textos couberem; caso contrário, quebram para pilha mantendo `VS` entre eles;
- galeria passa para duas colunas;
- toolbar quebra em duas linhas; grupos continuam expandidos de maneira controlada;
- histórico desce sem virar rail.

### Mobile (390)

- slots empilhados, cada um com rótulo de lado completo;
- CTA ocupa a largura do conteúdo, não o viewport inteiro sem margem;
- cards e histórico em uma coluna;
- atributos em blocos sequenciais, nomes X/Y repetidos junto aos valores;
- evidências expansíveis, foco e ordem de teclado previsíveis.

### Regras de acessibilidade

- `aria-current` ou texto equivalente para slot ativo;
- rótulo completo de cada CTA (“Adicionar Ford Ranger Raptor como ficha X”);
- foco retorna ao slot quando uma candidata é adicionada e ao gatilho quando evidência/accordion fecha;
- alertas de bloqueio têm `role=alert`; avisos de contexto usam `role=status` e texto completo;
- contraste de texto e placeholder atende ambos os temas; controles nativos não aparecem brancos em dark;
- `prefers-reduced-motion` remove deslocamentos de slots/accordions sem remover contexto ou foco.

## 8. Plano de entrega recomendado

### Fase A — verdade de fluxo e foundation de seleção

1. Atualizar cópia e estados para o contrato atual de avisos versus bloqueio.
2. Implementar P1-026: seleção compartilhada em memória entre Catálogo, leitura de ficha e Comparar.
3. Adaptar `FichaDiscovery` ou extrair um adaptador visual para comando + galeria, preservando consulta, paginação e escopo.
4. Refatorar os slots e CTA de `ComparisonPanel` sobre `UiButton`/`UiField` e tokens `--app-*`.

### Fase B — resultado legível e auditável

1. Ampliar canvas e contexto X/Y persistente.
2. Substituir o resumo/tabela de legado por panorama factual, toolbar e grupos progressivos.
3. Reorganizar linhas/evidências e validar os estados de ausência, conflito e não aplicável.
4. Mover histórico para seção inferior compacta, mantendo o contrato mínimo atual.

### Fase C — validação e possíveis expansões separadas

1. Capturas sanitizadas 1440, 1024, 768 e 390 nos modos dark/warm-light.
2. Smoke real de aviso, bloqueio de identidade, troca de slot, terceiro item, reload/logout, filtro, evidência, exportação e teclado.
3. Somente após isso, decidir se o histórico precisa de identidade X/Y. Se sim, abrir task própria de API e segurança; não adicionar “por conveniência” na UI.

## 9. Critérios de aceite da proposta

- Em cinco segundos, a pessoa identifica X, Y, o lado ativo e a ação que falta.
- Nenhuma busca em edição altera o título/contagem de uma consulta já aplicada.
- Um aviso de mercado/motorização é visível e não vira bloqueio local; identidade inconsistente não chega a resumo/tabela.
- A primeira viewport da análise informa contexto e distribuição factual antes do detalhe.
- A leitura dos atributos preserva valor, unidade, status e fontes sem tabelas ilegíveis ou scroll horizontal em mobile.
- Não há imagens genéricas, score, vencedor, ranking de diferenças, dados de histórico inventados, persistência de seleção ou nova superfície de autorização.
- Dark e warm-light mantêm composição, contraste, estado de foco e semântica idênticos.

## 10. Decisão requerida

Esta proposta recomenda que P1-042 seja implementada em duas etapas visuais, dependente da seleção compartilhada da P1-026. A mudança de contrato para tornar o histórico identificável fica conscientemente fora desta execução.
