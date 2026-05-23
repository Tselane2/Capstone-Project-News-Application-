import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { PageLayout } from "@/components/layout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { format } from "date-fns";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  bio: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { isAuthenticated, login, token } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetMe({ query: { enabled: isAuthenticated, queryKey: getGetMeQueryKey() } });
  const updateMutation = useUpdateMe();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "", bio: "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({ username: user.username, bio: user.bio ?? "" });
    }
  }, [user, form]);

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const onSubmit = (values: ProfileForm) => {
    updateMutation.mutate({ data: { username: values.username, bio: values.bio ?? "" } }, {
      onSuccess: (updated) => {
        toast({ title: "Profile updated" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        if (token) login(token, updated);
      },
      onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-lg mx-auto">
          <Skeleton className="h-10 w-40 mb-6" />
          <Skeleton className="h-20 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </PageLayout>
    );
  }

  const roleColor = user?.role === "editor"
    ? "bg-amber-100 text-amber-800"
    : user?.role === "journalist"
    ? "bg-blue-100 text-blue-800"
    : "bg-green-100 text-green-800";

  return (
    <PageLayout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-start gap-4 mb-8 pb-8 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold font-serif">
            {user?.username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold" data-testid="text-username">{user?.username}</h1>
            <span className={`text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block ${roleColor}`}>{user?.role}</span>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{user?.articleCount ?? 0} articles</span>
              <span>{user?.newsletterCount ?? 0} newsletters</span>
              {user?.createdAt && <span>Joined {format(new Date(user.createdAt), "MMM yyyy")}</span>}
            </div>
          </div>
        </div>

        <h2 className="font-serif text-xl font-bold mb-4">Edit Profile</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Your username" data-testid="input-username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-sm font-medium">Email</FormLabel>
              <p className="text-muted-foreground text-sm mt-1 py-2 px-3 bg-muted rounded border border-border" data-testid="text-email">
                {user?.email}
              </p>
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={user?.role === "journalist" ? "Tell readers about yourself and your focus areas..." : "A short bio about yourself..."}
                      className="min-h-24 resize-none"
                      data-testid="textarea-bio"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={updateMutation.isPending} data-testid="btn-save">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </div>
    </PageLayout>
  );
}
