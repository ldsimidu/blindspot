# ❌ Pendente — Criar workspace de veículo e ciclo de vida das fichas

> Prioridade: P1
>
> Área afetada: API, interface, identidade e autorização
>
> Origem ou referência: P1-030 e proposta, seções 5, 6, 10 a 12, 51 e 62 a 64
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — nova jornada, endpoints e ações sobre dados.`
>
> Segurança: `Aplicável — dados de organização, autorização e API.`

## Pedido

Criar a visão de Vehicle como espaço de trabalho de configurações normalizadas, com suas fichas independentes e ações claras: continuar, criar do zero, criar a partir de base, refresh e comparar. A identidade ambígua deve pedir confirmação, não unir veículos por similaridade silenciosamente.

## Critérios de aceite

- [ ] A página mostra identidade de configuração, fichas, revisão mais recente, qualidade explicável, alertas e rótulos Latest/Recommended/Primary quando aplicáveis.
- [ ] Criar nova ficha não altera as existentes; continuar cria sessão na ficha selecionada; refresh preserva linhagem e regras definidas.
- [ ] Ações de criar/selecionar respeitam escopo de organização e papel do servidor.
- [ ] Resolver de veículo usa normalização/aliases determinísticos; caso incerto oferece decisão humana e registra a escolha.
- [ ] Estados de vazio, erro, sem permissão e identidade incompatível são acessíveis e não escondem alternativas.

## Restrições ou contexto

- Depende de P1-030, P1-034 e das tasks de autenticação/RBAC relevantes.
- Reutilizar a descoberta de fichas existente; não introduzir um segundo catálogo nem pesquisa textual sem contrato.
- Fork e merge ficam fora; a interface só prepara pontos de extensão aprovados.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — interface, endpoints e autorização.`
- Segurança: `Aplicável — tenant, RBAC e enumeração de dados.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar dependências e Architecture Gate próprio.
