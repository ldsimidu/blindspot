# ✅ Concluída — inventariar e retirar Orientação autônoma

> Prioridade: P2
>
> Área afetada: interface e conteúdo de ajuda
>
> Origem ou referência: UX-BS-006; `evidence/ux-ui/current/08-orientacao/fluxo.txt`
>
> Arquitetura: `APPROVED — 2026-09-12`
>
> Triagem automática: `Material — remoção de fluxo e redistribuição de conteúdo`
>
> Segurança: `Não aplicável inicialmente — reavaliar se a ajuda passar a coletar ou enviar dados`

## Pedido

Inventariar a finalidade e o conteúdo atual de Orientação, mover ajuda útil para os contextos corretos e remover a página/fluxo autônomo apenas se ela não for mais necessária.

## Critérios de aceite

- [ ] Inventário registra cada mensagem, destino novo e justificativa para remoção.
- [ ] Ajuda necessária está disponível no contexto de cadastro, ficha, catálogo, comparação ou estado vazio apropriado.
- [ ] Nenhum fluxo de primeiro acesso fica sem instrução essencial.
- [ ] Rotas, atalhos e links obsoletos têm redirecionamento ou remoção consciente.

## Restrições ou contexto

- Não assumir que a captura representa todo o conteúdo; verificar runtime e rotas antes de remover.
- Não criar tour, analytics, modal recorrente ou coleta de comportamento sem uma task específica.
- Atualizar documentação e evidência somente depois de comprovar o comportamento entregue.

## Resultado do agente

## Reescrita UX/UI — 2026-09-12

Esta task adota `docs/product/ux-ui-future-task-redesign-standard.md`: a remoção só ocorre após arquitetura de ajuda contextual por jornada, inventário de cada conteúdo e checkpoint de estados vazios/primeiro acesso; não substitui conteúdo por tour ou modal recorrente.

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar na ativação`.
- Triagem automática: `Material — remoção de fluxo`.
- Segurança: `Não aplicável inicialmente; reavaliar no gate`.
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: Architecture Gate e inventário de conteúdo.

## Architecture Gate — 2026-09-12

### Inventário confirmado

| Conteúdo atual | Destino/decisão |
| --- | --- |
| “Conheça o ambiente de consulta” | remover; não descreve uma tarefa atual |
| instrução Requisição/Histórico/Catálogo | ajuda curta nos respectivos estados vazios e cabeçalhos já existentes |
| aviso de protótipo sem login/organização | remover: contradiz autenticação, organização e RBAC atuais |
| “Começar consulta” / “Pular orientação” | remover; não executam jornada distinta |
| atalho Orientação no menu mobile | remover junto do modal; sem rota, link externo ou redirecionamento |

### Decisão visual e técnica

Remover o modal e seu `localStorage` de onboarding. A primeira tarefa permanece explícita na navegação e nos estados vazios de Nova ficha, Workspace, Catálogo e Comparar; não criar tour, analytics, modal substituto, request, persistência ou coleta. O foco volta ao título da view normalmente, sem trap/modal.

### Segurança, verificação e decisão

Segurança/conformidade não aplicáveis: remoção local sem dado, integração ou tratamento novo. Verificar teclado/mobile, ausência de referência ao atalho/modal, estado vazio das jornadas e typecheck/build/diff.

`APPROVED — Lucas autorizou seguir para a próxima task UX/UI em 2026-09-12.`

## Resultado da execução — 2026-09-12

- Estado: `✅ Concluída`.
- Arquitetura: `APPROVED — 2026-09-12`.
- Segurança e conformidade: `Não aplicável`; a entrega somente remove estado e conteúdo locais, sem endpoint, dado, coleta, analytics, integração ou persistência nova.
- Implementação: removidos do `App.tsx` o estado, foco, função e modal de onboarding, além do atalho mobile de Orientação. A navegação mantém as tarefas explícitas de Nova ficha, Workspace, Catálogo, Histórico e Comparar; as descrições e estados vazios contextuais existentes continuam sendo a orientação da jornada. O CSS exclusivo de onboarding e a regra frágil que escondia o último botão do menu mobile também foram removidos.
- Arquivos alterados: `apps/web/src/App.tsx`, `apps/web/src/styles.css` e esta task.
- Verificação: busca estática não encontrou `onboarding`, `Orientação`, `isOnboardingOpen`, `finishOnboarding` ou o selector que escondia o último item mobile; `npm run typecheck`, `npm run build` e `git diff --check` passaram.
- Limitação: a automação visual local continua indisponível (`os error 3`), então a confirmação de render/teclado responsivo pertence à P2-006, já registrada como bloqueada por evidência.
- Próximo passo: nenhuma ação de ajuda global pendente; novas ajudas devem nascer na task da jornada correspondente, sem tour, modal recorrente ou coleta de comportamento.
