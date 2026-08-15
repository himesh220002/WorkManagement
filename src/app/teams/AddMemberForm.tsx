"use client";

import { useState } from "react";

const POSITIONS: Record<string, string[]> = {
  Developer: ["Software Dev", "Web Dev", "Data Engineer", "Tester", "DevOps"],
  Designer: ["UI/UX Designer", "Graphic Designer", "Product Designer"],
  Manager: ["Project Manager", "Product Manager", "Operations Manager"],
  Sales: ["Account Executive", "SDR", "BDR", "Sales Engineer"],
  Executive: ["CEO", "CTO", "CFO", "COO"]
};

export default function AddMemberForm({ teamId, action }: { teamId: string, action: (formData: FormData) => void }) {
  const [role, setRole] = useState<string>("Developer");
  const [position, setPosition] = useState<string>("Software Dev");
  
  const positionsForRole = POSITIONS[role] || [];

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setRole(newRole);
    setPosition(POSITIONS[newRole]?.[0] || "");
  };

  return (
    <form action={action} className="mt-4 flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 flex-wrap">
      <input type="hidden" name="teamId" value={teamId} />
      
      <input 
        type="text" 
        name="name" 
        placeholder="Member Name" 
        className="flex-1 min-w-[120px] p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" 
        required 
      />
      
      <select 
        name="role" 
        value={role}
        onChange={handleRoleChange}
        className="w-32 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      >
        <option value="Developer">Developer</option>
        <option value="Designer">Designer</option>
        <option value="Manager">Manager</option>
        <option value="Sales">Sales</option>
        <option value="Executive">Executive</option>
      </select>
      
      {positionsForRole.length > 0 && (
        <select 
          name="position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="w-36 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          {positionsForRole.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      )}

      <select 
        name="rank" 
        className="w-20 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      >
        <option value="1">Rank 1</option>
        <option value="2">Rank 2</option>
        <option value="3">Rank 3</option>
        <option value="4">Rank 4</option>
        <option value="5">Rank 5</option>
      </select>

      <button type="submit" className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors shrink-0">
        Add
      </button>
    </form>
  );
}
