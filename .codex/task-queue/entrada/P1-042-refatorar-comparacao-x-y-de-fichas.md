# 🚧 Em execução — redesenhar comparação X/Y em camadas

> Prioridade: P1
>
> Área afetada: interface, comparação e exportação contextual
>
> Origem ou referência: UX-BS-003; P1-017; referência de comparação em `evidence/ux-ui/references/inspiracoes-gerais/`
>

## Execução da Fase A — 13/09/2026

- Implementada a seleção compartilhada e transitória de duas fichas, com slots X/Y, descoberta em galeria e CTA só habilitado quando a dupla está completa.
- A próxima fase permanece limitada ao redesenho da análise salva em camadas; contratos da API, histórico, exportações e critérios do servidor não foram alterados nesta fase.

## Execução da Fase B — 13/09/2026

- A leitura salva foi reestruturada para iniciar pelos dois veículos reais; `Ficha X` e `Ficha Y` agora são apenas âncoras discretas de leitura.
- O topo reúne retorno e exportações, identidade simétrica, aviso factual do servidor e um panorama de contagens filtráveis, sem score, vencedor ou porcentagem inventada.
- O antigo destaque de primeiras diferenças foi substituído por mapa factual de áreas técnicas; a leitura detalhada continua progressiva por grupos, com busca, filtros e evidências sob demanda.
- A interface reutiliza tokens e primitives do sistema nos controles novos. API, persistência, RBAC, histórico e payload de exportação permanecem inalterados.
- Verificações: `npm run typecheck`, `npm run build` e `git diff --check`.
- Pendente: checkpoint de primeira renderização com evidência humana em desktop e mobile antes de encerrar a task visualmente.

## Refinamento após evidência — 13/09/2026

- Corrigidos accordions e ações de legado que escapavam para superfícies claras no tema dark; exportações, evidências e grupos agora usam a linguagem de controles do sistema.
- A navegação por área passa a abrir um único grupo e rolar até ele, respeitando `prefers-reduced-motion`; filtros exibem suas contagens factuais.
- Valores numéricos confirmados e comparáveis recebem delta. O tom verde marca somente o maior valor em atributos cujo aumento é semanticamente interpretável (como potência, torque e capacidade); não significa vencedor, recomendação ou maior qualidade.
- Verificações repetidas: `npm run typecheck`, `npm run build` e `git diff --check`.
> Arquitetura: `APPROVED — Lucas autorizou a composição revisada em 2026-09-12`
>
> Triagem automática: `Material — elegibilidade e leitura comparativa`
>
> Segurança: `Aplicável se tocar análise salva, exportação, autorização ou endpoints`

## Pedido

Refatorar seleção e leitura de comparação para veículos X e Y lado a lado por atributo, sem diluir bloqueios, fontes ou diferenças de qualidade.

## Critérios de aceite

- [ ] Seleção deixa claro o papel de X e Y, a versão e o mercado de cada ficha.
- [ ] Comparação elegível alinha valor, unidade, status, fonte e diferença por atributo.
- [ ] Bloqueio por identidade, mercado ou motorização é explicado sem exibir comparação inválida.
- [ ] Ausência, conflito e não aplicabilidade não recebem vencedor automático.
- [ ] Exportar/salvar aparecem apenas quando o contrato atual permitir.

## Restrições ou contexto

- Reutilizar a decisão de elegibilidade do servidor; a UI não pode reimplementar ou contornar a regra.
- Não alterar contratos de análise salva ou exportação nesta task sem gate adicional.
- Garantir alternativa compacta acessível para viewport pequeno.

## Arquitetura visual, segurança e composição — 2026-09-12

### Fatos confirmados

- A captura `evidence/ux-ui/current/03-compara-fichas-tecnicas/screencapture-localhost-5173-2026-09-11-02_43_11.png` mostra seleção A/B, descoberta e análises salvas comprimidas na faixa esquerda, com o painel de comparação vazio ocupando a maior parte da tela. A comparação existente usa linhas verticais de texto, não uma leitura simétrica X/Y.
- `ComparisonPanel` já mantém no máximo duas candidatas com `latestTechnicalSheetVersionId`, cria comparação/salva no servidor, lista análises privadas e exporta somente uma comparação salva. `comparison-contract-v1` é a fonte de verdade para compatibilidade, diferenças, fontes, unidade e status.
- P1-017 bloqueia no servidor mercado diferente, motorização ausente/divergente e identidade persistida inconsistente. Quando incompatível, não existe tabela parcial nem vencedor. P1-018 limita exportação CSV/JSON a análise salva autorizada de `analyst|admin` do tenant, sem link, arquivo persistido ou compartilhamento externo.
- A referência `ef8dfe53-1267-4474-94c3-3d2aa1388dc8-506436c8-3155-4f5c-9.jpg` ensina simetria carro X/carros Y e atributos alinhados. Ela é publicidade de concessionária e não autoriza copiar preço, marca, fotos, apelo comercial, marcação de "não tem" ou declaração de vencedor.
- Não há imagem de veículo aprovada para identidade exata. Esta task é `NO_IMAGE`; identidade é textual, composta por marca/modelo/versão/ano/mercado e versão técnica. P1-043 continua dona de imagem/asset.

