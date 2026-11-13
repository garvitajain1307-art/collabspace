import React from "react";
import Button from "./Button";

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-stone-500 mb-3.5">
          <Icon size={22} strokeWidth={1.75} />
        </div>
      )}
      {title && (
        <h4 className="text-sm font-semibold text-stone-900 mb-1">{title}</h4>
      )}
      {description && (
        <p className="text-xs text-stone-500 max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
