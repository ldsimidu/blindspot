# Image System — BlindSpot

> Estado: `ESPECIFICACAO_DE_PRODUTO_APROVADA`. Este documento governa decisões de imagem e asset da experiência-alvo. Não instala provider, não baixa imagem, não chama API e não autoriza o uso de asset externo por si só.

## 1. Papel, autoridade e relação com o Design System

O Image System é a camada que determina se uma imagem pertence ao BlindSpot, qual papel ela pode exercer e como deve ser selecionada. Uma imagem não é decoração automática: ela precisa melhorar compreensão, narrativa, identidade ou composição. Espaço em branco continua sendo uma escolha válida.

O [Design System](design-system.md) governa interface, tokens e componentes. Este documento governa fotografia, ilustração, imagens de produto, placeholders e seus metadados. Ambos são obrigatórios para qualquer tela que queira introduzir ou trocar asset visual.

Precedência:

1. instrução explícita mais recente de Lucas;
2. contrato do domínio e regras de segurança/identidade do BlindSpot;
3. este Image System e o Design System;
4. decisão de asset registrada;
5. evidências e referências catalogadas;
6. inferência local.

Referências externas ajudam a extrair enquadramento, luz, hierarquia e relação com a UI. Não autorizam copiar foto, marca, composição distintiva, interface, código ou asset.

## 2. Princípios obrigatórios

- **Verdade da identidade:** uma imagem não pode fazer parecer que um carro genérico é a configuração técnica exata exibida. Imagem ilustrativa recebe esse papel de forma clara; imagem de produto exata exige origem, licença e identidade verificáveis.
- **Utilidade antes de preenchimento:** não inserir imagem apenas porque existe espaço. Administração, comparação técnica e tabelas podem ser mais claras sem fotografia.
- **Composição antes de overlay:** preferir espaço negativo natural a escurecer/cobrir uma imagem inadequada com gradiente agressivo.
- **Coleção, não peças isoladas:** temperatura, saturação, contraste, perspectiva e tratamento precisam conviver como uma linguagem única.
- **Rastreabilidade:** todo asset externo aprovado mantém provider, origem, licença/termos, data e finalidade. Licença incerta bloqueia incorporação.
- **Seleção em desenvolvimento:** busca, ranking e aprovação ocorrem durante design/desenvolvimento; a aplicação em produção usa somente asset aprovado ou especificação/placeholder.
- **Sem falsa evidência:** fotografia não substitui `fonte_ref`, status, completude, conflito ou identidade técnica.

## 3. Linguagem visual do BlindSpot

Extraída das referências aprovadas, mas adaptada ao produto de inteligência competitiva automotiva:

| Dimensão | Direção obrigatória | Evitar |
|---|---|---|
| Realismo | fotografia realista ou render técnico claramente identificado | hiper-realismo artificial, HDR intenso, estética de anúncio agressivo |
| Luz | natural suave, dia nublado claro ou fim de tarde discreto | neon, contraste duro, reflexo estourado ou sombra opaca sobre dados |
| Temperatura | neutro levemente quente, compatível com superfícies claras | filtros frios/azulados dominantes ou paleta excessivamente colorida |
| Saturação | baixa a moderada | cores de carro e cenário muito saturadas competindo com status/ações |
| Cenário | arquitetura contemporânea, fundo limpo, estúdio discreto ou ambiente urbano pouco carregado | rua caótica, concessionária com logos, placas, multidão ou publicidade |
| Perspectiva | lateral, três-quartos leve ou ângulo baixo moderado; lente sem distorção evidente | grande-angular extremo, close que esconde o veículo, ângulo de corrida |
| Profundidade | moderada; assunto nítido e contexto simplificado | desfoque excessivo que impede reconhecimento ou fundo extremamente detalhado |
| Pessoas | raras; apenas quando representam ação real e não desviam do produto | pessoas olhando para câmera, poses de banco de imagem, executivos genéricos |
| Texto/marcas | nenhum texto, slogan, interface, watermark ou marca de terceiro dominante | placas legíveis, logo de montadora sem necessidade, tela/screenshot incorporado à foto |

