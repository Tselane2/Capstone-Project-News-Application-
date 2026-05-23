import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Newspaper } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginForm) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token, data.user);
        toast({ title: "Welcome back!", description: `Signed in as ${data.user.username}` });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({ title: "Sign in failed", description: err?.data?.error ?? "Invalid credentials", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, currentColor 40px, currentColor 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, currentColor 40px, currentColor 41px)" }} />
        <div className="relative z-10 max-w-sm">
          <Newspaper className="h-12 w-12 text-primary mb-6" />
          <h1 className="font-serif text-4xl font-bold mb-4 leading-tight">
            The world's stories, curated for you.
          </h1>
          <p className="text-background/70 text-lg leading-relaxed">
            Follow journalists and publishers whose work moves you. Get approved articles delivered to your feed.
          </p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-background/60 text-sm">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <span>Curated articles from trusted journalists</span>
            </div>
            <div className="flex items-center gap-3 text-background/60 text-sm">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <span>Editor-approved content you can trust</span>
            </div>
            <div className="flex items-center gap-3 text-background/60 text-sm">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <span>Newsletters from your favorite writers</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Newspaper className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-bold">The Press Room</span>
          </div>

          <h2 className="font-serif text-3xl font-bold mb-2">Sign in</h2>
          <p className="text-muted-foreground mb-8 text-sm">Welcome back to the newsroom.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" data-testid="input-email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Your password" autoComplete="current-password" data-testid="input-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loginMutation.isPending} data-testid="button-submit">
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium" data-testid="link-register">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
