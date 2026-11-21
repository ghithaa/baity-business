import { Redirect, useLocation } from "wouter";
import { BadgeCheck, CalendarClock, Wallet } from "lucide-react";
import { useApplyBizProvider } from "@/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBizMe } from "@/hooks/use-biz-me";
import { useToast } from "@/hooks/use-toast";
import { Loading, PageHeader, Section } from "@/components/common";
import { invalidateApi } from "@/lib/query-client";
import { errorText } from "@/lib/format";
import { ProviderForm } from "./ProviderForm";

export default function ApplyPage() {
  const { lang, tr } = useLanguage();
  const { provider, isLoading } = useBizMe();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const apply = useApplyBizProvider();

  if (isLoading) return <Loading />;
  if (provider) return <Redirect to="/provider" />;

  const steps = [
    { icon: BadgeCheck, text: tr("سجّلي بياناتك ووثيقة العمل الحر", "Enter your details and freelance document") },
    { icon: CalendarClock, text: tr("بعد الموافقة أضيفي عروضك وأوقات عملك", "Once approved, add your offers and hours") },
    { icon: Wallet, text: tr("استقبلي الطلبات واستلمي المبلغ نقدًا — عمولة الموقع 5% منك و5% من المشتري", "Take orders and collect cash — the site keeps 5% from you and 5% from the buyer") },
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader title={tr("قدّمي خدماتك على بيتي بزنس", "Sell your services on Baity Business")} subtitle={tr("للطبخ المنزلي، الحلويات، التنظيف، الصيانة، الخياطة وكل ما يخص البيت", "Home cooking, sweets, cleaning, repairs, sewing and everything for the home")} />
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {steps.map((s, i) => (
          <div key={i} className="rounded-lg bg-card border border-card-border p-4 shadow-card">
            <s.icon className="w-5 h-5 text-[hsl(var(--gold))] mb-2" />
            <p className="text-sm font-semibold">{s.text}</p>
          </div>
        ))}
      </div>
      <Section title={tr("بياناتك", "Your details")}>
        <ProviderForm
          submitLabel={tr("إرسال الطلب للمراجعة", "Send for review")}
          busy={apply.isPending}
          onSubmit={(data) =>
            apply.mutate(
              { data },
              {
                onSuccess: () => {
                  invalidateApi("/api/biz/me", "/api/biz/provider");
                  toast({ title: tr("تم إرسال طلبك", "Application sent"), description: tr("سنراجع وثيقتك ونبلغك هنا.", "We'll review your document and let you know here.") });
                  navigate("/provider");
                },
                onError: (err) => toast({ variant: "destructive", title: errorText(err, lang) }),
              },
            )
          }
        />
      </Section>
    </div>
  );
}
