import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Newspaper, BookOpen, Users, Building2, LayoutDashboard, PenLine, LogOut, User, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
    logout();
    queryClient.clear();
    setLocation("/");
  };

  const roleColor = currentUser?.role === "editor"
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
    : currentUser?.role === "journalist"
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold text-foreground hover:text-primary transition-colors">
              <Newspaper className="h-5 w-5 text-primary" />
              The Press Room
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/articles">
                <Button variant="ghost" size="sm" className="font-sans text-sm font-medium" data-testid="nav-articles">
                  Articles
                </Button>
              </Link>
              <Link href="/newsletters">
                <Button variant="ghost" size="sm" className="font-sans text-sm font-medium" data-testid="nav-newsletters">
                  Newsletters
                </Button>
              </Link>
              <Link href="/publishers">
                <Button variant="ghost" size="sm" className="font-sans text-sm font-medium" data-testid="nav-publishers">
                  Publishers
                </Button>
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && currentUser ? (
              <>
                {currentUser.role === "journalist" && (
                  <Link href="/write">
                    <Button size="sm" className="gap-1.5" data-testid="btn-write-article">
                      <PenLine className="h-3.5 w-3.5" />
                      Write
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="gap-1.5" data-testid="btn-dashboard">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/profile">
                  <button className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity" data-testid="btn-profile">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {currentUser.username[0]?.toUpperCase()}
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColor}`}>
                      {currentUser.role}
                    </span>
                  </button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="btn-logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="btn-login">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" data-testid="btn-register">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} data-testid="btn-mobile-menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-2">
          <Link href="/articles" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Articles</Link>
          <Link href="/newsletters" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Newsletters</Link>
          <Link href="/publishers" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Publishers</Link>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Dashboard</Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Profile</Link>
              <button onClick={handleLogout} className="block py-2 text-sm font-medium text-destructive">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Sign In</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Get Started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
