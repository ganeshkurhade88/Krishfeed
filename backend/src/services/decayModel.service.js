// src/services/decayModel.service.js

const BASE_DECAY = 0.8;

const MODIFIERS = {
  storage_type:  { pit: 0.8, bunker: 1.0, bag: 1.2, open: 1.5, shed: 0.9 },
  moisture_feel: { dry: 0.7, moist: 1.0, wet: 1.4, waterlogged: 1.8 },
  opening_freq:  { weekly: 0.8, every_2_3_days: 1.0, daily: 1.3 },
  temperature:   (t) => t < 20 ? 0.8 : t <= 30 ? 1.0 : 1.3
};

function calculateDecay(inputs) {
  const { storage_type, moisture_feel, opening_freq, temperature_c, base_score } = inputs;

  const dailyDecay = BASE_DECAY
    * MODIFIERS.storage_type[storage_type]
    * MODIFIERS.moisture_feel[moisture_feel]
    * MODIFIERS.opening_freq[opening_freq]
    * MODIFIERS.temperature(temperature_c || 28);

  const score = (days) => Math.max(0, Math.round(base_score - dailyDecay * days));

  return {
    base_score,
    decay_rate: dailyDecay,
    day_0:  base_score,
    day_7:  score(7),
    day_15: score(15),
    day_30: score(30),
    aflatoxin_day7:  score(7) < 60 ? 'medium' : 'low',
    aflatoxin_day15: score(15) < 50 ? 'high' : score(15) < 65 ? 'medium' : 'low',
    aflatoxin_day30: score(30) < 40 ? 'high' : 'medium',
    model: 'rule_based_spoilage_science_v1',
    disclaimer: 'Predictive estimate based on known spoilage principles. Not a validated laboratory forecast.'
  };
}

module.exports = { calculateDecay };
