import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import Home from "@/pages/home";
import About from "@/pages/about";
import Beliefs from "@/pages/beliefs";
import Leadership from "@/pages/leadership";
import Connect from "@/pages/connect";
import LiveStream from "@/pages/live";
import Give from "@/pages/give";
import Events from "@/pages/events";
import MinistriesPage from "@/pages/ministries";
import NotFound from "@/pages/not-found";

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
      <Route path="/events" component={Events} />
      <Route path="/ministries" component={MinistriesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
