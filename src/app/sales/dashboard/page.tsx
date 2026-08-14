import connectToDatabase from "@/lib/mongodb";
import { Lead, Campaign } from "@/models";
import SalesDashboardClient from "./SalesDashboardClient";

export default async function SalesDashboardPage() {
  await connectToDatabase();

  let leads: any[] = [];
  let campaigns: any[] = [];
  
  try {
    leads = await Lead.find({}).lean();
    campaigns = await Campaign.find({}).lean();
  } catch (err) {
    console.error(err);
  }

  // Convert ObjectIds to strings
  const cleanLeads = leads.map((l: any) => ({
    _id: l._id.toString(),
    name: l.name,
    status: l.status,
    source: l.source,
  }));

  const cleanCampaigns = campaigns.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
  }));

  return <SalesDashboardClient leads={cleanLeads} campaigns={cleanCampaigns} />;
}
