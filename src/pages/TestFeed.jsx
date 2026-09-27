import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

// ─── Helper: Compute farmer-friendly impact from score ───────────────────────
const computeFarmerImpact = (score, storageType, smellType) => {
  // Baseline: ideal silage (score ~85) = 0 impact. Each point below costs milk/money.
  const idealScore = 85;
  const delta = idealScore - score; // positive = below ideal

  // Milk yield: 0.05 L drop per point below ideal (per HF crossbred cow, 12L base)
  const milkDrop = Math.max(0, parseFloat((delta * 0.05).toFixed(2)));
  const milkGain = delta < 0 ? parseFloat((Math.abs(delta) * 0.03).toFixed(2)) : 0;

  // Financial: ₹35/L milk price × yield change × 4 animals (default)
  const milkPrice = 35;
  const animals = 4;
  const dailyLoss = Math.max(0, parseFloat((milkDrop * milkPrice * animals).toFixed(0)));
  const dailyGain = parseFloat((milkGain * milkPrice * animals).toFixed(0));

  // Spoilage waste cost: proportion of batch wasted × ₹5/kg
  const spoilagePct = smellType === 'rotten_putrid' ? 0.35 : smellType === 'musty' ? 0.20 : smellType === 'strongly_acidic' ? 0.10 : 0.02;
  const batchWasteCostPerDay = Math.round(spoilagePct * 1000 * 5 / 30); // assume 1000 kg batch

  return { milkDrop, milkGain, dailyLoss, dailyGain, batchWasteCostPerDay, spoilagePct: Math.round(spoilagePct * 100) };
};

// ─── Helper: Nearby farmer alert for mold ────────────────────────────────────
const NEARBY_FARMERS = [
  { id: 'f1', initials: 'RK', name: 'Ramesh K.', village: 'Murtizapur', dist_km: 8, district: 'Akola' },
  { id: 'f2', initials: 'SP', name: 'Suresh P.', village: 'Akot', dist_km: 14, district: 'Akola' },
  { id: 'f3', initials: 'VB', name: 'Vijay B.', village: 'Balapur', dist_km: 11, district: 'Akola' },
  { id: 'f4', initials: 'MN', name: 'Manoj N.', village: 'Telhara', dist_km: 19, district: 'Akola' },
];

