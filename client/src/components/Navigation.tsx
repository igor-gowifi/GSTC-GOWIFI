import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X, BarChart3, Users, List, Plus, Search, LogOut, Wifi, User, Terminal, Settings, Moon, Sun, Package } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userEmail: string;
  userName?: string;
  userRole?: string;
  onLogout: () => void;
}

export default function Navigation({
  activeSection,
  onSectionChange,
  userEmail,
  userName,
  userRole = 'analista',
  onLogout
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['adminmaster', 'admin', 'analista'] },
    { id: 'tecnicos', label: 'Técnicos', icon: Users, roles: ['adminmaster', 'admin'] },
    { id: 'solicitacoes', label: 'Solicitações', icon: List, roles: ['adminmaster', 'admin', 'analista'] },
    { id: 'nova-solicitacao', label: 'Nova Solicitação', icon: Plus, roles: ['adminmaster', 'admin', 'analista'] },
    { id: 'consulta', label: 'Consulta', icon: Search, roles: ['adminmaster', 'admin'] },
    { id: 'console', label: 'Console', icon: Terminal, roles: ['adminmaster'] },
    { id: 'historico-equipamentos', label: 'Histórico de Equipamentos', icon: Package, roles: ['adminmaster', 'admin'] },
    { id: 'usuarios', label: 'Usuários', icon: Settings, roles: ['adminmaster', 'admin'] },
    { id: 'perfil', label: 'Meu Perfil', icon: User, roles: ['adminmaster', 'admin', 'analista'] }
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  const handleNavClick = (sectionId: string) => {
    onSectionChange(sectionId);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'adminmaster':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'analista':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'adminmaster':
        return 'Admin Master';
      case 'admin':
        return 'Admin';
      case 'analista':
        return 'Analista';
      default:
        return role;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Header Bar - Fixed at top */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border flex items-center px-4 z-50 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-muted dark:hover:bg-muted/60 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      )}

      {/* Sidebar - Always on left, toggleable on mobile */}
      <div className={`${
        isMobile && !isMobileMenuOpen ? 'hidden' : 'block'
      } fixed md:relative left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-40 md:z-auto`}>
        
        {/* Logo */}
        <div className="flex items-center gap-2 p-6 border-b border-sidebar-border">
          <Wifi className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-lg">GoWiFi</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium dark:bg-blue-700'
                    : 'text-foreground hover:bg-muted/60 dark:hover:bg-muted/40'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-left flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-sidebar-border bg-sidebar p-4 space-y-3">
          <button
            onClick={() => handleNavClick('perfil')}
            className="w-full text-left hover:bg-muted/50 dark:hover:bg-muted/40 transition-colors rounded-lg p-2 -mx-2"
          >
            <div className="flex items-start gap-2 pb-4 border-b border-input">
              <User className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">Usuário</p>
                <p className="text-sm text-foreground truncate font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                <Badge className={`mt-1 text-xs ${getRoleBadgeColor(userRole)}`}>
                  {getRoleLabel(userRole)}
                </Badge>
              </div>
            </div>
          </button>

          <ThemeToggleButton />
          <Button
            onClick={onLogout}
            variant="destructive"
            className="w-full justify-start"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>


    </>
  );
}

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      className="w-full justify-start"
      size="sm"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 mr-2" />
          Tema Claro
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 mr-2" />
          Tema Escuro
        </>
      )}
    </Button>
  );
}
