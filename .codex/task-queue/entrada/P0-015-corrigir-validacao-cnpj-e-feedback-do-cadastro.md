# ❌ Pendente — corrigir validação de CNPJ e feedback do cadastro

> Prioridade: P0
>
> Área afetada: interface pública de cadastro, validação de entrada e endpoint público existente
>
> Origem ou referência: `C:\Users\lucas\Downloads\evidencia-cadastrov3\screencapture-localhost-5173-2026-09-11-22_49_38.png` e `...22_49_49.png`; P1-038; PEK v0.9
>
> Arquitetura: `READY — aguarda APPROVED de Lucas antes de implementação.`
>
> Triagem automática: `Material — fluxo público, dados de cadastro, validação cliente/servidor e componente transversal de feedback`
>
> Segurança: `Aplicável — endpoint público, dado identificador de organização, credencial transitória e feedback de erro`

## Pedido

Corrigir os problemas revelados pela evidência V3 do cadastro corporativo: o marco `2` do stepper é deformado, a falha de envio cria feedback que desloca as ações, e a validação de CNPJ só ocorre no envio da revisão. Refatorar a experiência de feedback e validar CNPJ no primeiro agrupamento, preservando a não enumeração, o contrato de sessão e os estados reais do servidor.

## Critérios de aceite

- [ ] Os quatro marcos do stepper mantêm círculo perfeito, tamanho de toque/leitura e rótulo legível em desktop, tablet e mobile; o marco `Responsável` não comprime o número `2`.
- [ ] Toast de sucesso/falha de operação é renderizado acima da tela, não altera o fluxo/layout, não desloca CTAs e pode ser dispensado por teclado.
- [ ] Erro de envio mantém explicação persistente e segura próxima da ação, sem mudança de posição dos botões entre estado normal e erro; validação de campo continua junto do campo.
- [ ] CNPJ parcial pode ser digitado sem erro prematuro; ao sair do campo ou tentar `Continuar`, CNPJ inválido bloqueia a etapa `Empresa` com mensagem clara e sem avançar para revisão.
- [ ] Cliente e servidor normalizam para 14 dígitos e aplicam a mesma regra de dígitos verificadores; sequências repetidas e CNPJ matematicamente inválido são recusados no endpoint.
- [ ] A resposta pública do endpoint permanece neutra: não revela existência de empresa, conta, solicitação ou motivo interno; CNPJ, e-mail, senha, token e detalhes internos não aparecem em toast, URL, log ou mensagem pública.
- [ ] Renderes comparáveis em 1440 px, 768 px e 390 px comprovam o stepper, o toast sobreposto, a estabilidade das ações e a etapa Empresa válida/inválida.

## Restrições ou contexto

- Preservar o endpoint `POST /api/organizacoes/cadastro`, formato do payload, resposta de êxito `{ state: "received" }`, cookie `HttpOnly`, rate limit, política de senha e limpeza de credenciais da P1-038.
- A regra desta task valida formato e dígitos verificadores; não consulta Receita Federal, não enriquece dados, não adiciona terceiros, não cria conta, e-mail, prazo, analytics ou persistência de rascunho.
- Não instalar biblioteca, copiar código ou depender de rede. A curadoria PEK de Magic UI, Velora UI, Spell UI, Cult UI, Skiper UI, Originkit, Cruip, Awwwards, Refero Styles e Inspora é referência de padrões; para toast será reaproveitada/evoluída a primitive local `UiToast` com React já instalado.
- Não executar junto de mudanças não integradas em `apps/web/src/App.tsx`, `services/api/index.ts`, `services/api/organizations.ts` ou arquivos de schema. Antes de começar, revisar o estado Git e coordenar ownership desses arquivos.

## Arquitetura, segurança e conformidade — 2026-09-11

### Fatos confirmados

- A evidência V3 de revisão mostra o marcador `2` comprimido horizontalmente. O stepper é uma grade de quatro itens e seu `span` é filho flexível; o marcador não declara tamanho flexível fixo.
- A evidência V3 de falha mostra dois retornos: toast vermelho no topo e alerta inline antes das ações. Embora `.ui-toast-region` use `position: fixed`, `UiToast` é instanciado dentro da árvore de cada tela em `App.tsx`; o alerta inline de falha compartilha o fluxo vertical da revisão e desloca a área de ações.
- `UiToast` já é uma primitive local com região `aria-live`, botão de fechar e CSS de cor. Não há dependência externa necessária para resolver sobreposição e estabilidade.
- Na etapa `Empresa`, `advanceRegistration` aceita qualquer CNPJ não vazio. O servidor em `parseOrganizationRequest` remove caracteres não numéricos e somente verifica `^\d{14}$`; por isso uma entrada inválida recebe retorno apenas no envio final, e entradas de 14 dígitos matematicamente inválidas ainda passam.
- Cadastro lida com nome, CNPJ, nome/e-mail corporativo e senha. O endpoint já responde de forma neutra e o CNPJ é persistido somente como hash após o parse.

