import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type {
  SubtitleCue,
  WebGrowthArticleVideoProps,
  WebGrowthVideoScene,
} from "./WebGrowthArticleVideo";

type ResolvedScene = WebGrowthVideoScene & {
  startTimeInSeconds: number;
  endTimeInSeconds: number;
  startFrame: number;
  endFrame: number;
};

type SubtitlePage = {
  start: number;
  end: number;
  text: string;
};

function resolveScenes(scenes: WebGrowthVideoScene[], fps: number): ResolvedScene[] {
  let cursor = 0;
  return scenes.map((scene) => {
    const startTimeInSeconds = scene.startTimeInSeconds ?? cursor;
    const endTimeInSeconds = Math.max(
      scene.endTimeInSeconds ?? startTimeInSeconds + scene.durationInSeconds,
      startTimeInSeconds + 0.6
    );
    cursor = endTimeInSeconds;
    return {
      ...scene,
      startTimeInSeconds,
      endTimeInSeconds,
      startFrame: Math.max(0, Math.round(startTimeInSeconds * fps)),
      endFrame: Math.max(1, Math.round(endTimeInSeconds * fps)),
    };
  });
}

function buildSubtitlePages(cues: SubtitleCue[]): SubtitlePage[] {
  const pages: SubtitlePage[] = [];
  for (const cue of cues) {
    const current = pages[pages.length - 1];
    const joined = current ? `${current.text} ${cue.text}`.trim() : cue.text;
    const shouldSplit =
      !current || cue.start - current.end > 0.28 || joined.length > 44 || cue.end - current.start > 1.8;
    if (shouldSplit) {
      pages.push({ start: cue.start, end: cue.end, text: cue.text });
    } else {
      current.end = cue.end;
      current.text = joined;
    }
  }
  return pages;
}

function neutralFinalText(value: string) {
  const stripped = value
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/\b\S+\.info\b/gi, "")
    .replace(/\bread the full guide\b/gi, "Key takeaway")
    .trim();
  return stripped || "Save this idea for later.";
}

export const TikTokArticleVideo: React.FC<WebGrowthArticleVideoProps> = ({
  title,
  scenes,
  subtitles = [],
  audioSrc = "article-voice.mp3",
  durationInSeconds,
  previewMode = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const second = frame / fps;

  const resolvedScenes = useMemo(() => {
    const source = scenes.length
      ? scenes
      : [
          {
            durationInSeconds: 3,
            kicker: "Key idea",
            narration: title,
            onScreenText: title,
            visualDirection: "Clean educational hook.",
            spokenLines: [title],
          },
        ];
    return resolveScenes(source, fps);
  }, [fps, scenes, title]);

  const activeSceneIndex = Math.max(
    0,
    resolvedScenes.findIndex(
      (scene) => second >= scene.startTimeInSeconds && second < scene.endTimeInSeconds
    )
  );
  const scene = resolvedScenes[activeSceneIndex] ?? resolvedScenes[resolvedScenes.length - 1];
  const sceneFrame = Math.max(0, frame - scene.startFrame);
  const finalScene = activeSceneIndex === resolvedScenes.length - 1;
  const subtitlePages = useMemo(() => buildSubtitlePages(subtitles), [subtitles]);
  const subtitle = subtitlePages.find((page) => second >= page.start && second <= page.end);
  const totalSeconds = Math.max(
    durationInSeconds ?? 0,
    resolvedScenes[resolvedScenes.length - 1]?.endTimeInSeconds ?? 1,
    1
  );
  const progress = Math.min(1, second / totalSeconds);
  const entrance = spring({ frame: sceneFrame, fps, config: { damping: 18, stiffness: 125 } });
  const fade = interpolate(entrance, [0, 1], [0, 1]);
  const y = interpolate(entrance, [0, 1], [32, 0]);
  const headline = finalScene ? neutralFinalText(scene.onScreenText) : scene.onScreenText;

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 18% 12%, rgba(16,185,129,0.24), transparent 32%), radial-gradient(circle at 82% 22%, rgba(59,130,246,0.16), transparent 30%), linear-gradient(180deg, #07100d 0%, #020403 100%)",
        color: "#ffffff",
        fontFamily: "Inter, Arial, sans-serif",
        overflow: "hidden",
        padding: 58,
      }}
    >
      <Audio src={staticFile(audioSrc)} />

      {previewMode ? (
        <div
          style={{
            position: "absolute",
            right: 28,
            top: 28,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(0,0,0,0.42)",
            padding: "10px 16px",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          PREVIEW
        </div>
      ) : null}

      <div
        style={{
          height: 9,
          width: "100%",
          borderRadius: 999,
          background: "rgba(255,255,255,0.12)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            borderRadius: 999,
            background: "#10b981",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 94,
          opacity: fade,
          transform: `translateY(${y}px)`,
          display: "flex",
          flexDirection: "column",
          minHeight: 1180,
        }}
      >
        <div
          style={{
            color: "#86efac",
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {finalScene ? "KEEP THIS" : scene.kicker}
        </div>

        <div
          style={{
            marginTop: 28,
            maxWidth: 930,
            fontSize: finalScene ? 72 : 66,
            fontWeight: 950,
            letterSpacing: -2.5,
            lineHeight: 1.02,
          }}
        >
          {headline}
        </div>

        {!finalScene ? (
          <div
            style={{
              marginTop: 38,
              maxWidth: 900,
              borderRadius: 34,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.07)",
              padding: "34px 36px",
              color: "#d1d5db",
              fontSize: 31,
              fontWeight: 650,
              lineHeight: 1.35,
            }}
          >
            {scene.spokenLines?.slice(1, 3).join(" ") || scene.narration}
          </div>
        ) : (
          <div
            style={{
              marginTop: 54,
              display: "grid",
              gap: 18,
              gridTemplateColumns: "1fr 1fr",
            }}
          >
            {["Clear message", "Useful next step", "Less friction", "Better decisions"].map(
              (label, index) => (
                <div
                  key={label}
                  style={{
                    borderRadius: 26,
                    border: "1px solid rgba(16,185,129,0.26)",
                    background: "rgba(16,185,129,0.08)",
                    padding: "26px 28px",
                    color: "#d1fae5",
                    fontSize: 28,
                    fontWeight: 850,
                    opacity: interpolate(sceneFrame, [10 + index * 6, 24 + index * 6], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                  }}
                >
                  {label}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {subtitle ? (
        <div
          style={{
            position: "absolute",
            left: 62,
            right: 62,
            bottom: 170,
            borderRadius: 26,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.72)",
            padding: "22px 26px",
            textAlign: "center",
            fontSize: 34,
            fontWeight: 800,
            lineHeight: 1.25,
          }}
        >
          {subtitle.text}
        </div>
      ) : null}

      <div
        style={{
          marginTop: "auto",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          paddingTop: 24,
          color: "#9ca3af",
          fontSize: 24,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {activeSceneIndex + 1}/{resolvedScenes.length}
      </div>
    </AbsoluteFill>
  );
};
