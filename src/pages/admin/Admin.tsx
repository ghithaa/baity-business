import { useEffect, useState } from "react";
import { Link, Redirect } from "wouter";
import { Check, Pause, X, Wallet } from "lucide-react";
import {
  useAdminAddBizLedgerEntry,
  useAdminCreateBizCategory,
  useAdminDecideBizCategoryRequest,
  useAdminGetBizSettings,
  useAdminListBizCategories,
  useAdminListBizCategoryRequests,
  useAdminListBizOrders,
  useAdminListBizProviders,
  useAdminSetBizProviderStatus,
  useAdminUpdateBizCategory,
  useAdminUpdateBizSettings,
  type AdminListBizProvidersStatus,
  type BizAdminProvider,
  type BizCategoryBodyKind,
} from "@/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBizMe, useCities } from "@/hooks/use-biz-me";
import { useToast } from "@/hooks/use-toast";
import { EmptyState, Loading, Money, PageHeader, Section, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invalidateApi } from "@/lib/query-client";
import { cityName, dateTime, errorText, riyadhDay, toHalalas } from "@/lib/format";
import { cn } from "@/lib/utils";

function useNotify() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  return {
    ok: (title: string) => toast({ title }),
    fail: (err: unknown) => toast({ variant: "destructive", title: errorText(err, lang) }),
  };
}

