import { createHash } from "node:crypto";
import { logLLMExecution } from "./logger";
import { HttpError, type VehicleInput } from "./types";
import { readRuntimeMockResponse } from "./runtime-assets";
const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";

interface ClaudeMessageResponse {
  id: string;
  stop_reason: string | null;
  content: ClaudeContentBlock[];
}

interface ClaudeContentBlock {
  type: string;
  text?: string;
  citations?: Array<{ url?: string }>;
  [key: string]: unknown;
}

type ClaudeRole = "user" | "assistant";

interface ClaudeMessage {
  role: ClaudeRole;
  content: string | ClaudeContentBlock[];
}

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterChatCompletionResponse {
  id?: string;
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      role?: string;
      content?: unknown;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  usage?: Record<string, unknown>;
  [key: string]: unknown;
}

interface FonteUtilizadaCandidate {
  id: string;
  url: string;
  titulo: string;
  tipo: string;
}

interface RoutingMetrics {
  total: number;
  preenchidas: number;
  coverageRate: number;
  unresolvedPaths: string[];
  unresolvedCount: number;
  naoEncontradas: number;
  naoAplicaveis: number;
  conflitantes: number;
  conflictPaths: string[];
  missingPaths: string[];
}

interface ClaudePassBudget {
  maxTokens: number;
  maxUses: number;
  maxTurns: number;
}

interface OpenRouterPassBudget {
  maxTokens: number;
  maxTurns: number;
  maxSearchCalls: number;
  maxResults: number;
  maxTotalResults: number;
  contextSize: "low" | "medium" | "high";
}

interface FollowupCompactionConfig {
  maxTextChars: number;
}

interface RouterConfig {
  enabled: boolean;
  minCoverageRate: number;
  maxUnresolved: number;
  maxNaoEncontradas: number;
  maxConflitantes: number;
  maxRefinePasses: number;
  maxConflictPasses: number;
  unresolvedListLimit: number;
}

interface RouterAttempts {
  refine: number;
  conflict: number;
}

interface RouterDecision {
  done: boolean;
  nextPass: "refine" | "conflict_resolver" | null;
  reason: string;
}

export async function callLLM(
  finalPrompt: string,
  vehicle: VehicleInput,
): Promise<unknown> {
  const provider = (process.env.LLM_PROVIDER ?? "simulated").toLowerCase();
  const allowFallback =
    (process.env.LLM_FALLBACK_TO_MOCK ?? "false").toLowerCase() === "true";

  try {
    if (provider === "claude") {
      return await callClaudeLLM(finalPrompt, vehicle);
    }

    if (provider === "openrouter") {
      return await callOpenRouterLLM(finalPrompt, vehicle);
    }

    return callLLMSimulated(finalPrompt, vehicle);
  } catch (error) {
    if (allowFallback) {
      return callLLMSimulated(finalPrompt, vehicle);
    }
    throw error;
  }
}

export async function callLLMSimulated(
  _finalPrompt: string,
  vehicle: VehicleInput,
): Promise<unknown> {
  const parsedResponse = await readRuntimeMockResponse();

  // Clone to avoid mutating the in-memory parsed object across requests.
  const responseClone = JSON.parse(JSON.stringify(parsedResponse)) as Record<
    string,
    unknown
  >;

  injectVehicleData(responseClone, vehicle);

  return responseClone;
}

