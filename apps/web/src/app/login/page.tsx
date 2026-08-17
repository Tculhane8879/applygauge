import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      description="Continue to your job-search workspace."
      alternateHref="/signup"
      alternateLabel="Need an account? Sign up"
    >
      <LoginForm />
    </AuthShell>
  );
}
