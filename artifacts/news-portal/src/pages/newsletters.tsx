import { Link, useLocation } from "wouter";
import { useListNewsletters, getListNewslettersQueryKey } from "@workspace/api-client-react";
import { PageLayout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, PenLine } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

export default function NewslettersPage() {
  const { currentUser } = useAuth();
  const [, navigate] = useLocation();
  const { data: newsletters, isLoading } = useListNewsletters({}, { query: { queryKey: getListNewslettersQueryKey({}) } });

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Newsletters</h1>
          <p className="text-muted-foreground text-sm mt-1">Curated collections from our journalists.</p>
        </div>
        {currentUser?.role === "journalist" && (
          <Link href="/newsletters/new">
            <Button className="gap-1.5" data-testid="btn-new-newsletter">
              <PenLine className="h-4 w-4" /> New Newsletter
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : !newsletters || newsletters.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No newsletters yet.</p>
          {currentUser?.role === "journalist" && (
            <Link href="/newsletters/new">
              <Button variant="outline" size="sm" className="mt-3">Create the first one</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {newsletters.map((nl) => (
            <div
              key={nl.id}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/newsletters/${nl.id}`)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/newsletters/${nl.id}`)}
              className="group cursor-pointer border border-border bg-card hover:shadow-md transition-shadow p-6"
              data-testid={`card-newsletter-${nl.id}`}
            >
              <h3 className="font-serif text-xl font-bold group-hover:text-primary transition-colors leading-snug">
                {nl.title}
              </h3>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed line-clamp-2">{nl.description}</p>
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <Link
                  href={`/journalists/${nl.authorId}`}
                  className="font-medium text-foreground hover:text-primary transition-colors"
                  data-testid={`link-author-${nl.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {nl.authorName}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {nl.articleIds?.length ?? 0} articles
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(nl.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