### Decisão e escopo

Refatorar `ComparisonPanel` como um workspace de duas etapas: **seleção explícita** e **resultado comparativo salvo**. A primeira mostra dois slots simétricos, descoberta existente e análises salvas; a segunda usa toda a largura para X à esquerda e Y à direita por atributo. O estado transitório de seleção continua local; a análise, compatibilidade, fontes, diferenças e exportação continuam vindo do servidor.

Esta task altera somente apresentação, organização e estado efêmero da interface. Não altera endpoints, payload de dois UUIDs, algoritmo/contrato de comparação, RBAC, tenant, exportação, conteúdo exportado, persistência, auditoria, schema, imagem ou provider. A UI nunca tenta prever compatibilidade a partir de mercado/motor exibidos nem chama uma comparação sem exatamente dois IDs existentes.

### Pessoa usuária, objetivo e fluxo

- **Pessoa:** `analyst` ou `admin` autorizado que quer avaliar duas versões imutáveis, sem transformar a leitura em recomendação comercial.
- **Objetivo:** selecionar X e Y com identidade inequívoca, entender um bloqueio real ou escanear diferenças com fontes/status preservados e exportar apenas análise salva autorizada.
- **Fluxo:** entrar → slots X/Y vazios → descobrir candidatas existentes → preencher/remover slot explícito → comparar e salvar → servidor devolve análise ou bloqueio → em sucesso, visualizar X/Y por seção/atributo → exportar CSV/JSON ou abrir análise privada salva → começar nova seleção quando necessário.
- **Regra de bloqueio:** erro `422` e seus códigos seguros aparecem como painel persistente logo após a ação. A UI mantém os slots e oferece trocar/remover ficha; não monta a tabela, não aponta culpado nem sugere alternativa automaticamente.

### Especificação visual da tela

**Seleção (desktop, 12 colunas):**

1. Cabeçalho de comparação com título e instrução curta: a tarefa é comparar versões, não escolher melhor veículo.
2. Faixa X/Y em largura integral: dois cartões de slot equivalentes, separados por marcador textual `X × Y`. Cada slot mostra identidade completa e versão técnica quando preenchido, ou instrução de seleção quando vazio. Remover é ação secundária do próprio slot; nenhum lado recebe cor, tamanho ou peso superior.
3. Ação `Comparar e salvar análise` fica abaixo da faixa, desabilitada até existirem exatamente dois IDs; loading descreve que o servidor está validando e salvando, sem barra percentual fictícia.
4. Descoberta ocupa a região principal abaixo: reutiliza somente os controles e limites já aprovados de `FichaDiscovery`, apresentados como lista/grid de candidatas; cada ação anuncia explicitamente se preenche X ou Y. Um estado de seleção completa não transforma as outras fichas em incompatíveis — apenas informa que é preciso remover/substituir um slot.
5. Comparações salvas aparecem em rail discreto (3 colunas) no desktop, listado como análises privadas da organização atual. Não expõe criador, tenant, conteúdo antes da abertura ou acesso de outro tenant.

**Resultado comparativo salvo:**

1. Hero compacto e simétrico com veículo X à esquerda e Y à direita: marca/modelo/versão, ano-modelo, mercado e número de versão. Sem imagem, preço, ranking, nota ou favorito.
2. Avisos de contexto confirmados pelo servidor aparecem acima dos atributos, com linguagem factual. Se uma incompatibilidade bloqueia, este estado nunca é renderizado.
3. Cada seção técnica contém uma grade de três regiões: valor/evidência X, rótulo do atributo/diferença descritiva ao centro, valor/evidência Y. Cada lado preserva valor, unidade, status textual/ícone, `source_refs` e observação disponível. Diferença só usa `igual`, `diferente`, `ausente`, `conflitante` ou `não aplicável`; nunca melhor/pior.
4. Exportar CSV/JSON aparece somente para comparação salva carregada e usa os mesmos callbacks/rotas autorizadas. Ação de começar nova comparação retorna à seleção sem apagar análises salvas.

