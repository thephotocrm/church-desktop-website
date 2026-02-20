import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { MemberAuthProvider } from "@/components/member-auth-provider";
import { Navigation } from "@/components/navigation";
import { LiveBanner } from "@/components/live-banner";
import { Footer } from "@/components/footer";
import Home from "@/pages/home";
import About from "@/pages/about";
import Beliefs from "@/pages/beliefs";
import Leadership from "@/pages/leadership";
import Connect from "@/pages/connect";
import LiveStream from "@/pages/live";
import Give from "@/pages/give";
import GivingHistory from "@/pages/giving-history";
import Events from "@/pages/events";
import MinistriesPage from "@/pages/ministries";
import Login from "@/pages/login";
import Admin from "@/pages/admin";
import Prayer from "@/pages/prayer";
import Register from "@/pages/register";
import MemberLogin from "@/pages/member-login";
import Profile from "@/pages/profile";
import Directory from "@/pages/directory";
import Groups from "@/pages/groups";
import PastStreams from "@/pages/past-streams";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/beliefs" component={Beliefs} />
      <Route path="/leadership" component={Leadership} />
      <Route path="/connect" component={Connect} />
      <Route path="/live" component={LiveStream} />
      <Route path="/give" component={Give} />
      <Route path="/giving-history" component={GivingHistory} />
      <Route path="/events" component={Events} />
      <Route path="/ministries" component={MinistriesPage} />
      <Route path="/prayer" component={Prayer} />
      <Route path="/register" component={Register} />
      <Route path="/member-login" component={MemberLogin} />
      <Route path="/profile" component={Profile} />
      <Route path="/directory" component={Directory} />
      <Route path="/groups" component={Groups} />
      <Route path="/past-streams" component={PastStreams} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/login" component={Login} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [location] = useLocation();
  const isAdminRoute = location === "/login" || location === "/admin";
  const isMemberAuthRoute = location === "/member-login" || location === "/register";

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      {!isAdminRoute && !isMemberAuthRoute && <Navigation />}
      {!isAdminRoute && !isMemberAuthRoute && <LiveBanner />}
      <main className="flex-1">
        <Router />
      </main>
      {!isAdminRoute && !isMemberAuthRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MemberAuthProvider>
          <TooltipProvider>
            <AppLayout />
            <Toaster />
          </TooltipProvider>
        </MemberAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
