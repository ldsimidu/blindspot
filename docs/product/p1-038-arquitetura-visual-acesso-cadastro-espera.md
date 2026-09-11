# P1-038 — Arquitetura visual de acesso, cadastro e espera

> Estado: `VISUAL_READY — aguardando aprovação humana para implementar.`
>
> Escopo: login, criação de conta corporativa, confirmação de recebimento, espera de aprovação, recusa e retorno ao login. Esta especificação sucede o rascunho local reprovado em 2026-09-11; não aprova aquele código nem altera contratos de autenticação.

## 1. Decisão, pessoa usuária e limites

**Pessoa usuária:** responsável por uma empresa que ainda não tem acesso ao BlindSpot, ou pessoa já cadastrada que precisa entrar e compreender se sua solicitação está pendente.

**Objetivo:** tornar o acesso uma jornada corporativa calma e confiável: entrar rapidamente quando já possui credencial; criar a solicitação sem se perder em um formulário longo; e, após o envio, entender com precisão o que já ocorreu, o que está pendente e qual ação real continua disponível.

**Ação primária por estado:** `Entrar` no login; `Continuar` em uma resposta local do cadastro; `Enviar solicitação para análise` na revisão; `Voltar ao login` na espera e na recusa. Não haverá “aprovar”, prazo, e-mail enviado, push, consulta automática ou status fictício.

**Não escopo:** mudança de endpoint, schema, cookie, persistência, política de senha, provedor, recuperação de acesso, SSO, MFA, gestão de membros, imagem externa baixada ou integração com banco de imagens. A navegação superior do produto autenticado pertence à P1-039; ela não deve aparecer como simulação na entrada não autenticada.

## 2. Evidência atual e diagnóstico

### Evidências lidas

- Estado de acesso anterior: `evidence/ux-ui/current/01-login-e-cadastro/`.
- Rascunho em desktop entregue por Lucas: `C:\Users\lucas\Downloads\screencapture-localhost-5173-2026-09-11-16_41_33.png`, `...16_44_19.png` e `...16_44_36.png`.
- Implementação que gera esses rascunhos: `apps/web/src/App.tsx` e `apps/web/src/styles.css` — evidência de estrutura, não aprovação de design.
- Estados reais confirmados: `login`, `registration`, `received`, `pending_review`, `rejected` e `authenticated`; o servidor devolve apenas `authenticated`, `pending_review` ou `rejected` no login e `{ state: "received" }` no cadastro.

### Problemas observados

| Achado | Evidência | Impacto na tarefa |
| --- | --- | --- |
| Painel de aproximadamente 260 px em desktop | três rascunhos entregues | campos, revisão e timeline ficam estreitos apesar do viewport disponível; leitura corporativa parece incidental. |
| Stepper horizontal tenta mostrar quatro rótulos no espaço de um card estreito | `16_41_33` e `16_44_19` | números e labels colidem, portanto a pessoa não sabe onde está nem o que virá. |
| Canvas vazio não possui responsabilidade | os três rascunhos | o espaço não cria foco, imagem editorial, contexto nem respiro intencional; só evidencia que o conteúdo foi comprimido. |
| Revisão quebra e-mails/CNPJ de forma pouco legível | `16_44_19` | a etapa que deveria dar confiança torna os dados difíceis de conferir. |
| Espera descreve o estado, mas não oferece composição de marco/pendência suficientemente ampla | `16_44_36` | a timeline é correta no conteúdo, porém não transmite a segurança e a sequência esperadas de uma solicitação corporativa. |
| Tema escuro legado foi preservado por compatibilidade | rascunhos e `design-system.md` | a nova tela não expressa o canvas claro, calmo e editorial já decidido como alvo do BlindSpot. |

## 3. Referências: leitura, uso e limites

