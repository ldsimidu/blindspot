import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ApiRequestError, abrirFichaCatalogo, ativarConviteMembro, alterarPapelMembro, buscarCatalogo, cadastrarOrganizacao, convidarMembro, desativarMembro, entrar, exportarFicha, gerarFichaTecnica, obterAlertasConsumo, obterConsumo, obterEquipe, obterHistoricoFichas, obterRecomendacoesCatalogo, obterSessao, obterUltimaFichaTecnica, reconhecerAlertaConsumo, revogarConviteMembro, sair, salvarPoliticaConsumo } from "./api";
import type { CatalogCandidate, CatalogEntryResult, CatalogSearchResult, FichaTecnicaHistoryItem, FichaTecnicaResponse, OrganizationMember, OrganizationMemberInvitation, OrganizationRole, UsageAlertSettings, UsageSummary, VehicleInput } from "./types";
import logoBlindspot from "./assets/blindspot-mark.png";
import { formatCnpj, isValidCnpj } from "../../../packages/contracts/cnpj";
import { ComparisonPanel } from "./ComparisonPanel";
import { CatalogWorkspace } from "./CatalogWorkspace";
import { TechnicalFichaWorkspace } from "./TechnicalFichaWorkspace";
import { VehicleWorkspace } from "./VehicleWorkspace";
import { TeamWorkspace, UsageWorkspace } from "./AdminWorkspaces";
import { UiButton, UiCard, UiField, UiStatus, UiToast } from "./ui/primitives";

type AppView = "request" | "catalog" | "workspace" | "comparison" | "history" | "team" | "usage";
type ThemeMode = "dark" | "light";
type AccessView = "login" | "registration" | "received" | "pending_review" | "rejected";
type AccessVisualStage = "login" | "company" | "owner" | "access" | "review" | "pending";

const registrationFlow = [
  { phase: "Empresa", label: "Dados da empresa" },
  { phase: "Responsável", label: "Pessoa responsável" },
  { phase: "Acesso", label: "Defina seu acesso" },
  { phase: "Revisão", label: "Revise a solicitação" }
] as const;

const registrationPhases = ["Empresa", "Responsável", "Acesso", "Revisão"] as const;

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
  origem?: "entrada_usuario";
  fonte_ref?: string[];
  obs_ref?: string;
  observacoes?: string;
}

