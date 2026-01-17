// Test the apiClient by mocking fetch directly
const mockFetch = jest.fn();

describe('apiClient', () => {
  beforeAll(() => {
    global.fetch = mockFetch;
  });

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should make GET request', async () => {
    const mockData = { id: '1', name: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockData }),
    });

    jest.resetModules();
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
    const { apiClient } = require('./api');
    
    await apiClient.delete('/api/v1/items/1');
    expect(mockFetch).toHaveBeenCalled();
  });
});
