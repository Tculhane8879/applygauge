import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <Button
        className="!text-frame-muted hover:!bg-white/10 hover:!text-white focus-visible:ring-indigo-300 focus-visible:ring-offset-frame"
        size="compact"
        type="submit"
        variant="ghost"
      >
        Sign out
      </Button>
    </form>
  );
}
