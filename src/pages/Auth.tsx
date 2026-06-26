import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, LogIn, UserPlus, Calendar } from "lucide-react";
import SpiderWebBackground from "@/components/SpiderWebBackground";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  // Where to send the user after a successful sign-in. Defaults to home,
  // but Welcome Back is preserved when they arrived from there or via ?returnTo.
  const params = new URLSearchParams(location.search);
  const returnToParam = params.get("returnTo");
  const returnTo =
    returnToParam === "/welcome-back"
      ? "/welcome-back"
      : (location.state as any)?.returnTo === "/welcome-back"
      ? "/welcome-back"
      : "/";

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate(returnTo);
  }, [user, navigate, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back! 🐰");
        navigate(returnTo);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${returnTo}` },
        });
        if (error) throw error;
        toast.success("Account created! Welcome! 🐰");
        navigate(returnTo);
      }
    } catch (error: any) {
      const msg = error?.message || "Something went wrong";
      if (msg.toLowerCase().includes("already registered")) {
        toast.error("That email already has an account — try signing in instead.");
        setIsLogin(true);
      } else if (msg.toLowerCase().includes("invalid login")) {
        toast.error('Wrong email or password. Use "Forgot password?" to reset it.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email above first, then click forgot password.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent! Check your email 📬");
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + returnTo,
        extraParams: {
          prompt: "consent",
          access_type: "offline",
          include_granted_scopes: "true",
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
        },
      });
      if (error) {
        toast.error(error.message || "Google sign-in failed");
      }
    } catch (err: any) {
      toast.error("Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error(error.message || "Apple sign-in failed");
      }
    } catch (err: any) {
      toast.error("Apple sign-in failed");
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <SpiderWebBackground />
      <h1 className="sr-only">Sign in to TimeBunny</h1>
      <Card className="w-full max-w-md mx-4 relative z-10 bg-card/90 backdrop-blur-md border-primary/20">

        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="font-display text-2xl text-foreground">
            {isLogin ? "Welcome Back" : "Join Wonderland"}
          </CardTitle>
          <CardDescription className="font-body text-muted-foreground">
            {isLogin
              ? "Sign in to continue your schedule"
              : "Create an account to save your schedules"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full gap-3 h-11"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Button>

          {/* Apple Sign In */}
          <Button
            variant="outline"
            className="w-full gap-3 h-11"
            onClick={handleAppleSignIn}
            disabled={appleLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            {appleLoading ? "Connecting..." : "Continue with Apple"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="alice@wonderland.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background/50"
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                "Loading..."
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </>
              )}
            </Button>
          </form>
          <div className="text-center space-y-2">
            {isLogin && (
              <button
                onClick={handleForgotPassword}
                className="block w-full text-sm text-primary hover:underline transition-colors font-body"
              >
                Forgot password?
              </button>
            )}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-body"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2"
            onClick={() => navigate("/", { state: { skipToWizard: true } })}
          >
            Skip for now →
          </Button>

          <p className="text-xs text-center text-muted-foreground/60">
            <Calendar className="w-3 h-3 inline mr-1" />
            Google sign-in connects your calendar · Apple Calendar users can sync to Google Calendar
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
