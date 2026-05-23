import { useState } from "react";
import { Link } from "wouter";
import { useListArticles, useListPublishers, getListArticlesQueryKey, getListPublishersQueryKey } from "@workspace/api-client-react";
import { PageLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const PAGE_SIZE = 12;

export default function ArticlesPage() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [publisherFilter, setPublisherFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const params = {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(publisherFilter !== "all" ? { publisherId: Number(publisherFilter) } : {}),
  };

  const { data, isLoading } = useListArticles(params, { query: { queryKey: getListArticlesQueryKey(params) } });
  const { data: publishers } = useListPublishers({ query: { queryKey: getListPublishersQueryKey() } });

  const articles = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold">Articles</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse all published, editor-approved articles.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" data-testid="btn-search">Search</Button>
        </form>
        <Select value={publisherFilter} onValueChange={(v) => { setPublisherFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48" data-testid="select-publisher">
            <SelectValue placeholder="All publishers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All publishers</SelectItem>
            {publishers?.map(p => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground mb-4">{total} article{total !== 1 ? "s" : ""} found</p>
      )}

      {/* Articles grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border">
          <p className="text-muted-foreground">No articles found.</p>
          {(search || publisherFilter !== "all") && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSearch(""); setSearchInput(""); setPublisherFilter("all"); }}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link key={article.id} href={`/articles/${article.id}`} data-testid={`card-article-${article.id}`}>
              <div className="group cursor-pointer border border-border bg-card hover:shadow-md transition-shadow p-5">
                {article.publisherName && (
                  <span className="text-primary text-xs font-semibold uppercase tracking-wider">{article.publisherName}</span>
                )}
                <h3 className="font-serif font-bold text-lg leading-snug mt-1 group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-muted-foreground text-sm mt-2 line-clamp-3 leading-relaxed">
                  {article.content.slice(0, 120)}...
                </p>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{article.authorName}</span>
                  <span>·</span>
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} data-testid="btn-prev-page">
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} data-testid="btn-next-page">
            Next
          </Button>
        </div>
      )}
    </PageLayout>
  );
}
