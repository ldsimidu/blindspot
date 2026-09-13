# ↩️ Revertida — integrar curadoria de imagens com rastreabilidade

> Prioridade: P1
>
> Área afetada: assets, integração externa, segurança, privacidade e interface
>
> Origem ou referência: `docs/product/image-system.md`
>
> Arquitetura: `APPROVED — 2026-09-12; Unsplash com hotlinking e atribuição`
>
> Triagem automática: `Material — provider externo, credencial, licença e metadados de assets`
>
> Segurança: `Aplicável — integração externa, segredo/API key, tráfego de dados e assets`

## Pedido

Implementar, se aprovado, uma curadoria de imagens em desenvolvimento com abstração de provider, Image Intent, ranking revisável, metadados e manifesto de assets. A funcionalidade não pode realizar busca autônoma em produção nem expor credenciais ao cliente.

## Critérios de aceite

- [ ] Provider e termos/licença são aprovados por decisão humana para a finalidade declarada.
- [ ] Chave/API token fica exclusivamente em ambiente seguro; nenhum segredo entra no cliente, Git, log ou manifesto.
- [ ] Busca usa Image Intent, múltiplas queries e candidatos; a seleção final é revisável e não usa o primeiro resultado automaticamente.
- [ ] Asset aprovado registra origem, provider, licença/termos, data, finalidade, atribuição e revisão necessária.
- [ ] Imagem ilustrativa não é apresentada como identidade exata da ficha técnica.
- [ ] Falha de provider, licença incerta ou ausência de candidato produzem Image Specification/placeholder, sem bloquear a tela nem inserir imagem aleatória.

## Restrições ou contexto

- Ler `docs/product/image-system.md`, Design System, contrato PEK de intake e os termos atuais do provider antes do Architecture Gate.
- Aplicar `project-security-assurance` e `project-compliance-assurance`; registrar finalidade, dados enviados, destino, retenção e responsável.
- Não instalar SDK, criar conta, usar chave, baixar ou publicar asset sem autorização específica.
- Não usar imagens das referências como assets do produto.

## Resultado do agente

## Architecture Gate — 2026-09-12

### Triagem e decisão

Esta é a próxima task UX/UI pendente elegível: a P1-037 aparece com cabeçalho desatualizado, mas seu próprio resultado já declara a fundação concluída. A P1-043 é material e tem gatilhos de integração externa, segredo, tráfego de rede, licença e conteúdo de terceiro.

A decisão arquitetural é **não iniciar integração de provider, SDK, download, hotlinking ou persistência de asset nesta etapa**. O Image System já permite uma experiência coerente com `NO_IMAGE`, `ImageSpecification` e placeholders locais; isso preserva o layout e evita representar um veículo ilustrativo como identidade técnica exata.

Opções avaliadas na triagem:

1. `Pexels, curadoria somente em desenvolvimento` — recomendação inicial: API REST server-side, chave somente em ambiente seguro, pesquisa por `ImageIntent` genérico, seleção humana e manifesto de asset aprovado; nenhum resultado é exibido diretamente no produto.
2. `Unsplash, hotlinking e atribuição` — exige aceitar que URLs devolvidas sejam incorporadas diretamente e que a atribuição seja apresentada conforme os termos; não combina com a estratégia atual de asset local aprovado sem nova decisão.
3. `Sem provider por enquanto` — manter Image Intent, Image Specification e placeholder/asset fornecido manualmente; não há integração, segredo ou rede nesta task.

Pixabay e Openverse não são recomendados como primeira integração: ambos exigem curadoria/licença adicional por item; Pixabay também exige chave e algumas URLs têm validade limitada. Eles podem ser reavaliados mediante finalidade específica.

**Decisão humana registrada — 2026-09-12:** Lucas selecionou a opção `2`, **Unsplash com hotlinking e atribuição**. Essa seleção não cria conta, chave, requisição de rede, download ou implantação; ela define a arquitetura abaixo e condiciona a próxima aprovação à aceitação explícita desse modelo.

