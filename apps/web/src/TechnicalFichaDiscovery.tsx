import { FormEvent, useState } from "react";
import { buscarCatalogoTecnico } from "./api";
import type { CatalogCandidate, TechnicalCatalogSearchFilters } from "./types";

const bodyTypes = ["sedan", "hatch", "suv", "crossover", "cupe", "picape", "caminhonete", "van", "minivan", "utilitario", "conversivel", "wagon", "monovolume", "outro"];
const motorTypes = ["combustao", "eletrico", "hibrido", "hibrido_plugin", "celula_combustivel"];

export function TechnicalFichaDiscovery({ onSelect }: { onSelect: (candidate: CatalogCandidate) => void }) {
  const [filters, setFilters] = useState<TechnicalCatalogSearchFilters>({});
  const [entries, setEntries] = useState<CatalogCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(null);
    try {
      const result = await buscarCatalogoTecnico(filters);
      setEntries(result.entries); setTotal(result.total);
    } catch (err) {
      setEntries([]); setTotal(0); setError(err instanceof Error ? err.message : "Não foi possível pesquisar pelas facetas técnicas.");
    } finally { setLoading(false); }
  }

  return <section className="panel history-panel">
    <h2>Pesquisa por características técnicas</h2>
    <p>Retorna somente fichas cuja versão atual confirmou a característica com fonte rastreável. Campos sem confirmação não entram como correspondência.</p>
    <form className="form-grid" onSubmit={submit}>
      <label>Carroceria<select value={filters.tipo_carroceria ?? ""} onChange={(event) => setFilters((current) => ({ ...current, tipo_carroceria: event.target.value || undefined }))}><option value="">Qualquer</option>{bodyTypes.map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}</select></label>
      <label>Propulsão<select value={filters.motor_tipo ?? ""} onChange={(event) => setFilters((current) => ({ ...current, motor_tipo: event.target.value || undefined }))}><option value="">Qualquer</option>{motorTypes.map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}</select></label>
      <label>Potência mínima (cv)<input inputMode="decimal" value={filters.potencia_min_cv ?? ""} onChange={(event) => setFilters((current) => ({ ...current, potencia_min_cv: event.target.value || undefined }))} /></label>
      <label>Potência máxima (cv)<input inputMode="decimal" value={filters.potencia_max_cv ?? ""} onChange={(event) => setFilters((current) => ({ ...current, potencia_max_cv: event.target.value || undefined }))} /></label>
      <label>Ano-modelo<input inputMode="numeric" maxLength={4} value={filters.ano_modelo ?? ""} onChange={(event) => setFilters((current) => ({ ...current, ano_modelo: event.target.value || undefined }))} /></label>
      <label>Mercado<input maxLength={100} value={filters.mercado ?? ""} onChange={(event) => setFilters((current) => ({ ...current, mercado: event.target.value || undefined }))} /></label>
      <button className="primary-button" type="submit" disabled={loading}>{loading ? "Pesquisando..." : "Pesquisar características"}</button>
    </form>
    {error ? <div className="error-box" role="alert">{error}</div> : null}
    {entries.length ? <><p className="status-text">{total} ficha(s) com correspondência técnica confirmada.</p><div className="history-list">{entries.map((entry) => <button key={entry.id} type="button" className="history-item" onClick={() => onSelect(entry)}><strong>{entry.vehicle.marca} {entry.vehicle.modelo} {entry.vehicle.versao}</strong><span>Ano {entry.vehicle.ano_modelo} · {entry.vehicle.mercado} · versão {entry.latestVersion ?? "-"}</span><span>Abrir ficha exata</span></button>)}</div></> : null}
  </section>;
}
