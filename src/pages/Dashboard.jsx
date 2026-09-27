import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api, { mockData } from '../services/api';

const Dashboard = () => {
  const { t } = useTranslation();
  const [batches, setBatches] = useState(mockData.batches);
  const [alerts, setAlerts] = useState(mockData.alerts);
  const [selectedBatchQR, setSelectedBatchQR] = useState(null);

  useEffect(() => {
    // Attempt fetching real batches from backend
    api.get('/batches')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setBatches(res.data.data);
        }
      })
      .catch(() => {});

    api.get('/alerts')
      .then((res) => {
        if (res.data?.data) {
          setAlerts(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    api.patch(`/alerts/${id}/dismiss`).catch(() => {});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-dark-green">🌾 Farmer Quality Dashboard</h1>
          <p className="text-grey text-sm">Monitor batch health, early spoilage warnings, and generate verifiable QR passports.</p>
        </div>
        <Link to="/test-feed" className="btn-primary flex items-center gap-2">
          <span>+ New Silage Test</span>
        </Link>
      </div>

      {/* Early Warning Batch Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-dark flex items-center gap-2">
            ⚠️ Active Quality & Recall Alerts
          </h3>
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
                <Link to="/test-feed" className="text-xs btn-primary py-1.5 px-3">
                  Retest Batch
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="card text-center p-6 border-t-4 border-mid-green">
          <span className="text-grey text-xs font-medium uppercase">Active Batches</span>
          <p className="text-3xl font-bold text-dark-green mt-2">{batches.length}</p>
        </div>
        <div className="card text-center p-6 border-t-4 border-lite-green">
          <span className="text-grey text-xs font-medium uppercase">Avg Quality Score</span>
          <p className="text-3xl font-bold text-lite-green mt-2">78.5 / 100</p>
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

      {/* Farmer Batches Table */}
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
                  <td className="p-3 capitalize">{batch.feed_type.replace('_', ' ')}</td>
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

      {/* QR Modal */}
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
