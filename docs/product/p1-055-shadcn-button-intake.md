# Intake PEK — shadcn/ui Button para o BlindSpot

> Estado: `ADAPTAÇÃO LOCAL IMPLEMENTADA — Lucas aprovou em 2026-09-13; nenhuma dependência, CLI ou código externo foi incorporado`.

| Campo | Avaliação |
| --- | --- |
| Produto consumidor | BlindSpot, shell autenticado e Nova Ficha |
| Fluxo e problema UX | Ações primárias e alternativas usam classes locais heterogêneas. A pesquisa precisa de ação, ícone, tamanho, foco e loading consistentes. |
| Fonte | [Componentes](https://ui.shadcn.com/docs/components) e [Button](https://ui.shadcn.com/docs/components/base/button) do shadcn/ui; consulta em 2026-09-13. |
| Padrão | Variantes `default`, `outline`, `secondary`, `ghost`, `destructive` e `link`; tamanhos, inclusive `icon`; ícone inline com espaçamento explícito; loading no próprio alvo. |
| Licença | MIT confirmada no [repositório oficial](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md?plain=1). |
| Stack | BlindSpot usa React/Vite e CSS próprio. A instalação documentada usa CLI e adiciona componente/dependências; o projeto não possui Tailwind/shadcn configurado. |
| Dependências/rede | Consulta não exige conta. Instalação pode alterar dependências, arquivos e convenções CSS; não foi executada. |
| Acessibilidade | Preservar botão nativo, nome acessível, foco visível, alvo de 42 px, texto junto ao ícone em CTA primária e loading estável. |
| Movimento | Não necessário; hover/focus continuam funcionais sem animação. |
| Alternativa local | Evoluir `UiButton` e estilos locais para o mesmo contrato sem importar shadcn, Tailwind, Base UI, Radix ou Lucide. O ícone SVG local permanece na família do shell. |
| Rollback | Reverter somente variantes/estilos locais; nenhuma migração, pacote ou asset externo. |
| Risco/dúvida | Copiar ou instalar o componente literal cria incompatibilidade de stack desnecessária neste corte. |
| Decisão humana | `APROVADA`: adaptação local, sem instalação direta. |

## Resultado V7

1. Renomear o destino superior para `Pesquisar nova ficha técnica` e trocar o ícone atual por lupa SVG local. Lupa descreve busca; `+` fica reservado a criação sem pesquisa.
2. Remover a CTA duplicada ao lado do título. A command surface mantém a única CTA primária, com lupa e texto `Pesquisar nova ficha técnica`.
3. Substituir `Pontos de atenção` por `Histórico da configuração`: total real de pesquisas compatíveis, primeira pesquisa e última atualização. As datas deixam de repetir no rodapé; `Abrir ficha completa` permanece como ação final.
4. Adaptar localmente o contrato de Button: variantes explícitas, tamanho `lg` para pesquisa, ícone inline com espaçamento, loading sem mudança de largura, foco visível e ícone isolado somente com `aria-label`.

O destino superior recebeu lupa e nome acessível `Pesquisar por nova ficha técnica`. A CTA duplicada do cabeçalho foi removida; a command surface preserva uma única ação primária com lupa e texto. `Pontos de atenção` foi substituído por `Histórico da configuração`, usando somente total de pesquisas compatíveis e timestamps existentes. O botão local passou a ter composição explícita de ícone inline, tamanho grande e espaçamento estável.

## Architecture Gate V7

`IMPLEMENTADO TECNICAMENTE — rótulo, ícone, agrupamento factual e contrato local de botão. Não altera API, schema, sessão, RBAC, exportação, persistência ou dependência. Instalação do shadcn continua fora do escopo.`
