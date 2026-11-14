import React from "react";

export const Button = React.forwardRef(
  (
    {
      children,
      variant = "primary", // primary | secondary | outline | danger | ghost
      size = "md", // sm | md | lg
      disabled = false,
      loading = false,
      icon: Icon,
      iconRight: IconRight,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-3.5 py-2 gap-2",
      lg: "text-base px-4 py-2.5 gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white shadow-xs focus:ring-violet-500",
      secondary:
        "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:bg-stone-300 text-stone-800 dark:text-stone-200 focus:ring-stone-400 border border-stone-200 dark:border-stone-700",
      outline:
        "bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 active:bg-stone-100 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700 shadow-xs focus:ring-stone-400",
      danger:
        "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus:ring-rose-500",
      dangerOutline:
        "bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 active:bg-rose-200/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 shadow-xs focus:ring-rose-500",
      success:
        "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs focus:ring-emerald-500",
      successOutline:
        "bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 active:bg-emerald-200/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 shadow-xs focus:ring-emerald-500",
      ghost:
        "bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800 active:bg-stone-200 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 focus:ring-stone-400",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        ) : (
          Icon && <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
        )}
        <span>{children}</span>
        {IconRight && !loading && (
          <IconRight size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
