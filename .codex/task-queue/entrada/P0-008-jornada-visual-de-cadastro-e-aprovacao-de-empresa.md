# ✅ Concluída — Jornada visual de cadastro e aprovação de empresa

> Prioridade: P0
>
> Área afetada: interface, autenticação, API, persistência, operações e documentação
>
> Origem ou referência: jornada solicitada por Lucas em 2026-09-08; `docs/product/backlog.md` E01-01–E01-03
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-08.`
>
> Triagem automática: `Material — altera o ciclo de identidade, estados de organização, login e endpoints internos.`
>
> Segurança: `Aplicável — senha, estado de conta, API pública/interna, CNPJ/e-mail, sessão e enumeração.`

## Pedido

Entregar uma jornada gráfica completa para a empresa criar seu cadastro no BlindSpot, ficar em espera enquanto a operação avalia a solicitação, receber o estado correto ao tentar entrar e acessar o sistema com seu e-mail e senha somente após aprovação.

No MVP, a equipe BlindSpot operará a aprovação e recusa por uma coleção de cURLs versionada no repositório. A coleção também deve permitir listar solicitações em espera. Nenhuma chave real pode constar nos arquivos.

## Critérios de aceite

- [ ] A pessoa usuária consegue, pela interface, informar empresa, CNPJ, responsável, e-mail corporativo, senha e aceite de privacidade; a submissão não concede sessão nem revela se uma empresa/e-mail já existe.
- [ ] Enquanto a solicitação estiver em espera, um login com credenciais válidas mostra a tela “Estamos verificando sua empresa”, com estado e orientação de atualização/contato; credenciais inválidas continuam recebendo resposta neutra.
- [ ] Após aprovação, o mesmo e-mail e senha passam a criar sessão; após recusa, as credenciais válidas mostram uma tela de recusa e orientação de suporte, sem expor detalhes internos.
- [ ] Existe coleção documental de cURLs para listar solicitações em espera e aprovar ou recusar por endpoint interno autenticado; exemplos usam variáveis de ambiente e não registram token, senha, cookie, CNPJ ou e-mail reais.
- [ ] Estados de interface, API, banco, backlog e fluxograma usam a mesma máquina de estados e não deixam convite, conta pendente e organização ativa em contradição.
- [ ] `docs/product/backlog.md` descreve o novo fluxo como comportamento comprovado, incluindo estados, regras de transição, limites do MVP, operação por cURL e dependências que permanecem em P1-012/P1-013; não pode manter afirmações contraditórias sobre convite, senha e aprovação.
- [ ] `docs/product/fluxograma-desenvolvimento-agente.md` contém um fluxo detalhado, navegável em Mermaid, sob a perspectiva da pessoa usuária: cada tela, clique, preenchimento, submissão, espera, atualização, login, aprovação, recusa, erro e destino posterior é representado por nó e transição observáveis.

## Jornada de experiência que a implementação e a documentação devem cobrir

### 1. Entrada e cadastro da empresa

1. A pessoa abre o BlindSpot e vê a tela **Acessar BlindSpot**.
2. Ela escolhe entre os botões **Entrar** e **Cadastrar minha empresa**.
3. Ao clicar em **Cadastrar minha empresa**, abre a tela **Criar cadastro corporativo**, com nome da empresa, CNPJ, nome do responsável, e-mail corporativo, senha, confirmação de senha e aceite de privacidade.
4. A pessoa preenche os campos; a interface mostra validação de formato, senha e aceite sem confirmar se CNPJ ou e-mail já existem.
5. Ao clicar em **Enviar cadastro**, a interface desabilita o botão, mostra progresso e envia uma única solicitação idempotente.
6. Em sucesso, a pessoa vê **Cadastro recebido — estamos verificando sua empresa**, com protocolo seguro se a política permitir, explicação de que ainda não há acesso, botão **Verificar status** e canal de suporte. Repetição da solicitação continua com resposta segura e não revela duplicidade.
7. Em erro recuperável, a tela preserva somente campos seguros para correção; em falha inesperada, mostra mensagem neutra e opção de tentar novamente.

### 2. Tentativa de login enquanto a empresa é avaliada

1. A pessoa volta à tela **Acessar BlindSpot**, digita o mesmo e-mail e senha e clica em **Entrar**.
2. Senha ou e-mail inválidos retornam somente **Não foi possível entrar com essas credenciais**, sem informar existência da conta ou empresa.
3. Credenciais válidas com empresa `received`/`under_review` levam à tela **Estamos verificando sua empresa**; ela mostra estado compreensível, o que acontece a seguir, botão **Atualizar status**, botão **Voltar ao login** e suporte. Não cria sessão nem exibe dados internos da operação.
4. Credenciais válidas com empresa `rejected` levam à tela **Não foi possível aprovar sua empresa**, com mensagem de contato ao suporte e botão **Voltar ao login**; não mostra motivo interno, dados de outros registros ou chave operacional.
5. Credenciais válidas com empresa `approved`/`active` criam sessão e levam ao dashboard autorizado da fase atual.

### 3. Operação MVP por cURL

1. Operador configura localmente `BLINDSPOT_API_URL` e `OPERATOR_APPROVAL_KEY` no terminal, nunca no arquivo versionado.
2. Ele executa o comando **Listar empresas em espera** e recebe somente campos sanitizados necessários para decisão, com paginação/limite explícito.
3. Ele escolhe um protocolo/identificador retornado e executa **Aprovar empresa** ou **Recusar empresa**; a coleção demonstra corpo válido, resposta esperada e efeitos de estado.
4. Repetir uma decisão, usar chave ausente ou inválida, ou informar identificador malformado recebe erro neutro e não altera estado indevidamente.
5. O README da coleção explica que essa é operação MVP interna, não um painel administrativo, e registra o substituto futuro (RBAC/painel em P1-013/P1-014).

## Entregáveis documentais obrigatórios

### Backlog

Atualizar `docs/product/backlog.md` no mesmo corte da implementação, no mínimo:

- a seção **Conta e acesso corporativo** com o passo a passo de cadastro, espera, login pendente, aprovação, recusa e acesso ativo;
- E01-01, E01-02 e E01-03 com o novo contrato e a decisão sobre a precedência do convite P1-010;
- tabela de estados e transições permitidas, incluindo `draft` quando existir, `received`, `under_review` se adotado, `approved`, `rejected`, `active`, `suspended` e estados de sessão, distinguindo estado planejado de estado implementado;
- cURLs internos, diretório da coleção, segredo exigido e limites explícitos do MVP;
- rastreabilidade de critérios para API, UI, persistência, segurança e verificação.

### Fluxograma da jornada de usuário

Atualizar `docs/product/fluxograma-desenvolvimento-agente.md` com uma seção dedicada **Cadastro, espera, aprovação e login — visão da pessoa usuária**. O Mermaid deve usar verbos de interação e resultados visíveis, não apenas nomes de endpoints. Ele precisa conter, no mínimo, esta sequência e seus ramos:

```text
Abrir BlindSpot
  → clicar “Cadastrar minha empresa”
  → preencher formulário
  → validar campos
  → clicar “Enviar cadastro”
  → “Cadastro recebido / estamos verificando”
  → clicar “Atualizar status”
      → ainda em análise → permanecer na mesma tela com orientação
      → aprovado → “Empresa aprovada” → clicar “Entrar” → inserir e-mail/senha → dashboard
      → recusado → “Empresa não aprovada” → suporte / voltar ao login

