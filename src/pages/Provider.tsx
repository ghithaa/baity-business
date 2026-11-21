import { useParams } from "wouter";
import { MapPin, Star, UserX } from "lucide-react";
import { useGetBizProvider } from "@/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCities } from "@/hooks/use-biz-me";
import { ListingCard } from "@/components/ListingCard";
import { EmptyState, Loading, Rating, Section } from "@/components/common";
import { WEEKDAYS, cityName, dateTime, minutesToClock } from "@/lib/format";

export default function ProviderPage() {
  const { id } = useParams<{ id: string }>();
  const { lang, tr } = useLanguage();
  const cities = useCities();
  const q = useGetBizProvider(Number(id));

  if (q.isLoading) return <Loading />;
  if (!q.data) return <EmptyState icon={UserX} title={tr("مقدّم الخدمة غير موجود", "Provider not found")} />;
  const p = q.data;

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6 md:p-10 text-white relative overflow-hidden bg-brand"
      >
        <div className="absolute inset-0 pattern-lattice pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--gold))] text-[hsl(var(--gold-foreground))] text-2xl font-bold flex items-center justify-center ring-4 ring-white/15 shrink-0">
            {p.displayName.trim().charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold truncate">{p.displayName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-white/75">
              <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{p.cities.map((c) => cityName(cities, c, lang)).join("، ")}</span>
              {p.ratingCount > 0 && (
                <span className="inline-flex items-center gap-1 font-bold text-white">
                  <Star className="w-4 h-4 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                  {p.ratingAvg?.toFixed(1)} ({p.ratingCount})
                </span>
              )}
            </div>
          </div>
        </div>
        {p.bio && <p className="relative mt-4 text-sm text-white/85 leading-7 whitespace-pre-line">{p.bio}</p>}
        {!p.acceptingOrders && (
          <p className="relative mt-4 text-xs font-bold bg-white/10 rounded-xl px-3 py-2 inline-block">{tr("لا يستقبل طلبات حاليًا", "Not taking orders right now")}</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">{tr("العروض", "Offers")}</h2>
        {p.listings.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {p.listings.map((l) => <ListingCard key={l.id} item={l} />)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{tr("لا توجد عروض حاليًا.", "No offers right now.")}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title={tr("أوقات العمل", "Working hours")}>
          {p.availability.length ? (
            <ul className="space-y-1.5 text-sm">
              {p.availability.map((w, i) => (
                <li key={i} className="flex justify-between">
                  <span className="font-bold">{WEEKDAYS[w.weekday][lang]}</span>
                  <span className="tabular-nums text-muted-foreground" dir="ltr">{minutesToClock(w.startMinute)} – {minutesToClock(w.endMinute)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{tr("لم تُحدَّد بعد.", "Not set yet.")}</p>
          )}
        </Section>

        <Section title={tr("التقييمات", "Reviews")} action={<Rating avg={p.ratingAvg} count={p.ratingCount} />}>
          {p.reviews.length ? (
            <ul className="space-y-3">
              {p.reviews.map((r, i) => (
                <li key={i} className="rounded-lg bg-muted/60 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">{r.buyerName}</span>
                    <span className="inline-flex items-center gap-0.5 font-bold" dir="ltr">
                      {r.rating}<Star className="w-3 h-3 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                    </span>
                  </div>
                  {r.comment && <p className="text-sm mt-1.5">{r.comment}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{dateTime(r.createdAt, lang)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{tr("لا توجد تقييمات بعد.", "No reviews yet.")}</p>
          )}
        </Section>
      </div>
    </div>
  );
}
