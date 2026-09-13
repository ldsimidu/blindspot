# 🚧 Em execução — redesenhar comparação X/Y em camadas

> Prioridade: P1
>
> Área afetada: interface, comparação e exportação contextual
>
> Origem ou referência: UX-BS-003; P1-017; referência de comparação em `evidence/ux-ui/references/inspiracoes-gerais/`
>
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
