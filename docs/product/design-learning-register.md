# Registro de Aprendizados de Design — BlindSpot

> Propósito: transformar evidência de implementação e feedback humano em decisões consultáveis antes de uma nova arquitetura visual. Este registro não substitui o Design System, o Image System, a task, o Architecture Gate ou evidência de runtime.

## Como usar

Antes de arquitetar uma tela PEK, consultar este registro, o [Design System](design-system.md), o [Image System](image-system.md), a jornada e as referências específicas. Cada novo achado só vira padrão quando vier de captura, fluxo observado, teste ou feedback humano concreto. Registrar também o limite: uma solução de cadastro não se torna regra universal sem motivo reutilizável.

Para cada tela, a arquitetura responde: qual evidência foi consultada, qual princípio foi reutilizado, qual risco foi evitado e quais renders comprovarão a decisão.

## Padrões confirmados

| ID | Evidência e aprendizado | Padrão reutilizável | Anti-padrão a evitar | Como verificar |
| --- | --- | --- | --- | --- |
| DL-BS-001 | Capturas de cadastro revelaram um marcador de stepper comprimido pelo layout flexível. | Forma que comunica estado possui dimensão e encolhimento explícitos; texto absorve a adaptação. | Deixar círculo/ícone depender de `flex` implícito ou de largura restante. | Desktop, tablet e mobile; item com maior rótulo e estado ativo. |
| DL-BS-002 | Falha de envio aparecia no fluxo vertical e deslocava as ações. | Separar feedback em campo, slot persistente e overlay transversal; reservar espaço quando a falha precisa permanecer. | Usar toast como único retorno ou inserir alerta condicional antes/entre CTAs. | Comparar posição dos CTAs em normal, erro e loading. |
| DL-BS-003 | A primitive de toast já era fixa, mas sua posição arquitetural precisava ser independente da tela. | Overlay global é portalizado no `document.body`, com z-index/safe area e descarte acessível. | Montar retorno transversal dentro de região que pode cortar, empilhar ou competir com a tarefa. | Teclado, leitor de tela, viewport pequeno e tela com overflow. |
| DL-BS-004 | CNPJ só falhava no fim do fluxo; isso desperdiçava etapas e criava erro tardio. | Identificador com regra determinística valida progressivamente e no servidor com utilitário compartilhado/testado. | Rejeitar durante digitação parcial ou confiar apenas na validação do cliente. | Vetores válidos/inválidos, valor mascarado, `blur`, avançar e recusa no endpoint. |
| DL-BS-005 | Screenshots anteriores aprovaram direção geral, mas não detectaram o defeito de composição antes do uso humano. | Primeiro render estrutural é checkpoint: viewport, estado denso, labels, ações e regiões antes de polimento. | Considerar typecheck/build, tokens ou componente reutilizado como aprovação visual. | Renderes comparáveis e feedback humano; reabrir arquitetura se o achado for estrutural. |
| DL-BS-006 | A linguagem de acesso aprovada exige tarefa segura, marca clara e painel dimensionado, não conteúdo inventado. | A área livre tem responsabilidade declarada: mídia, foco, ritmo ou navegação; sem isso, é achado. | Comprimir formulário/revisão para preservar decoração ou preencher painel com narrativa fora do objetivo. | Regra dos cinco segundos: objeto, estado, ação e consequência identificáveis. |

## Ritual de prevenção antes do CSS/JSX

1. Capturar ou localizar a tela/estado atual e as referências específicas.
2. Ler o estado mais denso e o estado de falha, não apenas o caminho feliz.
3. Declarar geometria invariável, ordem de leitura, regiões de feedback e comportamento de breakpoint.
4. Confirmar se uma validação é local, autoritativa no servidor ou ambas; não transformar dado sensível em mensagem de interface.
5. Fazer o checkpoint estrutural em render real antes de animação, assets ou acabamento.
6. Tratar feedback humano sobre composição, fluxo, identidade ou agrupamento como reabertura da arquitetura, não como ajuste de margem.

## Evidências vinculadas

- `C:\Users\lucas\Downloads\evidencia-cadastrov3\screencapture-localhost-5173-2026-09-11-22_49_38.png`: deformação do marcador de etapa.
- `C:\Users\lucas\Downloads\evidencia-cadastrov3\screencapture-localhost-5173-2026-09-11-22_49_49.png`: retorno de erro concorrendo com ações.
- [P0-015](../../.codex/task-queue/entrada/P0-015-corrigir-validacao-cnpj-e-feedback-do-cadastro.md): arquitetura, restrições, evidências e resultado técnico da correção.

## Critério para promover um novo aprendizado

Registrar data, tela/estado, origem da evidência, impacto na tarefa, regra reutilizável, não-escopo, verificação mínima e documento/contrato que recebeu a mudança. Se a regra for genérica, promover para o PEK canônico; se depender de identidade, domínio, tokens ou componente BlindSpot, mantê-la aqui e no Design System local.
