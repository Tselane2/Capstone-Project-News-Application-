import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import HomePage from "@/pages/home";
import ArticlesPage from "@/pages/articles";
import ArticleDetailPage from "@/pages/article-detail";
import NewslettersPage from "@/pages/newsletters";
import NewsletterDetailPage from "@/pages/newsletter-detail";
import NewsletterNewPage from "@/pages/newsletter-new";
import PublishersPage from "@/pages/publishers";
import PublisherDetailPage from "@/pages/publisher-detail";
import JournalistProfilePage from "@/pages/journalist-profile";
import DashboardPage from "@/pages/dashboard";
import WritePage from "@/pages/write";
import ProfilePage from "@/pages/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/articles" component={ArticlesPage} />
      <Route path="/articles/:id" component={ArticleDetailPage} />
      <Route path="/newsletters/new" component={NewsletterNewPage} />
      <Route path="/newsletters/:id" component={NewsletterDetailPage} />
      <Route path="/newsletters" component={NewslettersPage} />
      <Route path="/publishers" component={PublishersPage} />
      <Route path="/publishers/:id" component={PublisherDetailPage} />
      <Route path="/journalists/:id" component={JournalistProfilePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/write" component={WritePage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
