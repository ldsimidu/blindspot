# ❌ Pendente — Adicionar pista oficial não bloqueante à pesquisa ampla

> Prioridade: P1
>
> Área afetada: runtime de IA, pesquisa web, telemetria e documentação
>
> Origem ou referência: necessidade de aumentar a chance de fontes oficiais sem regressar à pesquisa restrita por ficha técnica
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Pendente`
>
> Segurança: `A avaliar`

## Pedido

Caso as métricas após P0-010 e P1-027 comprovem que fontes oficiais continuam ausentes com frequência relevante, desenhar e implementar uma descoberta curta, genérica e não bloqueante de presença oficial para marca/modelo/mercado.

A descoberta deve servir apenas como pista para quick/refine. Ela não pode restringir a web, promover domínio automaticamente a oficial, exigir PDF, bloquear fontes externas, substituir a resposta existente nem falhar a geração se não encontrar material oficial.

## Critérios de aceite

- [ ] A execução decide se precisa da pista com base em métrica agregada definida na arquitetura, não por marca cadastrada manualmente.
- [ ] A busca por presença oficial usa somente dados do veículo solicitados e orçamento explícito, separado e limitado.
- [ ] Falha, ausência ou ambiguidade da pista degrada para `ex_prompt_compat` atual, sem reduzir cobertura nem tornar fonte externa inválida.
- [ ] Domínio encontrado não recebe selo oficial automático; a classificação de política e aderência continua server-owned.
- [ ] Nenhum fetch direto, download de documento, bypass de CDN, URL arbitrária ou nova credencial é introduzido.
- [ ] Telemetria registra apenas contagens, estado e decisão, sem URL, hostname, texto, título ou conteúdo externo.
- [ ] A validação compara amostras equivalentes e declara custo incremental, cobertura, fontes observadas/publicadas/referenciadas e regressões antes de manter a mudança.

## Restrições ou contexto

- Ler primeiro `AGENTS.md`, perfil do PDK, revisão de segurança, `services/api/llm.ts`, políticas em `packages/agent-runtime/assets/` e os resultados concluídos de P0-010/P1-027.
- Não reutilizar o fluxo antigo de caçador/leitor de documento como pré-condição da pesquisa ampla.
- Fora do escopo: lista manual global de marcas, troca de provider/modelo, alteração de schema público, persistência, endpoint, `.env` real ou chamada ao provider durante a arquitetura.

## Dependências

- P0-010 e P1-027 concluídas, com ledger indicando ausência recorrente de fontes oficiais apesar de busca ampla e boa cobertura.
- Architecture Gate e revisão de segurança próprios, mesmo que as tasks anteriores estejam aprovadas.

## Resultado do agente

_Preenchido pelo agente. Não apague o pedido original._

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Pendente` — mudança material em IA com ferramenta web e integração externa.
- Segurança: `A avaliar` — requer revisão proporcional para conteúdo externo, orçamento e fronteira de rede.
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar evidência das duas etapas anteriores e Architecture Gate próprio.
