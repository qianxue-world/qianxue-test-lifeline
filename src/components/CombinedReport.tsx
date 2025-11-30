import { useState, useEffect, useCallback, useRef } from 'react'
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
] as const

// 根据文件名自动识别文件类型
function detectFileType(fileName: string): string | null {
  for (const ft of fileTypesConfig) {
    if (ft.pattern.test(fileName)) return ft.key
  }
  return null
}

// 从文件内容中提取 subjectname
function extractSubjectName(content: string): string | null {
  const match = content.match(/^#\s*subjectname\s+(.+)$/m)
  return match ? match[1].trim() : null
}

// 根据稀有度获取tooltip背景色
const getTooltipColor = (rarity: number) => {
  if (rarity <= 0.5) return 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)'
  if (rarity <= 1) return 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)'
  if (rarity <= 5) return 'linear-gradient(135deg, #ff6b9d 0%, #ff85b3 100%)'
  if (rarity <= 15) return 'linear-gradient(135deg, #c9a0ff 0%, #d4b0ff 100%)'
  if (rarity <= 30) return 'linear-gradient(135deg, #7dd3fc 0%, #a5e8ff 100%)'
  if (rarity <= 70) return 'linear-gradient(135deg, #ffc0cb 0%, #ffb6c1 100%)'
  return 'linear-gradient(135deg, #98fb98 0%, #b4eeb4 100%)'
}

// 物理标签云组件 - 统一管理所有标签的物理状态
interface TagData {
  icon: string
  label: string
  color: string
  tooltip: string
  rarity: number
  onClick: () => void
}

interface PhysicsTagCloudProps {
  tags: TagData[]
  containerWidth: number
  containerHeight: number
  explodeKey: number
  isClearing: boolean
}

interface TagState {
  x: number
  y: number
  vx: number
  vy: number
  targetX: number
  targetY: number
  opacity: number
  settled: boolean
}

