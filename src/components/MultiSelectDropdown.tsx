"use client";

import { useState, useRef, useEffect } from "react";

export default function MultiSelectDropdown({ 
  name, 
  options, 
  placeholder = "Select..." 
}: { 
  name: string, 
  options: {id: string, name: string}[], 
  placeholder?: string 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelection = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectedNames = options.filter(o => selected.includes(o.id)).map(o => o.name).join(", ");

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Hidden inputs to ensure standard FormData submission works natively */}
      {selected.map(id => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      
      <div 
        className="tech-input outline-none cursor-pointer flex justify-between items-center min-h-[42px] transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`truncate pr-2 ${selected.length === 0 ? "text-gray-500 dark:text-gray-400" : ""}`}>
          {selected.length > 0 ? selectedNames : placeholder}
        </span>
        <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-blue-500/30 bg-gray-900/90 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.3)] p-2 flex flex-col gap-1">
          {options.map(u => (
            <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/10 p-2 rounded transition-colors text-gray-100 text-sm">
              <input 
                type="checkbox" 
                checked={selected.includes(u.id)}
                onChange={() => toggleSelection(u.id)}
                className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-800 w-4 h-4 cursor-pointer" 
              />
              <span className="truncate">{u.name}</span>
            </label>
          ))}
          {options.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-2 italic">No options available</div>
          )}
        </div>
      )}
    </div>
  );
}
