import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CircleAlert, Code2, Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import AuthImagePattern from "./AuthImagePattern";
import GoogleAuthButton from "./GoogleAuthButton";
import { useAuthStore } from "../store/useAuthStore";
import "./AuthPage.css";

const emailSchema = z.string().trim().email("Enter a valid email address.");
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});
const signupSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(3, "Enter at least 3 characters."),
  password: z.string().min(6, "Use at least 6 characters."),
});

function AuthField({ id, label, icon: Icon, registration, error, hint, action, compact = false, ...inputProps }) {
  const description = error || hint;
  return (
    <div className={`ls-auth-field${compact ? " ls-auth-field-compact" : ""}`}>
      <div className="ls-auth-field-heading">
        <label htmlFor={id}>{label}</label>
        {hint && !error && <p id={`${id}-description`} className="ls-auth-hint">{hint}</p>}
      </div>
      <div className="ls-auth-input" data-invalid={Boolean(error)}>
        <Icon size={18} aria-hidden="true" />
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={description ? `${id}-description` : undefined}
          {...inputProps}
          {...registration}
        />
        {action}
      </div>
      {error && <p id={`${id}-description`} className="ls-auth-field-error">{error}</p>}
    </div>
  );
}

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const authenticate = useAuthStore((state) => isSignup ? state.signup : state.login);
  const googleBusy = useAuthStore((state) => state.isGoogleLoggingIn);
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(isSignup ? signupSchema : loginSchema),
    defaultValues: isSignup ? { name: "", email: "", password: "" } : { email: "", password: "" },
  });

  const submit = handleSubmit(async (values) => {
    if (useAuthStore.getState().isGoogleLoggingIn) return;
    const error = await authenticate(values);
    if (error) setError("root.server", { message: error });
  });

  return (
    <main className={`ls-auth-page${isSignup ? " ls-auth-signup" : ""}`}>
      <div className="ls-auth-content">
        <header className="ls-auth-header">
          <Link to="/" className="ls-auth-brand"><span><Code2 size={22} aria-hidden="true" /></span> LeetSpase</Link>
          <Link to="/" className="ls-auth-home"><ArrowLeft size={16} aria-hidden="true" /> Back to home</Link>
        </header>

        <div className="ls-auth-form-wrap">
          <div className="ls-auth-heading">
            <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
            <p>{isSignup ? "Solve problems and track your progress." : "Sign in to pick up where you left off."}</p>
          </div>

          <form className="ls-auth-form" noValidate aria-busy={isSubmitting} onSubmit={submit} onChange={() => clearErrors("root.server")}>
            {isSignup && (
              <AuthField id="auth-name" label="Name" icon={UserRound} autoComplete="name" placeholder="Your name" compact readOnly={isSubmitting} registration={register("name")} error={errors.name?.message} />
            )}
            <AuthField id="auth-email" label="Email address" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" compact={isSignup} readOnly={isSubmitting} registration={register("email")} error={errors.email?.message} />
            <AuthField
              id="auth-password"
              label="Password"
              icon={LockKeyhole}
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "Create a password" : "Enter your password"}
              readOnly={isSubmitting}
              registration={register("password")}
              error={errors.password?.message}
              hint={isSignup ? "6 characters minimum" : undefined}
              action={
                <button type="button" className="ls-auth-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-controls="auth-password" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              }
            />

            {errors.root?.server && <p className="ls-auth-error" role="alert"><CircleAlert size={18} aria-hidden="true" />{errors.root.server.message}</p>}
            <button type="submit" className="ls-auth-submit" disabled={isSubmitting || googleBusy}>
              {isSubmitting ? <><Loader2 size={17} className="ls-auth-spinner" aria-hidden="true" /> {isSignup ? "Creating account…" : "Signing in…"}</> : <>{isSignup ? "Create account" : "Sign in"}<ArrowRight size={18} aria-hidden="true" /></>}
            </button>
          </form>

          <div className="ls-auth-divider">or continue with</div>
          <div className="ls-auth-provider" inert={isSubmitting || googleBusy}><GoogleAuthButton /></div>
          {googleBusy && <span role="status" className="sr-only">Signing in with Google…</span>}
          <p className="ls-auth-alternative">
            {isSignup ? "Already have an account?" : "New to LeetSpase?"}{" "}
            <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link>
          </p>
        </div>
      </div>
      <AuthImagePattern />
    </main>
  );
}
