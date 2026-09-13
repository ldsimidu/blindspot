import { type ReactNode, useMemo, useState } from "react";
import { obterExplicacaoVariavel } from "./api";
import type { FieldExplanation, FichaTecnicaResponse, FonteUtilizada } from "./types";
import { UiButton, UiCard, UiEmptyState, UiErrorState, UiLoadingState, UiStatus } from "./ui/primitives";
import "./technical-ficha-workspace.css";

type WorkspaceTab = "summary" | "specifications" | "sources" | "history" | "research" | "conflicts";
type StatusTone = "confirmed" | "entry" | "partial" | "conflict" | "not-found" | "not-applicable" | "inferred";

interface CampoStatus {
  valor?: unknown;
  status?: string;
  fonte_ref?: string[];
  obs_ref?: string;
  observacoes?: string;
}

interface TechnicalField {
  path: string;
  label: string;
  value: string;
  status: string;
  sourceRefs: string[];
  notes: string[];
}

interface TechnicalSection {
  key: string;
  title: string;
  fields: TechnicalField[];
}

export interface TechnicalFichaWorkspaceProps {
  ficha: FichaTecnicaResponse | null;
  title?: string;
  contextLabel?: string;
  isLoading?: boolean;
  error?: string | null;
  actions?: ReactNode;
  historyContent?: ReactNode;
  researchContent?: ReactNode;
  conflictContent?: ReactNode;
  technicalSheetVersionId?: string;
}

const tabLabels: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "summary", label: "Resumo" },
  { id: "specifications", label: "Especificações" },
  { id: "sources", label: "Fontes" },
  { id: "history", label: "Histórico" },
  { id: "research", label: "Pesquisa" },
  { id: "conflicts", label: "Conflitos" }
];

const summaryCandidates = [
  { label: "Motorização", paths: ["motorizacao.tipo_motor", "motorizacao.motor_tipo"] },
  { label: "Potência", paths: ["motorizacao.potencia_cv"] },
  { label: "Torque", paths: ["motorizacao.torque_kgfm", "motorizacao.torque_nm"] },
  { label: "Transmissão", paths: ["transmissao_tracao.transmissao", "motorizacao.transmissao"] },
  { label: "Combustível", paths: ["motorizacao.combustivel", "motorizacao.tipo_combustivel"] }
];

