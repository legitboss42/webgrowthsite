import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type WebGrowthVideoScene = {
  durationInSeconds: number;
  kicker: string;
  narration: string;
  onScreenText: string;
  visualDirection: string;
  spokenLines?: string[];
  startTimeInSeconds?: number;
  endTimeInSeconds?: number;
};

export type SubtitleCue = {
  start: number;
  end: number;
  text: string;
};

export type WebGrowthArticleVideoProps = {
  title: string;
  caption: string;
  hashtags: string[];
  scenes: WebGrowthVideoScene[];
  subtitles?: SubtitleCue[];
  audioSrc?: string;
  durationInSeconds?: number;
  durationInFrames?: number;
  slug?: string;
};

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
  tokens: SubtitleCue[];
};

function resolveScenes(scenes: WebGrowthVideoScene[], fps: number): ResolvedScene[] {
  let cursor = 0;

  return scenes.map((scene) => {
    const startTimeInSeconds = scene.startTimeInSeconds ?? cursor;
    const endTimeInSeconds = Math.max(
      scene.endTimeInSeconds ?? startTimeInSeconds + scene.durationInSeconds,
      startTimeInSeconds + 0.6
    );
    const durationInSeconds = Math.max(endTimeInSeconds - startTimeInSeconds, 0.6);
    const startFrame = Math.max(0, Math.round(startTimeInSeconds * fps));
    const endFrame = Math.max(startFrame + 1, Math.round(endTimeInSeconds * fps));

    cursor = endTimeInSeconds;

    return {
      ...scene,
      durationInSeconds,
      startTimeInSeconds,
      endTimeInSeconds,
      startFrame,
      endFrame,
    };
  });
}

function buildSubtitlePages(subtitles: SubtitleCue[]) {
  const pages: SubtitlePage[] = [];

  for (const cue of subtitles) {
    const current = pages[pages.length - 1];

    if (!current) {
      pages.push({
        start: cue.start,
        end: cue.end,
        text: cue.text,
        tokens: [cue],
      });
      continue;
    }

    const nextText = `${current.text} ${cue.text}`.trim();
    const nextDurationMs = (cue.end - current.start) * 1000;
    const gapMs = (cue.start - current.end) * 1000;
    const shouldSplit =
      gapMs > 260 ||
      nextText.length > 42 ||
      nextDurationMs > 1600 ||
      /[.!?]$/.test(current.text);

    if (shouldSplit) {
      pages.push({
        start: cue.start,
        end: cue.end,
        text: cue.text,
        tokens: [cue],
      });
      continue;
    }

    current.end = cue.end;
    current.text = nextText;
    current.tokens.push(cue);
  }

  return pages;
}

function getActiveScene(currentSecond: number, scenes: ResolvedScene[]) {
  const match = scenes.find(
    (scene) =>
      currentSecond >= scene.startTimeInSeconds &&
      currentSecond < scene.endTimeInSeconds
  );

  return match ?? scenes[scenes.length - 1];
}

function getActiveSubtitlePage(currentSecond: number, pages: SubtitlePage[]) {
  return pages.find((page) => currentSecond >= page.start && currentSecond <= page.end);
}

