import { Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/Home';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-off-white text-dark">
      <Navbar />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Mock routes for future implementation */}
          <Route path="/test-feed" element={<div className="p-12 text-center text-2xl font-bold">Test Feed Page Coming Soon</div>} />
          <Route path="/dashboard" element={<div className="p-12 text-center text-2xl font-bold">Dashboard Coming Soon</div>} />
          <Route path="/advisory" element={<div className="p-12 text-center text-2xl font-bold">Advisory Coming Soon</div>} />
          <Route path="/leaderboard" element={<div className="p-12 text-center text-2xl font-bold">Leaderboard Coming Soon</div>} />
          <Route path="/marketplace" element={<div className="p-12 text-center text-2xl font-bold">Marketplace Coming Soon</div>} />
          <Route path="*" element={<div className="p-12 text-center text-2xl font-bold">404 Not Found</div>} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
