import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Search,
  ClipboardList,
  Store,
  ShieldCheck,
  LogIn,
  LogOut,
  Languages,
  Menu,
  X,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBizMe } from "@/hooks/use-biz-me";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Website frame: a sticky top bar with the main navigation, a slide-in drawer
// on phones, and a brand-coloured footer. The home page renders full width;
// every other page sits in the standard page container.

type NavItem = { href: string; label: string; icon: LucideIcon; match?: (path: string) => boolean };

function useNav(): NavItem[] {
  const { tr } = useLanguage();
  const { user } = useAuth();
  const { provider, isAdmin } = useBizMe();

  const items: NavItem[] = [
    { href: "/", label: tr("الرئيسية", "Home"), icon: Home, match: (p) => p === "/" },
    {
      href: "/search",
      label: tr("تصفّح الخدمات", "Browse"),
      icon: Search,
      match: (p) => p.startsWith("/search") || p.startsWith("/listings") || p.startsWith("/providers"),
    },
  ];
  if (user) {
    items.push({ href: "/orders", label: tr("طلباتي", "My orders"), icon: ClipboardList, match: (p) => p.startsWith("/orders") });
  }
  items.push({
    href: provider ? "/provider" : "/provider/apply",
    label: provider ? tr("لوحة مقدّم الخدمة", "Provider panel") : tr("قدّمي خدماتك", "Sell your services"),
    icon: Store,
    match: (p) => p.startsWith("/provider/") || p === "/provider",
  });
  if (isAdmin) {
    items.push({ href: "/admin", label: tr("الإدارة", "Admin"), icon: ShieldCheck, match: (p) => p.startsWith("/admin") });
  }
  return items;
}

function isActive(item: NavItem, path: string) {
  return item.match ? item.match(path) : path === item.href;
}

function Brand({ inverted = false }: { inverted?: boolean }) {
  const { tr } = useLanguage();
  return (
    <Link href="/" className="flex items-center gap-2.5 min-w-0 shrink-0">
      <span className={cn("w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white p-0.5 ring-1", inverted ? "ring-white/20" : "ring-border")}>
        <img src="/logo.jpg" alt="" className="w-full h-full object-contain rounded-md" />
      </span>
      <span className="min-w-0 leading-none">
        <span className={cn("block font-extrabold text-[17px] tracking-tight", inverted ? "text-white" : "text-primary")}>
          {tr("بيتي بزنس", "Baity Business")}
        </span>
        <span className={cn("block text-[11px] mt-1 truncate", inverted ? "text-white/60" : "text-muted-foreground")}>
          {tr("كل خدمات البيت في مكان واحد", "Every home service in one place")}
        </span>
      </span>
    </Link>
  );
}

