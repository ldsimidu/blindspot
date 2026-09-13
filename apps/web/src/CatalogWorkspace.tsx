import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { buscarCatalogo, buscarCatalogoTecnico } from "./api";
import { TechnicalFichaWorkspace } from "./TechnicalFichaWorkspace";
import type { CatalogCandidate, CatalogEntryResult, TechnicalCatalogSearchFilters } from "./types";
import { UiButton, UiEmptyState, UiErrorState, UiLoadingState, UiStatus } from "./ui/primitives";
import "./catalog-workspace.css";

type DiscoveryMode = "identity" | "technical";

const bodyTypes = ["sedan", "hatch", "suv", "crossover", "cupe", "picape", "caminhonete", "van", "minivan", "utilitario", "conversivel", "wagon", "monovolume", "outro"];
const motorTypes = ["combustao", "eletrico", "hibrido", "hibrido_plugin", "celula_combustivel"];

export interface CatalogWorkspaceProps {
  entry: CatalogEntryResult | null;
  entryError: string | null;
  isOpening: boolean;
  related: CatalogCandidate[];
  canCompare: boolean;
  onOpen: (candidate: CatalogCandidate) => void;
  onBack: () => void;
  onCompare: (candidate: CatalogCandidate) => void;
  onExport: (versionId: string, format: "csv" | "json") => void;
}

