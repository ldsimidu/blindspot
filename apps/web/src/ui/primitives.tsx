import { cloneElement, forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactElement, type ReactNode, type TextareaHTMLAttributes, useId } from "react";
import { createPortal } from "react-dom";

type Tone = "primary" | "secondary" | "danger";
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon";
type StatusTone = "confirmed" | "entry" | "partial" | "conflict" | "not-found" | "not-applicable" | "inferred";
type ToastTone = "success" | "error";

function classNames(...values: Array<string | undefined | false>): string {
  return values.filter(Boolean).join(" ");
}

export interface UiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Compatibility prop for existing consumers. Prefer `variant` in new UI. */
  tone?: Tone;
  variant?: ButtonVariant;
  size?: ButtonSize;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
}

export const UiButton = forwardRef<HTMLButtonElement, UiButtonProps>(function UiButton({
  children,
  className,
  disabled,
  endIcon,
  isLoading = false,
  loadingLabel = "Carregando…",
  size = "md",
  startIcon,
  tone,
  type = "button",
  variant,
  ...props
}, ref) {
  const resolvedVariant = variant ?? (tone === "danger" ? "danger" : tone === "secondary" ? "outline" : "primary");
  const legacyTone = tone ?? (resolvedVariant === "danger" ? "danger" : resolvedVariant === "outline" ? "secondary" : "primary");

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={classNames("ui-button", `ui-button--${legacyTone}`, `ui-button--variant-${resolvedVariant}`, `ui-button--size-${size}`, isLoading && "ui-button--loading", className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      <span className="ui-button__content" aria-hidden={isLoading || undefined}>
        {startIcon ? <span className="ui-button__icon" aria-hidden="true">{startIcon}</span> : null}
        <span className="ui-button__label">{children}</span>
        {endIcon ? <span className="ui-button__icon" aria-hidden="true">{endIcon}</span> : null}
      </span>
      {isLoading ? <span className="ui-button__loading-label"><span className="ui-button__spinner" aria-hidden="true" />{loadingLabel}</span> : null}
    </button>
  );
});

export interface UiTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  resize?: "none" | "vertical" | "both";
}

export const UiTextarea = forwardRef<HTMLTextAreaElement, UiTextareaProps>(function UiTextarea({ className, resize = "vertical", ...props }, ref) {
  return <textarea {...props} ref={ref} className={classNames("ui-textarea", `ui-textarea--resize-${resize}`, className)} />;
});

export interface UiCardProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "section" | "div";
  raised?: boolean;
}

export function UiCard({ as: Component = "section", className, raised = false, ...props }: UiCardProps) {
  return <Component {...props} className={classNames("ui-card", raised && "ui-card--raised", className)} />;
}

export interface UiFieldProps {
  label: string;
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
  hint?: string;
  error?: string;
  id?: string;
}

export function UiField({ label, children, hint, error, id }: UiFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined;
  const control = cloneElement(children, { id: controlId, "aria-describedby": descriptionId, "aria-invalid": error ? true : undefined });

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

export interface UiToastProps {
  tone: ToastTone;
  title: string;
  message?: string;
  isClosing?: boolean;
  onDismiss: () => void;
}

export function UiToast({ isClosing = false, message, onDismiss, title, tone }: UiToastProps) {
  const toast = (
    <aside className="ui-toast-region" aria-label="Notificações">
      <div className={classNames("ui-toast", `ui-toast--${tone}`, isClosing && "ui-toast--closing")} role={tone === "error" ? "alert" : "status"} aria-live={tone === "error" ? "assertive" : "polite"}>
        <div>
          <strong>{title}</strong>
          {message ? <p>{message}</p> : null}
        </div>
        <button type="button" className="ui-toast__dismiss" onClick={onDismiss} aria-label="Fechar notificação">×</button>
      </div>
    </aside>
  );

  return typeof document === "undefined" ? toast : createPortal(toast, document.body);
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
