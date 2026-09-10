# Project Automation Audit Contract

## Propósito

Esta extensão avalia, em modo somente leitura, quais automações podem reduzir erro recorrente ou esforço manual em um repositório. Ela pode recomendar skills, hooks, comandos rápidos, conectores, subagentes, templates ou validações, mas não os instala nem modifica arquivos.

## Entradas

O auditor lê `AGENTS.md`, perfil do PDK, estratégias de verificação, contexto técnico aplicável, automações já existentes e riscos do repositório. Se faltar contexto, registra a lacuna em vez de presumir uma solução.

## Saída

Para cada categoria, recomendar no máximo duas automações. Cada recomendação descreve problema observado, evidência, resultado esperado, esforço, riscos, autoridade adicional e o que permanece fora do escopo. Diferencie fato, inferência e decisão pendente.

## Limites

A auditoria é read-only. Não instala dependências, serviços, MCPs, plugins ou processos; não altera hooks, skills, configuração ou credenciais; não acessa sistemas remotos. A implementação posterior requer Architecture Gate e autorização aplicáveis.