## 4. Papéis de imagem e regra de uso

| Papel | Quando usar | Regras específicas | Fallback |
|---|---|---|---|
| `vehicle-identity` | ficha de veículo quando houver imagem exata e licenciada | vincular à identidade, mercado e versão ou marcar `ilustrativa` | silhueta/representação neutra e metadados técnicos |
| `workspace-hero` | abertura de um workspace ou estado de descoberta | veículo no terço direito ou inferior; espaço limpo para contexto | superfície editorial sem imagem |
| `catalog-card` | catálogo quando imagem ajuda a reconhecer o veículo | proporção consistente, sem prometer versão exata | bloco neutro com marca/modelo/versão textuais |
| `auth-editorial` | login, cadastro e espera | imagem de contexto automotivo/arquitetônico, sem pessoa-posando e sem dados técnicos fictícios | composição abstrata de marca ou cor sólida |
| `empty-state` | ausência, indisponibilidade ou primeiro acesso | ilustração simples, não decorativa; deve reforçar a próxima ação | texto, ícone semântico e ação |
| `team-avatar` | pessoa real com autorização ou avatar próprio | nunca usar foto aleatória de pessoa para representar membro | iniciais ou avatar geométrico |
| `decorative-texture` | somente quando melhora ritmo sem competir com conteúdo | baixa opacidade, sem significado funcional | nenhuma textura |
| `source-screenshot` | auditoria/documentação, nunca como asset de produto | sanitizada e identificada como evidência | descrição textual |

## 5. Especificações por papel

### Vehicle identity e workspace hero

- Proporção preferida: `16:9` ou `3:2`; o veículo deve sobreviver a crop `4:5` no mobile.
- Sujeito: lateral ou três-quartos, com rodas e silhueta reconhecíveis; sujeito no terço direito quando houver texto à esquerda.
- Resolução mínima: `1920 × 1080` para hero; arquivo otimizado e responsivo no momento de implementação.
- Overlay: no máximo gradiente sutil para legibilidade; não usar máscara que transforme a imagem em fundo indistinto.
- Proibido: logo/placa dominantes, texto incorporado, watermark, cor incompatível com os estados de qualidade ou modelo de veículo diferente apresentado como exato.

### Catalog card

- Proporção fixa por coleção: `4:3` no desktop e `3:2` em compactos, com `object-fit: cover` definido por componente.
- O nome, versão, ano-modelo e mercado são texto da interface; nunca depender da imagem para identificação.
- Cropping não pode remover o veículo inteiro ou a região que diferencia carroceria.
- Não misturar foto de estúdio, render de concessionária, foto de rua e ilustração na mesma lista sem curadoria explícita.

### Auth editorial

- Proporção desktop: metade ou até 55% do painel; mobile: opcional e nunca à custa de acesso ao formulário.
- Assunto: detalhe de veículo, arquitetura minimalista, estrada limpa ou textura automotiva abstrata.
- Espaço negativo e contraste suficientes para não exigir texto sobre a imagem; a informação crítica fica em superfície própria.
- Não usar foto de pessoas de banco de imagens como substituto da relação de confiança corporativa.

## 6. Image Intent

Antes de pesquisar ou gerar qualquer asset, registrar um `ImageIntent`. Nem todo campo é obrigatório, mas `id`, `purpose`, `subject`, `visualStyle`, `orientation`, `aspectRatio`, `responsiveCropping` e `avoid` são obrigatórios quando uma imagem é realmente necessária.

