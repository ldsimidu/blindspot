# Evolucao da pesquisa de fichas tecnicas

Registro agregado, sem prompts, URLs, respostas cruas ou credenciais. Compare somente amostras equivalentes; uma cobertura maior nao e melhora se a evidencia for removida por aderencia ou autoridade.

| Data | Revisao/runtime | Amostra | Resultado | Evidencia e pipeline | Hipotese avaliada | Decisao |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-09-11 | `42c1d46` + worktree; `source-policy` 2026-09-08.2; `research-document-policy` 1.4.0 | Execucao real mais recente; marca sem dominio oficial configurado; nao comparavel a Ford configurada | 10/195 variaveis preenchidas (5,1%); ficha persistida | Descoberta de marca: 5 observacoes/2 candidatos. Descoberta documental oficial: pulada (0 dominios). Documento candidato: 0 elegiveis. Leitor e fetch: pulados. Passes: rapido 3 fontes, refinamento 6; aderencia isolou 1 e 2 fontes, respectivamente. | Sem uma ancora de primeira parte para a marca, a barreira de autoridade e a aderencia removem quase toda a evidencia antes do preenchimento. | investigar |
| 2026-09-11 | worktree com bootstrap institucional; mesmas politicas/modelo observados | Nova execucao manual do mesmo fluxo; total de variaveis divergiu (194 versus 195), portanto comparacao de cobertura e apenas indicativa | 26/194 variaveis preenchidas (13,4%); apenas uma fonte final, classificada pelo usuario como imprensa automotiva | Descoberta de marca: 5 observacoes/3 candidatos. Descoberta documental oficial, leitor e fetch do veiculo: pulados. Passes: rapido 3 fontes com 2 isoladas por aderencia; refinamento 7 fontes com 2 isoladas. Nenhuma fonte foi removida pela barreira de autoridade. Telemetria sanitizada nao expõe o resultado do bootstrap institucional. | O bootstrap nao promoveu host de primeira parte; sem esse host, a unica fonte aderente sobrevivente pode ser parceira de imprensa, mas nao resolve a cobertura oficial. | investigar |

## Como registrar a proxima execucao

1. Mantenha alvo, mercado, ano, provider/modelo e orcamento iguais ao baseline quando o objetivo for medir uma unica mudanca.
2. Acrescente uma linha com os campos do [contrato da auditoria](../../.codex/skills/technical-sheet-search-auditor/references/evolution-ledger.md).
3. Só compare cobertura e qualidade quando a coluna **Amostra** estiver equivalente; caso contrário, use o resultado apenas como diagnóstico.
