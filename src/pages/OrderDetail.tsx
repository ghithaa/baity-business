import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowRight, MapPin, Phone, Send, PackageX, CalendarClock, Lock } from "lucide-react";
import {
  useGetBizOrder,
  useListBizOrderMessages,
  useReviewBizOrder,
  useSendBizOrderMessage,
  useSetBizOrderStatus,
  type BizOrderDetail,
  type BizOrderDetailViewerRole,
  type BizOrderStatus,
} from "@/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { useCities } from "@/hooks/use-biz-me";
import { useToast } from "@/hooks/use-toast";
import { EmptyState, Loading, Money, Section, StarPicker, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { invalidateApi } from "@/lib/query-client";
import { FULFILLMENT_LABELS, STATUS_LABELS, cityName, dateTime, errorText, timeOnly } from "@/lib/format";
import { cn } from "@/lib/utils";

// What each move is called, from the point of view of whoever makes it.
function actionLabel(to: BizOrderStatus, role: BizOrderDetailViewerRole, kind: string, lang: Lang): string {
  const ar = lang === "ar";
  switch (to) {
    case "accepted": return ar ? "قبول الطلب" : "Accept";
    case "declined": return ar ? "رفض" : "Decline";
    case "on_the_way": return kind === "service" ? (ar ? "أنا في الطريق" : "On my way") : (ar ? "خرج للتوصيل" : "Out for delivery");
    case "completed": return role === "admin" ? (ar ? "حسم: مكتمل" : "Settle as completed") : (ar ? "تم — استلمت المبلغ" : "Done — cash received");
    case "cancelled": return role === "admin" ? (ar ? "حسم: إلغاء" : "Settle as cancelled") : (ar ? "إلغاء الطلب" : "Cancel order");
    case "disputed": return ar ? "الإبلاغ عن مشكلة" : "Report a problem";
    default: return to;
  }
}

const NEEDS_REASON: BizOrderStatus[] = ["declined", "cancelled", "disputed"];
const DANGER: BizOrderStatus[] = ["declined", "cancelled", "disputed"];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { tr } = useLanguage();
  const order = useGetBizOrder(orderId, { query: { refetchInterval: 15_000 } });

  if (order.isLoading) return <Loading />;
  if (!order.data) return <EmptyState icon={PackageX} title={tr("الطلب غير موجود", "Order not found")} />;
  const o = order.data;
  const back = o.viewerRole === "provider" ? "/provider" : o.viewerRole === "admin" ? "/admin" : "/orders";

  return (
    <div className="space-y-5">
      <Link href={back} className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary">
        <ArrowRight className="w-4 h-4 ltr:rotate-180" />
        {tr("رجوع", "Back")}
      </Link>
      <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
        <div className="space-y-5">
          <Summary o={o} />
          <Actions o={o} />
          <Chat o={o} />
        </div>
        <div className="space-y-5">
          <Prices o={o} />
          {o.viewerRole === "buyer" && o.status === "completed" && <Review o={o} />}
          <Timeline o={o} />
        </div>
      </div>
    </div>
  );
}

function Summary({ o }: { o: BizOrderDetail }) {
  const { lang, tr } = useLanguage();
  const cities = useCities();
  const other = o.viewerRole === "buyer"
    ? { label: tr("مقدّم الخدمة", "Provider"), name: o.provider.displayName, phone: o.provider.phone }
    : { label: tr("المشتري", "Buyer"), name: o.buyerName ?? "", phone: o.buyerPhone };

  return (
    <section className="rounded-xl bg-card border border-card-border shadow-card p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{tr("طلب رقم", "Order")} #{o.id}</p>
          <h1 className="text-xl md:text-2xl font-bold mt-0.5">{o.title}{o.quantity > 1 && <span className="text-muted-foreground"> × {o.quantity}</span>}</h1>
        </div>
        <StatusBadge status={o.status} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <Info icon={CalendarClock} label={FULFILLMENT_LABELS[o.fulfillment][lang]}>
          {o.scheduledStart ? `${dateTime(o.scheduledStart, lang)} – ${timeOnly(o.scheduledEnd!, lang)}` : dateTime(o.createdAt, lang)}
        </Info>
        {o.fulfillment !== "pickup" && (
          <Info icon={MapPin} label={cityName(cities, o.city, lang)}>{o.address ?? "—"}</Info>
        )}
        <Info icon={Phone} label={`${other.label}: ${other.name}`}>
          {other.phone ? (
            <a href={`tel:${other.phone}`} dir="ltr" className="font-bold text-primary">{other.phone}</a>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground"><Lock className="w-3 h-3" />{tr("يظهر بعد قبول الطلب", "Shown once accepted")}</span>
          )}
        </Info>
      </div>
      {o.notes && <p className="text-sm rounded-lg bg-muted/60 p-3"><span className="font-bold">{tr("ملاحظات: ", "Notes: ")}</span>{o.notes}</p>}
      {o.statusReason && <p className="text-sm rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3"><span className="font-bold">{tr("السبب: ", "Reason: ")}</span>{o.statusReason}</p>}
    </section>
  );
}

