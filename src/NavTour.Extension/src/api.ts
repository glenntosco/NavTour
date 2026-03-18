import type {
  DemoListItem,
  CreateDemoRequest,
  DemoResponse,
  FrameResponse,
} from "./types";

export class NavTourApi {
  private serverUrl: string;
  private token: string | null = null;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl.replace(/\/+$/, "");
  }

  setToken(token: string) {
    this.token = token;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { Accept: "application/json" };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  }

  async getDemos(): Promise<DemoListItem[]> {
    const res = await fetch(`${this.serverUrl}/api/v1/demos`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error("Failed to fetch demos: " + res.status);
    return res.json();
  }

  async createDemo(request: CreateDemoRequest): Promise<DemoResponse> {
    const res = await fetch(`${this.serverUrl}/api/v1/demos`, {
      method: "POST",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error("Failed to create demo: " + res.status);
    return res.json();
  }

  async uploadFrame(
    demoId: string,
    html: string,
    fileName: string
  ): Promise<FrameResponse> {
    const blob = new Blob([html], { type: "text/html" });
    const form = new FormData();
    form.append("file", blob, fileName);

    const res = await fetch(
      `${this.serverUrl}/api/v1/demos/${demoId}/frames`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}` },
        body: form,
      }
    );
    if (!res.ok) throw new Error("Failed to upload frame: " + res.status);
    return res.json();
  }
}
