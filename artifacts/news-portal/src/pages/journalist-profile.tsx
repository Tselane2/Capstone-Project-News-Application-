import { useParams, Link } from "wouter";
import { useGetUser, useListArticles, useListNewsletters, useSubscribeJournalist, useUnsubscribeJournalist, useGetMySubscriptions, getGetUserQueryKey, getListArticlesQueryKey, getListNewslettersQueryKey, getGetMySubscriptionsQueryKey } from "@workspace/api-client-react";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, Bell, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function JournalistProfilePage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetUser(userId, {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) }
  });

  const { data: articlesData } = useListArticles(
    { authorId: userId, limit: 20, offset: 0 },
    { query: { enabled: !!userId, queryKey: getListArticlesQueryKey({ authorId: userId, limit: 20, offset: 0 }) } }
  );

  const { data: newsletters } = useListNewsletters(
    { authorId: userId },
    { query: { enabled: !!userId, queryKey: getListNewslettersQueryKey({ authorId: userId }) } }
  );

  const { data: mySubscriptions } = useGetMySubscriptions({
    query: { enabled: currentUser?.role === "reader", queryKey: getGetMySubscriptionsQueryKey() }
  });

  const subscribeMutation = useSubscribeJournalist();
  const unsubscribeMutation = useUnsubscribeJournalist();

  const isSubscribed = mySubscriptions?.journalists?.some(j => j.id === userId) ?? false;

  const articles = articlesData?.items ?? [];

  const handleSubscription = () => {
    if (isSubscribed) {
      unsubscribeMutation.mutate({ journalistId: userId }, {
        onSuccess: () => {
          toast({ title: "Unsubscribed" });
          queryClient.invalidateQueries({ queryKey: getGetMySubscriptionsQueryKey() });
        },
      });
    } else {
      subscribeMutation.mutate({ journalistId: userId }, {
        onSuccess: () => {
          toast({ title: "Subscribed to journalist" });
          queryClient.invalidateQueries({ queryKey: getGetMySubscriptionsQueryKey() });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-16 w-full mb-4" />
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">User not found.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground mb-6" onClick={() => history.back()}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex items-start justify-between mb-8 pb-8 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold font-serif">
            {user.username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold" data-testid="text-username">{user.username}</h1>
            <Badge variant="outline" className="text-xs mt-1">{user.role}</Badge>
            {user.bio && <p className="text-muted-foreground text-sm mt-2 max-w-md">{user.bio}</p>}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{user.articleCount} articles</span>
              <span>{user.newsletterCount} newsletters</span>
            </div>
          </div>
        </div>

        {currentUser?.role === "reader" && currentUser.id !== userId && (
          <Button
            onClick={handleSubscription}
            variant={isSubscribed ? "outline" : "default"}
            size="sm"
            className="gap-1.5"
            disabled={subscribeMutation.isPending || unsubscribeMutation.isPending}
            data-testid="btn-subscribe-journalist"
          >
            {isSubscribed ? <><BellOff className="h-3.5 w-3.5" /> Unsubscribe</> : <><Bell className="h-3.5 w-3.5" /> Subscribe</>}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="font-serif text-xl font-bold border-l-4 border-primary pl-3 mb-4">Articles</h2>
          {articles.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center border border-dashed border-border">No published articles yet.</p>
          ) : (
            <div className="space-y-1">
              {articles.map((article) => (
                <Link key={article.id} href={`/articles/${article.id}`} data-testid={`card-article-${article.id}`}>
                  <div className="group flex items-start justify-between py-4 border-b border-border cursor-pointer">
                    <div className="flex-1 pr-4">
                      <h3 className="font-serif font-bold group-hover:text-primary transition-colors">{article.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{article.content.slice(0, 100)}...</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold border-l-4 border-primary pl-3 mb-4">Newsletters</h2>
          {!newsletters || newsletters.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center border border-dashed border-border text-xs">No newsletters yet.</p>
          ) : (
            <div className="space-y-2">
              {newsletters.map((nl) => (
                <Link key={nl.id} href={`/newsletters/${nl.id}`} data-testid={`link-newsletter-${nl.id}`}>
                  <div className="group py-3 border-b border-border cursor-pointer">
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{nl.title}</h4>
                    <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{nl.description}</p>
                    <span className="text-xs text-muted-foreground">{nl.articleIds?.length ?? 0} articles</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
