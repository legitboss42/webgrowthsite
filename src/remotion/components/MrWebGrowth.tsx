import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * Mr Web Growth rig notes:
 * - `TORSO_FRAME` controls the body artwork placement.
 * - `HEAD_FRAME` controls where the head sits over the neck.
 * - `EYES_FRAME` controls the blinking eye overlay.
 * - `MOUTH_FRAME` controls the talking mouth overlay.
 * - Adjust `x`, `y`, and `scale` props to move the entire presenter.
 * - Assets in `public/characters/mr-web-growth-figma/` must keep transparent backgrounds.
 * - Use `debug` to reveal frame guides when realigning future assets.
 */

export type PresenterMode = "idle" | "hook" | "problem" | "solution" | "result" | "cta";

type MrWebGrowthProps = {
  x?: number;
  y?: number;
  scale?: number;
  talking?: boolean;
  opacity?: number;
  zIndex?: number;
  debug?: boolean;
  motionPreset?: PresenterMode;
  motionIntensity?: number;
};

type MotionProfile = {
  breath: number;
  head: number;
  idle: number;
  talk: number;
  postureLift: number;
};

type LayerFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MotionState = {
  bodyScale: number;
  bodyX: number;
  bodyY: number;
  bodyRotate: number;
  torsoX: number;
  torsoY: number;
  torsoRotate: number;
  torsoScaleX: number;
  headX: number;
  headY: number;
  headRotate: number;
  mouthY: number;
};

const CHARACTER_WIDTH = 400;
const CHARACTER_HEIGHT = 660;

const TORSO_FRAME: LayerFrame = {
  x: 50,
  y: 228,
  width: 300,
  height: 410,
};

const HEAD_FRAME: LayerFrame = {
  x: 86,
  y: 88,
  width: 228,
  height: 228,
};

const EYES_FRAME: LayerFrame = {
  x: 146,
  y: 178,
  width: 108,
  height: 40,
};

const MOUTH_FRAME: LayerFrame = {
  x: 153,
  y: 232,
  width: 94,
  height: 52,
};

const EYE_ASSETS = {
  open: "characters/mr-web-growth-figma/eyes-open.svg",
  half: "characters/mr-web-growth-figma/eyes-half.svg",
  closed: "characters/mr-web-growth-figma/eyes-closed.svg",
} as const;

const CLOSED_MOUTH_ASSET = "characters/mr-web-growth-figma/mouth-closed.svg";

const TALKING_MOUTH_ASSETS = [
  "characters/mr-web-growth-figma/mouth-a.svg",
  "characters/mr-web-growth-figma/mouth-e.svg",
  "characters/mr-web-growth-figma/mouth-o.svg",
  "characters/mr-web-growth-figma/mouth-m.svg",
  "characters/mr-web-growth-figma/mouth-f.svg",
] as const;

const MOUTH_HOLD_FRAMES = [3, 4, 3, 4, 3] as const;

const MOTION_PROFILES: Record<PresenterMode, MotionProfile> = {
  idle: {
    breath: 0.75,
    head: 0.7,
    idle: 0.65,
    talk: 0.65,
    postureLift: 0,
  },
  hook: {
    breath: 0.95,
    head: 0.92,
    idle: 0.86,
    talk: 0.9,
    postureLift: -1.5,
  },
  problem: {
    breath: 0.62,
    head: 0.52,
    idle: 0.42,
    talk: 0.54,
    postureLift: 0.5,
  },
  solution: {
    breath: 0.82,
    head: 0.74,
    idle: 0.68,
    talk: 0.98,
    postureLift: -0.5,
  },
  result: {
    breath: 0.72,
    head: 0.64,
    idle: 0.54,
    talk: 0.72,
    postureLift: -0.75,
  },
  cta: {
    breath: 0.88,
    head: 0.84,
    idle: 0.7,
    talk: 0.78,
    postureLift: -2,
  },
};