function ScreenshotVisual({
  slug,
  sceneIndex,
  sceneFrame,
}: {
  slug?: string;
  sceneIndex: number;
  sceneFrame: number;
}) {
  const assetNames = ["hero.png", "problem.png", "solution.png", "result.png"];
  const assetName = assetNames[Math.min(sceneIndex, assetNames.length - 1)] ?? "hero.png";

  const zoom = interpolate(sceneFrame, [0, 120], [1.03, 1.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const y = interpolate(sceneFrame, [0, 120], [0, -34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (!slug) return null;

  return (
    <div
      style={{
        marginTop: 48,
        borderRadius: 36,
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 34px 100px rgba(0,0,0,0.42)",
        height: 640,
        overflow: "hidden",
        position: "relative",
        background: "rgba(255,255,255,0.08)",
      }}
    >
      <Img
        src={staticFile(`article-assets/${slug}/${assetName}`)}
        style={{
          height: "100%",
          objectFit: "cover",
          opacity: 0.9,
          transform: `translateY(${y}px) scale(${zoom})`,
          width: "100%",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(2,4,3,0.12) 0%, rgba(2,4,3,0.72) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 28,
          right: 28,
          background: "rgba(0,0,0,0.54)",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 24,
          color: "#f9fafb",
          fontSize: 26,
          fontWeight: 800,
          padding: "18px 22px",
        }}
      >
        {assetName.replace(".png", "").toUpperCase()} VIEW
      </div>
    </div>
  );
}

function AnimatedCard({
  children,
  delay,
  sceneFrame,
}: {
  children: React.ReactNode;
  delay: number;
  sceneFrame: number;
}) {
  const opacity = interpolate(sceneFrame, [delay, delay + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const y = interpolate(sceneFrame, [delay, delay + 18], [42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: 28,
        padding: "28px 32px",
        color: "#f9fafb",
        fontSize: 34,
        fontWeight: 800,
        boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
      }}
    >
      {children}
    </div>
  );
}

function FallbackVisual({
  sceneIndex,
  sceneFrame,
}: {
  sceneIndex: number;
  sceneFrame: number;
}) {
  if (sceneIndex === 1) {
    const bars = [0.92, 0.48, 0.08];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 56 }}>
        {["1,000 visitors", "142 engaged", "3 enquiries"].map((label, index) => {
          const width = interpolate(
            sceneFrame,
            [14 + index * 8, 42 + index * 8],
            [0, bars[index] * 100],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }
          );

          return (
            <div key={label}>
              <div style={{ color: "#d1d5db", fontSize: 28, marginBottom: 8 }}>
                {label}
              </div>

              <div
                style={{
                  height: 24,
                  width: "100%",
                  background: "rgba(255,255,255,0.10)",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${width}%`,
                    background: index === 2 ? "#f59e0b" : "#10b981",
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (sceneIndex === 2) {
    return (
      <div
        style={{
          display: "grid",
          gap: 22,
          gridTemplateColumns: "1fr 1fr",
          marginTop: 56,
        }}
      >
        {["Message", "Structure", "Proof", "Next Step"].map((label, index) => (
          <AnimatedCard key={label} delay={12 + index * 7} sceneFrame={sceneFrame}>
            <div style={{ color: "#10b981", fontSize: 24, marginBottom: 10 }}>
              0{index + 1}
            </div>
            {label}
          </AnimatedCard>
        ))}
      </div>
    );
  }

  return null;
}

function SceneVisual({
  sceneIndex,
  sceneFrame,
  slug,
}: {
  sceneIndex: number;
  sceneFrame: number;
  slug?: string;
}) {
  if (slug) {
    return <ScreenshotVisual slug={slug} sceneIndex={sceneIndex} sceneFrame={sceneFrame} />;
  }

  return <FallbackVisual sceneIndex={sceneIndex} sceneFrame={sceneFrame} />;
}

export const WebGrowthArticleVideo: React.FC<WebGrowthArticleVideoProps> = ({
  title,
  caption,
  hashtags,
  scenes,
  subtitles = [],
  audioSrc = "article-voice.mp3",
  durationInSeconds,
  slug,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSecond = frame / fps;

  const resolvedScenes = useMemo(() => {
    const activeScenes =
      scenes.length > 0
        ? scenes
        : [
            {
              durationInSeconds: 3,
              kicker: "Hook",
              narration: title,
              spokenLines: [title],
              onScreenText: title,
              visualDirection: "Fallback title scene.",
              startTimeInSeconds: 0,
              endTimeInSeconds: 3,
            },
          ];

    return resolveScenes(activeScenes, fps);
  }, [fps, scenes, title]);

  const subtitlePages = useMemo(() => buildSubtitlePages(subtitles), [subtitles]);

  const scene = getActiveScene(currentSecond, resolvedScenes);
  const sceneIndex = resolvedScenes.findIndex(
    (item) =>
      item.startTimeInSeconds === scene.startTimeInSeconds &&
      item.endTimeInSeconds === scene.endTimeInSeconds
  );
  const sceneFrame = Math.max(0, frame - scene.startFrame);
  const activeSubtitlePage = getActiveSubtitlePage(currentSecond, subtitlePages);

  const entrance = spring({
    frame: sceneFrame,
    fps,
    config: {
      damping: 18,
      stiffness: 120,
    },
  });

  const fadeIn = interpolate(sceneFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sceneDurationFrames = Math.max(1, scene.endFrame - scene.startFrame);

  const fadeOut = interpolate(
    sceneFrame,
    [Math.max(0, sceneDurationFrames - 15), sceneDurationFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const effectiveDurationInFrames = Math.max(
    1,
    Math.ceil(
      (durationInSeconds ??
        resolvedScenes[resolvedScenes.length - 1]?.endTimeInSeconds ??
        1) * fps
    )
  );

  const progress = Math.min(1, frame / Math.max(1, effectiveDurationInFrames - 1));
  const supportLines = scene.spokenLines?.slice(1, 3) ?? [];
  const activeWord = activeSubtitlePage?.tokens.find(
    (token) => currentSecond >= token.start && currentSecond <= token.end
  );

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.24), transparent 34%), radial-gradient(circle at 80% 10%, rgba(245,158,11,0.16), transparent 28%), linear-gradient(180deg, #06120d 0%, #020403 100%)",
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
        overflow: "hidden",
        padding: 72,
      }}
    >
      <Audio src={staticFile(audioSrc)} />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.055) 0 1px, transparent 1px 26px)",
          opacity: 0.32,
          transform: `translateY(${frame * -0.25}px)`,
        }}
      />

      <div
        style={{
          height: 10,
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.12)",
          borderRadius: 999,
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            backgroundColor: "#10b981",
            borderRadius: 999,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 86,
          opacity: fadeIn * fadeOut,
          transform: `translateY(${interpolate(entrance, [0, 1], [42, 0])}px) scale(${interpolate(
            entrance,
            [0, 1],
            [0.96, 1]
          )})`,
          zIndex: 2,
        }}
      >
        <div
          style={{
            color: "#10b981",
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: 5,
            marginBottom: 30,
            textTransform: "uppercase",
          }}
        >
          {scene.kicker}
        </div>

        <div
          style={{
            fontSize: 70,
            fontWeight: 950,
            letterSpacing: -3,
            lineHeight: 1.02,
            maxWidth: 940,
          }}
        >
          {scene.onScreenText}
        </div>

        <div
          style={{
            color: "#d1d5db",
            display: "flex",
            flexDirection: "column",
            fontSize: 28,
            gap: 14,
            lineHeight: 1.35,
            marginTop: 28,
            maxWidth: 900,
          }}
        >
          {supportLines.length > 0 ? (
            supportLines.map((line) => <div key={line}>{line}</div>)
          ) : (
            <div>{scene.narration}</div>
          )}
        </div>

        <SceneVisual sceneIndex={sceneIndex} sceneFrame={sceneFrame} slug={slug} />
      </div>

      {activeSubtitlePage ? (
        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            bottom: 210,
            zIndex: 5,
            background: "rgba(0,0,0,0.74)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 28,
            color: "#ffffff",
            fontSize: 34,
            fontWeight: 800,
            lineHeight: 1.25,
            padding: "22px 28px",
            textAlign: "center",
          }}
        >
          {activeSubtitlePage.tokens.map((token, index) => {
            const isActive =
              activeWord?.start === token.start &&
              activeWord?.end === token.end &&
              activeWord?.text === token.text;

            return (
              <span
                key={`${token.start}-${token.end}-${index}`}
                style={{
                  color: isActive ? "#10b981" : "#ffffff",
                }}
              >
                {token.text}
                {index < activeSubtitlePage.tokens.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ) : null}

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,0.16)",
          paddingTop: 30,
          color: "#d1d5db",
          fontSize: 28,
          zIndex: 2,
        }}
      >
        <div>WEB GROWTH</div>
        <div>
          {sceneIndex + 1}/{resolvedScenes.length}
        </div>
      </div>

      {sceneIndex === resolvedScenes.length - 1 ? (
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: 72,
            right: 72,
            color: "#9ca3af",
            fontSize: 24,
            lineHeight: 1.35,
            zIndex: 3,
          }}
        >
          {caption}
          <br />
          {hashtags.slice(0, 3).join(" ")}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};