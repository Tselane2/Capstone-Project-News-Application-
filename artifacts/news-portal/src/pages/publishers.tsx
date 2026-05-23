import { Link } from "wouter";
import { useListPublishers, getListPublishersQueryKey } from "@workspace/api-client-react";
import { PageLayout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FileText } from "lucide-react";

export default function PublishersPage() {
  const { data: publishers, isLoading } = useListPublishers({ query: { queryKey: getListPublishersQueryKey() } });

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold">Publishers</h1>
        <p className="text-muted-foreground text-sm mt-1">Media organizations and publications on The Press Room.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : !publishers || publishers.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border">
          <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No publishers yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishers.map((pub) => (
            <Link key={pub.id} href={`/publishers/${pub.id}`} data-testid={`card-publisher-${pub.id}`}>
              <div className="group cursor-pointer border border-border bg-card hover:shadow-md transition-shadow p-6 h-full">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-bold group-hover:text-primary transition-colors">
                  {pub.name}
                </h3>
                <p className="text-muted-foreground text-sm mt-2 line-clamp-3 leading-relaxed">{pub.description}</p>
                <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  {pub.articleCount} published article{pub.articleCount !== 1 ? "s" : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
