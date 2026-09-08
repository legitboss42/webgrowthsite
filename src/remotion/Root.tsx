import { Composition, type CalculateMetadataFunction } from "remotion";

import { buildKineticVideoProps, KINETIC_VIDEO_FPS, type KineticArticleSource, type KineticVideoProps } from "../lib/socialAutomation/kineticVideo";
import { MrWebGrowthTest } from "./components/MrWebGrowth";
import { TikTokArticleVideo } from "./components/TikTokArticleVideo";
import { WebGrowthArticleVideo } from "./components/WebGrowthArticleVideo";

const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;

const sampleArticle: KineticArticleSource = {
  slug: "kinetic-preview",
  title: "Why a polished website can still lose good leads",
  excerpt: "Clarity and trust matter before visual polish can convert attention.",
  primaryKeyword: "website conversion",
  category: "Conversion",
  tags: ["Conversion", "Website Strategy"],
  commonMistakes: ["Using vague copy that never explains the real offer."],
  keyTakeaways: ["A polished page still fails when visitors cannot understand the offer.", "Clear structure reduces friction before the design asks for action.", "Fixing the message first makes every later improvement more useful."],
  steps: ["Check the homepage message before changing the design."],
  prose: "The issue is often structural rather than visual.",
};

const metaDefaultProps = buildKineticVideoProps(sampleArticle, "META");
const tiktokDefaultProps = buildKineticVideoProps(sampleArticle, "TIKTOK");
const calculateMetadata: CalculateMetadataFunction<KineticVideoProps> = async ({ props }) => ({ durationInFrames: Math.max(1, props.durationInFrames), fps: KINETIC_VIDEO_FPS, width: VIDEO_WIDTH, height: VIDEO_HEIGHT, props });

export function RemotionRoot() {
  return (
    <>
      <Composition id="WebGrowthArticleVideo" component={WebGrowthArticleVideo} durationInFrames={metaDefaultProps.durationInFrames} fps={KINETIC_VIDEO_FPS} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} defaultProps={metaDefaultProps} calculateMetadata={calculateMetadata} />
      <Composition id="WebGrowthArticleVideoPreview" component={WebGrowthArticleVideo} durationInFrames={metaDefaultProps.durationInFrames} fps={KINETIC_VIDEO_FPS} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} defaultProps={{ ...metaDefaultProps, previewMode: true }} calculateMetadata={calculateMetadata} />
      <Composition id="WebGrowthSocialMeta" component={WebGrowthArticleVideo} durationInFrames={metaDefaultProps.durationInFrames} fps={KINETIC_VIDEO_FPS} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} defaultProps={metaDefaultProps} calculateMetadata={calculateMetadata} />
      <Composition id="WebGrowthSocialTikTok" component={TikTokArticleVideo} durationInFrames={tiktokDefaultProps.durationInFrames} fps={KINETIC_VIDEO_FPS} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} defaultProps={tiktokDefaultProps} calculateMetadata={calculateMetadata} />
      <Composition id="MrWebGrowthTest" component={MrWebGrowthTest} durationInFrames={180} fps={KINETIC_VIDEO_FPS} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} defaultProps={{ debug: true, talking: true, motionPreset: "hook", motionIntensity: 0.9 }} />
    </>
  );
}
