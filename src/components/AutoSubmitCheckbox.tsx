"use client";

export default function AutoSubmitCheckbox({ 
  defaultChecked, 
  className = "w-5 h-5 cursor-pointer accent-blue-500" 
}: { 
  defaultChecked: boolean;
  className?: string;
}) {
  return (
    <input
      type="checkbox"
      onChange={(e) => e.target.form?.submit()}
      defaultChecked={defaultChecked}
      className={className}
    />
  );
}