### Pessoa usuária, objetivo e fluxo

**Modo:** operar. A pessoa responsável por uma empresa precisa enviar uma solicitação de acesso sem perder tempo com uma etapa inválida ou interpretar movimentos visuais como estado do servidor.

1. Na etapa `Empresa`, a pessoa digita CNPJ; entrada parcial não é tratada como falha.
2. Em `blur` ou `Continuar`, a UI normaliza dígitos e valida tamanho, repetição e dígitos verificadores. Falha mantém a pessoa na etapa e aponta o campo; êxito permite a próxima etapa.
3. No envio final, o servidor reaplica a mesma regra antes de qualquer hash/persistência. Falha pública continua neutra; não há criação parcial.
4. Uma falha de operação confirma-se em toast sobreposto e em uma área reservada de recuperação junto da ação. Como a área já existe no estado normal, botões não saltam. Sucesso mostra toast sobreposto e a tela factual de espera.

### Arquitetura visual PEK por tela

**Alvo e evidência atual.** Estados `registration` (etapas Empresa a Revisão) e `received`/`pending_review`, no canvas de entrada P1-038. As capturas V3 em `C:\Users\lucas\Downloads\evidencia-cadastrov3\` são a evidência específica. Elas demonstram identidade/mídia corretas, mas reprovam a geometria do segundo marco e a gravidade do erro que concorre com o CTA.

**Referências e princípio extraído.** O Design System local define feedback em três camadas: campo, estado persistente e toast transversal. A referência de acesso em `evidence/ux-ui/references/login-cadastro/WhatsApp Image 2026-09-11 at 03.02.33.jpeg` mantém conteúdo limpo e ação estável; dela será reutilizada a área de ação previsível, não a cópia de campos, fontes ou fluxos inexistentes. A curadoria PEK externa não será copiada: a primitive local resolve a necessidade sem pacote, conta, licença ou tráfego adicional.

**Conceito de experiência.** A etapa comunica “o que falta corrigir” sem transformar a pessoa em espectadora de notificações. O stepper é navegação/progresso local e, portanto, todos os marcos têm geometria invariável. Toast comunica uma operação concluída, enquanto o painel preserva a próxima ação e a explicação recuperável.

**Composição e componentes.**

- `RegistrationStepper`: cada marcador adota base fixa (`flex: 0 0 <diâmetro>`), `aspect-ratio: 1`, conteúdo centralizado e rótulo que pode quebrar somente na área de texto. Em largura insuficiente, a grade passa a duas colunas, nunca esmaga o marcador.
- `UiToast`/`ToastRegion`: renderização por portal no `document.body`, com `position: fixed`, `z-index` de overlay, `inset` com safe area e largura responsiva. É uma camada de viewport, fora do contêiner da tela e da área de botões. Foco não é roubado em sucesso; falha usa anúncio assertivo seguro e botão de fechar acessível.
- `OperationFeedbackSlot`: região persistente de altura mínima, junto da ação final e depois dela na ordem visual de recuperação. Seu conteúdo só aparece em falha de envio, mas o espaço existe em todos os estados, impedindo layout shift. Não repete CNPJ, e-mail, senha ou resposta interna.
- `UiField`/etapa Empresa: aceita máscara apenas como conveniência visual se não alterar o valor normalizado; erro de formato/dígito fica associado ao input por `aria-describedby`, com foco no primeiro erro ao tentar avançar. A revisão nunca é alcançada com CNPJ inválido localmente.
- Superfícies, canvas, marca, gradiente branco e CTA laranja aprovados na P1-038 permanecem. Esta task declara `NO_IMAGE` e não adiciona movimento.

**Responsividade e acessibilidade.** Em desktop 1440 px, quatro marcos ficam na mesma linha com diâmetro constante; em 768 px mantêm rótulo legível; em 390 px usam duas colunas. Toast respeita margem de viewport/safe area, não encobre o controle focado e não bloqueia clique fora dele. A área de feedback é anunciada, contraste adequado e não depende só de vermelho ou laranja. Reduced motion não altera a legibilidade nem cria animação obrigatória.

### Impacto técnico e decisão de implementação

- Frontend: `apps/web/src/App.tsx`, `apps/web/src/ui/primitives.tsx`, `apps/web/src/design-system.css`, `apps/web/src/styles.css` e teste/smoke proporcional. Separar erro de validação da etapa de erro da operação de rede/servidor.
- Backend: `services/api/index.ts` e teste de contrato proporcional. Extrair uma função pura de normalização/validação de CNPJ em local portável para as duas camadas **somente após confirmar a resolução TypeScript/Vite**; se a base não oferecer módulo compartilhado seguro, manter implementações pequenas e testadas contra os mesmos vetores, sem importar runtime de servidor no browser.
- Contrato: rota, payload e resposta de êxito não mudam. A aceitação do endpoint torna-se mais estrita para CNPJ inválido; retorno de recusa permanece neutro e compatível com a não enumeração.
- Dados e confiabilidade: normalizar antes de validar e hashear somente valor válido. Não persistir, logar ou expor o CNPJ no feedback. O servidor continua a fonte de aceitação.

### Revisão de segurança proporcional

- **Gatilhos:** endpoint público de cadastro, CNPJ potencialmente associado a MEI, credencial transitória, hash de identificador e feedback de erro.
- **Ameaças relevantes:** bypass de validação cliente; divergência cliente/servidor; enumeração por mensagem detalhada; CNPJ/e-mail/senha vazados em toast; toast renderizado sob/na árvore que permite sobreposição ou captura indevida de foco.
- **Controles propostos:** validação autoritativa no servidor; regra cliente como orientação, não como autorização; mensagem pública neutra; hash apenas após validação; portal sem conteúdo sensível; sem `localStorage`, URL ou logging adicional; manter limites de senha/cookie/rate limit existentes.
- **Verificações:** vetores válidos/inválidos de CNPJ no cliente e endpoint; inspeção de mensagens/DOM sem PII; teste de layout com falha de operação garantindo mesma posição das ações; teclado/ESC ou botão fechar conforme primitive; build/typecheck e teste de contrato. Não usar CNPJ real em evidências.
- **Risco residual:** validar dígitos não prova que a empresa existe nem sua situação cadastral; isso exige fonte externa e fica explicitamente fora do escopo. Lucas aceita o risco residual se aprovar a task.

### Revisão de conformidade proporcional

- **Jurisdição/fonte:** Brasil; LGPD consolidada, Lei nº 13.709/2018, arts. 5º, 6º, 7º, 8º, 9º e 46, consultada em 2026-09-11 em https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm; ANPD em https://www.gov.br/anpd/.
- **Finalidade e titulares:** identificar a organização solicitante e a pessoa responsável para criar solicitação corporativa. O CNPJ pode se relacionar a MEI; por precaução é tratado como identificador que não deve aparecer em feedback ou evidências.
- **Dados/destino:** não há nova coleta, terceiro, IA, analytics, cookie, transferência internacional ou retenção. A mudança reduz o processamento inútil de identificadores inválidos e preserva hash/armazenamento existentes apenas após aceitação.
- **Pendência/responsável:** hipótese legal, controlador e política de retenção não mudam e continuam sob validação do responsável competente. Esta revisão não é parecer jurídico.

### Plano incremental e verificações

1. Confirmar ownership e estado Git dos arquivos compartilhados; criar utilitário de CNPJ com vetores sanitizados e aplicar servidor primeiro.
2. Aplicar validação de etapa Empresa, associação acessível de erro e impedir avanço inválido.
3. Refatorar `UiToast` para região portalizada e criar slot de feedback de operação sem deslocamento.
4. Corrigir geometria do stepper e breakpoints; verificar cadastro, revisão, espera, recusa e falha de envio.
5. Executar testes de regra/contrato, typecheck/build e checkpoint PEK de primeira renderização em 1440/768/390 px com teclado e reduced motion.

### Double-check da arquitetura

- A proposta corrige o marcador sem reduzir rótulo, depender de cor ou mudar o progresso factual.
- Toast deixa de competir espacialmente com CTAs porque sua camada é externa ao layout; a explicação persistente não desaparece, mas não muda a posição da ação.
- A regra CNPJ ocorre cedo para orientar, mas o servidor continua aplicando-a antes de hashing/persistência. Nenhuma mensagem revela dados/duplicidade/existência.
- A arquitetura não promete consulta fiscal, aprovação, e-mail, status ou integração inexistente.
- A P1-038 permanece a dona do fluxo de acesso; esta P0 somente corrige os defeitos confirmados e deve integrar sem reescrever sua composição aprovada.

### Architecture Gate

`READY — Lucas precisa aprovar esta arquitetura antes de qualquer CSS, JSX, primitive, endpoint ou teste de implementação.`

## Resultado do agente

- Estado: `❌ Pendente`.
- Arquitetura: `READY — aguarda APPROVED de Lucas`.
- Triagem automática: `Material — fluxo público, dados de cadastro, validação cliente/servidor e feedback transversal`.
- Segurança: `Aplicável — revisão proporcional registrada`.
- Implementação: ainda não iniciada.
- Arquivos alterados: esta task.
- Verificação: evidências V3, código de UI/API, Design System, contrato PEK, segurança e conformidade revisados; não houve execução de runtime nem alteração de código.
- Próximo passo: Lucas aprovar, ajustar ou rejeitar a arquitetura; só `APPROVED` libera implementação.
