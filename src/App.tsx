import { QueryClientProvider } from "@tanstack/react-query";
import { Link, Route, Switch } from "wouter";
import { Compass } from "lucide-react";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { Toaster } from "@/components/ui/toaster";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { EmptyState, RequireAuth } from "@/components/common";
import { Button } from "@/components/ui/button";
import Home from "@/pages/Home";
import SearchPage from "@/pages/Search";
import ListingPage from "@/pages/Listing";
import ProviderPage from "@/pages/Provider";
import OrdersPage from "@/pages/Orders";
import OrderDetailPage from "@/pages/OrderDetail";
import { LoginPage, RegisterPage } from "@/pages/Auth";
import ApplyPage from "@/pages/provider/Apply";
import ProviderPanel from "@/pages/provider/Panel";
import AdminPage from "@/pages/admin/Admin";

function NotFound() {
  const { tr } = useLanguage();
  return (
    <EmptyState
      icon={Compass}
      title={tr("الصفحة غير موجودة", "Page not found")}
      action={<Button asChild><Link href="/">{tr("الرئيسية", "Home")}</Link></Button>}
    />
  );
}

const authed = (C: () => React.ReactNode) => () => <RequireAuth><C /></RequireAuth>;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <SiteLayout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/search" component={SearchPage} />
              <Route path="/listings/:id" component={ListingPage} />
              <Route path="/providers/:id" component={ProviderPage} />
              <Route path="/login" component={LoginPage} />
              <Route path="/register" component={RegisterPage} />
              <Route path="/orders" component={authed(OrdersPage)} />
              <Route path="/orders/:id" component={authed(OrderDetailPage)} />
              <Route path="/provider/apply" component={authed(ApplyPage)} />
              <Route path="/provider" component={authed(ProviderPanel)} />
              <Route path="/admin" component={authed(AdminPage)} />
              <Route component={NotFound} />
            </Switch>
          </SiteLayout>
          <Toaster />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
