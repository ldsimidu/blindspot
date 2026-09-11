---
name: technical-variable-manager
description: Mapeia e evolui variaveis de fichas tecnicas e suas futuras facetas de busca no BlindSpot, preservando schema, estados, proveniencia e compatibilidade. Use para adicionar, racionalizar, renomear ou tornar pesquisavel uma variavel; nao use para ajustes puramente visuais.
---

# Technical Variable Manager

## Objetivo

Manter cada variavel tecnicamente clara, reutilizavel entre veiculos e rastreavel desde a coleta ate a leitura e a busca. Uma variavel de ficha e diferente de uma faceta de catalogo: a segunda requer semantica de consulta e persistencia proprias.

## Antes de propor uma mudanca

- Leia `AGENTS.md`, o perfil do PDK, as instrucoes de dominio e os assets canonicos em `packages/agent-runtime/assets/`.
- Para schema, prompt, IA, API, persistencia, endpoint ou interface material, execute o Architecture Gate. Para dados, API, integracao, IA ou persistencia, consulte tambem a skill de seguranca aplicavel antes de implementar.
- Nunca use documentacao historica ou espelhos como contrato. Confirme o comportamento em `services/api/`, nos assets do runtime e nos consumidores atuais.
- Nunca preencha uma variavel com `false`, `0`, array vazia, `N/A` ou dado de outra versao como default tecnico.

## Desenho de variaveis

Para cada proposta, responda:

1. Qual decisao da pessoa usuaria ela suporta?
2. Ela e generica, condicional ou uma extensao especializada?
3. Ja existe campo pai que preserve o significado sem duplicidade?
4. Quais discriminadores determinam aplicabilidade: versao, mercado, ano, propulsao, carroceria, transmissao ou pacote?
5. Qual evidencia minima sustenta o valor e quais estados sao possiveis?

Prefira campo generico mais valores normalizados a campos por marca, voltagem, conector ou microcaso. Modele dimensoes distintas — tipo, quantidade, localizacao e descricao — somente quando cada uma tiver valor de decisao proprio. Nao fundir campos se isso apagar unidade, fonte, aplicabilidade ou comparabilidade.

## Mapa operacional

Rastreie a variavel por estas camadas e registre somente as que forem afetadas:

- schema e mock canonicos;
- politicas de campo, normalizacao, qualidade, capacidade de pesquisa e evidencia;
- composicao de prompt, LLM, normalizador e validador;
- tipos e renderizacao da API/UI;
- persistencia, historico, catalogo e comparacao;
- verificadores e fixtures sanitizadas.

Ao criar, remover ou renomear campo, preserve a obrigatoriedade estrutural, os estados explicitos, `fonte_ref`, unidade e compatibilidade de fichas existentes. Defina migracao e leitura de dados legados antes de alterar consumidores.

## Transformar variavel em faceta de busca

Nao indexe o payload inteiro. Para cada faceta candidata, especifique:

- caminho canonico e tipo de valor normalizado;
- statuses elegiveis e como a UI explica `parcial`;
- exclusao de `nao_encontrado`, `nao_aplicavel`, `conflitante` e `inferido_minimamente` como match positivo;
- fonte/proveniencia e versao da ficha consideradas;
- tabela ou indice derivado, atualizacao transacional, backfill e reversibilidade;
- contrato de API, paginacao, ordenacao e comportamento para ambiguidade;
- testes de valores equivalentes, ausencia, conflito, dado legado e identidade exata.

Comece com poucas facetas de decisao e semantica estavel. Pesquisa por identidade e filtro tecnico sao capacidades separadas; nenhuma deve fazer fallback silencioso para a outra.

## Entrega

Retorne:

1. decisao e classificacao da variavel;
2. mapa de impacto por camada;
3. alternativa generica ou consolidada, se houver;
4. contrato de estados, fonte e aplicabilidade;
5. plano de mudanca reversivel, incluindo migracao quando aplicavel; e
6. verificacoes e condicao do Architecture Gate.
