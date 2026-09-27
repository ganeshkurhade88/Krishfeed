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
              <svg className="h-8 w-8 text-lite-green" viewBox="0 0 64 64" fill="currentColor">
                <rect width="64" height="64" rx="14" fill="#1B4332"/>
                <text x="50%" y="38" textAnchor="middle" fontSize="28" fontWeight="700" fill="#D8F3DC">FS</text>
                <text x="50%" y="52" textAnchor="middle" fontSize="10" fontWeight="400" fill="#52B788">AI</text>
              </svg>
              <span className="font-bold text-xl tracking-tight hidden sm:block">FeedSense AI</span>
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-pale-green hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white">
              {t('nav.home')}
            </Link>
            <Link to="/test-feed" className="text-pale-green hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white">
              {t('nav.test')}
            </Link>
            <Link to="/dashboard" className="text-pale-green hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white">
              {t('nav.dashboard')}
            </Link>
            <Link to="/marketplace" className="text-pale-green hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white">
              {t('nav.marketplace')}
            </Link>
          </div>
          
          <div className="flex items-center">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
