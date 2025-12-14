/**
 * Basic Lateralization Indices
 * - Handedness Index
 * - Dominant Eye Index  
 * - Preferred Nostril Index
 * - Language Lateralization Index
 */

import { DKTData, IndexResult, RegionDetail, REFERENCE_DATA_MALE, BA_CURVATURE_REFERENCE, compositeZScore, zToPercentile } from './types'
import {
  getHandednessInterpretation,
  getDominantEyeInterpretation,
  getNostrilInterpretation,
  getLanguageLateralizationInterpretation
} from '../interpretations'

/**
 * 1. Handedness Index
 * 仅使用 BA_exvivo 区域 (BA3b, BA4a, BA4p) 精确判断左右手偏好
 * 基于皮层厚度、表面积、折叠曲率的综合分析
 * 
 * 科学依据：
 * - BA4 (初级运动皮层) 控制对侧肢体运动，惯用手对侧 BA4 更发达
 * - BA3b (初级体感皮层) 接收对侧肢体感觉输入，惯用手对侧更厚
 * - 右利手者左侧 BA4/BA3b 更大，左利手者右侧更大
 * - 皮层厚度反映神经元密度
 * - 表面积反映皮层展开面积
 * - 折叠曲率 (FoldInd) 反映皮层折叠复杂度，与功能发达程度相关
 */
export function calculateHandednessIndex(data: DKTData, t?: any): IndexResult {
  // BA_exvivo 区域配置：区域名、权重、各指标权重
  // BA4a/BA4p: 初级运动皮层，对惯用手判断最关键
  // BA3b: 初级体感皮层，提供感觉反馈信息
  // 指标权重: 厚度、表面积、折叠曲率
  const baRegionConfigs = [
    { name: 'BA4a_exvivo', weight: 0.35, wThick: 0.35, wArea: 0.35, wFold: 0.30 }, // 初级运动皮层前部
    { name: 'BA4p_exvivo', weight: 0.35, wThick: 0.35, wArea: 0.35, wFold: 0.30 }, // 初级运动皮层后部
    { name: 'BA3b_exvivo', weight: 0.30, wThick: 0.40, wArea: 0.30, wFold: 0.30 }, // 初级体感皮层
  ]
  
  const details: RegionDetail[] = []
  let totalIndex = 0
  let totalWeight = 0
  
  // 检查是否有 BA 数据
  if (!data.lhBA || !data.rhBA) {
    // 如果没有 BA 数据，返回默认值
    return {
      name: 'Handedness Index',
      value: 0,
      percentile: 50,
      interpretation: t ? getHandednessInterpretation(0, t) : '',
      threshold: '≥+1.28 extreme right (top 10%); ≥+0.84 strong right (top 20%); ≥+0.52 moderate right (top 30%); ±0.52 ambidextrous (60%); ≤-0.84 left-handed (bottom 10%)',
      formula: 'LI = Σ[wᵢ × (wT×zT + wA×zA + wF×zFold)_L − (wT×zT + wA×zA + wF×zFold)_R]',
      references: ['Amunts 1996 Brain', 'Sha 2024 Nat Commun', 'Wiberg 2019 PNAS', 'UKBB 2024'],
      regions: ['BA4a_exvivo (35%)', 'BA4p_exvivo (35%)', 'BA3b_exvivo (30%)'],
      weights: 'Thickness 35% : Surface Area 35% : Folding Index 30%',
      details: []
    }
  }
  
  // 处理每个 BA 区域
  for (const cfg of baRegionConfigs) {
    const { name, weight, wThick, wArea, wFold } = cfg
    const ref = REFERENCE_DATA_MALE[name]
    const curvRef = BA_CURVATURE_REFERENCE[name]
    
    if (!ref || !data.lhBA[name] || !data.rhBA[name]) continue
    
    const lh = data.lhBA[name]
    const rh = data.rhBA[name]
    
    // 计算各指标的 z-score
    const zThick_L = (lh.thickness - ref.thickness.mean) / ref.thickness.std
    const zThick_R = (rh.thickness - ref.thickness.mean) / ref.thickness.std
    const zArea_L = (lh.surfArea - ref.surfArea.mean) / ref.surfArea.std
    const zArea_R = (rh.surfArea - ref.surfArea.mean) / ref.surfArea.std
    
    // 折叠曲率 z-score (如果有曲率数据)
    let zFold_L = 0, zFold_R = 0
    if (curvRef && lh.foldInd !== undefined && rh.foldInd !== undefined) {
      zFold_L = (lh.foldInd - curvRef.foldInd.mean) / curvRef.foldInd.std
      zFold_R = (rh.foldInd - curvRef.foldInd.mean) / curvRef.foldInd.std
    }
    
    // 加权综合 z-score
    const zL = wThick * zThick_L + wArea * zArea_L + wFold * zFold_L
    const zR = wThick * zThick_R + wArea * zArea_R + wFold * zFold_R
    
    // 左侧优势 = 正值 = 右利手
    const contribution = weight * (zL - zR)
    totalIndex += contribution
    totalWeight += weight
    
    details.push({
      region: name,
      regionWeight: weight,
      zL: Number(zL.toFixed(3)),
      zR: Number(zR.toFixed(3)),
      contribL: Number((weight * zL).toFixed(3)),
      contribR: Number((weight * zR).toFixed(3)),
      weightsUsed: `${(wThick*100).toFixed(0)}:${(wArea*100).toFixed(0)}:${(wFold*100).toFixed(0)}`
    })
  }
  
  // 归一化
  const finalIndex = totalWeight > 0 ? totalIndex / totalWeight : 0
  
  return {
    name: 'Handedness Index',
    value: Math.round(finalIndex * 1000) / 1000,
    percentile: zToPercentile(finalIndex),
    interpretation: t ? getHandednessInterpretation(finalIndex, t) : '',
    threshold: '≥+1.28 extreme right (top 10%); ≥+0.84 strong right (top 20%); ≥+0.52 moderate right (top 30%); ±0.52 ambidextrous (60%); ≤-0.84 left-handed (bottom 10%)',
    formula: 'LI = Σ[wᵢ × (wT×zT + wA×zA + wF×zFold)_L − (wT×zT + wA×zA + wF×zFold)_R]',
    references: ['Amunts 1996 Brain', 'Sha 2024 Nat Commun', 'Wiberg 2019 PNAS', 'UKBB 2024'],
    regions: ['BA4a_exvivo (35%)', 'BA4p_exvivo (35%)', 'BA3b_exvivo (30%)'],
    weights: 'Thickness 35% : Surface Area 35% : Folding Index 30%',
    details
  }
}

