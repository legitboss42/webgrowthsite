"use client";

import { createContext, useContext, type ReactNode } from "react";

type MessageStatusVisibilityValue = {
  deliveryStatusVisible: boolean;
  readStatusVisible: boolean;
};

const DEFAULT_VISIBILITY: MessageStatusVisibilityValue = {
  deliveryStatusVisible: true,
  readStatusVisible: true,
};

const MessageStatusVisibilityContext = createContext<MessageStatusVisibilityValue>(DEFAULT_VISIBILITY);

export function MessageStatusVisibilityProvider({
  deliveryStatusVisible,
  readStatusVisible,
  children,
}: MessageStatusVisibilityValue & { children: ReactNode }) {
  return (
    <MessageStatusVisibilityContext.Provider value={{ deliveryStatusVisible, readStatusVisible }}>
      {children}
    </MessageStatusVisibilityContext.Provider>
  );
}

export function useMessageStatusVisibility() {
  return useContext(MessageStatusVisibilityContext);
}
