import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Scene = {
  durationInSeconds: number;
  kicker: string;
  narration: string;
  onScreenText: string;
  visualDirection: string;
};

type Props = {
  title: string;
  caption: string;
  hashtags: string[];
  scenes: Scene[];
};

function getSceneAtFrame(frame: number, scenes: Scene[], fps: number) {
  let startFrame = 0;

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const durationFrames = Math.max(1, Math.round(scene.durationInSeconds * fps));
    const endFrame = startFrame + durationFrames;

    if (frame >= startFrame && frame < endFrame) {
      return {
        scene,
        sceneIndex: index,
        sceneFrame: frame - startFrame,
      };
    }

    startFrame = endFrame;
  }

  const fallbackScene = scenes[scenes.length - 1];

  return {
    scene: fallbackScene,
    sceneIndex: Math.max(0, scenes.length - 1),
    sceneFrame: 0,
  };
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

function SceneVisual({
  sceneIndex,
  sceneFrame,
}: {
  sceneIndex: number;
  sceneFrame: number;
}) {
  if (sceneIndex === 1) {
    const bars = [0.82, 0.45, 0.12];

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
          marginTop: 56,
        }}
      >
        {["1,000 visitors", "100 readers", "2 leads"].map((label, index) => {
          const width = interpolate(
            sceneFrame,
            [18 + index * 8, 42 + index * 8],
            [0, bars[index] * 100],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }
          );

          return (
            <div key={label}>
              <div
                style={{
                  color: "#d1d5db",
                  fontSize: 28,
                  marginBottom: 8,
                }}
              >
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
      </div>
    );
  }

  if (sceneIndex === 2) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 22,
          marginTop: 56,
        }}
      >
        {["MESSAGE", "STRUCTURE", "PROOF", "CTA"].map((label, index) => (
          <AnimatedCard key={label} delay={18 + index * 7} sceneFrame={sceneFrame}>
            {label}
          </AnimatedCard>
        ))}
      </div>
    );
  }

  if (sceneIndex === 3) {
    const arrowProgress = interpolate(sceneFrame, [24, 54], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 28,
          marginTop: 56,
        }}
      >
        <AnimatedCard delay={10} sceneFrame={sceneFrame}>
          BEFORE
          <div style={{ color: "#9ca3af", fontSize: 24, marginTop: 12 }}>
            Pretty but unclear
          </div>
        </AnimatedCard>

        <div
          style={{
            color: "#10b981",
            fontSize: 54,
            fontWeight: 900,
            opacity: arrowProgress,
            transform: `scale(${0.8 + arrowProgress * 0.2})`,
          }}
        >
          →
        </div>

        <AnimatedCard delay={34} sceneFrame={sceneFrame}>
          AFTER
          <div style={{ color: "#9ca3af", fontSize: 24, marginTop: 12 }}>
            Built to convert
          </div>
        </AnimatedCard>
      </div>
    );
  }

  if (sceneIndex === 4) {
    return (
      <div
        style={{
          marginTop: 56,
          background: "rgba(16,185,129,0.12)",
          border: "2px solid rgba(16,185,129,0.45)",
          borderRadius: 36,
          padding: 40,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: "#10b981",
            fontSize: 34,
            fontWeight: 900,
            marginBottom: 18,
          }}
        >
          WEBGROWTH.INFO
        </div>
        <div
          style={{
            color: "#f9fafb",
            fontSize: 28,
            lineHeight: 1.35,
          }}
        >
          Read the full strategy breakdown
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 56,
        display: "flex",
        gap: 16,
      }}
    >
      {[0, 1, 2].map((item) => {
        const pulse = interpolate(sceneFrame % 40, [0, 20, 40], [0.45, 1, 0.45]);

        return (
          <div
            key={item}
            style={{
              height: 18,
              width: 18,
              borderRadius: 999,
              background: "#10b981",
              opacity: pulse,
            }}
          />
        );
      })}
    </div>
  );
}

export const WebGrowthArticleVideo: React.FC<Props> = ({
  title,
  caption,
  hashtags,
  scenes,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeScenes =
    scenes.length > 0
      ? scenes
      : [
          {
            durationInSeconds: 4,
            kicker: "Hook",
            narration: title,
            onScreenText: title,
            visualDirection: "Fallback title scene.",
          },
        ];

  const { scene, sceneIndex, sceneFrame } = getSceneAtFrame(frame, activeScenes, fps);

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

  const sceneDurationFrames = Math.max(1, scene.durationInSeconds * fps);

  const fadeOut = interpolate(
    sceneFrame,
    [Math.max(0, sceneDurationFrames - 15), sceneDurationFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const totalFrames = Math.max(
    1,
    activeScenes.reduce((total, item) => total + item.durationInSeconds * fps, 0)
  );

  const progress = Math.min(1, frame / totalFrames);

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
      <Audio src={staticFile("article-voice.mp3")} />

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
            fontSize: 78,
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
            fontSize: 32,
            lineHeight: 1.35,
            marginTop: 34,
            maxWidth: 900,
          }}
        >
          {scene.narration}
        </div>

        <SceneVisual sceneIndex={sceneIndex} sceneFrame={sceneFrame} />
      </div>

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
          {sceneIndex + 1}/{activeScenes.length}
        </div>
      </div>

      {sceneIndex === activeScenes.length - 1 ? (
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