```ts
export interface ImageIntent {
  id: string;
  purpose: "vehicle-identity" | "workspace-hero" | "catalog-card" | "auth-editorial" | "empty-state" | "decorative-texture";
  subject: string;
  secondarySubjects?: string[];
  environment?: string;
  visualStyle: string[];
  mood?: string[];
  lighting?: "soft-natural" | "overcast-daylight" | "golden-hour-subtle" | "studio-neutral";
  composition?: string;
  cameraPerspective?: string;
  depthOfField?: "low" | "moderate" | "deep";
  negativeSpace?: "left" | "right" | "top" | "none";
  subjectPosition?: "left" | "center" | "right" | "lower";
  orientation: "landscape" | "portrait" | "square";
  aspectRatio: "16:9" | "3:2" | "4:3" | "4:5" | "1:1";
  compatibleColors?: string[];
  contrast?: "low" | "moderate" | "high";
  saturation?: "low" | "moderate";
  people?: "none" | "incidental" | "required";
  croppingTolerance: "low" | "moderate" | "high";
  overlayCompatibility: "none" | "subtle";
  responsiveCropping: { desktop: string; tablet: string; mobile: string };
  avoid: string[];
  keywords: string[];
}
```

Exemplo de intenção para uma hero ilustrativa:

```yaml
id: workspace-hero-electric-vehicle
purpose: workspace-hero
subject: veículo elétrico contemporâneo genérico, não associado a ficha exata
environment: arquitetura contemporânea minimalista
visualStyle: [realista, premium-contido, minimalista]
lighting: soft-natural
composition: veículo no terço direito, fundo limpo
negativeSpace: left
orientation: landscape
aspectRatio: 16:9
compatibleColors: [marfim, grafite, laranja-terra]
contrast: moderate
saturation: low
people: none
croppingTolerance: moderate
overlayCompatibility: subtle
responsiveCropping: { desktop: "16:9", tablet: "3:2", mobile: "4:5 com veículo ainda visível" }
avoid: [texto, watermark, logotipos, placas, HDR intenso, saturação alta, fundo ocupado]
keywords: [modern electric vehicle, minimalist architecture, clean daylight, copy space]
```

## 7. Seleção, ranking e aprovação

1. Confirmar que imagem é necessária; se não, usar espaço, ícone ou conteúdo textual.
2. Criar o `ImageIntent` e gerar três ou mais queries de busca com vocabulário de composição, não apenas assunto.
3. Obter de 10 a 30 candidatos de provider aprovado ou de acervo já licenciado.
4. Eliminar candidatos com marca/texto, proporção ruim, origem/termo incerto ou incompatibilidade com o papel.
5. Avaliar visualmente os candidatos finalistas contra o Image Intent, Design System e layout pretendido.
6. Pontuar, registrar a decisão e somente então tornar o asset disponível para implementação.

Pontuação de referência (não substitui julgamento humano):

| Critério | Peso |
|---|---:|
| Compatibilidade com o papel/assunto | 25% |
| Composição e espaço negativo | 20% |
| Linguagem do Design/Image System | 20% |
| Cor, luz e contraste | 15% |
| Qualidade técnica | 10% |
| Resiliência de crop | 10% |

Empate não é resolvido por “imagem mais bonita”; vence a que funciona melhor em desktop, tablet e mobile e introduz menos risco de interpretação falsa.

## 8. Providers, licença e futura abstração

Nenhum provider está integrado ao runtime. A seleção inicial é uma atividade de curadoria; qualquer integração futura precisa de task, Architecture Gate, revisão de segurança, avaliação de privacidade e aceite humano de termos/licenças.

| Provider | Adequação inicial | Condição obrigatória |
|---|---|---|
| Pexels | candidato para curadoria de assets estáticos | API requer chave; documentação pede link destacado ao Pexels e crédito quando possível; termos não permitem uso/redistribuição standalone nem coleta para dataset/treino de IA |
| Unsplash | candidato apenas quando hotlinking e atribuição puderem ser cumpridos | API exige atribuição e uso direto das URLs devolvidas; não é adequado assumir download/localização sem revisar a política |
| Pixabay | candidato para curadoria, sujeito aos termos vigentes | API requer chave e pede identificação de origem quando resultados são exibidos; licença/uso específico deve ser revisado |
| Openverse | fonte complementar para CC/domínio público, com curadoria reforçada | o próprio Openverse não garante precisão da licença; cada item e termos do host exigem verificação independente |