async function callOpenRouterLLM(
  finalPrompt: string,
  vehicle: VehicleInput,
): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new HttpError(
      500,
      "OPENROUTER_API_KEY nao configurada. Defina OPENROUTER_API_KEY para usar OpenRouter/Gemini.",
    );
  }

  const model = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";
  const openRouterGeminiLoopGuardEnabled = parseBooleanEnv(
    "OPENROUTER_GEMINI_TOOL_LOOP_GUARD_ENABLED",
    true,
  );
  const maxTokens = Number(process.env.OPENROUTER_MAX_TOKENS ?? 6000);
  const maxTurns = Number(process.env.OPENROUTER_MAX_TURNS ?? 2);
  const webSearchMaxUses = Number(
    process.env.OPENROUTER_WEB_SEARCH_MAX_USES ?? 2,
  );
  const requireWebSearch = parseBooleanEnv(
    "OPENROUTER_REQUIRE_WEB_SEARCH",
    true,
  );
  const enforceRealSources = parseBooleanEnv(
    "OPENROUTER_ENFORCE_REAL_SOURCES",
    true,
  );
  const requireObservedSources = parseBooleanEnv(
    "OPENROUTER_REQUIRE_OBSERVED_SOURCE_MATCH",
    false,
  );
  const sourceProbeTimeoutMs = Number(
    process.env.OPENROUTER_SOURCE_PROBE_TIMEOUT_MS ?? 8000,
  );
  const useJsonResponseFormat = parseBooleanEnv(
    "OPENROUTER_USE_JSON_RESPONSE_FORMAT",
    true,
  );
  const webSearchEngine =
    process.env.OPENROUTER_WEB_SEARCH_ENGINE?.trim() || undefined;
  const webSearchContextSize = parseOpenRouterContextSize(
    process.env.OPENROUTER_WEB_SEARCH_CONTEXT_SIZE,
  );
  const webSearchMaxResults = Math.max(
    1,
    parseNumberEnv("OPENROUTER_WEB_SEARCH_MAX_RESULTS", 5),
  );
  const webSearchMaxTotalResultsDefault = Math.max(
    webSearchMaxResults,
    Math.min(
      parseNumberEnv("OPENROUTER_WEB_SEARCH_MAX_TOTAL_RESULTS", 20),
      webSearchMaxResults * Math.max(1, webSearchMaxUses),
    ),
  );
  const quickMaxTokens = Math.min(
    maxTokens,
    Math.max(1500, parseNumberEnv("OPENROUTER_QUICK_MAX_TOKENS", 3200)),
  );
  const quickMaxTurns = Math.min(
    maxTurns,
    Math.max(1, parseNumberEnv("OPENROUTER_QUICK_MAX_TURNS", 1)),
  );
  const quickMaxUses = Math.min(
    webSearchMaxUses,
    Math.max(1, parseNumberEnv("OPENROUTER_QUICK_WEB_SEARCH_MAX_USES", 1)),
  );
  const quickMaxResults = Math.max(
    1,
    parseNumberEnv(
      "OPENROUTER_QUICK_WEB_SEARCH_MAX_RESULTS",
      Math.min(3, webSearchMaxResults),
    ),
  );
  const quickMaxTotalResults = Math.max(
    quickMaxResults,
    Math.min(
      parseNumberEnv(
        "OPENROUTER_QUICK_WEB_SEARCH_MAX_TOTAL_RESULTS",
        quickMaxResults * quickMaxUses,
      ),
      quickMaxResults * Math.max(1, quickMaxUses),
    ),
  );
  const refineEnabled = parseBooleanEnv("OPENROUTER_REFINE_ENABLED", true);
  const coverageTarget = parseNumberEnv("OPENROUTER_COVERAGE_TARGET", 0.7);
  const unresolvedTarget = Math.max(
    0,
    parseNumberEnv("OPENROUTER_UNRESOLVED_TARGET", 60),
  );
  const unresolvedListLimit = Math.max(
    10,
    parseNumberEnv("OPENROUTER_UNRESOLVED_LIST_LIMIT", 50),
  );
  const routerConfig: RouterConfig = {
    enabled: parseBooleanEnv("OPENROUTER_ROUTER_ENABLED", true),
    minCoverageRate: normalizeRate(
      parseNumberEnv("OPENROUTER_ROUTER_MIN_COVERAGE", coverageTarget),
    ),
    maxUnresolved: Math.max(
      0,
      parseNumberEnv("OPENROUTER_ROUTER_MAX_UNRESOLVED", unresolvedTarget),
    ),
    maxNaoEncontradas: Math.max(
      0,
      parseNumberEnv("OPENROUTER_ROUTER_MAX_NAO_ENCONTRADAS", unresolvedTarget),
    ),
    maxConflitantes: Math.max(
      0,
      parseNumberEnv("OPENROUTER_ROUTER_MAX_CONFLITANTES", 1),
    ),
    maxRefinePasses: Math.max(
      0,
      parseNumberEnv(
        "OPENROUTER_ROUTER_MAX_REFINE_PASSES",
        refineEnabled ? 1 : 0,
      ),
    ),
    maxConflictPasses: Math.max(
      0,
      parseNumberEnv("OPENROUTER_ROUTER_MAX_CONFLICT_PASSES", 0),
    ),
    unresolvedListLimit: Math.max(
      10,
      parseNumberEnv(
        "OPENROUTER_ROUTER_UNRESOLVED_LIST_LIMIT",
        unresolvedListLimit,
      ),
    ),
  };
  const quickBudget: OpenRouterPassBudget = {
    maxTokens: quickMaxTokens,
    maxTurns: quickMaxTurns,
    maxSearchCalls: quickMaxUses,
    maxResults: quickMaxResults,
    maxTotalResults: quickMaxTotalResults,
    contextSize: webSearchContextSize,
  };
  const refineBudget: OpenRouterPassBudget = {
    maxTokens,
    maxTurns,
    maxSearchCalls: webSearchMaxUses,
    maxResults: webSearchMaxResults,
    maxTotalResults: webSearchMaxTotalResultsDefault,
    contextSize: webSearchContextSize,
  };
  const allowedDomains = parseCsvEnv("OPENROUTER_ALLOWED_DOMAINS");
  const blockedDomains = parseCsvEnv("OPENROUTER_BLOCKED_DOMAINS");
  const appTitle = process.env.OPENROUTER_APP_TITLE?.trim() || undefined;
  const httpReferer = process.env.OPENROUTER_HTTP_REFERER?.trim() || undefined;
  if (allowedDomains.length > 0 && blockedDomains.length > 0) {
    throw new HttpError(
      500,
      "Use apenas OPENROUTER_ALLOWED_DOMAINS ou OPENROUTER_BLOCKED_DOMAINS, nunca ambos.",
    );
  }

  const executionId = createExecutionId("openrouter");
  const startedAt = new Date().toISOString();
  const promptSha256 = createHash("sha256").update(finalPrompt).digest("hex");

  const turns: unknown[] = [];
  let result: unknown | undefined;
  let executionError: unknown;

  try {
    const firstPass = await runOpenRouterPass({
      prompt: finalPrompt,
      passName: "quick",
      apiKey,
      model,
      budget: quickBudget,
      market: vehicle.mercado,
      requireWebSearch,
      enforceRealSources,
      requireObservedSources,
      sourceProbeTimeoutMs,
      allowedDomains,
      blockedDomains,
      appTitle,
      httpReferer,
      useJsonResponseFormat,
      webSearchEngine,
      geminiToolLoopGuardEnabled: openRouterGeminiLoopGuardEnabled,
      turns,
    });
    result = firstPass.result;
    let bestMetrics = calculateRoutingMetrics(result);
    const attempts: RouterAttempts = {
      refine: 0,
      conflict: 0,
    };

    if (routerConfig.enabled) {
      for (
        let step = 0;
        step <
        routerConfig.maxRefinePasses + routerConfig.maxConflictPasses + 1;
        step += 1
      ) {
        const decision = decideRouterNextPass(
          bestMetrics,
          routerConfig,
          attempts,
        );
        turns.push({
          pass: "router",
          step,
          metrics: {
            total: bestMetrics.total,
            preenchidas: bestMetrics.preenchidas,
            coverageRate: Number(bestMetrics.coverageRate.toFixed(4)),
            unresolvedCount: bestMetrics.unresolvedCount,
            naoEncontradas: bestMetrics.naoEncontradas,
            naoAplicaveis: bestMetrics.naoAplicaveis,
            conflitantes: bestMetrics.conflitantes,
          },
          decision,
        });

        if (decision.done || !decision.nextPass) {
          break;
        }

        const passPrompt =
          decision.nextPass === "refine"
            ? buildOpenRouterRefinePrompt(
                finalPrompt,
                bestMetrics,
                routerConfig.unresolvedListLimit,
              )
            : buildOpenRouterConflictPrompt(
                finalPrompt,
                bestMetrics,
                routerConfig.unresolvedListLimit,
              );

        const nextPass = await runOpenRouterPass({
          prompt: passPrompt,
          passName: decision.nextPass,
          apiKey,
          model,
          budget: refineBudget,
          market: vehicle.mercado,
          requireWebSearch,
          enforceRealSources,
          requireObservedSources,
          sourceProbeTimeoutMs,
          allowedDomains,
          blockedDomains,
          appTitle,
          httpReferer,
          useJsonResponseFormat,
          webSearchEngine,
          geminiToolLoopGuardEnabled: openRouterGeminiLoopGuardEnabled,
          turns,
        });

        if (decision.nextPass === "refine") {
          attempts.refine += 1;
        } else if (decision.nextPass === "conflict_resolver") {
          attempts.conflict += 1;
        }

        const nextMetrics = calculateRoutingMetrics(nextPass.result);
        const bestScore = calculateRouterScore(bestMetrics);
        const nextScore = calculateRouterScore(nextMetrics);
        if (nextScore >= bestScore) {
          result = nextPass.result;
          bestMetrics = nextMetrics;
        }
      }
    } else if (
      refineEnabled &&
      bestMetrics.total > 0 &&
      (bestMetrics.coverageRate < normalizeRate(coverageTarget) ||
        bestMetrics.unresolvedCount > unresolvedTarget)
    ) {
      const refinePrompt = buildOpenRouterRefinePrompt(
        finalPrompt,
        bestMetrics,
        unresolvedListLimit,
      );
      const secondPass = await runOpenRouterPass({
        prompt: refinePrompt,
        passName: "refine",
        apiKey,
        model,
        budget: refineBudget,
        market: vehicle.mercado,
        requireWebSearch,
        enforceRealSources,
        requireObservedSources,
        sourceProbeTimeoutMs,
        allowedDomains,
        blockedDomains,
        appTitle,
        httpReferer,
        useJsonResponseFormat,
        webSearchEngine,
        geminiToolLoopGuardEnabled: openRouterGeminiLoopGuardEnabled,
        turns,
      });
      const refinedMetrics = calculateRoutingMetrics(secondPass.result);
      if (
        calculateRouterScore(refinedMetrics) >=
        calculateRouterScore(bestMetrics)
      ) {
        result = secondPass.result;
        bestMetrics = refinedMetrics;
      }
    }

    if (result === undefined || bestMetrics.total === 0) {
      throw new HttpError(
        502,
        "OpenRouter excedeu o numero maximo de turnos sem retornar JSON final valido.",
      );
    }
  } catch (error) {
    executionError = error;
  }

  const finishedAt = new Date().toISOString();
  try {
    await logLLMExecution({
      executionId,
      startedAt,
      finishedAt,
      vehicle,
      model,
      maxTurns,
      provider: "openrouter",
      promptSha256,
      finalPromptPreview: finalPrompt.slice(0, 3000),
      turns,
      result,
      error: executionError
        ? {
            message:
              executionError instanceof Error
                ? executionError.message
                : String(executionError),
            details:
              executionError instanceof HttpError
                ? executionError.details
                : undefined,
          }
        : undefined,
    });
  } catch (logError) {
    console.warn("Falha ao salvar log de execucao do OpenRouter:", logError);
  }

  if (executionError) {
    throw executionError;
  }

  return result;
}

