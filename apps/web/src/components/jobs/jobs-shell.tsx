import { AppShell } from "@/components/layout/app-shell";

export function JobsShell({
  children,
  description = "Your private collection of job opportunities.",
  title = "Saved Jobs",
}: {
  children: React.ReactNode;
  description?: string;
  title?: string;
}) {
  return (
    <AppShell activeSection="jobs" description={description} title={title}>
      {children}
    </AppShell>
  );
}
