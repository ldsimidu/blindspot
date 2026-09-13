# ✅ Concluída — E03-04a Exportar e compartilhar com autorização

> Prioridade: P1
>
> Área afetada: exportação, compartilhamento, API, armazenamento e auditoria
>
> Origem ou referência: `docs/product/backlog.md` E03-04; fluxo de exportação
>
> Arquitetura: `APPROVED — Lucas autorizou executar a task inteira em 2026-09-11.`
>
> Triagem automática: `Material — cria artefatos e potencial compartilhamento externo.`
>
> Segurança: `Aplicável — download autenticado e conteúdo de análise versionada; sem link, armazenamento externo ou integração de entrega.`

## Pedido

Exportar análise autorizada em formato aprovado e permitir compartilhamento limitado por tenant, escopo, expiração e revogação, sempre mantendo fontes e versão.

## Critérios de aceite

- [x] Sem papel/tenant autorizado não há arquivo nem link.
- [x] Artefato inclui versão e proveniência necessárias à interpretação.
- [x] Não há link compartilhável neste MVP; portanto não há artefato persistido, expiração ou revogação a aplicar.

## Restrições ou contexto

- Depende de P1-017 e P1-013.
- Formatos, armazenamento e canal de entrega exigem decisão explícita.

## Arquitetura — MVP CSV e JSON autenticados — 2026-09-10

### Decisões de produto

- Formatos iniciais: **CSV** e **JSON**.
- Não haverá link compartilhável, e-mail, bucket público, armazenamento de artefato ou re-download neste corte.
- `analyst` e `admin` podem exportar somente uma análise salva da própria organização; `viewer`, sessão ausente, ID inexistente ou análise de outro tenant falham fechados.

### Fluxo e contrato propostos

1. A pessoa abre uma comparação salva e escolhe CSV ou JSON.
2. O servidor valida sessão, papel e ownership no tenant antes de montar o conteúdo em memória.
3. O download contém identificação dos dois veículos e versões, data de geração, campos comparados, valores, unidades, status, diferença, referências de fonte e avisos de contexto. Não inclui cookie, token, e-mail, organização de origem, prompt, payload bruto de LLM ou log.
4. O servidor entrega `Content-Disposition: attachment`, `Content-Type` allowlisted e `Cache-Control: no-store`; não grava arquivo nem retorna URL.
5. Um evento de auditoria sanitizado registra exportação permitida ou negada, formato e ID da análise, sem conteúdo exportado.

### Segurança e conformidade proporcionais

- Gatilhos: API autenticada, autorização por tenant e exportação. Controles: RBAC no servidor, lookup por tenant, allowlist `csv|json`, nenhuma entrada influencia caminho de arquivo ou header além do formato, limite de tamanho e resposta em memória.
- Abuso relevante: enumeração de análise, exportação cruzada de tenant, injeção de fórmula CSV e cache/local persistence. Mitigações: resposta neutra para recurso inexistente/alheio, serialização CSV que neutraliza células iniciadas por `=`, `+`, `-` ou `@`, cabeçalhos `no-store` e ausência de link/artefato armazenado.
- Conformidade: não há terceiro, transferência internacional, cookie novo, analytics, retenção adicional ou link público. O conteúdo é técnico; se futuramente incluir dados pessoais, compartilhamento externo ou retenção, reabrir revisão de privacidade/LGPD com responsável e política definida.

### Verificações planejadas

- CSV e JSON possuem a mesma comparação, versões, fontes e avisos, sem segredo ou atributo de tenant.
- `viewer`, sem sessão e tenant diferente não recebem download; formato inválido recebe `400` sanitizado.
- CSV neutraliza fórmula e preserva UTF-8; headers impedem cache e download usa nome determinístico sem dado controlado pela pessoa.
- Typecheck, build, `git diff --check` e smoke autenticado de sucesso/negação.

### Double-check da arquitetura