**Superfícies, tipografia e densidade:** fundo quente-neutro, superfícies claras, bordas sutis e laranja apenas em ação/foco/detalhe de marca. X e Y usam exatamente os mesmos tokens; status de qualidade mantém cor semântica mais texto/ícone. Atributos não viram cards iguais repetidos: seções e linhas estruturadas organizam densidade. A comparação deve parecer ferramenta técnica automotiva, não publicidade, tabela ERP ou dashboard de telemetria.

**Responsividade:** em tablet (8 colunas), seleção permanece X/Y em duas colunas e rail de salvas desce abaixo da descoberta. Em mobile (4 colunas), X e Y continuam claramente nomeados, mas empilham; para cada atributo, rótulo aparece primeiro e valores X/Y ficam em blocos sucessivos com o nome do lado repetido. Não há tabela horizontal espremida, ordem visual ambígua ou dependência exclusiva de swipe.

### Estados, acessibilidade e movimento

- `loading` de descoberta, comparação e análise salva declara a região/ação em curso. A interface estática continua operável quando não há animação.
- `vazio` de catálogo, slots vazios, análise salva ausente e lista privada sem comparações recebem mensagens e próximo passo específicos.
- `erro` de busca/releitura é local à região; bloqueio de comparação é persistente perto de slots/CTA; toast só complementa sucesso ou falha confirmada, sem deslocar layout.
- Foco segue cabeçalho → slots X/Y → CTA → descoberta → salvas. Slots e candidatas têm nomes acessíveis completos; ações de remover e exportar incluem o alvo. Leituras de fonte/status não dependem de tooltip ou cor.
- Usar somente recipes existentes de controles, toast e transição contextual entre seleção/resultado; sem ambient, imagem, shimmer, animação de preço ou efeito que sugira análise em andamento antes da resposta.

### Impacto técnico, segurança e conformidade

- Arquivos previstos: `apps/web/src/ComparisonPanel.tsx`, CSS local de comparação, possivelmente um componente visual auxiliar e esta task. `FichaDiscovery` só pode receber props visuais/adaptador se mantiver contrato e comportamento em Catálogo/Comparar; não duplicar endpoint nem filtros.
- Reutilizar exclusivamente `criarComparacao`, `listarComparacoes`, `obterComparacao`, `exportarComparacao` e descoberta já existentes. Nenhum novo request, query param, armazenamento, `localStorage`, imagem ou dado de comparação é criado.
- **Segurança: não aplicável nesta refatoração prevista.** A UI consome endpoints já autenticados e autorizados; não altera RBAC, tenant, ID de recurso, exportação, contrato HTTP ou resposta. Reabrir `project-security-assurance` se a implementação tocar análise salva, exportação, endpoint, cabeçalho, persistência, log, acesso ou compartilhamento.
- **Conformidade: não aplicável.** Não há coleta, perfil, transferência, retenção, terceiro ou dado pessoal novo. A lista de salvas permanece com os campos já autorizados pelo contrato privado.

### Plano incremental e verificações

1. Reestruturar seleção X/Y e descoberta reutilizando dados/ações atuais, sem mudar pedido de comparação.
2. Executar checkpoint PEK de primeira renderização no estado de dois slots preenchidos em 1440, 768 e 390 px antes de polir resultado/exportação.
3. Reestruturar resultado salvo por seção e linha X/atributo/Y; preservar dados de fonte/status/diferença que o servidor devolve.
4. Integrar bloco de incompatibilidade e rail de salvas, sem renderizar resultado inválido.
5. Rodar `npm run typecheck`, `npm run build`, `git diff --check` e smoke sanitizado de slots, seleção completa, incompatibilidade, aviso, ausência, conflito, não aplicável, análise salva, exportação autorizada, teclado e reduced motion.

### Double-check da arquitetura

- A área vazia observada é substituída por seleção e comparação com responsabilidades claras; slots, descoberta e salvas não competem numa coluna estreita.
- A simetria da referência é traduzida em equivalência X/Y, não em carro/imagem/preço/vencedor publicitário. Sem asset aprovado, o texto de identidade é mais honesto que fotografia genérica.
- Bloqueio permanece precedência sobre composição: resultado não é parcial, e a UI não reimplementa compatibilidade nem infere motor/mercado.
- Fonte, unidade, status, ausência, conflito e não aplicabilidade ficam ligados a cada lado do atributo; diferença é descritiva e não recomendatória.
- Falha se qualquer lado ganhar destaque estrutural, se exportação aparecer antes de análise salva autorizada, se a versão/mercado sumir, se o mobile reduzir X/Y a tabela ilegível ou se o resultado ignorar a proveniência devolvida.

