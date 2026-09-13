# Motion System — BlindSpot

> Estado: `DIREÇÃO_APROVADA` — P1-050, 2026-09-12.

## Propósito

Movimento comunica resposta, continuidade e mudança de contexto. Ele nunca representa progresso de pesquisa, geração, aprovação ou qualidade que o runtime não confirmou.

## Tokens

| Token | Valor | Uso |
| --- | --- | --- |
| `--motion-duration-instant` | 80 ms | press e feedback imediato |
| `--motion-duration-fast` | 140 ms | hover, foco e saída curta |
| `--motion-duration-normal` | 220 ms | toast e troca de componente |
| `--motion-duration-slow` | 360 ms | transição contextual mais ampla |
| `--motion-duration-ambient` | 16 s | movimento decorativo de baixa atenção |

Easings: `standard`, `enter`, `exit`, `emphasized` e `ambient`, definidos em `apps/web/src/design-system.css`.

## Recipes

| Recipe | Finalidade | Propriedades permitidas |
| --- | --- | --- |
| `flow.forward` / `flow.backward` | mudança local de etapa | `opacity`, `transform` |
| `toast.enter` / `toast.exit` | feedback transversal | `opacity`, `translateY` |
| `control.feedback` | hover, press e foco | `transform`, cor, borda, sombra leve |
| `status.current` | estado pendente factual | halo discreto, sem métrica ou percentual |
| `access.ambient` | canvas abstrato de acesso | `opacity`, `transform`, ciclos longos |

## Regras

- O conteúdo e a resposta real aparecem sem atraso artificial.
- Movimento é opcional: `prefers-reduced-motion` remove loops e deslocamentos não essenciais.
- Não instalar biblioteca de motion sem intake de dependência e Architecture Gate próprio.
- Não usar movimento contínuo em dados técnicos, ficheiros, comparação ou estados de aprovação sem arquitetura específica.
- `AccessVisual` é abstrato e decorativo; não representa veículo, pessoa, empresa, cadeado ou progresso técnico.

## Guardrails de implementação

### Separar a origem do movimento

- A direção (`forward` ou `backward`) deve derivar de uma mudança de contexto real, como avanço ou retorno de etapa. Ela é estado efêmero de apresentação, nunca um substituto do estado do servidor.
- Preservar o shell da tela, os controles estáveis e a região de foco. Animar somente o conteúdo que mudou; a transição não pode desmontar a tarefa inteira, apagar valores digitados ou introduzir tempo de espera antes de a pessoa agir.
- Um estado de espera confirmado pode receber ênfase discreta, mas não barra percentual, contagem, shimmer ou sequência que pareça trabalho em andamento sem evento correspondente do runtime.

### Proteger o foco e a topografia de feedback

- Toast é feedback transversal: entra e sai no overlay/portal, sem participar do fluxo, deslocar CTA, redimensionar formulário ou carregar dados pessoais. A remoção ocorre após sua saída visual curta; erro recuperável continua junto ao campo ou no estado persistente apropriado.
- Hover, press e foco enriquecem controles, mas contraste, label, borda de foco e estado continuam compreensíveis na versão estática.
- Em troca rápida de etapa, refresh ou resposta de erro, o conteúdo final deve continuar correto mesmo que a animação seja interrompida ou removida pelo reduced motion.

### Manter geometria semântica

- Stepper, marcador de timeline, checkbox, ícone e alvo de toque usam classes próprias e dimensões explícitas (`inline-size`, `block-size`, `flex: none` ou `aspect-ratio` quando necessário). Um selector genérico para `span`, `label` ou elemento descendente não pode redefinir a geometria de um componente semântico.
- O texto do rótulo fica em elemento distinto do marcador. Em breakpoints compactos, reorganizar a região de texto; nunca comprimir, ovalizar ou sobrepor o sinal visual.

### Ambiente decorativo

- Cada região editorial tem no máximo uma camada ambiente ativa. Antes de adicionar uma nova, substituir ou desligar a anterior para não somar loops, escala agressiva ou consumo visual/CPU desnecessário.
- Camadas ambiente usam somente `opacity` e `transform`, deslocamento mínimo e ciclo longo. Gradientes, texto, cor de status e dados factuais permanecem estáveis.

## QA

Revisar 1440, 1024, 768 e 390 px; teclado, troca rápida de etapa, erro, loading, sucesso, refresh e reduced motion. Para cada estado animado, comparar também o estado estático/reduzido e confirmar que o shell, foco, valores, CTA e feedback persistente não mudaram. Capturas sanitizadas são obrigatórias para aprovação visual.
