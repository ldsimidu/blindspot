# North Star visual — BlindSpot

> Estado: `DIRECAO_DE_PRODUTO_APROVADA_PARA_ARQUITETURA` em 2026-09-12.
>
> Fonte de síntese: `visual-refactor/BLINDSPOT_VISUAL_NORTH_STAR.md`, `visual-refactor/NEW_FICHA_SCREEN_REFACTOR_SPEC.md`, Design System, Image System, Motion System e evidência da tela de Nova ficha de 2026-09-12. Esta é a referência canônica dentro do repositório; os materiais de Downloads permanecem evidência de origem.

## Propósito e precedência

O Design System define tokens, primitives e invariantes. Este documento define a presença visual que esses elementos precisam produzir. Nenhuma tela pode usar tokens corretos e ainda ignorar composição, hierarquia, densidade, contexto persistente ou o objeto central.

Precedência: instrução explícita mais recente de Lucas → integridade e autorização do BlindSpot → este North Star e o Design System → contratos PEK → implementação existente → referências externas.

## A experiência que o BlindSpot deve transmitir

O BlindSpot é uma plataforma contemporânea de inteligência automotiva: técnica, silenciosa, visualmente rica, escaneável e pouco burocrática. Não deve parecer ERP, concessionária, telemetria em tempo real, landing page ou dashboard genérico.

A ordem de composição é invariável:

```text
veículo → identidade → resumo → decisão/qualidade → detalhe → evidência
```

Dados são contexto do veículo; o veículo não é apenas um rótulo de uma tabela. Cada região recebe uma responsabilidade dominante e espaço proporcional à importância. A pergunta inicial nunca é “quantos cards cabem?”, mas “qual é o objeto, qual resumo permite entendê-lo e qual evidência sustenta a decisão?”.

## Leis de composição

1. **Vehicle-first.** Em ficha, catálogo contextual e comparação, a identidade do veículo aparece antes do detalhe. Uma imagem exata só aparece com identidade verificável; um placeholder nunca representa o modelo como fato.
2. **Canvas claro e quente.** Workspaces usam marfim/areia claro e superfícies próximas. Evitar branco clínico, cinza frio e temas escuros predominantes fora de jornadas onde isso foi deliberadamente aprovado.
3. **Superfícies quietas.** Bordas quentes discretas, sombra curta apenas quando há elevação real e radius hierárquico. Superfícies organizam responsabilidade; não são decoração repetitiva.
4. **Grade modular assimétrica.** Hero, resumo e decisão recebem área conforme prioridade. Não preencher o viewport com cards iguais ou regiões vazias sem papel declarado.
5. **Informação progressiva.** Resumo técnico primeiro; agrupamentos e evidência detalhada depois. A ficha não vira planilha, nem esconde auditoria atrás de uma tab distante.
6. **Contexto persistente.** Trocar resumo, especificações, fontes, histórico, pesquisa ou conflitos muda somente a região inferior. Identidade, estado e ações do veículo permanecem estáveis.
7. **Cor com moderação.** Laranja é marca, foco e ação; verde, âmbar, vermelho e cinza mantêm semântica de qualidade. Cor nunca é o único sinal e não colore cards inteiros por status.
8. **Dados sem estética de planilha.** Atributos são agrupados por assunto, com label, valor, unidade, estado e fonte próximos. Uma superfície pode conter vários atributos relacionados; cada atributo não precisa ser um card.

## Linguagem concreta