### Architecture Gate

`SUPERSEDED — arquitetura base autorizada em 2026-09-12 e implementada parcialmente; a composição foi reaberta pelo redesign recebido na mesma data.`

## Resultado do agente

- Estado histórico: `🚧 Em execução` antes da reabertura visual abaixo.
- Arquitetura histórica: `APPROVED — Lucas autorizou a implementação em 2026-09-12`; substituída pela arquitetura reaberta abaixo.
- Triagem automática: `Material — elegibilidade e leitura comparativa`.
- Segurança: `Não aplicável — refatoração visual reutiliza endpoints, RBAC, tenant e exportação existentes; reavaliar se expandir a fronteira`.
- Implementação: concluída em código. `ComparisonPanel` agora organiza a seleção em slots equivalentes X/Y, reutiliza a descoberta e as comparações privadas já existentes, mantém bloqueios do servidor junto ao CTA e mostra a análise salva em linhas X / atributo-diferença / Y. A exportação continua disponível somente para uma análise salva carregada.
- Arquivos alterados: `apps/web/src/ComparisonPanel.tsx`, `apps/web/src/comparison-workspace.css` e esta task.
- Verificação: evidência atual, referência de comparação, análise geral de referências, P1-017/P1-018, fluxo canônico, Design System, Image System e contratos atuais do componente/API foram revisados. `npm run typecheck`, `npm run build` e `git diff --check` passaram em 2026-09-12.
- Pendência para conclusão: checkpoint PEK visual com renderizações reais em 1440, 768 e 390 px; validar por teclado slots/CTA/descoberta/salvas, um bloqueio `422`, aviso, ausência/conflito/não aplicável e exportação autorizada. Sem essas evidências, a task permanece em execução.

## Arquitetura visual reaberta — comparação orientada à síntese (2026-09-12)

### Motivo da reabertura e fatos confirmados

- O feedback humano consolidado em `C:\Users\lucas\Downloads\blindspot_redesign_comparacoes.md` tem precedência sobre a arquitetura anterior: a experiência deve ajudar a **entender** a comparação antes de expor a lista completa de atributos.
- A implementação em código atual já cria uma base legítima de slots X/Y e leitura simétrica, mas ainda inicia o resultado pela lista integral de campos. Portanto, ela não deve ser aceita visualmente como a experiência final descrita no documento.
- O contrato atual disponibiliza, para uma comparação salva, identidade/versão das duas fichas, `fields`, `difference`, `value`, `unit`, `status`, `source_refs`, `observation` e avisos de compatibilidade. Ele **não** disponibiliza categoria de variável, relevância, confiança percentual, classificação de fonte oficial, nome editável de análise, exclusão, URL compartilhável ou exportação PDF.
- A comparação continua privada por organização, autenticada e autorizada a `analyst|admin`; o servidor é a única fonte de elegibilidade e de diferenças. A UI não deve declarar progresso factual que o endpoint não expõe.

### Escopo desta reabertura e não-escopo

**Entra na P1-042, com o contrato atual:** nova hierarquia de seleção; slots X/Y com marcador `VS`; CTA com intenção separada de salvar; resumo derivado dos `fields` devolvidos; busca local por rótulo; filtros locais de diferença; ocultação opcional de linhas vazias nos dois lados; nomes humanos para estados; resultado em disclosure progressivo por grupos de apresentação explícitos; cabeçalho/contexto X/Y e toolbar sticky; fontes e observações expansíveis quando existirem; rail de salvas legível sem UUID como título principal; exportação CSV/JSON agrupada em controle único, ainda usando callbacks existentes.

**Fica fora e exige task/gate próprio:** categoria canônica persistida ou pesquisável, relevância/`criticalDifference`, confiança percentual, selo de fonte oficial, renomear/duplicar/excluir comparação, persistir filtros/posição, URL compartilhável, PDF/XLSX, comentários, comparação de mais de duas fichas e qualquer nova imagem/asset. Até que exista dado confiável, a UI não inventa percentuais, importância, oficialidade ou agrupamentos que pareçam classificação do servidor.

### Pessoa usuária, objetivo e fluxo

