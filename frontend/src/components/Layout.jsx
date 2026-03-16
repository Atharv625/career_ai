import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  MessageSquare, Compass, BarChart2, Map, BookOpen,
  User, ChevronLeft, ChevronRight, Zap, GraduationCap,
  Menu, X
} from "lucide-react";
import { useApp } from "../context/AppContext";

const NAV = [
  { to: "/",         icon: Compass,      label: "Home",           end: true },
  { to: "/chat",     icon: MessageSquare, label: "AI Advisor"   },
  { to: "/recommend",icon: Zap,           label: "Recommend"    },
  { to: "/skill-gap",icon: BarChart2,     label: "Skill Gap"    },
  { to: "/roadmap",  icon: Map,           label: "Roadmap"      },
  { to: "/courses",  icon: GraduationCap, label: "Courses"      },
  { to: "/profile",  icon: User,          label: "My Profile"   },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile } = useApp();
  const location = useLocation();

  const Sidebar = ({ mobile = false }) => (
    <aside
      className={`flex flex-col h-full transition-all duration-300 ${
        mobile ? "w-64" : collapsed ? "w-16" : "w-56"
      }`}
      style={{ background: "var(--ink-900)", borderRight: "1px solid rgba(79,255,176,0.07)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b"
        style={{ borderColor: "rgba(79,255,176,0.07)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--signal)", boxShadow: "0 0 16px rgba(79,255,176,0.4)" }}>
          <Compass size={16} style={{ color: "var(--ink-950)" }} />
        </div>
        {(!collapsed || mobile) && (
          <div className="overflow-hidden">
            <div className="font-display text-sm font-bold text-white leading-tight">CareerPath</div>
            <div className="text-xs" style={{ color: "var(--signal)", opacity: 0.7 }}>AI Advisor</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            title={collapsed && !mobile ? label : undefined}
          >
            <Icon size={16} className="flex-shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Profile mini */}
      {(!collapsed || mobile) && profile.name && (
        <div className="px-3 py-3 mx-2 mb-2 rounded-lg"
          style={{ background: "var(--ink-800)", border: "1px solid rgba(79,255,176,0.08)" }}>
          <div className="text-xs font-medium text-white truncate">{profile.name}</div>
          <div className="text-xs truncate" style={{ color: "var(--signal)", opacity: 0.7 }}>
            {profile.career_goal || "Exploring careers"}
          </div>
        </div>
      )}

      {/* Collapse toggle (desktop) */}
      {!mobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t transition-colors hover:text-white"
          style={{ borderColor: "rgba(79,255,176,0.07)", color: "#4A5568" }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--ink-950)" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: "var(--ink-900)", borderColor: "rgba(79,255,176,0.07)" }}>
          <button onClick={() => setMobileOpen(true)}
            className="text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="font-display text-sm font-bold text-white">CareerPath AI</div>
        </header>

        <main className="flex-1 overflow-y-auto bg-grid" style={{ backgroundSize: "40px 40px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
