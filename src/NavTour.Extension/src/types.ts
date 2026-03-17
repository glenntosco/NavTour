export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tenantId: string;
}

export interface DemoListItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  viewCount: number;
  frameCount: number;
  stepCount: number;
  createdAt: string;
}

export interface CreateDemoRequest {
  name: string;
}

export interface DemoResponse {
  id: string;
  name: string;
  slug: string;
}

export interface FrameResponse {
  id: string;
  sequenceOrder: number;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface CaptureResult {
  html: string;
  title: string;
  url: string;
}

export interface StoredSession {
  serverUrl: string;
  accessToken: string;
  demoId: string;
  demoName: string;
  frameCount: number;
}

// Messages between popup/background/content
export type ExtMessage =
  | { type: "START_CAPTURE"; demoId: string; demoName: string }
  | { type: "STOP_CAPTURE" }
  | { type: "CAPTURE_PAGE" }
  | { type: "CAPTURE_RESULT"; html: string; title: string; url: string }
  | { type: "CAPTURE_STATUS"; status: "success" | "error"; message: string; frameCount: number }
  | { type: "GET_STATE" }
  | { type: "STATE"; capturing: boolean; demoName: string; frameCount: number };
