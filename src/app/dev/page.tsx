import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DevRedirectPage() {
  const headerList = await headers();
  const orgCode = headerList.get("x-tenant-org-code");
  if (orgCode) {
    redirect(`/${orgCode}/dev/dashboard`);
  }
  redirect("/dev/dashboard");
}
