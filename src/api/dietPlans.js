import { API_BASE_URL } from '../config';

const BASE = `${API_BASE_URL}/api`;

const fetchJSON = async (url) => {
  try {
    console.log(`Fetching: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`API Error ${res.status}: ${url}`);
      throw new Error(`Failed: ${url} (${res.status})`);
    }
    const data = await res.json();
    console.log(`Success: ${url}`, data);
    return data;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

// Diet Plans APIs
export const getDietPlans = async (filters = {}, page = 1, pageSize = 20) => {
  let url = `${BASE}/diet-recommendations/?page=${page}&page_size=${pageSize}`;
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.user_id) params.append('user_id', filters.user_id);
  if (filters.nutritionist_id) params.append('nutritionist_id', filters.nutritionist_id);
  if (filters.week_starting) params.append('for_week_starting', filters.week_starting);
  if (filters.search) params.append('search', filters.search);
  
  if (params.toString()) url += `&${params.toString()}`;
  
  return fetchJSON(url);
};

export const getDietPlanById = async (id) => {
  return fetchJSON(`${BASE}/diet-recommendations/${id}/`);
};

export const createDietPlan = async (data) => {
  try {
    console.log('Creating diet plan with data:', data);
    const res = await fetch(`${BASE}/diet-recommendations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const responseData = await res.json();
    console.log('Create diet plan response status:', res.status);
    console.log('Create diet plan response:', responseData);
    if (!res.ok) {
      throw new Error(JSON.stringify(responseData) || `Failed to create plan (${res.status})`);
    }
    return responseData;
  } catch (error) {
    console.error('Create diet plan error:', error);
    throw error;
  }
};

export const updateDietPlan = async (id, data) => {
  try {
    const res = await fetch(`${BASE}/diet-recommendations/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update plan (${res.status})`);
    return res.json();
  } catch (error) {
    console.error('Update diet plan error:', error);
    throw error;
  }
};

export const deleteDietPlan = async (id) => {
  try {
    const res = await fetch(`${BASE}/diet-recommendations/${id}/`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete plan (${res.status})`);
    return { success: true };
  } catch (error) {
    console.error('Delete diet plan error:', error);
    throw error;
  }
};

// Meals APIs
export const getMeals = async (filters = {}) => {
  let url = `${BASE}/meals/`;
  const params = new URLSearchParams();
  
  if (filters.category) params.append('category', filters.category);
  if (filters.search) params.append('search', filters.search);
  
  if (params.toString()) url += `?${params.toString()}`;
  
  return fetchJSON(url);
};

export const getMealById = async (id) => {
  return fetchJSON(`${BASE}/meals/${id}/`);
};

export const createMeal = async (data) => {
  try {
    console.log('Creating meal with data:', data);
    const res = await fetch(`${BASE}/meals/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    console.log('Response status:', res.status);
    const responseData = await res.json();
    console.log('Response data:', responseData);
    if (!res.ok) {
      throw new Error(JSON.stringify(responseData) || `Failed to create meal (${res.status})`);
    }
    return responseData;
  } catch (error) {
    console.error('Create meal error:', error);
    throw error;
  }
};

export const updateMeal = async (id, data) => {
  try {
    const res = await fetch(`${BASE}/meals/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update meal (${res.status})`);
    return res.json();
  } catch (error) {
    console.error('Update meal error:', error);
    throw error;
  }
};

export const deleteMeal = async (id) => {
  try {
    const res = await fetch(`${BASE}/meals/${id}/`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete meal (${res.status})`);
    return { success: true };
  } catch (error) {
    console.error('Delete meal error:', error);
    throw error;
  }
};

// Users API for dropdown
export const getUsers = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/user-list-create/?page=1&page_size=1000`);
    if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`);
    const data = await res.json();
    // Handle paginated response
    return data.results || data;
  } catch (error) {
    console.error('Get users error:', error);
    return [];
  }
};

// Nutritionists API
export const getNutritionists = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/nutritionists/`);
    if (!res.ok) throw new Error(`Failed to fetch nutritionists (${res.status})`);
    return res.json();
  } catch (error) {
    console.error('Get nutritionists error:', error);
    return [];
  }
};

// Get assigned nutritionist for a patient
export const getAssignedNutritionist = async (userId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/${userId}/assigned-nutritionist/`);
    if (!res.ok) {
      console.warn(`No assigned nutritionist found for user ${userId}`);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Get assigned nutritionist error:', error);
    return null;
  }
};
