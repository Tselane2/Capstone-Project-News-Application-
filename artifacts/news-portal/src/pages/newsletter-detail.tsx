import { useParams, Link } from "wouter";
import { useGetNewsletter, useDeleteNewsletter, getGetNewsletterQueryKey, getListNewslettersQueryKey } from "@workspace/api-client-react";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Calendar, Clock, Trash2, Pencil } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function NewsletterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const newsletterId = Number(id);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: newsletter, isLoading } = useGetNewsletter(newsletterId, {
    query: { enabled: !!newsletterId, queryKey: getGetNewsletterQueryKey(newsletterId) }
  });

  const deleteMutation = useDeleteNewsletter();

  const canEdit = currentUser && (currentUser.id === newsletter?.authorId || currentUser.role === "editor");

  const handleDelete = () => {
    if (!confirm("Delete this newsletter?")) return;
    deleteMutation.mutate({ newsletterId }, {
      onSuccess: () => {
        toast({ title: "Newsletter deleted" });
        queryClient.invalidateQueries({ queryKey: getListNewslettersQueryKey({}) });
        setLocation("/newsletters");
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-24 mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
        </div>
      </PageLayout>
    );
  }

  if (!newsletter) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Newsletter not found.</p>
          <Link href="/newsletters"><Button variant="outline" className="mt-4">Back to newsletters</Button></Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/newsletters">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> Newsletters
            </Button>
          </Link>
          {canEdit && (
            <Button size="sm" variant="ghost" onClick={handleDelete} disabled={deleteMutation.isPending}
              className="text-destructive hover:text-destructive gap-1.5" data-testid="btn-delete-newsletter">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          )}
        </div>

        <h1 className="font-serif text-4xl font-bold leading-tight" data-testid="text-newsletter-title">{newsletter.title}</h1>

        <div className="flex items-center gap-4 mt-4 pb-6 border-b border-border text-sm text-muted-foreground">
          <Link href={`/journalists/${newsletter.authorId}`} className="font-medium text-foreground hover:text-primary transition-colors" data-testid="link-author">
            By {newsletter.authorName}
          </Link>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {format(new Date(newsletter.createdAt), "MMMM d, yyyy")}
          </span>
        </div>

        <p className="text-muted-foreground mt-6 text-base leading-relaxed">{newsletter.description}</p>

        {newsletter.articles && newsletter.articles.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-xl font-bold border-l-4 border-primary pl-3 mb-4">
              Articles in this Newsletter ({newsletter.articles.length})
            </h2>
            <div className="space-y-1">
              {newsletter.articles.map((article: any) => (
                <Link key={article.id} href={`/articles/${article.id}`} data-testid={`link-article-${article.id}`}>
                  <div className="group flex items-start justify-between py-4 border-b border-border cursor-pointer">
                    <div className="flex-1 pr-4">
                      <h3 className="font-serif font-bold group-hover:text-primary transition-colors leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{article.content.slice(0, 100)}...</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {(!newsletter.articles || newsletter.articles.length === 0) && (
          <div className="mt-8 py-12 text-center border border-dashed border-border">
            <p className="text-muted-foreground text-sm">No articles in this newsletter yet.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
