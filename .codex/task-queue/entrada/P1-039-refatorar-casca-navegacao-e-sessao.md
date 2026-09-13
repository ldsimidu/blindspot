# 🚧 Em execução — refatorar casca, navegação e sessão

> Prioridade: P1
>
> Área afetada: interface e autenticação
>
> Origem ou referência: UX-BS-001; Design System; P0-011
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-12.`
>
> Triagem automática: `Material — estrutura global e sessão`
>
> Segurança: `Aplicável — logout e visibilidade de destinos dependem de sessão/papel`

## Pedido

Substituir progressivamente a sidebar pela navegação superior responsiva e por um menu de sessão claro, preservando todas as rotas e controles de autorização.

## Critérios de aceite

- [ ] Destinos principais, item ativo, versão compacta e foco por teclado funcionam em desktop e mobile.
- [ ] Equipe e Consumo aparecem somente conforme o papel real; a ocultação visual não substitui validação de servidor.
- [ ] O logout existente continua acessível, possui estado de carregamento/erro e só limpa a interface após sucesso confirmado.
- [ ] A área útil das fichas, catálogo e comparação aumenta sem criar rolagem horizontal indevida.

## Restrições ou contexto

- Aplicar revisão de segurança proporcional para qualquer alteração de sessão/logout.
- Não alterar endpoints, RBAC ou semântica de rotas sem task/gate adicional.
- Integrar somente após P1-037 ou registrar exceção visual justificada.

## Arquitetura, segurança, conformidade e composição visual — 2026-09-12

### Fatos confirmados

- A aplicação autenticada usa `AppView` local (`request`, `catalog`, `workspace`, `comparison`, `history`, `team`, `usage`) e hoje a sidebar é dona da descoberta de destinos, estado ativo, tema, orientação e sessão.
- `team` e `usage` só são renderizados para `admin`; `comparison` só é renderizado para `analyst`/`admin`. Essa filtragem é orientação visual: os endpoints já preservam autorização no servidor e esta task não os altera.
- `handleLogout` já chama o endpoint existente, mantém o estado local quando a chamada falha e, somente em sucesso, remove identidade/papel locais e volta à entrada. O controle atual tem texto `Sair`, loading e mensagem neutra.
- A direção aprovada define navegação superior, workspace como centro e menu de sessão explícito. O Design System e PEK v0.10 exigem topografia estável de feedback, área útil para a tarefa e sinais visuais que não deformem em breakpoints.
- `apps/web/src/App.tsx` e `styles.css` têm alterações paralelas não integradas. Esta task não pode absorvê-las; antes do código será confirmado owner, diff e ponto de integração para esses arquivos compartilhados.

### Decisão e escopo

Substituir a sidebar autenticada por uma casca de navegação superior responsiva, preservando exatamente os destinos atuais, seus gates de papel e o logout já seguro. O cabeçalho passa a conter marca compacta, destinos de produto, utilitários não sensíveis e um menu de sessão. Mobile não é uma sidebar encolhida: mostra um gatilho de navegação que abre uma superfície focada, com destinos, estado ativo e `Sair` acessível.

**Não-escopo:** endpoint, cookie, TTL, sessão, RBAC, schema, roteamento HTTP, cadastro, orientação autônoma, provider, analytics, telemetria, dependência externa, asset e alteração de conteúdo de domínio. A task não cria perfil, edição de conta, confirmação de logout, nova rota ou persistência de preferência de menu.

### Pessoa, fluxo e arquitetura de informação

**Pessoa usuária:** membro corporativo autenticado que alterna entre trabalho de ficha, catálogo, comparação, histórico e áreas administrativas permitidas.

1. Ao entrar, a pessoa encontra marca e o destino ativo no topo; a área principal inicia abaixo da casca sem perder largura útil.
2. Ao selecionar um destino permitido, `activeView` muda como hoje, o título principal recebe foco programático e a navegação anuncia a troca. Destino inelegível não é inserido no menu.
3. Em desktop, destinos frequentes aparecem em linha; utilitários ficam à direita; o menu de sessão expõe nome, papel textual quando disponível e `Sair`.
4. Em tablet/mobile, um botão com nome acessível abre menu de navegação focável. A superfície mantém o item ativo, os destinos autorizados e a ação de sair; fecha por `Escape`, seleção, clique fora quando possível e retorno de foco ao gatilho.
5. `Sair` preserva os estados atuais: loading desabilita somente a ação, falha mantém a sessão e texto neutro no contexto do menu/área reservada, sucesso retorna à entrada. Toast, se usado, é complementar e não desloca navegação ou CTA.

### Arquitetura visual PEK por tela

**Alvo e evidência.** A casca autenticada atual é uma sidebar fixa, vista no código e na auditoria UX/UI; a direção aprovada em `docs/product/ux-ui-direcao-alvo-e-decisoes.md` e `docs/product/design-system.md` pede navegação superior. Não há referência específica nova para copiar. Das referências gerais, reutilizar apenas o princípio de navegação leve e área principal ampla; não copiar barras, ícones, marca, conteúdo ou assets externos.

**Conceito de experiência.** A casca deve deixar explícitos quatro fatos em cinco segundos: onde a pessoa está, para onde pode ir, qual contexto de sessão está ativo e como sair. Ela não compete com a ficha nem transforma áreas operacionais em landing page.

**Composição desktop.** Canvas segue o tema atual. `TopNavigation` ocupa largura total no topo, altura de toque de ao menos 48 px e borda inferior discreta. À esquerda: marca/wordmark compacto que retorna à view padrão. Ao centro: destinos em grupo horizontal com rótulo legível e item ativo por texto, cor e indicador. À direita: tema e disparador do `SessionMenu`. A área principal usa largura restante, `min-width: 0` e padding responsivo; não mantém coluna fantasma da sidebar.

**SessionMenu.** Superfície elevada e estável, ancorada ao gatilho, com cabeçalho de identidade mínima já disponível, papel textual e divisor antes de ações. `Sair` fica como ação destrutiva compreensível, não apenas ícone. O slot de falha de logout pertence ao menu e preserva geometria da ação. Não mostrar e-mail, organização, cookie, token ou dados de perfil ainda não necessários à tarefa.

**Compacto.** Abaixo do breakpoint declarado, destinos deixam a linha e entram em `NavigationMenu` sem rolagem horizontal. O gatilho tem ícone e nome acessível; cada item preserva alvo mínimo e marcador ativo geométrico fixo. O menu não reduz labels para caber nem deforma ícones; se houver overflow, a lista pode rolar internamente sem esconder `Sair` ou o item ativo.

**Reuso e movimento.** Reusar tokens e primitives locais; nenhuma biblioteca ou componente externo é necessário. Transições de abertura/fecho são curtas, opcionais e obedecem `prefers-reduced-motion`. Esta task é `NO_IMAGE`.

### Impacto técnico, segurança e confiabilidade

- Arquivos previstos: `apps/web/src/App.tsx`, `apps/web/src/styles.css`, possivelmente `apps/web/src/ui/primitives.tsx` para um menu acessível, esta task e evidência sanitizada. `design-system.css` só muda se faltar token reutilizável documentado.
- O estado de sessão continua vindo de `obterSessao`; `signedInRole` decide apenas visibilidade, nunca acesso efetivo. A mudança de view não cria request adicional, armazenamento local novo ou transmissão de identidade.
- Antes de iniciar, isolar os hunks pertencentes a esta task e preservar alterações paralelas no mesmo arquivo. Nenhuma remoção de sidebar entra no commit sem a navegação superior equivalente e sem confirmação de que as áreas admin continuam condicionadas.

### Revisão de segurança proporcional

- **Gatilhos:** autenticação, estado de sessão, identidade/papel em UI, logout e interface pública autenticada.
- **Fronteira:** navegador com cookie `HttpOnly` → endpoints existentes de sessão/logout → servidor. Não há novo endpoint, cookie, token, terceiro, dependência ou log.
- **Ameaças relevantes:** limpeza local antes da revogação confirmada; revelar rota/ação administrativa a papel inelegível; vazar identificadores de sessão no menu; overlay de menu inacessível que impede saída ou induz ação errada.
- **Controles:** preservar `handleLogout` confirmado pelo servidor; não ler/exibir cookie/token; gates visuais por papel permanecem e controles de servidor não mudam; menu usa foco, `Escape`, nome acessível e retorno de foco; mensagens de logout permanecem neutras; sem armazenamento persistente novo.
- **Checks planejados:** typecheck/build; inspeção de diff garantindo ausência de API/cookie/localStorage/logs; teste de papel viewer/analyst/admin com fixtures legítimas quando disponíveis; smoke de logout autenticado; teclado/reader; render desktop/tablet/mobile. Não testar com credenciais reais nem registrar cookie, e-mail ou token.
- **Risco residual:** ocultação visual é contingência de UX, não controle de segurança; a validade do RBAC precisa continuar provada por testes/contratos de API existentes. Responsável por risco residual: Lucas.

### Revisão de conformidade proporcional

- **Jurisdição e fontes:** Brasil; LGPD consolidada, Lei nº 13.709/2018, arts. 5º, 6º, 7º, 9º e 46, consultada em 2026-09-12 no Planalto; portal de documentos/publicações da ANPD consultado na mesma data.
- **Finalidade:** tornar navegável a sessão corporativa e permitir encerramento explícito de sessão existente. Dados já exibidos: nome e papel do membro autenticado. Não há nova coleta, inferência, persistência, exportação, compartilhamento, cookie, analytics, IA ou transferência internacional.
- **Minimização e transparência:** menu mostra apenas identidade mínima necessária; não mostra e-mail/organização por padrão. Retenção e descarte permanecem os do contrato de sessão existente. Base legal/controlador/retenção continuam a validar pelo responsável competente.
- **Decisão:** seguir, condicionado a não ampliar dados mostrados e a preservar o fluxo de logout confirmado. Esta revisão não é parecer jurídico.

### Plano incremental e verificações

1. Confirmar ownership/diff de `App.tsx` e `styles.css`; mapear destinos e guards existentes sem alterar servidor.
2. Criar a casca desktop com navegação semântica, item ativo e menu de sessão; migrar logout sem alterar sua lógica.
3. Implementar compacto com foco controlado, `Escape`, retorno ao gatilho e nenhum overflow horizontal de shell.
4. Aplicar checkpoint PEK de primeira renderização em 1440 px, 768 px e 390 px, incluindo destino longo, admin, menu aberto e falha de logout sanitizada.
5. Executar typecheck/build e smoke autenticado autorizado; validar que respostas de API e gates reais continuam sendo do servidor.

### Double-check da arquitetura

- A proposta remove a coluna lateral sem reduzir navegação a ícones opacos ou esconder o estado ativo.
- Sessão e logout permanecem próximos, compreensíveis e seguros; o menu não adiciona tratamento ou exposição desnecessária de dados.
- Desktop ganha área útil, enquanto compacto reorganiza a informação em vez de comprimir labels/ícones.
- Não promete perfil, rotas, confirmação, mudança de RBAC ou dados que não existem no runtime.
- A implementação depende de ownership explícito dos arquivos compartilhados; mudanças paralelas permanecem fora do escopo e do commit.

### Architecture Gate

`APPROVED — Lucas autorizou a implementação em 2026-09-12.`

## Resultado do agente

- Estado: `🚧 Em execução`
- Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-12`.
- Triagem automática: `Material — estrutura global e sessão`.
- Segurança: `Aplicável — revisão proporcional`.
- Implementação: a sidebar foi substituída por `TopNavigation` responsiva. Desktop expõe marca, destinos autorizados, tema e `Conta`; compacto troca a linha por menu focável. O menu de sessão exibe somente nome, papel textual e `Sair`. `Escape`, clique externo e retorno de foco ao gatilho fecham os menus; a seleção fecha o menu e preserva o foco programático já existente no título da view.
- Guards e sessão: `comparison` continua restrita a `analyst`/`admin`; `team` e `usage`, a `admin`; os controles continuam sendo apenas orientação visual, sem alteração dos controles de servidor. `handleLogout` permanece inalterado: só limpa identidade após `sair()` confirmar sucesso; erro mantém a sessão, mantém o menu aberto e ocupa slot local reservado. Não foram criados endpoint, token, armazenamento de sessão, dependência ou telemetria.
- Arquivos alterados: `apps/web/src/App.tsx`, `apps/web/src/styles.css` e esta task. As alterações paralelas de `VehicleWorkspace` e seus pontos de integração foram preservadas, sem serem assumidas por esta task.
- Verificação: `npm run typecheck`, `npm run build` e `git diff --check` passaram. Inspeção estática confirmou que os únicos usos de `localStorage` no arquivo são tema e onboarding, não sessão ou credenciais.
- Verificação pendente: render sanitizado em desktop/tablet/mobile, navegação por teclado com menu aberto, logout com fixture autorizada e estado de erro real. A automação local segue indisponível (`os error 3`), portanto a task não declara aprovação visual nem fecha critérios dependentes de render.
- Próximo passo: receber/revisar as capturas da casca autenticada ou retomar o checkpoint quando o runtime de automação estiver disponível.
