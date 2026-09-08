# Composição do prompt final (lógica adicional)

Origem no código: `services/api/prompt-builder.ts` e `services/api/runtime-assets.ts`.

## Arquivos lidos em tempo de execução

O runtime lê `base-agent-prompt.txt` e `schema.json` exclusivamente de `packages/agent-runtime/assets/`. Esse diretório é a fonte canônica; esta documentação não é fallback de runtime.

## Seções do prompt enviado ao modelo

O texto final concatena, nesta ordem:

1. `### BASE_AGENT_PROMPT` — conteúdo do ficheiro de prompt base (trim).
2. `### OUTPUT_SCHEMA_JSON` — o schema JSON formatado com indentação 2 espaços.
3. `### VEHICLE_PAYLOAD_JSON` — objeto `VehiclePayload`:

   ```json
   {
     "context": {
       "vehicle": {
         "marca", "modelo", "versao", "ano_modelo", "mercado"
       }
     }
   }
   ```

4. `### SCHEMA_VARIABLES_TARGET` — array JSON de caminhos `grupo.campo` derivados do schema:
   - Percorre `properties.ficha_tecnica.properties` no schema.
   - Para cada grupo, lê `required` e emite strings `"<nome_do_grupo>.<campo>"`.

5. `### SOURCE_POLICY_JSON` — política canônica de fontes, quando carregada para a geração.

6. `### NORMALIZATION_POLICY_JSON` — política canônica e versionada de medidas, quando carregada para a geração. Ela informa os poucos campos/unidades convertíveis; não autoriza inferir unidade, versão ou valor ausente.

7. `### EXECUTION_RULES` — linhas fixas em inglês que reforçam:
   - interpretar `BASE_AGENT_PROMPT` como fonte principal de instrução;
   - pesquisar na web o veículo exato de `VEHICLE_PAYLOAD_JSON`;
   - preencher todas as variáveis listadas em `SCHEMA_VARIABLES_TARGET` quando houver evidência confiável;
   - usar referências de fonte conforme o base prompt;
  - uso de unidade canônica apenas quando a política de normalização a define, sem inferir unidade ambígua;
  - saída estritamente conforme `OUTPUT_SCHEMA_JSON`;
   - retornar **apenas JSON válido** (sem texto extra).

## Observação para outros agentes

Ao reimplementar em outro stack, preserve a ordem e os cabeçalhos `### ...` se quiser paridade com o comportamento atual; eles ajudam o modelo a separar instruções, schema, dados e metas de preenchimento.