const TestFeed = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [alertSent, setAlertSent] = useState(false);
  const [formData, setFormData] = useState({
    feed_type: 'maize_silage',
    quantity_kg: 1000,
    district: 'Akola',
    state: 'Maharashtra',
    storage_type: 'pit',
    date_stored: new Date().toISOString().split('T')[0],
    opening_freq: 'every_2_3_days',
    moisture_feel: 'moist',
    colour: 'olive_green',
    smell: 'normal_slightly_acidic',
    temperature_c: 27
  });

  const [testResult, setTestResult] = useState(null);
  const [testForecast, setTestForecast] = useState(null);
  const [testAdvisory, setTestAdvisory] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertSent(false);

    try {
      // Score the feed visually based on colour + smell inputs
      const colourScore = { olive_green: 90, yellowish_green: 75, brown_yellow: 55, dark_brown: 35, black: 20 };
      const smellScore = { normal_slightly_acidic: 95, strongly_acidic: 70, musty: 45, rotten_putrid: 15 };
      const visual_score = Math.round(
        (colourScore[formData.colour] || 65) * 0.5 + (smellScore[formData.smell] || 65) * 0.5
      );

      // 1. Create the batch
      const batchRes = await api.post('/batches', { ...formData });
      const batchId = batchRes.data.data.id;

      // 2. Run quality test — backend returns { testResult, forecast, advisory }
      const testRes = await api.post(`/testing/${batchId}`, { ...formData, visual_score });
      const { testResult, forecast, advisory } = testRes.data.data;
      setTestResult(testResult);
      setTestForecast(forecast);
      setTestAdvisory(advisory);
      setStep(3);
    } catch (err) {
      console.error('Submission error:', err);
      if (err.response?.status === 401) {
        alert('Please log in first to submit a feed test.');
        window.location.href = '/login';
      } else if (err.response?.status === 400) {
        const errors = err.response.data?.errors;
        const msg = errors ? errors.map(e => e.msg).join(', ') : err.response.data?.message;
        alert('Validation error: ' + msg);
      } else if (!err.response) {
        alert('Cannot reach backend server. Make sure it is running on port 5000.');
      } else {
        alert('Error: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const playTTS = () => {
    if (!testAdvisory) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const lang = i18n.language || 'mr';
      const text = lang === 'mr' ? testAdvisory.advisory_mr :
                   lang === 'hi' ? testAdvisory.advisory_hi : testAdvisory.advisory_en;
      const utterance = new SpeechSynthesisUtterance(text || '');
      utterance.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const chartData = testForecast ? [
    { day: 'Day 0', score: testForecast.base_score },
    { day: 'Day 7', score: testForecast.day_7 },
    { day: 'Day 15', score: testForecast.day_15 },
    { day: 'Day 30', score: testForecast.day_30 }
  ] : [];

  const farmerImpact = testResult
    ? computeFarmerImpact(testResult.visual_score, formData.storage_type, formData.smell)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header & Steps */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-dark-green mb-2">
          🧪 {t('page.testfeed.title') || 'Smart Feed & Silage Quality Tester'}
        </h1>
        <p className="text-grey max-w-xl mx-auto">
          {t('page.testfeed.desc') || 'Rule-based ICAR/FAO AI validation: Get instant quality grading, 30-day spoilage forecast, and regional voice advisory.'}
        </p>

        <div className="flex justify-center items-center gap-4 mt-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${step === 1 ? 'bg-mid-green text-white' : 'bg-pale-green text-dark-green'}`}>
            <span>1</span> <span>Inputs & Image</span>
          </div>
          <div className="w-8 h-0.5 bg-grey opacity-30"></div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${step === 2 ? 'bg-mid-green text-white' : step === 3 ? 'bg-pale-green text-dark-green' : 'bg-light-grey text-grey'}`}>
            <span>2</span> <span>Visual Review</span>
          </div>
          <div className="w-8 h-0.5 bg-grey opacity-30"></div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${step === 3 ? 'bg-mid-green text-white' : 'bg-light-grey text-grey'}`}>
            <span>3</span> <span>AI Report & Passport</span>
          </div>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="card space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-dark-green">Batch & Storage Parameters</h2>
            <p className="text-xs text-grey">All observable inputs follow ICAR dairy feed standards.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label-text">Feed / Silage Type</label>
              <select name="feed_type" value={formData.feed_type} onChange={handleInputChange} className="input-field">
                <option value="maize_silage">Maize Silage (मका सायलेज)</option>
                <option value="sorghum_silage">Sorghum Silage (ज्वारी सायलेज)</option>
                <option value="tmr">Total Mixed Ration (TMR)</option>
                <option value="hay">Dry Grass / Hay (सुका चारा)</option>
                <option value="concentrate_mix">Concentrate Feed (पशुखाद्य)</option>
              </select>
            </div>

            <div>
              <label className="label-text">Quantity (kg)</label>
              <input type="number" name="quantity_kg" value={formData.quantity_kg} onChange={handleInputChange} className="input-field" min="50" required />
            </div>

            <div>
              <label className="label-text">Storage Method</label>
              <select name="storage_type" value={formData.storage_type} onChange={handleInputChange} className="input-field">
                <option value="pit">Underground Pit (खड्डा / बंकर)</option>
                <option value="bunker">Above Ground Bunker</option>
                <option value="bag">Silage Bags (सायलेज बॅग)</option>
                <option value="shed">Covered Shed</option>
                <option value="open">Open Air / Heap (उघड्यावर)</option>
              </select>
            </div>

            <div>
              <label className="label-text">Date Stored</label>
              <input type="date" name="date_stored" value={formData.date_stored} onChange={handleInputChange} className="input-field" required />
            </div>

            <div>
              <label className="label-text">Moisture Texture Feel (हात लावून आर्द्रता)</label>
              <select name="moisture_feel" value={formData.moisture_feel} onChange={handleInputChange} className="input-field">
                <option value="dry">Dry / Brittle (फार कोरडा)</option>
                <option value="moist">Ideal Moist / Squeeze test ok (योग्य ओलावा 65-70%)</option>
                <option value="wet">Excess Wet / Drops water (अती ओला)</option>
                <option value="waterlogged">Waterlogged / Soggiest (पाणथळ)</option>
              </select>
            </div>

            <div>
              <label className="label-text">Smell & Odour (वास)</label>
              <select name="smell" value={formData.smell} onChange={handleInputChange} className="input-field">
                <option value="normal_slightly_acidic">Sweet & Fruity / Pleasantly Acidic (आंबट-गोड चांगला वास)</option>
                <option value="strongly_acidic">Strong Vinegar / Acetic (तीव्र आंबट)</option>
                <option value="rotten_putrid">Putrid / Rancid / Ammonia (कुजलेला/उग्र वास)</option>
                <option value="musty">Musty / Mouldy (बुरशीचा वास)</option>
              </select>
            </div>

            <div>
              <label className="label-text">Silage Colour (रंग)</label>
              <select name="colour" value={formData.colour} onChange={handleInputChange} className="input-field">
                <option value="olive_green">Olive Green / Yellow-Green (हिरवट पिवळा - सर्वोत्तम)</option>
                <option value="golden_brown">Golden Brown (सोनेरी तपकिरी)</option>
                <option value="browning">Dark Brown / Overheated (गडद तपकिरी)</option>
                <option value="dark_black">Dark Black / Mouldy spots (काळा पडलेला / बुरशी)</option>
              </select>
            </div>

            <div>
              <label className="label-text">Pit Opening Frequency</label>
              <select name="opening_freq" value={formData.opening_freq} onChange={handleInputChange} className="input-field">
                <option value="weekly">Weekly (आठवड्यातून एकदा)</option>
                <option value="every_2_3_days">Every 2-3 Days (२-३ दिवसांनी)</option>
                <option value="daily">Daily (दररोज उघडणे)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="btn-primary flex items-center gap-2">
              Next: Photo & Confirmation ➔
            </button>
          </div>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="card space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-dark-green">Upload Sample Photo for Visual AI Scoring</h2>
            <p className="text-xs text-grey">Take a clear close-up photo of silage texture, color, and grain kernel distribution.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="border-2 border-dashed border-mid-green rounded-2xl p-6 text-center bg-off-white hover:bg-pale-green/30 transition-colors">
              <input type="file" id="sample-photo" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <label htmlFor="sample-photo" className="cursor-pointer block">
                {imagePreview ? (
                  <img src={imagePreview} alt="Silage Preview" className="max-h-56 mx-auto rounded-lg shadow-md object-cover" />
                ) : (
                  <div className="py-8">
                    <div className="text-5xl mb-3">📸</div>
                    <span className="font-semibold text-mid-green block">Click to take photo or upload</span>
                    <span className="text-xs text-grey mt-1 block">Supports JPG, PNG (Max 5MB)</span>
                  </div>
                )}
              </label>
            </div>

            <div className="bg-light-grey p-5 rounded-xl space-y-3 text-sm">
              <h4 className="font-bold text-dark">📋 Summary of Evaluation Inputs:</h4>
              <p><span className="text-grey font-medium">Type:</span> {formData.feed_type.replace('_', ' ').toUpperCase()}</p>
              <p><span className="text-grey font-medium">Storage:</span> {formData.storage_type.toUpperCase()}</p>
              <p><span className="text-grey font-medium">Moisture:</span> {formData.moisture_feel}</p>
              <p><span className="text-grey font-medium">Smell:</span> {formData.smell.replace(/_/g, ' ')}</p>
              <p><span className="text-grey font-medium">Colour:</span> {formData.colour.replace(/_/g, ' ')}</p>
              <p><span className="text-grey font-medium">District:</span> {formData.district}, {formData.state}</p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="btn-secondary">⬅ Back</button>
            <button onClick={handleTestSubmit} disabled={loading} className="btn-primary">
              {loading ? 'Analyzing with ICAR-FAO Engine...' : '⚡ Generate Quality Report'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Comprehensive Report */}
      {step === 3 && testResult && (
        <div className="space-y-8 animate-fade-in">

          {/* ── Top Score Banner ── */}
          <div className={`card p-6 border-l-8 ${testResult.visual_score >= 75 ? 'border-lite-green bg-pale-green/30' : testResult.visual_score >= 55 ? 'border-amber bg-amber/10' : 'border-accent-orange bg-red-50'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-grey">Batch Code: {testResult.batch_id}</span>
                <h2 className="text-2xl font-black text-dark-green mt-1">
                  Overall Feed Quality Score: <span className="text-3xl text-mid-green">{testResult.visual_score} / 100</span>
                </h2>
                <p className="text-sm font-medium mt-1">
                  Status: <span className="font-bold capitalize">{testAdvisory?.feed_decision?.replace(/_/g, ' ') || 'Processing'}</span> • Safe Feeding Days: <span className="font-bold text-mid-green">{testAdvisory?.feed_days_safe || '—'} days</span>
                </p>
              </div>

              <div className="flex flex-col items-center gap-2 bg-white p-3 rounded-xl shadow-sm">
                <QRCodeSVG value={`${window.location.origin}/passport/${testResult.batch_id}`} size={90} />
                <span className="text-[10px] font-bold text-dark-green uppercase">Scan Passport</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={playTTS} className="btn-primary flex items-center gap-2 bg-mid-green">
                <span>{isPlayingAudio ? '🔊 Playing...' : '📢 Listen Audio Advice'}</span>
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              FEATURE 1: Farmer-Friendly Impact Insights
          ───────────────────────────────────────────────────────────── */}
          {farmerImpact && (
            <div className="card space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-dark-green text-lg">🐄 Feed Quality → Direct Farmer Impact</h3>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold">⚠️ AI Estimate — Not Guaranteed</span>
              </div>
              <p className="text-xs text-grey -mt-2">Based on ICAR milk response curves for average HF crossbred cows (12 L/day baseline, 4 animals). Actual results depend on breed, health, and management.</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Milk Impact */}
                <div className={`p-4 rounded-xl text-center border-2 ${farmerImpact.milkDrop > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <span className="text-2xl">{farmerImpact.milkDrop > 0 ? '📉' : '📈'}</span>
                  <p className="text-xs text-grey mt-1">Est. Milk Yield Change</p>
                  <p className={`text-xl font-black mt-1 ${farmerImpact.milkDrop > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {farmerImpact.milkDrop > 0 ? `−${farmerImpact.milkDrop} L` : `+${farmerImpact.milkGain} L`}
                  </p>
                  <p className="text-[10px] text-grey">per cow / day</p>
                </div>

                {/* Daily Financial */}
                <div className={`p-4 rounded-xl text-center border-2 ${farmerImpact.dailyLoss > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <span className="text-2xl">💰</span>
                  <p className="text-xs text-grey mt-1">Daily Financial Impact</p>
                  <p className={`text-xl font-black mt-1 ${farmerImpact.dailyLoss > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {farmerImpact.dailyLoss > 0 ? `−₹${farmerImpact.dailyLoss}` : `+₹${farmerImpact.dailyGain}`}
                  </p>
                  <p className="text-[10px] text-grey">for 4 animals/day</p>
                </div>

                {/* Monthly Projection */}
                <div className={`p-4 rounded-xl text-center border-2 ${farmerImpact.dailyLoss > 0 ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <span className="text-2xl">📅</span>
                  <p className="text-xs text-grey mt-1">Monthly Projection</p>
                  <p className={`text-xl font-black mt-1 ${farmerImpact.dailyLoss > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {farmerImpact.dailyLoss > 0 ? `−₹${(farmerImpact.dailyLoss * 30).toLocaleString()}` : `+₹${(farmerImpact.dailyGain * 30).toLocaleString()}`}
                  </p>
                  <p className="text-[10px] text-grey">30-day estimate</p>
                </div>

                {/* Spoilage Waste */}
                <div className={`p-4 rounded-xl text-center border-2 ${farmerImpact.spoilagePct > 10 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="text-2xl">🗑️</span>
                  <p className="text-xs text-grey mt-1">Est. Spoilage Waste</p>
                  <p className={`text-xl font-black mt-1 ${farmerImpact.spoilagePct > 10 ? 'text-red-600' : 'text-amber-600'}`}>
                    ~{farmerImpact.spoilagePct}%
                  </p>
                  <p className="text-[10px] text-grey">of batch affected</p>
                </div>
              </div>

              {/* Action recommendation */}
              <div className={`p-3 rounded-xl text-sm font-medium flex gap-2 items-start ${farmerImpact.dailyLoss > 50 ? 'bg-red-50 text-red-700 border border-red-200' : farmerImpact.dailyLoss > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                <span className="text-xl">
                  {farmerImpact.dailyLoss > 50 ? '🚨' : farmerImpact.dailyLoss > 0 ? '⚠️' : '✅'}
                </span>
                <span>
                  {farmerImpact.dailyLoss > 50
                    ? `High financial risk. Estimated loss of ₹${farmerImpact.dailyLoss}/day if fed to lactating cows. Consider discarding compromised portions and supplementing with quality concentrate immediately.`
                    : farmerImpact.dailyLoss > 0
                    ? `Moderate impact. A small drop in milk yield is likely. Supplement 300–500g of quality protein (mustard cake) per animal daily to compensate.`
                    : `Feed quality is above ideal baseline. You may see a slight improvement in milk yield and animal health compared to average.`
                  }
                </span>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              FEATURE 2: Severe Mold → Nearby Farmer Alert
          ───────────────────────────────────────────────────────────── */}
          {testResult.overall_risk_level === 'high' && (
            <div className="card border-2 border-red-300 bg-red-50 space-y-4">
              <div className="flex justify-between items-center border-b border-red-200 pb-3">
                <div>
                  <h3 className="font-bold text-red-700 text-lg">🚨 Severe Mold / Aflatoxin Risk Detected</h3>
                  <p className="text-xs text-red-600">
                    Mold contamination in your area can spread spores through air and shared equipment. Nearby farmers are at risk.
                  </p>
                </div>
                <span className="text-[10px] bg-red-600 text-white px-3 py-1 rounded-full font-bold uppercase">Critical</span>
              </div>

              {/* Alert Details */}
              <div className="bg-white rounded-xl p-4 text-sm space-y-2 border border-red-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-grey block">Risk Type</span>
                    <strong className="text-red-700">Aflatoxin / Severe Mold</strong>
                  </div>
                  <div>
                    <span className="text-grey block">Affected Area</span>
                    <strong className="text-dark">{formData.district}, {formData.state}</strong>
                  </div>
                  <div>
                    <span className="text-grey block">Alert Radius</span>
                    <strong className="text-dark">15–20 km</strong>
                  </div>
                  <div>
                    <span className="text-grey block">Date / Time</span>
                    <strong className="text-dark">{new Date().toLocaleDateString('en-IN')} {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong>
                  </div>
                </div>
                <div className="mt-2 p-3 bg-red-50 rounded-lg text-xs text-red-700 border border-red-100">
                  <strong>Safety Recommendation:</strong> Do NOT feed dark/mouldy silage to lactating cows. Aflatoxin M1 transfers directly into milk and can make it unfit for human consumption. Stop use, isolate the batch, and send a sample to your nearest FSSAI-approved lab.
                </div>
              </div>

              {/* Nearby Farmers - anonymized */}
              <div>
                <h4 className="text-sm font-bold text-red-700 mb-2">📍 Nearby Farmers to Notify (within 20 km) — Identity Protected</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {NEARBY_FARMERS.map(farmer => (
                    <div key={farmer.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-red-200">
                      <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {farmer.initials}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-dark">{farmer.name} — {farmer.village}</p>
                        <p className="text-[10px] text-grey">{farmer.dist_km} km away • {farmer.district}</p>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full flex-shrink-0">At Risk</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Alert Button */}
              {!alertSent ? (
                <button
                  onClick={() => setAlertSent(true)}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  📣 Send Precautionary Alert to {NEARBY_FARMERS.length} Nearby Farmers
                </button>
              ) : (
                <div className="w-full py-3 bg-emerald-100 text-emerald-700 font-bold rounded-xl flex items-center justify-center gap-2 border border-emerald-200">
                  ✅ Alert Sent Successfully — {NEARBY_FARMERS.length} farmers notified in {formData.district} area
                </div>
              )}
              <p className="text-[10px] text-red-500 text-center">Personal contact details are never shared. Only precautionary mold risk + safety guidance is sent.</p>
            </div>
          )}

          {/* ── Advisory Card ── */}
          <div className="card space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-dark-green text-lg">📢 Expert Advisory & TTS Audio Advice</h3>
              <span className="text-xs bg-pale-green text-dark-green px-3 py-1 rounded-full font-bold">ICAR Standard</span>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-light-grey rounded-xl">
                <span className="text-xs font-bold text-mid-green block mb-1">मराठी सल्ला (Marathi):</span>
                <p className="text-sm font-medium text-dark">{testAdvisory?.advisory_mr || '—'}</p>
              </div>
              <div className="p-4 bg-light-grey rounded-xl">
                <span className="text-xs font-bold text-mid-green block mb-1">हिंदी सलाह (Hindi):</span>
                <p className="text-sm font-medium text-dark">{testAdvisory?.advisory_hi || '—'}</p>
              </div>
              <div className="p-4 bg-light-grey rounded-xl">
                <span className="text-xs font-bold text-mid-green block mb-1">English Advisory:</span>
                <p className="text-sm font-medium text-dark">{testAdvisory?.advisory_en || '—'}</p>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4 space-y-2 text-sm">
              <p><strong className="text-dark-green">Nutritional Gap:</strong> {testAdvisory?.nutritional_gap || '—'}</p>
              <p><strong className="text-dark-green">Diet Action:</strong> {testAdvisory?.nutritional_action || '—'}</p>
              <p><strong className="text-dark-green">Storage Recommendation:</strong> {testAdvisory?.storage_fix || '—'}</p>
            </div>
          </div>

          {/* ── 30-Day Decay Graph ── */}
          <div className="card">
            <h3 className="font-bold text-dark-green text-lg mb-1">📉 30-Day Spoilage & Quality Decay Forecast</h3>
            <p className="text-xs text-grey mb-4">Simulated spoilage trajectory based on current storage conditions and ambient temperature.</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2D6A4F" strokeWidth={3} dot={{ r: 6, fill: '#52B788' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Nutritional Profile ── */}
          <div className="card">
            <h3 className="font-bold text-dark-green text-lg mb-4">🔬 Estimated Nutritional Parameters (ICAR Reference)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-pale-green/40 rounded-xl">
                <span className="text-xs text-grey block">Crude Protein (CP)</span>
                <span className="text-xl font-bold text-dark-green">{testResult.crude_protein_min} – {testResult.crude_protein_max}%</span>
              </div>
              <div className="p-4 bg-pale-green/40 rounded-xl">
                <span className="text-xs text-grey block">Moisture Content</span>
                <span className="text-xl font-bold text-dark-green">{testResult.moisture_min} – {testResult.moisture_max}%</span>
              </div>
              <div className="p-4 bg-pale-green/40 rounded-xl">
                <span className="text-xs text-grey block">Fiber (NDF)</span>
                <span className="text-xl font-bold text-dark-green">{testResult.fiber_ndf_min} – {testResult.fiber_ndf_max}%</span>
              </div>
              <div className="p-4 bg-pale-green/40 rounded-xl">
                <span className="text-xs text-grey block">Estimated pH</span>
                <span className="text-xl font-bold text-dark-green">{testResult.ph_estimate_min} – {testResult.ph_estimate_max}</span>
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex flex-wrap justify-between gap-4">
            <button onClick={() => { setStep(1); setTestResult(null); setTestForecast(null); setTestAdvisory(null); setAlertSent(false); }} className="btn-secondary">
              ➕ Test Another Batch
            </button>
            <div className="flex gap-3">
              <Link to="/dashboard" className="btn-primary">
                📊 View in Farmer Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestFeed;
