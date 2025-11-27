import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600" aria-label="Breadcrumb">
      <Link
        href="/"
        className="hover:text-brand-gold-600 transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-brand-gold-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-brand-navy-900 font-medium' : ''}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
