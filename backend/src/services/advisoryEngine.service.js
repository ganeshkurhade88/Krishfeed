// src/services/advisoryEngine.service.js

function generateAdvisory(testResult, forecast, inputs) {
  const score = testResult.visual_score;

  let feedDecision, feedDaysSafe;
  if (score >= 75) {
    feedDecision = 'feed_now';
    feedDaysSafe = Math.max(0, Math.round((score - 65) / forecast.decay_rate));
  } else if (score >= 55) {
    feedDecision = 'monitor';
    feedDaysSafe = Math.max(0, Math.round((score - 55) / forecast.decay_rate));
  } else if (score >= 35) {
    feedDecision = 'hold';
    feedDaysSafe = 0;
  } else {
    feedDecision = 'discard';
    feedDaysSafe = 0;
  }

  const cp = testResult.crude_protein_min;
  let nutritionalGap = '', nutritionalAction = '';
  if (cp < 8) {
    nutritionalGap = `Crude protein estimated at ${testResult.crude_protein_min}–${testResult.crude_protein_max}% — below optimal 10–12% for lactating dairy cows.`;
    nutritionalAction = 'Supplement with 400–600g groundnut cake or soybean meal per cow per day to compensate protein deficit.';
  } else if (cp >= 8 && cp <= 10) {
    nutritionalGap = 'Crude protein within lower acceptable range for dairy.';
    nutritionalAction = 'Monitor milk yield. Consider minor protein supplementation if yield drops.';
  } else {
    nutritionalGap = 'Nutritional profile within acceptable range for dairy feeding.';
    nutritionalAction = 'Maintain current feeding regime. Retest in 15 days.';
  }

  let storageFix = '';
  if (inputs.moisture_feel === 'wet' || inputs.moisture_feel === 'waterlogged') {
    storageFix = 'High moisture detected. Reseal silage pit and cover with weighted tarpaulin. Improve drainage around storage area.';
  } else if (inputs.opening_freq === 'daily') {
    storageFix = 'Frequent opening increases oxygen exposure and mould risk. Reduce opening to every 2–3 days if possible. Remove only what is needed per feeding.';
  } else if (inputs.storage_type === 'open') {
    storageFix = 'Open storage significantly increases spoilage risk. Move to covered pit or plastic bag storage as soon as possible.';
  } else {
    storageFix = 'Current storage conditions are adequate. Maintain seal and check for damage weekly.';
  }

  const advisory_en = `Feed decision: ${feedDecision.replace('_',' ')}. ${nutritionalGap} ${nutritionalAction} Storage advice: ${storageFix}`;

  return {
    feed_decision: feedDecision,
    feed_days_safe: feedDaysSafe,
    nutritional_gap: nutritionalGap,
    nutritional_action: nutritionalAction,
    storage_fix: storageFix,
    advisory_en,
    advisory_mr: getMrText(feedDecision, cp, inputs),
    advisory_hi: getHiText(feedDecision, cp, inputs)
  };
}

function getMrText(decision, cp, inputs) {
  const decisions = {
    feed_now: 'तुमचा चारा खाण्यायोग्य आहे.',
    monitor:  'तुमचा चारा लवकरच तपासा. ८ दिवसांत पुन्हा चाचणी करा.',
    hold:     'चारा आत्ता देऊ नका. तपासणी करा.',
    discard:  'हा चारा टाकून द्या. जनावरांना देऊ नका.'
  };
  return decisions[decision] || decisions['monitor'];
}

function getHiText(decision, cp, inputs) {
  const decisions = {
    feed_now: 'आपका चारा खिलाने योग्य है।',
    monitor:  'अपने चारे की जल्द जांच करें। 8 दिनों में दोबारा परीक्षण करें।',
    hold:     'अभी चारा न दें। निरीक्षण करें।',
    discard:  'यह चारा फेंक दें। पशुओं को न दें।'
  };
  return decisions[decision] || decisions['monitor'];
}

module.exports = { generateAdvisory };
