import { useI18n, Language, languageNames, languageFlags } from '../i18n'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()
  const languages: Language[] = ['zh', 'en', 'ja']

  return (
    <div className="language-switcher">
      <button className="language-button" aria-label="Select language">
        <span className="flag">{languageFlags[language]}</span>
        <span className="arrow">▼</span>
      </button>
      
      <div className="language-dropdown">
        {languages.map((lang) => (
          <button
            key={lang}
            className={`language-option ${lang === language ? 'active' : ''}`}
            onClick={() => setLanguage(lang)}
          >
            <span className="flag">{languageFlags[lang]}</span>
            <span className="name">{languageNames[lang]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