- Tipografia de interface: Manrope com fallback aprovado; título de veículo é display, não slogan decorativo.
- Hierarquia: um título de display por viewport; valores grandes podem usar tamanho, não peso excessivo; metadados continuam legíveis.
- Espaço: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`; página espaçosa, componente eficiente.
- Radius: shell `28–36`, hero/card maior `20–26`, card padrão `16–22`, controle `10–16`, pill apenas para status curto.
- Ícones: outline, geometria arredondada, 16–20 px; alvo de toque mínimo de 42 px; não misturar famílias visuais.
- Glass: permitido somente em controles/overlays pequenos sobre contexto visual e sempre com fallback opaco. Nunca em formulário, tabela, evidência, alerta crítico ou texto denso.

## Navegação de produto compacta

A navegação superior pode usar apenas ícones no estado padrão. Isso reduz chrome sem perder orientação se cumprir todos os itens abaixo:

- cada destino é um botão com `aria-label`, tooltip no hover/foco e estado ativo perceptível também sem cor;
- um botão de revelação com seta abre um painel ancorado, sem deslocar o conteúdo, com **todos os nomes dos destinos**, ícone, rótulo, item atual e grupos quando aplicável;
- o painel fecha com `Escape`, devolve foco ao gatilho e permite navegação por teclado; em mobile ele vira menu modal/drawer com rótulos sempre visíveis;
- destinos não elegíveis por papel continuam ocultos pelo runtime, nunca apenas visualmente desativados;
- utilidades (tema, sessão, ajuda futura) permanecem separadas dos destinos. O menu de conta não é o mecanismo para descobrir navegação.

## Vehicle Technical Workspace

Uma ficha é composta por: `Generation Composer` compacto → `Vehicle Identity Hero` → `Quality Metrics` → `Context Tabs` → conteúdo da tab. A pessoa precisa reconhecer, em cinco segundos, o veículo, seu contexto, qualidade, próxima ação e seção aberta.

### Hero

- Desktop: contêiner amplo de 12 colunas; identidade textual em uma região, placeholder/asset de veículo na região editorial e métricas integradas na terceira região. O hero tem altura funcional, não um vazio cinematográfico.
- Placeholder inicial: componente local abstrato, neutro e claramente não-identitário; não usa API, provider, imagem externa ou suposta semelhança com o veículo. Texto alternativo comunica que a representação visual do veículo está indisponível; identidade canônica continua sendo marca/modelo/versão/ano/mercado em texto.
- Métricas reais: completude, fontes, campos ausentes e conflitos. Podem aparecer como coluna segmentada ou pequenos painéis de métrica, mas continuam com rótulo, valor e estado humano. Nenhuma porcentagem, origem ou categoria é inventada.
- Fonte, status, completude, conflito e elegibilidade de ação permanecem no viewport ou têm caminho explícito de revelação na mesma região; não desaparecem para “limpar” o hero.

### Tabs e detalhe

Tabs usam rótulos, underline de marca discreto e semântica `tablist/tab/tabpanel`; seguem acessíveis por teclado. `Resumo` agrupa atributos-âncora em uma superfície única e proporcional. `Especificações` progride por grupos técnicos. `Fontes`, `Histórico`, `Pesquisa` e `Conflitos` só mostram dados presentes no contrato; ausência é explicada, não preenchida com conteúdo fictício.

## Imagens, verdade e fallback

Todo asset começa por Image Intent. Neste ciclo, a decisão é `LOCAL_ABSTRACT_PLACEHOLDER`: não representa configuração exata, não coleta dados, não cria integração, não traz licença externa e pode ser trocado no futuro por asset aprovado. Não restabelecer curadoria, Unsplash, busca de imagem, hotlinking ou geração por IA como consequência desta direção.

## Movimento

Movimento acompanha somente fatos já confirmados: transição entre composer e workspace, entrada breve do hero/estrutura e mudança de tab. Não há contador de métricas em estilo cassino, falso progresso, loops ambiente ou atraso de conteúdo. O estado reduzido preserva estrutura, foco, valor digitado, CTA e ordem de leitura.

## Critérios de reprovação

Reprovar uma tela que: trate a mudança como dark-to-light; reduza veículo a thumbnail ou título gigante; use imagem genérica como identidade; gere 15 cards idênticos; aplique glass/sombra/gradiente em massa; comprima detalhe enquanto sobra espaço inútil; esconda fonte/conflito; transforme comparação em juízo; ou copie manutenção, telemetria e conteúdo de referências externas.

## Perguntas obrigatórias para uma tela nova

1. Qual é o objeto central?
2. Qual resumo permite compreendê-lo imediatamente?
3. Qual decisão/ação é realmente elegível?
4. Qual detalhe deve surgir progressivamente?
5. Onde a evidência aparece sem romper a leitura?
6. Como a composição continua verdadeira sem imagem e em mobile?