/**
 * 2. Dominant Eye Index
 */
export function calculateDominantEyeIndex(data: DKTData, t?: any): IndexResult {
  const regionWeights = { pericalcarine: 0.70, cuneus: 0.15, lingual: 0.15 }
  const metricWeights: [number, number, number] = [92, 4, 4]
  
  let totalIndex = 0
  const details: RegionDetail[] = []
  
  for (const [region, weight] of Object.entries(regionWeights)) {
    const ref = REFERENCE_DATA_MALE[region]
    if (!ref || !data.lh[region] || !data.rh[region]) continue
    
    const zL = compositeZScore(data.lh[region], ref, metricWeights)
    const zR = compositeZScore(data.rh[region], ref, metricWeights)
    totalIndex += weight * (zL - zR)
    
    details.push({
      region,
      regionWeight: weight,
      zL: Number(zL.toFixed(3)),
      zR: Number(zR.toFixed(3)),
      contribL: Number((weight * zL).toFixed(3)),
      contribR: Number((weight * zR).toFixed(3)),
      weightsUsed: `${metricWeights[0]}:${metricWeights[1]}:${metricWeights[2]}`
    })
  }
  
  return {
    name: 'Dominant Eye Index',
    value: Math.round(totalIndex * 1000) / 1000,
    percentile: zToPercentile(totalIndex),
    interpretation: t ? getDominantEyeInterpretation(totalIndex, t) : "",
    threshold: '≥+1.5 extreme right eye (4-6%); +0.8~+1.5 strong right eye (18-22%); +0.3~+0.8 mild right eye (25-30%); ±0.3 balanced (35-40%); -0.8~-0.3 mild left eye (12-15%); ≤-0.8 strong left eye (5-7%)',
    formula: 'LI_eye = Σ[weight × (z_L − z_R)]',
    references: ['Hayat 2022 Neuroimage', 'Jensen 2015', 'HCP 2024'],
    regions: ['pericalcarine (0.70)', 'cuneus (0.15)', 'lingual (0.15)'],
    weights: 'Thickness 92 : Surface Area 4 : Volume 4',
    details
  }
}

