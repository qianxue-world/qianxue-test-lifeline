import { useState, useEffect, useCallback } from 'react'
import { parseDKTStats, runDKTAnalysis, DKTAnalysisResult, IndexResult } from '../utils/dkt'
import BasicMetricDetail, { BasicMetric } from './BasicMetricDetail'
import IndexDetail from './IndexDetail'
import { useI18n } from '../i18n'
import './CombinedReport.css'

// 文件类型配置
const fileTypesConfig = [
  { key: 'lhDKT', pattern: /lh\.aparc\.DKTatlas\.stats$/i },
  { key: 'rhDKT', pattern: /rh\.aparc\.DKTatlas\.stats$/i },
  { key: 'lhAparc', pattern: /lh\.aparc\.stats$/i },
  { key: 'rhAparc', pattern: /rh\.aparc\.stats$/i },
  { key: 'aseg', pattern: /aseg\.stats$/i },
  { key: 'lhBA', pattern: /lh\.BA_exvivo\.stats$/i },
  { key: 'rhBA', pattern: /rh\.BA_exvivo\.stats$/i },
] as const

function detectFileType(fileName: string): string | null {
  for (const ft of fileTypesConfig) {
    if (ft.pattern.test(fileName)) return ft.key
  }
  return null
}

function extractSubjectName(content: string): string | null {
  const match = content.match(/^#\s*subjectname\s+(.+)$/m)
  return match ? match[1].trim() : null
}

// 基础指标的参考数据（均值和标准差，基于文献）
const basicMetricNorms: Record<string, { mean: number; sd: number }> = {
  brainVol: { mean: 1250, sd: 120 },      // cm³, 成年人平均脑容量
  cortexVol: { mean: 550, sd: 55 },       // cm³, 皮层灰质体积
  whiteVol: { mean: 475, sd: 50 },        // cm³, 白质体积
  lhThickness: { mean: 2.55, sd: 0.15 },  // mm, 左半球皮层厚度
  rhThickness: { mean: 2.55, sd: 0.15 },  // mm, 右半球皮层厚度
}

// 计算百分位（基于正态分布）
function calculatePercentile(value: number, mean: number, sd: number): number {
  const z = (value - mean) / sd
  // 使用近似公式计算正态分布CDF
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp(-z * z / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  const cdf = z > 0 ? 1 - p : p
  // 返回"人群前X%"，即 100 - percentile
  return Math.max(1, Math.min(99, Math.round((1 - cdf) * 100)))
}

// 小型圆形进度条组件（用于首页卡片）
function MiniCircularProgress({ percentile }: { percentile: number }) {
  const radius = 32
  const strokeWidth = 5
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentile / 100) * circumference
  
  // 根据百分位选择颜色（少女粉色系）
  const getColor = (p: number) => {
    if (p >= 80) return '#ff6b9d'
    if (p >= 60) return '#ff8fb3'
    if (p >= 40) return '#c9a0ff'
    if (p >= 20) return '#d4b3ff'
    return '#e8c5ff'
  }
  
  return (
    <div className="mini-circular-progress">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="rgba(255, 158, 199, 0.15)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getColor(percentile)}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s ease-out' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </svg>
      <span className="mini-percentile">{percentile}%</span>
    </div>
  )
}

// 基础指标详情数据
const getBasicMetricsInfo = (t: ReturnType<typeof useI18n>['t']): Record<string, Omit<BasicMetric, 'value' | 'percentile'>> => ({
  brainVol: {
    id: 'brainVol',
    name: t.overview.metrics.brainVol.name,
    unit: 'cm³',
    icon: '🧠',
    description: t.overview.metrics.brainVol.description,
    normalRange: t.overview.metrics.brainVol.normalRange,
    interpretation: t.overview.metrics.brainVol.interpretation,
    relatedFunctions: t.overview.metrics.brainVol.relatedFunctions,
    references: ['Pietschnig J, et al. (2015). Neuroscience & Biobehavioral Reviews.']
  },
  cortexVol: {
    id: 'cortexVol',
    name: t.overview.metrics.cortexVol.name,
    unit: 'cm³',
    icon: '🔘',
    description: t.overview.metrics.cortexVol.description,
    normalRange: t.overview.metrics.cortexVol.normalRange,
    interpretation: t.overview.metrics.cortexVol.interpretation,
    relatedFunctions: t.overview.metrics.cortexVol.relatedFunctions,
    references: ['Kanai R, Rees G. (2011). Nature Reviews Neuroscience.']
  },
  whiteVol: {
    id: 'whiteVol',
    name: t.overview.metrics.whiteVol.name,
    unit: 'cm³',
    icon: '⚪',
    description: t.overview.metrics.whiteVol.description,
    normalRange: t.overview.metrics.whiteVol.normalRange,
    interpretation: t.overview.metrics.whiteVol.interpretation,
    relatedFunctions: t.overview.metrics.whiteVol.relatedFunctions,
    references: ['Fields RD. (2008). Trends in Neurosciences.']
  },
  lhThickness: {
    id: 'lhThickness',
    name: t.overview.metrics.lhThickness.name,
    unit: 'mm',
    icon: '📐',
    description: t.overview.metrics.lhThickness.description,
    normalRange: t.overview.metrics.lhThickness.normalRange,
    interpretation: t.overview.metrics.lhThickness.interpretation,
    relatedFunctions: t.overview.metrics.lhThickness.relatedFunctions,
    references: ['Fischl B, Dale AM. (2000). PNAS.']
  },
  rhThickness: {
    id: 'rhThickness',
    name: t.overview.metrics.rhThickness.name,
    unit: 'mm',
    icon: '📐',
    description: t.overview.metrics.rhThickness.description,
    normalRange: t.overview.metrics.rhThickness.normalRange,
    interpretation: t.overview.metrics.rhThickness.interpretation,
    relatedFunctions: t.overview.metrics.rhThickness.relatedFunctions,
    references: ['Toga AW, Thompson PM. (2003). Nature Reviews Neuroscience.']
  }
})

interface CombinedReportProps {
  isClearing?: boolean
  onShowClearButton?: (show: boolean) => void
}

export default function CombinedReport({ isClearing = false, onShowClearButton }: CombinedReportProps) {
  const { t } = useI18n()
  const [analysis, setAnalysis] = useState<DKTAnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBasicMetric, setSelectedBasicMetric] = useState<BasicMetric | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<IndexResult | null>(null)
  const [basicInfo, setBasicInfo] = useState<{
    eTIV: number; brainVol: number; cortexVol: number; whiteVol: number; lhThickness: number; rhThickness: number
  } | null>(null)
  const [pageTransition, setPageTransition] = useState<'in' | 'out' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [isInDetailPage, setIsInDetailPage] = useState(false)

  useEffect(() => { loadData() }, [])
  
  useEffect(() => {
    onShowClearButton?.(hasData && !isInDetailPage)
  }, [hasData, isInDetailPage, onShowClearButton])

  const processEntry = useCallback(async (entry: FileSystemEntry): Promise<File[]> => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        (entry as FileSystemFileEntry).file((file) => resolve([file]), () => resolve([]))
      })
    } else if (entry.isDirectory) {
      const dirReader = (entry as FileSystemDirectoryEntry).createReader()
      return new Promise((resolve) => {
        const allFiles: File[] = []
        const readEntries = () => {
          dirReader.readEntries(async (entries) => {
            if (entries.length === 0) {
              resolve(allFiles)
            } else {
              for (const e of entries) {
                const files = await processEntry(e)
                allFiles.push(...files)
              }
              readEntries()
            }
          }, () => resolve(allFiles))
        }
        readEntries()
      })
    }
    return []
  }, [])

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const items = e.dataTransfer.items
    const allFiles: File[] = []
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        if (entry) {
          const files = await processEntry(entry)
          allFiles.push(...files)
        }
      }
    }
    
    let matchedCount = 0
    for (const file of allFiles) {
      const detectedType = detectFileType(file.name)
      if (detectedType) {
        const text = await file.text()
        if (text.includes('# Measure')) {
          localStorage.setItem(`freesurfer_${detectedType}`, text)
          const subjectName = extractSubjectName(text)
          if (subjectName) localStorage.setItem('freesurfer_subjectName', subjectName)
          matchedCount++
        }
      }
    }
    
    if (matchedCount >= 5) {
      loadData()
    }
  }, [processEntry])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const lhDKT = localStorage.getItem('freesurfer_lhDKT')
      const rhDKT = localStorage.getItem('freesurfer_rhDKT')
      const lhAparc = localStorage.getItem('freesurfer_lhAparc')
      const rhAparc = localStorage.getItem('freesurfer_rhAparc')
      const aseg = localStorage.getItem('freesurfer_aseg')
      
      if (!lhDKT || !rhDKT || !lhAparc || !rhAparc || !aseg) {
        setHasData(false)
        setLoading(false)
        return
      }

      const parseValue = (content: string, key: string): number => {
        // 匹配格式: # Measure BrainSeg, BrainSegVol, Brain Segmentation Volume, 1797786.000000, mm^3
        const regex = new RegExp(`# Measure[^,]*,\\s*${key}[^,]*,[^,]*,\\s*([\\d.]+)`, 'i')
        const match = content.match(regex)
        if (match) return parseFloat(match[1])
        // 备用匹配：直接搜索 key 后面的数值
        const altRegex = new RegExp(`${key}[^\\d]*([\\d.]+)`, 'i')
        const altMatch = content.match(altRegex)
        return altMatch ? parseFloat(altMatch[1]) : 0
      }
      const parseMeanThickness = (content: string): number => {
        const match = content.match(/# Measure Cortex, MeanThickness.*,\s*([\d.]+)/)
        return match ? parseFloat(match[1]) : 0
      }
      setBasicInfo({
        eTIV: parseValue(aseg, 'eTIV'),
        brainVol: parseValue(aseg, 'BrainSegVol'),
        cortexVol: parseValue(aseg, 'CortexVol'),
        whiteVol: parseValue(aseg, 'CerebralWhiteMatterVol'),
        lhThickness: parseMeanThickness(lhAparc),
        rhThickness: parseMeanThickness(rhAparc)
      })
      const lhData = parseDKTStats(lhDKT)
      const rhData = parseDKTStats(rhDKT)
      
      // 加载 BA_exvivo 数据（可选）
      const lhBA = localStorage.getItem('freesurfer_lhBA')
      const rhBA = localStorage.getItem('freesurfer_rhBA')
      const lhBAData = lhBA ? parseDKTStats(lhBA) : undefined
      const rhBAData = rhBA ? parseDKTStats(rhBA) : undefined
      
      const result = runDKTAnalysis(lhData, rhData, t, lhBAData, rhBAData)
      setAnalysis(result)
      setHasData(true)
    } catch {
      setHasData(false)
    }
    setLoading(false)
  }

  const handleBasicMetricClick = (metricId: string, value: number) => {
    const basicMetricsInfo = getBasicMetricsInfo(t)
    const info = basicMetricsInfo[metricId]
    if (info) {
      // 计算百分位
      const norm = basicMetricNorms[metricId]
      const percentile = norm ? calculatePercentile(value, norm.mean, norm.sd) : undefined
      
      setPageTransition('out')
      setTimeout(() => {
        setSelectedBasicMetric({ ...info, value, percentile })
        setIsInDetailPage(true)
        setPageTransition('in')
        setTimeout(() => setPageTransition(null), 400)
      }, 300)
    }
  }

  const handleIndexClick = (index: IndexResult) => {
    setPageTransition('out')
    setTimeout(() => {
      setSelectedIndex(index)
      setIsInDetailPage(true)
      setPageTransition('in')
      setTimeout(() => setPageTransition(null), 400)
    }, 300)
  }

  const handleBack = () => {
    setPageTransition('out')
    setTimeout(() => {
      setSelectedBasicMetric(null)
      setSelectedIndex(null)
      setIsInDetailPage(false)
      setPageTransition('in')
      setTimeout(() => setPageTransition(null), 400)
    }, 300)
  }

  if (selectedBasicMetric) {
    return (
      <div className={`page-wrapper ${pageTransition === 'in' ? 'fade-in' : pageTransition === 'out' ? 'fade-out' : ''}`}>
        <BasicMetricDetail metric={selectedBasicMetric} onBack={handleBack} />
      </div>
    )
  }
  if (selectedIndex) {
    return (
      <div className={`page-wrapper ${pageTransition === 'in' ? 'fade-in' : pageTransition === 'out' ? 'fade-out' : ''}`}>
        <IndexDetail index={selectedIndex} onBack={handleBack} />
      </div>
    )
  }

  if (!hasData && !loading) {
    return (
      <div className="combined-report">
        <section 
          className={`hero-section drop-zone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="drop-zone-content">
            <div className="drop-icon">🧠</div>
            <h2>{t.upload?.dragFolder || '拖入 stats 文件夹'}</h2>
            <p>{t.upload?.dragFolderHint || '将 FreeSurfer 的 stats 文件夹拖到这里'}</p>
          </div>
        </section>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="combined-loading">
        <div className="loading-spinner" />
        <p>{t.overview.loading}</p>
      </div>
    )
  }

  const subjectName = localStorage.getItem('freesurfer_subjectName') || 'Unknown'

  return (
    <div className={`page-wrapper ${pageTransition === 'in' ? 'fade-in' : pageTransition === 'out' ? 'fade-out' : ''} ${isClearing ? 'clearing' : ''}`}>
      <div className="combined-report">
        {/* 报告头部 */}
        <header className="report-header">
          <h1>{t.overview.title}</h1>
          <div className="report-subject">
            <span>📋</span>
            <span>{t.overview.subject}:</span>
            <strong>{subjectName}</strong>
          </div>
          <div className="report-date">{new Date().toLocaleDateString()}</div>
        </header>

        {/* 基础指标 */}
        {basicInfo && (
          <section className="basic-section">
            <h2>{t.overview.basicMetrics}</h2>
            <p className="section-subtitle">{t.common.clickForDetails}</p>
            <div className="basic-metrics-card">
              <div className="basic-metric-item" onClick={() => handleBasicMetricClick('brainVol', basicInfo.brainVol / 1000)}>
                <MiniCircularProgress percentile={calculatePercentile(basicInfo.brainVol / 1000, basicMetricNorms.brainVol.mean, basicMetricNorms.brainVol.sd)} />
                <span className="bm-value">{(basicInfo.brainVol / 1000).toFixed(1)}<small>cm³</small></span>
                <span className="bm-label">{t.overview.metrics.brainVol.name}</span>
              </div>
              <div className="basic-metric-item" onClick={() => handleBasicMetricClick('cortexVol', basicInfo.cortexVol / 1000)}>
                <MiniCircularProgress percentile={calculatePercentile(basicInfo.cortexVol / 1000, basicMetricNorms.cortexVol.mean, basicMetricNorms.cortexVol.sd)} />
                <span className="bm-value">{(basicInfo.cortexVol / 1000).toFixed(1)}<small>cm³</small></span>
                <span className="bm-label">{t.overview.metrics.cortexVol.name}</span>
              </div>
              <div className="basic-metric-item" onClick={() => handleBasicMetricClick('whiteVol', basicInfo.whiteVol / 1000)}>
                <MiniCircularProgress percentile={calculatePercentile(basicInfo.whiteVol / 1000, basicMetricNorms.whiteVol.mean, basicMetricNorms.whiteVol.sd)} />
                <span className="bm-value">{(basicInfo.whiteVol / 1000).toFixed(1)}<small>cm³</small></span>
                <span className="bm-label">{t.overview.metrics.whiteVol.name}</span>
              </div>
              <div className="basic-metric-item" onClick={() => handleBasicMetricClick('lhThickness', basicInfo.lhThickness)}>
                <MiniCircularProgress percentile={calculatePercentile(basicInfo.lhThickness, basicMetricNorms.lhThickness.mean, basicMetricNorms.lhThickness.sd)} />
                <span className="bm-value">{basicInfo.lhThickness.toFixed(2)}<small>mm</small></span>
                <span className="bm-label">{t.overview.metrics.lhThickness.name}</span>
              </div>
              <div className="basic-metric-item" onClick={() => handleBasicMetricClick('rhThickness', basicInfo.rhThickness)}>
                <MiniCircularProgress percentile={calculatePercentile(basicInfo.rhThickness, basicMetricNorms.rhThickness.mean, basicMetricNorms.rhThickness.sd)} />
                <span className="bm-value">{basicInfo.rhThickness.toFixed(2)}<small>mm</small></span>
                <span className="bm-label">{t.overview.metrics.rhThickness.name}</span>
              </div>
            </div>
          </section>
        )}

        {/* 认知指标 */}
        {analysis && (
          <section className="indices-section">
            <h2>🎯 {'认知能力指标'}</h2>
            <p className="section-hint">{'点击查看详情'}</p>
            <div className="indices-grid">
              {analysis.indices.map((index, i) => (
                <div key={i} className="index-card-clickable compact" onClick={() => handleIndexClick(index)}>
                  <div className="card-row">
                    <span className="card-name">{t.dkt.indexNames[index.name as keyof typeof t.dkt.indexNames] || index.name}</span>
                    <span className="card-value">{index.value.toFixed(2)}</span>
                    <span className="card-percentile">
                      P<strong>{index.percentile}</strong>
                    </span>
                    <span 
                      className="card-badge"
                      style={{ background: index.percentile >= 70 ? '#ff6b9d' : index.percentile >= 30 ? '#c9a0ff' : '#a0d4ff' }}
                    >
                      {index.interpretation}
                    </span>
                  </div>
                  <div className="card-bar">
                    <div 
                      className="card-bar-fill" 
                      style={{ 
                        width: `${index.percentile}%`,
                        background: `linear-gradient(90deg, #ff9ec7 0%, #c9a0ff ${index.percentile}%)`
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 特殊发现 */}
        {analysis && analysis.summary.specialFeatures.length > 0 && (
          <section className="special-section">
            <h2>{t.overview.specialFeatures || '✨ 特殊发现'}</h2>
            <div className="special-cards">
              {analysis.summary.specialFeatures.map((feature, i) => (
                <div key={i} className="special-card">
                  <span className="special-icon">💫</span>
                  <span className="special-text">{feature}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 建议 */}
        {analysis && analysis.summary.recommendations.length > 0 && (
          <section className="suggestions-section">
            <h2>{t.overview.recommendations || '💡 个性化建议'}</h2>
            <div className="suggestions-list">
              {analysis.summary.recommendations.map((rec, i) => (
                <div key={i} className="suggestion-item">
                  <span className="suggestion-icon">🌟</span>
                  <p>{rec}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 页脚 */}
        <footer className="report-footer">
          <p>{t.overview.disclaimer || '⚠️ 本报告仅供参考，不构成医学诊断。如有疑问请咨询专业医生。'}</p>
        </footer>
      </div>
    </div>
  )
}
