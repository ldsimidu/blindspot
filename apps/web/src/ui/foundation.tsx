import type { HTMLAttributes, ReactNode } from "react";

type MetricTone = "confirmed" | "partial" | "conflict" | "unavailable";
type PriorityTone = "confirmed" | "partial" | "conflict" | "neutral";

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface AppFrameProps extends HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

/** Visual boundary only. Session, theme selection and navigation remain consumer-owned. */
export function AppFrame({ children, className, compact = false, ...props }: AppFrameProps) {
  return <div {...props} className={classNames("app-frame", compact && "app-frame--compact", className)}>{children}</div>;
}

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ actions, className, description, title, ...props }: PageHeaderProps) {
  return (
    <header {...props} className={classNames("app-page-header", className)}>
      <div className="app-page-header__copy">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="app-page-header__actions">{actions}</div> : null}
    </header>
  );
}

export interface ModuleGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: "auto" | 4 | 8 | 12;
}

/** Grid only: consumers own ordering and data. */
export function ModuleGrid({ children, className, columns = "auto", ...props }: ModuleGridProps) {
  return <div {...props} className={classNames("app-module-grid", `app-module-grid--${columns}`, className)}>{children}</div>;
}

export interface MetricTileProps extends HTMLAttributes<HTMLElement> {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: MetricTone;
}

/** Renders a supplied factual value; it deliberately performs no calculation. */
export function MetricTile({ className, detail, label, tone = "unavailable", value, ...props }: MetricTileProps) {
  return (
    <section {...props} className={classNames("app-metric-tile", `app-metric-tile--${tone}`, className)}>
      <p className="app-metric-tile__label">{label}</p>
      <strong className="app-metric-tile__value">{value}</strong>
      {detail ? <p className="app-metric-tile__detail">{detail}</p> : null}
    </section>
  );
}

export interface PriorityItem {
  id: string;
  title: string;
  description?: string;
  tone?: PriorityTone;
  action?: ReactNode;
}

export interface PriorityListProps extends HTMLAttributes<HTMLElement> {
  title: string;
  items: PriorityItem[];
  emptyMessage?: string;
}

/** Lists supplied priorities without assigning urgency or eligibility. */
export function PriorityList({ className, emptyMessage = "Nenhuma prioridade disponível.", items, title, ...props }: PriorityListProps) {
  return (
    <section {...props} className={classNames("app-priority-list", className)}>
      <h2>{title}</h2>
      {items.length === 0 ? <p className="app-priority-list__empty">{emptyMessage}</p> : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className={`app-priority-list__item app-priority-list__item--${item.tone ?? "neutral"}`}>
              <span aria-hidden="true" className="app-priority-list__indicator" />
              <div><strong>{item.title}</strong>{item.description ? <p>{item.description}</p> : null}</div>
              {item.action ? <div className="app-priority-list__action">{item.action}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export interface DataPanelProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Groups correlated dense data. It never transforms or hides its children. */
export function DataPanel({ action, children, className, description, title, ...props }: DataPanelProps) {
  return (
    <section {...props} className={classNames("app-data-panel", className)}>
      <header className="app-data-panel__header">
        <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
        {action ? <div className="app-data-panel__action">{action}</div> : null}
      </header>
      <div className="app-data-panel__content">{children}</div>
    </section>
  );
}
