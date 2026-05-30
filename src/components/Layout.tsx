import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { FloatingButton } from "./AIChat/FloatingButton";
import { ChatPanel } from "./AIChat/ChatPanel";

export function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const hideSidebar = isHome;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        {!hideSidebar && <Sidebar />}
        <main className="flex-1 min-w-0">
          <div className="p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
      <FloatingButton />
      <ChatPanel />
    </div>
  );
}
