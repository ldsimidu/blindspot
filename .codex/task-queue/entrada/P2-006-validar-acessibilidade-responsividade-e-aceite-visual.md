# ❌ Bloqueada — validar acessibilidade, responsividade e aceite visual

> Prioridade: P2
>
> Área afetada: qualidade de interface e documentação de evidência
>
> Origem ou referência: Design System, auditoria UX/UI e roadmap
>
> Arquitetura: `APPROVED — 2026-09-12`
>
> Triagem automática: `Material — validação transversal de experiência`
>
> Segurança: `Não aplicável — não altera identidade, API, dados ou integrações`

## Pedido

Validar a experiência refatorada por jornada, viewport e tecnologia assistiva, registrando evidências visuais e lacunas sem declarar aprovação para estados não exercitados.

## Critérios de aceite

- [ ] Desktop, tablet e mobile foram verificados nas jornadas implementadas de acesso, ficha, catálogo, comparação e administração aplicáveis.
- [ ] Fluxo por teclado, foco, contraste, zoom de 200%, leitura de status e `prefers-reduced-motion` têm resultado registrado.
- [ ] Estados loading, vazio, parcial, conflito, erro, indisponível, bloqueado e sem permissão foram cobertos quando presentes no runtime.
- [ ] Evidências são sanitizadas: sem credenciais, cookies, tokens, logs brutos ou dados pessoais desnecessários.
- [ ] Achados remanescentes recebem prioridade e task própria; não são escondidos por aprovação genérica.

## Restrições ou contexto

- Não acionar dados de produção, provider real ou ações destrutivas para produzir evidência.
- Distinguir renderização estática, smoke manual e comportamento comprovado em runtime.
- Usar `evidence/ux-ui/` como repositório de capturas e registros, sem duplicar segredos.

## Resultado do agente

## Arquitetura — 2026-09-12

### Decisão e escopo

Executar a P2-006 como um **aceite transversal por evidência**, e não como uma aprovação visual genérica nem como uma nova rodada de redesign. O resultado será uma matriz sanitizada que separa: (a) aparência realmente renderizada, (b) interação exercitada, (c) checagens estáticas possíveis e (d) lacunas que continuam sem prova. Falhas de composição, leitura, responsividade, teclado, movimento ou estado reabrem a task de origem; falhas de contrato, autorização, API ou dados não serão inferidas a partir de screenshot e continuam pertencendo às tasks técnicas correspondentes.

O escopo cobre as jornadas já tratadas visualmente: acesso/cadastro, pesquisa e ficha, catálogo, comparação, administração (equipe e consumo) e ajuda contextual. A P2-006 não muda runtime, dados, API, schema, provider, permissões ou conteúdo de produto. Também não chama provider real, cria dados de produção ou transforma evidência estática em prova de comportamento.

### Pessoa usuária e fluxo de aceite

1. Para cada jornada, identificar objeto primário, estado primário, ação esperada e dados decisórios que devem permanecer legíveis.
2. Coletar ou localizar somente evidência sanitizada do estado real nos viewports desktop `1440`, tablet `768` e mobile `390`, quando o runtime e o acesso local permitirem.
3. Exercitar teclado, foco, zoom de 200%, contraste perceptível e preferência de movimento reduzido apenas em telas autorizadas e sem envio de dados sensíveis.
4. Registrar cada resultado como `ACEITO`, `DEFEITO` ou `EVIDENCIA_INCOMPLETA`; screenshot isolado nunca recebe rótulo de fluxo comprovado.
5. Para todo `DEFEITO`, abrir ou reabrir a task responsável com evidência, viewport, estado, impacto e critério de aceite específico. Para `EVIDENCIA_INCOMPLETA`, registrar o bloqueio e o meio seguro de obtê-la.

### Informação, composição e estados a validar

| Jornada | Objeto/ação que deve permanecer claro | Estados mínimos quando existentes |
| --- | --- | --- |
| Acesso e cadastro | credencial/cadastro em curso e próximo passo factual | validação de campo, revisão, envio, análise, erro e retorno ao login |
| Pesquisa e ficha | identidade exata do veículo e leitura técnica | loading, vazio, parcial, conflito, indisponível e erro |
| Catálogo | descoberta e abertura de ficha elegível | vazio, filtros ativos, ausência de resultado e erro |
| Comparação | versões X/Y, elegibilidade e diferenças sem vencedor inventado | pré-requisito ausente, parcial, conflito, erro e resultado |
| Administração | pessoa/período e consequência de ação administrativa | sem permissão, vazio, loading, erro e confirmação persistente |
| Ajuda contextual | orientação acionável no ponto da tarefa | ausência de ajuda, retorno ao contexto e foco preservado |

