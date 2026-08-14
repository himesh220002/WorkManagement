import connectToDatabase from "@/lib/mongodb";
import { Deal, Target } from "@/models";
// Force TS server to re-index Client component
import RevenueDashboardClient from "@/app/revenue/dashboard/RevenueDashboardClient";

export default async function RevenueDashboardPage() {
  await connectToDatabase();

  let deals: any[] = [];
  let targets: any[] = [];

  try {
    // @ts-ignore - Deal schema wasn't listed but we fetch it
    deals = await Deal.find({}).lean();
    targets = await Target.find({}).lean();
  } catch (err) {
    console.error(err);
  }

  // Convert ObjectIds to strings
  const cleanDeals = deals.map((d: any) => ({
    _id: d._id.toString(),
    name: d.name,
    amount: d.amount,
    stage: d.stage,
  }));

  const cleanTargets = targets.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
  }));

  return <RevenueDashboardClient deals={cleanDeals} targets={cleanTargets} />;
}
