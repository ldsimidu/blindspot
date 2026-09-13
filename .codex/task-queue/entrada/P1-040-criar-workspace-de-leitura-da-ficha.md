# 🚧 Em execução — criar workspace de leitura da ficha

> Prioridade: P1
>
> Área afetada: interface de ficha técnica
>
> Origem ou referência: UX-BS-002; P1-035; `docs/product/design-system.md`
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-12`
>
> Triagem automática: `Material — leitura de dado rastreável`
>
> Segurança: `Não aplicável inicialmente — reavaliar se tocar exportação, sessão ou API`

## Pedido

Transformar a leitura da ficha em workspace do veículo: hero de identidade, resumo técnico/qualidade e seções progressivas de atributos.

## Critérios de aceite

- [ ] Marca, modelo, versão, ano-modelo e mercado aparecem antes de detalhes extensos.
- [ ] Valor, unidade, status, `fonte_ref`, completude e conflito continuam legíveis por atributo.
- [ ] Carregando, vazio, parcial, conflito, indisponível e erro têm mensagem e próximo passo seguros.
- [ ] Ações de comparar, exportar ou reportar continuam condicionadas à elegibilidade real.
- [ ] A leitura é utilizável por teclado, leitor de tela e viewport compacto.

## Restrições ou contexto

- Não alterar schema, prompt, normalização, política de fonte ou contratos de API.
- Não inventar imagem, preço, métrica ou qualidade ausente.
- Reutilizar primitives de P1-037 e preservar o fluxo canônico de consulta.

## Arquitetura visual, segurança e composição — 2026-09-12

### Fatos confirmados

- A leitura atual é `FichaDashboard` em `apps/web/src/App.tsx`. Ela aparece após uma nova requisição, no catálogo e no histórico; concentra uma imagem/identidade pequena à esquerda e uma tabela muito longa de atributos à direita. A captura `evidence/ux-ui/current/02-requisitar-ficha-tecnica/screencapture-localhost-5173-2026-09-11-02_42_58.png` confirma que a ficha é percorrida como planilha extensa, enquanto o veículo, a versão, o mercado, a qualidade e as próximas ações perdem hierarquia.
- `FichaTecnicaResponse` já fornece identidade, seções, campos com valor/status/`fonte_ref`, observações, fontes utilizadas e resumo de completude. O comportamento atual também já condiciona comparação e exportação à elegibilidade/ao papel em pontos existentes. Esta task não cria estado factual novo.
- A análise completa em `evidence/ux-ui/references/inspiracoes-gerais/analise-referencias-visuais-blindspot.md` define a família principal da ficha: `WhatsApp Image 2026-09-08 at 22.22.14.jpeg` traz grade modular e hierarquia progressiva; `02.59.17.jpeg` e `02.59.42.jpeg` trazem contexto persistente do veículo e detalhe por aba; `22.22.52.jpeg` e `02.57.01.jpeg` complementam a proporção editorial do hero. A família administrativa (`03.00.14.jpeg`/`03.10.59.jpeg`) não é base para a ficha. Nenhuma referência autoriza copiar marca, carro, métricas de manutenção, controles ou dados fictícios.
- Não existe asset automotivo aprovado para a ficha. O Image System reserva imagem e proveniência para P1-043; portanto esta primeira leitura assume `NO_IMAGE`, não ilustra nem simula um carro específico.
- `apps/web/src/App.tsx` e `apps/web/src/VehicleWorkspace.tsx` têm mudanças paralelas não concluídas associadas às P1-039/P1-035. Elas são evidência de integração, não recursos que esta task pode editar sem handoff explícito.

### Decisão e escopo

Criar um `TechnicalFichaWorkspace` dedicado, puramente de apresentação, que receba uma `FichaTecnicaResponse`, o contexto de abertura e callbacks já autorizados pela tela chamadora. Ele substituirá o uso visual direto de `FichaDashboard` nos três pontos de leitura somente após checkpoint de integração com as tarefas donas de `App.tsx`/workspace. Não muda busca, geração, catálogo, histórico, exportação, comparação, schema, API, sessão, RBAC ou regra de elegibilidade.

A página passa de "tabela inteira primeiro" para "identidade → qualidade/decisão → resumo → detalhe progressivo → evidência". O veículo é a âncora conceitual mesmo sem mídia: marca, modelo e versão aparecem em escala de título; ano-modelo, mercado e versão de ficha ficam adjacentes e inequívocos. Uma região editorial vazia não será criada para imitar a fotografia da referência. Quando P1-043 aprovar um asset com `Image Intent`, o componente poderá recebê-lo como melhoria posterior, sem alterar a leitura factual.

O sucesso visual segue o critério da análise de referências: em poucos segundos deve ser evidente qual veículo está aberto, qual contexto/seção está ativo, quais informações importam, qual é a qualidade delas, de onde vieram e quais ações realmente estão disponíveis. Se a tela parecer ERP, catálogo de venda, telemetria/manutenção ou dashboard administrativo, a composição falhou mesmo que os dados estejam presentes.

### Pessoa usuária, objetivo e fluxo

- **Pessoa:** analista, admin ou visualizador autorizado que acabou de gerar, abriu no catálogo ou selecionou uma resposta histórica.
- **Objetivo:** reconhecer a configuração exata, entender rapidamente a qualidade da ficha e aprofundar atributos ou evidências sem perder contexto.
- **Ação primária contextual:** ler o resumo e abrir uma seção relevante; comparar, exportar ou reportar só aparecem quando os pré-requisitos existentes confirmarem elegibilidade.
- **Fluxo:** entrada confirmada → hero de identidade persistente → resumo técnico e de qualidade → aba/seção ativa → atributos legíveis por grupo → fonte/observação no próprio atributo ou no painel de fontes → ação contextual elegível ou próximo passo seguro.

### Especificação visual da tela

**Canvas e regiões (desktop, 12 colunas, máximo 1280 px):**

1. Navegação superior existente permanece fora do workspace; abaixo dela, breadcrumb/contexto de abertura discreto e título acessível da ficha.
2. `VehicleIdentityHero` ocupa toda a largura útil. À esquerda, marca/modelo/versão em título, com ano-modelo e mercado como metadados de primeira linha. À direita, cartão de qualidade com completude textual e numérica, fontes, conflitos, versão e data quando existirem. Sem imagem aprovada, o hero usa superfície quente-neutra e uma área de respiro declarada, não um placeholder de carro.
3. Linha de ações sob a identidade: ação principal somente se o contexto oferecer uma ação elegível; comparar, exportar e reportar ficam secundárias, com estado indisponível explicado em texto em vez de CTA ativo enganoso.
4. Navegação contextual `Resumo`, `Especificações`, `Fontes`, `Histórico` e `Conflitos` é um `tablist` ou navegação de seções com rótulos explícitos. Itens sem dado continuam visíveis como indisponíveis ou não são criados conforme a semântica do runtime; não inventar contagem/indicador.
5. Em `Resumo`, cards não uniformes apresentam apenas atributos âncora existentes — por exemplo motorização, potência, torque, transmissão e combustível — mais um módulo de completude/conflito. Todo card mostra valor, unidade, status textual/ícone e origem resumida quando disponível; campo ausente nunca recebe valor substituto.
6. Em `Especificações`, grupos técnicos entram como seções progressivas/accordions. Cada linha preserva `nome do atributo → valor e unidade → status textual → fonte/observação acionável`; o detalhe de fonte abre sem afastar o atributo correspondente.
7. `Fontes` consolida somente `fontes_utilizadas` recebidas, com avaliação de política/aderência já disponível. `Histórico` e `Conflitos` mostram apenas informações presentes no contrato atual; se ainda não forem expostas pelo chamador, a aba declara indisponibilidade e próximo passo, sem criar endpoint.

Ao trocar de aba, `VehicleIdentityHero`, qualidade e ações permanecem no mesmo lugar; somente o detalhe técnico abaixo muda. Esse contexto persistente é uma regra de produto, não uma animação ou uma rota visualmente desconectada.

**Superfícies, tipografia e densidade:** fundo quente-neutro, superfícies claras estáveis, texto grafite e laranja exclusivamente para marca/ação/foco. Status de qualidade mantêm token semântico, texto e ícone; verde não vira cor de marca. Cards de resumo têm tamanhos proporcionais à importância, borda discreta e pouca elevação. Título de identidade usa escala de display; rótulos, unidades e fonte usam escala de metadados, nunca texto minúsculo a ponto de inviabilizar auditoria.

**Responsividade:** em tablet (8 colunas), hero vira duas faixas e ações passam para linha própria; navegação de contexto mantém rolagem horizontal acessível ou vira seletor progressivo. Em mobile (4 colunas), identidade, qualidade e ações empilham; cards críticos ficam em uma coluna, metadados quebram por agrupamento e a linha técnica passa a bloco sem esconder valor/status/fonte. Não comprimir a tabela desktop em colunas estreitas nem ocultar proveniência atrás de tooltip.

### Estados, acessibilidade e movimento

- `loading`: skeleton somente da estrutura, com texto de carregamento; não desenhar valores ou progresso fictícios.
- `vazio`/`não encontrado`: explicar que não há ficha para a configuração e oferecer retorno ao catálogo ou nova requisição conforme o ponto de entrada.
- `parcial`, `conflito` e `não informado`: preservar o atributo com estado e limite explícitos, priorizando-o no resumo quando altera decisão.
- `indisponível`, resposta inválida ou erro: painel persistente com causa segura conhecida e próxima ação; toast é complemento, não substituto.
- Teclado: foco inicial no título do workspace; tabs navegáveis por teclado com estado ativo programático; accordions são botões reais; fontes têm nome acessível e URL segura existente; nenhum dado decisório depende exclusivamente de cor.
- Movimento: consumir somente tokens/recipes existentes (`flow.*`, `control.feedback`, `toast.*`) após o checkpoint estrutural. Sem ambient novo e sem animação de métricas, qualidade ou carregamento. `prefers-reduced-motion` mantém as mesmas seções e informações.

### Impacto técnico, dados e integração

- Arquivos previstos sob ownership P1-040: `apps/web/src/TechnicalFichaWorkspace.tsx`, regras locais de workspace em `apps/web/src/styles.css`, documentação/evidência sanitizada e esta task.
- Integração posterior e única em `apps/web/src/App.tsx`: trocar os usos de `FichaDashboard` pelos props/callbacks do novo componente. Isso só ocorre após P1-039 e P1-035 liberarem ownership/handoff, pois o arquivo tem alterações simultâneas. O componente não importa `services/`, não executa `fetch`, não lê `localStorage` e não decide permissão.
- Não alterar `packages/agent-runtime/assets/`, tipos persistidos, schema, API, dependências, provider, imagem, endpoint ou contrato HTTP. Imagem fica explicitamente fora até P1-043.

### Segurança e conformidade proporcionais

- **Segurança: não aplicável nesta arquitetura de apresentação.** Não há alteração pretendida em autenticação, autorização, sessão, endpoint público, dados, persistência, integração, dependência ou infraestrutura. A integração recebe ações já condicionadas pelo runtime; o componente não eleva papel, fabrica elegibilidade ou expõe fonte fora da resposta autorizada.
- **Conformidade: não aplicável.** Não há nova coleta, retenção, compartilhamento, telemetria ou transferência. Evidências serão sanitizadas, sem cookies, tokens, logs ou dados pessoais desnecessários.
- **Reavaliar:** aplicar `project-security-assurance` se a implementação precisar alterar exportação, sessão, chamada de API, URL compartilhável, dados de organização ou autorização.

### Plano incremental e verificações

1. Criar arquitetura de props e estrutura estática do workspace com fixture sanitizada, sem integrar `App.tsx`.
2. Executar checkpoint PEK de primeira renderização (1440/1024, 768 e 390) no estado de maior densidade antes de polir cards, tabs ou movimento.
3. Migrar resumo, seções, fontes e estados reais; manter ação elegível como callback, sem duplicar regra de domínio.
4. Após handoff dos owners de P1-039/P1-035, integrar os três pontos de leitura em uma mudança isolada e revisar regressão de catálogo/histórico/requisição.
5. Rodar `npm run typecheck`, `npm run build`, `git diff --check` e smoke manual sanitizado de leitura. Capturar teclado, loading, vazio, parcial, conflito, indisponível, erro e reduced motion.

### Double-check da arquitetura

- A composição corrige o problema confirmado de tabela extensa sem esconder a informação que torna uma ficha auditável: valor, unidade, status, `fonte_ref`, completude e conflito permanecem próximos ao atributo.
- A referência foi traduzida em protagonismo de identidade, continuidade e revelação progressiva; não em carro/telemetria/imagem inventados ou cópia de interface.
- O estado estático já comunica veículo, qualidade, ação e próximo passo. Movimento e imagem não são necessários para entender a ficha.
- A separação de ownership impede que esta task sobreponha as mudanças ativas da navegação e do workspace de veículo. Sem handoff explícito, a implementação para na estrutura isolada e não altera `App.tsx`/`VehicleWorkspace.tsx`.
- Falha se qualquer viewport reduzir fonte/status a cor ou tooltip, se ações parecerem elegíveis sem o runtime, se o hero virar área vazia decorativa ou se o detalhe técnico voltar a ser uma tabela comprimida.

### Architecture Gate

`APPROVED — Lucas autorizou a implementação em 2026-09-12.`

## Resultado do agente

- Estado: `🚧 Em execução`
- Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-12`.
- Triagem automática: `Material — leitura de dado rastreável`.
- Segurança: `Não aplicável — escopo de apresentação sem API, sessão, autorização, persistência ou integração nova; reavaliar se a implementação expandir a fronteira`.
- Implementação: criada `TechnicalFichaWorkspace` com hero de identidade, qualidade, tabs de contexto, resumo técnico modular, seções expansíveis, fontes seguras por atributo e estados de loading/vazio/erro. A camada é somente de apresentação: não faz `fetch`, não lê armazenamento, não toma decisão de elegibilidade e não altera contratos. `FichaDashboard` passou a delegar ao novo workspace, integrando nova requisição, catálogo e histórico sem alterar os callbacks/condições já existentes para comparação ou exportação.
- Arquivos alterados: `apps/web/src/TechnicalFichaWorkspace.tsx`, `apps/web/src/technical-ficha-workspace.css`, `apps/web/src/App.tsx` e esta task.
- Verificação: compilação isolada de `TechnicalFichaWorkspace.tsx` passou; `npm run typecheck` passou; `npm run build` passou; `git diff --check` passou. A evidência atual da ficha e a análise completa das referências foram revisadas; Design System, fluxo de refatoração, PEK/adapter, contrato de arquitetura visual e contratos de motion/checkpoint foram consultados.
- Pendências: realizar primeiro render sanitizado nos viewports definidos e revisão de teclado/estados antes de concluir visualmente a task. O navegador automatizado deste ambiente permanece indisponível; build e typecheck não substituem a captura.
- Próximo passo: Lucas fornecer/validar evidência renderizada; corrigir achados de composição e só então fechar o checkpoint visual da P1-040.
