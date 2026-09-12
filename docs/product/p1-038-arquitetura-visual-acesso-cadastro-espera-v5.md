# P1-038 — Arquitetura visual V5: precisão operacional do acesso

> Estado: `READY — aguarda APPROVED explícito de Lucas antes de CSS/JSX.`

## Decisão e escopo

Esta revisão responde ao `C:\Users\lucas\Downloads\review-cadastro-v4.md`, às evidências visuais anteriores e ao Design System/PEK v0.10. Ela preserva a assinatura editorial aprovada do acesso — canvas escuro, marca grande, laranja e painel claro flutuante — e melhora a execução da tarefa dentro do painel.

Entra: login, as quatro etapas de cadastro, revisão, falha de envio e espera de aprovação. Não entra: endpoints, cookie, RBAC, fluxo de status, asset externo, nova política de privacidade, recuperação de acesso, SSO/MFA, confirmação de logout e botão mostrar/ocultar senha. Este último é uma mudança de interação de credencial e exige decisão/gate próprio.

## Evidência e princípios extraídos

| Evidência | Leitura | Decisão V5 |
| --- | --- | --- |
| `review-cadastro-v4.md` | a identidade funciona; os problemas são redundância, largura, estabilidade e hierarquia de estados | refinar composição, não trocar a identidade nem introduzir conteúdo inventado |
| evidência V3/P0-015 | stepper deformava; erro deslocava e podia cortar a recuperação | um indicador de progresso; geometria fixa; slot estável e viewport seguro |
| referências de login/cadastro | painel de tarefa claro sobre contexto rico cria foco | manter canvas/assinatura, mas dar ao conteúdo interno largura e alinhamento operacional |
| Design System e Image System | acesso é tarefa segura; imagem não preenche espaço por si só | `NO_IMAGE` nesta revisão; forma abstrata continua como contexto, não como evidência automotiva |

## Pessoas, objetivo e fluxo

**Modo:** operar. A pessoa responsável precisa entrar, preencher cadastro de empresa sem voltar por erro evitável, revisar o que enviará e entender o estado real posterior.

1. Login: informar credenciais e entrar; CTA principal laranja.
2. Cadastro: entender etapa atual por um único stepper, preencher agrupamento, corrigir campo no próprio local e avançar.
3. Revisão: conferir empresa e responsável em uma superfície única; editar apenas o grupo necessário; enviar com consequência explícita.
4. Falha de envio: ver toast curto e explicação persistente, sem salto de CTA ou conteúdo fora de alcance.
5. Espera: ler estado factual da análise; distinguir evento concluído, estado atual e ação disponível.

## Arquitetura visual

### Canvas e assinatura

- Desktop mantém canvas integral de mídia/forma abstrata e painel de aproximadamente 40% sobreposto à direita.
- A assinatura grande à esquerda permanece em login e cadastro. Ela não é reduzida automaticamente: a instrução humana anterior prevalece. Pode perder contraste/ênfase somente se um render provar competição com a tarefa; isso exigirá nova decisão.
- O painel continua com gradiente branco opaco, borda clara e sombra curta. Sem Liquid Glass e sem asset externo nesta V5.

### Painel de tarefa

- Conteúdo interno de cadastro/revisão usa largura de `min(100%, 500px)` no desktop, em vez do limite atual de 420 px; painel e padding preservam leitura até tablet.
- Formulários de cadastro usam alinhamento esquerdo: eyebrow de etapa, título, descrição, labels, inputs e ações compartilham o mesmo eixo. Login pode preservar sua composição mais concentrada quando não prejudicar a leitura.
- A estrutura vertical é estável: `stepper → cabeçalho → conteúdo variável → feedback reservado → ações`. Variação de altura do conteúdo é permitida; a posição relativa de ações e feedback não pode alternar sem razão.
- Em mobile, o painel segue no fluxo; largura, labels e ações usam a largura disponível com margem mínima, sem sobreposição com a assinatura/canvas.

### RegistrationStepper

