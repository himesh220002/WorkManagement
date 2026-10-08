import { redirect } from "next/navigation";

export default function PeopleMeetingsRedirectPage() {
  redirect("/teams/meetings");
}
