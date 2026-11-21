import { ApiError, type BizCity, type BizOrderStatus } from "@/api-client";
import type { Lang } from "@/contexts/LanguageContext";

const RIYADH = "Asia/Riyadh";

/** Halalas → "125.50 ر.س" / "SAR 125.50". Whole riyals drop the decimals. */
export function money(halalas: number, lang: Lang): string {
  const sar = halalas / 100;
  const n = new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-SA", {
    minimumFractionDigits: Number.isInteger(sar) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(sar);
  return lang === "ar" ? `${n} ر.س` : `SAR ${n}`;
}

/** SAR typed in a form → halalas. */
export function toHalalas(sar: string | number): number {
  return Math.round(Number(sar) * 100);
}

export function dateTime(iso: string | Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-ca-gregory" : "en-GB", {
    timeZone: RIYADH,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function timeOnly(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
    timeZone: RIYADH,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function dayLabel(isoDay: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-ca-gregory" : "en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${isoDay}T00:00:00Z`));
}

/** Today in Riyadh plus `offset` days, as YYYY-MM-DD. */
export function riyadhDay(offset = 0): string {
  const now = new Date(Date.now() + 3 * 3600_000 + offset * 86_400_000);
  return now.toISOString().slice(0, 10);
}

/** "16:30" ↔ 990 minutes. */
export function minutesToClock(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
export function clockToMinutes(clock: string): number {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + (m || 0);
}

export const WEEKDAYS: { ar: string; en: string }[] = [
  { ar: "الأحد", en: "Sunday" },
  { ar: "الاثنين", en: "Monday" },
  { ar: "الثلاثاء", en: "Tuesday" },
  { ar: "الأربعاء", en: "Wednesday" },
  { ar: "الخميس", en: "Thursday" },
  { ar: "الجمعة", en: "Friday" },
  { ar: "السبت", en: "Saturday" },
];

export function cityName(cities: BizCity[] | undefined, id: string | null | undefined, lang: Lang): string {
  if (!id) return "";
  const c = cities?.find((x) => x.id === id);
  return c ? (lang === "ar" ? c.nameAr : c.nameEn) : id;
}

export const STATUS_LABELS: Record<BizOrderStatus, { ar: string; en: string; tone: string }> = {
  requested: { ar: "بانتظار القبول", en: "Awaiting acceptance", tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" },
  accepted: { ar: "مقبول", en: "Accepted", tone: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300" },
  on_the_way: { ar: "في الطريق", en: "On the way", tone: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300" },
  completed: { ar: "مكتمل", en: "Completed", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" },
  declined: { ar: "مرفوض", en: "Declined", tone: "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground" },
  cancelled: { ar: "ملغي", en: "Cancelled", tone: "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground" },
  disputed: { ar: "نزاع", en: "Disputed", tone: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300" },
};

export const UNIT_LABELS = {
  item: { ar: "للقطعة", en: "each" },
  visit: { ar: "للزيارة", en: "per visit" },
  hour: { ar: "للساعة", en: "per hour" },
} as const;

export const FULFILLMENT_LABELS = {
  pickup: { ar: "استلام من البائع", en: "Pickup" },
  delivery: { ar: "توصيل من البائع", en: "Seller delivers" },
  at_home: { ar: "في منزلك", en: "At your home" },
} as const;

// The API's error codes, in words a person can act on.
const ERROR_TEXT: Record<string, { ar: string; en: string }> = {
  SLOT_TAKEN: { ar: "هذا الموعد لم يعد متاحًا، اختاري موعدًا آخر.", en: "That time is no longer free — pick another." },
  OUT_OF_STOCK: { ar: "الكمية المتوفرة لا تكفي.", en: "Not enough left in stock." },
  PROVIDER_UNAVAILABLE: { ar: "مقدّم الخدمة لا يستقبل طلبات حاليًا.", en: "This provider isn't taking orders right now." },
  PROVIDER_BLOCKED: { ar: "سدّدي المستحقات المتأخرة لاستقبال طلبات جديدة.", en: "Settle your balance to take new orders." },
  CITY_NOT_SERVED: { ar: "مقدّم الخدمة لا يغطي مدينتك.", en: "This provider doesn't cover your city." },
  ADDRESS_REQUIRED: { ar: "اكتبي العنوان.", en: "Enter the address." },
  TIME_REQUIRED: { ar: "اختاري موعد الزيارة.", en: "Pick a time for the visit." },
  OWN_LISTING: { ar: "لا يمكنك الطلب من نفسك.", en: "You can't order from yourself." },
  CONTACT_NOT_ALLOWED: { ar: "لا يمكن مشاركة أرقام الجوال أو الروابط أو البريد قبل قبول الطلب — كل الاتفاقات تتم عبر الموقع.", en: "Phone numbers, links and e-mails can be shared once the order is accepted — every deal stays on the site." },
  DOC_EXPIRED: { ar: "وثيقة العمل الحر منتهية.", en: "The freelance document has expired." },
  ALREADY_PROVIDER: { ar: "لديك ملف مقدّم خدمة بالفعل.", en: "You already have a provider profile." },
  BAD_TRANSITION: { ar: "لا يمكن تنفيذ هذا الإجراء الآن.", en: "That action isn't possible now." },
  ORDER_CHANGED: { ar: "تغيّر الطلب للتو، حدّثي الصفحة.", en: "The order just changed — refresh." },
  REASON_REQUIRED: { ar: "اكتبي السبب.", en: "Please give a reason." },
  DISPUTE_WINDOW_CLOSED: { ar: "انتهت مدة فتح النزاع (7 أيام).", en: "The 7-day dispute window has closed." },
  ALREADY_REVIEWED: { ar: "قيّمتِ هذا الطلب من قبل.", en: "You already reviewed this order." },
  KIND_MISMATCH: { ar: "هذا التصنيف لا يقبل هذا النوع.", en: "This category doesn't take that kind." },
  NO_FULFILLMENT: { ar: "اختاري الاستلام أو التوصيل أو كليهما.", en: "Offer pickup, delivery or both." },
  DURATION_REQUIRED: { ar: "حدّدي مدة الخدمة.", en: "Set the service duration." },
  PROVIDER_SUSPENDED: { ar: "الحساب موقوف، تواصلي مع الدعم.", en: "This account is suspended — contact support." },
  ORDER_CLOSED: { ar: "هذا الطلب مغلق.", en: "This order is closed." },
};

/** A human message for any thrown API error. */
export function errorText(err: unknown, lang: Lang): string {
  if (err instanceof ApiError) {
    const data = err.data as { code?: string; error?: string; details?: { message: string }[] } | null;
    const known = data?.code ? ERROR_TEXT[data.code] : undefined;
    if (known) return known[lang];
    if (data?.details?.length) return data.details.map((d) => d.message).join(" · ");
    if (data?.error) return data.error;
    if (err.status === 401) return lang === "ar" ? "سجّلي الدخول أولًا." : "Please sign in first.";
  }
  return lang === "ar" ? "حدث خطأ، حاولي مرة أخرى." : "Something went wrong — try again.";
}
