import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { CalendarClock, Clock, MapPin, Package, Store, Truck } from "lucide-react";
import {
  useCreateBizOrder,
  useGetBizFees,
  useGetBizListing,
  useGetBizListingSlots,
  type BizListingDetail,
  type CreateBizOrderBodyFulfillment,
} from "@/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCities } from "@/hooks/use-biz-me";
import { useToast } from "@/hooks/use-toast";
import { EmptyState, Loading, Money, Rating } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invalidateApi } from "@/lib/query-client";
import { FULFILLMENT_LABELS, UNIT_LABELS, cityName, dayLabel, errorText, riyadhDay, timeOnly } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const { lang, tr } = useLanguage();
  const cities = useCities();
  const listing = useGetBizListing(Number(id));

  if (listing.isLoading) return <Loading />;
  if (!listing.data) {
    return <EmptyState icon={Package} title={tr("العرض غير متاح", "This offer isn't available")} action={<Button asChild variant="outline"><Link href="/search">{tr("تصفّح العروض", "Browse offers")}</Link></Button>} />;
  }
  const l = listing.data;

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
      <div className="space-y-5">
        <div
          className="rounded-2xl p-6 md:p-10 text-white relative overflow-hidden bg-brand"
        >
          <div className="absolute inset-0 pattern-lattice pointer-events-none" />
          <div className="relative">
            <Link href={`/search?categoryId=${l.categoryId}`} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
              {lang === "ar" ? l.categoryNameAr : l.categoryNameEn}
            </Link>
            <h1 className="text-2xl md:text-4xl font-bold mt-4 leading-tight">{l.title}</h1>
            <div className="mt-3 flex items-baseline gap-2">
              <Money halalas={l.buyerPriceHalalas} className="text-3xl font-bold text-[hsl(var(--gold))]" />
              <span className="text-white/70 text-sm">{UNIT_LABELS[l.priceUnit][lang]}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-card-border shadow-card p-5 md:p-6 space-y-4">
          {l.description && <p className="text-sm leading-7 whitespace-pre-line text-foreground/90">{l.description}</p>}
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {l.kind === "service" ? (
              <Fact icon={CalendarClock} text={tr(`مدة الزيارة ${l.durationMinutes} دقيقة`, `Visit lasts ${l.durationMinutes} min`)} />
            ) : (
              <>
                {l.prepHours > 0 && <Fact icon={Clock} text={tr(`مدة التجهيز ${l.prepHours} ساعة`, `Ready in ${l.prepHours} h`)} />}
                {l.stock !== null && l.stock !== undefined && <Fact icon={Package} text={tr(`المتوفر: ${l.stock}`, `In stock: ${l.stock}`)} />}
                {l.allowsPickup && <Fact icon={Store} text={tr("استلام من البائع", "Pickup available")} />}
                {l.allowsDelivery && (
                  <Fact icon={Truck} text={tr("يوصّل البائع", "Seller delivers") + (l.deliveryFeeHalalas ? ` · ` : "")}>
                    {l.deliveryFeeHalalas > 0 && <Money halalas={l.deliveryFeeHalalas} />}
                  </Fact>
                )}
              </>
            )}
            <Fact icon={MapPin} text={l.providerCities.map((c) => cityName(cities, c, lang)).join("، ")} />
          </div>
        </div>

        <Link href={`/providers/${l.providerId}`} className="flex items-center justify-between gap-3 rounded-xl bg-card border border-card-border shadow-card p-5 hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--gold))] text-[hsl(var(--gold-foreground))] font-bold flex items-center justify-center shrink-0">
              {l.providerName.trim().charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate">{l.providerName}</p>
              <p className="text-xs text-muted-foreground">{cityName(cities, l.providerCity, lang)}</p>
            </div>
          </div>
          <Rating avg={l.ratingAvg} count={l.ratingCount} />
        </Link>
      </div>

      <OrderBox listing={l} />
    </div>
  );
}

function Fact({ icon: Icon, text, children }: { icon: typeof Clock; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5">
      <Icon className="w-4 h-4 text-primary shrink-0" />
      <span className="text-foreground/90">{text}{children}</span>
    </div>
  );
}