export function CatalogWorkspace({ canCompare, entry, entryError, isOpening, onBack, onCompare, onExport, onOpen, related }: CatalogWorkspaceProps) {
  const [mode, setMode] = useState<DiscoveryMode>("identity");
  const [identity, setIdentity] = useState({ query: "", brand: "", model: "", modelYear: "", market: "" });
  const [technical, setTechnical] = useState<TechnicalCatalogSearchFilters>({});
  const [scope, setScope] = useState<"latest" | "all_versions">("latest");
  const [results, setResults] = useState<CatalogCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingResults, setLoadingResults] = useState(true);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [rail, setRail] = useState<CatalogCandidate[]>([]);
  const [loadingRail, setLoadingRail] = useState(true);
  const [railError, setRailError] = useState<string | null>(null);

  const activeIdentityFilters = useMemo(() => Object.entries(identity).filter(([, value]) => value.trim()).map(([key, value]) => ({ key, value })), [identity]);

  async function loadIdentity(nextPage = 1, nextScope = scope, nextIdentity = identity) {
    setLoadingResults(true); setResultsError(null);
    try {
      const hasCriteria = Object.values(nextIdentity).some((value) => value.trim());
      const response = await buscarCatalogo({ query: nextIdentity.query, brand: nextIdentity.brand, model: nextIdentity.model, modelYear: nextIdentity.modelYear, market: nextIdentity.market, page: nextPage, scope: nextScope, sort: hasCriteria ? "alphabetical" : "recent" });
      setResults(response.entries); setTotal(response.total); setPage(nextPage); setIsEmpty(response.state === "not_registered");
    } catch (error) { setResults([]); setTotal(0); setIsEmpty(false); setResultsError(error instanceof Error ? error.message : "Não foi possível consultar o catálogo."); }
    finally { setLoadingResults(false); }
  }

  async function loadTechnical() {
    setLoadingResults(true); setResultsError(null);
    try { const response = await buscarCatalogoTecnico(technical); setResults(response.entries); setTotal(response.total); setPage(1); setIsEmpty(response.state === "not_registered"); }
    catch (error) { setResults([]); setTotal(0); setIsEmpty(false); setResultsError(error instanceof Error ? error.message : "Não foi possível pesquisar pelas características técnicas."); }
    finally { setLoadingResults(false); }
  }

  async function loadRail() {
    setLoadingRail(true); setRailError(null);
    try { const response = await buscarCatalogo({ page: 1, scope: "latest", sort: "recent" }); setRail(response.entries.slice(0, 6)); }
    catch (error) { setRail([]); setRailError(error instanceof Error ? error.message : "Não foi possível carregar fichas recentes."); }
    finally { setLoadingRail(false); }
  }

  useEffect(() => { void loadIdentity(1); void loadRail(); }, []);

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (mode === "identity") void loadIdentity(1); else void loadTechnical(); }
  function selectMode(nextMode: DiscoveryMode) { setMode(nextMode); setResults([]); setTotal(0); setIsEmpty(false); setResultsError(null); if (nextMode === "identity") void loadIdentity(1); }
  function clearIdentity() { const cleared = { query: "", brand: "", model: "", modelYear: "", market: "" }; setIdentity(cleared); void loadIdentity(1, scope, cleared); }
  function showRecentResults() { setMode("identity"); setIdentity({ query: "", brand: "", model: "", modelYear: "", market: "" }); setScope("latest"); void loadIdentity(1, "latest", { query: "", brand: "", model: "", modelYear: "", market: "" }); }

  if (entry?.state === "found") {
    const candidate = entry.entry;
    const actions: ReactNode = <><UiButton tone="secondary" onClick={onBack}>Voltar ao catálogo</UiButton>{canCompare && candidate.latestTechnicalSheetVersionId ? <UiButton onClick={() => onCompare(candidate)}>Adicionar à comparação</UiButton> : null}{canCompare && candidate.latestTechnicalSheetVersionId ? <UiButton tone="secondary" onClick={() => onExport(candidate.latestTechnicalSheetVersionId!, "csv")}>Exportar CSV</UiButton> : null}{canCompare && candidate.latestTechnicalSheetVersionId ? <UiButton tone="secondary" onClick={() => onExport(candidate.latestTechnicalSheetVersionId!, "json")}>Exportar JSON</UiButton> : null}</>;
    return <section className="catalog-workspace catalog-workspace--detail"><TechnicalFichaWorkspace ficha={candidate.response} title={`Ficha catalogada · versão ${candidate.latestVersion ?? "indisponível"}`} contextLabel="Identidade confirmada pelo catálogo." actions={actions} />{related.length ? <section className="catalog-workspace__related"><h2>Fichas relacionadas</h2><p>Mesma marca, modelo, ano-modelo e mercado. Esta relação não confirma compatibilidade para comparar.</p><div>{related.map((item) => <CandidateCard key={item.id} candidate={item} onOpen={onOpen} compact />)}</div></section> : <p className="catalog-workspace__related-note">Não há outras fichas relacionadas para esta identidade.</p>}</section>;
  }

  return <section className="catalog-workspace" aria-labelledby="catalog-title">
    <header className="catalog-workspace__header"><div><h1 id="catalog-title">Catálogo de fichas</h1><p>Encontre uma configuração persistida e confirme a identidade exata antes de abrir a ficha.</p></div>{entry?.state === "incompatible" ? <UiErrorState title="Configuração incompatível" message="Nenhuma ficha foi aberta. Revise a candidata e tente novamente." /> : entry?.state === "not_registered" ? <UiEmptyState title="Ficha não cadastrada" message="Esta configuração ainda não possui uma ficha catalogada." /> : entryError ? <UiErrorState title="Não foi possível abrir a ficha" message={entryError} /> : null}</header>
    <div className="catalog-workspace__layout">
      <aside className="catalog-filters" aria-label="Filtros do catálogo"><h2>Encontrar fichas</h2><div className="catalog-filters__modes" role="tablist" aria-label="Modo de pesquisa"><button type="button" role="tab" aria-selected={mode === "identity"} onClick={() => selectMode("identity")}>Por identidade</button><button type="button" role="tab" aria-selected={mode === "technical"} onClick={() => selectMode("technical")}>Por características</button></div><form onSubmit={submit}>{mode === "identity" ? <IdentityFilters identity={identity} scope={scope} onChange={setIdentity} onScope={setScope} /> : <TechnicalFilters filters={technical} onChange={setTechnical} />}<div className="catalog-filters__actions"><UiButton type="submit" isLoading={loadingResults} loadingLabel="Consultando…">Aplicar filtros</UiButton>{mode === "identity" ? <UiButton tone="secondary" disabled={loadingResults} onClick={clearIdentity}>Limpar filtros</UiButton> : null}</div></form></aside>
      <section className="catalog-results" aria-live="polite"><div className="catalog-results__heading"><div><h2>{mode === "identity" ? activeIdentityFilters.length ? "Resultados filtrados" : "Fichas recentes" : "Correspondências técnicas"}</h2><p>{mode === "technical" ? "Apenas características confirmadas com fonte rastreável entram nesta busca." : "Abertura sempre confirma a configuração exata."}</p></div>{!loadingResults ? <span>{total} ficha{total === 1 ? "" : "s"}</span> : null}</div>{mode === "identity" && activeIdentityFilters.length ? <div className="catalog-results__active-filters" aria-label="Filtros ativos">{activeIdentityFilters.map(({ key, value }) => <span key={key}>{filterLabel(key)}: {value}</span>)}</div> : null}{loadingResults ? <UiLoadingState title="Consultando fichas" message="Buscando candidatas no catálogo." /> : resultsError ? <UiErrorState title="Catálogo indisponível" message={resultsError} action={<UiButton tone="secondary" onClick={() => mode === "identity" ? void loadIdentity(page) : void loadTechnical()}>Tentar novamente</UiButton>} /> : isEmpty ? <UiEmptyState title={mode === "technical" ? "Sem correspondência técnica" : "Nenhuma ficha encontrada"} message={mode === "technical" ? "Os filtros retornam somente características confirmadas. Ajuste os critérios ou procure por identidade." : "Não há ficha catalogada para estes critérios. Limpe os filtros ou solicite uma nova coleta."} /> : <><div className="catalog-results__grid">{results.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} onOpen={onOpen} />)}</div><Pagination page={page} total={total} disabled={loadingResults || mode === "technical"} onPrevious={() => void loadIdentity(page - 1)} onNext={() => void loadIdentity(page + 1)} /></>}</section>
      <aside className="catalog-rail" aria-label="Fichas recentes no catálogo"><div className="catalog-rail__heading"><h2>Fichas recentes</h2><button type="button" onClick={showRecentResults}>Ver todas</button></div><p>Versões atuais já persistidas no catálogo.</p>{loadingRail ? <p role="status">Carregando recentes…</p> : railError ? <UiErrorState title="Recentes indisponíveis" message={railError} action={<UiButton tone="secondary" onClick={() => void loadRail()}>Tentar novamente</UiButton>} /> : rail.length ? <div className="catalog-rail__list">{rail.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} onOpen={onOpen} compact />)}</div> : <UiEmptyState title="Sem fichas recentes" message="Quando uma ficha persistida existir, ela aparecerá aqui." />}</aside>
    </div>
    {isOpening ? <p className="catalog-workspace__opening" role="status">Confirmando a identidade da ficha…</p> : null}
  </section>;
}

