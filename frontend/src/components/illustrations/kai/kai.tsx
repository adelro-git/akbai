// ============================================================
// Kai — Phase 4 unified expression API
// ADR-013: A single <Kai expression> entrypoint maps a named expression to the
// matching Ka* component from the existing svg/ka-expressions/ tree.
// `animated` wraps in a span with `animate-kai-bob`; reduced-motion gates globally.
// ============================================================
import {
  KaCelebrating,
  KaConcerned,
  KaHappy,
  KaThinking,
  KaWaving,
  KaWorking,
} from '../svg';

export type KaiExpression = 'happy' | 'concerned' | 'thinking' | 'celebrating' | 'waving' | 'working';

export type KaiProps = {
  expression?: KaiExpression;
  size?: number;
  animated?: boolean;
  className?: string;
};

const EXPRESSION_MAP = {
  happy: KaHappy,
  concerned: KaConcerned,
  thinking: KaThinking,
  celebrating: KaCelebrating,
  waving: KaWaving,
  working: KaWorking,
} as const;

export function Kai({
  expression = 'happy',
  size = 48,
  animated = false,
  className,
}: KaiProps) {
  const Expression = EXPRESSION_MAP[expression];
  const inner = <Expression size={size} className={className} />;
  if (!animated) return inner;
  return <span className="inline-block animate-kai-bob">{inner}</span>;
}
