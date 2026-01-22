import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsPage from '@/app/(dashboard)/settings/page';

jest.unmock('@tanstack/react-query');

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: { user: { id: '1' } }, status: 'authenticated' })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/hooks/use-currencies', () => ({
  useCurrencies: jest.fn(),
}));

jest.mock('@/lib/tenants', () => ({
  tenantsApi: {
    getCurrent: jest.fn(),
    updateSettings: jest.fn(),
  },
}));

jest.mock('@/lib/api', () => ({
  apiClient: {
    delete: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockCurrencies = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    is_active: true,
    is_default: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    is_active: true,
    is_default: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    is_active: false,
    is_default: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockTenant = {
  id: 'tenant-1',
  name: 'Test Tenant',
  settings: {
    default_currency: 'USD',
    timezone: 'UTC',
  },
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

describe('Settings Page - Currencies Tab (React Query)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    require('@/hooks/use-currencies').useCurrencies.mockReturnValue({
      data: mockCurrencies,
      isLoading: false,
      isError: false,
    });

    require('@/lib/tenants').tenantsApi.getCurrent.mockResolvedValue(mockTenant);
    require('@/lib/tenants').tenantsApi.updateSettings.mockResolvedValue(mockTenant);
    require('@/lib/api').apiClient.delete.mockResolvedValue({ success: true });
    require('@/lib/api').apiClient.post.mockResolvedValue({ success: true });
    require('@/lib/api').apiClient.put.mockResolvedValue(mockCurrencies[0]);
  });

  describe('Currencies Display', () => {
    test('should display currencies when data is available', async () => {
      const queryClient = createQueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <SettingsPage />
        </QueryClientProvider>
      );

      await userEvent.click(screen.getByText('Currencies'));

      await waitFor(() => {
        expect(screen.getByText('USD')).toBeInTheDocument();
        expect(screen.getByText('US Dollar')).toBeInTheDocument();
        expect(screen.getByText('€')).toBeInTheDocument();
        expect(screen.getByText('EUR')).toBeInTheDocument();
        expect(screen.getByText('JPY')).toBeInTheDocument();
      });
    });

    test('should show empty state when no currencies', async () => {
      require('@/hooks/use-currencies').useCurrencies.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
      });

      const queryClient = createQueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <SettingsPage />
        </QueryClientProvider>
      );

      await userEvent.click(screen.getByText('Currencies'));

      await waitFor(() => {
        expect(screen.getByText('No currencies found.')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    test('should handle loading state properly', async () => {
      require('@/hooks/use-currencies').useCurrencies.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
      });

      const queryClient = createQueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <SettingsPage />
        </QueryClientProvider>
      );

      await userEvent.click(screen.getByText('Currencies'));

      await waitFor(() => {
        expect(screen.queryByText('USD')).not.toBeInTheDocument();
      });
    });
  });

  describe('Currency Operations', () => {
    test('should set default currency using mutation hook', async () => {
      const queryClient = createQueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <SettingsPage />
        </QueryClientProvider>
      );

      await userEvent.click(screen.getByText('Currencies'));

      await waitFor(() => {
        expect(screen.getByText('EUR')).toBeInTheDocument();
      });

      const setDefaultButtons = await screen.findAllByRole('button', { name: /set default/i });
      await userEvent.click(setDefaultButtons[0]);

      await waitFor(() => {
        expect(require('@/lib/api').apiClient.post).toHaveBeenCalledWith(
          '/currencies/EUR/set-default',
          {}
        );
      });
    });
  });

  describe('No Duplicate Network Requests', () => {
    test('should not make duplicate network requests on tab switch', async () => {
      const useCurrenciesMock = require('@/hooks/use-currencies').useCurrencies;
      useCurrenciesMock.mockReturnValue({
        data: mockCurrencies,
        isLoading: false,
        isError: false,
      });

      const queryClient = createQueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <SettingsPage />
        </QueryClientProvider>
      );

      await userEvent.click(screen.getByText('Currencies'));
      await waitFor(() => {
        expect(screen.getByText('USD')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('General'));
      await userEvent.click(screen.getByText('Currencies'));

      await waitFor(() => {
        expect(screen.getByText('USD')).toBeInTheDocument();
      });
    });
  });
});

describe('Settings Page - General Tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    require('@/hooks/use-currencies').useCurrencies.mockReturnValue({
      data: mockCurrencies,
      isLoading: false,
      isError: false,
    });

    require('@/lib/tenants').tenantsApi.getCurrent.mockResolvedValue(mockTenant);
    require('@/lib/tenants').tenantsApi.updateSettings.mockResolvedValue(mockTenant);
  });

  test('should not break general settings tab', async () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /general settings/i })).toBeInTheDocument();

    await userEvent.click(screen.getByText('Currencies'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /currency management/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('General'));
    expect(screen.getByRole('heading', { name: /general settings/i })).toBeInTheDocument();
  });

  test('should display currencies in default currency dropdown', async () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByText('Currencies'));
    await waitFor(() => {
      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('General'));
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /default currency/i })).toBeInTheDocument();
    });
  });
});
