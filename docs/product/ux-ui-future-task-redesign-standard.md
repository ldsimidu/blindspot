# Padrão de redesign para tasks UX/UI futuras

> Estado: aplicável às tasks futuras listadas abaixo em 2026-09-12. Não altera runtime, API ou contratos; cada implementação ainda requer seu Architecture Gate e evidência própria.

## Regra comum

Cada task de interface deve começar por: evidência da tela/estado real, referência específica e geral, regras do domínio, Design System, Image System (`NO_IMAGE` se não houver intenção aprovada) e arquitetura visual da tela. Depois do primeiro JSX/CSS estrutural, precisa de checkpoint de render em desktop, tablet e mobile; feedback humano de composição reabre a arquitetura.

As telas são operacionais: informação confirmada antes de ornamentação; estado humano, texto e ícone antes de cor; feedback local/persistente/overlay sem layout shift; superfícies estáveis; densidade progressiva; mobile recompõe a tarefa, não comprime uma tabela. Movimento só acompanha evento local confirmado, com reduced motion e sem simular pesquisa, confiança, aprovação ou custo.

## Reescritas por task

| Task | Arquitetura de experiência obrigatória | Limites de contrato |
| --- | --- | --- |
| P1-043 | Image Intent antes de asset; curadoria revisável; preview com fallback sem imagem; manifesto de licença/origem; crop desktop/tablet/mobile. | Provider, conta, SDK, busca, download e segredo só entram após security/compliance e aprovação humana específica. |
| P1-051 | Workspace de impacto: contexto da ficha e sessão, mudança factual antes/depois, recomendação explicável e próximo passo não automático; estados de pesquisa proporcionais. | Não calcular nova qualidade no cliente, não executar pesquisa, não inventar progresso, qualidade ou recomendação. |
| P1-052 | Proveniência no atributo: valor, estado humano, limite, fontes e alternativas de conflito em disclosure progressivo; leitura não depende de tooltip/cor. | Não expor URL sensível, prompt, query, modelo, trecho bruto ou metadado interno; não inferir estado. |
| P2-003 | Jornada explícita para refresh, fork e reprocessamento; cada operação informa consequência, origem, custo/estado real e linha de linhagem comparável. | Não criar vencedor, merge automático, compartilhamento ou nova exportação; exige security por autorização/custo. |
| P2-004 | Operação administrativa com contexto de pessoa/período, ação por linha, consequência clara, estados vazios/erro e foco seguro; consumo separa medição de cobrança. | Nenhum token, dado de outro tenant, detalhe desnecessário de membro ou erro interno; exige security e possível compliance. |
| P2-005 | Ajuda contextual, curta e acionável no momento da tarefa; inventário mapeia cada conteúdo antigo para destino, remoção ou lacuna. | Não usar tour, modal recorrente, analytics ou coleta de comportamento sem task própria. |
| P2-006 | Aceite não genérico por jornada e estado; matriz de renders, teclado, zoom, contraste, reduced motion e estados reais, com evidência sanitizada. | Screenshot não prova endpoint, autorização ou comportamento não exercitado; falha visual reabre a task correspondente. |

## Critério de aceite adicional

Nenhuma dessas tasks pode ser marcada concluída só por build/typecheck. Deve registrar: viewports reais, estado sem movimento, fluxo por teclado, conteúdo de ausência/erro/bloqueio, origem dos dados exibidos e achados pendentes convertidos em task rastreável.
