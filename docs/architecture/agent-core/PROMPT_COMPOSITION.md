# Composição do prompt final (lógica adicional)

Origem no código: `server/prompt-builder.ts`.

## Arquivos lidos em tempo de execução

O servidor Express lê de `prompt-assets/` na raiz do repo. O espelho para repasse e diff está em **`../source/base-agent-prompt.txt`** e **`../source/schema.json`**.

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

5. `### EXECUTION_RULES` — linhas fixas em inglês que reforçam:
   - interpretar `BASE_AGENT_PROMPT` como fonte principal de instrução;
   - pesquisar na web o veículo exato de `VEHICLE_PAYLOAD_JSON`;
   - preencher todas as variáveis listadas em `SCHEMA_VARIABLES_TARGET` quando houver evidência confiável;
   - usar referências de fonte conforme o base prompt;
   - saída estritamente conforme `OUTPUT_SCHEMA_JSON`;
   - retornar **apenas JSON válido** (sem texto extra).

## Observação para outros agentes

Ao reimplementar em outro stack, preserve a ordem e os cabeçalhos `### ...` se quiser paridade com o comportamento atual; eles ajudam o modelo a separar instruções, schema, dados e metas de preenchimento.
