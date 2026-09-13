# ❌ Bloqueada — Integrar estados e proveniência no workspace PEK

> Prioridade: P1
>
> Área afetada: interface
>
> Origem ou referência: P1-046; proposta (2), seções 24 a 27 e 69 a 71
>
> Arquitetura: `A avaliar — depende da estabilização do frontend PEK e ownership explícito.`
>
> Triagem automática: `Material — consumo visual de estado e explicação autenticada.`

## Pedido

Exibir estados versionados de variável, alternativas de conflito e explicação segura no workspace de ficha, consumindo o endpoint backend da P1-046 sem inferir status no cliente.

## Critérios de aceite

- [ ] Todo estado possui rótulo textual, sem depender somente de cor, e `inferred`/`calculated`/`user_provided` nunca usam apresentação de confirmado.
- [ ] Conflitos exibem alternativas e fontes permitidas; não exibem URL, trecho, prompt, query, modelo ou metadado interno.
- [ ] Estados `pending`, `blocked` e `research_exhausted` têm leitura factual e não oferecem ação automática de pesquisa.
- [ ] Há evidência PEK/Design System para desktop, tablet, mobile, teclado, vazio e erro.

## Restrições ou contexto

- Depende do endpoint `GET /api/ficha-tecnica/versoes/:id/explicacao-variavel?path=<grupo.campo>` da P1-046.
- Não tocar em runtime, schema, migrations, políticas, pesquisa ou API. Executar somente após estabilização e ownership do frontend PEK.

## Resultado do agente

## Reescrita UX/UI — 2026-09-12

Esta task adota `docs/product/ux-ui-future-task-redesign-standard.md`: cada atributo mostrará valor, estado humano, limite e proveniência em disclosure progressivo; conflitos não serão tabela plana nem dependerão de cor. A arquitetura deve confirmar o contrato e proibir exposição de metadados internos.

- Estado: `❌ Pendente — handoff visual explicitamente adiado por decisão de Lucas.`
- Próximo passo: aplicar Architecture Gate PEK/Design System quando o frontend estiver estável.

## Architecture Gate visual e técnico — 2026-09-12

### Fatos, decisão e escopo

- A ficha já expõe linhas de atributo no `TechnicalFichaWorkspace`; a versão selecionada no workspace organizacional identifica de forma autenticada qual explicação pode ser lida.
- O endpoint existente é tenant-scoped, auditado e allowlisted. Ele devolve somente estado, versão, razões enumeradas, referências/evidências permitidas, título/tipo/data da fonte e alternativas; URL, trecho, prompt, query, modelo, agente, token e metadado interno não pertencem ao contrato.
- Decisão: incluir um disclosure por atributo, carregado somente por ação explícita, e apresentar alternativas apenas quando o servidor as devolver. Não há inferência de estado, alteração de API/runtime/schema, pesquisa automática ou armazenamento persistente no cliente.

### Arquitetura PEK

- **Tela e composição:** `TechnicalFichaWorkspace`, aba Especificações. Valor e estado ficam na primeira leitura; o controle “Ver proveniência” abre um painel local abaixo da linha, com estado, razão, fontes permitidas e alternativas de conflito. `NO_IMAGE`; nenhum movimento novo.
- **Referências e sistema:** aplica disclosure progressivo e contexto persistente das referências da ficha, sem copiar UI externa. Usa `UiStatus`, cards/linhas e tokens existentes; nenhuma dependência externa será instalada.
- **Responsividade/a11y:** desktop preserva as duas colunas da linha; tablet/mobile empilham o painel. O controle é um botão semântico com `aria-expanded`, foco previsível e texto para todo estado. Cor não é o único sinal.
- **Estados:** loading local não simula pesquisa; vazio/404/403 recebem mensagem neutra; `pending`, `blocked` e `research_exhausted` descrevem limite factual e não oferecem CTA de pesquisa. `inferred`, `calculated` e `user_provided` nunca recebem rótulo/tom de confirmação.

### Segurança, conformidade e double-check

- **Segurança aplicável:** leitura autenticada de explicação por revisão/caminho. A fronteira é atributo visível → ID/version/path do contexto autorizado → endpoint server-owned. Reutilizar `credentials: same-origin`, não registrar resposta em log/toast e não expor IDs internos como conteúdo. A UI não interpreta 403/404 como prova de acesso.
- **Conformidade:** não aplicável neste recorte visual: não cria coleta, categoria, retenção, terceiro, analytics ou transferência; consome apenas a resposta minimizada já aprovada.
- **Double-check:** caminhos vêm da própria ficha aberta; o cliente não monta URL, não exibe campos proibidos e não elege vencedor de conflito. Desktop 1440, tablet 768, mobile 390 e teclado serão verificados no checkpoint de renderização.

`VISUAL_READY` e `APPROVED — Lucas autorizou a retomada das pendências de frontend em 2026-09-12.`

## Resultado do agente — 2026-09-12

- Implementação entregue: tipos/cliente para a explicação permitida e disclosure por atributo na aba Especificações. O botão semântico carrega sob demanda estado, razões, fontes permitidas e alternativas; `confirmed`, `inferred`, `calculated`, `user_provided`, ausência, conflito, `pending`, `blocked` e `research_exhausted` têm rótulos textuais distintos.
- Proteções: nenhuma URL, trecho, prompt, query, modelo, agente, token ou metadado interno é renderizado; conflito sem alternativas continua honesto e sem vencedor automático; a falha de leitura é neutra e não cria CTA de pesquisa.
- Verificações aprovadas: `npm run typecheck`, `npm run build` fora do sandbox e `git diff --check`.
- Bloqueio real compartilhado com P1-051: não há versão de ficha autorizada disponível no ambiente para disparar a explicação e capturar o painel preenchido nos três breakpoints. A task aguarda somente esse checkpoint visual e de teclado com dado real/sanitizado; não falta contrato ou implementação.
- Commit: não criado para não misturar os arquivos não rastreados do workspace com alterações paralelas do PEK.
