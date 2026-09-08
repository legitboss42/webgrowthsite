import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

type Props = { text: string; highlight: string; revealFrames: number; cursor?: boolean; accent?: string; fontSize?: number };

export const KineticTypewriterText: React.FC<Props> = ({ text, highlight, revealFrames, cursor = true, accent = "#49ef83", fontSize = 74 }) => {
  const frame = useCurrentFrame();
  const visibleCharacters = Math.min(text.length, Math.max(1, Math.floor(interpolate(frame, [0, Math.max(1, revealFrames)], [1, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))));
  const visible = text.slice(0, visibleCharacters);
  const highlightStart = text.toLowerCase().indexOf(highlight.toLowerCase());
  const highlightEnd = highlightStart < 0 ? -1 : highlightStart + highlight.length;
  const before = highlightStart < 0 ? visible : visible.slice(0, Math.min(visible.length, highlightStart));
  const emphasized = highlightStart < 0 || visible.length <= highlightStart ? "" : visible.slice(highlightStart, Math.min(visible.length, highlightEnd));
  const after = highlightEnd < 0 || visible.length <= highlightEnd ? "" : visible.slice(highlightEnd);
  const showCursor = cursor && frame <= revealFrames + 18 && Math.floor(frame / 8) % 2 === 0;

  return (
    <div style={{ color: "#f4f8f5", fontFamily: '"Courier New", Courier, monospace', fontSize, fontWeight: 700, lineHeight: 1.18, maxWidth: 900, overflowWrap: "break-word", whiteSpace: "pre-wrap" }}>
      <span>{before}</span>
      {emphasized ? <span style={{ color: accent }}>{emphasized}</span> : null}
      <span>{after}</span>
      {showCursor ? <span style={{ color: accent, marginLeft: 3 }}>|</span> : null}
    </div>
  );
};

