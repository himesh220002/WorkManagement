import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ExecRedirectPage() {
  const headerList = await headers();
  const orgCode = headerList.get("x-tenant-org-code");
  if (orgCode) {
    redirect(`/${orgCode}/exec/dashboard`);
  }
  redirect("/exec/dashboard");
}