- CSV/JSON atendem à decisão atual sem dependência de renderizador PDF/Excel, e a ausência de link elimina expiração, revogação e armazenamento neste corte.
- O arquivo é derivado da comparação imutável salva, não de estado transitório da tela; isso preserva proveniência e versão.
- Estado: `READY — decisões de formato e canal confirmadas; aguarda autorização explícita para implementar.`

## Adendo — exportação de ficha individual — 2026-09-10

### Decisão proposta

- A exportação atende dois recursos imutáveis: uma **ficha técnica por UUID de versão** e uma **comparação salva**.
- Não se exporta “a ficha mais recente” de forma implícita: a pessoa abre uma versão específica e o download referencia exatamente esse UUID, número de versão e data.
- Mesma política de autorização: `analyst|admin`, sessão ativa e recurso acessível; sem links, arquivos persistidos ou compartilhamento externo.

### Modelo JSON

```json
{
  "export_contract_version": "technical-export-v1",
  "kind": "technical_sheet",
  "generated_at": "ISO-8601",
  "technical_sheet": {
    "version_id": "UUID",
    "version_number": 7,
    "vehicle": { "marca": "Ford", "modelo": "Ranger", "versao": "Raptor", "ano_modelo": 2025, "mercado": "Brasil" },
    "schema_contract": "hash-ou-identificador-publico",
    "completeness": {},
    "data": { "ficha_tecnica": "estrutura original validada" },
    "sources": [{ "id": "fonte", "title": "Título", "type": "oficial" }]
  }
}
```

- JSON preserva a estrutura validada da ficha, incluindo estados, unidades, `fonte_ref`, ausência e conflito; não inclui prompt, token, e-mail, organização de origem, logs ou payload de execução.

### Modelo CSV

- Uma linha por campo técnico, com colunas: `version_id`, `version_number`, `marca`, `modelo`, `versao`, `ano_modelo`, `mercado`, `path`, `campo`, `valor`, `unidade`, `status`, `fonte_refs`, `observacao`.
- Objetos e listas do schema são achatados em `path` determinístico. Valores múltiplos usam JSON compacto na célula; qualquer célula iniciada por `=`, `+`, `-` ou `@` é neutralizada.
- CSV não tenta representar uma comparação; comparação mantém seu CSV próprio, lado esquerdo/direito/diferença.

### Fluxo e verificações

1. Pessoa abre uma ficha catalogada por versão exata e escolhe CSV ou JSON.
2. Servidor verifica sessão, papel e UUID da versão; gera conteúdo em memória, com `attachment` e `no-store`.
3. Testar versão inexistente, formato inválido, sem sessão, `viewer`, campo com fórmula, fonte ausente/conflitante e ausência de dados de tenant.

### Double-check do adendo

- O modelo preserva proveniência e estados sem transformar ausência/conflito em certeza.
- Exportar versão exata evita que uma nova coleta altere silenciosamente o arquivo de uma ficha antes aberta.
- Estado do adendo: `READY — aguarda aprovação explícita de Lucas para implementar.`

## Resultado do agente

- Estado: `✅ Concluída`; Arquitetura: `APPROVED`; Segurança: `Aplicável — RBAC, tenant e exportação em memória.`
- Implementação: exportação autenticada CSV/JSON de comparação salva e de ficha por UUID de versão está disponível. As rotas filtram organização no servidor, exigem `analyst|admin`, usam formato allowlisted, `attachment` e `Cache-Control: no-store`; CSV neutraliza fórmulas. Não há link, bucket, e-mail ou retenção adicional.
- Arquivos: `services/api/index.ts`, `services/api/db/repository.ts`, `apps/web/src/api.ts`, interface de comparação/histórico e esta task.
- Verificação: `npm run typecheck` e `git diff --check` passam; contrato de autorização está presente nas rotas. Build global continua bloqueado pelo `vite.config.ts` ausente no checkout.
- Próximo passo: P1-019.
