import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useAuth } from "@/_core/hooks/useAuth";
import { LayoutDashboard, LogOut, PanelLeft, Users, FileText, Search, Terminal, UserCog, Package } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { rolePermissions, UserRole } from "@/utils/rolePermissions";

const allMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", section: "dashboard" },
  { icon: Users, label: "Técnicos", path: "/tecnicos", section: "tecnicos" },
  { icon: FileText, label: "Solicitações", path: "/solicitacoes", section: "solicitacoes" },
  { icon: FileText, label: "Nova Solicitação", path: "/nova-solicitacao", section: "nova-solicitacao" },
  { icon: Search, label: "Consulta", path: "/consulta", section: "consulta" },
  { icon: Terminal, label: "Console", path: "/console", section: "console" },
  { icon: UserCog, label: "Usuários", path: "/usuarios", section: "usuarios" },
  { icon: Package, label: "Equipamentos", path: "/historico-equipamentos", section: "historico-equipamentos" },
];

function getMenuItemsForRole(role: UserRole | undefined): typeof allMenuItems {
  if (!role) return [];
  const allowedSections = rolePermissions[role] || [];
  return allMenuItems.filter(item => allowedSections.includes(item.section));
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const isMobile = useIsMobile();
  const menuItems = getMenuItemsForRole(user?.role as UserRole);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return <MobileDashboard user={user}>{children}</MobileDashboard>;
  }

  return (
    <DesktopDashboard 
      user={user} 
      sidebarWidth={sidebarWidth}
      setSidebarWidth={setSidebarWidth}
    >
      {children}
    </DesktopDashboard>
  );
}

// Mobile Layout
function MobileDashboard({ user, children }: { user: any; children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const menuItems = getMenuItemsForRole(user?.role as UserRole);
  const activeMenuItem = menuItems.find(item => item.path === location);

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Mobile Header */}
      <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <PanelLeft className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="h-16 border-b flex items-center px-4">
                <span className="font-semibold">Navigation</span>
              </div>
              <nav className="flex-1 overflow-auto p-2">
                {menuItems.map(item => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setLocation(item.path);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className="border-t p-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left">
                      <Avatar className="h-9 w-9 border shrink-0">
                        <AvatarFallback className="text-xs font-medium">
                          {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate leading-none">
                          {user?.name || "-"}
                        </p>
                <p className="text-xs text-muted-foreground truncate mt-1.5">
                  {user?.email || "-"}
                </p>
                {user?.role && (
                  <p className="text-xs font-semibold text-primary mt-1">
                    {user.role === 'adminmaster' ? 'Admin Master' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </p>
                )}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <span className="tracking-tight text-foreground">
          {activeMenuItem?.label ?? "Menu"}
        </span>
        <div className="w-9" />
      </div>

      {/* Mobile Content */}
      <main className="flex-1 overflow-auto p-4">
        {children}
      </main>
    </div>
  );
}

// Desktop Layout
function DesktopDashboard({
  user,
  sidebarWidth,
  setSidebarWidth,
  children,
}: {
  user: any;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  children: React.ReactNode;
}) {
  const [location, setLocation] = useLocation();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const menuItems = getMenuItemsForRole(user?.role as UserRole);
  const activeMenuItem = menuItems.find(item => item.path === location);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <div
        ref={sidebarRef}
        className="flex flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur relative"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b flex items-center px-4 justify-between">
          <span className="font-semibold tracking-tight">GoWiFi</span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-auto p-2">
          {menuItems.map(item => {
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left">
                <Avatar className="h-9 w-9 border shrink-0">
                  <AvatarFallback className="text-xs font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-none">
                    {user?.name || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1.5">
                    {user?.email || "-"}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors"
          onMouseDown={() => setIsResizing(true)}
          style={{ zIndex: 50 }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        {children}
      </main>
    </div>
  );
}
