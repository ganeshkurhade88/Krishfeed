import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import voiceService from '../services/voiceService';
import { 
  computeVisualScore, 
  getRiskLevel, 
  checkColourMismatch, 
  shouldTriggerPhase2, 
  computeFarmerImpact, 
  simulateVisualAI,
  determineEvidenceLevel
} from '../utils/scoring';

const NEARBY_FARMERS = [
  { id: 'f1', initials: 'RK', name: 'Ramesh K.', village: 'Murtizapur', dist_km: 8, district: 'Akola' },
  { id: 'f2', initials: 'SP', name: 'Suresh P.', village: 'Akot', dist_km: 14, district: 'Akola' },
  { id: 'f3', initials: 'VB', name: 'Vijay B.', village: 'Balapur', dist_km: 11, district: 'Akola' }
];

const COLOUR_OPTIONS = [
  { value: 'olive_green', label: 'Olive Green (हिरवट पिवळा)', color: 'bg-[#556B2F]' },
  { value: 'yellowish_green', label: 'Yellow Green (पिवळसर हिरवा)', color: 'bg-[#9ACD32]' },
  { value: 'golden_brown', label: 'Golden Brown (सोनेरी)', color: 'bg-[#DAA520]' },
  { value: 'browning', label: 'Dark Brown (गडद तपकिरी)', color: 'bg-[#8B4513]' },
  { value: 'dark_black', label: 'Black / Mouldy (काळा)', color: 'bg-[#111111]' }
];

