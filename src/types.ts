export type RadarLabel =
  | 'Direct contradiction'
  | 'Requirement conflict'
  | 'Superseded decision'
  | 'Scope mismatch'
  | 'Time mismatch'
  | 'Needs clarification'
  | 'No contradiction';

export type Severity = 'high' | 'medium' | 'low';

export interface Evidence {
  channelId: string;
  messageTs: string;
  permalink: string;
  text: string;
  authorName?: string;
  isBot?: boolean;
}

export interface NliScores {
  contradiction: number;
  entailment: number;
  neutral: number;
  source: 'local-model' | 'deterministic-fallback';
}

export interface ContextMarkers {
  environments: string[];
  versions: string[];
  timeMarkers: string[];
  scopes: string[];
  isProposal: boolean;
  isDecision: boolean;
  isSuperseding: boolean;
  isRequirement: boolean;
  hasNegation: boolean;
}

export interface Finding {
  id: string;
  label: RadarLabel;
  severity: Severity;
  confidence: number;
  explanation: string;
  current: Evidence;
  previous: Evidence;
  scores: NliScores;
  reasonCodes: string[];
}

export interface SearchCapabilities {
  semantic: boolean;
  checkedAt: number;
}

