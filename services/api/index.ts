import "./env";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import {
  createRequestId,
  logHttpRequest,
  logServerError,
  readRecentLLMResponses,
  readLatestLLMResponseSnapshot,
  saveLLMResponseSnapshot
} from "./logger";
import { callLLM } from "./llm";
import { getPersistenceMode } from "./db/client";
import { persistTechnicalSheet, readLatestTechnicalSheet, readTechnicalSheetHistory } from "./db/repository";
import { buildVehiclePayload, composeFinalPrompt, readBaseAgentPrompt, readOutputSchema } from "./prompt-builder";
import { readFieldPolicy, readNormalizationPolicy, readQualityPolicy, readSourcePolicy } from "./runtime-assets";
import { FichaTecnicaHistoryItem, HttpError, VehicleInput } from "./types";
import { validateResponse } from "./validator";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  const requestId = createRequestId();
  const startedAt = new Date().toISOString();
  const startedHr = process.hrtime.bigint();

  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const elapsedNs = process.hrtime.bigint() - startedHr;
    const durationMs = Number(elapsedNs) / 1_000_000;

    void logHttpRequest({
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip ?? "unknown",
      at: startedAt
    });
  });

  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/ficha-tecnica", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicleInput = parseVehicleInput(req.body);

    const [baseAgentPrompt, outputSchema, sourcePolicy, normalizationPolicy, fieldPolicy, qualityPolicy] = await Promise.all([
      readBaseAgentPrompt(),
      readOutputSchema(),
      readSourcePolicy(),
      readNormalizationPolicy(),
      readFieldPolicy(),
      readQualityPolicy()
    ]);
    const vehiclePayload = buildVehiclePayload(vehicleInput);
    const finalPrompt = composeFinalPrompt({
      baseAgentPrompt,
      outputSchema,
      vehiclePayload,
      sourcePolicy,
      normalizationPolicy,
      fieldPolicy,
      qualityPolicy
    });

    const llmRawResponse = await callLLM(finalPrompt, vehicleInput);
    const requestId = String(res.getHeader("x-request-id") ?? createRequestId());
    const provider = (process.env.LLM_PROVIDER ?? "simulated").toLowerCase();
    const snapshotProvider = provider === "claude" || provider === "openrouter" ? provider : "simulated";
    const validatedResponse = validateResponse(llmRawResponse, outputSchema, {
      vehicle: vehicleInput,
      provider: snapshotProvider,
      sourcePolicy,
      normalizationPolicy,
      fieldPolicy,
      qualityPolicy
    });
    if (getPersistenceMode() === "postgres") {
      await persistTechnicalSheet({ requestId, provider: snapshotProvider, vehicle: vehicleInput, response: validatedResponse, outputSchema, finalPrompt });
    } else {
      void saveLLMResponseSnapshot(requestId, snapshotProvider, vehicleInput, validatedResponse);
    }

    res.status(200).json(validatedResponse);
  } catch (error) {
    next(error);
  }
});

app.get("/api/ficha-tecnica/latest", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const outputSchema = await readOutputSchema();
    const latestSnapshot = getPersistenceMode() === "postgres" ? await readLatestTechnicalSheet() : await readLatestLLMResponseSnapshot();

    if (!latestSnapshot) {
      res.status(404).json({
        message: "Nenhuma resposta salva para exibir."
      });
      return;
    }

    const validatedResponse = validateResponse(latestSnapshot, outputSchema);
    res.status(200).json(validatedResponse);
  } catch (error) {
    next(error);
  }
});

app.get("/api/ficha-tecnica/history", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestedLimit =
      typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : Number.NaN;
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 2;

    const outputSchema = await readOutputSchema();
    const recentResponses = getPersistenceMode() === "postgres" ? await readTechnicalSheetHistory(limit) : await readRecentLLMResponses(limit);

    const history: FichaTecnicaHistoryItem[] = recentResponses.map((entry) => {
      try {
        const validated = validateResponse(entry.response, outputSchema);
        return {
          id: entry.id,
          finishedAt: entry.finishedAt,
          provider: entry.provider,
          model: entry.model,
          vehicle: entry.vehicle,
          response: validated,
          isValid: true
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Resposta indisponivel para validacao.";
        return {
          id: entry.id,
          finishedAt: entry.finishedAt,
          provider: entry.provider,
          model: entry.model,
          vehicle: entry.vehicle,
          response: entry.response,
          isValid: false,
          validationError: message
        };
      }
    });

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const requestIdHeader = res.getHeader("x-request-id");
  const requestId = typeof requestIdHeader === "string" ? requestIdHeader : "unknown";
  void logServerError(requestId, error);

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null
    });
    return;
  }

  res.status(500).json({
    message: "Erro interno no servidor.",
    details: null
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  const provider = (process.env.LLM_PROVIDER ?? "simulated").toLowerCase();
  const effectiveModel =
    provider === "claude"
      ? process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5"
      : provider === "openrouter"
        ? process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash"
        : "mock-response";
  console.log(`[startup] LLM_PROVIDER=${provider} | MODEL=${effectiveModel}`);
});

function parseVehicleInput(body: unknown): VehicleInput {
  if (!isObject(body)) {
    throw new HttpError(400, "Body da requisicao deve ser um objeto JSON.");
  }

  // Accept both request formats:
  // 1) flat body: { marca, modelo, ... }
  // 2) nested body: { vehicle: { marca, modelo, ... } }
  const payload = isObject(body.vehicle) ? body.vehicle : body;

  const marca = toRequiredText(payload.marca, "marca");
  const modelo = toRequiredText(payload.modelo, "modelo");
  const versao = toRequiredText(payload.versao, "versao");
  const mercado = toRequiredText(payload.mercado, "mercado");
  const ano_modelo = toYear(payload.ano_modelo);

  return {
    marca,
    modelo,
    versao,
    ano_modelo,
    mercado
  };
}

function toRequiredText(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, `Campo ${fieldName} e obrigatorio.`);
  }
  return value.trim();
}

function toYear(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    if (value >= 1900 && value <= 2100) {
      return value;
    }
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2100) {
      return parsed;
    }
  }

  throw new HttpError(400, "Campo ano_modelo deve ser um inteiro entre 1900 e 2100.");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
