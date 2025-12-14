import { IndexResult } from '../utils/dkt'
import { useI18n } from '../i18n'
import './IndexDetail.css'

interface Props {
  index: IndexResult
  onBack: () => void
}

// 基础侧化指标名称列表
const BASIC_LATERALIZATION_INDICES = [
  'Handedness Index',
  'Dominant Eye Index',
  'Preferred Nostril Index',
  'Language Lateralization Index'
]

// 高级功能偏侧化指标名称列表
const ADVANCED_LATERALIZATION_INDICES = [
  'Spatial Attention Lateralization Index',
  'Emotion Processing Lateralization Index',
  'Face Recognition Lateralization Index',
  'Music Perception Lateralization Index',
  'Theory of Mind Lateralization Index',
  'Logical Reasoning Lateralization Index',
  'Mathematical Ability Lateralization Index'
]

// 所有侧化指标
const ALL_LATERALIZATION_INDICES = [...BASIC_LATERALIZATION_INDICES, ...ADVANCED_LATERALIZATION_INDICES]

export default function IndexDetail({ index, onBack }: Props) {
  const { t } = useI18n()
  const isLateralizationIndex = ALL_LATERALIZATION_INDICES.includes(index.name)

  const getPercentileColor = (p: number) => {
    if (p >= 93) return '#4caf50'
    if (p >= 84) return '#8bc34a'
    if (p >= 70) return '#cddc39'
    if (p >= 30) return '#ffeb3b'
    if (p >= 16) return '#ff9800'
    return '#f44336'
  }

  const getPercentileLabel = (p: number) => {
    if (p >= 98) return t.scores.excellent
    if (p >= 93) return t.scores.good
    if (p >= 84) return t.scores.aboveAverage
    if (p >= 70) return t.scores.aboveAverage
    if (p >= 30) return t.scores.average
    if (p >= 16) return t.scores.belowAverage
    return t.scores.needsAttention
  }

  // 侧化指标的百分比计算 - 根据不同指标类型使用不同的阈值范围
  const getLateralizationPercent = (value: number): number => {
    let leftExtreme: number, rightExtreme: number
    
    switch (index.name) {
      case 'Handedness Index':
        leftExtreme = -1.28; rightExtreme = 1.28
        break
      case 'Dominant Eye Index':
        leftExtreme = -1.5; rightExtreme = 1.5
        break
      case 'Preferred Nostril Index':
        leftExtreme = -1.2; rightExtreme = 1.2
        break
      case 'Language Lateralization Index':
        // 语言偏侧化：正值=左脑优势，负值=右脑优势
        // 进度条标签是：左脑 | 双侧 | 右脑，需要反转
        leftExtreme = 0.20; rightExtreme = -0.15
        break
      case 'Spatial Attention Lateralization Index':
        leftExtreme = -0.40; rightExtreme = 0.80
        break
      case 'Emotion Processing Lateralization Index':
        leftExtreme = -0.50; rightExtreme = 0.90
        break
      case 'Face Recognition Lateralization Index':
        leftExtreme = -0.60; rightExtreme = 1.00
        break
      case 'Music Perception Lateralization Index':
        leftExtreme = -0.70; rightExtreme = 1.20
        break
      case 'Theory of Mind Lateralization Index':
        leftExtreme = -0.40; rightExtreme = 0.80
        break
      case 'Logical Reasoning Lateralization Index':
        leftExtreme = -0.80; rightExtreme = 0.50
        break
      case 'Mathematical Ability Lateralization Index':
        leftExtreme = -0.90; rightExtreme = 0.40
        break
      default:
        leftExtreme = -2; rightExtreme = 2
    }
    
    const range = rightExtreme - leftExtreme
    const percent = ((value - leftExtreme) / range) * 100
    return Math.max(0, Math.min(100, percent))
  }

  // 侧化指标的颜色
  const getLateralizationColor = (percent: number): string => {
    if (percent >= 70) return '#e91e63'
    if (percent >= 60) return '#f48fb1'
    if (percent >= 40) return '#9c27b0'
    if (percent >= 30) return '#7986cb'
    return '#3f51b5'
  }

  // 侧化指标的标签
  const getLateralizationLabel = (): string => {
    const value = index.value
    if (index.name === 'Handedness Index') {
      if (value >= 1.28) return t.lateralization.extreme + ' ' + t.lateralization.rightHand
      if (value >= 0.84) return t.lateralization.strong + ' ' + t.lateralization.rightHand
      if (value >= 0.52) return t.lateralization.rightHand
      if (value >= -0.52) return t.lateralization.ambidextrous
      if (value >= -0.84) return t.lateralization.leftHand
      return t.lateralization.strong + ' ' + t.lateralization.leftHand
    } else if (index.name === 'Dominant Eye Index') {
      if (value >= 1.5) return t.lateralization.extreme + ' ' + t.lateralization.rightEye
      if (value >= 0.8) return t.lateralization.strong + ' ' + t.lateralization.rightEye
      if (value >= 0.3) return t.lateralization.rightEye
      if (value >= -0.3) return t.lateralization.balanced
      if (value >= -0.8) return t.lateralization.leftEye
      return t.lateralization.strong + ' ' + t.lateralization.leftEye
    } else if (index.name === 'Preferred Nostril Index') {
      if (value >= 1.2) return t.lateralization.extreme + ' ' + t.lateralization.rightNostril
      if (value >= 0.7) return t.lateralization.strong + ' ' + t.lateralization.rightNostril
      if (value >= 0.3) return t.lateralization.rightNostril
      if (value >= -0.3) return t.lateralization.balanced
      if (value >= -0.7) return t.lateralization.leftNostril
      if (value >= -1.2) return t.lateralization.strong + ' ' + t.lateralization.leftNostril
      return t.lateralization.extreme + ' ' + t.lateralization.leftNostril
    } else if (index.name === 'Language Lateralization Index') {
      if (value >= 0.20) return t.lateralization.typical + ' ' + t.lateralization.leftBrain
      if (value >= 0.05) return t.lateralization.weak + ' ' + t.lateralization.leftBrain
      if (value >= -0.05) return t.lateralization.bilateral
      if (value >= -0.15) return t.lateralization.weak + ' ' + t.lateralization.rightBrain
      return t.lateralization.atypical + ' ' + t.lateralization.rightBrain
    } else if (index.name === 'Spatial Attention Lateralization Index') {
      if (value >= 0.80) return t.lateralization.extreme + ' ' + t.lateralization.rightBrain
      if (value >= 0.40) return t.lateralization.strong + ' ' + t.lateralization.rightBrain
      if (value >= -0.20) return t.lateralization.balanced
      if (value >= -0.40) return t.lateralization.leftBrain
      return t.lateralization.strong + ' ' + t.lateralization.leftBrain
    } else if (index.name === 'Emotion Processing Lateralization Index') {
      if (value >= 0.90) return t.lateralization.extreme + ' ' + t.lateralization.rightBrain
      if (value >= 0.50) return t.lateralization.strong + ' ' + t.lateralization.rightBrain
      if (value >= -0.30) return t.lateralization.balanced
      if (value >= -0.50) return t.lateralization.leftBrain
      return t.lateralization.strong + ' ' + t.lateralization.leftBrain
    } else if (index.name === 'Face Recognition Lateralization Index') {
      if (value >= 1.00) return t.lateralization.extreme + ' ' + t.lateralization.rightBrain
      if (value >= 0.60) return t.lateralization.strong + ' ' + t.lateralization.rightBrain
      if (value >= -0.20) return t.lateralization.balanced
      if (value >= -0.60) return t.lateralization.leftBrain
      return t.lateralization.strong + ' ' + t.lateralization.leftBrain
    } else if (index.name === 'Music Perception Lateralization Index') {
      if (value >= 1.20) return t.lateralization.extreme + ' ' + t.lateralization.rightBrain
      if (value >= 0.70) return t.lateralization.strong + ' ' + t.lateralization.rightBrain
      if (value >= -0.30) return t.lateralization.balanced
      if (value >= -0.70) return t.lateralization.leftBrain
      return t.lateralization.strong + ' ' + t.lateralization.leftBrain
    } else if (index.name === 'Theory of Mind Lateralization Index') {
      if (value >= 0.80) return t.lateralization.extreme + ' ' + t.lateralization.rightBrain
      if (value >= 0.40) return t.lateralization.strong + ' ' + t.lateralization.rightBrain
      if (value >= -0.20) return t.lateralization.balanced
      if (value >= -0.40) return t.lateralization.leftBrain
      return t.lateralization.strong + ' ' + t.lateralization.leftBrain
    } else if (index.name === 'Logical Reasoning Lateralization Index') {
      // 逻辑推理：负值=左脑优势
      if (value <= -0.80) return t.lateralization.extreme + ' ' + t.lateralization.leftBrain
      if (value <= -0.50) return t.lateralization.strong + ' ' + t.lateralization.leftBrain
      if (value <= -0.20) return t.lateralization.leftBrain
      if (value <= 0.20) return t.lateralization.balanced
      if (value <= 0.50) return t.lateralization.rightBrain
      return t.lateralization.strong + ' ' + t.lateralization.rightBrain
    } else if (index.name === 'Mathematical Ability Lateralization Index') {
      // 数学能力：负值=左脑优势
      if (value <= -0.90) return t.lateralization.extreme + ' ' + t.lateralization.leftBrain
      if (value <= -0.60) return t.lateralization.strong + ' ' + t.lateralization.leftBrain
      if (value <= -0.20) return t.lateralization.leftBrain
      if (value <= 0.20) return t.lateralization.balanced
      if (value <= 0.40) return t.lateralization.rightBrain
      return t.lateralization.strong + ' ' + t.lateralization.rightBrain
    }
    // 默认
    return t.lateralization.balanced
  }

  const lateralizationPercent = isLateralizationIndex ? getLateralizationPercent(index.value) : 0
  const lateralizationColor = isLateralizationIndex ? getLateralizationColor(lateralizationPercent) : ''

  return (
    <div className="index-detail-page">
      <button className="back-button" onClick={onBack}>
        {t.indexDetail.backButton}
      </button>

      <header className="detail-header">
        <h1>{t.dkt.indexNames[index.name as keyof typeof t.dkt.indexNames]}</h1>
        <p className="detail-name-en">{index.name}</p>
      </header>

      {/* 核心数值 */}
      <section className="detail-score-section">
        {isLateralizationIndex ? (
          <>
            <div className="score-display">
              <div className="score-main">
                <span className="score-number">{index.value}</span>
                <span className="score-unit">{t.indexDetail.lateralizationIndex}</span>
              </div>
              <div className="score-percentile">
                <span 
                  className="percentile-label"
                  style={{ background: lateralizationColor }}
                >
                  {getLateralizationLabel()}
                </span>
              </div>
            </div>
            <div className="lateralization-bar-large">
              <div className="lat-bar-track">
                <div className="lat-bar-center-line" />
                <div 
                  className="lat-bar-marker"
                  style={{ left: `${lateralizationPercent}%` }}
                />
              </div>
              <div className="lat-bar-labels">
                {index.name === 'Logical Reasoning Lateralization Index' || index.name === 'Mathematical Ability Lateralization Index' ? (
                  <>
                    <span className="lat-label-left">{t.lateralization.leftBrain}</span>
                    <span className="lat-label-center">{t.lateralization.balanced}</span>
                    <span className="lat-label-right">{t.lateralization.rightBrain}</span>
                  </>
                ) : index.name === 'Handedness Index' ? (
                  <>
                    <span className="lat-label-left">{t.lateralization.leftHand}</span>
                    <span className="lat-label-center">{t.lateralization.ambidextrous}</span>
                    <span className="lat-label-right">{t.lateralization.rightHand}</span>
                  </>
                ) : index.name === 'Dominant Eye Index' ? (
                  <>
                    <span className="lat-label-left">{t.lateralization.leftEye}</span>
                    <span className="lat-label-center">{t.lateralization.balanced}</span>
                    <span className="lat-label-right">{t.lateralization.rightEye}</span>
                  </>
                ) : index.name === 'Preferred Nostril Index' ? (
                  <>
                    <span className="lat-label-left">{t.lateralization.leftNostril}</span>
                    <span className="lat-label-center">{t.lateralization.balanced}</span>
                    <span className="lat-label-right">{t.lateralization.rightNostril}</span>
                  </>
                ) : index.name === 'Language Lateralization Index' ? (
                  <>
                    <span className="lat-label-left">{t.lateralization.leftBrain}</span>
                    <span className="lat-label-center">{t.lateralization.bilateral}</span>
                    <span className="lat-label-right">{t.lateralization.rightBrain}</span>
                  </>
                ) : (
                  <>
                    <span className="lat-label-left">{t.dkt.lateralizationLabels.leftSide}</span>
                    <span className="lat-label-center">{t.lateralization.balanced}</span>
                    <span className="lat-label-right">{t.dkt.lateralizationLabels.rightSide}</span>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="score-display">
              <div className="score-main">
                <span className="score-number">{index.value}</span>
                <span className="score-unit">{t.indexDetail.zScore}</span>
              </div>
              <div className="score-percentile">
                <div 
                  className="percentile-circle"
                  style={{ borderColor: getPercentileColor(index.percentile) }}
                >
                  <span style={{ color: getPercentileColor(index.percentile) }}>
                    {t.indexDetail.top}{100 - index.percentile}%
                  </span>
                </div>
                <span 
                  className="percentile-label"
                  style={{ background: getPercentileColor(index.percentile) }}
                >
                  {getPercentileLabel(index.percentile)}
                </span>
              </div>
            </div>
            <div className="percentile-bar-large">
              <div className="bar-track">
                <div 
                  className="bar-fill"
                  style={{ 
                    width: `${index.percentile}%`,
                    background: getPercentileColor(index.percentile)
                  }}
                />
                <div 
                  className="bar-marker"
                  style={{ left: `${index.percentile}%` }}
                />
              </div>
              <div className="bar-labels">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* 解读 */}
      <section className="detail-section">
        <h2>{t.indexDetail.interpretation}</h2>
        <div className="interpretation-box">
          <p>{index.interpretation}</p>
        </div>
      </section>

      {/* 阈值标准 */}
      <section className="detail-section">
        <h2>{t.indexDetail.thresholdStandard}</h2>
        <div className="threshold-box">
          <code>{index.threshold}</code>
        </div>
      </section>

      {/* 计算方法 */}
      <section className="detail-section">
        <h2>{t.indexDetail.calculationMethod}</h2>
        <div className="method-box">
          <div className="method-item">
            <span className="method-label">{t.indexDetail.formula}:</span>
            <code className="formula">{index.formula}</code>
          </div>
          <div className="method-item">
            <span className="method-label">{t.indexDetail.weights}:</span>
            <span>{index.weights}</span>
          </div>
        </div>
      </section>

      {/* 涉及脑区 */}
      <section className="detail-section">
        <h2>{t.indexDetail.brainRegions}</h2>
        <div className="regions-list">
          {index.regions.map((r, i) => (
            <span key={i} className="region-chip">{r}</span>
          ))}
        </div>
      </section>

      {/* Z-Score 详情表格 */}
      {index.details && index.details.length > 0 && (
        <section className="detail-section">
          <h2>{t.indexDetail.zScoreDetails}</h2>
          <div className="table-container">
            <table className="zscore-table">
              <thead>
                <tr>
                  <th>{t.indexDetail.region}</th>
                  <th>{t.indexDetail.weight}</th>
                  <th>{t.indexDetail.leftZ}</th>
                  <th>{t.indexDetail.rightZ}</th>
                  <th>{t.indexDetail.leftContribution}</th>
                  <th>{t.indexDetail.rightContribution}</th>
                  <th>{t.indexDetail.thickSurfVol}</th>
                </tr>
              </thead>
              <tbody>
                {index.details.map((d, i) => (
                  <tr key={i}>
                    <td className="region-name">{t.brainRegions?.[d.region as keyof typeof t.brainRegions] || d.region}</td>
                    <td>{(d.regionWeight * 100).toFixed(0)}%</td>
                    <td className={d.zL > 0 ? 'positive' : d.zL < 0 ? 'negative' : ''}>
                      {d.zL.toFixed(3)}
                    </td>
                    <td className={d.zR > 0 ? 'positive' : d.zR < 0 ? 'negative' : ''}>
                      {d.zR.toFixed(3)}
                    </td>
                    <td>{d.contribL.toFixed(3)}</td>
                    <td>{d.contribR.toFixed(3)}</td>
                    <td className="weights-cell">{d.weightsUsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-note">
            {t.indexDetail.zScoreNote}
          </p>
        </section>
      )}

      {/* 对视小贴士 - 仅在主视眼指数时显示 */}
      {index.name === 'Dominant Eye Index' && t.indexDetail.eyeContactTip && (
        <section className="detail-section eye-contact-tip">
          <h2>{t.indexDetail.eyeContactTip}</h2>
          <div className="tip-box">
            <p>{t.indexDetail.eyeContactContent}</p>
          </div>
        </section>
      )}

      {/* 参考文献 */}
      <section className="detail-section">
        <h2>{t.indexDetail.references}</h2>
        <div className="references-list">
          {index.references.map((r, i) => (
            <div key={i} className="reference-item">
              <span className="ref-number">[{i + 1}]</span>
              <span className="ref-text">{r}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 免责声明 */}
      <footer className="detail-footer">
        <p>{t.indexDetail.disclaimer}</p>
      </footer>
    </div>
  )
}
