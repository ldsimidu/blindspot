# ✅ Concluída — E04-01 Gerir membros e revogar acesso

> Prioridade: P1
>
> Área afetada: organizações, autorização, UI e auditoria
>
> Origem ou referência: `docs/product/backlog.md` E04-01
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-08.`
>
> Triagem automática: `Material — altera papéis e acesso a dados corporativos.`
>
> Segurança: `Aplicável — autorização, revogação, dados pessoais e auditoria.`

## Pedido

Permitir que administradores gerenciem membros, papéis, convites e desativação, revogando sessões sem apagar a trilha aprovada.

## Critérios de aceite

- [ ] Admin só altera membros de sua organização.
- [ ] Revogação encerra acesso ativo conforme política.
- [ ] Ações são auditáveis e não expõem dados de outras organizações.

## Restrições ou contexto

- Depende de P1-013; não introduz papéis customizados ou ABAC complexo.

## Preflight, arquitetura e revisão de segurança — 2026-09-08

### Fatos confirmados

- P1-013 já deriva `organizationId`, `memberId` e `viewer|analyst|admin` da sessão opaca e nega por padrão. `admin` ainda não tem rotas próprias de equipe.
- `organization_members` tem e-mail, papel e estado, mas `account_id` é obrigatório; `accounts.email` é globalmente único; e o login atual requer exatamente uma credencial/membership candidata. Portanto, o corte atual é **uma identidade ativa em uma organização**, sem associação de uma mesma conta a vários tenants.
- A revogação de sessão já existe em `auth_sessions.revoked_at`; a leitura de sessão falha para membro não ativo. `audit_events` recebe somente campos estruturados e já não expõe payload, cookie, token, prompt ou resposta LLM.
- Os convites implementados são exclusivos do primeiro administrador de organizações legadas `pending_activation`, operados pela chave interna. Não atendem convite de membros de uma organização ativa.
- Não há provider de e-mail, fila de entrega, painel de operador corporativo nem gestão de membros na interface. Não é seguro fingir que um convite foi entregue por e-mail.

### Decisão de arquitetura

#### Escopo e fluxo de pessoa usuária

1. Administrador autenticado abre **Equipe** e recebe apenas membros ativos/inativos e convites da própria organização, com nome, e-mail, papel, estado e datas necessárias.
2. Clica em **Convidar membro**, informa e-mail corporativo e papel inicial (`viewer`, `analyst` ou `admin`). O servidor valida o e-mail, exige organização/ator `active`, impede e-mail já cadastrado e cria conta/membro `pending` mais convite de uso único, tudo na mesma transação.
3. A resposta mostra ao administrador o link de ativação **uma única vez**. No MVP, ele o transmite pelo canal corporativo autorizado; nenhum e-mail é alegado, enviado ou registrado. O token de 32 bytes é guardado somente como HMAC, expira em 72 horas e nunca aparece em logs, auditoria ou consultas posteriores.
4. A pessoa convidada abre o link, informa nome e senha; se convite, conta e membro ainda estiverem válidos, a ativação consome o convite e torna conta/membro `active` em uma transação, sem criar sessão. Ela então faz login normalmente.
5. Administrador pode mudar o papel de outro membro ativo, revogar convite pendente ou desativar outro membro. Desativar atualiza o membro, revoga todas as sessões não revogadas daquele membro e grava auditoria na mesma transação. Não há exclusão física.

#### Matriz de permissão e invariantes

| Ação | viewer | analyst | admin |
|---|---:|---:|---:|
| Ler a própria equipe/convites | não | não | sim |
| Criar ou revogar convite | não | não | sim |
| Alterar papel ou desativar membro | não | não | sim |
| Alterar membro de outro tenant | não | não | nunca |
| Alterar/desativar a própria conta | não | não | não nesta task |

- Toda rota busca `member_id` ou `invitation_id` junto com `organization_id = actor.organizationId`; UUID nunca basta.
- Não é permitido rebaixar ou desativar o último membro `admin` com estado `active` da organização. O administrador também não altera nem desativa a si próprio neste corte, evitando auto-lockout e regras implícitas de transferência de propriedade.
- Convite só pode ser emitido para e-mail ainda sem `accounts` global; e-mail já existente retorna erro neutro de conflito, sem revelar de qual organização ele é.
- O novo membro só recebe seu papel no convite; não há papel customizado, SCIM, importação ou seleção de tenant pelo cliente.

#### Dados, APIs e interface

- Migration aditiva cria `organization_member_invitations` com organização, membro/conta pendentes, criador, e-mail/hash, papel pretendido, HMAC do token, estado (`issued|revoked|used`), expiração e timestamps. A tabela recebe índices por organização/estado e hash de token.
- Novas rotas privadas de administrador: listar membros/convites, criar convite, alterar papel, desativar membro e revogar convite. A ativação por token é a única rota pública deste fluxo e retorna falha neutra para token ausente, expirado, revogado ou usado.
- `GET /api/auth/session` passa a retornar somente o papel e a identidade mínima já inferidos, para que a interface mostre **Equipe** somente a administradores; a API continua sendo a barreira efetiva.
- A interface inclui a tela Equipe, tabela acessível, formulário de convite, cópia explícita do link único, confirmação de mudança de papel/desativação e estados vazios/erro. Não armazena token em `localStorage`, URL de navegação interna, log do navegador ou histórico da aplicação além da página pública de ativação.
- Eventos allowlisted: `member.invitation_issued`, `member.invitation_revoked`, `member.activated`, `member.role_changed` e `member.deactivated`; guardam somente IDs, resultado, request ID e data. E-mail, senha, token, motivo livre e conteúdo de formulário ficam fora de `audit_events`.

### Segurança proporcional

| Risco | Controle exigido |
|---|---|
| IDOR ou admin atuar em outro tenant | filtro de organização nos repositórios, não só na UI/middleware; ausência retorna `404` neutro |
| Escalonamento ou perda total de administração | somente admin atua; impedir autoalteração e mudança que deixe zero admins ativos |
| Sessão residual após desativação | update do membro, revogação das sessões e auditoria na mesma transação; sessão já emitida falha na próxima requisição |
| Reuso/vazamento de convite | token aleatório 32 bytes, HMAC no banco, exibição única, 72h, estado atômico e nenhuma presença em logs/auditoria |
| Enumeração por e-mail | resposta de convite não informa tenant, conta ou estado de outro usuário; validação pública de token é neutra |
| Auditoria virar dado sensível | taxonomia allowlisted, sem payload, e-mail, token, senha, IP ou texto livre |

### Plano incremental e verificações

1. Adicionar schema/migration de convites de membros e operações transacionais de convite, ativação, papel, revogação e desativação/sessões.
2. Expor guards `admin` e rotas com filtro de organização; ampliar auditoria somente com eventos estruturados allowlisted.
3. Adicionar tela Equipe, fluxo de cópia/ativação e mensagens acessíveis, sem tratar ocultação visual como autorização.
4. Atualizar pipeline HTTP, backlog e fluxograma detalhado com os estados reais do convite de membro e da revogação.
5. Executar migration no Neon autorizado, `npm run typecheck`, `npm run build` e smoke com duas organizações: listagem/alteração cruzada bloqueada, viewer/analyst negados, convite válido/expirado/revogado, ativação única, último admin protegido, sessão revogada e auditoria sanitizada.

### Double-check da arquitetura

- A estrutura atual não permite membro sem conta; a proposta cria ambos em estado `pending` para preservar chaves estrangeiras e só cria credencial na ativação. Isso não altera o fluxo já ativo de cadastro corporativo.
- Não foi reutilizado o convite inicial legado: ele depende de solicitação/operador e de organização `pending_activation`; misturá-lo com membros ativos permitiria cruzar fronteiras e estados incompatíveis.
- E-mail automatizado foi explicitamente excluído porque não há provider autorizado. O link de cópia única é um limite MVP consciente, não uma promessa de entrega; trocar para e-mail/SSO exige arquitetura e revisão próprias.
- Revogar sessão por si só não impede login novo. Por isso o membro também muda para `inactive`, e a autenticação existente já exige membro `active`.
- A regra do último administrador e a proibição de autoalteração evitam ambiguidades de posse nesta task; transferência de propriedade, múltiplas organizações por conta e recuperação de acesso permanecem fora do escopo.
- O desenho cobre todos os critérios de aceite sem antecipar P1-012, P1-015, SSO, SCIM ou papéis customizados. Está `READY`, mas não autoriza implementação até `APPROVED` explícito.

## Resultado do agente

- Estado: `✅ Concluída`; Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-08`; Segurança: `Aplicável — controles implementados e verificados proporcionalmente`.
- Implementação: migration `0008_organization_member_management` aplicada ao Neon; administrador pode listar apenas sua equipe, gerar/revogar convite de membro, alterar papel de outro membro e desativá-lo. A ativação é de uso único, não cria sessão e usa credencial `scrypt`; desativação revoga todas as sessões não revogadas do membro na mesma transação.
- Interface: adicionadas tela **Equipe** para admin, cópia explícita do link único e página pública de ativação. A UI não substitui os guards de servidor.
- Auditoria: eventos allowlisted de convite, ativação, alteração, revogação e desativação só contêm IDs, resultado, request ID e data; tokens, senha, e-mail e formulário não entram em `audit_events`.
- Verificações: `npm run typecheck` e `npm run build` concluídos; migration concluída; smoke com duas organizações sintéticas confirmou bloqueio cross-tenant, ativação e login bloqueado após desativação, além de evento sanitizado de auditoria.
- Limites deliberados: não há envio automático de e-mail, multi-organização por conta, recuperação/MFA, SSO, SCIM, autoalteração ou transferência de propriedade.
