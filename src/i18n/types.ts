export type Language = 'zh' | 'en' | 'ja'

export interface Translations {
  // 通用
  common: {
    loading: string
    error: string
    back: string
    clear: string
    proceed: string
    subject: string
    generatedAt: string
    clickForDetails: string
  }
  
  // 侧边栏
  sidebar: {
    title: string
    upload: string
    overview: string
    special: string
    brain3d: string
  }
  
  // 数据上传
  upload: {
    title: string
    subtitle: string
    githubImport: string
    githubPlaceholder: string
    importButton: string
    importing: string
    dragFolder: string
    dragFolderHint: string
    recognizedFiles: string
    orUploadIndividually: string
    orDragLocalFolder: string
    leftHemisphere: string
    rightHemisphere: string
    subcortical: string
    dragOrClick: string
    clearData: string
    startAnalysis: string
    uploadAllFiles: string
    fileDescription: string
    fileHint: string
    folderHint: string
    warningDifferentSubjects: string
    subject: string
    errors: {
      unknownFileType: string
      wrongFileType: string
      needsLeftHemisphere: string
      needsRightHemisphere: string
      fileNameMismatch: string
      invalidFormat: string
      uploadFailed: string
      noMatchingFiles: string
      invalidGitHubUrl: string
      pathNotFound: string
      apiRateLimit: string
      apiError: string
      notAFolder: string
      noStatsFiles: string
      downloadFailed: string
      githubImportFailed: string
      enterGitHubUrl: string
    }
    fileLabels: {
      lhDKT: string
      rhDKT: string
      lhAparc: string
      rhAparc: string
      aseg: string
    }
    helpSection: {
      title: string
      lhrhDKT: string
      lhrhAparc: string
      aseg: string
      locationHint: string
      folderDragHint: string
    }
  }
  
  // 报告
  report: {
    brainAnalysis: string
    overallScore: string
    overallScoreDesc: string
    topStrengths: string
    specialFeatures: string
    recommendations: string
    basicMetrics: string
    brainHealthTips: string
    exercise: string
    exerciseDesc: string
    learning: string
    learningDesc: string
    sleep: string
    sleepDesc: string
    stress: string
    stressDesc: string
    disclaimer: string
    methodology: string
    dataSource: string
    referencePopulation: string
    calculationMethod: string
    advancedLateralization: string
  }
  
  // DKT 分析
  dkt: {
    title: string
    subtitle: string
    analyzing: string
    basicLateralization: string
    basicLateralizationHint: string
    advancedLateralization: string
    advancedLateralizationHint: string
    sensoryFunction: string
    languageReading: string
    cognitiveAbility: string
    lateralizationIndex: string
    zScore: string
    percentile: string
    top: string
    methodology: string
    methodologyContent: {
      dataSource: string
      referencePopulation: string
      calculationMethod: string
      advancedLateralization: string
    }
    // 指标名称映射 (英文名 -> 翻译)
    indexNames: {
      'Handedness Index': string
      'Dominant Eye Index': string
      'Preferred Nostril Index': string
      'Language Lateralization Index': string
      'Spatial Attention Lateralization Index': string
      'Emotion Processing Lateralization Index': string
      'Face Recognition Lateralization Index': string
      'Music Perception Lateralization Index': string
      'Theory of Mind Lateralization Index': string
      'Logical Reasoning Lateralization Index': string
      'Mathematical Ability Lateralization Index': string
      'Olfactory Function Index': string
      'Language Composite Index': string
      'Reading Fluency Index': string
      'Dyslexia Structural Risk Index': string
      'Empathy Index': string
      'Executive Function Index': string
      'Spatial Processing Index': string
      'Fluid Intelligence Index (Structural)': string
    }
    // 侧化标签
    lateralizationLabels: {
      leftSpatial: string
      rightSpatial: string
      positiveEmotion: string
      negativeEmotion: string
      analytical: string
      holistic: string
      rhythm: string
      melody: string
      verbalReasoning: string
      intuitivePerception: string
      leftSide: string
      rightSide: string
    }
  }
  
  // 指标详情页
  indexDetail: {
    backButton: string
    lateralizationIndex: string
    zScore: string
    top: string
    interpretation: string
    thresholdStandard: string
    calculationMethod: string
    formula: string
    weights: string
    brainRegions: string
    zScoreDetails: string
    region: string
    weight: string
    leftZ: string
    rightZ: string
    leftContribution: string
    rightContribution: string
    thickSurfVol: string
    zScoreNote: string
    references: string
    disclaimer: string
  }
  
  // 脑区名称翻译
  brainRegions?: {
    precentral: string
    postcentral: string
    paracentral: string
    pericalcarine: string
    cuneus: string
    lingual: string
    entorhinal: string
    parahippocampal: string
    medialorbitofrontal: string
    superiortemporal: string
    parsopercularis: string
    parstriangularis: string
    middletemporal: string
    fusiform: string
    supramarginal: string
    inferiorparietal: string
    rostralanteriorcingulate: string
    insula: string
    posteriorcingulate: string
    superiorfrontal: string
    rostralmiddlefrontal: string
    caudalmiddlefrontal: string
    superiorparietal: string
    precuneus: string
    lateraloccipital: string
    lateralorbitofrontal: string
    inferiortemporal: string
    piriform: string
  }
  