Fontes consultadas em 2026-09-11: [Pexels API](https://www.pexels.com/api/documentation/), [Pexels Terms](https://help.pexels.com/hc/en-us/articles/900005880463-What-are-the-Terms-and-Conditions), [Unsplash API Terms](https://unsplash.com/api-terms), [Unsplash Documentation](https://unsplash.com/documentation), [Pixabay API](https://pixabay.com/api/docs/), [Openverse Terms](https://docs.openverse.org/_preview/4859/terms_of_service.html). Isto não é parecer jurídico; o responsável competente valida o uso concreto.

Abstração futura — somente conceitual nesta fase:

```ts
interface ImageProvider {
  search(query: ImageSearchQuery): Promise<ImageCandidate[]>;
  getAttribution(candidate: ImageCandidate): ImageAttribution;
}
```

As implementações previstas são `PexelsProvider`, `UnsplashProvider`, `PixabayProvider` e, quando fizer sentido, `OpenverseProvider`. Elas ficam no servidor ou em ferramenta de curadoria, nunca expondo chave no cliente. A LLM, se usada para gerar queries ou ranking, recebe apenas metadados/candidatos autorizados e não baixa, publica ou escolhe asset final sem revisão humana.

## 9. Manifesto de assets e metadados

Asset externo aprovado deve ter manifesto versionado junto ao asset, em caminho a definir pela task de integração, com no mínimo:

```json
{
  "id": "workspace-hero-electric-vehicle",
  "file": "/assets/images/workspace-hero-electric-vehicle.webp",
  "intentId": "workspace-hero-electric-vehicle",
  "provider": "pexels",
  "providerId": "...",
  "sourceUrl": "...",
  "photographer": "...",
  "photographerUrl": "...",
  "licenseOrTermsUrl": "...",
  "retrievedAt": "YYYY-MM-DD",
  "usage": "workspace hero",
  "attributionRequired": true,
  "licenseReview": "approved | required"
}
```

Nunca registrar chave de API, cookie, token, dados pessoais desnecessários ou snapshot bruto de provider. Um asset sem `licenseReview: approved` não entra em produção.

## 10. Fallback e placeholder

Quando nenhum asset for adequado, a licença for incerta, o provider falhar ou ainda não houver autorização, usar uma `ImageSpecification` e placeholder identificado — nunca uma foto aleatória.

```yaml
IMAGE_SPEC:
  id: workspace-hero-electric-vehicle
  purpose: hero visual ilustrativa do workspace
  subject: veículo contemporâneo não identificável como ficha exata
  composition: terço direito livre; área esquerda limpa para contexto
  lighting: luz natural suave
  palette: marfim, grafite e neutros; laranja-terra apenas em detalhes da UI
  minimumResolution: 1920x1080
  mobile: assunto preservado em crop 4:5
  avoid: [logos, placas, texto, watermarks, HDR, pessoas posando]
```

O placeholder exibe um identificador como `[IMAGE: workspace-hero-electric-vehicle]` apenas em ambiente de desenvolvimento ou design review. Em produção, a tela deve preferir o layout sem imagem até o asset aprovado existir.

## 11. Verificação por asset

- O papel e o Image Intent estão registrados?
- O asset não induz identidade técnica falsa?
- A origem, os termos e a revisão de licença estão rastreáveis?
- Há crop revisado para desktop, tablet e mobile?
- Há texto, marca, watermark ou elemento visual concorrente?
- O asset mantém a coleção coesa e respeita o Design System?
- A página continua compreensível sem a imagem?

## 12. Changelog

| Data | Decisão | Estado |
|---|---|---|
| 2026-09-11 | Formalizado Image System do BlindSpot e fluxo de seleção em desenvolvimento | Aprovado para documentação |
| 2026-09-11 | Provider integration adiada para task com segurança, privacidade, licença e credenciais avaliadas | Pendente de implementação |
