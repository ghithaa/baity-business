import { Link } from "wouter";
import { ClipboardList, Star } from "lucide-react";
import { useListMyBizOrders } from "@/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState, Loading, Money, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { FULFILLMENT_LABELS, dateTime } from "@/lib/format";

export default function OrdersPage() {
  const { lang, tr } = useLanguage();
  const orders = useListMyBizOrders(undefined, { query: { refetchInterval: 20_000 } });

  return (
    <div>
      <PageHeader title={tr("طلباتي", "My orders")} subtitle={tr("كل طلباتك وحجوزاتك في مكان واحد", "All your orders and bookings")} />
      {orders.isLoading ? (
        <Loading />
      ) : orders.data?.length ? (
        <div className="space-y-3">
          {orders.data.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card border border-card-border shadow-card p-4 md:p-5 hover:border-primary/30 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold truncate">{o.title}</p>
                  <StatusBadge status={o.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {o.providerName} · {FULFILLMENT_LABELS[o.fulfillment][lang]} ·{" "}
                  {o.scheduledStart ? dateTime(o.scheduledStart, lang) : dateTime(o.createdAt, lang)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {o.status === "completed" && !o.reviewed && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--gold))]">
                    <Star className="w-3.5 h-3.5" />
                    {tr("قيّمي الطلب", "Rate it")}
                  </span>
                )}
                <Money halalas={o.totalHalalas} className="font-bold text-primary" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={tr("لا توجد طلبات بعد", "No orders yet")}
          hint={tr("اطلبي أو احجزي من مقدّمي الخدمات في مدينتك.", "Order or book from providers in your city.")}
          action={<Button asChild><Link href="/search">{tr("تصفّح الخدمات", "Browse")}</Link></Button>}
        />
      )}
    </div>
  );
}
