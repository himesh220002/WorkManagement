import { redirect } from "next/navigation";

export default async function SignupRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const params = new URLSearchParams();
  params.set("tab", "signup");

  if (resolved) {
    for (const [key, value] of Object.entries(resolved)) {
      if (value && typeof value === "string") {
        params.set(key, value);
      }
    }
  }

  redirect(`/auth/login?${params.toString()}`);
}