function hashNoise(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function getBlinkAsset(frame: number, fps: number) {
  const blinkSequence = [
    EYE_ASSETS.open,
    EYE_ASSETS.half,
    EYE_ASSETS.closed,
    EYE_ASSETS.half,
    EYE_ASSETS.open,
  ] as const;
  const phaseLength = 2;
  const blinkLength = blinkSequence.length * phaseLength;
  let blinkStart = Math.round(fps * 1.6);
  let blinkIndex = 0;

  while (blinkStart <= frame + blinkLength) {
    if (frame >= blinkStart && frame < blinkStart + blinkLength) {
      const phase = Math.min(
        blinkSequence.length - 1,
        Math.floor((frame - blinkStart) / phaseLength)
      );

      return blinkSequence[phase] ?? EYE_ASSETS.open;
    }

    const interval = Math.round(fps * (3 + hashNoise(blinkIndex) * 2));
    blinkStart += interval;
    blinkIndex += 1;
  }

  return EYE_ASSETS.open;
}

function getMouthAsset(frame: number, talking: boolean) {
  if (!talking) {
    return CLOSED_MOUTH_ASSET;
  }

  const totalFrames = MOUTH_HOLD_FRAMES.reduce((sum, value) => sum + value, 0);
  const cycleFrame = frame % totalFrames;
  let cursor = 0;

  for (const [index, holdFrames] of MOUTH_HOLD_FRAMES.entries()) {
    cursor += holdFrames;

    if (cycleFrame < cursor) {
      return TALKING_MOUTH_ASSETS[index] ?? TALKING_MOUTH_ASSETS[0];
    }
  }

  return TALKING_MOUTH_ASSETS[0];
}

function resolveMotionState({
  frame,
  talking,
  motionPreset,
  motionIntensity,
}: {
  frame: number;
  talking: boolean;
  motionPreset: PresenterMode;
  motionIntensity: number;
}): MotionState {
  const profile = MOTION_PROFILES[motionPreset] ?? MOTION_PROFILES.idle;
  const intensity = Math.max(0.35, motionIntensity);
  const breathWeight = profile.breath * intensity;
  const idleWeight = profile.idle * intensity;
  const headWeight = profile.head * intensity;
  const talkWeight = talking ? profile.talk * intensity : 0;

  const bodyScale =
    1 +
    Math.sin(frame / 30) * 0.006 * breathWeight +
    Math.sin(frame / 68) * 0.002 * breathWeight;
  const bodyY =
    Math.sin(frame / 24) * 2.2 * breathWeight +
    Math.sin(frame / 96) * 1.3 * idleWeight +
    profile.postureLift;
  const bodyX =
    Math.sin(frame / 74) * 1.6 * idleWeight +
    Math.sin(frame / 148) * 0.9 * idleWeight;
  const bodyRotate =
    Math.sin(frame / 86) * 0.55 * idleWeight +
    Math.sin(frame / 170) * 0.22 * idleWeight;

  const torsoY =
    Math.sin(frame / 28) * 1.35 * breathWeight +
    Math.sin(frame / 112) * 0.65 * idleWeight;
  const torsoX = Math.sin(frame / 62) * 1.1 * idleWeight;
  const torsoRotate = Math.sin(frame / 92) * 0.34 * idleWeight;
  const torsoScaleX = 1 + Math.sin(frame / 78) * 0.01 * idleWeight;

  const headY =
    Math.sin(frame / 34) * 1.35 * headWeight +
    Math.sin(frame / 124) * 0.8 * idleWeight +
    (talking ? Math.sin(frame / 7.5) * 0.65 * talkWeight : 0);
  const headX = Math.sin(frame / 82) * 0.8 * idleWeight;
  const headRotate =
    Math.sin(frame / 98) * 0.72 * headWeight +
    Math.sin(frame / 178) * 0.18 * idleWeight +
    (talking ? Math.sin(frame / 8.5) * 0.16 * talkWeight : 0);
  const mouthY = talking ? Math.sin(frame / 5.4) * 0.8 * talkWeight : 0;

  return {
    bodyScale,
    bodyX,
    bodyY,
    bodyRotate,
    torsoX,
    torsoY,
    torsoRotate,
    torsoScaleX,
    headX,
    headY,
    headRotate,
    mouthY,
  };
}

const LayerGuide = React.memo(function LayerGuide({
  debug,
  label,
  frame,
}: {
  debug: boolean;
  label: string;
  frame: LayerFrame;
}) {
  if (!debug) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
        border: "1px dashed rgba(255,255,255,0.34)",
        borderRadius: 12,
        boxSizing: "border-box",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: -22,
          background: "rgba(0,0,0,0.64)",
          color: "#d1fae5",
          border: "1px solid rgba(16,185,129,0.42)",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 1,
          padding: "4px 10px",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
});

export const MrWebGrowth: React.FC<MrWebGrowthProps> = ({
  x = 0,
  y = 0,
  scale = 1,
  talking = false,
  opacity = 1,
  zIndex = 3,
  debug = false,
  motionPreset = "idle",
  motionIntensity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyeAsset = useMemo(() => getBlinkAsset(frame, fps), [frame, fps]);
  const mouthAsset = useMemo(() => getMouthAsset(frame, talking), [frame, talking]);
  const motion = useMemo(
    () =>
      resolveMotionState({
        frame,
        talking,
        motionPreset,
        motionIntensity,
      }),
    [frame, talking, motionPreset, motionIntensity]
  );

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: CHARACTER_WIDTH,
        height: CHARACTER_HEIGHT,
        opacity,
        zIndex,
        pointerEvents: "none",
        transform: `translate3d(${motion.bodyX}px, ${motion.bodyY}px, 0) rotate(${motion.bodyRotate}deg) scale(${scale * motion.bodyScale})`,
        transformOrigin: "center bottom",
        filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.26))",
      }}
    >
      <LayerGuide debug={debug} label="Body" frame={TORSO_FRAME} />

      <Img
        src={staticFile("characters/mr-web-growth-figma/torso.svg")}
        style={{
          position: "absolute",
          left: TORSO_FRAME.x,
          top: TORSO_FRAME.y,
          width: TORSO_FRAME.width,
          height: TORSO_FRAME.height,
          transform: `translate3d(${motion.torsoX}px, ${motion.torsoY}px, 0) rotate(${motion.torsoRotate}deg) scaleX(${motion.torsoScaleX})`,
          transformOrigin: "center top",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate3d(${motion.headX}px, ${motion.headY}px, 0) rotate(${motion.headRotate}deg)`,
          transformOrigin: "center top",
        }}
      >
        <LayerGuide debug={debug} label="Head" frame={HEAD_FRAME} />

        <Img
          src={staticFile("characters/mr-web-growth-figma/head.svg")}
          style={{
            position: "absolute",
            left: HEAD_FRAME.x,
            top: HEAD_FRAME.y,
            width: HEAD_FRAME.width,
            height: HEAD_FRAME.height,
          }}
        />

        <LayerGuide debug={debug} label="Eyes" frame={EYES_FRAME} />

        <Img
          src={staticFile(eyeAsset)}
          style={{
            position: "absolute",
            left: EYES_FRAME.x,
            top: EYES_FRAME.y,
            width: EYES_FRAME.width,
            height: EYES_FRAME.height,
          }}
        />

        <LayerGuide debug={debug} label="Mouth" frame={MOUTH_FRAME} />

        <Img
          src={staticFile(mouthAsset)}
          style={{
            position: "absolute",
            left: MOUTH_FRAME.x,
            top: MOUTH_FRAME.y,
            width: MOUTH_FRAME.width,
            height: MOUTH_FRAME.height,
            transform: `translateY(${motion.mouthY}px)`,
            transformOrigin: "center center",
          }}
        />
      </div>
    </div>
  );
};

export const MrWebGrowthTest: React.FC<{
  debug?: boolean;
  talking?: boolean;
  motionPreset?: PresenterMode;
  motionIntensity?: number;
}> = ({
  debug = true,
  talking = true,
  motionPreset = "hook",
  motionIntensity = 0.9,
}) => {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.20), transparent 35%), linear-gradient(180deg, #072016 0%, #010503 100%)",
      }}
    >
      <MrWebGrowth
        x={340}
        y={420}
        scale={1}
        talking={talking}
        opacity={1}
        debug={debug}
        motionPreset={motionPreset}
        motionIntensity={motionIntensity}
      />
    </AbsoluteFill>
  );
};
