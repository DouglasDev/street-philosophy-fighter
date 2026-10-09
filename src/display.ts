// RCade cabinet/src/main/main.ts uses this logical viewport in its emulator.
export const CABINET_WIDTH = 336;
export const CABINET_HEIGHT = 262;
export const PREVIEW_QUERY = "cabinet-preview";
export const isLaptopPreview = new URLSearchParams(window.location.search).has(
  PREVIEW_QUERY,
);
export const isCabinet = window.parent !== window && !isLaptopPreview;
