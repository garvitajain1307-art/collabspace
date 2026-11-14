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
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs flex items-center justify-center text-stone-500 dark:text-stone-400 mb-3.5">
          <Icon size={22} strokeWidth={1.75} />
        </div>
      )}
      {title && (
        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">{title}</h4>
      )}
      {description && (
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mb-4 leading-relaxed">
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
