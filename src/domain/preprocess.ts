import type { ContextMarkers } from '../types.js';

const ENVIRONMENTS = ['production', 'prod', 'staging', 'stage', 'development', 'dev', 'test', 'sandbox', 'local'];
const SCOPES = ['enterprise', 'free tier', 'free plan', 'paid', 'internal', 'external', 'eu', 'us', 'mobile', 'desktop', 'beta', 'general availability', 'ga'];
const PROPOSAL = /\b(propose|proposal|prefer|preference|suggest|suggestion|might|could|maybe|option|draft|explor(?:e|ing))\b/i;
const DECISION = /\b(decided|decision|approved|committed|confirmed|final|must|shall|will|require(?:d|ment)?|deadline)\b/i;
const SUPERSEDING = /\b(supersed(?:e|ed|es)|replace(?:d|s)?|no longer|revised|updated decision|resolved)\b/i;
const REQUIREMENT = /\b(must|shall|required|cannot|can't|may not|deadline|commit(?:ted)?|will)\b/i;
const NEGATION = /\b(no|not|never|cannot|can't|won't|mustn't|without|disabled|prohibited)\b/i;

export function normalizeText(text: string): string {
  return text
    .replace(/<https?:\/\/[^>|]+(?:\|[^>]+)?>/g, ' ')
    .replace(/<[@#][A-Z0-9]+(?:\|[^>]+)?>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractClaim(text: string): string | null {
  const normalized = normalizeText(text)
    .replace(/^check(?: whether| if)?(?: this (?:message|claim))?(?: for contradictions?)?[:\s-]*/i, '')
    .replace(/^does this contradict(?: anything)?[:\s-]*/i, '')
    .trim();
  if (normalized.length < 12) return null;
  return normalized.length > 700 ? normalized.slice(0, 700) : normalized;
}

export function extractMarkers(text: string): ContextMarkers {
  const normalized = normalizeText(text).toLowerCase();
  const environments = ENVIRONMENTS.filter((item) => new RegExp(`\\b${escapeRegex(item)}\\b`, 'i').test(normalized));
  const scopes = SCOPES.filter((item) => new RegExp(`\\b${escapeRegex(item)}\\b`, 'i').test(normalized));
  const versions = [...normalized.matchAll(/\b(?:v(?:ersion)?\s*)?\d+(?:\.\d+){0,2}\b/gi)].map((match) => match[0]);
  const timeMarkers = [
    ...normalized.matchAll(/\b(?:q[1-4]\s*20\d{2}|20\d{2}|today|tomorrow|yesterday|this (?:week|month|quarter)|next (?:week|month|quarter)|before [a-z0-9 -]+|after [a-z0-9 -]+)\b/gi),
  ].map((match) => match[0]);
  return {
    environments: unique(environments.map(canonicalEnvironment)),
    versions: unique(versions.map((item) => item.replace(/version\s*/i, 'v'))),
    timeMarkers: unique(timeMarkers),
    scopes: unique(scopes),
    isProposal: PROPOSAL.test(normalized),
    isDecision: DECISION.test(normalized),
    isSuperseding: SUPERSEDING.test(normalized),
    isRequirement: REQUIREMENT.test(normalized),
    hasNegation: NEGATION.test(normalized),
  };
}

function canonicalEnvironment(value: string): string {
  if (value === 'prod') return 'production';
  if (value === 'stage') return 'staging';
  if (value === 'dev') return 'development';
  return value;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

