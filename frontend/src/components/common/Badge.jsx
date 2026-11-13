import React from "react";

export const Badge = ({
  children,
  variant = "default", // owner | editor | viewer | pending | success | danger | default
  size = "md", // sm | md
  className = "",
}) => {
  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
  };

  const variantStyles = {
    owner: "bg-purple-100 text-purple-700 border-purple-200",
    editor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    viewer: "bg-stone-100 text-stone-600 border-stone-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    danger: "bg-rose-100 text-rose-700 border-rose-200",
    default: "bg-stone-100 text-stone-700 border-stone-200",
  };

  const normalized = (variant || "default").toLowerCase();
  const selectedStyle = variantStyles[normalized] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${sizeStyles[size]} ${selectedStyle} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
