import React from "react";

import type { KineticVideoProps } from "../../lib/socialAutomation/kineticVideo";
import { KineticArticleVideo } from "./KineticArticleVideo";

export type SubtitleCue = { start: number; end: number; text: string };
export type WebGrowthVideoScene = { durationInSeconds: number; kicker: string; narration: string; onScreenText: string; visualDirection: string; spokenLines?: string[]; startTimeInSeconds?: number; endTimeInSeconds?: number };
export type WebGrowthArticleVideoProps = KineticVideoProps;

export const WebGrowthArticleVideo: React.FC<WebGrowthArticleVideoProps> = (props) => (
  <KineticArticleVideo {...props} profile="META" />
);
