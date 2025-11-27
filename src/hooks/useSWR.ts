import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('API request failed');
  return res.json();
});

export function useInvoices() {
  const { data, error, isLoading, mutate } = useSWR('/api/invoices', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });

  return {
    invoices: data?.invoices || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useParts() {
  const { data, error, isLoading, mutate } = useSWR('/api/parts', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return {
    parts: data?.parts || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useServices(filters?: { status?: string; customerId?: string }) {
  const params = new URLSearchParams(filters as any).toString();
  const url = `/api/services${params ? `?${params}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    services: data?.services || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useAnalytics(days: number = 30) {
  const { data, error, isLoading, mutate } = useSWR(`/api/analytics?days=${days}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 120000, // 2 minutes
  });

  return {
    analytics: data || {},
    isLoading,
    isError: !!error,
    mutate,
  };
}
