import connectToDatabase from "@/lib/mongodb";
import { Team, User } from "@/models";
import AddMemberForm from "@/app/teams/AddMemberForm";
import { revalidatePath } from "next/cache";

async function addTeam(formData: FormData) {
  "use server";
  await connectToDatabase();
  const name = formData.get("teamName");

  if (name) {
    await Team.create({ name });
    revalidatePath("/teams");
  }
}

async function deleteTeam(formData: FormData) {
  "use server";
  await connectToDatabase();
  const id = formData.get("teamId");

  if (id) {
    await Team.findByIdAndDelete(id);
    revalidatePath("/teams");
  }
}
async function addTeamMember(formData: FormData) {
  "use server";
  await connectToDatabase();
  const teamId = formData.get("teamId") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const position = formData.get("position") as string;
  const rank = formData.get("rank") as string;

  if (teamId && name && role) {
    const newUser = await User.create({ name, role, position, rank });
    await Team.findByIdAndUpdate(teamId, { $push: { members: newUser._id } });
    revalidatePath("/teams");
  }
}

async function removeTeamMember(formData: FormData) {
  "use server";
  await connectToDatabase();
  const teamId = formData.get("teamId") as string;
  const userId = formData.get("userId") as string;

  if (teamId && userId) {
    await Team.findByIdAndUpdate(teamId, { $pull: { members: userId } });
    await User.findByIdAndDelete(userId);
    revalidatePath("/teams");
  }
}

export default async function TeamsPage() {
  await connectToDatabase();
  const teams = await Team.find({}).populate("members").lean();

  return (
    <main className="flex flex-col min-w-0 p-6 flex-1">
      <header className=" bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 rounded-lg mb-6 border-l-4 border-violet-500">
        <div>
          <h1 className=" text-3xl font-bold text-gray-900 dark:text-gray-100">Teams & Units</h1>
          <div className="date-badge mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <i className="fa-solid fa-users"></i> Organizational Structure
          </div>
        </div>
      </header>

      {/* Upgrade: Added form to create a team natively */}
      <form action={addTeam} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-6 flex gap-4 flex-wrap items-center">
        <input
          type="text"
          name="teamName"
          className="flex-1 min-w-[200px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          placeholder="New Team Name..."
          required
        />
        <button type="submit" className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600 transition-colors flex items-center gap-2">
          <i className="fa-solid fa-plus"></i> Create
        </button>
      </form>

      <div className="space-y-4">
        {teams && teams.length > 0 ? (
          teams.map((t: any) => (
            <div key={t._id.toString()} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-all">
              {/* Team Header */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-500">
                    <i className="fa-solid fa-user-group"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{t.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t.members?.length || 0} Members</div>
                  </div>
                </div>
                <form action={deleteTeam} className="m-0">
                  <input type="hidden" name="teamId" value={t._id.toString()} />
                  <button type="submit" className="text-red-500 hover:text-red-600 transition-colors p-2" title="Delete Team">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </form>
              </div>

              {/* Member List */}
              <div className="p-4 space-y-3">
                {t.members && t.members.length > 0 ? (
                  t.members.map((member: any) => (
                    <div key={member._id.toString()} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-600">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">
                          {member.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{member.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {member.role} {member.position && `- ${member.position}`} {member.rank && `(Rank ${member.rank})`}
                          </div>
                        </div>
                      </div>
                      <form action={removeTeamMember} className="m-0">
                        <input type="hidden" name="teamId" value={t._id.toString()} />
                        <input type="hidden" name="userId" value={member._id.toString()} />
                        <button type="submit" className="text-gray-400 hover:text-red-500 text-sm transition-colors p-1" title="Remove Member">
                          <i className="fa-solid fa-times"></i>
                        </button>
                      </form>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic py-2">No members in this team yet.</div>
                )}

                {/* Add Member Form Client Component */}
                <AddMemberForm teamId={t._id.toString()} action={addTeamMember} />
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-10 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <i className="fa-solid fa-users-slash text-4xl text-gray-500 dark:text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">No teams configured</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Create a new organizational team above!</p>
          </div>
        )}
      </div>
    </main>
  );
}
