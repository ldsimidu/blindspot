# Evidências de UX/UI — BlindSpot

Esta área reúne evidências e decisões da auditoria conduzida com o Product Experience Kit (PEK). Ela não substitui contratos de runtime, schema, API ou regras de proveniência.

## Como usar

1. Salvar capturas observacionais em `current/<fluxo>/`, com viewport e estado no nome do arquivo.
2. Registrar referências externas em `references/` e anotar o princípio desejado, sem copiar identidade, código ou ativos.
3. Preencher os artefatos em `audit/` usando somente evidências encontradas ou declarar `NAO_OBSERVADA`.
4. Converter achados em tasks em `tasks/` após decisão humana e Architecture Gate quando a mudança for material.

## Fluxos cobertos

- Identificação e pesquisa de veículo
- Carregamento, ausência, falha e indisponibilidade
- Ficha técnica, fontes, completude, conflitos e status por variável
- Histórico e versões
- Comparação de fichas elegíveis

## Convenção de capturas

`<ordem>-<fluxo>-<estado>-<viewport>-<data>.<ext>`

Exemplo: `02-ficha-parcial-desktop-1440x900-2026-09-11.png`.

Não salvar `.env`, tokens, logs brutos, snapshots de LLM ou dados pessoais. Caso uma captura contenha dado sensível, redigir antes de versionar.

## Modos PEK esperados

- Jornada + screenshots/renders: `AUDITORIA_ORIENTADA_A_JORNADA`
- Jornada + visual + código/teste: `AUDITORIA_DE_EXPERIENCIA_IMPLEMENTADA`
- Apenas screenshots: `AUDITORIA_VISUAL_LIMITADA`
- Alvo interativo explicitamente autorizado: `AUDITORIA_INTERATIVA`
