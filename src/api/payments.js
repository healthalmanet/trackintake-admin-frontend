import { API_BASE_URL } from '../config';

const BASE = `${API_BASE_URL}/api/subscription`;

export const getPayments = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${BASE}/usage/${query ? "?" + query : ""}`;
    console.log(`Fetching payments from: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Payments API error: ${res.status}`);
      throw new Error(`Failed to fetch payments (${res.status})`);
    }
    const data = await res.json();
    console.log('Payments data:', data);
    return data;
  } catch (error) {
    console.error('getPayments error:', error);
    throw error;
  }
};

export const getPaymentAnalytics = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${BASE}/payments/analytics/${query ? "?" + query : ""}`;
    console.log(`Fetching analytics from: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Analytics API error: ${res.status}`);
      throw new Error(`Failed to fetch analytics (${res.status})`);
    }
    const data = await res.json();
    console.log('Analytics data:', data);
    return data;
  } catch (error) {
    console.error('getPaymentAnalytics error:', error);
    throw error;
  }
};
