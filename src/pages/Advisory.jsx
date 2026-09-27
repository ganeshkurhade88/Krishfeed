import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Advisory = () => {
  const { t } = useTranslation();
  const [selectedIssue, setSelectedIssue] = useState('mould');
  const [animalCount, setAnimalCount] = useState(4);
  const [milkYield, setMilkYield] = useState(12);

  const rationAdvice = {
    dryFodder: (animalCount * 5).toFixed(1),
    greenSilage: (animalCount * 20).toFixed(1),
    concentrate: (animalCount * (milkYield * 0.4 + 1.5)).toFixed(1),
    mineralMix: (animalCount * 50)
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-dark-green">🩺 Veterinary & Nutritional Advisory Engine</h1>
        <p className="text-grey text-sm">Actionable veterinary guidelines grounded in ICAR dairy cattle ration balancing.</p>
      </div>

      {/* Dynamic Ration Balancing Calculator */}
      <div className="card space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-xl font-bold text-dark-green">🧮 Daily Ration Balancing Calculator (ICAR Standard)</h2>
          <p className="text-xs text-grey">Calculate optimal daily feed distribution for your lactating cattle herd.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="label-text">Number of Milking Cows / Buffaloes</label>
            <input 
              type="number" 
              value={animalCount} 
              onChange={(e) => setAnimalCount(Math.max(1, Number(e.target.value)))}
              className="input-field"
              min="1"
            />
          </div>

          <div>
            <label className="label-text">Average Daily Milk Yield per Animal (Litres)</label>
            <input 
              type="number" 
              value={milkYield} 
              onChange={(e) => setMilkYield(Math.max(1, Number(e.target.value)))}
              className="input-field"
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-pale-green/40 rounded-xl">
            <span className="text-xs text-grey block">Quality Silage / Green Fodder</span>
            <span className="text-xl font-bold text-dark-green">{rationAdvice.greenSilage} kg/day</span>
          </div>
          <div className="p-4 bg-pale-green/40 rounded-xl">
            <span className="text-xs text-grey block">Dry Straw / Kadbi</span>
            <span className="text-xl font-bold text-dark-green">{rationAdvice.dryFodder} kg/day</span>
          </div>
          <div className="p-4 bg-pale-green/40 rounded-xl">
            <span className="text-xs text-grey block">Concentrate Feed (पशुखाद्य)</span>
            <span className="text-xl font-bold text-dark-green">{rationAdvice.concentrate} kg/day</span>
          </div>
          <div className="p-4 bg-pale-green/40 rounded-xl">
            <span className="text-xs text-grey block">Mineral Mixture</span>
            <span className="text-xl font-bold text-dark-green">{rationAdvice.mineralMix} g/day</span>
          </div>
        </div>
      </div>

      {/* Silage Troubleshooting Knowledge Base */}
      <div className="card space-y-4">
        <h2 className="text-xl font-bold text-dark-green">🛠️ Silage Problem Diagnoser & Storage Fixes</h2>
        
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'mould', label: 'White / Black Mould (बुरशी)' },
            { id: 'rancid', label: 'Foul / Ammonia Smell (कुजलेला वास)' },
            { id: 'heating', label: 'Aerobic Heating / Hot Pit (गरम होणे)' },
            { id: 'wetness', label: 'Waterlogged / Excessive Moisture' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedIssue(item.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedIssue === item.id ? 'bg-mid-green text-white' : 'bg-light-grey text-dark hover:bg-pale-green'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="bg-off-white border p-5 rounded-xl text-sm space-y-3">
          {selectedIssue === 'mould' && (
            <>
              <h4 className="font-bold text-accent-orange">Cause: Oxygen penetration due to loose packing or torn plastic cover.</h4>
              <p><strong>Action:</strong> Discard all visible mouldy parts. Do NOT feed to lactating cows as aflatoxin transfers to milk. Immediately reseal edges with weighted tarpaulins.</p>
            </>
          )}
          {selectedIssue === 'rancid' && (
            <>
              <h4 className="font-bold text-accent-orange">Cause: Clostridial fermentation from harvesting too wet or soil contamination.</h4>
              <p><strong>Action:</strong> High butyric acid and ammonia reduces feed intake. Mix in small quantities with dry kadbi straw or discard if pungent.</p>
            </>
          )}
          {selectedIssue === 'heating' && (
            <>
              <h4 className="font-bold text-accent-orange">Cause: Yeasts activating when silage face is exposed to air for too long.</h4>
              <p><strong>Action:</strong> Remove at least 15-20 cm silage layer cleanly across the entire pit face daily. Never dig deep holes in the silage face.</p>
            </>
          )}
          {selectedIssue === 'wetness' && (
            <>
              <h4 className="font-bold text-accent-orange">Cause: Water seepage from heavy rain or insufficient drainage trench.</h4>
              <p><strong>Action:</strong> Dig deep diversion trenches around the bunker and slope the pit entrance outward to drain seepage.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Advisory;
