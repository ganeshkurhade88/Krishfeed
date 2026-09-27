import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const { t } = useTranslation();

  return (
    <nav className="bg-dark-green text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white rounded">
              <div className="h-9 w-9 rounded-xl bg-pale-green text-dark-green flex items-center justify-center font-black text-sm shadow">
                FS
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight leading-none text-white">FeedSense AI</span>
                <span className="text-[10px] text-lite-green font-semibold leading-none">Smart Feed & Silage</span>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-pale-green hover:text-white px-2 py-1 rounded text-sm font-medium transition-colors">
              {t('nav.home') || 'Home'}
            </Link>
            <Link to="/test-feed" className="text-pale-green hover:text-white px-2 py-1 rounded text-sm font-medium transition-colors">
              🧪 {t('nav.test') || 'Test Feed'}
            </Link>
            <Link to="/dashboard" className="text-pale-green hover:text-white px-2 py-1 rounded text-sm font-medium transition-colors">
              📊 {t('nav.dashboard') || 'Dashboard'}
            </Link>
            <Link to="/advisory" className="text-pale-green hover:text-white px-2 py-1 rounded text-sm font-medium transition-colors">
              🩺 Advisory
            </Link>
            <Link to="/marketplace" className="text-pale-green hover:text-white px-2 py-1 rounded text-sm font-medium transition-colors">
              🛒 {t('nav.marketplace') || 'Marketplace'}
            </Link>
            <Link to="/leaderboard" className="text-pale-green hover:text-white px-2 py-1 rounded text-sm font-medium transition-colors">
              🏆 Leaderboard
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
