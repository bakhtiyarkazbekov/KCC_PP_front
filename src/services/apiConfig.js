import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/';
// const API_BASE_URL = 'http://34.159.60.222:8000/';

const endpoints = {
  // Users
  LOGIN: `user/token/login/`,
  USERS: `user/users/`,
  GET_USER: `user/token/get`,
  CHANGE_PASSWORD: (id) => `user/token/change-password/${id}/`,
  ADMIN_CHANGE_PASSWORD: (id) => `user/users/${id}/admin-change-password/`,

  // Subjects   
  SUBJECTS: `api/subjects/`,
  CALCULATE_P2: `api/subjects/calculate_p2/`,
  SUBJECTS_UPDATES: 'api/subjects/bulk_update_providers/',
  GET_STATUS: 'api/days/get-status/',
  

  // Objects 
  OBJECTS: `api/objects/`,
  DEPENDED_OBJECTS: `api/dependedobjects/`,

  // Providers
  PROVIDERS: `api/provider/`,

  // Days 
  DAYS: `api/days/`,
  PLANS_CREATE: (day) => `api/days/${day}/plansCreate/`,
  ACCEPT_PLAN: (day) => `api/days/${day}/accept/`,
  DIRECTIONS_CREATE: `api/days/directionCreate/`,
  CALCULATE_TARIFFS: `api/days/calculateTariffs/`,
  INDPROV_CREATE: `api/days/indprovCreate/`,
  COEF_CREATE: `api/days/coeftariffCreate/`,
  DISBALANSE_CREATE: `/api/days/disbalanceCreate/`,
  DISBALANSE_SUM: `api/days/disbalanceSum/`,

  // Hours
  HOURS: `api/hours/`,

  // Base Tariff
  BASE_TARIFF: `api/base-tariff/`,

  // Holidays
  HOLIDAYS: `api/holiday/`,

  // Tables
  TABLE: (tableId) => `api/table/${tableId}/`,
  TABLES: `api/table/`,
  FORMULA: `api/formula/`,

  //Logs
  GET_LOGS: `logs/logs/`,
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept request to add token if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { axiosInstance, endpoints };
