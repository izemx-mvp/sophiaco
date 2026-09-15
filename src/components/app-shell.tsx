import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  Bell,
  Boxes,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

import logoAsset from "@/assets/sophiaco-logo.png.asset.json";

const LOGO = logoAsset.url;

const NAV = [
  { to: "/criteres", label: "Critères", icon: SlidersHorizontal },
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/appels-offres", label: "Appels d'offres", icon: FileText },
  { to: "/catalogue", label: "Catalogue", icon: Boxes },
  { to: "/fournisseurs", label: "Fournisseurs", icon: Building2 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { notifications, logout, criteriaSaved, visibleTenders } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const results = query.trim()
    ? visibleTenders
        .filter(
          (t) =>
            t.ref.toLowerCase().includes(query.toLowerCase()) ||
            t.client.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 5)
    : [];

  const navLink = (item: (typeof NAV)[number], onClick?: () => void) => {
    const active = pathname.startsWith(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={onClick}
        className={cn(
          "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
          active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <item.icon className={cn("h-4 w-4", active && "text-accent")} />
        <span>{item.label}</span>
        {item.to === "/criteres" && !criteriaSaved && (
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--warning)]" />
        )}
        {active && (
          <motion.span
            layoutId="nav-active"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-primary to-accent"
          />
        )}
      </Link>
    );
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background">
      <div className="aurora-bg" aria-hidden />

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-4 md:px-8">
          <Link to="/dashboard" className="shrink-0">
            <img src={LOGO} alt="Sophiaco" className="h-8 w-auto" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">{NAV.map((n) => navLink(n))}</nav>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative hidden sm:block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un dossier, un client…"
                    className="w-52 pl-9 lg:w-72"
                  />
                </div>
              </PopoverTrigger>
              {results.length > 0 && (
                <PopoverContent align="end" className="w-80 p-1">
                  {results.map((t) => (
                    <button
                      key={t.id}
                      className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-secondary"
                      onClick={() => {
                        setQuery("");
                        navigate({ to: "/appels-offres/$id", params: { id: t.id } });
                      }}
                    >
                      <span className="text-sm font-medium">{t.ref}</span>
                      <span className="text-xs text-muted-foreground">{t.client}</span>
                    </button>
                  ))}
                </PopoverContent>
              )}
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <p className="border-b border-border px-4 py-3 font-display text-sm font-semibold">
                  Notifications
                </p>
                <div className="scroll-brand max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="border-b border-border/60 px-4 py-3 last:border-0">
                      <p className="text-sm">{n.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.at}</p>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-secondary">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full gradient-brand text-xs font-semibold text-primary-foreground">
                    NE
                  </span>
                  <span className="hidden text-left md:block">
                    <span className="block text-xs font-medium leading-tight">
                      Mme Naoual Elhaoussi
                    </span>
                    <span className="block text-[11px] leading-tight text-muted-foreground">
                      Sophiaco
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => toast("Profil : Mme Naoual Elhaoussi — Sophiaco")}
                >
                  <User className="mr-2 h-4 w-4" /> Profil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    toast.success("Déconnexion réussie");
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border px-4 lg:hidden"
            >
              <div className="flex flex-col gap-1 py-2">
                {NAV.map((n) => navLink(n, () => setMobileOpen(false)))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10 min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
