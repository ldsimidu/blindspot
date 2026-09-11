import { cloneElement, type ButtonHTMLAttributes, type HTMLAttributes, type ReactElement, type ReactNode, useId } from "react";

type Tone = "primary" | "secondary" | "danger";
type StatusTone = "confirmed" | "entry" | "partial" | "conflict" | "not-found" | "not-applicable" | "inferred";

function classNames(...values: Array<string | undefined | false>): string {
  return values.filter(Boolean).join(" ");
}

export interface UiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  isLoading?: boolean;
  loadingLabel?: string;
}

export function UiButton({
  children,
  className,
  disabled,
  isLoading = false,
  loadingLabel = "Carregando…",
  tone = "primary",
  type = "button",
  ...props
}: UiButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={classNames("ui-button", `ui-button--${tone}`, className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? loadingLabel : children}
    </button>
  );
}

export interface UiCardProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "section" | "div";
  raised?: boolean;
}

export function UiCard({ as: Component = "section", className, raised = false, ...props }: UiCardProps) {
  return <Component {...props} className={classNames("ui-card", raised && "ui-card--raised", className)} />;
}

export interface UiFieldProps {
  label: string;
  children: ReactElement<{ id?: string; "aria-describedby"?: string }>;
  hint?: string;
  error?: string;
  id?: string;
}

export function UiField({ label, children, hint, error, id }: UiFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined;
  const control = cloneElement(children, { id: controlId, "aria-describedby": descriptionId });

  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={controlId}>{label}</label>
      {control}
      {hint && !error ? <p id={descriptionId} className="ui-field__hint">{hint}</p> : null}
      {error ? <p id={descriptionId} className="ui-field__error" role="alert">{error}</p> : null}
    </div>
  );
}

export interface UiStatusProps extends HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone;
  label: string;
}

export function UiStatus({ className, label, tone, ...props }: UiStatusProps) {
  return <span {...props} className={classNames("ui-status", `ui-status--${tone}`, className)}>{label}</span>;
}

interface UiStateProps extends HTMLAttributes<HTMLElement> {
  title: string;
  message: string;
  action?: ReactNode;
}

function UiState({ action, className, message, title, ...props }: UiStateProps) {
  return (
    <section {...props} className={classNames("ui-card", "ui-state", className)}>
      <h2 className="ui-state__title">{title}</h2>
      <p className="ui-state__message">{message}</p>
      {action}
    </section>
  );
}

export function UiLoadingState(props: UiStateProps) {
  return <UiState {...props} className={classNames("ui-state--loading", props.className)} role="status" aria-live="polite" />;
}

export function UiEmptyState(props: UiStateProps) {
  return <UiState {...props} className={props.className} />;
}

export function UiErrorState(props: UiStateProps) {
  return <UiState {...props} className={classNames("ui-state--error", props.className)} role="alert" />;
}