function OrderBox({ listing: l }: { listing: BizListingDetail }) {
  const { lang, tr } = useLanguage();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const cities = useCities();
  const fees = useGetBizFees().data;

  const isService = l.kind === "service";
  const fulfillmentOptions: CreateBizOrderBodyFulfillment[] = isService
    ? ["at_home"]
    : [...(l.allowsDelivery ? (["delivery"] as const) : []), ...(l.allowsPickup ? (["pickup"] as const) : [])];

  const [quantity, setQuantity] = useState(1);
  const [fulfillment, setFulfillment] = useState<CreateBizOrderBodyFulfillment>(fulfillmentOptions[0]);
  const [city, setCity] = useState(l.providerCities[0] ?? l.providerCity);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [day, setDay] = useState(riyadhDay(0));
  const [slot, setSlot] = useState<string | null>(null);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => riyadhDay(i)), []);
  const slots = useGetBizListingSlots(
    l.id,
    { date: day, quantity: l.priceUnit === "hour" ? quantity : 1 },
    { query: { enabled: isService } },
  );

  const create = useCreateBizOrder();
  const comesToBuyer = fulfillment !== "pickup";
  const maxQty = l.priceUnit === "visit" ? 1 : l.priceUnit === "hour" ? 12 : Math.min(l.stock ?? 100, 100);

  const subtotal = l.priceHalalas * quantity;
  const buyerFee = fees ? Math.floor((subtotal * fees.buyerFeeBps + 5000) / 10000) : 0;
  const delivery = fulfillment === "delivery" ? l.deliveryFeeHalalas : 0;

  if (!l.acceptingOrders) {
    return (
      <aside className="rounded-xl bg-card border border-card-border shadow-card p-6 text-center">
        <p className="font-bold">{tr("مقدّم الخدمة لا يستقبل طلبات حاليًا", "This provider isn't taking orders right now")}</p>
        <p className="text-sm text-muted-foreground mt-1">{tr("جرّبي لاحقًا أو تصفّحي عروضًا أخرى.", "Try later or browse other offers.")}</p>
      </aside>
    );
  }

  const submit = () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location)}`);
      return;
    }
    create.mutate(
      {
        data: {
          listingId: l.id,
          quantity,
          fulfillment,
          scheduledStart: isService ? slot : null,
          city,
          buyerPhone: phone,
          address: comesToBuyer ? address : null,
          notes: notes || null,
        },
      },
      {
        onSuccess: (order) => {
          invalidateApi("/api/biz/orders", `/api/biz/listings/${l.id}`);
          toast({ title: tr("تم إرسال طلبك", "Your order was sent"), description: tr("سيصلك رد مقدّم الخدمة هنا.", "The provider's reply will show here.") });
          navigate(`/orders/${order.id}`);
        },
        onError: (err) => {
          if (isService) slots.refetch();
          toast({ variant: "destructive", title: errorText(err, lang) });
        },
      },
    );
  };

  const ready = !!phone && (!comesToBuyer || address.trim().length > 3) && (!isService || !!slot);

  return (
    <aside className="rounded-xl bg-card border border-card-border shadow-card-md p-5 md:p-6 space-y-4 lg:sticky lg:top-24">
      <h2 className="font-bold text-lg">{isService ? tr("احجزي موعدًا", "Book a visit") : tr("اطلبي الآن", "Order now")}</h2>

      {l.priceUnit !== "visit" && (
        <div className="space-y-1.5">
          <Label>{l.priceUnit === "hour" ? tr("عدد الساعات", "Hours") : tr("الكمية", "Quantity")}</Label>
          <Input type="number" min={1} max={maxQty} value={quantity} onChange={(e) => { setQuantity(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1))); setSlot(null); }} />
        </div>
      )}

      {!isService && fulfillmentOptions.length > 1 && (
        <div className="grid grid-cols-2 gap-2">
          {fulfillmentOptions.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFulfillment(f)}
              className={cn("rounded-lg border px-3 py-2.5 text-sm font-bold transition-colors", fulfillment === f ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground")}
            >
              {FULFILLMENT_LABELS[f][lang]}
            </button>
          ))}
        </div>
      )}

      {isService && (
        <div className="space-y-2">
          <Label>{tr("اليوم", "Day")}</Label>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {days.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDay(d); setSlot(null); }}
                className={cn("shrink-0 rounded-lg border px-3 py-2 text-xs font-bold", d === day ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground")}
              >
                {dayLabel(d, lang)}
              </button>
            ))}
          </div>
          <Label>{tr("الوقت", "Time")}</Label>
          {slots.isLoading ? (
            <Loading />
          ) : slots.data?.slots.length ? (
            <div className="grid grid-cols-3 gap-2">
              {slots.data.slots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => setSlot(s.start)}
                  className={cn("rounded-xl border px-2 py-2 text-xs font-bold tabular-nums", slot === s.start ? "border-primary bg-primary/10 text-primary" : "border-border")}
                >
                  {timeOnly(s.start, lang)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground rounded-lg bg-muted/60 px-3 py-3">{tr("لا توجد أوقات متاحة في هذا اليوم.", "No free times on this day.")}</p>
          )}
        </div>
      )}

      {comesToBuyer && (
        <>
          <div className="space-y-1.5">
            <Label>{tr("المدينة", "City")}</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {l.providerCities.map((c) => (
                  <SelectItem key={c} value={c}>{cityName(cities, c, lang)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{tr("العنوان", "Address")}</Label>
            <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder={tr("الحي، الشارع، رقم المنزل", "District, street, house number")} />
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <Label>{tr("رقم جوالك", "Your mobile")}</Label>
        <Input dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
        <p className="text-[11px] text-muted-foreground">{tr("يظهر لمقدّم الخدمة بعد قبول الطلب فقط.", "Shown to the provider only after they accept.")}</p>
      </div>

      <div className="space-y-1.5">
        <Label>{tr("ملاحظات (اختياري)", "Notes (optional)")}</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="rounded-lg bg-muted/60 p-4 space-y-1.5 text-sm">
        <Row label={tr("السعر", "Price")} value={<Money halalas={subtotal} />} />
        {delivery > 0 && <Row label={tr("التوصيل", "Delivery")} value={<Money halalas={delivery} />} />}
        <Row label={tr("رسوم الخدمة", "Service fee")} value={<Money halalas={buyerFee} />} />
        <div className="border-t border-border pt-2 mt-2">
          <Row label={<span className="font-bold">{tr("الإجمالي (نقدًا)", "Total (cash)")}</span>} value={<Money halalas={subtotal + delivery + buyerFee} className="font-bold text-primary text-base" />} />
        </div>
      </div>

      <Button className="w-full rounded-xl font-bold" size="lg" disabled={(!!user && !ready) || create.isPending} onClick={submit}>
        {user ? (isService ? tr("تأكيد الحجز", "Confirm booking") : tr("تأكيد الطلب", "Place order")) : tr("سجّلي الدخول للطلب", "Sign in to order")}
      </Button>
      <p className="text-[11px] text-center text-muted-foreground">{tr("الدفع نقدًا عند الاستلام أو بعد الزيارة · الإلغاء مجاني", "Pay cash on delivery or after the visit · Free cancellation")}</p>
    </aside>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      {value}
    </div>
  );
}
