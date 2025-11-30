/**
 * DKT Analysis Main Entry Point
 * Exports all analysis functions and types
 */

// Export types
export * from './types'

// Export basic lateralization indices
export * from './basicLateralization'

// Export cognitive indices
export * from './cognitiveIndices'

// Export advanced lateralization indices
export * from './advancedLateralization'

// Main analysis interface
import { DKTData, IndexResult, parseDKTStats } from './types'
import {
  calculateHandednessIndex,
  calculateDominantEyeIndex,
  calculatePreferredNostrilIndex,
  calculateLanguageLateralizationIndex
} from './basicLateralization'
import {
  calculateOlfactoryIndex,
  calculateLanguageIndex,
  calculateReadingIndex,
  calculateEmpathyIndex,
  calculateExecutiveIndex,
  calculateSpatialIndex,
  calculateFluidIntelligenceIndex
} from './cognitiveIndices'
import {
  calculateSpatialAttentionLateralization,
  calculateEmotionLateralization,
  calculateFaceRecognitionLateralization,
  calculateMusicLateralization,
  calculateTheoryOfMindLateralization,
  calculateLogicalReasoningLateralization,
  calculateMathematicalAbilityLateralization,
  calculateDyslexiaRiskIndex
} from './advancedLateralization'

export interface DKTAnalysisResult {
  indices: IndexResult[]
  summary: {
    topStrengths: string[]
    specialFeatures: string[]
    recommendations: string[]
  }
}

