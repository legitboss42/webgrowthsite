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
import { MrWebGrowth, type PresenterMode } from "./MrWebGrowth";

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
  previewMode?: boolean;
  articleAssetsAvailable?: boolean;
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

type CharacterPlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
  characterX: number;
  characterY: number;
  scale: number;
  opacity: number;
  zIndex: number;
  motionPreset: PresenterMode;
  motionIntensity: number;
  entranceOffsetX: number;
  entranceOffsetY: number;
  entranceStartScale: number;
  entranceDurationFrames: number;
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

function getSceneLabel(sceneIndex: number) {
  if (sceneIndex === 0) return "ARTICLE";
  if (sceneIndex === 1) return "PROBLEM";
  if (sceneIndex === 2) return "SOLUTION";
  if (sceneIndex === 3) return "ACTION";
  if (sceneIndex === 4) return "RESULT";
  return "NEXT";
}

function getCharacterSceneMode(sceneIndex: number, lastSceneIndex: number): PresenterMode {
  if (sceneIndex === 0) return "hook";
  if (sceneIndex === lastSceneIndex) return "cta";
  if (sceneIndex === 1) return "problem";
  if (sceneIndex === lastSceneIndex - 1) return "result";
  return "solution";
}

function getMrWebGrowthPlacement(
  sceneIndex: number,
  lastSceneIndex: number
): CharacterPlacement {
  const motionPreset = getCharacterSceneMode(sceneIndex, lastSceneIndex);

  switch (motionPreset) {
    case "hook":
      return {
        x: 812,
        y: 1150,
        width: 224,
        height: 304,
        characterX: -110,
        characterY: -70,
        scale: 0.8,
        opacity: 0.95,
        zIndex: 4,
        motionPreset,
        motionIntensity: 0.8,
        entranceOffsetX: 0,
        entranceOffsetY: 40,
        entranceStartScale: 0.95,
        entranceDurationFrames: 26,
      };
    case "problem":
      return {
        x: 846,
        y: 964,
        width: 170,
        height: 228,
        characterX: -126,
        characterY: -86,
        scale: 0.58,
        opacity: 0.84,
        zIndex: 3,
        motionPreset,
        motionIntensity: 0.5,
        entranceOffsetX: 16,
        entranceOffsetY: 20,
        entranceStartScale: 0.96,
        entranceDurationFrames: 22,
      };
    case "solution":
      return sceneIndex % 2 === 0
        ? {
            x: 56,
            y: 972,
            width: 172,
            height: 232,
            characterX: -120,
            characterY: -84,
            scale: 0.6,
            opacity: 0.88,
            zIndex: 3,
            motionPreset,
            motionIntensity: 0.72,
            entranceOffsetX: -14,
            entranceOffsetY: 18,
            entranceStartScale: 0.96,
            entranceDurationFrames: 22,
          }
        : {
            x: 846,
            y: 976,
            width: 172,
            height: 232,
            characterX: -120,
            characterY: -84,
            scale: 0.6,
            opacity: 0.88,
            zIndex: 3,
            motionPreset,
            motionIntensity: 0.74,
            entranceOffsetX: 14,
            entranceOffsetY: 18,
            entranceStartScale: 0.96,
            entranceDurationFrames: 22,
          };
    case "result":
      return {
        x: 70,
        y: 980,
        width: 178,
        height: 236,
        characterX: -122,
        characterY: -84,
        scale: 0.61,
        opacity: 0.9,
        zIndex: 3,
        motionPreset,
        motionIntensity: 0.62,
        entranceOffsetX: -12,
        entranceOffsetY: 18,
        entranceStartScale: 0.97,
        entranceDurationFrames: 22,
      };
    case "cta":
    default:
      return {
        x: 812,
        y: 1046,
        width: 210,
        height: 270,
        characterX: -120,
        characterY: -80,
        scale: 0.68,
        opacity: 0.94,
        zIndex: 4,
        motionPreset: "cta",
        motionIntensity: 0.86,
        entranceOffsetX: 18,
        entranceOffsetY: 18,
        entranceStartScale: 0.96,
        entranceDurationFrames: 28,
      };
  }
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
        background: "rgba(2,4,3,0.72)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 24,
        padding: "22px 24px",
        color: "#f9fafb",
        fontSize: 28,
        fontWeight: 900,
        boxShadow: "0 24px 80px rgba(0,0,0,0.36)",
        backdropFilter: "blur(12px)",
      }}
    >
      {children}
    </div>
  );
}

