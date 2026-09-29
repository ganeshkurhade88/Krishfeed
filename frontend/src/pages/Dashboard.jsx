import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

// ─── Expiry / Opening Tracker Logic ──────────────────────────────────────────
const getUsageWindowDays = (storageType) => {
  const windows = {
    pit: 90,
    bunker: 75,
    bag: 60,
    shed: 45,
    open: 14
  };
  return windows[storageType] || 60;
};

const getExpiryStatus = (batch) => {
  if (!batch.opened_date) {
    // Not yet opened — calculate days since stored
    const stored = new Date(batch.date_stored);
    const today = new Date();
    const daysSinceStored = Math.floor((today - stored) / (1000 * 60 * 60 * 24));
    const maxDays = getUsageWindowDays(batch.storage_type);
    const daysLeft = maxDays - daysSinceStored;

    return {
      daysSinceStored,
      daysLeft: Math.max(0, daysLeft),
      usedBy: new Date(stored.getTime() + maxDays * 86400000).toLocaleDateString('en-IN'),
      status: daysLeft > 20 ? 'fresh' : daysLeft > 5 ? 'use_soon' : daysLeft <= 0 ? 'spoiled' : 'critical',
      opened: false
    };
  } else {
    const opened = new Date(batch.opened_date);
    const today = new Date();
    const daysSinceOpening = Math.floor((today - opened) / (1000 * 60 * 60 * 24));
    // After opening, window is much shorter
    const openWindow = batch.storage_type === 'pit' ? 21 : batch.storage_type === 'bag' ? 14 : 10;
    const daysLeft = openWindow - daysSinceOpening;

    return {
      daysSinceOpening,
      daysLeft: Math.max(0, daysLeft),
      usedBy: new Date(opened.getTime() + openWindow * 86400000).toLocaleDateString('en-IN'),
      status: daysLeft > 10 ? 'fresh' : daysLeft > 3 ? 'use_soon' : daysLeft <= 0 ? 'spoiled' : 'critical',
      opened: true
    };
  }
};

