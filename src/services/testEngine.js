function toMessages(speaker, messages, direction) {
  return (messages || []).map((message) => ({
    speaker,
    text: message,
    direction,
  }));
}


function buildNodeMap(scenario) {
  return Object.fromEntries((scenario.nodes || []).map((node) => [node.id, node]));
}


function getRequiredNode(nodeMap, nodeId, contextLabel) {
  const node = nodeMap[nodeId];
  if (!node) {
    throw new Error(`Missing node "${nodeId}" in ${contextLabel}.`);
  }

  return node;
}


function cloneProgress(activeProgress) {
  if (!activeProgress) {
    throw new Error("Missing active progress for the current test session.");
  }

  return {
    ...activeProgress,
    selectedOptionIds: [...activeProgress.selectedOptionIds],
    conversation: activeProgress.conversation.map((message) => ({ ...message })),
  };
}


export function buildProgress(scenario) {
  const nodeMap = buildNodeMap(scenario);
  const rootNode = getRequiredNode(
    nodeMap,
    scenario.rootNodeId,
    `scenario "${scenario.code || scenario.title}"`,
  );

  return {
    scenarioId: scenario._id,
    scenarioTitle: scenario.title,
    personaName: scenario.personaName,
    personaRole: scenario.personaRole,
    currentNodeId: rootNode.id,
    conversation: toMessages(rootNode.speaker, rootNode.messages, "incoming"),
    selectedOptionIds: [],
    riskIncurred: 0,
    stepsTaken: 0,
  };
}


export function buildTestSession(userId, scenarios) {
  if (!scenarios.length) {
    throw new Error("At least one scenario is required to start a test session.");
  }

  const totalMaxRisk = scenarios.reduce(
    (total, scenario) => total + Number(scenario.riskWeight || 0),
    0,
  );

  return {
    userId,
    scenarioIds: scenarios.map((scenario) => scenario._id),
    currentScenarioIndex: 0,
    activeProgress: buildProgress(scenarios[0]),
    answeredScenarios: [],
    correctAnswers: 0,
    totalRiskIncurred: 0,
    totalMaxRisk,
    awaitingContinue: false,
    lastOutcome: null,
    status: "in_progress",
    startedAt: new Date(),
    finishedAt: null,
  };
}


export function initializeNextScenario(sessionDoc, scenario) {
  sessionDoc.activeProgress = buildProgress(scenario);
  sessionDoc.awaitingContinue = false;
  sessionDoc.lastOutcome = null;
  sessionDoc.status = "in_progress";
  return sessionDoc;
}


export function buildLiveView(sessionDoc, scenario) {
  const progress = sessionDoc.activeProgress;
  const nodeMap = buildNodeMap(scenario);
  const currentNode = getRequiredNode(
    nodeMap,
    progress.currentNodeId,
    `scenario "${scenario.code || scenario.title}"`,
  );
  const testAttemptKey =
    sessionDoc._id?.toString() ||
    sessionDoc.startedAt?.getTime?.().toString() ||
    sessionDoc.startedAt?.toISOString?.() ||
    "";

  return {
    testAttemptKey,
    scenarioTitle: scenario.title,
    scenarioDescription: scenario.description || "",
    personaName: scenario.personaName,
    personaRole: scenario.personaRole,
    conversation: progress.conversation,
    options: (currentNode.options || []).map((option, index) => ({
      ...option,
      choiceKey: String.fromCharCode(65 + index),
    })),
    currentIndex: sessionDoc.currentScenarioIndex + 1,
    totalScenarios: sessionDoc.scenarioIds.length,
    stepsTaken: progress.stepsTaken,
  };
}


const READINESS_DIMENSIONS = [
  {
    key: "riskHandling",
    label: "Управление на риска",
    helperText: "Показва доколко решенията са ограничили риска при съмнителни заявки и потенциални атаки.",
    scenarioCodes: [
      "ceo-fraud-001",
      "ex-employee-001",
      "password-change-001",
      "fake-poll-001",
      "payroll-audit-001",
      "urgent-access-001",
      "personal-data-001",
      "ceo-fraud-002",
    ],
  },
  {
    key: "policyCompliance",
    label: "Спазване на политики",
    helperText: "Показва дали действията са извършени според вътрешните правила и през официалните канали.",
    scenarioCodes: [
      "ceo-fraud-001",
      "ex-employee-001",
      "password-change-001",
      "fake-poll-001",
      "payroll-audit-001",
      "urgent-access-001",
      "personal-data-001",
      "ceo-fraud-002",
    ],
  },
  {
    key: "resistanceToManipulation",
    label: "Устойчивост на манипулация",
    helperText: "Показва доколко потребителят устоява на натиск като спешност, авторитет и манипулативни заявки.",
    scenarioCodes: [
      "urgent-access-001",
      "personal-data-001",
      "password-change-001",
      "fake-poll-001",
      "payroll-audit-001",
    ],
  },
];

