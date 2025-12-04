import React from "react";

const Input = ({ label, val, onChange, full }) => (
  <div className={full ? "col-span-2" : ""}>
    <label className="text-[10px] font-bold text-slate-300 uppercase mb-1 block">
      {label}
    </label>
    <input
      className="
        w-full 
        border border-slate-700 
        rounded-md 
        p-2 
        text-sm 
        text-slate-100 
        bg-slate-800 
        placeholder-slate-400
        outline-none 
        focus:ring-1 
        focus:ring-indigo-500
      "
      value={val || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default Input;