function Info({ icon: Icon, label, children }: { icon: typeof Phone; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-lg bg-muted/60 p-3">
      <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-bold">{label}</p>
        <div className="text-foreground break-words">{children}</div>
      </div>
    </div>
  );
}

function Actions({ o }: { o: BizOrderDetail }) {
  const { lang, tr } = useLanguage();
  const { toast } = useToast();
  const setStatus = useSetBizOrderStatus();
  const [pending, setPending] = useState<BizOrderStatus | null>(null);
  const [reason, setReason] = useState("");
  if (!o.allowedNext.length) return null;

  const run = (to: BizOrderStatus, why?: string) =>
    setStatus.mutate(
      { id: o.id, data: { status: to, reason: why || null } },
      {
        onSuccess: () => {
          setPending(null);
          setReason("");
          invalidateApi("/api/biz/orders", "/api/biz/provider", "/api/biz/admin", "/api/biz/me");
          toast({ title: STATUS_LABELS[to][lang] });
        },
        onError: (err) => toast({ variant: "destructive", title: errorText(err, lang) }),
      },
    );

  return (
    <section className="rounded-xl bg-card border border-card-border shadow-card p-5">
      {o.viewerRole === "provider" && o.status === "requested" && (
        <p className="text-sm text-muted-foreground mb-3">{tr("بعد القبول يظهر لك رقم المشتري ويظهر رقمك له.", "Once you accept, you'll see the buyer's number and they'll see yours.")}</p>
      )}
      {o.viewerRole === "provider" && ["accepted", "on_the_way"].includes(o.status) && (
        <p className="text-sm text-muted-foreground mb-3">{tr("اضغطي «تم» بعد استلام المبلغ نقدًا؛ تُسجَّل عمولة الموقع في رصيدك.", "Tap “Done” once you've received the cash; the site's commission is added to your balance.")}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {o.allowedNext.map((to) => (
          <Button
            key={to}
            variant={DANGER.includes(to) ? "outline" : "default"}
            className={cn("rounded-xl font-bold", DANGER.includes(to) && "text-rose-600 border-rose-200")}
            disabled={setStatus.isPending}
            onClick={() => (NEEDS_REASON.includes(to) ? setPending(to) : run(to))}
          >
            {actionLabel(to, o.viewerRole, o.kind, lang)}
          </Button>
        ))}
      </div>

      <Dialog open={!!pending} onOpenChange={(v) => !v && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending && actionLabel(pending, o.viewerRole, o.kind, lang)}</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={pending === "disputed" ? tr("اشرحي المشكلة (مطلوب)", "Describe the problem (required)") : tr("السبب (اختياري، يراه الطرف الآخر)", "Reason (optional — the other side sees it)")}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>{tr("تراجع", "Back")}</Button>
            <Button
              disabled={setStatus.isPending || (pending === "disputed" && !reason.trim())}
              onClick={() => pending && run(pending, reason.trim())}
            >
              {tr("تأكيد", "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Prices({ o }: { o: BizOrderDetail }) {
  const { tr } = useLanguage();
  const seller = o.viewerRole !== "buyer";
  const row = (label: string, v: number, strong = false) => (
    <div className={cn("flex justify-between", strong && "font-bold text-base border-t border-border pt-2 mt-1")}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <Money halalas={v} className={strong ? "text-primary" : ""} />
    </div>
  );
  return (
    <Section title={tr("المبلغ", "Amount")}>
      <div className="space-y-1.5 text-sm">
        {row(tr("السعر", "Price"), o.subtotalHalalas)}
        {o.deliveryFeeHalalas > 0 && row(tr("التوصيل", "Delivery"), o.deliveryFeeHalalas)}
        {row(tr("رسوم الخدمة (المشتري)", "Service fee (buyer)"), o.buyerFeeHalalas)}
        {row(tr("يدفع المشتري نقدًا", "Buyer pays in cash"), o.totalHalalas, true)}
        {seller && (
          <div className="mt-3 rounded-lg bg-muted/60 p-3 space-y-1.5">
            {row(tr("عمولة الموقع من المشتري", "Site fee from buyer"), o.buyerFeeHalalas)}
            {row(tr("عمولة الموقع من البائع", "Site fee from seller"), o.sellerFeeHalalas)}
            {row(tr("صافي البائع", "Seller keeps"), o.subtotalHalalas + o.deliveryFeeHalalas - o.sellerFeeHalalas, true)}
          </div>
        )}
      </div>
    </Section>
  );
}

function Timeline({ o }: { o: BizOrderDetail }) {
  const { lang, tr } = useLanguage();
  const who = { buyer: tr("المشتري", "Buyer"), provider: tr("مقدّم الخدمة", "Provider"), admin: tr("الإدارة", "Admin") };
  return (
    <Section title={tr("سجل الطلب", "History")}>
      <ol className="space-y-3">
        {o.events.map((e) => (
          <li key={e.id} className="flex gap-3">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
            <div className="text-sm">
              <p className="font-bold">{STATUS_LABELS[e.toStatus as BizOrderStatus]?.[lang] ?? e.toStatus}</p>
              <p className="text-xs text-muted-foreground">{who[e.actorRole]} · {dateTime(e.createdAt, lang)}</p>
              {e.note && <p className="text-xs mt-0.5">{e.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Review({ o }: { o: BizOrderDetail }) {
  const { lang, tr } = useLanguage();
  const { toast } = useToast();
  const review = useReviewBizOrder();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (o.review) {
    return (
      <Section title={tr("تقييمك", "Your review")}>
        <StarPicker value={o.review.rating} onChange={() => {}} />
        {o.review.comment && <p className="text-sm mt-2">{o.review.comment}</p>}
      </Section>
    );
  }
  return (
    <Section title={tr("قيّمي التجربة", "Rate this order")}>
      <div className="space-y-3">
        <StarPicker value={rating} onChange={setRating} />
        <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={tr("اكتبي رأيك (اختياري)", "Your comment (optional)")} />
        <Button
          className="w-full rounded-xl font-bold"
          disabled={review.isPending}
          onClick={() =>
            review.mutate(
              { id: o.id, data: { rating, comment: comment.trim() || null } },
              {
                onSuccess: () => {
                  invalidateApi(`/api/biz/orders`, `/api/biz/providers/${o.providerId}`);
                  toast({ title: tr("شكرًا لتقييمك", "Thanks for your review") });
                },
                onError: (err) => toast({ variant: "destructive", title: errorText(err, lang) }),
              },
            )
          }
        >
          {tr("إرسال التقييم", "Send review")}
        </Button>
      </div>
    </Section>
  );
}

function Chat({ o }: { o: BizOrderDetail }) {
  const { lang, tr } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const messages = useListBizOrderMessages(o.id, undefined, { query: { refetchInterval: 5_000 } });
  const send = useSendBizOrderMessage();
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const closed = o.status === "declined" || o.status === "cancelled";
  const canPost = o.viewerRole !== "admin" && !closed;

  useEffect(() => bottom.current?.scrollIntoView({ block: "nearest" }), [messages.data?.length]);

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    send.mutate(
      { id: o.id, data: { body } },
      {
        onSuccess: () => {
          setText("");
          messages.refetch();
        },
        onError: (err) => toast({ variant: "destructive", title: errorText(err, lang) }),
      },
    );
  };

  return (
    <Section title={tr("المحادثة", "Chat")}>
      <div className="h-72 overflow-y-auto rounded-lg bg-muted/40 p-3 space-y-2">
        {messages.data?.length ? (
          messages.data.map((m) => {
            const mine = m.senderUserId === user?.id;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-start" : "justify-end")}>
                <div className={cn("max-w-[80%] rounded-lg px-3.5 py-2 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-card border border-card-border")}>
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                  <p className={cn("text-[10px] mt-1", mine ? "text-white/60" : "text-muted-foreground")}>{timeOnly(m.createdAt, lang)}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center pt-24">{tr("لا توجد رسائل بعد.", "No messages yet.")}</p>
        )}
        <div ref={bottom} />
      </div>
      {canPost ? (
        <form
          className="flex gap-2 mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={tr("اكتبي رسالة…", "Write a message…")}
            className="min-h-10 resize-none"
          />
          <Button type="submit" size="icon" className="shrink-0 rounded-xl h-10 w-10" disabled={send.isPending || !text.trim()} aria-label={tr("إرسال", "Send")}>
            <Send className="w-4 h-4 rtl:rotate-180" />
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground mt-3">{o.viewerRole === "admin" ? tr("الإدارة تقرأ المحادثة فقط.", "Admins can read but not post.") : tr("الطلب مغلق.", "This order is closed.")}</p>
      )}
      {!["accepted", "on_the_way", "completed", "disputed"].includes(o.status) && canPost && (
        <p className="text-[11px] text-muted-foreground mt-2">{tr("لا يمكن مشاركة أرقام أو روابط قبل قبول الطلب — كل الاتفاقات تتم عبر الموقع.", "Numbers and links can't be shared before acceptance — every deal stays on the site.")}</p>
      )}
    </Section>
  );
}
