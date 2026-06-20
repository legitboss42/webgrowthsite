import { Composition } from "remotion";
import { WebGrowthArticleVideo } from "./components/WebGrowthArticleVideo";

const scenes = [
  {
    durationInSeconds: 4,
    kicker: "Hook",
    narration: "The website wasn't ugly. It just wasn't selling.",
    onScreenText: "The website wasn't ugly.",
    visualDirection: "Dark premium background with bold animated headline.",
  },
  {
    durationInSeconds: 5,
    kicker: "Problem",
    narration: "The real issue was that visitors had no clear reason to take action.",
    onScreenText: "It had a conversion problem.",
    visualDirection: "Show a simple funnel with visitors dropping off.",
  },
  {
    durationInSeconds: 5,
    kicker: "Fix",
    narration: "We fixed the message, structure, proof, and call to action first.",
    onScreenText: "Strategy came before design.",
    visualDirection: "Animate cards for message, structure, proof, and CTA.",
  },
  {
    durationInSeconds: 5,
    kicker: "Result",
    narration: "The design then supported the sales path instead of hiding the problem.",
    onScreenText: "Better design follows better strategy.",
    visualDirection: "Show before and after layout blocks.",
  },
  {
    durationInSeconds: 5,
    kicker: "Next",
    narration: "Read the full breakdown on Web Growth.",
    onScreenText: "Read the full guide on webgrowth.info",
    visualDirection: "End card with Web Growth branding.",
  },
];

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="WebGrowthArticleVideo"
        component={WebGrowthArticleVideo}
        durationInFrames={720}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: "The website wasn't ugly. It just wasn't selling.",
          caption: "Read the full guide on webgrowth.info",
          scenes,
          hashtags: ["#webgrowth", "#webdesign", "#smallbusiness"],
        }}
      />
    </>
  );
}