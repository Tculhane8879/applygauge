import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create an account"
      description="Start building a clearer view of your job search."
      alternateHref="/login"
      alternateLabel="Already have an account? Sign in"
    >
      <SignupForm />
    </AuthShell>
  );
}