Em todos os registros, fonte, status, completude, conflito e elegibilidade continuam conteúdo textual/semântico; não podem ser aceitos se dependerem apenas de cor, tooltip ou movimento. Toast é avaliado como overlay: não pode deslocar botões, foco ou conteúdo. No mobile, a tarefa deve ser recomposta, não apenas comprimida.

### Impacto técnico, dados e confiabilidade

O artefato novo será documental, em `evidence/ux-ui/validation/`, com links para capturas ou prova estática existente; capturas novas só entram após revisão de sanitização. Nenhum endpoint é chamado especificamente para fabricar evidência, nenhuma informação de tenant é compartilhada e nenhum dado de diagnóstico bruto é anexado. A matriz declarará a origem de cada conclusão: `render`, `interação local`, `inspeção estática` ou `não observada`.

### Segurança, privacidade e riscos

**Segurança: não aplicável à mudança proposta.** A task não altera autenticação, autorização, API pública, integração, dependência, infraestrutura, IA, schema, persistência ou segredo. O risco operacional é incluir informação sensível em evidência; o controle é seguir a convenção de `evidence/ux-ui/README.md`, excluindo credenciais, cookies, tokens, logs brutos e dados pessoais desnecessários.

**Conformidade: não aplicável.** Não haverá nova coleta, analytics, cookie, transferência ou tratamento adicional de dados pessoais. Caso uma captura exija pessoa, e-mail ou dado identificável, ela será redigida antes de ser versionada ou será substituída por descrição sanitizada.

### Plano incremental e verificações

1. Criar a matriz de aceite e mapear a evidência já disponível, sem extrapolar comportamento.
2. Registrar checks estáticos de estrutura (semântica/foco/reduced motion) e executá-los nos componentes que compõem as jornadas, quando não exigirem ação externa.
3. Fazer smoke visual/interativo local somente se o ambiente estiver disponível; capturar desktop/tablet/mobile e estados reais, sem provider/dados de produção.
4. Executar `npm run typecheck` e `npm run build` apenas se houver mudança de código; para alteração documental, usar revisão de links, consistência da matriz e `git diff --check`.
5. Converter cada achado em task rastreável e manter P2-006 em execução até que as evidências exigidas estejam completas ou os bloqueios sejam explícitos.

### Double-check da arquitetura

- A task foi conferida contra o Design System, Image System, adapter PEK, padrão de redesign futuro e estratégia de verificação; todos exigem separar render de comportamento e não concluir por build isolado.
- As jornadas propostas coincidem com as áreas documentadas em `evidence/ux-ui/current/`; nenhuma delas é tratada como evidência de endpoint, autorização ou dado persistido.
- A arquitetura preserva os limites do contrato técnico: pesquisa, fonte, estado e elegibilidade não são simulados por feedback visual.
- O ambiente de automação visual não está confirmado nesta ativação; portanto a arquitetura prevê `EVIDENCIA_INCOMPLETA` em vez de uma aprovação fictícia. Isso é um bloqueio de verificação, não de implementação documental.

**Architecture Gate: APPROVED — 2026-09-12.** A execução documental e estática foi autorizada por Lucas; o aceite visual continua condicionado a render observável.

## Reescrita UX/UI — 2026-09-12

Esta task adota `docs/product/ux-ui-future-task-redesign-standard.md` como matriz transversal: evidência visual é separada de comportamento/runtime; cada falha de composição, identidade, fluxo ou acessibilidade reabre a task de origem e gera nova arquitetura quando necessário.

- Estado: `❌ Bloqueada — evidência visual atual indisponível`.
- Arquitetura: `APPROVED — 2026-09-12`.
- Triagem automática: `Material — validação transversal`.
- Segurança: `Não aplicável`.
- Implementação: criada a matriz de aceite sanitizada; nenhuma alteração de runtime, API, dados, schema, provider, permissões ou conteúdo de produto.
- Arquivos alterados: `evidence/ux-ui/validation/2026-09-12-aceite-transversal-p2-006.md` e esta task.
- Verificação: revisão estática de foco, erro de campo, skip link, toast em portal fixo, movimento reduzido e breakpoints de cadastro/catálogo/comparação; tentativa de automação observacional local bloqueada por `os error 3` antes de abrir navegador.
- Bloqueio: sem navegador local observável não é possível comprovar renders atuais em desktop/tablet/mobile, teclado, zoom, contraste, estados reais ou ausência prática de layout shift do toast.
- Próximo passo: restabelecer ambiente de render local ou fornecer capturas atuais sanitizadas nos viewports definidos; então retomar esta mesma task e abrir/reabrir tasks de origem apenas para defeitos confirmados.
