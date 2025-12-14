import { useI18n } from '../i18n'
import './BasicMetricDetail.css'

export interface BasicMetric {
  id: string
  name: string
  value: number
  unit: string
  icon: string
  description: string
  normalRange: string
  interpretation: string
  relatedFunctions: string[]
  references: string[]
  percentile?: number // 人群百分位
}

interface Props {
  metric: BasicMetric
  onBack: () => void
}

// 圆形进度条组件
function CircularProgress({ percentile, label }: { percentile: number; label: string }) {
  const radius = 70
  const strokeWidth = 12
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentile / 100) * circumference
  
  // 根据百分位选择颜色（少女粉色系）
  const getColor = (p: number) => {
    if (p >= 80) return '#ff6b9d' // 粉红
    if (p >= 60) return '#ff8fb3' // 浅粉红
    if (p >= 40) return '#c9a0ff' // 淡紫
    if (p >= 20) return '#d4b3ff' // 更淡紫
    return '#e8c5ff' // 最淡紫
  }
  
  const color = getColor(percentile)
  
  return (
    <div className="circular-progress-container">
      <svg height={radius * 2} width={radius * 2} className="circular-progress">
        {/* 背景圆环 */}
        <circle
          stroke="rgba(255, 158, 199, 0.15)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* 进度圆环 */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-out' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </svg>
      <div className="circular-progress-content">
        <span className="percentile-label">{label}</span>
        <span className="percentile-value">{percentile}%</span>
      </div>
    </div>
  )
}

export default function BasicMetricDetail({ metric, onBack }: Props) {
  const { t } = useI18n()
  
  return (
    <div className="basic-metric-detail">
      <button className="back-button" onClick={onBack}>
        {t.basicMetricDetail.backButton}
      </button>

      <header className="detail-header">
        <h1>{metric.name}</h1>
      </header>

      {/* 核心数值与百分位 */}
      <section className="value-section">
        <div className="value-row">
          <div className="value-display">
            <span className="value-number">{metric.value.toFixed(metric.unit === 'mm' ? 2 : 0)}</span>
            <span className="value-unit">{metric.unit}</span>
          </div>
          {metric.percentile !== undefined && (
            <CircularProgress percentile={metric.percentile} label={t.basicMetricDetail.populationTop} />
          )}
        </div>
        <div className="normal-range">
          <span className="range-label">{t.basicMetricDetail.referenceRange}:</span>
          <span className="range-value">{metric.normalRange}</span>
        </div>
      </section>

      {/* 指标说明 */}
      <section className="detail-section">
        <h2>{t.basicMetricDetail.metricDescription}</h2>
        <div className="description-box">
          <p>{metric.description}</p>
        </div>
      </section>

      {/* 结果解读 */}
      <section className="detail-section">
        <h2>{t.basicMetricDetail.resultInterpretation}</h2>
        <div className="interpretation-box">
          <p>{metric.interpretation}</p>
        </div>
      </section>

      {/* 相关功能 */}
      <section className="detail-section">
        <h2>{t.basicMetricDetail.relatedFunctions}</h2>
        <div className="functions-list">
          {metric.relatedFunctions.map((func, i) => (
            <div key={i} className="function-item">
              <span className="function-bullet">•</span>
              <span>{func}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 参考文献 */}
      <section className="detail-section">
        <h2>{t.basicMetricDetail.references}</h2>
        <div className="references-list">
          {metric.references.map((ref, i) => (
            <div key={i} className="reference-item">
              <span className="ref-number">[{i + 1}]</span>
              <span className="ref-text">{ref}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="detail-footer">
        <p>{t.basicMetricDetail.disclaimer}</p>
      </footer>
    </div>
  )
}