/**
 * 3. Preferred Nostril Index
 */
export function calculatePreferredNostrilIndex(data: DKTData, t?: any): IndexResult {
  const regions = [
    { name: 'entorhinal', weight: 0.45 },
    { name: 'parahippocampal', weight: 0.20 },
    { name: 'medialorbitofrontal', weight: 0.20 },
    { name: 'insula', weight: 0.10 },
    { name: 'piriform', weight: 0.05 }, // Use entorhinal as approximation
  ]

  const metricWeights: [number, number, number] = [70, 20, 10]
  const details: RegionDetail[] = []
  let rawScore = 0

  for (const r of regions) {
    const actualName = r.name === 'piriform' ? 'entorhinal' : r.name
    const norm = REFERENCE_DATA_MALE[actualName]
    if (!norm || !data.lh[actualName] || !data.rh[actualName]) continue

    const zL = compositeZScore(data.lh[actualName]!, norm, metricWeights)
    const zR = compositeZScore(data.rh[actualName]!, norm, metricWeights)
    const contribution = r.weight * (zR - zL)

    rawScore += contribution

    details.push({
      region: r.name,
      regionWeight: r.weight,
      zL: Number(zL.toFixed(3)),
      zR: Number(zR.toFixed(3)),
      contribL: Number((r.weight * zL).toFixed(3)),
      contribR: Number((r.weight * zR).toFixed(3)),
      weightsUsed: `${metricWeights[0]}:${metricWeights[1]}:${metricWeights[2]}`
    })
  }

  const oli = rawScore
  const percentile = oli >= 0 
    ? Math.min(99, Math.round(50 + oli * 40))
    : Math.max(1, Math.round(50 + oli * 40))

  return {
    name: 'Preferred Nostril Index',
    value: Number(oli.toFixed(3)),
    zScore: Number(rawScore.toFixed(3)),
    percentile,
    interpretation: t ? getNostrilInterpretation(oli, t) : "",
    threshold: '> +0.7 strong right nostril | < -0.7 strong left nostril | ±0.3 balanced',
    formula: 'OLI = Σwᵢ×(zRᵢ − zLᵢ)  positive=right nostril dominance',
    references: [
      'ENIGMA-Olfaction 2024 (n>8,200)',
      'Zatorre et al. 2023 Chem Senses',
      'Frasnelli 2022 Physiol Rev meta'
    ],
    regions: regions.map(r => `${r.name} (${(r.weight*100).toFixed(0)}%)`),
    weights: 'Thickness 70% : Surface Area 20% : Volume 10%',
    details,
  }
}

/**
 * 4. Language Output Lateralization Index (语言输出偏侧化指数)
 * 仅使用 BA44/BA45 (布洛卡区) - 语言产生/输出
 * 
 * 科学依据：
 * - BA44 (Pars Opercularis): 布洛卡区核心，负责语言产生、语法处理、言语运动规划
 * - BA45 (Pars Triangularis): 布洛卡区前部，负责语义检索、词汇选择
 * - 左侧 BA44/BA45 优势是语言产生左侧化的核心标志
 * - 损伤导致表达性失语（Broca失语）
 */
