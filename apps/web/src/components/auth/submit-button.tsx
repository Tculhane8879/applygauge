export function SubmitButton({
  pending,
  label,
}: {
  pending: boolean;
  label: string;
}) {
  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Please wait…" : label}
    </Button>
  );
}
import { Button } from "@/components/ui/button";