- **Pessoa:** analista ou administradora autorizada que precisa confrontar duas revisões técnicas sem recomendação ou vencedor automático.
- **Objetivo:** entender em poucos segundos o escopo, os limites e as divergências da análise; aprofundar apenas nas variáveis necessárias e sempre recuperar valor, unidade, estado e proveniência de ambos os lados.
- **Fluxo:** abrir comparação → selecionar X e Y ou abrir uma análise privada → servidor valida/salva → cabeçalho simétrico → resumo factual calculado dos campos retornados → principais diferenças derivadas apenas de uma lista neutra e limitada → busca/filtros locais → grupos expansíveis → evidência por célula → exportar formato permitido ou iniciar nova comparação.
- **Bloqueio:** se o servidor retornar incompatibilidade, a tela conserva os slots, explica o limite perto da CTA e oferece apenas remover/trocar; não exibe resumo, ranking, preview parcial ou sugestão de veículo.

### Referências e princípios traduzidos

- `blindspot_redesign_comparacoes.md`: aplicar “resumo primeiro, detalhes depois”, densidade controlada, nomes humanos e exploração progressiva. Não copiar uma paleta dark como substituição automática do Design System atual nem prometer métricas sem contrato.
- `evidence/ux-ui/references/inspiracoes-gerais/ef8dfe53-1267-4474-94c3-3d2aa1388dc8-506436c8-3155-4f5c-9.jpg`: aplicar simetria X/VS/Y e leitura lado a lado. Não usar preço, fotografia de veículo não comprovada, marca de terceiro, apelo de concessionária ou vencedor.
- `references.txt` e `analise-referencias-visuais-blindspot.md`: aplicar objeto/identidade antes de tabela, revelação progressiva e superfície técnica calma. Não transformar comparação em dashboard administrativo, telemetria ou publicidade.
- Design System e Image System: manter preto/branco/laranja e status semântico, superfícies estáveis e `NO_IMAGE`; o foco da comparação é dado verificável, não mídia decorativa.

### Composição alvo

**Canvas desktop (1440 px):** contêiner de até `1440px`, padding de 32px (48px em telas muito largas), uma coluna de leitura principal. A seleção ocupa toda a largura: dois slots equivalentes, cada um em seis colunas, com disco `VS` central sobre a divisão. Abaixo, CTA central com frase de elegibilidade; descoberta usa 8 colunas e rail de análises salvas 4, sem deixar uma região vazia sem responsabilidade.

**Resultado salvo:**

1. Cabeçalho compacto com voltar/nova comparação, identidade textual completa de X e Y, `VS`, versões e mercados. Ações de exportação ficam em um único menu sem oferecer formatos futuros.
2. Bloco de resumo factual: total de campos e contagens de igual/diferente/ausente/conflitante/não aplicável, derivadas somente do array recebido. Métricas funcionam como filtros locais e possuem rótulo textual, nunca só cor.
3. Faixa de “diferenças em foco” mostra no máximo os primeiros atributos `different` por ordem estável do contrato, sem chamá-los de críticos ou mais importantes. Se não houver diferença, explicita esse fato.
4. Toolbar sticky abaixo do cabeçalho: busca por rótulo, controle segmentado Todos/Diferentes/Iguais/Ausentes/Conflitos e opção para ocultar linhas vazias nos dois lados. Ela filtra no cliente a análise já autorizada, sem novo request ou persistência.
5. Conteúdo progressivo em grupos de apresentação, com accordion. A categoria será mapeada localmente apenas por um dicionário explícito de prefixes/caminhos já existentes e cada grupo não mapeado cai em “Outras especificações”; isso é organização visual, não taxonomia nova nem filtro de domínio. O grupo apresenta total e contagens derivadas.
6. No desktop, cada linha tem quatro regiões: especificação (primeira e larga), valor/evidência X, valor/evidência Y, e badge de diferença. Cabeçalhos X/Y ficam sticky com nome real do veículo; “Ficha X/Y” não se repete por linha. Valores e fonte são expansíveis, preservam texto humano de status e observação quando houver.

**Tablet (768 px):** slots permanecem em duas colunas; discovery/rail tornam-se uma coluna principal e rail abaixo. A tabela mantém especificação, X, Y e status com metadados recolhidos para a expansão; toolbar pode quebrar em duas linhas sem se sobrepor.

**Mobile (390 px):** slots e cabeçalho X/Y empilham com `VS` legível; a toolbar vira coluna. Cada atributo vira bloco: especificação e diferença primeiro, depois veículo X e veículo Y identificados por nome real. Não há tabela horizontal nem dependência de swipe.

### Estados, acessibilidade e movimento