export function TechnicalFichaWorkspace({
  actions,
  conflictContent,
  contextLabel,
  error,
  ficha,
  historyContent,
  isLoading = false,
  researchContent,
  technicalSheetVersionId,
  title = "Ficha técnica"
}: TechnicalFichaWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("summary");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const sections = useMemo(() => ficha ? buildSections(ficha.ficha_tecnica) : [], [ficha]);
  const sourcesById = useMemo(() => new Map((ficha?.fontes_utilizadas ?? []).map((source) => [source.id, source])), [ficha]);
  const summaryFields = useMemo(() => ficha ? buildSummaryFields(ficha.ficha_tecnica) : [], [ficha]);

  if (isLoading) {
    return <UiLoadingState title="Carregando ficha" message="Organizando identidade, atributos e evidências disponíveis." className="technical-workspace__state" />;
  }

  if (error) {
    return <UiEmptyState title="Não foi possível abrir esta ficha" message={error} className="technical-workspace__state technical-workspace__state--error" />;
  }

  if (!ficha) {
    return <UiEmptyState title="Nenhuma ficha selecionada" message="Abra uma configuração exata pelo catálogo, histórico ou nova requisição para iniciar a leitura." className="technical-workspace__state" />;
  }

  const vehicle = ficha.veiculo_alvo;
  const completeness = formatCompleteness(ficha.resumo_completude);
  const conflictCount = numericValue(ficha.resumo_completude.conflitantes);

  return (
    <section className="technical-workspace" aria-labelledby="technical-workspace-title">
      {contextLabel ? <p className="technical-workspace__context">{contextLabel}</p> : null}

      <header className="technical-workspace__hero">
        <div className="technical-workspace__identity">
          <p className="technical-workspace__title-label">{title}</p>
          <h1 id="technical-workspace-title">{vehicle.marca} {vehicle.modelo}</h1>
          <p className="technical-workspace__version">{vehicle.versao}</p>
          <dl className="technical-workspace__identity-meta">
            <div><dt>Ano-modelo</dt><dd>{vehicle.ano_modelo}</dd></div>
            <div><dt>Mercado</dt><dd>{vehicle.mercado}</dd></div>
          </dl>
        </div>

        <UiCard className="technical-workspace__quality" aria-label="Qualidade desta ficha">
          <div className="technical-workspace__quality-heading">
            <h2>Qualidade da ficha</h2>
            <UiStatus tone={conflictCount > 0 ? "conflict" : "confirmed"} label={conflictCount > 0 ? `${conflictCount} conflito${conflictCount === 1 ? "" : "s"}` : "Sem conflitos registrados"} />
          </div>
          <dl className="technical-workspace__quality-grid">
            <div><dt>Completude</dt><dd>{completeness}</dd></div>
            <div><dt>Fontes</dt><dd>{ficha.fontes_utilizadas.length}</dd></div>
            <div><dt>Campos sem dado</dt><dd>{numericValue(ficha.resumo_completude.nao_encontradas)}</dd></div>
          </dl>
          <p>Os status e as fontes acompanham cada atributo durante a leitura.</p>
        </UiCard>
      </header>

      {actions ? <div className="technical-workspace__actions" aria-label="Ações desta ficha">{actions}</div> : null}

      <div className="technical-workspace__tabs" role="tablist" aria-label="Contextos da ficha técnica">
        {tabLabels.map((tab) => {
          const selected = activeTab === tab.id;
          return <button key={tab.id} type="button" role="tab" id={`technical-tab-${tab.id}`} aria-selected={selected} aria-controls={`technical-panel-${tab.id}`} className={selected ? "is-active" : undefined} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>;
        })}
      </div>

      <div id={`technical-panel-${activeTab}`} role="tabpanel" aria-labelledby={`technical-tab-${activeTab}`} className="technical-workspace__panel">
        {activeTab === "summary" ? <SummaryPanel fields={summaryFields} /> : null}
        {activeTab === "specifications" ? <SpecificationsPanel sections={sections} openSections={openSections} onToggle={(key) => setOpenSections((current) => ({ ...current, [key]: !current[key] }))} sourcesById={sourcesById} technicalSheetVersionId={technicalSheetVersionId} /> : null}
        {activeTab === "sources" ? <SourcesPanel sources={ficha.fontes_utilizadas} /> : null}
        {activeTab === "history" ? historyContent ?? <UnavailablePanel title="Histórico indisponível neste contexto" message="A leitura preserva a ficha atual. O histórico será exibido quando a origem da abertura fornecer versões autorizadas." /> : null}
        {activeTab === "research" ? researchContent ?? <UnavailablePanel title="Impacto de pesquisa indisponível neste contexto" message="Selecione uma ficha e uma sessão autorizada no workspace do veículo para ler o impacto factual da pesquisa." /> : null}
        {activeTab === "conflicts" ? conflictContent ?? <UnavailablePanel title="Conflitos detalhados indisponíveis neste contexto" message="Os atributos conflitantes continuam identificados pelo status. A explicação detalhada depende dos dados já autorizados pela origem da ficha." /> : null}
      </div>
    </section>
  );
}

function SummaryPanel({ fields }: { fields: TechnicalField[] }) {
  if (fields.length === 0) return <UnavailablePanel title="Resumo técnico ainda indisponível" message="Esta ficha não contém atributos âncora reconhecíveis. Consulte as especificações para ler os dados disponíveis." />;
  return <section className="technical-summary" aria-label="Resumo técnico">
    {fields.map((field) => <article key={field.path} className="technical-summary__item"><p>{field.label}</p><strong>{field.value}</strong><UiStatus tone={statusTone(field.status)} label={statusLabel(field.status)} /></article>)}
  </section>;
}

