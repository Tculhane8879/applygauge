export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        className="rounded-lg border border-slate-300 px-4 py-2 font-medium"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
