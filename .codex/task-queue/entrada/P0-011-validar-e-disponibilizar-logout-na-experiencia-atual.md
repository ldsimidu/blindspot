# ❌ Pendente — E01-03 Validar e disponibilizar logout na experiência atual

> Prioridade: P0
>
> Área afetada: autenticação, sessão, API, UI, cookie e logs
>
> Origem ou referência: observação de UX em 2026-09-11; task histórica `P1-011-login-sessao-segura-e-logout.md`; PEK BlindSpot
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-11.`
>
> Triagem automática: `Material — autenticação, sessão, endpoint público e UI.`
>
> Segurança: `Aplicável — autenticação, credenciais, sessão, dados pessoais, API e logs.`

## Pedido

Investigar por que o fluxo de logout não está visível ou utilizável na experiência atual do BlindSpot e entregar um encerramento de sessão claro, acessível e seguro. A investigação deve confirmar se há regressão de UI, indisponibilidade do runtime, incompatibilidade de cookie/rota ou lacuna de implementação; não assumir que a conclusão histórica da P1-011 comprova o comportamento presente.

## Critérios de aceite

- [ ] Pessoa autenticada encontra a ação de sair em local previsível, com rótulo explícito e operação por teclado.
- [ ] A ação comunica carregamento, sucesso e falha sem expor detalhes de sessão, cookie, token, conta ou organização.
- [ ] Logout encerra a sessão no cliente e no servidor quando houver sessão ativa; chamadas repetidas ou sessão já expirada permanecem seguras e idempotentes.
- [ ] Após sair, recursos autenticados não permanecem acessíveis e a pessoa recebe próximo passo claro para entrar novamente.
- [ ] Screenshots antes/depois e evidência dos fluxos desktop e mobile são registrados em `evidence/ux-ui/`.
- [ ] Não há token, cookie, senha, segredo, e-mail ou log bruto versionado como evidência.

## Restrições ou contexto

- Reabrir a P1-011 como evidência histórica, mas validar o runtime e a UI atuais separadamente.
- Preservar o contrato de sessão existente ou documentar a alteração de contrato antes da implementação.
- Aplicar o adapter PEK: a ação deve estar próxima ao contexto autenticado, ser compreensível e apresentar estados/recuperação adequados.
- Não incluir recuperação de acesso, MFA, SSO, RBAC, gestão de membros ou mudança de provedor de identidade.
- Antes de implementar, aplicar Architecture Gate e revisão de segurança; consultar `AGENTS.md`, perfil PDK, contrato de autenticação e estratégia de verificação.

## Arquitetura, segurança e conformidade — 2026-09-11

### Fatos confirmados

- O servidor já expõe `POST /api/auth/logout`: revoga a sessão opaca obtida do cookie, limpa o cookie e retorna `204` mesmo sem sessão válida.
- O cliente já chama essa rota, mas apresenta apenas o ícone `↪` na barra lateral. O rótulo só existe em `title` e `aria-label`, insuficiente para descoberta visual.
- `handleLogout` limpa o estado local em `finally`; portanto, uma falha de rede ou `5xx` faz a interface aparentar logout sem confirmação de revogação no servidor.
- O cookie de sessão existente é `HttpOnly`, `SameSite=Lax`, `Secure` em produção e possui expiração absoluta de 12 horas. Esta task não cria cookie, endpoint, persistência, provider ou dependência.

### Decisão e fluxo

Substituir o ícone ambíguo por uma ação textual explícita `Sair`, no cabeçalho autenticado, mantendo nome acessível e foco visível. Durante a chamada, desabilitar a ação e comunicar `Encerrando sessão…`. Somente após `204` limpar estado local e retornar à tela de login; em falha, manter a sessão local, reabilitar a ação e mostrar mensagem neutra com possibilidade de nova tentativa.

Pessoa usuária: membro autenticado que precisa encerrar acesso compartilhado ou concluir a sessão. Ação primária: sair, próxima ao contexto autenticado. Estados afetados: autenticado, encerrando, falha e encerrado. O escopo não altera autorização de recursos, expiração, retenção, contrato de cookie nem dados de domínio.

### Impacto técnico e verificações

- Arquivos previstos: `apps/web/src/App.tsx`, `apps/web/src/styles.css`, esta task e evidência visual sanitizada quando o ambiente local estiver disponível.
- Não há mudança de schema, API ou persistência; o contrato de logout atual é preservado.
- Verificar TypeScript e build; inspecionar o fluxo estático; executar smoke local somente se ambiente e persistência de autenticação estiverem disponíveis, sem expor credenciais, cookie ou token.

### Revisão de segurança proporcional

- Gatilhos: autenticação, sessão, cookie, endpoint público e logs.
- Fronteira de confiança: navegador autenticado → `POST /api/auth/logout` → cookie `HttpOnly` → sessão persistida. Não há novo tráfego, terceiro ou segredo.
- Controles: o cliente não lê cookie/token; mantém sessão local se não receber sucesso; o endpoint permanece idempotente; erro exibido não enumera sessão; logs não recebem novos dados de autenticação.
- Risco residual: falha de rede pode impedir logout remoto até nova tentativa ou expiração da sessão. O fluxo deixa isso explícito e não simula sucesso.

### Revisão de conformidade proporcional

- Jurisdição: Brasil; referência consultada em 2026-09-11: LGPD consolidada no Planalto (arts. 5, 6, 7 e 46). A base legal permanece a ser validada pelo responsável competente; esta mudança não acrescenta tratamento, compartilhamento, retenção ou terceiro.
- Finalidade: disponibilizar encerramento seguro e compreensível de uma sessão corporativa existente. Dados: identidade mínima de sessão e cookie já existentes; não há dado sensível, criança/adolescente ou transferência internacional no escopo.
- Transparência e minimização: a mensagem informa apenas o estado do encerramento; não revela e-mail, token, cookie ou motivo interno. Retenção e descarte permanecem os do contrato de sessões existente.
- Decisão: seguir. Lucas é o responsável por aceitar risco residual e por validar a interpretação jurídica aplicável ao produto.

### Double-check da arquitetura

- O texto da ação resolve a descoberta sem depender de tooltip, cor ou ícone.
- O erro não força saída local nem divulga informação de sessão.
- A operação remota continua sendo a fonte de verdade para a revogação.
- A arquitetura não promete evidencia visual ou smoke autenticado enquanto o ambiente local não estiver configurado.

### Architecture Gate

`APPROVED — Lucas autorizou a implementação em 2026-09-11.`

## Resultado do agente

- Estado: `🚧 Em execução`
- Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-11.`
- Triagem automática: `Material` — autenticação, sessão, endpoint público e UI.
- Segurança: `Aplicável` — autenticação, credenciais, sessão, dados pessoais, API e logs.
- Implementação: em andamento.
- Arquivos alterados: task refinada; código ainda não alterado nesta etapa.
- Verificação: análise estática confirmou endpoint e cliente existentes; smoke autenticado pendente de ambiente configurado.
- Próximo passo: implementar estados de logout no cliente e executar verificações proporcionais.
