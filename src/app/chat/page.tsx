import React from "react";
import connectToDatabase from "@/lib/mongodb";
import { getCurrentSession } from "@/server/auth/session";
import ChatSpaceClient from "@/components/chat/ChatSpaceClient";

export const metadata = {
  title: "Chat Space | TaskPMS",
  description: "Company chat space with @mentions, saved recipients, and multi-scope delivery",
};

export default async function ChatPage() {
  await connectToDatabase();
  const session = await getCurrentSession();

  const currentUserName = session.name || session.email?.split("@")[0] || "User";
  const currentUserEmail = session.email || "";
  const currentUserRole = session.role || "Team Member";
  const currentUserId = session.userId || "anonymous";
  const companyCode = session.companyCode || "";

  return (
    <div className="w-full h-full">
      <ChatSpaceClient
        currentUserName={currentUserName}
        currentUserEmail={currentUserEmail}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
        companyCode={companyCode}
      />
    </div>
  );
}