  // 基础指标详情页
  basicMetricDetail: {
    backButton: string
    referenceRange: string
    metricDescription: string
    resultInterpretation: string
    relatedFunctions: string
    references: string
    disclaimer: string
  }
  
  // 评分标签
  scores: {
    excellent: string
    good: string
    aboveAverage: string
    average: string
    belowAverage: string
    needsAttention: string
  }
  
  // 侧化标签
  lateralization: {
    leftHand: string
    rightHand: string
    ambidextrous: string
    leftEye: string
    rightEye: string
    balanced: string
    leftNostril: string
    rightNostril: string
    leftBrain: string
    rightBrain: string
    bilateral: string
    // 描述性修饰词
    typical: string
    weak: string
    atypical: string
    strong: string
    extreme: string
  }
  
  // 可爱俏皮的侧化标签
  lateralityTags?: {
    sectionTitle: string
    sectionHint: string
    // 惯用手
    rightHanded: string
    mildRightHanded: string
    ambidextrous: string
    mildLeftHanded: string
    leftHanded: string
    // 主视眼
    rightEyeDominant: string
    mildRightEye: string
    balancedEyes: string
    mildLeftEye: string
    leftEyeDominant: string
    // 嗅觉
    rightNostrilStar: string
    mildRightNostril: string
    balancedNostrils: string
    mildLeftNostril: string
    leftNostrilStar: string
    // 语言
    leftBrainLanguage: string
    mildLeftLanguage: string
    bilateralLanguage: string
    mildRightLanguage: string
    rightBrainLanguage: string
    // 空间
    spatialMaster: string
    spatialBalanced: string
    spatialAnalytical: string
    // 情绪
    emotionSensitive: string
    emotionBalanced: string
    emotionPositive: string
    // 面孔
    faceRecognizer: string
    faceBalanced: string
    faceAnalytical: string
    // 音乐
    musicTalent: string
    musicBalanced: string
    rhythmMaster: string
    // 心智
    mindReader: string
    mindBalanced: string
    mindLogical: string
    // 逻辑
    logicGenius: string
    logicStrong: string
    logicBalanced: string
    logicSpatial: string
    // 数学
    mathGenius: string
    mathStrong: string
    mathBalanced: string
    mathGeometric: string
  }
  
  // 脑容量标签
  brainTags?: {
    sectionTitle: string
    sectionHint: string
    // 总脑容量
    brainVolLarge: string
    brainVolAbove: string
    brainVolNormal: string
    brainVolCompact: string
    // 灰质
    cortexLarge: string
    cortexAbove: string
    cortexNormal: string
    cortexCompact: string
    // 白质
    whiteLarge: string
    whiteAbove: string
    whiteNormal: string
    whiteCompact: string
    // 左脑厚度
    thickLeft: string
    thickLeftGood: string
    thickLeftNormal: string
    thickLeftSlim: string
    // 右脑厚度
    thickRight: string
    thickRightGood: string
    thickRightNormal: string
    thickRightSlim: string
  }
  
  // 所有标签合并
  allTags?: {
    sectionTitle: string
    sectionHint: string
  }
  
  // 稀有度提示
  rarityTooltip?: {
    mythic: string
    legendary: string
    epic: string
    rare: string
    uncommon: string
    common: string
    growing: string
  }
  
  // 俏皮评分
  cuteScore?: {
    suffix: string
    level90: string
    level80: string
    level70: string
    level60: string
    level50: string
  }
  
  // 能力标签
  abilityTags?: {
    sectionTitle: string
    sectionHint: string
    // 嗅觉
    smellSuperStar: string
    smellGood: string
    smellNormal: string
    smellDeveloping: string
    // 语言
    langGenius: string
    langGood: string
    langNormal: string
    langDeveloping: string
    // 阅读
    readingMaster: string
    readingGood: string
    readingNormal: string
    readingDeveloping: string
    // 阅读障碍风险
    dyslexiaLow: string
    dyslexiaNormal: string
    dyslexiaWatch: string
    dyslexiaSupport: string
    // 共情
    empathyStar: string
    empathyGood: string
    empathyNormal: string
    empathyDeveloping: string
    // 执行功能
    execStar: string
    execGood: string
    execNormal: string
    execDeveloping: string
    // 空间
    spatialStar: string
    spatialGood: string
    spatialNormal: string
    spatialDeveloping: string
    // 流体智力
    iqStar: string
    iqGood: string
    iqNormal: string
    iqDeveloping: string
  }
  
