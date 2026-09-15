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
          <img src={LOGO} alt="Sophiaco" className="h-10 w-auto" />
          <h1 className="mt-8 font-display text-3xl font-semibold">Connexion</h1>
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

      <div className="relative hidden overflow-hidden gradient-brand lg:block">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-white/15 bg-white/5 animate-float-slow"
            style={{
              width: 160 + i * 110,
              height: 160 + i * 110,
              top: `${8 + i * 18}%`,
              left: `${-10 + i * 22}%`,
              animationDelay: `${i * 1.6}s`,
            }}
          />
        ))}
        <div className="relative flex h-full flex-col justify-end p-12 text-primary-foreground">
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
        </div>
      </div>
    </div>
  );
}
