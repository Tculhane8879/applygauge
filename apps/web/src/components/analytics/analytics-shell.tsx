import { AppShell, type AppSection } from "@/components/layout/app-shell";

export function AnalyticsShell({
  title,
  description,
  activeSection,
  children,
}: {
  title: string;
  description: string;
  activeSection: AppSection;
  children: React.ReactNode;
}) {
  return (
    <AppShell
      activeSection={activeSection}
      description={description}
      title={title}
    >
      {children}
    </AppShell>
  );
}
