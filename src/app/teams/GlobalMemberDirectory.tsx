"use client";

import { useState } from "react";
import { updateUserProfile } from "@/actions";

export default function GlobalMemberDirectory({ users }: { users: any[] }) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [isOpenWorking, setIsOpenWorking] = useState(true);
  const [isOpenQuit, setIsOpenQuit] = useState(false);
  const [isOpenDropped, setIsOpenDropped] = useState(false);

  const working = users.filter(u => u.status === "Working" || !u.status);
  const quit = users.filter(u => u.status === "Quit");
  const dropped = users.filter(u => u.status === "Dropped");

  const renderUser = (u: any) => {
    const isEditing = editingUserId === u._id;

    return (
      <div key={u._id} className="bg-white/5 border border-gray-200/90 dark:border-gray-700/50 p-4 rounded-xl hover:bg-white/10 transition-all flex flex-col gap-2">
        {!isEditing ? (
          <>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 font-bold uppercase shrink-0">
                  {u.name.substring(0, 2)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">{u.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                    {u.role} {u.position ? `- ${u.position}` : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingUserId(u._id)}
                className="text-gray-400 hover:text-blue-500 transition-colors p-2 text-sm shrink-0"
              >
                <i className="fa-solid fa-pen-to-square"></i> Edit
              </button>
            </div>
            {(u.joinedDate || u.leftDate) && (
              <div className="text-xs text-gray-500 flex flex-col mt-2">
                {u.joinedDate && <span>Joined: {new Date(u.joinedDate).toLocaleDateString()}</span>}
                {u.leftDate && <span>Left: {new Date(u.leftDate).toLocaleDateString()}</span>}
              </div>
            )}
            {u.details && <div className="text-sm text-gray-600 dark:text-gray-300 italic mt-1 line-clamp-2">{u.details}</div>}
          </>
        ) : (
          <form action={async (formData) => {
            await updateUserProfile(formData);
            setEditingUserId(null);
          }} className="flex flex-col gap-3">
            <input type="hidden" name="userId" value={u._id} />

            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">{u.name}</div>
              <button type="button" onClick={() => setEditingUserId(null)} className="text-gray-400 hover:text-gray-200 shrink-0">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <select name="status" defaultValue={u.status || "Working"} className="tech-input !py-1.5 !text-xs">
                  <option value="Working">Working</option>
                  <option value="Quit">Quit</option>
                  <option value="Dropped">Dropped</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Details</label>
                <input type="text" name="details" defaultValue={u.details || ""} className="tech-input !py-1.5 !text-xs" placeholder="Notes..." />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Joined Date</label>
                  <input type="date" name="joinedDate" defaultValue={u.joinedDate ? new Date(u.joinedDate).toISOString().split('T')[0] : ''} className="tech-input !py-1.5 !text-xs" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Left Date</label>
                  <input type="date" name="leftDate" defaultValue={u.leftDate ? new Date(u.leftDate).toISOString().split('T')[0] : ''} className="tech-input !py-1.5 !text-xs" />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button type="submit" className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors">
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    );
  };

  return (
    <div className="glass-card p-6 flex flex-col gap-6 w-full transition-all">
      <div className="flex items-center gap-2 mb-2">
        <i className="fa-solid fa-address-book text-emerald-500"></i>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Global Member Directory</h2>
      </div>

      <div className="flex flex-col gap-6">
        {/* Working Section */}
        <div className="flex flex-col gap-4">
          <div
            className="flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity border-b border-emerald-500/20 pb-2"
            onClick={() => setIsOpenWorking(!isOpenWorking)}
          >
            <h3 className="font-semibold text-emerald-500">Working ({working.length})</h3>
            <button className="text-gray-500 hover:text-emerald-500 transition-colors">
              <i className={`fa-solid fa-chevron-${isOpenWorking ? 'up' : 'down'}`}></i>
            </button>
          </div>
          {isOpenWorking && (
            <div className="flex flex-wrap gap-4">
              {working.map(renderUser)}
            </div>
          )}
        </div>

        {/* Quit Section */}
        <div className="flex flex-col gap-4">
          <div
            className="flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity border-b border-amber-500/20 pb-2"
            onClick={() => setIsOpenQuit(!isOpenQuit)}
          >
            <h3 className="font-semibold text-amber-500">Quit ({quit.length})</h3>
            <button className="text-gray-500 hover:text-amber-500 transition-colors">
              <i className={`fa-solid fa-chevron-${isOpenQuit ? 'up' : 'down'}`}></i>
            </button>
          </div>
          {isOpenQuit && (
            <div className="flex flex-wrap gap-4">
              {quit.map(renderUser)}
            </div>
          )}
        </div>

        {/* Dropped Section */}
        <div className="flex flex-col gap-4">
          <div
            className="flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity border-b border-rose-500/20 pb-2"
            onClick={() => setIsOpenDropped(!isOpenDropped)}
          >
            <h3 className="font-semibold text-rose-500">Dropped ({dropped.length})</h3>
            <button className="text-gray-500 hover:text-rose-500 transition-colors">
              <i className={`fa-solid fa-chevron-${isOpenDropped ? 'up' : 'down'}`}></i>
            </button>
          </div>
          {isOpenDropped && (
            <div className="flex flex-wrap gap-4">
              {dropped.map(renderUser)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