interface FichaRow {
  key: string;
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
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "success" | "error"; title: string; message: string; isClosing: boolean } | null>(null);
  const [accessView, setAccessView] = useState<AccessView>("login");
  const [accessMotionDirection, setAccessMotionDirection] = useState<"forward" | "backward">("forward");
  const [registration, setRegistration] = useState({ company_name: "", cnpj: "", contact_name: "", contact_email: "", password: "", password_confirmation: "", privacy_notice_version: "" });
  const [registrationStep, setRegistrationStep] = useState(1);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationFieldErrors, setRegistrationFieldErrors] = useState<{ cnpj?: string }>({});
  const [registrationOperationError, setRegistrationOperationError] = useState<string | null>(null);
  const [signedInName, setSignedInName] = useState("");
  const [signedInRole, setSignedInRole] = useState<OrganizationRole | null>(null);
  const [logoutState, setLogoutState] = useState<"idle" | "loading" | "error">("idle");
  const accessHeadingRef = useRef<HTMLHeadingElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("blindspot_theme_mode") : null;
    return saved === "light" ? "light" : "dark";
  });
  const [activeView, setActiveView] = useState<AppView>("request");
  const [isNavigationMenuOpen, setIsNavigationMenuOpen] = useState(false);
  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FichaTecnicaResponse | null>(null);
  const [history, setHistory] = useState<FichaTecnicaHistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogFilters, setCatalogFilters] = useState({ brand: "", model: "", modelYear: "", market: "" });
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogResult, setCatalogResult] = useState<CatalogSearchResult | null>(null);
  const [catalogEntry, setCatalogEntry] = useState<CatalogEntryResult | null>(null);
  const [catalogRelated, setCatalogRelated] = useState<CatalogCandidate[]>([]);
  const [comparisonSeed, setComparisonSeed] = useState<CatalogCandidate | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const viewTitleRef = useRef<HTMLHeadingElement>(null);
  const navigationToggleRef = useRef<HTMLButtonElement>(null);
  const sessionToggleRef = useRef<HTMLButtonElement>(null);
  const navigationMenuRef = useRef<HTMLElement>(null);
  const sessionMenuRef = useRef<HTMLElement>(null);

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
      setSignedInName(session?.displayName ?? ""); setSignedInRole(session?.role ?? null);
      setAuthState(session ? "signed_in" : "signed_out");
    }).catch(() => setAuthState("signed_out"));
  }, []);

  useEffect(() => {
    viewTitleRef.current?.focus();
  }, [activeView]);

  useEffect(() => {
    if (authState !== "signed_in") accessHeadingRef.current?.focus();
  }, [authState, accessView, registrationStep]);

  useEffect(() => {
    if (!isNavigationMenuOpen && !isSessionMenuOpen) return;

    function closeMenusFromKeyboard(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      if (isNavigationMenuOpen) {
        setIsNavigationMenuOpen(false);
        navigationToggleRef.current?.focus();
      }
      if (isSessionMenuOpen) {
        setIsSessionMenuOpen(false);
        sessionToggleRef.current?.focus();
      }
    }

    function closeMenusFromPointer(event: PointerEvent): void {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (isNavigationMenuOpen && !navigationMenuRef.current?.contains(target) && !navigationToggleRef.current?.contains(target)) setIsNavigationMenuOpen(false);
      if (isSessionMenuOpen && !sessionMenuRef.current?.contains(target) && !sessionToggleRef.current?.contains(target)) setIsSessionMenuOpen(false);
    }

    document.addEventListener("keydown", closeMenusFromKeyboard);
    document.addEventListener("pointerdown", closeMenusFromPointer);
    return () => {
      document.removeEventListener("keydown", closeMenusFromKeyboard);
      document.removeEventListener("pointerdown", closeMenusFromPointer);
    };
  }, [isNavigationMenuOpen, isSessionMenuOpen]);

  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    if (authState !== "signed_in") {
      setLoadingLatest(false);
      return;
    }
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
  }, [authState]);

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
      const message = formatTechnicalSheetGenerationError(err);
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
      const hasCriteria = Boolean(catalogQuery.trim() || catalogFilters.brand.trim() || catalogFilters.model.trim() || catalogFilters.modelYear.trim() || catalogFilters.market.trim());
      setCatalogResult(await buscarCatalogo({ query: catalogQuery, ...catalogFilters, page, sort: hasCriteria ? "alphabetical" : "recent" }));
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
    setCatalogRelated([]);
    try {
      const entry = await abrirFichaCatalogo(id, vehicle);
      setCatalogEntry(entry);
      if (entry.state === "found") {
        const related = await obterRecomendacoesCatalogo(id, vehicle);
        if (related.state === "found") setCatalogRelated(related.entries);
      }
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : "Erro inesperado ao abrir ficha do catalogo.");
    } finally {
      setCatalogLoading(false);
    }
  }

  function addCatalogCandidateToComparison(candidate: CatalogCandidate): void {
    if (!candidate.latestTechnicalSheetVersionId || (signedInRole !== "analyst" && signedInRole !== "admin")) return;
    setComparisonSeed(candidate);
    setActiveView("comparison");
  }

  function publishToast(tone: "success" | "error", title: string, message: string): void {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToast({ tone, title, message, isClosing: false });
    toastTimerRef.current = window.setTimeout(dismissToast, 6000);
  }

  function dismissToast(): void {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToast((current) => current ? { ...current, isClosing: true } : null);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 180);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setLoginLoading(true); setLoginError(null); setLoginNotice(null);
    try { const outcome = await entrar(loginEmail, loginPassword); if (outcome.state !== "authenticated") { setAccessMotionDirection("forward"); setAccessView(outcome.state); return; } setSignedInName(outcome.displayName); setSignedInRole(outcome.role); setLoginPassword(""); setAuthState("signed_in"); publishToast("success", "Sessão iniciada", "Seu acesso foi confirmado."); } catch { const message = "Não foi possível entrar com essas credenciais."; setLoginError(message); publishToast("error", "Não foi possível entrar", "Revise suas credenciais e tente novamente."); } finally { setLoginLoading(false); }
  }

  async function handleRegistration(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setRegistrationError(null); setRegistrationOperationError(null);
    if (registrationStep !== registrationFlow.length) { advanceRegistration(); return; }
    setRegistrationLoading(true);
    try {
      await cadastrarOrganizacao(registration);
      setLoginEmail(registration.contact_email);
      setLoginPassword("");
      setRegistration({ company_name: "", cnpj: "", contact_name: "", contact_email: "", password: "", password_confirmation: "", privacy_notice_version: "" });
      setRegistrationFieldErrors({});
      setRegistrationStep(1);
      setAccessMotionDirection("forward");
      setAccessView("received");
      publishToast("success", "Solicitação enviada", "Recebemos seu cadastro para análise.");
    }
    catch { const message = "Não foi possível enviar o cadastro agora. Revise os dados e tente novamente."; setRegistrationOperationError(message); publishToast("error", "Não foi possível enviar", "Revise os dados e tente novamente."); }
    finally { setRegistrationLoading(false); }
  }

  function advanceRegistration(): void {
    setRegistrationError(null);
    const cnpjIsValid = registrationStep === 1 ? validateRegistrationCnpj() : true;
    const stepErrors: Record<number, string | null> = {
      1: registration.company_name.trim().length >= 2 && cnpjIsValid ? null : registration.company_name.trim().length >= 2 ? null : "Informe o nome da empresa para continuar.",
      2: registration.contact_name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(registration.contact_email) ? null : "Informe o nome do responsável e um e-mail corporativo válido.",
      3: registration.password.length >= 12 && registration.password === registration.password_confirmation && Boolean(registration.privacy_notice_version) ? null : "Use uma senha de ao menos 12 caracteres, confirme-a e leia o aviso de privacidade.",
    };
    const error = stepErrors[registrationStep];
    if (error) { setRegistrationError(error); return; }
    setAccessMotionDirection("forward");
    setRegistrationStep((current) => Math.min(current + 1, registrationFlow.length));
  }

  function validateRegistrationCnpj(): boolean {
    const isValid = isValidCnpj(registration.cnpj);
    setRegistrationFieldErrors((current) => ({ ...current, cnpj: isValid ? undefined : "Informe um CNPJ válido para continuar." }));
    return isValid;
  }

  function returnToPreviousRegistrationStep(): void {
    setRegistrationError(null); setRegistrationOperationError(null);
    if (registrationStep === 1) {
      setRegistration((current) => ({ ...current, password: "", password_confirmation: "", privacy_notice_version: "" }));
      setLoginPassword("");
      setAccessMotionDirection("backward");
      setAccessView("login");
      return;
    }
    setAccessMotionDirection("backward");
    setRegistrationStep((current) => current - 1);
  }

  function returnToLoginForStatus(): void {
    setLoginPassword("");
    setLoginError(null);
    setLoginNotice("Para verificar o status, entre novamente com seu e-mail e senha.");
    setAccessMotionDirection("backward");
    setAccessView("login");
  }

  async function handleLogout(): Promise<void> {
    if (logoutState === "loading") return;
    setLogoutState("loading");
    try {
      await sair();
      setSignedInName("");
      setSignedInRole(null);
      setLoginPassword("");
      setAccessView("login");
      setAuthState("signed_out");
      setLogoutState("idle");
      publishToast("success", "Sessão encerrada", "Você saiu do BlindSpot com segurança.");
    } catch {
      setLogoutState("error");
      publishToast("error", "Não foi possível sair", "Tente encerrar sua sessão novamente.");
    }
  }

  const statusAnnouncement = logoutState === "loading"
    ? "Encerrando sessão."
    : loading
    ? "Gerando ficha técnica."
    : catalogLoading
      ? "Consultando catálogo."
      : error ?? catalogError ?? "";

  const memberInvitationToken = /^\/convites\/membros\/(MINV-[A-Za-z0-9_-]{40,96})$/.exec(window.location.pathname)?.[1] ?? null;
  if (memberInvitationToken) return <MemberInvitationActivation token={memberInvitationToken} />;

  if (authState !== "signed_in") {
    const currentRegistrationStep = registrationFlow[registrationStep - 1];
    const registrationPhaseIndex = registrationStep - 1;
    const accessVisualStage: AccessVisualStage = accessView === "registration"
      ? registrationStep === 1 ? "company" : registrationStep === 2 ? "owner" : registrationStep === 3 ? "access" : "review"
      : accessView === "received" || accessView === "pending_review" ? "pending"
        : "login";
    const accessTitle = accessView === "registration"
      ? currentRegistrationStep.label
      : accessView === "rejected"
        ? "Não foi possível aprovar sua empresa"
        : accessView === "received" || accessView === "pending_review"
          ? "Cadastro em análise"
          : "Acesse sua conta";
    const accessDescription = accessView === "registration"
      ? "Preencha os dados desta etapa. A solicitação só é enviada na confirmação final."
      : accessView === "rejected"
        ? "Seu cadastro não foi aprovado neste momento. Fale com o suporte para receber orientações."
        : accessView === "received" || accessView === "pending_review"
          ? "Recebemos sua solicitação. A liberação de acesso depende da análise do BlindSpot."
          : authState === "checking"
            ? "Verificando sua sessão com segurança."
            : "Entre com seu e-mail corporativo e senha.";
    return (
      <main className="access-experience">
        <div className="access-shell">
          <div className="access-layout">
            <aside className={`access-editorial access-media access-visual access-visual--${accessVisualStage}`} aria-label="Contexto visual do BlindSpot">
              <div className="access-media-glow" aria-hidden="true" />
              <div className="access-visual__contour" aria-hidden="true" />
              <div className="access-visual__node access-visual__node--one" aria-hidden="true" />
              <div className="access-visual__node access-visual__node--two" aria-hidden="true" />
              <div className="access-visual__connection" aria-hidden="true" />
              <div className="access-visual__ring" aria-hidden="true" />
              <div className="access-media-content">
                <div className="access-orb-brand">
                  <img className="access-media-logo" src={logoBlindspot} alt="BlindSpot" />
                  <strong>BLINDSPOT</strong>
                  <p>Decisões estratégicas <em>sem</em> pontos cegos.</p>
                </div>
              </div>
            </aside>
            <UiCard key={`${accessView}-${registrationStep}`} as="section" className={`access-task access-task--${accessMotionDirection}`} raised aria-busy={authState === "checking" || registrationLoading}>
              <p className="access-task-eyebrow">{accessView === "registration" ? `${currentRegistrationStep.phase} · etapa ${registrationStep} de ${registrationFlow.length}` : "Área segura"}</p>
              {accessView === "registration" && <ol className="access-phase-list access-task-steps" aria-label="Fases do cadastro">
                {registrationPhases.map((phase, index) => <li key={phase} className={index === registrationPhaseIndex ? "is-current" : index < registrationPhaseIndex ? "is-complete" : ""} aria-current={index === registrationPhaseIndex ? "step" : undefined}><span aria-hidden="true">{index < registrationPhaseIndex ? "✓" : index + 1}</span><span className="access-task-step-label">{phase}</span></li>)}
              </ol>}
              <h1 ref={accessHeadingRef} tabIndex={-1}>{accessTitle}</h1>
              <p className="access-task-description">{accessDescription}</p>
              {authState === "checking" && <UiStatus tone="entry" label="Verificando sessão" />}
              {accessView === "login" && authState === "signed_out" && <form onSubmit={handleLogin} className="access-form">
                <UiField label="E-mail corporativo"><input type="email" autoComplete="username" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} required /></UiField>
                <UiField label="Senha"><input type="password" autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required /></UiField>
                {loginNotice && <p className="access-notice" role="status">{loginNotice}</p>}
                {loginError && <p className="access-error" role="alert">{loginError}</p>}
                <UiButton className="access-primary" type="submit" isLoading={loginLoading} loadingLabel="Entrando…">Entrar</UiButton>
                <button type="button" className="access-text-action" onClick={() => { setLoginError(null); setRegistrationStep(1); setAccessMotionDirection("forward"); setAccessView("registration"); }}>Cadastrar minha empresa</button>
              </form>}
              {accessView === "registration" && <form onSubmit={handleRegistration} className="access-form registration-flow" aria-busy={registrationLoading}>
                {registrationStep === 1 && <div className="access-field-pair"><UiField label="Nome da empresa"><input value={registration.company_name} onChange={(event) => setRegistration((current) => ({ ...current, company_name: event.target.value }))} minLength={2} maxLength={160} autoComplete="organization" required /></UiField><UiField label="CNPJ" hint="Usado para identificar a organização." error={registrationFieldErrors.cnpj}><input value={registration.cnpj} onChange={(event) => { setRegistration((current) => ({ ...current, cnpj: formatCnpj(event.target.value) })); setRegistrationFieldErrors((current) => ({ ...current, cnpj: undefined })); }} onBlur={() => { if (registration.cnpj.trim()) validateRegistrationCnpj(); }} inputMode="numeric" maxLength={18} autoComplete="off" required /></UiField></div>}
                {registrationStep === 2 && <div className="access-field-pair"><UiField label="Nome do responsável"><input value={registration.contact_name} onChange={(event) => setRegistration((current) => ({ ...current, contact_name: event.target.value }))} minLength={2} maxLength={120} autoComplete="name" required /></UiField><UiField label="E-mail corporativo"><input type="email" autoComplete="email" value={registration.contact_email} onChange={(event) => setRegistration((current) => ({ ...current, contact_email: event.target.value }))} required /></UiField></div>}
                {registrationStep === 3 && <><div className="access-field-pair"><UiField label="Crie uma senha" hint="Mínimo de 12 caracteres."><input type="password" autoComplete="new-password" value={registration.password} onChange={(event) => setRegistration((current) => ({ ...current, password: event.target.value }))} minLength={12} maxLength={128} required /></UiField><UiField label="Confirme sua senha"><input type="password" autoComplete="new-password" value={registration.password_confirmation} onChange={(event) => setRegistration((current) => ({ ...current, password_confirmation: event.target.value }))} minLength={12} maxLength={128} required /></UiField></div><label className="access-checkbox"><input type="checkbox" checked={Boolean(registration.privacy_notice_version)} onChange={(event) => setRegistration((current) => ({ ...current, privacy_notice_version: event.target.checked ? "2026-09" : "" }))} /> Li o aviso de privacidade aplicável ao cadastro.</label></>}
                {registrationStep === 4 && <section className="registration-review" aria-label="Revisão do cadastro">
                  <header><div><UiStatus tone="entry" label="Pronto para enviar" /><h2>Confirme sua solicitação</h2></div><p>Confira os dados antes de encaminhar o cadastro para análise.</p></header>
                  <div className="registration-review__groups">
                    <section><div className="registration-review__group-heading"><h3>Empresa</h3><button type="button" onClick={() => { setAccessMotionDirection("backward"); setRegistrationStep(1); }}>Editar</button></div><dl><div><dt>Nome</dt><dd>{registration.company_name}</dd></div><div><dt>CNPJ</dt><dd>{registration.cnpj}</dd></div></dl></section>
                    <section><div className="registration-review__group-heading"><h3>Responsável</h3><button type="button" onClick={() => { setAccessMotionDirection("backward"); setRegistrationStep(2); }}>Editar</button></div><dl><div><dt>Nome</dt><dd>{registration.contact_name}</dd></div><div><dt>E-mail</dt><dd>{registration.contact_email}</dd></div></dl></section>
                  </div>
                </section>}
                {registrationError && <p className="access-error" role="alert">{registrationError}</p>}
                {registrationStep === registrationFlow.length && <div className="access-operation-feedback" aria-live="polite">{registrationOperationError && <p className="access-error" role="status">{registrationOperationError}</p>}</div>}
                <div className={`access-actions ${registrationStep === registrationFlow.length ? "access-actions--final" : ""}`}><UiButton tone="secondary" type="button" onClick={returnToPreviousRegistrationStep}>Voltar</UiButton><UiButton type="submit" isLoading={registrationLoading} loadingLabel="Enviando cadastro…">{registrationStep === registrationFlow.length ? "Enviar solicitação para análise" : "Continuar"}</UiButton></div>
              </form>}
              {(accessView === "received" || accessView === "pending_review") && <section className="approval-wait" aria-label="Status do cadastro"><ol className="approval-timeline"><li className="is-complete"><strong><span className="sr-only">Concluído: </span>Cadastro enviado</strong><span>Recebemos sua solicitação.</span></li><li className="is-current"><strong>Em análise</strong><span>O acesso ainda não está liberado.</span></li></ol><section className="approval-next-action" aria-label="Próxima ação"><h2>Próxima ação</h2><p>Entre novamente para verificar o status quando necessário.</p></section><div className="access-actions"><UiButton type="button" onClick={returnToLoginForStatus}>Voltar ao login</UiButton><a href="mailto:suporte@blindspot.local">Falar com o suporte</a></div></section>}
              {accessView === "rejected" && <div className="access-actions"><UiButton tone="secondary" type="button" onClick={() => setAccessView("login")}>Voltar ao login</UiButton><a href="mailto:suporte@blindspot.local">Falar com o suporte</a></div>}
            </UiCard>
          </div>
          {toast && <UiToast tone={toast.tone} title={toast.title} message={toast.message} isClosing={toast.isClosing} onDismiss={dismissToast} />}
        </div>
      </main>
    );
  }

  function selectDashboardView(view: AppView): void {
    setActiveView(view);
    setIsNavigationMenuOpen(false);
    setIsSessionMenuOpen(false);
    if (view === "catalog" && !catalogResult && !catalogLoading) void runCatalogSearch(1);
  }

  const roleLabel = signedInRole === "admin" ? "Administrador" : signedInRole === "analyst" ? "Analista" : "Visualizador";

  return (
    <div className="dashboard-page">
      {toast && <UiToast tone={toast.tone} title={toast.title} message={toast.message} isClosing={toast.isClosing} onDismiss={dismissToast} />}
      <a className="skip-link" href="#main-content">Pular para o conteúdo principal</a>
      <header className="top-navigation">
        <div className="top-navigation__inner">
          <button type="button" className="top-navigation__brand" onClick={() => selectDashboardView("request")} aria-label="BlindSpot, ir para nova requisição">
            <img className="top-navigation__mark" src={logoBlindspot} alt="" />
            <span>BLINDSPOT</span>
          </button>
          <nav className="top-navigation__links" aria-label="Seções do produto">
            <button type="button" className={activeView === "request" ? "is-active" : ""} onClick={() => selectDashboardView("request")} aria-current={activeView === "request" ? "page" : undefined}>Nova ficha</button>
            <button type="button" className={activeView === "workspace" ? "is-active" : ""} onClick={() => selectDashboardView("workspace")} aria-current={activeView === "workspace" ? "page" : undefined}>Workspace</button>
            <button type="button" className={activeView === "catalog" ? "is-active" : ""} onClick={() => selectDashboardView("catalog")} aria-current={activeView === "catalog" ? "page" : undefined}>Catálogo</button>
            <button type="button" className={activeView === "history" ? "is-active" : ""} onClick={() => selectDashboardView("history")} aria-current={activeView === "history" ? "page" : undefined}>Histórico</button>
            {(signedInRole === "analyst" || signedInRole === "admin") ? <button type="button" className={activeView === "comparison" ? "is-active" : ""} onClick={() => selectDashboardView("comparison")} aria-current={activeView === "comparison" ? "page" : undefined}>Comparar</button> : null}
            {signedInRole === "admin" ? <button type="button" className={activeView === "team" ? "is-active" : ""} onClick={() => selectDashboardView("team")} aria-current={activeView === "team" ? "page" : undefined}>Equipe</button> : null}
            {signedInRole === "admin" ? <button type="button" className={activeView === "usage" ? "is-active" : ""} onClick={() => selectDashboardView("usage")} aria-current={activeView === "usage" ? "page" : undefined}>Consumo</button> : null}
          </nav>
          <div className="top-navigation__utilities">
            <button type="button" className="theme-toggle" onClick={() => setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))} title={themeMode === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} aria-label={themeMode === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}><ThemeIcon mode={themeMode} /></button>
            <button ref={navigationToggleRef} type="button" className="top-navigation__menu-toggle" onClick={() => { setIsNavigationMenuOpen((current) => !current); setIsSessionMenuOpen(false); }} aria-expanded={isNavigationMenuOpen} aria-controls="primary-navigation-menu">Menu</button>
            <button ref={sessionToggleRef} type="button" className="top-navigation__session-toggle" onClick={() => { setIsSessionMenuOpen((current) => !current); setIsNavigationMenuOpen(false); }} aria-expanded={isSessionMenuOpen} aria-controls="session-menu">Conta</button>
          </div>
        </div>
        {isNavigationMenuOpen ? <nav ref={navigationMenuRef} id="primary-navigation-menu" className="top-navigation__mobile-menu" aria-label="Seções do produto">
          <button type="button" className={activeView === "request" ? "is-active" : ""} onClick={() => selectDashboardView("request")}>Nova ficha</button><button type="button" className={activeView === "workspace" ? "is-active" : ""} onClick={() => selectDashboardView("workspace")}>Workspace</button><button type="button" className={activeView === "catalog" ? "is-active" : ""} onClick={() => selectDashboardView("catalog")}>Catálogo</button><button type="button" className={activeView === "history" ? "is-active" : ""} onClick={() => selectDashboardView("history")}>Histórico</button>{(signedInRole === "analyst" || signedInRole === "admin") ? <button type="button" className={activeView === "comparison" ? "is-active" : ""} onClick={() => selectDashboardView("comparison")}>Comparar</button> : null}{signedInRole === "admin" ? <button type="button" className={activeView === "team" ? "is-active" : ""} onClick={() => selectDashboardView("team")}>Equipe</button> : null}{signedInRole === "admin" ? <button type="button" className={activeView === "usage" ? "is-active" : ""} onClick={() => selectDashboardView("usage")}>Consumo</button> : null}
        </nav> : null}
        {isSessionMenuOpen ? <section ref={sessionMenuRef} id="session-menu" className="session-menu" aria-label="Sessão atual">
          <p className="session-menu__identity"><strong>{signedInName || "Usuário"}</strong><span>{roleLabel}</span></p>
          <button type="button" className="session-menu__logout" onClick={() => void handleLogout()} disabled={logoutState === "loading"} aria-busy={logoutState === "loading"}>{logoutState === "loading" ? "Encerrando sessão…" : "Sair"}</button>
          {logoutState === "error" ? <p className="session-menu__error" role="alert">Não foi possível encerrar a sessão. Tente novamente.</p> : null}
        </section> : null}
      </header>

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
        ) : activeView === "catalog" ? <CatalogWorkspace entry={catalogEntry} entryError={catalogError} isOpening={catalogLoading} related={catalogRelated} canCompare={signedInRole === "analyst" || signedInRole === "admin"} onOpen={(entry) => void openCatalogEntry(entry.id, entry.vehicle)} onBack={() => { setCatalogEntry(null); setCatalogRelated([]); setCatalogError(null); }} onCompare={addCatalogCandidateToComparison} onExport={(versionId, format) => void exportarFicha(versionId, format)} /> : activeView === "workspace" ? <VehicleWorkspace /> : activeView === "comparison" && (signedInRole === "analyst" || signedInRole === "admin") ? (
          <ComparisonPanel initialCandidate={comparisonSeed} onInitialCandidateConsumed={() => setComparisonSeed(null)} />
        ) : activeView === "team" && signedInRole === "admin" ? (
          <TeamPanel />
        ) : activeView === "usage" && signedInRole === "admin" ? (
          <UsagePanel />
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
    </div>
  );
}