async function runOpenRouterPass(params: {
  prompt: string;
  passName: "quick" | "refine" | "conflict_resolver";
  apiKey: string;
  model: string;
  budget: OpenRouterPassBudget;
  market: string;
  requireWebSearch: boolean;
  enforceRealSources: boolean;
  requireObservedSources: boolean;
  sourceProbeTimeoutMs: number;
  allowedDomains: string[];
  blockedDomains: string[];
  appTitle: string | undefined;
  httpReferer: string | undefined;
  useJsonResponseFormat: boolean;
  webSearchEngine: string | undefined;
  geminiToolLoopGuardEnabled: boolean;
  turns: unknown[];
}): Promise<{ result: unknown }> {
  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: buildOpenRouterSystemPrompt(),
    },
    {
      role: "user",
      content: params.prompt,
    },
  ];

  const observedSourceUrls = new Set<string>();
  // OpenRouter/Gemini-only safeguard:
  // This guard is exclusive to OpenRouter + Gemini models and never runs in Claude flow.
  // It avoids loops where the model keeps returning only `tool_calls` and never emits final JSON.
  const isGeminiModel = params.model.toLowerCase().includes("gemini");
  const geminiLoopGuardActive =
    params.geminiToolLoopGuardEnabled && isGeminiModel;
  let consecutiveToolOnlyTurns = 0;
  let forceToolOptionalNextTurn = false;

  for (let turn = 0; turn < params.budget.maxTurns; turn += 1) {
    const shouldForceToolUse =
      params.requireWebSearch &&
      !(geminiLoopGuardActive && forceToolOptionalNextTurn) &&
      observedSourceUrls.size === 0;
    const requestBody: Record<string, unknown> = {
      model: params.model,
      messages,
      temperature: 0,
      max_tokens: params.budget.maxTokens,
      tools: [
        buildOpenRouterWebSearchToolConfig({
          maxSearchCalls: params.budget.maxSearchCalls,
          allowedDomains: params.allowedDomains,
          blockedDomains: params.blockedDomains,
          engine: params.webSearchEngine,
          contextSize: params.budget.contextSize,
          maxResults: params.budget.maxResults,
          maxTotalResults: params.budget.maxTotalResults,
          market: params.market,
        }),
      ],
    };

    if (params.useJsonResponseFormat) {
      requestBody.response_format = { type: "json_object" };
    }

    if (params.requireWebSearch) {
      requestBody.tool_choice = shouldForceToolUse ? "required" : "auto";
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    };

    if (params.httpReferer) {
      headers["HTTP-Referer"] = params.httpReferer;
    }
    if (params.appTitle) {
      headers["X-Title"] = params.appTitle;
    }

    const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await safeJson(response);
      params.turns.push({
        pass: params.passName,
        turn,
        httpStatus: response.status,
        error: errorBody,
      });
      throw new HttpError(502, "Falha ao chamar a API do OpenRouter.", {
        status: response.status,
        openRouterError: errorBody,
      });
    }

    const openRouterResponse =
      (await response.json()) as OpenRouterChatCompletionResponse;
    for (const url of extractObservedSourceUrlsFromOpenRouterResponse(
      openRouterResponse,
    )) {
      observedSourceUrls.add(url);
    }

    params.turns.push({
      pass: params.passName,
      turn,
      response: openRouterResponse,
      toolChoiceMode: params.requireWebSearch
        ? shouldForceToolUse
          ? "required"
          : "auto"
        : "disabled",
    });

    const finishReason =
      openRouterResponse?.choices?.[0]?.finish_reason ?? null;
    const textOutput = extractOpenRouterTextOutput(openRouterResponse);
    if (!textOutput) {
      if (geminiLoopGuardActive && finishReason === "tool_calls") {
        consecutiveToolOnlyTurns += 1;
      } else {
        consecutiveToolOnlyTurns = 0;
      }

      if (geminiLoopGuardActive && consecutiveToolOnlyTurns >= 2) {
        forceToolOptionalNextTurn = true;
        messages.push({
          role: "user",
          content:
            "Finalize agora sem chamar novas ferramentas. Retorne APENAS o JSON completo e valido no OUTPUT_SCHEMA_JSON, usando as evidencias ja coletadas.",
        });
      } else {
        messages.push({
          role: "user",
          content: "Return only valid JSON according to OUTPUT_SCHEMA_JSON.",
        });
      }

      continue;
    }
    consecutiveToolOnlyTurns = 0;
    if (geminiLoopGuardActive) {
      forceToolOptionalNextTurn = false;
    }

    let parsedResult: unknown;
    try {
      parsedResult = parseJsonFromText(textOutput);
    } catch {
      messages.push({
        role: "assistant",
        content: truncateText(textOutput, 2000),
      });
      messages.push({
        role: "user",
        content:
          "Sua resposta nao estava em JSON valido. Retorne novamente APENAS o JSON completo e valido no schema. Regras obrigatorias: status nao_aplicavel => valor null; status nao_encontrado => valor null + obs_ref NF1; status confirmado/parcial/inferido_minimamente/conflitante exigem fonte_ref.",
      });
      continue;
    }

    if (
      params.requireWebSearch &&
      countWebSearchRequestsFromResponse(openRouterResponse) <= 0 &&
      observedSourceUrls.size <= 0
    ) {
      messages.push({
        role: "assistant",
        content: truncateText(textOutput, 2000),
      });
      messages.push({
        role: "user",
        content:
          "Voce precisa usar web search nesta resposta. Refaça com busca web real e retorne apenas JSON valido.",
      });
      continue;
    }

    if (params.enforceRealSources) {
      await enforceAuthenticSources({
        responsePayload: parsedResult,
        observedSourceUrls,
        allowedDomains: params.allowedDomains,
        blockedDomains: params.blockedDomains,
        requireObservedSources: params.requireObservedSources,
        timeoutMs: params.sourceProbeTimeoutMs,
      });
    }

    return { result: parsedResult };
  }

  throw new HttpError(
    502,
    `OpenRouter (${params.passName}) excedeu o numero maximo de turnos.`,
  );
}

