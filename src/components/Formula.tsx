import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface FormulaProps {
  /** LaTeX source, e.g. `C = \\frac{A \\times U_f}{R_t}` */
  tex: string;
  /** Display (centered block) vs inline rendering. */
  block?: boolean;
  className?: string;
}

/**
 * Tiny KaTeX wrapper. Renders the formula imperatively into a container ref
 * so we don't ship the heavier `react-katex` dependency just for this one use.
 */
export default function Formula({ tex, block = true, className }: FormulaProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    katex.render(tex, ref.current, {
      displayMode: block,
      throwOnError: false,
      output: 'html',
    });
  }, [tex, block]);

  return <span ref={ref} className={className} />;
}
