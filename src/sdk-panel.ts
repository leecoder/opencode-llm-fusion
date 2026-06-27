const INTERNAL_PROVIDERS = new Set(["kiro", "github-copilot"]);

export function isInternalProvider(providerID: string): boolean {
  return INTERNAL_PROVIDERS.has(providerID);
}

interface SDKPanelResult {
  text: string;
  usage: { promptTokens: number; completionTokens: number };
  finishReason: string;
}

function getServerConfig(): { url: string; auth: string } {
  const pid = process.env.OPENCODE_PID;
  const port = process.env.OPENCODE_SERVER_PORT;
  const username = process.env.OPENCODE_SERVER_USERNAME ?? "opencode";
  const password = process.env.OPENCODE_SERVER_PASSWORD ?? "";

  let serverUrl = process.env.OPENCODE_SERVER_URL ?? "";
  if (!serverUrl && port) {
    serverUrl = `http://127.0.0.1:${port}`;
  }
  if (!serverUrl) {
    const lsof = require("child_process");
    try {
      if (pid) {
        const result = lsof.execSync(`lsof -iTCP -sTCP:LISTEN -P -n -a -p ${pid} 2>/dev/null | grep LISTEN | head -1`, { encoding: "utf-8" });
        const match = result.match(/:(\d+)\s/);
        if (match) {
          serverUrl = `http://127.0.0.1:${match[1]}`;
        }
      }
    } catch {}
  }
  if (!serverUrl) {
    serverUrl = "http://127.0.0.1:60888";
  }

  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  return { url: serverUrl, auth };
}

export async function queryViaSDK(
  providerID: string,
  modelID: string,
  systemText: string,
  userText: string,
  parentSessionID?: string,
): Promise<SDKPanelResult> {
  const { url: serverUrl, auth } = getServerConfig();
  const directory = process.cwd();
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Basic ${auth}`,
  };

  const createRes = await fetch(`${serverUrl}/session?directory=${encodeURIComponent(directory)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...(parentSessionID && { parentID: parentSessionID }),
      title: `[fusion-panel] ${providerID}/${modelID}`,
      model: { id: modelID, providerID },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => "");
    if (createRes.status === 401) {
      throw new Error(`[fusion] Cannot access OpenCode runtime for ${providerID}/${modelID}. Internal providers (kiro, github-copilot) only work inside OpenCode app sessions, not via "opencode run".`);
    }
    throw new Error(`SDK session.create failed (${createRes.status}): ${errText}`);
  }

  const session = await createRes.json() as { id: string };
  const sessionID = session.id;

  try {
    const parts: any[] = [{ type: "text", text: userText }];

    const promptRes = await fetch(`${serverUrl}/session/${sessionID}/message?directory=${encodeURIComponent(directory)}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: { providerID, modelID },
        ...(systemText && { system: systemText }),
        parts,
        tools: {},
        noReply: false,
      }),
    });

    if (!promptRes.ok) {
      const errText = await promptRes.text().catch(() => "");
      throw new Error(`SDK session.prompt failed (${promptRes.status}): ${errText}`);
    }

    const result = await promptRes.json() as { parts?: Array<{ type: string; text?: string }>; info?: any };

    const textParts = (result.parts ?? [])
      .filter((p: any) => p.type === "text" && p.text)
      .map((p: any) => p.text);
    const text = textParts.join("\n");

    return {
      text: text || "[No response from model]",
      usage: { promptTokens: 0, completionTokens: 0 },
      finishReason: "stop",
    };
  } finally {
    fetch(`${serverUrl}/session/${sessionID}`, {
      method: "DELETE",
      headers,
    }).catch(() => {});
  }
}