async function callClaudeLLM(
  finalPrompt: string,
  vehicle: VehicleInput,
): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new HttpError(
      500,
      "ANTHROPIC_API_KEY nao configurada. Defina ANTHROPIC_API_KEY para usar o Claude.",
    );
  }

  const model = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5";
  const webToolType =
    process.env.CLAUDE_WEB_SEARCH_TOOL_TYPE ?? "web_search_20250305";
  const maxTokens = Number(process.env.CLAUDE_MAX_TOKENS ?? 16384);
  const maxUses = Number(process.env.CLAUDE_WEB_SEARCH_MAX_USES ?? 3);
  const maxTurns = Number(process.env.CLAUDE_MAX_TURNS ?? 6);
  const requireWebSearch = parseBooleanEnv("CLAUDE_REQUIRE_WEB_SEARCH", true);
  const enforceRealSources = parseBooleanEnv(
    "CLAUDE_ENFORCE_REAL_SOURCES",
    true,
  );
  const requireObservedSources = parseBooleanEnv(
    "CLAUDE_REQUIRE_OBSERVED_SOURCE_MATCH",
    false,
  );
  const sourceProbeTimeoutMs = Number(
    process.env.CLAUDE_SOURCE_PROBE_TIMEOUT_MS ?? 8000,
  );
  const refineEnabled = parseBooleanEnv("CLAUDE_REFINE_ENABLED", true);
  const coverageTarget = parseNumberEnv("CLAUDE_COVERAGE_TARGET", 0.75);
  const unresolvedTarget = Math.max(
    0,
    parseNumberEnv("CLAUDE_UNRESOLVED_TARGET", 25),
  );
  const unresolvedListLimit = Math.max(
    10,
    parseNumberEnv("CLAUDE_UNRESOLVED_LIST_LIMIT", 80),
  );
  const routerConfig: RouterConfig = {
    enabled: parseBooleanEnv("CLAUDE_ROUTER_ENABLED", true),
    minCoverageRate: normalizeRate(
      parseNumberEnv("CLAUDE_ROUTER_MIN_COVERAGE", coverageTarget),
    ),
    maxUnresolved: Math.max(
      0,
      parseNumberEnv("CLAUDE_ROUTER_MAX_UNRESOLVED", unresolvedTarget),
    ),
    maxNaoEncontradas: Math.max(
      0,
      parseNumberEnv("CLAUDE_ROUTER_MAX_NAO_ENCONTRADAS", unresolvedTarget),
    ),
    maxConflitantes: Math.max(
      0,
      parseNumberEnv("CLAUDE_ROUTER_MAX_CONFLITANTES", 0),
    ),
    maxRefinePasses: Math.max(
      0,
      parseNumberEnv("CLAUDE_ROUTER_MAX_REFINE_PASSES", refineEnabled ? 1 : 0),
    ),
    maxConflictPasses: Math.max(
      0,
      parseNumberEnv("CLAUDE_ROUTER_MAX_CONFLICT_PASSES", 1),
    ),
    unresolvedListLimit: Math.max(
      10,
      parseNumberEnv(
        "CLAUDE_ROUTER_UNRESOLVED_LIST_LIMIT",
        unresolvedListLimit,
      ),
    ),
  };
  const followupCompaction: FollowupCompactionConfig = {
    maxTextChars: Math.max(
      1200,
      parseNumberEnv("CLAUDE_FOLLOWUP_MAX_TEXT_CHARS", 12000),
    ),
  };
  const quickBudget: ClaudePassBudget = {
    maxTokens: Math.min(
      maxTokens,
      Math.max(2048, parseNumberEnv("CLAUDE_QUICK_MAX_TOKENS", 7000)),
    ),
    maxUses: Math.min(
      maxUses,
      Math.max(1, parseNumberEnv("CLAUDE_QUICK_WEB_SEARCH_MAX_USES", 2)),
    ),
    maxTurns: Math.min(
      maxTurns,
      Math.max(1, parseNumberEnv("CLAUDE_QUICK_MAX_TURNS", 3)),
    ),
  };
  const refineBudget: ClaudePassBudget = {
    maxTokens: maxTokens,
    maxUses: maxUses,
    maxTurns: maxTurns,
  };
  const betaHeader = process.env.CLAUDE_BETA_HEADER;
  const allowedDomains = parseCsvEnv("CLAUDE_ALLOWED_DOMAINS");
  const blockedDomains = parseCsvEnv("CLAUDE_BLOCKED_DOMAINS");
  if (allowedDomains.length > 0 && blockedDomains.length > 0) {
    throw new HttpError(
      500,
      "Use apenas CLAUDE_ALLOWED_DOMAINS ou CLAUDE_BLOCKED_DOMAINS, nunca ambos.",
    );
  }
  const executionId = createExecutionId();
  const startedAt = new Date().toISOString();
  const promptSha256 = createHash("sha256").update(finalPrompt).digest("hex");

  const turns: unknown[] = [];
  let result: unknown | undefined;
  let executionError: unknown;

  try {
    const firstPass = await runClaudePass({
      prompt: finalPrompt,
      passName: "quick",
      budget: quickBudget,
      apiKey,
      model,
      webToolType,
      betaHeader,
      vehicle,
      requireWebSearch,
      enforceRealSources,
      requireObservedSources,
      sourceProbeTimeoutMs,
      allowedDomains,
      blockedDomains,
      followupCompaction,
      turns,
    });

    result = firstPass.result;
    let bestMetrics = calculateRoutingMetrics(result);
    const attempts: RouterAttempts = {
      refine: 0,
      conflict: 0,
    };

    if (routerConfig.enabled) {
      for (
        let step = 0;
        step <
        routerConfig.maxRefinePasses + routerConfig.maxConflictPasses + 1;
        step += 1
      ) {
        const decision = decideRouterNextPass(
          bestMetrics,
          routerConfig,
          attempts,
        );
        turns.push({
          pass: "router",
          step,
          metrics: {
            total: bestMetrics.total,
            preenchidas: bestMetrics.preenchidas,
            coverageRate: Number(bestMetrics.coverageRate.toFixed(4)),
            unresolvedCount: bestMetrics.unresolvedCount,
            naoEncontradas: bestMetrics.naoEncontradas,
            naoAplicaveis: bestMetrics.naoAplicaveis,
            conflitantes: bestMetrics.conflitantes,
          },
          decision,
        });

        if (decision.done || !decision.nextPass) {
          break;
        }

        const passPrompt =
          decision.nextPass === "refine"
            ? buildRefinePrompt(
                finalPrompt,
                bestMetrics,
                routerConfig.unresolvedListLimit,
              )
            : buildConflictResolutionPrompt(
                finalPrompt,
                bestMetrics,
                routerConfig.unresolvedListLimit,
              );

        const nextPass = await runClaudePass({
          prompt: passPrompt,
          passName: decision.nextPass,
          budget: refineBudget,
          apiKey,
          model,
          webToolType,
          betaHeader,
          vehicle,
          requireWebSearch,
          enforceRealSources,
          requireObservedSources,
          sourceProbeTimeoutMs,
          allowedDomains,
          blockedDomains,
          followupCompaction,
          turns,
        });

        if (decision.nextPass === "refine") {
          attempts.refine += 1;
        } else if (decision.nextPass === "conflict_resolver") {
          attempts.conflict += 1;
        }

        const nextMetrics = calculateRoutingMetrics(nextPass.result);
        const bestScore = calculateRouterScore(bestMetrics);
        const nextScore = calculateRouterScore(nextMetrics);
        if (nextScore >= bestScore) {
          result = nextPass.result;
          bestMetrics = nextMetrics;
        }
      }
    } else if (
      refineEnabled &&
      bestMetrics.total > 0 &&
      (bestMetrics.coverageRate < coverageTarget ||
        bestMetrics.unresolvedCount > unresolvedTarget)
    ) {
      const refinePrompt = buildRefinePrompt(
        finalPrompt,
        bestMetrics,
        unresolvedListLimit,
      );
      const secondPass = await runClaudePass({
        prompt: refinePrompt,
        passName: "refine",
        budget: refineBudget,
        apiKey,
        model,
        webToolType,
        betaHeader,
        vehicle,
        requireWebSearch,
        enforceRealSources,
        requireObservedSources,
        sourceProbeTimeoutMs,
        allowedDomains,
        blockedDomains,
        followupCompaction,
        turns,
      });
      const refinedMetrics = calculateRoutingMetrics(secondPass.result);
      if (
        calculateRouterScore(refinedMetrics) >=
        calculateRouterScore(bestMetrics)
      ) {
        result = secondPass.result;
        bestMetrics = refinedMetrics;
      }
    }

    if (result === undefined || bestMetrics.total === 0) {
      throw new HttpError(
        502,
        "Claude excedeu o numero maximo de turnos sem retornar JSON final valido.",
      );
    }
  } catch (error) {
    executionError = error;
  }

  const finishedAt = new Date().toISOString();
  try {
    await logLLMExecution({
      executionId,
      startedAt,
      finishedAt,
      vehicle,
      model,
      maxTurns,
      provider: "claude",
      promptSha256,
      finalPromptPreview: finalPrompt.slice(0, 3000),
      turns,
      result,
      error: executionError
        ? {
            message:
              executionError instanceof Error
                ? executionError.message
                : String(executionError),
            details:
              executionError instanceof HttpError
                ? executionError.details
                : undefined,
          }
        : undefined,
    });
  } catch (logError) {
    console.warn("Falha ao salvar log de execucao do Claude:", logError);
  }

  if (executionError) {
    throw executionError;
  }

  return result;
}

