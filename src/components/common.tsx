import type { ReactNode } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { Loader2, Star, type LucideIcon } from "lucide-react";
import type { BizOrderStatus } from "@/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { STATUS_LABELS, money } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6 mb-8 border-b border-border">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-[32px] font-extrabold text-foreground tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-[15px] text-muted-foreground mt-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }: { icon: LucideIcon; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6 rounded-xl border border-border bg-card">
      <div className="w-14 h-14 rounded-full bg-accent text-primary flex items-center justify-center mb-5 ring-8 ring-accent/40">
        <Icon className="w-6 h-6" />
      </div>
      <p className="font-bold text-lg text-foreground">{title}</p>
      {hint && <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-6">{hint}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-16 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}

export function StatusBadge({ status }: { status: BizOrderStatus }) {
  const { lang } = useLanguage();
  const s = STATUS_LABELS[status];
  return <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold", s.tone)}>{s[lang]}</span>;
}

export function Money({ halalas, className }: { halalas: number; className?: string }) {
  const { lang } = useLanguage();
  return <span className={cn("tabular-nums", className)}>{money(halalas, lang)}</span>;
}

export function Rating({ avg, count }: { avg: number | null | undefined; count: number }) {
  const { tr } = useLanguage();
  if (!count) return <span className="text-xs text-muted-foreground">{tr("جديد", "New")}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
      <Star className="w-3.5 h-3.5 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
      {avg?.toFixed(1)}
      <span className="text-muted-foreground font-medium">({count})</span>
    </span>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n}`} className="p-0.5">
          <Star
            className={cn(
              "w-8 h-8 transition-colors",
              n <= value ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

/** Sends a signed-out visitor to sign in, then back here. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  if (isLoading) return <Loading />;
  if (!user) return <Redirect to={`/login?next=${encodeURIComponent(location)}`} />;
  return <>{children}</>;
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-xl bg-card border border-card-border shadow-card p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
        <h2 className="font-bold text-[17px] text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-primary font-bold hover:underline underline-offset-4">
      {children}
    </Link>
  );
}