function IdentityFilters({ identity, onChange, onScope, scope }: { identity: { query: string; brand: string; model: string; modelYear: string; market: string }; scope: "latest" | "all_versions"; onChange: (next: { query: string; brand: string; model: string; modelYear: string; market: string }) => void; onScope: (scope: "latest" | "all_versions") => void }) { const field = (key: keyof typeof identity, label: string, type = "text") => <label>{label}<input type={type} value={identity[key]} maxLength={key === "modelYear" ? 4 : 100} inputMode={key === "modelYear" ? "numeric" : undefined} onChange={(event) => onChange({ ...identity, [key]: event.target.value })} /></label>; return <><label>Marca, modelo ou versão<input value={identity.query} maxLength={100} onChange={(event) => onChange({ ...identity, query: event.target.value })} /></label>{field("brand", "Marca")}{field("model", "Modelo")}{field("modelYear", "Ano-modelo")}{field("market", "Mercado")}<fieldset><legend>Versões exibidas</legend><label><input type="radio" checked={scope === "latest"} onChange={() => onScope("latest")} /> Última por veículo</label><label><input type="radio" checked={scope === "all_versions"} onChange={() => onScope("all_versions")} /> Todas as versões</label></fieldset></>; }
function TechnicalFilters({ filters, onChange }: { filters: TechnicalCatalogSearchFilters; onChange: (filters: TechnicalCatalogSearchFilters) => void }) { return <><label>Carroceria<select value={filters.tipo_carroceria ?? ""} onChange={(event) => onChange({ ...filters, tipo_carroceria: event.target.value || undefined })}><option value="">Qualquer</option>{bodyTypes.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label><label>Propulsão<select value={filters.motor_tipo ?? ""} onChange={(event) => onChange({ ...filters, motor_tipo: event.target.value || undefined })}><option value="">Qualquer</option>{motorTypes.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label><label>Potência mínima (cv)<input inputMode="decimal" value={filters.potencia_min_cv ?? ""} onChange={(event) => onChange({ ...filters, potencia_min_cv: event.target.value || undefined })} /></label><label>Potência máxima (cv)<input inputMode="decimal" value={filters.potencia_max_cv ?? ""} onChange={(event) => onChange({ ...filters, potencia_max_cv: event.target.value || undefined })} /></label><label>Ano-modelo<input inputMode="numeric" maxLength={4} value={filters.ano_modelo ?? ""} onChange={(event) => onChange({ ...filters, ano_modelo: event.target.value || undefined })} /></label><label>Mercado<input maxLength={100} value={filters.mercado ?? ""} onChange={(event) => onChange({ ...filters, mercado: event.target.value || undefined })} /></label></>; }
function CandidateCard({ candidate, compact = false, onOpen }: { candidate: CatalogCandidate; compact?: boolean; onOpen: (candidate: CatalogCandidate) => void }) { const available = Boolean(candidate.latestTechnicalSheetVersionId); return <article className={`catalog-candidate ${compact ? "catalog-candidate--compact" : ""}`}><button type="button" disabled={!available} onClick={() => onOpen(candidate)}><strong>{candidate.vehicle.marca} {candidate.vehicle.modelo}</strong><span>{candidate.vehicle.versao}</span><span>{candidate.vehicle.ano_modelo} · {candidate.vehicle.mercado}</span><span>Versão técnica {candidate.latestVersion ?? "indisponível"}</span>{candidate.latestAt ? <small>Atualizada em {new Date(candidate.latestAt).toLocaleDateString("pt-BR")}</small> : null}</button>{available ? <UiStatus tone="confirmed" label="Abrir ficha exata" /> : <UiStatus tone="not-found" label="Sem versão técnica" />}</article>; }
function Pagination({ disabled, onNext, onPrevious, page, total }: { disabled: boolean; onNext: () => void; onPrevious: () => void; page: number; total: number }) { if (total <= 20) return null; return <nav className="catalog-pagination" aria-label="Paginação do catálogo"><UiButton tone="secondary" disabled={disabled || page <= 1} onClick={onPrevious}>Página anterior</UiButton><span>Página {page}</span><UiButton tone="secondary" disabled={disabled || page * 20 >= total} onClick={onNext}>Próxima página</UiButton></nav>; }
function filterLabel(key: string): string { return ({ query: "Busca", brand: "Marca", model: "Modelo", modelYear: "Ano-modelo", market: "Mercado" } as Record<string, string>)[key] ?? key; }
