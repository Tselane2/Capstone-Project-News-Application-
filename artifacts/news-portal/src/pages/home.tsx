import { Link } from "wouter";
import { useListArticles, useGetStats, useGetRecentActivity, useListPublishers, getListArticlesQueryKey, getGetStatsQueryKey, getGetRecentActivityQueryKey, getListPublishersQueryKey } from "@workspace/api-client-react";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Building2, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth";

function ArticleCard({ article, featured = false }: { article: any; featured?: boolean }) {
  return (
    <Link href={`/articles/${article.id}`} data-testid={`card-article-${article.id}`}>
      <div className={`group cursor-pointer ${featured ? "border-b border-border pb-6" : "border-b border-border py-4 last:border-0"}`}>
        {article.publisherName && (
          <span className="text-primary text-xs font-semibold uppercase tracking-wider">{article.publisherName}</span>
        )}
        <h3 className={`font-serif font-bold group-hover:text-primary transition-colors leading-snug mt-1 ${featured ? "text-2xl" : "text-base"}`}>
          {article.title}
        </h3>
        <p className={`text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed ${featured ? "text-sm" : "text-xs"}`}>
          {article.content.slice(0, 140)}...
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="font-medium">{article.authorName}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-4 border-r border-border last:border-0">
      <div className="font-serif text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { data: articlesData, isLoading: articlesLoading } = useListArticles(
    { limit: 8, offset: 0 },
    { query: { queryKey: getListArticlesQueryKey({ limit: 8, offset: 0 }) } }
  );
  const { data: stats } = useGetStats({ query: { queryKey: getGetStatsQueryKey() } });
  const { data: activity } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });
  const { data: publishers } = useListPublishers({ query: { queryKey: getListPublishersQueryKey() } });

  const articles = articlesData?.items ?? [];
  const featured = articles[0];
  const rest = articles.slice(1, 7);

  return (
    <PageLayout>
      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-4 border border-border mb-8 bg-card">
          <StatCard label="Articles Published" value={stats.approvedArticles} />
          <StatCard label="Newsletters" value={stats.totalNewsletters} />
          <StatCard label="Journalists" value={stats.totalJournalists} />
          <StatCard label="Publishers" value={stats.totalPublishers} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold border-l-4 border-primary pl-3">Latest News</h2>
            <Link href="/articles">
              <Button variant="ghost" size="sm" className="gap-1 text-sm text-primary hover:text-primary" data-testid="link-all-articles">
                All articles <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {articlesLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : articles.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border">
              <p className="text-muted-foreground text-sm">No articles published yet.</p>
              {!isAuthenticated && (
                <Link href="/register">
                  <Button variant="outline" size="sm" className="mt-3">Join as a Journalist</Button>
                </Link>
              )}
            </div>
          ) : (
            <div>
              {featured && <ArticleCard article={featured} featured />}
              <div className="mt-2">
                {rest.map(a => <ArticleCard key={a.id} article={a} />)}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Activity feed */}
          {activity && activity.length > 0 && (
            <div>
              <h3 className="font-serif text-base font-bold border-l-4 border-primary pl-3 mb-3">
                <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Activity</span>
              </h3>
              <div className="space-y-3">
                {activity.slice(0, 6).map((item) => (
                  <div key={item.id} className="text-sm border-b border-border pb-3 last:border-0" data-testid={`activity-item-${item.id}`}>
                    <div className="text-xs text-primary font-semibold uppercase tracking-wide mb-0.5">
                      {item.type === "article_published" ? "Published" : item.type === "article_created" ? "New Article" : item.type === "newsletter_created" ? "Newsletter" : "Approved"}
                    </div>
                    <p className="font-medium text-foreground leading-snug line-clamp-2">{item.title}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.actorName} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publishers */}
          {publishers && publishers.length > 0 && (
            <div>
              <h3 className="font-serif text-base font-bold border-l-4 border-primary pl-3 mb-3">
                <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Publishers</span>
              </h3>
              <div className="space-y-2">
                {publishers.slice(0, 5).map((pub) => (
                  <Link key={pub.id} href={`/publishers/${pub.id}`} data-testid={`link-publisher-${pub.id}`}>
                    <div className="flex items-center justify-between py-2 border-b border-border last:border-0 group cursor-pointer">
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">{pub.name}</span>
                      <span className="text-xs text-muted-foreground">{pub.articleCount} articles</span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/publishers">
                <Button variant="outline" size="sm" className="w-full mt-3 text-xs">View all publishers</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
