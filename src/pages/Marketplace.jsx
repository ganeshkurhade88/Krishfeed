import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const feedTypeLabels = {
  maize_silage: { en: 'Maize Silage', emoji: '🌽' },
  sorghum_silage: { en: 'Sorghum Silage', emoji: '🌾' },
  tmr: { en: 'Total Mixed Ration', emoji: '🥣' },
  hay: { en: 'Dry Hay / Kadbi', emoji: '🌿' },
  concentrate_mix: { en: 'Concentrate Feed', emoji: '🧪' }
};

const Marketplace = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('buy');
  const [listings, setListings] = useState([]);
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterFeedType, setFilterFeedType] = useState('all');
  const [sortBy, setSortBy] = useState('quality');
  const [selectedListing, setSelectedListing] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const [negotiateModal, setNegotiateModal] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(500);
  const [offerPrice, setOfferPrice] = useState(0);
  const [buyerMessage, setBuyerMessage] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [myInquiries, setMyInquiries] = useState([]);

  // Try to fetch real listings from backend
  useEffect(() => {
    api.get('/marketplace')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setListings(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Filter & sort
  let filtered = listings;
  if (filterDistrict !== 'all') {
    filtered = filtered.filter(l => l.district.toLowerCase() === filterDistrict.toLowerCase());
  }
  if (filterFeedType !== 'all') {
    filtered = filtered.filter(l => l.feed_type === filterFeedType);
  }
  if (sortBy === 'quality') {
    filtered = [...filtered].sort((a, b) => b.quality_score - a.quality_score);
  } else if (sortBy === 'price_low') {
    filtered = [...filtered].sort((a, b) => a.price_per_kg - b.price_per_kg);
  } else if (sortBy === 'price_high') {
    filtered = [...filtered].sort((a, b) => b.price_per_kg - a.price_per_kg);
  } else if (sortBy === 'newest') {
    filtered = [...filtered].sort((a, b) => new Date(b.listed_at) - new Date(a.listed_at));
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 65) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Premium';
    if (score >= 65) return 'Good';
    return 'Average';
  };

  const handleSendInquiry = () => {
    const inquiry = {
      id: Date.now(),
      listing: negotiateModal || contactModal,
      quantity: orderQuantity,
      offered_price: negotiateModal ? offerPrice : (contactModal?.price_per_kg || 0),
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      message: buyerMessage,
      status: 'pending',
      sent_at: new Date().toISOString()
    };
    setMyInquiries(prev => [inquiry, ...prev]);
    setInquirySent(true);

    // Try to send to backend
    api.post('/marketplace/inquiry', inquiry).catch(() => {});
  };

  const resetModals = () => {
    setContactModal(null);
    setNegotiateModal(null);
    setInquirySent(false);
    setBuyerMessage('');
    setOfferPrice(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-extrabold text-dark-green">
          🛒 {t('page.marketplace.title') || 'Verified Feed & Silage Marketplace'}
        </h1>
        <p className="text-grey text-sm mt-1">
          {t('page.marketplace.desc') || 'Buy and sell quality-tested feed directly from farmers in your district.'}
        </p>
      </div>

      {/* Tab Switcher: Buy / Sell / My Inquiries */}
      <div className="flex gap-2 bg-light-grey p-1.5 rounded-xl w-fit">
        {[
          { id: 'buy', label: '🛍️ Buy Feed', count: filtered.length },
          { id: 'sell', label: '📦 Sell My Feed', count: null },
          { id: 'inquiries', label: '📩 My Inquiries', count: myInquiries.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-dark-green text-white shadow-md' 
                : 'text-grey hover:text-dark hover:bg-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ======================== BUY TAB ======================== */}
      {activeTab === 'buy' && (
        <>
          {/* Filters & Sort */}
          <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-xl border">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-grey">District:</label>
              <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} className="input-field text-sm py-1.5 w-36">
                <option value="all">All Districts</option>
                <option value="Akola">Akola</option>
                <option value="Kolhapur">Kolhapur</option>
                <option value="Ahmednagar">Ahmednagar</option>
                <option value="Pune">Pune</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-grey">Feed Type:</label>
              <select value={filterFeedType} onChange={(e) => setFilterFeedType(e.target.value)} className="input-field text-sm py-1.5 w-44">
                <option value="all">All Types</option>
                <option value="maize_silage">Maize Silage</option>
                <option value="sorghum_silage">Sorghum Silage</option>
                <option value="tmr">TMR</option>
                <option value="hay">Dry Hay</option>
                <option value="concentrate_mix">Concentrate</option>
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs font-bold text-grey">Sort:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field text-sm py-1.5 w-40">
                <option value="quality">Best Quality</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-xs text-grey font-medium">{filtered.length} listings found</p>

          {/* Listings Grid */}
          {filtered.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-dark">No listings found</h3>
              <p className="text-grey text-sm mt-2">Try adjusting your filters or check back later for new listings.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => {
                const ft = feedTypeLabels[item.feed_type] || { en: item.feed_type, emoji: '📦' };
                return (
                  <div key={item.id} className="card hover:shadow-card-hover transition-all flex flex-col justify-between p-0 overflow-hidden">
                    {/* Top Color Bar */}
                    <div className={`h-2 ${item.quality_score >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : item.quality_score >= 65 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} />
                    
                    <div className="p-5 flex-grow space-y-3">
                      {/* Type Badge & Score */}
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold bg-pale-green text-dark-green px-3 py-1 rounded-full">
                          {ft.emoji} {ft.en}
                        </span>
                        <div className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getScoreColor(item.quality_score)}`}>
                          {item.quality_score}/100 · {getScoreLabel(item.quality_score)}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-black text-2xl text-dark">₹{item.price_per_kg}</h3>
                        <span className="text-xs text-grey font-medium">/ kg</span>
                        {item.is_negotiable && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full ml-auto">
                            💬 Negotiable
                          </span>
                        )}
                      </div>

                      {/* Location */}
                      <p className="text-xs text-grey font-medium">
                        📍 {item.farmer_village || item.district}, {item.district}, {item.state}
                      </p>

                      {/* Description */}
                      <p className="text-xs text-dark leading-relaxed line-clamp-2">
                        {item.description || `${ft.en} available for purchase. Quality tested and verified.`}
                      </p>

                      {/* Details Grid */}
                      <div className="bg-light-grey rounded-xl p-3 text-xs grid grid-cols-2 gap-2">
                        <p><span className="text-grey">Seller:</span> <strong className="text-dark">{item.farmer_name}</strong></p>
                        <p><span className="text-grey">Stock:</span> <strong className="text-dark-green">{item.available_kg} kg</strong></p>
                        <p><span className="text-grey">Min Order:</span> <strong>{item.min_quantity_kg} kg</strong></p>
                        <p><span className="text-grey">Storage:</span> <strong className="capitalize">{item.storage_type}</strong></p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 pt-0 flex gap-2">
                      <button 
                        onClick={() => {
                          setContactModal(item);
                          setOrderQuantity(item.min_quantity_kg);
                        }}
                        className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
                      >
                        📞 Contact & Buy
                      </button>
                      {item.is_negotiable && (
                        <button 
                          onClick={() => {
                            setNegotiateModal(item);
                            setOfferPrice(Math.round(item.price_per_kg * 0.9 * 100) / 100);
                            setOrderQuantity(item.min_quantity_kg);
                          }}
                          className="btn-secondary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
                        >
                          💬 Negotiate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ======================== SELL TAB ======================== */}
      {activeTab === 'sell' && (
        <div className="card space-y-6 max-w-2xl mx-auto">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-dark-green">📦 List Your Feed for Sale</h2>
            <p className="text-xs text-grey">Your listing will appear to verified buyers in your district and nearby areas.</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-3">
            <span className="text-xl">💡</span>
            <div>
              <strong>Tip:</strong> Batches with quality score above 75 and a QR passport get 3× more buyer inquiries! 
              <a href="/test-feed" className="underline font-bold ml-1">Test your feed first →</a>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="label-text">Feed / Silage Type</label>
              <select className="input-field">
                <option value="maize_silage">🌽 Maize Silage</option>
                <option value="sorghum_silage">🌾 Sorghum Silage</option>
                <option value="tmr">🥣 Total Mixed Ration (TMR)</option>
                <option value="hay">🌿 Dry Hay / Kadbi</option>
                <option value="concentrate_mix">🧪 Concentrate Feed</option>
              </select>
            </div>
            <div>
              <label className="label-text">Available Quantity (kg)</label>
              <input type="number" className="input-field" placeholder="e.g. 2000" min="50" />
            </div>
            <div>
              <label className="label-text">Price per kg (₹)</label>
              <input type="number" className="input-field" placeholder="e.g. 5.50" min="0.5" step="0.1" />
            </div>
            <div>
              <label className="label-text">Minimum Order Quantity (kg)</label>
              <input type="number" className="input-field" placeholder="e.g. 200" min="10" />
            </div>
            <div>
              <label className="label-text">Your Village / Town</label>
              <input type="text" className="input-field" placeholder="e.g. Shegaon" />
            </div>
            <div>
              <label className="label-text">Your Contact Number</label>
              <input type="tel" className="input-field" placeholder="+91 98234 XXXXX" />
            </div>
            <div className="md:col-span-2">
              <label className="label-text">Description (storage method, age, condition)</label>
              <textarea className="input-field h-20 resize-none" placeholder="e.g. Well-fermented maize silage, 15 days old, stored in underground pit with plastic cover..." />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <input type="checkbox" id="negotiable" className="w-4 h-4 accent-mid-green" />
              <label htmlFor="negotiable" className="text-sm font-medium text-dark">Allow price negotiation from buyers</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-primary flex-1 py-3 text-sm">
              📤 Publish Listing
            </button>
          </div>
        </div>
      )}

      {/* ======================== MY INQUIRIES TAB ======================== */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {myInquiries.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-dark">No Inquiries Yet</h3>
              <p className="text-grey text-sm mt-2">When you contact a seller or negotiate a price, your inquiries will appear here.</p>
              <button onClick={() => setActiveTab('buy')} className="btn-primary mt-4 text-sm">
                Browse Listings →
              </button>
            </div>
          ) : (
            myInquiries.map(inq => (
              <div key={inq.id} className="card p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inq.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      inq.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {inq.status === 'pending' ? '⏳ Awaiting Response' : inq.status === 'accepted' ? '✅ Accepted' : '❌ Declined'}
                    </span>
                    <span className="text-[10px] text-grey">{new Date(inq.sent_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-bold text-dark">
                    {inq.quantity} kg of {feedTypeLabels[inq.listing?.feed_type]?.en || inq.listing?.feed_type}
                  </p>
                  <p className="text-xs text-grey">
                    Seller: <strong>{inq.listing?.farmer_name}</strong> • 📍 {inq.listing?.district}
                  </p>
                  <p className="text-xs text-dark-green font-bold">
                    Your Price: ₹{inq.offered_price}/kg → Total: ₹{(inq.quantity * inq.offered_price).toFixed(0)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs bg-pale-green text-dark-green font-bold px-4 py-2 rounded-lg hover:bg-lite-green/30">
                    📞 Call Seller
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ======================== CONTACT & BUY MODAL ======================== */}
      {contactModal && (
        <div className="fixed inset-0 bg-dark/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => resetModals()}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-elevated animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {inquirySent ? (
              /* Success State */
              <div className="p-8 text-center space-y-4">
                <div className="text-6xl">✅</div>
                <h3 className="font-bold text-xl text-dark-green">Inquiry Sent Successfully!</h3>
                <p className="text-sm text-grey">
                  Your purchase inquiry for <strong>{orderQuantity} kg</strong> has been shared with <strong>{contactModal.farmer_name}</strong>.
                </p>
                <div className="bg-pale-green/40 p-4 rounded-xl text-sm space-y-2">
                  <p className="font-bold text-dark-green">📞 Farmer Contact Details:</p>
                  <p className="text-dark"><strong>Phone:</strong> {contactModal.farmer_phone}</p>
                  <p className="text-dark"><strong>Village:</strong> {contactModal.farmer_village || contactModal.district}</p>
                  <p className="text-xs text-grey mt-2">You can call the farmer directly to finalize logistics and delivery.</p>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${contactModal.farmer_phone?.replace(/\s/g, '')}`} className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                    📞 Call Now
                  </a>
                  <a href={`https://wa.me/91${contactModal.farmer_phone?.replace(/[^0-9]/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 text-sm font-bold rounded-xl bg-green-500 text-white flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                    💬 WhatsApp
                  </a>
                </div>
                <button onClick={resetModals} className="btn-secondary w-full text-xs py-2.5 mt-2">
                  Close
                </button>
              </div>
            ) : (
              /* Purchase Form */
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-xl text-dark-green">🛒 Purchase Feed</h3>
                  <button onClick={resetModals} className="text-grey hover:text-dark text-lg">✕</button>
                </div>

                {/* Seller Info Card */}
                <div className="bg-gradient-to-br from-pale-green/60 to-lite-green/20 p-4 rounded-xl space-y-2 border border-lite-green/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-grey font-medium">Seller</p>
                      <p className="font-bold text-dark text-lg">{contactModal.farmer_name}</p>
                    </div>
                    <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${getScoreColor(contactModal.quality_score)}`}>
                      Score: {contactModal.quality_score}/100
                    </div>
                  </div>
                  <p className="text-xs text-grey">📍 {contactModal.farmer_village || contactModal.district}, {contactModal.district}</p>
                  <p className="text-xs text-dark">{contactModal.description}</p>
                </div>

                {/* Order Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label-text text-xs">Feed Type</label>
                      <p className="text-sm font-bold text-dark mt-1">{feedTypeLabels[contactModal.feed_type]?.emoji} {feedTypeLabels[contactModal.feed_type]?.en}</p>
                    </div>
                    <div>
                      <label className="label-text text-xs">Listed Price</label>
                      <p className="text-sm font-bold text-dark-green mt-1">₹{contactModal.price_per_kg} / kg</p>
                    </div>
                  </div>

                  <div>
                    <label className="label-text text-xs">Quantity (kg) — Min: {contactModal.min_quantity_kg}, Available: {contactModal.available_kg}</label>
                    <input 
                      type="number" value={orderQuantity}
                      onChange={(e) => setOrderQuantity(Math.max(contactModal.min_quantity_kg, Math.min(contactModal.available_kg, Number(e.target.value))))}
                      className="input-field text-sm"
                      min={contactModal.min_quantity_kg}
                      max={contactModal.available_kg}
                    />
                  </div>

                  {/* Total Calculation */}
                  <div className="bg-dark-green text-white p-4 rounded-xl flex justify-between items-center">
                    <span className="text-sm font-medium">Estimated Total:</span>
                    <span className="text-2xl font-black">₹{(orderQuantity * contactModal.price_per_kg).toFixed(0)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label-text text-xs">Your Name</label>
                      <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="input-field text-sm" placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="label-text text-xs">Your Phone</label>
                      <input type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="input-field text-sm" placeholder="+91 XXXXX XXXXX" />
                    </div>
                  </div>

                  <div>
                    <label className="label-text text-xs">Message to Seller (optional)</label>
                    <textarea 
                      value={buyerMessage} onChange={(e) => setBuyerMessage(e.target.value)}
                      className="input-field text-sm h-16 resize-none" 
                      placeholder="e.g. Can you deliver to my village? I need it within 3 days."
                    />
                  </div>
                </div>

                {/* Traceability Badge */}
                <div className="bg-light-grey p-3 rounded-lg text-xs flex items-start gap-2">
                  <span className="text-lg">🔒</span>
                  <div>
                    <p className="font-bold text-dark-green">Traceability Protected</p>
                    <p className="text-grey">All transactions are logged with batch provenance and 10-day recall protection.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleSendInquiry} className="btn-primary flex-1 py-3 text-sm" disabled={!buyerName || !buyerPhone}>
                    📞 Send Inquiry & Get Contact
                  </button>
                  <button onClick={resetModals} className="btn-secondary py-3 px-5 text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================== NEGOTIATION MODAL ======================== */}
      {negotiateModal && (
        <div className="fixed inset-0 bg-dark/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => resetModals()}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-elevated animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {inquirySent ? (
              <div className="p-8 text-center space-y-4">
                <div className="text-6xl">🤝</div>
                <h3 className="font-bold text-xl text-dark-green">Offer Sent!</h3>
                <p className="text-sm text-grey">
                  Your offer of <strong>₹{offerPrice}/kg</strong> for <strong>{orderQuantity} kg</strong> has been sent to <strong>{negotiateModal.farmer_name}</strong>.
                </p>
                <div className="bg-pale-green/40 p-4 rounded-xl text-sm space-y-2">
                  <p className="font-bold text-dark-green">📞 Contact the farmer to finalize:</p>
                  <p className="text-dark"><strong>Phone:</strong> {negotiateModal.farmer_phone}</p>
                  <p className="text-dark"><strong>Village:</strong> {negotiateModal.farmer_village || negotiateModal.district}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${negotiateModal.farmer_phone?.replace(/\s/g, '')}`} className="btn-primary flex-1 py-3 text-sm">📞 Call</a>
                  <a href={`https://wa.me/91${negotiateModal.farmer_phone?.replace(/[^0-9]/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 text-sm font-bold rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors text-center">
                    💬 WhatsApp
                  </a>
                </div>
                <button onClick={resetModals} className="btn-secondary w-full text-xs py-2.5 mt-2">Close</button>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-xl text-dark-green">💬 Negotiate Price</h3>
                  <button onClick={resetModals} className="text-grey hover:text-dark text-lg">✕</button>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm">
                  <p className="font-bold text-amber-800 mb-1">💡 Negotiation Tips:</p>
                  <ul className="text-amber-700 text-xs space-y-1 list-disc pl-4">
                    <li>Reasonable offers (within 10-15% of asking price) are more likely to be accepted</li>
                    <li>Bulk orders (1000+ kg) often get better rates</li>
                    <li>Mention if you can pick up to save delivery costs</li>
                  </ul>
                </div>

                {/* Price Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-light-grey p-4 rounded-xl text-center">
                    <span className="text-xs text-grey block">Seller's Price</span>
                    <span className="text-2xl font-black text-dark">₹{negotiateModal.price_per_kg}</span>
                    <span className="text-xs text-grey block">/ kg</span>
                  </div>
                  <div className="bg-pale-green/40 p-4 rounded-xl text-center border-2 border-mid-green">
                    <span className="text-xs text-dark-green font-bold block">Your Offer</span>
                    <input 
                      type="number" value={offerPrice}
                      onChange={(e) => setOfferPrice(Math.max(0.5, Number(e.target.value)))}
                      className="text-2xl font-black text-dark-green text-center w-full bg-transparent border-none outline-none"
                      step="0.1"
                    />
                    <span className="text-xs text-dark-green block">/ kg</span>
                  </div>
                </div>

                {/* Savings Calculator */}
                <div className={`p-3 rounded-xl text-xs font-bold text-center ${
                  offerPrice < negotiateModal.price_per_kg ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {offerPrice < negotiateModal.price_per_kg
                    ? `💰 You save ₹${((negotiateModal.price_per_kg - offerPrice) * orderQuantity).toFixed(0)} on ${orderQuantity} kg`
                    : `⚠️ Your offer is higher than the listed price`
                  }
                </div>

                <div>
                  <label className="label-text text-xs">Quantity (kg)</label>
                  <input 
                    type="number" value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Math.max(negotiateModal.min_quantity_kg, Number(e.target.value)))}
                    className="input-field text-sm"
                    min={negotiateModal.min_quantity_kg}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text text-xs">Your Name</label>
                    <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="input-field text-sm" placeholder="Full name" />
                  </div>
                  <div>
                    <label className="label-text text-xs">Your Phone</label>
                    <input type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="input-field text-sm" placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>

                <div>
                  <label className="label-text text-xs">Message to Seller</label>
                  <textarea 
                    value={buyerMessage} onChange={(e) => setBuyerMessage(e.target.value)}
                    className="input-field text-sm h-16 resize-none" 
                    placeholder="e.g. I can pick up from your village. Bulk order for my dairy with 12 cows."
                  />
                </div>

                {/* Total */}
                <div className="bg-dark-green text-white p-4 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-medium">Your Offer Total:</span>
                  <span className="text-2xl font-black">₹{(orderQuantity * offerPrice).toFixed(0)}</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleSendInquiry} className="btn-primary flex-1 py-3 text-sm" disabled={!buyerName || !buyerPhone}>
                    🤝 Send Offer & Get Contact
                  </button>
                  <button onClick={resetModals} className="btn-secondary py-3 px-5 text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
