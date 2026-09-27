import { Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import TestFeed from './pages/TestFeed';
import Dashboard from './pages/Dashboard';
import Advisory from './pages/Advisory';
import Leaderboard from './pages/Leaderboard';
import Marketplace from './pages/Marketplace';
import Passport from './pages/Passport';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-off-white text-dark font-inter">
      <Navbar />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/test-feed" element={<TestFeed />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/advisory" element={<Advisory />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/passport/:id" element={<Passport />} />
          <Route path="*" element={<div className="p-16 text-center text-2xl font-bold text-dark-green">404 - Page Not Found</div>} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
