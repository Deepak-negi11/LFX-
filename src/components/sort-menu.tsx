"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";

type Option<T extends string> = { value: T; label: string };

/**
 * Styled dropdown (replaces the native <select>, which looks like the OS menu).
 * Keyboard: Enter/Space/ArrowDown opens, arrows move, Home/End jump, Enter selects, Esc closes.
 */
export function SortMenu<T extends string>({
  value,
  options,
  onChange,
  label = "Sort by",
  fullWidth = false,
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  label?: string;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  function openMenu() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(i: number) {
    onChange(options[i].value);
    setOpen(false);
    btnRef.current?.focus();
  }

  function onButtonKey(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openMenu();
    }
  }

  function onListKey(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + options.length) % options.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") btnRef.current?.focus();
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${label}: ${current.label}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onButtonKey}
        className={`inline-flex h-11 items-center justify-between gap-2 rounded-lg border bg-surface px-3.5 text-sm font-medium text-ink transition-colors hover:border-line-strong active:scale-[0.98] ${
          open ? "border-accent-fill" : "border-line"
        } ${fullWidth ? "w-full" : "min-w-[164px]"}`}
      >
        <span className="truncate">{current.label}</span>
        <CaretDown
          size={14}
          weight="bold"
          aria-hidden="true"
          className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <ul
        ref={listRef}
        id={`${id}-list`}
        role="listbox"
        tabIndex={-1}
        aria-label={label}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onKeyDown={onListKey}
        className={`absolute right-0 z-40 mt-2 w-full min-w-[200px] origin-top-right rounded-xl border border-line bg-surface p-1.5 shadow-[0_16px_40px_-16px_rgb(0_0_0/0.35)] outline-none transition-[opacity,transform] duration-150 ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        {options.map((o, i) => {
          const selected = o.value === value;
          return (
            <li
              key={o.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={selected}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                i === active ? "bg-accent-soft text-accent" : "text-ink"
              } ${selected ? "font-semibold" : ""}`}
            >
              {o.label}
              {selected && <Check size={14} weight="bold" aria-hidden="true" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
