import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mockData } from '../services/api';

const Leaderboard = () => {
  const { t } = useTranslation();
  const [district, setDistrict] = useState('Akola');
  const [leaders, setLeaders] = useState(mockData.leaderboard);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="bg-gold/20 text-amber font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
          🏆 Maharashtra Silage Quality Champions
        </span>
        <h1 className="text-3xl font-extrabold text-dark-green">District Silage Quality Leaderboard</h1>
        <p className="text-grey text-sm max-w-xl mx-auto">
          Recognizing dairy farmers producing high crude-protein, low-risk aflatoxin fermented silage batches.
        </p>

        <div className="flex justify-center items-center gap-3 pt-4">
          <label className="text-xs font-bold text-grey">Select District:</label>
          <select 
            value={district} 
            onChange={(e) => setDistrict(e.target.value)}
            className="input-field max-w-xs text-sm py-1.5"
          >
            <option value="Akola">Akola (अकोला)</option>
            <option value="Kolhapur">Kolhapur (कोल्हापूर)</option>
            <option value="Ahmednagar">Ahmednagar (अहमदनगर)</option>
            <option value="Pune">Pune (पुणे)</option>
          </select>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid sm:grid-cols-3 gap-6 pt-4">
        {leaders.slice(0, 3).map((farmer, idx) => (
          <div key={idx} className={`card text-center relative p-6 border-t-8 ${idx === 0 ? 'border-gold bg-gold/10' : idx === 1 ? 'border-grey bg-light-grey' : 'border-amber bg-amber/10'}`}>
            <span className="text-4xl block mb-2">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
            <span className="text-xs font-bold uppercase text-grey">Rank #{farmer.district_rank}</span>
            <h3 className="font-bold text-lg text-dark mt-1">{farmer.farmer_name}</h3>
            <p className="text-2xl font-black text-dark-green mt-2">{farmer.avg_score} <span className="text-xs font-normal text-grey">/ 100</span></p>
            <span className="text-xs text-grey mt-1 block">{farmer.batch_count} Validated Batches</span>
          </div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div className="card overflow-hidden">
        <h3 className="font-bold text-lg text-dark-green mb-4">Rankings for {district} District</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-light-grey text-grey text-xs uppercase font-semibold">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Farmer Name</th>
                <th className="p-3">District</th>
                <th className="p-3">Average Score</th>
                <th className="p-3">Batches Tested</th>
                <th className="p-3">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaders.map((f) => (
                <tr key={f.district_rank} className="hover:bg-off-white">
                  <td className="p-3 font-bold text-dark">#{f.district_rank}</td>
                  <td className="p-3 font-semibold text-dark-green">{f.farmer_name}</td>
                  <td className="p-3 text-grey">{f.district}</td>
                  <td className="p-3 font-bold text-mid-green">{f.avg_score} / 100</td>
                  <td className="p-3">{f.batch_count}</td>
                  <td className="p-3">
                    <span className="bg-pale-green text-dark-green text-xs font-bold px-2.5 py-1 rounded-full">
                      Top {f.district_rank * 5}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
