import React from "react";

import type { KineticVideoProps } from "../../lib/socialAutomation/kineticVideo";
import { KineticArticleVideo } from "./KineticArticleVideo";

export const TikTokArticleVideo: React.FC<KineticVideoProps> = (props) => (
  <KineticArticleVideo {...props} profile="TIKTOK" branding={null} caption="" hashtags={[]} />
);
