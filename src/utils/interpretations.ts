/**
 * DKT 指标解释常量和函数
 * 将所有 interpretation 逻辑集中管理
 */

// 惯用手指数解释
export function getHandednessInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value >= 1.28) {
    return t.interpretations.handedness.extremeRight
  } else if (value >= 0.84) {
    return t.interpretations.handedness.strongRight
  } else if (value >= 0.52) {
    return t.interpretations.handedness.moderateRight
  } else if (value >= -0.52) {
    return t.interpretations.handedness.ambidextrous
  } else if (value >= -0.84) {
    return t.interpretations.handedness.moderateLeft
  }
  return t.interpretations.handedness.strongLeft
}

// 主视眼指数解释
export function getDominantEyeInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value >= 1.5) {
    return t.interpretations.dominantEye.extremeRight
  } else if (value >= 0.8) {
    return t.interpretations.dominantEye.strongRight
  } else if (value >= 0.3) {
    return t.interpretations.dominantEye.mildRight
  } else if (value >= -0.3) {
    return t.interpretations.dominantEye.balanced
  } else if (value >= -0.8) {
    return t.interpretations.dominantEye.mildLeft
  }
  return t.interpretations.dominantEye.strongLeft
}

// 主嗅鼻孔指数解释
export function getNostrilInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value >= 1.2) return t.interpretations.nostril.extremeRight
  if (value >= 0.7) return t.interpretations.nostril.strongRight
  if (value >= 0.3) return t.interpretations.nostril.mildRight
  if (value > -0.3) return t.interpretations.nostril.balanced
  if (value > -0.7) return t.interpretations.nostril.mildLeft
  if (value > -1.2) return t.interpretations.nostril.strongLeft
  return t.interpretations.nostril.extremeLeft
}

// 嗅觉功能指数解释
export function getOlfactoryInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value > 1.5) {
    return t.interpretations.olfactory.excellent
  } else if (value > 1.0) {
    return t.interpretations.olfactory.good
  } else if (value > -0.5) {
    return t.interpretations.olfactory.normal
  }
  return t.interpretations.olfactory.needsAttention
}

// 语言综合指数解释
export function getLanguageInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value > 2.4) {
    return t.interpretations.language.exceptional
  } else if (value > 2.0) {
    return t.interpretations.language.excellent
  } else if (value > 1.0) {
    return t.interpretations.language.good
  } else if (value > -0.5) {
    return t.interpretations.language.normal
  }
  return t.interpretations.language.needsAttention
}

// 阅读流畅性指数解释
export function getReadingInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value > 2.0) {
    return t.interpretations.reading.excellent
  } else if (value > 1.0) {
    return t.interpretations.reading.good
  } else if (value > -0.5) {
    return t.interpretations.reading.normal
  }
  return t.interpretations.reading.needsAttention
}

// 语言偏侧化指数解释
export function getLanguageLateralizationInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value >= 0.20) return t.interpretations.languageLateralization.typicalLeft
  if (value >= 0.05) return t.interpretations.languageLateralization.weakLeft
  if (value >= -0.05) return t.interpretations.languageLateralization.bilateral
  if (value >= -0.15) return t.interpretations.languageLateralization.weakRight
  return t.interpretations.languageLateralization.significantRight
}

// 共情能力指数解释
export function getEmpathyInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value > 1.6) {
    return t.interpretations.empathy.excellent
  } else if (value > 1.5) {
    return t.interpretations.empathy.good
  } else if (value > 0.5) {
    return t.interpretations.empathy.aboveAverage
  } else if (value > -0.5) {
    return t.interpretations.empathy.normal
  }
  return t.interpretations.empathy.needsAttention
}

// 执行功能指数解释
export function getExecutiveInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value > 1.9) {
    return t.interpretations.executive.exceptional
  } else if (value > 1.8) {
    return t.interpretations.executive.excellent
  } else if (value > 1.0) {
    return t.interpretations.executive.good
  } else if (value > -0.5) {
    return t.interpretations.executive.normal
  }
  return t.interpretations.executive.needsAttention
}

// 空间加工指数解释
export function getSpatialInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value > 1.5) {
    return t.interpretations.spatial.excellent
  } else if (value > 1.2) {
    return t.interpretations.spatial.good
  } else if (value > 0.5) {
    return t.interpretations.spatial.aboveAverage
  } else if (value > -0.5) {
    return t.interpretations.spatial.normal
  }
  return t.interpretations.spatial.needsAttention
}

// 流体智力指数解释
export function getFluidIntelligenceInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value > 2.1) {
    return t.interpretations.fluidIntelligence.exceptional
  } else if (value > 2.0) {
    return t.interpretations.fluidIntelligence.excellent
  } else if (value > 1.5) {
    return t.interpretations.fluidIntelligence.good
  } else if (value > 0.5) {
    return t.interpretations.fluidIntelligence.aboveAverage
  } else if (value > -0.5) {
    return t.interpretations.fluidIntelligence.normal
  }
  return t.interpretations.fluidIntelligence.needsAttention
}

// 空间注意偏向指数解释
export function getSpatialAttentionInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value >= 0.80) {
    return t.interpretations.spatialAttention.extremeRight
  } else if (value >= 0.40) {
    return t.interpretations.spatialAttention.strongRight
  } else if (value >= -0.20) {
    return t.interpretations.spatialAttention.balanced
  } else if (value >= -0.40) {
    return t.interpretations.spatialAttention.mildLeft
  }
  return t.interpretations.spatialAttention.strongLeft
}

