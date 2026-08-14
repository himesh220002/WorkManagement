import connectToDatabase from "@/lib/mongodb";
import { Team } from "@/models";
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
            <div key={t._id.toString()} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center transition-all hover:bg-gray-50 dark:bg-gray-700/50">
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
                <button type="submit" className="text-red-500 hover:text-red-600 transition-colors" title="Delete Team">
                  <i className="fa-solid fa-trash"></i>
                </button>
              </form>
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
