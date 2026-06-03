import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  Home,
  CheckSquare,
  TrendingUp,
  Briefcase,
  X,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { cn } from "../lib/utils";
import { searchAll, type SearchResultItem } from "../lib/search";
import { useProperties } from "../hooks/useProperties";
import { useClients } from "../hooks/useClients";

const TYPE_CONFIG = {
  cliente: {
    label: "Clientes",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  propiedad: {
    label: "Propiedades",
    icon: Home,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  tarea: {
    label: "Tareas",
    icon: CheckSquare,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  venta: {
    label: "Ventas",
    icon: TrendingUp,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  colega: {
    label: "Colegas",
    icon: Briefcase,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
};

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { tasks, sales, referredColleagues, buyers } = useAppContext();
  const { clients } = useClients();
  const { properties } = useProperties();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const results: SearchResultItem[] = useMemo(() => {
    return searchAll(
      { clients, properties, tasks, sales, referredColleagues, buyers },
      query,
    );
  }, [query, clients, properties, tasks, sales, referredColleagues, buyers]);

  const grouped = useMemo(() => {
    const groups: {
      type: SearchResultItem["type"];
      items: SearchResultItem[];
    }[] = [];
    const order: SearchResultItem["type"][] = [
      "cliente",
      "propiedad",
      "venta",
      "tarea",
      "colega",
    ];
    order.forEach((type) => {
      const items = results.filter((r) => r.type === type);
      if (items.length > 0) groups.push({ type, items });
    });
    return groups;
  }, [results]);

  const handleSelect = (result: SearchResultItem) => {
    setIsOpen(false);
    setQuery("");
    navigate(result.path);
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.parentElement?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const shouldShow = isOpen && query.trim().length >= 2;

  return (
    <div className="relative max-w-sm w-full">
      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
        <Search
          size={16}
          className="text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0"
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar clientes, propiedades, ventas..."
          className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:text-slate-500"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            onClick={handleClear}
            className="p-0.5 hover:bg-slate-200 dark:bg-slate-700 rounded flex-shrink-0"
          >
            <X size={14} className="text-slate-400 dark:text-slate-500" />
          </button>
        )}
      </div>

      {shouldShow && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 max-h-[70vh] overflow-y-auto"
          >
            {grouped.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                  No se encontraron resultados
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {grouped.map((group) => {
                  const config = TYPE_CONFIG[group.type];
                  const Icon = config.icon;
                  return (
                    <div key={group.type}>
                      <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        <Icon size={12} />
                        {config.label}
                      </div>
                      {group.items.map((item) => (
                        <button
                          key={item.id + item.type}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:bg-slate-800/50 text-left transition-colors group"
                          onClick={() => handleSelect(item)}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                              config.bg,
                            )}
                          >
                            <Icon size={14} className={config.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {item.subtitle}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