function SpecificationsPanel({ onToggle, openSections, sections, sourcesById, technicalSheetVersionId }: { onToggle: (key: string) => void; openSections: Record<string, boolean>; sections: TechnicalSection[]; sourcesById: Map<string, FonteUtilizada>; technicalSheetVersionId?: string }) {
  if (sections.length === 0) return <UnavailablePanel title="Nenhuma especificação disponível" message="Não há atributos técnicos estruturados para esta ficha." />;
  return <div className="technical-specifications">
    {sections.map((section) => {
      const expanded = openSections[section.key] ?? section.key === sections[0]?.key;
      return <section key={section.key} className="technical-specifications__section">
        <button type="button" className="technical-specifications__trigger" aria-expanded={expanded} aria-controls={`technical-section-${section.key}`} onClick={() => onToggle(section.key)}><span>{section.title}</span><span aria-hidden="true">{expanded ? "−" : "+"}</span></button>
        {expanded ? <div id={`technical-section-${section.key}`} className="technical-specifications__rows">{section.fields.map((field) => <TechnicalFieldRow key={field.path} field={field} sourcesById={sourcesById} technicalSheetVersionId={technicalSheetVersionId} />)}</div> : null}
      </section>;
    })}
  </div>;
}

function TechnicalFieldRow({ field, sourcesById, technicalSheetVersionId }: { field: TechnicalField; sourcesById: Map<string, FonteUtilizada>; technicalSheetVersionId?: string }) {
  const sources = field.sourceRefs.map((sourceId) => sourcesById.get(sourceId)).filter((source): source is FonteUtilizada => Boolean(source));
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState<{ loading: boolean; data: FieldExplanation | null; error: string | null }>({ loading: false, data: null, error: null });

  async function toggleExplanation() {
    const next = !showExplanation;
    setShowExplanation(next);
    if (!next || !technicalSheetVersionId || explanation.data || explanation.loading) return;
    setExplanation({ loading: true, data: null, error: null });
    try { setExplanation({ loading: false, data: await obterExplicacaoVariavel(technicalSheetVersionId, field.path), error: null }); }
    catch { setExplanation({ loading: false, data: null, error: "A proveniência deste atributo não está disponível para sua conta." }); }
  }

  return <article className="technical-field-row">
    <div className="technical-field-row__identity"><h3>{field.label}</h3><p>{field.value}</p></div>
    <div className="technical-field-row__evidence"><UiStatus tone={statusTone(field.status)} label={statusLabel(field.status)} />{sources.length ? <ul aria-label={`Fontes de ${field.label}`}>{sources.map((source) => <li key={source.id}>{isSafeHttpsUrl(source.url) ? <a href={source.url} target="_blank" rel="noreferrer">{source.titulo}</a> : <span>{source.titulo}</span>}<small>{source.tipo}</small></li>)}</ul> : <p>Sem fonte vinculada ao atributo.</p>}{field.notes.length ? <p className="technical-field-row__note">{field.notes.join(" · ")}</p> : null}{technicalSheetVersionId ? <UiButton className="technical-field-row__explanation-trigger" tone="secondary" aria-expanded={showExplanation} aria-controls={`technical-field-explanation-${field.path.replaceAll(".", "-")}`} onClick={() => void toggleExplanation()}>{showExplanation ? "Ocultar proveniência" : "Ver proveniência"}</UiButton> : null}</div>
    {showExplanation ? <div id={`technical-field-explanation-${field.path.replaceAll(".", "-")}`} className="technical-field-row__explanation">{explanation.loading ? <UiLoadingState title="Carregando proveniência" message="Lendo apenas a explicação permitida deste atributo." /> : explanation.error ? <UiErrorState title="Proveniência indisponível" message={explanation.error} /> : explanation.data ? <FieldExplanationPanel explanation={explanation.data} /> : <UiEmptyState title="Proveniência indisponível" message="Nenhuma explicação foi devolvida para este atributo." />}</div> : null}
  </article>;
}