const TestFeed = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { transcript, isListening, startListening, stopListening, isSupported } = useSpeechRecognition(i18n.language);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [assessmentMode, setAssessmentMode] = useState('software');
  
  const [formData, setFormData] = useState({
    feed_type: 'maize_silage',
    quantity_kg: 1000,
    district: 'Akola',
    state: 'Maharashtra',
    storage_type: 'pit',
    date_stored: new Date().toISOString().split('T')[0],
    colour: 'olive_green',
    // New environmental/history fields
    leakage_observed: 'none',
    history_available: 'no',
    // Hardware fields
    sensor_moisture: '',
    sensor_temp: '',
    sensor_ph: '',
    // Phase 2 fields
    moisture_feel: 'moist',
    smell: 'normal_slightly_acidic',
    opening_freq: 'every_2_3_days',
    temperature_c: 27
  });

  const [testResult, setTestResult] = useState(null);
  const [testForecast, setTestForecast] = useState(null);
  const [testAdvisory, setTestAdvisory] = useState(null);
  const [evidenceLevel, setEvidenceLevel] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [voiceActiveField, setVoiceActiveField] = useState(null);

  // Handle Voice Input Mapping
  useEffect(() => {
    if (transcript && voiceActiveField) {
      const lowerT = transcript.toLowerCase();
      let matchedValue = null;

      if (voiceActiveField === 'smell') {
        if (lowerT.includes('sweet') || lowerT.includes('good') || lowerT.includes('चांगला')) matchedValue = 'normal_slightly_acidic';
        else if (lowerT.includes('vinegar') || lowerT.includes('acid') || lowerT.includes('आंबट')) matchedValue = 'strongly_acidic';
        else if (lowerT.includes('rotten') || lowerT.includes('bad') || lowerT.includes('कुजलेला')) matchedValue = 'rotten_putrid';
        else if (lowerT.includes('musty') || lowerT.includes('fungus') || lowerT.includes('बुरशी')) matchedValue = 'musty';
      } else if (voiceActiveField === 'moisture_feel') {
        if (lowerT.includes('dry') || lowerT.includes('कोरडा')) matchedValue = 'dry';
        else if (lowerT.includes('moist') || lowerT.includes('good') || lowerT.includes('योग्य')) matchedValue = 'moist';
        else if (lowerT.includes('wet') || lowerT.includes('ओला')) matchedValue = 'wet';
        else if (lowerT.includes('water') || lowerT.includes('पाणी')) matchedValue = 'waterlogged';
      }

      if (matchedValue) {
        setFormData(prev => ({ ...prev, [voiceActiveField]: matchedValue }));
        stopListening();
        setVoiceActiveField(null);
      }
    }
  }, [transcript, voiceActiveField, stopListening]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const runPhase1 = async () => {
    setLoading(true);
    // Simulate AI image analysis
    const aiRes = await simulateVisualAI(imagePreview);
    setAiAnalysis(aiRes);
    setLoading(false);

    const mismatch = checkColourMismatch(aiRes.aiColour, formData.colour);
    
    // Phase 1 -> Phase 2 if high risk or mismatch, else skip straight to Report
    if (shouldTriggerPhase2(aiRes.score, mismatch)) {
      setStep(2); // Phase 2 Detailed Assessment
    } else {
      // Auto-assign default safe values and submit
      submitFinalTest(aiRes.score);
    }
  };

  const submitFinalTest = async (overrideScore = null) => {
    setLoading(true);
    try {
      const visualScore = overrideScore || computeVisualScore(formData.colour, formData.smell, formData.moisture_feel);

      const evLevel = determineEvidenceLevel({
        hasImage: !!imagePreview,
        farmerInputsProvided: step === 2 || overrideScore !== null,
        hasSensors: assessmentMode === 'hardware' && (formData.sensor_moisture || formData.sensor_temp || formData.sensor_ph),
        hasHistory: formData.history_available === 'yes'
      });
      setEvidenceLevel(evLevel);

      // DUMMY SUBMISSION FOR PRESENTATION
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const dummyBatchId = `B-DEMO-${Math.floor(Math.random() * 10000)}`;
      const dummyTestResult = {
        batch_id: dummyBatchId,
        visual_score: visualScore,
        overall_risk_level: visualScore >= 75 ? 'low' : visualScore >= 55 ? 'medium' : 'high',
      };
      
      const dummyForecast = {
        base_score: visualScore,
        day_7: Math.max(0, visualScore - 5),
        day_15: Math.max(0, visualScore - 12),
        day_30: Math.max(0, visualScore - 25)
      };

      const dummyAdvisory = {
        feed_decision: visualScore >= 75 ? 'safe_to_feed' : visualScore >= 55 ? 'feed_with_caution' : 'do_not_feed',
        feed_days_safe: visualScore >= 75 ? 30 : visualScore >= 55 ? 7 : 0,
        advisory_en: visualScore >= 75 ? "Good quality feed. Safe to feed." : "Suboptimal feed. Use caution. Ensure no visible mold.",
        advisory_mr: visualScore >= 75 ? "चांगल्या प्रतीचा चारा. जनावरांना खायला देण्यास सुरक्षित." : "मध्यम चारा. काळजीपूर्वक वापरा.",
        advisory_hi: visualScore >= 75 ? "अच्छी गुणवत्ता वाला चारा। सुरक्षित है।" : "मध्यम चारा। सावधानी से उपयोग करें।",
        nutritional_action: "Monitor feed intake and milk yield closely.",
        storage_fix: "Ensure proper sealing and avoid moisture exposure."
      };

      // Save to localStorage to show in dashboard
      const dummyBatch = {
        id: dummyBatchId,
        batch_code: dummyBatchId,
        feed_type: formData.feed_type,
        quantity_kg: formData.quantity_kg,
        storage_type: formData.storage_type,
        date_stored: formData.date_stored,
        visual_score: visualScore
      };
      
      const existingBatches = JSON.parse(localStorage.getItem('dummyBatches') || '[]');
      existingBatches.push(dummyBatch);
      localStorage.setItem('dummyBatches', JSON.stringify(existingBatches));

      setTestResult(dummyTestResult);
      setTestForecast(dummyForecast);
      setTestAdvisory(dummyAdvisory);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Error submitting test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceInput = (field) => {
    if (isListening && voiceActiveField === field) {
      stopListening();
      setVoiceActiveField(null);
    } else {
      setVoiceActiveField(field);
      startListening();
    }
  };

  const playTTS = () => {
    if (!testAdvisory) return;
    const lang = i18n.language || 'mr';
    const text = lang === 'mr' ? testAdvisory.advisory_mr : lang === 'hi' ? testAdvisory.advisory_hi : testAdvisory.advisory_en;
    
    voiceService.onStart(() => setIsPlayingAudio(true));
    voiceService.onEnd(() => setIsPlayingAudio(false));
    voiceService.speak(text, lang);
  };

  const chartData = testForecast ? [
    { day: 'Day 0', score: testForecast.base_score },
    { day: 'Day 7', score: testForecast.day_7 },
    { day: 'Day 15', score: testForecast.day_15 },
    { day: 'Day 30', score: testForecast.day_30 }
  ] : [];

  const farmerImpact = testResult ? computeFarmerImpact(testResult.visual_score, formData.storage_type, formData.smell) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header & Steps */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-dark-green mb-2">
          🧪 {t('page.testfeed.title') || 'Smart AI Feed Quality Tester'}
        </h1>
        <p className="text-grey max-w-xl mx-auto">
          Rule-based ICAR/FAO AI validation with True Dual-Phase Assessment.
        </p>

        <div className="flex justify-center items-center gap-4 mt-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${step === 1 ? 'bg-mid-green text-white' : 'bg-pale-green text-dark-green'}`}>
            <span>1</span> <span>Phase 1: Visual & AI</span>
          </div>
          <div className="w-8 h-0.5 bg-grey opacity-30"></div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${step === 2 ? 'bg-mid-green text-white' : step === 3 ? 'bg-pale-green text-dark-green' : 'bg-light-grey text-grey'}`}>
            <span>2</span> <span>Phase 2: Detailed</span>
          </div>
          <div className="w-8 h-0.5 bg-grey opacity-30"></div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${step === 3 ? 'bg-mid-green text-white' : 'bg-light-grey text-grey'}`}>
            <span>3</span> <span>AI Report</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Phase 1: Basic Inputs, Image, and Visual AI Check
      ───────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-dark-green mb-3 text-center">Select Assessment Mode</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => setAssessmentMode('software')} className={`flex-1 py-4 px-6 rounded-xl border-2 font-bold transition-all shadow-sm ${assessmentMode === 'software' ? 'border-mid-green bg-pale-green text-dark-green transform scale-[1.02]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <span className="text-xl block mb-1">📱</span> SOFTWARE-ONLY MODE
              </button>
              <button onClick={() => setAssessmentMode('hardware')} className={`flex-1 py-4 px-6 rounded-xl border-2 font-bold transition-all shadow-sm ${assessmentMode === 'hardware' ? 'border-mid-green bg-pale-green text-dark-green transform scale-[1.02]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <span className="text-xl block mb-1">🔌</span> HARDWARE-ASSISTED MODE
              </button>
            </div>
          </div>

          <div className="card grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-dark-green border-b pb-2">Batch Details</h2>
              <div>
                <label className="label-text">Feed / Silage Type</label>
                <select name="feed_type" value={formData.feed_type} onChange={handleInputChange} className="input-field">
                  <option value="maize_silage">Maize Silage (मका सायलेज)</option>
                  <option value="sorghum_silage">Sorghum Silage (ज्वारी सायलेज)</option>
                  <option value="tmr">Total Mixed Ration (TMR)</option>
                  <option value="hay">Dry Grass / Hay (सुका चारा)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Quantity (kg)</label>
                  <input type="number" name="quantity_kg" value={formData.quantity_kg} onChange={handleInputChange} className="input-field" min="50" required />
                </div>
                <div>
                  <label className="label-text">Storage Method</label>
                  <select name="storage_type" value={formData.storage_type} onChange={handleInputChange} className="input-field">
                    <option value="pit">Underground Pit</option>
                    <option value="bunker">Bunker</option>
                    <option value="bag">Silage Bag</option>
                    <option value="open">Open Air</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Water Leakage / Sealing</label>
                  <select name="leakage_observed" value={formData.leakage_observed} onChange={handleInputChange} className="input-field">
                    <option value="none">Perfectly Sealed</option>
                    <option value="minor">Minor Surface Leaks</option>
                    <option value="major">Major Water Ingress</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Historical Data Available?</label>
                  <select name="history_available" value={formData.history_available} onChange={handleInputChange} className="input-field">
                    <option value="no">No</option>
                    <option value="yes">Yes, past batches tracked</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-text">Ambient / Silage Temperature (°C)</label>
                <input type="number" name="temperature_c" value={formData.temperature_c} onChange={handleInputChange} className="input-field w-full" placeholder="e.g. 27" required />
                <p className="text-[10px] text-gray-500 mt-1">Temperature is critical for predicting spoilage rate.</p>
              </div>
              
              {assessmentMode === 'hardware' && (
                <div className="col-span-1 md:col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-4">
                  <h3 className="font-bold text-blue-800">🔌 Hardware Sensor Data</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label-text">Moisture (%)</label>
                      <input type="number" name="sensor_moisture" value={formData.sensor_moisture} onChange={handleInputChange} className="input-field" placeholder="e.g. 68" />
                    </div>
                    <div>
                      <label className="label-text">Temp (°C)</label>
                      <input type="number" name="sensor_temp" value={formData.sensor_temp} onChange={handleInputChange} className="input-field" placeholder="e.g. 25" />
                    </div>
                    <div>
                      <label className="label-text">pH Level</label>
                      <input type="number" name="sensor_ph" value={formData.sensor_ph} onChange={handleInputChange} className="input-field" placeholder="e.g. 4.2" step="0.1" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="label-text">Select Observed Colour</label>
                <div className="flex gap-3 flex-wrap">
                  {COLOUR_OPTIONS.map(opt => (
                    <button 
                      key={opt.value}
                      onClick={() => setFormData({...formData, colour: opt.value})}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${formData.colour === opt.value ? 'border-mid-green bg-pale-green shadow' : 'border-transparent hover:bg-gray-100'}`}
                    >
                      <div className={`w-10 h-10 rounded-full border border-gray-300 shadow-inner ${opt.color}`}></div>
                      <span className="text-[10px] font-semibold text-center w-20 leading-tight">{opt.label.split(' (')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-dark-green border-b pb-2">AI Visual Assessment</h2>
              <div className="border-2 border-dashed border-mid-green rounded-2xl p-6 text-center bg-off-white hover:bg-pale-green/30 transition-colors h-64 flex flex-col justify-center relative overflow-hidden">
                <input type="file" id="sample-photo" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <label htmlFor="sample-photo" className="cursor-pointer block absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/5 hover:bg-black/10 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="text-5xl mb-3">📸</div>
                      <span className="font-semibold text-mid-green">Upload Silage Photo</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={runPhase1} disabled={loading || !imagePreview} className={`btn-primary px-8 py-4 text-lg ${!imagePreview && 'opacity-50 cursor-not-allowed'}`}>
              {loading ? 'Analyzing Image...' : 'Run Initial AI Check ➔'}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Phase 2: Voice-Assisted Detailed Assessment
      ───────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="card space-y-6">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <h2 className="font-bold text-amber-700">⚠️ Phase 2 Verification Required</h2>
            <p className="text-sm text-amber-600 mt-1">
              AI detected potential discrepancies or high risk in the visual analysis. Please provide additional sensory details.
            </p>
            {aiAnalysis && (
              <ul className="text-xs mt-2 list-disc ml-5 text-dark">
                {aiAnalysis.detections.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Smell Input */}
            <div className="space-y-2">
              <label className="label-text">Smell & Odour (वास)</label>
              <div className="flex gap-2">
                <select name="smell" value={formData.smell} onChange={handleInputChange} className="input-field flex-grow">
                  <option value="normal_slightly_acidic">Sweet & Fruity (चांगला वास)</option>
                  <option value="strongly_acidic">Strong Vinegar (तीव्र आंबट)</option>
                  <option value="rotten_putrid">Putrid / Ammonia (कुजलेला वास)</option>
                  <option value="musty">Musty / Mouldy (बुरशीचा वास)</option>
                </select>
                {isSupported && (
                  <button 
                    onClick={() => toggleVoiceInput('smell')} 
                    className={`p-3 rounded-lg flex items-center justify-center transition-colors ${voiceActiveField === 'smell' ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    🎤
                  </button>
                )}
              </div>
              {voiceActiveField === 'smell' && <p className="text-xs text-red-500 font-bold">Listening for smell description...</p>}
            </div>

            {/* Moisture Input */}
            <div className="space-y-2">
              <label className="label-text">Moisture Feel (हात लावून आर्द्रता)</label>
              <div className="flex gap-2">
                <select name="moisture_feel" value={formData.moisture_feel} onChange={handleInputChange} className="input-field flex-grow">
                  <option value="dry">Dry (फार कोरडा)</option>
                  <option value="moist">Ideal Moist (योग्य ओलावा)</option>
                  <option value="wet">Excess Wet (अती ओला)</option>
                  <option value="waterlogged">Waterlogged (पाणथळ)</option>
                </select>
                {isSupported && (
                  <button 
                    onClick={() => toggleVoiceInput('moisture_feel')} 
                    className={`p-3 rounded-lg flex items-center justify-center transition-colors ${voiceActiveField === 'moisture_feel' ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    🎤
                  </button>
                )}
              </div>
              {voiceActiveField === 'moisture_feel' && <p className="text-xs text-red-500 font-bold">Listening for moisture description...</p>}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="btn-secondary">⬅ Back</button>
            <button onClick={() => submitFinalTest()} disabled={loading} className="btn-primary">
              {loading ? 'Processing...' : 'Submit Final Assessment ⚡'}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Phase 3: AI Report & Passport (Mostly Reused from Old Code)
      ───────────────────────────────────────────────────────────── */}
      {step === 3 && testResult && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded text-sm text-yellow-800">
            <strong>⚠️ Disclaimer:</strong> This is an AI/software-based preliminary assessment, not a laboratory certification. Parameters that cannot be reliably measured from visual or user-provided data must be confirmed using appropriate laboratory or sensor-based testing.
          </div>

          {evidenceLevel && (
            <div className={`p-4 rounded-xl border ${evidenceLevel.color.replace('text', 'border')} ${evidenceLevel.color} bg-opacity-20 flex items-start gap-3`}>
              <div className="text-2xl mt-1">🔎</div>
              <div>
                <h3 className="font-bold text-lg">Assessment Evidence Level: {evidenceLevel.level}</h3>
                <p className="text-sm mt-1">{evidenceLevel.description}</p>
              </div>
            </div>
          )}

          {/* Top Score Banner */}
          <div className={`card p-6 border-l-8 ${testResult.visual_score >= 75 ? 'border-lite-green bg-pale-green/30' : testResult.visual_score >= 55 ? 'border-amber bg-amber/10' : 'border-accent-orange bg-red-50'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-grey">Batch Code: {testResult.batch_id}</span>
                <h2 className="text-2xl font-black text-dark-green mt-1">
                  Feed Quality Score: <span className="text-3xl text-mid-green">{testResult.visual_score} / 100</span>
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
                <span>{isPlayingAudio ? '🔊 Playing Advisory...' : '📢 Listen Audio Advice'}</span>
              </button>
            </div>
          </div>

          {/* Farmer Impact */}
          {farmerImpact && (
            <div className="card space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-dark-green text-lg">🐄 Direct Farmer Impact</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl text-center border-2 ${farmerImpact.milkDrop > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <span className="text-2xl">{farmerImpact.milkDrop > 0 ? '📉' : '📈'}</span>
                  <p className="text-xs text-grey mt-1">Est. Milk Yield</p>
                  <p className={`text-xl font-black mt-1 ${farmerImpact.milkDrop > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {farmerImpact.milkDrop > 0 ? `−${farmerImpact.milkDrop} L` : `+${farmerImpact.milkGain} L`}
                  </p>
                </div>
                <div className={`p-4 rounded-xl text-center border-2 ${farmerImpact.dailyLoss > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <span className="text-2xl">💰</span>
                  <p className="text-xs text-grey mt-1">Daily Finance</p>
                  <p className={`text-xl font-black mt-1 ${farmerImpact.dailyLoss > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {farmerImpact.dailyLoss > 0 ? `−₹${farmerImpact.dailyLoss}` : `+₹${farmerImpact.dailyGain}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Severe Mold Alert */}
          {testResult.overall_risk_level === 'high' && (
            <div className="card border-2 border-red-300 bg-red-50 space-y-4">
              <h3 className="font-bold text-red-700 text-lg">🚨 Severe Mold / Aflatoxin Risk Detected</h3>
              {!alertSent ? (
                <button onClick={() => setAlertSent(true)} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700">
                  📣 Send Alert to {NEARBY_FARMERS.length} Nearby Farmers
                </button>
              ) : (
                <div className="w-full py-3 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-center">
                  ✅ Alert Sent Successfully
                </div>
              )}
            </div>
          )}

          {/* Advisory & Decay Graph */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card space-y-4">
              <h3 className="font-bold text-dark-green text-lg border-b pb-3">📢 Expert Advisory</h3>
              <div className="bg-light-grey p-4 rounded-xl">
                <p className="text-sm font-medium text-dark">{testAdvisory?.advisory_mr}</p>
              </div>
              <div className="space-y-2 text-sm pt-2">
                <p><strong className="text-dark-green">Nutrition:</strong> {testAdvisory?.nutritional_action}</p>
                <p><strong className="text-dark-green">Storage:</strong> {testAdvisory?.storage_fix}</p>
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold text-dark-green text-lg mb-4">📉 30-Day Decay Forecast</h3>
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
          </div>

          <div className="flex flex-wrap justify-between gap-4">
            <button onClick={() => { setStep(1); setTestResult(null); setImagePreview(null); }} className="btn-secondary">
              ➕ Test Another Batch
            </button>
            <Link to="/dashboard" className="btn-primary">📊 View Dashboard</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestFeed;
