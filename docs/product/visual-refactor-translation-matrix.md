# Matriz de tradução visual — refactor sistêmico do BlindSpot

> Estado: `Fase 0 concluída — insumo para protótipo, não autorização de runtime`.
>
> Referência estudada: `evidence/ux-ui/references/` e `C:\Users\lucas\Downloads\visual-refactor\FUTURE-DESIGN.jpeg`. A referência é usada para material, proporção e ritmo; não para conteúdo, marca ou funcionalidade.

## Regra de uso

Cada tela que consumir esta direção deve escolher um padrão pela responsabilidade do dado, e não por semelhança superficial. Se não existir dado real que justifique uma região, ela não entra. A matriz não cria contrato, API, métrica, permissão ou asset.

| Princípio observado | Tradução BlindSpot | Verdade necessária | Acessibilidade e movimento | Anti-cópia |
| --- | --- | --- | --- | --- |
| Moldura clara, quente e contínua | `AppFrame` autenticado em marfim, superfícies branco-quente e detalhe coral de baixa intensidade | Sessão e destinos já permitidos pelo runtime | Contraste, foco, fallback opaco; sem animação contínua | Não manter shell dark como faixa dominante sobre páginas claras |
| Header leve, com destinos compactos | Rail de ícones + disclosure de rótulos e utilidades de sessão separadas | Rotas e RBAC existentes | `aria-label`, tooltip, alvo 42 px, `Escape`, retorno de foco; mobile com texto | Ícone não substitui nome, permissão ou logout |
| Grade assimétrica e módulos proporcionais | 12/8/4 colunas; `VehicleStage`, métricas, prioridades e dados com tamanhos distintos | Contexto de ficha ou tarefa administrativa | Ordem DOM acompanha leitura; reflow sem ocultar fonte/conflito | Não preencher página com cards idênticos |
| Objeto visual grande | Veículo é protagonista apenas em ficha, catálogo contextual e comparação | Identidade textual exata; asset só se verificável | Fallback local abstrato com texto explícito; sem autoplay | Não usar carro genérico como se fosse o veículo exato |
| Pequenas métricas de leitura rápida | Completude, fontes, ausências e conflitos | Valores calculáveis do contrato atual | Rótulo + valor + estado textual; números tabulares; sem contagem animada | Não usar bateria, custo, velocidade, lembrete ou telemetria inventados |
| Lista curta de prioridades | `PriorityList` de conflitos, lacunas, pesquisa elegível ou próximos passos factuais | Estado realmente devolvido | Estado não depende apenas de cor; ação nomeia consequência | Não criar alertas de manutenção, calendário ou urgência fictícia |
| Painel de dados de alta densidade | Resumo técnico e grupos de atributos com fonte/status próximos | `valor`, unidade, status, `fonte_ref`, observação quando existentes | Semântica de lista/tabela conforme caso; zoom 200% preservado | Não converter cada atributo em um card |
| Controles discretos e arredondados | Radius hierárquico e sombras curtas apenas em elevação | Nenhum dado extra | Foco visível, disabled explícito, reduced-motion | Não aplicar glass, gradiente ou sombra em massa |

## Arquitetura de informação por consumidor

| Consumer | Ordem visual | Componentes candidatos | Não pode ocorrer |
| --- | --- | --- | --- |
| Nova ficha | tarefa → composer → última ficha/estado vazio → qualidade → detalhe | `PageHeader`, `GenerationComposer`, `VehicleStage`, `MetricTile`, `PriorityList` | Composer virar hero vazio; inventar ficha para preencher a tela |
| Ficha técnica | veículo → identidade → resumo → qualidade/decisão → detalhe → evidência | `VehicleStage`, `ContextTabs`, `DataPanel`, `SourceEvidence` | Ocultar fonte/conflito para “limpar” a composição |
| Catálogo | busca/filtro → reconhecimento → estado de ficha → ação permitida | `PageHeader`, `ModuleGrid`, linha/tile de ficha | Virar vitrine de venda ou usar hero de veículo sem contexto |
| Comparação | contexto X/Y → atributos alinhados → evidência de cada lado | `ComparisonFrame`, `DataPanel`, `SourceEvidence` | Sugerir vencedor por cor, tamanho, posição ou CTA |
| Equipe e consumo | pessoa/período → decisão operacional → detalhe | `PageHeader`, `DataPanel`, lista operacional | Reutilizar VehicleStage sem veículo em contexto |

## Ownership e limites de integração

| Área | Owner/Task de referência | Estado nesta fase | Próxima dependência |
| --- | --- | --- | --- |
| Shell, navegação, sessão | P1-039 / `App.tsx`, `styles.css` | Não tocar | Sub-gate visual + security ao migrar |
| Nova ficha e workspace | P1-040 | Reaberta após rollback; não tocar | Aceite humano do protótipo desta P1-055 |
| Catálogo | P1-041 | Reescrever arquitetura visual antes de código | Foundation aprovada |
| Comparação | P1-042 | Reescrever arquitetura visual antes de código | Foundation aprovada |
| Administração | P2-004 | Consumidor futuro | Foundation aprovada, sem VehicleStage |
| Acesso/cadastro | P1-038 | Direção própria aprovada | Não aplicar shell autenticado automaticamente |

## Contrato do protótipo desta fase

O protótipo usa nomes e contagens ilustrativas sanitizadas para testar hierarquia, não disponibilidade real. Ele deve mostrar: frame, header, rail, composer, stage abstrato, quatro métricas com legendas, prioridades factuais exemplificadas e resumo técnico. Não simula pesquisa, aprovação, fonte externa, dados de pessoa, imagem de veículo ou resultado de API.

Para receber aprovação, a avaliação humana precisa responder: o canvas parece uma aplicação única; o objeto central e a tarefa são lidos em cinco segundos; a composição é modular sem ser uma grade repetitiva; e a direção é BlindSpot, não uma cópia de telemetria.

