# 🚧 Em execução — refatorar acesso, cadastro e espera

> Prioridade: P1
>
> Área afetada: interface, autenticação e dados pessoais de cadastro
>
> Origem ou referência: UX-BS-005; `docs/product/ux-ui-direcao-alvo-e-decisoes.md`
>
> Arquitetura: `APPROVED — Lucas autorizou a arquitetura visual v2 em 2026-09-11.`
>
> Triagem automática: `Material — autenticação e fluxo de dados pessoais`
>
> Segurança: `Aplicável — revisar autenticação, sessão, validação e armazenamento no cliente`

## Pedido

Refatorar as telas de login, cadastro corporativo e espera de aprovação para uma jornada em etapas, mantendo os contratos e estados reais do servidor.

## Critérios de aceite

- [ ] Cadastro separa empresa, responsável, credencial/privacidade e revisão sem perder dados em erro local.
- [ ] A espera mostra etapas concluídas, estado atual e próximo passo somente a partir de estados confirmados pelo servidor.
- [ ] Login, aprovação, recusa, erro neutro e atualização de status preservam a não enumeração e não vazam dados.
- [ ] Senha, token e dados de cadastro não são colocados em URL, logs, `localStorage` ou mensagens de erro.
- [ ] Desktop, mobile, teclado e leitores de tela preservam a tarefa.

## Restrições ou contexto

- Ler e aplicar `project-security-assurance` e `project-compliance-assurance` antes de implementar.
- Preservar fluxos, limites de senha, cookie HttpOnly e estados documentados no fluxograma canônico.
- Não criar prazo, push, e-mail ou etapa de aprovação inexistente no runtime.

## Arquitetura, segurança e conformidade — 2026-09-11

### Fatos confirmados

- O cliente já possui cinco vistas de acesso: `login`, `registration`, `received`, `pending_review` e `rejected`. Hoje, o cadastro é um único formulário e a espera resume o estado em uma frase.
- O contrato existente permanece: `POST /api/organizacoes/cadastro` recebe empresa, CNPJ, responsável, e-mail, senha, confirmação e versão do aviso; responde apenas `{ state: "received" }` com `202`. O login pode retornar somente `authenticated`, `pending_review` ou `rejected`.
- A sessão é emitida exclusivamente pelo servidor no login, em cookie `HttpOnly`, e o cliente não recebe token. O servidor rate-limita tentativas e mantém a não enumeração para credenciais inválidas.
- Não existe endpoint de consulta de aprovação, prazo, envio de e-mail, nem evento de mudança de status. O atual botão `Atualizar status` refaz o login com a credencial ainda guardada no estado React após o cadastro.

### Decisão e fluxo propostos

Refatorar somente `apps/web/src/App.tsx` e estilos/primitive já locais, sem alterar endpoint, schema, cookie, banco, provedor ou contrato de autenticação. O cadastro passa por sete microetapas locais agrupadas em quatro macrofases: empresa (nome, CNPJ), responsável (nome, e-mail corporativo), acesso (senha, confirmação/aviso de privacidade) e revisão/envio. Avançar valida somente a informação da microetapa atual; voltar preserva os valores em memória durante a jornada. O envio continua único, somente na revisão.

Após `202`, descartar `password` e `password_confirmation` imediatamente do estado cliente. A tela de espera mostra uma timeline informativa de `Cadastro enviado` e `Em análise`; `Aprovado` e `Recusado` só aparecem se o resultado confirmado do login os informar. Não haverá estimativa, notificação, e-mail, consulta automática ou promessa de aprovação.

O retorno à entrada não deve pré-preencher nem manter a senha. A atualização de status deve pedir a senha novamente na tela de login, em vez de reutilizar credencial mantida na memória. Erros permanecem neutros: não indicam existência de empresa, pessoa, conta ou motivo interno.

### Impacto técnico, dados e confiabilidade

- Recursos sob ownership desta task: `apps/web/src/App.tsx`, `apps/web/src/styles.css` e, se necessário, `apps/web/src/ui/primitives.tsx`. Não tocar em `services/api`, `packages/agent-runtime/assets/`, schema, migrations ou contratos HTTP.
- Dados locais transitórios: nome da empresa, CNPJ, nome/e-mail corporativo, senha, confirmação e versão do aviso. Nada deve ir a URL, `localStorage`, telemetria, logs ou evidência. A senha só segue pelo corpo HTTPS da requisição já existente e é removida da memória após êxito e ao voltar para login.
- Estados confiáveis: a interface apenas interpreta as respostas existentes. `received` é confirmação de recebimento; `pending_review`/`rejected` vêm do login; acesso autenticado só ocorre após resposta `authenticated` e cookie emitido pelo servidor.

### Revisão de segurança proporcional

- Gatilhos: autenticação, credenciais, cookie de sessão, endpoint público e dados pessoais de cadastro. Fronteira: navegador → endpoints já existentes de cadastro/login → persistência e sessão do servidor.
- Ameaça principal: exposição ou retenção desnecessária da senha durante a jornada em etapas, e enumeração de conta/empresa por mensagens ou estados imprecisos.
- Controles: campos `password` com autocomplete apropriado; nenhuma senha/token em URL, armazenamento local, captura ou log; limpeza explícita de senha após envio/retorno; mensagens neutras; rate limit e cookie `HttpOnly` existentes preservados; sem novo tráfego nem terceiro.
- Verificações planejadas: TypeScript/build; inspeção estática de `fetch`, `localStorage` e mensagens; smoke manual de teclado, desktop/mobile, cadastro com dados fictícios em ambiente autorizado e transições de login pendente/recusado quando fixtures legítimas existirem. Não testar credenciais reais nem registrar valores.
- Risco residual: a revisão não comprova a política de retenção nem a base legal do cadastro; Lucas é o responsável pela aceitação de risco residual e pela validação competente antes de produção.