const SUSCEPTIBILITY_DIMENSIONS = [
  {
    key: "authority",
    label: "Авторитет",
    helperText: "Доколко заявки от авторитетни лица (мениджър, CEO, IT) влияят върху решенията.",
    scenarioCodes: [
      "ceo-fraud-001",
      "urgent-access-001",
      "personal-data-001",
      "ceo-fraud-002",
      "password-change-001",
      "payroll-audit-001",
    ],
  },
  {
    key: "urgency",
    label: "Спешност",
    helperText: "Доколко спешността води до действия без достатъчна проверка.",
    scenarioCodes: [
      "ceo-fraud-001",
      "ex-employee-001",
      "urgent-access-001",
      "personal-data-001",
      "ceo-fraud-002",
      "password-change-001",
      "payroll-audit-001",
    ],
  },
  {
    key: "pressure",
    label: "Натиск",
    helperText: "Чувствителност към настойчивост, повторни искания и емоционално пришпорване.",
    scenarioCodes: [
      "ceo-fraud-001",
      "ex-employee-001",
      "urgent-access-001",
      "personal-data-001",
      "ceo-fraud-002",
      "password-change-001",
      "fake-poll-001",
      "payroll-audit-001",
    ],
  },
  {
    key: "threat",
    label: "Заплаха",
    helperText: "Реакция на заплахи като одит, санкции или загуба на достъп.",
    scenarioCodes: [
      "urgent-access-001",
      "personal-data-001",
      "password-change-001",
      "payroll-audit-001",
    ],
  },
  {
    key: "fear",
    label: "Страх",
    helperText: "Доколко страхът от негативни последици влияе върху решенията.",
    scenarioCodes: [
      "urgent-access-001",
      "personal-data-001",
      "password-change-001",
      "payroll-audit-001",
    ],
  },
];

function roundScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}


function averageScores(scores) {
  if (!scores.length) {
    return null;
  }

  return roundScore(
    scores.reduce((total, score) => total + score, 0) / scores.length,
  );
}


function calculateScenarioSafety(item) {
  if (!item) {
    return 0;
  }

  if (!item.maxRisk) {
    return item.status === "success" ? 100 : 0;
  }

  return roundScore(100 - (item.riskIncurred / item.maxRisk) * 100);
}


function calculateScenarioCompliance(item) {
  return item?.status === "success" ? 100 : 0;
}


function calculateScenarioResistance(item) {
  return averageScores([
    calculateScenarioSafety(item),
    calculateScenarioCompliance(item),
  ]) || 0;
}


function calculateScenarioSusceptibility(item) {
  return roundScore(100 - calculateScenarioResistance(item));
}


function getScoreTone(score, direction = "positive") {
  if (score === null) {
    return "neutral";
  }

  if (direction === "positive") {
    if (score >= 80) {
      return "good";
    }

    if (score >= 60) {
      return "watch";
    }

    return "risk";
  }

  if (score >= 70) {
    return "risk";
  }

  if (score >= 40) {
    return "watch";
  }

  return "good";
}


function getScoreLabel(score, direction = "positive") {
  if (score === null) {
    return "No data yet";
  }

  if (direction === "positive") {
    if (score >= 85) {
      return "Strong";
    }

    if (score >= 70) {
      return "Stable";
    }

    if (score >= 55) {
      return "Watch";
    }

    return "At risk";
  }

  if (score >= 70) {
    return "High exposure";
  }

  if (score >= 40) {
    return "Elevated";
  }

  if (score >= 20) {
    return "Manageable";
  }

  return "Low exposure";
}


function buildMetric(
  dimension,
  answeredByCode,
  scoreBuilder,
  direction = "positive",
) {
  const answeredScenarios = dimension.scenarioCodes
    .map((code) => answeredByCode.get(code))
    .filter(Boolean);
  const score = averageScores(answeredScenarios.map(scoreBuilder));

  return {
    key: dimension.key,
    label: dimension.label,
    helperText: dimension.helperText,
    score,
    scoreTone: getScoreTone(score, direction),
  };
}


function getHighestMetric(metrics) {
  return metrics.reduce((bestMetric, metric) => {
    if (!bestMetric) {
      return metric;
    }

    const bestScore = bestMetric.score ?? -1;
    const metricScore = metric.score ?? -1;
    return metricScore > bestScore ? metric : bestMetric;
  }, null);
}


function buildKeyHighlight(readinessMetrics) {
  const strongestReadinessMetric = getHighestMetric(readinessMetrics);

  if (!strongestReadinessMetric || strongestReadinessMetric.score === null) {
    return {
      eyebrow: "Positive highlight",
      title: "Добър резултат",
      text: "Текущият тест показва стабилно представяне и добра основа за следващите симулации.",
      tone: "watch",
    };
  }

  return {
    eyebrow: "Positive highlight",
    title: "Поздравления!",
    text: `Най-силната ти метрика е ${strongestReadinessMetric.label} с ${strongestReadinessMetric.score}/100.`,
    tone: strongestReadinessMetric.scoreTone,
  };
}


