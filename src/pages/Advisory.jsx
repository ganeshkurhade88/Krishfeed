import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Advisory = () => {
  const { t, i18n } = useTranslation();
  const [selectedIssue, setSelectedIssue] = useState('mould');
  const [animalCount, setAnimalCount] = useState(4);
  const [milkYield, setMilkYield] = useState(12);
  const [breedType, setBreedType] = useState('hf_crossbred');
  const [lactationStage, setLactationStage] = useState('early');
  const [activeSection, setActiveSection] = useState('ration');
  const [selectedSeason, setSelectedSeason] = useState('kharif');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Breed-specific adjustment factors
  const breedFactors = {
    hf_crossbred: { name: 'HF Crossbred', concentrate_mult: 1.0, silage_mult: 1.0, cp_need: '16-18%', me_need: '11.0 MJ/kg' },
    jersey_cross: { name: 'Jersey Crossbred', concentrate_mult: 0.85, silage_mult: 0.9, cp_need: '15-17%', me_need: '10.5 MJ/kg' },
    murrah_buffalo: { name: 'Murrah Buffalo', concentrate_mult: 1.1, silage_mult: 1.15, cp_need: '14-16%', me_need: '10.0 MJ/kg' },
    desi_cow: { name: 'Desi / Indigenous Cow', concentrate_mult: 0.6, silage_mult: 0.7, cp_need: '12-14%', me_need: '9.5 MJ/kg' },
    pandharpuri_buffalo: { name: 'Pandharpuri Buffalo', concentrate_mult: 1.05, silage_mult: 1.1, cp_need: '14-16%', me_need: '10.0 MJ/kg' }
  };

  // Lactation stage adjustments
  const lactationFactors = {
    early: { name: 'Early Lactation (0-90 days)', concentrate_add: 2.0, silage_add: 5, note: 'Peak yield period. Maximize energy density. Add bypass fat 100g/day.' },
    mid: { name: 'Mid Lactation (90-200 days)', concentrate_add: 0, silage_add: 0, note: 'Stable production. Maintain balanced ration with good quality silage.' },
    late: { name: 'Late Lactation (200-305 days)', concentrate_add: -1.5, silage_add: -3, note: 'Reduce concentrate gradually. Prevent over-conditioning before dry period.' },
    dry: { name: 'Dry Period', concentrate_add: -3.0, silage_add: -8, note: 'Low energy ration. Feed good quality hay. Add anionic salts 3 weeks before calving.' }
  };

  const breed = breedFactors[breedType];
  const lactation = lactationFactors[lactationStage];

  const rationAdvice = {
    greenSilage: Math.max(0, (animalCount * (20 * breed.silage_mult + lactation.silage_add))).toFixed(1),
    dryFodder: (animalCount * 5).toFixed(1),
    concentrate: Math.max(0, (animalCount * ((milkYield * 0.4 + 1.5) * breed.concentrate_mult + lactation.concentrate_add))).toFixed(1),
    mineralMix: (animalCount * 50),
    salt: (animalCount * 30),
    water: (animalCount * (milkYield * 3 + 20)).toFixed(0)
  };

  const monthlyCost = {
    silage: (rationAdvice.greenSilage * 5 * 30).toFixed(0),
    dry: (rationAdvice.dryFodder * 3 * 30).toFixed(0),
    concentrate: (rationAdvice.concentrate * 22 * 30).toFixed(0),
    mineral: (rationAdvice.mineralMix * 0.08 * 30).toFixed(0),
    total: function() { return (Number(this.silage) + Number(this.dry) + Number(this.concentrate) + Number(this.mineral)); }
  };

  // Seasonal forage calendar
  const seasonalCalendar = {
    kharif: {
      name: 'Kharif (June - October)',
      emoji: '🌧️',
      crops: [
        { name: 'Maize (मका)', action: 'Sow June, Harvest Aug-Sep for silage', tip: 'Best silage crop. Harvest at milky-dough stage (30-35% DM).' },
        { name: 'Sorghum (ज्वारी)', action: 'Sow June-July, Cut for silage Sep', tip: 'Multi-cut variety CO-27 recommended. High sugar content for fermentation.' },
        { name: 'Napier Bajra (NB-21)', action: 'Perennial, Cut every 45 days', tip: 'Year-round green fodder. Apply 25kg urea after each cut.' },
        { name: 'Cowpea (चवळी)', action: 'Sow July, Mix with sorghum', tip: 'Legume intercrop increases protein. Mix 30% cowpea with sorghum for silage.' }
      ],
      risks: ['Excess moisture during monsoon → prone to clostridia in silage', 'Mold growth on hay if not sun-dried properly']
    },
    rabi: {
      name: 'Rabi (November - February)',
      emoji: '❄️',
      crops: [
        { name: 'Berseem (बरसीम)', action: 'Sow Oct, 4-5 cuts through Feb', tip: 'King of fodder crops. 20-22% CP. First cut at 50 days.' },
        { name: 'Oats (जई)', action: 'Sow Oct-Nov, Cut Dec-Feb', tip: 'Excellent for silage. Mix with berseem for protein balance.' },
        { name: 'Lucerne (अल्फा-अल्फा)', action: 'Perennial, cut every 30 days', tip: 'High protein (18-20% CP). Avoid feeding alone to buffalo (bloat risk).' },
        { name: 'Mustard (मोहरी)', action: 'Sow Oct, Cake available Feb+', tip: 'Mustard cake: excellent protein supplement at ₹20-25/kg.' }
      ],
      risks: ['Cold stress in animals → increase energy in diet by 10-15%', 'Frost damage on berseem → cover with mulch/straw']
    },
    summer: {
      name: 'Summer (March - May)',
      emoji: '☀️',
      crops: [
        { name: 'Maize (Summer)', action: 'Sow March, Silage by May', tip: 'Irrigated summer maize fills the fodder gap. Shorter crop cycle.' },
        { name: 'Bajra (Pearl Millet)', action: 'Sow March, Green feed Apr-May', tip: 'Most drought tolerant. Multi-cut variety GFB-1.' },
        { name: 'Lobia (Cowpea)', action: 'Sow March, Cut at 50 days', tip: 'Legume cover crop, improves soil nitrogen.' },
        { name: 'Stored Silage', action: 'Use kharif silage reserves', tip: 'Critical period. Open pit silage carefully—remove 15cm face daily.' }
      ],
      risks: ['Severe green fodder scarcity — plan stored silage', 'Heat stress → ensure 80-100 liters water/animal/day', 'Aflatoxin risk increases in stored concentrate']
    }
  };

  // Problem solver knowledge base
  const problemSolver = {
    mould: {
      label: 'White / Black Mould (बुरशी)',
      emoji: '🟢',
      severity: 'High',
      cause: 'Oxygen penetration due to loose packing, torn plastic cover, or insufficient pit compaction.',
      symptoms: ['White/grey/black fuzzy patches on surface', 'Musty smell', 'Feed refusal by animals'],
      actions: [
        'Discard ALL visible mouldy parts (at least 15cm beyond visible mould)',
        'Do NOT feed to lactating cows — aflatoxin M1 transfers directly to milk',
        'Immediately reseal edges with weighted tarpaulins & tire sidewalls',
        'Apply salt layer (1 kg/sq meter) on exposed face to inhibit further growth'
      ],
      prevention: 'Pack silage at minimum 250 kg/m³ density. Use double-layer plastic (black + white). Ensure no air pockets during filling.'
    },
    rancid: {
      label: 'Foul / Ammonia Smell (कुजलेला वास)',
      emoji: '🟡',
      severity: 'Medium-High',
      cause: 'Clostridial fermentation from harvesting too wet (>72% moisture) or soil contamination during filling.',
      symptoms: ['Strong ammonia or rotten egg smell', 'Slimy/greasy texture', 'Dark olive to black color', 'pH above 5.0'],
      actions: [
        'Mix spoiled silage in small quantities (max 20%) with dry kadbi straw',
        'Discard completely if pungent ammonia smell persists',
        'Add 200g baking soda per animal daily to buffer rumen pH if feeding',
        'Test pH — if above 5.5, do not feed to lactating animals'
      ],
      prevention: 'Wilt crop to 30-35% dry matter before ensiling. Avoid soil contamination. Raise cutting height to 15cm.'
    },
    heating: {
      label: 'Aerobic Heating / Hot Pit (गरम होणे)',
      emoji: '🔴',
      severity: 'High',
      cause: 'Yeasts and molds activating when silage face is exposed to air for extended periods.',
      symptoms: ['Silage feels warm/hot to touch (>35°C)', 'Sweet/alcoholic smell', 'Dry/crumbly texture at face', 'Rapid color change'],
      actions: [
        'Remove at least 15-20cm of silage cleanly across the ENTIRE pit face daily',
        'Never dig deep holes — maintain a flat, clean face',
        'Feed heated silage within 2 hours of removal or discard',
        'Apply propionic acid spray (0.5%) on the exposed face to inhibit yeast'
      ],
      prevention: 'Use inoculant with L. buchneri at ensiling. Feed minimum 15cm across full face daily. Avoid opening in afternoon heat.'
    },
    wetness: {
      label: 'Waterlogged / Excess Moisture',
      emoji: '🔵',
      severity: 'Medium',
      cause: 'Water seepage from heavy rain, insufficient drainage, or ensiling crop at >72% moisture.',
      symptoms: ['Dripping water when squeezed', 'Effluent pooling at pit base', 'Foul/sour smell at base', 'Low dry matter intake'],
      actions: [
        'Dig deep diversion trenches around the pit perimeter',
        'Slope the pit entrance outward to drain surface water',
        'Mix waterlogged silage 50:50 with dry straw before feeding',
        'Pump out standing water and add lime powder (2 kg/sq meter) to pit floor'
      ],
      prevention: 'Choose elevated ground for pit. Build 30cm raised bund around pit. Wilt crop to <70% moisture. Install drainage pipe at base.'
    },
    low_intake: {
      label: 'Low Feed Intake / Refusal',
      emoji: '⚠️',
      severity: 'Medium',
      cause: 'Poor palatability, high butyric acid, dusty concentrate, or animal health issues.',
      symptoms: ['Animals leaving feed in trough', 'Reduced milk yield', 'Weight loss', 'Selective eating (picking grain, leaving silage)'],
      actions: [
        'Check feed for off-smell, mould, or contamination',
        'Add 200-300ml jaggery water to TMR to improve palatability',
        'Ensure feed is fresh — remove uneaten feed within 4 hours',
        'Check animal temperature — fever (>39.5°C) causes inappetence',
        'Ensure clean, fresh water available at all times'
      ],
      prevention: 'Maintain consistent feeding schedule. Gradually introduce new feeds over 7-10 days. Ensure proper particle size in TMR.'
    },
    aflatoxin: {
      label: 'Aflatoxin / Mycotoxin Risk',
      emoji: '☣️',
      severity: 'Critical',
      cause: 'Aspergillus flavus contamination in stored grains, cottonseed cake, or groundnut cake. Worse in hot humid conditions.',
      symptoms: ['No visible signs in feed (requires lab test)', 'Reduced milk yield', 'Poor reproduction', 'Aflatoxin M1 in milk (>0.5 ppb = unsafe)'],
      actions: [
        'Immediately stop feeding suspected contaminated concentrate',
        'Send sample to nearest FSSAI-approved lab for aflatoxin B1 test',
        'Add activated charcoal / HSCAS clay binder at 0.5% of concentrate',
        'Switch to freshly milled concentrate from verified source'
      ],
      prevention: 'Store concentrate in dry, cool area (<14% moisture). Buy from FSSAI-certified mills. Check for discoloration, musty smell. Rotate stock within 30 days.'
    }
  };

  // Voice advisory
  const playTTS = (text, lang = 'mr-IN') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentSeason = seasonalCalendar[selectedSeason];
  const currentProblem = problemSolver[selectedIssue];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-extrabold text-dark-green">
          🩺 {t('nav.advisory') || 'Advisory'} — Smart Dairy Feed Engine
        </h1>
        <p className="text-grey text-sm mt-1">
          ICAR-based ration balancing, seasonal forage planning, silage problem diagnosis & voice guidance.
        </p>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 bg-light-grey p-1.5 rounded-xl">
        {[
          { id: 'ration', label: '🧮 Ration Calculator', desc: 'Daily feed plan' },
          { id: 'problems', label: '🛠️ Problem Solver', desc: 'Diagnose issues' },
          { id: 'seasonal', label: '📅 Seasonal Planner', desc: 'Forage calendar' },
          { id: 'tips', label: '📚 Best Practices', desc: 'Expert tips' }
        ].map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex-1 min-w-[140px] ${
              activeSection === sec.id 
                ? 'bg-dark-green text-white shadow-md' 
                : 'text-grey hover:text-dark hover:bg-white'
            }`}
          >
            <span className="block">{sec.label}</span>
            <span className={`text-[10px] font-normal block ${activeSection === sec.id ? 'text-lite-green' : 'text-grey'}`}>{sec.desc}</span>
          </button>
        ))}
      </div>

      {/* ======================== RATION CALCULATOR ======================== */}
      {activeSection === 'ration' && (
        <div className="space-y-6">
          <div className="card space-y-6">
            <div className="border-b pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-dark-green">🧮 Smart Ration Balancing Calculator</h2>
                <p className="text-xs text-grey">Breed-specific, lactation-stage adjusted. Based on ICAR dairy cattle feeding standards.</p>
              </div>
              <button 
                onClick={() => playTTS(
                  `तुमच्या ${animalCount} जनावरांसाठी दररोजचा आहार: हिरवा चारा ${rationAdvice.greenSilage} किलो, सुका चारा ${rationAdvice.dryFodder} किलो, पशुखाद्य ${rationAdvice.concentrate} किलो, खनिज मिश्रण ${rationAdvice.mineralMix} ग्रॅम. पाणी किमान ${rationAdvice.water} लिटर द्या.`,
                  'mr-IN'
                )}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              >
                {isPlayingAudio ? '🔊 Playing...' : '🔊 मराठी सल्ला ऐका'}
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="grid md:grid-cols-4 gap-5">
              <div>
                <label className="label-text">Breed (जात)</label>
                <select value={breedType} onChange={(e) => setBreedType(e.target.value)} className="input-field">
                  <option value="hf_crossbred">HF Crossbred (एचएफ संकर)</option>
                  <option value="jersey_cross">Jersey Crossbred (जर्सी संकर)</option>
                  <option value="murrah_buffalo">Murrah Buffalo (मुर्रा म्हैस)</option>
                  <option value="pandharpuri_buffalo">Pandharpuri Buffalo (पंढरपुरी)</option>
                  <option value="desi_cow">Desi / Indigenous Cow (देशी गाय)</option>
                </select>
              </div>
              <div>
                <label className="label-text">Lactation Stage</label>
                <select value={lactationStage} onChange={(e) => setLactationStage(e.target.value)} className="input-field">
                  <option value="early">Early (0-90 days)</option>
                  <option value="mid">Mid (90-200 days)</option>
                  <option value="late">Late (200-305 days)</option>
                  <option value="dry">Dry Period</option>
                </select>
              </div>
              <div>
                <label className="label-text">Milking Animals</label>
                <input 
                  type="number" value={animalCount} 
                  onChange={(e) => setAnimalCount(Math.max(1, Number(e.target.value)))}
                  className="input-field" min="1"
                />
              </div>
              <div>
                <label className="label-text">Avg Milk (L/day)</label>
                <input 
                  type="number" value={milkYield} 
                  onChange={(e) => setMilkYield(Math.max(1, Number(e.target.value)))}
                  className="input-field" min="1"
                />
              </div>
            </div>

            {/* Lactation Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex gap-2">
              <span className="text-lg">💡</span>
              <div>
                <strong>{lactation.name}:</strong> {lactation.note}
              </div>
            </div>

            {/* Daily Ration Results */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs text-grey block">🌿 Green / Silage</span>
                <span className="text-xl font-black text-dark-green">{rationAdvice.greenSilage}</span>
                <span className="text-xs text-grey block">kg/day</span>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-xs text-grey block">🌾 Dry Fodder</span>
                <span className="text-xl font-black text-amber-700">{rationAdvice.dryFodder}</span>
                <span className="text-xs text-grey block">kg/day</span>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-xs text-grey block">🧪 Concentrate</span>
                <span className="text-xl font-black text-blue-700">{rationAdvice.concentrate}</span>
                <span className="text-xs text-grey block">kg/day</span>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <span className="text-xs text-grey block">⚗️ Mineral Mix</span>
                <span className="text-xl font-black text-purple-700">{rationAdvice.mineralMix}</span>
                <span className="text-xs text-grey block">g/day</span>
              </div>
              <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                <span className="text-xs text-grey block">🧂 Common Salt</span>
                <span className="text-xl font-black text-pink-700">{rationAdvice.salt}</span>
                <span className="text-xs text-grey block">g/day</span>
              </div>
              <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                <span className="text-xs text-grey block">💧 Clean Water</span>
                <span className="text-xl font-black text-cyan-700">{rationAdvice.water}</span>
                <span className="text-xs text-grey block">litres/day</span>
              </div>
            </div>

            {/* Breed Requirements */}
            <div className="bg-light-grey p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-grey block">Breed:</span>
                <strong className="text-dark">{breed.name}</strong>
              </div>
              <div>
                <span className="text-grey block">CP Requirement:</span>
                <strong className="text-dark-green">{breed.cp_need}</strong>
              </div>
              <div>
                <span className="text-grey block">ME Requirement:</span>
                <strong className="text-dark-green">{breed.me_need}</strong>
              </div>
              <div>
                <span className="text-grey block">Est. Monthly Feed Cost:</span>
                <strong className="text-accent-orange text-lg">₹{monthlyCost.total().toLocaleString()}</strong>
              </div>
            </div>

            {/* Monthly Cost Breakdown */}
            <div className="bg-white border rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-sm text-dark-green">📊 Monthly Feed Cost Breakdown (Estimated)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="flex justify-between p-2 bg-emerald-50 rounded-lg">
                  <span>Silage @ ₹5/kg</span>
                  <strong>₹{Number(monthlyCost.silage).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-2 bg-amber-50 rounded-lg">
                  <span>Dry Fodder @ ₹3/kg</span>
                  <strong>₹{Number(monthlyCost.dry).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-2 bg-blue-50 rounded-lg">
                  <span>Concentrate @ ₹22/kg</span>
                  <strong>₹{Number(monthlyCost.concentrate).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-2 bg-purple-50 rounded-lg">
                  <span>Minerals</span>
                  <strong>₹{Number(monthlyCost.mineral).toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================== PROBLEM SOLVER ======================== */}
      {activeSection === 'problems' && (
        <div className="space-y-6">
          <div className="card space-y-5">
            <div className="border-b pb-4">
              <h2 className="text-xl font-bold text-dark-green">🛠️ Silage & Feed Problem Diagnoser</h2>
              <p className="text-xs text-grey">Select your issue to get step-by-step veterinary guidance.</p>
            </div>

            {/* Issue Selector */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(problemSolver).map(([id, prob]) => (
                <button
                  key={id}
                  onClick={() => setSelectedIssue(id)}
                  className={`px-3 py-3 rounded-xl text-xs font-bold transition-all text-left flex items-start gap-2 ${
                    selectedIssue === id 
                      ? 'bg-dark-green text-white shadow-md' 
                      : 'bg-light-grey text-dark hover:bg-pale-green'
                  }`}
                >
                  <span className="text-lg">{prob.emoji}</span>
                  <div>
                    <span className="block">{prob.label}</span>
                    <span className={`text-[10px] ${selectedIssue === id ? 'text-lite-green' : 'text-grey'}`}>
                      Severity: {prob.severity}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Diagnosis Card */}
            {currentProblem && (
              <div className="bg-off-white border-2 border-mid-green/30 rounded-xl overflow-hidden">
                {/* Severity Bar */}
                <div className={`px-5 py-3 flex justify-between items-center ${
                  currentProblem.severity === 'Critical' ? 'bg-red-600 text-white' :
                  currentProblem.severity === 'High' ? 'bg-accent-orange text-white' :
                  'bg-amber-500 text-white'
                }`}>
                  <span className="font-bold text-sm">{currentProblem.emoji} {currentProblem.label}</span>
                  <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                    Severity: {currentProblem.severity}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Cause */}
                  <div>
                    <h4 className="text-xs font-bold text-grey uppercase tracking-wider mb-1">Root Cause</h4>
                    <p className="text-sm text-dark font-medium">{currentProblem.cause}</p>
                  </div>

                  {/* Symptoms */}
                  <div>
                    <h4 className="text-xs font-bold text-grey uppercase tracking-wider mb-2">Symptoms to Check</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentProblem.symptoms.map((s, i) => (
                        <span key={i} className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-medium">
                          ⚠️ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Steps */}
                  <div>
                    <h4 className="text-xs font-bold text-dark-green uppercase tracking-wider mb-2">✅ Immediate Actions</h4>
                    <div className="space-y-2">
                      {currentProblem.actions.map((action, i) => (
                        <div key={i} className="flex gap-3 items-start bg-white p-3 rounded-lg border">
                          <span className="bg-dark-green text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-sm text-dark">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prevention */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">🛡️ Prevention for Future</h4>
                    <p className="text-sm text-emerald-800">{currentProblem.prevention}</p>
                  </div>

                  {/* Voice Button */}
                  <button 
                    onClick={() => {
                      const text = `समस्या: ${currentProblem.label}. कारण: ${currentProblem.cause}. उपाय: ${currentProblem.actions.join('. ')}`;
                      playTTS(text, 'mr-IN');
                    }}
                    className="btn-secondary text-xs py-2 flex items-center gap-2 w-fit"
                  >
                    {isPlayingAudio ? '🔊 ऐकत आहे...' : '🔊 मराठीत ऐका'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================== SEASONAL PLANNER ======================== */}
      {activeSection === 'seasonal' && (
        <div className="space-y-6">
          <div className="card space-y-5">
            <div className="border-b pb-4">
              <h2 className="text-xl font-bold text-dark-green">📅 Seasonal Forage & Silage Calendar</h2>
              <p className="text-xs text-grey">Plan your fodder crops and silage-making schedule throughout the year.</p>
            </div>

            {/* Season Selector */}
            <div className="flex gap-2">
              {Object.entries(seasonalCalendar).map(([id, season]) => (
                <button
                  key={id}
                  onClick={() => setSelectedSeason(id)}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    selectedSeason === id
                      ? 'bg-dark-green text-white shadow-md'
                      : 'bg-light-grey text-dark hover:bg-pale-green'
                  }`}
                >
                  {season.emoji} {season.name}
                </button>
              ))}
            </div>

            {/* Crops Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {currentSeason.crops.map((crop, i) => (
                <div key={i} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-dark text-sm">{crop.name}</h4>
                    <span className="text-[10px] bg-pale-green text-dark-green font-bold px-2 py-1 rounded-full">Recommended</span>
                  </div>
                  <p className="text-xs text-mid-green font-semibold">📆 {crop.action}</p>
                  <p className="text-xs text-grey leading-relaxed">💡 {crop.tip}</p>
                </div>
              ))}
            </div>

            {/* Season Risks */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-red-700 text-sm">⚠️ Season-Specific Risks</h4>
              {currentSeason.risks.map((risk, i) => (
                <p key={i} className="text-xs text-red-700 flex items-start gap-2">
                  <span className="text-red-500">•</span> {risk}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================== BEST PRACTICES ======================== */}
      {activeSection === 'tips' && (
        <div className="space-y-6">
          {/* Silage Making Guide */}
          <div className="card space-y-4">
            <h2 className="text-xl font-bold text-dark-green">📚 Silage Making — Step-by-Step Guide</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { step: 1, title: 'Harvest at Right Stage', desc: 'Maize: Milky-dough stage (30-35% DM). Sorghum: 50% flowering. NB Hybrid: 45 days growth.' },
                { step: 2, title: 'Chop to 2-3 cm Length', desc: 'Use chaff cutter. Uniform particle size ensures tight packing and better fermentation.' },
                { step: 3, title: 'Fill & Pack Tightly', desc: 'Fill pit in layers of 15-20cm. Pack each layer thoroughly with tractor or by foot trampling.' },
                { step: 4, title: 'Add Inoculant (Optional)', desc: 'Sprinkle salt (0.5%) or jaggery water (2%) for faster lactic acid fermentation.' },
                { step: 5, title: 'Seal Airtight Immediately', desc: 'Cover with polythene sheet, add soil/sand layer (10cm), place tire sidewalls on top.' },
                { step: 6, title: 'Wait 21-30 Days', desc: 'Do not open before 21 days. Good silage will have pleasant acidic smell and olive-green color.' }
              ].map(item => (
                <div key={item.step} className="flex gap-3 items-start bg-off-white p-4 rounded-xl border">
                  <span className="bg-dark-green text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <h4 className="font-bold text-dark text-sm">{item.title}</h4>
                    <p className="text-xs text-grey mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milk Yield Optimization */}
          <div className="card space-y-4">
            <h2 className="text-xl font-bold text-dark-green">🥛 Maximize Milk Yield — Nutrition Tips</h2>
            <div className="space-y-3">
              {[
                { title: 'Bypass Fat Supplementation', desc: 'Add 100-150g bypass fat (calcium soap) per animal daily. Increases fat% in milk by 0.3-0.5%. Most effective in early lactation HF cows producing >15L/day.', tag: 'Yield +10-15%' },
                { title: 'Protected Protein Sources', desc: 'Use soybean meal or formaldehyde-treated groundnut cake. Increases milk protein% and total yield. Cost-effective above 12L/day production.', tag: 'Protein ↑' },
                { title: 'Vitamin & Mineral Premix', desc: 'Area-specific mineral mix (not generic). Maharashtra soils are deficient in Zinc, Copper, and Selenium. Improves reproduction and immunity.', tag: 'Health' },
                { title: 'Feeding Schedule', desc: 'Feed concentrate in 3 equal portions — morning, afternoon, evening. Never feed entire concentrate at once. Give green fodder ad-lib after milking.', tag: 'Management' },
                { title: 'Water Quality & Quantity', desc: 'Ensure 80-100 liters/day for HF cross in summer. Water must be clean — contaminated water reduces intake by 20%. Check water TDS < 3000 ppm.', tag: 'Critical' }
              ].map((tip, i) => (
                <div key={i} className="bg-white border rounded-xl p-4 flex gap-4 items-start hover:shadow-md transition-shadow">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-dark text-sm">{tip.title}</h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">{tip.tag}</span>
                    </div>
                    <p className="text-xs text-grey leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Vet Contacts */}
          <div className="card space-y-4">
            <h2 className="text-xl font-bold text-dark-green">🚨 Emergency Veterinary Resources</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-red-700 text-sm">🆘 When to Call a Vet Immediately</h4>
                <ul className="text-xs text-red-700 space-y-1.5 list-disc pl-4">
                  <li>Sudden drop in milk yield (&gt;30% in one day)</li>
                  <li>Animal not eating for 12+ hours</li>
                  <li>Bloat / Tympany — distended left flank</li>
                  <li>Bloody diarrhoea or blood in milk</li>
                  <li>High fever (&gt;40°C) with nasal discharge</li>
                  <li>Difficulty breathing or excessive salivation</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-blue-700 text-sm">📞 Helpline Numbers</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 bg-white rounded-lg">
                    <span className="text-grey">NDDB Kisan Call Centre</span>
                    <a href="tel:18001801551" className="font-bold text-blue-700">1800-180-1551</a>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg">
                    <span className="text-grey">Animal Husbandry Dept (MH)</span>
                    <a href="tel:02026050100" className="font-bold text-blue-700">020-2605-0100</a>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg">
                    <span className="text-grey">BAIF Helpline</span>
                    <a href="tel:02025231661" className="font-bold text-blue-700">020-2523-1661</a>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg">
                    <span className="text-grey">Kisan Helpline (ICAR)</span>
                    <a href="tel:18001801551" className="font-bold text-blue-700">1800-180-1551</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-center text-[10px] text-grey py-4 border-t">
        ⚠️ Advisory is AI-estimated based on ICAR/NDDB guidelines. Always consult a licensed veterinarian for critical animal health decisions.
      </div>
    </div>
  );
};

export default Advisory;
