import { Link } from "wouter";
import { CalendarClock, MapPin, Package, Truck } from "lucide-react";
import type { BizListingCard } from "@/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCities } from "@/hooks/use-biz-me";
import { UNIT_LABELS, cityName } from "@/lib/format";
import { Money, Rating } from "./common";

export function ListingCard({ item }: { item: BizListingCard }) {
  const { lang, tr } = useLanguage();
  const cities = useCities();
  const Icon = item.kind === "service" ? CalendarClock : Package;

  return (
    <Link
      href={`/listings/${item.id}`}
      className="group flex flex-col rounded-xl bg-card border border-card-border hover:border-primary/20 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      <div className="h-32 relative bg-brand overflow-hidden">
        <div className="absolute inset-0 pattern-lattice" />
        <Icon className="absolute bottom-3 end-4 w-14 h-14 text-white/10" strokeWidth={1.25} />
        <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white/15 text-white backdrop-blur-sm">
            {lang === "ar" ? item.categoryNameAr : item.categoryNameEn}
          </span>
          {!item.acceptingOrders && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white text-rose-600">
              {tr("غير متاح حاليًا", "Unavailable")}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-5 gap-3">
        <div>
          <h3 className="font-bold text-[15px] text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 truncate">{item.providerName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Rating avg={item.ratingAvg} count={item.ratingCount} />
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {cityName(cities, item.providerCity, lang)}
          </span>
          {(item.kind === "service" || item.allowsDelivery) && (
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <Truck className="w-3.5 h-3.5" />
              {item.kind === "service" ? tr("في منزلك", "At your home") : tr("يوصّل", "Delivers")}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-border flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted-foreground">{tr("السعر", "Price")}</span>
          <span>
            <Money halalas={item.buyerPriceHalalas} className="text-lg font-extrabold text-primary" />
            <span className="text-xs text-muted-foreground ms-1">{UNIT_LABELS[item.priceUnit][lang]}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