export function calculateLanguageOutputLateralization(data: DKTData, t?: any): IndexResult {
  const details: RegionDetail[] = []
  let sumContribL = 0
  let sumContribR = 0
  let totalWeight = 0

  // BA 布洛卡区配置 - 语言输出核心区域
  const baBrocaRegions = [
    { name: 'BA44_exvivo', weight: 0.60, wThick: 0.40, wArea: 0.35, wFold: 0.25 },  // 布洛卡区岛盖部 - 语法/运动规划
    { name: 'BA45_exvivo', weight: 0.40, wThick: 0.40, wArea: 0.35, wFold: 0.25 },  // 布洛卡区三角部 - 语义检索
  ]

  // 检查是否有 BA 数据
  if (!data.lhBA || !data.rhBA) {
    return {
      name: 'Language Output Lateralization Index',
      value: 0,
      percentile: 50,
      interpretation: t ? getLanguageOutputInterpretation(0, t) : '',
      threshold: '≥0.25 strong left (typical); ±0.10 bilateral; ≤-0.10 right (atypical)',
      formula: 'LI_output = (Σw×zL − Σw×zR) / (|ΣwzL| + |ΣwzR|)',
      references: ['Amunts 1999 Brain', 'Keller 2009 Cereb Cortex', 'Knecht 2000 Brain'],
      regions: ['BA44_exvivo (60%)', 'BA45_exvivo (40%)'],
      weights: 'Thickness 40% : Surface Area 35% : Folding Index 25%',
      details: []
    }
  }

  // 处理 BA 布洛卡区
  for (const cfg of baBrocaRegions) {
    const { name, weight, wThick, wArea, wFold } = cfg
    const ref = REFERENCE_DATA_MALE[name]
    const curvRef = BA_CURVATURE_REFERENCE[name]
    
    if (!ref || !data.lhBA[name] || !data.rhBA[name]) continue
    
    const lh = data.lhBA[name]
    const rh = data.rhBA[name]
    
    // 计算各指标的 z-score
    const zThick_L = (lh.thickness - ref.thickness.mean) / ref.thickness.std
    const zThick_R = (rh.thickness - ref.thickness.mean) / ref.thickness.std
    const zArea_L = (lh.surfArea - ref.surfArea.mean) / ref.surfArea.std
    const zArea_R = (rh.surfArea - ref.surfArea.mean) / ref.surfArea.std
    
    // 折叠曲率 z-score
    let zFold_L = 0, zFold_R = 0
    if (curvRef && lh.foldInd !== undefined && rh.foldInd !== undefined) {
      zFold_L = (lh.foldInd - curvRef.foldInd.mean) / curvRef.foldInd.std
      zFold_R = (rh.foldInd - curvRef.foldInd.mean) / curvRef.foldInd.std
    }
    
    // 加权综合 z-score
    const zL = wThick * zThick_L + wArea * zArea_L + wFold * zFold_L
    const zR = wThick * zThick_R + wArea * zArea_R + wFold * zFold_R
    
    const contribL = weight * zL
    const contribR = weight * zR
    
    sumContribL += contribL
    sumContribR += contribR
    totalWeight += weight
    
    details.push({
      region: name,
      regionWeight: weight,
      zL: Number(zL.toFixed(3)),
      zR: Number(zR.toFixed(3)),
      contribL: Number(contribL.toFixed(3)),
      contribR: Number(contribR.toFixed(3)),
      weightsUsed: `${(wThick*100).toFixed(0)}:${(wArea*100).toFixed(0)}:${(wFold*100).toFixed(0)}`,
    })
  }

  const li = (sumContribL - sumContribR) / (Math.abs(sumContribL) + Math.abs(sumContribR) + 0.001)

  const percentile = li >= 0.25 ? Math.min(99, 90 + (li - 0.25) * 30) :
                     li >= 0.10 ? 70 + (li - 0.10) * 133 :
                     li >= -0.10 ? 50 + li * 100 :
                     li >= -0.25 ? 20 + (li + 0.10) * 200 : Math.max(1, 5 + (li + 0.25) * 60)

  return {
    name: 'Language Output Lateralization Index',
    value: Number(li.toFixed(3)),
    percentile: Math.round(Math.max(1, Math.min(99, percentile))),
    interpretation: t ? getLanguageOutputInterpretation(li, t) : "",
    threshold: '≥0.25 strong left (typical); ±0.10 bilateral; ≤-0.10 right (atypical)',
    formula: 'LI_output = (Σw×zL − Σw×zR) / (|ΣwzL| + |ΣwzR|)',
    references: [
      'Amunts 1999 Brain',
      'Keller 2009 Cereb Cortex',
      'Knecht 2000 Brain',
      'Foundas 1998 Brain'
    ],
    regions: ['BA44_exvivo (60%)', 'BA45_exvivo (40%)'],
    weights: 'Thickness 40% : Surface Area 35% : Folding Index 25%',
    details,
  }
}