- Estados humanos: `Confirmado`, `Não encontrado`, `Não aplicável`, `Conflitante`, `Estimado` e `Inferido`; o status do dado é separado do status comparativo (por exemplo, ambos confirmados e ainda diferentes).
- `loading` usa mensagem neutra de “validando e salvando comparação”; não simula etapas internas. Uma análise já carregada pode usar skeleton apenas na região cuja resposta realmente está pendente.
- Vazio de descoberta e de salvas orienta próxima ação; fontes ausentes e valores sem informação permanecem explícitos. O alerta de incompatibilidade é persistente; toast só complementa, sem deslocar layout.
- Cabeçalhos, accordions e fonte expansível recebem semântica/botões reais, `aria-expanded`, foco visível e texto acessível. Cor nunca é o único canal. A ordem de teclado acompanha resumo → filtros → grupos → linhas → evidências → exportação.
- Movimento limita-se a transição curta de slot, `VS` e accordions (180–220ms) com equivalente estático em `prefers-reduced-motion`; nenhuma linha em massa, scroll, loop ou progresso simulado é animado.

### Impacto técnico, segurança e verificações

- Arquivos previstos: `ComparisonPanel.tsx`, CSS local, eventualmente componentes locais de comparação e esta task. Não alterar `api.ts`, `types.ts`, serviços, schema ou exportação nesta etapa.
- **Segurança: não aplicável ao recorte atual.** O redesenho consome análise já autorizada; não muda autenticação, autorização, tenant, endpoint, exportação, dado sensível, dependência ou persistência. Reabrir `project-security-assurance` ao tocar qualquer item de não-escopo.
- **Conformidade: não aplicável.** Não cria coleta, perfil, compartilhamento, retenção ou transferência nova.
- Verificar: `npm run typecheck`, `npm run build`, `git diff --check`; smoke manual de seleção, bloqueio 422, análise sem diferenças, ausência em ambos, conflito, fonte/observação, filtros, accordion, exportação existente, teclado, reduced motion e renderizações reais em 1440/768/390 px.

### Double-check visual

- O resumo é derivado, não uma alegação de qualidade/critério ainda indisponível; “diferenças em foco” não é ranking.
- A especificação recebe mais largura que na arquitetura anterior e a identidade dos veículos não se perde durante o scroll.
- Nenhuma região depende de imagem, de cor isolada ou de um UUID truncado para explicar a análise.
- Grupos locais mantêm fallback explícito e não substituem futura taxonomia persistida; filtros não alteram ou escondem dado permanentemente.
- Bloqueio ainda tem precedência sobre qualquer resumo; exportação não se amplia e permanece vinculada a análise salva autorizada.

### Decisão humana

`APPROVED — Lucas autorizou a implementação da composição revisada em 2026-09-12.`

## Resultado da reabertura

- Estado: `🚧 Em execução — implementação concluída; checkpoint visual pendente`.
- Entregue: seleção com slots X/Y ativos e marcador VS; resumo calculado a partir de `fields`; diferenças em foco sem ranking; busca e filtros locais; agrupamento de apresentação com accordions; cabeçalhos de veículos e valores X/Y; nomes humanos para status; evidências expansíveis com fontes/observação quando retornadas; rail de análises sem UUID como título; alternativa mobile sem tabela comprimida.
- Preservado: contratos de comparação, elegibilidade do servidor, tenant/RBAC, análise salva, exportação CSV/JSON e `NO_IMAGE`.
- Arquivos: `apps/web/src/ComparisonPanel.tsx`, `apps/web/src/comparison-workspace.css` e esta task.
- Verificações: `npm run typecheck`, `npm run build` e `git diff --check` passaram em 2026-09-12.
- Pendência: capturas reais de 1440, 768 e 390 px e smoke de teclado, reduced motion, bloqueio 422, ausência, conflito, fonte/observação, filtros, accordion e exportação. Sem elas, não há aceitação visual nem conclusão da task.

## Reabertura V3 — comparação como decisão técnica progressiva (2026-09-13)

### Evidência atual e problemas observados

