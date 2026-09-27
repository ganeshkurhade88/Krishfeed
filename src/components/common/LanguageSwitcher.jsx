import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    document.documentElement.lang = lang;
  };

  return (
    <div className="flex gap-2 text-sm font-semibold">
      <button
        onClick={() => handleLanguageChange('mr')}
        className={`px-2 py-1 rounded transition-colors ${currentLang === 'mr' ? 'bg-lite-green text-dark' : 'text-pale-green hover:text-white'}`}
        aria-label="मराठी मध्ये बदला"
      >
        मराठी
      </button>
      <span className="text-pale-green opacity-50 py-1">|</span>
      <button
        onClick={() => handleLanguageChange('hi')}
        className={`px-2 py-1 rounded transition-colors ${currentLang === 'hi' ? 'bg-lite-green text-dark' : 'text-pale-green hover:text-white'}`}
        aria-label="हिंदी में बदलें"
      >
        हिंदी
      </button>
      <span className="text-pale-green opacity-50 py-1">|</span>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-2 py-1 rounded transition-colors ${currentLang === 'en' ? 'bg-lite-green text-dark' : 'text-pale-green hover:text-white'}`}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
