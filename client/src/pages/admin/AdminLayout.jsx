/* eslint-disable react/prop-types */
import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/ssp.jpeg";

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded text-sm transition ${
    isActive ? "bg-white/20 text-white" : "text-blue-100 hover:bg-white/10"
  }`;

export default function AdminLayout({ children }) {
  const auth = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const closeSidebar = React.useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  React.useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  React.useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        closeSidebar();
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [closeSidebar]);

  const handleLogout = () => {
    auth.logout();
    nav("/admin/login");
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <img src={logo} alt="SSP Logo" className="h-10 w-auto object-contain" />
          <button
            onClick={toggleSidebar}
            className="h-9 w-9 inline-flex items-center justify-center text-blue-900 border border-slate-300 rounded"
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={isSidebarOpen}
            aria-controls="admin-sidebar-drawer"
          >
            {isSidebarOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <button
        aria-label="Close sidebar"
        className={`md:hidden fixed inset-0 bg-slate-900/45 z-40 transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
      />

      <div className="md:grid md:grid-cols-[260px_1fr] min-h-[calc(100vh-57px)] md:min-h-screen">
        <aside
          id="admin-sidebar-drawer"
          className={`bg-blue-950 p-3 md:p-5 fixed md:static inset-y-0 left-0 h-screen md:h-auto w-72 md:w-auto z-50 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
        >
          <div className="hidden md:block mb-6">
            <img src={logo} alt="SSP Logo" className="h-12 w-auto object-contain" />
          </div>
          <div className="md:hidden mb-4 mt-1 flex items-center justify-between">
            <img src={logo} alt="SSP Logo" className="h-10 w-auto object-contain" />
            <button
              onClick={closeSidebar}
              className="h-9 w-9 inline-flex items-center justify-center text-blue-100 border border-blue-800 rounded"
              aria-label="Close sidebar"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <nav className="space-y-2">
            <NavLink onClick={closeSidebar} to="/admin/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink onClick={closeSidebar} to="/admin/members" className={linkClass}>
              Members
            </NavLink>
            <NavLink onClick={closeSidebar} to="/admin/members/create" className={linkClass}>
              Create Member
            </NavLink>
            <NavLink onClick={closeSidebar} to="/admin/payments" className={linkClass}>
              Payments
            </NavLink>
            <NavLink onClick={closeSidebar} to="/admin/membership-price" className={linkClass}>
              Membership Price
            </NavLink>
            <NavLink onClick={closeSidebar} to="/admin/settings" className={linkClass}>
              Settings
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded text-sm text-blue-100 hover:bg-white/10"
            >
              Logout
            </button>
          </nav>
        </aside>

        <main className="bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
