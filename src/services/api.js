import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Attach JWT token if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('feedsense_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock fallback data for smooth demo if backend isn't actively running
export const mockData = {
  batches: [
    {
      id: 'b1111111-1111-1111-1111-111111111111',
      batch_code: 'SIL-2026-84920',
      feed_type: 'maize_silage',
      quantity_kg: 5000,
      district: 'Akola',
      state: 'Maharashtra',
      storage_type: 'pit',
      date_stored: '2026-09-10',
      opening_freq: 'every_2_3_days',
      moisture_feel: 'moist',
      colour: 'olive_green',
      smell: 'normal_slightly_acidic',
      status: 'active',
      is_listed: true,
      visual_score: 82,
      overall_risk_level: 'low',
      created_at: new Date(Date.now() - 17 * 86400000).toISOString()
    },
    {
      id: 'b2222222-2222-2222-2222-222222222222',
      batch_code: 'SIL-2026-39104',
      feed_type: 'sorghum_silage',
      quantity_kg: 3200,
      district: 'Pune',
      state: 'Maharashtra',
      storage_type: 'bag',
      date_stored: '2026-09-02',
      opening_freq: 'daily',
      moisture_feel: 'wet',
      colour: 'browning',
      smell: 'strongly_acidic',
      status: 'active',
      is_listed: false,
      visual_score: 64,
      overall_risk_level: 'medium',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    }
  ],
  alerts: [
    {
      id: 'a1',
      batch_id: 'b2222222-2222-2222-2222-222222222222',
      alert_type: 'early_warning',
      condition_triggered: 'B',
      alert_reason: 'Batch SIL-2026-39104: Storage age 25 days with wet moisture feel. Quality score projected to drop below 60 in next 5 days.',
      suggested_action: 'Reseal silage bags immediately, reduce opening frequency, and test for aerobic stability.',
      is_read: false,
      triggered_at: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ],
  marketplace: [
    {
      id: 'm1',
      batch_id: 'b1111111-1111-1111-1111-111111111111',
      feed_type: 'maize_silage',
      price_per_kg: 4.80,
      min_quantity_kg: 500,
      available_kg: 4500,
      farmer_name: 'Dnyaneshwar Patil',
      district: 'Akola',
      state: 'Maharashtra',
      quality_score: 82,
      listed_at: '2026-09-20'
    },
    {
      id: 'm2',
      batch_id: 'b3333333-3333-3333-3333-333333333333',
      feed_type: 'tmr',
      price_per_kg: 7.20,
      min_quantity_kg: 200,
      available_kg: 2500,
      farmer_name: 'Rameshwar Shinde',
      district: 'Kolhapur',
      state: 'Maharashtra',
      quality_score: 88,
      listed_at: '2026-09-22'
    },
    {
      id: 'm3',
      batch_id: 'b4444444-4444-4444-4444-444444444444',
      feed_type: 'hay',
      price_per_kg: 6.50,
      min_quantity_kg: 300,
      available_kg: 1800,
      farmer_name: 'Suresh Deshmukh',
      district: 'Ahmednagar',
      state: 'Maharashtra',
      quality_score: 79,
      listed_at: '2026-09-24'
    }
  ],
  leaderboard: [
    { district_rank: 1, farmer_name: 'Babanrao Kadam', avg_score: 91.5, batch_count: 8, district: 'Akola' },
    { district_rank: 2, farmer_name: 'Dnyaneshwar Patil', avg_score: 86.2, batch_count: 5, district: 'Akola' },
    { district_rank: 3, farmer_name: 'Ganesh Gaikwad', avg_score: 84.0, batch_count: 4, district: 'Akola' },
    { district_rank: 4, farmer_name: 'Santosh Jadhav', avg_score: 81.3, batch_count: 6, district: 'Akola' },
    { district_rank: 5, farmer_name: 'Vikas More', avg_score: 78.4, batch_count: 3, district: 'Akola' }
  ]
};

export default api;