  // DKT 分析摘要
  dktSummary: {
    specialFeatures: {
      leftHanded: string
      extremeRightHanded: string
      extremeRightEye: string
      extremeLeftEye: string
      extremeRightNostril: string
      extremeLeftNostril: string
      rightLanguageLateralization: string
      bilateralLanguage: string
      extremeRightSpatialAttention: string
      extremeRightEmotion: string
      leftEmotionDepression: string
      extremeFaceRecognition: string
      extremeMusicTalent: string
      extremeMentalization: string
      highDyslexiaRisk: string
      moderateDyslexiaRisk: string
      excellentLanguage: string
      excellentFluidIQ: string
      extremeLogicalTalent: string
      significantLogicalAbility: string
      extremeMathTalent: string
      significantMathAbility: string
    }
    recommendations: {
      excellentPerformance: string
      relativelyWeak: string
      languageWork: string
      readingResearch: string
      spatialWork: string
      empathyWork: string
      executiveWork: string
      musicDevelopment: string
      faceRecognitionWork: string
      logicalWork: string
      mathWork: string
      spatialMathWork: string
      dyslexiaAssessment: string
      emotionalHealth: string
      balancedDevelopment: string
    }
  }
  
  // 指标解释
  interpretations: {
    handedness: {
      extremeRight: string
      strongRight: string
      moderateRight: string
      ambidextrous: string
      moderateLeft: string
      strongLeft: string
    }
    dominantEye: {
      extremeRight: string
      strongRight: string
      mildRight: string
      balanced: string
      mildLeft: string
      strongLeft: string
    }
    nostril: {
      extremeRight: string
      strongRight: string
      mildRight: string
      balanced: string
      mildLeft: string
      strongLeft: string
      extremeLeft: string
    }
    olfactory: {
      excellent: string
      good: string
      normal: string
      needsAttention: string
    }
    language: {
      exceptional: string
      excellent: string
      good: string
      normal: string
      needsAttention: string
    }
    reading: {
      excellent: string
      good: string
      normal: string
      needsAttention: string
    }
    languageLateralization: {
      typicalLeft: string
      weakLeft: string
      bilateral: string
      weakRight: string
      significantRight: string
    }
    empathy: {
      excellent: string
      good: string
      aboveAverage: string
      normal: string
      needsAttention: string
    }
    executive: {
      exceptional: string
      excellent: string
      good: string
      normal: string
      needsAttention: string
    }
    spatial: {
      excellent: string
      good: string
      aboveAverage: string
      normal: string
      needsAttention: string
    }
    fluidIntelligence: {
      exceptional: string
      excellent: string
      good: string
      aboveAverage: string
      normal: string
      needsAttention: string
    }
    spatialAttention: {
      extremeRight: string
      strongRight: string
      balanced: string
      mildLeft: string
      strongLeft: string
    }
    emotionLateralization: {
      extremeRight: string
      strongRight: string
      balanced: string
      mildLeft: string
      strongLeft: string
    }
    faceRecognition: {
      extremeRight: string
      strongRight: string
      balanced: string
      mildLeft: string
      strongLeft: string
    }
    musicLateralization: {
      extremeRight: string
      strongRight: string
      balanced: string
      mildLeft: string
      strongLeft: string
    }
    theoryOfMind: {
      extremeRight: string
      strongRight: string
      balanced: string
      mildLeft: string
      strongLeft: string
    }
    dyslexiaRisk: {
      highRisk: string
      highRiskInterpretation: string
      moderateRisk: string
      moderateRiskInterpretation: string
      lowRisk: string
      lowRiskInterpretation: string
      veryLowRisk: string
      veryLowRiskInterpretation: string
    }
    logicalReasoning: {
      extremeLeft: string
      strongLeft: string
      mildLeft: string
      balanced: string
      mildRight: string
      strongRight: string
    }
    mathematicalAbility: {
      extremeLeft: string
      strongLeft: string
      mildLeft: string
      balanced: string
      mildRight: string
      strongRight: string
    }
  }
  
  // 概览报告
  overview: {
    title: string
    subject: string
    generatedAt: string
    loading: string
    error: string
    overallScore: string
    overallScoreDesc: string
    topStrengths: string
    specialFeatures: string
    recommendations: string
    basicMetrics: string
    basicMetricsSubtitle: string
    brainHealthTips: string
    exercise: string
    exerciseDesc: string
    learning: string
    learningDesc: string
    sleep: string
    sleepDesc: string
    stress: string
    stressDesc: string
    disclaimer: string
    // 基础指标
    metrics: {
      brainVol: {
        name: string
        description: string
        normalRange: string
        interpretation: string
        relatedFunctions: string[]
      }
      cortexVol: {
        name: string
        description: string
        normalRange: string
        interpretation: string
        relatedFunctions: string[]
      }
      whiteVol: {
        name: string
        description: string
        normalRange: string
        interpretation: string
        relatedFunctions: string[]
      }
      lhThickness: {
        name: string
        description: string
        normalRange: string
        interpretation: string
        relatedFunctions: string[]
      }
      rhThickness: {
        name: string
        description: string
        normalRange: string
        interpretation: string
        relatedFunctions: string[]
      }
    }
  }
}
