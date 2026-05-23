import { Link, useLocation } from "wouter";
import {
  useGetMe, useListPendingArticles, useListArticles, useListNewsletters,
  useGetStats, useApproveArticle, useDeleteArticle,
  getGetMeQueryKey, getListPendingArticlesQueryKey, getListArticlesQueryKey,
  getListNewslettersQueryKey, getGetStatsQueryKey, getListSubscribedArticlesQueryKey,
  useListSubscribedArticles, useGetMySubscriptions, getGetMySubscriptionsQueryKey,
} from "@workspace/api-client-react";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Trash2, PenLine, Clock, BookOpen, TrendingUp, Users, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function StatBox({ label, value, color = "text-foreground" }: { label: string; value: number; color?: string }) {
  return (
    <div className="border border-border bg-card p-5">
      <div className={`font-serif text-4xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

function EditorDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: pending, isLoading } = useListPendingArticles({ query: { queryKey: getListPendingArticlesQueryKey() } });
  const { data: stats } = useGetStats({ query: { queryKey: getGetStatsQueryKey() } });
  const approveMutation = useApproveArticle();
  const deleteMutation = useDeleteArticle();

  const handleApprove = (articleId: number, approved: boolean) => {
    approveMutation.mutate({ articleId, data: { approved } }, {
      onSuccess: () => {
        toast({ title: approved ? "Article approved and published" : "Article rejected" });
        queryClient.invalidateQueries({ queryKey: getListPendingArticlesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  };

  const handleDelete = (articleId: number) => {
    if (!confirm("Delete this article?")) return;
    deleteMutation.mutate({ articleId }, {
      onSuccess: () => {
        toast({ title: "Article deleted" });
        queryClient.invalidateQueries({ queryKey: getListPendingArticlesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      },
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold">Editor Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and approve articles before they go live.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatBox label="Pending Review" value={stats.pendingArticles} color="text-amber-600" />
          <StatBox label="Published" value={stats.approvedArticles} color="text-green-600" />
          <StatBox label="Total Articles" value={stats.totalArticles} />
          <StatBox label="Journalists" value={stats.totalJournalists} />
        </div>
      )}

      <div>
        <h2 className="font-serif text-xl font-bold border-l-4 border-primary pl-3 mb-4">
          Pending Articles {pending && pending.length > 0 && (
            <Badge className="ml-2 bg-amber-100 text-amber-800 text-xs font-medium">{pending.length}</Badge>
          )}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : !pending || pending.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border">
            <Check className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">All articles reviewed. Nothing pending.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {pending.map((article) => (
              <div key={article.id} className="flex items-start justify-between py-4 border-b border-border" data-testid={`pending-article-${article.id}`}>
                <div className="flex-1 pr-6">
                  <Link href={`/articles/${article.id}`}>
                    <h3 className="font-serif font-bold hover:text-primary cursor-pointer transition-colors">{article.title}</h3>
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <Link href={`/journalists/${article.authorId}`} className="font-medium hover:text-primary transition-colors">
                      {article.authorName}
                    </Link>
                    {article.publisherName && <span>· {article.publisherName}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1.5 line-clamp-2">{article.content.slice(0, 140)}...</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(article.id, true)}
                    disabled={approveMutation.isPending}
                    className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                    data-testid={`btn-approve-${article.id}`}
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(article.id, false)}
                    disabled={approveMutation.isPending}
                    className="gap-1 text-amber-600 border-amber-300"
                    data-testid={`btn-reject-${article.id}`}
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(article.id)}
                    disabled={deleteMutation.isPending}
                    className="text-destructive hover:text-destructive"
                    data-testid={`btn-delete-${article.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JournalistDashboard() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = currentUser?.id;

  const params = { authorId: userId, limit: 20, offset: 0 };
  const { data: articlesData, isLoading } = useListArticles(params, {
    query: { enabled: !!userId, queryKey: getListArticlesQueryKey(params) }
  });
  const { data: newsletters } = useListNewsletters(
    { authorId: userId },
    { query: { enabled: !!userId, queryKey: getListNewslettersQueryKey({ authorId: userId }) } }
  );

  const deleteMutation = useDeleteArticle();
  const articles = articlesData?.items ?? [];
  const approved = articles.filter(a => a.approved);
  const pending = articles.filter(a => !a.approved);

  const handleDeleteArticle = (articleId: number) => {
    if (!confirm("Delete this article?")) return;
    deleteMutation.mutate({ articleId }, {
      onSuccess: () => {
        toast({ title: "Article deleted" });
        queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your articles and newsletters.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/newsletters/new">
            <Button variant="outline" size="sm" className="gap-1.5" data-testid="btn-new-newsletter">
              <BookOpen className="h-3.5 w-3.5" /> Newsletter
            </Button>
          </Link>
          <Link href="/write">
            <Button size="sm" className="gap-1.5" data-testid="btn-write-article">
              <PenLine className="h-3.5 w-3.5" /> Write Article
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatBox label="Total Articles" value={articles.length} />
        <StatBox label="Published" value={approved.length} color="text-green-600" />
        <StatBox label="Pending Review" value={pending.length} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="font-serif text-xl font-bold border-l-4 border-primary pl-3 mb-4">My Articles</h2>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : articles.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-border">
              <p className="text-muted-foreground text-sm">You haven't written any articles yet.</p>
              <Link href="/write"><Button variant="outline" size="sm" className="mt-3">Write your first article</Button></Link>
            </div>
          ) : (
            <div className="space-y-1">
              {articles.map((article) => (
                <div key={article.id} className="flex items-start justify-between py-4 border-b border-border" data-testid={`my-article-${article.id}`}>
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/articles/${article.id}`}>
                        <h3 className="font-serif font-bold hover:text-primary cursor-pointer transition-colors">{article.title}</h3>
                      </Link>
                      <Badge variant="outline" className={`text-xs ${article.approved ? "text-green-600 border-green-300" : "text-amber-600 border-amber-300"}`}>
                        {article.approved ? "Published" : "Pending"}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}</span>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/write?edit=${article.id}`}>
                      <Button variant="ghost" size="sm" data-testid={`btn-edit-${article.id}`}><PenLine className="h-3.5 w-3.5" /></Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteArticle(article.id)} className="text-destructive hover:text-destructive" data-testid={`btn-delete-${article.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold border-l-4 border-primary pl-3 mb-4">My Newsletters</h2>
          {!newsletters || newsletters.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-border text-sm">
              <p className="text-muted-foreground">No newsletters yet.</p>
              <Link href="/newsletters/new"><Button variant="ghost" size="sm" className="mt-2 text-xs">Create one</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {newsletters.map((nl) => (
                <Link key={nl.id} href={`/newsletters/${nl.id}`} data-testid={`my-newsletter-${nl.id}`}>
                  <div className="py-3 border-b border-border cursor-pointer group">
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{nl.title}</h4>
                    <span className="text-xs text-muted-foreground">{nl.articleIds?.length ?? 0} articles</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReaderDashboard() {
  const { data: subscribed, isLoading } = useListSubscribedArticles({ query: { queryKey: getListSubscribedArticlesQueryKey() } });
  const { data: mySubscriptions } = useGetMySubscriptions({ query: { queryKey: getGetMySubscriptionsQueryKey() } });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold">My Feed</h1>
        <p className="text-muted-foreground text-sm mt-1">Articles from journalists and publishers you follow.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatBox label="Following Publishers" value={mySubscriptions?.publishers?.length ?? 0} />
        <StatBox label="Following Journalists" value={mySubscriptions?.journalists?.length ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="font-serif text-xl font-bold border-l-4 border-primary pl-3 mb-4">Your Feed</h2>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : !subscribed || subscribed.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border">
              <p className="text-muted-foreground text-sm">Your feed is empty.</p>
              <p className="text-muted-foreground text-xs mt-1">Follow journalists and publishers to see their articles here.</p>
              <div className="flex gap-2 justify-center mt-4">
                <Link href="/publishers"><Button variant="outline" size="sm">Browse Publishers</Button></Link>
                <Link href="/articles"><Button variant="outline" size="sm">Browse Articles</Button></Link>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {subscribed.map((article) => (
                <Link key={article.id} href={`/articles/${article.id}`} data-testid={`feed-article-${article.id}`}>
                  <div className="group py-4 border-b border-border cursor-pointer">
                    {article.publisherName && (
                      <span className="text-primary text-xs font-semibold uppercase tracking-wider">{article.publisherName}</span>
                    )}
                    <h3 className="font-serif font-bold group-hover:text-primary transition-colors mt-0.5">{article.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{article.authorName}</span>
                      <span>· {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {mySubscriptions?.publishers && mySubscriptions.publishers.length > 0 && (
            <div>
              <h3 className="font-serif text-base font-bold border-l-4 border-primary pl-3 mb-3">Publishers I Follow</h3>
              <div className="space-y-1">
                {mySubscriptions.publishers.map((p) => (
                  <Link key={p.id} href={`/publishers/${p.id}`} data-testid={`subscribed-publisher-${p.id}`}>
                    <div className="py-2 border-b border-border text-sm font-medium hover:text-primary transition-colors cursor-pointer">{p.name}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {mySubscriptions?.journalists && mySubscriptions.journalists.length > 0 && (
            <div>
              <h3 className="font-serif text-base font-bold border-l-4 border-primary pl-3 mb-3">Journalists I Follow</h3>
              <div className="space-y-1">
                {mySubscriptions.journalists.map((j) => (
                  <Link key={j.id} href={`/journalists/${j.id}`} data-testid={`subscribed-journalist-${j.id}`}>
                    <div className="py-2 border-b border-border text-sm font-medium hover:text-primary transition-colors cursor-pointer">{j.username}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <PageLayout>
      {currentUser?.role === "editor" && <EditorDashboard />}
      {currentUser?.role === "journalist" && <JournalistDashboard />}
      {currentUser?.role === "reader" && <ReaderDashboard />}
    </PageLayout>
  );
}
