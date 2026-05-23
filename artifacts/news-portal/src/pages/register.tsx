import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Newspaper, BookOpen, PenLine, ShieldCheck } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["reader", "journalist", "editor"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

const roles = [
  {
    value: "reader" as const,
    label: "Reader",
    description: "Follow journalists and publishers, curate your news feed",
    icon: BookOpen,
  },
  {
    value: "journalist" as const,
    label: "Journalist",
    description: "Write and publish articles, create newsletters",
    icon: PenLine,
  },
  {
    value: "editor" as const,
    label: "Editor",
    description: "Review and approve articles, manage publications",
    icon: ShieldCheck,
  },
];

export default function RegisterPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", role: "reader" },
  });

  const selectedRole = form.watch("role");

  const onSubmit = (values: RegisterForm) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token, data.user);
        toast({ title: "Welcome to The Press Room!", description: `Account created as ${data.user.username}` });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({ title: "Registration failed", description: err?.data?.error ?? "Please try again", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2 mb-8">
          <Newspaper className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl font-bold">The Press Room</span>
        </div>

        <h2 className="font-serif text-3xl font-bold mb-2">Create your account</h2>
        <p className="text-muted-foreground mb-8 text-sm">Choose your role to get the right experience.</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your role</FormLabel>
                  <div className="grid grid-cols-3 gap-3 mt-1">
                    {roles.map(({ value, label, description, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        data-testid={`role-${value}`}
                        onClick={() => field.onChange(value)}
                        className={`p-4 border rounded text-left transition-all ${
                          selectedRole === value
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <Icon className={`h-5 w-5 mb-2 ${selectedRole === value ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="font-medium text-sm">{label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</div>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" data-testid="input-username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min. 6 characters" data-testid="input-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={registerMutation.isPending} data-testid="button-submit">
              {registerMutation.isPending ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
