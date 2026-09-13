# 🚧 Em execução — implementar Motion System no fluxo de acesso

> Prioridade: P1
>
> Área afetada: interface de acesso/cadastro e Design System local
>
> Origem ou referência: `C:\Users\lucas\Downloads\blindspot-review-motion-system-v6.md`; evidências v6; P1-038
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-12.`
>
> Triagem automática: `Material — experiência de autenticação e linguagem visual compartilhada`
>
> Segurança: `Aplicável — a interface trata sessão e credenciais, embora não altere o contrato de autenticação`

## Pedido

Criar uma camada reutilizável de Motion System e aplicá-la primeiro ao fluxo de login, cadastro corporativo e espera de aprovação, tornando transições e feedbacks contínuos sem alterar a jornada, dados, endpoints, sessão, RBAC ou significado dos estados do servidor.

## Critérios de aceite

- [ ] Tokens e recipes de movimento documentam duração, easing, finalidade, fallback e reduced motion; valores não são espalhados arbitrariamente em componentes.
- [ ] Login → cadastro e avanço/retorno entre etapas comunicam direção, mantêm o shell e não atrasam conteúdo nem resposta do servidor.
- [ ] Stepper, CTA/loading, campos, checkbox, toast e timeline têm feedback proporcional, sem bounce, progresso falso ou dependência de cor.
- [ ] `AccessVisual` evolui de modo abstrato e discreto entre `login`, `company`, `owner`, `access`, `review` e `pending`, preservando a composição 60/40 e o significado factual da espera.
- [ ] `prefers-reduced-motion` remove loops/parallax e reduz transições sem esconder informação ou impedir a tarefa.
- [ ] Desktop 1440/1024, tablet 768 e mobile 390, teclado, navegação rápida, erro, sucesso, loading e refresh possuem evidência sanitizada revisada.

## Restrições ou contexto

- Preservar shell 60/40, preto/branco/laranja, formulários, revisão, espera, textos, contratos HTTP, validação de CNPJ, cookie HttpOnly, não enumeração, sessão, RBAC e regras de privacidade existentes.
- `received`, `pending_review` e `rejected` permanecem estados confirmados pelo runtime. Nenhuma animação representa percentual, prazo, aprovação, pesquisa, geração ou confiabilidade inexistente.
- Começar por CSS e primitives locais. Não instalar `motion/react`, Framer Motion, biblioteca de UI, asset, provider ou imagem sem intake de dependência/asset e nova decisão humana.
- Não criar `MotionProvider` na primeira vertical. O estado local de acesso e recipes semânticas são suficientes até que a expansão multiárea prove uma necessidade arquitetural real.
- `NO_IMAGE`: a evolução inicial usa somente camadas abstratas locais sobre o canvas atual. Fotografia automotiva, shared element de veículo e parallax dependem da P1-043 e do Image System.
- Curadoria PEK de Magic UI, Velora UI, Spell UI, Cult UI, Skiper UI, Originkit, Cruip, Awwwards, Refero Styles e Inspora permanece apenas como referência; nenhum código externo será copiado/adotado.

## Arquitetura, segurança, conformidade e composição visual — 2026-09-12

### Fatos confirmados

- O fluxo de acesso já compartilha um canvas 60/40, painel operacional claro e estados locais `login`, `registration`, `received`, `pending_review` e `rejected`. A P1-038 fixa a composição estática e a V6 corrige a geometria do stepper.
- O CSS atual já tem `access-media-glow` com `access-media-breathe` em 10 s. Ele é ambiental, mas genérico: não conhece etapa, aplica escala de `0.94` a `1.08` e não forma uma linguagem temporal compartilhada.
- Login, cadastro e logout já usam APIs e estados existentes; sessão continua exclusivamente em cookie HttpOnly. Esta task não cria tráfego novo, armazenamento persistente, token, log ou dado de perfil.
- O review v6 pede transições direcionais, microinterações e um visual abstrato por etapa. Ele também exige movimento reduzido, 60 fps como alvo, sem progresso falso e sem atrasar a resposta real.

### Decisão e fluxo

Criar `docs/design-system/motion.md` e tokens locais de motion em `apps/web/src/design-system.css`, com nomes CSS semânticos (`--motion-duration-*`, `--motion-ease-*`). As recipes descrevem, no mínimo: interação, flow forward, flow backward, toast, status current e ambient access. A implementação CSS-first será isolada em primitives/seletores locais, sem biblioteca.

O conteúdo do painel direito continua sendo a tarefa; o shell não desmonta durante login → cadastro. Ao mudar de etapa, o conteúdo recebe transição curta de entrada em direção coerente (`forward` entra da direita; `backward` entra da esquerda). A troca de estado React e a resposta da API permanecem fonte de verdade; motion nunca introduz espera artificial. Caso a saída coordenada exija código além do CSS, usar estado efêmero local e manter conteúdo imediatamente disponível, sem dependência externa.

`AccessVisual` é uma camada decorativa abstrata e `aria-hidden`, montada sobre o canvas esquerdo já existente. Ela usa contorno, glow, nós, conexão e anel como camadas geométricas locais. `login` é mais aberto; `company` revela o primeiro nó; `owner`, o segundo e a conexão; `access`, o anel; `review`, a composição alinhada; `pending`, respiração sutil. Não representa pessoa, empresa, cadeado, carro específico ou percentual de análise.

### Especificação visual e de movimento

| Elemento | Estado sem motion | Movimento permitido | Limite |
| --- | --- | --- | --- |
| Login → cadastro | mesmo canvas e painel | `opacity` + `translateX` em 220–300 ms | sem desmontar shell ou ocultar campos |
| Etapa de cadastro | conteúdo legível e stepper factual | entrada/saída direcional em 220–280 ms | avançar/voltar não aguardam animação |
| Stepper | completed/active/pending já distinguíveis | check, conector e marker em sequência até 220 ms | sem alterar geometria ou reduzir label |
| CTA/loading | largura e posição estáveis | cor, depth e feedback de loading curto | resposta real governa a próxima vista |
| Campo/checkbox/link | foco e estado visíveis | transições 80–160 ms; press discreto | label nunca se desloca; foco não depende de cor |
| Toast | portal sobre conteúdo | entrada/saída em 160–220 ms | não desloca layout ou carrega dado pessoal |
| `Em análise` | estado atual já explicado em texto | halo muito sutil, ciclo >= 6 s | não parece progresso, não usa escala agressiva |
| `AccessVisual` | canvas legível e abstrato | camadas com `opacity`/`transform`; ambient de 14–24 s | sem loops rápidos, partículas, vídeo, blur pesado ou cursor parallax |

Camadas de `AccessVisual` usam escala ambiente entre `1` e `1.012`, com drift de poucos pixels. Gradientes não são animados diretamente; glow, highlight e contorno são layers separados animados por `opacity` e `transform`. O ciclo atual de `access-media-glow` será refinado/substituído para não coexistir com loops concorrentes.

### Impacto técnico, dados e confiabilidade

- Arquivos previstos: `docs/design-system/motion.md`, `apps/web/src/design-system.css`, `apps/web/src/App.tsx`, `apps/web/src/styles.css`, opcionalmente `apps/web/src/ui/primitives.tsx`, esta task e evidência sanitizada.
- Não alterar `services/api`, schema, migrations, contratos, `packages/agent-runtime/assets/`, dependências ou providers.
- Estado efêmero possível: direção da transição e estágio visual; não persiste em URL, `localStorage`, cookie, logs ou telemetria.
- `prefers-reduced-motion` é fonte de preferência do ambiente; sua versão reduzida preserva estados, conteúdo, foco e ordem de leitura, removendo loops e deslocamentos não essenciais.

### Revisão de segurança proporcional

- **Gatilhos:** autenticação, credenciais, sessão e interface pública de cadastro. **Fronteira:** navegador → endpoints existentes de cadastro/login/logout → sessão já emitida pelo servidor.
- **Ameaças:** motion esconder estado de erro/feedback, induzir progresso inexistente, reter senha/dados em estado extra ou tornar ação de saída inacessível.
- **Controles:** sem novos requests/armazenamento; transições não transportam dados; mensagens continuam neutras; feedback permanece em região estável; controle de sessão e RBAC não mudam; reduced motion e teclado são requisitos de aceite.
- **Checks:** inspeção de diff para endpoint/cookie/localStorage/log, typecheck/build, smoke sanitizado de sucesso/erro e captura de reduced motion. Não usar credencial real, cookie, token ou dado pessoal em evidência.
- **Risco residual:** percepção de velocidade e conforto dependem de render em dispositivo real; Lucas aceita/recusa o resultado visual após evidência.

### Revisão de conformidade proporcional

- Não há coleta, finalidade, perfil, compartilhamento, transferência, retenção ou terceiro novo. A task anima apenas componentes que já exibem dados de cadastro e sessão sob a revisão da P1-038.
- A versão reduzida não pode tornar o fluxo menos acessível nem ocultar explicações de aprovação/erro. Esta revisão não substitui validação jurídica de base legal, aviso ou retenção já existentes.

### Plano incremental e verificações

1. Registrar `motion.md`, tokens, recipes e inventário do movimento atual; substituir o ambient genérico por camada única controlada por estágio.
2. Implementar microinterações e reduced motion em primitives locais, sem mudar contratos.
3. Implementar transições login/cadastro, forward/backward e stepper, com direção em estado efêmero.
4. Implementar `AccessVisual` e estado atual da timeline, sempre com alternativa estática equivalente.
5. Executar checkpoint PEK com desktop, tablet e mobile; testar teclado, rapid navigation, loading, erro, sucesso, refresh e reduced motion.

### Double-check da arquitetura

- A proposta preserva os estados reais e não interpreta ambient motion como avanço técnico.
- A composição e o conteúdo estático aprovados não são redesenhados; a camada temporal é decorativa ou de continuidade contextual.
- CSS-first evita introduzir dependência, licença, bundle e superfície de segurança sem prova de necessidade.
- A forma abstrata não substitui Image Intent nem afirma identidade de veículo; P1-043 continua dona de imagery e shared elements automotivos.
- Falha se labels/feedback perderem legibilidade, se loops chamarem mais atenção que a tarefa, se reduzido remover informação ou se uma animação bloquear a resposta do runtime.

### Architecture Gate

`APPROVED — Lucas autorizou a implementação em 2026-09-12.`

## Resultado do agente

- Estado: `🚧 Em execução`.
- Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-12`.
- Triagem automática: `Material — experiência de autenticação e linguagem visual compartilhada`.
- Segurança: `Aplicável — revisão proporcional registrada`.
- Implementação: fundação CSS-first concluída para a vertical de acesso. Foram criados tokens semânticos e recipes em `motion.md`; `AccessVisual` recebeu estágios abstratos locais, sem imagem ou dependência; login, cadastro, revisão, espera, stepper, controles, checkbox e toast passaram a usar feedback temporal proporcional. A direção de navegação é efêmera e não persiste dados. O toast mantém o portal sobre o conteúdo e agora também possui saída curta antes da remoção.
- Arquivos alterados: `docs/design-system/motion.md`, `apps/web/src/design-system.css`, `apps/web/src/App.tsx`, `apps/web/src/styles.css`, `apps/web/src/ui/primitives.tsx` e esta task.
- Limites preservados: sem alteração de API, schema, endpoint, cookie, RBAC, validação de CNPJ, persistência, runtime de IA, dependência, provider, asset externo ou tráfego novo.
- Verificação: `npm run typecheck` passou; `npm run build` passou; `git diff --check` passou. A revisão estática confirmou `prefers-reduced-motion`, conteúdo e estados reais preservados, e que a composição 60/40 não foi substituída.
- Aprendizados registrados: o Motion System local passou a documentar preservação de shell/foco/valores, topografia de feedback, geometria semântica e limite de uma camada ambiente. O PEK canônico e o adapter BlindSpot agora exigem a mesma checagem antes de adotar movimento em telas futuras.
- Pendência de aceite: capturar e revisar evidência sanitizada em desktop, tablet e mobile, incluindo teclado, erro, sucesso, loading, troca rápida de etapas, refresh e `prefers-reduced-motion`. O navegador automatizado deste ambiente indisponível impede declarar aprovação visual sem essa evidência.
