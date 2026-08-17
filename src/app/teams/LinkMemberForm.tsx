"use client";

import { linkUserToTeam } from "@/actions";

export default function LinkMemberForm({ teamId, availableUsers }: { teamId: string, availableUsers: any[] }) {
  return (
    <form action={linkUserToTeam} className="mt-4 flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 items-center">
      <input type="hidden" name="teamId" value={teamId} />

      <select
        name="userId"
        className="flex-1 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        required
      >
        <option value="">Select a member to add...</option>
        {availableUsers.map(u => (
          <option key={u._id} value={u._id}>
            {u.name} - {u.role} {u.position && `(${u.position})`} - Rank {u.rank || 1}
          </option>
        ))}
      </select>

      <button type="submit" className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors shrink-0 font-semibold">
        <i className="fa-solid fa-link"></i> Link
      </button>
    </form>
  );
}