- As capturas humanas atuais mostram dois estados reais: seleção vazia e análise salva. Elas têm precedência sobre a arquitetura V2 e reprovam sua composição.
- Na seleção, os slots X/Y são grandes mas informacionalmente vazios; `VS`, CTA e explicação ficam soltos; a descoberta usa lista compacta de linhas enquanto análises salvas ocupam um rail alto com somente datas genéricas. A pessoa não consegue escanear “o que escolhi, o que falta e qual é o próximo passo” em uma única sequência.
- Na análise salva, a informação continua tecnicamente correta, mas está concentrada em uma faixa estreita do viewport. Há muito canvas sem responsabilidade, botões nativos claros, métricas em superfícies claras desconectadas do tema e uma tabela longa que parece planilha, embora a tarefa seja compreender diferenças antes de auditar campos.
- `ComparisonPanel` confirma que o contrato já retorna apenas o que a interface pode afirmar: identidades X/Y, campos, unidades, estados, fontes, diferenças, avisos e análise privada. Não retorna imagem aprovada, importância, vencedor, confiança percentual, categoria canônica, nome de comparação ou metadados de veículo para a lista de salvas.

### Princípios e decisão de produto

- A referência de comparação ensina **simetria X / VS / Y**, nunca vencedora, preço, foto genérica ou estética de concessionária. O North Star e as telas Nova ficha/Catálogo aprovadas ensinam largura útil, blocos com responsabilidade, identidade primeiro, resumo factual e detalhe progressivo.
- Esta tela é `NO_IMAGE`: a identidade textual exata é a representação honesta das duas versões até haver asset aprovado para cada configuração.
- **Decisão:** dividir claramente a superfície em dois estados visuais com o mesmo sistema: `Montar comparação` e `Ler análise salva`. A seleção se torna uma sequência única de slots → descoberta → salvar; as análises privadas deixam de disputar uma coluna fixa. A leitura salva usa toda a largura útil do shell, começa por identidade e resumo factual e só então expõe grupos técnicos e evidência.

### Fluxo alvo

1. Abrir Comparar → ver dois slots equivalentes e qual lado está ativo; escolher X ou Y é explícito e não cria comparação.
2. Usar a descoberta para localizar uma versão já persistida; cada candidata anuncia `Adicionar como ficha X` ou `Adicionar como ficha Y` e preserva versão/mercado.
3. Com dois slots preenchidos, `Comparar e salvar análise` fica imediatamente abaixo deles, com a consequência correta: o servidor valida e salva uma análise privada. Bloqueio permanece junto da ação e mantém as duas identidades visíveis.
4. Análises privadas existentes aparecem como seção secundária compacta, abaixo da descoberta, com data real e ação de abrir; sem UUID como título, sem fingir metadados indisponíveis e sem ocupar altura quando não são o objeto atual.
5. Após resposta válida, a leitura mostra X, VS e Y; resumo factual filtrável; diferenças em foco sem ranking; busca/filtros locais; grupos expansíveis; e evidências sob demanda. Exportar só é oferecido para análise salva autorizada.

### Especificação visual

#### Montar comparação

- **Canvas:** largura integral do conteúdo autenticado, sem contêiner menor que o shell nem borda de viewport. Cabeçalho com `Comparar fichas técnicas` e uma frase curta, em vez de narrativa duplicada.
- **Slots:** grade de duas regiões equivalentes e um separador `VS` compacto. Cada slot é um bloco de identidade: rótulo `Ficha X/Y`, nome/versão/ano/mercado/versão técnica quando preenchido; vazio usa instrução curta. A seleção ativa é distinguida por borda e texto, não só laranja. Trocar/remover é ação secundária local.
- **Ação:** uma faixa curta imediatamente abaixo dos slots contém o CTA primário e a condição factual. Não há botão solto no centro de uma área vazia.
- **Descoberta:** superfície de comando no padrão do Catálogo (identidade primária, filtros progressivos, escopo de versões) seguida por galeria de candidatas em três/duas/uma colunas. Não usar seis linhas técnicas pequenas para objetos que exigem conferência de identidade. Cada card apresenta somente dados retornados e uma ação para o slot ativo.
- **Salvas:** seção horizontal após a descoberta. Usa auto-fit de cartões densos com data e `Abrir análise`; se houver poucas, elas não criam rail vazio. Não expor identificador, criador, organização, validade ou conteúdo que a listagem não retorna.

#### Ler análise salva