function ScreenshotBackground({
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

  const zoom = interpolate(sceneFrame, [0, 180], [1, 1.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const y = interpolate(sceneFrame, [0, 180], [0, -120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const x = interpolate(
    sceneFrame,
    [0, 180],
    [0, sceneIndex % 2 === 0 ? -80 : 80],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  if (!slug) return null;

  return (
    <>
      <Img
        src={staticFile(`article-assets/${slug}/${assetName}`)}
        style={{
          position: "absolute",
          inset: 0,
          height: "100%",
          objectFit: "cover",
          opacity: 0.72,
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          width: "100%",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(2,4,3,0.38) 0%, rgba(2,4,3,0.28) 45%, rgba(2,4,3,0.66) 100%)",
        }}
      />
    </>
  );
}

function SceneBadge({
  sceneIndex,
  sceneFrame,
}: {
  sceneIndex: number;
  sceneFrame: number;
}) {
  const opacity = interpolate(sceneFrame, [10, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const y = interpolate(sceneFrame, [10, 28], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        alignSelf: "flex-start",
        background: "rgba(16,185,129,0.16)",
        border: "1px solid rgba(16,185,129,0.48)",
        borderRadius: 999,
        color: "#bbf7d0",
        fontSize: 22,
        fontWeight: 900,
        letterSpacing: 3,
        marginBottom: 24,
        opacity,
        padding: "12px 18px",
        textTransform: "uppercase",
        transform: `translateY(${y}px)`,
      }}
    >
      {getSceneLabel(sceneIndex)}
    </div>
  );
}

function BrowserFrameVisual({
  sceneFrame,
  sceneIndex,
}: {
  sceneFrame: number;
  sceneIndex: number;
}) {
  const zoom = interpolate(sceneFrame, [0, 90], [0.96, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pulse = interpolate(sceneFrame % 45, [0, 22, 45], [0.55, 1, 0.55]);

  return (
    <div
      style={{
        transform: `scale(${zoom})`,
        background: "rgba(2,4,3,0.66)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 30,
        boxShadow: "0 34px 100px rgba(0,0,0,0.42)",
        overflow: "hidden",
        backdropFilter: "blur(14px)",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "rgba(255,255,255,0.10)",
          display: "flex",
          gap: 12,
          padding: "16px 22px",
        }}
      >
        {["#ef4444", "#f59e0b", "#10b981"].map((color) => (
          <div
            key={color}
            style={{
              background: color,
              borderRadius: 999,
              height: 14,
              width: 14,
            }}
          />
        ))}

        <div
          style={{
            color: "#9ca3af",
            fontSize: 20,
            marginLeft: 16,
          }}
        >
          webgrowth.info/audit
        </div>
      </div>

      <div style={{ padding: 28 }}>
        <div
          style={{
            color: "#f9fafb",
            fontSize: 32,
            fontWeight: 900,
            lineHeight: 1.08,
            marginBottom: 20,
          }}
        >
          {sceneIndex === 0
            ? "The page looked fine."
            : "The issue was hiding underneath."}
        </div>

        <div
          style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.45)",
            borderRadius: 20,
            color: "#fecaca",
            fontSize: 24,
            fontWeight: 900,
            opacity: pulse,
            padding: "18px 20px",
          }}
        >
          {sceneIndex === 0
            ? "Good design does not mean good performance."
            : "The obvious problem was not the real problem."}
        </div>

        <div style={{ display: "grid", gap: 14, marginTop: 22 }}>
          {[84, 62, 38].map((width, index) => (
            <div
              key={width}
              style={{
                background: "rgba(255,255,255,0.12)",
                borderRadius: 999,
                height: 16,
                width: `${width - index * 4}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FunnelLeakOverlay({ sceneFrame }: { sceneFrame: number }) {
  const bars = [0.92, 0.48, 0.08];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        background: "rgba(2,4,3,0.68)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 30,
        padding: 28,
        backdropFilter: "blur(14px)",
        boxShadow: "0 34px 100px rgba(0,0,0,0.38)",
      }}
    >
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
            <div style={{ color: "#d1d5db", fontSize: 24, marginBottom: 8 }}>
              {label}
            </div>

            <div
              style={{
                height: 22,
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

      <div
        style={{
          background: "rgba(245,158,11,0.12)",
          border: "1px solid rgba(245,158,11,0.45)",
          borderRadius: 22,
          color: "#fde68a",
          fontSize: 24,
          fontWeight: 900,
          marginTop: 10,
          padding: "18px 20px",
          textAlign: "center",
        }}
      >
        The leak was not traffic. It was clarity.
      </div>
    </div>
  );
}

function BlueprintOverlay({ sceneFrame }: { sceneFrame: number }) {
  const items = ["Message", "Structure", "Proof", "Next Step"];

  return (
    <div
      style={{
        display: "grid",
        gap: 18,
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      {items.map((label, index) => (
        <AnimatedCard key={label} delay={12 + index * 7} sceneFrame={sceneFrame}>
          <div style={{ color: "#10b981", fontSize: 22, marginBottom: 8 }}>
            0{index + 1}
          </div>
          {label}
        </AnimatedCard>
      ))}
    </div>
  );
}

function BeforeAfterOverlay({ sceneFrame }: { sceneFrame: number }) {
  const arrowProgress = interpolate(sceneFrame, [24, 54], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: 22,
      }}
    >
      <AnimatedCard delay={10} sceneFrame={sceneFrame}>
        BEFORE
        <div style={{ color: "#9ca3af", fontSize: 22, marginTop: 10 }}>
          Looked fine
        </div>
        <div style={{ color: "#fca5a5", fontSize: 22, marginTop: 6 }}>
          No clear path
        </div>
      </AnimatedCard>

      <div
        style={{
          color: "#10b981",
          fontSize: 48,
          fontWeight: 900,
          opacity: arrowProgress,
          transform: `scale(${0.8 + arrowProgress * 0.2})`,
        }}
      >
        -&gt;
      </div>

      <AnimatedCard delay={34} sceneFrame={sceneFrame}>
        AFTER
        <div style={{ color: "#9ca3af", fontSize: 22, marginTop: 10 }}>
          Built around action
        </div>
        <div style={{ color: "#86efac", fontSize: 22, marginTop: 6 }}>
          Message first
        </div>
      </AnimatedCard>
    </div>
  );
}

function CtaOverlay({ sceneFrame }: { sceneFrame: number }) {
  const glow = interpolate(sceneFrame % 90, [0, 45, 90], [0.65, 1, 0.65]);

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#10b981",
          fontSize: 30,
          fontWeight: 950,
          letterSpacing: 5,
          marginBottom: 22,
          opacity: glow,
        }}
      >
        WEB GROWTH
      </div>

      <div
        style={{
          color: "#f9fafb",
          fontSize: 58,
          fontWeight: 950,
          letterSpacing: -2,
          lineHeight: 1.02,
          maxWidth: 760,
          marginBottom: 28,
        }}
      >
        Read the full strategy breakdown
      </div>

      <div
        style={{
          background: "rgba(16,185,129,0.14)",
          border: "2px solid rgba(16,185,129,0.48)",
          borderRadius: 999,
          color: "#bbf7d0",
          fontSize: 30,
          fontWeight: 900,
          padding: "20px 32px",
          boxShadow: "0 24px 90px rgba(16,185,129,0.20)",
        }}
      >
        webgrowth.info
      </div>

      <div
        style={{
          color: "#9ca3af",
          fontSize: 24,
          lineHeight: 1.35,
          marginTop: 28,
          maxWidth: 660,
        }}
      >
        Website strategy, SEO, conversion, and performance fixes for serious business pages.
      </div>
    </div>
  );
}

function MotionOverlay({
  sceneIndex,
  sceneFrame,
}: {
  sceneIndex: number;
  sceneFrame: number;
}) {
  if (sceneIndex === 0) {
    return <BrowserFrameVisual sceneFrame={sceneFrame} sceneIndex={sceneIndex} />;
  }

  if (sceneIndex === 1) {
    return <FunnelLeakOverlay sceneFrame={sceneFrame} />;
  }

  if (sceneIndex === 2) {
    return <BlueprintOverlay sceneFrame={sceneFrame} />;
  }

  if (sceneIndex === 3 || sceneIndex === 4) {
    return <BeforeAfterOverlay sceneFrame={sceneFrame} />;
  }

  return <CtaOverlay sceneFrame={sceneFrame} />;
}

function SceneVisual({
  sceneIndex,
  sceneFrame,
  slug,
  isFinalScene,
  articleAssetsAvailable,
}: {
  sceneIndex: number;
  sceneFrame: number;
  slug?: string;
  isFinalScene: boolean;
  articleAssetsAvailable: boolean;
}) {
  return (
    <div
      style={{
        marginTop: 18,
        borderRadius: 38,
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 34px 100px rgba(0,0,0,0.42)",
        height: 800,
        overflow: "hidden",
        position: "relative",
        background: "rgba(255,255,255,0.08)",
      }}
    >
      {!isFinalScene && articleAssetsAvailable && slug ? (
        <ScreenshotBackground slug={slug} sceneIndex={sceneIndex} sceneFrame={sceneFrame} />
      ) : null}

      {!slug || !articleAssetsAvailable || isFinalScene ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 24% 18%, rgba(16,185,129,0.34), transparent 34%), radial-gradient(circle at 78% 20%, rgba(245,158,11,0.20), transparent 30%), linear-gradient(180deg, #06120d 0%, #020403 100%)",
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: isFinalScene ? "center" : "space-between",
          padding: 30,
        }}
      >
        {!isFinalScene ? (
          <SceneBadge sceneIndex={sceneIndex} sceneFrame={sceneFrame} />
        ) : null}

        <div
          style={{
            alignSelf: isFinalScene
              ? "stretch"
              : sceneIndex % 2 === 0
              ? "flex-start"
              : "flex-end",
            maxWidth: isFinalScene ? "100%" : sceneIndex === 2 ? 720 : 760,
            width: isFinalScene || sceneIndex === 2 ? "100%" : "auto",
            height: isFinalScene ? "100%" : "auto",
          }}
        >
          <MotionOverlay sceneIndex={sceneIndex} sceneFrame={sceneFrame} />
        </div>
      </div>
    </div>
  );
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
  previewMode = false,
  articleAssetsAvailable = false,
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
  const isFinalScene = sceneIndex === resolvedScenes.length - 1;

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
  const isTalking = Boolean(activeSubtitlePage);
  const characterPlacement = getMrWebGrowthPlacement(
    sceneIndex,
    resolvedScenes.length - 1
  );
  const characterEntrance = spring({
    frame: Math.min(sceneFrame, characterPlacement.entranceDurationFrames),
    fps,
    durationInFrames: characterPlacement.entranceDurationFrames,
    config:
      characterPlacement.motionPreset === "cta"
        ? {
            damping: 16,
            stiffness: 120,
            mass: 0.9,
          }
        : {
            damping: 18,
            stiffness: 132,
            mass: 0.92,
          },
  });
  const characterTranslateX = interpolate(
    characterEntrance,
    [0, 1],
    [characterPlacement.entranceOffsetX, 0]
  );
  const characterTranslateY = interpolate(
    characterEntrance,
    [0, 1],
    [characterPlacement.entranceOffsetY, 0]
  );
  const characterScaleIn = interpolate(
    characterEntrance,
    [0, 1],
    [characterPlacement.entranceStartScale, 1]
  );
  const characterOpacity = interpolate(
    characterEntrance,
    [0, 1],
    [0, characterPlacement.opacity]
  );

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.24), transparent 34%), radial-gradient(circle at 80% 10%, rgba(245,158,11,0.16), transparent 28%), linear-gradient(180deg, #06120d 0%, #020403 100%)",
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
        overflow: "hidden",
        padding: 56,
      }}
    >
      <Audio src={staticFile(audioSrc)} />

      {previewMode ? (
        <div
          style={{
            position: "absolute",
            top: 26,
            right: 26,
            zIndex: 20,
            background: "rgba(245,158,11,0.18)",
            border: "1px solid rgba(245,158,11,0.52)",
            borderRadius: 999,
            color: "#fde68a",
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: 2,
            padding: "10px 16px",
          }}
        >
          PREVIEW MODE
        </div>
      ) : null}

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
          marginTop: 48,
          opacity: fadeIn * fadeOut,
          transform: `translateY(${interpolate(entrance, [0, 1], [34, 0])}px) scale(${interpolate(
            entrance,
            [0, 1],
            [0.97, 1]
          )})`,
          zIndex: 2,
        }}
      >
        <div
          style={{
            color: "#10b981",
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: 5,
            marginBottom: 20,
            textTransform: "uppercase",
          }}
        >
          {scene.kicker}
        </div>

        <div
          style={{
            fontSize: 62,
            fontWeight: 950,
            letterSpacing: -3,
            lineHeight: 1.02,
            maxWidth: 940,
          }}
        >
          {scene.onScreenText}
        </div>

        {!isFinalScene ? (
          <div
            style={{
              color: "#d1d5db",
              display: "flex",
              flexDirection: "column",
              fontSize: 24,
              gap: 10,
              lineHeight: 1.32,
              marginTop: 20,
              maxWidth: 900,
            }}
          >
            {supportLines.length > 0 ? (
              supportLines.map((line) => <div key={line}>{line}</div>)
            ) : (
              <div>{scene.narration}</div>
            )}
          </div>
        ) : null}

        <SceneVisual
          sceneIndex={sceneIndex}
          sceneFrame={sceneFrame}
          slug={slug}
          isFinalScene={isFinalScene}
          articleAssetsAvailable={articleAssetsAvailable}
        />
      </div>

      {characterPlacement ? (
        <div
          style={{
            position: "absolute",
            left: characterPlacement.x,
            top: characterPlacement.y,
            width: characterPlacement.width,
            height: characterPlacement.height,
            overflow: "visible",
            zIndex: characterPlacement.zIndex,
            pointerEvents: "none",
            filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.30))",
            opacity: characterOpacity,
            transform: `translate3d(${characterTranslateX}px, ${characterTranslateY}px, 0) scale(${characterScaleIn})`,
            transformOrigin:
              characterPlacement.motionPreset === "cta"
                ? "right bottom"
                : sceneIndex % 2 === 0
                  ? "right bottom"
                  : "left bottom",
          }}
        >
          <MrWebGrowth
            x={characterPlacement.characterX}
            y={characterPlacement.characterY}
            scale={characterPlacement.scale}
            opacity={1}
            zIndex={characterPlacement.zIndex}
            talking={isTalking}
            motionPreset={characterPlacement.motionPreset}
            motionIntensity={characterPlacement.motionIntensity}
          />
        </div>
      ) : null}

      {activeSubtitlePage ? (
        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            bottom: 190,
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
          paddingTop: 24,
          color: "#d1d5db",
          fontSize: 26,
          zIndex: 2,
        }}
      >
        <div>WEB GROWTH</div>
        <div>
          {sceneIndex + 1}/{resolvedScenes.length}
        </div>
      </div>

      {isFinalScene ? (
        <div
          style={{
            position: "absolute",
            bottom: 104,
            left: 56,
            right: 56,
            color: "#9ca3af",
            fontSize: 22,
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