function FieldExplanationPanel({ explanation }: { explanation: FieldExplanation }) {
  return <section className="technical-field-explanation" aria-label={`Proveniência de ${explanation.field_path}`}><div><UiStatus tone={fieldStateTone(explanation.state)} label={fieldStateLabel(explanation.state)} /><p>Estado v{explanation.state_version}</p></div><dl><div><dt>Razões</dt><dd>{explanation.reason_codes.length ? explanation.reason_codes.map(humanize).join(" · ") : "Não informadas"}</dd></div><div><dt>Referências de evidência</dt><dd>{explanation.evidence_refs.length ? explanation.evidence_refs.join(" · ") : "Nenhuma referência vinculada"}</dd></div></dl><section><h4>Fontes permitidas</h4>{explanation.evidence.length ? <ul>{explanation.evidence.map((item) => <li key={`${item.source_ref}-${item.observed_at}`}><strong>{item.source_title}</strong><span>{item.source_type} · observada em {formatExplanationDate(item.observed_at)}</span></li>)}</ul> : <p>Nenhuma fonte permitida foi vinculada a este atributo.</p>}</section>{explanation.alternatives.length ? <section><h4>Alternativas preservadas</h4><ol>{explanation.alternatives.map((alternative) => <li key={alternative.ordinal}><strong>Alternativa {alternative.ordinal}</strong><span>{formatValue(alternative.value)}</span><small>{alternative.evidence_refs.length ? `Evidências: ${alternative.evidence_refs.join(" · ")}` : "Sem referência adicional"}</small></li>)}</ol></section> : explanation.state === "conflicting" ? <p>Este conflito foi preservado sem vencedor automático; alternativas detalhadas não estão disponíveis para esta revisão.</p> : null}</section>;
}

function SourcesPanel({ sources }: { sources: FonteUtilizada[] }) {
  if (sources.length === 0) return <UnavailablePanel title="Nenhuma fonte vinculada" message="A ficha não informou fontes utilizáveis neste contexto." />;
  return <section className="technical-sources" aria-label="Fontes utilizadas">{sources.map((source) => <article key={source.id}><div><h2>{isSafeHttpsUrl(source.url) ? <a href={source.url} target="_blank" rel="noreferrer">{source.titulo}</a> : source.titulo}</h2><p>{source.tipo}</p>{source.evidencia_busca?.observada ? <p className="technical-sources__observation">Título observado: {source.evidencia_busca.titulo_observado ?? "indisponível"}.</p> : <p className="technical-sources__observation">Sem evidência observada suficiente nesta execução.</p>}</div><div><UiStatus tone={sourceTone(source)} label={sourceLabel(source)} />{source.avaliacao_politica ? <p>Política: {source.avaliacao_politica.status.replaceAll("_", " ")}</p> : null}{source.avaliacao_aderencia ? <p>Aderência: {source.avaliacao_aderencia.status.replaceAll("_", " ")}</p> : null}{source.avaliacao_politica?.motivos?.length ? <p>{source.avaliacao_politica.motivos.join(" · ")}</p> : null}{source.avaliacao_aderencia?.motivos.length ? <p>{source.avaliacao_aderencia.motivos.join(" · ")}</p> : null}</div></article>)}</section>;
}

function UnavailablePanel({ message, title }: { title: string; message: string }) {
  return <UiEmptyState title={title} message={message} className="technical-workspace__empty" />;
}

function buildSummaryFields(root: Record<string, unknown>): TechnicalField[] {
  return summaryCandidates.flatMap((candidate) => {
    for (const path of candidate.paths) {
      const field = fieldAtPath(root, path);
      if (field) return [{ ...field, label: candidate.label, path }];
    }
    return [];
  });
}

function buildSections(root: Record<string, unknown>): TechnicalSection[] {
  return Object.entries(root).flatMap(([key, value]) => {
    if (!isRecord(value)) return [];
    const fields = flattenFields(value, key);
    return fields.length ? [{ key, title: humanize(key), fields }] : [];
  });
}

function flattenFields(value: Record<string, unknown>, prefix: string): TechnicalField[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = `${prefix}.${key}`;
    if (isCampoStatus(child)) return [toTechnicalField(path, key, child)];
    if (isRecord(child)) return flattenFields(child, path);
    return [];
  });
}

function fieldAtPath(root: Record<string, unknown>, path: string): TechnicalField | null {
  const value = path.split(".").reduce<unknown>((current, key) => isRecord(current) ? current[key] : undefined, root);
  return isCampoStatus(value) ? toTechnicalField(path, path.split(".").at(-1) ?? path, value) : null;
}

