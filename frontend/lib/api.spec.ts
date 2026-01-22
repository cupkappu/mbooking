// Mock the environment variable and external dependencies
const mockFetch = jest.fn();

jest.mock('next/config', () => ({
  default: () => ({
    publicRuntimeConfig: {
      apiUrl: 'http://localhost:3001',
    },
  }),
}));

// Mock next-auth/react - getSession is imported in api.ts
jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}));

// Mock global fetch before importing the module
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('apiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Return a token to avoid calling /api/auth/session
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'mock-token';
      return null;
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should make GET request', async () => {
    const mockData = { id: '1', name: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockData }),
    });

    // Re-require to get fresh import with mocked fetch
    jest.resetModules();
    global.fetch = mockFetch;
    const { apiClient } = require('./api');

    const result = await apiClient.get('/api/v1/test');
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalled();
    expect(mockFetch.mock.calls[0][0]).toContain('/api/v1/test');
  });

  it('should make POST request with body', async () => {
    const postData = { name: 'New Item' };
    const mockResponse = { id: '1', ...postData };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockResponse }),
    });

    jest.resetModules();
    global.fetch = mockFetch;
    const { apiClient } = require('./api');

    const result = await apiClient.post('/api/v1/items', postData);
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should make PUT request', async () => {
    const putData = { name: 'Updated' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: putData }),
    });

    jest.resetModules();
    global.fetch = mockFetch;
    const { apiClient } = require('./api');

    await apiClient.put('/api/v1/items/1', putData);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should make DELETE request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    jest.resetModules();
    global.fetch = mockFetch;
    const { apiClient } = require('./api');

    await apiClient.delete('/api/v1/items/1');
    expect(mockFetch).toHaveBeenCalled();
  });
});
