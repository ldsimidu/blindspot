# Piloto controlado de coordenação multiagente

## Seleção

Escolha uma mudança pequena, com task e Architecture Gate aprovados, dois domínios independentes, testes locais e possibilidade de execução única como fallback. Não use produção, dados pessoais, segredos, operação remota ou contrato compartilhado de alto risco no primeiro piloto.

## Baseline e evidências

Registre antes: task, commit/base, plano, paths/contratos, tempo de preparação, conflitos conhecidos e verificações. Durante o piloto, registre apenas metadados sanitizados: claims declarativos, dependências, handoffs, conflitos evitados/encontrados e checks. Não colete prompts brutos, logs sensíveis, conteúdo de cliente ou telemetria automática.

## Gates

O piloto exige autorização específica para criar worktrees e para qualquer operação Git mutável. Falha de plano, conflito semântico, dependência inesperada ou check bloqueado retorna ao modo único e ao integrador. A avaliação do PDK não aprova o produto consumidor.

## Saída e rollback

Sucesso exige handoffs completos, integração revisada e verificações do projeto. O rollback é não adotar a mudança; remoção de worktree/branch só ocorre com alvo explícito e autorização. Lucas aceita risco residual de validações indisponíveis.
