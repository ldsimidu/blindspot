import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { abrirFichaCatalogo, buscarCatalogo, entrar, gerarFichaTecnica, obterHistoricoFichas, obterSessao, obterUltimaFichaTecnica, sair } from "./api";
import type { CatalogEntryResult, CatalogSearchResult, FichaTecnicaHistoryItem, FichaTecnicaResponse, VehicleInput } from "./types";
import logoBlindspot from "./assets/blindspot-mark.png";

type AppView = "request" | "catalog" | "history";
type ThemeMode = "dark" | "light";

interface FormState {
  marca: string;
  modelo: string;
  versao: string;
  ano_modelo: string;
  mercado: string;
}

interface CampoStatus {
  valor?: unknown;
  status?: string;
  fonte_ref?: string[];
  obs_ref?: string;
  observacoes?: string;
}

interface FichaRow {
  label: string;
  value: string;
  status: string;
  fonteRefs: string[];
  comments: string[];
}

interface FichaSection {
  key: string;
  title: string;
  rows: FichaRow[];
}

const initialFormState: FormState = {
  marca: "Ford",
  modelo: "Ranger",
  versao: "Raptor",
  ano_modelo: "2025",
  mercado: "Brasil"
};

function App() {
  const [authState, setAuthState] = useState<"checking" | "signed_out" | "signed_in">("checking");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signedInName, setSignedInName] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("blindspot_theme_mode") : null;
    return saved === "light" ? "light" : "dark";
  });
  const [activeView, setActiveView] = useState<AppView>("request");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FichaTecnicaResponse | null>(null);
  const [history, setHistory] = useState<FichaTecnicaHistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogResult, setCatalogResult] = useState<CatalogSearchResult | null>(null);
  const [catalogEntry, setCatalogEntry] = useState<CatalogEntryResult | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => window.localStorage.getItem("blindspot_onboarding_completed") !== "true");
  const onboardingPrimaryActionRef = useRef<HTMLButtonElement>(null);
  const viewTitleRef = useRef<HTMLHeadingElement>(null);

  const isFormValid = useMemo(() => {
    const hasRequiredText =
      form.marca.trim().length > 0 &&
      form.modelo.trim().length > 0 &&
      form.versao.trim().length > 0 &&
      form.mercado.trim().length > 0;
    const parsedYear = Number(form.ano_modelo);

    return hasRequiredText && Number.isInteger(parsedYear) && parsedYear >= 1900 && parsedYear <= 2100;
  }, [form]);

  const selectedHistory = useMemo(
    () => history.find((item) => item.id === selectedHistoryId) ?? null,
    [history, selectedHistoryId]
  );

  const selectedHistoryFicha = useMemo(() => {
    if (!selectedHistory) {
      return null;
    }

    return asFichaTecnicaResponse(selectedHistory.response);
  }, [selectedHistory]);

  useEffect(() => {
    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(themeMode === "light" ? "theme-light" : "theme-dark");
    window.localStorage.setItem("blindspot_theme_mode", themeMode);
  }, [themeMode]);

  useEffect(() => {
    void obterSessao().then((session) => {
      setSignedInName(session?.displayName ?? "");
      setAuthState(session ? "signed_in" : "signed_out");
    }).catch(() => setAuthState("signed_out"));
  }, []);

  useEffect(() => {
    if (isOnboardingOpen) onboardingPrimaryActionRef.current?.focus();
  }, [isOnboardingOpen]);

  useEffect(() => {
    if (!isOnboardingOpen) viewTitleRef.current?.focus();
  }, [activeView, isOnboardingOpen]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const [latest, recentHistory] = await Promise.all([obterUltimaFichaTecnica(), obterHistoricoFichas(8)]);

        if (cancelled) {
          return;
        }

        setHistory(recentHistory);
        setSelectedHistoryId((prev) => prev ?? recentHistory[0]?.id ?? null);
        if (latest) {
          setResult(latest);
        }
      } catch {
        // Keep UI usable even if loading fails.
      } finally {
        if (!cancelled) {
          setLoadingLatest(false);
        }
      }
    }

    void loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!isFormValid) {
      setError("Preencha os campos corretamente antes de enviar.");
      return;
    }

    setLoading(true);

    const payload: VehicleInput = {
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      versao: form.versao.trim(),
      ano_modelo: Number(form.ano_modelo),
      mercado: form.mercado.trim()
    };

    try {
      const response = await gerarFichaTecnica(payload);
      setResult(response);
      await refreshHistory();
      setActiveView("request");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao gerar ficha tecnica.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshHistory(): Promise<void> {
    const recentHistory = await obterHistoricoFichas(8);
    setHistory(recentHistory);
    setSelectedHistoryId(recentHistory[0]?.id ?? null);
  }

  async function runCatalogSearch(page = 1): Promise<void> {
    setCatalogLoading(true);
    setCatalogError(null);
    setCatalogEntry(null);
    try {
      setCatalogResult(await buscarCatalogo(catalogQuery, page));
      setCatalogPage(page);
    } catch (err) {
      setCatalogResult(null);
      setCatalogError(err instanceof Error ? err.message : "Erro inesperado ao consultar catalogo.");
    } finally {
      setCatalogLoading(false);
    }
  }

  async function openCatalogEntry(id: string, vehicle: VehicleInput): Promise<void> {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      setCatalogEntry(await abrirFichaCatalogo(id, vehicle));
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : "Erro inesperado ao abrir ficha do catalogo.");
    } finally {
      setCatalogLoading(false);
    }
  }

  function finishOnboarding(): void {
    window.localStorage.setItem("blindspot_onboarding_completed", "true");
    setIsOnboardingOpen(false);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setLoginLoading(true); setLoginError(null);
    try { const session = await entrar(loginEmail, loginPassword); setSignedInName(session.displayName); setLoginPassword(""); setAuthState("signed_in"); } catch (error) { setLoginError(error instanceof Error ? error.message : "Credenciais invalidas."); } finally { setLoginLoading(false); }
  }

  async function handleLogout(): Promise<void> {
    try { await sair(); } finally { setSignedInName(""); setLoginPassword(""); setAuthState("signed_out"); }
  }

  const statusAnnouncement = loading
    ? "Gerando ficha técnica."
    : catalogLoading
      ? "Consultando catálogo."
      : error ?? catalogError ?? "";

  if (authState !== "signed_in") {
    return (
      <main className="dashboard-page login-page">
        <section className="panel login-panel" aria-busy={authState === "checking"}>
          <img className="brand-logo" src={logoBlindspot} alt="BlindSpot" />
          <h1>Acessar BlindSpot</h1>
          <p>{authState === "checking" ? "Verificando sessão…" : "Entre com seu e-mail corporativo e senha."}</p>
          {authState === "signed_out" && <form onSubmit={handleLogin} className="form-grid">
            <label>E-mail corporativo<input type="email" autoComplete="username" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} required /></label>
            <label>Senha<input type="password" autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required /></label>
            {loginError && <p role="alert">{loginError}</p>}
            <button type="submit" disabled={loginLoading}>{loginLoading ? "Entrando…" : "Entrar"}</button>
          </form>}
        </section>
      </main>
    );
  }

  return (
    <div className={`dashboard-page ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">Pular para o conteúdo principal</a>
      <aside className="sidebar" aria-label="Navegação do BlindSpot">
        <div className="brand-header">
          <img className="brand-logo" src={logoBlindspot} alt="BlindSpot" />
          <span className="brand-wordmark">BLINDSPOT</span>
          <div className="brand-controls">
            <button type="button" className="theme-toggle" onClick={() => void handleLogout()} title="Encerrar sessão" aria-label={`Encerrar sessão de ${signedInName || "usuário"}`}>↪</button>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))}
              title={themeMode === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              aria-label={themeMode === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            >
              <ThemeIcon mode={themeMode} />
            </button>
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              title={isSidebarCollapsed ? "Expandir menu" : "Retrair menu"}
              aria-label={isSidebarCollapsed ? "Expandir menu" : "Retrair menu"}
            >
              <ChevronIcon direction={isSidebarCollapsed ? "right" : "left"} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Seções do produto">
          <button
            type="button"
            className={`sidebar-link ${activeView === "request" ? "active" : ""}`}
            onClick={() => setActiveView("request")}
            aria-pressed={activeView === "request"}
            title="Requisitar ficha"
          >
            <span className="sidebar-link-icon">
              <RequestIcon />
            </span>
            <span className="sidebar-link-label">Requisitar ficha</span>
          </button>
          <button
            type="button"
            className={`sidebar-link ${activeView === "catalog" ? "active" : ""}`}
            onClick={() => setActiveView("catalog")}
            aria-pressed={activeView === "catalog"}
            title="Catalogo"
          >
            <span className="sidebar-link-icon">⌕</span>
            <span className="sidebar-link-label">Catalogo</span>
          </button>
          <button
            type="button"
            className={`sidebar-link ${activeView === "history" ? "active" : ""}`}
            onClick={() => setActiveView("history")}
            aria-pressed={activeView === "history"}
            title="Historico"
          >
            <span className="sidebar-link-icon">
              <HistoryIcon />
            </span>
            <span className="sidebar-link-label">Historico</span>
          </button>
          <button type="button" className="sidebar-link" onClick={() => setIsOnboardingOpen(true)} title="Ver orientação inicial">
            <span className="sidebar-link-icon">i</span>
            <span className="sidebar-link-label">Orientação</span>
          </button>
        </nav>
      </aside>

      <main id="main-content" className="dashboard-content" tabIndex={-1}>
        <p className="sr-only" role="status" aria-live="polite">{statusAnnouncement}</p>
        {activeView === "request" ? (
          <>
            <section className="panel">
              <h1 ref={viewTitleRef} tabIndex={-1}>Nova requisicao</h1>
              <p>Informe o veiculo para gerar a ficha tecnica validada por schema.</p>

              <form onSubmit={handleSubmit} className="form-grid">
                <label>
                  Marca
                  <input
                    value={form.marca}
                    onChange={(event) => setForm((prev) => ({ ...prev, marca: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  Modelo
                  <input
                    value={form.modelo}
                    onChange={(event) => setForm((prev) => ({ ...prev, modelo: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  Versao
                  <input
                    value={form.versao}
                    onChange={(event) => setForm((prev) => ({ ...prev, versao: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  Ano modelo
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    value={form.ano_modelo}
                    onChange={(event) => setForm((prev) => ({ ...prev, ano_modelo: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  Mercado
                  <input
                    value={form.mercado}
                    onChange={(event) => setForm((prev) => ({ ...prev, mercado: event.target.value }))}
                    required
                  />
                </label>

                <button className="primary-button" disabled={loading || !isFormValid} type="submit">
                  {loading ? "Gerando..." : "Gerar ficha tecnica"}
                </button>
              </form>

              {error ? <div className="error-box" role="alert">{error}</div> : null}
              {loadingLatest ? <p className="status-text" role="status">Carregando ultima resposta salva...</p> : null}
            </section>

            {result ? <FichaDashboard title="Ultima ficha validada" ficha={result} showTraceability={false} /> : null}
          </>
        ) : activeView === "catalog" ? (
          <section className="history-layout">
            <section className="panel history-panel">
              <h1 ref={viewTitleRef} tabIndex={-1}>Catalogo de fichas</h1>
              <p>Pesquise candidatas e selecione a configuracao exata. A busca nunca abre um veiculo aproximado.</p>
              <form
                className="form-grid"
                onSubmit={(event) => {
                  event.preventDefault();
                  void runCatalogSearch(1);
                }}
              >
                <label>
                  Marca, modelo ou versao
                  <input value={catalogQuery} maxLength={100} onChange={(event) => setCatalogQuery(event.target.value)} />
                </label>
                <button className="primary-button" disabled={catalogLoading} type="submit">
                  {catalogLoading ? "Consultando..." : "Buscar no catalogo"}
                </button>
              </form>
              {catalogLoading ? <p className="status-text" role="status">Carregando catalogo...</p> : null}
              {catalogError ? <div className="error-box" role="alert">{catalogError}</div> : null}
              {catalogResult?.state === "not_registered" ? <p className="status-text" role="status">Nao cadastrado. Solicite uma nova coleta sem usar uma ficha aproximada.</p> : null}
              {catalogResult?.state === "found" ? (
                <>
                  <p className="status-text">{catalogResult.total} configuracao(oes) encontrada(s).</p>
                  <div className="history-list">
                    {catalogResult.entries.map((entry) => (
                      <button key={entry.id} type="button" className="history-item" onClick={() => void openCatalogEntry(entry.id, entry.vehicle)}>
                        <strong>{entry.vehicle.marca} {entry.vehicle.modelo} {entry.vehicle.versao} {entry.vehicle.ano_modelo}</strong>
                        <span>{entry.vehicle.mercado} · slug: {entry.slug || "pendente de atualizacao"}</span>
                        <span>Versao atual: {entry.latestVersion ?? "indisponivel"}</span>
                      </button>
                    ))}
                  </div>
                  <div className="details-toolbar">
                    <button type="button" className="collapse-all-button" disabled={catalogPage <= 1 || catalogLoading} onClick={() => void runCatalogSearch(catalogPage - 1)}>Pagina anterior</button>
                    <button type="button" className="collapse-all-button" disabled={catalogLoading || catalogPage * catalogResult.pageSize >= catalogResult.total} onClick={() => void runCatalogSearch(catalogPage + 1)}>Proxima pagina</button>
                  </div>
                </>
              ) : null}
            </section>
            <section className="panel history-detail">
              {!catalogEntry ? <p className="status-text">Selecione uma configuracao para confirmar a identidade e abrir a ficha.</p> : null}
              {catalogEntry?.state === "incompatible" ? <div className="error-box">Configuracao incompativel. Nenhuma ficha foi aberta.</div> : null}
              {catalogEntry?.state === "not_registered" ? <p className="status-text">A configuracao nao possui ficha catalogada.</p> : null}
              {catalogEntry?.state === "found" ? <FichaDashboard title={`Ficha catalogada · versao ${catalogEntry.entry.latestVersion ?? "-"}`} ficha={catalogEntry.entry.response} showTraceability /> : null}
            </section>
          </section>
        ) : (
          <section className="history-layout">
            <section className="panel history-panel">
              <h1 ref={viewTitleRef} tabIndex={-1}>Historico de respostas</h1>
              <p>Selecione um bloco para abrir a resposta no formato de ficha tecnica.</p>

              {history.length === 0 ? (
                <p className="status-text">Nenhuma resposta encontrada.</p>
              ) : (
                <div className="history-list">
                  {history.map((item) => {
                    const isActive = selectedHistoryId === item.id;
                    const vehicleLabel = item.vehicle
                      ? `${item.vehicle.marca} ${item.vehicle.modelo} ${item.vehicle.versao} ${item.vehicle.ano_modelo}`
                      : "Veiculo indisponivel";
                    const executionLabel = `${formatProviderLabel(item.provider)} · ${item.model}`;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`history-item ${isActive ? "history-item-active" : ""}`}
                        onClick={() => setSelectedHistoryId(item.id)}
                      >
                        <strong>{vehicleLabel}</strong>
                        <span>Modelo: {executionLabel}</span>
                        <span>Pesquisado em: {formatDate(item.finishedAt)}</span>
                        <span>{item.isValid ? "Schema valido" : "Schema invalido"}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="panel history-detail">
              {!selectedHistory ? <p className="status-text">Selecione uma resposta no historico.</p> : null}
              {selectedHistory && !selectedHistory.isValid ? (
                <div className="error-box">
                  Esta resposta nao passa no schema atual: {selectedHistory.validationError ?? "erro de validacao"}
                </div>
              ) : null}
              {selectedHistory ? (
                <p className="status-text">
                  Modelo: {formatProviderLabel(selectedHistory.provider)} · {selectedHistory.model} | Pesquisado em:{" "}
                  {formatDate(selectedHistory.finishedAt)}
                </p>
              ) : null}
              {selectedHistory && selectedHistoryFicha ? (
                <FichaDashboard title="Resposta selecionada" ficha={selectedHistoryFicha} showTraceability />
              ) : null}
              {selectedHistory && !selectedHistoryFicha ? (
                <pre>{JSON.stringify(selectedHistory.response, null, 2)}</pre>
              ) : null}
            </section>
          </section>
        )}
      </main>
      {isOnboardingOpen ? (
        <div className="onboarding-backdrop" role="presentation">
          <section className="onboarding-dialog" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-description">
            <p className="eyebrow">Primeiro acesso</p>
            <h2 id="onboarding-title">Conheça o ambiente de consulta</h2>
            <p id="onboarding-description">Use Requisição para gerar uma ficha, Histórico para reler respostas salvas e Catálogo para procurar fichas persistidas quando o PostgreSQL estiver disponível.</p>
            <p className="status-text">Este protótipo ainda não possui login, organização ou permissões. Controles visuais não substituem autorização no servidor.</p>
            <div className="onboarding-actions">
              <button ref={onboardingPrimaryActionRef} type="button" className="primary-button" onClick={finishOnboarding}>Começar consulta</button>
              <button type="button" className="collapse-all-button" onClick={finishOnboarding}>Pular orientação</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function FichaDashboard({
  title,
  ficha,
  showTraceability
}: {
  title: string;
  ficha: FichaTecnicaResponse;
  showTraceability: boolean;
}) {
  const sections = useMemo(() => buildSections(ficha.ficha_tecnica), [ficha.ficha_tecnica]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const allCollapsed = sections.length > 0 && sections.every((section) => collapsedSections[section.key]);
  const fontesMap = useMemo(() => {
    const map = new Map<string, { titulo: string; url: string; tipo: string }>();
    ficha.fontes_utilizadas.forEach((fonte) => {
      map.set(fonte.id, {
        titulo: fonte.titulo,
        url: fonte.url,
        tipo: fonte.tipo
      });
    });
    return map;
  }, [ficha.fontes_utilizadas]);

  const precoPublico = extractCampoStatusByPath(
    ficha.ficha_tecnica,
    "garantia_servicos_e_comercial.preco_publico"
  );
  const potencia = extractCampoStatusByPath(ficha.ficha_tecnica, "motorizacao.potencia_cv");
  const velocidadeMax = extractCampoStatusByPath(ficha.ficha_tecnica, "performance_offroad.velocidade_maxima_kmh");
  const zeroCem = extractCampoStatusByPath(ficha.ficha_tecnica, "performance_offroad.aceleracao_0_100_s");
  const completude = formatCompleteness(
    ficha.resumo_completude.preenchidas,
    ficha.resumo_completude.total_variaveis
  );

  function toggleSection(sectionKey: string): void {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  }

  function toggleAllSections(): void {
    if (allCollapsed) {
      setCollapsedSections({});
      return;
    }

    const nextState: Record<string, boolean> = {};
    sections.forEach((section) => {
      nextState[section.key] = true;
    });
    setCollapsedSections(nextState);
  }

  return (
    <section className="panel ficha-panel">
      <h2>{title}</h2>
      <section className="ficha-shell">
        <aside className="ficha-hero">
          <div className="hero-cover">
            <img className="hero-cover-logo" src={logoBlindspot} alt="BlindSpot" />
            <div className="hero-actions">
              <button type="button" className="hero-action-button" title="Compartilhar">
                <ShareIcon />
              </button>
              <button type="button" className="hero-action-button" title="Favoritar">
                <HeartIcon />
              </button>
            </div>
          </div>

          <div className="hero-info">
            <h3>
              {ficha.veiculo_alvo.marca} {ficha.veiculo_alvo.modelo} {ficha.veiculo_alvo.versao}
            </h3>
            <p>Ficha tecnica validada por schema e evidencias reais de fonte.</p>

            <div className="hero-rating">
              <span className="hero-stars">★★★★★</span>
              <span>{completude}</span>
            </div>

            <div className="hero-price-row">
              <div>
                <span className="hero-price-label">Preco</span>
                <strong>{precoPublico ? formatCampoValue(precoPublico) : "Sob consulta"}</strong>
              </div>
              <div className="hero-market">
                <span>{String(ficha.veiculo_alvo.ano_modelo)}</span>
                <span>{ficha.veiculo_alvo.mercado}</span>
              </div>
            </div>

            <div className="hero-kpis">
              <MetricCard label="Potencia" value={potencia ? formatCampoValue(potencia) : "Nao informado"} />
              <MetricCard
                label="Vel. maxima"
                value={velocidadeMax ? formatCampoValue(velocidadeMax) : "Nao informado"}
              />
              <MetricCard label="0-100 km/h" value={zeroCem ? formatCampoValue(zeroCem) : "Nao informado"} />
            </div>

            <div className="hero-meta-grid">
              <MetricCard label="Fontes" value={String(ficha.fontes_utilizadas.length)} />
              <MetricCard
                label="Completude"
                value={`${String(ficha.resumo_completude.preenchidas ?? "-")} / ${String(ficha.resumo_completude.total_variaveis ?? "-")}`}
              />
              <MetricCard
                label="Nao aplicaveis"
                value={String(ficha.resumo_completude.nao_aplicaveis ?? "-")}
              />
            </div>
          </div>
        </aside>

        <section className="ficha-details">
          <div className="details-toolbar">
            <button type="button" className="collapse-all-button" onClick={toggleAllSections}>
              {allCollapsed ? "Expandir tudo" : "Colapsar tudo"}
            </button>
          </div>

          {showTraceability ? (
            <section className="source-section">
              <h3>Fontes utilizadas</h3>
              <div className="source-grid">
                {ficha.fontes_utilizadas.map((fonte) => (
                  <article key={fonte.id} className="source-card">
                    <strong>{fonte.id}</strong>
                    <span>{fonte.titulo}</span>
                    <span>{fonte.tipo}</span>
                    <a href={fonte.url} target="_blank" rel="noreferrer">
                      Abrir fonte
                    </a>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <div className="accordion-list">
            {sections.map((section) => {
              const isCollapsed = collapsedSections[section.key] ?? false;
              return (
                <article key={section.key} className="spec-section">
                  <button
                    type="button"
                    className="accordion-header"
                    onClick={() => toggleSection(section.key)}
                    aria-expanded={!isCollapsed}
                  >
                    <span className="accordion-title">
                      <SectionIcon sectionKey={section.key} />
                      {section.title}
                    </span>
                    <ChevronIcon direction={isCollapsed ? "right" : "left"} />
                  </button>

                  {!isCollapsed ? (
                    <div className="spec-table">
                      {section.rows.map((row) => (
                        <div className="spec-row" key={`${section.key}-${row.label}`}>
                          <span className="spec-label">{row.label}</span>
                          <span className="spec-value">{row.value}</span>
                          <div className="spec-meta">
                            <span className={`status-pill status-${row.status}`}>{formatStatusLabel(row.status)}</span>
                            {showTraceability && row.fonteRefs.length > 0 ? (
                              <div className="fonte-tags">
                                {row.fonteRefs.map((fonteId) => {
                                  const fonte = fontesMap.get(fonteId);
                                  const title = fonte ? `${fonte.titulo} (${fonte.tipo})` : "Fonte sem cadastro";
                                  return (
                                    <span key={`${row.label}-${fonteId}`} className="fonte-chip" title={title}>
                                      {fonteId}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : null}
                            {showTraceability && row.comments.length > 0 ? (
                              <div className="row-comments">
                                {row.comments.map((comment) => (
                                  <span key={`${row.label}-${comment}`} className="comment-chip">
                                    {comment}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}

function buildSections(fichaTecnica: Record<string, unknown>): FichaSection[] {
  const sections: FichaSection[] = [];

  for (const [groupKey, groupValue] of Object.entries(fichaTecnica)) {
    if (!isObject(groupValue)) {
      continue;
    }

    const rows = buildRows(groupValue);
    if (rows.length === 0) {
      continue;
    }

    sections.push({
      key: groupKey,
      title: formatLabel(groupKey).toUpperCase(),
      rows
    });
  }

  return sections;
}

function extractCampoStatusByPath(
  fichaTecnica: Record<string, unknown>,
  path: string
): CampoStatus | null {
  const parts = path.split(".");
  let current: unknown = fichaTecnica;

  for (const part of parts) {
    if (!isObject(current) || !(part in current)) {
      return null;
    }
    current = current[part];
  }

  return isCampoStatus(current) ? current : null;
}

function formatCompleteness(preenchidas: unknown, total: unknown): string {
  const filled = typeof preenchidas === "number" ? preenchidas : Number(preenchidas);
  const count = typeof total === "number" ? total : Number(total);

  if (!Number.isFinite(filled) || !Number.isFinite(count) || count <= 0) {
    return "Sem score";
  }

  const ratio = Math.max(0, Math.min(1, filled / count));
  const rating = (ratio * 5).toFixed(1);
  return `${rating}/5 (${Math.round(ratio * 100)}%)`;
}

function buildRows(groupValue: Record<string, unknown>): FichaRow[] {
  const rows: FichaRow[] = [];

  for (const [key, value] of Object.entries(groupValue)) {
    if (isCampoStatus(value)) {
      rows.push({
        label: formatLabel(key),
        value: formatCampoValue(value),
        status: value.status ?? "confirmado",
        fonteRefs: Array.isArray(value.fonte_ref) ? value.fonte_ref : [],
        comments: extractCampoComments(value)
      });
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (!isObject(item) || typeof item.nome !== "string") {
          continue;
        }

        const detalhe = isCampoStatus(item.detalhe) ? item.detalhe : null;
        rows.push({
          label: item.nome,
          value: detalhe ? formatCampoValue(detalhe) : "Sem detalhe",
          status: detalhe?.status ?? "confirmado",
          fonteRefs: detalhe?.fonte_ref ?? [],
          comments: detalhe ? extractCampoComments(detalhe) : []
        });
      }
    }
  }

  return rows;
}

function asFichaTecnicaResponse(value: unknown): FichaTecnicaResponse | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    isObject(value.veiculo_alvo) &&
    isObject(value.ficha_tecnica) &&
    Array.isArray(value.fontes_utilizadas) &&
    isObject(value.resumo_completude)
  ) {
    return value as unknown as FichaTecnicaResponse;
  }

  return null;
}

function isCampoStatus(value: unknown): value is CampoStatus {
  if (!isObject(value)) {
    return false;
  }

  return "status" in value && "valor" in value;
}

function formatCampoValue(value: CampoStatus): string {
  const raw = value.valor;
  if (raw === null || raw === undefined) {
    return "Nao informado";
  }

  if (Array.isArray(raw)) {
    const normalized = raw.map((item) => formatSimpleValue(item)).filter((item) => item.length > 0);
    return normalized.length > 0 ? normalized.join(", ") : "Nao informado";
  }

  return formatSimpleValue(raw);
}

function formatSimpleValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "Nao informado";
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Nao";
  }

  return String(value);
}

function formatLabel(value: string): string {
  const base = value.replace(/_/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function formatStatusLabel(status: string): string {
  if (status === "nao_aplicavel") {
    return "Nao aplicavel";
  }

  if (status === "nao_encontrado") {
    return "Nao encontrado";
  }

  if (status === "inferido_minimamente") {
    return "Inferido";
  }

  if (status === "conflitante") {
    return "Conflitante";
  }

  if (status === "parcial") {
    return "Parcial";
  }

  return "Confirmado";
}

function formatDate(isoDate: string): string {
  if (!isoDate) {
    return "Sem data";
  }

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }

  return parsed.toLocaleString("pt-BR");
}

function formatProviderLabel(provider: "claude" | "openrouter" | "simulated"): string {
  if (provider === "openrouter") {
    return "OpenRouter";
  }

  if (provider === "claude") {
    return "Claude";
  }

  return "Simulado";
}

function extractCampoComments(campo: CampoStatus): string[] {
  const comments: string[] = [];

  if (typeof campo.obs_ref === "string" && campo.obs_ref.trim().length > 0) {
    comments.push(`obs_ref: ${campo.obs_ref}`);
  }

  if (typeof campo.observacoes === "string" && campo.observacoes.trim().length > 0) {
    comments.push(campo.observacoes.trim());
  }

  return comments;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function RequestIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M8 3h6l5 5v12a1 1 0 0 1-1 1H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm5 1.5V9h4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M3.5 12a8.5 8.5 0 1 0 2-5.4M3.5 3.5v3.8h3.8M12 7.8V12l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M14 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 3.2L8.6 12M14 13.2 8.6 16M18 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-4-3.2 3.4 4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M12 20s-6.5-3.9-9-8a5.5 5.5 0 0 1 9-6 5.5 5.5 0 0 1 9 6c-2.5 4.1-9 8-9 8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionIcon({ sectionKey }: { sectionKey: string }) {
  const icon = resolveSectionIcon(sectionKey);
  return <span className="section-icon">{icon}</span>;
}

function resolveSectionIcon(sectionKey: string): string {
  if (sectionKey.includes("motorizacao")) return "M";
  if (sectionKey.includes("transmissao")) return "T";
  if (sectionKey.includes("seguranca")) return "S";
  if (sectionKey.includes("conforto")) return "C";
  if (sectionKey.includes("multimidia") || sectionKey.includes("tecnologia")) return "X";
  if (sectionKey.includes("dimensoes")) return "D";
  if (sectionKey.includes("performance")) return "P";
  return "+";
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5 8 12l7 7" : "m9 5 7 7-7 7"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "dark") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          d="M20 14.2A8.5 8.5 0 1 1 9.8 4a7 7 0 0 0 10.2 10.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M12 4.5v-2M12 21.5v-2M4.5 12h-2M21.5 12h-2M6.2 6.2 4.8 4.8M19.2 19.2l-1.4-1.4M17.8 6.2l1.4-1.4M6.2 17.8l-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default App;
