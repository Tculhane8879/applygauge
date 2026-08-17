export function SubmitButton({
  pending,
  label,
}: {
  pending: boolean;
  label: string;
}) {
  return (
    <button
      className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Please wait…" : label}
    </button>
  );
}