| Evidência | O que foi entendido | Princípio que entra nesta tela | Deliberadamente não copiado |
| --- | --- | --- |
| `references/login-cadastro/WhatsApp Image 2026-09-11 at 03.02.31.jpeg` | interface de acesso divide narrativa editorial e formulário limpo, com grande área visual e formulário de leitura confortável | desktop em duas regiões complementares: contexto editorial à esquerda e superfície de acesso ampla à direita | marca, foto, texto, cores, controles sociais, bordas e layout literal da referência |
| `references/login-cadastro/WhatsApp Image 2026-09-11 at 03.08.29.jpeg` | espera torna visíveis feito, atual e próximo marco por uma linha vertical simples | timeline vertical com três marcos, texto de situação e próxima ação real | promessa de minutos, resposta por e-mail/push, paleta escura e texto da referência |
| `references/inspiracoes-gerais/references.txt` | Lucas quer que a linguagem majoritária seja a das quatro referências gerais: produto amplo, navegação superior autenticada e veículo/ficha como centro | canvas claro quente, composição horizontal generosa, bordas discretas e hierarquia calma; acesso prepara essa mesma linguagem sem fingir ser o workspace | dashboard de locação/manutenção, telemetria, cards de preço e qualquer dado automotivo inventado |
| `.../WhatsApp Image 2026-09-11 at 02.59.17.jpeg` | veículo grande, superfícies claras, blocos discretos e informação organizada por contexto | ritmo horizontal, espaço em branco funcional, uma área de conteúdo dominante e detalhes contidos | imagem BMW, cores, controles de saúde/manutenção e identidade visual específica |
| `.../WhatsApp Image 2026-09-11 at 02.55.43.jpeg` | catálogo aproveita área larga e card/grid legível; navegação é de produto, não um painel comprimido | largura de leitura, cabeçalho simples e agrupamento previsível para o sistema autenticado futuro | sidebar, preços, locação, marca e layout da referência |

## 4. Restrições de produto, dados e imagem

- E-mail, nome, CNPJ e senha são dados de cadastro. Eles ficam apenas no estado de memória até o envio; senha e confirmação são descartadas após `202`, ao voltar ao login e em saída/erro final. Nada vai para URL, `localStorage`, log, screenshot ou texto de erro.
- O cookie de sessão é `HttpOnly` e emitido exclusivamente no login. A UI não lê token/cookie e não muda a regra de não enumeração.
- A timeline apresenta somente fatos: `Cadastro enviado` depois de `202`; `Em análise` enquanto o login devolve `pending_review`; `Não aprovado` apenas se devolve `rejected`; acesso somente em `authenticated`.
- `docs/product/design-system.md` e `docs/product/image-system.md` foram consultados. **Decisão de imagem desta P1: `NO_IMAGE` para a implementação inicial.** Não há asset automotivo aprovado, provider integrado ou licença revisada. A região editorial usa superfície, tipografia e grafismo abstrato próprio — não uma foto genérica nem uma falsa imagem de veículo.

### Image Intent futuro, não autorizado nesta task

Quando P1-043 aprovar um asset, a região editorial pode receber `auth-editorial`: fotografia realista de veículo contemporâneo **ilustrativo**, arquitetura minimalista, luz natural suave, saturação baixa, espaço negativo à direita, proporção `3:2` no desktop e ocultável no mobile. Sem texto, logo dominante, placa ou pessoa posando. O fallback segue sendo a composição sem imagem desta arquitetura.

## 5. Conceito de experiência

A entrada é a antecâmara do workspace: não é uma tela isolada, escura e estreita, nem uma landing page de campanha. Ela apresenta o BlindSpot como produto de trabalho estruturado.

No login, a pessoa reconhece dois caminhos equivalentes: entrar com uma credencial existente ou iniciar uma solicitação corporativa. No cadastro, ela responde uma pergunta por vez; o produto mantém uma noção de progresso sem exibir uma régua sobrecarregada. A revisão devolve os dados em uma grade ampla e escaneável. A espera troca formulário por uma narrativa de processo: o que foi concluído, qual é o estado atual e o que a pessoa pode fazer agora — sem alegar que o sistema fará algo que ele não faz.

## 6. Arquitetura visual detalhada

### Canvas e regiões

