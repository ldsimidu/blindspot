# P1-055 / Fase 3 — shell autenticado

> Estado: `APPROVED — Lucas autorizou a execução em 2026-09-13`.

## Decisão

Migrar somente a moldura autenticada para a fundação theme-capable: frame, header, navegação compacta com descoberta por rótulo e menu de sessão. O mecanismo de tema, a leitura de sessão, RBAC, destinos, abertura/fechamento por teclado e `POST /api/auth/logout` permanecem os mesmos.

## Fluxo e composição

Desktop usa frame de viewport inteiro, marca à esquerda, destinos por ícones no centro, controle de revelação ancorado e utilidades à direita. A descoberta abre um painel sem deslocar o conteúdo; cada destino mantém nome acessível, tooltip nativo e estado ativo. Mobile mantém rótulos explícitos no menu. O menu de conta continua separado da navegação.

O shell usa aliases `--app-*`; modo light apresenta canvas quente e modo dark apresenta o mapa profundo equivalente. Nenhuma view interna é reordenada neste corte.

## Segurança proporcional

- Gatilhos: sessão, RBAC e logout são consumidores do shell, embora seus contratos não mudem.
- Fronteira: `App.tsx` lê apenas o nome e papel já obtidos pela sessão; a UI não lê cookie/token nem persiste papel/destinos.
- Cenário de falha: um redesenho poderia expor destino administrativo ou tornar saída indisponível. Controles: a mesma condição de papel continua no JSX; logout continua no menu de sessão com estado `loading`, erro recuperável, `Escape` e retorno de foco existentes.
- Checks: inspeção de diff para condições de papel/`handleLogout`, typecheck/build/diff check; smoke de sessão/logout e render são pendentes do browser disponível. Não há segredo em evidência.
- Risco residual: aceite visual e smoke interativo ficam pendentes enquanto CUA não iniciar; Lucas é o responsável por aceitar esse risco antes de concluir visualmente o corte.

## Arquivos e limites

`App.tsx` ajusta apenas estrutura/classes de navegação. `styles.css` recebe regras de shell scoped. `foundation.tsx` pode ser ajustado apenas se necessário para evitar semântica inválida. Não tocar API, contratos, storage, acesso/cadastro, conteúdo de ficha, catálogo, comparação, equipe ou consumo.

## Double-check

- Ícone não é autorização: condições atuais de papel continuam envolvendo o botão completo.
- A seta revela nomes sem alterar o layout do conteúdo; `Escape` e clique externo já fecham os menus.
- Dark/light alteram material, não a disponibilidade de destino, foco, rótulo ou fluxo.
- Este corte não substitui a arquitetura específica de Nova Ficha ou workspace.

## Execução e verificação

- `AppFrame` passou a conter somente o shell autenticado; a jornada de acesso permanece fora dele.
- A navegação desktop usa ícones SVG locais com `aria-label` e `title`; a ação de descoberta abre o menu rotulado existente sem deslocar o conteúdo. Em mobile, o painel mantém os rótulos textuais.
- As mesmas condições de papel continuam sendo avaliadas ao renderizar Comparar, Equipe e Consumo. O menu de sessão e `handleLogout` não foram alterados.
- `npm run typecheck`, `npm run build` e `git diff --check`: aprovados em 2026-09-13. O build exigiu execução autorizada fora do sandbox devido à resolução da configuração do Vite.
- Checkpoint visual/smoke interativo: pendente; CUA permanece indisponível, logo este corte não está visualmente aceito ainda.
