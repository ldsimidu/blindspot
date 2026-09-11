# Contrato do registro de evolucao

Use uma linha por execucao em `docs/operations/technical-sheet-research-evolution.md`.

Campos obrigatorios:

| Campo | Regra |
| --- | --- |
| Data/hora | Horario da execucao ou da auditoria, sem identificador de requisicao. |
| Revisao | Commit curto ou `worktree`; inclua versao de schema/politicas quando conhecida. |
| Amostra | Alvo, mercado, ano e configuracao resumidos; use `nao_comparavel` quando um deles variar. |
| Resultado | Total de variaveis, preenchidas por status, cobertura e integridade da ficha. |
| Evidencia | Fontes por aderencia, fontes isoladas e nivel mais forte observado. |
| Pipeline | Presenca de descoberta oficial, leitor, fetch, passes, buscas e falhas degradadas. |
| Hipotese | Uma unica explicacao que a proxima execucao pode confirmar ou refutar. |
| Decisao | `manter`, `reverter`, `investigar` ou `pronto_para_experimento`. |

Nao registre conteudo de respostas, URLs, prompts, segredos, hashes de conteudo, IDs de requisicao ou logs completos. O registro e uma trilha de decisao, nao um substituto dos logs locais.
