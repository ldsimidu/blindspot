# Perfil do Projeto para o Project Delivery Kit — BlindSpot

## Propósito e público

- Propósito do repositório: núcleo técnico oficial do BlindSpot, plataforma de inteligência competitiva automotiva.
- Pessoas usuárias ou operadoras: equipe Corventures/BlindSpot e agentes autorizados.

## Contexto técnico

- Stack, linguagens e pontos de entrada: TypeScript, React/Vite em `apps/web`, Express em `services/api`, contratos e runtime de agente em `packages/`.
- Fonte de verdade de dados: `packages/agent-runtime/assets/` para prompt/schema/mock; documentos não substituem runtime.
- Scripts ou verificações padrão: consultar `verification-strategy.md`.
- Estrutura que deve ser preservada: separação apps, services, packages, tests, evidence e docs.

## Segurança e limites

- Dados sensíveis, credenciais e permissões: `.env`, logs e snapshots brutos não entram no Git.
- Integrações ou ações externas que exigem confirmação: providers LLM, deploy, tags e releases remotas.
- Regras de domínio: dados automotivos exigem schema, fonte e status rastreáveis.

## Instruções locais

- Arquivos obrigatórios antes de implementar: `AGENTS.md`, perfil, preflight, contrato afetado e task quando houver.
- Skills, steerings ou guias do projeto: skills do PDK instaladas.
- Critérios mínimos para mudança mecânica: não altera schema, prompt, provider, endpoint, persistência, UI, contrato ou automação.
- Responsável por aceitar risco residual: Lucas.
