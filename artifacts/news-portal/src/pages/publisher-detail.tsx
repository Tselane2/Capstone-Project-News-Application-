import { useParams, Link } from "wouter";
import { useGetPublisher, useListArticles, getGetPublisherQueryKey, getListArticlesQueryKey } from "@workspace/api-client-react";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, Clock, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PublisherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const publisherId = Number(id);

  const { data: publisher, isLoading: pubLoading } = useGetPublisher(publisherId, {
    query: { enabled: !!publisherId, queryKey: getGetPublisherQueryKey(publisherId) }
  });

  const { data: articlesData, isLoading: artLoading } = useListArticles(
    { publisherId, limit: 20, offset: 0 },
    { query: { enabled: !!publisherId, queryKey: getListArticlesQueryKey({ publisherId, limit: 20, offset: 0 }) } }
  );

  const articles = articlesData?.items ?? [];

  if (pubLoading) {
    return (
      <PageLayout>
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-4 w-2/3 mb-8" />
      </PageLayout>
    );
  }

  if (!publisher) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Publisher not found.</p>
          <Link href="/publishers"><Button variant="outline" className="mt-4">Back to publishers</Button></Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Link href="/publishers">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Publishers
        </Button>
      </Link>

      <div className="flex items-start gap-4 mb-8 pb-8 border-b border-border">
        <div className="w-14 h-14 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold" data-testid="text-publisher-name">{publisher.name}</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">{publisher.description}</p>
          <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {publisher.articleCount} published article{publisher.articleCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <h2 className="font-serif text-xl font-bold border-l-4 border-primary pl-3 mb-4">Articles</h2>
      {artLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-border">
          <p className="text-muted-foreground text-sm">No published articles yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {articles.map((article) => (
            <Link key={article.id} href={`/articles/${article.id}`} data-testid={`card-article-${article.id}`}>
              <div className="group flex items-start justify-between py-4 border-b border-border cursor-pointer">
                <div className="flex-1 pr-4">
                  <h3 className="font-serif font-bold group-hover:text-primary transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{article.content.slice(0, 100)}...</p>
                  <span className="text-xs text-muted-foreground mt-1 block">{article.authorName}</span>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
