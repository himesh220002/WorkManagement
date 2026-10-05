import connectToDatabase from "@/lib/mongodb";
import { Team, User, Task, DailyGoal, ITeam } from "@/models";
import { serializeDoc, serializeDocs } from "@/lib/serialize";

export async function getTeams(companyId?: string) {
  await connectToDatabase();
  const query = companyId ? { companyId } : {};
  const teams = await Team.find(query).populate("members").populate("leadId").lean();
  return serializeDocs<ITeam>(teams);
}

export async function getTeamDetails(teamId: string) {
  await connectToDatabase();

  const [team, dailyGoals] = await Promise.all([
    Team.findById(teamId).populate("members").populate("leadId").lean(),
    DailyGoal.find({ teamId }).sort({ date: -1 }).limit(30).populate("ownerId").lean(),
  ]);

  if (!team) return null;

  const memberIds = team.members.map((m: any) => m._id || m);
  const tasks = await Task.find({ assigneeIds: { $in: memberIds } }).lean();

  // Compute workload per member
  const memberWorkload = (team.members as any[]).map((member) => {
    const memberTasks = tasks.filter((t) =>
      t.assigneeIds?.some((id: any) => id.toString() === member._id.toString())
    );
    const assignedHours = memberTasks.reduce(
      (sum, t) => sum + Number(t.estimatedHours || 0),
      0
    );
    const capacity = member.capacityHoursPerWeek || team.capacityHoursPerWeek || 40;
    const utilizationPercent = capacity > 0 ? Math.round((assignedHours / capacity) * 100) : 0;

    return {
      member: serializeDoc(member),
      tasksCount: memberTasks.length,
      assignedHours,
      capacity,
      utilizationPercent,
    };
  });

  return {
    team: serializeDoc(team),
    memberWorkload,
    dailyGoals: serializeDocs(dailyGoals),
    tasks: serializeDocs(tasks),
  };
}