function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <button
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        className,
      )}
    >
      <Languages className="w-4 h-4" />
      {lang === "ar" ? "English" : "العربية"}
    </button>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const [path, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { tr } = useLanguage();
  const nav = useNav();

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container-page h-[68px] flex items-center gap-6">
        <Brand />

        <nav className="hidden lg:flex items-center gap-1 mx-auto">
          {nav.map((item) => {
            const active = isActive(item, path);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/70",
                )}
              >
                {item.label}
                {active && <span className="absolute inset-x-3.5 -bottom-[15px] h-0.5 rounded-full bg-[hsl(var(--gold))]" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <LangToggle />
          <span className="w-px h-6 bg-border" />
          {user ? (
            <>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground max-w-[160px]">
                <span className="w-8 h-8 rounded-full bg-accent text-primary flex items-center justify-center shrink-0">
                  <UserRound className="w-4 h-4" />
                </span>
                <span className="truncate">{user.name}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <LogOut />
                {tr("خروج", "Sign out")}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="font-semibold">
                <Link href="/login">{tr("تسجيل الدخول", "Sign in")}</Link>
              </Button>
              <Button asChild size="sm" className="font-semibold px-4">
                <Link href="/register">{tr("إنشاء حساب", "Create account")}</Link>
              </Button>
            </>
          )}
        </div>

        <button
          onClick={onMenu}
          className="lg:hidden ms-auto w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted"
          aria-label={tr("القائمة", "Menu")}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

function Drawer({ onClose }: { onClose: () => void }) {
  const [path, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { tr, isRTL } = useLanguage();
  const nav = useNav();

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/40 animate-in fade-in" onClick={onClose} aria-label={tr("إغلاق", "Close")} />
      <div
        className={cn(
          "absolute top-0 bottom-0 w-80 max-w-[85vw] bg-background flex flex-col shadow-card-lg animate-in duration-200",
          isRTL ? "right-0 slide-in-from-right" : "left-0 slide-in-from-left",
        )}
      >
        <div className="h-[68px] px-4 flex items-center justify-between border-b border-border">
          <Brand />
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted" aria-label={tr("إغلاق", "Close")}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {user && (
          <div className="px-4 py-3 border-b border-border flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-accent text-primary flex items-center justify-center shrink-0">
              <UserRound className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold truncate">{user.name}</span>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = isActive(item, path);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                  active ? "bg-accent text-primary" : "text-foreground/80 hover:bg-muted",
                )}
              >
                <item.icon className={cn("w-[18px] h-[18px]", active ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <LangToggle className="w-full justify-start" />
          {user ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                logout();
                onClose();
                navigate("/");
              }}
            >
              <LogOut />
              {tr("تسجيل الخروج", "Sign out")}
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline">
                <Link href="/login" onClick={onClose}>
                  <LogIn />
                  {tr("دخول", "Sign in")}
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register" onClick={onClose}>{tr("حساب جديد", "Sign up")}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const { tr } = useLanguage();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: tr("للعملاء", "For customers"),
      links: [
        { href: "/search", label: tr("تصفّح الخدمات", "Browse services") },
        { href: "/search?kind=service", label: tr("خدمات في المنزل", "Home services") },
        { href: "/search?kind=product", label: tr("منتجات منزلية", "Home-made products") },
        { href: "/orders", label: tr("طلباتي", "My orders") },
      ],
    },
    {
      title: tr("لمقدّمي الخدمات", "For providers"),
      links: [
        { href: "/provider/apply", label: tr("انضمّي كمقدّمة خدمة", "Become a provider") },
        { href: "/provider", label: tr("لوحة مقدّم الخدمة", "Provider panel") },
      ],
    },
    {
      title: tr("الحساب", "Account"),
      links: [
        { href: "/login", label: tr("تسجيل الدخول", "Sign in") },
        { href: "/register", label: tr("إنشاء حساب", "Create account") },
      ],
    },
  ];

  return (
    <footer className="bg-brand text-white">
      <div className="container-page py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4 max-w-xs sm:col-span-2 md:col-span-1">
          <Brand inverted />
          <p className="text-sm text-white/65 leading-7">
            {tr(
              "منصّة تجمع البيوت بمقدّمي خدمات وحِرف منزلية موثّقين في مدن المملكة.",
              "A marketplace connecting households with verified home-service and craft providers across Saudi cities.",
            )}
          </p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-bold text-[hsl(var(--gold))] mb-4">{c.title}</p>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <p>© {year} {tr("بيتي بزنس. جميع الحقوق محفوظة.", "Baity Business. All rights reserved.")}</p>
          <p>{tr("الدفع عند الاستلام · مقدّمو خدمة موثّقون", "Cash on delivery · Verified providers")}</p>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [path] = useLocation();
  const [drawer, setDrawer] = useState(false);
  const fullBleed = path === "/";

  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [path]);
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar onMenu={() => setDrawer(true)} />
      <main className="flex-1">
        {fullBleed ? children : <div className="container-page py-8 md:py-12">{children}</div>}
      </main>
      <Footer />
      {drawer && <Drawer onClose={() => setDrawer(false)} />}
    </div>
  );
}
