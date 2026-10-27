import { useEffect, useMemo, useState } from 'react';

export default function usePagination(items, itemsPerPage = 12) {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(items.length / itemsPerPage)), [items, items.length, itemsPerPage]);

  useEffect(() => {
    setPage(1);
  }, [items, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, page, itemsPerPage]);

  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return { page, totalPages, paginatedItems, goToPage };
}
