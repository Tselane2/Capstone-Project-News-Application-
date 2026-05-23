import { useParams, Link, useLocation } from "wouter";
import { useGetArticle, useDeleteArticle, useApproveArticle, getGetArticleQueryKey, getListPendingArticlesQueryKey, getListArticlesQueryKey } from "@workspace/api-client-react";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, User, Check, X, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const articleId = Number(id);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: article, isLoading } = useGetArticle(articleId, {
    query: { enabled: !!articleId, queryKey: getGetArticleQueryKey(articleId) }
  });

  const deleteMutation = useDeleteArticle();
  const approveMutation = useApproveArticle();

  const canEdit = currentUser && (currentUser.id === article?.authorId || currentUser.role === "editor");
  const canApprove = currentUser?.role === "editor";

  const handleDelete = () => {
    if (!confirm("Delete this article?")) return;
    deleteMutation.mutate({ articleId }, {
      onSuccess: () => {
        toast({ title: "Article deleted" });
        queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });
        setLocation("/articles");
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const handleApprove = (approved: boolean) => {
    approveMutation.mutate({ articleId, data: { approved } }, {
      onSuccess: () => {
        toast({ title: approved ? "Article approved and published" : "Article rejected" });
        queryClient.invalidateQueries({ queryKey: getGetArticleQueryKey(articleId) });
        queryClient.invalidateQueries({ queryKey: getListPendingArticlesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });
      },
      onError: () => toast({ title: "Failed to update approval", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-24 mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!article) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-muted-foreground">Article not found.</p>
          <Link href="/articles"><Button variant="outline" className="mt-4">Back to articles</Button></Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/articles">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" data-testid="btn-back">
              <ArrowLeft className="h-4 w-4" /> Articles
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {!article.approved && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50" data-testid="badge-pending">
                Pending Review
              </Badge>
            )}
            {article.approved && (
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50" data-testid="badge-approved">
                Published
              </Badge>
            )}
            {canApprove && !article.approved && (
              <>
                <Button size="sm" onClick={() => handleApprove(true)} disabled={approveMutation.isPending} data-testid="btn-approve"
                  className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleApprove(false)} disabled={approveMutation.isPending} data-testid="btn-reject">
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              </>
            )}
            {canApprove && article.approved && (
              <Button size="sm" variant="outline" onClick={() => handleApprove(false)} disabled={approveMutation.isPending} data-testid="btn-unapprove">
                Unpublish
              </Button>
            )}
            {canEdit && (
              <>
                <Link href={`/write?edit=${articleId}`}>
                  <Button size="sm" variant="outline" className="gap-1" data-testid="btn-edit">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={handleDelete} disabled={deleteMutation.isPending} data-testid="btn-delete"
                  className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {article.publisherName && (
          <Link href={`/publishers/${article.publisherId}`}>
            <span className="text-primary text-xs font-semibold uppercase tracking-wider hover:underline cursor-pointer">
              {article.publisherName}
            </span>
          </Link>
        )}

        <h1 className="font-serif text-4xl font-bold mt-2 leading-tight" data-testid="text-article-title">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 mt-4 pb-6 border-b border-border text-sm text-muted-foreground">
          <Link href={`/journalists/${article.authorId}`} className="flex items-center gap-1.5 hover:text-primary transition-colors" data-testid="link-author">
            <User className="h-4 w-4" />
            {article.authorName}
          </Link>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {format(new Date(article.createdAt), "MMMM d, yyyy")}
          </span>
        </div>

        <div className="mt-8 prose prose-slate max-w-none">
          {article.content.split("\n\n").map((para, i) => (
            <p key={i} className="text-foreground leading-relaxed mb-4 text-base">{para}</p>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