function toTechnicalField(path: string, key: string, field: CampoStatus): TechnicalField {
  return { path, label: humanize(key), value: formatValue(field.valor), status: field.status ?? "confirmado", sourceRefs: Array.isArray(field.fonte_ref) ? field.fonte_ref : [], notes: [field.obs_ref, field.observacoes].filter((note): note is string => typeof note === "string" && note.trim().length > 0) };
}

function formatCompleteness(summary: FichaTecnicaResponse["resumo_completude"]): string {
  const total = numericValue(summary.total_pesquisaveis ?? summary.total_variaveis);
  const filled = numericValue(summary.preenchidas);
  return total > 0 ? `${filled}/${total}` : "Indisponível";
}

function numericValue(value: unknown): number { return typeof value === "number" && Number.isFinite(value) ? value : 0; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isCampoStatus(value: unknown): value is CampoStatus { return isRecord(value) && ("status" in value || "valor" in value); }
function formatValue(value: unknown): string { if (value === null || value === undefined || value === "") return "Não informado"; if (Array.isArray(value)) return value.map(formatValue).join(", "); if (typeof value === "boolean") return value ? "Sim" : "Não"; return String(value); }
function humanize(value: string): string { const text = value.replaceAll("_", " "); return text.charAt(0).toUpperCase() + text.slice(1); }
function isSafeHttpsUrl(value: string): boolean { try { return new URL(value).protocol === "https:"; } catch { return false; } }
function statusTone(status: string): StatusTone { if (status === "conflitante") return "conflict"; if (status === "parcial") return "partial"; if (status === "nao_encontrado") return "not-found"; if (status === "nao_aplicavel") return "not-applicable"; if (status === "inferido_minimamente") return "inferred"; if (status === "informado_na_entrada") return "entry"; return "confirmed"; }
function statusLabel(status: string): string { const labels: Record<string, string> = { informado_na_entrada: "Informado no pedido", nao_aplicavel: "Não aplicável", nao_encontrado: "Não encontrado", inferido_minimamente: "Inferido", conflitante: "Conflitante", parcial: "Parcial", confirmado: "Confirmado" }; return labels[status] ?? humanize(status); }
function fieldStateTone(state: FieldExplanation["state"]): StatusTone { if (state === "conflicting") return "conflict"; if (state === "partial" || state === "pending" || state === "blocked" || state === "research_exhausted" || state === "unknown") return "partial"; if (state === "not_found") return "not-found"; if (state === "not_applicable") return "not-applicable"; if (state === "inferred" || state === "calculated") return "inferred"; if (state === "user_provided") return "entry"; return "confirmed"; }
function fieldStateLabel(state: FieldExplanation["state"]): string { return ({ confirmed: "Confirmado", partial: "Parcial", inferred: "Inferido", calculated: "Calculado", user_provided: "Informado pela pessoa usuária", unknown: "Sem confirmação", not_found: "Não encontrado", not_applicable: "Não aplicável", conflicting: "Conflitante", research_exhausted: "Pesquisa esgotada", pending: "Pesquisa pendente", blocked: "Pesquisa bloqueada" } as Record<FieldExplanation["state"], string>)[state]; }
function formatExplanationDate(value: string): string { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "data indisponível" : parsed.toLocaleDateString("pt-BR"); }
function sourceTone(source: FonteUtilizada): StatusTone { if (source.avaliacao_aderencia?.status === "divergente") return "conflict"; if (source.avaliacao_aderencia?.status === "ambigua") return "partial"; if (source.avaliacao_politica?.status === "fora_da_lista_aprovada") return "partial"; return "confirmed"; }
function sourceLabel(source: FonteUtilizada): string { if (source.avaliacao_aderencia?.status === "divergente") return "Aderência divergente"; if (source.avaliacao_aderencia?.status === "ambigua") return "Aderência ambígua"; if (source.avaliacao_politica?.status === "fora_da_lista_aprovada") return "Fora da lista aprovada"; if (source.avaliacao_politica?.status === "fonte_simulada_local") return "Fonte simulada local"; return "Fonte vinculada"; }
