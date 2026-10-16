"use client";

import { useState, useEffect, useRef, useId, useCallback, type KeyboardEvent } from "react";
import { Search, X, Loader2, Train, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SuggestionItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  meta?: Record<string, unknown>;
}

interface SuggestionComboboxProps {
  type?: "train" | "station" | "custom";
  value?: string;
  placeholder?: string;
  label?: string;
  id?: string;
  initialItems?: SuggestionItem[];
  fetchUrl?: string;
  onSelect: (item: SuggestionItem) => void;
  className?: string;
  disabled?: boolean;
}

export function SuggestionCombobox({
  type = "train",
  value,
  placeholder,
  label,
  id: externalId,
  initialItems = [],
  fetchUrl,
  onSelect,
  className,
  disabled = false,
}: SuggestionComboboxProps) {
  const generatedId = useId();
  const inputId = externalId || generatedId;

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<SuggestionItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const defaultFetchUrl =
    fetchUrl || (type === "train" ? "/api/sim/trains" : type === "station" ? "/api/sim/stations" : "");

  // Fetch suggestions from API or filter initial items
  const fetchSuggestions = useCallback(
    async (searchTerm: string) => {
      if (!defaultFetchUrl) {
        if (!searchTerm.trim()) {
          setItems(initialItems);
        } else {
          const lower = searchTerm.toLowerCase();
          setItems(
            initialItems.filter(
              (it) =>
                it.title.toLowerCase().includes(lower) ||
                it.id.toLowerCase().includes(lower) ||
                it.subtitle?.toLowerCase().includes(lower) ||
                it.badge?.toLowerCase().includes(lower)
            )
          );
        }
        return;
      }

      try {
        setIsLoading(true);
        const url = `${defaultFetchUrl}${
          defaultFetchUrl.includes("?") ? "&" : "?"
        }q=${encodeURIComponent(searchTerm)}&limit=30`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Search request failed");
        const data = await res.json();

        let mapped: SuggestionItem[] = [];

        if (type === "train") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mapped = (data.trains || []).map((t: any) => ({
            id: t.train_number,
            title: t.train_name,
            subtitle: `${t.origin_station_code || t.origin_name || ""} → ${
              t.destination_station_code || t.destination_name || ""
            }${t.train_type ? ` · ${t.train_type}` : ""}`,
            badge: t.train_number,
            meta: t,
          }));
        } else if (type === "station") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mapped = (data.stations || []).map((s: any) => ({
            id: s.code,
            title: s.name,
            subtitle: `${s.state || ""} · ${s.zone || "IR"}${s.is_junction ? " (Junction)" : ""}`,
            badge: s.code,
            meta: s,
          }));
        } else {
          mapped = data.items || [];
        }

        setItems(mapped);
      } catch (err) {
        console.warn("SuggestionCombobox fetch note:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [defaultFetchUrl, type, initialItems]
  );

  // Sync initial query with incoming value
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  // Initial load of top popular suggestions
  useEffect(() => {
    if (initialItems.length > 0) {
      setItems(initialItems);
    } else if (defaultFetchUrl) {
      fetchSuggestions("");
    }
  }, [initialItems, defaultFetchUrl, fetchSuggestions]);

  // Debounced input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setQuery(nextVal);
    setIsOpen(true);
    setSelectedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(nextVal);
    }, 180);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectItem = (item: SuggestionItem) => {
    setQuery(`${item.title} (${item.badge || item.id})`);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(item);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        const item = items[selectedIndex];
        if (item) handleSelectItem(item);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleClear = () => {
    setQuery("");
    fetchSuggestions("");
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full text-xs", className)}>
      {label && (
        <label htmlFor={inputId} className="block font-medium text-foreground mb-1">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3 text-muted-foreground pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          ) : type === "train" ? (
            <Train className="w-3.5 h-3.5 text-primary/70" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-primary/70" />
          )}
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${inputId}-listbox`}
          aria-activedescendant={
            selectedIndex >= 0 ? `${inputId}-opt-${selectedIndex}` : undefined
          }
          disabled={disabled}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            if (items.length === 0) fetchSuggestions(query);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ||
            (type === "train"
              ? "Type train name or number (e.g. raj-, 22691)..."
              : "Type station code or city (e.g. SBC, Bengaluru, NDLS)...")
          }
          className="w-full h-9 pl-9 pr-8 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs transition-all"
        />

        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Clear search"
            aria-label="Clear input"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && (
        <div
          id={`${inputId}-listbox`}
          role="listbox"
          className="absolute z-50 top-full left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-border bg-surface text-foreground shadow-xl divide-y divide-border/40 animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {items.length > 0 ? (
            items.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={`${item.id}-${idx}`}
                  id={`${inputId}-opt-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleSelectItem(item)}
                  className={cn(
                    "px-3.5 py-2 cursor-pointer flex items-center justify-between text-xs transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/60 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-muted/60 border border-border/70 text-foreground shrink-0">
                      {item.badge || item.id}
                    </span>
                    <div className="truncate">
                      <p className="font-medium text-foreground truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                    <Search className="w-3 h-3 opacity-30" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {isLoading ? "Searching suggestions..." : "No matching suggestions found."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