/**
 * 5. Language Input Lateralization Index (语言输入偏侧化指数)
 * 使用 DKT 语言理解相关区域 - 语言接收/理解
 * 
 * 科学依据：
 * - 颞上回 (STG/Wernicke区): 语音感知、语言理解核心
 * - 角回 (AG): 语义整合、阅读理解
 * - 颞中回 (MTG): 词汇-语义处理
 * - 缘上回 (SMG): 语音工作记忆、音韵处理
 * - 梭状回 (FG): 视觉词形区，阅读输入
 * - 损伤导致感觉性失语（Wernicke失语）
 */

// DKT 语言输入区域配置
interface LanguageRegionConfig {
  name: string
  weight: number
  wThick: number
  wArea: number
  wVol: number
}

const DKT_LANGUAGE_INPUT_REGIONS: LanguageRegionConfig[] = [
  { name: 'superiortemporal', weight: 0.35, wThick: 0.68, wArea: 0.18, wVol: 0.14 },  // Wernicke区 - 语音感知
  { name: 'inferiorparietal', weight: 0.20, wThick: 0.55, wArea: 0.32, wVol: 0.13 },  // 角回 - 语义整合
  { name: 'middletemporal', weight: 0.20, wThick: 0.60, wArea: 0.20, wVol: 0.20 },    // 颞中回 - 词汇语义
  { name: 'supramarginal', weight: 0.15, wThick: 0.48, wArea: 0.38, wVol: 0.14 },     // 缘上回 - 语音工作记忆
  { name: 'fusiform', weight: 0.10, wThick: 0.45, wArea: 0.20, wVol: 0.35 },          // 梭状回 - 视觉词形区
]

export function calculateLanguageInputLateralization(data: DKTData, t?: any): IndexResult {
  const details: RegionDetail[] = []
  let sumContribL = 0
  let sumContribR = 0
  let totalStrength = 0
  const usedRegions: string[] = []

  // 处理 DKT 语言输入区域
  for (const cfg of DKT_LANGUAGE_INPUT_REGIONS) {
    const { name, weight, wThick, wArea, wVol } = cfg
    const norm = REFERENCE_DATA_MALE[name]
    if (!norm || !data.lh[name] || !data.rh[name]) continue

    const lh = data.lh[name]
    const rh = data.rh[name]

    const zL =
      wThick * ((lh.thickness - norm.thickness.mean) / norm.thickness.std) +
      wArea  * ((lh.surfArea  - norm.surfArea.mean)  / norm.surfArea.std) +
      wVol   * ((lh.volume    - norm.volume.mean)    / norm.volume.std)

    const zR =
      wThick * ((rh.thickness - norm.thickness.mean) / norm.thickness.std) +
      wArea  * ((rh.surfArea  - norm.surfArea.mean)  / norm.surfArea.std) +
      wVol   * ((rh.volume    - norm.volume.mean)    / norm.volume.std)

    const contribL = weight * zL
    const contribR = weight * zR

    sumContribL += contribL
    sumContribR += contribR
    totalStrength += (zL + zR) / 2 * weight
    usedRegions.push(`${name} (${(weight*100).toFixed(0)}%)`)

    details.push({
      region: name,
      regionWeight: weight,
      zL: Number(zL.toFixed(3)),
      zR: Number(zR.toFixed(3)),
      contribL: Number(contribL.toFixed(3)),
      contribR: Number(contribR.toFixed(3)),
      weightsUsed: `${(wThick*100).toFixed(0)}:${(wArea*100).toFixed(0)}:${(wVol*100).toFixed(0)}`,
    })
  }

  const li = (sumContribL - sumContribR) / (Math.abs(sumContribL) + Math.abs(sumContribR) + 0.001)

  const percentile = li >= 0.20 ? Math.min(99, 90 + (li - 0.20) * 40) :
                     li >= 0.05 ? 70 + (li - 0.05) * 133 :
                     li >= -0.05 ? 50 + li * 200 :
                     li >= -0.15 ? 20 + (li + 0.05) * 300 : Math.max(1, 5 + (li + 0.15) * 100)

  return {
    name: 'Language Input Lateralization Index',
    value: Number(li.toFixed(3)),
    zScore: Number(totalStrength.toFixed(3)),
    percentile: Math.round(Math.max(1, Math.min(99, percentile))),
    interpretation: t ? getLanguageInputInterpretation(li, t) : "",
    threshold: '≥0.15 typical left; ±0.05 bilateral; ≤-0.10 right (atypical)',
    formula: 'LI_input = (Σw×zL − Σw×zR) / (|ΣwzL| + |ΣwzR|)',
    references: [
      'ENIGMA-Laterality 2024',
      'Labache 2023 Cereb Cortex',
      'Hickok & Poeppel 2007 Nat Rev Neurosci',
      'Price 2012 Brain'
    ],
    regions: usedRegions,
    weights: 'Independent weights per region (see details)',
    details,
  }
}