async function runClaudePass(params: {
  prompt: string;
  passName: "quick" | "refine" | "conflict_resolver";
  budget: ClaudePassBudget;
  apiKey: string;
  model: string;
  webToolType: string;
  betaHeader: string | undefined;
  vehicle: VehicleInput;
  requireWebSearch: boolean;
  enforceRealSources: boolean;
  requireObservedSources: boolean;
  sourceProbeTimeoutMs: number;
  allowedDomains: string[];
  blockedDomains: string[];
  followupCompaction: FollowupCompactionConfig;
  turns: unknown[];
}): Promise<{ result: unknown }> {
  const messages: ClaudeMessage[] = [
    {
      role: "user",
      content: params.prompt,
    },
  ];

  const observedSourceUrls = new Set<string>();

  for (let turn = 0; turn < params.budget.maxTurns; turn += 1) {
    const requestBody: Record<string, unknown> = {
      model: params.model,
      max_tokens: params.budget.maxTokens,
      system: buildClaudeSystemPrompt(),
      messages,
      tools: [
        buildWebSearchToolConfig(
          params.webToolType,
          params.budget.maxUses,
          params.vehicle.mercado,
          params.allowedDomains,
          params.blockedDomains,
        ),
      ],
    };

    if (params.requireWebSearch) {
      requestBody.tool_choice = { type: "any" };
    }

    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
    };
    if (params.betaHeader && params.betaHeader.trim().length > 0) {
      headers["anthropic-beta"] = params.betaHeader.trim();
    }

    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await safeJson(response);
      params.turns.push({
        pass: params.passName,
        turn,
        httpStatus: response.status,
        error: errorBody,
      });
      throw new HttpError(502, "Falha ao chamar a API do Claude.", {
        status: response.status,
        anthropicError: errorBody,
      });
    }

    const claudeResponse = (await response.json()) as ClaudeMessageResponse;
    for (const url of extractObservedSourceUrlsFromResponse(claudeResponse)) {
      observedSourceUrls.add(url);
    }
    params.turns.push({
      pass: params.passName,
      turn,
      response: claudeResponse,
    });

    if (
      claudeResponse.stop_reason === "pause_turn" ||
      claudeResponse.stop_reason === "tool_use"
    ) {
      pushAssistantFollowupMessage(
        messages,
        claudeResponse.content,
        params.followupCompaction,
      );
      messages.push({
        role: "user",
        content:
          "Continue. Return only valid JSON according to OUTPUT_SCHEMA_JSON.",
      });
      continue;
    }

    if (claudeResponse.stop_reason === "max_tokens") {
      pushAssistantFollowupMessage(
        messages,
        claudeResponse.content,
        params.followupCompaction,
      );
      messages.push({
        role: "user",
        content:
          "Sua resposta foi truncada por limite de tokens. Retorne novamente o JSON COMPLETO, do inicio ao fim, sem markdown e sem texto extra.",
      });
      continue;
    }

    const textOutput = extractTextOutput(claudeResponse);
    if (!textOutput) {
      throw new HttpError(502, "Claude nao retornou bloco de texto com JSON.");
    }

    const parsedResult = parseJsonFromText(textOutput);
    if (params.enforceRealSources) {
      await enforceAuthenticSources({
        responsePayload: parsedResult,
        observedSourceUrls,
        allowedDomains: params.allowedDomains,
        blockedDomains: params.blockedDomains,
        requireObservedSources: params.requireObservedSources,
        timeoutMs: params.sourceProbeTimeoutMs,
      });
    }

    return { result: parsedResult };
  }

  throw new HttpError(
    502,
    `Claude (${params.passName}) excedeu o numero maximo de turnos.`,
  );
}

function injectVehicleData(
  response: Record<string, unknown>,
  vehicle: VehicleInput,
): void {
  const veiculoAlvo = asObject(response.veiculo_alvo);
  if (veiculoAlvo) {
    veiculoAlvo.marca = vehicle.marca;
    veiculoAlvo.modelo = vehicle.modelo;
    veiculoAlvo.versao = vehicle.versao;
    veiculoAlvo.ano_modelo = vehicle.ano_modelo;
    veiculoAlvo.mercado = vehicle.mercado;
  }

  const fichaTecnica = asObject(response.ficha_tecnica);
  const identificacao = fichaTecnica
    ? asObject(fichaTecnica.identificacao)
    : null;
  if (!identificacao) {
    return;
  }

  setCampoStatusValue(identificacao.marca, vehicle.marca);
  setCampoStatusValue(identificacao.modelo, vehicle.modelo);
  setCampoStatusValue(identificacao.versao, vehicle.versao);
  setCampoStatusValue(identificacao.ano_modelo, vehicle.ano_modelo);
  setCampoStatusValue(identificacao.mercado, vehicle.mercado);
}

function setCampoStatusValue(
  candidate: unknown,
  nextValue: string | number,
): void {
  const obj = asObject(candidate);
  if (!obj) {
    return;
  }

  obj.valor = typeof nextValue === "number" ? String(nextValue) : nextValue;
  obj.status = "confirmado";
  obj.fonte_ref = ["F1"];
  delete obj.obs_ref;
  delete obj.observacoes;
  delete obj.unidade;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return asObject(value);
}

function extractTextOutput(response: ClaudeMessageResponse): string {
  return response.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n")
    .trim();
}

function extractOpenRouterTextOutput(
  response: OpenRouterChatCompletionResponse,
): string {
  const choice = Array.isArray(response.choices)
    ? response.choices[0]
    : undefined;
  const message = choice?.message;
  const content = message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        const obj = asObject(item);
        if (!obj) {
          return "";
        }

        if (typeof obj.text === "string") {
          return obj.text;
        }

        if (typeof obj.content === "string") {
          return obj.content;
        }

        return "";
      })
      .join("\n")
      .trim();
  }

  const contentObj = asObject(content);
  if (contentObj) {
    if (typeof contentObj.text === "string") {
      return contentObj.text.trim();
    }
    if (typeof contentObj.content === "string") {
      return contentObj.content.trim();
    }
  }

  return "";
}

