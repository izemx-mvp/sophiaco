import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion — Sophiaco Control" },
      {
        name: "description",
        content:
          "Accès au backoffice Sophiaco : veille des appels d'offres publics et agents IA.",
      },
      { property: "og:title", content: "Connexion — Sophiaco Control" },
      {
        property: "og:description",
        content:
          "Accès sécurisé au backoffice Sophiaco pour la gestion des marchés publics santé.",
      },
    ],
  }),
  component: LoginPage,
});

import logoAsset from "@/assets/sophiaco-logo.png.asset.json";

const LOGO = logoAsset.url;

function LoginPage() {
  const [email, setEmail] = useState("agent@sophiaco.ma");
  const [password, setPassword] = useState("Demo@2026");
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const go = () => {
    setLoading(true);
    login();
    toast.success("Bienvenue, Mme Elhaoussi");
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <img src={LOGO} alt="Sophiaco" className="h-20 w-auto logo-glow" />
          <h1 className="mt-8 font-display text-3xl font-semibold">
            Connexion <span className="text-brand-animated">Sophiaco</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Accédez au backoffice de pilotage des appels d'offres.
          </p>
          <div className="clinical-rule mt-6" />

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              go();
            }}
            className="mt-6 space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="btn-shine w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Se connecter
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-accent/30 bg-accent-soft/60 p-4">
            <p className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4 text-accent" /> Accès démonstration
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Email : <span className="font-medium text-foreground">agent@sophiaco.ma</span> · Mot de
              passe : <span className="font-medium text-foreground">Demo@2026</span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                setEmail("agent@sophiaco.ma");
                setPassword("Demo@2026");
                go();
              }}
            >
              Connexion instantanée (démo)
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden brand-mesh lg:block">
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:54px_54px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute left-1/2 top-[34%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute inset-0 rounded-full border border-white/25 animate-orbit"
              style={{
                transform: `rotate(${i * 60}deg)`,
                animationDuration: `${26 + i * 9}s`,
                animationDirection: i % 2 ? "reverse" : "normal",
                scale: `${1 - i * 0.16}`,
              }}
            />
          ))}
          <span className="absolute inset-10 rounded-full bg-white/10 backdrop-blur-sm" />
          <img
            src={LOGO}
            alt="Sophiaco"
            className="absolute left-1/2 top-1/2 w-52 -translate-x-1/2 -translate-y-1/2 brightness-0 invert opacity-95 animate-float-slow"
          />
        </motion.div>

        <div className="relative flex h-full flex-col justify-end p-12 text-primary-foreground">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-glow)]" />
            Marchés publics santé · Maroc
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display text-5xl font-semibold leading-tight"
          >
            Sophiaco Control
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 max-w-md text-sm text-primary-foreground/80"
          >
            Veille automatisée des marchés publics, matching technique du catalogue et génération
            des dossiers de réponse — pilotés par vos agents IA.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-8 grid max-w-md grid-cols-3 gap-3"
          >
            {[
              { k: "24/7", v: "Veille continue" },
              { k: "6", v: "Étapes pilotées" },
              { k: "IA", v: "Assistant dossier" },
            ].map((s) => (
              <div
                key={s.k}
                className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-md"
              >
                <p className="font-display text-xl font-semibold">{s.k}</p>
                <p className="text-[11px] text-primary-foreground/75">{s.v}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