| Contexto | Estrutura | Responsabilidade |
| --- | --- | --- |
| Desktop ≥ 1080 px | canvas quente `#F5F0E7`, container de 12 colunas, largura máxima 1280 px, margem lateral mínima 40 px | ocupar o viewport com uma composição deliberada, não um card perdido no canto |
| Região editorial | 5 colunas; fundo `background.subtle`, borda quente discreta, raio 24 px | marca, proposta curta, macroprogresso e contexto de jornada; nunca dados de formulário nem ação crítica exclusiva |
| Região de tarefa | 7 colunas; superfície `surface.default`, raio 24 px, padding 48 px, largura interna de 480–560 px | uma tarefa por vez: login, pergunta do cadastro, revisão ou timeline |
| Cabeçalho de acesso | dentro do container, acima das regiões | wordmark à esquerda; no máximo link de retorno contextual à direita; sem menu de produto para pessoa deslogada |
| Mobile ≤ 679 px | 4 colunas, margem 16 px; região editorial reduzida a faixa compacta acima do conteúdo | preservar marca, etapa e retorno; remover ornamentação antes de comprimir controles |

O login e o cadastro ocupam `min-height: 100dvh`, com alinhamento vertical central apenas quando o conteúdo cabe; em alturas menores, inicia em 24 px e permite rolagem natural. Nenhuma região recebe largura inferior a 320 px; a região de tarefa recebe todo o espaço disponível antes de reduzir tipografia ou colapsar labels.

### Login

1. **Cabeçalho:** wordmark e texto discreto `Acesso corporativo`.
2. **Editorial:** eyebrow `Inteligência competitiva automotiva`; título curto sobre decisões técnicas confiáveis; uma lista de três benefícios de produto, todos verdadeiros e sem prometer funcionalidades não existentes. No rodapé, link secundário `Sua empresa ainda não possui acesso? Criar solicitação`.
3. **Tarefa:** título `Entre no BlindSpot`, texto de uma linha, campo de e-mail, campo de senha, erro neutro associado ao formulário e botão primário de largura do formulário. A ação de cadastro é link/botão secundário abaixo, não concorrente com o CTA de entrada.
4. **Visual:** título `type.display` de 40 px no desktop / 32 px compacto; labels 14 px; controles de 48 px; distâncias na escala 8/16/24/32. Fundo claro, texto grafite, laranja-terra reservado ao CTA e foco.

### Cadastro progressivo

O cadastro usa **sete microetapas de uma pergunta**, agrupadas em quatro macrofases. Isso atende ao desejo de reduzir carga sem fingir que sete respostas são sete processos do servidor.

| Microetapa | Macroprogresso mostrado na região editorial | Conteúdo da região de tarefa | Próximo passo |
| --- | --- | --- | --- |
| 1 de 7 | `Empresa · 1/2` | nome da empresa | validar presença/local e seguir |
| 2 de 7 | `Empresa · 2/2` | CNPJ | validar formato já aceito pelo cliente/servidor e seguir |
| 3 de 7 | `Responsável · 1/2` | nome do responsável | seguir |
| 4 de 7 | `Responsável · 2/2` | e-mail corporativo | seguir |
| 5 de 7 | `Acesso · 1/2` | senha, requisito mínimo persistente e seguro | seguir |
| 6 de 7 | `Acesso · 2/2` | confirmar senha e leitura do aviso de privacidade | seguir; não enviar ainda |
| 7 de 7 | `Revisão` | grade de leitura com empresa, CNPJ, responsável e e-mail; senha nunca é reexibida | `Enviar solicitação para análise` |