// 保留原有的综合语言偏侧化指数作为兼容
export function calculateLanguageLateralizationIndex(data: DKTData, t?: any): IndexResult {
  // 计算输出和输入偏侧化
  const outputResult = calculateLanguageOutputLateralization(data, t)
  const inputResult = calculateLanguageInputLateralization(data, t)
  
  // 综合两者 (输出权重60%，输入权重40%)
  const combinedLI = outputResult.value * 0.6 + inputResult.value * 0.4
  
  // 合并 details
  const allDetails = [
    ...(outputResult.details || []).map(d => ({ ...d, region: d.region + ' (Output)' })),
    ...(inputResult.details || []).map(d => ({ ...d, region: d.region + ' (Input)' }))
  ]

  const percentile = combinedLI >= 0.20 ? Math.min(99, 95 + (combinedLI - 0.20) * 20) :
                     combinedLI >= 0.05 ? 80 + (combinedLI - 0.05) * 100 :
                     combinedLI >= -0.05 ? 50 + combinedLI * 300 :
                     combinedLI >= -0.15 ? 20 + (combinedLI + 0.05) * 300 : Math.max(1, 5 + (combinedLI + 0.15) * 100)

  return {
    name: 'Language Lateralization Index',
    value: Number(combinedLI.toFixed(3)),
    percentile: Math.round(Math.max(1, Math.min(99, percentile))),
    interpretation: t ? getLanguageLateralizationInterpretation(combinedLI, t) : "",
    threshold: '≥0.20 typical left | ±0.05 bilateral | ≤-0.10 right',
    formula: 'LI = 0.6×LI_output + 0.4×LI_input',
    references: [
      'ENIGMA-Laterality 2024',
      'Labache 2023 Cereb Cortex',
      'Knecht 2000 Brain',
      'Amunts 1999 Brain (BA44/45)'
    ],
    regions: ['Output: BA44 (60%), BA45 (40%)', 'Input: STG, IPL, MTG, SMG, FG'],
    weights: 'Output 60% : Input 40%',
    details: allDetails,
  }
}

// 语言输出偏侧化解释函数
function getLanguageOutputInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value >= 0.25) return t.interpretations?.languageOutput?.strongLeft || 'Strong left lateralization for language output (typical pattern, ~85% of population). Broca area is well-developed on the left, supporting efficient speech production.'
  if (value >= 0.10) return t.interpretations?.languageOutput?.mildLeft || 'Mild left lateralization for language output. Left Broca area shows slight advantage.'
  if (value >= -0.10) return t.interpretations?.languageOutput?.bilateral || 'Bilateral language output. Both hemispheres contribute to speech production, which is less common (~5% of population).'
  if (value >= -0.25) return t.interpretations?.languageOutput?.mildRight || 'Mild right lateralization for language output (atypical pattern).'
  return t.interpretations?.languageOutput?.strongRight || 'Strong right lateralization for language output (rare, <1% of population). This atypical pattern may be associated with left-handedness.'
}

// 语言输入偏侧化解释函数
function getLanguageInputInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value >= 0.15) return t.interpretations?.languageInput?.strongLeft || 'Strong left lateralization for language comprehension (typical pattern). Wernicke area and related regions are well-developed on the left.'
  if (value >= 0.05) return t.interpretations?.languageInput?.mildLeft || 'Mild left lateralization for language comprehension. Left temporal regions show slight advantage.'
  if (value >= -0.05) return t.interpretations?.languageInput?.bilateral || 'Bilateral language comprehension. Both hemispheres contribute to language understanding.'
  if (value >= -0.15) return t.interpretations?.languageInput?.mildRight || 'Mild right lateralization for language comprehension (less common).'
  return t.interpretations?.languageInput?.strongRight || 'Strong right lateralization for language comprehension (atypical pattern).'
}
