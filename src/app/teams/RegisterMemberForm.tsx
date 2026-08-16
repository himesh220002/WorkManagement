"use client";

import { useState } from "react";
import { registerUser } from "@/actions";

const POSITIONS: Record<string, string[]> = {
  Developer: ["Software Dev", "Web Dev", "Data Engineer", "Tester", "DevOps"],
  Designer: ["UI/UX Designer", "Graphic Designer", "Product Designer"],
  Manager: ["Project Manager", "Product Manager", "Operations Manager"],
  Sales: ["Account Executive", "SDR", "BDR", "Sales Engineer"],
  Executive: ["CEO", "CTO", "CFO", "COO"]
};

export default function RegisterMemberForm() {
  const [role, setRole] = useState<string>("Developer");
  const [position, setPosition] = useState<string>("Software Dev");
  
  const positionsForRole = POSITIONS[role] || [];

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setRole(newRole);
    setPosition(POSITIONS[newRole]?.[0] || "");
  };

  return (
    <form action={registerUser} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 rounded-lg mb-6 flex gap-4 flex-wrap items-center">
      <div className="flex items-center gap-2 mb-2 w-full">
         <i className="fa-solid fa-user-plus text-blue-500"></i>
         <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Register Global Member</h2>
      </div>
      <input 
        type="text" 
        name="name" 
        placeholder="Member Name" 
        className="flex-1 min-w-[150px] p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" 
        required 
      />
      
      <select 
        name="role" 
        value={role}
        onChange={handleRoleChange}
        className="w-36 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
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
          className="w-40 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          {positionsForRole.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      )}

      <select 
        name="rank" 
        className="w-24 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      >
        <option value="1">Rank 1</option>
        <option value="2">Rank 2</option>
        <option value="3">Rank 3</option>
        <option value="4">Rank 4</option>
        <option value="5">Rank 5</option>
      </select>

      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors flex items-center gap-2 font-semibold shrink-0">
        <i className="fa-solid fa-check"></i> Register
      </button>
    </form>
  );
}
