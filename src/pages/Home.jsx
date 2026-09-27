import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-dark-green text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle SVG background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="leaf-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M50 20 C60 10, 80 10, 80 30 C80 50, 50 80, 50 80 C50 80, 20 50, 20 30 C20 10, 40 10, 50 20 Z" fill="currentColor" opacity="0.3"/>
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#leaf-pattern)" />
          </svg>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center z-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            {t('home.hero.headline')}
          </h1>
          <p className="text-xl md:text-2xl text-pale-green font-medium mb-10 max-w-2xl mx-auto">
            {t('home.hero.subhead')}
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <span className="bg-mid-green bg-opacity-50 border border-lite-green rounded-full px-4 py-1.5 text-sm font-semibold">
              {t('home.hero.pill.ai')}
            </span>
            <span className="bg-mid-green bg-opacity-50 border border-lite-green rounded-full px-4 py-1.5 text-sm font-semibold">
              {t('home.hero.pill.risk')}
            </span>
            <span className="bg-mid-green bg-opacity-50 border border-lite-green rounded-full px-4 py-1.5 text-sm font-semibold">
              {t('home.hero.pill.trace')}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/test-feed" className="btn-primary bg-white text-dark-green hover:bg-pale-green hover:text-dark-green shadow-elevated">
              {t('home.hero.cta')}
            </Link>
            <button className="btn-secondary border-pale-green text-pale-green hover:bg-mid-green hover:text-white" aria-label="View Demo video">
              {t('home.hero.demo')}
            </button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-light-grey py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-dark-green mb-12">
            {t('home.problem.title')}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center flex flex-col items-center justify-center p-8 hover:-translate-y-1 transition-transform duration-300">
              <div className="text-4xl mb-4">💸</div>
              <p className="font-medium text-dark text-lg mb-2">{t('home.problem.1')}</p>
              <p className="text-xs text-grey mt-auto pt-4">{t('home.problem.note')}</p>
            </div>
            <div className="card text-center flex flex-col items-center justify-center p-8 hover:-translate-y-1 transition-transform duration-300">
              <div className="text-4xl mb-4">⏳</div>
              <p className="font-medium text-dark text-lg mb-2">{t('home.problem.2')}</p>
              <p className="text-xs text-grey mt-auto pt-4">{t('home.problem.note')}</p>
            </div>
            <div className="card text-center flex flex-col items-center justify-center p-8 hover:-translate-y-1 transition-transform duration-300">
              <div className="text-4xl mb-4">📉</div>
              <p className="font-medium text-dark text-lg mb-2">{t('home.problem.3')}</p>
              <p className="text-xs text-grey mt-auto pt-4">{t('home.problem.note')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-dark-green mb-16">
            {t('home.how.title')}
          </h2>
          
          <div className="flex flex-col md:flex-row justify-between items-start relative">
            {/* Desktop connecting line */}
            <div className="hidden md:block absolute top-8 left-10 right-10 h-1 bg-pale-green z-0" aria-hidden="true"></div>
            
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex flex-col items-center mb-8 md:mb-0 relative z-10 w-full md:w-1/5 px-2 text-center group">
                <div className="w-16 h-16 rounded-full bg-pale-green border-4 border-white flex items-center justify-center text-2xl mb-4 shadow-sm group-hover:bg-lite-green transition-colors">
                  {t(`home.how.${step}`).split(' ')[0]}
                </div>
                <h3 className="font-bold text-dark mb-2">Step {step}</h3>
                <p className="text-sm text-grey font-medium">
                  {t(`home.how.${step}`).substring(t(`home.how.${step}`).indexOf(' ') + 1)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-pale-green py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-dark-green mb-12">
            {t('home.features.title')}
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((feature) => (
              <div key={feature} className="bg-white rounded-card p-6 border-l-4 border-mid-green shadow-card hover:shadow-card-hover transition-shadow relative overflow-hidden">
                {feature >= 3 && (
                  <span className="absolute top-0 right-0 bg-accent-orange text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                    NEW
                  </span>
                )}
                <h3 className="font-bold text-dark text-lg mb-2">
                  {t(`home.features.${feature}.title`)}
                </h3>
                <p className="text-sm text-grey">
                  {t(`home.features.${feature}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-amber bg-opacity-20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[13px] text-grey">
            {t('home.disclaimer')}
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
