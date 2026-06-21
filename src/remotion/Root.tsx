import { Composition, type CalculateMetadataFunction } from "remotion";

import {
  WebGrowthArticleVideo,
  type WebGrowthArticleVideoProps,
} from "./components/WebGrowthArticleVideo";

const VIDEO_FPS = 30;
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;

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

  return {
    durationInFrames: Math.max(1, Math.ceil(durationInSeconds * VIDEO_FPS)),
    fps: VIDEO_FPS,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    props: {
      ...props,
      audioSrc: props.audioSrc ?? "article-voice.mp3",
      durationInSeconds,
      durationInFrames: Math.max(1, Math.ceil(durationInSeconds * VIDEO_FPS)),
    },
  };
};

export function RemotionRoot() {
  return (
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
  );
}