### Revisão de conformidade proporcional

- Jurisdição e fonte: Brasil. Consulta em 2026-09-11 à LGPD consolidada, Lei nº 13.709/2018, arts. 5º, 6º, 7º, 8º, 9º e 46, em https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm; portal de publicações da ANPD consultado em https://www.gov.br/anpd/pt-br/documentos-e-publicacoes.
- Finalidade: solicitar acesso corporativo e autenticar pessoa vinculada à organização. Titulares: responsável de empresa. Dados: nome, e-mail corporativo, credencial e informações da empresa/CNPJ; não há dado sensível, de criança/adolescente, nova transferência internacional, analytics ou terceiro no escopo.
- Transparência/minimização: a etapa de privacidade continua exigindo a versão do aviso já prevista no contrato. Esta tarefa não decide a hipótese legal, controlador, retenção, descarte ou texto do aviso; tais definições devem ser validadas pelo responsável competente. A UI não cria coleta adicional.
- Decisão: seguir condicionado à preservação do contrato e à validação humana acima; esta revisão não constitui parecer ou certificação de conformidade.

### Double-check da arquitetura

- A divisão em etapas melhora compreensão sem enviar dados parciais nem inventar persistência de rascunho.
- A timeline não afirma prazo, contato ou aprovação inexistentes; estados futuros continuam dependentes da resposta do servidor.
- A proposta elimina a permanência da senha no estado após o envio e impede a atualização de status por reutilização silenciosa de credencial.
- O escopo não altera autorização, endpoints, cookie, persistência ou runtime canônico, portanto não requer mudança de schema/prompt nem integração externa.

### Architecture Gate

`APPROVED — Lucas autorizou a implementação em 2026-09-11.`

### Reabertura visual — 2026-09-11

As capturas entregues por Lucas em `C:\Users\lucas\Downloads\screencapture-localhost-5173-2026-09-11-16_41_33.png`, `...16_44_19.png` e `...16_44_36.png` reprovam a composição atual: o painel mantém largura incompatível com revisão e espera; labels do stepper colidem; a área livre do viewport não tem função declarada; e a hierarquia não traduz as referências gerais em `evidence/ux-ui/references/inspiracoes-gerais/references.txt`.

Antes de retomar esta task, aplicar `core/screen-design-architecture-contract.md` do PEK v0.5. A arquitetura visual deve registrar a leitura dessas evidências, das referências gerais e da tela atual, seguida de especificação de canvas, regiões, colunas, stepper, card de revisão, espera, breakpoints, estados e decisão `NO_IMAGE` ou `ImageIntent`. Só após `VISUAL_READY`, novo double-check e aprovação humana a implementação visual pode recomeçar. O código local atual é rascunho não aprovado e não deve ser tratado como design consolidado.

### Arquitetura visual PEK v0.5 — 2026-09-11

Especificação completa: [`docs/product/p1-038-arquitetura-visual-acesso-cadastro-espera.md`](../../../docs/product/p1-038-arquitetura-visual-acesso-cadastro-espera.md).

`APPROVED — Lucas autorizou a arquitetura visual v2 em 2026-09-11.` A arquitetura v2 substitui a composição editorial/tarefa 5/7 por mídia/tarefa 60/40, reintroduz a identidade laranja/preto/branco, separa a narrativa de boas-vindas do formulário e agrupa senha/confirmação na mesma tela.

Curadoria complementar: Magic UI, Velora UI, Spell UI, Cult UI, Skiper UI, Originkit, Cruip, Awwwards, Refero Styles e Inspora foram classificados na seção 10 da especificação. Para esta task, somente uma transição local reduzida entre etapas é proposta; nenhum pacote, template, conta, CLI, MCP ou código externo foi adotado.

## Resultado do agente

- Estado: `🚧 Em execução — arquitetura visual v2 em implementação.`
- Arquitetura: `APPROVED — Lucas autorizou a v2 em 2026-09-11.`
- Triagem automática: `Material — autenticação e dados pessoais`.
- Segurança: `Aplicável — revisão obrigatória`.
- Implementação: a composição v1 foi substituída no acesso por mídia-placeholder/tarefa 60/40 em desktop e faixa de mídia/painel em compacto. A marca usa preto, branco e laranja; o slogan saiu do login/cadastro. O cadastro passou a quatro agrupamentos: empresa, responsável, acesso (senha, confirmação e aviso juntos) e revisão. As transições locais de progresso, interação e mídia respeitam `prefers-reduced-motion`; contratos de autenticação, mensagens neutras e o único envio final foram preservados.
- Arquivos alterados: `apps/web/src/App.tsx`, `apps/web/src/styles.css` e esta task. Foram reutilizados `UiButton`, `UiField` e `UiStatus` da fundação P1-037.
- Verificação executada: `npm run typecheck` e `npm run build` passaram. O checkpoint de primeira renderização compacta confirmou mídia escura com placeholder, painel de tarefa branco, CTA laranja, sem slogan e sem duplicidade de marca após o ajuste corretivo. A estrutura acessível confirma campos de login, CTA e troca para cadastro.
- Verificação pendente: checkpoint desktop/tablet, cadastro com dados fictícios, revisão/espera, teclado e reduced motion em sessão de validação sem autenticação. A sessão existente não foi encerrada e nenhum cadastro real/credencial foi usado.
- Próximo passo: concluir o checkpoint nos demais estados e viewports antes de marcar a task como concluída.