function compactAssistantContentForFollowup(
  content: ClaudeContentBlock[],
  config: FollowupCompactionConfig,
): ClaudeContentBlock[] {
  return content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => ({
      type: "text",
      text: truncateText(block.text as string, config.maxTextChars),
    }));
}

function pushAssistantFollowupMessage(
  messages: ClaudeMessage[],
  content: ClaudeContentBlock[],
  config: FollowupCompactionConfig,
): void {
  const compacted = compactAssistantContentForFollowup(content, config);
  if (compacted.length === 0) {
    return;
  }

  messages.push({
    role: "assistant",
    content: compacted,
  });
}

function parseJsonFromText(text: string): unknown {
  // Accept plain JSON or JSON wrapped in markdown code fences.
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch ? fencedMatch[1] : text;

  try {
    return JSON.parse(candidate);
  } catch {
    throw new HttpError(502, "Claude retornou texto que nao eh JSON valido.", {
      rawOutputPreview: candidate.slice(0, 1000),
    });
  }
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function enforceAuthenticSources(params: {
  responsePayload: unknown;
  observedSourceUrls: Set<string>;
  allowedDomains: string[];
  blockedDomains: string[];
  requireObservedSources: boolean;
  timeoutMs: number;
}): Promise<void> {
  const fontesUtilizadas = extractFontesUtilizadas(params.responsePayload);

  if (params.requireObservedSources && params.observedSourceUrls.size === 0) {
    throw new HttpError(
      502,
      "Claude nao apresentou evidencias de busca web nos turnos da execucao.",
    );
  }

  const sourceProbeCache = new Map<string, Promise<SourceProbeResult>>();

  for (const fonte of fontesUtilizadas) {
    validateSourceDomainPolicy(
      fonte.url,
      params.allowedDomains,
      params.blockedDomains,
    );

    if (
      params.requireObservedSources &&
      !hasObservedMatch(fonte.url, params.observedSourceUrls)
    ) {
      throw new HttpError(
        502,
        `Fonte ${fonte.id} nao foi observada nos resultados reais da busca web.`,
        {
          fonte,
        },
      );
    }

    const probePromise =
      sourceProbeCache.get(fonte.url) ??
      probeSourceUrl(fonte.url, params.timeoutMs).catch((error) => ({
        ok: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      }));
    sourceProbeCache.set(fonte.url, probePromise);

    const probe = await probePromise;
    if (!probe.ok) {
      throw new HttpError(
        502,
        `Fonte ${fonte.id} possui URL invalida ou indisponivel.`,
        {
          fonte,
          probeError: probe.errorMessage,
        },
      );
    }
  }
}

function extractFontesUtilizadas(
  responsePayload: unknown,
): FonteUtilizadaCandidate[] {
  const root = asObject(responsePayload);
  if (!root || !Array.isArray(root.fontes_utilizadas)) {
    throw new HttpError(
      502,
      "Resposta do Claude sem fontes_utilizadas para auditoria de evidencias.",
    );
  }

  return root.fontes_utilizadas.map((candidate, index) => {
    const obj = asObject(candidate);
    if (!obj) {
      throw new HttpError(
        502,
        `Fonte na posicao ${index} nao eh objeto valido.`,
      );
    }

    if (
      typeof obj.id !== "string" ||
      typeof obj.url !== "string" ||
      typeof obj.titulo !== "string" ||
      typeof obj.tipo !== "string"
    ) {
      throw new HttpError(
        502,
        `Fonte na posicao ${index} nao possui campos obrigatorios validos.`,
      );
    }

    return {
      id: obj.id,
      url: obj.url,
      titulo: obj.titulo,
      tipo: obj.tipo,
    };
  });
}

function calculateRoutingMetrics(responsePayload: unknown): RoutingMetrics {
  const root = asObject(responsePayload);
  const fichaTecnica = root ? asObject(root.ficha_tecnica) : null;
  if (!fichaTecnica) {
    return {
      total: 0,
      preenchidas: 0,
      coverageRate: 0,
      unresolvedPaths: [],
      unresolvedCount: 0,
      naoEncontradas: 0,
      naoAplicaveis: 0,
      conflitantes: 0,
      conflictPaths: [],
      missingPaths: [],
    };
  }

  const stats = {
    total: 0,
    preenchidas: 0,
    unresolvedPaths: [] as string[],
    conflictPaths: [] as string[],
    missingPaths: [] as string[],
    naoEncontradas: 0,
    naoAplicaveis: 0,
    conflitantes: 0,
  };

  collectRoutingMetricsFromNode(fichaTecnica, "ficha_tecnica", stats);
  const coverageRate = stats.total > 0 ? stats.preenchidas / stats.total : 0;

  return {
    total: stats.total,
    preenchidas: stats.preenchidas,
    coverageRate,
    unresolvedPaths: stats.unresolvedPaths,
    unresolvedCount: stats.unresolvedPaths.length,
    naoEncontradas: stats.naoEncontradas,
    naoAplicaveis: stats.naoAplicaveis,
    conflitantes: stats.conflitantes,
    conflictPaths: stats.conflictPaths,
    missingPaths: stats.missingPaths,
  };
}

function collectRoutingMetricsFromNode(
  node: unknown,
  currentPath: string,
  stats: {
    total: number;
    preenchidas: number;
    unresolvedPaths: string[];
    conflictPaths: string[];
    missingPaths: string[];
    naoEncontradas: number;
    naoAplicaveis: number;
    conflitantes: number;
  },
): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) =>
      collectRoutingMetricsFromNode(item, `${currentPath}[${index}]`, stats),
    );
    return;
  }

  const obj = asObject(node);
  if (!obj) {
    return;
  }

  if (typeof obj.status === "string") {
    stats.total += 1;
    const status = obj.status;
    if (
      status === "confirmado" ||
      status === "parcial" ||
      status === "inferido_minimamente"
    ) {
      stats.preenchidas += 1;
    } else if (status === "nao_encontrado") {
      stats.naoEncontradas += 1;
      stats.missingPaths.push(currentPath);
      stats.unresolvedPaths.push(currentPath);
    } else if (status === "nao_aplicavel") {
      stats.naoAplicaveis += 1;
    } else if (status === "conflitante") {
      stats.conflitantes += 1;
      stats.conflictPaths.push(currentPath);
      stats.unresolvedPaths.push(currentPath);
    }
  }

  for (const [key, value] of Object.entries(obj)) {
    if (
      key === "valor" ||
      key === "status" ||
      key === "fonte_ref" ||
      key === "obs_ref" ||
      key === "observacoes"
    ) {
      continue;
    }
    collectRoutingMetricsFromNode(value, `${currentPath}.${key}`, stats);
  }
}

function buildRefinePrompt(
  basePrompt: string,
  metrics: RoutingMetrics,
  unresolvedListLimit: number,
): string {
  const selectedPaths = metrics.unresolvedPaths.slice(0, unresolvedListLimit);
  const selectedBlock = selectedPaths.map((item) => `- ${item}`).join("\n");

  return [
    basePrompt,
    "",
    "### REFINAMENTO_OBJETIVO",
    "A resposta anterior teve cobertura insuficiente. Refine com foco em variaveis nao resolvidas.",
    "Busque especificamente as variaveis abaixo, com prioridade para fontes oficiais e parceiras whitelist.",
    "Atualize apenas o necessario; preserve campos ja confirmados, a menos que encontre evidencia oficial mais forte.",
    "Retorne novamente o JSON completo e valido no mesmo schema.",
    "",
    "### VARIAVEIS_PRIORITARIAS",
    selectedBlock,
  ].join("\n");
}