### Escopo da implementação proposta

Implementar uma curadoria **restrita a pessoas administradoras autenticadas**, para uso em desenvolvimento, composta por:

- `services/api/unsplash-curation.ts`: adaptador HTTP sem SDK, que só aceita um `ImageIntent` validado, converte-o em até três queries editoriais genéricas e normaliza candidatos permitidos;
- `POST /api/curadoria-imagens/unsplash/candidatos`: rota protegida por `requireRole(..., "admin")`, limitada a no máximo 30 candidatos, sem persistir consulta, resultado ou seleção;
- `apps/web/src/api.ts` e `apps/web/src/types.ts`: contrato mínimo de candidato sanitizado e requisição de intenção, sem chave, headers, raw response ou identificadores de conta;
- uma superfície de curadoria marcada como desenvolvimento, com atribuição visível por candidato e ação de **copiar manifesto** para revisão humana — não uma publicação, não uma alteração de ficha e não uma seleção automática;
- `docs/product/assets/` somente para manifestos aprovados manualmente, contendo URL hotlinked, URL da página, autor, atribuição, intent e data. Nenhuma imagem é baixada, versionada no repositório ou tratada como identidade exata sem vínculo verificável.

Ficam fora do escopo: busca pública, pesquisa automática em produção, upload/download, geração de imagem, cache de URL, persistência em banco, integração com ficha técnica, alteração de schema, chamada de provider a partir do cliente, telemetria, analytics, SDK e modificação de `packages/agent-runtime/assets/`.

### Contrato de experiência e composição

A superfície é uma ferramenta de operação, não uma galeria de produto. Ela apresenta: intenção resumida, queries geradas, candidatos em grade neutra, autor/origem, atribuição obrigatória, razão de rejeição e fallback `NO_IMAGE`. O preview deixa explícito `ilustrativa` sempre que não houver identidade verificável; não usa marca, placa, versão ou dado técnico como se fosse confirmado.

O fluxo não publica nada com um clique: a pessoa revisa o candidato, copia um manifesto proposto e adiciona/valida o arquivo versionado em revisão separada. A tela do produto só pode usar URL hotlinked já presente em manifesto com `licenseReview: approved`; na ausência, permanece com representação local sem imagem. Desktop, tablet e mobile devem manter atribuição legível e não esconder a ação de fallback.

### Fluxo proposto após decisão

`Image Intent aprovado → queries de composição sem PII → busca server-side de até 30 candidatos → triagem automática de metadados mínimos → revisão humana → manifesto versionado com licença/origem → asset aprovado ou fallback sem imagem → checkpoint desktop/tablet/mobile`.

O cliente nunca recebe chave, token, resposta bruta do provider, histórico de busca, dados de conta ou escolha autônoma. A tela de produto só consome asset já aprovado ou fallback. Nenhum veículo genérico é exibido como se correspondesse à configuração persistida.

### Segurança proporcional — revisão

**Aplicável.** Fronteira proposta: operador autorizado de curadoria → endpoint server-side restrito → provider de imagem → candidatos/metadados → revisão humana → manifesto/asset aprovado → UI. Riscos: vazamento de chave, endpoint público de consulta, envio indevido de contexto de pessoa/organização, licença incerta e conteúdo externo usado como verdade da ficha.

Controles mínimos: `UNSPLASH_ACCESS_KEY` exclusivamente em `.env`/ambiente seguro, não em `.env.example`, Git, cliente ou log; endpoint protegido por sessão/RBAC `admin`; `ImageIntent` com campos allowlisted, tamanho limitado e rejeição de PII/URLs; timeout e limite de uma consulta por ação; nenhuma busca no fluxo público; metadados mínimos e sanitizados; licença/origem/atribuição obrigatórias; asset só entra com `licenseReview: approved`; rollback é remover o manifesto/URL e retornar a `ImageSpecification` local. Não instalar SDK: usar HTTP server-side e testes mocked.

