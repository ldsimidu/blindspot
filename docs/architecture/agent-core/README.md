# Documentação técnica (agent-core)

Especificação do contrato HTTP, composição do prompt, validação, LLM e pipeline Express.

| Documento | Tema |
|-----------|------|
| [VEHICLE_INPUT_SPEC.md](VEHICLE_INPUT_SPEC.md) | Payload obrigatório, formatos de body |
| [PROMPT_COMPOSITION.md](PROMPT_COMPOSITION.md) | Secções do prompt enviado ao modelo |
| [VALIDATION_AND_TYPES.md](VALIDATION_AND_TYPES.md) | Normalização determinística, AJV, `fonte_ref`, tipos |
| [SOURCE_CLASSIFICATION_SECURITY_REVIEW.md](SOURCE_CLASSIFICATION_SECURITY_REVIEW.md) | Revisão proporcional da classificação de fontes |
| [SOURCE_EVIDENCE_SECURITY_REVIEW.md](SOURCE_EVIDENCE_SECURITY_REVIEW.md) | Evidência observada, aderência, SSRF e risco residual |
| [TOLERANT_DOCUMENT_AND_FIELD_RESEARCH.md](TOLERANT_DOCUMENT_AND_FIELD_RESEARCH.md) | Gate READY para pesquisa oficial-first e orientada por lacunas |
| [TOLERANT_DOCUMENT_AND_FIELD_RESEARCH_SECURITY_REVIEW.md](TOLERANT_DOCUMENT_AND_FIELD_RESEARCH_SECURITY_REVIEW.md) | Revisão de segurança do novo fluxo proposto |
| [LLM_RUNTIME.md](LLM_RUNTIME.md) | Simulado, Claude, envs |
| [HTTP_PIPELINE.md](HTTP_PIPELINE.md) | Rotas e fluxo do handler |

Ficheiros de exemplo e schema em texto: **`../source/`** e **`../SYNC.md`**.

O runtime canônico da P0-009 usa `packages/agent-runtime/assets/source-evidence-policy.json` e `services/api/source-evidence.ts`; estes documentos não são fallback de execução.