// 情绪加工偏侧化指数解释
export function getEmotionLateralizationInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value >= 0.90) {
    return t.interpretations.emotionLateralization.extremeRight
  } else if (value >= 0.50) {
    return t.interpretations.emotionLateralization.strongRight
  } else if (value >= -0.30) {
    return t.interpretations.emotionLateralization.balanced
  } else if (value >= -0.50) {
    return t.interpretations.emotionLateralization.mildLeft
  }
  return t.interpretations.emotionLateralization.strongLeft
}

// 面孔识别偏侧化指数解释
export function getFaceRecognitionInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value >= 1.00) {
    return t.interpretations.faceRecognition.extremeRight
  } else if (value >= 0.60) {
    return t.interpretations.faceRecognition.strongRight
  } else if (value >= -0.20) {
    return t.interpretations.faceRecognition.balanced
  } else if (value >= -0.60) {
    return t.interpretations.faceRecognition.mildLeft
  }
  return t.interpretations.faceRecognition.strongLeft
}

// 音乐感知偏侧化指数解释
export function getMusicLateralizationInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value >= 1.20) {
    return t.interpretations.musicLateralization.extremeRight
  } else if (value >= 0.70) {
    return t.interpretations.musicLateralization.strongRight
  } else if (value >= -0.30) {
    return t.interpretations.musicLateralization.balanced
  } else if (value >= -0.70) {
    return t.interpretations.musicLateralization.mildLeft
  }
  return t.interpretations.musicLateralization.strongLeft
}

// 心理理论偏侧化指数解释
export function getTheoryOfMindInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value >= 0.80) {
    return t.interpretations.theoryOfMind.extremeRight
  } else if (value >= 0.40) {
    return t.interpretations.theoryOfMind.strongRight
  } else if (value >= -0.20) {
    return t.interpretations.theoryOfMind.balanced
  } else if (value >= -0.40) {
    return t.interpretations.theoryOfMind.mildLeft
  }
  return t.interpretations.theoryOfMind.strongLeft
}

// 阅读障碍风险指数解释
export function getDyslexiaRiskInterpretation(value: number, t?: any): { riskLevel: string; interpretation: string } {
  if (!t) return { riskLevel: '', interpretation: '' }
  if (value < -1.0) {
    return {
      riskLevel: t.interpretations.dyslexiaRisk.highRisk,
      interpretation: t.interpretations.dyslexiaRisk.highRiskInterpretation
    }
  } else if (value < -0.5) {
    return {
      riskLevel: t.interpretations.dyslexiaRisk.moderateRisk,
      interpretation: t.interpretations.dyslexiaRisk.moderateRiskInterpretation
    }
  } else if (value < 0.5) {
    return {
      riskLevel: t.interpretations.dyslexiaRisk.lowRisk,
      interpretation: t.interpretations.dyslexiaRisk.lowRiskInterpretation
    }
  }
  return {
    riskLevel: t.interpretations.dyslexiaRisk.veryLowRisk,
    interpretation: t.interpretations.dyslexiaRisk.veryLowRiskInterpretation
  }
}

// 逻辑推理偏侧化指数解释
export function getLogicalReasoningInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value <= -0.80) {
    return t.interpretations.logicalReasoning.extremeLeft
  } else if (value <= -0.50) {
    return t.interpretations.logicalReasoning.strongLeft
  } else if (value <= -0.20) {
    return t.interpretations.logicalReasoning.mildLeft
  } else if (value <= 0.20) {
    return t.interpretations.logicalReasoning.balanced
  } else if (value <= 0.50) {
    return t.interpretations.logicalReasoning.mildRight
  }
  return t.interpretations.logicalReasoning.strongRight
}

// 数学能力偏侧化指数解释
export function getMathematicalAbilityInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value <= -0.90) {
    return t.interpretations.mathematicalAbility.extremeLeft
  } else if (value <= -0.60) {
    return t.interpretations.mathematicalAbility.strongLeft
  } else if (value <= -0.20) {
    return t.interpretations.mathematicalAbility.mildLeft
  } else if (value <= 0.20) {
    return t.interpretations.mathematicalAbility.balanced
  } else if (value <= 0.40) {
    return t.interpretations.mathematicalAbility.mildRight
  }
  return t.interpretations.mathematicalAbility.strongRight
}

// 顶叶智商预测指数解释
export function getParietalIQInterpretation(value: number, t?: any): string {
  if (!t) return ''
  if (value > 2.5) {
    return t.interpretations.parietalIQ?.exceptional || 'Exceptional parietal structure (top 0.6%). Highly developed posterior parietal cortex suggests excellent abstract reasoning and relational processing capacity.'
  } else if (value > 2.0) {
    return t.interpretations.parietalIQ?.excellent || 'Excellent parietal structure (top 2.3%). Well-developed parietal regions indicate strong potential for complex reasoning tasks.'
  } else if (value > 1.5) {
    return t.interpretations.parietalIQ?.good || 'Good parietal structure (top 7%). Above-average parietal development supports good spatial and abstract reasoning abilities.'
  } else if (value > 1.0) {
    return t.interpretations.parietalIQ?.aboveAverage || 'Above average parietal structure (top 16%). Parietal cortex development is favorable for cognitive tasks.'
  } else if (value > -1.0) {
    return t.interpretations.parietalIQ?.normal || 'Normal parietal structure. Parietal cortex development is within the typical range.'
  }
  return t.interpretations.parietalIQ?.needsAttention || 'Parietal structure needs attention. May benefit from cognitive training targeting spatial and abstract reasoning.'
}
