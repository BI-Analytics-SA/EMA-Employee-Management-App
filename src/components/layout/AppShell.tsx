import { useState, useCallback, useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sheet } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const MIN_WIDTH = 60;   // collapsed icon-only
const DEFAULT_WIDTH = 320;
const MAX_WIDTH = 320;
const COLLAPSE_THRESHOLD = 100; // below this → snap to collapsed

function loadSidebarState(): { width: number; collapsed: boolean } {
  try {
    const raw = localStorage.getItem("sidebar-state");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        width: typeof parsed.width === "number" ? parsed.width : DEFAULT_WIDTH,
        collapsed: typeof parsed.collapsed === "boolean" ? parsed.collapsed : false,
      };
    }
  } catch {
    // ignore
  }
  return { width: DEFAULT_WIDTH, collapsed: false };
}

function saveSidebarState(width: number, collapsed: boolean) {
  try {
    localStorage.setItem("sidebar-state", JSON.stringify({ width, collapsed }));
  } catch {
    // ignore
  }
}

export function AppShell() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sidebarState, setSidebarState] = useState(loadSidebarState);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const { width: sidebarWidth, collapsed } = sidebarState;

  // Persist state
  useEffect(() => {
    saveSidebarState(sidebarWidth, collapsed);
  }, [sidebarWidth, collapsed]);

  const toggleCollapse = useCallback(() => {
    setSidebarState((prev) => {
      if (prev.collapsed) {
        return { collapsed: false, width: DEFAULT_WIDTH };
      } else {
        return { collapsed: true, width: MIN_WIDTH };
      }
    });
  }, []);

  // Resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = collapsed ? MIN_WIDTH : sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = startWidth.current + delta;

      if (newWidth < COLLAPSE_THRESHOLD) {
        setSidebarState({ collapsed: true, width: MIN_WIDTH });
      } else {
        const clamped = Math.min(Math.max(newWidth, COLLAPSE_THRESHOLD), MAX_WIDTH);
        setSidebarState({ collapsed: false, width: clamped });
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [collapsed, sidebarWidth]);

  const effectiveWidth = collapsed ? MIN_WIDTH : sidebarWidth;

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:shrink-0 relative"
        style={{ width: effectiveWidth }}
      >
        <div className="h-full w-full transition-[width] duration-150 ease-out">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
          />
        </div>
        {/* Resize handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-sidebar-accent/40 active:bg-sidebar-accent/60 transition-colors z-10"
          onMouseDown={handleMouseDown}
        />
      </aside>

      {/* Mobile sidebar sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        side="left"
        className="w-60 bg-sidebar border-none"
      >
        <Sidebar
          onNavClick={() => setSheetOpen(false)}
          hideToggle
        />
      </Sheet>

      {/* Content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSheetOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
