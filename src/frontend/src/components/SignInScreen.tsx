import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Sparkles } from "lucide-react";

export function SignInScreen() {
  const { login, isInitializing, isLoggingIn } = useInternetIdentity();
  const disabled = isInitializing || isLoggingIn;

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border bg-card/80 p-8 text-center shadow-elevated backdrop-blur">
        <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-primary">
          <Sparkles className="size-6 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            AI Memory Capsule
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your secure document vault.
          </p>
        </div>
        <Button
          className="w-full"
          size="lg"
          onClick={() => login()}
          disabled={disabled}
          data-ocid="sign_in_button"
        >
          {isLoggingIn ? "Opening sign-in…" : "Sign in with Internet Identity"}
        </Button>
      </div>
    </div>
  );
}
