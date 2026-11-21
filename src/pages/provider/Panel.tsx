import { useEffect, useState } from "react";
import { Link, Redirect } from "wouter";
import { AlertTriangle, CalendarClock, ClipboardList, Clock, Package, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import {
  useDeleteBizListing,
  useGetBizAvailability,
  useGetBizProviderLedger,
  useGetBizProviderProfile,
  useGetBizTimeOff,
  useListBizProviderOrders,
  useListMyBizCategoryRequests,
  useListMyBizListings,
  useRequestBizCategory,
  useSetBizAvailability,
  useSetBizTimeOff,
  useUpdateBizProviderProfile,
  type BizAvailabilityWindow,
  type BizListing,
  type BizCategoryRequestBodyKind,
} from "@/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/use-biz-me";
import { useToast } from "@/hooks/use-toast";
import { EmptyState, Loading, Money, PageHeader, Section, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invalidateApi } from "@/lib/query-client";
import { FULFILLMENT_LABELS, UNIT_LABELS, WEEKDAYS, clockToMinutes, dateTime, dayLabel, errorText, minutesToClock, riyadhDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ListingDialog } from "./ListingDialog";
import { ProviderForm } from "./ProviderForm";

export default function ProviderPanel() {
  const { tr } = useLanguage();
  const profile = useGetBizProviderProfile({ query: { retry: false } });

  if (profile.isLoading) return <Loading />;
  if (!profile.data) return <Redirect to="/provider/apply" />;
  const p = profile.data;

  return (
    <div>
      <PageHeader title={p.displayName} subtitle={tr("لوحة مقدّم الخدمة", "Provider panel")} />
      <StatusBanner status={p.status} reason={p.statusReason} blocked={!!p.blocked} balance={p.balanceHalalas ?? 0} limit={p.debtLimitHalalas ?? 0} />

      <Tabs defaultValue={p.status === "approved" ? "orders" : "profile"} className="mt-5">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-5">
          <TabsTrigger value="orders">{tr("الطلبات", "Orders")}</TabsTrigger>
          <TabsTrigger value="listings">{tr("عروضي", "My offers")}</TabsTrigger>
          <TabsTrigger value="schedule">{tr("أوقات العمل", "Hours")}</TabsTrigger>
          <TabsTrigger value="balance">{tr("الرصيد", "Balance")}</TabsTrigger>
          <TabsTrigger value="profile">{tr("ملفي", "Profile")}</TabsTrigger>
        </TabsList>
        <TabsContent value="orders"><OrdersTab /></TabsContent>
        <TabsContent value="listings"><ListingsTab /></TabsContent>
        <TabsContent value="schedule"><ScheduleTab /></TabsContent>
        <TabsContent value="balance"><BalanceTab /></TabsContent>
        <TabsContent value="profile">
          <ProfileTab
            initial={{ displayName: p.displayName, bio: p.bio, phone: p.phone, city: p.city, cities: p.cities.filter((c) => c !== p.city), freelanceDocNumber: p.freelanceDocNumber, freelanceDocExpiry: p.freelanceDocExpiry }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBanner({ status, reason, blocked, balance, limit }: { status: string; reason?: string | null; blocked: boolean; balance: number; limit: number }) {
  const { tr } = useLanguage();
  const box = (tone: string, title: string, text?: string | null) => (
    <div className={cn("rounded-lg p-4 flex gap-3", tone)}>
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold">{title}</p>
        {text && <p className="text-sm mt-0.5">{text}</p>}
      </div>
    </div>
  );
  if (status === "pending") return box("bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200", tr("طلبك قيد المراجعة", "Your application is under review"), tr("تراجع الإدارة وثيقة العمل الحر. يمكنك تجهيز عروضك وأوقاتك الآن، وستظهر للمشترين بعد الموافقة.", "The admin is checking your freelance document. You can prepare offers and hours now; they go live once approved."));
  if (status === "rejected") return box("bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200", tr("لم تتم الموافقة على طلبك", "Your application wasn't approved"), `${reason ?? ""} ${tr("عدّلي بياناتك من «ملفي» لإعادة الإرسال.", "Edit your details under “Profile” to resubmit.")}`);
  if (status === "suspended") return box("bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200", tr("الحساب موقوف", "Account suspended"), reason);
  if (blocked) return box("bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200", tr("لا يمكنك استقبال طلبات جديدة", "You can't take new orders"), tr(`مستحقات الموقع عليك ${(balance / 100).toFixed(2)} ر.س تجاوزت الحد ${(limit / 100).toFixed(0)} ر.س. سدّدي للإدارة لإعادة التفعيل.`, `You owe the site SAR ${(balance / 100).toFixed(2)}, over the SAR ${(limit / 100).toFixed(0)} limit. Pay the admin to reactivate.`));
  return null;
}

function OrdersTab() {
  const { lang, tr } = useLanguage();
  const [filter, setFilter] = useState<"open" | "done">("open");
  const orders = useListBizProviderOrders(
    { status: filter === "open" ? "requested,accepted,on_the_way,disputed" : "completed,declined,cancelled" },
    { query: { refetchInterval: 15_000 } },
  );
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["open", "done"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "open" ? tr("الحالية", "Open") : tr("المنتهية", "Finished")}
          </Button>
        ))}
      </div>
      {orders.isLoading ? <Loading /> : orders.data?.length ? (
        <div className="space-y-3">
          {orders.data.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card border border-card-border shadow-card p-4 hover:border-primary/30">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold">#{o.id} · {o.title}{o.quantity > 1 && ` × ${o.quantity}`}</p>
                  <StatusBadge status={o.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {FULFILLMENT_LABELS[o.fulfillment][lang]} · {o.scheduledStart ? dateTime(o.scheduledStart, lang) : dateTime(o.createdAt, lang)}
                </p>
              </div>
              <Money halalas={o.totalHalalas} className="font-bold text-primary" />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardList} title={filter === "open" ? tr("لا توجد طلبات حالية", "No open orders") : tr("لا توجد طلبات منتهية", "No finished orders")} />
      )}
    </div>
  );
}

function ListingsTab() {
  const { lang, tr } = useLanguage();
  const { toast } = useToast();
  const listings = useListMyBizListings();
  const categories = useCategories();
  const remove = useDeleteBizListing();
  const [editing, setEditing] = useState<BizListing | null>(null);
  const [open, setOpen] = useState(false);

  const catName = (id: number) => {
    const c = categories?.find((x) => x.id === id);
    return c ? (lang === "ar" ? c.nameAr : c.nameEn) : "";
  };

  return (
    <div className="space-y-4">
      <Button className="rounded-xl font-bold" onClick={() => { setEditing(null); setOpen(true); }}>
        <Plus className="w-4 h-4" />{tr("إضافة عرض", "Add offer")}
      </Button>
      {listings.isLoading ? <Loading /> : listings.data?.length ? (
        <div className="grid md:grid-cols-2 gap-3">
          {listings.data.map((l) => (
            <div key={l.id} className={cn("rounded-xl bg-card border border-card-border shadow-card p-4", (!l.isActive || l.hiddenByAdmin) && "opacity-60")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground font-bold">{catName(l.categoryId)} · {l.kind === "service" ? tr("خدمة", "Service") : tr("منتج", "Product")}</p>
                  <p className="font-bold truncate">{l.title}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" aria-label={tr("تعديل", "Edit")} onClick={() => { setEditing(l); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={tr("حذف", "Delete")}
                    className="text-rose-600"
                    onClick={() => {
                      if (!confirm(tr("حذف هذا العرض؟ إن كانت عليه طلبات سيُخفى فقط.", "Delete this offer? If it has orders it's only hidden."))) return;
                      remove.mutate({ id: l.id }, {
                        onSuccess: (r) => {
                          invalidateApi("/api/biz/provider/listings", "/api/biz/listings");
                          toast({ title: r.deleted ? tr("تم الحذف", "Deleted") : tr("تم إخفاء العرض لوجود طلبات عليه", "Hidden — it has orders") });
                        },
                        onError: (err) => toast({ variant: "destructive", title: errorText(err, lang) }),
                      });
                    }}
                  ><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span><Money halalas={l.priceHalalas} className="font-bold text-primary text-sm" /> {UNIT_LABELS[l.priceUnit][lang]}</span>
                {l.kind === "service" ? <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{l.durationMinutes} {tr("د", "min")}</span> : l.stock != null && <span className="inline-flex items-center gap-1"><Package className="w-3 h-3" />{l.stock}</span>}
                {l.hiddenByAdmin && <span className="font-bold text-rose-600">{tr("أخفته الإدارة", "Hidden by admin")}</span>}
                {!l.isActive && <span className="font-bold">{tr("مخفي", "Hidden")}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Package} title={tr("لا توجد عروض بعد", "No offers yet")} hint={tr("أضيفي أول منتج أو خدمة.", "Add your first product or service.")} />
      )}
      <ListingDialog open={open} listing={editing} onClose={() => setOpen(false)} />
    </div>
  );
}

function ScheduleTab() {
  const { lang, tr } = useLanguage();
  const { toast } = useToast();
  const availability = useGetBizAvailability();
  const timeOff = useGetBizTimeOff();
  const saveWeek = useSetBizAvailability();
  const saveOff = useSetBizTimeOff();
  const [week, setWeek] = useState<BizAvailabilityWindow[]>([]);
  const [off, setOff] = useState<string[]>([]);
  const [newDay, setNewDay] = useState(riyadhDay(1));

  useEffect(() => { if (availability.data) setWeek(availability.data); }, [availability.data]);
  useEffect(() => { if (timeOff.data) setOff(timeOff.data); }, [timeOff.data]);

  const onError = (err: unknown) => toast({ variant: "destructive", title: errorText(err, lang) });
  const today = riyadhDay(0);

  return (
    <div className="grid lg:grid-cols-2 gap-5 items-start">
      <Section title={tr("أوقات العمل الأسبوعية", "Weekly hours")} action={<CalendarClock className="w-5 h-5 text-primary" />}>
        <p className="text-xs text-muted-foreground mb-3">{tr("يحجز المشترون خدماتك ضمن هذه الأوقات (بتوقيت الرياض).", "Buyers book your services within these hours (Riyadh time).")}</p>
        <div className="space-y-2">
          {WEEKDAYS.map((d, wd) => {
            const rows = week.map((w, i) => ({ w, i })).filter((x) => x.w.weekday === wd);
            return (
              <div key={wd} className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">{d[lang]}</p>
                  <Button size="sm" variant="ghost" onClick={() => setWeek([...week, { weekday: wd, startMinute: 16 * 60, endMinute: 21 * 60 }])}>
                    <Plus className="w-3.5 h-3.5" />{tr("فترة", "Slot")}
                  </Button>
                </div>
                {rows.length === 0 && <p className="text-xs text-muted-foreground">{tr("إجازة", "Closed")}</p>}
                {rows.map(({ w, i }) => (
                  <div key={i} className="flex items-center gap-2 mt-2" dir="ltr">
                    <Input type="time" step={1800} className="h-9" value={minutesToClock(w.startMinute)} onChange={(e) => setWeek(week.map((x, j) => (j === i ? { ...x, startMinute: clockToMinutes(e.target.value) } : x)))} />
                    <span>–</span>
                    <Input type="time" step={1800} className="h-9" value={minutesToClock(Math.min(w.endMinute, 1439))} onChange={(e) => setWeek(week.map((x, j) => (j === i ? { ...x, endMinute: clockToMinutes(e.target.value) } : x)))} />
                    <Button size="icon" variant="ghost" className="text-rose-600 shrink-0" onClick={() => setWeek(week.filter((_, j) => j !== i))} aria-label={tr("حذف", "Remove")}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <Button
          className="mt-4 rounded-xl font-bold"
          disabled={saveWeek.isPending || week.some((w) => w.endMinute <= w.startMinute)}
          onClick={() => saveWeek.mutate({ data: week }, { onSuccess: () => { invalidateApi("/api/biz/provider/availability"); toast({ title: tr("تم الحفظ", "Saved") }); }, onError })}
        >
          {tr("حفظ الأوقات", "Save hours")}
        </Button>
      </Section>

      <Section title={tr("أيام الإجازة", "Days off")}>
        <div className="flex gap-2" dir="ltr">
          <Input type="date" min={today} value={newDay} onChange={(e) => setNewDay(e.target.value)} />
          <Button variant="outline" onClick={() => newDay && !off.includes(newDay) && setOff([...off, newDay].sort())}>{tr("إضافة", "Add")}</Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {off.filter((d) => d >= today).map((d) => (
            <button key={d} onClick={() => setOff(off.filter((x) => x !== d))} className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold hover:bg-rose-100 hover:text-rose-700">
              {dayLabel(d, lang)} ×
            </button>
          ))}
          {!off.some((d) => d >= today) && <p className="text-xs text-muted-foreground">{tr("لا توجد أيام إجازة قادمة.", "No upcoming days off.")}</p>}
        </div>
        <Button
          className="mt-4 rounded-xl font-bold"
          disabled={saveOff.isPending}
          onClick={() => saveOff.mutate({ data: off.filter((d) => d >= today) }, { onSuccess: () => { invalidateApi("/api/biz/provider/time-off"); toast({ title: tr("تم الحفظ", "Saved") }); }, onError })}
        >
          {tr("حفظ أيام الإجازة", "Save days off")}
        </Button>
      </Section>
    </div>
  );
}

function BalanceTab() {
  const { lang, tr } = useLanguage();
  const ledger = useGetBizProviderLedger();
  if (ledger.isLoading) return <Loading />;
  const l = ledger.data;
  if (!l) return null;
  const kinds = {
    commission: tr("عمولة طلب", "Order commission"),
    payment: tr("دفعة للموقع", "Payment to the site"),
    reversal: tr("استرجاع عمولة", "Commission reversed"),
    adjustment: tr("تعديل", "Adjustment"),
  };
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl p-5 text-white bg-brand">
          <Wallet className="w-5 h-5 text-[hsl(var(--gold))]" />
          <p className="text-sm text-white/70 mt-2">{tr("المستحق للموقع", "You owe the site")}</p>
          <Money halalas={Math.max(l.balanceHalalas, 0)} className="text-3xl font-bold" />
        </div>
        <div className="rounded-xl bg-card border border-card-border p-5 shadow-card">
          <p className="text-sm text-muted-foreground">{tr("الحد المسموح قبل الإيقاف", "Limit before new orders stop")}</p>
          <Money halalas={l.debtLimitHalalas} className="text-2xl font-bold" />
          <p className="text-xs text-muted-foreground mt-2">{tr("تسدّدين المستحقات للإدارة بالتحويل البنكي وتُسجَّل هنا.", "Pay the admin by bank transfer; payments are recorded here.")}</p>
        </div>
      </div>
      <Section title={tr("الحركات", "Entries")}>
        {l.entries.length ? (
          <ul className="divide-y divide-border">
            {l.entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-bold">{kinds[e.kind]}{e.orderId && <Link href={`/orders/${e.orderId}`} className="text-primary ms-1">#{e.orderId}</Link>}</p>
                  <p className="text-xs text-muted-foreground">{dateTime(e.createdAt, lang)}{e.note && ` · ${e.note}`}</p>
                </div>
                <Money halalas={e.amountHalalas} className={cn("font-bold", e.amountHalalas < 0 ? "text-emerald-600" : "text-foreground")} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{tr("لا توجد حركات بعد.", "No entries yet.")}</p>
        )}
      </Section>
    </div>
  );
}

function ProfileTab({ initial }: { initial: Parameters<typeof ProviderForm>[0]["initial"] }) {
  const { lang, tr } = useLanguage();
  const { toast } = useToast();
  const update = useUpdateBizProviderProfile();
  const requests = useListMyBizCategoryRequests();
  const requestCategory = useRequestBizCategory();
  const [nameAr, setNameAr] = useState("");
  const [kind, setKind] = useState<BizCategoryRequestBodyKind>("both");
  const statusText = { pending: tr("قيد المراجعة", "Pending"), approved: tr("تمت الإضافة", "Added"), rejected: tr("مرفوض", "Rejected") };

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
      <Section title={tr("بياناتي", "My details")}>
        <p className="text-xs text-muted-foreground mb-4">{tr("تغيير بيانات الوثيقة يعيد ملفك للمراجعة.", "Changing the document details sends your profile back for review.")}</p>
        <ProviderForm
          initial={initial}
          submitLabel={tr("حفظ", "Save")}
          busy={update.isPending}
          onSubmit={(data) =>
            update.mutate({ data }, {
              onSuccess: () => { invalidateApi("/api/biz/provider", "/api/biz/me"); toast({ title: tr("تم الحفظ", "Saved") }); },
              onError: (err) => toast({ variant: "destructive", title: errorText(err, lang) }),
            })
          }
        />
      </Section>

      <Section title={tr("طلب تصنيف جديد", "Request a new category")}>
        <p className="text-xs text-muted-foreground mb-3">{tr("خدمتك غير موجودة؟ اقترحيها وستضيفها الإدارة.", "Your service isn't listed? Suggest it and the admin will add it.")}</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{tr("اسم الخدمة", "Service name")}</Label>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder={tr("مثال: تنسيق حدائق", "e.g. Garden care")} />
          </div>
          <Select value={kind} onValueChange={(v) => setKind(v as BizCategoryRequestBodyKind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="product">{tr("منتجات", "Products")}</SelectItem>
              <SelectItem value="service">{tr("خدمة في المنزل", "Home service")}</SelectItem>
              <SelectItem value="both">{tr("الاثنان", "Both")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="w-full rounded-xl"
            disabled={nameAr.trim().length < 2 || requestCategory.isPending}
            onClick={() =>
              requestCategory.mutate({ data: { nameAr: nameAr.trim(), kind } }, {
                onSuccess: () => { setNameAr(""); invalidateApi("/api/biz/provider/category-requests"); toast({ title: tr("تم إرسال الاقتراح", "Suggestion sent") }); },
                onError: (err) => toast({ variant: "destructive", title: errorText(err, lang) }),
              })
            }
          >
            {tr("إرسال", "Send")}
          </Button>
        </div>
        {!!requests.data?.length && (
          <ul className="mt-4 space-y-2">
            {requests.data.map((r) => (
              <li key={r.id} className="flex justify-between text-sm rounded-xl bg-muted/60 px-3 py-2">
                <span>{r.nameAr}</span>
                <span className="text-xs font-bold text-muted-foreground">{statusText[r.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
