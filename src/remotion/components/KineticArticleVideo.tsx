import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";

import type { KineticVideoProps } from "../../lib/socialAutomation/kineticVideo";
import { AtmosphericBackground } from "./AtmosphericBackground";
import { KineticTypewriterText } from "./KineticTypewriterText";

function fontSizeFor(text: string) {
  if (text.length > 78) return 58;
  if (text.length > 58) return 64;
  if (text.length > 38) return 70;
  return 78;
}

const Beat: React.FC<{ beat: KineticVideoProps["beats"][number]; final: boolean; branding: KineticVideoProps["branding"] }> = ({ beat, final, branding }) => {
  const frame = useCurrentFrame();
  const duration = Math.max(1, beat.endFrame - beat.startFrame);
  const opacity = interpolate(frame, [0, 8, Math.max(9, duration - 10), duration], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 14], [22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", opacity, padding: "0 90px", transform: `translateY(${y}px)` }}>
      <div style={{ color: "rgba(184,205,193,0.72)", fontFamily: '"Courier New", Courier, monospace', fontSize: 22, fontWeight: 700, letterSpacing: 0, marginBottom: 28, textTransform: "uppercase" }}>{beat.label}</div>
      <KineticTypewriterText text={beat.text} highlight={beat.highlight} revealFrames={beat.revealFrames} cursor={!final} fontSize={fontSizeFor(beat.text)} />
      {final && branding ? (
        <div style={{ borderTop: "1px solid rgba(126,242,170,0.24)", marginTop: 64, paddingTop: 28, width: 620 }}>
          <div style={{ color: "#f4f8f5", fontSize: 25, fontWeight: 800 }}>{branding.name}</div>
          <div style={{ color: "#9db2a5", fontSize: 21, marginTop: 9 }}>{branding.tagline}</div>
          <div style={{ color: "#49ef83", fontSize: 22, marginTop: 9 }}>{branding.url}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const KineticArticleVideo: React.FC<KineticVideoProps> = (props) => {
  const frame = useCurrentFrame();
  const activeIndex = Math.max(0, props.beats.findIndex((beat) => frame >= beat.startFrame && frame < beat.endFrame));
  return (
    <AbsoluteFill style={{ backgroundColor: "#030806", color: "#ffffff", overflow: "hidden" }}>
      <AtmosphericBackground />
      {props.audioMode !== "none" && props.audioSrc ? <Audio src={staticFile(props.audioSrc)} /> : null}
      {props.beats.map((beat, index) => (
        <Sequence key={`${beat.role}-${beat.startFrame}`} from={beat.startFrame} durationInFrames={Math.max(1, beat.endFrame - beat.startFrame)} premountFor={15}>
          <Beat beat={beat} final={index === props.beats.length - 1} branding={props.branding} />
        </Sequence>
      ))}
      <div style={{ bottom: 86, color: "rgba(206,221,212,0.44)", fontFamily: '"Courier New", Courier, monospace', fontSize: 17, left: 90, position: "absolute" }}>
        {String(activeIndex + 1).padStart(2, "0")} / {String(props.beats.length).padStart(2, "0")}
      </div>
    </AbsoluteFill>
  );
};

