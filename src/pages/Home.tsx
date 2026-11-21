import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  ShieldCheck,
  Wallet,
  CalendarCheck,
  Store,
  ArrowLeft,
  ArrowRight,
  ChefHat,
  Cake,
  Sparkles,
  Wrench,
  Scissors,
  Shirt,
  Flower2,
  Baby,
  Paintbrush,
  Package,
  CookingPot,
  Utensils,
  Palette,
  Lamp,
  PartyPopper,
  MapPin,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import { useSearchBizListings, type BizCategory } from "@/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories, useCities } from "@/hooks/use-biz-me";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListingCard } from "@/components/ListingCard";
import { EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ALL = "all";

/** Shown in the hero panel until the real categories load. */
const HERO_FALLBACK: { icon: LucideIcon; ar: string; en: string }[] = [
  { icon: ChefHat, ar: "طبخ منزلي", en: "Home cooking" },
  { icon: Cake, ar: "حلويات", en: "Sweets" },
  { icon: Sparkles, ar: "تنظيف", en: "Cleaning" },
  { icon: Wrench, ar: "صيانة", en: "Repairs" },
  { icon: Scissors, ar: "خياطة", en: "Sewing" },
  { icon: Shirt, ar: "غسيل وكي", en: "Laundry" },
];

/** Picks an icon from the category slug, so new categories still get a sensible one. */
const ICONS_BY_NAME: Record<string, LucideIcon> = {
  "chef-hat": ChefHat,
  cake: Cake,
  "cooking-pot": CookingPot,
  sparkles: Sparkles,
  utensils: Utensils,
  wrench: Wrench,
  scissors: Scissors,
  palette: Palette,
  lamp: Lamp,
  "party-popper": PartyPopper,
  shirt: Shirt,
  baby: Baby,
  flower: Flower2,
};

function categoryIcon(c: BizCategory): LucideIcon {
  if (c.icon && ICONS_BY_NAME[c.icon]) return ICONS_BY_NAME[c.icon];
  const s = c.slug.toLowerCase();
  const rules: [RegExp, LucideIcon][] = [
    [/cook|food|meal|kitchen|tabkh/, ChefHat],
    [/sweet|cake|dessert|bak/, Cake],
    [/clean/, Sparkles],
    [/repair|mainten|plumb|electric|fix/, Wrench],
    [/sew|tailor|khiyat/, Scissors],
    [/laundry|iron|cloth/, Shirt],
    [/flower|garden|plant/, Flower2],
    [/child|baby|kid|nanny/, Baby],
    [/paint|decor|craft|henna|beauty/, Paintbrush],
  ];
  return rules.find(([re]) => re.test(s))?.[1] ?? (c.kind === "product" ? Package : Store);
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default function Home() {
  const { lang, tr, isRTL } = useLanguage();
  const [, navigate] = useLocation();
  const [q, setQ] = useState("");
  const [city, setCity] = useState(ALL);
  const cities = useCities();
  const categories = useCategories();
  const latest = useSearchBizListings({ sort: "newest" });
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const trust = [
    { icon: ShieldCheck, label: tr("مقدّمو خدمة موثّقون", "Verified providers") },
    { icon: CalendarCheck, label: tr("مواعيد مرنة", "Flexible scheduling") },
    { icon: Wallet, label: tr("الدفع عند الاستلام", "Pay on delivery") },
  ];

  const steps = [
    {
      icon: Search,
      title: tr("ابحثي عن الخدمة", "Find a service"),
      text: tr("تصفّحي التصنيفات أو ابحثي بالاسم، وفلتري حسب مدينتك والسعر.", "Browse categories or search by name, then filter by city and price."),
    },
    {
      icon: CalendarCheck,
      title: tr("اطلبي أو احجزي موعدًا", "Order or book a time"),
      text: tr("اختاري الاستلام أو التوصيل، أو حدّدي اليوم والوقت المناسب للزيارة.", "Choose pickup or delivery, or pick a day and time for a home visit."),
    },
    {
      icon: Wallet,
      title: tr("ادفعي عند الاستلام", "Pay on delivery"),
      text: tr("ادفعي نقدًا عند الاستلام أو بعد انتهاء الزيارة، ثم قيّمي التجربة.", "Pay cash on delivery or after the visit, then rate your experience."),
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand text-white">
        <div className="absolute inset-0 pattern-lattice pointer-events-none" />
        <div className="absolute top-1/2 -translate-y-1/2 -end-32 w-[36rem] h-[36rem] rounded-full bg-[hsl(var(--gold)/0.08)] blur-3xl pointer-events-none" />

        <div className="relative container-page py-14 md:py-20 lg:py-24 grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Copy + search */}
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 mb-6">
              <span className="w-6 h-px bg-[hsl(var(--gold))]" />
              {tr("منصّة خدمات المنزل في السعودية", "Saudi Arabia's home-services marketplace")}
            </p>
            <h1 className="text-[2.25rem] sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.2] tracking-tight">
              {tr("خدمات بيتك،", "Your home services,")}
              <br />
              {tr("من مقدّمين ", "from providers ")}
              <span className="text-[hsl(var(--gold))]">{tr("تثقين بهم", "you can trust")}</span>
            </h1>
            <p className="text-white/70 mt-6 text-base md:text-lg leading-8 max-w-xl">
              {tr(
                "اطلبي الطبخ المنزلي والحلويات، أو احجزي التنظيف والصيانة والخياطة من مقدّمي خدمات موثّقين في مدينتك — والدفع عند الاستلام.",
                "Order home cooking and sweets, or book cleaning, repairs and sewing from verified providers in your city — and pay on delivery.",
              )}
            </p>

            <form
              className="mt-9 bg-white rounded-xl p-2 shadow-card-lg grid sm:grid-cols-[1fr_auto_auto] gap-2 max-w-2xl"
              onSubmit={(e) => {
                e.preventDefault();
                const p = new URLSearchParams();
                if (q.trim()) p.set("q", q.trim());
                if (city !== ALL) p.set("city", city);
                const s = p.toString();
                navigate(s ? `/search?${s}` : "/search");
              }}
            >
              <label className="flex items-center gap-3 px-3 min-w-0">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={tr("ما الخدمة التي تحتاجينها؟", "What service do you need?")}
                  className="w-full bg-transparent outline-none text-[15px] text-foreground placeholder:text-muted-foreground py-3"
                />
              </label>
              <div className="flex items-center gap-2 sm:border-s border-border sm:ps-2 border-t sm:border-t-0 pt-2 sm:pt-0">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 ms-3 sm:ms-1" />
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="border-0 shadow-none bg-transparent h-11 px-1 sm:w-36 text-foreground focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{tr("كل المدن", "All cities")}</SelectItem>
                    {cities?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{lang === "ar" ? c.nameAr : c.nameEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" variant="gold" size="lg" className="px-8 font-bold">
                {tr("ابحثي", "Search")}
              </Button>
            </form>

            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/75">
              {trust.map((t) => (
                <span key={t.label} className="inline-flex items-center gap-2">
                  <t.icon className="w-4 h-4 text-[hsl(var(--gold))]" />
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Services preview */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-sm p-6 pb-16 shadow-card-lg">
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold">{tr("ماذا تحتاجين اليوم؟", "What do you need today?")}</p>
                <Link href="/search" className="text-xs font-semibold text-[hsl(var(--gold))] hover:underline underline-offset-4">
                  {tr("كل الخدمات", "All services")}
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(categories?.length ? categories.slice(0, 6) : null)?.map((c) => {
                  const Icon = categoryIcon(c);
                  return (
                    <Link
                      key={c.id}
                      href={`/search?categoryId=${c.id}`}
                      className="group rounded-xl bg-white text-foreground p-4 flex flex-col items-center text-center gap-3 hover:-translate-y-0.5 transition-transform"
                    >
                      <span className="w-11 h-11 rounded-lg bg-accent text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="text-[13px] font-bold leading-tight line-clamp-1">{lang === "ar" ? c.nameAr : c.nameEn}</span>
                    </Link>
                  );
                }) ??
                  HERO_FALLBACK.map((f) => (
                    <div key={f.en} className="rounded-xl bg-white text-foreground p-4 flex flex-col items-center text-center gap-3">
                      <span className="w-11 h-11 rounded-lg bg-accent text-primary flex items-center justify-center">
                        <f.icon className="w-5 h-5" />
                      </span>
                      <span className="text-[13px] font-bold leading-tight">{lang === "ar" ? f.ar : f.en}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Floating assurance cards */}
            <div className="absolute -bottom-6 start-8 rounded-xl bg-white text-foreground shadow-card-lg px-4 py-3 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold">{tr("مقدّمون موثّقون", "Verified providers")}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{tr("بوثيقة عمل حر سارية", "With a valid freelance document")}</p>
              </div>
            </div>
            <div className="absolute -top-5 -end-4 rounded-xl bg-white text-foreground shadow-card-lg px-4 py-3 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-[hsl(var(--gold-muted))] text-[hsl(var(--gold))] flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold">{tr("الدفع عند الاستلام", "Pay on delivery")}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{tr("والإلغاء مجاني", "Free cancellation")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16 md:py-20">
        <SectionHeading
          eyebrow={tr("التصنيفات", "Categories")}
          title={tr("تصفّحي حسب الخدمة", "Browse by service")}
          action={
            <Link href="/search" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
              {tr("كل الخدمات", "All services")}
              <Arrow className="w-4 h-4" />
            </Link>
          }
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories
            ? categories.map((c) => {
                const Icon = categoryIcon(c);
                return (
                  <Link
                    key={c.id}
                    href={`/search?categoryId=${c.id}`}
                    className="group rounded-xl bg-card border border-card-border p-5 hover:border-primary/25 hover:shadow-card-md transition-all"
                  >
                    <span className="w-11 h-11 rounded-lg bg-accent text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-5 h-5" />
                    </span>
                    <p className="font-bold text-[15px] text-foreground">{lang === "ar" ? c.nameAr : c.nameEn}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.kind === "service" ? tr("خدمة منزلية", "Home service") : c.kind === "product" ? tr("منتجات", "Products") : tr("منتجات وخدمات", "Products & services")}
                    </p>
                  </Link>
                );
              })
            : Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-xl" />)}
        </div>
      </section>

      {/* Latest */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container-page py-16 md:py-20">
          <SectionHeading
            eyebrow={tr("جديد", "Fresh")}
            title={tr("أحدث العروض", "Newest offers")}
            action={
              <Button asChild variant="outline" size="sm" className="bg-card">
                <Link href="/search">
                  {tr("عرض الكل", "See all")}
                  <Arrow />
                </Link>
              </Button>
            }
          />
          {latest.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[300px] rounded-xl" />
              ))}
            </div>
          ) : latest.data?.items.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {latest.data.items.slice(0, 6).map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Store}
              title={tr("لا توجد عروض بعد", "No offers yet")}
              hint={tr("كوني أول من يقدّم خدماته على بيتي بزنس.", "Be the first to offer your services on Baity Business.")}
              action={
                <Button asChild>
                  <Link href="/provider/apply">{tr("قدّمي خدماتك", "Sell your services")}</Link>
                </Button>
              }
            />
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16 md:py-20">
        <SectionHeading eyebrow={tr("كيف تعمل المنصّة", "How it works")} title={tr("ثلاث خطوات بسيطة", "Three simple steps")} />
        <ol className="grid md:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-xl bg-card border border-card-border p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="w-12 h-12 rounded-lg bg-[hsl(var(--gold-muted))] text-[hsl(var(--gold))] flex items-center justify-center">
                  <s.icon className="w-5 h-5" />
                </span>
                <span className="text-4xl font-extrabold text-primary/10 tabular-nums">0{i + 1}</span>
              </div>
              <p className="font-bold text-lg text-foreground">{s.title}</p>
              <p className="text-sm text-muted-foreground mt-2 leading-7">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Provider call to action */}
      <section className="container-page pb-16 md:pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-brand text-white p-8 md:p-12">
          <div className="absolute inset-0 pattern-lattice pointer-events-none" />
          <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-8">
            <div className="max-w-xl">
              <p className="eyebrow mb-3">{tr("لمقدّمي الخدمات", "For providers")}</p>
              <h2 className="text-2xl md:text-3xl font-extrabold leading-snug">
                {tr("عندك موهبة أو حرفة منزلية؟ حوّليها إلى دخل.", "Have a home skill or craft? Turn it into income.")}
              </h2>
              <p className="text-white/70 mt-3 leading-7">
                {tr(
                  "سجّلي بوثيقة العمل الحر، حدّدي أوقاتك وأسعارك، وابدئي باستقبال الطلبات من مدينتك.",
                  "Sign up with your freelance document, set your hours and prices, and start taking orders in your city.",
                )}
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
                {[tr("حدّدي أسعارك بنفسك", "Set your own prices"), tr("تحكّم كامل بأوقاتك", "Full control of your hours"), tr("لوحة لإدارة طلباتك", "A panel to manage your orders")].map((t) => (
                  <li key={t} className="inline-flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[hsl(var(--gold))]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <Button asChild variant="gold" size="lg" className="rounded-lg px-8 font-bold">
              <Link href="/provider/apply">
                {tr("ابدئي الآن", "Start now")}
                <Arrow />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
