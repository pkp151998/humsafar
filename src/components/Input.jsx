// src/components/Input.jsx
import React from "react";

const Input = ({ label, val, onChange, full }) => (
  <div className={full ? "col-span-2" : ""}>
    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">
      {label}
    </label>
    <input
      className="w-full border rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
      value={val || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default Input;