export default function AdminPage() {
  const { tr } = useLanguage();
  const { isAdmin, isLoading } = useBizMe();
  if (isLoading) return <Loading />;
  if (!isAdmin) return <Redirect to="/" />;

  return (
    <div>
      <PageHeader title={tr("إدارة بيتي بزنس", "Baity Business admin")} />
      <Tabs defaultValue="providers">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-5">
          <TabsTrigger value="providers">{tr("مقدّمو الخدمة", "Providers")}</TabsTrigger>
          <TabsTrigger value="requests">{tr("طلبات التصنيفات", "Category requests")}</TabsTrigger>
          <TabsTrigger value="categories">{tr("التصنيفات", "Categories")}</TabsTrigger>
          <TabsTrigger value="orders">{tr("الطلبات والنزاعات", "Orders & disputes")}</TabsTrigger>
          <TabsTrigger value="settings">{tr("العمولة والحدود", "Fees & limits")}</TabsTrigger>
        </TabsList>
        <TabsContent value="providers"><ProvidersTab /></TabsContent>
        <TabsContent value="requests"><RequestsTab /></TabsContent>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
        <TabsContent value="orders"><OrdersTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ProvidersTab() {
  const { lang, tr } = useLanguage();
  const cities = useCities();
  const n = useNotify();
  const [status, setStatus] = useState<AdminListBizProvidersStatus | "all">("pending");
  const providers = useAdminListBizProviders(status === "all" ? undefined : { status });
  const setProviderStatus = useAdminSetBizProviderStatus();
  const [acting, setActing] = useState<{ p: BizAdminProvider; to: "rejected" | "suspended" } | null>(null);
  const [reason, setReason] = useState("");
  const [paying, setPaying] = useState<BizAdminProvider | null>(null);

  const change = (id: number, to: "approved" | "rejected" | "suspended", why?: string) =>
    setProviderStatus.mutate({ id, data: { status: to, reason: why || null } }, {
      onSuccess: () => { setActing(null); setReason(""); invalidateApi("/api/biz/admin", "/api/biz/listings"); n.ok(tr("تم التحديث", "Updated")); },
      onError: n.fail,
    });

  const labels: Record<string, string> = { pending: tr("قيد المراجعة", "Pending"), approved: tr("معتمد", "Approved"), rejected: tr("مرفوض", "Rejected"), suspended: tr("موقوف", "Suspended"), all: tr("الكل", "All") };
  const today = riyadhDay(0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "suspended", "rejected", "all"] as const).map((s) => (
          <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>{labels[s]}</Button>
        ))}
      </div>
      {providers.isLoading ? <Loading /> : providers.data?.length ? (
        <div className="space-y-3">
          {providers.data.map((p) => (
            <div key={p.id} className="rounded-xl bg-card border border-card-border shadow-card p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">{p.displayName} <span className="text-xs font-bold text-muted-foreground">· {labels[p.status]}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">{p.accountName} · <span dir="ltr">{p.email}</span> · <span dir="ltr">{p.phone}</span> · {cityName(cities, p.city, lang)}</p>
                  <p className={cn("text-xs mt-1", p.freelanceDocExpiry <= today ? "text-rose-600 font-bold" : "text-muted-foreground")}>
                    {tr("وثيقة العمل الحر", "Freelance doc")}: <span dir="ltr" className="font-bold">{p.freelanceDocNumber}</span> · {tr("تنتهي", "expires")} {p.freelanceDocExpiry}
                  </p>
                  {p.statusReason && <p className="text-xs mt-1">{tr("السبب", "Reason")}: {p.statusReason}</p>}
                </div>
                <div className="text-end">
                  <p className="text-[11px] text-muted-foreground">{tr("المستحق", "Owes")}</p>
                  <Money halalas={p.balanceHalalas} className={cn("font-bold", p.blocked && "text-rose-600")} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {p.status !== "approved" && <Button size="sm" onClick={() => change(p.id, "approved")} disabled={setProviderStatus.isPending}><Check className="w-4 h-4" />{tr("اعتماد", "Approve")}</Button>}
                {p.status === "pending" && <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setActing({ p, to: "rejected" })}><X className="w-4 h-4" />{tr("رفض", "Reject")}</Button>}
                {p.status === "approved" && <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setActing({ p, to: "suspended" })}><Pause className="w-4 h-4" />{tr("إيقاف", "Suspend")}</Button>}
                <Button size="sm" variant="outline" onClick={() => setPaying(p)}><Wallet className="w-4 h-4" />{tr("تسجيل دفعة", "Record payment")}</Button>
                <Button size="sm" variant="ghost" asChild><Link href={`/providers/${p.id}`}>{tr("الصفحة العامة", "Public page")}</Link></Button>
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState icon={Check} title={tr("لا يوجد أحد هنا", "Nobody here")} />}

      <Dialog open={!!acting} onOpenChange={(v) => !v && setActing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{acting?.to === "rejected" ? tr("رفض الطلب", "Reject application") : tr("إيقاف الحساب", "Suspend account")}</DialogTitle></DialogHeader>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={tr("السبب — يراه مقدّم الخدمة (مطلوب)", "Reason — the provider sees it (required)")} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActing(null)}>{tr("تراجع", "Back")}</Button>
            <Button disabled={!reason.trim() || setProviderStatus.isPending} onClick={() => acting && change(acting.p.id, acting.to, reason.trim())}>{tr("تأكيد", "Confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentDialog provider={paying} onClose={() => setPaying(null)} />
    </div>
  );
}

function PaymentDialog({ provider, onClose }: { provider: BizAdminProvider | null; onClose: () => void }) {
  const { tr } = useLanguage();
  const n = useNotify();
  const add = useAdminAddBizLedgerEntry();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => { setAmount(provider ? String(Math.max(provider.balanceHalalas, 0) / 100) : ""); setNote(""); }, [provider]);

  return (
    <Dialog open={!!provider} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{tr("تسجيل دفعة من", "Record payment from")} {provider?.displayName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{tr("المبلغ المدفوع (ر.س)", "Amount paid (SAR)")}</Label>
            <Input type="number" min={0.01} step="0.01" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{tr("ملاحظة (رقم التحويل مثلًا)", "Note (e.g. transfer reference)")}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tr("إلغاء", "Cancel")}</Button>
          <Button
            disabled={!(Number(amount) > 0) || add.isPending}
            onClick={() => provider && add.mutate({ id: provider.id, data: { kind: "payment", amountHalalas: toHalalas(amount), note: note || null } }, {
              onSuccess: () => { invalidateApi("/api/biz/admin"); n.ok(tr("تم تسجيل الدفعة", "Payment recorded")); onClose(); },
              onError: n.fail,
            })}
          >
            {tr("تسجيل", "Record")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function RequestsTab() {
  const { tr } = useLanguage();
  const n = useNotify();
  const requests = useAdminListBizCategoryRequests({ status: "pending" });
  const decide = useAdminDecideBizCategoryRequest();
  const [names, setNames] = useState<Record<number, { en: string; slug: string }>>({});

  if (requests.isLoading) return <Loading />;
  if (!requests.data?.length) return <EmptyState icon={Check} title={tr("لا توجد طلبات معلّقة", "No pending requests")} />;

  const done = { onSuccess: () => { invalidateApi("/api/biz/admin", "/api/biz/categories"); n.ok(tr("تم", "Done")); }, onError: n.fail };

  return (
    <div className="space-y-3">
      {requests.data.map((r) => {
        const v = names[r.id] ?? { en: r.nameEn ?? "", slug: slugify(r.nameEn ?? "") };
        return (
          <div key={r.id} className="rounded-xl bg-card border border-card-border shadow-card p-4 space-y-3">
            <div>
              <p className="font-bold">{r.nameAr}</p>
              <p className="text-xs text-muted-foreground">{r.providerName} · {r.kind} · {dateTime(r.createdAt, "ar")}</p>
              {r.note && <p className="text-sm mt-1">{r.note}</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-2" dir="ltr">
              <Input placeholder="English name" value={v.en} onChange={(e) => setNames({ ...names, [r.id]: { en: e.target.value, slug: slugify(e.target.value) } })} />
              <Input placeholder="slug" value={v.slug} onChange={(e) => setNames({ ...names, [r.id]: { ...v, slug: e.target.value } })} />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!v.en.trim() || v.slug.length < 2 || decide.isPending}
                onClick={() => decide.mutate({ id: r.id, data: { decision: "approve", category: { slug: v.slug, nameAr: r.nameAr, nameEn: v.en.trim(), kind: r.kind } } }, done)}
              >
                <Check className="w-4 h-4" />{tr("إضافة كتصنيف", "Add as category")}
              </Button>
              <Button size="sm" variant="outline" className="text-rose-600" disabled={decide.isPending} onClick={() => decide.mutate({ id: r.id, data: { decision: "reject" } }, done)}>
                <X className="w-4 h-4" />{tr("رفض", "Reject")}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoriesTab() {
  const { tr } = useLanguage();
  const n = useNotify();
  const categories = useAdminListBizCategories();
  const create = useAdminCreateBizCategory();
  const update = useAdminUpdateBizCategory();
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [kind, setKind] = useState<BizCategoryBodyKind>("both");
  const refresh = () => invalidateApi("/api/biz/admin/categories", "/api/biz/categories");

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
      <Section title={tr("كل التصنيفات", "All categories")}>
        {categories.isLoading ? <Loading /> : (
          <ul className="divide-y divide-border">
            {categories.data?.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm">{c.nameAr} <span className="text-muted-foreground font-medium">· {c.nameEn}</span></p>
                  <p className="text-[11px] text-muted-foreground" dir="ltr">{c.slug} · {c.kind}</p>
                </div>
                <Switch checked={c.isActive} onCheckedChange={(v) => update.mutate({ id: c.id, data: { isActive: v } }, { onSuccess: refresh, onError: n.fail })} />
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title={tr("تصنيف جديد", "New category")}>
        <div className="space-y-3">
          <Input placeholder={tr("الاسم بالعربية", "Arabic name")} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          <Input placeholder="English name" dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          <Select value={kind} onValueChange={(v) => setKind(v as BizCategoryBodyKind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="product">{tr("منتجات", "Products")}</SelectItem>
              <SelectItem value="service">{tr("خدمات في المنزل", "Home services")}</SelectItem>
              <SelectItem value="both">{tr("الاثنان", "Both")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="w-full"
            disabled={nameAr.trim().length < 2 || slugify(nameEn).length < 2 || create.isPending}
            onClick={() => create.mutate({ data: { slug: slugify(nameEn), nameAr: nameAr.trim(), nameEn: nameEn.trim(), kind, sortOrder: 200 } }, {
              onSuccess: () => { setNameAr(""); setNameEn(""); refresh(); n.ok(tr("تمت الإضافة", "Added")); },
              onError: n.fail,
            })}
          >
            {tr("إضافة", "Add")}
          </Button>
        </div>
      </Section>
    </div>
  );
}

function OrdersTab() {
  const { lang, tr } = useLanguage();
  const [filter, setFilter] = useState("disputed");
  const orders = useAdminListBizOrders(filter === "all" ? undefined : { status: filter });
  const options = [
    ["disputed", tr("النزاعات", "Disputes")],
    ["requested,accepted,on_the_way", tr("الجارية", "Open")],
    ["completed", tr("المكتملة", "Completed")],
    ["all", tr("الكل", "All")],
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => <Button key={v} size="sm" variant={filter === v ? "default" : "outline"} onClick={() => setFilter(v)}>{l}</Button>)}
      </div>
      {orders.isLoading ? <Loading /> : orders.data?.length ? (
        <div className="rounded-xl bg-card border border-card-border shadow-card divide-y divide-border">
          {orders.data.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted/40">
              <div className="min-w-0">
                <p className="font-bold text-sm">#{o.id} · {o.title} <StatusBadge status={o.status} /></p>
                <p className="text-xs text-muted-foreground">{o.buyerName} ← {o.providerName} · {dateTime(o.createdAt, lang)}</p>
              </div>
              <div className="text-end text-xs">
                <Money halalas={o.totalHalalas} className="font-bold text-sm" />
                <p className="text-muted-foreground">{tr("عمولة", "Fee")} <Money halalas={o.buyerFeeHalalas + o.sellerFeeHalalas} /></p>
              </div>
            </Link>
          ))}
        </div>
      ) : <EmptyState icon={Check} title={tr("لا توجد طلبات", "No orders")} />}
    </div>
  );
}

function SettingsTab() {
  const { tr } = useLanguage();
  const n = useNotify();
  const settings = useAdminGetBizSettings();
  const save = useAdminUpdateBizSettings();
  const [buyer, setBuyer] = useState("");
  const [seller, setSeller] = useState("");
  const [limit, setLimit] = useState("");
  useEffect(() => {
    if (!settings.data) return;
    setBuyer(String(settings.data.buyerFeeBps / 100));
    setSeller(String(settings.data.sellerFeeBps / 100));
    setLimit(String(settings.data.debtLimitHalalas / 100));
  }, [settings.data]);

  if (settings.isLoading) return <Loading />;
  return (
    <Section title={tr("العمولة وحد الدين", "Fees and debt limit")}>
      <div className="grid sm:grid-cols-3 gap-4 max-w-2xl">
        <div className="space-y-1.5"><Label>{tr("عمولة المشتري %", "Buyer fee %")}</Label><Input type="number" min={0} max={50} step="0.5" dir="ltr" value={buyer} onChange={(e) => setBuyer(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>{tr("عمولة البائع %", "Seller fee %")}</Label><Input type="number" min={0} max={50} step="0.5" dir="ltr" value={seller} onChange={(e) => setSeller(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>{tr("حد الدين (ر.س)", "Debt limit (SAR)")}</Label><Input type="number" min={0} dir="ltr" value={limit} onChange={(e) => setLimit(e.target.value)} /></div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">{tr("التغيير يسري على الطلبات الجديدة فقط؛ كل طلب يحتفظ بالنسبة وقت إنشائه.", "Changes apply to new orders only; each order keeps the rate it was placed at.")}</p>
      <Button
        className="mt-4 rounded-xl font-bold"
        disabled={save.isPending}
        onClick={() => save.mutate({ data: { buyerFeeBps: Math.round(Number(buyer) * 100), sellerFeeBps: Math.round(Number(seller) * 100), debtLimitHalalas: toHalalas(limit) } }, {
          onSuccess: () => { invalidateApi("/api/biz/admin/settings", "/api/biz/fees", "/api/biz/listings"); n.ok(tr("تم الحفظ", "Saved")); },
          onError: n.fail,
        })}
      >
        {tr("حفظ", "Save")}
      </Button>
    </Section>
  );
}
