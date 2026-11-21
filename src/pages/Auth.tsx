import { useState, type FormEvent } from "react";
import { Link, Redirect, useLocation, useSearch } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { AuthError, useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Only same-site paths, so a crafted ?next= can't send someone elsewhere. */
function safeNext(search: string): string {
  const next = new URLSearchParams(search).get("next") ?? "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { tr } = useLanguage();
  const points = [
    tr("حساب واحد لبيتي وبيتي بزنس", "One account for Baity and Baity Business"),
    tr("مقدّمو خدمة موثّقون في مدينتك", "Verified providers in your city"),
    tr("الدفع عند الاستلام والإلغاء مجاني", "Pay on delivery, cancel for free"),
  ];
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-[1fr_1.1fr] rounded-2xl overflow-hidden bg-card border border-card-border shadow-card-lg">
        <div className="hidden md:flex flex-col justify-between relative overflow-hidden bg-brand text-white p-10">
          <div className="absolute inset-0 pattern-lattice pointer-events-none" />
          <div className="relative">
            <p className="eyebrow mb-3">{tr("بيتي بزنس", "Baity Business")}</p>
            <p className="text-2xl font-extrabold leading-snug">{tr("كل ما يحتاجه بيتك، من أيادٍ تثقين بها", "Everything your home needs, from hands you trust")}</p>
          </div>
          <ul className="relative space-y-3 text-sm text-white/80">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--gold))] shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 sm:p-10">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1.5 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function useAuthErrorText() {
  const { tr } = useLanguage();
  return (err: unknown) => {
    if (!(err instanceof AuthError)) return tr("حدث خطأ، حاولي مرة أخرى.", "Something went wrong — try again.");
    switch (err.code) {
      case "invalid":
        return tr("البريد أو كلمة المرور غير صحيحة.", "Wrong e-mail or password.");
      case "exists":
        return tr("هذا البريد مسجّل مسبقًا — سجّلي الدخول.", "That e-mail is already registered — sign in.");
      case "staff":
        return tr("حسابات العاملات والسائقين لا تستخدم بيتي بزنس.", "Worker and driver accounts can't use Baity Business.");
      case "validation":
        return tr("تحقّقي من البيانات: كلمة المرور 8 أحرف على الأقل.", "Check the details: the password needs at least 8 characters.");
      default:
        return tr("تعذّر الاتصال، تحقّقي من الإنترنت.", "Couldn't connect — check your internet.");
    }
  };
}

export function LoginPage() {
  const { user, login } = useAuth();
  const { tr } = useLanguage();
  const search = useSearch();
  const [, navigate] = useLocation();
  const errorText = useAuthErrorText();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = safeNext(search);

  if (user) return <Redirect to={next} />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate(next);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title={tr("تسجيل الدخول", "Sign in")} subtitle={tr("استخدمي حساب بيتي نفسه", "Use your Baity account")}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{tr("البريد الإلكتروني", "E-mail")}</Label>
          <Input id="email" type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{tr("كلمة المرور", "Password")}</Label>
          <Input id="password" type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive font-semibold">{error}</p>}
        <Button type="submit" className="w-full font-bold" size="lg" disabled={busy}>
          {tr("دخول", "Sign in")}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          {tr("ليس لديك حساب؟", "No account yet?")}{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-primary font-bold">
            {tr("أنشئي حسابًا", "Create one")}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const { lang, tr } = useLanguage();
  const search = useSearch();
  const [, navigate] = useLocation();
  const errorText = useAuthErrorText();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = safeNext(search);

  if (user) return <Redirect to={next} />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ name, email, password, language: lang });
      navigate(next);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title={tr("إنشاء حساب", "Create account")} subtitle={tr("حساب واحد لبيتي وبيتي بزنس", "One account for Baity and Baity Business")}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{tr("الاسم", "Name")}</Label>
          <Input id="name" autoComplete="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{tr("البريد الإلكتروني", "E-mail")}</Label>
          <Input id="email" type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{tr("كلمة المرور (8 أحرف على الأقل)", "Password (8+ characters)")}</Label>
          <Input id="password" type="password" dir="ltr" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive font-semibold">{error}</p>}
        <Button type="submit" className="w-full font-bold" size="lg" disabled={busy}>
          {tr("إنشاء الحساب", "Create account")}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          {tr("لديك حساب؟", "Have an account?")}{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-primary font-bold">
            {tr("سجّلي الدخول", "Sign in")}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
