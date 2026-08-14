import connectToDatabase from "@/lib/mongodb";
import { Item, List } from "@/models";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import AutoSubmitCheckbox from "@/components/AutoSubmitCheckbox";

const BANNED_LIST_NAMES = ["dashboard", "exec", "dev", "sales", "revenue", "projects", "teams", "diagrams", "about", "favicon.ico", "api"];

async function addItem(formData: FormData) {
  "use server";
  await connectToDatabase();
  const itemName = formData.get("newItem") as string;
  const listName = (formData.get("listName") as string) || "Today";
  const priority = (formData.get("priority") as string) || "medium";

  if (!itemName || !itemName.trim()) return;

  const newItemObj = {
    name: itemName.trim(),
    completed: false,
    priority: priority,
  };

  if (listName === "Today") {
    await Item.create(newItemObj);
  } else {
    const foundList = await List.findOne({ name: listName });
    if (foundList) {
      foundList.items.push(newItemObj);
      await foundList.save();
    }
  }
  revalidatePath(`/${listName}`);
}

async function toggleItem(formData: FormData) {
  "use server";
  await connectToDatabase();
  const id = formData.get("itemId") as string;
  const listName = formData.get("listName") as string;
  const currentStatus = formData.get("currentStatus") === "true";

  if (listName === "Today") {
    await Item.findByIdAndUpdate(id, { completed: !currentStatus });
  } else {
    const foundList = await List.findOne({ name: listName });
    if (foundList) {
      const item = foundList.items.id(id);
      if (item) {
        item.completed = !currentStatus;
        await foundList.save();
      }
    }
  }
  revalidatePath(`/${listName}`);
}

async function deleteItem(formData: FormData) {
  "use server";
  await connectToDatabase();
  const id = formData.get("itemId") as string;
  const listName = formData.get("listName") as string;

  if (listName === "Today") {
    await Item.findByIdAndDelete(id);
  } else {
    const foundList = await List.findOne({ name: listName });
    if (foundList) {
      foundList.items.pull({ _id: id });
      await foundList.save();
    }
  }
  revalidatePath(`/${listName}`);
}

export default async function TodoListPage({ params }: { params: Promise<{ customListName: string }> }) {
  const resolvedParams = await params;
  const rawName = resolvedParams.customListName;

  if (!rawName) {
    redirect("/Today");
  }

  if (BANNED_LIST_NAMES.map(n => n.toLowerCase()).includes(rawName.toLowerCase())) {
    redirect("/Today");
  }

  const customListName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  await connectToDatabase();

  let listItems = [];

  try {
    if (customListName === "Today") {
      listItems = await Item.find({}).lean();
    } else {
      let foundList = await List.findOne({ name: customListName }).lean();
      if (!foundList) {
        const newList = await List.create({ name: customListName, items: [] });
        listItems = newList.items;
      } else {
        listItems = foundList.items;
      }
    }
  } catch (err) {
    console.error(err);
  }

  const totalCount = listItems.length;
  const completedCount = listItems.filter((i: any) => i.completed).length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <main className="flex flex-col min-w-0 p-6 flex-1">
      <header className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{customListName}</h1>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <i className="fa-regular fa-calendar-alt"></i>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <strong>{completedCount}</strong> of <strong>{totalCount}</strong> completed ({percent}%)
          </div>
          <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${percent}%` }}></div>
          </div>
        </div>
      </header>

      {/* Add New Task Form */}
      <form action={addItem} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6 flex gap-4 flex-wrap items-center">
        <input type="hidden" name="listName" value={customListName} />
        <input
          type="text"
          name="newItem"
          className="flex-1 min-w-[200px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          placeholder={`Add a new task to ${customListName}...`}
          required
        />
        <select name="priority" className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <option value="high">🔥 High</option>
          <option value="medium" defaultValue="medium">⚡ Medium</option>
          <option value="low">🌱 Low</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2">
          <i className="fa-solid fa-plus"></i> Add Task
        </button>
      </form>

      <div className="space-y-4">
        {listItems && listItems.length > 0 ? (
          listItems.map((item: any) => (
            <div key={item._id.toString()} className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 flex justify-between items-center transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${item.completed ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-4">
                <form action={toggleItem} className="m-0 flex items-center">
                  <input type="hidden" name="itemId" value={item._id.toString()} />
                  <input type="hidden" name="listName" value={customListName} />
                  <input type="hidden" name="currentStatus" value={item.completed.toString()} />
                  <AutoSubmitCheckbox defaultChecked={item.completed} />
                </form>
                <span className={`text-lg font-medium ${item.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                  {item.name}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wider ${
                  item.priority === 'high' ? 'bg-red-100 text-red-700' :
                  item.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {item.priority}
                </span>
                
                <form action={deleteItem} className="m-0">
                  <input type="hidden" name="itemId" value={item._id.toString()} />
                  <input type="hidden" name="listName" value={customListName} />
                  <button type="submit" className="text-red-500 hover:text-red-600 transition-colors bg-transparent border-none" title="Delete Task">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-10 text-center">
            <i className="fa-solid fa-clipboard-check text-4xl text-gray-500 dark:text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">No tasks found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Add a task above to get started!</p>
          </div>
        )}
      </div>
    </main>
  );
}