function buildConflictResolutionPrompt(
  basePrompt: string,
  metrics: RoutingMetrics,
  listLimit: number,
): string {
  const selectedPaths = metrics.conflictPaths.slice(0, listLimit);
  const selectedBlock = selectedPaths.map((item) => `- ${item}`).join("\n");

  return [
    basePrompt,
    "",
    "### RESOLUCAO_DE_CONFLITOS",
    "A resposta anterior trouxe variaveis conflitantes entre fontes.",
    "Resolva as divergencias priorizando fontes oficiais de montadora e orgaos tecnicos reconhecidos.",
    "Para cada conflito, escolha o valor com melhor evidencia e atualize status para confirmado/parcial quando possivel.",
    "Use status conflitante somente quando nao houver base suficiente para decidir.",
    "Retorne novamente o JSON completo e valido no mesmo schema.",
    "",
    "### VARIAVEIS_CONFLITANTES_PRIORITARIAS",
    selectedBlock,
  ].join("\n");
}

function buildOpenRouterRefinePrompt(
  basePrompt: string,
  metrics: RoutingMetrics,
  unresolvedListLimit: number,
): string {
  const selectedPaths = metrics.unresolvedPaths.slice(0, unresolvedListLimit);
  const selectedBlock = selectedPaths.map((item) => `- ${item}`).join("\n");

  return [
    basePrompt,
    "",
    "### OPENROUTER_REFINAMENTO_OBJETIVO",
    "Priorize cobertura com custo controlado usando web search apenas para variaveis pendentes.",
    "Nao altere campos ja confirmados sem nova evidencia mais forte.",
    "Se status for parcial, inclua obrigatoriamente obs_ref e observacoes.",
    "Retorne o JSON completo, sem campos extras e sem markdown.",
    "",
    "### VARIAVEIS_PENDENTES_PRIORITARIAS",
    selectedBlock,
  ].join("\n");
}

function buildOpenRouterConflictPrompt(
  basePrompt: string,
  metrics: RoutingMetrics,
  listLimit: number,
): string {
  const selectedPaths = metrics.conflictPaths.slice(0, listLimit);
  const selectedBlock = selectedPaths.map((item) => `- ${item}`).join("\n");

  return [
    basePrompt,
    "",
    "### OPENROUTER_RESOLUCAO_CONFLITO",
    "Resolva conflitos com prioridade de fonte oficial do mercado e ano-modelo alvo.",
    "Use status conflitante apenas quando nao houver desempate confiavel.",
    "Retorne o JSON completo, sem campos extras e sem markdown.",
    "",
    "### VARIAVEIS_CONFLITANTES_PRIORITARIAS",
    selectedBlock,
  ].join("\n");
}

function extractObservedSourceUrlsFromResponse(
  response: ClaudeMessageResponse,
): Set<string> {
  const found = new Set<string>();
  const content = Array.isArray(response.content) ? response.content : [];

  for (const block of content) {
    collectUrlsFromStructuredBlock(block, found);
  }

  return found;
}

function extractObservedSourceUrlsFromOpenRouterResponse(
  response: OpenRouterChatCompletionResponse,
): Set<string> {
  const found = new Set<string>();
  collectUrlsFromStructuredBlock(response, found);
  return found;
}

function countWebSearchRequestsFromResponse(
  response: OpenRouterChatCompletionResponse,
): number {
  const usageObj = asRecord(response.usage);
  const serverToolUseObj = asRecord(usageObj?.server_tool_use);
  const usageWebSearchRequests = serverToolUseObj?.web_search_requests;
  let count = 0;
  if (
    typeof usageWebSearchRequests === "number" &&
    Number.isFinite(usageWebSearchRequests)
  ) {
    count += usageWebSearchRequests;
  }

  count += countUrlCitations(response);
  return count;
}

function countUrlCitations(node: unknown): number {
  if (Array.isArray(node)) {
    return node.reduce((acc, item) => acc + countUrlCitations(item), 0);
  }

  const obj = asObject(node);
  if (!obj) {
    return 0;
  }

  let total = 0;
  const type = obj.type;
  const url = obj.url;
  if (type === "url_citation" && typeof url === "string" && isHttpUrl(url)) {
    total += 1;
  }

  for (const value of Object.values(obj)) {
    total += countUrlCitations(value);
  }
  return total;
}

function collectUrlsFromStructuredBlock(
  node: unknown,
  collector: Set<string>,
): void {
  if (Array.isArray(node)) {
    node.forEach((item) => collectUrlsFromStructuredBlock(item, collector));
    return;
  }

  const obj = asObject(node);
  if (!obj) {
    return;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === "text") {
      continue;
    }

    if (
      typeof value === "string" &&
      (key === "url" ||
        key.endsWith("_url") ||
        key === "link" ||
        key === "href") &&
      isHttpUrl(value)
    ) {
      collector.add(normalizeUrlForComparison(value));
      continue;
    }

    collectUrlsFromStructuredBlock(value, collector);
  }
}

function hasObservedMatch(
  sourceUrl: string,
  observedUrls: Set<string>,
): boolean {
  const sourceParsed = tryParseUrl(sourceUrl);
  if (!sourceParsed) {
    return false;
  }

  const sourceFull = normalizeUrlForComparison(sourceUrl);
  const sourcePath = normalizeOriginAndPath(sourceParsed);

  for (const observed of observedUrls) {
    const observedParsed = tryParseUrl(observed);
    if (!observedParsed) {
      continue;
    }

    if (sourceFull === normalizeUrlForComparison(observed)) {
      return true;
    }

    if (sourcePath === normalizeOriginAndPath(observedParsed)) {
      return true;
    }
  }

  return false;
}

function validateSourceDomainPolicy(
  url: string,
  allowedDomains: string[],
  blockedDomains: string[],
): void {
  const parsed = tryParseUrl(url);
  if (!parsed) {
    throw new HttpError(502, "URL de fonte invalida: formato incorreto.", {
      url,
    });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new HttpError(
      502,
      "URL de fonte invalida: protocolo deve ser http/https.",
      { url },
    );
  }

  const host = parsed.hostname.toLowerCase();

  if (allowedDomains.length > 0) {
    const allowed = allowedDomains.some((domain) =>
      hostMatchesDomain(host, domain),
    );
    if (!allowed) {
      throw new HttpError(502, "URL de fonte fora dos dominios permitidos.", {
        url,
        host,
      });
    }
  }

  if (blockedDomains.length > 0) {
    const blocked = blockedDomains.some((domain) =>
      hostMatchesDomain(host, domain),
    );
    if (blocked) {
      throw new HttpError(502, "URL de fonte em dominio bloqueado.", {
        url,
        host,
      });
    }
  }
}

interface SourceProbeOkResult {
  ok: true;
}

interface SourceProbeErrorResult {
  ok: false;
  errorMessage: string;
}

type SourceProbeResult = SourceProbeOkResult | SourceProbeErrorResult;

async function probeSourceUrl(
  url: string,
  timeoutMs: number,
): Promise<SourceProbeResult> {
  const timeout =
    Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 8000;

  const headResult = await fetchWithTimeout(url, timeout, {
    method: "HEAD",
    redirect: "follow",
  });
  if (isReachableStatus(headResult.status)) {
    return { ok: true };
  }

  const getResult = await fetchWithTimeout(url, timeout, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "ex_prompt-source-validator/1.0",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!isReachableStatus(getResult.status)) {
    return {
      ok: false,
      errorMessage: `status ${getResult.status} ao validar ${url}`,
    };
  }

  return { ok: true };
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init: RequestInit,
): Promise<{ status: number; responseUrl: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return { status: response.status, responseUrl: response.url };
  } finally {
    clearTimeout(timer);
  }
}

