import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // e.g., '/blog' or '/blog/tag/engineering'
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Show pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    pages.push(totalPages);
  }

  const buildUrl = (page: number) => {
    return `${baseUrl}?page=${page}`;
  };

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      {/* Previous button */}
      {currentPage > 1 ? (
        <Link href={buildUrl(currentPage - 1)}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">Previous</span>
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="w-4 h-4" />
          <span className="sr-only">Previous</span>
        </Button>
      )}

      {/* Page numbers */}
      {pages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
              ...
            </span>
          );
        }

        const isActive = page === currentPage;

        return isActive ? (
          <Button
            key={page}
            variant="primary"
            size="sm"
            className="min-w-[40px]"
            aria-current="page"
          >
            {page}
          </Button>
        ) : (
          <Link key={page} href={buildUrl(page)}>
            <Button variant="outline" size="sm" className="min-w-[40px]">
              {page}
            </Button>
          </Link>
        );
      })}

      {/* Next button */}
      {currentPage < totalPages ? (
        <Link href={buildUrl(currentPage + 1)}>
          <Button variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
            <span className="sr-only">Next</span>
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronRight className="w-4 h-4" />
          <span className="sr-only">Next</span>
        </Button>
      )}
    </nav>
  );
}
