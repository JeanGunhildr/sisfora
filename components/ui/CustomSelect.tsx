"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface OptionItem {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ElementType;
}

interface CustomSelectProps {
  options: OptionItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  label,
  disabled = false,
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {label}
        </label>
      )}

      {/* Select Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-left flex items-center justify-between transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
          isOpen ? "bg-white border-indigo-500 ring-2 ring-indigo-500/20" : "hover:bg-slate-100/70"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={`truncate ${selectedOption ? "text-slate-800 font-medium" : "text-slate-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 text-center">
              Tidak ada opsi
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {Icon && <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-normal">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