export function calculateReport(sessionDoc, passThreshold) {
  const totalScenarios = sessionDoc.scenarioIds.length;
  const correctAnswers = sessionDoc.correctAnswers;
  const successRatio = totalScenarios ? correctAnswers / totalScenarios : 0;
  const totalMaxRisk = sessionDoc.totalMaxRisk || 0;
  const totalRiskIncurred = sessionDoc.totalRiskIncurred || 0;
  const answeredByCode = new Map(
    (sessionDoc.answeredScenarios || []).map((scenario) => [
      scenario.scenarioCode,
      scenario,
    ]),
  );
  const riskPercentage = totalMaxRisk
    ? Number(((totalRiskIncurred / totalMaxRisk) * 100).toFixed(1))
    : 0;
  const readinessMetrics = [
    buildMetric(
      READINESS_DIMENSIONS[0],
      answeredByCode,
      calculateScenarioSafety,
    ),
    buildMetric(
      READINESS_DIMENSIONS[1],
      answeredByCode,
      calculateScenarioCompliance,
    ),
    buildMetric(
      READINESS_DIMENSIONS[2],
      answeredByCode,
      calculateScenarioResistance,
    ),
  ];
  const susceptibilityMetrics = SUSCEPTIBILITY_DIMENSIONS.map((dimension) =>
    buildMetric(
      dimension,
      answeredByCode,
      calculateScenarioSusceptibility,
      "negative",
    ),
  );
  const overallReadinessScore = averageScores(
    readinessMetrics.map((metric) => metric.score).filter((score) => score !== null),
  );
  const overallReadinessLabel = getScoreLabel(overallReadinessScore, "positive");
  const overallReadinessTone = getScoreTone(overallReadinessScore, "positive");
  const keyHighlight = buildKeyHighlight(readinessMetrics);

  return {
    totalScenarios,
    correctAnswers,
    incorrectAnswers: Math.max(totalScenarios - correctAnswers, 0),
    successRatio: Number((successRatio * 100).toFixed(1)),
    riskPercentage,
    passed: successRatio >= passThreshold,
    passThreshold: Number((passThreshold * 100).toFixed(1)),
    overallReadinessScore,
    overallReadinessLabel,
    overallReadinessTone,
    readinessMetrics,
    susceptibilityMetrics,
    keyHighlight,
  };
}


export function advanceWithOption(sessionDoc, scenario, optionId) {
  const progress = cloneProgress(sessionDoc.activeProgress);
  const nodeMap = buildNodeMap(scenario);
  const currentNode = getRequiredNode(
    nodeMap,
    progress.currentNodeId,
    `scenario "${scenario.code || scenario.title}"`,
  );
  const selectedOption = (currentNode.options || []).find(
    (option) => option.id === optionId,
  );

  if (!selectedOption) {
    throw new Error("Invalid option selected.");
  }

  progress.selectedOptionIds.push(optionId);
  progress.stepsTaken += 1;
  progress.riskIncurred = Math.min(
    progress.riskIncurred + Number(selectedOption.riskDelta || 0),
    Number(scenario.riskWeight || 0),
  );
  progress.conversation.push(
    ...toMessages("You", selectedOption.meMessages, "outgoing"),
  );

  if (selectedOption.nextNodeId) {
    const nextNode = getRequiredNode(
      nodeMap,
      selectedOption.nextNodeId,
      `scenario "${scenario.code || scenario.title}"`,
    );
    progress.currentNodeId = nextNode.id;
    progress.conversation.push(
      ...toMessages(nextNode.speaker, nextNode.messages, "incoming"),
    );
    sessionDoc.activeProgress = progress;
    return sessionDoc;
  }

  const normalizedStatus = selectedOption.outcome === "success" ? "success" : "failed";
  const result = {
    scenarioId: scenario._id,
    scenarioCode: scenario.code,
    scenarioTitle: scenario.title,
    personaName: scenario.personaName,
    personaRole: scenario.personaRole,
    status: normalizedStatus,
    feedbackKind:
      selectedOption.feedbackKind ||
      (normalizedStatus === "success" ? "success" : "fail"),
    feedbackTitle:
      selectedOption.feedbackTitle ||
      (normalizedStatus === "success" ? "SUCCESS" : "FAILED"),
    feedbackText: selectedOption.feedbackText || "",
    selectedOptionIds: progress.selectedOptionIds,
    stepsTaken: progress.stepsTaken,
    riskIncurred: progress.riskIncurred,
    maxRisk: Number(scenario.riskWeight || 0),
    conversation: progress.conversation,
    finishedAt: new Date(),
  };

  sessionDoc.answeredScenarios.push(result);
  sessionDoc.totalRiskIncurred += result.riskIncurred;
  sessionDoc.correctAnswers += normalizedStatus === "success" ? 1 : 0;
  sessionDoc.currentScenarioIndex += 1;
  sessionDoc.awaitingContinue = true;
  sessionDoc.lastOutcome = result;
  sessionDoc.activeProgress = null;

  if (sessionDoc.currentScenarioIndex >= sessionDoc.scenarioIds.length) {
    sessionDoc.status = "completed";
    sessionDoc.finishedAt = new Date();
  }

  return sessionDoc;
}