Checks de segurança planejados: acesso sem sessão e sem papel admin retorna sem chamar provider; chave ausente retorna erro seguro; query com PII/URL é rejeitada antes de rede; nenhum header de autorização, `download_location`, URL não permitida ou resposta bruta aparece no contrato do cliente; timeout e erro remoto retornam `NO_IMAGE` sem logar segredo.

### Privacidade e conformidade proporcional — revisão

**Aplicável.** A finalidade proposta é curar imagem de apoio à composição de produto, não perfilar pessoas nem pesquisar veículos de clientes. Dado enviado ao terceiro deve ser somente query editorial genérica e filtros técnicos de imagem; não pode conter pessoa, e-mail, organização, token, identificador de ficha ou conteúdo de pesquisa técnica. O destino, retenção contratual, atribuição e termos do provider precisam ser revisados por Lucas/responsável competente antes de ativar rede.

Segundo a LGPD, finalidade, necessidade, transparência e segurança orientam qualquer tratamento de dado pessoal; nesta proposta, a query de imagem é editorial e não deve conter dado pessoal. Ainda assim, a integração externa pode envolver IP/metadados operacionais e exige que Lucas/responsável valide termos, transparência aplicável e eventual transferência internacional antes de liberar rede. Não há dado sensível, criança/adolescente, perfil comportamental, analytics, retenção de query ou compartilhamento de ficha no desenho.

Decisão de conformidade: `reavaliar antes de liberar rede`. A implementação pode incluir o adaptador condicionado à chave e testes mocked, mas a primeira chamada real depende de conta/chave obtidas por Lucas e revisão humana dos termos em vigor. Esta arquitetura não declara base legal, adequação de licença ou conformidade jurídica.

### Evidência de termos consultada em 2026-09-12

- Pexels requer autorização por chave, link destacado ao Pexels e crédito quando possível; oferece metadados úteis para manifesto e é o melhor ajuste para curadoria local revisável.
- Unsplash exige atribuição e uso direto das URLs retornadas (hotlinking), o que muda a política de asset local do BlindSpot. A documentação também indica que aplicações começam em modo demo e podem requerer aprovação para produção.
- Pixabay requer chave; o acesso a alta resolução depende de aprovação e algumas URLs de formato web têm validade limitada.
- Openverse é apenas fonte complementar; a licença precisa ser validada no item/hospedador antes de qualquer incorporação.

### Verificação planejada após aprovação

- testes mocked para segredo ausente, timeout, resposta inválida, licença incerta e fallback `NO_IMAGE`;
- inspeção de que nenhum segredo, URL privada ou payload bruto alcança cliente, Git ou log;
- revisão humana de 10–30 candidatos contra Image Intent, origem, licença e crops;
- render desktop/tablet/mobile com e sem imagem, atribuição visível e sem alegar identidade técnica falsa;
- `npm run typecheck`, `npm run build` e `git diff --check`.

### Double-check

- Design System e Image System confirmam que imagem é opcional e que uma referência externa não autoriza copiar asset, provider ou código.
- A seleção de Unsplash resolve o provider e o modelo hotlinked; conta, chave e responsável por aceite de termos continuam fora do repositório e não serão solicitados/copiados aqui.
- O fluxo proposto não usa imagem para encobrir `fonte_ref`, status, completude, conflito ou identidade exata; o fallback continua utilizável sem imagem.

**Architecture Gate: APPROVED — 2026-09-12.** Lucas selecionou Unsplash e autorizou a implementação com hotlinking e atribuição. Nenhuma chamada real ocorrerá sem chave inserida por Lucas em ambiente seguro e revalidação dos termos aplicáveis.

## Reescrita UX/UI — 2026-09-12

