import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearch, useLocation } from "wouter";
import {
  useCreateArticle, useUpdateArticle, useGetArticle, useListPublishers,
  getListArticlesQueryKey, getGetArticleQueryKey, getListPublishersQueryKey,
} from "@workspace/api-client-react";
import { PageLayout } from "@/components/layout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Save } from "lucide-react";

/**
 * Zod schema for the write/edit article form.
 * publisherId is stored as a string in the select input and converted to a
 * number before sending to the API (the API expects an integer).
 */
const writeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  publisherId: z.string().optional(),
});

type WriteForm = z.infer<typeof writeSchema>;

/**
 * Write / Edit Article page.
 *
 * Serves two modes determined by the `?edit=<id>` query parameter:
 * - Create mode (no query param): submits a new article for editorial review.
 * - Edit mode (?edit=<id>): pre-fills the form with the existing article's
 *   data and PATCHes the article on save.
 *
 * Access is restricted to journalists and editors. Readers are redirected
 * to the login page.
 */
export default function WritePage() {
  const { currentUser, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const editId = params.get("edit") ? Number(params.get("edit")) : undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existing } = useGetArticle(editId!, {
    query: { enabled: !!editId, queryKey: getGetArticleQueryKey(editId!) }
  });
  const { data: publishers } = useListPublishers({ query: { queryKey: getListPublishersQueryKey() } });

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();

  const form = useForm<WriteForm>({
    resolver: zodResolver(writeSchema),
    defaultValues: { title: "", content: "", publisherId: "" },
  });

  useEffect(() => {
    if (existing) {
      form.reset({
        title: existing.title,
        content: existing.content,
        publisherId: existing.publisherId ? String(existing.publisherId) : "",
      });
    }
  }, [existing, form]);

  if (!isAuthenticated || (currentUser?.role !== "journalist" && currentUser?.role !== "editor")) {
    setLocation("/login");
    return null;
  }

  const onSubmit = (values: WriteForm) => {
    const data = {
      title: values.title,
      content: values.content,
      ...(values.publisherId ? { publisherId: Number(values.publisherId) } : {}),
    };

    if (editId) {
      updateMutation.mutate({ articleId: editId, data }, {
        onSuccess: (article) => {
          toast({ title: "Article updated" });
          queryClient.invalidateQueries({ queryKey: getGetArticleQueryKey(editId) });
          queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });
          setLocation(`/articles/${article.id}`);
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: (article) => {
          toast({ title: "Article submitted for review", description: "An editor will review your article soon." });
          queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });
          setLocation(`/articles/${article.id}`);
        },
        onError: () => toast({ title: "Failed to create article", variant: "destructive" }),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => history.back()} data-testid="btn-back">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="font-serif text-xl font-bold">{editId ? "Edit Article" : "Write Article"}</h1>
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
                    <Input
                      placeholder="Your compelling headline..."
                      className="text-lg font-serif"
                      data-testid="input-title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publisherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publisher (optional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-publisher">
                        <SelectValue placeholder="No publisher (independent article)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No publisher</SelectItem>
                      {publishers?.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Start writing your article..."
                      className="min-h-80 resize-y leading-relaxed"
                      data-testid="textarea-content"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {editId ? "Changes will reset approval status." : "Your article will be submitted for editor review."}
              </p>
              <Button type="submit" disabled={isPending} className="gap-1.5" data-testid="btn-submit">
                <Save className="h-4 w-4" />
                {isPending ? "Saving..." : editId ? "Save Changes" : "Submit for Review"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageLayout>
  );
}
