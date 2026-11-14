import React from "react";

export const Skeleton = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse bg-stone-200/80 dark:bg-stone-800 rounded-md ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton = () => (
  <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="w-9 h-9 rounded-lg" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-1/2 h-3" />
      </div>
    </div>
    <Skeleton className="w-full h-8 rounded-lg" />
  </div>
);

export default Skeleton;
