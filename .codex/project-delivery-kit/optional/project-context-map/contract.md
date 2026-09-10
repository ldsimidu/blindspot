# Project Context Map Contract

## Propósito

Um mapa de contexto técnico torna a estrutura relevante de um repositório recuperável antes de análise, arquitetura, implementação ou revisão. É uma extensão opt-in e não depende de grafo, banco, subagentes ou ferramenta externa.

## Conteúdo mínimo

O mapa declara escopo, data de atualização, fontes consultadas, paths excluídos, componentes e responsabilidades, fluxos ou dependências relevantes, comandos de verificação conhecidos e pontos de entrada para investigação. Cada afirmação técnica deve apontar para arquivos ou diretórios verificáveis.

## Brief limitado

Um brief parte de uma pergunta, path, módulo ou mudança específica. Ele lista somente o contexto necessário, arquivos a ler primeiro, contratos afetados, riscos e lacunas. Não substitui a abertura dos arquivos citados nem afirma que o recorte representa todo o repositório.

## Frescor

Antes de usar o mapa em uma mudança material, compare a data, fontes e paths afetados com o estado atual. Se houver alteração relevante, atualize o mapa, produza um brief com ressalva ou declare que o mapa está desatualizado. Consumidores podem adicionar uma verificação determinística, mas ela não é exigida pelo PDK.

## Limites e segurança

Não inclua segredos, valores de configuração sensíveis, conteúdo pessoal ou caminhos fora do escopo. O mapa não substitui decisões de arquitetura, documentação de produto, histórico Git ou regras locais.
