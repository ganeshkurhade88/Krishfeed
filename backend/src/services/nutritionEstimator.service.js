// src/services/nutritionEstimator.service.js

const NUTRITION_TABLE = {
  'maize_silage': {
    'fresh': {
      'moist': { cp: [6,8], moisture: [70,75], ndf: [45,50], me: [9,10] },
      'wet':   { cp: [5,7], moisture: [75,80], ndf: [48,53], me: [8,9] },
      'dry':   { cp: [7,9], moisture: [60,65], ndf: [42,47], me: [10,11] }
    },
    '1_4_weeks': {
      'moist': { cp: [7,9], moisture: [65,70], ndf: [44,49], me: [9.5,10.5] },
      'wet':   { cp: [5,7], moisture: [70,75], ndf: [47,52], me: [8.5,9.5] },
      'dry':   { cp: [8,10],moisture: [58,63], ndf: [41,46], me: [10,11] }
    },
    '1_3_months': {
      'moist': { cp: [8,10], moisture: [62,68], ndf: [43,48], me: [9.5,10.5] },
      'wet':   { cp: [6,8], moisture: [68,73], ndf: [46,51], me: [9,10] },
      'dry':   { cp: [9,11], moisture: [55,60], ndf: [40,45], me: [10.5,11.5] }
    },
    '3_months_plus': {
      'moist': { cp: [7,9], moisture: [60,66], ndf: [44,49], me: [9,10] },
      'wet':   { cp: [5,7], moisture: [66,72], ndf: [47,52], me: [8,9] },
      'dry':   { cp: [8,10], moisture: [52,58], ndf: [42,47], me: [9.5,10.5] }
    }
  },
  'sorghum_silage': {},
  'tmr': {},
  'hay': {},
  'concentrate_mix': {},
};

const RISK_RULES = {
  aflatoxin: (colour, storage_duration, moisture) => {
    if (colour === 'dark_black' && moisture === 'wet') return 'high';
    if (colour === 'browning' && storage_duration === '3_months_plus') return 'medium';
    return 'low';
  },
  urea: (feed_type, colour) => {
    if (feed_type === 'concentrate_mix' && colour === 'yellowing') return 'medium';
    return 'low';
  },
  sand: (feed_type) => {
    if (['hay','green_fodder'].includes(feed_type)) return 'medium';
    return 'low';
  },
  phEstimate: (smell, storage_duration) => {
    if (smell === 'strongly_acidic') return [3.5, 4.5];
    if (smell === 'normal_slightly_acidic') return [4.0, 5.0];
    if (smell === 'rotten_putrid') return [5.5, 7.0];
    return [4.5, 5.5];
  }
};

function estimateNutrition(inputs) {
  const {
    feed_type, storage_duration, moisture_feel, colour, smell
  } = inputs;

  const base = NUTRITION_TABLE[feed_type]?.[storage_duration]?.[moisture_feel]
    || NUTRITION_TABLE['maize_silage']['1_4_weeks']['moist']; 

  return {
    crude_protein: base.cp,
    moisture: base.moisture,
    fiber_ndf: base.ndf,
    energy_me: base.me,
    aflatoxin_risk: RISK_RULES.aflatoxin(colour, storage_duration, moisture_feel),
    urea_risk: RISK_RULES.urea(feed_type, colour),
    sand_risk: RISK_RULES.sand(feed_type),
    ph_estimate: RISK_RULES.phEstimate(smell, storage_duration),
    estimation_method: 'rule_based_icar_reference',
    disclaimer: 'Estimated from observable inputs using ICAR/FAO reference ranges. Not a laboratory measurement.'
  };
}

module.exports = { estimateNutrition };
