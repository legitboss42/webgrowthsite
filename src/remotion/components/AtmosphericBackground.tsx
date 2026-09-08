import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const AtmosphericBackground: React.FC<{ accent?: string }> = ({ accent = "#33e06f" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const travel = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1]);
  const driftX = Math.sin(frame / 70) * 46;
  const driftY = Math.cos(frame / 86) * 58;

  return (
    <AbsoluteFill style={{ backgroundColor: "#030806", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 22% 18%, rgba(31,107,66,0.32), transparent 38%), radial-gradient(circle at 84% 70%, rgba(29,72,53,0.24), transparent 42%), linear-gradient(180deg, #0a1511 0%, #030806 72%)", transform: `translate3d(${driftX}px, ${driftY}px, 0) scale(${1.07 + travel * 0.04})` }} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(120,255,176,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(120,255,176,0.03) 1px, transparent 1px)", backgroundSize: "96px 96px", maskImage: "linear-gradient(to bottom, transparent, black 22%, black 75%, transparent)", opacity: 0.52, transform: `translate3d(${(frame * 0.16) % 96}px, ${(-frame * 0.12) % 96}px, 0)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${28 + travel * 30}% ${38 + Math.sin(frame / 90) * 8}%, ${accent}18, transparent 19%)`, filter: "blur(24px)" }} />
      <AbsoluteFill style={{ backgroundImage: "repeating-radial-gradient(circle at 0 0, rgba(255,255,255,0.055) 0 1px, transparent 1px 4px)", backgroundSize: "7px 7px", opacity: 0.12, transform: `translate(${frame % 7}px, ${-(frame % 7)}px)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.42) 78%, rgba(0,0,0,0.78) 100%)" }} />
    </AbsoluteFill>
  );
};

