import connectToDatabase from "@/lib/mongodb";
import { Project, Team, Pipeline } from "@/models";
import ProjectHierarchyDiagram from "@/app/projects/ProjectHierarchyDiagram";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { addProject } from "@/actions";

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
  const projectsData = await Project.find({})
    .populate({
      path: "teams",
      populate: { path: "members" }
    })
    .lean();

  const rawProjects = await Promise.all(
    projectsData.map(async (p: any) => {
      const pipelines = await Pipeline.find({ projectId: p._id }).lean();
      return { ...p, pipelines };
    })
  );

  const rawTeams = await Team.find({}).lean();

  // Sanitize data for Client Components (removes Mongoose ObjectIds / toJSON)
  const projects = JSON.parse(JSON.stringify(rawProjects));
  const teams = JSON.parse(JSON.stringify(rawTeams));

  return (
    <main className="flex flex-col min-w-0 p-6 flex-1">
      <header className=" bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 rounded-lg mb-6 border-l-4 border-blue-500">
        <div>
          <h1 className=" text-3xl font-bold text-gray-900 dark:text-gray-100">Projects Pipeline</h1>
          <div className="date-badge mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <i className="fa-solid fa-folder-tree"></i> Project Management
          </div>
        </div>
      </header>

      {/* Create Project Form */}
      <form action={addProject} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6 flex gap-4 flex-wrap items-center">
        <input
          type="text"
          name="name"
          className="flex-1 min-w-[200px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          placeholder="New Project Name..."
          required
        />
        <input
          type="text"
          name="description"
          className="flex-1 min-w-[200px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          placeholder="Description..."
        />
        <select name="category" className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <option value="Internal">Internal</option>
          <option value="Client">Client</option>
          <option value="Product">Product</option>
          <option value="Research">Research</option>
          <option value="Other">Other</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2">
          <i className="fa-solid fa-plus"></i> Create
        </button>
      </form>

      <div className="space-y-4">
        {projects && projects.length > 0 ? (
          projects.map((p: any) => (
            <div key={p._id.toString()} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 transition-all hover:bg-gray-50 dark:bg-gray-700/50 flex flex-col gap-4">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                    <i className="fa-solid fa-rocket"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{p.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{p.description || "No description"}</div>
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
              {/* Project Hierarchy Diagram Toggle */}
              <ProjectHierarchyDiagram project={p} />
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-10 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <i className="fa-solid fa-folder-open text-4xl text-gray-500 dark:text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">No projects found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Create a new project pipeline above!</p>
          </div>
        )}
      </div>
    </main>
  );
}
