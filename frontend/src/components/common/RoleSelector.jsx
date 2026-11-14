import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, ShieldCheck, Eye, Sparkles } from "lucide-react";

const ROLE_OPTIONS = [
  {
    value: "editor",
    label: "Editor",
    description: "Can create, edit, organize folders and write documents",
    icon: ShieldCheck,
    badgeColor: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900/50",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access to browse workspace folders and documents",
    icon: Eye,
    badgeColor: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60",
  },
];

export const RoleSelector = ({
  value = "editor",
  onChange,
  disabled = false,
  label = "Workspace Role",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);
  const popoverRef = useRef(null);

  const selectedRole =
    ROLE_OPTIONS.find((r) => r.value === value) || ROLE_OPTIONS[0];

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      // Check available space below button
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 220);
      }
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const nextRole = value === "editor" ? "viewer" : "editor";
      onChange?.(nextRole);
    }
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-stone-400 font-normal">
            Assign workspace permissions
          </span>
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? "border-violet-600 dark:border-violet-500 ring-2 ring-violet-500/15 dark:ring-violet-500/20 bg-white dark:bg-stone-900 shadow-xs"
            : "border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 hover:bg-stone-100/60 dark:hover:bg-stone-800/50 hover:border-stone-300 dark:hover:border-stone-700"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${selectedRole.badgeColor}`}
          >
            <selectedRole.icon size={15} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 leading-tight">
              {selectedRole.label}
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                {selectedRole.value}
              </span>
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate leading-tight mt-0.5">
              {selectedRole.description}
            </span>
          </div>
        </div>

        <ChevronDown
          size={16}
          className={`text-stone-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-violet-600 dark:text-violet-400" : ""
          }`}
        />
      </button>

      {/* Custom Popover Menu */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 z-50 p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xl shadow-stone-900/10 dark:shadow-black/50 space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto overscroll-contain ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {ROLE_OPTIONS.map((role) => {
            const isSelected = role.value === value;
            const Icon = role.icon;

            return (
              <div
                key={role.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange?.(role.value);
                  setIsOpen(false);
                }}
                className={`p-2.5 rounded-lg flex items-start gap-3 cursor-pointer transition select-none ${
                  isSelected
                    ? "bg-violet-50/80 dark:bg-violet-950/30 text-stone-900 dark:text-stone-100 border border-violet-200/60 dark:border-violet-800/40"
                    : "hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300 border border-transparent"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border mt-0.5 ${role.badgeColor}`}
                >
                  <Icon size={14} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {role.label}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-700 dark:text-violet-400">
                        <Check size={13} strokeWidth={3} />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                    {role.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