function isReachableStatus(status: number): boolean {
  if (status >= 200 && status < 400) {
    return true;
  }

  // Some sources may protect direct bots but still indicate that the page exists.
  return status === 401 || status === 403 || status === 429;
}

function tryParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function normalizeUrlForComparison(url: string): string {
  const parsed = tryParseUrl(url);
  if (!parsed) {
    return url.trim();
  }

  parsed.hash = "";

  const normalized = parsed.toString();
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function normalizeOriginAndPath(parsed: URL): string {
  const path = parsed.pathname.endsWith("/")
    ? parsed.pathname.slice(0, -1)
    : parsed.pathname;
  return `${parsed.origin.toLowerCase()}${path}`;
}

function hostMatchesDomain(host: string, domain: string): boolean {
  const normalizedDomain = domain.trim().toLowerCase();
  return host === normalizedDomain || host.endsWith(`.${normalizedDomain}`);
}

function isHttpUrl(value: string): boolean {
  const parsed = tryParseUrl(value);
  if (!parsed) {
    return false;
  }
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

function decideRouterNextPass(
  metrics: RoutingMetrics,
  config: RouterConfig,
  attempts: RouterAttempts,
): RouterDecision {
  const coverageOk = metrics.coverageRate >= config.minCoverageRate;
  const unresolvedOk = metrics.unresolvedCount <= config.maxUnresolved;
  const missingOk = metrics.naoEncontradas <= config.maxNaoEncontradas;
  const conflictsOk = metrics.conflitantes <= config.maxConflitantes;

  if (coverageOk && unresolvedOk && missingOk && conflictsOk) {
    return {
      done: true,
      nextPass: null,
      reason: "thresholds_atingidos",
    };
  }

  if (!conflictsOk && attempts.conflict < config.maxConflictPasses) {
    return {
      done: false,
      nextPass: "conflict_resolver",
      reason: "conflitos_acima_do_limite",
    };
  }

  if (
    (!coverageOk || !unresolvedOk || !missingOk) &&
    attempts.refine < config.maxRefinePasses
  ) {
    return {
      done: false,
      nextPass: "refine",
      reason: "cobertura_ou_pendencias_abaixo_do_limite",
    };
  }

  return {
    done: true,
    nextPass: null,
    reason: "limite_de_passes_atingido_ou_sem_melhor_proxima_acao",
  };
}

function calculateRouterScore(metrics: RoutingMetrics): number {
  return (
    metrics.coverageRate * 1000 +
    metrics.preenchidas * 2 -
    metrics.unresolvedCount * 6 -
    metrics.naoEncontradas * 3 -
    metrics.conflitantes * 18
  );
}

function buildUserLocation(mercado: string): {
  type: "approximate";
  city: string;
  region: string;
  country: string;
  timezone: string;
} {
  const normalized = mercado.trim().toLowerCase();

  if (normalized.includes("brasil") || normalized === "br") {
    return {
      type: "approximate",
      city: "Sao Paulo",
      region: "Sao Paulo",
      country: "BR",
      timezone: "America/Sao_Paulo",
    };
  }

  if (
    normalized.includes("usa") ||
    normalized.includes("estados unidos") ||
    normalized === "us"
  ) {
    return {
      type: "approximate",
      city: "New York",
      region: "New York",
      country: "US",
      timezone: "America/New_York",
    };
  }

  return {
    type: "approximate",
    city: "Sao Paulo",
    region: "Sao Paulo",
    country: "BR",
    timezone: "America/Sao_Paulo",
  };
}

function buildClaudeSystemPrompt(): string {
  return [
    "You are an automotive research agent.",
    "Interpret and follow BASE_AGENT_PROMPT exactly.",
    "Use web search tool to gather reliable evidence; do not rely on memory alone.",
    "Prefer the most reliable sources first and avoid broad search if domain restrictions are provided.",
    "Prioritize official manufacturer sources and keep source references consistent.",
    "Never invent source URLs. Use only URLs actually observed during tool execution.",
    "Return only valid JSON that strictly matches OUTPUT_SCHEMA_JSON.",
    "Do not include any commentary, planning text, or markdown fences.",
  ].join(" ");
}

function buildOpenRouterSystemPrompt(): string {
  return [
    "You are an automotive research agent.",
    "Interpret and follow BASE_AGENT_PROMPT exactly.",
    "Use web search tool to gather reliable evidence; do not rely on memory alone.",
    "Never invent source URLs. Use only URLs actually observed during tool execution.",
    "Return only valid JSON that strictly matches OUTPUT_SCHEMA_JSON.",
    "Do not include any commentary, planning text, or markdown fences.",
  ].join(" ");
}

function createExecutionId(prefix = "claude"): string {
  const now = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${now}-${random}`;
}

function buildWebSearchToolConfig(
  webToolType: string,
  maxUses: number,
  mercado: string,
  allowedDomains: string[],
  blockedDomains: string[],
): Record<string, unknown> {
  const toolConfig: Record<string, unknown> = {
    type: webToolType,
    name: "web_search",
    max_uses: maxUses,
    user_location: buildUserLocation(mercado),
  };

  if (allowedDomains.length > 0) {
    toolConfig.allowed_domains = allowedDomains;
  } else if (blockedDomains.length > 0) {
    toolConfig.blocked_domains = blockedDomains;
  }

  return toolConfig;
}

function buildOpenRouterWebSearchToolConfig(params: {
  maxSearchCalls: number;
  allowedDomains: string[];
  blockedDomains: string[];
  engine: string | undefined;
  contextSize: "low" | "medium" | "high";
  maxResults: number;
  maxTotalResults: number;
  market: string;
}): Record<string, unknown> {
  const toolConfig: Record<string, unknown> = {
    type: "openrouter:web_search",
    parameters: {
      max_results: params.maxResults,
      max_total_results: params.maxTotalResults,
      search_context_size: params.contextSize,
      user_location: buildUserLocation(params.market),
    },
  };

  const parameters = asObject(toolConfig.parameters);
  if (!parameters) {
    return toolConfig;
  }

  if (params.engine) {
    parameters.engine = params.engine;
  }

  if (params.maxSearchCalls > 0) {
    parameters.max_total_results = Math.min(
      Number(parameters.max_total_results ?? params.maxTotalResults),
      params.maxResults * params.maxSearchCalls,
    );
  }

  if (params.allowedDomains.length > 0) {
    parameters.allowed_domains = params.allowedDomains;
  } else if (params.blockedDomains.length > 0) {
    parameters.excluded_domains = params.blockedDomains;
  }

  return toolConfig;
}

function parseCsvEnv(key: string): string[] {
  const raw = process.env[key];
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function parseBooleanEnv(key: string, defaultValue: boolean): boolean {
  const raw = process.env[key];
  if (!raw) {
    return defaultValue;
  }

  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return defaultValue;
}

function parseNumberEnv(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (!raw) {
    return defaultValue;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }
  return parsed;
}

function parseOpenRouterContextSize(
  value: string | undefined,
): "low" | "medium" | "high" {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "low" || normalized === "high") {
    return normalized;
  }
  return "medium";
}

function normalizeRate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, maxChars)} ...[truncated]`;
}