- Remove a barra linear. O stepper é a única fonte visual de progresso.
- Quatro fases: Empresa, Responsável, Acesso e Revisão. Marcador tem dimensão/proporção invariáveis; concluído usa check explícito e texto; atual usa laranja; pendente usa borda neutra e rótulo.
- Desktop: linha horizontal com labels legíveis. Compacto: grade de duas colunas antes de qualquer compressão; a área de texto quebra, o marcador não.
- O eyebrow `Empresa · etapa 1 de 4` é contexto textual, não segundo indicador gráfico concorrente.

### Campos e ações

- Empresa e Responsável mantêm dois campos por grupo no desktop quando houver leitura útil; empilham antes de comprimir label/controle.
- Senha e confirmação permanecem juntas. Checkbox usa label/contêiner clicável com alvo mínimo de 42 px; a política não vira link sem destino real.
- `Entrar`, `Continuar` e `Enviar solicitação para análise` usam a linguagem de ação primária laranja. `Voltar` permanece secundária e não compete com a decisão principal.
- Validação de CNPJ continua progressiva e autoritativa no servidor conforme P0-015; esta V5 não altera a regra de negócio.

### Revisão e erro

- `ReviewSummary` vira uma superfície única, sem card dentro de card: título de envio, instrução curta, seção Empresa e seção Responsável, cada uma com ação `Editar` e divisor discreto.
- Informação é organizada em pares label/valor legíveis; e-mail pode quebrar somente no valor, nunca no label ambíguo.
- `ErrorSlot` fica entre conteúdo e ações, reservado também sem erro. É anunciado e contém mensagem neutra de recuperação. Toast permanece portalizado no viewport e não replica detalhes de campo/sessão.
- Em viewport baixo, o painel tem estratégia de scroll interno ou de documento que preserva ações/feedback acessíveis; nenhum retorno pode existir apenas abaixo de conteúdo inalcançável.

### Espera de aprovação

- Título reduz uma escala abaixo da timeline para que o estado seja o objeto principal.
- Timeline diferencia: `✓ Cadastro enviado` (evento concluído), `● Em análise` (estado atual e sua explicação) e `Próxima ação` (bloco orientativo, fora da semântica de etapa interna).
- Ações permanecem após a timeline: voltar ao login como primária e suporte como link secundário. Não prometer prazo, e-mail, notificação ou aprovação.

## Responsividade, acessibilidade e movimento

- Viewports obrigatórios: 1440 px, 768 px e 390 px; revisar empresa, responsável, acesso, revisão, erro e espera.
- Stepper, inputs, checkbox, editar, ações e toast precisam de foco visível e operação por teclado. Concluído/atual/pendente usam texto/ícone além de cor.
- A transição entre etapas pode ser fade/slide curto local, somente se o checkpoint estrutural aprovar a composição estática e `prefers-reduced-motion` eliminar o deslocamento.

## Critérios visuais de aceite

- Apenas um indicador gráfico de progresso aparece no cadastro.
- `Pessoa responsável` e `Revise a solicitação` cabem em uma linha em desktop no painel aprovado, sem diminuir tipografia para contornar o problema.
- CTA primária de login e cadastro usa laranja; verde permanece semântico.
- CTAs têm posição estável entre as etapas e erro contextual é acessível no mesmo viewport/fluxo de leitura.
- Revisão não apresenta mais containers aninhados desnecessários.
- Timeline domina o estado de espera e não trata a ação do usuário como etapa interna confirmada.
- Canvas/assinatura apoiam, mas não comprimem, a tarefa; render humano confirma isso antes de concluir.

## Double-check

- O review v4 foi adotado onde há evidência de problema, sem sobrescrever sua instrução explícita de marca grande no canvas.
- Não foram adicionados imagem, provider, dependência, fluxo de privacidade inexistente ou interação de credencial sem gate.
- A V5 mantém P0-015 como dona da regra CNPJ/feedback técnico; P1-038 é dona da composição de acesso.
- Qualquer reprovação em primeiro render retorna a esta arquitetura; typecheck/build não equivalem a aceitação visual.

## Gate

`READY — Lucas precisa aprovar explicitamente esta V5 antes da implementação.`
