// src/utils/scoring.js
// Shared scoring utilities used by TestFeed and other components

// ── Visual AI scoring from colour + smell + moisture ──
export const computeVisualScore = (colour, smell, moistureFeel) => {
  const colourScore = {
    green_normal: 95, olive_green: 90, yellowish_green: 75,
    golden_brown: 65, yellowing: 55, brown: 50,
    browning: 45, dark_brown: 35, dark_black: 20, black: 20,
    pale_white: 60
  };
  const smellScore = {
    normal_slightly_acidic: 95, no_smell: 80,
    strongly_acidic: 65, musty: 40, rotten_putrid: 15
  };
  const moistureScore = {
    dry: 70, moist: 95, wet: 55, waterlogged: 30
  };

  const c = colourScore[colour] || 65;
  const s = smellScore[smell] || 65;
  const m = moistureScore[moistureFeel] || 75;

  return Math.round(c * 0.4 + s * 0.35 + m * 0.25);
};

// ── Determine overall risk level from score ──
export const getRiskLevel = (score) => {
  if (score >= 75) return { level: 'low', label: 'Low Risk', emoji: '🟢', color: 'emerald' };
  if (score >= 55) return { level: 'medium', label: 'Caution', emoji: '🟡', color: 'amber' };
  if (score >= 35) return { level: 'high', label: 'High Risk', emoji: '🟠', color: 'orange' };
  return { level: 'critical', label: 'Critical', emoji: '🔴', color: 'red' };
};

// ── Check if AI colour and farmer colour differ ──
export const checkColourMismatch = (aiColour, farmerColour) => {
  // Map both to a simplified category
  const colourCategory = (c) => {
    if (['green_normal', 'olive_green', 'yellowish_green'].includes(c)) return 'green';
    if (['yellowing', 'pale_white'].includes(c)) return 'light';
    if (['golden_brown', 'brown', 'browning'].includes(c)) return 'brown';
    if (['dark_brown', 'dark_black', 'black'].includes(c)) return 'dark';
    return 'unknown';
  };

  const aiCat = colourCategory(aiColour);
  const farmerCat = colourCategory(farmerColour);

  if (aiCat === farmerCat) return { match: true, message: '' };
  return {
    match: false,
    message: 'Colour observation differs from AI analysis. Additional assessment recommended.'
  };
};

// ── Determine if Phase 2 should trigger ──
export const shouldTriggerPhase2 = (visualScore, colourMismatch) => {
  if (visualScore < 75) return true;
  if (colourMismatch && !colourMismatch.match) return true;
  return false;
};

// ── Farmer-friendly impact from score ──
export const computeFarmerImpact = (score, storageType, smellType) => {
  const idealScore = 85;
  const delta = idealScore - score;

  const milkDrop = Math.max(0, parseFloat((delta * 0.05).toFixed(2)));
  const milkGain = delta < 0 ? parseFloat((Math.abs(delta) * 0.03).toFixed(2)) : 0;

  const milkPrice = 35;
  const animals = 4;
  const dailyLoss = Math.max(0, parseFloat((milkDrop * milkPrice * animals).toFixed(0)));
  const dailyGain = parseFloat((milkGain * milkPrice * animals).toFixed(0));

  const spoilagePct = smellType === 'rotten_putrid' ? 0.35
    : smellType === 'musty' ? 0.20
    : smellType === 'strongly_acidic' ? 0.10
    : 0.02;
  const batchWasteCostPerDay = Math.round(spoilagePct * 1000 * 5 / 30);

  return {
    milkDrop, milkGain, dailyLoss, dailyGain,
    batchWasteCostPerDay, spoilagePct: Math.round(spoilagePct * 100)
  };
};

// ── Simulate AI visual analysis of image ──
export const simulateVisualAI = (imageData) => {
  // Simulate TensorFlow.js analysis delay and return mock detections
  return new Promise((resolve) => {
    setTimeout(() => {
      // In production, this would run TensorFlow.js / MobileNet
      const detections = [];
      const aiScore = 60 + Math.floor(Math.random() * 35); // 60-95

      if (aiScore < 70) {
        detections.push('Possible discoloration detected');
        detections.push('Moisture-related indication');
      }
      if (aiScore < 55) {
        detections.push('Potential mould/fungal patches');
      }
      if (aiScore < 40) {
        detections.push('Severe contamination indicators');
      }
      if (detections.length === 0) {
        detections.push('No significant visual contamination detected');
      }

      // Simulate detected colour
      const aiColours = ['olive_green', 'yellowish_green', 'golden_brown', 'browning', 'dark_black'];
      const aiColour = aiScore >= 80 ? aiColours[0]
        : aiScore >= 65 ? aiColours[1]
        : aiScore >= 50 ? aiColours[2]
        : aiScore >= 35 ? aiColours[3]
        : aiColours[4];

      resolve({
        score: aiScore,
        detections,
        aiColour,
        confidence: (0.70 + Math.random() * 0.25).toFixed(2),
        model: 'feedsense-visual-v1'
      });
    }, 2000); // 2 second simulated processing
  });
};

// ── Determine Evidence Level ──
export const determineEvidenceLevel = (inputs) => {
  let score = 0;
  
  if (inputs.hasImage) score += 2;
  // Consider detailed sensory inputs from phase 2
  if (inputs.farmerInputsProvided) score += 2; 
  if (inputs.hasSensors) score += 3;
  if (inputs.hasHistory) score += 1;
  
  if (score >= 6) return { 
    level: 'Strong Evidence', 
    label: 'strong', 
    color: 'bg-emerald-100 text-emerald-800',
    description: 'Hardware-assisted analysis combined with visual and sensory data.' 
  };
  if (score >= 4) return { 
    level: 'Moderate Evidence', 
    label: 'moderate', 
    color: 'bg-amber-100 text-amber-800',
    description: 'Visual analysis combined with detailed farmer sensory inputs.' 
  };
  
  return { 
    level: 'Limited Evidence', 
    label: 'limited', 
    color: 'bg-red-100 text-red-800',
    description: 'Limited evidence — this is a visual screening result. Detailed quality assessment should be confirmed using appropriate testing.' 
  };
};
