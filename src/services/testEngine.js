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

  return {
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


export function calculateReport(sessionDoc, passThreshold) {
  const totalScenarios = sessionDoc.scenarioIds.length;
  const correctAnswers = sessionDoc.correctAnswers;
  const successRatio = totalScenarios ? correctAnswers / totalScenarios : 0;
  const totalMaxRisk = sessionDoc.totalMaxRisk || 0;
  const totalRiskIncurred = sessionDoc.totalRiskIncurred || 0;
  const riskPercentage = totalMaxRisk
    ? Number(((totalRiskIncurred / totalMaxRisk) * 100).toFixed(1))
    : 0;

  return {
    totalScenarios,
    correctAnswers,
    incorrectAnswers: Math.max(totalScenarios - correctAnswers, 0),
    successRatio: Number((successRatio * 100).toFixed(1)),
    riskPercentage,
    passed: successRatio >= passThreshold,
    passThreshold: Number((passThreshold * 100).toFixed(1)),
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