function PhysicsTagCloud({ tags, containerWidth, containerHeight, explodeKey, isClearing }: PhysicsTagCloudProps) {
  const [tagStates, setTagStates] = useState<TagState[]>([])
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null)
  const animationRef = useRef<number>()
  const frameRef = useRef(0)
  
  const tagWidth = 110
  const tagHeight = 36
  
  useEffect(() => {
    if (containerWidth === 0 || containerHeight === 0) return
    
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    
    // 计算目标位置（不重叠，分布在整个区域）
    const calculateTargets = () => {
      const targets: { x: number; y: number }[] = []
      const padding = 15
      
      // 伪随机
      const seededRandom = (s: number) => {
        const x = Math.sin(s * 9999 + explodeKey * 777) * 10000
        return x - Math.floor(x)
      }
      
      for (let i = 0; i < tags.length; i++) {
        let bestX = 0, bestY = 0
        let found = false
        
        for (let attempt = 0; attempt < 80 && !found; attempt++) {
          const r1 = seededRandom(i * 1000 + attempt * 7)
          const r2 = seededRandom(i * 1000 + attempt * 13 + 500)
          
          // 在整个区域随机分布
          const x = padding + r1 * (containerWidth - tagWidth - padding * 2)
          const y = padding + 50 + r2 * (containerHeight - tagHeight - padding * 2 - 60)
          
          // 检查重叠 - 更大的间距要求
          let overlaps = false
          for (const t of targets) {
            if (Math.abs(x - t.x) < tagWidth + 25 && Math.abs(y - t.y) < tagHeight + 18) {
              overlaps = true
              break
            }
          }
          
          if (!overlaps) {
            bestX = x
            bestY = y
            found = true
          }
        }
        
        if (!found) {
          // 备用位置
          const angle = (i / tags.length) * Math.PI * 2
          const radius = Math.min(centerX, centerY) - 60
          bestX = centerX + Math.cos(angle) * radius - tagWidth/2
          bestY = centerY + Math.sin(angle) * radius - tagHeight/2
        }
        
        targets.push({ x: bestX, y: bestY })
      }
      
      return targets
    }
    
    const targets = calculateTargets()
    
    // 初始化标签状态
    const initialStates: TagState[] = tags.map((_, i) => {
      const angle = (i / tags.length) * Math.PI * 2 + (Math.random() - 0.5) * 1.5
      const speed = 15 + Math.random() * 12
      return {
        x: centerX - tagWidth/2,
        y: centerY - tagHeight/2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 8,
        targetX: targets[i].x,
        targetY: targets[i].y,
        opacity: 0,
        settled: false,
      }
    })
    
    setTagStates(initialStates)
    frameRef.current = 0
    
    // 物理参数 - 超快稳定
    const friction = 0.92 // 高摩擦力
    const bounce = 0.4
    const gravity = 0.4
    const explosionDuration = 15 // 爆炸期间帧数
    
    const animate = () => {
      frameRef.current++
      const frame = frameRef.current
      
      setTagStates(prev => {
        const newStates = prev.map((state, i) => {
          if (state.settled) return state
          
          // 几乎同时启动
          const startFrame = Math.floor(i * 0.5)
          if (frame < startFrame) {
            return { ...state, opacity: 0 }
          }
          
          const localFrame = frame - startFrame
          let { x, y, vx, vy, targetX, targetY, opacity } = state
          
          // 立即显示
          if (opacity < 1) opacity = Math.min(1, opacity + 0.25)
          
          // 重力
          vy += gravity
          
          // 超强吸引力 - 快速收敛
          const springStrength = Math.min(0.08, localFrame * 0.002)
          const dampening = 0.1 // 强阻尼
          vx += (targetX - x) * springStrength - vx * dampening
          vy += (targetY - y) * springStrength - vy * dampening
          
          // 摩擦力
          vx *= friction
          vy *= friction
          
          // 更新位置
          x += vx
          y += vy
          
          // 边界碰撞 - 更Q弹
          if (x < 0) { x = 0; vx = Math.abs(vx) * bounce }
          if (x > containerWidth - tagWidth) { x = containerWidth - tagWidth; vx = -Math.abs(vx) * bounce }
          if (y < 0) { y = 0; vy = Math.abs(vy) * bounce }
          if (y > containerHeight - tagHeight) { y = containerHeight - tagHeight; vy = -Math.abs(vy) * bounce }
          
          // 爆炸期间禁用标签间碰撞检测
          if (localFrame > explosionDuration) {
            // 标签间碰撞检测 - 更柔和的弹开
            for (let j = 0; j < prev.length; j++) {
              if (i === j) continue
              const other = prev[j]
              
              // 矩形碰撞检测 (AABB) - 更大的间距
              const minGapX = tagWidth + 25
              const minGapY = tagHeight + 18
              const overlapX = minGapX - Math.abs((x + tagWidth/2) - (other.x + tagWidth/2))
              const overlapY = minGapY - Math.abs((y + tagHeight/2) - (other.y + tagHeight/2))
              
              if (overlapX > 0 && overlapY > 0) {
                const dx = (x + tagWidth/2) - (other.x + tagWidth/2)
                const dy = (y + tagHeight/2) - (other.y + tagHeight/2)
                const dist = Math.sqrt(dx*dx + dy*dy) || 1
                
                // 柔和的弹开力 - 像弹簧一样
                const pushStrength = Math.min(overlapX, overlapY) * 0.15
                const nx = dx / dist
                const ny = dy / dist
                
                // 渐进式分离，不是瞬间弹开
                vx += nx * pushStrength
                vy += ny * pushStrength
                
                // 轻微位置调整
                x += nx * overlapX * 0.1
                y += ny * overlapY * 0.1
              }
            }
          }
          
          // 检查是否稳定
          const speed = Math.sqrt(vx*vx + vy*vy)
          
          // 检查重叠 - 使用更大的检测框
          let hasOverlap = false
          for (let j = 0; j < prev.length; j++) {
            if (i === j) continue
            const other = prev[j]
            const ox = (tagWidth + 20) - Math.abs((x + tagWidth/2) - (other.x + tagWidth/2))
            const oy = (tagHeight + 15) - Math.abs((y + tagHeight/2) - (other.y + tagHeight/2))
            if (ox > 0 && oy > 0) {
              hasOverlap = true
              break
            }
          }
          
          // 稳定条件 - 超快稳定
          if ((speed < 0.5 && !hasOverlap && localFrame > 20) || frame > 100) {
            // 直接使用当前位置作为最终位置，避免瞬移
            return { ...state, x, y, vx: 0, vy: 0, opacity: 1, settled: true }
          }
          
          return { ...state, x, y, vx, vy, opacity, settled: false }
        })
        
        return newStates
      })
      
      // 检查是否全部稳定
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [tags.length, containerWidth, containerHeight, explodeKey])
  
  return (
    <>
      {tagStates.map((state, i) => {
        const tag = tags[i]
        if (!tag) return null
        
        return (
          <span
            key={`${explodeKey}-${i}`}
            className={`laterality-tag bouncing ${state.settled ? 'settled' : ''} ${isClearing ? 'clearing' : ''}`}
            style={{
              background: tag.color,
              left: state.x,
              top: state.y,
              position: 'absolute',
              opacity: isClearing ? 0 : state.opacity,
              transition: state.settled ? 'left 0.4s ease-out, top 0.4s ease-out, opacity 0.3s' : 'none',
              animationDelay: isClearing ? `${i * 0.03}s` : undefined,
            }}
            onClick={tag.onClick}
            onMouseEnter={() => setTooltipIndex(i)}
            onMouseLeave={() => setTooltipIndex(null)}
          >
            <span className="tag-icon">{tag.icon}</span>
            <span className="tag-label">{tag.label}</span>
            <span
              className={`tag-tooltip ${tooltipIndex === i ? 'show' : ''}`}
              style={{ background: getTooltipColor(tag.rarity) }}
            >
              {tag.tooltip}
            </span>
          </span>
        )
      })}
    </>
  )
}



// 基础指标详情数据
const getBasicMetricsInfo = (t: any): Record<string, Omit<BasicMetric, 'value'>> => ({
  brainVol: {
    id: 'brainVol',
    name: t.overview.metrics.brainVol.name,
    unit: 'cm³',
    icon: '🧠',
    description: t.overview.metrics.brainVol.description,
    normalRange: t.overview.metrics.brainVol.normalRange,
    interpretation: t.overview.metrics.brainVol.interpretation,
    relatedFunctions: t.overview.metrics.brainVol.relatedFunctions,
    references: [
      'Pietschnig J, et al. (2015). Neuroscience & Biobehavioral Reviews.',
      'Rushton JP, Ankney CD. (2009). International Journal of Neuroscience.'
    ]
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
    references: [
      'Kanai R, Rees G. (2011). Nature Reviews Neuroscience.',
      'Zatorre RJ, et al. (2012). Nature Neuroscience.'
    ]
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
    references: [
      'Fields RD. (2008). Trends in Neurosciences.',
      'Johansen-Berg H. (2010). Current Opinion in Neurology.'
    ]
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
    references: ['Fischl B, Dale AM. (2000). PNAS.', 'Shaw P, et al. (2006). Nature.']
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
    references: ['Toga AW, Thompson PM. (2003). Nature Reviews Neuroscience.', 'Gazzaniga MS. (2000). Brain.']
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
  const [error, setError] = useState<string | null>(null)
  const [selectedBasicMetric, setSelectedBasicMetric] = useState<BasicMetric | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<IndexResult | null>(null)
  const [basicInfo, setBasicInfo] = useState<{
    eTIV: number; brainVol: number; cortexVol: number; whiteVol: number; lhThickness: number; rhThickness: number
  } | null>(null)
  const [pageTransition, setPageTransition] = useState<'in' | 'out' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [explodeKey, setExplodeKey] = useState(0)
  const [isInDetailPage, setIsInDetailPage] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const tagsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadData() }, [])
  
  // 计算容器尺寸
  useEffect(() => {
    const container = tagsContainerRef.current
    if (!container || !hasData) return
    
    const updateSize = () => {
      const width = container.offsetWidth
      const height = container.offsetHeight
      if (width > 0 && height > 0) {
        setContainerSize({ width, height })
      }
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [hasData])
  
  // 控制清除按钮显示：有数据且不在详情页时显示
  useEffect(() => {
    onShowClearButton?.(hasData && !isInDetailPage)
  }, [hasData, isInDetailPage, onShowClearButton])

  // 递归读取文件夹中的所有文件
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

  // 处理文件上传
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
    
    // 自动匹配并保存文件
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
      // 触发爆开动画
      loadData()
      setExplodeKey(prev => prev + 1)
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
    setError(null)
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
        const match = content.match(new RegExp(`# Measure[^,]*,\\s*${key}[^,]*,[^,]*,\\s*([\\d.]+)`))
        return match ? parseFloat(match[1]) : 0
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
      const result = runDKTAnalysis(lhData, rhData, t)
      setAnalysis(result)
      setHasData(true)
    } catch (err) {
      setError(t.overview.error)
      setHasData(false)
    }
    setLoading(false)
  }

  // 计算综合评分
  const calculateOverallScore = (): number => {
    if (!analysis) return 75
    const abilityIndices = [
      { name: 'Olfactory Function Index', weight: 0.08 },
      { name: 'Language Composite Index', weight: 0.15 },
      { name: 'Reading Fluency Index', weight: 0.12 },
      { name: 'Empathy Index', weight: 0.12 },
      { name: 'Executive Function Index', weight: 0.18 },
      { name: 'Spatial Processing Index', weight: 0.15 },
      { name: 'Fluid Intelligence Index (Structural)', weight: 0.20 },
    ]
    let totalWeight = 0, weightedSum = 0
    for (const { name, weight } of abilityIndices) {
      const index = analysis.indices.find(i => i.name === name)
      if (index) { weightedSum += index.percentile * weight; totalWeight += weight }
    }
    const dyslexiaIndex = analysis.indices.find(i => i.name === 'Dyslexia Structural Risk Index')
    if (dyslexiaIndex) { weightedSum += dyslexiaIndex.percentile * 0.10; totalWeight += 0.10 }
    if (totalWeight === 0) return 75
    const rawScore = weightedSum / totalWeight
    let finalScore: number
    if (rawScore >= 84) finalScore = 90 + (rawScore - 84) * (10 / 16)
    else if (rawScore >= 50) finalScore = 75 + (rawScore - 50) * (15 / 34)
    else if (rawScore >= 16) finalScore = 60 + (rawScore - 16) * (15 / 34)
    else finalScore = 40 + rawScore * (20 / 16)
    return Math.round(Math.min(100, Math.max(0, finalScore)))
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#ff6b9d'
    if (score >= 70) return '#c9a0ff'
    if (score >= 50) return '#a0d4ff'
    if (score >= 30) return '#ffb74d'
    return '#ff6b9d'
  }
  const handleBasicMetricClick = (metricId: string, value: number) => {
    const basicMetricsInfo = getBasicMetricsInfo(t)
    const info = basicMetricsInfo[metricId]
    if (info) {
      setPageTransition('out')
      setTimeout(() => {
        setSelectedBasicMetric({ ...info, value })
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
      // 每次返回时增加 explodeKey，让标签重新爆炸并获得新位置
      setExplodeKey(prev => prev + 1)
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
  const overallScore = calculateOverallScore()

  // 生成可爱俏皮的侧化标签
  const getCuteLateralityTag = (index: IndexResult, type: string) => {
    let icon = ''
    let label = ''
    let color = ''
    
    if (type === 'hand') {
      icon = '✋'
      const v = index.value
      if (v >= 0.84) { label = t.lateralityTags?.rightHanded || '右撇子'; color = '#ff6b9d' }
      else if (v >= 0.52) { label = t.lateralityTags?.mildRightHanded || '偏右撇子'; color = '#c9a0ff' }
      else if (v >= -0.52) { label = t.lateralityTags?.ambidextrous || '双手万能'; color = '#a0d4ff' }
      else if (v >= -0.84) { label = t.lateralityTags?.mildLeftHanded || '偏左撇子'; color = '#7986cb' }
      else { label = t.lateralityTags?.leftHanded || '左撇子'; color = '#5a8ac4' }
    } else if (type === 'eye') {
      icon = '👁️'
      const v = index.value
      if (v >= 0.8) { label = t.lateralityTags?.rightEyeDominant || '右主视眼'; color = '#ff6b9d' }
      else if (v >= 0.3) { label = t.lateralityTags?.mildRightEye || '偏右眼'; color = '#c9a0ff' }
      else if (v >= -0.3) { label = t.lateralityTags?.balancedEyes || '双眼均衡'; color = '#a0d4ff' }
      else if (v >= -0.8) { label = t.lateralityTags?.mildLeftEye || '偏左眼'; color = '#7986cb' }
      else { label = t.lateralityTags?.leftEyeDominant || '左主视眼'; color = '#5a8ac4' }
    } else if (type === 'nostril') {
      icon = '👃'
      const v = index.value
      if (v >= 0.7) { label = t.lateralityTags?.rightNostrilStar || '右鼻小达人'; color = '#ff6b9d' }
      else if (v >= 0.3) { label = t.lateralityTags?.mildRightNostril || '偏右鼻'; color = '#c9a0ff' }
      else if (v >= -0.3) { label = t.lateralityTags?.balancedNostrils || '双鼻自由人'; color = '#a0d4ff' }
      else if (v >= -0.7) { label = t.lateralityTags?.mildLeftNostril || '偏左鼻'; color = '#7986cb' }
      else { label = t.lateralityTags?.leftNostrilStar || '左鼻小达人'; color = '#5a8ac4' }
    } else if (type === 'lang') {
      icon = '💬'
      const v = index.value
      if (v >= 0.20) { label = t.lateralityTags?.leftBrainLanguage || '左脑语言家'; color = '#ff6b9d' }
      else if (v >= 0.05) { label = t.lateralityTags?.mildLeftLanguage || '偏左脑语言'; color = '#c9a0ff' }
      else if (v >= -0.05) { label = t.lateralityTags?.bilateralLanguage || '双脑语言'; color = '#a0d4ff' }
      else if (v >= -0.15) { label = t.lateralityTags?.mildRightLanguage || '偏右脑语言'; color = '#7986cb' }
      else { label = t.lateralityTags?.rightBrainLanguage || '右脑语言家'; color = '#5a8ac4' }
    } else if (type === 'spatial') {
      icon = '🗺️'
      const v = index.value
      if (v >= 0.40) { label = t.lateralityTags?.spatialMaster || '空间大师'; color = '#ff6b9d' }
      else if (v >= -0.20) { label = t.lateralityTags?.spatialBalanced || '空间均衡'; color = '#a0d4ff' }
      else { label = t.lateralityTags?.spatialAnalytical || '分析型空间'; color = '#5a8ac4' }
    } else if (type === 'emotion') {
      icon = '💖'
      const v = index.value
      if (v >= 0.40) { label = t.lateralityTags?.emotionSensitive || '情感敏锐'; color = '#ff6b9d' }
      else if (v >= -0.20) { label = t.lateralityTags?.emotionBalanced || '情感均衡'; color = '#a0d4ff' }
      else { label = t.lateralityTags?.emotionPositive || '阳光正能量'; color = '#ffb74d' }
    } else if (type === 'face') {
      icon = '😊'
      const v = index.value
      if (v >= 0.40) { label = t.lateralityTags?.faceRecognizer || '脸盲克星'; color = '#ff6b9d' }
      else if (v >= -0.20) { label = t.lateralityTags?.faceBalanced || '面孔均衡'; color = '#a0d4ff' }
      else { label = t.lateralityTags?.faceAnalytical || '面孔分析型'; color = '#5a8ac4' }
    } else if (type === 'music') {
      icon = '🎵'
      const v = index.value
      if (v >= 0.40) { label = t.lateralityTags?.musicTalent || '音乐小天才'; color = '#ff6b9d' }
      else if (v >= -0.20) { label = t.lateralityTags?.musicBalanced || '音乐均衡'; color = '#a0d4ff' }
      else { label = t.lateralityTags?.rhythmMaster || '节奏达人'; color = '#5a8ac4' }
    } else if (type === 'tom') {
      icon = '🧠'
      const v = index.value
      if (v >= 0.40) { label = t.lateralityTags?.mindReader || '读心小能手'; color = '#ff6b9d' }
      else if (v >= -0.20) { label = t.lateralityTags?.mindBalanced || '心智均衡'; color = '#a0d4ff' }
      else { label = t.lateralityTags?.mindLogical || '逻辑心智'; color = '#5a8ac4' }
    } else if (type === 'logic') {
      icon = '🧩'
      const v = index.value
      if (v <= -0.50) { label = t.lateralityTags?.logicGenius || '逻辑天才'; color = '#ff6b9d' }
      else if (v <= -0.20) { label = t.lateralityTags?.logicStrong || '逻辑达人'; color = '#c9a0ff' }
      else if (v <= 0.20) { label = t.lateralityTags?.logicBalanced || '逻辑均衡'; color = '#a0d4ff' }
      else { label = t.lateralityTags?.logicSpatial || '空间逻辑'; color = '#5a8ac4' }
    } else if (type === 'math') {
      icon = '🔢'
      const v = index.value
      if (v <= -0.50) { label = t.lateralityTags?.mathGenius || '数学天才'; color = '#ff6b9d' }
      else if (v <= -0.20) { label = t.lateralityTags?.mathStrong || '数学达人'; color = '#c9a0ff' }
      else if (v <= 0.20) { label = t.lateralityTags?.mathBalanced || '数学均衡'; color = '#a0d4ff' }
      else { label = t.lateralityTags?.mathGeometric || '几何数学'; color = '#5a8ac4' }
    }
    
    return { icon, label, color, index }
  }

  // 生成基础脑容量的可爱标签
  const getBrainVolumeTag = (type: string, value: number) => {
    let icon = ''
    let label = ''
    let color = ''
    
    if (type === 'brainVol') {
      icon = '🧠'
      // 成年人正常范围约 1000-1400 cm³
      if (value >= 1350) { label = t.brainTags?.brainVolLarge || '大脑袋聪明蛋'; color = '#ff6b9d' }
      else if (value >= 1200) { label = t.brainTags?.brainVolAbove || '脑容量优秀'; color = '#c9a0ff' }
      else if (value >= 1050) { label = t.brainTags?.brainVolNormal || '标准小脑瓜'; color = '#a0d4ff' }
      else { label = t.brainTags?.brainVolCompact || '精致小脑袋'; color = '#ffb74d' }
    } else if (type === 'cortexVol') {
      icon = '🔘'
      // 成年人正常范围约 450-650 cm³
      if (value >= 580) { label = t.brainTags?.cortexLarge || '灰质超丰富'; color = '#ff6b9d' }
      else if (value >= 520) { label = t.brainTags?.cortexAbove || '灰质优秀'; color = '#c9a0ff' }
      else if (value >= 450) { label = t.brainTags?.cortexNormal || '灰质达标'; color = '#a0d4ff' }
      else { label = t.brainTags?.cortexCompact || '精简高效型'; color = '#ffb74d' }
    } else if (type === 'whiteVol') {
      icon = '⚪'
      // 成年人正常范围约 400-550 cm³
      if (value >= 500) { label = t.brainTags?.whiteLarge || '神经高速公路'; color = '#ff6b9d' }
      else if (value >= 450) { label = t.brainTags?.whiteAbove || '白质优秀'; color = '#c9a0ff' }
      else if (value >= 380) { label = t.brainTags?.whiteNormal || '白质达标'; color = '#a0d4ff' }
      else { label = t.brainTags?.whiteCompact || '精简连接型'; color = '#ffb74d' }
    } else if (type === 'lhThickness') {
      icon = '🧩'
      // 成年人正常范围约 2.3-2.8 mm
      if (value >= 2.7) { label = t.brainTags?.thickLeft || '左脑超厚实'; color = '#ff6b9d' }
      else if (value >= 2.5) { label = t.brainTags?.thickLeftGood || '左脑优秀'; color = '#c9a0ff' }
      else if (value >= 2.3) { label = t.brainTags?.thickLeftNormal || '左脑达标'; color = '#a0d4ff' }
      else { label = t.brainTags?.thickLeftSlim || '左脑精简型'; color = '#ffb74d' }
    } else if (type === 'rhThickness') {
      icon = '🎨'
      if (value >= 2.7) { label = t.brainTags?.thickRight || '右脑超厚实'; color = '#ff6b9d' }
      else if (value >= 2.5) { label = t.brainTags?.thickRightGood || '右脑优秀'; color = '#c9a0ff' }
      else if (value >= 2.3) { label = t.brainTags?.thickRightNormal || '右脑达标'; color = '#a0d4ff' }
      else { label = t.brainTags?.thickRightSlim || '右脑精简型'; color = '#ffb74d' }
    }
    
    return { icon, label, color }
  }

  // 生成能力指标的可爱标签
  const getAbilityTag = (index: IndexResult) => {
    const p = index.percentile
    let icon = ''
    let label = ''
    let color = ''
    
    // 根据指标名称设置图标
    const iconMap: Record<string, string> = {
      'Olfactory Function Index': '👃',
      'Language Composite Index': '💬',
      'Reading Fluency Index': '📖',
      'Dyslexia Structural Risk Index': '📚',
      'Empathy Index': '💖',
      'Executive Function Index': '🎯',
      'Spatial Processing Index': '🗺️',
      'Fluid Intelligence Index (Structural)': '✨',
    }
    icon = iconMap[index.name] || '🌟'
    
    // 根据百分位生成可爱正面的标签
    if (index.name === 'Olfactory Function Index') {
      if (p >= 84) { label = t.abilityTags?.smellSuperStar || '嗅觉小超人'; color = '#ff6b9d' }
      else if (p >= 70) { label = t.abilityTags?.smellGood || '嗅觉灵敏'; color = '#c9a0ff' }
      else if (p >= 30) { label = t.abilityTags?.smellNormal || '嗅觉正常'; color = '#a0d4ff' }
      else { label = t.abilityTags?.smellDeveloping || '嗅觉成长中'; color = '#ffb74d' }
    } else if (index.name === 'Language Composite Index') {
      if (p >= 84) { label = t.abilityTags?.langGenius || '语言小天才'; color = '#ff6b9d' }
      else if (p >= 70) { label = t.abilityTags?.langGood || '能说会道'; color = '#c9a0ff' }
      else if (p >= 30) { label = t.abilityTags?.langNormal || '语言达标'; color = '#a0d4ff' }
      else { label = t.abilityTags?.langDeveloping || '语言潜力股'; color = '#ffb74d' }
    } else if (index.name === 'Reading Fluency Index') {
      if (p >= 84) { label = t.abilityTags?.readingMaster || '阅读小达人'; color = '#ff6b9d' }
      else if (p >= 70) { label = t.abilityTags?.readingGood || '爱读书'; color = '#c9a0ff' }
      else if (p >= 30) { label = t.abilityTags?.readingNormal || '阅读达标'; color = '#a0d4ff' }
      else { label = t.abilityTags?.readingDeveloping || '阅读潜力股'; color = '#ffb74d' }
    } else if (index.name === 'Dyslexia Structural Risk Index') {
      // 这个指标越高越好（风险越低）
      if (p >= 70) { label = t.abilityTags?.dyslexiaLow || '阅读无忧'; color = '#ff6b9d' }
      else if (p >= 50) { label = t.abilityTags?.dyslexiaNormal || '阅读正常'; color = '#a0d4ff' }
      else if (p >= 30) { label = t.abilityTags?.dyslexiaWatch || '多读多练'; color = '#ffb74d' }
      else { label = t.abilityTags?.dyslexiaSupport || '阅读小助手'; color = '#ffa07a' }
    } else if (index.name === 'Empathy Index') {
      if (p >= 84) { label = t.abilityTags?.empathyStar || '共情小天使'; color = '#ff6b9d' }
      else if (p >= 70) { label = t.abilityTags?.empathyGood || '暖心宝贝'; color = '#c9a0ff' }
      else if (p >= 30) { label = t.abilityTags?.empathyNormal || '共情达标'; color = '#a0d4ff' }
      else { label = t.abilityTags?.empathyDeveloping || '理性小达人'; color = '#ffb74d' }
    } else if (index.name === 'Executive Function Index') {
      if (p >= 84) { label = t.abilityTags?.execStar || '执行力超强'; color = '#ff6b9d' }
      else if (p >= 70) { label = t.abilityTags?.execGood || '行动派'; color = '#c9a0ff' }
      else if (p >= 30) { label = t.abilityTags?.execNormal || '执行力达标'; color = '#a0d4ff' }
      else { label = t.abilityTags?.execDeveloping || '创意自由型'; color = '#ffb74d' }
    } else if (index.name === 'Spatial Processing Index') {
      if (p >= 84) { label = t.abilityTags?.spatialStar || '空间小达人'; color = '#ff6b9d' }
      else if (p >= 70) { label = t.abilityTags?.spatialGood || '方向感强'; color = '#c9a0ff' }
      else if (p >= 30) { label = t.abilityTags?.spatialNormal || '空间达标'; color = '#a0d4ff' }
      else { label = t.abilityTags?.spatialDeveloping || '语言优先型'; color = '#ffb74d' }
    } else if (index.name === 'Fluid Intelligence Index (Structural)') {
      if (p >= 84) { label = t.abilityTags?.iqStar || '聪明小脑瓜'; color = '#ff6b9d' }
      else if (p >= 70) { label = t.abilityTags?.iqGood || '思维敏捷'; color = '#c9a0ff' }
      else if (p >= 30) { label = t.abilityTags?.iqNormal || '智力达标'; color = '#a0d4ff' }
      else { label = t.abilityTags?.iqDeveloping || '潜力无限'; color = '#ffb74d' }
    }
    
    return { icon, label, color, index }
  }

  // 生成稀有度夸夸文字
  const getRarityTooltip = (rarity: number) => {
    if (rarity <= 0.5) return t.rarityTooltip?.mythic?.replace('{percent}', '0.5') || '🔥 神话级！只有0.5%的人拥有！'
    if (rarity <= 1) return t.rarityTooltip?.legendary?.replace('{percent}', '1') || '👑 传说级！只有1%的人拥有！'
    if (rarity <= 5) return t.rarityTooltip?.epic?.replace('{percent}', String(Math.round(rarity))) || `💎 史诗级！只有${Math.round(rarity)}%的人拥有！`
    if (rarity <= 15) return t.rarityTooltip?.rare?.replace('{percent}', String(Math.round(rarity))) || `💜 稀有级！只有${Math.round(rarity)}%的人拥有！`
    if (rarity <= 30) return t.rarityTooltip?.uncommon?.replace('{percent}', String(Math.round(rarity))) || `💙 优秀级！前${Math.round(rarity)}%的人拥有！`
    if (rarity <= 70) return t.rarityTooltip?.common || '✨ 你的独特标签～'
    return t.rarityTooltip?.growing || '🌱 成长中，潜力无限！'
  }

  // 没有数据时显示拖拽上传区域
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

  return (
    <div className={`page-wrapper ${pageTransition === 'in' ? 'fade-in' : pageTransition === 'out' ? 'fade-out' : ''}`}>
    <div className="combined-report">

      {/* 标签云区域 */}
      <section 
        className="hero-section"
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* 弹幕层 */}
        {analysis && (analysis.summary.specialFeatures.length > 0 || analysis.summary.recommendations.length > 0) && (
          <div className="danmaku-layer">
            {(() => {
              const allMessages = [
                ...analysis.summary.specialFeatures.map(f => f + '~~~'),
                ...analysis.summary.recommendations.map(r => r + '~~~')
              ]
              const pinkColors = ['#ff6b9d', '#ff85a2', '#ffa0b4', '#c9a0ff', '#d4b0ff', '#e8c0ff', '#ffb6c1', '#ff69b4', '#ff1493', '#db7093']
              return allMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className="danmaku-item"
                  style={{
                    animationDelay: `${i * 2.5}s`,
                    top: `${(i % 6) * 15 + 5}%`,
                    color: pinkColors[i % pinkColors.length],
                  }}
                >
                  {msg}
                </div>
              ))
            })()}
          </div>
        )}
        
        {/* 标签云 - 物理弹跳效果 */}
        {basicInfo && analysis && (
          <div 
            ref={tagsContainerRef}
            className={`tags-cloud ${isClearing ? 'clearing' : ''}`}
          >
            {(() => {
              // 稀有度颜色映射 - 7个等级
              const RARITY_COLORS = {
                mythic: '#ff4500',     // 橙红色 - 神话级 (前0.5%)
                legendary: '#ffd700',  // 金色 - 传说级 (前1%)
                epic: '#ff6b9d',       // 粉色 - 史诗级 (前5%)
                rare: '#c9a0ff',       // 紫色 - 稀有级 (前15%)
                uncommon: '#7dd3fc',   // 天蓝色 - 优秀级 (前30%)
                common: '#a0d4ff',     // 蓝色 - 普通级 (30-70%)
                growing: '#90EE90',    // 浅绿色 - 成长中 (后30%)
              }
              
              type TagItem = {
                icon: string
                label: string
                color: string
                rarity: number // 0-100, 越小越稀有
                onClick: () => void
              }
              
              const allTags: TagItem[] = []
              
              // 脑容量标签 - 计算稀有度
              const brainVolValue = basicInfo.brainVol / 1000
              const cortexVolValue = basicInfo.cortexVol / 1000
              const whiteVolValue = basicInfo.whiteVol / 1000
              
              // 脑容量稀有度计算 - 更细分
              const getBrainRarity = (value: number, type: string) => {
                if (type === 'brainVol') {
                  if (value >= 1450) return 0.5
                  if (value >= 1400) return 2
                  if (value >= 1350) return 5
                  if (value >= 1300) return 12
                  if (value >= 1200) return 25
                  if (value >= 1100) return 45
                  if (value >= 1000) return 65
                  return 85
                } else if (type === 'cortexVol') {
                  if (value >= 650) return 0.5
                  if (value >= 620) return 2
                  if (value >= 580) return 5
                  if (value >= 550) return 12
                  if (value >= 500) return 25
                  if (value >= 450) return 45
                  return 75
                } else if (type === 'whiteVol') {
                  if (value >= 560) return 0.5
                  if (value >= 530) return 2
                  if (value >= 500) return 5
                  if (value >= 470) return 12
                  if (value >= 430) return 25
                  if (value >= 380) return 45
                  return 75
                } else if (type === 'lhThickness' || type === 'rhThickness') {
                  if (value >= 2.9) return 0.5
                  if (value >= 2.8) return 2
                  if (value >= 2.7) return 5
                  if (value >= 2.6) return 12
                  if (value >= 2.5) return 25
                  if (value >= 2.4) return 45
                  if (value >= 2.3) return 65
                  return 85
                }
                return 50
              }
              
              const getRarityColor = (rarity: number) => {
                if (rarity <= 0.5) return RARITY_COLORS.mythic
                if (rarity <= 1) return RARITY_COLORS.legendary
                if (rarity <= 5) return RARITY_COLORS.epic
                if (rarity <= 15) return RARITY_COLORS.rare
                if (rarity <= 30) return RARITY_COLORS.uncommon
                if (rarity <= 70) return RARITY_COLORS.common
                return RARITY_COLORS.growing
              }
              
              // 添加脑容量标签
              const brainVolRarity = getBrainRarity(brainVolValue, 'brainVol')
              const brainVolTag = getBrainVolumeTag('brainVol', brainVolValue)
              allTags.push({
                ...brainVolTag,
                color: getRarityColor(brainVolRarity),
                rarity: brainVolRarity,
                onClick: () => handleBasicMetricClick('brainVol', brainVolValue)
              })
              
              const cortexRarity = getBrainRarity(cortexVolValue, 'cortexVol')
              const cortexTag = getBrainVolumeTag('cortexVol', cortexVolValue)
              allTags.push({
                ...cortexTag,
                color: getRarityColor(cortexRarity),
                rarity: cortexRarity,
                onClick: () => handleBasicMetricClick('cortexVol', cortexVolValue)
              })
              
              const whiteRarity = getBrainRarity(whiteVolValue, 'whiteVol')
              const whiteTag = getBrainVolumeTag('whiteVol', whiteVolValue)
              allTags.push({
                ...whiteTag,
                color: getRarityColor(whiteRarity),
                rarity: whiteRarity,
                onClick: () => handleBasicMetricClick('whiteVol', whiteVolValue)
              })
              
              const lhRarity = getBrainRarity(basicInfo.lhThickness, 'lhThickness')
              const lhTag = getBrainVolumeTag('lhThickness', basicInfo.lhThickness)
              allTags.push({
                ...lhTag,
                color: getRarityColor(lhRarity),
                rarity: lhRarity,
                onClick: () => handleBasicMetricClick('lhThickness', basicInfo.lhThickness)
              })
              
              const rhRarity = getBrainRarity(basicInfo.rhThickness, 'rhThickness')
              const rhTag = getBrainVolumeTag('rhThickness', basicInfo.rhThickness)
              allTags.push({
                ...rhTag,
                color: getRarityColor(rhRarity),
                rarity: rhRarity,
                onClick: () => handleBasicMetricClick('rhThickness', basicInfo.rhThickness)
              })
              
              // 侧化标签稀有度计算 - 更细分
              const getLateralityRarity = (index: IndexResult, type: string) => {
                const v = index.value
                if (type === 'hand') {
                  if (v <= -1.28) return 0.5  // 极度左撇子神话级
                  if (v <= -0.84) return 3    // 强左撇子史诗级
                  if (v <= -0.52) return 12   // 左撇子稀有级
                  if (v >= 1.28) return 8     // 极度右撇子
                  if (v >= 0.84) return 18    // 强右撇子
                  return 45                    // 双手万能
                } else if (type === 'eye') {
                  if (Math.abs(v) >= 1.8) return 1
                  if (Math.abs(v) >= 1.5) return 4
                  if (Math.abs(v) >= 1.0) return 10
                  if (Math.abs(v) >= 0.8) return 18
                  if (Math.abs(v) >= 0.5) return 28
                  return 45
                } else if (type === 'nostril') {
                  if (Math.abs(v) >= 1.0) return 2
                  if (Math.abs(v) >= 0.7) return 8
                  if (Math.abs(v) >= 0.5) return 18
                  if (Math.abs(v) >= 0.3) return 28
                  return 45
                } else if (type === 'lang') {
                  if (v <= -0.20) return 0.3  // 右脑语言神话级
                  if (v <= -0.15) return 0.8  // 右脑语言传说级
                  if (v <= -0.05) return 3    // 双脑语言史诗级
                  if (v >= 0.25) return 8     // 强左脑语言
                  if (v >= 0.20) return 15    // 典型左脑语言
                  return 35
                } else if (type === 'spatial') {
                  if (v >= 0.80) return 2
                  if (v >= 0.60) return 6
                  if (v >= 0.40) return 12
                  if (v >= 0.20) return 22
                  if (v <= -0.40) return 8
                  return 40
                } else if (type === 'emotion') {
                  if (v >= 0.90) return 2
                  if (v >= 0.60) return 6
                  if (v >= 0.40) return 12
                  if (v <= -0.50) return 5   // 阳光正能量也稀有
                  if (v <= -0.30) return 15
                  return 40
                } else if (type === 'face') {
                  if (v >= 1.00) return 0.5
                  if (v >= 0.80) return 2
                  if (v >= 0.60) return 5
                  if (v >= 0.40) return 12
                  if (v >= 0.20) return 22
                  return 40
                } else if (type === 'music') {
                  if (v >= 1.20) return 0.3  // 音乐天才神话级
                  if (v >= 0.90) return 0.8
                  if (v >= 0.70) return 2
                  if (v >= 0.50) return 6
                  if (v >= 0.40) return 12
                  if (v <= -0.50) return 8   // 节奏达人也不错
                  return 40
                } else if (type === 'tom') {
                  if (v >= 0.80) return 2    // 读心小能手
                  if (v >= 0.60) return 6
                  if (v >= 0.40) return 12
                  if (v >= 0.20) return 22
                  if (v <= -0.40) return 10  // 逻辑心智
                  return 40
                } else if (type === 'logic') {
                  if (v <= -1.00) return 0.3
                  if (v <= -0.80) return 0.8
                  if (v <= -0.60) return 3
                  if (v <= -0.50) return 6
                  if (v <= -0.30) return 15
                  if (v >= 0.50) return 8    // 空间逻辑
                  return 40
                } else if (type === 'math') {
                  if (v <= -1.00) return 0.3
                  if (v <= -0.90) return 0.8
                  if (v <= -0.70) return 2
                  if (v <= -0.50) return 5
                  if (v <= -0.30) return 12
                  if (v >= 0.40) return 10   // 几何数学
                  return 40
                }
                return 45
              }
              
              // 添加侧化标签
              const lateralityTypes = ['hand', 'eye', 'nostril', 'lang', 'spatial', 'emotion', 'face', 'music', 'tom', 'logic', 'math']
              lateralityTypes.forEach((type, i) => {
                const tag = getCuteLateralityTag(analysis.indices[i], type)
                const rarity = getLateralityRarity(analysis.indices[i], type)
                allTags.push({
                  ...tag,
                  color: getRarityColor(rarity),
                  rarity,
                  onClick: () => handleIndexClick(tag.index)
                })
              })
              
              // 能力标签稀有度 - 更细分的计算
              const abilityIndices = [11, 12, 13, 14, 15, 16, 17, 18]
              abilityIndices.forEach(i => {
                const tag = getAbilityTag(analysis.indices[i])
                const p = analysis.indices[i].percentile
                // 特殊处理阅读障碍风险指标
                let rarity: number
                if (analysis.indices[i].name === 'Dyslexia Structural Risk Index') {
                  // 风险低是好的，所以高百分位是好的
                  if (p >= 95) rarity = 2
                  else if (p >= 85) rarity = 8
                  else if (p >= 70) rarity = 18
                  else if (p >= 50) rarity = 40
                  else if (p >= 30) rarity = 60
                  else rarity = 80
                } else {
                  // 其他能力指标，高百分位越稀有
                  if (p >= 99) rarity = 0.5
                  else if (p >= 97) rarity = 1
                  else if (p >= 93) rarity = 3
                  else if (p >= 84) rarity = 8
                  else if (p >= 70) rarity = 18
                  else if (p >= 50) rarity = 35
                  else if (p >= 30) rarity = 55
                  else rarity = 75
                }
                allTags.push({
                  ...tag,
                  color: getRarityColor(rarity),
                  rarity,
                  onClick: () => handleIndexClick(tag.index)
                })
              })
              
              // 使用物理标签云（带碰撞检测）
              if (containerSize.width === 0) return null
              
              const tagDataList: TagData[] = allTags.map(tag => ({
                icon: tag.icon,
                label: tag.label,
                color: tag.color,
                tooltip: getRarityTooltip(tag.rarity),
                rarity: tag.rarity,
                onClick: tag.onClick,
              }))
              
              return (
                <PhysicsTagCloud
                  tags={tagDataList}
                  containerWidth={containerSize.width}
                  containerHeight={containerSize.height}
                  explodeKey={explodeKey}
                  isClearing={isClearing}
                />
              )
            })()}
          </div>
        )}
      </section>



    </div>
    </div>
  )
}
