import connectToDatabase from "@/lib/mongodb";
import { Project } from "@/models";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function addProject(formData: FormData) {
  "use server";
  await connectToDatabase();
  const name = formData.get("projectName");
  const description = formData.get("description");

  if (name) {
    await Project.create({ name, description });
    revalidatePath("/projects");
  }
}

async function deleteProject(formData: FormData) {
  "use server";
  await connectToDatabase();
  const id = formData.get("projectId");

  if (id) {
    await Project.findByIdAndDelete(id);
    revalidatePath("/projects");
  }
}

export default async function ProjectsPage() {
  await connectToDatabase();
  const projects = await Project.find({}).lean();

  return (
    <main className="main-dashboard p-6 flex-1">
      <header className="dashboard-banner glass-card p-6 rounded-lg mb-6 border-l-4 border-blue-500">
        <div>
          <h1 className="list-heading text-3xl font-bold text-[var(--text-primary)]">Projects Pipeline</h1>
          <div className="date-badge mt-2 text-sm text-[var(--text-muted)] flex items-center gap-2">
            <i className="fa-solid fa-folder-tree"></i> Project Management
          </div>
        </div>
      </header>

      {/* Create Project Form */}
      <form action={addProject} className="glass-card p-6 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] mb-6 flex gap-4 flex-wrap items-center">
        <input
          type="text"
          name="projectName"
          className="flex-1 min-w-[200px] p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]"
          placeholder="New Project Name..."
          required
        />
        <input
          type="text"
          name="description"
          className="flex-1 min-w-[200px] p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]"
          placeholder="Description..."
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2">
          <i className="fa-solid fa-plus"></i> Create
        </button>
      </form>

      <div className="space-y-4">
        {projects && projects.length > 0 ? (
          projects.map((p: any) => (
            <div key={p._id.toString()} className="glass-card p-4 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] flex justify-between items-center transition-all hover:bg-[var(--glass-bg-hover)]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                  <i className="fa-solid fa-rocket"></i>
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)] text-lg">{p.name}</div>
                  <div className="text-sm text-[var(--text-muted)]">{p.description || "No description"}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                  {p.status || "Active"}
                </span>
                <form action={deleteProject} className="m-0">
                  <input type="hidden" name="projectId" value={p._id.toString()} />
                  <button type="submit" className="text-red-500 hover:text-red-600 transition-colors" title="Delete Project">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-10 text-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
            <i className="fa-solid fa-folder-open text-4xl text-[var(--text-muted)] mb-4"></i>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">No projects found</h3>
            <p className="text-[var(--text-muted)] mt-2">Create a new project pipeline above!</p>
          </div>
        )}
      </div>
    </main>
  );
}
