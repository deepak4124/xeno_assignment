import axios, { AxiosInstance } from 'axios';

export class RateLimitError extends Error {
  constructor(public retryAfter: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

export class ShopifyService {
  private client: AxiosInstance;
  private shopDomain: string;

  constructor(shopDomain: string, accessToken: string) {
    this.shopDomain = shopDomain;
    this.client = axios.create({
      baseURL: `https://${shopDomain}/admin/api/2023-10`,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  private async request(endpoint: string, params: any = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return {
        data: response.data,
        nextPageCursor: this.getNextPageCursor(response.headers['link']),
      };
    } catch (error: any) {
      if (error.response && error.response.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '2', 10);
        throw new RateLimitError(retryAfter);
      }
      throw error;
    }
  }

  private getNextPageCursor(linkHeader?: string): string | null {
    if (!linkHeader) return null;
    // Link header format: <https://...>; rel="previous", <https://...>; rel="next"
    const match = linkHeader.match(/<([^>]+)>; rel="next"/);
    if (match) {
      const url = new URL(match[1]);
      return url.searchParams.get('page_info');
    }
    return null;
  }

  async getCustomers(limit: number, cursor?: string) {
    const params: any = { limit };
    if (cursor) params.page_info = cursor;
    const res = await this.request('/customers.json', params);
    return { customers: res.data.customers, nextCursor: res.nextPageCursor };
  }

  async getOrders(limit: number, cursor?: string) {
    const params: any = { limit, status: 'any' };
    if (cursor) params.page_info = cursor;
    const res = await this.request('/orders.json', params);
    return { orders: res.data.orders, nextCursor: res.nextPageCursor };
  }

  async getProducts(limit: number, cursor?: string) {
    const params: any = { limit };
    if (cursor) params.page_info = cursor;
    const res = await this.request('/products.json', params);
    return { products: res.data.products, nextCursor: res.nextPageCursor };
  }
}
