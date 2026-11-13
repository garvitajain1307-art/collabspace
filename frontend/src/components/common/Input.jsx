import React from "react";

export const Input = React.forwardRef(
  (
    {
      label,
      error,
      hint,
      icon: Icon,
      iconRight: IconRight,
      className = "",
      required = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-stone-700 flex items-center justify-between"
          >
            <span>
              {label} {required && <span className="text-rose-500">*</span>}
            </span>
            {hint && <span className="text-stone-400 font-normal">{hint}</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3 text-stone-400 pointer-events-none flex items-center">
              <Icon size={16} />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={`w-full rounded-lg border bg-white text-stone-900 text-sm placeholder-stone-400 px-3 py-2 transition duration-150 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 ${
              Icon ? "pl-9" : ""
            } ${IconRight ? "pr-9" : ""} ${
              error
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-stone-300 hover:border-stone-400"
            } ${className}`}
            {...props}
          />
          {IconRight && (
            <div className="absolute right-3 text-stone-400 flex items-center">
              {IconRight}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-rose-500">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
