# P1-055 — Controles fundacionais V1: Button e Textarea

> Estado: `IMPLEMENTADO TECNICAMENTE — aguardando checkpoint visual humano`.

## Decisão recomendada

Não baixar/incorporar literalmente o Button do shadcn neste repositório. A base atual do componente importa `@base-ui/react/button`, `class-variance-authority` e `cn`; a distribuição de estilo alternativa também pressupõe Tailwind e `@radix-ui/react-slot`. O BlindSpot usa React/Vite e CSS próprio, sem essas fundações. Instalar via CLI acrescentaria dependências e convenções globais para resolver um problema que os primitives locais já podem resolver com menor risco.

O padrão aprovado para implementação é **compatibilidade de experiência, não dependência de código**: API, semântica, foco, tamanhos e estados inspirados no shadcn; JSX/CSS nativos do BlindSpot, sem Tailwind, CLI, Base UI, Radix, Lucide, `cva` ou `cn`.

## Contrato `UiButton`

| Propriedade | Valores | Regra |
| --- | --- | --- |
| `variant` | `primary`, `secondary`, `outline`, `ghost`, `danger`, `link` | define intenção visual; nunca autorização ou status técnico |
| `size` | `sm`, `md`, `lg`, `icon` | `md` padrão; `icon` exige nome acessível; alvo mínimo de 42 px |
| `startIcon` / `endIcon` | `ReactNode` SVG local | CTA com texto usa ícone inline; espaçamento constante; SVG não recebe eventos |
| `isLoading` e `loadingLabel` | boolean/string | preserva largura e bloqueia clique sem apagar propósito da ação |
| `tone` | compatibilidade transitória | mapeado para variante sem quebrar consumidores existentes; removido somente por task própria |

Estados obrigatórios: default, hover, active, focus-visible, disabled e loading. O botão continua elemento `<button>` nativo; links permanecem `<a>`, sem `role="button"` artificial. Não adicionar animação necessária para compreensão.

## Contrato `UiTextarea`

`UiTextarea` é um `<textarea>` nativo com `forwardRef`, classe semântica, `aria-invalid`, suporte a `disabled`, placeholder, `resize="vertical"` por padrão e altura mínima de quatro linhas. Ele não valida domínio, não persiste, não autoexpande sem decisão própria e não cria contador fictício.

Quando usado com `UiField`, label, hint e erro permanecem associados por `id`, `aria-describedby` e `aria-invalid`. O componente deve funcionar em dark/light, teclado, zoom e reduced motion sem tratamento especial.

## Mapa de adoção inicial

| Superfície | Button | Textarea | Limite |
| --- | --- | --- | --- |
| Nova Ficha / diálogo | primário `lg` com lupa; secundário outline | não há necessidade atual | não mudar payload/validação |
| Login/cadastro | primário, secundário/link conforme fluxo já aprovado | possível campo futuro, não adicionar agora | preservar motion e stepper existentes |
| Workspace técnico | ghost para ação contextual, outline para retorno | somente quando houver texto factual editável confirmado | não criar edição de ficha |
| Toast/menu/navegação | icon com `aria-label`, ghost/outline | não aplicável | não transformar ícone em único sinal sem nome |

## Impacto e verificação

- Arquivos alvo: `apps/web/src/ui/primitives.tsx` e estilos correspondentes; consumidores serão migrados incrementalmente, começando pela Nova Ficha.
- Não altera API, schema, sessão, RBAC, persistência, exportação, provider, dados pessoais ou dependências. Segurança proporcional: `Não aplicável` neste corte local.
- Verificar typecheck, build, `git diff --check`, keyboard/focus, disabled/loading, CTA com ícone, textarea inválida/desabilitada e render dark/light/mobile.

## Resultado da implementação

- `UiButton` agora expõe variantes, tamanhos, ícones de início/fim, loading e `forwardRef`, preservando `tone` para os consumidores existentes.
- `UiTextarea` passa a ser o textarea nativo padronizado: resize vertical, altura mínima, suporte a `disabled`, `aria-invalid`, placeholder e temas existentes.
- A Nova Ficha migrou a CTA da command surface, retorno ao resumo, abertura do detalhe e ações do diálogo para `UiButton`. Nenhum textarea foi introduzido artificialmente onde não há dado textual legítimo.
- Sem dependência, CLI ou código do shadcn incorporado; a decisão continua sendo de contrato e experiência locais.

## Architecture Gate

`APPROVED — Lucas autorizou a implementação local em 2026-09-13. Instalar shadcn, rodar sua CLI ou adicionar suas dependências continua exigindo decisão separada.`
