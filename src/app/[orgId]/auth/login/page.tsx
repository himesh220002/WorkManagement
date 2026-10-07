import connectToDatabase from "@/lib/mongodb";
import { Company } from "@/models";
import mongoose from "mongoose";
import AuthPage from "@/app/auth/login/page";

interface OrgLoginPageProps {
  params: Promise<{ orgId: string }> | { orgId: string };
}

export default async function OrgLoginPage({ params }: OrgLoginPageProps) {
  await connectToDatabase();
  const resolvedParams = await Promise.resolve(params);
  const rawOrgId = resolvedParams.orgId || "";
  const cleanOrgCode = rawOrgId.toUpperCase().trim();

  let companyName: string | undefined;
  let resolvedOrgCode: string = cleanOrgCode;

  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(rawOrgId) && rawOrgId.length === 24;
    const query: any = {
      $or: [
        { companyCode: cleanOrgCode },
        { slug: rawOrgId.toLowerCase() },
      ],
    };
    if (isObjectId) {
      query.$or.push({ _id: new mongoose.Types.ObjectId(rawOrgId) });
    }

    const company = await Company.findOne(query).lean();
    if (company) {
      companyName = company.name;
      resolvedOrgCode = company.companyCode || cleanOrgCode;
    }
  } catch (err) {
    console.error("Error looking up organization for login route:", err);
  }

  return (
    <AuthPage
      prefillOrgCode={resolvedOrgCode}
      orgName={companyName}
    />
  );
}
