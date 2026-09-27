import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mockData } from '../services/api';

const Marketplace = () => {
  const { t } = useTranslation();
  const [listings, setListings] = useState(mockData.marketplace);
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [selectedListing, setSelectedListing] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(500);

  const filtered = filterDistrict === 'all' 
    ? listings 
    : listings.filter(l => l.district.toLowerCase() === filterDistrict.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-green">🛒 Verified Silage & Feed Marketplace</h1>
          <p className="text-grey text-sm">Direct farmer-to-farmer trade with transparent ICAR verified nutritional scores.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-grey">Filter District:</label>
          <select 
            value={filterDistrict} 
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="input-field text-sm py-2"
          >
            <option value="all">All Districts</option>
            <option value="Akola">Akola</option>
            <option value="Kolhapur">Kolhapur</option>
            <option value="Ahmednagar">Ahmednagar</option>
            <option value="Pune">Pune</option>
          </select>
        </div>
      </div>

      {/* Grid of Listings */}
      <div className="grid md:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div key={item.id} className="card hover:shadow-card-hover transition-all flex flex-col justify-between p-6">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold bg-pale-green text-dark-green px-3 py-1 rounded-full uppercase">
                  {item.feed_type.replace('_', ' ')}
                </span>
                <span className="text-xs font-bold text-lite-green bg-dark-green px-2.5 py-1 rounded-md">
                  Score: {item.quality_score}/100
                </span>
              </div>

              <h3 className="font-extrabold text-xl text-dark mb-1">₹{item.price_per_kg} <span className="text-xs text-grey font-normal">/ kg</span></h3>
              <p className="text-xs text-grey font-medium mb-3">📍 {item.district}, {item.state}</p>

              <div className="bg-light-grey rounded-xl p-3 text-xs space-y-1.5 mb-4">
                <p><span className="text-grey">Seller:</span> <strong className="text-dark">{item.farmer_name}</strong></p>
                <p><span className="text-grey">Available Stock:</span> <strong className="text-dark-green">{item.available_kg} kg</strong></p>
                <p><span className="text-grey">Minimum Order:</span> <strong>{item.min_quantity_kg} kg</strong></p>
              </div>
            </div>

            <button 
              onClick={() => setSelectedListing(item)}
              className="btn-primary w-full text-sm py-2.5"
            >
              Contact Seller / Purchase
            </button>
          </div>
        ))}
      </div>

      {/* Purchase / Contact Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-elevated animate-fade-in">
            <h3 className="font-bold text-xl text-dark-green">Purchase Silage Batch</h3>
            <div className="bg-pale-green/40 p-3 rounded-xl text-xs space-y-1">
              <p><strong>Item:</strong> {selectedListing.feed_type.toUpperCase()}</p>
              <p><strong>Seller:</strong> {selectedListing.farmer_name} ({selectedListing.district})</p>
              <p><strong>Price:</strong> ₹{selectedListing.price_per_kg} / kg</p>
            </div>

            <div>
              <label className="label-text text-xs">Enter Desired Quantity (kg)</label>
              <input 
                type="number" 
                value={orderQuantity} 
                onChange={(e) => setOrderQuantity(e.target.value)}
                min={selectedListing.min_quantity_kg}
                max={selectedListing.available_kg}
                className="input-field text-sm"
              />
              <span className="text-[11px] text-grey">Total: ₹{(orderQuantity * selectedListing.price_per_kg).toFixed(2)}</span>
            </div>

            <div className="bg-light-grey p-3 rounded-lg text-xs space-y-1">
              <p className="font-bold text-dark-green">🔒 Verifiable Traceability Guarantee:</p>
              <p className="text-grey">All purchases are timestamped on our PostgreSQL batch ledger with 10-day Smart Recall protection.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => {
                  alert(`Order inquiry for ${orderQuantity}kg sent to ${selectedListing.farmer_name}!`);
                  setSelectedListing(null);
                }} 
                className="btn-primary w-full text-xs py-2.5"
              >
                Confirm Inquiry
              </button>
              <button 
                onClick={() => setSelectedListing(null)} 
                className="btn-secondary w-full text-xs py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
