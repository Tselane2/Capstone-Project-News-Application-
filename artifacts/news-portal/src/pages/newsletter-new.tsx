import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  useCreateNewsletter, useListArticles,
  getListNewslettersQueryKey, getListArticlesQueryKey,
} from "@workspace/api-client-react";
import { PageLayout } from "@/components/layout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, BookOpen } from "lucide-react";

const newsletterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  articleIds: z.array(z.number()).optional(),
});

type NewsletterForm = z.infer<typeof newsletterSchema>;

export default function NewsletterNewPage() {
  const { currentUser, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: articlesData } = useListArticles(
    { authorId: currentUser?.id, limit: 50, offset: 0 },
    { query: { enabled: !!currentUser?.id, queryKey: getListArticlesQueryKey({ authorId: currentUser?.id, limit: 50, offset: 0 }) } }
  );

  const createMutation = useCreateNewsletter();
  const myArticles = articlesData?.items?.filter(a => a.approved) ?? [];

  const form = useForm<NewsletterForm>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { title: "", description: "", articleIds: [] },
  });

  if (!isAuthenticated || currentUser?.role !== "journalist") {
    setLocation("/login");
    return null;
  }

  const toggleArticle = (articleId: number) => {
    const current = form.getValues("articleIds") ?? [];
    if (current.includes(articleId)) {
      form.setValue("articleIds", current.filter(id => id !== articleId));
    } else {
      form.setValue("articleIds", [...current, articleId]);
    }
  };

  const onSubmit = (values: NewsletterForm) => {
    createMutation.mutate({ data: { title: values.title, description: values.description, articleIds: values.articleIds ?? [] } }, {
      onSuccess: (newsletter) => {
        toast({ title: "Newsletter created" });
        queryClient.invalidateQueries({ queryKey: getListNewslettersQueryKey({}) });
        setLocation(`/newsletters/${newsletter.id}`);
      },
      onError: () => toast({ title: "Failed to create newsletter", variant: "destructive" }),
    });
  };

  const selectedIds = form.watch("articleIds") ?? [];

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => history.back()}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="font-serif text-xl font-bold">New Newsletter</h1>
          <div />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Newsletter title..." className="font-serif" data-testid="input-title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What is this newsletter about?" className="min-h-24" data-testid="textarea-description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Add your published articles</FormLabel>
              {myArticles.length === 0 ? (
                <p className="text-muted-foreground text-sm mt-2 py-4 border border-dashed border-border text-center">
                  You have no published articles yet. Articles must be approved before adding to a newsletter.
                </p>
              ) : (
                <div className="mt-2 space-y-2 border border-border p-3 max-h-64 overflow-y-auto">
                  {myArticles.map(article => (
                    <label
                      key={article.id}
                      className="flex items-start gap-3 py-2 cursor-pointer hover:bg-muted/50 px-2 rounded"
                      data-testid={`checkbox-article-${article.id}`}
                    >
                      <Checkbox
                        checked={selectedIds.includes(article.id)}
                        onCheckedChange={() => toggleArticle(article.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium leading-snug">{article.title}</p>
                        {article.publisherName && (
                          <p className="text-xs text-muted-foreground">{article.publisherName}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{selectedIds.length} article{selectedIds.length !== 1 ? "s" : ""} selected</p>
              )}
            </div>

            <Button type="submit" disabled={createMutation.isPending} className="gap-1.5" data-testid="btn-submit">
              <BookOpen className="h-4 w-4" />
              {createMutation.isPending ? "Creating..." : "Create Newsletter"}
            </Button>
          </form>
        </Form>
      </div>
    </PageLayout>
  );
}
