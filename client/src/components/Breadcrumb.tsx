import { useLocation } from 'wouter';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();

  // Parse the current location to generate breadcrumb items
  const getBreadcrumbItems = () => {
    const items: Array<{ label: string; path: string; current: boolean }> = [
      { label: 'Dashboard', path: '/', current: location === '/' }
    ];

    if (location === '/') {
      return items;
    }

    const pathSegments = location.split('/').filter(Boolean);
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Map URL segments to readable labels
      const labelMap: Record<string, string> = {
        'tecnicos': 'Técnicos',
        'solicitacoes': 'Solicitações',
        'nova-solicitacao': 'Nova Solicitação',
        'consulta': 'Consulta',
      };

      // For solicitacao IDs, show "Detalhes"
      if (pathSegments[0] === 'solicitacoes' && index === 1) {
        items.push({
          label: 'Detalhes',
          path: currentPath,
          current: isLast
        });
      } else {
        const label = labelMap[segment] || segment;
        items.push({
          label,
          path: currentPath,
          current: isLast
        });
      }
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 px-2 md:px-4">
      {breadcrumbItems.map((item, index) => (
        <div key={item.path} className="flex items-center gap-1">
          {index === 0 ? (
            <button
              onClick={() => setLocation(item.path)}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ) : (
            <>
              <ChevronRight className="w-4 h-4" />
              {item.current ? (
                <span className="text-foreground font-medium">{item.label}</span>
              ) : (
                <button
                  onClick={() => setLocation(item.path)}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );
}