- **Macroprogresso desktop:** lista vertical na região editorial: `Empresa`, `Responsável`, `Acesso`, `Revisão`. Cada item tem ícone, label e estado textual `Concluído`, `Em andamento` ou `A seguir`; cor não é o único sinal.
- **Microprogresso na tarefa:** texto `Etapa 3 de 7` acima do título da pergunta e barra de progresso acessível (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`). Ele não repete os quatro labels em uma linha.
- **Pergunta:** um único campo dominante por tela, título objetivo (`Qual é o CNPJ da empresa?`), explicação só quando necessária e erro associado diretamente ao campo. A navegação `Voltar` permanece à esquerda; `Continuar` fica à direita e desabilita somente durante processamento, não como indicação única de erro.
- **Revisão:** card de largura total da região de tarefa, quatro linhas ou grade 2×2 no desktop. Labels em metadado, valores em corpo; e-mail recebe `overflow-wrap` e CNPJ usa grupo não comprimido. Botão final informa a consequência: envio para análise, não criação imediata de acesso.

### Espera e recusa

A espera não usa a mesma estrutura de formulário. Ela ocupa o container completo em duas colunas 5/7 para que a sequência seja o objeto visual principal.

- **Coluna de contexto:** selo textual `Solicitação recebida`; título `Acompanhamos os próximos passos`; texto claro: o cadastro foi recebido, o acesso ainda não está liberado e não há prazo informado. Ação secundária `Voltar ao login`.
- **Coluna de timeline:** superfície elevada com três marcos verticais: `Cadastro enviado` (concluído), `Em análise` (atual) e `Próximo passo` (pendente: entrar novamente para verificar o status). Cada marco tem título, descrição e ícone/estado acessível. Não há estimativa de duração, e-mail/push prometido, nem marco `Aprovado` antes de confirmação de login.
- **Recebido vs. pendente:** ambos comunicam o mesmo limite de acesso. `received` pode usar `Cadastro recebido` como título; `pending_review`, confirmado pelo login, usa `Ainda em análise`. A diferença não cria uma nova promessa de processo.
- **Recusa:** mantém a mesma composição, mas a timeline é substituída por um estado de indisponibilidade: título neutro, fato confirmado de que o acesso não foi liberado, link de suporte existente e retorno ao login. Não expõe motivo interno, empresa ou conta.

### Superfícies, tokens e componentes

- Canvas e superfícies usam os tokens-alvo claros definidos no Design System; a migração concreta mede contraste antes de promover valores globais.
- Reutilizar `UiButton`, `UiField`, `UiStatus`, `UiCard` e criar somente dois componentes de domínio visual: `RegistrationProgress` e `ApprovalTimeline`. Ambos declaram variantes e estados antes de entrar no catálogo.
- Botão primário: laranja-terra, texto de alto contraste, mínimo 48 px de altura. Secundário: borda discreta e texto grafite. Link de suporte não é CTA primário.
- Não usar sombra dramática, gradiente de página, borda pesada, ícone ambíguo ou indicador circular sem texto. O espaço vazio só serve para separar editorial, progresso e tarefa.

## 7. Responsividade e acessibilidade

| Viewport | Comportamento |
| --- | --- |
| Desktop ≥ 1080 px | duas regiões 5/7; macroprogresso vertical visível; formulário 480–560 px; espera em duas colunas. |
| Tablet 680–1079 px | editorial vira faixa superior com marca, uma frase e macroetapa atual; tarefa tem até 640 px; revisão fica em duas colunas somente acima de 760 px. |
| Mobile ≤ 679 px | editorial reduzida a wordmark + `Empresa, etapa 2 de 7`; um campo por viewport; ações empilhadas com primária primeiro; timeline ocupa largura total; nenhum label de progresso divide a mesma linha sem espaço. |

- Ordem de tabulação: retorno → campos/ajuda/erro → ação secundária → ação primária. Ao avançar/voltar, foco vai para o título da nova pergunta; erro mantém foco no campo inválido.
- `fieldset`/`legend` ou título associado descrevem cada pergunta; barra de progresso tem semântica e texto visível; macroprogresso usa lista sem depender de cor.
- Erro de senha/privacidade é específico para correção local, mas não enumera identidade; erro de envio é neutro e preserva os valores não sensíveis para tentativa.
- Áreas de toque têm pelo menos 42 px, foco visível não é cortado e `prefers-reduced-motion` remove transição de etapa. A imagem futura, se houver, recebe texto alternativo vazio se decorativa; se contextual, descrição não afirma veículo/configuração exata.

## 8. Estados e exceções

| Estado | Conteúdo confirmado | Tratamento visual e próximo passo |
| --- | --- | --- |
| verificação de sessão | somente que a aplicação consulta sessão | estado de carregamento discreto, sem formulário ativo; não piscar entre telas |
| login inválido/indisponível | nenhuma identidade deve ser inferida | alerta neutro próximo ao formulário; manter e-mail, limpar senha apenas quando apropriado à política de segurança |
| validação local | requisito de campo não atendido | erro associado ao campo; não apagar etapas anteriores |
| envio de cadastro | solicitação em andamento | botão ocupado, demais navegação protegida contra envio duplicado |
| `received` | servidor aceitou solicitação | espera com primeiro marco concluído |
| `pending_review` | login confirmou pendência | espera com marco atual `Em análise` |
| `rejected` | login confirmou não aprovação | estado neutro de recusa + suporte/retorno |
| `authenticated` | servidor emitiu sessão | entrada no workspace; acesso não é decidido visualmente |
| falha de rede/5xx | não há confirmação de envio/estado | mensagem segura, dados preservados em memória enquanto a pessoa estiver na jornada; nova tentativa explícita |

## 9. Critérios de aceite visual

- Render desktop em 1440 px, tablet em 834 px e mobile em 390 px para login, microetapa 2, microetapa 6, revisão e espera.
- Em desktop, nenhuma área de formulário/revisão fica comprimida em card de 420 px ou menos quando o canvas comporta o layout 5/7; o espaço editorial tem responsabilidade declarada.
- Nenhum label de macro/microprogresso sobrepõe outro; CNPJ e e-mail são legíveis sem truncamento não intencional na revisão.
- A pessoa entende, sem clicar, sua macrofase, sua microetapa, o que será enviado e que acesso ainda depende de análise.
- A espera distingue concluído, atual e próximo passo por texto, ordem, ícone e cor; não promete prazo ou comunicação inexistente.
- Navegação por teclado, foco, leitor de tela, zoom de 200% e mobile preservam a conclusão da tarefa.
- Nenhuma imagem, foto genérica, token, senha, CNPJ ou e-mail real aparece em evidência versionada.

## 10. Curadoria de movimento e componentes para esta tela

### Decisão de movimento

O movimento desta jornada é **funcional e quase invisível**: ele confirma a troca de uma pergunta local, conduz o foco para o próximo título e atualiza o marcador visual da macrofase. Sem movimento, a mesma informação continua íntegra em texto, ordem, `aria-current` e barra de progresso. Não há animação de carregamento que sugira aprovação ou análise do servidor.

| Evento | Movimento proposto | Sem movimento / reduced motion | Limite |
| --- | --- | --- | --- |
| avançar ou voltar uma microetapa | saída/entrada por `opacity` e deslocamento vertical de 8 px, 160–180 ms, sem atraso perceptível | troca imediata e foco no título da pergunta | não animar cada label, caractere ou campo individualmente |
| mudar macrofase | marcador textual/ícone troca de estado com fade curto | troca de texto/ícone imediata | não usar progresso circular, brilho ou celebração |
| entrar em `received`/`pending_review` | timeline aparece em sequência curta de cima para baixo, uma vez | timeline já renderizada integralmente | a sequência não representa tempo de análise nem deve repetir |
| validação ou envio | botão indica ocupado e mantém rótulo de ação | mesmo estado sem transição | spinner só enquanto a chamada real existe; não usar shimmer contínuo |

### Resultado da curadoria

| Fonte/padrão consultado | Encaixe observado | Decisão nesta P1 | Motivo, risco e alternativa |
| --- | --- | --- | --- |
| [Magic UI — Blur Fade](https://magicui.design/docs/components/blur-fade) | o padrão de entrada/saída simples se aproxima da troca de microetapas | `REFERÊNCIA PARA IMPLEMENTAÇÃO LOCAL` | a P1 implementa o equivalente mínimo em CSS/React, sem registry shadcn, pacote ou dependência adicional. Verificar `prefers-reduced-motion` no render. |
| [Magic UI — Number Ticker](https://magicui.design/docs/components/number-ticker) | poderia animar `Etapa 3 de 7` | `REJEITADO` | o número é orientação, não celebração; sua animação não melhora a tarefa e pode distrair. Texto estático é mais claro. |
| [Velora UI — componentes](https://velora.colorlib.com/components) | catálogo inclui Stepper e Blur Fade; a fonte informa licença MIT e cuidado com reduced motion | `CANDIDATO PARA INTAKE FUTURO` | encaixe conceitual alto, mas o BlindSpot não usa Tailwind/Motion/shadcn. Não instalar ou copiar antes de avaliar stack, tamanho, source, licença e a alternativa local. |
| [Spell UI — Label Input](https://spell.sh/docs/components) | pattern de label e campo pode inspirar a densidade de uma pergunta por tela | `REFERÊNCIA APENAS` | `UiField` já atende sem introduzir componente externo; inputs animados ou efeitos de partículas não são adequados a credenciais. |
| [Cult UI — Intro Disclosure](https://www.cult-ui.com/docs/components/intro-disclosure) | possui passos responsivos e indicadores | `REJEITADO PARA ESTA TASK` | além de pressupor Tailwind/Motion/shadcn, o exemplo inclui estado “não mostrar novamente” em armazenamento local, incompatível com a regra de não persistir dados da jornada de cadastro. |
| [Skiper UI — Quick Start](https://skiper-ui.com/docs/quick-start) | pode inspirar microinterações React | `A_VALIDAR, NÃO USAR AGORA` | documentação indica dependências como Framer Motion, Tailwind e Lucide; não há ganho que justifique migrar a stack nesta tela. |
| [Originkit — Components](https://www.originkit.dev/docs/components) | preview por componente e revisão dos breakpoints é uma boa disciplina | `REFERÊNCIA DE PROCESSO` | adquirir componente exige conta; CLI/MCP pode requerer autenticação/chave. O PEK já exige preview desktop/tablet/mobile antes de adoção. |
| Cruip Open React Template, Awwwards, Refero Styles e Inspora | ajudam a observar ritmo, páginas amplas e acabamento | `REFERÊNCIA DE PRINCÍPIO` | não são fontes de código para a P1. Qualquer template/seção concreta precisa de intake independente de licença, versão e stack. |

**Componente a construir localmente, se aprovado:** `RegistrationTransition`. Responsabilidade: encapsular somente a transição reduzida entre painéis de pergunta e respeitar `prefers-reduced-motion`; não gerencia estado de cadastro, não persiste passo, não chama API e não interpreta aprovação. `RegistrationProgress` e `ApprovalTimeline` permanecem componentes semânticos de domínio, com o movimento como enhancement opcional.

## 11. Double-check visual

- **Referências:** a divisão editorial/tarefa traduz a referência de login sem copiar sua estética ou conteúdo; a timeline traduz a referência de espera sem copiar promessas; o canvas e a largura retomam a direção geral clara e ampla.
- **Composição:** desktop usa todo o viewport em duas responsabilidades claras; tablet e mobile removem a região editorial antes de sacrificar legibilidade. Não há sidebar vazia nem card estreito isolado.
- **Fluxo:** sete telas locais não adicionam estados ao servidor. Macroprogresso evita que o fluxo granular pareça arbitrário; revisão mantém o único envio real.
- **Domínio e segurança:** nenhum dado visual afirma aprovação antes de `authenticated`; sem asset não há falsa identidade automotiva; credenciais continuam transitórias e não aparecem na revisão.
- **Lacuna honesta:** não há asset de veículo aprovado; a implementação inicial precisa funcionar sem imagem. A adição futura depende da P1-043 e de novo `Image Intent`/revisão.

## 12. Decisão humana necessária

`VISUAL_READY — a arquitetura visual está pronta para revisão. A implementação recomeça somente após Lucas aprovar esta composição; a aprovação técnica anterior permanece válida apenas para o escopo de contrato já descrito.`

## 13. Checkpoint obrigatório após aprovação

Antes de concluir P1-038, aplicar `core/first-render-composition-checkpoint.md` do PEK v0.7 após criar a estrutura mínima. A captura inicial deve cobrir login desktop/mobile, uma microetapa de cadastro, revisão e espera. Se houver card comprimido, região sem função, colisão de labels, valor quebrado, CTA sem contexto ou canvas vazio, a implementação retorna à seção 6 desta arquitetura antes de continuar.
