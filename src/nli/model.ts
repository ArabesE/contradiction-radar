import type { NliScores } from '../types.js';
import { logger } from '../logger.js';

type TokenizedInputs = Record<string, unknown>;
type Tokenizer = (text: string, options: { text_pair: string; padding: boolean; truncation: boolean; max_length: number }) => Promise<TokenizedInputs>;
type SequenceClassifier = ((inputs: TokenizedInputs) => Promise<{ logits: { data: ArrayLike<number> } }>) & {
  config?: { id2label?: Record<string, string> };
};

export class LocalNliEngine {
  private tokenizer?: Tokenizer;
  private model?: SequenceClassifier;
  private initialization?: Promise<void>;

  constructor(
    private readonly modelId = process.env.NLI_MODEL_ID ?? 'Xenova/nli-deberta-v3-xsmall',
    private readonly allowRemote = process.env.NLI_ALLOW_REMOTE_MODELS !== 'false',
    private readonly revision = process.env.NLI_MODEL_REVISION ?? '2a4f614a701367a02d51389039afc998faeda637',
  ) {}

  async initialize(): Promise<void> {
    if (this.tokenizer && this.model) return;
    this.initialization ??= this.load();
    await this.initialization;
  }

  async score(previous: string, current: string): Promise<NliScores> {
    try {
      await this.initialize();
      if (!this.tokenizer || !this.model) return fallbackScores(previous, current);
      const inputs = await this.tokenizer(previous, { text_pair: current, padding: true, truncation: true, max_length: 512 });
      const output = await this.model(inputs);
      const probabilities = softmax(Array.from(output.logits.data, Number));
      const scores = { contradiction: 0, entailment: 0, neutral: 0 };
      for (const [index, probability] of probabilities.entries()) {
        const configuredLabel = this.model.config?.id2label?.[String(index)] ?? `label_${index}`;
        const key = normalizeLabel(configuredLabel);
        if (key) scores[key] = probability;
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
    const tokenizer = await transformers.AutoTokenizer.from_pretrained(this.modelId, { revision: this.revision });
    const model = await transformers.AutoModelForSequenceClassification.from_pretrained(this.modelId, { dtype: 'q8', revision: this.revision });
    this.tokenizer = tokenizer;
    this.model = model as unknown as SequenceClassifier;
    logger.info({ category: 'nli_ready', modelId: this.modelId }, 'Local NLI initialized');
  }
}

function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exponentials = values.map((value) => Math.exp(value - max));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

function normalizeLabel(label: string): 'contradiction' | 'entailment' | 'neutral' | null {
  const normalized = label.toLowerCase();
  if (normalized.includes('contradiction') || normalized === 'label_0') return 'contradiction';
  if (normalized.includes('entailment') || normalized === 'label_1') return 'entailment';
  if (normalized.includes('neutral') || normalized === 'label_2') return 'neutral';
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
