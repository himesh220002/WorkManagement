import connectToDatabase from "@/lib/mongodb";
import { Target } from "@/models";
import RevenueTargetsClient from "./RevenueTargetsClient";

export default async function RevenueTargetsPage() {
  await connectToDatabase();

  let targets: any[] = [];

  try {
    targets = await Target.find({}).lean();
  } catch (err) {
    console.error(err);
  }

  const cleanTargets = targets.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
    industry: t.industry,
    region: t.region,
    status: t.status,
    checklist: t.checklist.map((c: any) => ({
      name: c.name,
      isCompleted: c.isCompleted,
    })),
  }));

  return <RevenueTargetsClient targets={cleanTargets} />;
}
