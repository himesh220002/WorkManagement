import connectToDatabase from "@/lib/mongodb";
import { Target, Goal } from "@/models";
import RevenueTargetsClient from "@/app/revenue/targets/RevenueTargetsClient";

export default async function RevenueTargetsPage() {
  await connectToDatabase();

  let targets: any[] = [];
  let goals: any[] = [];

  try {
    targets = await Target.find({}).lean();
    goals = await Goal.find({}).lean();
  } catch (err) {
    console.error(err);
  }

  const cleanTargets = targets.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
    industry: t.industry,
    region: t.region,
    status: t.status,
    expectedValue: t.expectedValue || 0,
    actualValue: t.actualValue || 0,
    goalId: t.goalId ? t.goalId.toString() : null,
    checklist: t.checklist.map((c: any) => ({
      name: c.name,
      isCompleted: c.isCompleted,
    })),
  }));
  
  const cleanGoals = goals.map((g: any) => ({
    _id: g._id.toString(),
    title: g.title,
  }));

  return <RevenueTargetsClient targets={cleanTargets} goals={cleanGoals} />;
}