Esta task adota `docs/product/ux-ui-future-task-redesign-standard.md`: Image Intent, fallback sem imagem, preview responsivo e checkpoint PEK passam a preceder qualquer asset. A arquitetura deve separar curadoria local de futura integração de provider; não começa sem decisão humana de provider e security/compliance.

- Estado: `✅ Concluída — infraestrutura de curadoria entregue; seleção de asset pertence à task de tela consumidora`.
- Arquitetura: `APPROVED — 2026-09-12; Unsplash com hotlinking e atribuição`.
- Triagem automática: `Material — provider externo, licença, segredo e metadados`.
- Segurança: `Aplicável — revisão obrigatória`.
- Implementação: criado o adaptador server-side `services/api/unsplash-curation.ts`, rota administrativa `POST /api/curadoria-imagens/unsplash/candidatos`, ação/recurso de auditoria sem registrar query, contrato web sanitizado e a superfície `ImageCurationWorkspace`. A curadoria usa até três queries editoriais sem PII, normaliza no máximo 30 candidatos, descarta hosts não permitidos e nunca entrega chave, header, resposta bruta ou `download_location` ao cliente. A interface deixa explícito o uso ilustrativo, atribui cada candidato ao autor/Unsplash e só copia um manifesto com `licenseReview: required`; ela não publica, baixa, persiste ou altera ficha.
- Arquivos alterados: `services/api/unsplash-curation.ts`, `services/api/index.ts`, `services/api/audit.ts`, `apps/web/src/ImageCurationWorkspace.tsx`, `apps/web/src/image-curation-workspace.css`, `apps/web/src/App.tsx`, `apps/web/src/api.ts`, `apps/web/src/types.ts`, `scripts/verify-image-curation.ts`, `package.json` e esta task.
- Verificação: `npm run verify:image-curation`, `npm run typecheck`, `npm run build` e `git diff --check` passaram. O teste mocked cobre múltiplas queries, rejeição de e-mail/URL na intenção, limite sanitizado de candidatos, host permitido, ausência de `download_location`, chave ausente e rota administrativa estática.
- Verificação adicional: `npm run smoke:unsplash-curation` passou com uma única intenção editorial genérica, sem dado de veículo, pessoa ou organização; o comando confirmou `20 candidatos sanitizados` e não registrou chave, query completa, URL de candidato ou resposta bruta.
- Limitação conhecida: revisão humana de candidatos, manifesto `licenseReview: approved` e checkpoint visual em navegador não são pré-requisitos da infraestrutura e pertencem à task da tela que tiver `Image Intent` aprovado. A automação visual local permanece indisponível (`os error 3`).
- Próximo passo: a task de tela consumidora decide `NO_IMAGE` ou cria um Image Intent específico; somente então a Curadoria é usada para revisão humana, manifesto e capturas sanitizadas.

## Reversão integral aprovada — 2026-09-12

**Architecture Gate: APPROVED — Lucas autorizou a remoção integral da feature em 2026-09-12.**

- Estado: `↩️ Revertida`.
- Escopo removido: rota administrativa de candidatos, adaptador HTTP do Unsplash, tráfego externo, tipos e cliente web, workspace/navegação de Curadoria, ações e recurso de auditoria específicos, scripts de verificação/smoke e seus comandos npm.
- Preservado: `docs/product/image-system.md` permanece uma especificação conceitual, sem provider ativo; não há download, hotlinking ou asset de terceiro no produto.
- Dados e segredos: eventos históricos de auditoria não são apagados; nenhum arquivo `.env` foi lido ou alterado. `UNSPLASH_ACCESS_KEY` não é mais consumida pelo código e deve ser revogada/removida também dos ambientes de execução e deploy por seu responsável.
- Segurança: a reversão reduz superfície autenticada, dependência externa, tráfego de conteúdo de terceiro e uso potencial de credencial. Não há migration nem alteração de schema.
- Verificações previstas: busca estrutural sem referências executáveis, `npm run typecheck`, `npm run build` e `git diff --check`.
