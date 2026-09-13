# Adapter PEK — BlindSpot

## Contexto e Prioridade

O PEK avalia como a experiência torna dados automotivos rastreáveis compreensíveis e acionáveis. Não substitui o runtime em `packages/agent-runtime/assets/`, o schema, validadores, API ou controles de segurança.

Prioridade de entrega: primeiro integridade do dado, comportamento funcional e estados corretos; depois elevação UX/UI. O PEK pode identificar uma falha que bloqueia compreensão ou induz decisão incorreta, mas não altera código sem Architecture Gate aprovado.

## Fluxos a Mapear

1. Identificar veículo e iniciar pesquisa.
2. Acompanhar carregamento, falha, ausência ou indisponibilidade.
3. Ler ficha, fonte, completude, conflito e status por variável.
4. Recuperar histórico e versão de ficha.
5. Comparar somente fichas elegíveis, quando a funcionalidade estiver disponível.

## Evidência e Limites

Ao usar `:pek --auto`, priorizar documentos de jornada/requisitos, screenshots/renders, evidência de implementação e regras de dados. Declarar contradição entre documentos e comportamento observado; não resolver por suposição.

Exploração interativa requer alvo e autorização explícitos. Ela é de observação: não envia solicitações que gerem dados, não salva, exclui, publica, altera configurações nem acessa áreas fora do escopo autorizado.

## Gate de arquitetura visual por tela

Antes de implementar uma task de design material, aplicar o contrato canônico `core/screen-design-architecture-contract.md`. A task deve registrar, além da arquitetura técnica:

1. a tela/estado atuais, com evidência visual e problemas concretos observados;
2. a referência específica da tela, as referências gerais em `evidence/ux-ui/references/inspiracoes-gerais/references.txt` e o princípio extraído de cada uma;
3. como a tela respeita a arquitetura de informação, os estados confirmados e as regras decisórias do BlindSpot;
4. uma especificação visual completa: canvas, largura, regiões, colunas, ordem de leitura, superfícies, tipografia, componentes, ações, breakpoints e estados;
5. o uso de imagem via `docs/product/image-system.md`, ou decisão explícita `NO_IMAGE`;
6. um double-check que reprova sobreposição de labels, largura incompatível com a tarefa, espaços vazios sem intenção, CTA isolado, dependência de cor ou divergência das referências.

`VISUAL_READY` não substitui o Architecture Gate técnico nem a aprovação humana. Após implementar, desktop, tablet/mobile e teclado precisam ter render comparável registrado antes de declarar a task visualmente concluída.

## Movimento e componentes externos

Magic UI, Velora UI, Spell UI, Cult UI, Skiper UI, Originkit, Cruip, Awwwards, Refero Styles e Inspora fazem parte da curadoria PEK, não do runtime aprovado. Antes de usar um padrão ou elemento animado, registrar evento, estado sem movimento, fonte, stack/dependências, licença, conta/rede, acessibilidade, `prefers-reduced-motion`, alternativa local e rollback conforme `core/motion-and-external-ui-curation-contract.md`.

No BlindSpot, movimento só pode orientar troca de contexto, progresso local já confirmado ou feedback de interface. Ele não pode simular pesquisa, geração, aprovação ou confiança de fonte; loops, partículas, typing, brilho contínuo, 3D/tilt e efeitos de cursor não entram em ficha, cadastro, estados de espera ou dados técnicos sem uma exceção explicitamente aprovada.

### Consumo do Motion System local

`docs/design-system/motion.md` é a referência concreta do BlindSpot para tokens, recipes e QA de movimento. Antes de uma task PEK alterar ou introduzir movimento, registrar: evento real que o dispara, estado estático equivalente, direção contextual quando existir, região que permanece estável e comportamento de `prefers-reduced-motion`.

No fluxo de acesso, transições podem acompanhar login, cadastro, avanço, retorno, revisão e espera já confirmada; direção é estado efêmero de apresentação, não dado persistido nem previsão do servidor. O shell, valores digitados, ação primária e foco devem sobreviver à transição. Cada canvas editorial mantém no máximo uma camada ambiente ativa, abstrata e de baixa atenção.

Stepper, timeline, checkbox, ícone e outros sinais de forma usam elemento/classe próprios e geometria explícita. Não usar selectors genéricos que alcancem `span`, `label` ou descendentes internos e deformem marcadores, capturem rótulos ou alterem o alvo de toque.

## Checkpoint de primeira renderização

Depois de uma arquitetura visual aprovada e antes de acabamento, animação, asset ou conclusão da task, renderizar a estrutura mínima no viewport da evidência atual e nos breakpoints definidos. Avaliar canvas, largura útil da tarefa, propósito de cada região, colisão/truncamento de labels e dados, hierarquia em cinco segundos e reorganização mobile. Uma reprovação é retorno obrigatório à arquitetura visual; typecheck, build ou componente reutilizado não a compensam.

Quando houver movimento, comparar também o estado estático/reduzido: a transição não pode deslocar feedback, desmontar a tarefa, apagar valores, trocar ordem de foco ou criar aparência de progresso factual. Registrar se uma camada ambiente anterior foi substituída/desligada para evitar loops concorrentes.

## Feedback humano e reabertura

Feedback humano posterior acompanhado de captura, fluxo observado ou referência tem precedência sobre inferência visual anterior. Se ele apontar apenas acabamento localizado, a task corrige e recaptura o estado. Se apontar identidade de marca, propósito de tela, composição, agrupamento de campos, responsividade ou fluxo, a task volta para `❌ Pendente`, invalida `VISUAL_READY` e produz uma nova arquitetura visual antes de mudar CSS/JSX.

No BlindSpot, isso inclui verificar explicitamente: a cor de marca não foi trocada pela cor de um status técnico; narrativa de aquisição não tomou o lugar de uma tarefa segura; campos que dependem de conferência mútua não foram separados por uma regra rígida de microetapa; e mídia/placeholder não comprime a tarefa nem afirma um veículo não comprovado.

## Densidade e gravidade de estado

Além de verificar colisão e largura, toda captura PEK do BlindSpot identifica qual é o objeto, o estado e a ação principal do viewport. Revisão, espera, sucesso, erro e timeline recebem composição própria, contraste e escala proporcionais; não podem virar card auxiliar pálido dentro de uma área vazia. A área livre só sustenta mídia, foco, navegação ou ritmo declarado — nunca justifica reduzir campo, label, valor ou estado decisório.

O retorno de operação se divide em: validação junto ao campo; estado persistente no painel; e toast transversal para sucesso/falha confirmados. Toast não contém dado pessoal, não substitui estado de aprovação e não oculta o próximo passo factual.

## Regras de Domínio na Interface

- `fonte_ref`, status, completude e conflito são informações decisórias; não podem aparecer apenas por cor, tooltip ou detalhe oculto.
- Uma identidade persistida inconsistente com o payload bloqueia comparação e exige explicação visível.
- Dados parciais, conflitantes, não encontrados, não aplicáveis e inferidos minimamente devem informar limites e próximo passo.
- Ações de comparação e exportação só aparecem quando pré-requisitos técnicos e de integridade forem atendidos.