function formatTechnicalSheetGenerationError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return error instanceof Error ? error.message : "Erro inesperado ao gerar ficha tecnica.";
  }
  if (!isObject(error.details) || error.details.code !== "schema_validation_failed" || !Array.isArray(error.details.schemaIssues)) {
    return error.message;
  }
  const issues = error.details.schemaIssues.slice(0, 5).flatMap((item) => {
    if (!isObject(item) || typeof item.path !== "string" || typeof item.keyword !== "string") return [];
    return [`${item.path} (${item.keyword})`];
  });
  return issues.length > 0
    ? `${error.message} Verifique: ${issues.join(", ")}.`
    : error.message;
}

function TeamPanel() { return <TeamWorkspace />;
  const [people, setPeople] = useState<{ members: OrganizationMember[]; invitations: OrganizationMemberInvitation[] } | null>(null);
  const [email, setEmail] = useState(""); const [role, setRole] = useState<OrganizationRole>("viewer"); const [error, setError] = useState<string | null>(null); const [link, setLink] = useState<string | null>(null);
  async function refresh() { try { setPeople(await obterEquipe()); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar a equipe."); } }
  useEffect(() => { void refresh(); }, []);
  async function invite(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(null); setLink(null); try { const result = await convidarMembro(email, role); setLink(`${window.location.origin}${result.activation_path}`); setEmail(""); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível criar o convite."); } }
  // @ts-ignore legacy panel retained temporarily while its extracted replacement is active.
  return <section className="panel"><h1>Equipe</h1><p>Convide pessoas, ajuste papéis e encerre acessos da sua organização.</p><form className="form-grid" onSubmit={invite}><label>E-mail corporativo<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Papel inicial<select value={role} onChange={(event) => setRole(event.target.value as OrganizationRole)}><option value="viewer">Visualizador</option><option value="analyst">Analista</option><option value="admin">Administrador</option></select></label><button className="primary-button" type="submit">Gerar convite</button></form>{link ? <div className="status-text" role="status"><strong>Copie agora o link de ativação:</strong><input readOnly value={link} aria-label="Link único de ativação" onFocus={(event) => event.currentTarget.select()} /></div> : null}{error ? <div className="error-box" role="alert">{error}</div> : null}<h2>Membros</h2>{people?.members.map((member) => <article key={member.id} className="history-item"><strong>{member.display_name}</strong><span>{member.email} · {member.state}</span><label>Papel<select value={member.role} disabled={member.state !== "active"} onChange={(event) => void alterarPapelMembro(member.id, event.target.value as OrganizationRole).then(refresh).catch((err: unknown) => setError(err instanceof Error ? err.message : "Não foi possível alterar o papel."))}><option value="viewer">Visualizador</option><option value="analyst">Analista</option><option value="admin">Administrador</option></select></label><button type="button" disabled={member.state !== "active"} onClick={() => void desativarMembro(member.id).then(refresh).catch((err: unknown) => setError(err instanceof Error ? err.message : "Não foi possível desativar o membro."))}>Desativar</button></article>) ?? <p className="status-text">Carregando equipe…</p>}<h2>Convites</h2>{people?.invitations.length ? people.invitations.map((invitation) => <article key={invitation.id} className="history-item"><strong>{invitation.email}</strong><span>{invitation.role} · {invitation.state}</span>{invitation.state === "issued" ? <button type="button" onClick={() => void revogarConviteMembro(invitation.id).then(refresh).catch((err: unknown) => setError(err instanceof Error ? err.message : "Não foi possível revogar o convite."))}>Revogar convite</button> : null}</article>) : <p className="status-text">Nenhum convite pendente.</p>}</section>;
}

function UsagePanel() { return <UsageWorkspace />;
  const currentPeriod = new Date().toISOString().slice(0, 7); const [period, setPeriod] = useState(currentPeriod); const [summary, setSummary] = useState<UsageSummary | null>(null); const [settings, setSettings] = useState<UsageAlertSettings | null>(null); const [threshold, setThreshold] = useState("1"); const [isActive, setIsActive] = useState(false); const [error, setError] = useState<string | null>(null);
  async function load() { try { setError(null); const [nextSummary, nextSettings] = await Promise.all([obterConsumo(period), obterAlertasConsumo()]); setSummary(nextSummary); setSettings(nextSettings); if (nextSettings.policy) { setThreshold(String(nextSettings.policy.threshold_units)); setIsActive(nextSettings.policy.is_active); } } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível consultar o consumo."); } }
  async function savePolicy(event: FormEvent<HTMLFormElement>) { event.preventDefault(); try { await salvarPoliticaConsumo(Number(threshold), isActive); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar a política."); } }
  useEffect(() => { void load(); }, []);
  // @ts-ignore legacy panel retained temporarily while its extracted replacement is active.
  return <section className="panel"><h1>Consumo</h1><p>Visão técnica mensal da sua organização. Não representa preço, cobrança ou limite.</p><form className="form-grid" onSubmit={(event) => { event.preventDefault(); void load(); }}><label>Período<input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} required /></label><button className="primary-button" type="submit">Consultar</button></form>{error ? <div className="error-box" role="alert">{error}</div> : null}{summary ? <><p className="status-text">{summary.definition}</p><div className="history-list"><article className="history-item"><strong>{summary.successful_units} unidade(s)</strong><span>Fichas técnicas persistidas com sucesso</span></article><article className="history-item"><strong>{summary.failed_attempts} falha(s)</strong><span>Tentativas que não geraram unidades</span></article></div><h2>Alertas internos</h2><form className="form-grid" onSubmit={savePolicy}><label>Limiar mensal<input type="number" min={1} value={threshold} onChange={(event) => setThreshold(event.target.value)} required /></label><label className="checkbox-label"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /> Ativar alerta interno</label><button className="primary-button" type="submit">Salvar política</button></form><p className="status-text">Sem e-mail ou cobrança. A política atual {settings?.policy?.is_active ? `está ativa no limiar de ${settings.policy.threshold_units} unidade(s).` : "está desativada."}</p>{settings?.alerts.length ? settings.alerts.map((alert) => <article key={alert.id} className="history-item"><strong>Limiar atingido em {alert.period}</strong><span>{alert.total_units} unidade(s) quando o limiar era {alert.threshold_units}</span>{alert.acknowledged_at ? <span>Reconhecido</span> : <button type="button" onClick={() => void reconhecerAlertaConsumo(alert.id).then(load).catch((err: unknown) => setError(err instanceof Error ? err.message : "Não foi possível reconhecer o alerta."))}>Reconhecer alerta</button>}</article>) : <p className="status-text">Nenhum alerta interno no momento.</p>}<h2>Detalhamento do período {summary.period}</h2>{summary.breakdown.length ? summary.breakdown.map((item) => <article key={`${item.action}-${item.outcome}`} className="history-item"><strong>{item.action === "technical_sheet_persisted" ? "Ficha persistida" : "Persistência não concluída"}</strong><span>{item.events} evento(s) · {item.units} unidade(s) · {item.outcome === "succeeded" ? "sucesso" : "falha"}</span></article>) : <p className="status-text">Não há eventos de consumo neste período.</p>}</> : <p className="status-text">Carregando consumo…</p>}</section>;
}

function MemberInvitationActivation({ token }: { token: string }) {
  const [displayName, setDisplayName] = useState(""); const [password, setPassword] = useState(""); const [state, setState] = useState<"form" | "loading" | "done">("form"); const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setState("loading"); setError(null); try { await ativarConviteMembro(token, displayName, password); setState("done"); } catch (err) { setError(err instanceof Error ? err.message : "Convite indisponível."); setState("form"); } }
  return <main className="dashboard-page login-page"><section className="panel login-panel"><img className="brand-logo" src={logoBlindspot} alt="BlindSpot" />{state === "done" ? <><h1>Conta ativada</h1><p>Seu acesso foi criado. Entre com seu e-mail e senha.</p><a className="primary-button" href="/">Ir para o login</a></> : <><h1>Ativar convite</h1><p>Defina seus dados de acesso para entrar na organização.</p><form className="form-grid" onSubmit={submit}><label>Nome<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={120} required /></label><label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required /></label>{error ? <p role="alert">{error}</p> : null}<button className="primary-button" disabled={state === "loading"}>{state === "loading" ? "Ativando…" : "Ativar acesso"}</button></form></>}</section></main>;
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
  return <TechnicalFichaWorkspace ficha={ficha} title={title} contextLabel={showTraceability ? "Ficha aberta pelo catálogo com rastreabilidade disponível." : "Leitura técnica da configuração selecionada."} />;
}

function LegacyFichaDashboard({
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
    const map = new Map<string, {
      titulo: string;
      url: string;
      tipo: string;
      avaliacao_politica: FichaTecnicaResponse["fontes_utilizadas"][number]["avaliacao_politica"];
      avaliacao_aderencia: FichaTecnicaResponse["fontes_utilizadas"][number]["avaliacao_aderencia"];
    }>();
    ficha.fontes_utilizadas.forEach((fonte) => {
      map.set(fonte.id, {
        titulo: fonte.titulo,
        url: fonte.url,
        tipo: fonte.tipo,
        avaliacao_politica: fonte.avaliacao_politica,
        avaliacao_aderencia: fonte.avaliacao_aderencia
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
    ficha.resumo_completude.total_pesquisaveis ?? ficha.resumo_completude.total_variaveis
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
                label="Cobertura pesquisada"
                value={`${String(ficha.resumo_completude.preenchidas ?? "-")} / ${String(ficha.resumo_completude.total_pesquisaveis ?? ficha.resumo_completude.total_variaveis ?? "-")}`}
              />
              <MetricCard label="Informados no pedido" value={String(ficha.resumo_completude.informadas_na_entrada ?? "-")} />
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
              <p className="source-review-notice">
                Fonte externa nao e automaticamente incorreta, e fonte oficial nao garante aderencia ao ano ou versao. Revise as duas sinalizacoes e o titulo observado durante a geracao.
              </p>
              {ficha.fontes_utilizadas.length === 0 ? (
                <p className="source-review-notice">
                  Nenhuma fonte com aderencia suficiente permaneceu nesta ficha. Dados sem evidencia valida foram marcados como nao encontrados.
                </p>
              ) : (
                <div className="source-grid">
                  {ficha.fontes_utilizadas.map((fonte) => (
                  <article key={fonte.id} className="source-card">
                    <strong>{fonte.id}</strong>
                    <span>{fonte.titulo}</span>
                    <span>{fonte.tipo}</span>
                    <span className={`source-assessment source-assessment-${fonte.avaliacao_politica?.status ?? "historical"}`}>
                      Politica: {formatSourceAssessment(fonte.avaliacao_politica?.status)}
                    </span>
                    <span className={`source-assessment source-adherence-${fonte.avaliacao_aderencia?.status ?? "historical"}`}>
                      Aderencia: {formatSourceAdherence(fonte.avaliacao_aderencia?.status)}
                    </span>
                    {fonte.avaliacao_politica?.motivos?.map((motivo, motivoIndex) => (
                      <span key={`${motivo}-${motivoIndex}`} className="source-assessment-reason">{formatSourceAssessmentReason(motivo)}</span>
                    ))}
                    {fonte.avaliacao_aderencia?.motivos.map((motivo, motivoIndex) => (
                      <span key={`${motivo}-${motivoIndex}`} className="source-assessment-reason">{formatSourceAdherenceReason(motivo)}</span>
                    ))}
                    {fonte.evidencia_busca?.observada ? (
                      <div className="source-observed-evidence">
                        <span>Titulo observado: {fonte.evidencia_busca.titulo_observado}</span>
                        <span>Observada em: {formatObservedAt(fonte.evidencia_busca.observada_em)}</span>
                        <span>Paginas dinamicas podem mudar depois da geracao.</span>
                      </div>
                    ) : (
                      <span className="source-link-unavailable">Sem evidencia observada suficiente nesta execucao</span>
                    )}
                    {isSafeHttpsUrl(fonte.url) ? (
                      <a href={fonte.url} target="_blank" rel="noreferrer">
                        Abrir fonte
                      </a>
                    ) : (
                      <span className="source-link-unavailable">Link indisponivel por seguranca</span>
                    )}
                  </article>
                  ))}
                </div>
              )}
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
                        <div className="spec-row" key={`${section.key}-${row.key}`}>
                          <span className="spec-label">{row.label}</span>
                          <span className="spec-value">{row.value}</span>
                          <div className="spec-meta">
                            <span className={`status-pill status-${row.status}`}>{formatStatusLabel(row.status)}</span>
                            {showTraceability && row.fonteRefs.length > 0 ? (
                              <div className="fonte-tags">
                                {row.fonteRefs.map((fonteId, fonteIndex) => {
                                  const fonte = fontesMap.get(fonteId);
                                  const title = fonte ? `${fonte.titulo} (${fonte.tipo}) - aderencia ${formatSourceAdherence(fonte.avaliacao_aderencia?.status)}` : "Fonte sem cadastro";
                                  return (
                                    <span key={`${row.key}-${fonteId}-${fonteIndex}`} className="fonte-chip" title={title}>
                                      {fonteId}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : null}
                            {showTraceability && row.comments.length > 0 ? (
                              <div className="row-comments">
                                {row.comments.map((comment, commentIndex) => (
                                  <span key={`${row.key}-${commentIndex}`} className="comment-chip">
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
        key,
        label: formatLabel(key),
        value: formatCampoValue(value),
        status: value.status ?? "confirmado",
        fonteRefs: Array.isArray(value.fonte_ref) ? value.fonte_ref : [],
        comments: extractCampoComments(value)
      });
      continue;
    }

    if (Array.isArray(value)) {
      for (const [itemIndex, item] of value.entries()) {
        if (!isObject(item) || typeof item.nome !== "string") {
          continue;
        }

        const detalhe = isCampoStatus(item.detalhe) ? item.detalhe : null;
        rows.push({
          key: `${key}-${itemIndex}`,
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

function formatSourceAssessment(status: string | undefined): string {
  const labels: Record<string, string> = {
    na_lista_aprovada: "Na lista aprovada",
    fora_da_lista_aprovada: "Fora da lista aprovada",
    nao_rastreavel_com_seguranca: "Nao rastreavel com seguranca",
    sem_politica_para_mercado: "Sem politica local para este mercado",
    fonte_simulada_local: "Fonte simulada local"
  };
  return status ? (labels[status] ?? "Avaliacao indisponivel") : "Sem avaliacao historica";
}

function formatSourceAssessmentReason(reason: string): string {
  const labels: Record<string, string> = {
    host_oficial_nao_listado_para_marca_mercado: "Host oficial nao listado para marca e mercado",
    host_parceiro_nao_listado: "Host parceiro nao listado",
    tipo_declarado_nao_classificado: "Tipo declarado nao classificado",
    mercado_sem_politica_local: "Mercado ainda sem politica local",
    url_nao_https_ou_invalida: "URL nao permite link seguro"
  };
  return labels[reason] ?? "Motivo de classificacao indisponivel";
}

function formatSourceAdherence(status: string | undefined): string {
  const labels: Record<string, string> = {
    exata: "Exata",
    compativel: "Compativel",
    ambigua: "Ambigua",
    divergente: "Divergente",
    nao_verificada: "Nao verificada"
  };
  return status ? (labels[status] ?? "Indisponivel") : "Sem avaliacao historica";
}

function formatSourceAdherenceReason(reason: string): string {
  if (reason.startsWith("ano_modelo_divergente:")) return `Ano-modelo divergente: ${reason.split(":")[1]}`;
  const labels: Record<string, string> = {
    url_nao_observada_no_provider: "URL nao observada pelo provider",
    url_nao_https_ou_insegura: "URL observada sem transporte HTTPS seguro",
    marca_ou_modelo_nao_comprovado: "Marca ou modelo nao comprovado",
    versao_ou_motorizacao_nao_comprovada: "Versao ou motorizacao nao comprovada",
    ano_modelo_nao_comprovado: "Ano-modelo nao comprovado",
    mercado_divergente: "Mercado divergente",
    mercado_nao_comprovado: "Mercado nao comprovado"
  };
  return labels[reason] ?? reason;
}

function formatObservedAt(value: string | undefined): string {
  if (!value) return "instante indisponivel";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
}

function isSafeHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function formatLabel(value: string): string {
  const base = value.replace(/_/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function formatStatusLabel(status: string): string {
  if (status === "informado_na_entrada") {
    return "Informado no pedido";
  }

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
