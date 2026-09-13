# P1-055 — rearquitetura da Nova Ficha após primeiro render

> Estado: `READY — evidência de 2026-09-13 reprovou a composição; aguarda aceite desta correção antes de novo JSX/CSS`.

## Evidência e diagnóstico

A captura `C:\Users\lucas\Downloads\screencapture-localhost-5173-2026-09-13-01_14_42.png` confirma que o shell e os tokens chegam ao runtime dark, mas reprova a composição da Nova Ficha. O problema não é contraste isolado: o fluxo se tornou uma sequência vertical de painéis e repetiu a mesma decisão em dois lugares.

Problemas observados:

1. completude, fontes, ausências e conflitos aparecem no overview e em “Qualidade da ficha”;
2. o composer ainda é o painel/formulário legado, sem a função de superfície de comando integrada;
3. quatro métricas com a mesma dimensão formam uma grade genérica, sem prioridade visual;
4. veículo e qualidade surgem tarde e a tela desperdiça altura entre regiões; a leitura não é `tarefa → contexto → decisão → detalhe`;
5. cópia sem acentuação diminui o acabamento e mistura a linguagem antiga com a nova.

## Composição corretiva

Em estado com ficha, a primeira dobra terá apenas duas regiões:

- `GenerationComposer`: faixa compacta, título “Nova ficha”, cinco campos e CTA, sem card independente excessivo;
- `VehicleOverview`: grade assimétrica. Identidade/veículo ocupa aproximadamente 55%; qualidade ocupa 45% com **uma** métrica dominante de completude e uma lista concisa de sinais factuais (fontes, ausência e conflito).

O workspace técnico inicia logo após esta grade. A área “Qualidade da ficha” interna deixa de repetir contagens: ela passa a explicar somente o significado dos estados e mantém conflitos/fontes ligados aos atributos. Se a pessoa precisa de um número, ele permanece no overview; se precisa decidir ou auditar, usa o workspace.

Sem ficha, o composer ocupa a prioridade e o espaço seguinte explica o que será obtido, sem metrics zeradas ou hero fictício.

## Mudanças autorizáveis após aprovação

- Remover `MetricTile` repetidos e `PriorityList` redundante do bloco superior atual.
- Reestruturar o request view em composer + `VehicleOverview` compacto com dados existentes.
- Alterar o painel de qualidade do workspace para não repetir completude/fontes/ausências, mantendo conflito/status/fonte por atributo.
- Corrigir a cópia visível para português brasileiro com acentuação.
- Ajustar alturas, colunas e espaçamento nos breakpoints desktop/tablet/mobile, sem alterar payload, geração, tabs, fontes, status, RBAC ou sessão.

## Double-check

- Nenhuma contagem factual aparece duas vezes na mesma dobra.
- A identidade permanece textual e não usa imagem genérica como afirmação de veículo.
- O CTA de geração continua no mesmo formulário e não muda validação/momento de envio.
- Conflito continua explícito, sem vencedor visual; fonte continua visível no detalhe.
- O próximo render deve ser comparado com a captura reprovada e o protótipo aprovado em 1440 e 390 px, nos temas dark e light.

