export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; image: string | Uint8Array | ArrayBuffer | Buffer | URL; mimeType?: string };

export interface MultimodalMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}
