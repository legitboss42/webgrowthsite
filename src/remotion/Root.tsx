import { Composition, type CalculateMetadataFunction } from "remotion";

import { MrWebGrowthTest } from "./components/MrWebGrowth";
import {
  WebGrowthArticleVideo,
  type WebGrowthArticleVideoProps,
} from "./components/WebGrowthArticleVideo";
import { TikTokArticleVideo } from "./components/TikTokArticleVideo";

const VIDEO_FPS = 30;
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const PREVIEW_DURATION_SECONDS = 8;

const defaultScenes: WebGrowthArticleVideoProps["scenes"] = [
  {
    kicker: "Hook",
    narration: "The website looked good. That wasn't the problem.",
    spokenLines: [
      "The website looked good. That wasn't the problem.",
      "That changed the whole approach.",
    ],
    onScreenText: "The website looked good. That wasn't the problem.",
    visualDirection: "Bold hook scene with premium motion.",
    startTimeInSeconds: 0,
    endTimeInSeconds: 3.4,
    durationInSeconds: 3.4,
  },
];

const defaultProps: WebGrowthArticleVideoProps = {
  title: "The website looked good. That wasn't the problem.",
  caption: "Read the full guide on webgrowth.info",
  hashtags: ["#webgrowth", "#webdesign", "#smallbusiness"],
  audioSrc: "article-voice.mp3",
  durationInSeconds: 4.4,
  durationInFrames: Math.ceil(4.4 * VIDEO_FPS),
  scenes: defaultScenes,
  subtitles: [],
};

const tiktokDefaultProps: WebGrowthArticleVideoProps = {
  ...defaultProps,
  caption: "",
  hashtags: [],
};

const calculateMetadata: CalculateMetadataFunction<WebGrowthArticleVideoProps> = async ({
  props,
}) => {
  const durationFromScenes =
    props.scenes?.reduce(
      (max, scene) =>
        Math.max(
          max,
          scene.endTimeInSeconds ?? 0,
          (scene.startTimeInSeconds ?? 0) + (scene.durationInSeconds ?? 0)
        ),
      0
    ) ?? 0;

  const durationFromSubtitles =
    props.subtitles?.reduce((max, subtitle) => Math.max(max, subtitle.end), 0) ?? 0;

  const durationInSeconds = Math.max(
    props.durationInSeconds ?? 0,
    durationFromScenes,
    durationFromSubtitles,
    1
  );

  const durationInFrames = Math.max(1, Math.ceil(durationInSeconds * VIDEO_FPS));

  return {
    durationInFrames,
    fps: VIDEO_FPS,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    props: {
      ...props,
      audioSrc: props.audioSrc ?? "article-voice.mp3",
      durationInSeconds,
      durationInFrames,
    },
  };
};

const calculatePreviewMetadata: CalculateMetadataFunction<WebGrowthArticleVideoProps> = async ({
  props,
}) => {
  const durationInSeconds = Math.min(
    PREVIEW_DURATION_SECONDS,
    Math.max(props.durationInSeconds ?? PREVIEW_DURATION_SECONDS, 1)
  );

  const durationInFrames = Math.max(1, Math.ceil(durationInSeconds * VIDEO_FPS));

  return {
    durationInFrames,
    fps: VIDEO_FPS,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    props: {
      ...props,
      audioSrc: props.audioSrc ?? "article-voice.mp3",
      durationInSeconds,
      durationInFrames,
      previewMode: true,
    },
  };
};

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="WebGrowthArticleVideo"
        component={WebGrowthArticleVideo}
        durationInFrames={defaultProps.durationInFrames!}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />

      <Composition
        id="WebGrowthArticleVideoPreview"
        component={WebGrowthArticleVideo}
        durationInFrames={Math.ceil(PREVIEW_DURATION_SECONDS * VIDEO_FPS)}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{
          ...defaultProps,
          previewMode: true,
          durationInSeconds: PREVIEW_DURATION_SECONDS,
          durationInFrames: Math.ceil(PREVIEW_DURATION_SECONDS * VIDEO_FPS),
        }}
        calculateMetadata={calculatePreviewMetadata}
      />

      <Composition
        id="WebGrowthSocialMeta"
        component={WebGrowthArticleVideo}
        durationInFrames={defaultProps.durationInFrames!}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />

      <Composition
        id="WebGrowthSocialTikTok"
        component={TikTokArticleVideo}
        durationInFrames={tiktokDefaultProps.durationInFrames!}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={tiktokDefaultProps}
        calculateMetadata={calculateMetadata}
      />

      <Composition
        id="MrWebGrowthTest"
        component={MrWebGrowthTest}
        durationInFrames={180}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{
          debug: true,
          talking: true,
          motionPreset: "hook",
          motionIntensity: 0.9,
        }}
      />
    </>
  );
}
