"use client";

import ConversationCollaborationWidget from "./ConversationCollaborationWidget";
import TeamPresenceWidget from "./TeamPresenceWidget";

export default function WorkspaceCollaborationLayer() {
  return (
    <>
      <TeamPresenceWidget />
      <ConversationCollaborationWidget />
    </>
  );
}