const statusConfig = {
  fresh: { label: 'Fresh', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', icon: '✅' },
  use_soon: { label: 'Use Soon', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', icon: '⏳' },
  critical: { label: 'Use Today', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', icon: '⚠️' },
  spoiled: { label: 'Potentially Spoiled', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', icon: '🚨' }
};

const Dashboard = () => {
  const { t } = useTranslation();
  const [batches, setBatches] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedBatchQR, setSelectedBatchQR] = useState(null);
  const [openingDates, setOpeningDates] = useState({});
  const [showTrackerModal, setShowTrackerModal] = useState(null);

  useEffect(() => {
    // DUMMY DATA FOR PRESENTATION (Recent dates relative to Sep 2026)
    const defaultDummyBatches = [
      { id: 'B-101', batch_code: 'B-101', feed_type: 'maize_silage', quantity_kg: 2000, storage_type: 'pit', date_stored: '2026-08-15', visual_score: 88 },
      { id: 'B-102', batch_code: 'B-102', feed_type: 'sorghum_silage', quantity_kg: 1500, storage_type: 'bag', date_stored: '2026-09-10', visual_score: 75 },
      { id: 'B-103', batch_code: 'B-103', feed_type: 'tmr', quantity_kg: 500, storage_type: 'open', date_stored: '2026-09-20', visual_score: 90 }
    ];
    
    const localBatches = JSON.parse(localStorage.getItem('dummyBatches') || '[]');
    setBatches([...defaultDummyBatches, ...localBatches]);

    const dummyAlerts = [
      { id: 1, alert_reason: 'High moisture detected in B-103', suggested_action: 'Check sealing and remove spoiled layer' }
    ];
    setAlerts(dummyAlerts);
  }, []);

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    api.patch(`/alerts/${id}/dismiss`).catch(() => {});
  };

  // Mark a batch as opened today
  const markBatchOpened = (batchId, customDate) => {
    const date = customDate || new Date().toISOString().split('T')[0];
    setBatches(prev => prev.map(b =>
      b.id === batchId ? { ...b, opened_date: date } : b
    ));
    setOpeningDates(prev => ({ ...prev, [batchId]: date }));
    setShowTrackerModal(null);
    api.patch(`/batches/${batchId}`, { opened_date: date }).catch(() => {});
  };

  const avgScore = batches.length > 0
    ? Math.round(batches.reduce((acc, b) => acc + Number(b.visual_score || 0), 0) / batches.length)
    : 0;

  const spoiledOrCriticalCount = batches.filter(b => {
    const s = getExpiryStatus(b);
    return s.status === 'spoiled' || s.status === 'critical';
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-dark-green">🌾 {t('page.dashboard.title') || 'Farmer Quality Dashboard'}</h1>
          <p className="text-grey text-sm">{t('page.dashboard.desc') || 'Monitor batch health, early spoilage warnings, and generate verifiable QR passports.'}</p>
        </div>
        <Link to="/test-feed" className="btn-primary flex items-center gap-2">
          <span>+ New Silage Test</span>
        </Link>
      </div>

      {/* Expiry Warning Banner */}
      {spoiledOrCriticalCount > 0 && (
        <div className="card bg-red-50 border-2 border-red-300 p-4 flex items-start gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="font-bold text-red-700">{spoiledOrCriticalCount} batch{spoiledOrCriticalCount > 1 ? 'es' : ''} need immediate attention!</p>
            <p className="text-xs text-red-600">Check the Expiry Tracker below. Feeding spoiled silage to lactating cows reduces milk yield and can cause health issues.</p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-dark flex items-center gap-2">⚠️ Active Quality & Recall Alerts</h3>
          {alerts.map((alert) => (
            <div key={alert.id} className="card bg-amber/10 border-l-8 border-accent-orange p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
              <div>
                <span className="text-xs font-bold text-accent-orange uppercase tracking-wider">Early Warning Alert</span>
                <p className="font-semibold text-dark text-sm mt-1">{alert.alert_reason}</p>
                <p className="text-xs text-grey mt-1"><span className="font-bold">Recommended Fix:</span> {alert.suggested_action}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => dismissAlert(alert.id)} className="text-xs bg-white text-dark font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50">
                  Dismiss
                </button>
                <Link to="/test-feed" className="text-xs btn-primary py-1.5 px-3">Retest Batch</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="card text-center p-6 border-t-4 border-mid-green">
          <span className="text-grey text-xs font-medium uppercase">Active Batches</span>
          <p className="text-3xl font-bold text-dark-green mt-2">{batches.length}</p>
        </div>
        <div className="card text-center p-6 border-t-4 border-lite-green">
          <span className="text-grey text-xs font-medium uppercase">Avg Quality Score</span>
          <p className="text-3xl font-bold text-lite-green mt-2">{avgScore} / 100</p>
        </div>
        <div className="card text-center p-6 border-t-4 border-gold">
          <span className="text-grey text-xs font-medium uppercase">Total Feed Stock</span>
          <p className="text-3xl font-bold text-dark mt-2">{batches.reduce((acc, b) => acc + Number(b.quantity_kg || 0), 0)} kg</p>
        </div>
        <div className="card text-center p-6 border-t-4 border-accent-orange">
          <span className="text-grey text-xs font-medium uppercase">District Rank</span>
          <p className="text-3xl font-bold text-accent-orange mt-2">#2 (Akola)</p>
        </div>
      </div>

      {/* Batches Table */}
      <div className="card overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-dark-green">Stored Feed & Silage Batches</h2>
          <span className="text-xs text-grey">Showing all active batches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-light-grey text-grey text-xs uppercase font-semibold">
              <tr>
                <th className="p-3">Batch Code</th>
                <th className="p-3">Feed Type</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Stored Date</th>
                <th className="p-3">Storage</th>
                <th className="p-3">Quality Score</th>
                <th className="p-3">Passport & QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-off-white transition-colors">
                  <td className="p-3 font-bold text-dark-green">{batch.batch_code}</td>
                  <td className="p-3 capitalize">{batch.feed_type.replace(/_/g, ' ')}</td>
                  <td className="p-3 font-medium">{batch.quantity_kg} kg</td>
                  <td className="p-3 text-grey">{batch.date_stored}</td>
                  <td className="p-3 capitalize">{batch.storage_type}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${batch.visual_score >= 75 ? 'bg-pale-green text-dark-green' : 'bg-amber/20 text-amber'}`}>
                      {batch.visual_score || 80} / 100
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => setSelectedBatchQR(batch)} className="text-xs bg-pale-green text-dark-green font-bold px-3 py-1.5 rounded-md hover:bg-lite-green/30">
                      View QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          FEATURE 3: Feed Expiry / Opening Tracker
      ──────────────────────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h2 className="text-xl font-bold text-dark-green">⏱️ Feed Expiry & Opening Tracker</h2>
            <p className="text-xs text-grey">Track when each batch was opened and whether it is still safe to feed.</p>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">AI-Estimated Windows</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {batches.map((batch) => {
            const expiry = getExpiryStatus(batch);
            const sc = statusConfig[expiry.status];

            return (
              <div key={batch.id} className={`border-2 rounded-xl p-4 space-y-3 ${sc.border} ${sc.bg}`}>
                {/* Batch Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-dark text-sm">{batch.batch_code}</p>
                    <p className="text-[10px] text-grey capitalize">{batch.feed_type.replace(/_/g, ' ')} — {batch.storage_type}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text} border ${sc.border}`}>
                    {sc.icon} {sc.label}
                  </span>
                </div>

                {/* Tracker Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/70 rounded-lg p-2">
                    <p className="text-[10px] text-grey">
                      {expiry.opened ? 'Days Since Opening' : 'Days Since Stored'}
                    </p>
                    <p className={`text-lg font-black ${sc.text}`}>
                      {expiry.opened ? expiry.daysSinceOpening : expiry.daysSinceStored}
                    </p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2">
                    <p className="text-[10px] text-grey">Days Remaining</p>
                    <p className={`text-lg font-black ${expiry.daysLeft <= 3 ? 'text-red-600' : sc.text}`}>
                      {expiry.daysLeft}
                    </p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2">
                    <p className="text-[10px] text-grey">Use By</p>
                    <p className="text-xs font-bold text-dark">{expiry.usedBy}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-grey mb-1">
                    <span>{expiry.opened ? 'Opened' : 'Stored'}</span>
                    <span>Recommended Use-By</span>
                  </div>
                  <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${expiry.status === 'fresh' ? 'bg-emerald-500' : expiry.status === 'use_soon' ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{
                        width: `${Math.min(100, expiry.opened
                          ? (expiry.daysSinceOpening / (expiry.daysSinceOpening + expiry.daysLeft)) * 100
                          : (expiry.daysSinceStored / (expiry.daysSinceStored + expiry.daysLeft)) * 100
                        )}%`
                      }}
                    />
                  </div>
                </div>

                {/* Status Message */}
                <p className={`text-xs font-medium ${sc.text}`}>
                  {expiry.status === 'fresh' && '✅ Batch is within safe usage window. Continue normal feeding schedule.'}
                  {expiry.status === 'use_soon' && '⏳ Use this batch soon. Prioritize feeding this over fresher stocks.'}
                  {expiry.status === 'critical' && '⚠️ Critical: Feed today or tomorrow. Check for visible mold before use.'}
                  {expiry.status === 'spoiled' && '🚨 Potentially Spoiled. Do NOT feed to lactating cows. Conduct visual & smell check before any use.'}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!expiry.opened ? (
                    <button
                      onClick={() => setShowTrackerModal(batch)}
                      className="text-xs bg-dark-green text-white font-bold px-3 py-2 rounded-lg hover:bg-mid-green transition-colors flex-1"
                    >
                      📂 Mark as Opened Today
                    </button>
                  ) : (
                    <div className="text-[10px] text-grey bg-white/60 px-3 py-2 rounded-lg flex-1 text-center">
                      Opened: {batch.opened_date} • {expiry.daysSinceOpening} days ago
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedBatchQR(batch)}
                    className="text-xs bg-white border font-bold text-dark-green px-3 py-2 rounded-lg hover:bg-pale-green/30"
                  >
                    QR
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-grey text-center pt-2">
          ℹ️ Usage windows are AI-estimated based on storage type and conditions (ICAR guidelines). Always do a visual and smell check before feeding.
        </p>
      </div>

      {/* ── Mark Opened Modal ── */}
      {showTrackerModal && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-elevated animate-fade-in">
            <h3 className="font-bold text-lg text-dark-green">📂 Mark Batch as Opened</h3>
            <p className="text-sm text-grey">Recording the opening date helps track how many days the batch has been exposed to air.</p>
            <div>
              <label className="label-text">Opening Date</label>
              <input
                type="date"
                id="opening-date-input"
                defaultValue={new Date().toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              ⏱️ <strong>Recommended use window after opening:</strong>{' '}
              {showTrackerModal.storage_type === 'pit' ? '21 days' : showTrackerModal.storage_type === 'bag' ? '14 days' : '10 days'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const dateInput = document.getElementById('opening-date-input');
                  markBatchOpened(showTrackerModal.id, dateInput?.value);
                }}
                className="btn-primary flex-1"
              >
                ✅ Confirm Opening Date
              </button>
              <button onClick={() => setShowTrackerModal(null)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Modal ── */}
      {selectedBatchQR && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-elevated animate-fade-in">
            <h3 className="font-bold text-lg text-dark-green">Verifiable Quality Passport</h3>
            <p className="text-xs text-grey">Scan with smartphone to view authenticated lab estimation & traceability chain.</p>

            <div className="flex justify-center p-4 bg-off-white rounded-xl">
              <QRCodeSVG value={`${window.location.origin}/passport/${selectedBatchQR.id}`} size={180} />
            </div>

            <div className="text-xs text-left bg-light-grey p-3 rounded-lg space-y-1">
              <p><span className="font-bold">Batch:</span> {selectedBatchQR.batch_code}</p>
              <p><span className="font-bold">Type:</span> {selectedBatchQR.feed_type}</p>
              <p><span className="font-bold">Quantity:</span> {selectedBatchQR.quantity_kg} kg</p>
            </div>

            <div className="flex gap-2">
              <Link to={`/passport/${selectedBatchQR.id}`} className="btn-primary w-full text-xs py-2">
                Open Full Passport
              </Link>
              <button onClick={() => setSelectedBatchQR(null)} className="btn-secondary w-full text-xs py-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
