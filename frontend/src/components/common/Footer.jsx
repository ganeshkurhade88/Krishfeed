import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-dark text-gray-300 py-8 border-t-4 border-mid-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold text-white mb-2">KrushiFeed Ai (FARM2MARKET1)</h2>
            <p className="text-sm text-gray-400 max-w-sm">
              {t('footer.tagline')}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Contact: support@farm2market1.in
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/privacy-policy" className="hover:text-white transition-colors focus:outline-none focus:underline">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms-and-conditions" className="hover:text-white transition-colors focus:outline-none focus:underline">
              {t('footer.terms')}
            </Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors focus:outline-none focus:underline">
              {t('footer.cookie')}
            </Link>
            <Link to="/refund-policy" className="hover:text-white transition-colors focus:outline-none focus:underline">
              {t('footer.refund')}
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-700 text-center text-xs text-gray-500">
          {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
