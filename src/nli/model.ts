import type { NliScores } from '../types.js';
import { logger } from '../logger.js';

type PipelineResult = Array<{ label: string; score: number }> | Array<Array<{ label: string; score: number }>>;
type Classifier = (input: unknown, options?: Record<string, unknown>) => Promise<PipelineResult>;

export class LocalNliEngine {
  private classifier?: Classifier;
  private initialization?: Promise<void>;

  constructor(
    private readonly modelId = process.env.NLI_MODEL_ID ?? 'Xenova/nli-deberta-v3-xsmall',
    private readonly allowRemote = process.env.NLI_ALLOW_REMOTE_MODELS !== 'false',
  ) {}

  async initialize(): Promise<void> {
    if (this.classifier) return;
    this.initialization ??= this.load();
    await this.initialization;
  }

  async score(previous: string, current: string): Promise<NliScores> {
    try {
      await this.initialize();
      if (!this.classifier) return fallbackScores(previous, current);
      const raw = await this.classifier({ text: previous, text_pair: current }, { top_k: null });
      const items = Array.isArray(raw[0]) ? raw[0] : raw;
      const scores = { contradiction: 0, entailment: 0, neutral: 0 };
      for (const item of items as Array<{ label: string; score: number }>) {
        const key = normalizeLabel(item.label);
        if (key) scores[key] = item.score;
      }
      const total = scores.contradiction + scores.entailment + scores.neutral;
      if (total < 0.95) throw new Error('Unexpected NLI label mapping');
      return { ...scores, source: 'local-model' };
    } catch (error) {
      logger.warn({ category: 'nli_fallback', errorName: error instanceof Error ? error.name : 'unknown' }, 'Local NLI unavailable; using deterministic fallback');
      return fallbackScores(previous, current);
    }
  }

  private async load(): Promise<void> {
    const transformers = await import('@huggingface/transformers');
    transformers.env.allowRemoteModels = this.allowRemote;
    transformers.env.allowLocalModels = true;
    const instance = await transformers.pipeline('text-classification', this.modelId, { dtype: 'q8' });
    this.classifier = instance as unknown as Classifier;
    logger.info({ category: 'nli_ready', modelId: this.modelId }, 'Local NLI initialized');
  }
}

function normalizeLabel(label: string): 'contradiction' | 'entailment' | 'neutral' | null {
  const normalized = label.toLowerCase();
  if (normalized.includes('contradiction') || normalized === 'label_0') return 'contradiction';
  if (normalized.includes('neutral') || normalized === 'label_1') return 'neutral';
  if (normalized.includes('entailment') || normalized === 'label_2') return 'entailment';
  return null;
}

export function fallbackScores(previous: string, current: string): NliScores {
  const normalize = (value: string) => new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const a = normalize(previous);
  const b = normalize(current);
  const overlap = [...a].filter((token) => b.has(token)).length / Math.max(1, Math.min(a.size, b.size));
  const negationA = /\b(no|not|never|cannot|can't|won't|without|disabled)\b/i.test(previous);
  const negationB = /\b(no|not|never|cannot|can't|won't|without|disabled)\b/i.test(current);
  const opposite = negationA !== negationB && overlap >= 0.35;
  if (opposite) return { contradiction: 0.72, entailment: 0.08, neutral: 0.2, source: 'deterministic-fallback' };
  if (overlap >= 0.7) return { contradiction: 0.08, entailment: 0.72, neutral: 0.2, source: 'deterministic-fallback' };
  return { contradiction: 0.12, entailment: 0.12, neutral: 0.76, source: 'deterministic-fallback' };
}