Abrir BlindSpot
  → clicar “Entrar”
  → inserir e-mail/senha
  → clicar “Entrar”
      → credenciais inválidas → erro neutro / tentar novamente
      → empresa em análise → “Estamos verificando sua empresa”
      → empresa recusada → “Empresa não aprovada”
      → empresa ativa → sessão criada → dashboard
      → limite de tentativas → aguardar / suporte
```

O fluxograma também deve ter uma faixa separada de operação interna, ligada por eventos de estado — **listar pendentes → analisar → aprovar | recusar** — sem representar a chave do operador, o cURL ou dados privados como conteúdo visível à pessoa usuária. Cada nó deve indicar estado, ação disponível e retorno ao usuário; setas de erro, repetição e atualização não podem ficar soltas ou sobrepostas.

## Restrições ou contexto

- P1-009/P1-010/P1-011 já implementaram solicitação, decisão temporária por chave, convite e login. A jornada nova precisa decidir explicitamente se substitui o convite inicial para cadastro comum ou se o preserva apenas para um fluxo administrativo separado; não criar os dois caminhos sem regra de precedência.
- Uma senha cadastrada antes da aprovação só pode ser persistida com o mesmo `scrypt`, salt e `PASSWORD_PEPPER` já aprovados; não criar sessão, cookie ou acesso ao catálogo enquanto o estado for pendente ou recusado.
- P1-013 continua responsável por RBAC e proteção de recursos por tenant. Esta task não deve prometer SSO, MFA, recuperação de senha, e-mail transacional, painel operacional completo, rate limit distribuído ou aprovação automática de CNPJ.
- A coleção deve ficar em diretório documental dedicado, proposto como `docs/operations/api-collections/`, com README, variáveis necessárias e comandos `curl` portáveis. Só criar após Architecture Gate aprovado.
- Durante a arquitetura, definir o contrato de **verificar status**: ele não pode permitir descoberta de empresas por CNPJ, e-mail ou protocolo. A proposta deve deixar claro se a tela depende de credenciais válidas, de um token de acompanhamento próprio ou de ambos.

## Preflight, arquitetura e revisão de segurança — 2026-09-08

### Preflight

- **Pedido e recorte:** substituir a lacuna entre cadastro técnico, convite e login por uma jornada autoatendida de cadastro → espera → decisão → login, mantendo a decisão humana MVP via cURL interno.
- **Contratos consultados:** `services/api/organizations.ts`, `authentication.ts`, `credentials.ts`, `db/schema.ts`, `index.ts`, `apps/web/src/App.tsx`, `apps/web/src/api.ts`, `docs/architecture/agent-core/HTTP_PIPELINE.md`, `docs/product/backlog.md`, `docs/product/fluxograma-desenvolvimento-agente.md`, perfil, estratégia de verificação e contrato de segurança.
- **Fatos confirmados:** P1-009 guarda solicitação sem credencial; P1-010 cria credencial somente após convite; P1-011 autentica somente conta/membro/organização `active`; a UI atual mostra apenas login. Os dados necessários já têm PostgreSQL/Neon, `scrypt`, salts, `PASSWORD_PEPPER`, HMAC e limite local de login.
- **Lacuna que decide o desenho:** não existe um contrato seguro de consulta de status por protocolo/e-mail nem um estado de identidade pendente. Um endpoint público de status por identificador permitiria enumeração.
- **Impacto e reversibilidade:** migration aditiva e transições explícitas; o fluxo legado de convite não será apagado nesta task, mas deixará de ser o caminho de autoatendimento. Se a migração/validação falhar, nenhum novo cadastro pode publicar estado parcial; registros existentes P1-010 continuam utilizáveis.
- **Verificação prevista:** typecheck, migration/rollback lógico revisável, smoke de UI/API para cadastro, repetição, pendente, aprovação, recusa, login, sessão, logout e cURLs internos; inspeção de respostas/logs sem segredo. Build será registrado separadamente se o bloqueio preexistente de `vite.config.ts` persistir.

### Decisão de arquitetura proposta

#### Caminho único de autoatendimento

O cadastro comum deixa de depender do convite P1-010. Ao enviar o formulário, o servidor cria **na mesma transação**:

1. `organization_request` em `received`;
2. `organization` em `pending_review`;
3. `account` em `pending`;
4. `organization_member` do responsável em `pending`, com papel inicial `admin` ainda não utilizável;
5. `password_credential` com `scrypt`, salt e `PASSWORD_PEPPER` já existentes;
6. evento append-only sanitizado `received`.

O convite P1-010 permanece compatível apenas como rota técnica de ativação manual/legada para organizações antigas `pending_activation`; ele não aparece na interface nem é usado em novos cadastros. A documentação deve declarar essa precedência. A criação de membros posterior continua em P1-014; RBAC de recursos, em P1-013.

#### Estados e transições

| Entidade | Estado | Pode ir para | Regra |
|---|---|---|---|
| Solicitação | `received` | `approved` ou `rejected` | decisão única do operador MVP |
| Organização | `pending_review` | `active` ou `rejected` | acompanha a decisão da solicitação na mesma transação |
| Conta | `pending` | `active` ou `rejected` | tem senha, mas nunca sessão enquanto não `active` |
| Membro inicial | `pending` | `active` ou `rejected` | papel `admin` só é utilizável em `active` |
| Sessão | inexistente | criada ou inexistente | criada somente quando as quatro condições ativas forem verdadeiras |

Não há transição automática de `rejected` para `received`; suporte/operação abre uma nova decisão ou fluxo futuro explicitamente autorizado. `suspended` permanece reservado para P1-013/P1-014 e não é introduzido como caminho visual nesta task.

#### Contratos HTTP

| Ação | Contrato proposto | Resposta segura |
|---|---|---|
| Cadastro público | `POST /api/organizacoes/cadastro` com empresa, CNPJ, responsável, e-mail, senha, confirmação validada no cliente e versão de privacidade | `202 { state: "received" }`; sem sessão, senha, token, detalhe de duplicidade ou estado de outro cadastro |
| Login | mantém `POST /api/auth/login` | credenciais inválidas → `401` neutro; credenciais válidas pendentes → `403 { state: "pending_review" }`; válidas recusadas → `403 { state: "rejected" }`; ativas → `200` + cookie, sem token no JSON |
| Atualizar a espera | a própria tela reapresenta `POST /api/auth/login` usando credenciais mantidas **somente em memória** | não haverá endpoint público por protocolo, CNPJ ou e-mail; após recarregar, a pessoa digita novamente as credenciais |
| Listar pendentes (interno) | `GET /api/operacoes/organizacoes/solicitacoes?state=received&page=1&page_size=20`, com `x-operator-approval-key` | `200` com protocolo, razão social, contato, e-mail, data e estado necessários à operação; sem hash, senha, credencial, token ou detalhes de outras coleções |
| Decidir (interno) | reutiliza `POST /api/organizacoes/solicitacoes/:protocol/decisao` com `approved` ou `rejected` e chave temporária | `200` com estado final; chave inválida/identificador inválido/decisão repetida falham fechados e sem transição |

Os `403` específicos só são possíveis **depois** que e-mail e senha são verificados. Isso preserva não enumeração para credenciais inválidas, mas permite que a pessoa legítima receba o estado real da própria empresa. O frontend mapeia somente `pending_review` para “Estamos verificando sua empresa” e `rejected` para “Não foi possível aprovar sua empresa”; nenhuma mensagem traz motivo interno de recusa.

#### Interface e navegação

1. A tela de login ganha o botão acessível **Cadastrar minha empresa**.
2. O formulário de cadastro valida localmente campos, confirmação de senha e privacidade; no envio, chama somente a rota pública e vai para **Cadastro recebido**.
3. A tela de espera permite **Atualizar status**, **Voltar ao login** e suporte; não persiste senha em `localStorage`, URL, log ou query string.
4. Login pendente/recusado troca de tela sem sessão. Login ativo segue para o dashboard atual. Logout continua revogando sessão.
5. Estados de carregamento, rede indisponível e limite de tentativas têm foco, `aria-live` e ação de recuperação; a UI não transforma `401` em “empresa não encontrada”.

#### Persistência e migração

- Migration aditiva `0006`: estados `pending_review`/`pending`/`rejected` onde necessários, relações da solicitação com organização, conta e membro inicial, e campos mínimos para preservar a transação. Não reescreve credenciais existentes.
- Cadastros P1-010 existentes permanecem `active` e continuam autenticáveis. Organizações antigas `pending_activation` não são convertidas automaticamente; a operação pode usar o convite legado ou uma migration/backfill futuro aprovado.
- A operação de aprovação/recusa atualiza solicitação, organização, conta, membro e evento no mesmo `transaction`; falha em qualquer parte não deixa uma conta apta sem organização ativa.

### Revisão de segurança proporcional

#### Escopo e gatilhos

- **Mudança:** cadastro público com senha antes da aprovação, status visível a credencial válida, decisão interna por chave, persistência e UI.
- **Gatilhos:** autenticação, dados pessoais/corporativos, senha, segredo, sessão, API pública/interna, persistência, logs e auditoria.

#### Fronteiras, ameaças e controles

| Ameaça ou falha | Controle obrigatório |
|---|---|
| Enumeração de e-mail, empresa, CNPJ ou protocolo | cadastro e credencial inválida usam mensagens neutras; nenhuma consulta pública por identificador; estado só após senha correta |
| Uso de senha antes da aprovação | `scrypt`/salt/pepper desde a criação; conta/membro/organização pendentes bloqueiam sessão e acesso |
| Corrida entre decisão e login | transação na decisão e revalidação de todos os estados ao criar/lêr sessão |
| Operador ou cURL expostos | chave somente no header/ambiente local; coleção usa variáveis, nunca valores; respostas e exemplos não contêm dados reais |
| Vazamento em logs | senha somente no corpo e nunca logada; cookie/token não entram em JSON/log; protocolos não são exibidos em fluxo público |
| Força bruta e automação | limite local atual preservado; formulário não expõe sinal adicional; limitação distribuída continua risco residual |
| Conta recusada usada para inferência | tela de recusa apenas após verificação completa de senha; não mostra razão, CNPJ ou responsável |

#### Risco residual e responsável

- Não há e-mail de confirmação, MFA, recuperação, CSRF token explícito, rate limit distribuído, verificação fiscal nem painel RBAC. Estes limites são conhecidos e ficam em P1-012/P1-013/P1-014 ou decisão posterior.
- A chave temporária de operação não é apropriada para produção multioperador; é aceita somente como MVP interno até RBAC. Lucas é o responsável por aceitar/reavaliar esse risco antes de produção.

### Plano incremental e verificações

1. Definir schema/migration e adaptar o serviço de organização sem alterar as credenciais existentes; revisar rollback lógico e estados iniciais.
2. Adaptar login para os quatro resultados e criar listagem interna paginada com autorização por chave.
3. Implementar telas de cadastro, recebido, pendente, recusado e login ativo; não armazenar senha fora da memória do formulário.
4. Criar `docs/operations/api-collections/README.md` e coleção de cURLs com variáveis de ambiente, listagem, aprovação e recusa, sem segredos.
5. Atualizar backlog, fluxograma detalhado de usuário e pipeline HTTP somente após os comportamentos existirem; executar typecheck, smoke e revisão de logs/respostas.

### Double-check da arquitetura

- Reabertos os contratos atuais: hoje P1-009 não cria conta, P1-010 exige convite e P1-011 só aceita `active`; a migration/serviço acima é necessária para a experiência solicitada e não pode ser simulada somente pela UI.
- O “Atualizar status” não ganha token novo, protocolo público ou armazenamento de senha: repete autenticação com credenciais somente em memória, impedindo endpoint de enumeração.
- O convite legado não é removido nem confundido com novo cadastro; somente `pending_activation` antigo o usa. O fluxo novo não coloca token de convite na URL, histórico ou log.
- Aprovação não cria sessão automaticamente; exige novo login com credenciais já verificadas. Recusa não fornece motivo interno.
- A coleção cURL é documentação operacional e não uma interface administrativa; não cria dependência, ferramenta externa ou credencial no Git.
- A proposta não afirma que endpoints atuais de catálogo estejam protegidos por RBAC; essa lacuna permanece explicitamente em P1-013.

## Resultado do agente

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-08.`
- Triagem automática: `Material` — exige refinamento e Architecture Gate.
- Segurança: `Aplicável` — revisão proporcional registrada nesta task.
- Implementação: `POST /api/organizacoes/cadastro` cria solicitação, organização, conta, membro inicial e credencial pendentes em uma transação; a decisão interna sincroniza os quatro estados. `POST /api/auth/login` agora distingue, somente após senha válida, `pending_review`, `rejected` e sessão autenticada. A interface oferece cadastro, espera, atualização por credenciais somente em memória, recusa e login ativo. A coleção interna MVP ficou em `docs/operations/api-collections/`.
- Arquivos alterados: migration `0006`, schema/serviços/rotas API, interface React/CSS, pipeline HTTP, backlog, fluxograma e coleção operacional.
- Verificações executadas: `npm run typecheck` passou; `npm run db:migrate` aplicou `0006` no Neon; smoke Neon com empresa sintética confirmou `pending_review → approved → authenticated`, listagem interna, emissão de sessão, `rejected`, decisão repetida bloqueada e credencial inválida neutra; `git diff --check` passou.
- Verificação bloqueada: `npm run build` não concluiu no sandbox por acesso negado e resolução de `vite.config.ts`; isso é limitação preexistente do sandbox, pois o Vite iniciou no ambiente local de Lucas. Não foram enviados provider real, dados reais nem segredos.
- Limitações e risco residual: chave de operador por header é somente MVP interno; não há painel/RBAC, MFA, recuperação, e-mail transacional, CSRF explícito, rate limit distribuído nem autorização de recursos por tenant. P1-012/P1-013/P1-014 permanecem responsáveis por esses cortes.
- Próximo passo: usar a coleção interna para análise MVP e priorizar P1-013 antes de expor recursos corporativos a múltiplas organizações.