export function runDKTAnalysis(lhData: Record<string, any>, rhData: Record<string, any>, t?: any): DKTAnalysisResult {
  const data: DKTData = { lh: lhData, rh: rhData }
  
  const indices = [
    // Basic lateralization indices (0-3)
    calculateHandednessIndex(data, t),
    calculateDominantEyeIndex(data, t),
    calculatePreferredNostrilIndex(data, t),
    calculateLanguageLateralizationIndex(data, t),
    // Advanced functional lateralization indices (4-10)
    calculateSpatialAttentionLateralization(data, t),
    calculateEmotionLateralization(data, t),
    calculateFaceRecognitionLateralization(data, t),
    calculateMusicLateralization(data, t),
    calculateTheoryOfMindLateralization(data, t),
    calculateLogicalReasoningLateralization(data, t),
    calculateMathematicalAbilityLateralization(data, t),
    // Sensory function indices (11)
    calculateOlfactoryIndex(data, t),
    // Language and reading indices (12-14)
    calculateLanguageIndex(data, t),
    calculateReadingIndex(data, t),
    calculateDyslexiaRiskIndex(data, t),
    // Cognitive ability indices (15-18)
    calculateEmpathyIndex(data, t),
    calculateExecutiveIndex(data, t),
    calculateSpatialIndex(data, t),
    calculateFluidIntelligenceIndex(data, t)
  ]
  
  // Generate summary
  const topStrengths = indices
    .filter(i => i.percentile >= 84)
    .sort((a, b) => b.percentile - a.percentile)
    .slice(0, 5)
    .map(i => `${i.name} (Top ${100 - i.percentile}%)`)
  
  const specialFeatures: string[] = []
  
  // Get various indices
  const handedness = indices.find(i => i.name === 'Handedness Index')
  const dominantEye = indices.find(i => i.name === 'Dominant Eye Index')
  const nostril = indices.find(i => i.name === 'Preferred Nostril Index')
  const langLat = indices.find(i => i.name === 'Language Lateralization Index')
  const spatialAttn = indices.find(i => i.name === 'Spatial Attention Lateralization Index')
  const emotion = indices.find(i => i.name === 'Emotion Processing Lateralization Index')
  const face = indices.find(i => i.name === 'Face Recognition Lateralization Index')
  const music = indices.find(i => i.name === 'Music Perception Lateralization Index')
  const tom = indices.find(i => i.name === 'Theory of Mind Lateralization Index')
  const dyslexia = indices.find(i => i.name === 'Dyslexia Structural Risk Index')
  const language = indices.find(i => i.name === 'Language Composite Index')
  const reading = indices.find(i => i.name === 'Reading Fluency Index')
  const empathy = indices.find(i => i.name === 'Empathy Index')
  const executive = indices.find(i => i.name === 'Executive Function Index')
  const spatial = indices.find(i => i.name === 'Spatial Processing Index')
  const fluidIQ = indices.find(i => i.name === 'Fluid Intelligence Index (Structural)')
  const logicReasoning = indices.find(i => i.name === 'Logical Reasoning Lateralization Index')
  const mathAbility = indices.find(i => i.name === 'Mathematical Ability Lateralization Index')
  
  // Handedness features
  if (t && handedness) {
    if (handedness.value < -0.84) {
      specialFeatures.push(t.dktSummary.specialFeatures.leftHanded)
    } else if (handedness.value >= 1.28) {
      specialFeatures.push(t.dktSummary.specialFeatures.extremeRightHanded)
    }
  }
  
  // Dominant eye features
  if (t && dominantEye && Math.abs(dominantEye.value) >= 1.5) {
    specialFeatures.push(dominantEye.value > 0 ? t.dktSummary.specialFeatures.extremeRightEye : t.dktSummary.specialFeatures.extremeLeftEye)
  }
  
  // Nostril preference features
  if (t && nostril && Math.abs(nostril.value) >= 1.2) {
    specialFeatures.push(nostril.value > 0 ? t.dktSummary.specialFeatures.extremeRightNostril : t.dktSummary.specialFeatures.extremeLeftNostril)
  }
  
  // Language lateralization features
  if (t && langLat) {
    if (langLat.value < -0.15) {
      specialFeatures.push(t.dktSummary.specialFeatures.rightLanguageLateralization)
    } else if (langLat.value >= -0.05 && langLat.value <= 0.05) {
      specialFeatures.push(t.dktSummary.specialFeatures.bilateralLanguage)
    }
  }
  
  // Spatial attention features
  if (t && spatialAttn && spatialAttn.value >= 0.80) {
    specialFeatures.push(t.dktSummary.specialFeatures.extremeRightSpatialAttention)
  }
  
  // Emotion processing features
  if (t && emotion) {
    if (emotion.value >= 0.90) {
      specialFeatures.push(t.dktSummary.specialFeatures.extremeRightEmotion)
    } else if (emotion.value <= -0.50) {
      specialFeatures.push(t.dktSummary.specialFeatures.leftEmotionDepression)
    }
  }
  
  // Face recognition features
  if (t && face && face.value >= 1.00) {
    specialFeatures.push(t.dktSummary.specialFeatures.extremeFaceRecognition)
  }
  
  // Music perception features
  if (t && music && music.value >= 1.20) {
    specialFeatures.push(t.dktSummary.specialFeatures.extremeMusicTalent)
  }
  
  // Theory of mind features
  if (t && tom && tom.value >= 0.80) {
    specialFeatures.push(t.dktSummary.specialFeatures.extremeMentalization)
  }
  
  // Dyslexia risk
  if (t && dyslexia) {
    if (dyslexia.value < -1.0) {
      specialFeatures.push(t.dktSummary.specialFeatures.highDyslexiaRisk)
    } else if (dyslexia.value < -0.5) {
      specialFeatures.push(t.dktSummary.specialFeatures.moderateDyslexiaRisk)
    }
  }
  
  // Cognitive excellence features
  if (t && language && language.percentile >= 99) {
    specialFeatures.push(t.dktSummary.specialFeatures.excellentLanguage)
  }
  if (t && fluidIQ && fluidIQ.percentile >= 98) {
    specialFeatures.push(t.dktSummary.specialFeatures.excellentFluidIQ)
  }
  
  // Logical reasoning features
  if (t && logicReasoning) {
    if (logicReasoning.value <= -0.80) {
      specialFeatures.push(t.dktSummary.specialFeatures.extremeLogicalTalent)
    } else if (logicReasoning.value <= -0.50) {
      specialFeatures.push(t.dktSummary.specialFeatures.significantLogicalAbility)
    }
  }
  
  // Mathematical ability features
  if (t && mathAbility) {
    if (mathAbility.value <= -0.90) {
      specialFeatures.push(t.dktSummary.specialFeatures.extremeMathTalent)
    } else if (mathAbility.value <= -0.60) {
      specialFeatures.push(t.dktSummary.specialFeatures.significantMathAbility)
    }
  }
  
  const recommendations: string[] = []
  
  if (t) {
    // Helper function to get translated index name
    const getTranslatedName = (name: string) => {
      return t.dkt?.indexNames?.[name as keyof typeof t.dkt.indexNames] || name
    }
    
    // Strength-based recommendations
    const veryHighIndices = indices.filter(i => i.percentile >= 95)
    if (veryHighIndices.length > 0) {
      const strengthAreas = veryHighIndices.map(i => getTranslatedName(i.name)).join(', ')
      recommendations.push(t.dktSummary.recommendations.excellentPerformance.replace('{areas}', strengthAreas))
    }
    
    // Weakness-based recommendations
    const lowIndices = indices.filter(i => i.percentile < 20)
    if (lowIndices.length > 0) {
      const weakAreas = lowIndices.map(i => getTranslatedName(i.name)).join(', ')
      recommendations.push(t.dktSummary.recommendations.relativelyWeak.replace('{areas}', weakAreas))
    }
    
    // Language-related recommendations
    if (language && language.percentile >= 90) {
      recommendations.push(t.dktSummary.recommendations.languageWork)
    }
    if (reading && reading.percentile >= 90) {
      recommendations.push(t.dktSummary.recommendations.readingResearch)
    }
    
    // Spatial ability recommendations
    if (spatial && spatial.percentile >= 90) {
      recommendations.push(t.dktSummary.recommendations.spatialWork)
    }
    
    // Empathy and social recommendations
    if (empathy && empathy.percentile >= 90) {
      recommendations.push(t.dktSummary.recommendations.empathyWork)
    }
    
    // Executive function recommendations
    if (executive && executive.percentile >= 90) {
      recommendations.push(t.dktSummary.recommendations.executiveWork)
    }
    
    // Music talent recommendations
    if (music && music.percentile >= 92) {
      recommendations.push(t.dktSummary.recommendations.musicDevelopment)
    }
    
    // Face recognition recommendations
    if (face && face.percentile >= 90) {
      recommendations.push(t.dktSummary.recommendations.faceRecognitionWork)
    }
    
    // Logical reasoning recommendations
    if (logicReasoning && logicReasoning.value <= -0.50) {
      recommendations.push(t.dktSummary.recommendations.logicalWork)
    }
    
    // Mathematical ability recommendations
    if (mathAbility && mathAbility.value <= -0.60) {
      recommendations.push(t.dktSummary.recommendations.mathWork)
    } else if (mathAbility && mathAbility.value >= 0.40) {
      recommendations.push(t.dktSummary.recommendations.spatialMathWork)
    }
    
    // Dyslexia recommendations
    if (dyslexia && dyslexia.value < -0.5) {
      recommendations.push(t.dktSummary.recommendations.dyslexiaAssessment)
    }
    
    // Emotional health recommendations
    if (emotion && emotion.value <= -0.50) {
      recommendations.push(t.dktSummary.recommendations.emotionalHealth)
    }
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push(t.dktSummary.recommendations.balancedDevelopment)
    }
  }
  
  return {
    indices,
    summary: {
      topStrengths,
      specialFeatures,
      recommendations
    }
  }
}

// Re-export parseDKTStats for convenience
export { parseDKTStats }
