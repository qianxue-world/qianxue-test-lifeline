import { useState, useEffect } from 'react'
import CombinedReport from './components/CombinedReport'
import LanguageSwitcher from './components/LanguageSwitcher'
import { I18nContext, translations, Language } from './i18n'
import './App.css'

function App() {
  const [dataVersion, setDataVersion] = useState(0)
  const [isClearing, setIsClearing] = useState(false)
  const [showClearButton, setShowClearButton] = useState(false)
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('brainstats_language')
    return (saved as Language) || 'zh'
  })

  useEffect(() => {
    localStorage.setItem('brainstats_language', language)
  }, [language])

  const handleClearData = () => {
    setIsClearing(true)
    // 等待淡出动画完成后清理数据
    setTimeout(() => {
      const keys = ['lhDKT', 'rhDKT', 'lhAparc', 'rhAparc', 'aseg', 'subjectName']
      keys.forEach(key => localStorage.removeItem(`freesurfer_${key}`))
      setDataVersion(v => v + 1)
      setIsClearing(false)
      setShowClearButton(false)
    }, 800)
  }

  const i18nValue = {
    language,
    setLanguage,
    t: translations[language],
  }

  return (
    <I18nContext.Provider value={i18nValue}>
      <div className="app-container">
        <div className="top-bar">
          <button 
            className={`clear-btn ${showClearButton ? 'show' : 'hide'}`} 
            onClick={handleClearData} 
            title={i18nValue.t.common.clear}
            disabled={!showClearButton}
          >
            🗑️ {i18nValue.t.common.clear}
          </button>
          <LanguageSwitcher />
        </div>
        <main className="main-content">
          <CombinedReport 
            key={dataVersion} 
            isClearing={isClearing} 
            onShowClearButton={setShowClearButton}
          />
        </main>
      </div>
    </I18nContext.Provider>
  )
}

export default App