- **Contexto persistente:** topo compacto com `Nova comparação`, identidade X e Y simétricas, mercados, versões técnicas e exportações CSV/JSON agrupadas visualmente. Avisos do servidor aparecem abaixo desse contexto e antes de qualquer resumo.
- **Resumo:** uma superfície principal de leitura com total de especificações e cinco filtros métricos reais (`Iguais`, `Diferentes`, `Ausentes`, `Conflitos`, `Não aplicáveis`). Todos usam `--app-*`, rótulo explícito e estados de botão acessíveis; não há cartões brancos, percentuais ou qualidade inventada.
- **Diferenças em foco:** no máximo quatro atributos em grid responsivo, seguindo a ordem estável do contrato. Cada item mostra rótulo e valores X/Y; a seção declara que não é ranking nem recomendação.
- **Exploração:** toolbar com busca e filtros locais no mesmo vocabulário do resumo. Em desktop, fica sticky dentro da área de leitura sem cobrir conteúdo; em mobile, volta ao fluxo normal.
- **Detalhe:** grupos expansíveis em superfícies discretas. Desktop usa quatro colunas legíveis (atributo, valor X, valor Y, diferença/evidência); tablet reduz metadados; mobile torna cada atributo um bloco X/Y com nomes de lado visíveis. Fonte, status, unidade e observação permanecem conectados ao valor; cor é suplementar.

### Tema, acessibilidade e movimento

- Todos os módulos autenticados usam `--app-canvas`, `--app-surface`, `--app-surface-muted`, `--app-border`, `--app-ink` e `--app-ink-muted`; dark e warm-light mantêm a mesma hierarquia. O laranja é ação/foco/seleção, não o significado de diferença ou qualidade.
- Botões de seleção, CTA, exportação, filtro e abertura reutilizam `UiButton`; campos preservam labels e foco visível. Não restam controles HTML sem o tratamento do sistema nesta superfície.
- Ordem de teclado: cabeçalho → slots → ação → descoberta → salvas → resumo → toolbar → grupos → evidências → exportação. Acordeons e evidências usam botões reais e `aria-expanded`.
- Movimento fica limitado a `control.feedback`, entrada neutra de bloco e abertura/fechamento de accordion já disponíveis; sem animar resultados, contadores, métricas ou progresso de validação. `prefers-reduced-motion` conserva todo o conteúdo estático.

### Escopo técnico, segurança e verificação

- Arquivos previstos: `apps/web/src/ComparisonPanel.tsx`, `apps/web/src/comparison-workspace.css`, possivelmente adaptador visual de `FichaDiscovery`, `docs/product/design-system.md` e esta task. Não alterar `api.ts`, `types.ts`, serviços, schema, tenant, RBAC, exportação ou contrato de comparação.
- **Segurança e conformidade: não aplicáveis neste recorte.** Apenas reorganização local dos mesmos dados e callbacks autorizados. Reabrir ambos se for necessário obter identidade adicional de análises salvas, URL compartilhável, novos formatos, persistência, endpoint, escopo ou ação.
- Verificar: seleção de X/Y, troca, remoção, terceira candidata, bloqueio 422, alertas de contexto, zero diferenças, ausente, conflito, não aplicável, fonte/observação, filtros, accordion, exportação autorizada, teclado, 1440/1024/768/390, dark/light e reduced motion.

### Double-check da arquitetura

- Não há comparação antes da ação explícita nem evidência de análise antes da resposta salva; os slots preservam somente candidatas retornadas pelo catálogo.
- Nenhuma métrica vira recomendação, score de qualidade, “melhor veículo” ou ordem de importância. Diferenças em foco são limitadas e declaradamente estáveis.
- A transformação resolve o vazio e a compressão observados sem inventar imagem, categorias persistidas, dados da análise salva ou novo contrato.
- Reprovar se seleção e descoberta voltarem a competir numa mesma coluna, se a tabela usar cores/superfícies incompatíveis com o tema, se X/Y perderem simetria, se uma análise bloqueada renderizar resumo ou se mobile exigir scroll horizontal para confrontar atributos.

### Architecture Gate V3

`READY — aguarda aprovação explícita de Lucas para iniciar a implementação.`

## Análise profunda complementar — 2026-09-13

A proposta completa foi consolidada em [`docs/product/p1-042-proposta-profunda-de-comparacao.md`](../../../docs/product/p1-042-proposta-profunda-de-comparacao.md). Ela acrescenta à V3:

- reconciliação entre a semântica histórica e o runtime atual: mercado/motorização são avisos, enquanto identidade persistida contraditória é o bloqueio real;
- diagnóstico de jornada, carga cognitiva, superfície, estado, evidência, histórico e responsividade;
- dependência explícita da P1-026 para seleção A/B compartilhada entre Catálogo, ficha e Comparar;
- decisão de não tratar os primeiros campos diferentes como destaque de importância e de não inventar identidade para análises salvas;
- plano por fases, estados próprios, limites de contrato e critérios de aceite verificáveis.

`READY — aguarda aprovação explícita de Lucas para implementar a Fase A.`
