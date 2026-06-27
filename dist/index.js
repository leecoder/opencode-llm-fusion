import { createRequire } from 'module'; const require = createRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/eventsource-parser/dist/index.js
function noop(_arg) {
}
function createParser(config) {
  if (typeof config == "function")
    throw new TypeError(
      "`config` must be an object, got a function instead. Did you mean `createParser({onEvent: fn})`?"
    );
  const { onEvent = noop, onError = noop, onRetry = noop, onComment, maxBufferSize } = config, pendingFragments = [];
  let pendingFragmentsLength = 0, isFirstChunk = true, id, data = "", dataLines = 0, eventType, terminated = false;
  function feed(chunk) {
    if (terminated)
      throw new Error(
        "Cannot feed parser: it was terminated after exceeding the configured max buffer size. Call `reset()` to resume parsing."
      );
    if (isFirstChunk && (isFirstChunk = false, chunk.charCodeAt(0) === 239 && chunk.charCodeAt(1) === 187 && chunk.charCodeAt(2) === 191 && (chunk = chunk.slice(3))), pendingFragments.length === 0) {
      const trailing2 = processLines(chunk);
      trailing2 !== "" && (pendingFragments.push(trailing2), pendingFragmentsLength = trailing2.length), checkBufferSize();
      return;
    }
    if (chunk.indexOf(`
`) === -1 && chunk.indexOf("\r") === -1) {
      pendingFragments.push(chunk), pendingFragmentsLength += chunk.length, checkBufferSize();
      return;
    }
    pendingFragments.push(chunk);
    const input = pendingFragments.join("");
    pendingFragments.length = 0, pendingFragmentsLength = 0;
    const trailing = processLines(input);
    trailing !== "" && (pendingFragments.push(trailing), pendingFragmentsLength = trailing.length), checkBufferSize();
  }
  function checkBufferSize() {
    maxBufferSize !== void 0 && (pendingFragmentsLength + data.length <= maxBufferSize || (terminated = true, pendingFragments.length = 0, pendingFragmentsLength = 0, id = void 0, data = "", dataLines = 0, eventType = void 0, onError(
      new ParseError(`Buffered data exceeded max buffer size of ${maxBufferSize} characters`, {
        type: "max-buffer-size-exceeded"
      })
    )));
  }
  function processLines(chunk) {
    let searchIndex = 0;
    if (chunk.indexOf("\r") === -1) {
      let lfIndex = chunk.indexOf(`
`, searchIndex);
      for (; lfIndex !== -1; ) {
        if (searchIndex === lfIndex) {
          dataLines > 0 && onEvent({ id, event: eventType, data }), id = void 0, data = "", dataLines = 0, eventType = void 0, searchIndex = lfIndex + 1, lfIndex = chunk.indexOf(`
`, searchIndex);
          continue;
        }
        const firstCharCode = chunk.charCodeAt(searchIndex);
        if (isDataPrefix(chunk, searchIndex, firstCharCode)) {
          const valueStart = chunk.charCodeAt(searchIndex + 5) === SPACE ? searchIndex + 6 : searchIndex + 5, value = chunk.slice(valueStart, lfIndex);
          if (dataLines === 0 && chunk.charCodeAt(lfIndex + 1) === LF) {
            onEvent({ id, event: eventType, data: value }), id = void 0, data = "", eventType = void 0, searchIndex = lfIndex + 2, lfIndex = chunk.indexOf(`
`, searchIndex);
            continue;
          }
          data = dataLines === 0 ? value : `${data}
${value}`, dataLines++;
        } else isEventPrefix(chunk, searchIndex, firstCharCode) ? eventType = chunk.slice(
          chunk.charCodeAt(searchIndex + 6) === SPACE ? searchIndex + 7 : searchIndex + 6,
          lfIndex
        ) || void 0 : parseLine(chunk, searchIndex, lfIndex);
        searchIndex = lfIndex + 1, lfIndex = chunk.indexOf(`
`, searchIndex);
      }
      return chunk.slice(searchIndex);
    }
    for (; searchIndex < chunk.length; ) {
      const crIndex = chunk.indexOf("\r", searchIndex), lfIndex = chunk.indexOf(`
`, searchIndex);
      let lineEnd = -1;
      if (crIndex !== -1 && lfIndex !== -1 ? lineEnd = crIndex < lfIndex ? crIndex : lfIndex : crIndex !== -1 ? crIndex === chunk.length - 1 ? lineEnd = -1 : lineEnd = crIndex : lfIndex !== -1 && (lineEnd = lfIndex), lineEnd === -1)
        break;
      parseLine(chunk, searchIndex, lineEnd), searchIndex = lineEnd + 1, chunk.charCodeAt(searchIndex - 1) === CR && chunk.charCodeAt(searchIndex) === LF && searchIndex++;
    }
    return chunk.slice(searchIndex);
  }
  function parseLine(chunk, start, end) {
    if (start === end) {
      dispatchEvent();
      return;
    }
    const firstCharCode = chunk.charCodeAt(start);
    if (isDataPrefix(chunk, start, firstCharCode)) {
      const valueStart = chunk.charCodeAt(start + 5) === SPACE ? start + 6 : start + 5, value2 = chunk.slice(valueStart, end);
      data = dataLines === 0 ? value2 : `${data}
${value2}`, dataLines++;
      return;
    }
    if (isEventPrefix(chunk, start, firstCharCode)) {
      eventType = chunk.slice(chunk.charCodeAt(start + 6) === SPACE ? start + 7 : start + 6, end) || void 0;
      return;
    }
    if (firstCharCode === 105 && chunk.charCodeAt(start + 1) === 100 && chunk.charCodeAt(start + 2) === 58) {
      const value2 = chunk.slice(chunk.charCodeAt(start + 3) === SPACE ? start + 4 : start + 3, end);
      id = value2.includes("\0") ? void 0 : value2;
      return;
    }
    if (firstCharCode === 58) {
      if (onComment) {
        const line2 = chunk.slice(start, end);
        onComment(line2.slice(chunk.charCodeAt(start + 1) === SPACE ? 2 : 1));
      }
      return;
    }
    const line = chunk.slice(start, end), fieldSeparatorIndex = line.indexOf(":");
    if (fieldSeparatorIndex === -1) {
      processField(line, "", line);
      return;
    }
    const field = line.slice(0, fieldSeparatorIndex), offset = line.charCodeAt(fieldSeparatorIndex + 1) === SPACE ? 2 : 1, value = line.slice(fieldSeparatorIndex + offset);
    processField(field, value, line);
  }
  function processField(field, value, line) {
    switch (field) {
      case "event":
        eventType = value || void 0;
        break;
      case "data":
        data = dataLines === 0 ? value : `${data}
${value}`, dataLines++;
        break;
      case "id":
        id = value.includes("\0") ? void 0 : value;
        break;
      case "retry":
        /^\d+$/.test(value) ? onRetry(parseInt(value, 10)) : onError(
          new ParseError(`Invalid \`retry\` value: "${value}"`, {
            type: "invalid-retry",
            value,
            line
          })
        );
        break;
      default:
        onError(
          new ParseError(
            `Unknown field "${field.length > 20 ? `${field.slice(0, 20)}\u2026` : field}"`,
            { type: "unknown-field", field, value, line }
          )
        );
        break;
    }
  }
  function dispatchEvent() {
    dataLines > 0 && onEvent({
      id,
      event: eventType,
      data
    }), id = void 0, data = "", dataLines = 0, eventType = void 0;
  }
  function reset(options = {}) {
    if (options.consume && pendingFragments.length > 0) {
      const incompleteLine = pendingFragments.join("");
      parseLine(incompleteLine, 0, incompleteLine.length);
    }
    isFirstChunk = true, id = void 0, data = "", dataLines = 0, eventType = void 0, pendingFragments.length = 0, pendingFragmentsLength = 0, terminated = false;
  }
  return { feed, reset };
}
function isDataPrefix(chunk, i, firstCharCode) {
  return firstCharCode === 100 && chunk.charCodeAt(i + 1) === 97 && chunk.charCodeAt(i + 2) === 116 && chunk.charCodeAt(i + 3) === 97 && chunk.charCodeAt(i + 4) === 58;
}
function isEventPrefix(chunk, i, firstCharCode) {
  return firstCharCode === 101 && chunk.charCodeAt(i + 1) === 118 && chunk.charCodeAt(i + 2) === 101 && chunk.charCodeAt(i + 3) === 110 && chunk.charCodeAt(i + 4) === 116 && chunk.charCodeAt(i + 5) === 58;
}
var ParseError, LF, CR, SPACE;
var init_dist = __esm({
  "node_modules/eventsource-parser/dist/index.js"() {
    "use strict";
    ParseError = class extends Error {
      constructor(message, options) {
        super(message), this.name = "ParseError", this.type = options.type, this.field = options.field, this.value = options.value, this.line = options.line;
      }
    };
    LF = 10;
    CR = 13;
    SPACE = 32;
  }
});

// node_modules/eventsource-parser/dist/stream.js
var EventSourceParserStream;
var init_stream = __esm({
  "node_modules/eventsource-parser/dist/stream.js"() {
    "use strict";
    init_dist();
    EventSourceParserStream = class extends TransformStream {
      constructor({ onError, onRetry, onComment, maxBufferSize } = {}) {
        let parser;
        super({
          start(controller) {
            parser = createParser({
              onEvent: (event) => {
                controller.enqueue(event);
              },
              onError(error) {
                typeof onError == "function" && onError(error), (onError === "terminate" || error.type === "max-buffer-size-exceeded") && controller.error(error);
              },
              onRetry,
              onComment,
              maxBufferSize
            });
          },
          transform(chunk) {
            parser.feed(chunk);
          }
        });
      }
    };
  }
});

// node_modules/@workflow/serde/dist/index.js
var WORKFLOW_SERIALIZE, WORKFLOW_DESERIALIZE;
var init_dist2 = __esm({
  "node_modules/@workflow/serde/dist/index.js"() {
    "use strict";
    WORKFLOW_SERIALIZE = /* @__PURE__ */ Symbol.for("workflow-serialize");
    WORKFLOW_DESERIALIZE = /* @__PURE__ */ Symbol.for("workflow-deserialize");
  }
});

// node_modules/@ai-sdk/provider-utils/dist/index.js
import { AISDKError } from "@ai-sdk/provider";
import { InvalidArgumentError } from "@ai-sdk/provider";
import { getErrorMessage } from "@ai-sdk/provider";
import { APICallError as APICallError2 } from "@ai-sdk/provider";
import { APICallError } from "@ai-sdk/provider";
import { LoadAPIKeyError } from "@ai-sdk/provider";
import { LoadSettingError } from "@ai-sdk/provider";
import {
  JSONParseError,
  TypeValidationError as TypeValidationError3
} from "@ai-sdk/provider";
import {
  TypeValidationError as TypeValidationError2
} from "@ai-sdk/provider";
import { TypeValidationError } from "@ai-sdk/provider";
import * as z4 from "zod/v4";
import { ZodFirstPartyTypeKind as ZodFirstPartyTypeKind3 } from "zod/v3";
import { ZodFirstPartyTypeKind } from "zod/v3";
import {
  ZodFirstPartyTypeKind as ZodFirstPartyTypeKind2
} from "zod/v3";
import { InvalidArgumentError as InvalidArgumentError2 } from "@ai-sdk/provider";
import { APICallError as APICallError3 } from "@ai-sdk/provider";
import {
  UnsupportedFunctionalityError
} from "@ai-sdk/provider";
import {
  NoSuchProviderReferenceError
} from "@ai-sdk/provider";
import { APICallError as APICallError4, EmptyResponseBodyError } from "@ai-sdk/provider";
import {
  InvalidResponseDataError
} from "@ai-sdk/provider";
function combineHeaders(...headers) {
  return headers.reduce(
    (combinedHeaders, currentHeaders) => ({
      ...combinedHeaders,
      ...currentHeaders != null ? currentHeaders : {}
    }),
    {}
  );
}
function convertBase64ToUint8Array(base64String) {
  const base64Url = base64String.replace(/-/g, "+").replace(/_/g, "/");
  const latin1string = atob(base64Url);
  return Uint8Array.from(latin1string, (byte) => byte.codePointAt(0));
}
function convertUint8ArrayToBase64(array) {
  let latin1string = "";
  for (let i = 0; i < array.length; i++) {
    latin1string += String.fromCodePoint(array[i]);
  }
  return btoa(latin1string);
}
function convertToBase64(value) {
  return value instanceof Uint8Array ? convertUint8ArrayToBase64(value) : value;
}
function convertInlineFileDataToUint8Array(data) {
  if (data.type === "text") {
    return new TextEncoder().encode(data.text);
  }
  if (data.data instanceof Uint8Array) {
    return data.data;
  }
  if (data.data instanceof ArrayBuffer) {
    return new Uint8Array(data.data);
  }
  return convertBase64ToUint8Array(data.data);
}
function convertToFormData(input, options = {}) {
  const { useArrayBrackets = true } = options;
  const formData = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value == null) {
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length === 1) {
        formData.append(key, value[0]);
        continue;
      }
      const arrayKey = useArrayBrackets ? `${key}[]` : key;
      for (const item of value) {
        formData.append(arrayKey, item);
      }
      continue;
    }
    formData.append(key, value);
  }
  return formData;
}
function createToolNameMapping({
  tools = [],
  providerToolNames
}) {
  const customToolNameToProviderToolName = {};
  const providerToolNameToCustomToolName = {};
  for (const tool2 of tools) {
    if (tool2.type === "provider" && tool2.id in providerToolNames) {
      const providerToolName = providerToolNames[tool2.id];
      customToolNameToProviderToolName[tool2.name] = providerToolName;
      providerToolNameToCustomToolName[providerToolName] = tool2.name;
    }
  }
  return {
    toProviderToolName: (customToolName) => {
      var _a2;
      return (_a2 = customToolNameToProviderToolName[customToolName]) != null ? _a2 : customToolName;
    },
    toCustomToolName: (providerToolName) => {
      var _a2;
      return (_a2 = providerToolNameToCustomToolName[providerToolName]) != null ? _a2 : providerToolName;
    }
  };
}
async function delay(delayInMs, options) {
  if (delayInMs == null) {
    return Promise.resolve();
  }
  const signal = options == null ? void 0 : options.abortSignal;
  return new Promise((resolve2, reject) => {
    if (signal == null ? void 0 : signal.aborted) {
      reject(createAbortError());
      return;
    }
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve2();
    }, delayInMs);
    const cleanup = () => {
      clearTimeout(timeoutId);
      signal == null ? void 0 : signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };
    signal == null ? void 0 : signal.addEventListener("abort", onAbort);
  });
}
function createAbortError() {
  return new DOMException("Delay was aborted", "AbortError");
}
function stripID3TagsIfPresent(data) {
  const hasId3 = typeof data === "string" && data.startsWith("SUQz") || typeof data !== "string" && data.length > 10 && data[0] === 73 && // 'I'
  data[1] === 68 && // 'D'
  data[2] === 51;
  return hasId3 ? stripID3(data) : data;
}
function detectMediaTypeBySignatures({
  data,
  signatures
}) {
  const processedData = stripID3TagsIfPresent(data);
  const bytes = typeof processedData === "string" ? convertBase64ToUint8Array(
    processedData.substring(0, Math.min(processedData.length, 24))
  ) : processedData;
  for (const signature of signatures) {
    if (bytes.length >= signature.bytesPrefix.length && signature.bytesPrefix.every(
      (byte, index) => byte === null || bytes[index] === byte
    )) {
      return signature.mediaType;
    }
  }
  return void 0;
}
function detectMediaType({
  data,
  topLevelType
}) {
  if (topLevelType === void 0) {
    return detectMediaTypeBySignatures({
      data,
      signatures: [
        ...imageMediaTypeSignatures,
        ...documentMediaTypeSignatures,
        ...audioMediaTypeSignatures,
        ...videoMediaTypeSignatures
      ]
    });
  }
  const signatures = topLevelSignatureTables[topLevelType];
  if (signatures === void 0) {
    return void 0;
  }
  return detectMediaTypeBySignatures({ data, signatures });
}
function getTopLevelMediaType(mediaType) {
  const slashIndex = mediaType.indexOf("/");
  return slashIndex === -1 ? mediaType : mediaType.substring(0, slashIndex);
}
function isFullMediaType(mediaType) {
  const slashIndex = mediaType.indexOf("/");
  if (slashIndex === -1) {
    return false;
  }
  const subtype = mediaType.substring(slashIndex + 1);
  return subtype.length > 0 && subtype !== "*";
}
async function cancelResponseBody(response) {
  var _a2;
  try {
    await ((_a2 = response.body) == null ? void 0 : _a2.cancel());
  } catch (e) {
  }
}
function isBrowserRuntime(globalThisAny = globalThis) {
  return globalThisAny.window != null;
}
function validateDownloadUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new DownloadError({
      url,
      message: `Invalid URL: ${url}`
    });
  }
  if (parsed.protocol === "data:") {
    return;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new DownloadError({
      url,
      message: `URL scheme must be http, https, or data, got ${parsed.protocol}`
    });
  }
  const hostname = parsed.hostname.toLowerCase().replace(/\.+$/, "");
  if (!hostname) {
    throw new DownloadError({
      url,
      message: `URL must have a hostname`
    });
  }
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".localhost")) {
    throw new DownloadError({
      url,
      message: `URL with hostname ${hostname} is not allowed`
    });
  }
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    const ipv6 = hostname.slice(1, -1);
    if (isPrivateIPv6(ipv6)) {
      throw new DownloadError({
        url,
        message: `URL with IPv6 address ${hostname} is not allowed`
      });
    }
    return;
  }
  if (isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      throw new DownloadError({
        url,
        message: `URL with IP address ${hostname} is not allowed`
      });
    }
    return;
  }
}
function isIPv4(hostname) {
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = Number(part);
    return Number.isInteger(num) && num >= 0 && num <= 255 && String(num) === part;
  });
}
function isPrivateIPv4(ip) {
  const parts = ip.split(".").map(Number);
  const [a, b, c] = parts;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 0 && c === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 240) return true;
  return false;
}
function parseIPv6(ip) {
  let address = ip.toLowerCase();
  const zoneIndex = address.indexOf("%");
  if (zoneIndex !== -1) {
    address = address.slice(0, zoneIndex);
  }
  const halves = address.split("::");
  if (halves.length > 2) return null;
  const toGroups = (segment) => {
    if (segment === "") return [];
    const groups = [];
    const parts = segment.split(":");
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes(".")) {
        if (i !== parts.length - 1 || !isIPv4(part)) return null;
        const [a, b, c, d] = part.split(".").map(Number);
        groups.push(a << 8 | b, c << 8 | d);
        continue;
      }
      if (!/^[0-9a-f]{1,4}$/.test(part)) return null;
      groups.push(parseInt(part, 16));
    }
    return groups;
  };
  const head = toGroups(halves[0]);
  if (head === null) return null;
  if (halves.length === 2) {
    const tail = toGroups(halves[1]);
    if (tail === null) return null;
    const fill = 8 - head.length - tail.length;
    if (fill < 0) return null;
    return [...head, ...new Array(fill).fill(0), ...tail];
  }
  return head.length === 8 ? head : null;
}
function isPrivateIPv6(ip) {
  const groups = parseIPv6(ip);
  if (groups === null) return true;
  const topZero = (count) => groups.slice(0, count).every((group) => group === 0);
  if (topZero(7) && (groups[7] === 0 || groups[7] === 1)) return true;
  if ((groups[0] & 65024) === 64512) return true;
  if ((groups[0] & 65472) === 65152) return true;
  if ((groups[0] & 65472) === 65216) return true;
  if ((groups[0] & 65280) === 65280) return true;
  const embedsIPv4 = (
    // ::/96 — IPv4-compatible (deprecated)
    topZero(6) || // ::ffff:0:0/96 — IPv4-mapped (ffff in group 5)
    topZero(5) && groups[5] === 65535 || // ::ffff:0:0/96 — IPv4-translated form (ffff in group 4, group 5 zero)
    topZero(4) && groups[4] === 65535 && groups[5] === 0 || // 64:ff9b::/96 — NAT64 well-known prefix
    groups[0] === 100 && groups[1] === 65435 && groups[2] === 0 && groups[3] === 0 && groups[4] === 0 && groups[5] === 0 || // 64:ff9b:1::/48 — NAT64 local-use prefix
    groups[0] === 100 && groups[1] === 65435 && groups[2] === 1
  );
  if (embedsIPv4) {
    const a = groups[6] >> 8 & 255;
    const b = groups[6] & 255;
    const c = groups[7] >> 8 & 255;
    const d = groups[7] & 255;
    return isPrivateIPv4(`${a}.${b}.${c}.${d}`);
  }
  return false;
}
async function fetchWithValidatedRedirects({
  url,
  headers,
  abortSignal,
  maxRedirects = MAX_DOWNLOAD_REDIRECTS
}) {
  const baseInit = { signal: abortSignal };
  if (headers !== void 0) {
    baseInit.headers = headers;
  }
  let currentUrl = url;
  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    validateDownloadUrl(currentUrl);
    const response = await fetch(currentUrl, {
      ...baseInit,
      redirect: "manual"
    });
    if (response.type === "opaqueredirect") {
      if (!isBrowserRuntime()) {
        throw new DownloadError({
          url,
          message: `Redirect from ${currentUrl} could not be validated and was blocked`
        });
      }
      return await fetch(currentUrl, { ...baseInit, redirect: "follow" });
    }
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      await cancelResponseBody(response);
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return response;
  }
  throw new DownloadError({
    url,
    message: `Too many redirects (max ${maxRedirects})`
  });
}
async function readResponseWithSizeLimit({
  response,
  url,
  maxBytes = DEFAULT_MAX_DOWNLOAD_SIZE
}) {
  const contentLength = response.headers.get("content-length");
  if (contentLength != null) {
    const length = parseInt(contentLength, 10);
    if (!isNaN(length) && length > maxBytes) {
      await cancelResponseBody(response);
      throw new DownloadError({
        url,
        message: `Download of ${url} exceeded maximum size of ${maxBytes} bytes (Content-Length: ${length}).`
      });
    }
  }
  const body = response.body;
  if (body == null) {
    return new Uint8Array(0);
  }
  const reader = body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      totalBytes += value.length;
      if (totalBytes > maxBytes) {
        throw new DownloadError({
          url,
          message: `Download of ${url} exceeded maximum size of ${maxBytes} bytes.`
        });
      }
      chunks.push(value);
    }
  } finally {
    try {
      await reader.cancel();
    } finally {
      reader.releaseLock();
    }
  }
  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
async function downloadBlob(url, options) {
  var _a2, _b2;
  try {
    const response = await fetchWithValidatedRedirects({
      url,
      abortSignal: options == null ? void 0 : options.abortSignal
    });
    if (!response.ok) {
      await cancelResponseBody(response);
      throw new DownloadError({
        url,
        statusCode: response.status,
        statusText: response.statusText
      });
    }
    const data = await readResponseWithSizeLimit({
      response,
      url,
      maxBytes: (_a2 = options == null ? void 0 : options.maxBytes) != null ? _a2 : DEFAULT_MAX_DOWNLOAD_SIZE
    });
    const contentType = (_b2 = response.headers.get("content-type")) != null ? _b2 : void 0;
    return new Blob([data], contentType ? { type: contentType } : void 0);
  } catch (error) {
    if (DownloadError.isInstance(error)) {
      throw error;
    }
    throw new DownloadError({ url, cause: error });
  }
}
function extractResponseHeaders(response) {
  return Object.fromEntries([...response.headers]);
}
function isAbortError(error) {
  return (error instanceof Error || error instanceof DOMException) && (error.name === "AbortError" || error.name === "ResponseAborted" || // Next.js
  error.name === "TimeoutError");
}
function isBunNetworkError(error) {
  if (!(error instanceof Error)) {
    return false;
  }
  const code = error.code;
  if (typeof code === "string" && BUN_ERROR_CODES.includes(code)) {
    return true;
  }
  return false;
}
function handleFetchError({
  error,
  url,
  requestBodyValues
}) {
  if (isAbortError(error)) {
    return error;
  }
  if (error instanceof TypeError && FETCH_FAILED_ERROR_MESSAGES.includes(error.message.toLowerCase())) {
    const cause = error.cause;
    if (cause != null) {
      return new APICallError({
        message: `Cannot connect to API: ${cause.message}`,
        cause,
        url,
        requestBodyValues,
        isRetryable: true
        // retry when network error
      });
    }
  }
  if (isBunNetworkError(error)) {
    return new APICallError({
      message: `Cannot connect to API: ${error.message}`,
      cause: error,
      url,
      requestBodyValues,
      isRetryable: true
    });
  }
  return error;
}
function getRuntimeEnvironmentUserAgent(globalThisAny = globalThis) {
  var _a2, _b2, _c;
  if (globalThisAny.window) {
    return `runtime/browser`;
  }
  if ((_a2 = globalThisAny.navigator) == null ? void 0 : _a2.userAgent) {
    return `runtime/${globalThisAny.navigator.userAgent.toLowerCase()}`;
  }
  if ((_c = (_b2 = globalThisAny.process) == null ? void 0 : _b2.versions) == null ? void 0 : _c.node) {
    return `runtime/node.js/${globalThisAny.process.version.substring(0)}`;
  }
  if (globalThisAny.EdgeRuntime) {
    return `runtime/vercel-edge`;
  }
  return "runtime/unknown";
}
function normalizeHeaders(headers) {
  if (headers == null) {
    return {};
  }
  const normalized = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      normalized[key.toLowerCase()] = value;
    });
  } else {
    if (!Array.isArray(headers)) {
      headers = Object.entries(headers);
    }
    for (const [key, value] of headers) {
      if (value != null) {
        normalized[key.toLowerCase()] = value;
      }
    }
  }
  return normalized;
}
function withUserAgentSuffix(headers, ...userAgentSuffixParts) {
  const normalizedHeaders = new Headers(normalizeHeaders(headers));
  const currentUserAgentHeader = normalizedHeaders.get("user-agent") || "";
  normalizedHeaders.set(
    "user-agent",
    [currentUserAgentHeader, ...userAgentSuffixParts].filter(Boolean).join(" ")
  );
  return Object.fromEntries(normalizedHeaders.entries());
}
function isSameOrigin(url, baseUrl) {
  try {
    return new URL(url).origin === new URL(baseUrl).origin;
  } catch (e) {
    return false;
  }
}
function isNonNullable(value) {
  return value != null;
}
function loadApiKey({
  apiKey,
  environmentVariableName,
  apiKeyParameterName = "apiKey",
  description
}) {
  if (typeof apiKey === "string") {
    return apiKey;
  }
  if (apiKey != null) {
    throw new LoadAPIKeyError({
      message: `${description} API key must be a string.`
    });
  }
  if (typeof process === "undefined") {
    throw new LoadAPIKeyError({
      message: `${description} API key is missing. Pass it using the '${apiKeyParameterName}' parameter. Environment variables are not supported in this environment.`
    });
  }
  apiKey = process.env[environmentVariableName];
  if (apiKey == null) {
    throw new LoadAPIKeyError({
      message: `${description} API key is missing. Pass it using the '${apiKeyParameterName}' parameter or the ${environmentVariableName} environment variable.`
    });
  }
  if (typeof apiKey !== "string") {
    throw new LoadAPIKeyError({
      message: `${description} API key must be a string. The value of the ${environmentVariableName} environment variable is not a string.`
    });
  }
  return apiKey;
}
function loadOptionalSetting({
  settingValue,
  environmentVariableName
}) {
  if (typeof settingValue === "string") {
    return settingValue;
  }
  if (settingValue != null || typeof process === "undefined") {
    return void 0;
  }
  settingValue = process.env[environmentVariableName];
  if (settingValue == null || typeof settingValue !== "string") {
    return void 0;
  }
  return settingValue;
}
function isCustomReasoning(reasoning) {
  return reasoning !== void 0 && reasoning !== "provider-default";
}
function mapReasoningToProviderEffort({
  reasoning,
  effortMap,
  warnings
}) {
  const mapped = effortMap[reasoning];
  if (mapped == null) {
    warnings.push({
      type: "unsupported",
      feature: "reasoning",
      details: `reasoning "${reasoning}" is not supported by this model.`
    });
    return void 0;
  }
  if (mapped !== reasoning) {
    warnings.push({
      type: "compatibility",
      feature: "reasoning",
      details: `reasoning "${reasoning}" is not directly supported by this model. mapped to effort "${mapped}".`
    });
  }
  return mapped;
}
function mapReasoningToProviderBudget({
  reasoning,
  maxOutputTokens,
  maxReasoningBudget,
  minReasoningBudget = 1024,
  budgetPercentages = DEFAULT_REASONING_BUDGET_PERCENTAGES,
  warnings
}) {
  const pct = budgetPercentages[reasoning];
  if (pct == null) {
    warnings.push({
      type: "unsupported",
      feature: "reasoning",
      details: `reasoning "${reasoning}" is not supported by this model.`
    });
    return void 0;
  }
  return Math.min(
    maxReasoningBudget,
    Math.max(minReasoningBudget, Math.round(maxOutputTokens * pct))
  );
}
function mediaTypeToExtension(mediaType) {
  var _a2;
  const [_type, subtype = ""] = mediaType.toLowerCase().split("/");
  return (_a2 = {
    mpeg: "mp3",
    "x-wav": "wav",
    opus: "ogg",
    mp4: "m4a",
    "x-m4a": "m4a"
  }[subtype]) != null ? _a2 : subtype;
}
function _parse(text) {
  const obj = JSON.parse(text);
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (suspectProtoRx.test(text) === false && suspectConstructorRx.test(text) === false) {
    return obj;
  }
  return filter(obj);
}
function filter(obj) {
  let next = [obj];
  while (next.length) {
    const nodes = next;
    next = [];
    for (const node of nodes) {
      if (Object.prototype.hasOwnProperty.call(node, "__proto__")) {
        throw new SyntaxError("Object contains forbidden prototype property");
      }
      if (Object.prototype.hasOwnProperty.call(node, "constructor") && node.constructor !== null && typeof node.constructor === "object" && Object.prototype.hasOwnProperty.call(node.constructor, "prototype")) {
        throw new SyntaxError("Object contains forbidden prototype property");
      }
      for (const key in node) {
        const value = node[key];
        if (value && typeof value === "object") {
          next.push(value);
        }
      }
    }
  }
  return obj;
}
function secureJsonParse(text) {
  const { stackTraceLimit } = Error;
  try {
    Error.stackTraceLimit = 0;
  } catch (e) {
    return _parse(text);
  }
  try {
    return _parse(text);
  } finally {
    Error.stackTraceLimit = stackTraceLimit;
  }
}
function addAdditionalPropertiesToJsonSchema(jsonSchema2) {
  if (jsonSchema2.type === "object" || Array.isArray(jsonSchema2.type) && jsonSchema2.type.includes("object")) {
    jsonSchema2.additionalProperties = false;
    const { properties } = jsonSchema2;
    if (properties != null) {
      for (const key of Object.keys(properties)) {
        properties[key] = visit(properties[key]);
      }
    }
  }
  if (jsonSchema2.items != null) {
    jsonSchema2.items = Array.isArray(jsonSchema2.items) ? jsonSchema2.items.map(visit) : visit(jsonSchema2.items);
  }
  if (jsonSchema2.anyOf != null) {
    jsonSchema2.anyOf = jsonSchema2.anyOf.map(visit);
  }
  if (jsonSchema2.allOf != null) {
    jsonSchema2.allOf = jsonSchema2.allOf.map(visit);
  }
  if (jsonSchema2.oneOf != null) {
    jsonSchema2.oneOf = jsonSchema2.oneOf.map(visit);
  }
  const { definitions } = jsonSchema2;
  if (definitions != null) {
    for (const key of Object.keys(definitions)) {
      definitions[key] = visit(definitions[key]);
    }
  }
  return jsonSchema2;
}
function visit(def) {
  if (typeof def === "boolean") return def;
  return addAdditionalPropertiesToJsonSchema(def);
}
function parseAnyDef() {
  return {};
}
function parseArrayDef(def, refs) {
  var _a2, _b2, _c;
  const res = {
    type: "array"
  };
  if (((_a2 = def.type) == null ? void 0 : _a2._def) && ((_c = (_b2 = def.type) == null ? void 0 : _b2._def) == null ? void 0 : _c.typeName) !== ZodFirstPartyTypeKind.ZodAny) {
    res.items = parseDef(def.type._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items"]
    });
  }
  if (def.minLength) {
    res.minItems = def.minLength.value;
  }
  if (def.maxLength) {
    res.maxItems = def.maxLength.value;
  }
  if (def.exactLength) {
    res.minItems = def.exactLength.value;
    res.maxItems = def.exactLength.value;
  }
  return res;
}
function parseBigintDef(def) {
  const res = {
    type: "integer",
    format: "int64"
  };
  if (!def.checks) return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        if (check.inclusive) {
          res.minimum = check.value;
        } else {
          res.exclusiveMinimum = check.value;
        }
        break;
      case "max":
        if (check.inclusive) {
          res.maximum = check.value;
        } else {
          res.exclusiveMaximum = check.value;
        }
        break;
      case "multipleOf":
        res.multipleOf = check.value;
        break;
    }
  }
  return res;
}
function parseBooleanDef() {
  return { type: "boolean" };
}
function parseBrandedDef(_def, refs) {
  return parseDef(_def.type._def, refs);
}
function parseDateDef(def, refs, overrideDateStrategy) {
  const strategy = overrideDateStrategy != null ? overrideDateStrategy : refs.dateStrategy;
  if (Array.isArray(strategy)) {
    return {
      anyOf: strategy.map((item) => parseDateDef(def, refs, item))
    };
  }
  switch (strategy) {
    case "string":
    case "format:date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "format:date":
      return {
        type: "string",
        format: "date"
      };
    case "integer":
      return integerDateParser(def);
  }
}
function parseDefaultDef(_def, refs) {
  return {
    ...parseDef(_def.innerType._def, refs),
    default: _def.defaultValue()
  };
}
function parseEffectsDef(_def, refs) {
  return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef();
}
function parseEnumDef(def) {
  return {
    type: "string",
    enum: Array.from(def.values)
  };
}
function parseIntersectionDef(def, refs) {
  const allOf = [
    parseDef(def.left._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "0"]
    }),
    parseDef(def.right._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "1"]
    })
  ].filter((x) => !!x);
  const mergedAllOf = [];
  allOf.forEach((schema) => {
    if (isJsonSchema7AllOfType(schema)) {
      mergedAllOf.push(...schema.allOf);
    } else {
      let nestedSchema = schema;
      if ("additionalProperties" in schema && schema.additionalProperties === false) {
        const { additionalProperties: _additionalProperties, ...rest } = schema;
        nestedSchema = rest;
      }
      mergedAllOf.push(nestedSchema);
    }
  });
  return mergedAllOf.length ? { allOf: mergedAllOf } : void 0;
}
function parseLiteralDef(def) {
  const parsedType = typeof def.value;
  if (parsedType !== "bigint" && parsedType !== "number" && parsedType !== "boolean" && parsedType !== "string") {
    return {
      type: Array.isArray(def.value) ? "array" : "object"
    };
  }
  return {
    type: parsedType === "bigint" ? "integer" : parsedType,
    const: def.value
  };
}
function parseStringDef(def, refs) {
  const res = {
    type: "string"
  };
  if (def.checks) {
    for (const check of def.checks) {
      switch (check.kind) {
        case "min":
          res.minLength = typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value;
          break;
        case "max":
          res.maxLength = typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value;
          break;
        case "email":
          switch (refs.emailStrategy) {
            case "format:email":
              addFormat(res, "email", check.message, refs);
              break;
            case "format:idn-email":
              addFormat(res, "idn-email", check.message, refs);
              break;
            case "pattern:zod":
              addPattern(res, zodPatterns.email, check.message, refs);
              break;
          }
          break;
        case "url":
          addFormat(res, "uri", check.message, refs);
          break;
        case "uuid":
          addFormat(res, "uuid", check.message, refs);
          break;
        case "regex":
          addPattern(res, check.regex, check.message, refs);
          break;
        case "cuid":
          addPattern(res, zodPatterns.cuid, check.message, refs);
          break;
        case "cuid2":
          addPattern(res, zodPatterns.cuid2, check.message, refs);
          break;
        case "startsWith":
          addPattern(
            res,
            RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`),
            check.message,
            refs
          );
          break;
        case "endsWith":
          addPattern(
            res,
            RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`),
            check.message,
            refs
          );
          break;
        case "datetime":
          addFormat(res, "date-time", check.message, refs);
          break;
        case "date":
          addFormat(res, "date", check.message, refs);
          break;
        case "time":
          addFormat(res, "time", check.message, refs);
          break;
        case "duration":
          addFormat(res, "duration", check.message, refs);
          break;
        case "length":
          res.minLength = typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value;
          res.maxLength = typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value;
          break;
        case "includes": {
          addPattern(
            res,
            RegExp(escapeLiteralCheckValue(check.value, refs)),
            check.message,
            refs
          );
          break;
        }
        case "ip": {
          if (check.version !== "v6") {
            addFormat(res, "ipv4", check.message, refs);
          }
          if (check.version !== "v4") {
            addFormat(res, "ipv6", check.message, refs);
          }
          break;
        }
        case "base64url":
          addPattern(res, zodPatterns.base64url, check.message, refs);
          break;
        case "jwt":
          addPattern(res, zodPatterns.jwt, check.message, refs);
          break;
        case "cidr": {
          if (check.version !== "v6") {
            addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
          }
          if (check.version !== "v4") {
            addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
          }
          break;
        }
        case "emoji":
          addPattern(res, zodPatterns.emoji(), check.message, refs);
          break;
        case "ulid": {
          addPattern(res, zodPatterns.ulid, check.message, refs);
          break;
        }
        case "base64": {
          switch (refs.base64Strategy) {
            case "format:binary": {
              addFormat(res, "binary", check.message, refs);
              break;
            }
            case "contentEncoding:base64": {
              res.contentEncoding = "base64";
              break;
            }
            case "pattern:zod": {
              addPattern(res, zodPatterns.base64, check.message, refs);
              break;
            }
          }
          break;
        }
        case "nanoid": {
          addPattern(res, zodPatterns.nanoid, check.message, refs);
        }
        case "toLowerCase":
        case "toUpperCase":
        case "trim":
          break;
        default:
          /* @__PURE__ */ ((_) => {
          })(check);
      }
    }
  }
  return res;
}
function escapeLiteralCheckValue(literal, refs) {
  return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal) : literal;
}
function escapeNonAlphaNumeric(source) {
  let result = "";
  for (let i = 0; i < source.length; i++) {
    if (!ALPHA_NUMERIC.has(source[i])) {
      result += "\\";
    }
    result += source[i];
  }
  return result;
}
function addFormat(schema, value, message, refs) {
  var _a2;
  if (schema.format || ((_a2 = schema.anyOf) == null ? void 0 : _a2.some((x) => x.format))) {
    if (!schema.anyOf) {
      schema.anyOf = [];
    }
    if (schema.format) {
      schema.anyOf.push({
        format: schema.format
      });
      delete schema.format;
    }
    schema.anyOf.push({
      format: value,
      ...message && refs.errorMessages && { errorMessage: { format: message } }
    });
  } else {
    schema.format = value;
  }
}
function addPattern(schema, regex, message, refs) {
  var _a2;
  if (schema.pattern || ((_a2 = schema.allOf) == null ? void 0 : _a2.some((x) => x.pattern))) {
    if (!schema.allOf) {
      schema.allOf = [];
    }
    if (schema.pattern) {
      schema.allOf.push({
        pattern: schema.pattern
      });
      delete schema.pattern;
    }
    schema.allOf.push({
      pattern: stringifyRegExpWithFlags(regex, refs),
      ...message && refs.errorMessages && { errorMessage: { pattern: message } }
    });
  } else {
    schema.pattern = stringifyRegExpWithFlags(regex, refs);
  }
}
function stringifyRegExpWithFlags(regex, refs) {
  var _a2;
  if (!refs.applyRegexFlags || !regex.flags) {
    return regex.source;
  }
  const flags = {
    i: regex.flags.includes("i"),
    // Case-insensitive
    m: regex.flags.includes("m"),
    // `^` and `$` matches adjacent to newline characters
    s: regex.flags.includes("s")
    // `.` matches newlines
  };
  const source = flags.i ? regex.source.toLowerCase() : regex.source;
  let pattern = "";
  let isEscaped = false;
  let inCharGroup = false;
  let inCharRange = false;
  for (let i = 0; i < source.length; i++) {
    if (isEscaped) {
      pattern += source[i];
      isEscaped = false;
      continue;
    }
    if (flags.i) {
      if (inCharGroup) {
        if (source[i].match(/[a-z]/)) {
          if (inCharRange) {
            pattern += source[i];
            pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
            inCharRange = false;
          } else if (source[i + 1] === "-" && ((_a2 = source[i + 2]) == null ? void 0 : _a2.match(/[a-z]/))) {
            pattern += source[i];
            inCharRange = true;
          } else {
            pattern += `${source[i]}${source[i].toUpperCase()}`;
          }
          continue;
        }
      } else if (source[i].match(/[a-z]/)) {
        pattern += `[${source[i]}${source[i].toUpperCase()}]`;
        continue;
      }
    }
    if (flags.m) {
      if (source[i] === "^") {
        pattern += `(^|(?<=[\r
]))`;
        continue;
      } else if (source[i] === "$") {
        pattern += `($|(?=[\r
]))`;
        continue;
      }
    }
    if (flags.s && source[i] === ".") {
      pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
      continue;
    }
    pattern += source[i];
    if (source[i] === "\\") {
      isEscaped = true;
    } else if (inCharGroup && source[i] === "]") {
      inCharGroup = false;
    } else if (!inCharGroup && source[i] === "[") {
      inCharGroup = true;
    }
  }
  try {
    new RegExp(pattern);
  } catch (e) {
    console.warn(
      `Could not convert regex pattern at ${refs.currentPath.join(
        "/"
      )} to a flag-independent form! Falling back to the flag-ignorant source`
    );
    return regex.source;
  }
  return pattern;
}
function parseRecordDef(def, refs) {
  var _a2, _b2, _c, _d, _e, _f;
  const schema = {
    type: "object",
    additionalProperties: (_a2 = parseDef(def.valueType._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    })) != null ? _a2 : refs.allowedAdditionalProperties
  };
  if (((_b2 = def.keyType) == null ? void 0 : _b2._def.typeName) === ZodFirstPartyTypeKind2.ZodString && ((_c = def.keyType._def.checks) == null ? void 0 : _c.length)) {
    const { type: _type, ...keyType } = parseStringDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  } else if (((_d = def.keyType) == null ? void 0 : _d._def.typeName) === ZodFirstPartyTypeKind2.ZodEnum) {
    return {
      ...schema,
      propertyNames: {
        enum: def.keyType._def.values
      }
    };
  } else if (((_e = def.keyType) == null ? void 0 : _e._def.typeName) === ZodFirstPartyTypeKind2.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind2.ZodString && ((_f = def.keyType._def.type._def.checks) == null ? void 0 : _f.length)) {
    const { type: _type, ...keyType } = parseBrandedDef(
      def.keyType._def,
      refs
    );
    return {
      ...schema,
      propertyNames: keyType
    };
  }
  return schema;
}
function parseMapDef(def, refs) {
  if (refs.mapStrategy === "record") {
    return parseRecordDef(def, refs);
  }
  const keys = parseDef(def.keyType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "0"]
  }) || parseAnyDef();
  const values = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "1"]
  }) || parseAnyDef();
  return {
    type: "array",
    maxItems: 125,
    items: {
      type: "array",
      items: [keys, values],
      minItems: 2,
      maxItems: 2
    }
  };
}
function parseNativeEnumDef(def) {
  const object = def.values;
  const actualKeys = Object.keys(def.values).filter((key) => {
    return typeof object[object[key]] !== "number";
  });
  const actualValues = actualKeys.map((key) => object[key]);
  const parsedTypes = Array.from(
    new Set(actualValues.map((values) => typeof values))
  );
  return {
    type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: actualValues
  };
}
function parseNeverDef() {
  return { not: parseAnyDef() };
}
function parseNullDef() {
  return {
    type: "null"
  };
}
function parseUnionDef(def, refs) {
  const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
  if (options.every(
    (x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length)
  )) {
    const types = options.reduce((types2, x) => {
      const type = primitiveMappings[x._def.typeName];
      return type && !types2.includes(type) ? [...types2, type] : types2;
    }, []);
    return {
      type: types.length > 1 ? types : types[0]
    };
  } else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
    const types = options.reduce(
      (acc, x) => {
        const type = typeof x._def.value;
        switch (type) {
          case "string":
          case "number":
          case "boolean":
            return [...acc, type];
          case "bigint":
            return [...acc, "integer"];
          case "object":
            if (x._def.value === null) return [...acc, "null"];
          case "symbol":
          case "undefined":
          case "function":
          default:
            return acc;
        }
      },
      []
    );
    if (types.length === options.length) {
      const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
      return {
        type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
        enum: options.reduce(
          (acc, x) => {
            return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
          },
          []
        )
      };
    }
  } else if (options.every((x) => x._def.typeName === "ZodEnum")) {
    return {
      type: "string",
      enum: options.reduce(
        (acc, x) => [
          ...acc,
          ...x._def.values.filter((x2) => !acc.includes(x2))
        ],
        []
      )
    };
  }
  return asAnyOf(def, refs);
}
function parseNullableDef(def, refs) {
  if (["ZodString", "ZodNumber", "ZodBigInt", "ZodBoolean", "ZodNull"].includes(
    def.innerType._def.typeName
  ) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) {
    return {
      type: [
        primitiveMappings[def.innerType._def.typeName],
        "null"
      ]
    };
  }
  const base = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "0"]
  });
  return base && { anyOf: [base, { type: "null" }] };
}
function parseNumberDef(def) {
  const res = {
    type: "number"
  };
  if (!def.checks) return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "int":
        res.type = "integer";
        break;
      case "min":
        if (check.inclusive) {
          res.minimum = check.value;
        } else {
          res.exclusiveMinimum = check.value;
        }
        break;
      case "max":
        if (check.inclusive) {
          res.maximum = check.value;
        } else {
          res.exclusiveMaximum = check.value;
        }
        break;
      case "multipleOf":
        res.multipleOf = check.value;
        break;
    }
  }
  return res;
}
function parseObjectDef(def, refs) {
  const result = {
    type: "object",
    properties: {}
  };
  const required = [];
  const shape = def.shape();
  for (const propName in shape) {
    let propDef = shape[propName];
    if (propDef === void 0 || propDef._def === void 0) {
      continue;
    }
    const propOptional = safeIsOptional(propDef);
    const parsedDef = parseDef(propDef._def, {
      ...refs,
      currentPath: [...refs.currentPath, "properties", propName],
      propertyPath: [...refs.currentPath, "properties", propName]
    });
    if (parsedDef === void 0) {
      continue;
    }
    result.properties[propName] = parsedDef;
    if (!propOptional) {
      required.push(propName);
    }
  }
  if (required.length) {
    result.required = required;
  }
  const additionalProperties = decideAdditionalProperties(def, refs);
  if (additionalProperties !== void 0) {
    result.additionalProperties = additionalProperties;
  }
  return result;
}
function decideAdditionalProperties(def, refs) {
  if (def.catchall._def.typeName !== "ZodNever") {
    return parseDef(def.catchall._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    });
  }
  switch (def.unknownKeys) {
    case "passthrough":
      return refs.allowedAdditionalProperties;
    case "strict":
      return refs.rejectedAdditionalProperties;
    case "strip":
      return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
  }
}
function safeIsOptional(schema) {
  try {
    return schema.isOptional();
  } catch (e) {
    return true;
  }
}
function parsePromiseDef(def, refs) {
  return parseDef(def.type._def, refs);
}
function parseSetDef(def, refs) {
  const items = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items"]
  });
  const schema = {
    type: "array",
    uniqueItems: true,
    items
  };
  if (def.minSize) {
    schema.minItems = def.minSize.value;
  }
  if (def.maxSize) {
    schema.maxItems = def.maxSize.value;
  }
  return schema;
}
function parseTupleDef(def, refs) {
  if (def.rest) {
    return {
      type: "array",
      minItems: def.items.length,
      items: def.items.map(
        (x, i) => parseDef(x._def, {
          ...refs,
          currentPath: [...refs.currentPath, "items", `${i}`]
        })
      ).reduce(
        (acc, x) => x === void 0 ? acc : [...acc, x],
        []
      ),
      additionalItems: parseDef(def.rest._def, {
        ...refs,
        currentPath: [...refs.currentPath, "additionalItems"]
      })
    };
  } else {
    return {
      type: "array",
      minItems: def.items.length,
      maxItems: def.items.length,
      items: def.items.map(
        (x, i) => parseDef(x._def, {
          ...refs,
          currentPath: [...refs.currentPath, "items", `${i}`]
        })
      ).reduce(
        (acc, x) => x === void 0 ? acc : [...acc, x],
        []
      )
    };
  }
}
function parseUndefinedDef() {
  return {
    not: parseAnyDef()
  };
}
function parseUnknownDef() {
  return parseAnyDef();
}
function parseDef(def, refs, forceResolution = false) {
  var _a2;
  const seenItem = refs.seen.get(def);
  if (refs.override) {
    const overrideResult = (_a2 = refs.override) == null ? void 0 : _a2.call(
      refs,
      def,
      refs,
      seenItem,
      forceResolution
    );
    if (overrideResult !== ignoreOverride) {
      return overrideResult;
    }
  }
  if (seenItem && !forceResolution) {
    const seenSchema = get$ref(seenItem, refs);
    if (seenSchema !== void 0) {
      return seenSchema;
    }
  }
  const newItem = { def, path: refs.currentPath, jsonSchema: void 0 };
  refs.seen.set(def, newItem);
  const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
  const jsonSchema2 = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
  if (jsonSchema2) {
    addMeta(def, refs, jsonSchema2);
  }
  if (refs.postProcess) {
    const postProcessResult = refs.postProcess(jsonSchema2, def, refs);
    newItem.jsonSchema = jsonSchema2;
    return postProcessResult;
  }
  newItem.jsonSchema = jsonSchema2;
  return jsonSchema2;
}
function lazySchema(createSchema) {
  let schema;
  return () => {
    if (schema == null) {
      schema = createSchema();
    }
    return schema;
  };
}
function jsonSchema(jsonSchema2, {
  validate
} = {}) {
  return {
    [schemaSymbol]: true,
    _type: void 0,
    // should never be used directly
    get jsonSchema() {
      if (typeof jsonSchema2 === "function") {
        jsonSchema2 = jsonSchema2();
      }
      return jsonSchema2;
    },
    validate
  };
}
function isSchema(value) {
  return typeof value === "object" && value !== null && schemaSymbol in value && value[schemaSymbol] === true && "jsonSchema" in value && "validate" in value;
}
function asSchema(schema) {
  return schema == null ? jsonSchema({
    type: "object",
    properties: {},
    additionalProperties: false
  }) : isSchema(schema) ? schema : "~standard" in schema ? schema["~standard"].vendor === "zod" ? zodSchema(schema) : standardSchema(schema) : schema();
}
function standardSchema(standardSchema2) {
  return jsonSchema(
    () => addAdditionalPropertiesToJsonSchema(
      standardSchema2["~standard"].jsonSchema.input({
        target: "draft-07"
      })
    ),
    {
      validate: async (value) => {
        const result = await standardSchema2["~standard"].validate(value);
        return "value" in result ? { success: true, value: result.value } : {
          success: false,
          error: new TypeValidationError({
            value,
            cause: result.issues
          })
        };
      }
    }
  );
}
function zod3Schema(zodSchema2, options) {
  var _a2;
  const useReferences = (_a2 = options == null ? void 0 : options.useReferences) != null ? _a2 : false;
  return jsonSchema(
    // defer json schema creation to avoid unnecessary computation when only validation is needed
    () => zod3ToJsonSchema(zodSchema2, {
      $refStrategy: useReferences ? "root" : "none"
    }),
    {
      validate: async (value) => {
        const result = await zodSchema2.safeParseAsync(value);
        return result.success ? { success: true, value: result.data } : { success: false, error: result.error };
      }
    }
  );
}
function zod4Schema(zodSchema2, options) {
  var _a2;
  const useReferences = (_a2 = options == null ? void 0 : options.useReferences) != null ? _a2 : false;
  return jsonSchema(
    // defer json schema creation to avoid unnecessary computation when only validation is needed
    () => addAdditionalPropertiesToJsonSchema(
      z4.toJSONSchema(zodSchema2, {
        target: "draft-7",
        io: "input",
        reused: useReferences ? "ref" : "inline"
      })
    ),
    {
      validate: async (value) => {
        const result = await z4.safeParseAsync(zodSchema2, value);
        return result.success ? { success: true, value: result.data } : { success: false, error: result.error };
      }
    }
  );
}
function isZod4Schema(zodSchema2) {
  return "_zod" in zodSchema2;
}
function zodSchema(zodSchema2, options) {
  if (isZod4Schema(zodSchema2)) {
    return zod4Schema(zodSchema2, options);
  } else {
    return zod3Schema(zodSchema2, options);
  }
}
async function validateTypes({
  value,
  schema,
  context
}) {
  const result = await safeValidateTypes({ value, schema, context });
  if (!result.success) {
    throw TypeValidationError2.wrap({ value, cause: result.error, context });
  }
  return result.value;
}
async function safeValidateTypes({
  value,
  schema,
  context
}) {
  const actualSchema = asSchema(schema);
  try {
    if (actualSchema.validate == null) {
      return { success: true, value, rawValue: value };
    }
    const result = await actualSchema.validate(value);
    if (result.success) {
      return { success: true, value: result.value, rawValue: value };
    }
    return {
      success: false,
      error: TypeValidationError2.wrap({ value, cause: result.error, context }),
      rawValue: value
    };
  } catch (error) {
    return {
      success: false,
      error: TypeValidationError2.wrap({ value, cause: error, context }),
      rawValue: value
    };
  }
}
async function parseJSON({
  text,
  schema
}) {
  try {
    const value = secureJsonParse(text);
    if (schema == null) {
      return value;
    }
    return await validateTypes({ value, schema });
  } catch (error) {
    if (JSONParseError.isInstance(error) || TypeValidationError3.isInstance(error)) {
      throw error;
    }
    throw new JSONParseError({ text, cause: error });
  }
}
async function safeParseJSON({
  text,
  schema
}) {
  try {
    const value = secureJsonParse(text);
    if (schema == null) {
      return { success: true, value, rawValue: value };
    }
    return await safeValidateTypes({ value, schema });
  } catch (error) {
    return {
      success: false,
      error: JSONParseError.isInstance(error) ? error : new JSONParseError({ text, cause: error }),
      rawValue: void 0
    };
  }
}
function isParsableJson(input) {
  try {
    secureJsonParse(input);
    return true;
  } catch (e) {
    return false;
  }
}
function parseJsonEventStream({
  stream,
  schema
}) {
  return stream.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream()).pipeThrough(
    new TransformStream({
      async transform({ data }, controller) {
        if (data === "[DONE]") {
          return;
        }
        controller.enqueue(await safeParseJSON({ text: data, schema }));
      }
    })
  );
}
async function parseProviderOptions({
  provider,
  providerOptions,
  schema
}) {
  if ((providerOptions == null ? void 0 : providerOptions[provider]) == null) {
    return void 0;
  }
  const parsedProviderOptions = await safeValidateTypes({
    value: providerOptions[provider],
    schema
  });
  if (!parsedProviderOptions.success) {
    throw new InvalidArgumentError2({
      argument: "providerOptions",
      message: `invalid ${provider} provider options`,
      cause: parsedProviderOptions.error
    });
  }
  return parsedProviderOptions.value;
}
function tool(tool2) {
  return tool2;
}
function createProviderDefinedToolFactory({
  id,
  inputSchema
}) {
  return ({
    execute,
    outputSchema,
    needsApproval,
    toModelOutput,
    onInputStart,
    onInputDelta,
    onInputAvailable,
    ...args
  }) => tool({
    type: "provider",
    isProviderExecuted: false,
    id,
    args,
    inputSchema,
    outputSchema,
    execute,
    needsApproval,
    toModelOutput,
    onInputStart,
    onInputDelta,
    onInputAvailable
  });
}
function createProviderDefinedToolFactoryWithOutputSchema({
  id,
  inputSchema,
  outputSchema
}) {
  return ({
    execute,
    needsApproval,
    toModelOutput,
    onInputStart,
    onInputDelta,
    onInputAvailable,
    ...args
  }) => tool({
    type: "provider",
    isProviderExecuted: false,
    id,
    args,
    inputSchema,
    outputSchema,
    execute,
    needsApproval,
    toModelOutput,
    onInputStart,
    onInputDelta,
    onInputAvailable
  });
}
function createProviderExecutedToolFactory({
  id,
  inputSchema,
  outputSchema,
  supportsDeferredResults
}) {
  return ({
    onInputStart,
    onInputDelta,
    onInputAvailable,
    ...args
  }) => tool({
    type: "provider",
    isProviderExecuted: true,
    id,
    args,
    inputSchema,
    outputSchema,
    onInputStart,
    onInputDelta,
    onInputAvailable,
    supportsDeferredResults
  });
}
async function resolve(value) {
  if (typeof value === "function") {
    value = value();
  }
  return Promise.resolve(value);
}
function resolveFullMediaType({
  part
}) {
  if (isFullMediaType(part.mediaType)) {
    return part.mediaType;
  }
  if (part.data.type === "data") {
    const detected = detectMediaType({
      data: part.data.data,
      topLevelType: getTopLevelMediaType(part.mediaType)
    });
    if (detected) {
      return detected;
    }
    throw new UnsupportedFunctionalityError({
      functionality: `file of media type "${part.mediaType}" must specify subtype since it could not be auto-detected`
    });
  }
  throw new UnsupportedFunctionalityError({
    functionality: `file of media type "${part.mediaType}" must specify subtype since it is not passed as inline bytes`
  });
}
function resolveProviderReference({
  reference,
  provider
}) {
  const id = reference[provider];
  if (id != null) {
    return id;
  }
  throw new NoSuchProviderReferenceError({
    provider,
    reference
  });
}
function isJSONSerializable(value) {
  if (value === null || value === void 0) return true;
  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") return true;
  if (type === "function" || type === "symbol" || type === "bigint")
    return false;
  if (Array.isArray(value)) {
    return value.every(isJSONSerializable);
  }
  if (Object.getPrototypeOf(value) === Object.prototype) {
    return Object.values(value).every(
      isJSONSerializable
    );
  }
  return false;
}
function serializeModelOptions(options) {
  const serializableConfig = {};
  for (const [key, value] of Object.entries(options.config)) {
    if (key === "headers") {
      const resolvedHeaders = resolveSync(value);
      if (isJSONSerializable(resolvedHeaders)) {
        serializableConfig[key] = resolvedHeaders;
      }
    } else if (isJSONSerializable(value)) {
      serializableConfig[key] = value;
    }
  }
  return { modelId: options.modelId, config: serializableConfig };
}
function resolveSync(value) {
  let next = value;
  if (typeof value === "function") {
    next = value();
  }
  if (next instanceof Promise) {
    throw new Error("Promise returned from resolveSync");
  }
  return next;
}
function withoutTrailingSlash(url) {
  return url == null ? void 0 : url.replace(/\/$/, "");
}
var btoa, atob, imageMediaTypeSignatures, documentMediaTypeSignatures, audioMediaTypeSignatures, videoMediaTypeSignatures, stripID3, topLevelSignatureTables, name, marker, symbol, _a, _b, DownloadError, MAX_DOWNLOAD_REDIRECTS, DEFAULT_MAX_DOWNLOAD_SIZE, createIdGenerator, generateId, FETCH_FAILED_ERROR_MESSAGES, BUN_ERROR_CODES, VERSION, getOriginalFetch, getFromApi, DEFAULT_REASONING_BUDGET_PERCENTAGES, suspectProtoRx, suspectConstructorRx, ignoreOverride, defaultOptions, getDefaultOptions, parseCatchDef, integerDateParser, isJsonSchema7AllOfType, emojiRegex, zodPatterns, ALPHA_NUMERIC, primitiveMappings, asAnyOf, parseOptionalDef, parsePipelineDef, parseReadonlyDef, selectParser, getRelativePath, get$ref, addMeta, getRefs, zod3ToJsonSchema, schemaSymbol, getOriginalFetch2, postJsonToApi, postFormDataToApi, postToApi, createJsonErrorResponseHandler, createEventSourceResponseHandler, createJsonResponseHandler, createBinaryResponseHandler, StreamingToolCallTracker;
var init_dist3 = __esm({
  "node_modules/@ai-sdk/provider-utils/dist/index.js"() {
    "use strict";
    init_stream();
    init_dist2();
    ({ btoa, atob } = globalThis);
    imageMediaTypeSignatures = [
      {
        mediaType: "image/gif",
        bytesPrefix: [71, 73, 70]
        // GIF
      },
      {
        mediaType: "image/png",
        bytesPrefix: [137, 80, 78, 71]
        // PNG
      },
      {
        mediaType: "image/jpeg",
        bytesPrefix: [255, 216]
        // JPEG
      },
      {
        mediaType: "image/webp",
        bytesPrefix: [
          82,
          73,
          70,
          70,
          // "RIFF"
          null,
          null,
          null,
          null,
          // file size (variable)
          87,
          69,
          66,
          80
          // "WEBP"
        ]
      },
      {
        mediaType: "image/bmp",
        bytesPrefix: [66, 77]
      },
      {
        mediaType: "image/tiff",
        bytesPrefix: [73, 73, 42, 0]
      },
      {
        mediaType: "image/tiff",
        bytesPrefix: [77, 77, 0, 42]
      },
      {
        mediaType: "image/avif",
        bytesPrefix: [
          0,
          0,
          0,
          32,
          102,
          116,
          121,
          112,
          97,
          118,
          105,
          102
        ]
      },
      {
        mediaType: "image/heic",
        bytesPrefix: [
          0,
          0,
          0,
          32,
          102,
          116,
          121,
          112,
          104,
          101,
          105,
          99
        ]
      }
    ];
    documentMediaTypeSignatures = [
      {
        mediaType: "application/pdf",
        bytesPrefix: [37, 80, 68, 70]
        // %PDF
      }
    ];
    audioMediaTypeSignatures = [
      {
        mediaType: "audio/mpeg",
        bytesPrefix: [255, 251]
      },
      {
        mediaType: "audio/mpeg",
        bytesPrefix: [255, 250]
      },
      {
        mediaType: "audio/mpeg",
        bytesPrefix: [255, 243]
      },
      {
        mediaType: "audio/mpeg",
        bytesPrefix: [255, 242]
      },
      {
        mediaType: "audio/mpeg",
        bytesPrefix: [255, 227]
      },
      {
        mediaType: "audio/mpeg",
        bytesPrefix: [255, 226]
      },
      {
        mediaType: "audio/wav",
        bytesPrefix: [
          82,
          // R
          73,
          // I
          70,
          // F
          70,
          // F
          null,
          null,
          null,
          null,
          87,
          // W
          65,
          // A
          86,
          // V
          69
          // E
        ]
      },
      {
        mediaType: "audio/ogg",
        bytesPrefix: [79, 103, 103, 83]
      },
      {
        mediaType: "audio/flac",
        bytesPrefix: [102, 76, 97, 67]
      },
      {
        mediaType: "audio/aac",
        bytesPrefix: [64, 21, 0, 0]
      },
      {
        mediaType: "audio/mp4",
        bytesPrefix: [102, 116, 121, 112]
      },
      {
        mediaType: "audio/webm",
        bytesPrefix: [26, 69, 223, 163]
      }
    ];
    videoMediaTypeSignatures = [
      {
        mediaType: "video/mp4",
        bytesPrefix: [
          0,
          0,
          0,
          null,
          102,
          116,
          121,
          112
          // ftyp
        ]
      },
      {
        mediaType: "video/webm",
        bytesPrefix: [26, 69, 223, 163]
        // EBML
      },
      {
        mediaType: "video/quicktime",
        bytesPrefix: [
          0,
          0,
          0,
          20,
          102,
          116,
          121,
          112,
          113,
          116
          // ftypqt
        ]
      },
      {
        mediaType: "video/x-msvideo",
        bytesPrefix: [82, 73, 70, 70]
        // RIFF (AVI)
      }
    ];
    stripID3 = (data) => {
      const bytes = typeof data === "string" ? convertBase64ToUint8Array(data) : data;
      const id3Size = (bytes[6] & 127) << 21 | (bytes[7] & 127) << 14 | (bytes[8] & 127) << 7 | bytes[9] & 127;
      return bytes.slice(id3Size + 10);
    };
    topLevelSignatureTables = {
      image: imageMediaTypeSignatures,
      audio: audioMediaTypeSignatures,
      video: videoMediaTypeSignatures,
      application: documentMediaTypeSignatures
    };
    name = "AI_DownloadError";
    marker = `vercel.ai.error.${name}`;
    symbol = Symbol.for(marker);
    DownloadError = class extends (_b = AISDKError, _a = symbol, _b) {
      constructor({
        url,
        statusCode,
        statusText,
        cause,
        message = cause == null ? `Failed to download ${url}: ${statusCode} ${statusText}` : `Failed to download ${url}: ${cause}`
      }) {
        super({ name, message, cause });
        this[_a] = true;
        this.url = url;
        this.statusCode = statusCode;
        this.statusText = statusText;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker);
      }
    };
    MAX_DOWNLOAD_REDIRECTS = 10;
    DEFAULT_MAX_DOWNLOAD_SIZE = 2 * 1024 * 1024 * 1024;
    createIdGenerator = ({
      prefix,
      size = 16,
      alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      separator = "-"
    } = {}) => {
      const generator = () => {
        const alphabetLength = alphabet.length;
        const chars = new Array(size);
        for (let i = 0; i < size; i++) {
          chars[i] = alphabet[Math.random() * alphabetLength | 0];
        }
        return chars.join("");
      };
      if (prefix == null) {
        return generator;
      }
      if (alphabet.includes(separator)) {
        throw new InvalidArgumentError({
          argument: "separator",
          message: `The separator "${separator}" must not be part of the alphabet "${alphabet}".`
        });
      }
      return () => `${prefix}${separator}${generator()}`;
    };
    generateId = createIdGenerator();
    FETCH_FAILED_ERROR_MESSAGES = ["fetch failed", "failed to fetch"];
    BUN_ERROR_CODES = [
      "ConnectionRefused",
      "ConnectionClosed",
      "FailedToOpenSocket",
      "ECONNRESET",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "EPIPE"
    ];
    VERSION = true ? "5.0.0" : "0.0.0-test";
    getOriginalFetch = () => globalThis.fetch;
    getFromApi = async ({
      url,
      headers = {},
      successfulResponseHandler,
      failedResponseHandler,
      abortSignal,
      fetch: fetch2 = getOriginalFetch()
    }) => {
      try {
        const response = await fetch2(url, {
          method: "GET",
          headers: withUserAgentSuffix(
            headers,
            `ai-sdk/provider-utils/${VERSION}`,
            getRuntimeEnvironmentUserAgent()
          ),
          signal: abortSignal
        });
        const responseHeaders = extractResponseHeaders(response);
        if (!response.ok) {
          let errorInformation;
          try {
            errorInformation = await failedResponseHandler({
              response,
              url,
              requestBodyValues: {}
            });
          } catch (error) {
            if (isAbortError(error) || APICallError2.isInstance(error)) {
              throw error;
            }
            throw new APICallError2({
              message: "Failed to process error response",
              cause: error,
              statusCode: response.status,
              url,
              responseHeaders,
              requestBodyValues: {}
            });
          }
          throw errorInformation.value;
        }
        try {
          return await successfulResponseHandler({
            response,
            url,
            requestBodyValues: {}
          });
        } catch (error) {
          if (error instanceof Error) {
            if (isAbortError(error) || APICallError2.isInstance(error)) {
              throw error;
            }
          }
          throw new APICallError2({
            message: "Failed to process successful response",
            cause: error,
            statusCode: response.status,
            url,
            responseHeaders,
            requestBodyValues: {}
          });
        }
      } catch (error) {
        throw handleFetchError({ error, url, requestBodyValues: {} });
      }
    };
    DEFAULT_REASONING_BUDGET_PERCENTAGES = {
      minimal: 0.02,
      low: 0.1,
      medium: 0.3,
      high: 0.6,
      xhigh: 0.9
    };
    suspectProtoRx = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
    suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
    ignoreOverride = /* @__PURE__ */ Symbol(
      "Let zodToJsonSchema decide on which parser to use"
    );
    defaultOptions = {
      name: void 0,
      $refStrategy: "root",
      basePath: ["#"],
      effectStrategy: "input",
      pipeStrategy: "all",
      dateStrategy: "format:date-time",
      mapStrategy: "entries",
      removeAdditionalStrategy: "passthrough",
      allowedAdditionalProperties: true,
      rejectedAdditionalProperties: false,
      definitionPath: "definitions",
      strictUnions: false,
      definitions: {},
      errorMessages: false,
      patternStrategy: "escape",
      applyRegexFlags: false,
      emailStrategy: "format:email",
      base64Strategy: "contentEncoding:base64",
      nameStrategy: "ref"
    };
    getDefaultOptions = (options) => typeof options === "string" ? {
      ...defaultOptions,
      name: options
    } : {
      ...defaultOptions,
      ...options
    };
    parseCatchDef = (def, refs) => {
      return parseDef(def.innerType._def, refs);
    };
    integerDateParser = (def) => {
      const res = {
        type: "integer",
        format: "unix-time"
      };
      for (const check of def.checks) {
        switch (check.kind) {
          case "min":
            res.minimum = check.value;
            break;
          case "max":
            res.maximum = check.value;
            break;
        }
      }
      return res;
    };
    isJsonSchema7AllOfType = (type) => {
      if ("type" in type && type.type === "string") return false;
      return "allOf" in type;
    };
    emojiRegex = void 0;
    zodPatterns = {
      /**
       * `c` was changed to `[cC]` to replicate /i flag
       */
      cuid: /^[cC][^\s-]{8,}$/,
      cuid2: /^[0-9a-z]+$/,
      ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
      /**
       * `a-z` was added to replicate /i flag
       */
      email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
      /**
       * Constructed a valid Unicode RegExp
       *
       * Lazily instantiate since this type of regex isn't supported
       * in all envs (e.g. React Native).
       *
       * See:
       * https://github.com/colinhacks/zod/issues/2433
       * Fix in Zod:
       * https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
       */
      emoji: () => {
        if (emojiRegex === void 0) {
          emojiRegex = RegExp(
            "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$",
            "u"
          );
        }
        return emojiRegex;
      },
      /**
       * Unused
       */
      uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
      /**
       * Unused
       */
      ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
      ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
      /**
       * Unused
       */
      ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
      ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
      base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
      base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
      nanoid: /^[a-zA-Z0-9_-]{21}$/,
      jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
    };
    ALPHA_NUMERIC = new Set(
      "ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789"
    );
    primitiveMappings = {
      ZodString: "string",
      ZodNumber: "number",
      ZodBigInt: "integer",
      ZodBoolean: "boolean",
      ZodNull: "null"
    };
    asAnyOf = (def, refs) => {
      const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map(
        (x, i) => parseDef(x._def, {
          ...refs,
          currentPath: [...refs.currentPath, "anyOf", `${i}`]
        })
      ).filter(
        (x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0)
      );
      return anyOf.length ? { anyOf } : void 0;
    };
    parseOptionalDef = (def, refs) => {
      var _a2;
      if (refs.currentPath.toString() === ((_a2 = refs.propertyPath) == null ? void 0 : _a2.toString())) {
        return parseDef(def.innerType._def, refs);
      }
      const innerSchema = parseDef(def.innerType._def, {
        ...refs,
        currentPath: [...refs.currentPath, "anyOf", "1"]
      });
      return innerSchema ? { anyOf: [{ not: parseAnyDef() }, innerSchema] } : parseAnyDef();
    };
    parsePipelineDef = (def, refs) => {
      if (refs.pipeStrategy === "input") {
        return parseDef(def.in._def, refs);
      } else if (refs.pipeStrategy === "output") {
        return parseDef(def.out._def, refs);
      }
      const inputSchema = parseDef(def.in._def, {
        ...refs,
        currentPath: [...refs.currentPath, "allOf", "0"]
      });
      const outputSchema = parseDef(def.out._def, {
        ...refs,
        currentPath: [...refs.currentPath, "allOf", inputSchema ? "1" : "0"]
      });
      return {
        allOf: [inputSchema, outputSchema].filter(
          (schema) => schema !== void 0
        )
      };
    };
    parseReadonlyDef = (def, refs) => {
      return parseDef(def.innerType._def, refs);
    };
    selectParser = (def, typeName, refs) => {
      switch (typeName) {
        case ZodFirstPartyTypeKind3.ZodString:
          return parseStringDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodNumber:
          return parseNumberDef(def);
        case ZodFirstPartyTypeKind3.ZodObject:
          return parseObjectDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodBigInt:
          return parseBigintDef(def);
        case ZodFirstPartyTypeKind3.ZodBoolean:
          return parseBooleanDef();
        case ZodFirstPartyTypeKind3.ZodDate:
          return parseDateDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodUndefined:
          return parseUndefinedDef();
        case ZodFirstPartyTypeKind3.ZodNull:
          return parseNullDef();
        case ZodFirstPartyTypeKind3.ZodArray:
          return parseArrayDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodUnion:
        case ZodFirstPartyTypeKind3.ZodDiscriminatedUnion:
          return parseUnionDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodIntersection:
          return parseIntersectionDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodTuple:
          return parseTupleDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodRecord:
          return parseRecordDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodLiteral:
          return parseLiteralDef(def);
        case ZodFirstPartyTypeKind3.ZodEnum:
          return parseEnumDef(def);
        case ZodFirstPartyTypeKind3.ZodNativeEnum:
          return parseNativeEnumDef(def);
        case ZodFirstPartyTypeKind3.ZodNullable:
          return parseNullableDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodOptional:
          return parseOptionalDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodMap:
          return parseMapDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodSet:
          return parseSetDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodLazy:
          return () => def.getter()._def;
        case ZodFirstPartyTypeKind3.ZodPromise:
          return parsePromiseDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodNaN:
        case ZodFirstPartyTypeKind3.ZodNever:
          return parseNeverDef();
        case ZodFirstPartyTypeKind3.ZodEffects:
          return parseEffectsDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodAny:
          return parseAnyDef();
        case ZodFirstPartyTypeKind3.ZodUnknown:
          return parseUnknownDef();
        case ZodFirstPartyTypeKind3.ZodDefault:
          return parseDefaultDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodBranded:
          return parseBrandedDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodReadonly:
          return parseReadonlyDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodCatch:
          return parseCatchDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodPipeline:
          return parsePipelineDef(def, refs);
        case ZodFirstPartyTypeKind3.ZodFunction:
        case ZodFirstPartyTypeKind3.ZodVoid:
        case ZodFirstPartyTypeKind3.ZodSymbol:
          return void 0;
        default:
          return /* @__PURE__ */ ((_) => void 0)(typeName);
      }
    };
    getRelativePath = (pathA, pathB) => {
      let i = 0;
      for (; i < pathA.length && i < pathB.length; i++) {
        if (pathA[i] !== pathB[i]) break;
      }
      return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
    };
    get$ref = (item, refs) => {
      switch (refs.$refStrategy) {
        case "root":
          return { $ref: item.path.join("/") };
        case "relative":
          return { $ref: getRelativePath(refs.currentPath, item.path) };
        case "none":
        case "seen": {
          if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
            console.warn(
              `Recursive reference detected at ${refs.currentPath.join(
                "/"
              )}! Defaulting to any`
            );
            return parseAnyDef();
          }
          return refs.$refStrategy === "seen" ? parseAnyDef() : void 0;
        }
      }
    };
    addMeta = (def, refs, jsonSchema2) => {
      if (def.description) {
        jsonSchema2.description = def.description;
      }
      return jsonSchema2;
    };
    getRefs = (options) => {
      const _options = getDefaultOptions(options);
      const currentPath = _options.name !== void 0 ? [..._options.basePath, _options.definitionPath, _options.name] : _options.basePath;
      return {
        ..._options,
        currentPath,
        propertyPath: void 0,
        seen: new Map(
          Object.entries(_options.definitions).map(([name2, def]) => [
            def._def,
            {
              def: def._def,
              path: [..._options.basePath, _options.definitionPath, name2],
              // Resolution of references will be forced even though seen, so it's ok that the schema is undefined here for now.
              jsonSchema: void 0
            }
          ])
        )
      };
    };
    zod3ToJsonSchema = (schema, options) => {
      var _a2;
      const refs = getRefs(options);
      let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce(
        (acc, [name3, schema2]) => {
          var _a3;
          return {
            ...acc,
            [name3]: (_a3 = parseDef(
              schema2._def,
              {
                ...refs,
                currentPath: [...refs.basePath, refs.definitionPath, name3]
              },
              true
            )) != null ? _a3 : parseAnyDef()
          };
        },
        {}
      ) : void 0;
      const name2 = typeof options === "string" ? options : (options == null ? void 0 : options.nameStrategy) === "title" ? void 0 : options == null ? void 0 : options.name;
      const main = (_a2 = parseDef(
        schema._def,
        name2 === void 0 ? refs : {
          ...refs,
          currentPath: [...refs.basePath, refs.definitionPath, name2]
        },
        false
      )) != null ? _a2 : parseAnyDef();
      const title = typeof options === "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
      if (title !== void 0) {
        main.title = title;
      }
      const combined = name2 === void 0 ? definitions ? {
        ...main,
        [refs.definitionPath]: definitions
      } : main : {
        $ref: [
          ...refs.$refStrategy === "relative" ? [] : refs.basePath,
          refs.definitionPath,
          name2
        ].join("/"),
        [refs.definitionPath]: {
          ...definitions,
          [name2]: main
        }
      };
      combined.$schema = "http://json-schema.org/draft-07/schema#";
      return combined;
    };
    schemaSymbol = /* @__PURE__ */ Symbol.for("vercel.ai.schema");
    getOriginalFetch2 = () => globalThis.fetch;
    postJsonToApi = async ({
      url,
      headers,
      body,
      failedResponseHandler,
      successfulResponseHandler,
      abortSignal,
      fetch: fetch2
    }) => await postToApi({
      url,
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: {
        content: JSON.stringify(body),
        values: body
      },
      failedResponseHandler,
      successfulResponseHandler,
      abortSignal,
      fetch: fetch2
    });
    postFormDataToApi = async ({
      url,
      headers,
      formData,
      failedResponseHandler,
      successfulResponseHandler,
      abortSignal,
      fetch: fetch2
    }) => await postToApi({
      url,
      headers,
      body: {
        content: formData,
        values: Object.fromEntries(formData.entries())
      },
      failedResponseHandler,
      successfulResponseHandler,
      abortSignal,
      fetch: fetch2
    });
    postToApi = async ({
      url,
      headers = {},
      body,
      successfulResponseHandler,
      failedResponseHandler,
      abortSignal,
      fetch: fetch2 = getOriginalFetch2()
    }) => {
      try {
        const response = await fetch2(url, {
          method: "POST",
          headers: withUserAgentSuffix(
            headers,
            `ai-sdk/provider-utils/${VERSION}`,
            getRuntimeEnvironmentUserAgent()
          ),
          body: body.content,
          signal: abortSignal
        });
        const responseHeaders = extractResponseHeaders(response);
        if (!response.ok) {
          let errorInformation;
          try {
            errorInformation = await failedResponseHandler({
              response,
              url,
              requestBodyValues: body.values
            });
          } catch (error) {
            if (isAbortError(error) || APICallError3.isInstance(error)) {
              throw error;
            }
            throw new APICallError3({
              message: "Failed to process error response",
              cause: error,
              statusCode: response.status,
              url,
              responseHeaders,
              requestBodyValues: body.values
            });
          }
          throw errorInformation.value;
        }
        try {
          return await successfulResponseHandler({
            response,
            url,
            requestBodyValues: body.values
          });
        } catch (error) {
          if (error instanceof Error) {
            if (isAbortError(error) || APICallError3.isInstance(error)) {
              throw error;
            }
          }
          throw new APICallError3({
            message: "Failed to process successful response",
            cause: error,
            statusCode: response.status,
            url,
            responseHeaders,
            requestBodyValues: body.values
          });
        }
      } catch (error) {
        throw handleFetchError({ error, url, requestBodyValues: body.values });
      }
    };
    createJsonErrorResponseHandler = ({
      errorSchema,
      errorToMessage,
      isRetryable
    }) => async ({ response, url, requestBodyValues }) => {
      const responseBody = await response.text();
      const responseHeaders = extractResponseHeaders(response);
      if (responseBody.trim() === "") {
        return {
          responseHeaders,
          value: new APICallError4({
            message: response.statusText,
            url,
            requestBodyValues,
            statusCode: response.status,
            responseHeaders,
            responseBody,
            isRetryable: isRetryable == null ? void 0 : isRetryable(response)
          })
        };
      }
      try {
        const parsedError = await parseJSON({
          text: responseBody,
          schema: errorSchema
        });
        return {
          responseHeaders,
          value: new APICallError4({
            message: errorToMessage(parsedError),
            url,
            requestBodyValues,
            statusCode: response.status,
            responseHeaders,
            responseBody,
            data: parsedError,
            isRetryable: isRetryable == null ? void 0 : isRetryable(response, parsedError)
          })
        };
      } catch (e) {
        return {
          responseHeaders,
          value: new APICallError4({
            message: response.statusText,
            url,
            requestBodyValues,
            statusCode: response.status,
            responseHeaders,
            responseBody,
            isRetryable: isRetryable == null ? void 0 : isRetryable(response)
          })
        };
      }
    };
    createEventSourceResponseHandler = (chunkSchema2) => async ({ response }) => {
      const responseHeaders = extractResponseHeaders(response);
      if (response.body == null) {
        throw new EmptyResponseBodyError({});
      }
      return {
        responseHeaders,
        value: parseJsonEventStream({
          stream: response.body,
          schema: chunkSchema2
        })
      };
    };
    createJsonResponseHandler = (responseSchema2) => async ({ response, url, requestBodyValues }) => {
      const responseBody = await response.text();
      const parsedResult = await safeParseJSON({
        text: responseBody,
        schema: responseSchema2
      });
      const responseHeaders = extractResponseHeaders(response);
      if (!parsedResult.success) {
        throw new APICallError4({
          message: "Invalid JSON response",
          cause: parsedResult.error,
          statusCode: response.status,
          responseHeaders,
          responseBody,
          url,
          requestBodyValues
        });
      }
      return {
        responseHeaders,
        value: parsedResult.value,
        rawValue: parsedResult.rawValue
      };
    };
    createBinaryResponseHandler = () => async ({ response, url, requestBodyValues }) => {
      const responseHeaders = extractResponseHeaders(response);
      if (!response.body) {
        throw new APICallError4({
          message: "Response body is empty",
          url,
          requestBodyValues,
          statusCode: response.status,
          responseHeaders,
          responseBody: void 0
        });
      }
      try {
        const buffer = await response.arrayBuffer();
        return {
          responseHeaders,
          value: new Uint8Array(buffer)
        };
      } catch (error) {
        throw new APICallError4({
          message: "Failed to read response as array buffer",
          url,
          requestBodyValues,
          statusCode: response.status,
          responseHeaders,
          responseBody: void 0,
          cause: error
        });
      }
    };
    StreamingToolCallTracker = class {
      constructor(controller, options = {}) {
        this.toolCalls = [];
        var _a2, _b2;
        this.controller = controller;
        this._generateId = (_a2 = options.generateId) != null ? _a2 : generateId;
        this.typeValidation = (_b2 = options.typeValidation) != null ? _b2 : "none";
        this.extractMetadata = options.extractMetadata;
        this.buildToolCallProviderMetadata = options.buildToolCallProviderMetadata;
      }
      /**
       * Process a tool call delta from a streaming response chunk.
       * Emits tool-input-start, tool-input-delta, tool-input-end, and tool-call
       * events as appropriate.
       */
      processDelta(toolCallDelta) {
        var _a2;
        const index = (_a2 = toolCallDelta.index) != null ? _a2 : this.toolCalls.length;
        if (this.toolCalls[index] == null) {
          this.processNewToolCall(index, toolCallDelta);
        } else {
          this.processExistingToolCall(index, toolCallDelta);
        }
      }
      /**
       * Finalize any unfinished tool calls. Should be called during the stream's
       * flush handler to ensure all tool calls are properly completed.
       */
      flush() {
        for (const toolCall of this.toolCalls) {
          if (!toolCall.hasFinished) {
            this.finishToolCall(toolCall);
          }
        }
      }
      processNewToolCall(index, toolCallDelta) {
        var _a2, _b2, _c;
        if (this.typeValidation === "required") {
          if (toolCallDelta.type !== "function") {
            throw new InvalidResponseDataError({
              data: toolCallDelta,
              message: `Expected 'function' type.`
            });
          }
        } else if (this.typeValidation === "if-present") {
          if (toolCallDelta.type != null && toolCallDelta.type !== "function") {
            throw new InvalidResponseDataError({
              data: toolCallDelta,
              message: `Expected 'function' type.`
            });
          }
        }
        if (toolCallDelta.id == null) {
          throw new InvalidResponseDataError({
            data: toolCallDelta,
            message: `Expected 'id' to be a string.`
          });
        }
        if (((_a2 = toolCallDelta.function) == null ? void 0 : _a2.name) == null) {
          throw new InvalidResponseDataError({
            data: toolCallDelta,
            message: `Expected 'function.name' to be a string.`
          });
        }
        this.controller.enqueue({
          type: "tool-input-start",
          id: toolCallDelta.id,
          toolName: toolCallDelta.function.name
        });
        const metadata = (_b2 = this.extractMetadata) == null ? void 0 : _b2.call(this, toolCallDelta);
        this.toolCalls[index] = {
          id: toolCallDelta.id,
          type: "function",
          function: {
            name: toolCallDelta.function.name,
            arguments: (_c = toolCallDelta.function.arguments) != null ? _c : ""
          },
          hasFinished: false,
          metadata
        };
        const toolCall = this.toolCalls[index];
        if (toolCall.function.arguments.length > 0) {
          this.controller.enqueue({
            type: "tool-input-delta",
            id: toolCall.id,
            delta: toolCall.function.arguments
          });
        }
        if (isParsableJson(toolCall.function.arguments)) {
          this.finishToolCall(toolCall);
        }
      }
      processExistingToolCall(index, toolCallDelta) {
        var _a2;
        const toolCall = this.toolCalls[index];
        if (toolCall.hasFinished) {
          return;
        }
        if (((_a2 = toolCallDelta.function) == null ? void 0 : _a2.arguments) != null) {
          toolCall.function.arguments += toolCallDelta.function.arguments;
          this.controller.enqueue({
            type: "tool-input-delta",
            id: toolCall.id,
            delta: toolCallDelta.function.arguments
          });
        }
        if (isParsableJson(toolCall.function.arguments)) {
          this.finishToolCall(toolCall);
        }
      }
      finishToolCall(toolCall) {
        var _a2, _b2;
        this.controller.enqueue({
          type: "tool-input-end",
          id: toolCall.id
        });
        const providerMetadata = (_a2 = this.buildToolCallProviderMetadata) == null ? void 0 : _a2.call(
          this,
          toolCall.metadata
        );
        this.controller.enqueue({
          type: "tool-call",
          toolCallId: (_b2 = toolCall.id) != null ? _b2 : this._generateId(),
          toolName: toolCall.function.name,
          input: toolCall.function.arguments,
          ...providerMetadata ? { providerMetadata } : {}
        });
        toolCall.hasFinished = true;
      }
    };
  }
});

// node_modules/@ai-sdk/openai/dist/index.js
var dist_exports = {};
__export(dist_exports, {
  Experimental_OpenAIRealtimeModel: () => OpenAIRealtimeModel,
  VERSION: () => VERSION2,
  createOpenAI: () => createOpenAI,
  openai: () => openai
});
import { z as z2 } from "zod/v4";
import { APICallError as APICallError5 } from "@ai-sdk/provider";
import {
  UnsupportedFunctionalityError as UnsupportedFunctionalityError2
} from "@ai-sdk/provider";
import { z as z22 } from "zod/v4";
import { z as z3 } from "zod/v4";
import {
  UnsupportedFunctionalityError as UnsupportedFunctionalityError22
} from "@ai-sdk/provider";
import {
  InvalidPromptError,
  UnsupportedFunctionalityError as UnsupportedFunctionalityError3
} from "@ai-sdk/provider";
import { z as z42 } from "zod/v4";
import { z as z5 } from "zod/v4";
import {
  TooManyEmbeddingValuesForCallError
} from "@ai-sdk/provider";
import { z as z6 } from "zod/v4";
import { z as z7 } from "zod/v4";
import { z as z8 } from "zod/v4";
import { z as z9 } from "zod/v4";
import { z as z10 } from "zod/v4";
import { z as z11 } from "zod/v4";
import { z as z12 } from "zod/v4";
import { z as z13 } from "zod/v4";
import { z as z14 } from "zod/v4";
import { z as z15 } from "zod/v4";
import { z as z16 } from "zod/v4";
import { z as z17 } from "zod/v4";
import { z as z18 } from "zod/v4";
import { z as z19 } from "zod/v4";
import { z as z20 } from "zod/v4";
import { z as z21 } from "zod/v4";
import { z as z222 } from "zod/v4";
import {
  APICallError as APICallError22
} from "@ai-sdk/provider";
import {
  UnsupportedFunctionalityError as UnsupportedFunctionalityError4
} from "@ai-sdk/provider";
import { z as z23 } from "zod/v4";
import { z as z24 } from "zod/v4";
import { z as z25 } from "zod/v4";
import {
  UnsupportedFunctionalityError as UnsupportedFunctionalityError5
} from "@ai-sdk/provider";
import { z as z26 } from "zod/v4";
import { z as z27 } from "zod/v4";
import { z as z28 } from "zod/v4";
import { z as z29 } from "zod/v4";
function getOpenAILanguageModelCapabilities(modelId) {
  const supportsFlexProcessing = modelId.startsWith("o3") || modelId.startsWith("o4-mini") || modelId.startsWith("gpt-5") && !modelId.startsWith("gpt-5-chat");
  const supportsPriorityProcessing = modelId.startsWith("gpt-4") || modelId.startsWith("gpt-5") && !modelId.startsWith("gpt-5-nano") && !modelId.startsWith("gpt-5-chat") && !modelId.startsWith("gpt-5.4-nano") || modelId.startsWith("o3") || modelId.startsWith("o4-mini");
  const isReasoningModel = modelId.startsWith("o1") || modelId.startsWith("o3") || modelId.startsWith("o4-mini") || modelId.startsWith("gpt-5") && !modelId.startsWith("gpt-5-chat");
  const supportsNonReasoningParameters = modelId.startsWith("gpt-5.1") || modelId.startsWith("gpt-5.2") || modelId.startsWith("gpt-5.3") || modelId.startsWith("gpt-5.4") || modelId.startsWith("gpt-5.5");
  const systemMessageMode = isReasoningModel ? "developer" : "system";
  return {
    supportsFlexProcessing,
    supportsPriorityProcessing,
    isReasoningModel,
    systemMessageMode,
    supportsNonReasoningParameters
  };
}
async function throwIfOpenAIStreamErrorBeforeOutput({
  stream,
  getError,
  isOutputChunk,
  url,
  requestBodyValues,
  responseHeaders
}) {
  const [streamForEarlyError, streamForConsumer] = stream.tee();
  const reader = streamForEarlyError.getReader();
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) {
        return streamForConsumer;
      }
      const chunk = result.value;
      if (!chunk.success) {
        return streamForConsumer;
      }
      const errorFrame = getError(chunk.value);
      if (errorFrame != null) {
        streamForConsumer.cancel().catch(() => {
        });
        throw createOpenAIStreamError({
          frame: errorFrame,
          url,
          requestBodyValues,
          responseHeaders
        });
      }
      if (isOutputChunk(chunk.value)) {
        return streamForConsumer;
      }
    }
  } finally {
    reader.cancel().catch(() => {
    });
    reader.releaseLock();
  }
}
function createOpenAIStreamError({
  frame,
  url,
  requestBodyValues,
  responseHeaders
}) {
  var _a2;
  const streamError = parseStreamError(frame);
  return new APICallError5({
    message: (_a2 = streamError == null ? void 0 : streamError.message) != null ? _a2 : "OpenAI stream failed before any output was generated",
    url,
    requestBodyValues,
    statusCode: streamError == null ? 500 : getStatusCode(streamError),
    responseHeaders,
    responseBody: JSON.stringify(frame),
    data: frame
  });
}
function parseStreamError(frame) {
  var _a2;
  const value = asRecord(frame);
  if (value == null) {
    return void 0;
  }
  if (value.type === "response.failed") {
    const response = asRecord(value.response);
    const responseError = asRecord(response == null ? void 0 : response.error);
    return typeof (responseError == null ? void 0 : responseError.message) === "string" ? {
      message: responseError.message,
      code: getStringOrNumber(responseError.code),
      type: "response.failed",
      frame
    } : void 0;
  }
  const error = (_a2 = asRecord(value.error)) != null ? _a2 : value;
  return typeof error.message === "string" && (asRecord(value.error) != null || typeof error.type === "string" || "code" in error || "param" in error) ? {
    message: error.message,
    code: getStringOrNumber(error.code),
    type: typeof error.type === "string" ? error.type : void 0,
    frame
  } : void 0;
}
function getStatusCode(error) {
  if (typeof error.code === "number" && isHttpErrorStatusCode(error.code)) {
    return error.code;
  }
  if (typeof error.code === "string" && /^\d{3}$/.test(error.code)) {
    const numericCode = Number(error.code);
    if (isHttpErrorStatusCode(numericCode)) {
      return numericCode;
    }
  }
  const discriminator = [error.code, error.type].filter((value) => typeof value === "string" || typeof value === "number").join(" ").toLowerCase();
  if (["insufficient_quota", "rate_limit"].some(
    (term) => discriminator.includes(term)
  )) {
    return 429;
  }
  if (discriminator.includes("authentication")) return 401;
  if (discriminator.includes("permission")) return 403;
  if (discriminator.includes("not_found")) return 404;
  if (["invalid", "bad_request", "context_length"].some(
    (term) => discriminator.includes(term)
  )) {
    return 400;
  }
  if (discriminator.includes("overload")) return 503;
  if (discriminator.includes("timeout")) return 504;
  return 500;
}
function asRecord(value) {
  return typeof value === "object" && value != null ? value : void 0;
}
function getStringOrNumber(value) {
  return typeof value === "string" || typeof value === "number" ? value : void 0;
}
function isHttpErrorStatusCode(value) {
  return Number.isInteger(value) && value >= 400 && value <= 599;
}
function convertOpenAIChatUsage(usage) {
  var _a2, _b2, _c, _d, _e, _f;
  if (usage == null) {
    return {
      inputTokens: {
        total: void 0,
        noCache: void 0,
        cacheRead: void 0,
        cacheWrite: void 0
      },
      outputTokens: {
        total: void 0,
        text: void 0,
        reasoning: void 0
      },
      raw: void 0
    };
  }
  const promptTokens = (_a2 = usage.prompt_tokens) != null ? _a2 : 0;
  const completionTokens = (_b2 = usage.completion_tokens) != null ? _b2 : 0;
  const cachedTokens = (_d = (_c = usage.prompt_tokens_details) == null ? void 0 : _c.cached_tokens) != null ? _d : 0;
  const reasoningTokens = (_f = (_e = usage.completion_tokens_details) == null ? void 0 : _e.reasoning_tokens) != null ? _f : 0;
  return {
    inputTokens: {
      total: promptTokens,
      noCache: promptTokens - cachedTokens,
      cacheRead: cachedTokens,
      cacheWrite: void 0
    },
    outputTokens: {
      total: completionTokens,
      text: completionTokens - reasoningTokens,
      reasoning: reasoningTokens
    },
    raw: usage
  };
}
function serializeToolCallArguments(input) {
  return JSON.stringify(input === void 0 ? {} : input);
}
function convertToOpenAIChatMessages({
  prompt,
  systemMessageMode = "system"
}) {
  var _a2;
  const messages = [];
  const warnings = [];
  for (const { role, content } of prompt) {
    switch (role) {
      case "system": {
        switch (systemMessageMode) {
          case "system": {
            messages.push({ role: "system", content });
            break;
          }
          case "developer": {
            messages.push({ role: "developer", content });
            break;
          }
          case "remove": {
            warnings.push({
              type: "other",
              message: "system messages are removed for this model"
            });
            break;
          }
          default: {
            const _exhaustiveCheck = systemMessageMode;
            throw new Error(
              `Unsupported system message mode: ${_exhaustiveCheck}`
            );
          }
        }
        break;
      }
      case "user": {
        if (content.length === 1 && content[0].type === "text") {
          messages.push({ role: "user", content: content[0].text });
          break;
        }
        messages.push({
          role: "user",
          content: content.map((part, index) => {
            var _a22, _b2, _c;
            switch (part.type) {
              case "text": {
                return { type: "text", text: part.text };
              }
              case "file": {
                switch (part.data.type) {
                  case "reference": {
                    return {
                      type: "file",
                      file: {
                        file_id: resolveProviderReference({
                          reference: part.data.reference,
                          provider: "openai"
                        })
                      }
                    };
                  }
                  case "text": {
                    throw new UnsupportedFunctionalityError2({
                      functionality: "text file parts"
                    });
                  }
                  case "url":
                  case "data": {
                    const topLevel = getTopLevelMediaType(part.mediaType);
                    if (topLevel === "image") {
                      return {
                        type: "image_url",
                        image_url: {
                          url: part.data.type === "url" ? part.data.url.toString() : convertToBase64(part.data.data),
                          detail: (_b2 = (_a22 = part.providerOptions) == null ? void 0 : _a22.openai) == null ? void 0 : _b2.imageDetail
                        }
                      };
                    } else if (topLevel === "audio") {
                      if (part.data.type === "url") {
                        throw new UnsupportedFunctionalityError2({
                          functionality: "audio file parts with URLs"
                        });
                      }
                      const fullMediaType = resolveFullMediaType({ part });
                      switch (fullMediaType) {
                        case "audio/wav": {
                          return {
                            type: "input_audio",
                            input_audio: {
                              data: convertToBase64(part.data.data),
                              format: "wav"
                            }
                          };
                        }
                        case "audio/mp3":
                        case "audio/mpeg": {
                          return {
                            type: "input_audio",
                            input_audio: {
                              data: convertToBase64(part.data.data),
                              format: "mp3"
                            }
                          };
                        }
                        default: {
                          throw new UnsupportedFunctionalityError2({
                            functionality: `audio content parts with media type ${fullMediaType}`
                          });
                        }
                      }
                    }
                    {
                      const fullMediaType = resolveFullMediaType({ part });
                      if (fullMediaType !== "application/pdf") {
                        throw new UnsupportedFunctionalityError2({
                          functionality: `file part media type ${fullMediaType}`
                        });
                      }
                      if (part.data.type === "url") {
                        throw new UnsupportedFunctionalityError2({
                          functionality: "PDF file parts with URLs"
                        });
                      }
                      return {
                        type: "file",
                        file: {
                          filename: (_c = part.filename) != null ? _c : `part-${index}.pdf`,
                          file_data: `data:application/pdf;base64,${convertToBase64(part.data.data)}`
                        }
                      };
                    }
                  }
                }
              }
            }
          })
        });
        break;
      }
      case "assistant": {
        let text = "";
        const toolCalls = [];
        for (const part of content) {
          switch (part.type) {
            case "text": {
              text += part.text;
              break;
            }
            case "tool-call": {
              toolCalls.push({
                id: part.toolCallId,
                type: "function",
                function: {
                  name: part.toolName,
                  arguments: serializeToolCallArguments(part.input)
                }
              });
              break;
            }
          }
        }
        messages.push({
          role: "assistant",
          content: toolCalls.length > 0 ? text || null : text,
          tool_calls: toolCalls.length > 0 ? toolCalls : void 0
        });
        break;
      }
      case "tool": {
        for (const toolResponse of content) {
          if (toolResponse.type === "tool-approval-response") {
            continue;
          }
          const output = toolResponse.output;
          let contentValue;
          switch (output.type) {
            case "text":
            case "error-text":
              contentValue = output.value;
              break;
            case "execution-denied":
              contentValue = (_a2 = output.reason) != null ? _a2 : "Tool call execution denied.";
              break;
            case "content":
            case "json":
            case "error-json":
              contentValue = JSON.stringify(output.value);
              break;
          }
          messages.push({
            role: "tool",
            tool_call_id: toolResponse.toolCallId,
            content: contentValue
          });
        }
        break;
      }
      default: {
        const _exhaustiveCheck = role;
        throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
      }
    }
  }
  return { messages, warnings };
}
function getResponseMetadata({
  id,
  model,
  created
}) {
  return {
    id: id != null ? id : void 0,
    modelId: model != null ? model : void 0,
    timestamp: created ? new Date(created * 1e3) : void 0
  };
}
function mapOpenAIFinishReason(finishReason) {
  switch (finishReason) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "content_filter":
      return "content-filter";
    case "function_call":
    case "tool_calls":
      return "tool-calls";
    default:
      return "other";
  }
}
function prepareChatTools({
  tools,
  toolChoice
}) {
  tools = (tools == null ? void 0 : tools.length) ? tools : void 0;
  const toolWarnings = [];
  if (tools == null) {
    return { tools: void 0, toolChoice: void 0, toolWarnings };
  }
  const openaiTools2 = [];
  for (const tool2 of tools) {
    switch (tool2.type) {
      case "function":
        openaiTools2.push({
          type: "function",
          function: {
            name: tool2.name,
            description: tool2.description,
            parameters: tool2.inputSchema,
            ...tool2.strict != null ? { strict: tool2.strict } : {}
          }
        });
        break;
      default:
        toolWarnings.push({
          type: "unsupported",
          feature: `tool type: ${tool2.type}`
        });
        break;
    }
  }
  if (toolChoice == null) {
    return { tools: openaiTools2, toolChoice: void 0, toolWarnings };
  }
  const type = toolChoice.type;
  switch (type) {
    case "auto":
    case "none":
    case "required":
      return { tools: openaiTools2, toolChoice: type, toolWarnings };
    case "tool":
      return {
        tools: openaiTools2,
        toolChoice: {
          type: "function",
          function: {
            name: toolChoice.toolName
          }
        },
        toolWarnings
      };
    default: {
      const _exhaustiveCheck = type;
      throw new UnsupportedFunctionalityError22({
        functionality: `tool choice type: ${_exhaustiveCheck}`
      });
    }
  }
}
function isOpenAIChatOutputChunk(chunk) {
  if ("error" in chunk) {
    return false;
  }
  return chunk.choices.some((choice) => {
    const delta = choice.delta;
    return (delta == null ? void 0 : delta.content) != null && delta.content.length > 0 || (delta == null ? void 0 : delta.tool_calls) != null && delta.tool_calls.length > 0 || (delta == null ? void 0 : delta.annotations) != null && delta.annotations.length > 0;
  });
}
function convertOpenAICompletionUsage(usage) {
  var _a2, _b2, _c, _d;
  if (usage == null) {
    return {
      inputTokens: {
        total: void 0,
        noCache: void 0,
        cacheRead: void 0,
        cacheWrite: void 0
      },
      outputTokens: {
        total: void 0,
        text: void 0,
        reasoning: void 0
      },
      raw: void 0
    };
  }
  const promptTokens = (_a2 = usage.prompt_tokens) != null ? _a2 : 0;
  const completionTokens = (_b2 = usage.completion_tokens) != null ? _b2 : 0;
  return {
    inputTokens: {
      total: (_c = usage.prompt_tokens) != null ? _c : void 0,
      noCache: promptTokens,
      cacheRead: void 0,
      cacheWrite: void 0
    },
    outputTokens: {
      total: (_d = usage.completion_tokens) != null ? _d : void 0,
      text: completionTokens,
      reasoning: void 0
    },
    raw: usage
  };
}
function convertToOpenAICompletionPrompt({
  prompt,
  user = "user",
  assistant = "assistant"
}) {
  let text = "";
  if (prompt[0].role === "system") {
    text += `${prompt[0].content}

`;
    prompt = prompt.slice(1);
  }
  for (const { role, content } of prompt) {
    switch (role) {
      case "system": {
        throw new InvalidPromptError({
          message: "Unexpected system message in prompt: ${content}",
          prompt
        });
      }
      case "user": {
        const userMessage = content.map((part) => {
          switch (part.type) {
            case "text": {
              return part.text;
            }
          }
        }).filter(Boolean).join("");
        text += `${user}:
${userMessage}

`;
        break;
      }
      case "assistant": {
        const assistantMessage = content.map((part) => {
          switch (part.type) {
            case "text": {
              return part.text;
            }
            case "tool-call": {
              throw new UnsupportedFunctionalityError3({
                functionality: "tool-call messages"
              });
            }
          }
        }).join("");
        text += `${assistant}:
${assistantMessage}

`;
        break;
      }
      case "tool": {
        throw new UnsupportedFunctionalityError3({
          functionality: "tool messages"
        });
      }
      default: {
        const _exhaustiveCheck = role;
        throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
      }
    }
  }
  text += `${assistant}:
`;
  return {
    prompt: text,
    stopSequences: [`
${user}:`]
  };
}
function getResponseMetadata2({
  id,
  model,
  created
}) {
  return {
    id: id != null ? id : void 0,
    modelId: model != null ? model : void 0,
    timestamp: created != null ? new Date(created * 1e3) : void 0
  };
}
function mapOpenAIFinishReason2(finishReason) {
  switch (finishReason) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "content_filter":
      return "content-filter";
    case "function_call":
    case "tool_calls":
      return "tool-calls";
    default:
      return "other";
  }
}
function isOpenAICompletionOutputChunk(chunk) {
  return !("error" in chunk) && chunk.choices.some((choice) => choice.text.length > 0);
}
function hasDefaultResponseFormat(modelId) {
  return defaultResponseFormatPrefixes.some(
    (prefix) => modelId.startsWith(prefix)
  );
}
function distributeTokenDetails(details, index, total) {
  if (details == null) {
    return {};
  }
  const result = {};
  if (details.image_tokens != null) {
    const base = Math.floor(details.image_tokens / total);
    const remainder = details.image_tokens - base * (total - 1);
    result.imageTokens = index === total - 1 ? remainder : base;
  }
  if (details.text_tokens != null) {
    const base = Math.floor(details.text_tokens / total);
    const remainder = details.text_tokens - base * (total - 1);
    result.textTokens = index === total - 1 ? remainder : base;
  }
  return result;
}
async function fileToBlob(file) {
  if (!file) return void 0;
  if (file.type === "url") {
    return downloadBlob(file.url);
  }
  const data = file.data instanceof Uint8Array ? file.data : convertBase64ToUint8Array(file.data);
  return new Blob([data], { type: file.mediaType });
}
function parseOpenAIRealtimeServerEvent(raw) {
  var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s;
  const event = raw;
  const type = event.type;
  switch (type) {
    // ── Session lifecycle ──────────────────────────────────────────
    case "session.created":
      return {
        type: "session-created",
        sessionId: (_a2 = event.session) == null ? void 0 : _a2.id,
        raw
      };
    case "session.updated":
      return { type: "session-updated", raw };
    // ── Input audio buffer ─────────────────────────────────────────
    case "input_audio_buffer.speech_started":
      return {
        type: "speech-started",
        itemId: event.item_id,
        raw
      };
    case "input_audio_buffer.speech_stopped":
      return {
        type: "speech-stopped",
        itemId: event.item_id,
        raw
      };
    case "input_audio_buffer.committed":
      return {
        type: "audio-committed",
        itemId: event.item_id,
        previousItemId: event.previous_item_id,
        raw
      };
    // ── Conversation items ─────────────────────────────────────────
    case "conversation.item.added":
      return {
        type: "conversation-item-added",
        itemId: (_c = (_b2 = event.item) == null ? void 0 : _b2.id) != null ? _c : event.item_id,
        item: event.item,
        raw
      };
    case "conversation.item.input_audio_transcription.completed":
      return {
        type: "input-transcription-completed",
        itemId: event.item_id,
        transcript: (_d = event.transcript) != null ? _d : "",
        raw
      };
    // ── Response lifecycle ──────────────────────────────────────────
    case "response.created":
      return {
        type: "response-created",
        responseId: (_f = (_e = event.response) == null ? void 0 : _e.id) != null ? _f : event.response_id,
        raw
      };
    case "response.done":
      return {
        type: "response-done",
        responseId: (_h = (_g = event.response) == null ? void 0 : _g.id) != null ? _h : event.response_id,
        status: (_j = (_i = event.response) == null ? void 0 : _i.status) != null ? _j : "completed",
        raw
      };
    // ── Output item lifecycle ───────────────────────────────────────
    case "response.output_item.added":
      return {
        type: "output-item-added",
        responseId: event.response_id,
        itemId: (_l = (_k = event.item) == null ? void 0 : _k.id) != null ? _l : event.item_id,
        raw
      };
    case "response.output_item.done":
      return {
        type: "output-item-done",
        responseId: event.response_id,
        itemId: (_n = (_m = event.item) == null ? void 0 : _m.id) != null ? _n : event.item_id,
        raw
      };
    case "response.content_part.added":
      return {
        type: "content-part-added",
        responseId: event.response_id,
        itemId: event.item_id,
        raw
      };
    case "response.content_part.done":
      return {
        type: "content-part-done",
        responseId: event.response_id,
        itemId: event.item_id,
        raw
      };
    // ── Audio output ────────────────────────────────────────────────
    case "response.output_audio.delta":
      return {
        type: "audio-delta",
        responseId: event.response_id,
        itemId: event.item_id,
        delta: event.delta,
        raw
      };
    case "response.output_audio.done":
      return {
        type: "audio-done",
        responseId: event.response_id,
        itemId: event.item_id,
        raw
      };
    // ── Audio transcript output ─────────────────────────────────────
    case "response.output_audio_transcript.delta":
      return {
        type: "audio-transcript-delta",
        responseId: event.response_id,
        itemId: event.item_id,
        delta: event.delta,
        raw
      };
    case "response.output_audio_transcript.done":
      return {
        type: "audio-transcript-done",
        responseId: event.response_id,
        itemId: event.item_id,
        transcript: event.transcript,
        raw
      };
    // ── Text output ─────────────────────────────────────────────────
    case "response.output_text.delta":
      return {
        type: "text-delta",
        responseId: event.response_id,
        itemId: event.item_id,
        delta: event.delta,
        raw
      };
    case "response.output_text.done":
      return {
        type: "text-done",
        responseId: event.response_id,
        itemId: event.item_id,
        text: event.text,
        raw
      };
    // ── Function calling ────────────────────────────────────────────
    case "response.function_call_arguments.delta":
      return {
        type: "function-call-arguments-delta",
        responseId: event.response_id,
        itemId: event.item_id,
        callId: event.call_id,
        delta: event.delta,
        raw
      };
    case "response.function_call_arguments.done":
      return {
        type: "function-call-arguments-done",
        responseId: event.response_id,
        itemId: event.item_id,
        callId: event.call_id,
        name: event.name,
        arguments: event.arguments,
        raw
      };
    // ── Error ───────────────────────────────────────────────────────
    case "error":
      return {
        type: "error",
        message: (_q = (_p = (_o = event.error) == null ? void 0 : _o.message) != null ? _p : event.message) != null ? _q : "Unknown error",
        code: (_s = (_r = event.error) == null ? void 0 : _r.code) != null ? _s : event.code,
        raw
      };
    // ── Pass-through ────────────────────────────────────────────────
    default:
      return { type: "custom", rawType: type, raw };
  }
}
function serializeOpenAIRealtimeClientEvent(event, modelId) {
  switch (event.type) {
    case "session-update":
      return {
        type: "session.update",
        session: buildOpenAISessionConfig(event.config, modelId)
      };
    case "input-audio-append":
      return {
        type: "input_audio_buffer.append",
        audio: event.audio
      };
    case "input-audio-commit":
      return { type: "input_audio_buffer.commit" };
    case "input-audio-clear":
      return { type: "input_audio_buffer.clear" };
    case "conversation-item-create": {
      const item = event.item;
      switch (item.type) {
        case "text-message":
          return {
            type: "conversation.item.create",
            item: {
              type: "message",
              role: item.role,
              content: [{ type: "input_text", text: item.text }]
            }
          };
        case "audio-message":
          return {
            type: "conversation.item.create",
            item: {
              type: "message",
              role: item.role,
              content: [{ type: "input_audio", audio: item.audio }]
            }
          };
        case "function-call-output":
          return {
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: item.callId,
              output: item.output
            }
          };
      }
      break;
    }
    case "conversation-item-truncate":
      return {
        type: "conversation.item.truncate",
        item_id: event.itemId,
        content_index: event.contentIndex,
        audio_end_ms: event.audioEndMs
      };
    case "response-create":
      return {
        type: "response.create",
        ...event.options != null ? {
          response: {
            ...event.options.modalities != null ? { output_modalities: event.options.modalities } : {},
            ...event.options.instructions != null ? { instructions: event.options.instructions } : {},
            ...event.options.metadata != null ? { metadata: event.options.metadata } : {}
          }
        } : {}
      };
    case "response-cancel":
      return { type: "response.cancel" };
  }
}
function buildOpenAISessionConfig(config, modelId) {
  var _a2;
  const session = {
    type: "realtime",
    model: modelId
  };
  if (config.instructions != null) {
    session.instructions = config.instructions;
  }
  if (config.outputModalities != null) {
    session.output_modalities = config.outputModalities;
  }
  const audio = {};
  if (config.inputAudioFormat != null || config.inputAudioTranscription != null || config.turnDetection != null) {
    const input = {};
    if (config.inputAudioFormat != null) {
      input.format = {
        type: config.inputAudioFormat.type,
        ...config.inputAudioFormat.rate != null ? { rate: config.inputAudioFormat.rate } : {}
      };
    }
    if (config.turnDetection != null) {
      if (config.turnDetection.type === "disabled") {
        input.turn_detection = null;
      } else {
        const td = {
          type: config.turnDetection.type === "server-vad" ? "server_vad" : "semantic_vad"
        };
        if (config.turnDetection.threshold != null) {
          td.threshold = config.turnDetection.threshold;
        }
        if (config.turnDetection.silenceDurationMs != null) {
          td.silence_duration_ms = config.turnDetection.silenceDurationMs;
        }
        if (config.turnDetection.prefixPaddingMs != null) {
          td.prefix_padding_ms = config.turnDetection.prefixPaddingMs;
        }
        input.turn_detection = td;
      }
    }
    if (config.inputAudioTranscription != null) {
      input.transcription = {
        model: (_a2 = config.inputAudioTranscription.model) != null ? _a2 : "gpt-realtime-whisper",
        ...config.inputAudioTranscription.language != null ? { language: config.inputAudioTranscription.language } : {},
        ...config.inputAudioTranscription.prompt != null ? { prompt: config.inputAudioTranscription.prompt } : {}
      };
    }
    audio.input = input;
  }
  if (config.outputAudioFormat != null || config.voice != null) {
    const output = {};
    if (config.outputAudioFormat != null) {
      output.format = {
        type: config.outputAudioFormat.type,
        ...config.outputAudioFormat.rate != null ? { rate: config.outputAudioFormat.rate } : {}
      };
    }
    if (config.voice != null) {
      output.voice = config.voice;
    }
    audio.output = output;
  }
  if (Object.keys(audio).length > 0) {
    session.audio = audio;
  }
  if (config.tools != null && config.tools.length > 0) {
    session.tools = config.tools.map((tool2) => ({
      type: tool2.type,
      name: tool2.name,
      description: tool2.description,
      parameters: tool2.parameters
    }));
    session.tool_choice = "auto";
  }
  if (config.providerOptions != null) {
    Object.assign(session, config.providerOptions);
  }
  return session;
}
function convertOpenAIResponsesUsage(usage) {
  var _a2, _b2, _c, _d;
  if (usage == null) {
    return {
      inputTokens: {
        total: void 0,
        noCache: void 0,
        cacheRead: void 0,
        cacheWrite: void 0
      },
      outputTokens: {
        total: void 0,
        text: void 0,
        reasoning: void 0
      },
      raw: void 0
    };
  }
  const inputTokens = usage.input_tokens;
  const outputTokens = usage.output_tokens;
  const cachedTokens = (_b2 = (_a2 = usage.input_tokens_details) == null ? void 0 : _a2.cached_tokens) != null ? _b2 : 0;
  const reasoningTokens = (_d = (_c = usage.output_tokens_details) == null ? void 0 : _c.reasoning_tokens) != null ? _d : 0;
  return {
    inputTokens: {
      total: inputTokens,
      noCache: inputTokens - cachedTokens,
      cacheRead: cachedTokens,
      cacheWrite: void 0
    },
    outputTokens: {
      total: outputTokens,
      text: outputTokens - reasoningTokens,
      reasoning: reasoningTokens
    },
    raw: usage
  };
}
function serializeToolCallArguments2(input) {
  return JSON.stringify(input === void 0 ? {} : input);
}
function isFileId(data, prefixes) {
  if (!prefixes) return false;
  return prefixes.some((prefix) => data.startsWith(prefix));
}
async function convertToOpenAIResponsesInput({
  prompt,
  toolNameMapping,
  systemMessageMode,
  providerOptionsName,
  fileIdPrefixes,
  passThroughUnsupportedFiles = false,
  store,
  hasConversation = false,
  hasPreviousResponseId = false,
  hasLocalShellTool = false,
  hasShellTool = false,
  hasApplyPatchTool = false,
  customProviderToolNames
}) {
  var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
  let input = [];
  const warnings = [];
  const processedApprovalIds = /* @__PURE__ */ new Set();
  for (const { role, content } of prompt) {
    switch (role) {
      case "system": {
        switch (systemMessageMode) {
          case "system": {
            input.push({ role: "system", content });
            break;
          }
          case "developer": {
            input.push({ role: "developer", content });
            break;
          }
          case "remove": {
            warnings.push({
              type: "other",
              message: "system messages are removed for this model"
            });
            break;
          }
          default: {
            const _exhaustiveCheck = systemMessageMode;
            throw new Error(
              `Unsupported system message mode: ${_exhaustiveCheck}`
            );
          }
        }
        break;
      }
      case "user": {
        input.push({
          role: "user",
          content: content.map((part, index) => {
            var _a22, _b22, _c2, _d2, _e2;
            switch (part.type) {
              case "text": {
                return { type: "input_text", text: part.text };
              }
              case "file": {
                switch (part.data.type) {
                  case "reference": {
                    const fileId = resolveProviderReference({
                      reference: part.data.reference,
                      provider: providerOptionsName
                    });
                    if (getTopLevelMediaType(part.mediaType) === "image") {
                      return {
                        type: "input_image",
                        file_id: fileId,
                        detail: (_b22 = (_a22 = part.providerOptions) == null ? void 0 : _a22[providerOptionsName]) == null ? void 0 : _b22.imageDetail
                      };
                    }
                    return {
                      type: "input_file",
                      file_id: fileId
                    };
                  }
                  case "text": {
                    throw new UnsupportedFunctionalityError4({
                      functionality: "text file parts"
                    });
                  }
                  case "url":
                  case "data": {
                    const topLevel = getTopLevelMediaType(part.mediaType);
                    if (topLevel === "image") {
                      return {
                        type: "input_image",
                        ...part.data.type === "url" ? { image_url: part.data.url.toString() } : typeof part.data.data === "string" && isFileId(part.data.data, fileIdPrefixes) ? { file_id: part.data.data } : {
                          image_url: `data:${resolveFullMediaType({ part })};base64,${convertToBase64(part.data.data)}`
                        },
                        detail: (_d2 = (_c2 = part.providerOptions) == null ? void 0 : _c2[providerOptionsName]) == null ? void 0 : _d2.imageDetail
                      };
                    } else {
                      if (part.data.type === "url") {
                        return {
                          type: "input_file",
                          file_url: part.data.url.toString()
                        };
                      }
                      const fullMediaType = resolveFullMediaType({ part });
                      if (fullMediaType !== "application/pdf" && !passThroughUnsupportedFiles) {
                        throw new UnsupportedFunctionalityError4({
                          functionality: `file part media type ${fullMediaType}`
                        });
                      }
                      return {
                        type: "input_file",
                        ...typeof part.data.data === "string" && isFileId(part.data.data, fileIdPrefixes) ? { file_id: part.data.data } : {
                          filename: (_e2 = part.filename) != null ? _e2 : fullMediaType === "application/pdf" ? `part-${index}.pdf` : `part-${index}`,
                          file_data: `data:${fullMediaType};base64,${convertToBase64(part.data.data)}`
                        }
                      };
                    }
                  }
                }
              }
            }
          })
        });
        break;
      }
      case "assistant": {
        const reasoningMessages = {};
        for (const part of content) {
          switch (part.type) {
            case "text": {
              const providerOptions = (_a2 = part.providerOptions) == null ? void 0 : _a2[providerOptionsName];
              const id = providerOptions == null ? void 0 : providerOptions.itemId;
              const phase = providerOptions == null ? void 0 : providerOptions.phase;
              if (hasConversation && id != null) {
                break;
              }
              if (store && id != null) {
                input.push({ type: "item_reference", id });
                break;
              }
              input.push({
                role: "assistant",
                content: [{ type: "output_text", text: part.text }],
                id,
                ...phase != null && { phase }
              });
              break;
            }
            case "tool-call": {
              const id = (_f = (_c = (_b2 = part.providerOptions) == null ? void 0 : _b2[providerOptionsName]) == null ? void 0 : _c.itemId) != null ? _f : (_e = (_d = part.providerMetadata) == null ? void 0 : _d[providerOptionsName]) == null ? void 0 : _e.itemId;
              const namespace = (_k = (_h = (_g = part.providerOptions) == null ? void 0 : _g[providerOptionsName]) == null ? void 0 : _h.namespace) != null ? _k : (_j = (_i = part.providerMetadata) == null ? void 0 : _i[providerOptionsName]) == null ? void 0 : _j.namespace;
              if (hasConversation && id != null) {
                break;
              }
              const resolvedToolName = toolNameMapping.toProviderToolName(
                part.toolName
              );
              if (resolvedToolName === "tool_search") {
                if (store && id != null) {
                  input.push({ type: "item_reference", id });
                  break;
                }
                const parsedInput = typeof part.input === "string" ? await parseJSON({
                  text: part.input,
                  schema: toolSearchInputSchema
                }) : await validateTypes({
                  value: part.input,
                  schema: toolSearchInputSchema
                });
                const execution = parsedInput.call_id != null ? "client" : "server";
                input.push({
                  type: "tool_search_call",
                  id: id != null ? id : part.toolCallId,
                  execution,
                  call_id: (_l = parsedInput.call_id) != null ? _l : null,
                  status: "completed",
                  arguments: parsedInput.arguments
                });
                break;
              }
              if (part.providerExecuted) {
                if (store && id != null) {
                  input.push({ type: "item_reference", id });
                }
                break;
              }
              if (hasPreviousResponseId && store && id != null) {
                break;
              }
              const isProviderDefinedToolCall = hasLocalShellTool && resolvedToolName === "local_shell" || hasShellTool && resolvedToolName === "shell" || hasApplyPatchTool && resolvedToolName === "apply_patch" || ((_m = customProviderToolNames == null ? void 0 : customProviderToolNames.has(resolvedToolName)) != null ? _m : false);
              if (store && id != null && isProviderDefinedToolCall) {
                input.push({ type: "item_reference", id });
                break;
              }
              if (hasLocalShellTool && resolvedToolName === "local_shell") {
                const parsedInput = await validateTypes({
                  value: part.input,
                  schema: localShellInputSchema
                });
                input.push({
                  type: "local_shell_call",
                  call_id: part.toolCallId,
                  id,
                  action: {
                    type: "exec",
                    command: parsedInput.action.command,
                    timeout_ms: parsedInput.action.timeoutMs,
                    user: parsedInput.action.user,
                    working_directory: parsedInput.action.workingDirectory,
                    env: parsedInput.action.env
                  }
                });
                break;
              }
              if (hasShellTool && resolvedToolName === "shell") {
                const parsedInput = await validateTypes({
                  value: part.input,
                  schema: shellInputSchema
                });
                input.push({
                  type: "shell_call",
                  call_id: part.toolCallId,
                  id,
                  status: "completed",
                  action: {
                    commands: parsedInput.action.commands,
                    timeout_ms: parsedInput.action.timeoutMs,
                    max_output_length: parsedInput.action.maxOutputLength
                  }
                });
                break;
              }
              if (hasApplyPatchTool && resolvedToolName === "apply_patch") {
                const parsedInput = await validateTypes({
                  value: part.input,
                  schema: applyPatchInputSchema
                });
                input.push({
                  type: "apply_patch_call",
                  call_id: parsedInput.callId,
                  id,
                  status: "completed",
                  operation: parsedInput.operation
                });
                break;
              }
              if (customProviderToolNames == null ? void 0 : customProviderToolNames.has(resolvedToolName)) {
                input.push({
                  type: "custom_tool_call",
                  call_id: part.toolCallId,
                  name: resolvedToolName,
                  input: typeof part.input === "string" ? part.input : JSON.stringify(part.input),
                  id
                });
                break;
              }
              input.push({
                type: "function_call",
                call_id: part.toolCallId,
                name: resolvedToolName,
                arguments: serializeToolCallArguments2(part.input),
                ...namespace != null && { namespace }
              });
              break;
            }
            // assistant tool result parts are from provider-executed tools:
            case "tool-result": {
              if (part.output.type === "execution-denied" || part.output.type === "json" && typeof part.output.value === "object" && part.output.value != null && "type" in part.output.value && part.output.value.type === "execution-denied") {
                break;
              }
              if (hasConversation) {
                break;
              }
              const resolvedResultToolName = toolNameMapping.toProviderToolName(
                part.toolName
              );
              if (resolvedResultToolName === "tool_search") {
                const itemId = (_p = (_o = (_n = part.providerOptions) == null ? void 0 : _n[providerOptionsName]) == null ? void 0 : _o.itemId) != null ? _p : part.toolCallId;
                if (store) {
                  input.push({ type: "item_reference", id: itemId });
                } else if (part.output.type === "json") {
                  const parsedOutput = await validateTypes({
                    value: part.output.value,
                    schema: toolSearchOutputSchema
                  });
                  input.push({
                    type: "tool_search_output",
                    id: itemId,
                    execution: "server",
                    call_id: null,
                    status: "completed",
                    tools: parsedOutput.tools
                  });
                }
                break;
              }
              if (hasShellTool && resolvedResultToolName === "shell") {
                if (part.output.type === "json") {
                  const parsedOutput = await validateTypes({
                    value: part.output.value,
                    schema: shellOutputSchema
                  });
                  input.push({
                    type: "shell_call_output",
                    call_id: part.toolCallId,
                    output: parsedOutput.output.map((item) => ({
                      stdout: item.stdout,
                      stderr: item.stderr,
                      outcome: item.outcome.type === "timeout" ? { type: "timeout" } : {
                        type: "exit",
                        exit_code: item.outcome.exitCode
                      }
                    }))
                  });
                }
                break;
              }
              if (store) {
                const itemId = (_s = (_r = (_q = part.providerOptions) == null ? void 0 : _q[providerOptionsName]) == null ? void 0 : _r.itemId) != null ? _s : part.toolCallId;
                input.push({ type: "item_reference", id: itemId });
              } else {
                warnings.push({
                  type: "other",
                  message: `Results for OpenAI tool ${part.toolName} are not sent to the API when store is false`
                });
              }
              break;
            }
            case "reasoning": {
              const providerOptions = await parseProviderOptions({
                provider: providerOptionsName,
                providerOptions: part.providerOptions,
                schema: openaiResponsesReasoningProviderOptionsSchema
              });
              const reasoningId = providerOptions == null ? void 0 : providerOptions.itemId;
              if ((hasConversation || hasPreviousResponseId) && reasoningId != null) {
                break;
              }
              if (reasoningId != null) {
                const reasoningMessage = reasoningMessages[reasoningId];
                if (store) {
                  if (reasoningMessage === void 0) {
                    input.push({ type: "item_reference", id: reasoningId });
                    reasoningMessages[reasoningId] = {
                      type: "reasoning",
                      id: reasoningId,
                      summary: []
                    };
                  }
                } else {
                  const summaryParts = [];
                  if (part.text.length > 0) {
                    summaryParts.push({
                      type: "summary_text",
                      text: part.text
                    });
                  } else if (reasoningMessage !== void 0) {
                    warnings.push({
                      type: "other",
                      message: `Cannot append empty reasoning part to existing reasoning sequence. Skipping reasoning part: ${JSON.stringify(part)}.`
                    });
                  }
                  if (reasoningMessage === void 0) {
                    reasoningMessages[reasoningId] = {
                      type: "reasoning",
                      id: reasoningId,
                      encrypted_content: providerOptions == null ? void 0 : providerOptions.reasoningEncryptedContent,
                      summary: summaryParts
                    };
                    input.push(reasoningMessages[reasoningId]);
                  } else {
                    reasoningMessage.summary.push(...summaryParts);
                    if ((providerOptions == null ? void 0 : providerOptions.reasoningEncryptedContent) != null) {
                      reasoningMessage.encrypted_content = providerOptions.reasoningEncryptedContent;
                    }
                  }
                }
              } else {
                const encryptedContent = providerOptions == null ? void 0 : providerOptions.reasoningEncryptedContent;
                if (encryptedContent != null) {
                  const summaryParts = [];
                  if (part.text.length > 0) {
                    summaryParts.push({
                      type: "summary_text",
                      text: part.text
                    });
                  }
                  input.push({
                    type: "reasoning",
                    encrypted_content: encryptedContent,
                    summary: summaryParts
                  });
                } else {
                  warnings.push({
                    type: "other",
                    message: `Non-OpenAI reasoning parts are not supported. Skipping reasoning part: ${JSON.stringify(part)}.`
                  });
                }
              }
              break;
            }
            case "custom": {
              if (part.kind === "openai.compaction") {
                const providerOptions = (_t = part.providerOptions) == null ? void 0 : _t[providerOptionsName];
                const id = providerOptions == null ? void 0 : providerOptions.itemId;
                if (hasConversation && id != null) {
                  break;
                }
                if (store && id != null) {
                  input.push({ type: "item_reference", id });
                  break;
                }
                const encryptedContent = providerOptions == null ? void 0 : providerOptions.encryptedContent;
                if (id != null) {
                  input.push({
                    type: "compaction",
                    id,
                    encrypted_content: encryptedContent
                  });
                }
              }
              break;
            }
          }
        }
        break;
      }
      case "tool": {
        for (const part of content) {
          if (part.type === "tool-approval-response") {
            const approvalResponse = part;
            if (processedApprovalIds.has(approvalResponse.approvalId)) {
              continue;
            }
            processedApprovalIds.add(approvalResponse.approvalId);
            if (store) {
              input.push({
                type: "item_reference",
                id: approvalResponse.approvalId
              });
            }
            input.push({
              type: "mcp_approval_response",
              approval_request_id: approvalResponse.approvalId,
              approve: approvalResponse.approved
            });
            continue;
          }
          const output = part.output;
          if (output.type === "execution-denied") {
            const approvalId = (_v = (_u = output.providerOptions) == null ? void 0 : _u.openai) == null ? void 0 : _v.approvalId;
            if (approvalId) {
              continue;
            }
          }
          const resolvedToolName = toolNameMapping.toProviderToolName(
            part.toolName
          );
          if (resolvedToolName === "tool_search" && output.type === "json") {
            const parsedOutput = await validateTypes({
              value: output.value,
              schema: toolSearchOutputSchema
            });
            input.push({
              type: "tool_search_output",
              execution: "client",
              call_id: part.toolCallId,
              status: "completed",
              tools: parsedOutput.tools
            });
            continue;
          }
          if (hasLocalShellTool && resolvedToolName === "local_shell" && output.type === "json") {
            const parsedOutput = await validateTypes({
              value: output.value,
              schema: localShellOutputSchema
            });
            input.push({
              type: "local_shell_call_output",
              call_id: part.toolCallId,
              output: parsedOutput.output
            });
            continue;
          }
          if (hasShellTool && resolvedToolName === "shell" && output.type === "json") {
            const parsedOutput = await validateTypes({
              value: output.value,
              schema: shellOutputSchema
            });
            input.push({
              type: "shell_call_output",
              call_id: part.toolCallId,
              output: parsedOutput.output.map((item) => ({
                stdout: item.stdout,
                stderr: item.stderr,
                outcome: item.outcome.type === "timeout" ? { type: "timeout" } : {
                  type: "exit",
                  exit_code: item.outcome.exitCode
                }
              }))
            });
            continue;
          }
          if (hasApplyPatchTool && part.toolName === "apply_patch" && output.type === "json") {
            const parsedOutput = await validateTypes({
              value: output.value,
              schema: applyPatchOutputSchema
            });
            input.push({
              type: "apply_patch_call_output",
              call_id: part.toolCallId,
              status: parsedOutput.status,
              output: parsedOutput.output
            });
            continue;
          }
          if (customProviderToolNames == null ? void 0 : customProviderToolNames.has(resolvedToolName)) {
            let outputValue;
            switch (output.type) {
              case "text":
              case "error-text":
                outputValue = output.value;
                break;
              case "execution-denied":
                outputValue = (_w = output.reason) != null ? _w : "Tool call execution denied.";
                break;
              case "json":
              case "error-json":
                outputValue = JSON.stringify(output.value);
                break;
              case "content":
                outputValue = output.value.map((item) => {
                  var _a22, _b22, _c2;
                  switch (item.type) {
                    case "text":
                      return { type: "input_text", text: item.text };
                    case "file": {
                      const topLevel = getTopLevelMediaType(item.mediaType);
                      const imageDetail = (_b22 = (_a22 = item.providerOptions) == null ? void 0 : _a22[providerOptionsName]) == null ? void 0 : _b22.imageDetail;
                      if (item.data.type === "data") {
                        const fullMediaType = resolveFullMediaType({
                          part: item
                        });
                        if (topLevel === "image") {
                          return {
                            type: "input_image",
                            image_url: `data:${fullMediaType};base64,${convertToBase64(item.data.data)}`,
                            detail: imageDetail
                          };
                        }
                        return {
                          type: "input_file",
                          filename: (_c2 = item.filename) != null ? _c2 : "data",
                          file_data: `data:${fullMediaType};base64,${convertToBase64(item.data.data)}`
                        };
                      }
                      if (item.data.type === "url") {
                        if (topLevel === "image") {
                          return {
                            type: "input_image",
                            image_url: item.data.url.toString(),
                            detail: imageDetail
                          };
                        }
                        return {
                          type: "input_file",
                          file_url: item.data.url.toString()
                        };
                      }
                      warnings.push({
                        type: "other",
                        message: `unsupported custom tool content part type: ${item.type} with data type: ${item.data.type}`
                      });
                      return void 0;
                    }
                    default:
                      warnings.push({
                        type: "other",
                        message: `unsupported custom tool content part type: ${item.type}`
                      });
                      return void 0;
                  }
                }).filter(isNonNullable);
                break;
              default:
                outputValue = "";
            }
            input.push({
              type: "custom_tool_call_output",
              call_id: part.toolCallId,
              output: outputValue
            });
            continue;
          }
          let contentValue;
          switch (output.type) {
            case "text":
            case "error-text":
              contentValue = output.value;
              break;
            case "execution-denied":
              contentValue = (_x = output.reason) != null ? _x : "Tool call execution denied.";
              break;
            case "json":
            case "error-json":
              contentValue = JSON.stringify(output.value);
              break;
            case "content":
              contentValue = output.value.map((item) => {
                var _a22, _b22, _c2;
                switch (item.type) {
                  case "text": {
                    return { type: "input_text", text: item.text };
                  }
                  case "file": {
                    const topLevel = getTopLevelMediaType(item.mediaType);
                    const imageDetail = (_b22 = (_a22 = item.providerOptions) == null ? void 0 : _a22[providerOptionsName]) == null ? void 0 : _b22.imageDetail;
                    if (item.data.type === "data") {
                      const fullMediaType = resolveFullMediaType({
                        part: item
                      });
                      if (topLevel === "image") {
                        return {
                          type: "input_image",
                          image_url: `data:${fullMediaType};base64,${convertToBase64(item.data.data)}`,
                          detail: imageDetail
                        };
                      }
                      return {
                        type: "input_file",
                        filename: (_c2 = item.filename) != null ? _c2 : "data",
                        file_data: `data:${fullMediaType};base64,${convertToBase64(item.data.data)}`
                      };
                    }
                    if (item.data.type === "url") {
                      if (topLevel === "image") {
                        return {
                          type: "input_image",
                          image_url: item.data.url.toString(),
                          detail: imageDetail
                        };
                      }
                      return {
                        type: "input_file",
                        file_url: item.data.url.toString()
                      };
                    }
                    warnings.push({
                      type: "other",
                      message: `unsupported tool content part type: ${item.type} with data type: ${item.data.type}`
                    });
                    return void 0;
                  }
                  default: {
                    warnings.push({
                      type: "other",
                      message: `unsupported tool content part type: ${item.type}`
                    });
                    return void 0;
                  }
                }
              }).filter(isNonNullable);
              break;
          }
          input.push({
            type: "function_call_output",
            call_id: part.toolCallId,
            output: contentValue
          });
        }
        break;
      }
      default: {
        const _exhaustiveCheck = role;
        throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
      }
    }
  }
  if (!store && input.some(
    (item) => "type" in item && item.type === "reasoning" && item.encrypted_content == null
  )) {
    warnings.push({
      type: "other",
      message: "Reasoning parts without encrypted content are not supported when store is false. Skipping reasoning parts."
    });
    input = input.filter(
      (item) => !("type" in item) || item.type !== "reasoning" || item.encrypted_content != null
    );
  }
  return { input, warnings };
}
function mapOpenAIResponseFinishReason({
  finishReason,
  hasFunctionCall
}) {
  switch (finishReason) {
    case void 0:
    case null:
      return hasFunctionCall ? "tool-calls" : "stop";
    case "max_output_tokens":
      return "length";
    case "content_filter":
      return "content-filter";
    default:
      return hasFunctionCall ? "tool-calls" : "other";
  }
}
async function prepareResponsesTools({
  tools,
  toolChoice,
  allowedTools,
  toolNameMapping,
  customProviderToolNames
}) {
  var _a2, _b2, _c;
  tools = (tools == null ? void 0 : tools.length) ? tools : void 0;
  const toolWarnings = [];
  if (tools == null) {
    return { tools: void 0, toolChoice: void 0, toolWarnings };
  }
  const openaiTools2 = [];
  const namespaceTools = /* @__PURE__ */ new Map();
  const resolvedCustomProviderToolNames = customProviderToolNames != null ? customProviderToolNames : /* @__PURE__ */ new Set();
  for (const tool2 of tools) {
    switch (tool2.type) {
      case "function": {
        const openaiOptions = (_a2 = tool2.providerOptions) == null ? void 0 : _a2.openai;
        const openaiFunctionTool = prepareFunctionTool({
          tool: tool2,
          options: openaiOptions
        });
        const namespace = openaiOptions == null ? void 0 : openaiOptions.namespace;
        if (namespace == null) {
          openaiTools2.push(openaiFunctionTool);
        } else {
          let namespaceTool = namespaceTools.get(namespace.name);
          if (namespaceTool == null) {
            namespaceTool = {
              type: "namespace",
              name: namespace.name,
              description: namespace.description,
              tools: []
            };
            namespaceTools.set(namespace.name, namespaceTool);
            openaiTools2.push(namespaceTool);
          } else if (namespaceTool.description !== namespace.description) {
            throw new UnsupportedFunctionalityError5({
              functionality: `conflicting descriptions for OpenAI tool namespace "${namespace.name}"`
            });
          }
          namespaceTool.tools.push(openaiFunctionTool);
        }
        break;
      }
      case "provider": {
        switch (tool2.id) {
          case "openai.file_search": {
            const args = await validateTypes({
              value: tool2.args,
              schema: fileSearchArgsSchema
            });
            openaiTools2.push({
              type: "file_search",
              vector_store_ids: args.vectorStoreIds,
              max_num_results: args.maxNumResults,
              ranking_options: args.ranking ? {
                ranker: args.ranking.ranker,
                score_threshold: args.ranking.scoreThreshold
              } : void 0,
              filters: args.filters
            });
            break;
          }
          case "openai.local_shell": {
            openaiTools2.push({
              type: "local_shell"
            });
            break;
          }
          case "openai.shell": {
            const args = await validateTypes({
              value: tool2.args,
              schema: shellArgsSchema
            });
            openaiTools2.push({
              type: "shell",
              ...args.environment && {
                environment: mapShellEnvironment(args.environment)
              }
            });
            break;
          }
          case "openai.apply_patch": {
            openaiTools2.push({
              type: "apply_patch"
            });
            break;
          }
          case "openai.web_search_preview": {
            const args = await validateTypes({
              value: tool2.args,
              schema: webSearchPreviewArgsSchema
            });
            openaiTools2.push({
              type: "web_search_preview",
              search_context_size: args.searchContextSize,
              user_location: args.userLocation
            });
            break;
          }
          case "openai.web_search": {
            const args = await validateTypes({
              value: tool2.args,
              schema: webSearchArgsSchema
            });
            openaiTools2.push({
              type: "web_search",
              filters: args.filters != null ? { allowed_domains: args.filters.allowedDomains } : void 0,
              external_web_access: args.externalWebAccess,
              search_context_size: args.searchContextSize,
              user_location: args.userLocation
            });
            break;
          }
          case "openai.code_interpreter": {
            const args = await validateTypes({
              value: tool2.args,
              schema: codeInterpreterArgsSchema
            });
            openaiTools2.push({
              type: "code_interpreter",
              container: args.container == null ? { type: "auto", file_ids: void 0 } : typeof args.container === "string" ? args.container : { type: "auto", file_ids: args.container.fileIds }
            });
            break;
          }
          case "openai.image_generation": {
            const args = await validateTypes({
              value: tool2.args,
              schema: imageGenerationArgsSchema
            });
            openaiTools2.push({
              type: "image_generation",
              background: args.background,
              input_fidelity: args.inputFidelity,
              input_image_mask: args.inputImageMask ? {
                file_id: args.inputImageMask.fileId,
                image_url: args.inputImageMask.imageUrl
              } : void 0,
              model: args.model,
              moderation: args.moderation,
              partial_images: args.partialImages,
              quality: args.quality,
              output_compression: args.outputCompression,
              output_format: args.outputFormat,
              size: args.size
            });
            break;
          }
          case "openai.mcp": {
            const args = await validateTypes({
              value: tool2.args,
              schema: mcpArgsSchema
            });
            const mapApprovalFilter = (filter2) => ({
              tool_names: filter2.toolNames
            });
            const requireApproval = args.requireApproval;
            const requireApprovalParam = requireApproval == null ? void 0 : typeof requireApproval === "string" ? requireApproval : requireApproval.never != null ? { never: mapApprovalFilter(requireApproval.never) } : void 0;
            openaiTools2.push({
              type: "mcp",
              server_label: args.serverLabel,
              allowed_tools: Array.isArray(args.allowedTools) ? args.allowedTools : args.allowedTools ? {
                read_only: args.allowedTools.readOnly,
                tool_names: args.allowedTools.toolNames
              } : void 0,
              authorization: args.authorization,
              connector_id: args.connectorId,
              headers: args.headers,
              require_approval: requireApprovalParam != null ? requireApprovalParam : "never",
              server_description: args.serverDescription,
              server_url: args.serverUrl
            });
            break;
          }
          case "openai.custom": {
            const args = await validateTypes({
              value: tool2.args,
              schema: customArgsSchema
            });
            openaiTools2.push({
              type: "custom",
              name: tool2.name,
              description: args.description,
              format: args.format
            });
            resolvedCustomProviderToolNames.add(tool2.name);
            break;
          }
          case "openai.tool_search": {
            const args = await validateTypes({
              value: tool2.args,
              schema: toolSearchArgsSchema
            });
            openaiTools2.push({
              type: "tool_search",
              ...args.execution != null ? { execution: args.execution } : {},
              ...args.description != null ? { description: args.description } : {},
              ...args.parameters != null ? { parameters: args.parameters } : {}
            });
            break;
          }
        }
        break;
      }
      default:
        toolWarnings.push({
          type: "unsupported",
          feature: `function tool ${tool2}`
        });
        break;
    }
  }
  if (allowedTools != null) {
    return {
      tools: openaiTools2,
      toolChoice: {
        type: "allowed_tools",
        mode: (_b2 = allowedTools.mode) != null ? _b2 : "auto",
        tools: allowedTools.toolNames.map((name2) => {
          var _a22;
          return {
            type: "function",
            name: (_a22 = toolNameMapping == null ? void 0 : toolNameMapping.toProviderToolName(name2)) != null ? _a22 : name2
          };
        })
      },
      toolWarnings
    };
  }
  if (toolChoice == null) {
    return { tools: openaiTools2, toolChoice: void 0, toolWarnings };
  }
  const type = toolChoice.type;
  switch (type) {
    case "auto":
    case "none":
    case "required":
      return { tools: openaiTools2, toolChoice: type, toolWarnings };
    case "tool": {
      const resolvedToolName = (_c = toolNameMapping == null ? void 0 : toolNameMapping.toProviderToolName(toolChoice.toolName)) != null ? _c : toolChoice.toolName;
      return {
        tools: openaiTools2,
        toolChoice: resolvedToolName === "code_interpreter" || resolvedToolName === "file_search" || resolvedToolName === "image_generation" || resolvedToolName === "web_search_preview" || resolvedToolName === "web_search" || resolvedToolName === "mcp" || resolvedToolName === "apply_patch" ? { type: resolvedToolName } : resolvedCustomProviderToolNames.has(resolvedToolName) ? { type: "custom", name: resolvedToolName } : { type: "function", name: resolvedToolName },
        toolWarnings
      };
    }
    default: {
      const _exhaustiveCheck = type;
      throw new UnsupportedFunctionalityError5({
        functionality: `tool choice type: ${_exhaustiveCheck}`
      });
    }
  }
}
function prepareFunctionTool({
  tool: tool2,
  options
}) {
  const deferLoading = options == null ? void 0 : options.deferLoading;
  return {
    type: "function",
    name: tool2.name,
    description: tool2.description,
    parameters: tool2.inputSchema,
    ...tool2.strict != null ? { strict: tool2.strict } : {},
    ...deferLoading != null ? { defer_loading: deferLoading } : {}
  };
}
function mapShellEnvironment(environment) {
  if (environment.type === "containerReference") {
    const env2 = environment;
    return {
      type: "container_reference",
      container_id: env2.containerId
    };
  }
  if (environment.type === "containerAuto") {
    const env2 = environment;
    return {
      type: "container_auto",
      file_ids: env2.fileIds,
      memory_limit: env2.memoryLimit,
      network_policy: env2.networkPolicy == null ? void 0 : env2.networkPolicy.type === "disabled" ? { type: "disabled" } : {
        type: "allowlist",
        allowed_domains: env2.networkPolicy.allowedDomains,
        domain_secrets: env2.networkPolicy.domainSecrets
      },
      skills: mapShellSkills(env2.skills)
    };
  }
  const env = environment;
  return {
    type: "local",
    skills: env.skills
  };
}
function mapShellSkills(skills) {
  return skills == null ? void 0 : skills.map(
    (skill) => {
      var _a2, _b2;
      return skill.type === "skillReference" ? {
        type: "skill_reference",
        skill_id: resolveProviderReference({
          reference: (_a2 = skill.providerReference) != null ? _a2 : {},
          provider: "openai"
        }),
        version: (_b2 = skill.version) != null ? _b2 : "latest"
      } : {
        type: "inline",
        name: skill.name,
        description: skill.description,
        source: {
          type: "base64",
          media_type: skill.source.mediaType,
          data: skill.source.data
        }
      };
    }
  );
}
function extractApprovalRequestIdToToolCallIdMapping(prompt) {
  var _a2, _b2;
  const mapping = {};
  for (const message of prompt) {
    if (message.role !== "assistant") continue;
    for (const part of message.content) {
      if (part.type !== "tool-call") continue;
      const approvalRequestId = (_b2 = (_a2 = part.providerOptions) == null ? void 0 : _a2.openai) == null ? void 0 : _b2.approvalRequestId;
      if (approvalRequestId != null) {
        mapping[approvalRequestId] = part.toolCallId;
      }
    }
  }
  return mapping;
}
function isTextDeltaChunk(chunk) {
  return chunk.type === "response.output_text.delta";
}
function isResponseOutputItemDoneChunk(chunk) {
  return chunk.type === "response.output_item.done";
}
function isResponseFinishedChunk(chunk) {
  return chunk.type === "response.completed" || chunk.type === "response.incomplete";
}
function isResponseFailedChunk(chunk) {
  return chunk.type === "response.failed";
}
function isResponseCreatedChunk(chunk) {
  return chunk.type === "response.created";
}
function isResponseFunctionCallArgumentsDeltaChunk(chunk) {
  return chunk.type === "response.function_call_arguments.delta";
}
function isResponseCustomToolCallInputDeltaChunk(chunk) {
  return chunk.type === "response.custom_tool_call_input.delta";
}
function isResponseImageGenerationCallPartialImageChunk(chunk) {
  return chunk.type === "response.image_generation_call.partial_image";
}
function isResponseCodeInterpreterCallCodeDeltaChunk(chunk) {
  return chunk.type === "response.code_interpreter_call_code.delta";
}
function isResponseCodeInterpreterCallCodeDoneChunk(chunk) {
  return chunk.type === "response.code_interpreter_call_code.done";
}
function isResponseApplyPatchCallOperationDiffDeltaChunk(chunk) {
  return chunk.type === "response.apply_patch_call_operation_diff.delta";
}
function isResponseApplyPatchCallOperationDiffDoneChunk(chunk) {
  return chunk.type === "response.apply_patch_call_operation_diff.done";
}
function isResponseOutputItemAddedChunk(chunk) {
  return chunk.type === "response.output_item.added";
}
function isResponseAnnotationAddedChunk(chunk) {
  return chunk.type === "response.output_text.annotation.added";
}
function isErrorChunk(chunk) {
  return chunk.type === "error";
}
function isResponseOutputChunk(chunk) {
  return !(chunk.type === "response.created" || chunk.type === "response.failed" || chunk.type === "error" || chunk.type === "unknown_chunk");
}
function mapWebSearchOutput(action) {
  var _a2;
  if (action == null) {
    return {};
  }
  switch (action.type) {
    case "search":
      return {
        action: {
          type: "search",
          query: (_a2 = action.query) != null ? _a2 : void 0,
          ...action.queries != null && { queries: action.queries }
        },
        // include sources when provided by the Responses API (behind include flag)
        ...action.sources != null && { sources: action.sources }
      };
    case "open_page":
      return { action: { type: "openPage", url: action.url } };
    case "find_in_page":
      return {
        action: {
          type: "findInPage",
          url: action.url,
          pattern: action.pattern
        }
      };
  }
}
function escapeJSONDelta(delta) {
  return JSON.stringify(delta).slice(1, -1);
}
function createOpenAI(options = {}) {
  var _a2, _b2;
  const baseURL = (_a2 = withoutTrailingSlash(
    loadOptionalSetting({
      settingValue: options.baseURL,
      environmentVariableName: "OPENAI_BASE_URL"
    })
  )) != null ? _a2 : "https://api.openai.com/v1";
  const providerName = (_b2 = options.name) != null ? _b2 : "openai";
  const getHeaders = () => withUserAgentSuffix(
    {
      Authorization: `Bearer ${loadApiKey({
        apiKey: options.apiKey,
        environmentVariableName: "OPENAI_API_KEY",
        description: "OpenAI"
      })}`,
      "OpenAI-Organization": options.organization,
      "OpenAI-Project": options.project,
      ...options.headers
    },
    `ai-sdk/openai/${VERSION2}`
  );
  const createChatModel = (modelId) => new OpenAIChatLanguageModel(modelId, {
    provider: `${providerName}.chat`,
    url: ({ path }) => `${baseURL}${path}`,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createCompletionModel = (modelId) => new OpenAICompletionLanguageModel(modelId, {
    provider: `${providerName}.completion`,
    url: ({ path }) => `${baseURL}${path}`,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createEmbeddingModel = (modelId) => new OpenAIEmbeddingModel(modelId, {
    provider: `${providerName}.embedding`,
    url: ({ path }) => `${baseURL}${path}`,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createImageModel = (modelId) => new OpenAIImageModel(modelId, {
    provider: `${providerName}.image`,
    url: ({ path }) => `${baseURL}${path}`,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createTranscriptionModel = (modelId) => new OpenAITranscriptionModel(modelId, {
    provider: `${providerName}.transcription`,
    url: ({ path }) => `${baseURL}${path}`,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createSpeechModel = (modelId) => new OpenAISpeechModel(modelId, {
    provider: `${providerName}.speech`,
    url: ({ path }) => `${baseURL}${path}`,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createFiles = () => new OpenAIFiles({
    provider: `${providerName}.files`,
    baseURL,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createSkills = () => new OpenAISkills({
    provider: `${providerName}.skills`,
    url: ({ path }) => `${baseURL}${path}`,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createLanguageModel = (modelId) => {
    if (new.target) {
      throw new Error(
        "The OpenAI model function cannot be called with the new keyword."
      );
    }
    return createResponsesModel(modelId);
  };
  const createResponsesModel = (modelId) => {
    return new OpenAIResponsesLanguageModel(modelId, {
      provider: `${providerName}.responses`,
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
      // Soft-deprecated. TODO: remove in v8
      fileIdPrefixes: ["file-"]
    });
  };
  const createRealtimeModel = (modelId) => new OpenAIRealtimeModel(modelId, {
    provider: `${providerName}.realtime`,
    baseURL,
    headers: getHeaders,
    fetch: options.fetch
  });
  const experimentalRealtimeFactory = Object.assign(
    (modelId) => createRealtimeModel(modelId),
    {
      getToken: async (tokenOptions) => {
        const model = createRealtimeModel(tokenOptions.model);
        const secret = await model.doCreateClientSecret({
          sessionConfig: tokenOptions.sessionConfig,
          expiresAfterSeconds: tokenOptions.expiresAfterSeconds
        });
        return {
          token: secret.token,
          url: secret.url,
          expiresAt: secret.expiresAt
        };
      }
    }
  );
  const provider = function(modelId) {
    return createLanguageModel(modelId);
  };
  provider.specificationVersion = "v4";
  provider.languageModel = createLanguageModel;
  provider.chat = createChatModel;
  provider.completion = createCompletionModel;
  provider.responses = createResponsesModel;
  provider.embedding = createEmbeddingModel;
  provider.embeddingModel = createEmbeddingModel;
  provider.textEmbedding = createEmbeddingModel;
  provider.textEmbeddingModel = createEmbeddingModel;
  provider.image = createImageModel;
  provider.imageModel = createImageModel;
  provider.transcription = createTranscriptionModel;
  provider.transcriptionModel = createTranscriptionModel;
  provider.speech = createSpeechModel;
  provider.speechModel = createSpeechModel;
  provider.files = createFiles;
  provider.skills = createSkills;
  provider.experimental_realtime = experimentalRealtimeFactory;
  provider.tools = openaiTools;
  return provider;
}
var openaiErrorDataSchema, openaiFailedResponseHandler, openaiChatResponseSchema, openaiChatChunkSchema, openaiLanguageModelChatOptions, OpenAIChatLanguageModel, openaiCompletionResponseSchema, openaiCompletionChunkSchema, openaiLanguageModelCompletionOptions, OpenAICompletionLanguageModel, openaiEmbeddingModelOptions, openaiTextEmbeddingResponseSchema, OpenAIEmbeddingModel, openaiFilesResponseSchema, openaiFilesOptionsSchema, OpenAIFiles, openaiImageResponseSchema, modelMaxImagesPerCall, defaultResponseFormatPrefixes, baseImageModelOptionsObject, openaiImageModelOptions, openaiImageModelGenerationOptions, openaiImageModelEditOptions, OpenAIImageModel, applyPatchInputSchema, applyPatchOutputSchema, applyPatchArgsSchema, applyPatchToolFactory, applyPatch, codeInterpreterInputSchema, codeInterpreterOutputSchema, codeInterpreterArgsSchema, codeInterpreterToolFactory, codeInterpreter, customArgsSchema, customInputSchema, customToolFactory, customTool, comparisonFilterSchema, compoundFilterSchema, fileSearchArgsSchema, fileSearchOutputSchema, fileSearch, imageGenerationArgsSchema, imageGenerationInputSchema, imageGenerationOutputSchema, imageGenerationToolFactory, imageGeneration, localShellInputSchema, localShellOutputSchema, localShell, shellInputSchema, shellOutputSchema, shellSkillsSchema, shellArgsSchema, shell, toolSearchArgsSchema, toolSearchInputSchema, toolSearchOutputSchema, toolSearchToolFactory, toolSearch, webSearchArgsSchema, webSearchInputSchema, webSearchOutputSchema, webSearchToolFactory, webSearch, webSearchPreviewArgsSchema, webSearchPreviewInputSchema, webSearchPreviewOutputSchema, webSearchPreview, jsonValueSchema, mcpArgsSchema, mcpInputSchema, mcpOutputSchema, mcpToolFactory, mcp, openaiTools, OpenAIRealtimeModel, openaiResponsesReasoningProviderOptionsSchema, jsonValueSchema2, openaiResponsesNestedErrorChunkSchema, openaiResponsesErrorChunkSchema, openaiResponsesChunkSchema, openaiResponsesResponseSchema, TOP_LOGPROBS_MAX, openaiResponsesReasoningModelIds, openaiResponsesModelIds, openaiLanguageModelResponsesOptionsSchema, OpenAIResponsesLanguageModel, openaiSpeechModelOptionsSchema, OpenAISpeechModel, openaiTranscriptionResponseSchema, openAITranscriptionModelOptions, languageMap, OpenAITranscriptionModel, openaiSkillResponseSchema, openaiSkillVersionResponseSchema, OpenAISkills, VERSION2, openai;
var init_dist4 = __esm({
  "node_modules/@ai-sdk/openai/dist/index.js"() {
    "use strict";
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    openaiErrorDataSchema = z2.object({
      error: z2.object({
        message: z2.string(),
        // The additional information below is handled loosely to support
        // OpenAI-compatible providers that have slightly different error
        // responses:
        type: z2.string().nullish(),
        param: z2.any().nullish(),
        code: z2.union([z2.string(), z2.number()]).nullish()
      })
    });
    openaiFailedResponseHandler = createJsonErrorResponseHandler({
      errorSchema: openaiErrorDataSchema,
      errorToMessage: (data) => data.error.message
    });
    openaiChatResponseSchema = lazySchema(
      () => zodSchema(
        z22.object({
          id: z22.string().nullish(),
          created: z22.number().nullish(),
          model: z22.string().nullish(),
          choices: z22.array(
            z22.object({
              message: z22.object({
                role: z22.literal("assistant").nullish(),
                content: z22.string().nullish(),
                tool_calls: z22.array(
                  z22.object({
                    id: z22.string().nullish(),
                    type: z22.literal("function"),
                    function: z22.object({
                      name: z22.string(),
                      arguments: z22.string()
                    })
                  })
                ).nullish(),
                annotations: z22.array(
                  z22.object({
                    type: z22.literal("url_citation"),
                    url_citation: z22.object({
                      start_index: z22.number(),
                      end_index: z22.number(),
                      url: z22.string(),
                      title: z22.string()
                    })
                  })
                ).nullish()
              }),
              index: z22.number(),
              logprobs: z22.object({
                content: z22.array(
                  z22.object({
                    token: z22.string(),
                    logprob: z22.number(),
                    top_logprobs: z22.array(
                      z22.object({
                        token: z22.string(),
                        logprob: z22.number()
                      })
                    )
                  })
                ).nullish()
              }).nullish(),
              finish_reason: z22.string().nullish()
            })
          ),
          usage: z22.object({
            prompt_tokens: z22.number().nullish(),
            completion_tokens: z22.number().nullish(),
            total_tokens: z22.number().nullish(),
            prompt_tokens_details: z22.object({
              cached_tokens: z22.number().nullish()
            }).nullish(),
            completion_tokens_details: z22.object({
              reasoning_tokens: z22.number().nullish(),
              accepted_prediction_tokens: z22.number().nullish(),
              rejected_prediction_tokens: z22.number().nullish()
            }).nullish()
          }).nullish()
        })
      )
    );
    openaiChatChunkSchema = lazySchema(
      () => zodSchema(
        z22.union([
          z22.object({
            id: z22.string().nullish(),
            created: z22.number().nullish(),
            model: z22.string().nullish(),
            choices: z22.array(
              z22.object({
                delta: z22.object({
                  role: z22.enum(["assistant"]).nullish(),
                  content: z22.string().nullish(),
                  tool_calls: z22.array(
                    z22.object({
                      index: z22.number(),
                      id: z22.string().nullish(),
                      type: z22.literal("function").nullish(),
                      function: z22.object({
                        name: z22.string().nullish(),
                        arguments: z22.string().nullish()
                      })
                    })
                  ).nullish(),
                  annotations: z22.array(
                    z22.object({
                      type: z22.literal("url_citation"),
                      url_citation: z22.object({
                        start_index: z22.number(),
                        end_index: z22.number(),
                        url: z22.string(),
                        title: z22.string()
                      })
                    })
                  ).nullish()
                }).nullish(),
                logprobs: z22.object({
                  content: z22.array(
                    z22.object({
                      token: z22.string(),
                      logprob: z22.number(),
                      top_logprobs: z22.array(
                        z22.object({
                          token: z22.string(),
                          logprob: z22.number()
                        })
                      )
                    })
                  ).nullish()
                }).nullish(),
                finish_reason: z22.string().nullish(),
                index: z22.number()
              })
            ),
            usage: z22.object({
              prompt_tokens: z22.number().nullish(),
              completion_tokens: z22.number().nullish(),
              total_tokens: z22.number().nullish(),
              prompt_tokens_details: z22.object({
                cached_tokens: z22.number().nullish()
              }).nullish(),
              completion_tokens_details: z22.object({
                reasoning_tokens: z22.number().nullish(),
                accepted_prediction_tokens: z22.number().nullish(),
                rejected_prediction_tokens: z22.number().nullish()
              }).nullish()
            }).nullish()
          }),
          openaiErrorDataSchema
        ])
      )
    );
    openaiLanguageModelChatOptions = lazySchema(
      () => zodSchema(
        z3.object({
          /**
           * Modify the likelihood of specified tokens appearing in the completion.
           *
           * Accepts a JSON object that maps tokens (specified by their token ID in
           * the GPT tokenizer) to an associated bias value from -100 to 100.
           */
          logitBias: z3.record(z3.coerce.number(), z3.number()).optional(),
          /**
           * Return the log probabilities of the tokens.
           *
           * Setting to true will return the log probabilities of the tokens that
           * were generated.
           *
           * Setting to a number will return the log probabilities of the top n
           * tokens that were generated.
           */
          logprobs: z3.union([z3.boolean(), z3.number()]).optional(),
          /**
           * Whether to enable parallel function calling during tool use. Default to true.
           */
          parallelToolCalls: z3.boolean().optional(),
          /**
           * A unique identifier representing your end-user, which can help OpenAI to
           * monitor and detect abuse.
           */
          user: z3.string().optional(),
          /**
           * Reasoning effort for reasoning models. Defaults to `medium`.
           */
          reasoningEffort: z3.enum(["none", "minimal", "low", "medium", "high", "xhigh"]).optional(),
          /**
           * Maximum number of completion tokens to generate. Useful for reasoning models.
           */
          maxCompletionTokens: z3.number().optional(),
          /**
           * Whether to enable persistence in responses API.
           */
          store: z3.boolean().optional(),
          /**
           * Metadata to associate with the request.
           */
          metadata: z3.record(z3.string().max(64), z3.string().max(512)).optional(),
          /**
           * Parameters for prediction mode.
           */
          prediction: z3.record(z3.string(), z3.any()).optional(),
          /**
           * Service tier for the request.
           * - 'auto': Default service tier. The request will be processed with the service tier configured in the
           *           Project settings. Unless otherwise configured, the Project will use 'default'.
           * - 'flex': 50% cheaper processing at the cost of increased latency. Only available for o3 and o4-mini models.
           * - 'priority': Higher-speed processing with predictably low latency at premium cost. Available for Enterprise customers.
           * - 'default': The request will be processed with the standard pricing and performance for the selected model.
           *
           * @default 'auto'
           */
          serviceTier: z3.enum(["auto", "flex", "priority", "default"]).optional(),
          /**
           * Whether to use strict JSON schema validation.
           *
           * @default true
           */
          strictJsonSchema: z3.boolean().optional(),
          /**
           * Controls the verbosity of the model's responses.
           * Lower values will result in more concise responses, while higher values will result in more verbose responses.
           */
          textVerbosity: z3.enum(["low", "medium", "high"]).optional(),
          /**
           * A cache key for prompt caching. Allows manual control over prompt caching behavior.
           * Useful for improving cache hit rates and working around automatic caching issues.
           */
          promptCacheKey: z3.string().optional(),
          /**
           * The retention policy for the prompt cache.
           * - 'in_memory': Default. Standard prompt caching behavior.
           * - '24h': Extended prompt caching that keeps cached prefixes active for up to 24 hours.
           *          Currently only available for 5.1 series models.
           *
           * @default 'in_memory'
           */
          promptCacheRetention: z3.enum(["in_memory", "24h"]).optional(),
          /**
           * A stable identifier used to help detect users of your application
           * that may be violating OpenAI's usage policies. The IDs should be a
           * string that uniquely identifies each user. We recommend hashing their
           * username or email address, in order to avoid sending us any identifying
           * information.
           */
          safetyIdentifier: z3.string().optional(),
          /**
           * Override the system message mode for this model.
           * - 'system': Use the 'system' role for system messages (default for most models)
           * - 'developer': Use the 'developer' role for system messages (used by reasoning models)
           * - 'remove': Remove system messages entirely
           *
           * If not specified, the mode is automatically determined based on the model.
           */
          systemMessageMode: z3.enum(["system", "developer", "remove"]).optional(),
          /**
           * Force treating this model as a reasoning model.
           *
           * This is useful for "stealth" reasoning models (e.g. via a custom baseURL)
           * where the model ID is not recognized by the SDK's allowlist.
           *
           * When enabled, the SDK applies reasoning-model parameter compatibility rules
           * and defaults `systemMessageMode` to `developer` unless overridden.
           */
          forceReasoning: z3.boolean().optional()
        })
      )
    );
    OpenAIChatLanguageModel = class _OpenAIChatLanguageModel {
      constructor(modelId, config) {
        this.specificationVersion = "v4";
        this.supportedUrls = {
          "image/*": [/^https?:\/\/.*$/]
        };
        this.modelId = modelId;
        this.config = config;
      }
      static [WORKFLOW_SERIALIZE](model) {
        return serializeModelOptions({
          modelId: model.modelId,
          config: model.config
        });
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _OpenAIChatLanguageModel(options.modelId, options.config);
      }
      get provider() {
        return this.config.provider;
      }
      async getArgs({
        prompt,
        maxOutputTokens,
        temperature,
        topP,
        topK,
        frequencyPenalty,
        presencePenalty,
        stopSequences,
        responseFormat,
        seed,
        tools,
        toolChoice,
        reasoning,
        providerOptions
      }) {
        var _a2, _b2, _c, _d, _e, _f;
        const warnings = [];
        const openaiOptions = (_a2 = await parseProviderOptions({
          provider: "openai",
          providerOptions,
          schema: openaiLanguageModelChatOptions
        })) != null ? _a2 : {};
        const modelCapabilities = getOpenAILanguageModelCapabilities(this.modelId);
        const resolvedReasoningEffort = (_b2 = openaiOptions.reasoningEffort) != null ? _b2 : isCustomReasoning(reasoning) ? reasoning : void 0;
        const isReasoningModel = (_c = openaiOptions.forceReasoning) != null ? _c : modelCapabilities.isReasoningModel;
        if (topK != null) {
          warnings.push({ type: "unsupported", feature: "topK" });
        }
        const { messages, warnings: messageWarnings } = convertToOpenAIChatMessages(
          {
            prompt,
            systemMessageMode: (_d = openaiOptions.systemMessageMode) != null ? _d : isReasoningModel ? "developer" : modelCapabilities.systemMessageMode
          }
        );
        warnings.push(...messageWarnings);
        const strictJsonSchema = (_e = openaiOptions.strictJsonSchema) != null ? _e : true;
        const baseArgs = {
          // model id:
          model: this.modelId,
          // model specific settings:
          logit_bias: openaiOptions.logitBias,
          logprobs: openaiOptions.logprobs === true || typeof openaiOptions.logprobs === "number" ? true : void 0,
          top_logprobs: typeof openaiOptions.logprobs === "number" ? openaiOptions.logprobs : typeof openaiOptions.logprobs === "boolean" ? openaiOptions.logprobs ? 0 : void 0 : void 0,
          user: openaiOptions.user,
          parallel_tool_calls: openaiOptions.parallelToolCalls,
          // standardized settings:
          max_tokens: maxOutputTokens,
          temperature,
          top_p: topP,
          frequency_penalty: frequencyPenalty,
          presence_penalty: presencePenalty,
          response_format: (responseFormat == null ? void 0 : responseFormat.type) === "json" ? responseFormat.schema != null ? {
            type: "json_schema",
            json_schema: {
              schema: responseFormat.schema,
              strict: strictJsonSchema,
              name: (_f = responseFormat.name) != null ? _f : "response",
              description: responseFormat.description
            }
          } : { type: "json_object" } : void 0,
          stop: stopSequences,
          seed,
          verbosity: openaiOptions.textVerbosity,
          // openai specific settings:
          // TODO AI SDK 6: remove, we auto-map maxOutputTokens now
          max_completion_tokens: openaiOptions.maxCompletionTokens,
          store: openaiOptions.store,
          metadata: openaiOptions.metadata,
          prediction: openaiOptions.prediction,
          reasoning_effort: resolvedReasoningEffort,
          service_tier: openaiOptions.serviceTier,
          prompt_cache_key: openaiOptions.promptCacheKey,
          prompt_cache_retention: openaiOptions.promptCacheRetention,
          safety_identifier: openaiOptions.safetyIdentifier,
          // messages:
          messages
        };
        if (isReasoningModel) {
          if (resolvedReasoningEffort !== "none" || !modelCapabilities.supportsNonReasoningParameters) {
            if (baseArgs.temperature != null) {
              baseArgs.temperature = void 0;
              warnings.push({
                type: "unsupported",
                feature: "temperature",
                details: "temperature is not supported for reasoning models"
              });
            }
            if (baseArgs.top_p != null) {
              baseArgs.top_p = void 0;
              warnings.push({
                type: "unsupported",
                feature: "topP",
                details: "topP is not supported for reasoning models"
              });
            }
            if (baseArgs.logprobs != null) {
              baseArgs.logprobs = void 0;
              warnings.push({
                type: "other",
                message: "logprobs is not supported for reasoning models"
              });
            }
          }
          if (baseArgs.frequency_penalty != null) {
            baseArgs.frequency_penalty = void 0;
            warnings.push({
              type: "unsupported",
              feature: "frequencyPenalty",
              details: "frequencyPenalty is not supported for reasoning models"
            });
          }
          if (baseArgs.presence_penalty != null) {
            baseArgs.presence_penalty = void 0;
            warnings.push({
              type: "unsupported",
              feature: "presencePenalty",
              details: "presencePenalty is not supported for reasoning models"
            });
          }
          if (baseArgs.logit_bias != null) {
            baseArgs.logit_bias = void 0;
            warnings.push({
              type: "other",
              message: "logitBias is not supported for reasoning models"
            });
          }
          if (baseArgs.top_logprobs != null) {
            baseArgs.top_logprobs = void 0;
            warnings.push({
              type: "other",
              message: "topLogprobs is not supported for reasoning models"
            });
          }
          if (baseArgs.max_tokens != null) {
            if (baseArgs.max_completion_tokens == null) {
              baseArgs.max_completion_tokens = baseArgs.max_tokens;
            }
            baseArgs.max_tokens = void 0;
          }
        } else if (this.modelId.startsWith("gpt-4o-search-preview") || this.modelId.startsWith("gpt-4o-mini-search-preview")) {
          if (baseArgs.temperature != null) {
            baseArgs.temperature = void 0;
            warnings.push({
              type: "unsupported",
              feature: "temperature",
              details: "temperature is not supported for the search preview models and has been removed."
            });
          }
        }
        if (openaiOptions.serviceTier === "flex" && !modelCapabilities.supportsFlexProcessing) {
          warnings.push({
            type: "unsupported",
            feature: "serviceTier",
            details: "flex processing is only available for o3, o4-mini, and gpt-5 models"
          });
          baseArgs.service_tier = void 0;
        }
        if (openaiOptions.serviceTier === "priority" && !modelCapabilities.supportsPriorityProcessing) {
          warnings.push({
            type: "unsupported",
            feature: "serviceTier",
            details: "priority processing is only available for supported models (gpt-4, gpt-5, gpt-5-mini, o3, o4-mini) and requires Enterprise access. gpt-5-nano is not supported"
          });
          baseArgs.service_tier = void 0;
        }
        const {
          tools: openaiTools2,
          toolChoice: openaiToolChoice,
          toolWarnings
        } = prepareChatTools({
          tools,
          toolChoice
        });
        return {
          args: {
            ...baseArgs,
            tools: openaiTools2,
            tool_choice: openaiToolChoice
          },
          warnings: [...warnings, ...toolWarnings]
        };
      }
      async doGenerate(options) {
        var _a2, _b2, _c, _d, _e, _f, _g, _h;
        const { args: body, warnings } = await this.getArgs(options);
        const {
          responseHeaders,
          value: response,
          rawValue: rawResponse
        } = await postJsonToApi({
          url: this.config.url({
            path: "/chat/completions",
            modelId: this.modelId
          }),
          headers: combineHeaders((_b2 = (_a2 = this.config).headers) == null ? void 0 : _b2.call(_a2), options.headers),
          body,
          failedResponseHandler: openaiFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            openaiChatResponseSchema
          ),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        const choice = response.choices[0];
        const content = [];
        const text = choice.message.content;
        if (text != null && text.length > 0) {
          content.push({ type: "text", text });
        }
        for (const toolCall of (_c = choice.message.tool_calls) != null ? _c : []) {
          content.push({
            type: "tool-call",
            toolCallId: (_d = toolCall.id) != null ? _d : generateId(),
            toolName: toolCall.function.name,
            input: toolCall.function.arguments
          });
        }
        for (const annotation of (_e = choice.message.annotations) != null ? _e : []) {
          content.push({
            type: "source",
            sourceType: "url",
            id: generateId(),
            url: annotation.url_citation.url,
            title: annotation.url_citation.title
          });
        }
        const completionTokenDetails = (_f = response.usage) == null ? void 0 : _f.completion_tokens_details;
        const providerMetadata = { openai: {} };
        if ((completionTokenDetails == null ? void 0 : completionTokenDetails.accepted_prediction_tokens) != null) {
          providerMetadata.openai.acceptedPredictionTokens = completionTokenDetails == null ? void 0 : completionTokenDetails.accepted_prediction_tokens;
        }
        if ((completionTokenDetails == null ? void 0 : completionTokenDetails.rejected_prediction_tokens) != null) {
          providerMetadata.openai.rejectedPredictionTokens = completionTokenDetails == null ? void 0 : completionTokenDetails.rejected_prediction_tokens;
        }
        if (((_g = choice.logprobs) == null ? void 0 : _g.content) != null) {
          providerMetadata.openai.logprobs = choice.logprobs.content;
        }
        return {
          content,
          finishReason: {
            unified: mapOpenAIFinishReason(choice.finish_reason),
            raw: (_h = choice.finish_reason) != null ? _h : void 0
          },
          usage: convertOpenAIChatUsage(response.usage),
          request: { body },
          response: {
            ...getResponseMetadata(response),
            headers: responseHeaders,
            body: rawResponse
          },
          warnings,
          providerMetadata
        };
      }
      async doStream(options) {
        var _a2, _b2;
        const { args, warnings } = await this.getArgs(options);
        const body = {
          ...args,
          stream: true,
          stream_options: {
            include_usage: true
          }
        };
        const url = this.config.url({
          path: "/chat/completions",
          modelId: this.modelId
        });
        const { responseHeaders, value: response } = await postJsonToApi({
          url,
          headers: combineHeaders((_b2 = (_a2 = this.config).headers) == null ? void 0 : _b2.call(_a2), options.headers),
          body,
          failedResponseHandler: openaiFailedResponseHandler,
          successfulResponseHandler: createEventSourceResponseHandler(
            openaiChatChunkSchema
          ),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        const checkedResponse = await throwIfOpenAIStreamErrorBeforeOutput({
          stream: response,
          getError: (chunk) => "error" in chunk ? chunk.error : void 0,
          isOutputChunk: isOpenAIChatOutputChunk,
          url,
          requestBodyValues: body,
          responseHeaders
        });
        let toolCallTracker;
        let finishReason = {
          unified: "other",
          raw: void 0
        };
        let usage = void 0;
        let metadataExtracted = false;
        let isActiveText = false;
        const providerMetadata = { openai: {} };
        const result = {
          stream: checkedResponse.pipeThrough(
            new TransformStream({
              start(controller) {
                toolCallTracker = new StreamingToolCallTracker(controller, {
                  generateId,
                  typeValidation: "if-present"
                });
                controller.enqueue({ type: "stream-start", warnings });
              },
              transform(chunk, controller) {
                var _a22, _b22, _c, _d, _e;
                if (options.includeRawChunks) {
                  controller.enqueue({ type: "raw", rawValue: chunk.rawValue });
                }
                if (!chunk.success) {
                  finishReason = { unified: "error", raw: void 0 };
                  controller.enqueue({ type: "error", error: chunk.error });
                  return;
                }
                const value = chunk.value;
                if ("error" in value) {
                  finishReason = { unified: "error", raw: void 0 };
                  controller.enqueue({ type: "error", error: value.error });
                  return;
                }
                if (!metadataExtracted) {
                  const metadata = getResponseMetadata(value);
                  if (Object.values(metadata).some(Boolean)) {
                    metadataExtracted = true;
                    controller.enqueue({
                      type: "response-metadata",
                      ...getResponseMetadata(value)
                    });
                  }
                }
                if (value.usage != null) {
                  usage = value.usage;
                  if (((_a22 = value.usage.completion_tokens_details) == null ? void 0 : _a22.accepted_prediction_tokens) != null) {
                    providerMetadata.openai.acceptedPredictionTokens = (_b22 = value.usage.completion_tokens_details) == null ? void 0 : _b22.accepted_prediction_tokens;
                  }
                  if (((_c = value.usage.completion_tokens_details) == null ? void 0 : _c.rejected_prediction_tokens) != null) {
                    providerMetadata.openai.rejectedPredictionTokens = (_d = value.usage.completion_tokens_details) == null ? void 0 : _d.rejected_prediction_tokens;
                  }
                }
                const choice = value.choices[0];
                if ((choice == null ? void 0 : choice.finish_reason) != null) {
                  finishReason = {
                    unified: mapOpenAIFinishReason(choice.finish_reason),
                    raw: choice.finish_reason
                  };
                }
                if (((_e = choice == null ? void 0 : choice.logprobs) == null ? void 0 : _e.content) != null) {
                  providerMetadata.openai.logprobs = choice.logprobs.content;
                }
                if ((choice == null ? void 0 : choice.delta) == null) {
                  return;
                }
                const delta = choice.delta;
                if (delta.content != null) {
                  if (!isActiveText) {
                    controller.enqueue({ type: "text-start", id: "0" });
                    isActiveText = true;
                  }
                  controller.enqueue({
                    type: "text-delta",
                    id: "0",
                    delta: delta.content
                  });
                }
                if (delta.tool_calls != null) {
                  for (const toolCallDelta of delta.tool_calls) {
                    toolCallTracker.processDelta(toolCallDelta);
                  }
                }
                if (delta.annotations != null) {
                  for (const annotation of delta.annotations) {
                    controller.enqueue({
                      type: "source",
                      sourceType: "url",
                      id: generateId(),
                      url: annotation.url_citation.url,
                      title: annotation.url_citation.title
                    });
                  }
                }
              },
              flush(controller) {
                if (isActiveText) {
                  controller.enqueue({ type: "text-end", id: "0" });
                }
                toolCallTracker.flush();
                controller.enqueue({
                  type: "finish",
                  finishReason,
                  usage: convertOpenAIChatUsage(usage),
                  ...providerMetadata != null ? { providerMetadata } : {}
                });
              }
            })
          ),
          request: { body },
          response: { headers: responseHeaders }
        };
        return result;
      }
    };
    openaiCompletionResponseSchema = lazySchema(
      () => zodSchema(
        z42.object({
          id: z42.string().nullish(),
          created: z42.number().nullish(),
          model: z42.string().nullish(),
          choices: z42.array(
            z42.object({
              text: z42.string(),
              finish_reason: z42.string(),
              logprobs: z42.object({
                tokens: z42.array(z42.string()),
                token_logprobs: z42.array(z42.number()),
                top_logprobs: z42.array(z42.record(z42.string(), z42.number())).nullish()
              }).nullish()
            })
          ),
          usage: z42.object({
            prompt_tokens: z42.number(),
            completion_tokens: z42.number(),
            total_tokens: z42.number()
          }).nullish()
        })
      )
    );
    openaiCompletionChunkSchema = lazySchema(
      () => zodSchema(
        z42.union([
          z42.object({
            id: z42.string().nullish(),
            created: z42.number().nullish(),
            model: z42.string().nullish(),
            choices: z42.array(
              z42.object({
                text: z42.string(),
                finish_reason: z42.string().nullish(),
                index: z42.number(),
                logprobs: z42.object({
                  tokens: z42.array(z42.string()),
                  token_logprobs: z42.array(z42.number()),
                  top_logprobs: z42.array(z42.record(z42.string(), z42.number())).nullish()
                }).nullish()
              })
            ),
            usage: z42.object({
              prompt_tokens: z42.number(),
              completion_tokens: z42.number(),
              total_tokens: z42.number()
            }).nullish()
          }),
          openaiErrorDataSchema
        ])
      )
    );
    openaiLanguageModelCompletionOptions = lazySchema(
      () => zodSchema(
        z5.object({
          /**
           * Echo back the prompt in addition to the completion.
           */
          echo: z5.boolean().optional(),
          /**
           * Modify the likelihood of specified tokens appearing in the completion.
           *
           * Accepts a JSON object that maps tokens (specified by their token ID in
           * the GPT tokenizer) to an associated bias value from -100 to 100. You
           * can use this tokenizer tool to convert text to token IDs. Mathematically,
           * the bias is added to the logits generated by the model prior to sampling.
           * The exact effect will vary per model, but values between -1 and 1 should
           * decrease or increase likelihood of selection; values like -100 or 100
           * should result in a ban or exclusive selection of the relevant token.
           *
           * As an example, you can pass {"50256": -100} to prevent the <|endoftext|>
           * token from being generated.
           */
          logitBias: z5.record(z5.string(), z5.number()).optional(),
          /**
           * The suffix that comes after a completion of inserted text.
           */
          suffix: z5.string().optional(),
          /**
           * A unique identifier representing your end-user, which can help OpenAI to
           * monitor and detect abuse. Learn more.
           */
          user: z5.string().optional(),
          /**
           * Return the log probabilities of the tokens. Including logprobs will increase
           * the response size and can slow down response times. However, it can
           * be useful to better understand how the model is behaving.
           * Setting to true will return the log probabilities of the tokens that
           * were generated.
           * Setting to a number will return the log probabilities of the top n
           * tokens that were generated.
           */
          logprobs: z5.union([z5.boolean(), z5.number()]).optional()
        })
      )
    );
    OpenAICompletionLanguageModel = class _OpenAICompletionLanguageModel {
      constructor(modelId, config) {
        this.specificationVersion = "v4";
        this.supportedUrls = {
          // No URLs are supported for completion models.
        };
        this.modelId = modelId;
        this.config = config;
      }
      get providerOptionsName() {
        return this.config.provider.split(".")[0].trim();
      }
      static [WORKFLOW_SERIALIZE](model) {
        return serializeModelOptions({
          modelId: model.modelId,
          config: model.config
        });
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _OpenAICompletionLanguageModel(options.modelId, options.config);
      }
      get provider() {
        return this.config.provider;
      }
      async getArgs({
        prompt,
        maxOutputTokens,
        temperature,
        topP,
        topK,
        frequencyPenalty,
        presencePenalty,
        stopSequences: userStopSequences,
        responseFormat,
        tools,
        toolChoice,
        seed,
        providerOptions
      }) {
        const warnings = [];
        const openaiOptions = {
          ...await parseProviderOptions({
            provider: "openai",
            providerOptions,
            schema: openaiLanguageModelCompletionOptions
          }),
          ...await parseProviderOptions({
            provider: this.providerOptionsName,
            providerOptions,
            schema: openaiLanguageModelCompletionOptions
          })
        };
        if (topK != null) {
          warnings.push({ type: "unsupported", feature: "topK" });
        }
        if (tools == null ? void 0 : tools.length) {
          warnings.push({ type: "unsupported", feature: "tools" });
        }
        if (toolChoice != null) {
          warnings.push({ type: "unsupported", feature: "toolChoice" });
        }
        if (responseFormat != null && responseFormat.type !== "text") {
          warnings.push({
            type: "unsupported",
            feature: "responseFormat",
            details: "JSON response format is not supported."
          });
        }
        const { prompt: completionPrompt, stopSequences } = convertToOpenAICompletionPrompt({ prompt });
        const stop = [...stopSequences != null ? stopSequences : [], ...userStopSequences != null ? userStopSequences : []];
        return {
          args: {
            // model id:
            model: this.modelId,
            // model specific settings:
            echo: openaiOptions.echo,
            logit_bias: openaiOptions.logitBias,
            logprobs: (openaiOptions == null ? void 0 : openaiOptions.logprobs) === true ? 0 : (openaiOptions == null ? void 0 : openaiOptions.logprobs) === false ? void 0 : openaiOptions == null ? void 0 : openaiOptions.logprobs,
            suffix: openaiOptions.suffix,
            user: openaiOptions.user,
            // standardized settings:
            max_tokens: maxOutputTokens,
            temperature,
            top_p: topP,
            frequency_penalty: frequencyPenalty,
            presence_penalty: presencePenalty,
            seed,
            // prompt:
            prompt: completionPrompt,
            // stop sequences:
            stop: stop.length > 0 ? stop : void 0
          },
          warnings
        };
      }
      async doGenerate(options) {
        var _a2, _b2, _c;
        const { args, warnings } = await this.getArgs(options);
        const {
          responseHeaders,
          value: response,
          rawValue: rawResponse
        } = await postJsonToApi({
          url: this.config.url({
            path: "/completions",
            modelId: this.modelId
          }),
          headers: combineHeaders((_b2 = (_a2 = this.config).headers) == null ? void 0 : _b2.call(_a2), options.headers),
          body: args,
          failedResponseHandler: openaiFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            openaiCompletionResponseSchema
          ),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        const choice = response.choices[0];
        const providerMetadata = { openai: {} };
        if (choice.logprobs != null) {
          providerMetadata.openai.logprobs = choice.logprobs;
        }
        return {
          content: [{ type: "text", text: choice.text }],
          usage: convertOpenAICompletionUsage(response.usage),
          finishReason: {
            unified: mapOpenAIFinishReason2(choice.finish_reason),
            raw: (_c = choice.finish_reason) != null ? _c : void 0
          },
          request: { body: args },
          response: {
            ...getResponseMetadata2(response),
            headers: responseHeaders,
            body: rawResponse
          },
          providerMetadata,
          warnings
        };
      }
      async doStream(options) {
        var _a2, _b2;
        const { args, warnings } = await this.getArgs(options);
        const body = {
          ...args,
          stream: true,
          stream_options: {
            include_usage: true
          }
        };
        const url = this.config.url({
          path: "/completions",
          modelId: this.modelId
        });
        const { responseHeaders, value: response } = await postJsonToApi({
          url,
          headers: combineHeaders((_b2 = (_a2 = this.config).headers) == null ? void 0 : _b2.call(_a2), options.headers),
          body,
          failedResponseHandler: openaiFailedResponseHandler,
          successfulResponseHandler: createEventSourceResponseHandler(
            openaiCompletionChunkSchema
          ),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        const checkedResponse = await throwIfOpenAIStreamErrorBeforeOutput({
          stream: response,
          getError: (chunk) => "error" in chunk ? chunk.error : void 0,
          isOutputChunk: isOpenAICompletionOutputChunk,
          url,
          requestBodyValues: body,
          responseHeaders
        });
        let finishReason = {
          unified: "other",
          raw: void 0
        };
        const providerMetadata = { openai: {} };
        let usage = void 0;
        let isFirstChunk = true;
        const result = {
          stream: checkedResponse.pipeThrough(
            new TransformStream({
              start(controller) {
                controller.enqueue({ type: "stream-start", warnings });
              },
              transform(chunk, controller) {
                if (options.includeRawChunks) {
                  controller.enqueue({ type: "raw", rawValue: chunk.rawValue });
                }
                if (!chunk.success) {
                  finishReason = { unified: "error", raw: void 0 };
                  controller.enqueue({ type: "error", error: chunk.error });
                  return;
                }
                const value = chunk.value;
                if ("error" in value) {
                  finishReason = { unified: "error", raw: void 0 };
                  controller.enqueue({ type: "error", error: value.error });
                  return;
                }
                if (isFirstChunk) {
                  isFirstChunk = false;
                  controller.enqueue({
                    type: "response-metadata",
                    ...getResponseMetadata2(value)
                  });
                  controller.enqueue({ type: "text-start", id: "0" });
                }
                if (value.usage != null) {
                  usage = value.usage;
                }
                const choice = value.choices[0];
                if ((choice == null ? void 0 : choice.finish_reason) != null) {
                  finishReason = {
                    unified: mapOpenAIFinishReason2(choice.finish_reason),
                    raw: choice.finish_reason
                  };
                }
                if ((choice == null ? void 0 : choice.logprobs) != null) {
                  providerMetadata.openai.logprobs = choice.logprobs;
                }
                if ((choice == null ? void 0 : choice.text) != null && choice.text.length > 0) {
                  controller.enqueue({
                    type: "text-delta",
                    id: "0",
                    delta: choice.text
                  });
                }
              },
              flush(controller) {
                if (!isFirstChunk) {
                  controller.enqueue({ type: "text-end", id: "0" });
                }
                controller.enqueue({
                  type: "finish",
                  finishReason,
                  providerMetadata,
                  usage: convertOpenAICompletionUsage(usage)
                });
              }
            })
          ),
          request: { body },
          response: { headers: responseHeaders }
        };
        return result;
      }
    };
    openaiEmbeddingModelOptions = lazySchema(
      () => zodSchema(
        z6.object({
          /**
           * The number of dimensions the resulting output embeddings should have.
           * Only supported in text-embedding-3 and later models.
           */
          dimensions: z6.number().optional(),
          /**
           * A unique identifier representing your end-user, which can help OpenAI to
           * monitor and detect abuse. Learn more.
           */
          user: z6.string().optional()
        })
      )
    );
    openaiTextEmbeddingResponseSchema = lazySchema(
      () => zodSchema(
        z7.object({
          data: z7.array(z7.object({ embedding: z7.array(z7.number()) })),
          usage: z7.object({ prompt_tokens: z7.number() }).nullish()
        })
      )
    );
    OpenAIEmbeddingModel = class _OpenAIEmbeddingModel {
      constructor(modelId, config) {
        this.specificationVersion = "v4";
        this.maxEmbeddingsPerCall = 2048;
        this.supportsParallelCalls = true;
        this.modelId = modelId;
        this.config = config;
      }
      static [WORKFLOW_SERIALIZE](model) {
        return serializeModelOptions({
          modelId: model.modelId,
          config: model.config
        });
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _OpenAIEmbeddingModel(options.modelId, options.config);
      }
      get provider() {
        return this.config.provider;
      }
      async doEmbed({
        values,
        headers,
        abortSignal,
        providerOptions
      }) {
        var _a2, _b2, _c;
        if (values.length > this.maxEmbeddingsPerCall) {
          throw new TooManyEmbeddingValuesForCallError({
            provider: this.provider,
            modelId: this.modelId,
            maxEmbeddingsPerCall: this.maxEmbeddingsPerCall,
            values
          });
        }
        const openaiOptions = (_a2 = await parseProviderOptions({
          provider: "openai",
          providerOptions,
          schema: openaiEmbeddingModelOptions
        })) != null ? _a2 : {};
        const {
          responseHeaders,
          value: response,
          rawValue
        } = await postJsonToApi({
          url: this.config.url({
            path: "/embeddings",
            modelId: this.modelId
          }),
          headers: combineHeaders((_c = (_b2 = this.config).headers) == null ? void 0 : _c.call(_b2), headers),
          body: {
            model: this.modelId,
            input: values,
            encoding_format: "float",
            dimensions: openaiOptions.dimensions,
            user: openaiOptions.user
          },
          failedResponseHandler: openaiFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            openaiTextEmbeddingResponseSchema
          ),
          abortSignal,
          fetch: this.config.fetch
        });
        return {
          warnings: [],
          embeddings: response.data.map((item) => item.embedding),
          usage: response.usage ? { tokens: response.usage.prompt_tokens } : void 0,
          response: { headers: responseHeaders, body: rawValue }
        };
      }
    };
    openaiFilesResponseSchema = lazySchema(
      () => zodSchema(
        z8.object({
          id: z8.string(),
          object: z8.string().nullish(),
          bytes: z8.number().nullish(),
          created_at: z8.number().nullish(),
          filename: z8.string().nullish(),
          purpose: z8.string().nullish(),
          status: z8.string().nullish(),
          expires_at: z8.number().nullish()
        })
      )
    );
    openaiFilesOptionsSchema = lazySchema(
      () => zodSchema(
        z9.object({
          /*
           * Required by the OpenAI API, but optional here because
           * the SDK defaults to "assistants" — by far the most common
           * purpose when uploading files in this context.
           */
          purpose: z9.string().optional(),
          expiresAfter: z9.number().optional()
        })
      )
    );
    OpenAIFiles = class {
      constructor(config) {
        this.config = config;
        this.specificationVersion = "v4";
      }
      get provider() {
        return this.config.provider;
      }
      async uploadFile({
        data,
        mediaType,
        filename,
        providerOptions
      }) {
        var _a2, _b2, _c;
        const openaiOptions = await parseProviderOptions({
          provider: "openai",
          providerOptions,
          schema: openaiFilesOptionsSchema
        });
        const fileBytes = convertInlineFileDataToUint8Array(data);
        const blob = new Blob([fileBytes], {
          type: mediaType
        });
        const formData = new FormData();
        if (filename != null) {
          formData.append("file", blob, filename);
        } else {
          formData.append("file", blob);
        }
        formData.append("purpose", (_a2 = openaiOptions == null ? void 0 : openaiOptions.purpose) != null ? _a2 : "assistants");
        if ((openaiOptions == null ? void 0 : openaiOptions.expiresAfter) != null) {
          formData.append("expires_after", String(openaiOptions.expiresAfter));
        }
        const { value: response } = await postFormDataToApi({
          url: `${this.config.baseURL}/files`,
          headers: combineHeaders(this.config.headers()),
          formData,
          failedResponseHandler: openaiFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            openaiFilesResponseSchema
          ),
          fetch: this.config.fetch
        });
        return {
          warnings: [],
          providerReference: { openai: response.id },
          ...((_b2 = response.filename) != null ? _b2 : filename) ? { filename: (_c = response.filename) != null ? _c : filename } : {},
          ...mediaType != null ? { mediaType } : {},
          providerMetadata: {
            openai: {
              ...response.filename != null ? { filename: response.filename } : {},
              ...response.purpose != null ? { purpose: response.purpose } : {},
              ...response.bytes != null ? { bytes: response.bytes } : {},
              ...response.created_at != null ? { createdAt: response.created_at } : {},
              ...response.status != null ? { status: response.status } : {},
              ...response.expires_at != null ? { expiresAt: response.expires_at } : {}
            }
          }
        };
      }
    };
    openaiImageResponseSchema = lazySchema(
      () => zodSchema(
        z10.object({
          created: z10.number().nullish(),
          data: z10.array(
            z10.object({
              b64_json: z10.string(),
              revised_prompt: z10.string().nullish()
            })
          ),
          background: z10.string().nullish(),
          output_format: z10.string().nullish(),
          size: z10.string().nullish(),
          quality: z10.string().nullish(),
          usage: z10.object({
            input_tokens: z10.number().nullish(),
            output_tokens: z10.number().nullish(),
            total_tokens: z10.number().nullish(),
            input_tokens_details: z10.object({
              image_tokens: z10.number().nullish(),
              text_tokens: z10.number().nullish()
            }).nullish()
          }).nullish()
        })
      )
    );
    modelMaxImagesPerCall = {
      "dall-e-3": 1,
      "dall-e-2": 10,
      "gpt-image-1": 10,
      "gpt-image-1-mini": 10,
      "gpt-image-1.5": 10,
      "gpt-image-2": 10,
      "chatgpt-image-latest": 10
    };
    defaultResponseFormatPrefixes = [
      "chatgpt-image-",
      "gpt-image-1-mini",
      "gpt-image-1.5",
      "gpt-image-1",
      "gpt-image-2"
    ];
    baseImageModelOptionsObject = z11.object({
      /**
       * Quality of the generated image(s).
       *
       * Valid values: `standard`, `hd`, `low`, `medium`, `high`, `auto`.
       */
      quality: z11.enum(["standard", "hd", "low", "medium", "high", "auto"]).optional(),
      /**
       * Background behavior for the generated image(s).
       *
       * If `transparent`, the output format must support transparency
       * (i.e. `png` or `webp`).
       */
      background: z11.enum(["transparent", "opaque", "auto"]).optional(),
      /**
       * Format in which the generated image(s) are returned.
       */
      outputFormat: z11.enum(["png", "jpeg", "webp"]).optional(),
      /**
       * Compression level (0-100) for the generated image(s). Applies to the
       * `jpeg` and `webp` output formats.
       */
      outputCompression: z11.number().int().min(0).max(100).optional(),
      /**
       * A unique identifier representing your end-user, which can help OpenAI
       * to monitor and detect abuse.
       */
      user: z11.string().optional()
    });
    openaiImageModelOptions = lazySchema(
      () => zodSchema(baseImageModelOptionsObject)
    );
    openaiImageModelGenerationOptions = lazySchema(
      () => zodSchema(
        baseImageModelOptionsObject.extend({
          /**
           * Style of the generated image. `vivid` produces hyper-real and
           * dramatic images; `natural` produces more subdued, less hyper-real
           * looking images.
           */
          style: z11.enum(["vivid", "natural"]).optional(),
          /**
           * Content moderation level for the generated image(s). `low` applies
           * less restrictive filtering.
           */
          moderation: z11.enum(["auto", "low"]).optional()
        })
      )
    );
    openaiImageModelEditOptions = lazySchema(
      () => zodSchema(
        baseImageModelOptionsObject.extend({
          /**
           * Fidelity of the output image(s) to the input image(s).
           */
          inputFidelity: z11.enum(["high", "low"]).optional()
        })
      )
    );
    OpenAIImageModel = class _OpenAIImageModel {
      constructor(modelId, config) {
        this.modelId = modelId;
        this.config = config;
        this.specificationVersion = "v4";
      }
      static [WORKFLOW_SERIALIZE](model) {
        return serializeModelOptions({
          modelId: model.modelId,
          config: model.config
        });
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _OpenAIImageModel(options.modelId, options.config);
      }
      get maxImagesPerCall() {
        var _a2;
        return (_a2 = modelMaxImagesPerCall[this.modelId]) != null ? _a2 : 1;
      }
      get provider() {
        return this.config.provider;
      }
      async doGenerate({
        prompt,
        files,
        mask,
        n,
        size,
        aspectRatio,
        seed,
        providerOptions,
        headers,
        abortSignal
      }) {
        var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
        const warnings = [];
        if (aspectRatio != null) {
          warnings.push({
            type: "unsupported",
            feature: "aspectRatio",
            details: "This model does not support aspect ratio. Use `size` instead."
          });
        }
        if (seed != null) {
          warnings.push({ type: "unsupported", feature: "seed" });
        }
        const currentDate = (_c = (_b2 = (_a2 = this.config._internal) == null ? void 0 : _a2.currentDate) == null ? void 0 : _b2.call(_a2)) != null ? _c : /* @__PURE__ */ new Date();
        if (files != null) {
          const openaiOptions2 = (_d = await parseProviderOptions({
            provider: "openai",
            providerOptions,
            schema: openaiImageModelEditOptions
          })) != null ? _d : {};
          const { value: response2, responseHeaders: responseHeaders2 } = await postFormDataToApi({
            url: this.config.url({
              path: "/images/edits",
              modelId: this.modelId
            }),
            headers: combineHeaders((_f = (_e = this.config).headers) == null ? void 0 : _f.call(_e), headers),
            formData: convertToFormData({
              model: this.modelId,
              prompt,
              image: await Promise.all(
                files.map(
                  (file) => file.type === "file" ? new Blob(
                    [
                      file.data instanceof Uint8Array ? new Blob([file.data], {
                        type: file.mediaType
                      }) : new Blob([convertBase64ToUint8Array(file.data)], {
                        type: file.mediaType
                      })
                    ],
                    { type: file.mediaType }
                  ) : downloadBlob(file.url)
                )
              ),
              mask: mask != null ? await fileToBlob(mask) : void 0,
              n,
              size,
              quality: openaiOptions2.quality,
              background: openaiOptions2.background,
              output_format: openaiOptions2.outputFormat,
              output_compression: openaiOptions2.outputCompression,
              input_fidelity: openaiOptions2.inputFidelity,
              user: openaiOptions2.user
            }),
            failedResponseHandler: openaiFailedResponseHandler,
            successfulResponseHandler: createJsonResponseHandler(
              openaiImageResponseSchema
            ),
            abortSignal,
            fetch: this.config.fetch
          });
          return {
            images: response2.data.map((item) => item.b64_json),
            warnings,
            usage: response2.usage != null ? {
              inputTokens: (_g = response2.usage.input_tokens) != null ? _g : void 0,
              outputTokens: (_h = response2.usage.output_tokens) != null ? _h : void 0,
              totalTokens: (_i = response2.usage.total_tokens) != null ? _i : void 0
            } : void 0,
            response: {
              timestamp: currentDate,
              modelId: this.modelId,
              headers: responseHeaders2
            },
            providerMetadata: {
              openai: {
                images: response2.data.map((item, index) => {
                  var _a22, _b22, _c2, _d2, _e2, _f2;
                  return {
                    ...item.revised_prompt ? { revisedPrompt: item.revised_prompt } : {},
                    created: (_a22 = response2.created) != null ? _a22 : void 0,
                    size: (_b22 = response2.size) != null ? _b22 : void 0,
                    quality: (_c2 = response2.quality) != null ? _c2 : void 0,
                    background: (_d2 = response2.background) != null ? _d2 : void 0,
                    outputFormat: (_e2 = response2.output_format) != null ? _e2 : void 0,
                    ...distributeTokenDetails(
                      (_f2 = response2.usage) == null ? void 0 : _f2.input_tokens_details,
                      index,
                      response2.data.length
                    )
                  };
                })
              }
            }
          };
        }
        const openaiOptions = (_j = await parseProviderOptions({
          provider: "openai",
          providerOptions,
          schema: openaiImageModelGenerationOptions
        })) != null ? _j : {};
        const { value: response, responseHeaders } = await postJsonToApi({
          url: this.config.url({
            path: "/images/generations",
            modelId: this.modelId
          }),
          headers: combineHeaders((_l = (_k = this.config).headers) == null ? void 0 : _l.call(_k), headers),
          body: {
            model: this.modelId,
            prompt,
            n,
            size,
            quality: openaiOptions.quality,
            style: openaiOptions.style,
            background: openaiOptions.background,
            moderation: openaiOptions.moderation,
            output_format: openaiOptions.outputFormat,
            output_compression: openaiOptions.outputCompression,
            user: openaiOptions.user,
            ...!hasDefaultResponseFormat(this.modelId) ? { response_format: "b64_json" } : {}
          },
          failedResponseHandler: openaiFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            openaiImageResponseSchema
          ),
          abortSignal,
          fetch: this.config.fetch
        });
        return {
          images: response.data.map((item) => item.b64_json),
          warnings,
          usage: response.usage != null ? {
            inputTokens: (_m = response.usage.input_tokens) != null ? _m : void 0,
            outputTokens: (_n = response.usage.output_tokens) != null ? _n : void 0,
            totalTokens: (_o = response.usage.total_tokens) != null ? _o : void 0
          } : void 0,
          response: {
            timestamp: currentDate,
            modelId: this.modelId,
            headers: responseHeaders
          },
          providerMetadata: {
            openai: {
              images: response.data.map((item, index) => {
                var _a22, _b22, _c2, _d2, _e2, _f2;
                return {
                  ...item.revised_prompt ? { revisedPrompt: item.revised_prompt } : {},
                  created: (_a22 = response.created) != null ? _a22 : void 0,
                  size: (_b22 = response.size) != null ? _b22 : void 0,
                  quality: (_c2 = response.quality) != null ? _c2 : void 0,
                  background: (_d2 = response.background) != null ? _d2 : void 0,
                  outputFormat: (_e2 = response.output_format) != null ? _e2 : void 0,
                  ...distributeTokenDetails(
                    (_f2 = response.usage) == null ? void 0 : _f2.input_tokens_details,
                    index,
                    response.data.length
                  )
                };
              })
            }
          }
        };
      }
    };
    applyPatchInputSchema = lazySchema(
      () => zodSchema(
        z12.object({
          callId: z12.string(),
          operation: z12.discriminatedUnion("type", [
            z12.object({
              type: z12.literal("create_file"),
              path: z12.string(),
              diff: z12.string()
            }),
            z12.object({
              type: z12.literal("delete_file"),
              path: z12.string()
            }),
            z12.object({
              type: z12.literal("update_file"),
              path: z12.string(),
              diff: z12.string()
            })
          ])
        })
      )
    );
    applyPatchOutputSchema = lazySchema(
      () => zodSchema(
        z12.object({
          status: z12.enum(["completed", "failed"]),
          output: z12.string().optional()
        })
      )
    );
    applyPatchArgsSchema = lazySchema(() => zodSchema(z12.object({})));
    applyPatchToolFactory = createProviderDefinedToolFactoryWithOutputSchema({
      id: "openai.apply_patch",
      inputSchema: applyPatchInputSchema,
      outputSchema: applyPatchOutputSchema
    });
    applyPatch = applyPatchToolFactory;
    codeInterpreterInputSchema = lazySchema(
      () => zodSchema(
        z13.object({
          code: z13.string().nullish(),
          containerId: z13.string()
        })
      )
    );
    codeInterpreterOutputSchema = lazySchema(
      () => zodSchema(
        z13.object({
          outputs: z13.array(
            z13.discriminatedUnion("type", [
              z13.object({ type: z13.literal("logs"), logs: z13.string() }),
              z13.object({ type: z13.literal("image"), url: z13.string() })
            ])
          ).nullish()
        })
      )
    );
    codeInterpreterArgsSchema = lazySchema(
      () => zodSchema(
        z13.object({
          container: z13.union([
            z13.string(),
            z13.object({
              fileIds: z13.array(z13.string()).optional()
            })
          ]).optional()
        })
      )
    );
    codeInterpreterToolFactory = createProviderExecutedToolFactory({
      id: "openai.code_interpreter",
      inputSchema: codeInterpreterInputSchema,
      outputSchema: codeInterpreterOutputSchema
    });
    codeInterpreter = (args = {}) => {
      return codeInterpreterToolFactory(args);
    };
    customArgsSchema = lazySchema(
      () => zodSchema(
        z14.object({
          description: z14.string().optional(),
          format: z14.union([
            z14.object({
              type: z14.literal("grammar"),
              syntax: z14.enum(["regex", "lark"]),
              definition: z14.string()
            }),
            z14.object({
              type: z14.literal("text")
            })
          ]).optional()
        })
      )
    );
    customInputSchema = lazySchema(() => zodSchema(z14.string()));
    customToolFactory = createProviderDefinedToolFactory({
      id: "openai.custom",
      inputSchema: customInputSchema
    });
    customTool = (args) => customToolFactory(args);
    comparisonFilterSchema = z15.object({
      key: z15.string(),
      type: z15.enum(["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin"]),
      value: z15.union([z15.string(), z15.number(), z15.boolean(), z15.array(z15.string())])
    });
    compoundFilterSchema = z15.object({
      type: z15.enum(["and", "or"]),
      filters: z15.array(
        z15.union([comparisonFilterSchema, z15.lazy(() => compoundFilterSchema)])
      )
    });
    fileSearchArgsSchema = lazySchema(
      () => zodSchema(
        z15.object({
          vectorStoreIds: z15.array(z15.string()),
          maxNumResults: z15.number().optional(),
          ranking: z15.object({
            ranker: z15.string().optional(),
            scoreThreshold: z15.number().optional()
          }).optional(),
          filters: z15.union([comparisonFilterSchema, compoundFilterSchema]).optional()
        })
      )
    );
    fileSearchOutputSchema = lazySchema(
      () => zodSchema(
        z15.object({
          queries: z15.array(z15.string()),
          results: z15.array(
            z15.object({
              attributes: z15.record(z15.string(), z15.unknown()),
              fileId: z15.string(),
              filename: z15.string(),
              score: z15.number(),
              text: z15.string()
            })
          ).nullable()
        })
      )
    );
    fileSearch = createProviderExecutedToolFactory({
      id: "openai.file_search",
      inputSchema: z15.object({}),
      outputSchema: fileSearchOutputSchema
    });
    imageGenerationArgsSchema = lazySchema(
      () => zodSchema(
        z16.object({
          background: z16.enum(["auto", "opaque", "transparent"]).optional(),
          inputFidelity: z16.enum(["low", "high"]).optional(),
          inputImageMask: z16.object({
            fileId: z16.string().optional(),
            imageUrl: z16.string().optional()
          }).optional(),
          model: z16.string().optional(),
          moderation: z16.enum(["auto"]).optional(),
          outputCompression: z16.number().int().min(0).max(100).optional(),
          outputFormat: z16.enum(["png", "jpeg", "webp"]).optional(),
          partialImages: z16.number().int().min(0).max(3).optional(),
          quality: z16.enum(["auto", "low", "medium", "high"]).optional(),
          size: z16.enum(["1024x1024", "1024x1536", "1536x1024", "auto"]).optional()
        }).strict()
      )
    );
    imageGenerationInputSchema = lazySchema(() => zodSchema(z16.object({})));
    imageGenerationOutputSchema = lazySchema(
      () => zodSchema(z16.object({ result: z16.string() }))
    );
    imageGenerationToolFactory = createProviderExecutedToolFactory({
      id: "openai.image_generation",
      inputSchema: imageGenerationInputSchema,
      outputSchema: imageGenerationOutputSchema
    });
    imageGeneration = (args = {}) => {
      return imageGenerationToolFactory(args);
    };
    localShellInputSchema = lazySchema(
      () => zodSchema(
        z17.object({
          action: z17.object({
            type: z17.literal("exec"),
            command: z17.array(z17.string()),
            timeoutMs: z17.number().optional(),
            user: z17.string().optional(),
            workingDirectory: z17.string().optional(),
            env: z17.record(z17.string(), z17.string()).optional()
          })
        })
      )
    );
    localShellOutputSchema = lazySchema(
      () => zodSchema(z17.object({ output: z17.string() }))
    );
    localShell = createProviderDefinedToolFactoryWithOutputSchema({
      id: "openai.local_shell",
      inputSchema: localShellInputSchema,
      outputSchema: localShellOutputSchema
    });
    shellInputSchema = lazySchema(
      () => zodSchema(
        z18.object({
          action: z18.object({
            commands: z18.array(z18.string()),
            timeoutMs: z18.number().optional(),
            maxOutputLength: z18.number().optional()
          })
        })
      )
    );
    shellOutputSchema = lazySchema(
      () => zodSchema(
        z18.object({
          output: z18.array(
            z18.object({
              stdout: z18.string(),
              stderr: z18.string(),
              outcome: z18.discriminatedUnion("type", [
                z18.object({ type: z18.literal("timeout") }),
                z18.object({ type: z18.literal("exit"), exitCode: z18.number() })
              ])
            })
          )
        })
      )
    );
    shellSkillsSchema = z18.array(
      z18.discriminatedUnion("type", [
        z18.object({
          type: z18.literal("skillReference"),
          providerReference: z18.record(z18.string(), z18.string()),
          version: z18.string().optional()
        }),
        z18.object({
          type: z18.literal("inline"),
          name: z18.string(),
          description: z18.string(),
          source: z18.object({
            type: z18.literal("base64"),
            mediaType: z18.literal("application/zip"),
            data: z18.string()
          })
        })
      ])
    ).optional();
    shellArgsSchema = lazySchema(
      () => zodSchema(
        z18.object({
          environment: z18.union([
            z18.object({
              type: z18.literal("containerAuto"),
              fileIds: z18.array(z18.string()).optional(),
              memoryLimit: z18.enum(["1g", "4g", "16g", "64g"]).optional(),
              networkPolicy: z18.discriminatedUnion("type", [
                z18.object({ type: z18.literal("disabled") }),
                z18.object({
                  type: z18.literal("allowlist"),
                  allowedDomains: z18.array(z18.string()),
                  domainSecrets: z18.array(
                    z18.object({
                      domain: z18.string(),
                      name: z18.string(),
                      value: z18.string()
                    })
                  ).optional()
                })
              ]).optional(),
              skills: shellSkillsSchema
            }),
            z18.object({
              type: z18.literal("containerReference"),
              containerId: z18.string()
            }),
            z18.object({
              type: z18.literal("local").optional(),
              skills: z18.array(
                z18.object({
                  name: z18.string(),
                  description: z18.string(),
                  path: z18.string()
                })
              ).optional()
            })
          ]).optional()
        })
      )
    );
    shell = createProviderDefinedToolFactoryWithOutputSchema({
      id: "openai.shell",
      inputSchema: shellInputSchema,
      outputSchema: shellOutputSchema
    });
    toolSearchArgsSchema = lazySchema(
      () => zodSchema(
        z19.object({
          execution: z19.enum(["server", "client"]).optional(),
          description: z19.string().optional(),
          parameters: z19.record(z19.string(), z19.unknown()).optional()
        })
      )
    );
    toolSearchInputSchema = lazySchema(
      () => zodSchema(
        z19.object({
          arguments: z19.unknown().optional(),
          call_id: z19.string().nullish()
        })
      )
    );
    toolSearchOutputSchema = lazySchema(
      () => zodSchema(
        z19.object({
          tools: z19.array(z19.record(z19.string(), z19.unknown()))
        })
      )
    );
    toolSearchToolFactory = createProviderDefinedToolFactoryWithOutputSchema({
      id: "openai.tool_search",
      inputSchema: toolSearchInputSchema,
      outputSchema: toolSearchOutputSchema
    });
    toolSearch = (args = {}) => toolSearchToolFactory(args);
    webSearchArgsSchema = lazySchema(
      () => zodSchema(
        z20.object({
          externalWebAccess: z20.boolean().optional(),
          filters: z20.object({ allowedDomains: z20.array(z20.string()).optional() }).optional(),
          searchContextSize: z20.enum(["low", "medium", "high"]).optional(),
          userLocation: z20.object({
            type: z20.literal("approximate"),
            country: z20.string().optional(),
            city: z20.string().optional(),
            region: z20.string().optional(),
            timezone: z20.string().optional()
          }).optional()
        })
      )
    );
    webSearchInputSchema = lazySchema(() => zodSchema(z20.object({})));
    webSearchOutputSchema = lazySchema(
      () => zodSchema(
        z20.object({
          action: z20.discriminatedUnion("type", [
            z20.object({
              type: z20.literal("search"),
              query: z20.string().optional(),
              queries: z20.array(z20.string()).optional()
            }),
            z20.object({
              type: z20.literal("openPage"),
              url: z20.string().nullish()
            }),
            z20.object({
              type: z20.literal("findInPage"),
              url: z20.string().nullish(),
              pattern: z20.string().nullish()
            })
          ]).optional(),
          sources: z20.array(
            z20.discriminatedUnion("type", [
              z20.object({ type: z20.literal("url"), url: z20.string() }),
              z20.object({ type: z20.literal("api"), name: z20.string() })
            ])
          ).optional()
        })
      )
    );
    webSearchToolFactory = createProviderExecutedToolFactory({
      id: "openai.web_search",
      inputSchema: webSearchInputSchema,
      outputSchema: webSearchOutputSchema
    });
    webSearch = (args = {}) => webSearchToolFactory(args);
    webSearchPreviewArgsSchema = lazySchema(
      () => zodSchema(
        z21.object({
          searchContextSize: z21.enum(["low", "medium", "high"]).optional(),
          userLocation: z21.object({
            type: z21.literal("approximate"),
            country: z21.string().optional(),
            city: z21.string().optional(),
            region: z21.string().optional(),
            timezone: z21.string().optional()
          }).optional()
        })
      )
    );
    webSearchPreviewInputSchema = lazySchema(
      () => zodSchema(z21.object({}))
    );
    webSearchPreviewOutputSchema = lazySchema(
      () => zodSchema(
        z21.object({
          action: z21.discriminatedUnion("type", [
            z21.object({
              type: z21.literal("search"),
              query: z21.string().optional()
            }),
            z21.object({
              type: z21.literal("openPage"),
              url: z21.string().nullish()
            }),
            z21.object({
              type: z21.literal("findInPage"),
              url: z21.string().nullish(),
              pattern: z21.string().nullish()
            })
          ]).optional()
        })
      )
    );
    webSearchPreview = createProviderExecutedToolFactory({
      id: "openai.web_search_preview",
      inputSchema: webSearchPreviewInputSchema,
      outputSchema: webSearchPreviewOutputSchema
    });
    jsonValueSchema = z222.lazy(
      () => z222.union([
        z222.string(),
        z222.number(),
        z222.boolean(),
        z222.null(),
        z222.array(jsonValueSchema),
        z222.record(z222.string(), jsonValueSchema)
      ])
    );
    mcpArgsSchema = lazySchema(
      () => zodSchema(
        z222.object({
          serverLabel: z222.string(),
          allowedTools: z222.union([
            z222.array(z222.string()),
            z222.object({
              readOnly: z222.boolean().optional(),
              toolNames: z222.array(z222.string()).optional()
            })
          ]).optional(),
          authorization: z222.string().optional(),
          connectorId: z222.string().optional(),
          headers: z222.record(z222.string(), z222.string()).optional(),
          requireApproval: z222.union([
            z222.enum(["always", "never"]),
            z222.object({
              never: z222.object({
                toolNames: z222.array(z222.string()).optional()
              }).optional()
            })
          ]).optional(),
          serverDescription: z222.string().optional(),
          serverUrl: z222.string().optional()
        }).refine(
          (v) => v.serverUrl != null || v.connectorId != null,
          "One of serverUrl or connectorId must be provided."
        )
      )
    );
    mcpInputSchema = lazySchema(() => zodSchema(z222.object({})));
    mcpOutputSchema = lazySchema(
      () => zodSchema(
        z222.object({
          type: z222.literal("call"),
          serverLabel: z222.string(),
          name: z222.string(),
          arguments: z222.string(),
          output: z222.string().nullish(),
          error: z222.union([z222.string(), jsonValueSchema]).optional()
        })
      )
    );
    mcpToolFactory = createProviderExecutedToolFactory({
      id: "openai.mcp",
      inputSchema: mcpInputSchema,
      outputSchema: mcpOutputSchema
    });
    mcp = (args) => mcpToolFactory(args);
    openaiTools = {
      /**
       * The apply_patch tool lets GPT-5.1 create, update, and delete files in your
       * codebase using structured diffs. Instead of just suggesting edits, the model
       * emits patch operations that your application applies and then reports back on,
       * enabling iterative, multi-step code editing workflows.
       *
       */
      applyPatch,
      /**
       * Custom tools let callers constrain model output to a grammar (regex or
       * Lark syntax). The model returns a `custom_tool_call` output item whose
       * `input` field is a string matching the specified grammar.
       *
       * @param description - An optional description of the tool.
       * @param format - The output format constraint (grammar type, syntax, and definition).
       */
      customTool,
      /**
       * The Code Interpreter tool allows models to write and run Python code in a
       * sandboxed environment to solve complex problems in domains like data analysis,
       * coding, and math.
       *
       * @param container - The container to use for the code interpreter.
       */
      codeInterpreter,
      /**
       * File search is a tool available in the Responses API. It enables models to
       * retrieve information in a knowledge base of previously uploaded files through
       * semantic and keyword search.
       *
       * @param vectorStoreIds - The vector store IDs to use for the file search.
       * @param maxNumResults - The maximum number of results to return.
       * @param ranking - The ranking options to use for the file search.
       * @param filters - The filters to use for the file search.
       */
      fileSearch,
      /**
       * The image generation tool allows you to generate images using a text prompt,
       * and optionally image inputs. It leverages the GPT Image model,
       * and automatically optimizes text inputs for improved performance.
       *
       * @param background - Background type for the generated image. One of 'auto', 'opaque', or 'transparent'.
       * @param inputFidelity - Input fidelity for the generated image. One of 'low' or 'high'.
       * @param inputImageMask - Optional mask for inpainting. Contains fileId and/or imageUrl.
       * @param model - The image generation model to use. Default: gpt-image-1.
       * @param moderation - Moderation level for the generated image. Default: 'auto'.
       * @param outputCompression - Compression level for the output image (0-100).
       * @param outputFormat - The output format of the generated image. One of 'png', 'jpeg', or 'webp'.
       * @param partialImages - Number of partial images to generate in streaming mode (0-3).
       * @param quality - The quality of the generated image. One of 'auto', 'low', 'medium', or 'high'.
       * @param size - The size of the generated image. One of 'auto', '1024x1024', '1024x1536', or '1536x1024'.
       */
      imageGeneration,
      /**
       * Local shell is a tool that allows agents to run shell commands locally
       * on a machine you or the user provides.
       *
       * Supported models: `gpt-5-codex`
       */
      localShell,
      /**
       * The shell tool allows the model to interact with your local computer through
       * a controlled command-line interface. The model proposes shell commands; your
       * integration executes them and returns the outputs.
       *
       * Available through the Responses API for use with GPT-5.1.
       *
       * WARNING: Running arbitrary shell commands can be dangerous. Always sandbox
       * execution or add strict allow-/deny-lists before forwarding a command to
       * the system shell.
       */
      shell,
      /**
       * Web search allows models to access up-to-date information from the internet
       * and provide answers with sourced citations.
       *
       * @param searchContextSize - The search context size to use for the web search.
       * @param userLocation - The user location to use for the web search.
       */
      webSearchPreview,
      /**
       * Web search allows models to access up-to-date information from the internet
       * and provide answers with sourced citations.
       *
       * @param filters - The filters to use for the web search.
       * @param searchContextSize - The search context size to use for the web search.
       * @param userLocation - The user location to use for the web search.
       */
      webSearch,
      /**
       * MCP (Model Context Protocol) allows models to call tools exposed by
       * remote MCP servers or service connectors.
       *
       * @param serverLabel - Label to identify the MCP server.
       * @param allowedTools - Allowed tool names or filter object.
       * @param authorization - OAuth access token for the MCP server/connector.
       * @param connectorId - Identifier for a service connector.
       * @param headers - Optional headers to include in MCP requests.
       * // param requireApproval - Approval policy ('always'|'never'|filter object). (Removed - always 'never')
       * @param serverDescription - Optional description of the server.
       * @param serverUrl - URL for the MCP server.
       */
      mcp,
      /**
       * Tool search allows the model to dynamically search for and load deferred
       * tools into the model's context as needed. This helps reduce overall token
       * usage, cost, and latency by only loading tools when the model needs them.
       *
       * To use tool search, mark functions or namespaces with `defer_loading: true`
       * in the tools array. The model will use tool search to load these tools
       * when it determines they are needed.
       */
      toolSearch
    };
    OpenAIRealtimeModel = class {
      constructor(modelId, config) {
        this.specificationVersion = "v4";
        this.modelId = modelId;
        this.provider = config.provider;
        this.config = config;
      }
      async doCreateClientSecret(options) {
        var _a2;
        const fetchFn = (_a2 = this.config.fetch) != null ? _a2 : fetch;
        const url = `${this.config.baseURL}/realtime/client_secrets`;
        const session = options.sessionConfig != null ? buildOpenAISessionConfig(options.sessionConfig, this.modelId) : { type: "realtime", model: this.modelId };
        const response = await fetchFn(url, {
          method: "POST",
          headers: {
            ...this.config.headers(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            session,
            ...options.expiresAfterSeconds != null ? {
              // `anchor` is required by the client secrets endpoint; without it
              // the request fails with "Missing required parameter:
              // 'expires_after.anchor'".
              expires_after: {
                anchor: "created_at",
                seconds: options.expiresAfterSeconds
              }
            } : {}
          })
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `OpenAI realtime client secret request failed: ${response.status} ${text}`
          );
        }
        const data = await response.json();
        return {
          token: data.value,
          url: `wss://${new URL(this.config.baseURL).host}/v1/realtime?model=${encodeURIComponent(this.modelId)}`,
          expiresAt: data.expires_at
        };
      }
      getWebSocketConfig(options) {
        return {
          url: options.url,
          protocols: ["realtime", `openai-insecure-api-key.${options.token}`]
        };
      }
      parseServerEvent(raw) {
        return parseOpenAIRealtimeServerEvent(raw);
      }
      serializeClientEvent(event) {
        return serializeOpenAIRealtimeClientEvent(event, this.modelId);
      }
      buildSessionConfig(config) {
        return buildOpenAISessionConfig(config, this.modelId);
      }
    };
    openaiResponsesReasoningProviderOptionsSchema = z23.object({
      itemId: z23.string().nullish(),
      reasoningEncryptedContent: z23.string().nullish()
    });
    jsonValueSchema2 = z24.lazy(
      () => z24.union([
        z24.string(),
        z24.number(),
        z24.boolean(),
        z24.null(),
        z24.array(jsonValueSchema2),
        z24.record(z24.string(), jsonValueSchema2.optional())
      ])
    );
    openaiResponsesNestedErrorChunkSchema = z24.object({
      type: z24.literal("error"),
      sequence_number: z24.number(),
      error: z24.object({
        type: z24.string(),
        code: z24.string(),
        message: z24.string(),
        param: z24.string().nullish()
      })
    });
    openaiResponsesErrorChunkSchema = z24.object({
      type: z24.literal("error"),
      sequence_number: z24.number(),
      code: z24.string().nullish(),
      message: z24.string(),
      param: z24.string().nullish()
    });
    openaiResponsesChunkSchema = lazySchema(
      () => zodSchema(
        z24.union([
          z24.object({
            type: z24.literal("response.output_text.delta"),
            item_id: z24.string(),
            delta: z24.string(),
            logprobs: z24.array(
              z24.object({
                token: z24.string(),
                logprob: z24.number(),
                top_logprobs: z24.array(
                  z24.object({
                    token: z24.string(),
                    logprob: z24.number()
                  })
                )
              })
            ).nullish()
          }),
          z24.object({
            type: z24.enum(["response.completed", "response.incomplete"]),
            response: z24.object({
              incomplete_details: z24.object({ reason: z24.string() }).nullish(),
              usage: z24.object({
                input_tokens: z24.number(),
                input_tokens_details: z24.object({
                  cached_tokens: z24.number().nullish(),
                  orchestration_input_tokens: z24.number().nullish(),
                  orchestration_input_cached_tokens: z24.number().nullish()
                }).nullish(),
                output_tokens: z24.number(),
                output_tokens_details: z24.object({
                  reasoning_tokens: z24.number().nullish(),
                  orchestration_output_tokens: z24.number().nullish()
                }).nullish()
              }),
              service_tier: z24.string().nullish()
            })
          }),
          z24.object({
            type: z24.literal("response.failed"),
            sequence_number: z24.number(),
            response: z24.object({
              error: z24.object({
                code: z24.string().nullish(),
                message: z24.string()
              }).nullish(),
              incomplete_details: z24.object({ reason: z24.string() }).nullish(),
              usage: z24.object({
                input_tokens: z24.number(),
                input_tokens_details: z24.object({
                  cached_tokens: z24.number().nullish(),
                  orchestration_input_tokens: z24.number().nullish(),
                  orchestration_input_cached_tokens: z24.number().nullish()
                }).nullish(),
                output_tokens: z24.number(),
                output_tokens_details: z24.object({
                  reasoning_tokens: z24.number().nullish(),
                  orchestration_output_tokens: z24.number().nullish()
                }).nullish()
              }).nullish(),
              service_tier: z24.string().nullish()
            })
          }),
          z24.object({
            type: z24.literal("response.created"),
            response: z24.object({
              id: z24.string(),
              created_at: z24.number(),
              model: z24.string(),
              service_tier: z24.string().nullish()
            })
          }),
          z24.object({
            type: z24.literal("response.output_item.added"),
            output_index: z24.number(),
            item: z24.discriminatedUnion("type", [
              z24.object({
                type: z24.literal("message"),
                id: z24.string(),
                phase: z24.enum(["commentary", "final_answer"]).nullish()
              }),
              z24.object({
                type: z24.literal("reasoning"),
                id: z24.string(),
                encrypted_content: z24.string().nullish()
              }),
              z24.object({
                type: z24.literal("function_call"),
                id: z24.string(),
                call_id: z24.string(),
                name: z24.string(),
                arguments: z24.string(),
                namespace: z24.string().nullish()
              }),
              z24.object({
                type: z24.literal("web_search_call"),
                id: z24.string(),
                status: z24.string()
              }),
              z24.object({
                type: z24.literal("computer_call"),
                id: z24.string(),
                status: z24.string()
              }),
              z24.object({
                type: z24.literal("file_search_call"),
                id: z24.string()
              }),
              z24.object({
                type: z24.literal("image_generation_call"),
                id: z24.string()
              }),
              z24.object({
                type: z24.literal("code_interpreter_call"),
                id: z24.string(),
                container_id: z24.string(),
                code: z24.string().nullable(),
                outputs: z24.array(
                  z24.discriminatedUnion("type", [
                    z24.object({ type: z24.literal("logs"), logs: z24.string() }),
                    z24.object({ type: z24.literal("image"), url: z24.string() })
                  ])
                ).nullable(),
                status: z24.string()
              }),
              z24.object({
                type: z24.literal("mcp_call"),
                id: z24.string(),
                status: z24.string(),
                approval_request_id: z24.string().nullish()
              }),
              z24.object({
                type: z24.literal("mcp_list_tools"),
                id: z24.string()
              }),
              z24.object({
                type: z24.literal("mcp_approval_request"),
                id: z24.string()
              }),
              z24.object({
                type: z24.literal("apply_patch_call"),
                id: z24.string(),
                call_id: z24.string(),
                status: z24.enum(["in_progress", "completed"]),
                operation: z24.discriminatedUnion("type", [
                  z24.object({
                    type: z24.literal("create_file"),
                    path: z24.string(),
                    diff: z24.string()
                  }),
                  z24.object({
                    type: z24.literal("delete_file"),
                    path: z24.string()
                  }),
                  z24.object({
                    type: z24.literal("update_file"),
                    path: z24.string(),
                    diff: z24.string()
                  })
                ])
              }),
              z24.object({
                type: z24.literal("custom_tool_call"),
                id: z24.string(),
                call_id: z24.string(),
                name: z24.string(),
                input: z24.string()
              }),
              z24.object({
                type: z24.literal("shell_call"),
                id: z24.string(),
                call_id: z24.string(),
                status: z24.enum(["in_progress", "completed", "incomplete"]),
                action: z24.object({
                  commands: z24.array(z24.string())
                })
              }),
              z24.object({
                type: z24.literal("compaction"),
                id: z24.string(),
                encrypted_content: z24.string().nullish()
              }),
              z24.object({
                type: z24.literal("shell_call_output"),
                id: z24.string(),
                call_id: z24.string(),
                status: z24.enum(["in_progress", "completed", "incomplete"]),
                output: z24.array(
                  z24.object({
                    stdout: z24.string(),
                    stderr: z24.string(),
                    outcome: z24.discriminatedUnion("type", [
                      z24.object({ type: z24.literal("timeout") }),
                      z24.object({
                        type: z24.literal("exit"),
                        exit_code: z24.number()
                      })
                    ])
                  })
                )
              }),
              z24.object({
                type: z24.literal("tool_search_call"),
                id: z24.string(),
                execution: z24.enum(["server", "client"]),
                call_id: z24.string().nullable(),
                status: z24.enum(["in_progress", "completed", "incomplete"]),
                arguments: z24.unknown()
              }),
              z24.object({
                type: z24.literal("tool_search_output"),
                id: z24.string(),
                execution: z24.enum(["server", "client"]),
                call_id: z24.string().nullable(),
                status: z24.enum(["in_progress", "completed", "incomplete"]),
                tools: z24.array(z24.record(z24.string(), jsonValueSchema2.optional()))
              })
            ])
          }),
          z24.object({
            type: z24.literal("response.output_item.done"),
            output_index: z24.number(),
            item: z24.discriminatedUnion("type", [
              z24.object({
                type: z24.literal("message"),
                id: z24.string(),
                phase: z24.enum(["commentary", "final_answer"]).nullish()
              }),
              z24.object({
                type: z24.literal("reasoning"),
                id: z24.string(),
                encrypted_content: z24.string().nullish()
              }),
              z24.object({
                type: z24.literal("function_call"),
                id: z24.string(),
                call_id: z24.string(),
                name: z24.string(),
                arguments: z24.string(),
                status: z24.literal("completed"),
                namespace: z24.string().nullish()
              }),
              z24.object({
                type: z24.literal("custom_tool_call"),
                id: z24.string(),
                call_id: z24.string(),
                name: z24.string(),
                input: z24.string(),
                status: z24.literal("completed")
              }),
              z24.object({
                type: z24.literal("code_interpreter_call"),
                id: z24.string(),
                code: z24.string().nullable(),
                container_id: z24.string(),
                outputs: z24.array(
                  z24.discriminatedUnion("type", [
                    z24.object({ type: z24.literal("logs"), logs: z24.string() }),
                    z24.object({ type: z24.literal("image"), url: z24.string() })
                  ])
                ).nullable()
              }),
              z24.object({
                type: z24.literal("image_generation_call"),
                id: z24.string(),
                result: z24.string()
              }),
              z24.object({
                type: z24.literal("web_search_call"),
                id: z24.string(),
                status: z24.string(),
                action: z24.discriminatedUnion("type", [
                  z24.object({
                    type: z24.literal("search"),
                    query: z24.string().nullish(),
                    queries: z24.array(z24.string()).nullish(),
                    sources: z24.array(
                      z24.discriminatedUnion("type", [
                        z24.object({ type: z24.literal("url"), url: z24.string() }),
                        z24.object({ type: z24.literal("api"), name: z24.string() })
                      ])
                    ).nullish()
                  }),
                  z24.object({
                    type: z24.literal("open_page"),
                    url: z24.string().nullish()
                  }),
                  z24.object({
                    type: z24.literal("find_in_page"),
                    url: z24.string().nullish(),
                    pattern: z24.string().nullish()
                  })
                ]).nullish()
              }),
              z24.object({
                type: z24.literal("file_search_call"),
                id: z24.string(),
                queries: z24.array(z24.string()),
                results: z24.array(
                  z24.object({
                    attributes: z24.record(
                      z24.string(),
                      z24.union([z24.string(), z24.number(), z24.boolean()])
                    ),
                    file_id: z24.string(),
                    filename: z24.string(),
                    score: z24.number(),
                    text: z24.string()
                  })
                ).nullish()
              }),
              z24.object({
                type: z24.literal("local_shell_call"),
                id: z24.string(),
                call_id: z24.string(),
                action: z24.object({
                  type: z24.literal("exec"),
                  command: z24.array(z24.string()),
                  timeout_ms: z24.number().optional(),
                  user: z24.string().optional(),
                  working_directory: z24.string().optional(),
                  env: z24.record(z24.string(), z24.string()).optional()
                })
              }),
              z24.object({
                type: z24.literal("computer_call"),
                id: z24.string(),
                status: z24.literal("completed")
              }),
              z24.object({
                type: z24.literal("mcp_call"),
                id: z24.string(),
                status: z24.string(),
                arguments: z24.string(),
                name: z24.string(),
                server_label: z24.string(),
                output: z24.string().nullish(),
                error: z24.union([
                  z24.string(),
                  z24.object({
                    type: z24.string().optional(),
                    code: z24.union([z24.number(), z24.string()]).optional(),
                    message: z24.string().optional()
                  }).loose()
                ]).nullish(),
                approval_request_id: z24.string().nullish()
              }),
              z24.object({
                type: z24.literal("mcp_list_tools"),
                id: z24.string(),
                server_label: z24.string(),
                tools: z24.array(
                  z24.object({
                    name: z24.string(),
                    description: z24.string().optional(),
                    input_schema: z24.any(),
                    annotations: z24.record(z24.string(), z24.unknown()).optional()
                  })
                ),
                error: z24.union([
                  z24.string(),
                  z24.object({
                    type: z24.string().optional(),
                    code: z24.union([z24.number(), z24.string()]).optional(),
                    message: z24.string().optional()
                  }).loose()
                ]).optional()
              }),
              z24.object({
                type: z24.literal("mcp_approval_request"),
                id: z24.string(),
                server_label: z24.string(),
                name: z24.string(),
                arguments: z24.string(),
                approval_request_id: z24.string().optional()
              }),
              z24.object({
                type: z24.literal("apply_patch_call"),
                id: z24.string(),
                call_id: z24.string(),
                status: z24.enum(["in_progress", "completed"]),
                operation: z24.discriminatedUnion("type", [
                  z24.object({
                    type: z24.literal("create_file"),
                    path: z24.string(),
                    diff: z24.string()
                  }),
                  z24.object({
                    type: z24.literal("delete_file"),
                    path: z24.string()
                  }),
                  z24.object({
                    type: z24.literal("update_file"),
                    path: z24.string(),
                    diff: z24.string()
                  })
                ])
              }),
              z24.object({
                type: z24.literal("shell_call"),
                id: z24.string(),
                call_id: z24.string(),
                status: z24.enum(["in_progress", "completed", "incomplete"]),
                action: z24.object({
                  commands: z24.array(z24.string())
                })
              }),
              z24.object({
                type: z24.literal("compaction"),
                id: z24.string(),
                encrypted_content: z24.string()
              }),
              z24.object({
                type: z24.literal("shell_call_output"),
                id: z24.string(),
                call_id: z24.string(),
                status: z24.enum(["in_progress", "completed", "incomplete"]),
                output: z24.array(
                  z24.object({
                    stdout: z24.string(),
                    stderr: z24.string(),
                    outcome: z24.discriminatedUnion("type", [
                      z24.object({ type: z24.literal("timeout") }),
                      z24.object({
                        type: z24.literal("exit"),
                        exit_code: z24.number()
                      })
                    ])
                  })
                )
              }),
              z24.object({
                type: z24.literal("tool_search_call"),
                id: z24.string(),
                execution: z24.enum(["server", "client"]),
                call_id: z24.string().nullable(),
                status: z24.enum(["in_progress", "completed", "incomplete"]),
                arguments: z24.unknown()
              }),
              z24.object({
                type: z24.literal("tool_search_output"),
                id: z24.string(),
                execution: z24.enum(["server", "client"]),
                call_id: z24.string().nullable(),
                status: z24.enum(["in_progress", "completed", "incomplete"]),
                tools: z24.array(z24.record(z24.string(), jsonValueSchema2.optional()))
              })
            ])
          }),
          z24.object({
            type: z24.literal("response.function_call_arguments.delta"),
            item_id: z24.string(),
            output_index: z24.number(),
            delta: z24.string()
          }),
          z24.object({
            type: z24.literal("response.custom_tool_call_input.delta"),
            item_id: z24.string(),
            output_index: z24.number(),
            delta: z24.string()
          }),
          z24.object({
            type: z24.literal("response.image_generation_call.partial_image"),
            item_id: z24.string(),
            output_index: z24.number(),
            partial_image_b64: z24.string()
          }),
          z24.object({
            type: z24.literal("response.code_interpreter_call_code.delta"),
            item_id: z24.string(),
            output_index: z24.number(),
            delta: z24.string()
          }),
          z24.object({
            type: z24.literal("response.code_interpreter_call_code.done"),
            item_id: z24.string(),
            output_index: z24.number(),
            code: z24.string()
          }),
          z24.object({
            type: z24.literal("response.output_text.annotation.added"),
            annotation: z24.discriminatedUnion("type", [
              z24.object({
                type: z24.literal("url_citation"),
                start_index: z24.number(),
                end_index: z24.number(),
                url: z24.string(),
                title: z24.string()
              }),
              z24.object({
                type: z24.literal("file_citation"),
                file_id: z24.string(),
                filename: z24.string(),
                index: z24.number()
              }),
              z24.object({
                type: z24.literal("container_file_citation"),
                container_id: z24.string(),
                file_id: z24.string(),
                filename: z24.string(),
                start_index: z24.number(),
                end_index: z24.number()
              }),
              z24.object({
                type: z24.literal("file_path"),
                file_id: z24.string(),
                index: z24.number()
              })
            ])
          }),
          z24.object({
            type: z24.literal("response.reasoning_summary_part.added"),
            item_id: z24.string(),
            summary_index: z24.number()
          }),
          z24.object({
            type: z24.literal("response.reasoning_summary_text.delta"),
            item_id: z24.string(),
            summary_index: z24.number(),
            delta: z24.string()
          }),
          z24.object({
            type: z24.literal("response.reasoning_summary_part.done"),
            item_id: z24.string(),
            summary_index: z24.number()
          }),
          z24.object({
            type: z24.literal("response.apply_patch_call_operation_diff.delta"),
            item_id: z24.string(),
            output_index: z24.number(),
            delta: z24.string(),
            obfuscation: z24.string().nullish()
          }),
          z24.object({
            type: z24.literal("response.apply_patch_call_operation_diff.done"),
            item_id: z24.string(),
            output_index: z24.number(),
            diff: z24.string()
          }),
          openaiResponsesNestedErrorChunkSchema,
          openaiResponsesErrorChunkSchema,
          z24.object({ type: z24.string() }).loose().transform((value) => ({
            type: "unknown_chunk",
            message: value.type
          }))
          // fallback for unknown chunks
        ])
      )
    );
    openaiResponsesResponseSchema = lazySchema(
      () => zodSchema(
        z24.object({
          id: z24.string().optional(),
          created_at: z24.number().optional(),
          error: z24.object({
            message: z24.string(),
            type: z24.string(),
            param: z24.string().nullish(),
            code: z24.string()
          }).nullish(),
          model: z24.string().optional(),
          output: z24.array(
            z24.discriminatedUnion("type", [
              z24.object({
                type: z24.literal("message"),
                role: z24.literal("assistant"),
                id: z24.string(),
                phase: z24.enum(["commentary", "final_answer"]).nullish(),
                content: z24.array(
                  z24.object({
                    type: z24.literal("output_text"),
                    text: z24.string(),
                    logprobs: z24.array(
                      z24.object({
                        token: z24.string(),
                        logprob: z24.number(),
                        top_logprobs: z24.array(
                          z24.object({
                            token: z24.string(),
                            logprob: z24.number()
                          })
                        )
                      })
                    ).nullish(),
                    annotations: z24.array(
                      z24.discriminatedUnion("type", [
                        z24.object({
                          type: z24.literal("url_citation"),
                          start_index: z24.number(),
                          end_index: z24.number(),
                          url: z24.string(),
                          title: z24.string()
                        }),
                        z24.object({
                          type: z24.literal("file_citation"),
                          file_id: z24.string(),
                          filename: z24.string(),
                          index: z24.number()
                        }),
                        z24.object({
                          type: z24.literal("container_file_citation"),
                          container_id: z24.string(),
                          file_id: z24.string(),
                          filename: z24.string(),
                          start_index: z24.number(),
                          end_index: z24.number()
                        }),
                        z24.object({
                          type: z24.literal("file_path"),
                          file_id: z24.string(),
                          index: z24.number()
                        })
                      ])
                    )
                  })
                )
              }),
              z24.object({
                type: z24.literal("web_search_call"),
                id: z24.string(),
                status: z24.string(),
                action: z24.discriminatedUnion("type", [
                  z24.object({
                    type: z24.literal("search"),
                    query: z24.string().nullish(),
                    queries: z24.array(z24.string()).nullish(),
                    sources: z24.array(
                      z24.discriminatedUnion("type", [
                        z24.object({ type: z24.literal("url"), url: z24.string() }),
                        z24.object({
                          type: z24.literal("api"),
                          name: z24.string()
                        })
                      ])
                    ).nullish()
                  }),
                  z24.object({
                    type: z24.literal("open_page"),
                    url: z24.string().nullish()
                  }),
                  z24.object({
                    type: z24.literal("find_in_page"),
                    url: z24.string().nullish(),
                    pattern: z24.string().nullish()
                  })
                ]).nullish()
              }),
              z24.object({
                type: z24.literal("file_search_call"),
                id: z24.string(),
                queries: z24.array(z24.string()),
                results: z24.array(
                  z24.object({
                    attributes: z24.record(
                      z24.string(),
                      z24.union([z24.string(), z24.number(), z24.boolean()])
                    ),
                    file_id: z24.string(),
                    filename: z24.string(),
                    score: z24.number(),
                    text: z24.string()
                  })
                ).nullish()
              }),
              z24.object({
                type: z24.literal("code_interpreter_call"),
                id: z24.string(),
                code: z24.string().nullable(),
                container_id: z24.string(),
                outputs: z24.array(
                  z24.discriminatedUnion("type", [
                    z24.object({ type: z24.literal("logs"), logs: z24.string() }),
                    z24.object({ type: z24.literal("image"), url: z24.string() })
                  ])
                ).nullable()
              }),
              z24.object({
                type: z24.literal("image_generation_call"),
                id: z24.string(),
                result: z24.string()
              }),
              z24.object({
                type: z24.literal("local_shell_call"),
                id: z24.string(),
                call_id: z24.string(),
                action: z24.object({
                  type: z24.literal("exec"),
                  command: z24.array(z24.string()),
                  timeout_ms: z24.number().optional(),
                  user: z24.string().optional(),
                  working_directory: z24.string().optional(),
                  env: z24.record(z24.string(), z24.string()).optional()
                })
              }),
              z24.object({
                type: z24.literal("function_call"),
                call_id: z24.string(),
                name: z24.string(),
                arguments: z24.string(),
                id: z24.string(),
                namespace: z24.string().nullish()
              }),
              z24.object({
                type: z24.literal("custom_tool_call"),
                call_id: z24.string(),
                name: z24.string(),
                input: z24.string(),
                id: z24.string()
              }),
              z24.object({
                type: z24.literal("computer_call"),
                id: z24.string(),
                status: z24.string().optional()
              }),
              z24.object({
                type: z24.literal("reasoning"),
                id: z24.string(),
                encrypted_content: z24.string().nullish(),
                summary: z24.array(
                  z24.object({
                    type: z24.literal("summary_text"),
                    text: z24.string()
                  })
                )
              }),
              z24.object({
                type: z24.literal("mcp_call"),
                id: z24.string(),
                status: z24.string(),
                arguments: z24.string(),
                name: z24.string(),
                server_label: z24.string(),
                output: z24.string().nullish(),
                error: z24.union([
                  z24.string(),
                  z24.object({
                    type: z24.string().optional(),
                    code: z24.union([z24.number(), z24.string()]).optional(),
                    message: z24.string().optional()
                  }).loose()
                ]).nullish(),
                approval_request_id: z24.string().nullish()
              }),
              z24.object({
                type: z24.literal("mcp_list_tools"),
                id: z24.string(),
                server_label: z24.string(),
                tools: z24.array(
                  z24.object({
                    name: z24.string(),
                    description: z24.string().optional(),
                    input_schema: z24.any(),
                    annotations: z24.record(z24.string(), z24.unknown()).optional()
                  })
                ),
                error: z24.union([
                  z24.string(),
                  z24.object({
                    type: z24.string().optional(),
                    code: z24.union([z24.number(), z24.string()]).optional(),
                    message: z24.string().optional()
                  }).loose()
                ]).optional()
              }),
              z24.object({
                type: z24.literal("mcp_approval_request"),
                id: z24.string(),
                server_label: z24.string(),
                name: z24.string(),
                arguments: z24.string(),
                approval_request_id: z24.string().optional()
              }),
              z24.object({
                type: z24.literal("apply_patch_call"),
                id: z24.string(),
                call_id: z24.string(),
                status: z24.enum(["in_progress", "completed"]),
                operation: z24.discriminatedUnion("type", [
                  z24.object({
                    type: z24.literal("create_file"),
                    path: z24.string(),
                    diff: z24.string()
                  }),
                  z24.object({
                    type: z24.literal("delete_file"),
                    path: z24.string()
                  }),
                  z24.object({
                    type: z24.literal("update_file"),
                    path: z24.string(),
                    diff: z24.string()
                  })
                ])
              }),
              z24.object({
                type: z24.literal("shell_call"),
                id: z24.string(),
                call_id: z24.string(),
                status: z24.enum(["in_progress", "completed", "incomplete"]),
                action: z24.object({
                  commands: z24.array(z24.string())
                })
              }),
              z24.object({
                type: z24.literal("compaction"),
                id: z24.string(),
                encrypted_content: z24.string()
              }),
              z24.object({
                type: z24.literal("shell_call_output"),
                id: z24.string(),
                call_id: z24.string(),
                status: z24.enum(["in_progress", "completed", "incomplete"]),
                output: z24.array(
                  z24.object({
                    stdout: z24.string(),
                    stderr: z24.string(),
                    outcome: z24.discriminatedUnion("type", [
                      z24.object({ type: z24.literal("timeout") }),
                      z24.object({
                        type: z24.literal("exit"),
                        exit_code: z24.number()
                      })
                    ])
                  })
                )
              }),
              z24.object({
                type: z24.literal("tool_search_call"),
                id: z24.string(),
                execution: z24.enum(["server", "client"]),
                call_id: z24.string().nullable(),
                status: z24.enum(["in_progress", "completed", "incomplete"]),
                arguments: z24.unknown()
              }),
              z24.object({
                type: z24.literal("tool_search_output"),
                id: z24.string(),
                execution: z24.enum(["server", "client"]),
                call_id: z24.string().nullable(),
                status: z24.enum(["in_progress", "completed", "incomplete"]),
                tools: z24.array(z24.record(z24.string(), jsonValueSchema2.optional()))
              })
            ])
          ).optional(),
          service_tier: z24.string().nullish(),
          incomplete_details: z24.object({ reason: z24.string() }).nullish(),
          usage: z24.object({
            input_tokens: z24.number(),
            input_tokens_details: z24.object({
              cached_tokens: z24.number().nullish(),
              orchestration_input_tokens: z24.number().nullish(),
              orchestration_input_cached_tokens: z24.number().nullish()
            }).nullish(),
            output_tokens: z24.number(),
            output_tokens_details: z24.object({
              reasoning_tokens: z24.number().nullish(),
              orchestration_output_tokens: z24.number().nullish()
            }).nullish()
          }).optional()
        })
      )
    );
    TOP_LOGPROBS_MAX = 20;
    openaiResponsesReasoningModelIds = [
      "o1",
      "o1-2024-12-17",
      "o3",
      "o3-2025-04-16",
      "o3-mini",
      "o3-mini-2025-01-31",
      "o4-mini",
      "o4-mini-2025-04-16",
      "gpt-5",
      "gpt-5-2025-08-07",
      "gpt-5-codex",
      "gpt-5-mini",
      "gpt-5-mini-2025-08-07",
      "gpt-5-nano",
      "gpt-5-nano-2025-08-07",
      "gpt-5-pro",
      "gpt-5-pro-2025-10-06",
      "gpt-5.1",
      "gpt-5.1-chat-latest",
      "gpt-5.1-codex-mini",
      "gpt-5.1-codex",
      "gpt-5.1-codex-max",
      "gpt-5.2",
      "gpt-5.2-chat-latest",
      "gpt-5.2-pro",
      "gpt-5.2-codex",
      "gpt-5.3-chat-latest",
      "gpt-5.3-codex",
      "gpt-5.4",
      "gpt-5.4-2026-03-05",
      "gpt-5.4-mini",
      "gpt-5.4-mini-2026-03-17",
      "gpt-5.4-nano",
      "gpt-5.4-nano-2026-03-17",
      "gpt-5.4-pro",
      "gpt-5.4-pro-2026-03-05",
      "gpt-5.5",
      "gpt-5.5-2026-04-23"
    ];
    openaiResponsesModelIds = [
      "gpt-4.1",
      "gpt-4.1-2025-04-14",
      "gpt-4.1-mini",
      "gpt-4.1-mini-2025-04-14",
      "gpt-4.1-nano",
      "gpt-4.1-nano-2025-04-14",
      "gpt-4o",
      "gpt-4o-2024-05-13",
      "gpt-4o-2024-08-06",
      "gpt-4o-2024-11-20",
      "gpt-4o-audio-preview",
      "gpt-4o-audio-preview-2024-12-17",
      "gpt-4o-search-preview",
      "gpt-4o-search-preview-2025-03-11",
      "gpt-4o-mini-search-preview",
      "gpt-4o-mini-search-preview-2025-03-11",
      "gpt-4o-mini",
      "gpt-4o-mini-2024-07-18",
      "gpt-3.5-turbo-0125",
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-1106",
      "gpt-5-chat-latest",
      ...openaiResponsesReasoningModelIds
    ];
    openaiLanguageModelResponsesOptionsSchema = lazySchema(
      () => zodSchema(
        z25.object({
          /**
           * The ID of the OpenAI Conversation to continue.
           * You must create a conversation first via the OpenAI API.
           * Cannot be used in conjunction with `previousResponseId`.
           * Defaults to `undefined`.
           * @see https://platform.openai.com/docs/api-reference/conversations/create
           */
          conversation: z25.string().nullish(),
          /**
           * The set of extra fields to include in the response (advanced, usually not needed).
           * Example values: 'reasoning.encrypted_content', 'file_search_call.results', 'message.output_text.logprobs'.
           */
          include: z25.array(
            z25.enum([
              "reasoning.encrypted_content",
              // handled internally by default, only needed for unknown reasoning models
              "file_search_call.results",
              "message.output_text.logprobs"
            ])
          ).nullish(),
          /**
           * Instructions for the model.
           * They can be used to change the system or developer message when continuing a conversation using the `previousResponseId` option.
           * Defaults to `undefined`.
           */
          instructions: z25.string().nullish(),
          /**
           * Return the log probabilities of the tokens. Including logprobs will increase
           * the response size and can slow down response times. However, it can
           * be useful to better understand how the model is behaving.
           *
           * Setting to true will return the log probabilities of the tokens that
           * were generated.
           *
           * Setting to a number will return the log probabilities of the top n
           * tokens that were generated.
           *
           * @see https://platform.openai.com/docs/api-reference/responses/create
           * @see https://cookbook.openai.com/examples/using_logprobs
           */
          logprobs: z25.union([z25.boolean(), z25.number().min(1).max(TOP_LOGPROBS_MAX)]).optional(),
          /**
           * The maximum number of total calls to built-in tools that can be processed in a response.
           * This maximum number applies across all built-in tool calls, not per individual tool.
           * Any further attempts to call a tool by the model will be ignored.
           */
          maxToolCalls: z25.number().nullish(),
          /**
           * Additional metadata to store with the generation.
           */
          metadata: z25.any().nullish(),
          /**
           * Whether to use parallel tool calls. Defaults to `true`.
           */
          parallelToolCalls: z25.boolean().nullish(),
          /**
           * The ID of the previous response. You can use it to continue a conversation.
           * Defaults to `undefined`.
           */
          previousResponseId: z25.string().nullish(),
          /**
           * Sets a cache key to tie this prompt to cached prefixes for better caching performance.
           */
          promptCacheKey: z25.string().nullish(),
          /**
           * The retention policy for the prompt cache.
           * - 'in_memory': Default. Standard prompt caching behavior.
           * - '24h': Extended prompt caching that keeps cached prefixes active for up to 24 hours.
           *          Currently only available for 5.1 series models.
           *
           * @default 'in_memory'
           */
          promptCacheRetention: z25.enum(["in_memory", "24h"]).nullish(),
          /**
           * Reasoning effort for reasoning models. Defaults to `medium`. If you use
           * `providerOptions` to set the `reasoningEffort` option, this model setting will be ignored.
           * Valid values: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'
           *
           * The 'none' type for `reasoningEffort` is only available for OpenAI's GPT-5.1
           * models. Also, the 'xhigh' type for `reasoningEffort` is only available for
           * OpenAI's GPT-5.1-Codex-Max model. Setting `reasoningEffort` to 'none' or 'xhigh' with unsupported models will result in
           * an error.
           */
          reasoningEffort: z25.string().nullish(),
          /**
           * Controls reasoning summary output from the model.
           * Set to "auto" to automatically receive the richest level available,
           * or "detailed" for comprehensive summaries.
           */
          reasoningSummary: z25.string().nullish(),
          /**
           * The identifier for safety monitoring and tracking.
           */
          safetyIdentifier: z25.string().nullish(),
          /**
           * Service tier for the request.
           * Set to 'flex' for 50% cheaper processing at the cost of increased latency (available for o3, o4-mini, and gpt-5 models).
           * Set to 'priority' for faster processing with Enterprise access (available for gpt-4, gpt-5, gpt-5-mini, o3, o4-mini; gpt-5-nano is not supported).
           *
           * Defaults to 'auto'.
           */
          serviceTier: z25.enum(["auto", "flex", "priority", "default"]).nullish(),
          /**
           * Whether to store the generation. Defaults to `true`.
           */
          store: z25.boolean().nullish(),
          /**
           * Whether to pass through non-image file types as generic input files.
           *
           * By default, inline file inputs are restricted to images and PDFs.
           * Enable this when the target OpenAI Responses model supports additional
           * file media types, such as text/csv.
           */
          passThroughUnsupportedFiles: z25.boolean().optional(),
          /**
           * Whether to use strict JSON schema validation.
           * Defaults to `true`.
           */
          strictJsonSchema: z25.boolean().nullish(),
          /**
           * Controls the verbosity of the model's responses. Lower values ('low') will result
           * in more concise responses, while higher values ('high') will result in more verbose responses.
           * Valid values: 'low', 'medium', 'high'.
           */
          textVerbosity: z25.enum(["low", "medium", "high"]).nullish(),
          /**
           * Controls output truncation. 'auto' (default) performs truncation automatically;
           * 'disabled' turns truncation off.
           */
          truncation: z25.enum(["auto", "disabled"]).nullish(),
          /**
           * A unique identifier representing your end-user, which can help OpenAI to
           * monitor and detect abuse.
           * Defaults to `undefined`.
           * @see https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids
           */
          user: z25.string().nullish(),
          /**
           * Override the system message mode for this model.
           * - 'system': Use the 'system' role for system messages (default for most models)
           * - 'developer': Use the 'developer' role for system messages (used by reasoning models)
           * - 'remove': Remove system messages entirely
           *
           * If not specified, the mode is automatically determined based on the model.
           */
          systemMessageMode: z25.enum(["system", "developer", "remove"]).optional(),
          /**
           * Force treating this model as a reasoning model.
           *
           * This is useful for "stealth" reasoning models (e.g. via a custom baseURL)
           * where the model ID is not recognized by the SDK's allowlist.
           *
           * When enabled, the SDK applies reasoning-model parameter compatibility rules
           * and defaults `systemMessageMode` to `developer` unless overridden.
           */
          forceReasoning: z25.boolean().optional(),
          /**
           * Enable server-side context management (compaction).
           */
          contextManagement: z25.array(
            z25.object({
              type: z25.literal("compaction"),
              compactThreshold: z25.number()
            })
          ).nullish(),
          /**
           * Restrict the callable tools to a subset while keeping the full tools
           * list intact, so prompt caching is preserved across requests with
           * different allowlists.
           *
           * When set, this overrides the request-level `toolChoice` and emits
           * `tool_choice: { type: "allowed_tools", mode, tools }` on the wire.
           *
           * @see https://developers.openai.com/api/reference/resources/responses/methods/create#(resource)%20responses%20%3E%20(model)%20tool_choice_allowed%20%3E%20(schema)
           */
          allowedTools: z25.object({
            toolNames: z25.array(z25.string()).min(1),
            mode: z25.enum(["auto", "required"]).optional()
          }).optional()
        })
      )
    );
    OpenAIResponsesLanguageModel = class _OpenAIResponsesLanguageModel {
      constructor(modelId, config) {
        this.specificationVersion = "v4";
        this.supportedUrls = {
          "image/*": [/^https?:\/\/.*$/],
          "application/pdf": [/^https?:\/\/.*$/]
        };
        this.modelId = modelId;
        this.config = config;
      }
      static [WORKFLOW_SERIALIZE](model) {
        return serializeModelOptions({
          modelId: model.modelId,
          config: model.config
        });
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _OpenAIResponsesLanguageModel(options.modelId, options.config);
      }
      get provider() {
        return this.config.provider;
      }
      async getArgs({
        maxOutputTokens,
        temperature,
        stopSequences,
        topP,
        topK,
        presencePenalty,
        frequencyPenalty,
        seed,
        prompt,
        reasoning,
        providerOptions,
        tools,
        toolChoice,
        responseFormat
      }) {
        var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
        const warnings = [];
        const modelCapabilities = getOpenAILanguageModelCapabilities(this.modelId);
        if (topK != null) {
          warnings.push({ type: "unsupported", feature: "topK" });
        }
        if (seed != null) {
          warnings.push({ type: "unsupported", feature: "seed" });
        }
        if (presencePenalty != null) {
          warnings.push({ type: "unsupported", feature: "presencePenalty" });
        }
        if (frequencyPenalty != null) {
          warnings.push({ type: "unsupported", feature: "frequencyPenalty" });
        }
        if (stopSequences != null) {
          warnings.push({ type: "unsupported", feature: "stopSequences" });
        }
        const providerOptionsName = this.config.provider.includes("azure") ? "azure" : "openai";
        let openaiOptions = await parseProviderOptions({
          provider: providerOptionsName,
          providerOptions,
          schema: openaiLanguageModelResponsesOptionsSchema
        });
        if (openaiOptions == null && providerOptionsName !== "openai") {
          openaiOptions = await parseProviderOptions({
            provider: "openai",
            providerOptions,
            schema: openaiLanguageModelResponsesOptionsSchema
          });
        }
        const resolvedReasoningEffort = (_a2 = openaiOptions == null ? void 0 : openaiOptions.reasoningEffort) != null ? _a2 : isCustomReasoning(reasoning) ? reasoning : void 0;
        const resolvedReasoningSummary = (openaiOptions == null ? void 0 : openaiOptions.reasoningSummary) !== void 0 ? openaiOptions.reasoningSummary : resolvedReasoningEffort != null && resolvedReasoningEffort !== "none" ? "detailed" : void 0;
        const isReasoningModel = (_b2 = openaiOptions == null ? void 0 : openaiOptions.forceReasoning) != null ? _b2 : modelCapabilities.isReasoningModel;
        if ((openaiOptions == null ? void 0 : openaiOptions.conversation) && (openaiOptions == null ? void 0 : openaiOptions.previousResponseId)) {
          warnings.push({
            type: "unsupported",
            feature: "conversation",
            details: "conversation and previousResponseId cannot be used together"
          });
        }
        const toolNameMapping = createToolNameMapping({
          tools,
          providerToolNames: {
            "openai.code_interpreter": "code_interpreter",
            "openai.file_search": "file_search",
            "openai.image_generation": "image_generation",
            "openai.local_shell": "local_shell",
            "openai.shell": "shell",
            "openai.web_search": "web_search",
            "openai.web_search_preview": "web_search_preview",
            "openai.mcp": "mcp",
            "openai.apply_patch": "apply_patch",
            "openai.tool_search": "tool_search"
          }
        });
        const customProviderToolNames = /* @__PURE__ */ new Set();
        const {
          tools: openaiTools2,
          toolChoice: openaiToolChoice,
          toolWarnings
        } = await prepareResponsesTools({
          tools,
          toolChoice,
          allowedTools: (_c = openaiOptions == null ? void 0 : openaiOptions.allowedTools) != null ? _c : void 0,
          toolNameMapping,
          customProviderToolNames
        });
        const { input, warnings: inputWarnings } = await convertToOpenAIResponsesInput({
          prompt,
          toolNameMapping,
          systemMessageMode: (_d = openaiOptions == null ? void 0 : openaiOptions.systemMessageMode) != null ? _d : isReasoningModel ? "developer" : modelCapabilities.systemMessageMode,
          providerOptionsName,
          fileIdPrefixes: this.config.fileIdPrefixes,
          passThroughUnsupportedFiles: (_e = openaiOptions == null ? void 0 : openaiOptions.passThroughUnsupportedFiles) != null ? _e : false,
          store: (_f = openaiOptions == null ? void 0 : openaiOptions.store) != null ? _f : true,
          hasConversation: (openaiOptions == null ? void 0 : openaiOptions.conversation) != null,
          hasPreviousResponseId: (openaiOptions == null ? void 0 : openaiOptions.previousResponseId) != null,
          hasLocalShellTool: hasOpenAITool("openai.local_shell"),
          hasShellTool: hasOpenAITool("openai.shell"),
          hasApplyPatchTool: hasOpenAITool("openai.apply_patch"),
          customProviderToolNames: customProviderToolNames.size > 0 ? customProviderToolNames : void 0
        });
        warnings.push(...inputWarnings);
        const strictJsonSchema = (_g = openaiOptions == null ? void 0 : openaiOptions.strictJsonSchema) != null ? _g : true;
        let include = openaiOptions == null ? void 0 : openaiOptions.include;
        function addInclude(key) {
          if (include == null) {
            include = [key];
          } else if (!include.includes(key)) {
            include = [...include, key];
          }
        }
        function hasOpenAITool(id) {
          return (tools == null ? void 0 : tools.find((tool2) => tool2.type === "provider" && tool2.id === id)) != null;
        }
        const topLogprobs = typeof (openaiOptions == null ? void 0 : openaiOptions.logprobs) === "number" ? openaiOptions == null ? void 0 : openaiOptions.logprobs : (openaiOptions == null ? void 0 : openaiOptions.logprobs) === true ? TOP_LOGPROBS_MAX : void 0;
        if (topLogprobs) {
          addInclude("message.output_text.logprobs");
        }
        const webSearchToolName = (_h = tools == null ? void 0 : tools.find(
          (tool2) => tool2.type === "provider" && (tool2.id === "openai.web_search" || tool2.id === "openai.web_search_preview")
        )) == null ? void 0 : _h.name;
        if (webSearchToolName) {
          addInclude("web_search_call.action.sources");
        }
        if (hasOpenAITool("openai.code_interpreter")) {
          addInclude("code_interpreter_call.outputs");
        }
        const store = openaiOptions == null ? void 0 : openaiOptions.store;
        if (store === false && isReasoningModel) {
          addInclude("reasoning.encrypted_content");
        }
        const baseArgs = {
          model: this.modelId,
          input,
          temperature,
          top_p: topP,
          max_output_tokens: maxOutputTokens,
          ...((responseFormat == null ? void 0 : responseFormat.type) === "json" || (openaiOptions == null ? void 0 : openaiOptions.textVerbosity)) && {
            text: {
              ...(responseFormat == null ? void 0 : responseFormat.type) === "json" && {
                format: responseFormat.schema != null ? {
                  type: "json_schema",
                  strict: strictJsonSchema,
                  name: (_i = responseFormat.name) != null ? _i : "response",
                  description: responseFormat.description,
                  schema: responseFormat.schema
                } : { type: "json_object" }
              },
              ...(openaiOptions == null ? void 0 : openaiOptions.textVerbosity) && {
                verbosity: openaiOptions.textVerbosity
              }
            }
          },
          // provider options:
          conversation: openaiOptions == null ? void 0 : openaiOptions.conversation,
          max_tool_calls: openaiOptions == null ? void 0 : openaiOptions.maxToolCalls,
          metadata: openaiOptions == null ? void 0 : openaiOptions.metadata,
          parallel_tool_calls: openaiOptions == null ? void 0 : openaiOptions.parallelToolCalls,
          previous_response_id: openaiOptions == null ? void 0 : openaiOptions.previousResponseId,
          store,
          user: openaiOptions == null ? void 0 : openaiOptions.user,
          instructions: openaiOptions == null ? void 0 : openaiOptions.instructions,
          service_tier: openaiOptions == null ? void 0 : openaiOptions.serviceTier,
          include,
          prompt_cache_key: openaiOptions == null ? void 0 : openaiOptions.promptCacheKey,
          prompt_cache_retention: openaiOptions == null ? void 0 : openaiOptions.promptCacheRetention,
          safety_identifier: openaiOptions == null ? void 0 : openaiOptions.safetyIdentifier,
          top_logprobs: topLogprobs,
          truncation: openaiOptions == null ? void 0 : openaiOptions.truncation,
          // context management (server-side compaction):
          ...(openaiOptions == null ? void 0 : openaiOptions.contextManagement) && {
            context_management: openaiOptions.contextManagement.map((cm) => ({
              type: cm.type,
              compact_threshold: cm.compactThreshold
            }))
          },
          // model-specific settings:
          ...isReasoningModel && (resolvedReasoningEffort != null || resolvedReasoningSummary != null) && {
            reasoning: {
              ...resolvedReasoningEffort != null && {
                effort: resolvedReasoningEffort
              },
              ...resolvedReasoningSummary != null && {
                summary: resolvedReasoningSummary
              }
            }
          }
        };
        if (isReasoningModel) {
          if (!(resolvedReasoningEffort === "none" && modelCapabilities.supportsNonReasoningParameters)) {
            if (baseArgs.temperature != null) {
              baseArgs.temperature = void 0;
              warnings.push({
                type: "unsupported",
                feature: "temperature",
                details: "temperature is not supported for reasoning models"
              });
            }
            if (baseArgs.top_p != null) {
              baseArgs.top_p = void 0;
              warnings.push({
                type: "unsupported",
                feature: "topP",
                details: "topP is not supported for reasoning models"
              });
            }
          }
        } else {
          if ((openaiOptions == null ? void 0 : openaiOptions.reasoningEffort) != null) {
            warnings.push({
              type: "unsupported",
              feature: "reasoningEffort",
              details: "reasoningEffort is not supported for non-reasoning models"
            });
          }
          if ((openaiOptions == null ? void 0 : openaiOptions.reasoningSummary) != null) {
            warnings.push({
              type: "unsupported",
              feature: "reasoningSummary",
              details: "reasoningSummary is not supported for non-reasoning models"
            });
          }
        }
        if ((openaiOptions == null ? void 0 : openaiOptions.serviceTier) === "flex" && !modelCapabilities.supportsFlexProcessing) {
          warnings.push({
            type: "unsupported",
            feature: "serviceTier",
            details: "flex processing is only available for o3, o4-mini, and gpt-5 models"
          });
          delete baseArgs.service_tier;
        }
        if ((openaiOptions == null ? void 0 : openaiOptions.serviceTier) === "priority" && !modelCapabilities.supportsPriorityProcessing) {
          warnings.push({
            type: "unsupported",
            feature: "serviceTier",
            details: "priority processing is only available for supported models (gpt-4, gpt-5, gpt-5-mini, o3, o4-mini) and requires Enterprise access. gpt-5-nano is not supported"
          });
          delete baseArgs.service_tier;
        }
        const shellToolEnvType = (_l = (_k = (_j = tools == null ? void 0 : tools.find(
          (tool2) => tool2.type === "provider" && tool2.id === "openai.shell"
        )) == null ? void 0 : _j.args) == null ? void 0 : _k.environment) == null ? void 0 : _l.type;
        const isShellProviderExecuted = shellToolEnvType === "containerAuto" || shellToolEnvType === "containerReference";
        return {
          webSearchToolName,
          args: {
            ...baseArgs,
            tools: openaiTools2,
            tool_choice: openaiToolChoice
          },
          warnings: [...warnings, ...toolWarnings],
          store,
          toolNameMapping,
          providerOptionsName,
          isShellProviderExecuted
        };
      }
      async doGenerate(options) {
        var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D;
        const {
          args: body,
          warnings,
          webSearchToolName,
          toolNameMapping,
          providerOptionsName,
          isShellProviderExecuted
        } = await this.getArgs(options);
        const url = this.config.url({
          path: "/responses",
          modelId: this.modelId
        });
        const approvalRequestIdToDummyToolCallIdFromPrompt = extractApprovalRequestIdToToolCallIdMapping(options.prompt);
        const {
          responseHeaders,
          value: response,
          rawValue: rawResponse
        } = await postJsonToApi({
          url,
          headers: combineHeaders((_b2 = (_a2 = this.config).headers) == null ? void 0 : _b2.call(_a2), options.headers),
          body,
          failedResponseHandler: openaiFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            openaiResponsesResponseSchema
          ),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        if (response.error) {
          throw new APICallError22({
            message: response.error.message,
            url,
            requestBodyValues: body,
            statusCode: 400,
            responseHeaders,
            responseBody: rawResponse,
            isRetryable: false
          });
        }
        const content = [];
        const logprobs = [];
        let hasFunctionCall = false;
        const hostedToolSearchCallIds = [];
        for (const part of response.output) {
          switch (part.type) {
            case "reasoning": {
              if (part.summary.length === 0) {
                part.summary.push({ type: "summary_text", text: "" });
              }
              for (const summary of part.summary) {
                content.push({
                  type: "reasoning",
                  text: summary.text,
                  providerMetadata: {
                    [providerOptionsName]: {
                      itemId: part.id,
                      reasoningEncryptedContent: (_c = part.encrypted_content) != null ? _c : null
                    }
                  }
                });
              }
              break;
            }
            case "image_generation_call": {
              content.push({
                type: "tool-call",
                toolCallId: part.id,
                toolName: toolNameMapping.toCustomToolName("image_generation"),
                input: "{}",
                providerExecuted: true
              });
              content.push({
                type: "tool-result",
                toolCallId: part.id,
                toolName: toolNameMapping.toCustomToolName("image_generation"),
                result: {
                  result: part.result
                }
              });
              break;
            }
            case "tool_search_call": {
              const toolCallId = (_d = part.call_id) != null ? _d : part.id;
              const isHosted = part.execution === "server";
              if (isHosted) {
                hostedToolSearchCallIds.push(toolCallId);
              }
              content.push({
                type: "tool-call",
                toolCallId,
                toolName: toolNameMapping.toCustomToolName("tool_search"),
                input: JSON.stringify({
                  arguments: part.arguments,
                  call_id: part.call_id
                }),
                ...isHosted ? { providerExecuted: true } : {},
                providerMetadata: {
                  [providerOptionsName]: {
                    itemId: part.id
                  }
                }
              });
              break;
            }
            case "tool_search_output": {
              const toolCallId = (_f = (_e = part.call_id) != null ? _e : hostedToolSearchCallIds.shift()) != null ? _f : part.id;
              content.push({
                type: "tool-result",
                toolCallId,
                toolName: toolNameMapping.toCustomToolName("tool_search"),
                result: {
                  tools: part.tools
                },
                providerMetadata: {
                  [providerOptionsName]: {
                    itemId: part.id
                  }
                }
              });
              break;
            }
            case "local_shell_call": {
              content.push({
                type: "tool-call",
                toolCallId: part.call_id,
                toolName: toolNameMapping.toCustomToolName("local_shell"),
                input: JSON.stringify({
                  action: part.action
                }),
                providerMetadata: {
                  [providerOptionsName]: {
                    itemId: part.id
                  }
                }
              });
              break;
            }
            case "shell_call": {
              content.push({
                type: "tool-call",
                toolCallId: part.call_id,
                toolName: toolNameMapping.toCustomToolName("shell"),
                input: JSON.stringify({
                  action: {
                    commands: part.action.commands
                  }
                }),
                ...isShellProviderExecuted && { providerExecuted: true },
                providerMetadata: {
                  [providerOptionsName]: {
                    itemId: part.id
                  }
                }
              });
              break;
            }
            case "shell_call_output": {
              content.push({
                type: "tool-result",
                toolCallId: part.call_id,
                toolName: toolNameMapping.toCustomToolName("shell"),
                result: {
                  output: part.output.map((item) => ({
                    stdout: item.stdout,
                    stderr: item.stderr,
                    outcome: item.outcome.type === "exit" ? {
                      type: "exit",
                      exitCode: item.outcome.exit_code
                    } : { type: "timeout" }
                  }))
                }
              });
              break;
            }
            case "message": {
              for (const contentPart of part.content) {
                if (((_h = (_g = options.providerOptions) == null ? void 0 : _g[providerOptionsName]) == null ? void 0 : _h.logprobs) && contentPart.logprobs) {
                  logprobs.push(contentPart.logprobs);
                }
                const providerMetadata2 = {
                  itemId: part.id,
                  ...part.phase != null && { phase: part.phase },
                  ...contentPart.annotations.length > 0 && {
                    annotations: contentPart.annotations
                  }
                };
                content.push({
                  type: "text",
                  text: contentPart.text,
                  providerMetadata: {
                    [providerOptionsName]: providerMetadata2
                  }
                });
                for (const annotation of contentPart.annotations) {
                  if (annotation.type === "url_citation") {
                    content.push({
                      type: "source",
                      sourceType: "url",
                      id: (_k = (_j = (_i = this.config).generateId) == null ? void 0 : _j.call(_i)) != null ? _k : generateId(),
                      url: annotation.url,
                      title: annotation.title
                    });
                  } else if (annotation.type === "file_citation") {
                    content.push({
                      type: "source",
                      sourceType: "document",
                      id: (_n = (_m = (_l = this.config).generateId) == null ? void 0 : _m.call(_l)) != null ? _n : generateId(),
                      mediaType: "text/plain",
                      title: annotation.filename,
                      filename: annotation.filename,
                      providerMetadata: {
                        [providerOptionsName]: {
                          type: annotation.type,
                          fileId: annotation.file_id,
                          index: annotation.index
                        }
                      }
                    });
                  } else if (annotation.type === "container_file_citation") {
                    content.push({
                      type: "source",
                      sourceType: "document",
                      id: (_q = (_p = (_o = this.config).generateId) == null ? void 0 : _p.call(_o)) != null ? _q : generateId(),
                      mediaType: "text/plain",
                      title: annotation.filename,
                      filename: annotation.filename,
                      providerMetadata: {
                        [providerOptionsName]: {
                          type: annotation.type,
                          fileId: annotation.file_id,
                          containerId: annotation.container_id
                        }
                      }
                    });
                  } else if (annotation.type === "file_path") {
                    content.push({
                      type: "source",
                      sourceType: "document",
                      id: (_t = (_s = (_r = this.config).generateId) == null ? void 0 : _s.call(_r)) != null ? _t : generateId(),
                      mediaType: "application/octet-stream",
                      title: annotation.file_id,
                      filename: annotation.file_id,
                      providerMetadata: {
                        [providerOptionsName]: {
                          type: annotation.type,
                          fileId: annotation.file_id,
                          index: annotation.index
                        }
                      }
                    });
                  }
                }
              }
              break;
            }
            case "function_call": {
              hasFunctionCall = true;
              content.push({
                type: "tool-call",
                toolCallId: part.call_id,
                toolName: part.name,
                input: part.arguments,
                providerMetadata: {
                  [providerOptionsName]: {
                    itemId: part.id,
                    ...part.namespace != null && { namespace: part.namespace }
                  }
                }
              });
              break;
            }
            case "custom_tool_call": {
              hasFunctionCall = true;
              const toolName = toolNameMapping.toCustomToolName(part.name);
              content.push({
                type: "tool-call",
                toolCallId: part.call_id,
                toolName,
                input: JSON.stringify(part.input),
                providerMetadata: {
                  [providerOptionsName]: {
                    itemId: part.id
                  }
                }
              });
              break;
            }
            case "web_search_call": {
              content.push({
                type: "tool-call",
                toolCallId: part.id,
                toolName: toolNameMapping.toCustomToolName(
                  webSearchToolName != null ? webSearchToolName : "web_search"
                ),
                input: JSON.stringify({}),
                providerExecuted: true
              });
              content.push({
                type: "tool-result",
                toolCallId: part.id,
                toolName: toolNameMapping.toCustomToolName(
                  webSearchToolName != null ? webSearchToolName : "web_search"
                ),
                result: mapWebSearchOutput(part.action)
              });
              break;
            }
            case "mcp_call": {
              const toolCallId = part.approval_request_id != null ? (_u = approvalRequestIdToDummyToolCallIdFromPrompt[part.approval_request_id]) != null ? _u : part.id : part.id;
              const toolName = `mcp.${part.name}`;
              content.push({
                type: "tool-call",
                toolCallId,
                toolName,
                input: part.arguments,
                providerExecuted: true,
                dynamic: true
              });
              content.push({
                type: "tool-result",
                toolCallId,
                toolName,
                result: {
                  type: "call",
                  serverLabel: part.server_label,
                  name: part.name,
                  arguments: part.arguments,
                  ...part.output != null ? { output: part.output } : {},
                  ...part.error != null ? { error: part.error } : {}
                },
                providerMetadata: {
                  [providerOptionsName]: {
                    itemId: part.id
                  }
                }
              });
              break;
            }
            case "mcp_list_tools": {
              break;
            }
            case "mcp_approval_request": {
              const approvalRequestId = (_v = part.approval_request_id) != null ? _v : part.id;
              const dummyToolCallId = (_y = (_x = (_w = this.config).generateId) == null ? void 0 : _x.call(_w)) != null ? _y : generateId();
              const toolName = `mcp.${part.name}`;
              content.push({
                type: "tool-call",
                toolCallId: dummyToolCallId,
                toolName,
                input: part.arguments,
                providerExecuted: true,
                dynamic: true
              });
              content.push({
                type: "tool-approval-request",
                approvalId: approvalRequestId,
                toolCallId: dummyToolCallId
              });
              break;
            }
            case "computer_call": {
              content.push({
                type: "tool-call",
                toolCallId: part.id,
                toolName: toolNameMapping.toCustomToolName("computer_use"),
                input: "",
                providerExecuted: true
              });
              content.push({
                type: "tool-result",
                toolCallId: part.id,
                toolName: toolNameMapping.toCustomToolName("computer_use"),
                result: {
                  type: "computer_use_tool_result",
                  status: part.status || "completed"
                }
              });
              break;
            }
            case "file_search_call": {
              content.push({
                type: "tool-call",
                toolCallId: part.id,
                toolName: toolNameMapping.toCustomToolName("file_search"),
                input: "{}",
                providerExecuted: true
              });
              content.push({
                type: "tool-result",
                toolCallId: part.id,
                toolName: toolNameMapping.toCustomToolName("file_search"),
                result: {
                  queries: part.queries,
                  results: (_A = (_z = part.results) == null ? void 0 : _z.map((result) => ({
                    attributes: result.attributes,
                    fileId: result.file_id,
                    filename: result.filename,
                    score: result.score,
                    text: result.text
                  }))) != null ? _A : null
                }
              });
              break;
            }
            case "code_interpreter_call": {
              content.push({
                type: "tool-call",
                toolCallId: part.id,
                toolName: toolNameMapping.toCustomToolName("code_interpreter"),
                input: JSON.stringify({
                  code: part.code,
                  containerId: part.container_id
                }),
                providerExecuted: true
              });
              content.push({
                type: "tool-result",
                toolCallId: part.id,
                toolName: toolNameMapping.toCustomToolName("code_interpreter"),
                result: {
                  outputs: part.outputs
                }
              });
              break;
            }
            case "apply_patch_call": {
              content.push({
                type: "tool-call",
                toolCallId: part.call_id,
                toolName: toolNameMapping.toCustomToolName("apply_patch"),
                input: JSON.stringify({
                  callId: part.call_id,
                  operation: part.operation
                }),
                providerMetadata: {
                  [providerOptionsName]: {
                    itemId: part.id
                  }
                }
              });
              break;
            }
            case "compaction": {
              content.push({
                type: "custom",
                kind: "openai.compaction",
                providerMetadata: {
                  [providerOptionsName]: {
                    type: "compaction",
                    itemId: part.id,
                    encryptedContent: part.encrypted_content
                  }
                }
              });
              break;
            }
          }
        }
        const providerMetadata = {
          [providerOptionsName]: {
            responseId: response.id,
            ...logprobs.length > 0 ? { logprobs } : {},
            ...typeof response.service_tier === "string" ? { serviceTier: response.service_tier } : {}
          }
        };
        const usage = response.usage;
        return {
          content,
          finishReason: {
            unified: mapOpenAIResponseFinishReason({
              finishReason: (_B = response.incomplete_details) == null ? void 0 : _B.reason,
              hasFunctionCall
            }),
            raw: (_D = (_C = response.incomplete_details) == null ? void 0 : _C.reason) != null ? _D : void 0
          },
          usage: convertOpenAIResponsesUsage(usage),
          request: { body },
          response: {
            id: response.id,
            timestamp: new Date(response.created_at * 1e3),
            modelId: response.model,
            headers: responseHeaders,
            body: rawResponse
          },
          providerMetadata,
          warnings
        };
      }
      async doStream(options) {
        var _a2, _b2;
        const {
          args: body,
          warnings,
          webSearchToolName,
          toolNameMapping,
          store,
          providerOptionsName,
          isShellProviderExecuted
        } = await this.getArgs(options);
        const url = this.config.url({
          path: "/responses",
          modelId: this.modelId
        });
        const { responseHeaders, value: response } = await postJsonToApi({
          url,
          headers: combineHeaders((_b2 = (_a2 = this.config).headers) == null ? void 0 : _b2.call(_a2), options.headers),
          body: {
            ...body,
            stream: true
          },
          failedResponseHandler: openaiFailedResponseHandler,
          successfulResponseHandler: createEventSourceResponseHandler(
            openaiResponsesChunkSchema
          ),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        const checkedResponse = await throwIfOpenAIStreamErrorBeforeOutput({
          stream: response,
          getError: (chunk) => isErrorChunk(chunk) || isResponseFailedChunk(chunk) && chunk.response.error != null ? chunk : void 0,
          isOutputChunk: isResponseOutputChunk,
          url,
          requestBodyValues: body,
          responseHeaders
        });
        const self = this;
        const approvalRequestIdToDummyToolCallIdFromPrompt = extractApprovalRequestIdToToolCallIdMapping(options.prompt);
        const approvalRequestIdToDummyToolCallIdFromStream = /* @__PURE__ */ new Map();
        let finishReason = {
          unified: "other",
          raw: void 0
        };
        let usage = void 0;
        const logprobs = [];
        let responseId = null;
        const ongoingToolCalls = {};
        const ongoingAnnotations = [];
        let activeMessagePhase;
        let hasFunctionCall = false;
        const activeReasoning = {};
        let serviceTier;
        const hostedToolSearchCallIds = [];
        let encounteredStreamError = false;
        const result = {
          stream: checkedResponse.pipeThrough(
            new TransformStream({
              start(controller) {
                controller.enqueue({ type: "stream-start", warnings });
              },
              transform(chunk, controller) {
                var _a22, _b22, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L;
                if (options.includeRawChunks) {
                  controller.enqueue({ type: "raw", rawValue: chunk.rawValue });
                }
                if (!chunk.success) {
                  finishReason = { unified: "error", raw: void 0 };
                  controller.enqueue({ type: "error", error: chunk.error });
                  return;
                }
                const value = chunk.value;
                if (isResponseOutputItemAddedChunk(value)) {
                  if (value.item.type === "function_call") {
                    ongoingToolCalls[value.output_index] = {
                      toolName: value.item.name,
                      toolCallId: value.item.call_id
                    };
                    controller.enqueue({
                      type: "tool-input-start",
                      id: value.item.call_id,
                      toolName: value.item.name
                    });
                  } else if (value.item.type === "custom_tool_call") {
                    const toolName = toolNameMapping.toCustomToolName(
                      value.item.name
                    );
                    ongoingToolCalls[value.output_index] = {
                      toolName,
                      toolCallId: value.item.call_id
                    };
                    controller.enqueue({
                      type: "tool-input-start",
                      id: value.item.call_id,
                      toolName
                    });
                  } else if (value.item.type === "web_search_call") {
                    ongoingToolCalls[value.output_index] = {
                      toolName: toolNameMapping.toCustomToolName(
                        webSearchToolName != null ? webSearchToolName : "web_search"
                      ),
                      toolCallId: value.item.id
                    };
                    controller.enqueue({
                      type: "tool-input-start",
                      id: value.item.id,
                      toolName: toolNameMapping.toCustomToolName(
                        webSearchToolName != null ? webSearchToolName : "web_search"
                      ),
                      providerExecuted: true
                    });
                    controller.enqueue({
                      type: "tool-input-end",
                      id: value.item.id
                    });
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: value.item.id,
                      toolName: toolNameMapping.toCustomToolName(
                        webSearchToolName != null ? webSearchToolName : "web_search"
                      ),
                      input: JSON.stringify({}),
                      providerExecuted: true
                    });
                  } else if (value.item.type === "computer_call") {
                    ongoingToolCalls[value.output_index] = {
                      toolName: toolNameMapping.toCustomToolName("computer_use"),
                      toolCallId: value.item.id
                    };
                    controller.enqueue({
                      type: "tool-input-start",
                      id: value.item.id,
                      toolName: toolNameMapping.toCustomToolName("computer_use"),
                      providerExecuted: true
                    });
                  } else if (value.item.type === "code_interpreter_call") {
                    ongoingToolCalls[value.output_index] = {
                      toolName: toolNameMapping.toCustomToolName("code_interpreter"),
                      toolCallId: value.item.id,
                      codeInterpreter: {
                        containerId: value.item.container_id
                      }
                    };
                    controller.enqueue({
                      type: "tool-input-start",
                      id: value.item.id,
                      toolName: toolNameMapping.toCustomToolName("code_interpreter"),
                      providerExecuted: true
                    });
                    controller.enqueue({
                      type: "tool-input-delta",
                      id: value.item.id,
                      delta: `{"containerId":"${value.item.container_id}","code":"`
                    });
                  } else if (value.item.type === "file_search_call") {
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: value.item.id,
                      toolName: toolNameMapping.toCustomToolName("file_search"),
                      input: "{}",
                      providerExecuted: true
                    });
                  } else if (value.item.type === "image_generation_call") {
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: value.item.id,
                      toolName: toolNameMapping.toCustomToolName("image_generation"),
                      input: "{}",
                      providerExecuted: true
                    });
                  } else if (value.item.type === "tool_search_call") {
                    const toolCallId = value.item.id;
                    const toolName = toolNameMapping.toCustomToolName("tool_search");
                    const isHosted = value.item.execution === "server";
                    ongoingToolCalls[value.output_index] = {
                      toolName,
                      toolCallId,
                      toolSearchExecution: (_a22 = value.item.execution) != null ? _a22 : "server"
                    };
                    if (isHosted) {
                      controller.enqueue({
                        type: "tool-input-start",
                        id: toolCallId,
                        toolName,
                        providerExecuted: true
                      });
                    }
                  } else if (value.item.type === "tool_search_output") {
                  } else if (value.item.type === "mcp_call" || value.item.type === "mcp_list_tools" || value.item.type === "mcp_approval_request") {
                  } else if (value.item.type === "apply_patch_call") {
                    const { call_id: callId, operation } = value.item;
                    ongoingToolCalls[value.output_index] = {
                      toolName: toolNameMapping.toCustomToolName("apply_patch"),
                      toolCallId: callId,
                      applyPatch: {
                        // delete_file doesn't have diff
                        hasDiff: operation.type === "delete_file",
                        endEmitted: operation.type === "delete_file"
                      }
                    };
                    controller.enqueue({
                      type: "tool-input-start",
                      id: callId,
                      toolName: toolNameMapping.toCustomToolName("apply_patch")
                    });
                    if (operation.type === "delete_file") {
                      const inputString = JSON.stringify({
                        callId,
                        operation
                      });
                      controller.enqueue({
                        type: "tool-input-delta",
                        id: callId,
                        delta: inputString
                      });
                      controller.enqueue({
                        type: "tool-input-end",
                        id: callId
                      });
                    } else {
                      controller.enqueue({
                        type: "tool-input-delta",
                        id: callId,
                        delta: `{"callId":"${escapeJSONDelta(callId)}","operation":{"type":"${escapeJSONDelta(operation.type)}","path":"${escapeJSONDelta(operation.path)}","diff":"`
                      });
                    }
                  } else if (value.item.type === "shell_call") {
                    ongoingToolCalls[value.output_index] = {
                      toolName: toolNameMapping.toCustomToolName("shell"),
                      toolCallId: value.item.call_id
                    };
                  } else if (value.item.type === "shell_call_output") {
                  } else if (value.item.type === "message") {
                    ongoingAnnotations.splice(0, ongoingAnnotations.length);
                    activeMessagePhase = (_b22 = value.item.phase) != null ? _b22 : void 0;
                    controller.enqueue({
                      type: "text-start",
                      id: value.item.id,
                      providerMetadata: {
                        [providerOptionsName]: {
                          itemId: value.item.id,
                          ...value.item.phase != null && {
                            phase: value.item.phase
                          }
                        }
                      }
                    });
                  } else if (isResponseOutputItemAddedChunk(value) && value.item.type === "reasoning") {
                    activeReasoning[value.item.id] = {
                      encryptedContent: value.item.encrypted_content,
                      summaryParts: { 0: "active" }
                    };
                    controller.enqueue({
                      type: "reasoning-start",
                      id: `${value.item.id}:0`,
                      providerMetadata: {
                        [providerOptionsName]: {
                          itemId: value.item.id,
                          reasoningEncryptedContent: (_c = value.item.encrypted_content) != null ? _c : null
                        }
                      }
                    });
                  }
                } else if (isResponseOutputItemDoneChunk(value)) {
                  if (value.item.type === "message") {
                    const phase = (_d = value.item.phase) != null ? _d : activeMessagePhase;
                    activeMessagePhase = void 0;
                    controller.enqueue({
                      type: "text-end",
                      id: value.item.id,
                      providerMetadata: {
                        [providerOptionsName]: {
                          itemId: value.item.id,
                          ...phase != null && { phase },
                          ...ongoingAnnotations.length > 0 && {
                            annotations: ongoingAnnotations
                          }
                        }
                      }
                    });
                  } else if (value.item.type === "function_call") {
                    ongoingToolCalls[value.output_index] = void 0;
                    hasFunctionCall = true;
                    controller.enqueue({
                      type: "tool-input-end",
                      id: value.item.call_id,
                      ...value.item.namespace != null && {
                        providerMetadata: {
                          [providerOptionsName]: {
                            namespace: value.item.namespace
                          }
                        }
                      }
                    });
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: value.item.call_id,
                      toolName: value.item.name,
                      input: value.item.arguments,
                      providerMetadata: {
                        [providerOptionsName]: {
                          itemId: value.item.id,
                          ...value.item.namespace != null && {
                            namespace: value.item.namespace
                          }
                        }
                      }
                    });
                  } else if (value.item.type === "custom_tool_call") {
                    ongoingToolCalls[value.output_index] = void 0;
                    hasFunctionCall = true;
                    const toolName = toolNameMapping.toCustomToolName(
                      value.item.name
                    );
                    controller.enqueue({
                      type: "tool-input-end",
                      id: value.item.call_id
                    });
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: value.item.call_id,
                      toolName,
                      input: JSON.stringify(value.item.input),
                      providerMetadata: {
                        [providerOptionsName]: {
                          itemId: value.item.id
                        }
                      }
                    });
                  } else if (value.item.type === "web_search_call") {
                    ongoingToolCalls[value.output_index] = void 0;
                    controller.enqueue({
                      type: "tool-result",
                      toolCallId: value.item.id,
                      toolName: toolNameMapping.toCustomToolName(
                        webSearchToolName != null ? webSearchToolName : "web_search"
                      ),
                      result: mapWebSearchOutput(value.item.action)
                    });
                  } else if (value.item.type === "computer_call") {
                    ongoingToolCalls[value.output_index] = void 0;
                    controller.enqueue({
                      type: "tool-input-end",
                      id: value.item.id
                    });
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: value.item.id,
                      toolName: toolNameMapping.toCustomToolName("computer_use"),
                      input: "",
                      providerExecuted: true
                    });
                    controller.enqueue({
                      type: "tool-result",
                      toolCallId: value.item.id,
                      toolName: toolNameMapping.toCustomToolName("computer_use"),
                      result: {
                        type: "computer_use_tool_result",
                        status: value.item.status || "completed"
                      }
                    });
                  } else if (value.item.type === "file_search_call") {
                    ongoingToolCalls[value.output_index] = void 0;
                    controller.enqueue({
                      type: "tool-result",
                      toolCallId: value.item.id,
                      toolName: toolNameMapping.toCustomToolName("file_search"),
                      result: {
                        queries: value.item.queries,
                        results: (_f = (_e = value.item.results) == null ? void 0 : _e.map((result2) => ({
                          attributes: result2.attributes,
                          fileId: result2.file_id,
                          filename: result2.filename,
                          score: result2.score,
                          text: result2.text
                        }))) != null ? _f : null
                      }
                    });
                  } else if (value.item.type === "code_interpreter_call") {
                    ongoingToolCalls[value.output_index] = void 0;
                    controller.enqueue({
                      type: "tool-result",
                      toolCallId: value.item.id,
                      toolName: toolNameMapping.toCustomToolName("code_interpreter"),
                      result: {
                        outputs: value.item.outputs
                      }
                    });
                  } else if (value.item.type === "image_generation_call") {
                    controller.enqueue({
                      type: "tool-result",
                      toolCallId: value.item.id,
                      toolName: toolNameMapping.toCustomToolName("image_generation"),
                      result: {
                        result: value.item.result
                      }
                    });
                  } else if (value.item.type === "tool_search_call") {
                    const toolCall = ongoingToolCalls[value.output_index];
                    const isHosted = value.item.execution === "server";
                    if (toolCall != null) {
                      const toolCallId = isHosted ? toolCall.toolCallId : (_g = value.item.call_id) != null ? _g : value.item.id;
                      if (isHosted) {
                        hostedToolSearchCallIds.push(toolCallId);
                      } else {
                        controller.enqueue({
                          type: "tool-input-start",
                          id: toolCallId,
                          toolName: toolCall.toolName
                        });
                      }
                      controller.enqueue({
                        type: "tool-input-end",
                        id: toolCallId
                      });
                      controller.enqueue({
                        type: "tool-call",
                        toolCallId,
                        toolName: toolCall.toolName,
                        input: JSON.stringify({
                          arguments: value.item.arguments,
                          call_id: isHosted ? null : toolCallId
                        }),
                        ...isHosted ? { providerExecuted: true } : {},
                        providerMetadata: {
                          [providerOptionsName]: {
                            itemId: value.item.id
                          }
                        }
                      });
                    }
                    ongoingToolCalls[value.output_index] = void 0;
                  } else if (value.item.type === "tool_search_output") {
                    const toolCallId = (_i = (_h = value.item.call_id) != null ? _h : hostedToolSearchCallIds.shift()) != null ? _i : value.item.id;
                    controller.enqueue({
                      type: "tool-result",
                      toolCallId,
                      toolName: toolNameMapping.toCustomToolName("tool_search"),
                      result: {
                        tools: value.item.tools
                      },
                      providerMetadata: {
                        [providerOptionsName]: {
                          itemId: value.item.id
                        }
                      }
                    });
                  } else if (value.item.type === "mcp_call") {
                    ongoingToolCalls[value.output_index] = void 0;
                    const approvalRequestId = (_j = value.item.approval_request_id) != null ? _j : void 0;
                    const aliasedToolCallId = approvalRequestId != null ? (_l = (_k = approvalRequestIdToDummyToolCallIdFromStream.get(
                      approvalRequestId
                    )) != null ? _k : approvalRequestIdToDummyToolCallIdFromPrompt[approvalRequestId]) != null ? _l : value.item.id : value.item.id;
                    const toolName = `mcp.${value.item.name}`;
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: aliasedToolCallId,
                      toolName,
                      input: value.item.arguments,
                      providerExecuted: true,
                      dynamic: true
                    });
                    controller.enqueue({
                      type: "tool-result",
                      toolCallId: aliasedToolCallId,
                      toolName,
                      result: {
                        type: "call",
                        serverLabel: value.item.server_label,
                        name: value.item.name,
                        arguments: value.item.arguments,
                        ...value.item.output != null ? { output: value.item.output } : {},
                        ...value.item.error != null ? { error: value.item.error } : {}
                      },
                      providerMetadata: {
                        [providerOptionsName]: {
                          itemId: value.item.id
                        }
                      }
                    });
                  } else if (value.item.type === "mcp_list_tools") {
                    ongoingToolCalls[value.output_index] = void 0;
                  } else if (value.item.type === "apply_patch_call") {
                    const toolCall = ongoingToolCalls[value.output_index];
                    if ((toolCall == null ? void 0 : toolCall.applyPatch) && !toolCall.applyPatch.endEmitted && value.item.operation.type !== "delete_file") {
                      if (!toolCall.applyPatch.hasDiff) {
                        controller.enqueue({
                          type: "tool-input-delta",
                          id: toolCall.toolCallId,
                          delta: escapeJSONDelta(value.item.operation.diff)
                        });
                      }
                      controller.enqueue({
                        type: "tool-input-delta",
                        id: toolCall.toolCallId,
                        delta: '"}}'
                      });
                      controller.enqueue({
                        type: "tool-input-end",
                        id: toolCall.toolCallId
                      });
                      toolCall.applyPatch.endEmitted = true;
                    }
                    if (toolCall && value.item.status === "completed") {
                      controller.enqueue({
                        type: "tool-call",
                        toolCallId: toolCall.toolCallId,
                        toolName: toolNameMapping.toCustomToolName("apply_patch"),
                        input: JSON.stringify({
                          callId: value.item.call_id,
                          operation: value.item.operation
                        }),
                        providerMetadata: {
                          [providerOptionsName]: {
                            itemId: value.item.id
                          }
                        }
                      });
                    }
                    ongoingToolCalls[value.output_index] = void 0;
                  } else if (value.item.type === "mcp_approval_request") {
                    ongoingToolCalls[value.output_index] = void 0;
                    const dummyToolCallId = (_o = (_n = (_m = self.config).generateId) == null ? void 0 : _n.call(_m)) != null ? _o : generateId();
                    const approvalRequestId = (_p = value.item.approval_request_id) != null ? _p : value.item.id;
                    approvalRequestIdToDummyToolCallIdFromStream.set(
                      approvalRequestId,
                      dummyToolCallId
                    );
                    const toolName = `mcp.${value.item.name}`;
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: dummyToolCallId,
                      toolName,
                      input: value.item.arguments,
                      providerExecuted: true,
                      dynamic: true
                    });
                    controller.enqueue({
                      type: "tool-approval-request",
                      approvalId: approvalRequestId,
                      toolCallId: dummyToolCallId
                    });
                  } else if (value.item.type === "local_shell_call") {
                    ongoingToolCalls[value.output_index] = void 0;
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: value.item.call_id,
                      toolName: toolNameMapping.toCustomToolName("local_shell"),
                      input: JSON.stringify({
                        action: {
                          type: "exec",
                          command: value.item.action.command,
                          timeoutMs: value.item.action.timeout_ms,
                          user: value.item.action.user,
                          workingDirectory: value.item.action.working_directory,
                          env: value.item.action.env
                        }
                      }),
                      providerMetadata: {
                        [providerOptionsName]: { itemId: value.item.id }
                      }
                    });
                  } else if (value.item.type === "shell_call") {
                    ongoingToolCalls[value.output_index] = void 0;
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: value.item.call_id,
                      toolName: toolNameMapping.toCustomToolName("shell"),
                      input: JSON.stringify({
                        action: {
                          commands: value.item.action.commands
                        }
                      }),
                      ...isShellProviderExecuted && {
                        providerExecuted: true
                      },
                      providerMetadata: {
                        [providerOptionsName]: { itemId: value.item.id }
                      }
                    });
                  } else if (value.item.type === "shell_call_output") {
                    controller.enqueue({
                      type: "tool-result",
                      toolCallId: value.item.call_id,
                      toolName: toolNameMapping.toCustomToolName("shell"),
                      result: {
                        output: value.item.output.map(
                          (item) => ({
                            stdout: item.stdout,
                            stderr: item.stderr,
                            outcome: item.outcome.type === "exit" ? {
                              type: "exit",
                              exitCode: item.outcome.exit_code
                            } : { type: "timeout" }
                          })
                        )
                      }
                    });
                  } else if (value.item.type === "reasoning") {
                    const activeReasoningPart = activeReasoning[value.item.id];
                    const summaryPartIndices = Object.entries(
                      activeReasoningPart.summaryParts
                    ).filter(
                      ([_, status]) => status === "active" || status === "can-conclude"
                    ).map(([summaryIndex]) => summaryIndex);
                    for (const summaryIndex of summaryPartIndices) {
                      controller.enqueue({
                        type: "reasoning-end",
                        id: `${value.item.id}:${summaryIndex}`,
                        providerMetadata: {
                          [providerOptionsName]: {
                            itemId: value.item.id,
                            reasoningEncryptedContent: (_q = value.item.encrypted_content) != null ? _q : null
                          }
                        }
                      });
                    }
                    delete activeReasoning[value.item.id];
                  } else if (value.item.type === "compaction") {
                    controller.enqueue({
                      type: "custom",
                      kind: "openai.compaction",
                      providerMetadata: {
                        [providerOptionsName]: {
                          type: "compaction",
                          itemId: value.item.id,
                          encryptedContent: value.item.encrypted_content
                        }
                      }
                    });
                  }
                } else if (isResponseFunctionCallArgumentsDeltaChunk(value)) {
                  const toolCall = ongoingToolCalls[value.output_index];
                  if (toolCall != null) {
                    controller.enqueue({
                      type: "tool-input-delta",
                      id: toolCall.toolCallId,
                      delta: value.delta
                    });
                  }
                } else if (isResponseCustomToolCallInputDeltaChunk(value)) {
                  const toolCall = ongoingToolCalls[value.output_index];
                  if (toolCall != null) {
                    controller.enqueue({
                      type: "tool-input-delta",
                      id: toolCall.toolCallId,
                      delta: value.delta
                    });
                  }
                } else if (isResponseApplyPatchCallOperationDiffDeltaChunk(value)) {
                  const toolCall = ongoingToolCalls[value.output_index];
                  if (toolCall == null ? void 0 : toolCall.applyPatch) {
                    controller.enqueue({
                      type: "tool-input-delta",
                      id: toolCall.toolCallId,
                      delta: escapeJSONDelta(value.delta)
                    });
                    toolCall.applyPatch.hasDiff = true;
                  }
                } else if (isResponseApplyPatchCallOperationDiffDoneChunk(value)) {
                  const toolCall = ongoingToolCalls[value.output_index];
                  if ((toolCall == null ? void 0 : toolCall.applyPatch) && !toolCall.applyPatch.endEmitted) {
                    if (!toolCall.applyPatch.hasDiff) {
                      controller.enqueue({
                        type: "tool-input-delta",
                        id: toolCall.toolCallId,
                        delta: escapeJSONDelta(value.diff)
                      });
                      toolCall.applyPatch.hasDiff = true;
                    }
                    controller.enqueue({
                      type: "tool-input-delta",
                      id: toolCall.toolCallId,
                      delta: '"}}'
                    });
                    controller.enqueue({
                      type: "tool-input-end",
                      id: toolCall.toolCallId
                    });
                    toolCall.applyPatch.endEmitted = true;
                  }
                } else if (isResponseImageGenerationCallPartialImageChunk(value)) {
                  controller.enqueue({
                    type: "tool-result",
                    toolCallId: value.item_id,
                    toolName: toolNameMapping.toCustomToolName("image_generation"),
                    result: {
                      result: value.partial_image_b64
                    },
                    preliminary: true
                  });
                } else if (isResponseCodeInterpreterCallCodeDeltaChunk(value)) {
                  const toolCall = ongoingToolCalls[value.output_index];
                  if (toolCall != null) {
                    controller.enqueue({
                      type: "tool-input-delta",
                      id: toolCall.toolCallId,
                      delta: escapeJSONDelta(value.delta)
                    });
                  }
                } else if (isResponseCodeInterpreterCallCodeDoneChunk(value)) {
                  const toolCall = ongoingToolCalls[value.output_index];
                  if (toolCall != null) {
                    controller.enqueue({
                      type: "tool-input-delta",
                      id: toolCall.toolCallId,
                      delta: '"}'
                    });
                    controller.enqueue({
                      type: "tool-input-end",
                      id: toolCall.toolCallId
                    });
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: toolCall.toolCallId,
                      toolName: toolNameMapping.toCustomToolName("code_interpreter"),
                      input: JSON.stringify({
                        code: value.code,
                        containerId: toolCall.codeInterpreter.containerId
                      }),
                      providerExecuted: true
                    });
                  }
                } else if (isResponseCreatedChunk(value)) {
                  responseId = value.response.id;
                  controller.enqueue({
                    type: "response-metadata",
                    id: value.response.id,
                    timestamp: new Date(value.response.created_at * 1e3),
                    modelId: value.response.model
                  });
                } else if (isTextDeltaChunk(value)) {
                  controller.enqueue({
                    type: "text-delta",
                    id: value.item_id,
                    delta: value.delta
                  });
                  if (((_s = (_r = options.providerOptions) == null ? void 0 : _r[providerOptionsName]) == null ? void 0 : _s.logprobs) && value.logprobs) {
                    logprobs.push(value.logprobs);
                  }
                } else if (value.type === "response.reasoning_summary_part.added") {
                  if (value.summary_index > 0) {
                    const activeReasoningPart = activeReasoning[value.item_id];
                    activeReasoningPart.summaryParts[value.summary_index] = "active";
                    for (const summaryIndex of Object.keys(
                      activeReasoningPart.summaryParts
                    )) {
                      if (activeReasoningPart.summaryParts[summaryIndex] === "can-conclude") {
                        controller.enqueue({
                          type: "reasoning-end",
                          id: `${value.item_id}:${summaryIndex}`,
                          providerMetadata: {
                            [providerOptionsName]: {
                              itemId: value.item_id
                            }
                          }
                        });
                        activeReasoningPart.summaryParts[summaryIndex] = "concluded";
                      }
                    }
                    controller.enqueue({
                      type: "reasoning-start",
                      id: `${value.item_id}:${value.summary_index}`,
                      providerMetadata: {
                        [providerOptionsName]: {
                          itemId: value.item_id,
                          reasoningEncryptedContent: (_u = (_t = activeReasoning[value.item_id]) == null ? void 0 : _t.encryptedContent) != null ? _u : null
                        }
                      }
                    });
                  }
                } else if (value.type === "response.reasoning_summary_text.delta") {
                  controller.enqueue({
                    type: "reasoning-delta",
                    id: `${value.item_id}:${value.summary_index}`,
                    delta: value.delta,
                    providerMetadata: {
                      [providerOptionsName]: {
                        itemId: value.item_id
                      }
                    }
                  });
                } else if (value.type === "response.reasoning_summary_part.done") {
                  if (store) {
                    controller.enqueue({
                      type: "reasoning-end",
                      id: `${value.item_id}:${value.summary_index}`,
                      providerMetadata: {
                        [providerOptionsName]: {
                          itemId: value.item_id
                        }
                      }
                    });
                    activeReasoning[value.item_id].summaryParts[value.summary_index] = "concluded";
                  } else {
                    activeReasoning[value.item_id].summaryParts[value.summary_index] = "can-conclude";
                  }
                } else if (isResponseFinishedChunk(value)) {
                  finishReason = {
                    unified: mapOpenAIResponseFinishReason({
                      finishReason: (_v = value.response.incomplete_details) == null ? void 0 : _v.reason,
                      hasFunctionCall
                    }),
                    raw: (_x = (_w = value.response.incomplete_details) == null ? void 0 : _w.reason) != null ? _x : void 0
                  };
                  usage = value.response.usage;
                  if (typeof value.response.service_tier === "string") {
                    serviceTier = value.response.service_tier;
                  }
                } else if (isResponseFailedChunk(value)) {
                  const incompleteReason = (_y = value.response.incomplete_details) == null ? void 0 : _y.reason;
                  finishReason = {
                    unified: incompleteReason ? mapOpenAIResponseFinishReason({
                      finishReason: incompleteReason,
                      hasFunctionCall
                    }) : "error",
                    raw: incompleteReason != null ? incompleteReason : "error"
                  };
                  usage = (_z = value.response.usage) != null ? _z : void 0;
                  if (!encounteredStreamError && value.response.error != null) {
                    encounteredStreamError = true;
                    controller.enqueue({
                      type: "error",
                      error: {
                        type: "response.failed",
                        sequence_number: value.sequence_number,
                        response: {
                          error: value.response.error,
                          incomplete_details: value.response.incomplete_details,
                          service_tier: value.response.service_tier
                        }
                      }
                    });
                  }
                } else if (isResponseAnnotationAddedChunk(value)) {
                  ongoingAnnotations.push(value.annotation);
                  if (value.annotation.type === "url_citation") {
                    controller.enqueue({
                      type: "source",
                      sourceType: "url",
                      id: (_C = (_B = (_A = self.config).generateId) == null ? void 0 : _B.call(_A)) != null ? _C : generateId(),
                      url: value.annotation.url,
                      title: value.annotation.title
                    });
                  } else if (value.annotation.type === "file_citation") {
                    controller.enqueue({
                      type: "source",
                      sourceType: "document",
                      id: (_F = (_E = (_D = self.config).generateId) == null ? void 0 : _E.call(_D)) != null ? _F : generateId(),
                      mediaType: "text/plain",
                      title: value.annotation.filename,
                      filename: value.annotation.filename,
                      providerMetadata: {
                        [providerOptionsName]: {
                          type: value.annotation.type,
                          fileId: value.annotation.file_id,
                          index: value.annotation.index
                        }
                      }
                    });
                  } else if (value.annotation.type === "container_file_citation") {
                    controller.enqueue({
                      type: "source",
                      sourceType: "document",
                      id: (_I = (_H = (_G = self.config).generateId) == null ? void 0 : _H.call(_G)) != null ? _I : generateId(),
                      mediaType: "text/plain",
                      title: value.annotation.filename,
                      filename: value.annotation.filename,
                      providerMetadata: {
                        [providerOptionsName]: {
                          type: value.annotation.type,
                          fileId: value.annotation.file_id,
                          containerId: value.annotation.container_id
                        }
                      }
                    });
                  } else if (value.annotation.type === "file_path") {
                    controller.enqueue({
                      type: "source",
                      sourceType: "document",
                      id: (_L = (_K = (_J = self.config).generateId) == null ? void 0 : _K.call(_J)) != null ? _L : generateId(),
                      mediaType: "application/octet-stream",
                      title: value.annotation.file_id,
                      filename: value.annotation.file_id,
                      providerMetadata: {
                        [providerOptionsName]: {
                          type: value.annotation.type,
                          fileId: value.annotation.file_id,
                          index: value.annotation.index
                        }
                      }
                    });
                  }
                } else if (isErrorChunk(value)) {
                  encounteredStreamError = true;
                  finishReason = { unified: "error", raw: "error" };
                  controller.enqueue({ type: "error", error: value });
                }
              },
              flush(controller) {
                const providerMetadata = {
                  [providerOptionsName]: {
                    responseId,
                    ...logprobs.length > 0 ? { logprobs } : {},
                    ...serviceTier !== void 0 ? { serviceTier } : {}
                  }
                };
                controller.enqueue({
                  type: "finish",
                  finishReason,
                  usage: convertOpenAIResponsesUsage(usage),
                  providerMetadata
                });
              }
            })
          ),
          request: { body },
          response: { headers: responseHeaders }
        };
        return result;
      }
    };
    openaiSpeechModelOptionsSchema = lazySchema(
      () => zodSchema(
        z26.object({
          instructions: z26.string().nullish(),
          speed: z26.number().min(0.25).max(4).default(1).nullish()
        })
      )
    );
    OpenAISpeechModel = class _OpenAISpeechModel {
      constructor(modelId, config) {
        this.modelId = modelId;
        this.config = config;
        this.specificationVersion = "v4";
      }
      static [WORKFLOW_SERIALIZE](model) {
        return serializeModelOptions({
          modelId: model.modelId,
          config: model.config
        });
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _OpenAISpeechModel(options.modelId, options.config);
      }
      get provider() {
        return this.config.provider;
      }
      async getArgs({
        text,
        voice = "alloy",
        outputFormat = "mp3",
        speed,
        instructions,
        language,
        providerOptions
      }) {
        const warnings = [];
        const openAIOptions = await parseProviderOptions({
          provider: "openai",
          providerOptions,
          schema: openaiSpeechModelOptionsSchema
        });
        const requestBody = {
          model: this.modelId,
          input: text,
          voice,
          response_format: "mp3",
          speed,
          instructions
        };
        if (outputFormat) {
          if (["mp3", "opus", "aac", "flac", "wav", "pcm"].includes(outputFormat)) {
            requestBody.response_format = outputFormat;
          } else {
            warnings.push({
              type: "unsupported",
              feature: "outputFormat",
              details: `Unsupported output format: ${outputFormat}. Using mp3 instead.`
            });
          }
        }
        if (openAIOptions) {
          const speechModelOptions = {};
          for (const key in speechModelOptions) {
            const value = speechModelOptions[key];
            if (value !== void 0) {
              requestBody[key] = value;
            }
          }
        }
        if (language) {
          warnings.push({
            type: "unsupported",
            feature: "language",
            details: `OpenAI speech models do not support language selection. Language parameter "${language}" was ignored.`
          });
        }
        return {
          requestBody,
          warnings
        };
      }
      async doGenerate(options) {
        var _a2, _b2, _c, _d, _e;
        const currentDate = (_c = (_b2 = (_a2 = this.config._internal) == null ? void 0 : _a2.currentDate) == null ? void 0 : _b2.call(_a2)) != null ? _c : /* @__PURE__ */ new Date();
        const { requestBody, warnings } = await this.getArgs(options);
        const {
          value: audio,
          responseHeaders,
          rawValue: rawResponse
        } = await postJsonToApi({
          url: this.config.url({
            path: "/audio/speech",
            modelId: this.modelId
          }),
          headers: combineHeaders((_e = (_d = this.config).headers) == null ? void 0 : _e.call(_d), options.headers),
          body: requestBody,
          failedResponseHandler: openaiFailedResponseHandler,
          successfulResponseHandler: createBinaryResponseHandler(),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        return {
          audio,
          warnings,
          request: {
            body: JSON.stringify(requestBody)
          },
          response: {
            timestamp: currentDate,
            modelId: this.modelId,
            headers: responseHeaders,
            body: rawResponse
          }
        };
      }
    };
    openaiTranscriptionResponseSchema = lazySchema(
      () => zodSchema(
        z27.object({
          text: z27.string(),
          language: z27.string().nullish(),
          duration: z27.number().nullish(),
          words: z27.array(
            z27.object({
              word: z27.string(),
              start: z27.number(),
              end: z27.number()
            })
          ).nullish(),
          segments: z27.array(
            z27.object({
              id: z27.number(),
              seek: z27.number(),
              start: z27.number(),
              end: z27.number(),
              text: z27.string(),
              tokens: z27.array(z27.number()),
              temperature: z27.number(),
              avg_logprob: z27.number(),
              compression_ratio: z27.number(),
              no_speech_prob: z27.number()
            })
          ).nullish()
        })
      )
    );
    openAITranscriptionModelOptions = lazySchema(
      () => zodSchema(
        z28.object({
          /**
           * Additional information to include in the transcription response.
           */
          include: z28.array(z28.string()).optional(),
          /**
           * The language of the input audio in ISO-639-1 format.
           */
          language: z28.string().optional(),
          /**
           * An optional text to guide the model's style or continue a previous audio segment.
           */
          prompt: z28.string().optional(),
          /**
           * The sampling temperature, between 0 and 1.
           * @default 0
           */
          temperature: z28.number().min(0).max(1).default(0).optional(),
          /**
           * The timestamp granularities to populate for this transcription.
           * @default ['segment']
           */
          timestampGranularities: z28.array(z28.enum(["word", "segment"])).default(["segment"]).optional()
        })
      )
    );
    languageMap = {
      afrikaans: "af",
      arabic: "ar",
      armenian: "hy",
      azerbaijani: "az",
      belarusian: "be",
      bosnian: "bs",
      bulgarian: "bg",
      catalan: "ca",
      chinese: "zh",
      croatian: "hr",
      czech: "cs",
      danish: "da",
      dutch: "nl",
      english: "en",
      estonian: "et",
      finnish: "fi",
      french: "fr",
      galician: "gl",
      german: "de",
      greek: "el",
      hebrew: "he",
      hindi: "hi",
      hungarian: "hu",
      icelandic: "is",
      indonesian: "id",
      italian: "it",
      japanese: "ja",
      kannada: "kn",
      kazakh: "kk",
      korean: "ko",
      latvian: "lv",
      lithuanian: "lt",
      macedonian: "mk",
      malay: "ms",
      marathi: "mr",
      maori: "mi",
      nepali: "ne",
      norwegian: "no",
      persian: "fa",
      polish: "pl",
      portuguese: "pt",
      romanian: "ro",
      russian: "ru",
      serbian: "sr",
      slovak: "sk",
      slovenian: "sl",
      spanish: "es",
      swahili: "sw",
      swedish: "sv",
      tagalog: "tl",
      tamil: "ta",
      thai: "th",
      turkish: "tr",
      ukrainian: "uk",
      urdu: "ur",
      vietnamese: "vi",
      welsh: "cy"
    };
    OpenAITranscriptionModel = class _OpenAITranscriptionModel {
      constructor(modelId, config) {
        this.modelId = modelId;
        this.config = config;
        this.specificationVersion = "v4";
      }
      static [WORKFLOW_SERIALIZE](model) {
        return serializeModelOptions({
          modelId: model.modelId,
          config: model.config
        });
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _OpenAITranscriptionModel(options.modelId, options.config);
      }
      get provider() {
        return this.config.provider;
      }
      async getArgs({
        audio,
        mediaType,
        providerOptions
      }) {
        const warnings = [];
        const openAIOptions = await parseProviderOptions({
          provider: "openai",
          providerOptions,
          schema: openAITranscriptionModelOptions
        });
        const formData = new FormData();
        const blob = audio instanceof Uint8Array ? new Blob([audio]) : new Blob([convertBase64ToUint8Array(audio)]);
        formData.append("model", this.modelId);
        const fileExtension = mediaTypeToExtension(mediaType);
        formData.append(
          "file",
          new File([blob], "audio", { type: mediaType }),
          `audio.${fileExtension}`
        );
        if (this.modelId === "whisper-1") {
          formData.append("response_format", "verbose_json");
        }
        if (openAIOptions) {
          const isGpt4oTranscribeModel = [
            "gpt-4o-transcribe",
            "gpt-4o-mini-transcribe"
          ].includes(this.modelId);
          const transcriptionModelOptions = {
            include: openAIOptions.include,
            language: openAIOptions.language,
            prompt: openAIOptions.prompt,
            // https://platform.openai.com/docs/api-reference/audio/createTranscription#audio_createtranscription-response_format
            // prefer verbose_json to get segments for models that support it
            ...this.modelId !== "whisper-1" && {
              response_format: isGpt4oTranscribeModel ? "json" : "verbose_json"
            },
            temperature: openAIOptions.temperature,
            timestamp_granularities: openAIOptions.timestampGranularities
          };
          for (const [key, value] of Object.entries(transcriptionModelOptions)) {
            if (value != null) {
              if (Array.isArray(value)) {
                for (const item of value) {
                  formData.append(`${key}[]`, String(item));
                }
              } else {
                formData.append(key, String(value));
              }
            }
          }
        }
        return {
          formData,
          warnings
        };
      }
      async doGenerate(options) {
        var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j;
        const currentDate = (_c = (_b2 = (_a2 = this.config._internal) == null ? void 0 : _a2.currentDate) == null ? void 0 : _b2.call(_a2)) != null ? _c : /* @__PURE__ */ new Date();
        const { formData, warnings } = await this.getArgs(options);
        const {
          value: response,
          responseHeaders,
          rawValue: rawResponse
        } = await postFormDataToApi({
          url: this.config.url({
            path: "/audio/transcriptions",
            modelId: this.modelId
          }),
          headers: combineHeaders((_e = (_d = this.config).headers) == null ? void 0 : _e.call(_d), options.headers),
          formData,
          failedResponseHandler: openaiFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            openaiTranscriptionResponseSchema
          ),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        const language = response.language != null && response.language in languageMap ? languageMap[response.language] : void 0;
        return {
          text: response.text,
          segments: (_i = (_h = (_f = response.segments) == null ? void 0 : _f.map((segment) => ({
            text: segment.text,
            startSecond: segment.start,
            endSecond: segment.end
          }))) != null ? _h : (_g = response.words) == null ? void 0 : _g.map((word) => ({
            text: word.word,
            startSecond: word.start,
            endSecond: word.end
          }))) != null ? _i : [],
          language,
          durationInSeconds: (_j = response.duration) != null ? _j : void 0,
          warnings,
          response: {
            timestamp: currentDate,
            modelId: this.modelId,
            headers: responseHeaders,
            body: rawResponse
          }
        };
      }
    };
    openaiSkillResponseSchema = lazySchema(
      () => zodSchema(
        z29.object({
          id: z29.string(),
          name: z29.string().nullish(),
          description: z29.string().nullish(),
          default_version: z29.string().nullish(),
          latest_version: z29.string().nullish(),
          created_at: z29.number(),
          updated_at: z29.number().nullish()
        })
      )
    );
    openaiSkillVersionResponseSchema = lazySchema(
      () => zodSchema(
        z29.object({
          id: z29.string(),
          version: z29.string().nullish(),
          name: z29.string().nullish(),
          description: z29.string().nullish()
        })
      )
    );
    OpenAISkills = class {
      constructor(config) {
        this.config = config;
        this.specificationVersion = "v4";
      }
      get provider() {
        return this.config.provider;
      }
      async uploadSkill(params) {
        const warnings = [];
        if (params.displayTitle != null) {
          warnings.push({
            type: "unsupported",
            feature: "displayTitle"
          });
        }
        const formData = new FormData();
        for (const file of params.files) {
          const content = convertInlineFileDataToUint8Array(file.data);
          formData.append("files[]", new Blob([content]), file.path);
        }
        const { value: response } = await postFormDataToApi({
          url: this.config.url({ path: "/skills" }),
          headers: combineHeaders(this.config.headers()),
          formData,
          failedResponseHandler: openaiFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            openaiSkillResponseSchema
          ),
          fetch: this.config.fetch
        });
        return {
          providerReference: { openai: response.id },
          ...response.name != null ? { name: response.name } : {},
          ...response.description != null ? { description: response.description } : {},
          ...response.latest_version != null ? { latestVersion: response.latest_version } : {},
          providerMetadata: {
            openai: {
              ...response.default_version != null ? { defaultVersion: response.default_version } : {},
              ...response.created_at != null ? { createdAt: response.created_at } : {},
              ...response.updated_at != null ? { updatedAt: response.updated_at } : {}
            }
          },
          warnings
        };
      }
    };
    VERSION2 = true ? "4.0.0" : "0.0.0-test";
    openai = createOpenAI();
  }
});

// node_modules/@ai-sdk/google/dist/index.js
var dist_exports2 = {};
__export(dist_exports2, {
  Experimental_GoogleRealtimeModel: () => GoogleRealtimeModel,
  VERSION: () => VERSION3,
  createGoogle: () => createGoogle,
  createGoogleGenerativeAI: () => createGoogle,
  google: () => google
});
import {
  TooManyEmbeddingValuesForCallError as TooManyEmbeddingValuesForCallError2
} from "@ai-sdk/provider";
import { z as z32 } from "zod/v4";
import { z as z30 } from "zod/v4";
import { z as z210 } from "zod/v4";
import { z as z52 } from "zod/v4";
import {
  UnsupportedFunctionalityError as UnsupportedFunctionalityError6
} from "@ai-sdk/provider";
import { z as z43 } from "zod/v4";
import {
  UnsupportedFunctionalityError as UnsupportedFunctionalityError23
} from "@ai-sdk/provider";
import { z as z62 } from "zod/v4";
import { z as z72 } from "zod/v4";
import { z as z82 } from "zod/v4";
import { z as z92 } from "zod/v4";
import { z as z102 } from "zod/v4";
import { z as z112 } from "zod/v4";
import { z as z122 } from "zod/v4";
import { z as z142 } from "zod/v4";
import { z as z132 } from "zod/v4";
import {
  AISDKError as AISDKError2
} from "@ai-sdk/provider";
import { z as z152 } from "zod/v4";
import {
  AISDKError as AISDKError22
} from "@ai-sdk/provider";
import { z as z172 } from "zod/v4";
import { z as z162 } from "zod/v4";
import { z as z182 } from "zod/v4";
import { z as z192 } from "zod/v4";
import { z as z202 } from "zod/v4";
import { z as z212 } from "zod/v4";
function convertGoogleUsage(usage) {
  var _a2, _b2, _c, _d;
  if (usage == null) {
    return {
      inputTokens: {
        total: void 0,
        noCache: void 0,
        cacheRead: void 0,
        cacheWrite: void 0
      },
      outputTokens: {
        total: void 0,
        text: void 0,
        reasoning: void 0
      },
      raw: void 0
    };
  }
  const promptTokens = (_a2 = usage.promptTokenCount) != null ? _a2 : 0;
  const candidatesTokens = (_b2 = usage.candidatesTokenCount) != null ? _b2 : 0;
  const cachedContentTokens = (_c = usage.cachedContentTokenCount) != null ? _c : 0;
  const thoughtsTokens = (_d = usage.thoughtsTokenCount) != null ? _d : 0;
  return {
    inputTokens: {
      total: promptTokens,
      noCache: promptTokens - cachedContentTokens,
      cacheRead: cachedContentTokens,
      cacheWrite: void 0
    },
    outputTokens: {
      total: candidatesTokens + thoughtsTokens,
      text: candidatesTokens,
      reasoning: thoughtsTokens
    },
    raw: usage
  };
}
function convertJSONSchemaToOpenAPISchema(jsonSchema2, isRoot = true) {
  if (jsonSchema2 == null) {
    return void 0;
  }
  if (isEmptyObjectSchema(jsonSchema2)) {
    if (isRoot) {
      return void 0;
    }
    if (typeof jsonSchema2 === "object" && jsonSchema2.description) {
      return { type: "object", description: jsonSchema2.description };
    }
    return { type: "object" };
  }
  if (typeof jsonSchema2 === "boolean") {
    return { type: "boolean", properties: {} };
  }
  const {
    type,
    description,
    required,
    properties,
    items,
    allOf,
    anyOf,
    oneOf,
    format,
    const: constValue,
    minLength,
    enum: enumValues
  } = jsonSchema2;
  const result = {};
  if (description) result.description = description;
  if (required) result.required = required;
  if (format) result.format = format;
  if (constValue !== void 0) {
    result.enum = [constValue];
  }
  if (type) {
    if (Array.isArray(type)) {
      const hasNull = type.includes("null");
      const nonNullTypes = type.filter((t) => t !== "null");
      if (nonNullTypes.length === 0) {
        result.type = "null";
      } else {
        result.anyOf = nonNullTypes.map((t) => ({ type: t }));
        if (hasNull) {
          result.nullable = true;
        }
      }
    } else {
      result.type = type;
    }
  }
  if (enumValues !== void 0) {
    result.enum = enumValues;
  }
  if (properties != null) {
    result.properties = Object.entries(properties).reduce(
      (acc, [key, value]) => {
        acc[key] = convertJSONSchemaToOpenAPISchema(value, false);
        return acc;
      },
      {}
    );
  }
  if (items) {
    result.items = Array.isArray(items) ? items.map((item) => convertJSONSchemaToOpenAPISchema(item, false)) : convertJSONSchemaToOpenAPISchema(items, false);
  }
  if (allOf) {
    result.allOf = allOf.map(
      (item) => convertJSONSchemaToOpenAPISchema(item, false)
    );
  }
  if (anyOf) {
    if (anyOf.some(
      (schema) => typeof schema === "object" && (schema == null ? void 0 : schema.type) === "null"
    )) {
      const nonNullSchemas = anyOf.filter(
        (schema) => !(typeof schema === "object" && (schema == null ? void 0 : schema.type) === "null")
      );
      if (nonNullSchemas.length === 1) {
        const converted = convertJSONSchemaToOpenAPISchema(
          nonNullSchemas[0],
          false
        );
        if (typeof converted === "object") {
          result.nullable = true;
          Object.assign(result, converted);
        }
      } else {
        result.anyOf = nonNullSchemas.map(
          (item) => convertJSONSchemaToOpenAPISchema(item, false)
        );
        result.nullable = true;
      }
    } else {
      result.anyOf = anyOf.map(
        (item) => convertJSONSchemaToOpenAPISchema(item, false)
      );
    }
  }
  if (oneOf) {
    result.oneOf = oneOf.map(
      (item) => convertJSONSchemaToOpenAPISchema(item, false)
    );
  }
  if (minLength !== void 0) {
    result.minLength = minLength;
  }
  return result;
}
function isEmptyObjectSchema(jsonSchema2) {
  return jsonSchema2 != null && typeof jsonSchema2 === "object" && jsonSchema2.type === "object" && (jsonSchema2.properties == null || Object.keys(jsonSchema2.properties).length === 0) && !jsonSchema2.additionalProperties;
}
function parseBase64DataUrl(value) {
  const match = dataUrlRegex.exec(value);
  if (match == null) {
    return void 0;
  }
  return {
    mediaType: match[1],
    data: match[2]
  };
}
function convertUrlToolResultPart(url) {
  const parsedDataUrl = parseBase64DataUrl(url);
  if (parsedDataUrl == null) {
    return void 0;
  }
  return {
    inlineData: {
      mimeType: parsedDataUrl.mediaType,
      data: parsedDataUrl.data
    }
  };
}
function appendToolResultParts(parts, toolName, outputValue, toolCallId) {
  const functionResponseParts = [];
  const responseTextParts = [];
  for (const contentPart of outputValue) {
    switch (contentPart.type) {
      case "text": {
        responseTextParts.push(contentPart.text);
        break;
      }
      case "file": {
        if (contentPart.data.type === "data") {
          functionResponseParts.push({
            inlineData: {
              mimeType: resolveFullMediaType({ part: contentPart }),
              data: convertToBase64(contentPart.data.data)
            }
          });
        } else if (contentPart.data.type === "url") {
          const functionResponsePart = convertUrlToolResultPart(
            contentPart.data.url.toString()
          );
          if (functionResponsePart != null) {
            functionResponseParts.push(functionResponsePart);
          } else {
            responseTextParts.push(JSON.stringify(contentPart));
          }
        } else {
          responseTextParts.push(JSON.stringify(contentPart));
        }
        break;
      }
      default: {
        responseTextParts.push(JSON.stringify(contentPart));
        break;
      }
    }
  }
  parts.push({
    functionResponse: {
      ...toolCallId != null ? { id: toolCallId } : {},
      name: toolName,
      response: {
        name: toolName,
        content: responseTextParts.length > 0 ? responseTextParts.join("\n") : "Tool executed successfully."
      },
      ...functionResponseParts.length > 0 ? { parts: functionResponseParts } : {}
    }
  });
}
function appendLegacyToolResultParts(parts, toolName, outputValue, toolCallId) {
  for (const contentPart of outputValue) {
    switch (contentPart.type) {
      case "text":
        parts.push({
          functionResponse: {
            ...toolCallId != null ? { id: toolCallId } : {},
            name: toolName,
            response: {
              name: toolName,
              content: contentPart.text
            }
          }
        });
        break;
      case "file": {
        if (contentPart.data.type === "data" && getTopLevelMediaType(contentPart.mediaType) === "image") {
          parts.push(
            {
              inlineData: {
                mimeType: resolveFullMediaType({ part: contentPart }),
                data: convertToBase64(contentPart.data.data)
              }
            },
            {
              text: "Tool executed successfully and returned this image as a response"
            }
          );
        } else {
          parts.push({ text: JSON.stringify(contentPart) });
        }
        break;
      }
      default:
        parts.push({ text: JSON.stringify(contentPart) });
        break;
    }
  }
}
function convertToGoogleMessages(prompt, options) {
  var _a2, _b2, _c, _d, _e;
  const systemInstructionParts = [];
  const contents = [];
  let systemMessagesAllowed = true;
  const isGemmaModel = (_a2 = options == null ? void 0 : options.isGemmaModel) != null ? _a2 : false;
  const isGemini3Model2 = (_b2 = options == null ? void 0 : options.isGemini3Model) != null ? _b2 : false;
  const onWarning = options == null ? void 0 : options.onWarning;
  const providerOptionsNames = (_c = options == null ? void 0 : options.providerOptionsNames) != null ? _c : ["google"];
  const isVertexLike = !providerOptionsNames.includes("google");
  const supportsFunctionResponseParts = (_d = options == null ? void 0 : options.supportsFunctionResponseParts) != null ? _d : true;
  let sentinelInjected = false;
  const missingSignatureToolNames = [];
  const injectSkipSignature = (toolName) => {
    missingSignatureToolNames.push(toolName);
    sentinelInjected = true;
    return SKIP_THOUGHT_SIGNATURE_VALIDATOR;
  };
  const readProviderOpts = (part) => {
    var _a22, _b22, _c2, _d2, _e2;
    for (const name2 of providerOptionsNames) {
      const v = (_a22 = part.providerOptions) == null ? void 0 : _a22[name2];
      if (v != null) return v;
    }
    if (isVertexLike) {
      return (_b22 = part.providerOptions) == null ? void 0 : _b22.google;
    }
    return (_e2 = (_c2 = part.providerOptions) == null ? void 0 : _c2.googleVertex) != null ? _e2 : (_d2 = part.providerOptions) == null ? void 0 : _d2.vertex;
  };
  for (const { role, content } of prompt) {
    switch (role) {
      case "system": {
        if (!systemMessagesAllowed) {
          throw new UnsupportedFunctionalityError6({
            functionality: "system messages are only supported at the beginning of the conversation"
          });
        }
        systemInstructionParts.push({ text: content });
        break;
      }
      case "user": {
        systemMessagesAllowed = false;
        const parts = [];
        for (const part of content) {
          switch (part.type) {
            case "text": {
              parts.push({ text: part.text });
              break;
            }
            case "file": {
              switch (part.data.type) {
                case "url": {
                  parts.push({
                    fileData: {
                      mimeType: resolveFullMediaType({ part }),
                      fileUri: part.data.url.toString()
                    }
                  });
                  break;
                }
                case "reference": {
                  if (isVertexLike) {
                    throw new UnsupportedFunctionalityError6({
                      functionality: "file parts with provider references"
                    });
                  }
                  parts.push({
                    fileData: {
                      mimeType: resolveFullMediaType({ part }),
                      fileUri: resolveProviderReference({
                        reference: part.data.reference,
                        provider: "google"
                      })
                    }
                  });
                  break;
                }
                case "text": {
                  parts.push({
                    inlineData: {
                      mimeType: isFullMediaType(part.mediaType) ? part.mediaType : "text/plain",
                      data: convertToBase64(
                        new TextEncoder().encode(part.data.text)
                      )
                    }
                  });
                  break;
                }
                case "data": {
                  parts.push({
                    inlineData: {
                      mimeType: resolveFullMediaType({ part }),
                      data: convertToBase64(part.data.data)
                    }
                  });
                  break;
                }
              }
              break;
            }
          }
        }
        contents.push({ role: "user", parts });
        break;
      }
      case "assistant": {
        systemMessagesAllowed = false;
        contents.push({
          role: "model",
          parts: content.map((part) => {
            const providerOpts = readProviderOpts(part);
            const thoughtSignature = (providerOpts == null ? void 0 : providerOpts.thoughtSignature) != null ? String(providerOpts.thoughtSignature) : void 0;
            switch (part.type) {
              case "text": {
                return part.text.length === 0 ? void 0 : {
                  text: part.text,
                  thoughtSignature
                };
              }
              case "reasoning": {
                return part.text.length === 0 ? void 0 : {
                  text: part.text,
                  thought: true,
                  thoughtSignature
                };
              }
              case "reasoning-file": {
                switch (part.data.type) {
                  case "url": {
                    throw new UnsupportedFunctionalityError6({
                      functionality: "File data URLs in assistant messages are not supported"
                    });
                  }
                  case "data": {
                    return {
                      inlineData: {
                        mimeType: part.mediaType,
                        data: convertToBase64(part.data.data)
                      },
                      thought: true,
                      thoughtSignature
                    };
                  }
                }
                break;
              }
              case "file": {
                switch (part.data.type) {
                  case "url": {
                    throw new UnsupportedFunctionalityError6({
                      functionality: "File data URLs in assistant messages are not supported"
                    });
                  }
                  case "reference": {
                    if (isVertexLike) {
                      throw new UnsupportedFunctionalityError6({
                        functionality: "file parts with provider references"
                      });
                    }
                    return {
                      fileData: {
                        mimeType: part.mediaType,
                        fileUri: resolveProviderReference({
                          reference: part.data.reference,
                          provider: "google"
                        })
                      },
                      ...(providerOpts == null ? void 0 : providerOpts.thought) === true ? { thought: true } : {},
                      thoughtSignature
                    };
                  }
                  case "text": {
                    return {
                      inlineData: {
                        mimeType: isFullMediaType(part.mediaType) ? part.mediaType : "text/plain",
                        data: convertToBase64(
                          new TextEncoder().encode(part.data.text)
                        )
                      },
                      ...(providerOpts == null ? void 0 : providerOpts.thought) === true ? { thought: true } : {},
                      thoughtSignature
                    };
                  }
                  case "data": {
                    return {
                      inlineData: {
                        mimeType: part.mediaType,
                        data: convertToBase64(part.data.data)
                      },
                      ...(providerOpts == null ? void 0 : providerOpts.thought) === true ? { thought: true } : {},
                      thoughtSignature
                    };
                  }
                }
                break;
              }
              case "tool-call": {
                const serverToolCallId = (providerOpts == null ? void 0 : providerOpts.serverToolCallId) != null ? String(providerOpts.serverToolCallId) : void 0;
                const serverToolType = (providerOpts == null ? void 0 : providerOpts.serverToolType) != null ? String(providerOpts.serverToolType) : void 0;
                const effectiveThoughtSignature = thoughtSignature != null ? thoughtSignature : isGemini3Model2 ? injectSkipSignature(part.toolName) : void 0;
                if (serverToolCallId && serverToolType) {
                  return {
                    toolCall: {
                      toolType: serverToolType,
                      args: typeof part.input === "string" ? JSON.parse(part.input) : part.input,
                      id: serverToolCallId
                    },
                    thoughtSignature: effectiveThoughtSignature
                  };
                }
                return {
                  functionCall: {
                    ...part.toolCallId != null ? { id: part.toolCallId } : {},
                    name: part.toolName,
                    args: part.input
                  },
                  thoughtSignature: effectiveThoughtSignature
                };
              }
              case "tool-result": {
                const serverToolCallId = (providerOpts == null ? void 0 : providerOpts.serverToolCallId) != null ? String(providerOpts.serverToolCallId) : void 0;
                const serverToolType = (providerOpts == null ? void 0 : providerOpts.serverToolType) != null ? String(providerOpts.serverToolType) : void 0;
                if (serverToolCallId && serverToolType) {
                  return {
                    toolResponse: {
                      toolType: serverToolType,
                      response: part.output.type === "json" ? part.output.value : {},
                      id: serverToolCallId
                    },
                    thoughtSignature
                  };
                }
                return void 0;
              }
            }
          }).filter((part) => part !== void 0)
        });
        break;
      }
      case "tool": {
        systemMessagesAllowed = false;
        const parts = [];
        for (const part of content) {
          if (part.type === "tool-approval-response") {
            continue;
          }
          const partProviderOpts = readProviderOpts(part);
          const serverToolCallId = (partProviderOpts == null ? void 0 : partProviderOpts.serverToolCallId) != null ? String(partProviderOpts.serverToolCallId) : void 0;
          const serverToolType = (partProviderOpts == null ? void 0 : partProviderOpts.serverToolType) != null ? String(partProviderOpts.serverToolType) : void 0;
          if (serverToolCallId && serverToolType) {
            const serverThoughtSignature = (partProviderOpts == null ? void 0 : partProviderOpts.thoughtSignature) != null ? String(partProviderOpts.thoughtSignature) : void 0;
            if (contents.length > 0) {
              const lastContent = contents[contents.length - 1];
              if (lastContent.role === "model") {
                lastContent.parts.push({
                  toolResponse: {
                    toolType: serverToolType,
                    response: part.output.type === "json" ? part.output.value : {},
                    id: serverToolCallId
                  },
                  thoughtSignature: serverThoughtSignature
                });
                continue;
              }
            }
          }
          const output = part.output;
          if (output.type === "content") {
            if (supportsFunctionResponseParts) {
              appendToolResultParts(
                parts,
                part.toolName,
                output.value,
                part.toolCallId
              );
            } else {
              appendLegacyToolResultParts(
                parts,
                part.toolName,
                output.value,
                part.toolCallId
              );
            }
          } else {
            parts.push({
              functionResponse: {
                ...part.toolCallId != null ? { id: part.toolCallId } : {},
                name: part.toolName,
                response: {
                  name: part.toolName,
                  content: output.type === "execution-denied" ? (_e = output.reason) != null ? _e : "Tool call execution denied." : output.value
                }
              }
            });
          }
        }
        contents.push({
          role: "user",
          parts
        });
        break;
      }
    }
  }
  if (isGemmaModel && systemInstructionParts.length > 0 && contents.length > 0 && contents[0].role === "user") {
    const systemText = systemInstructionParts.map((part) => part.text).join("\n\n");
    contents[0].parts.unshift({ text: systemText + "\n\n" });
  }
  if (sentinelInjected && onWarning != null) {
    const uniqueToolNames = Array.from(new Set(missingSignatureToolNames));
    onWarning({
      type: "other",
      message: `Replayed ${missingSignatureToolNames.length} \`functionCall\` part(s) for a Gemini 3 model without a \`thoughtSignature\` (tools: ${uniqueToolNames.map((name2) => `\`${name2}\``).join(", ")}). Injected the documented \`skip_thought_signature_validator\` sentinel to keep the request from failing with HTTP 400. The likely cause is application code that drops \`providerOptions.google.thoughtSignature\` when persisting or serializing assistant tool-call messages. See https://ai.google.dev/gemini-api/docs/thought-signatures.`
    });
  }
  return {
    systemInstruction: systemInstructionParts.length > 0 && !isGemmaModel ? { parts: systemInstructionParts } : void 0,
    contents
  };
}
function getModelPath(modelId) {
  return modelId.includes("/") ? modelId : `models/${modelId}`;
}
function prepareTools({
  tools,
  toolChoice,
  modelId,
  isVertexProvider = false
}) {
  var _a2, _b2;
  tools = (tools == null ? void 0 : tools.length) ? tools : void 0;
  const toolWarnings = [];
  const isLatest = [
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-pro-latest"
  ].some((id) => id === modelId);
  const isGemini2orNewer = modelId.includes("gemini-2") || modelId.includes("gemini-3") || modelId.includes("nano-banana") || isLatest;
  const isGemini3orNewer = modelId.includes("gemini-3");
  const supportsFileSearch = modelId.includes("gemini-2.5") || modelId.includes("gemini-3");
  if (tools == null) {
    return { tools: void 0, toolConfig: void 0, toolWarnings };
  }
  const hasFunctionTools = tools.some((tool2) => tool2.type === "function");
  const hasProviderTools = tools.some((tool2) => tool2.type === "provider");
  if (hasFunctionTools && hasProviderTools && !isGemini3orNewer) {
    toolWarnings.push({
      type: "unsupported",
      feature: `combination of function and provider-defined tools`
    });
  }
  if (hasProviderTools) {
    const googleTools2 = [];
    const ProviderTools = tools.filter((tool2) => tool2.type === "provider");
    ProviderTools.forEach((tool2) => {
      switch (tool2.id) {
        case "google.google_search":
          if (isGemini2orNewer) {
            googleTools2.push({ googleSearch: { ...tool2.args } });
          } else {
            toolWarnings.push({
              type: "unsupported",
              feature: `provider-defined tool ${tool2.id}`,
              details: "Google Search requires Gemini 2.0 or newer."
            });
          }
          break;
        case "google.enterprise_web_search":
          if (isGemini2orNewer) {
            googleTools2.push({ enterpriseWebSearch: {} });
          } else {
            toolWarnings.push({
              type: "unsupported",
              feature: `provider-defined tool ${tool2.id}`,
              details: "Enterprise Web Search requires Gemini 2.0 or newer."
            });
          }
          break;
        case "google.url_context":
          if (isGemini2orNewer) {
            googleTools2.push({ urlContext: {} });
          } else {
            toolWarnings.push({
              type: "unsupported",
              feature: `provider-defined tool ${tool2.id}`,
              details: "The URL context tool is not supported with other Gemini models than Gemini 2."
            });
          }
          break;
        case "google.code_execution":
          if (isGemini2orNewer) {
            googleTools2.push({ codeExecution: {} });
          } else {
            toolWarnings.push({
              type: "unsupported",
              feature: `provider-defined tool ${tool2.id}`,
              details: "The code execution tool is not supported with other Gemini models than Gemini 2."
            });
          }
          break;
        case "google.file_search":
          if (supportsFileSearch) {
            googleTools2.push({ fileSearch: { ...tool2.args } });
          } else {
            toolWarnings.push({
              type: "unsupported",
              feature: `provider-defined tool ${tool2.id}`,
              details: "The file search tool is only supported with Gemini 2.5 models and Gemini 3 models."
            });
          }
          break;
        case "google.vertex_rag_store":
          if (isGemini2orNewer) {
            googleTools2.push({
              retrieval: {
                vertex_rag_store: {
                  rag_resources: {
                    rag_corpus: tool2.args.ragCorpus
                  },
                  similarity_top_k: tool2.args.topK
                }
              }
            });
          } else {
            toolWarnings.push({
              type: "unsupported",
              feature: `provider-defined tool ${tool2.id}`,
              details: "The RAG store tool is not supported with other Gemini models than Gemini 2."
            });
          }
          break;
        case "google.google_maps":
          if (isGemini2orNewer) {
            googleTools2.push({ googleMaps: {} });
          } else {
            toolWarnings.push({
              type: "unsupported",
              feature: `provider-defined tool ${tool2.id}`,
              details: "The Google Maps grounding tool is not supported with Gemini models other than Gemini 2 or newer."
            });
          }
          break;
        default:
          toolWarnings.push({
            type: "unsupported",
            feature: `provider-defined tool ${tool2.id}`
          });
          break;
      }
    });
    if (hasFunctionTools && isGemini3orNewer && googleTools2.length > 0) {
      const functionDeclarations2 = [];
      for (const tool2 of tools) {
        if (tool2.type === "function") {
          functionDeclarations2.push({
            name: tool2.name,
            description: (_a2 = tool2.description) != null ? _a2 : "",
            parameters: convertJSONSchemaToOpenAPISchema(tool2.inputSchema)
          });
        }
      }
      const combinedToolConfig = {
        functionCallingConfig: { mode: "VALIDATED" },
        ...!isVertexProvider && {
          includeServerSideToolInvocations: true
        }
      };
      if (toolChoice != null) {
        switch (toolChoice.type) {
          case "auto":
            break;
          case "none":
            combinedToolConfig.functionCallingConfig = { mode: "NONE" };
            break;
          case "required":
            combinedToolConfig.functionCallingConfig = { mode: "ANY" };
            break;
          case "tool":
            combinedToolConfig.functionCallingConfig = {
              mode: "ANY",
              allowedFunctionNames: [toolChoice.toolName]
            };
            break;
        }
      }
      return {
        tools: [...googleTools2, { functionDeclarations: functionDeclarations2 }],
        toolConfig: combinedToolConfig,
        toolWarnings
      };
    }
    return {
      tools: googleTools2.length > 0 ? googleTools2 : void 0,
      toolConfig: void 0,
      toolWarnings
    };
  }
  const functionDeclarations = [];
  let hasStrictTools = false;
  for (const tool2 of tools) {
    switch (tool2.type) {
      case "function":
        functionDeclarations.push({
          name: tool2.name,
          description: (_b2 = tool2.description) != null ? _b2 : "",
          parameters: convertJSONSchemaToOpenAPISchema(tool2.inputSchema)
        });
        if (tool2.strict === true) {
          hasStrictTools = true;
        }
        break;
      default:
        toolWarnings.push({
          type: "unsupported",
          feature: `function tool ${tool2.name}`
        });
        break;
    }
  }
  if (toolChoice == null) {
    return {
      tools: [{ functionDeclarations }],
      toolConfig: hasStrictTools ? { functionCallingConfig: { mode: "VALIDATED" } } : void 0,
      toolWarnings
    };
  }
  const type = toolChoice.type;
  switch (type) {
    case "auto":
      return {
        tools: [{ functionDeclarations }],
        toolConfig: {
          functionCallingConfig: {
            mode: hasStrictTools ? "VALIDATED" : "AUTO"
          }
        },
        toolWarnings
      };
    case "none":
      return {
        tools: [{ functionDeclarations }],
        toolConfig: { functionCallingConfig: { mode: "NONE" } },
        toolWarnings
      };
    case "required":
      return {
        tools: [{ functionDeclarations }],
        toolConfig: {
          functionCallingConfig: {
            mode: hasStrictTools ? "VALIDATED" : "ANY"
          }
        },
        toolWarnings
      };
    case "tool":
      return {
        tools: [{ functionDeclarations }],
        toolConfig: {
          functionCallingConfig: {
            mode: hasStrictTools ? "VALIDATED" : "ANY",
            allowedFunctionNames: [toolChoice.toolName]
          }
        },
        toolWarnings
      };
    default: {
      const _exhaustiveCheck = type;
      throw new UnsupportedFunctionalityError23({
        functionality: `tool choice type: ${_exhaustiveCheck}`
      });
    }
  }
}
function parsePath(rawPath) {
  const segments = [];
  for (const part of rawPath.split(".")) {
    const bracketIdx = part.indexOf("[");
    if (bracketIdx === -1) {
      segments.push(part);
    } else {
      if (bracketIdx > 0) segments.push(part.slice(0, bracketIdx));
      for (const m of part.matchAll(/\[(\d+)\]/g)) {
        segments.push(parseInt(m[1], 10));
      }
    }
  }
  return segments;
}
function hasOwnProperty(obj, key) {
  return hasOwn.call(obj, key);
}
function defineOwnProperty(obj, key, value) {
  Object.defineProperty(obj, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true
  });
}
function getNestedValue(obj, segments) {
  let current = obj;
  for (const pathSegment of segments) {
    if (current == null || typeof current !== "object") return void 0;
    const currentRecord = current;
    if (!hasOwnProperty(currentRecord, pathSegment)) return void 0;
    current = currentRecord[pathSegment];
  }
  return current;
}
function setNestedValue(obj, segments, value) {
  let current = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const pathSegment = segments[i];
    const nextSeg = segments[i + 1];
    if (!hasOwnProperty(current, pathSegment) || current[pathSegment] == null) {
      defineOwnProperty(
        current,
        pathSegment,
        typeof nextSeg === "number" ? [] : {}
      );
    }
    current = current[pathSegment];
  }
  defineOwnProperty(current, segments[segments.length - 1], value);
}
function resolvePartialArgValue(arg) {
  var _a2, _b2;
  const value = (_b2 = (_a2 = arg.stringValue) != null ? _a2 : arg.numberValue) != null ? _b2 : arg.boolValue;
  if (value != null) return { value, json: JSON.stringify(value) };
  if ("nullValue" in arg) return { value: null, json: "null" };
  return void 0;
}
function mapGoogleFinishReason({
  finishReason,
  hasToolCalls
}) {
  switch (finishReason) {
    case "STOP":
      return hasToolCalls ? "tool-calls" : "stop";
    case "MAX_TOKENS":
      return "length";
    case "IMAGE_SAFETY":
    case "RECITATION":
    case "SAFETY":
    case "BLOCKLIST":
    case "PROHIBITED_CONTENT":
    case "SPII":
      return "content-filter";
    case "MALFORMED_FUNCTION_CALL":
      return "error";
    case "FINISH_REASON_UNSPECIFIED":
    case "OTHER":
    default:
      return "other";
  }
}
function isGemini3Model(modelId) {
  return /gemini-3[\.\-]/i.test(modelId) || /gemini-3$/i.test(modelId);
}
function getMaxOutputTokensForGemini25Model() {
  return 65536;
}
function getMaxThinkingTokensForGemini25Model(modelId) {
  const id = modelId.toLowerCase();
  if (id.includes("2.5-pro") || id.includes("gemini-3-pro-image")) {
    return 32768;
  }
  return 24576;
}
function resolveThinkingConfig({
  reasoning,
  modelId,
  warnings
}) {
  if (!isCustomReasoning(reasoning)) {
    return void 0;
  }
  if (isGemini3Model(modelId) && !modelId.includes("gemini-3-pro-image")) {
    return resolveGemini3ThinkingConfig({ reasoning, warnings });
  }
  return resolveGemini25ThinkingConfig({ reasoning, modelId, warnings });
}
function resolveGemini3ThinkingConfig({
  reasoning,
  warnings
}) {
  if (reasoning === "none") {
    return { thinkingLevel: "minimal" };
  }
  const thinkingLevel = mapReasoningToProviderEffort({
    reasoning,
    effortMap: {
      minimal: "minimal",
      low: "low",
      medium: "medium",
      high: "high",
      xhigh: "high"
    },
    warnings
  });
  if (thinkingLevel == null) {
    return void 0;
  }
  return { thinkingLevel };
}
function resolveGemini25ThinkingConfig({
  reasoning,
  modelId,
  warnings
}) {
  if (reasoning === "none") {
    return { thinkingBudget: 0 };
  }
  const thinkingBudget = mapReasoningToProviderBudget({
    reasoning,
    maxOutputTokens: getMaxOutputTokensForGemini25Model(),
    maxReasoningBudget: getMaxThinkingTokensForGemini25Model(modelId),
    minReasoningBudget: 0,
    warnings
  });
  if (thinkingBudget == null) {
    return void 0;
  }
  return { thinkingBudget };
}
function extractSources({
  groundingMetadata,
  generateId: generateId3
}) {
  var _a2, _b2, _c, _d, _e, _f;
  if (!(groundingMetadata == null ? void 0 : groundingMetadata.groundingChunks)) {
    return void 0;
  }
  const sources = [];
  for (const chunk of groundingMetadata.groundingChunks) {
    if (chunk.web != null) {
      sources.push({
        type: "source",
        sourceType: "url",
        id: generateId3(),
        url: chunk.web.uri,
        title: (_a2 = chunk.web.title) != null ? _a2 : void 0
      });
    } else if (chunk.image != null) {
      sources.push({
        type: "source",
        sourceType: "url",
        id: generateId3(),
        // Google requires attribution to the source URI, not the actual image URI.
        // TODO: add another type in v7 to allow both the image and source URL to be included separately
        url: chunk.image.sourceUri,
        title: (_b2 = chunk.image.title) != null ? _b2 : void 0
      });
    } else if (chunk.retrievedContext != null) {
      const uri = chunk.retrievedContext.uri;
      const fileSearchStore = chunk.retrievedContext.fileSearchStore;
      if (uri && (uri.startsWith("http://") || uri.startsWith("https://"))) {
        sources.push({
          type: "source",
          sourceType: "url",
          id: generateId3(),
          url: uri,
          title: (_c = chunk.retrievedContext.title) != null ? _c : void 0
        });
      } else if (uri) {
        const title = (_d = chunk.retrievedContext.title) != null ? _d : "Unknown Document";
        let mediaType = "application/octet-stream";
        let filename = void 0;
        if (uri.endsWith(".pdf")) {
          mediaType = "application/pdf";
          filename = uri.split("/").pop();
        } else if (uri.endsWith(".txt")) {
          mediaType = "text/plain";
          filename = uri.split("/").pop();
        } else if (uri.endsWith(".docx")) {
          mediaType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          filename = uri.split("/").pop();
        } else if (uri.endsWith(".doc")) {
          mediaType = "application/msword";
          filename = uri.split("/").pop();
        } else if (uri.match(/\.(md|markdown)$/)) {
          mediaType = "text/markdown";
          filename = uri.split("/").pop();
        } else {
          filename = uri.split("/").pop();
        }
        sources.push({
          type: "source",
          sourceType: "document",
          id: generateId3(),
          mediaType,
          title,
          filename
        });
      } else if (fileSearchStore) {
        const title = (_e = chunk.retrievedContext.title) != null ? _e : "Unknown Document";
        sources.push({
          type: "source",
          sourceType: "document",
          id: generateId3(),
          mediaType: "application/octet-stream",
          title,
          filename: fileSearchStore.split("/").pop()
        });
      }
    } else if (chunk.maps != null) {
      if (chunk.maps.uri) {
        sources.push({
          type: "source",
          sourceType: "url",
          id: generateId3(),
          url: chunk.maps.uri,
          title: (_f = chunk.maps.title) != null ? _f : void 0
        });
      }
    }
  }
  return sources.length > 0 ? sources : void 0;
}
function isGeminiModel(modelId) {
  return modelId.startsWith("gemini-");
}
function parseSampleRate(mimeType) {
  if (mimeType == null) {
    return void 0;
  }
  const match = /rate=(\d+)/.exec(mimeType);
  return match ? Number.parseInt(match[1], 10) : void 0;
}
function addWavHeader(pcm, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);
  const out = new Uint8Array(buffer);
  out.set(pcm, 44);
  return out;
}
function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
function convertGoogleInteractionsUsage(usage) {
  var _a2, _b2, _c, _d, _e, _f, _g, _h;
  if (usage == null) {
    return {
      inputTokens: {
        total: void 0,
        noCache: void 0,
        cacheRead: void 0,
        cacheWrite: void 0
      },
      outputTokens: {
        total: void 0,
        text: void 0,
        reasoning: void 0
      },
      raw: void 0
    };
  }
  const totalInput = (_a2 = usage.total_input_tokens) != null ? _a2 : 0;
  const totalOutput = (_b2 = usage.total_output_tokens) != null ? _b2 : 0;
  const totalThought = (_c = usage.total_thought_tokens) != null ? _c : 0;
  const totalCached = (_d = usage.total_cached_tokens) != null ? _d : 0;
  return {
    inputTokens: {
      total: (_e = usage.total_input_tokens) != null ? _e : void 0,
      noCache: usage.total_input_tokens == null ? void 0 : totalInput - totalCached,
      cacheRead: (_f = usage.total_cached_tokens) != null ? _f : void 0,
      cacheWrite: void 0
    },
    outputTokens: {
      total: usage.total_output_tokens == null && usage.total_thought_tokens == null ? void 0 : totalOutput + totalThought,
      text: (_g = usage.total_output_tokens) != null ? _g : void 0,
      reasoning: (_h = usage.total_thought_tokens) != null ? _h : void 0
    },
    raw: usage
  };
}
function inferDocMediaType(uriOrName) {
  const lower = uriOrName.toLowerCase();
  for (const [ext, media] of Object.entries(KNOWN_DOC_EXTENSIONS)) {
    if (lower.endsWith(`.${ext}`)) return media;
  }
  return "application/octet-stream";
}
function basename(uriOrName) {
  const parts = uriOrName.split("/");
  const last = parts[parts.length - 1];
  return last && last.length > 0 ? last : void 0;
}
function annotationToSource({
  annotation,
  generateId: generateId3
}) {
  var _a2, _b2, _c, _d, _e;
  switch (annotation.type) {
    case "url_citation": {
      const urlCitation = annotation;
      if (urlCitation.url == null || urlCitation.url.length === 0) {
        return void 0;
      }
      return {
        type: "source",
        sourceType: "url",
        id: generateId3(),
        url: urlCitation.url,
        ...urlCitation.title != null ? { title: urlCitation.title } : {}
      };
    }
    case "file_citation": {
      const fileCitation = annotation;
      const uri = (_b2 = (_a2 = fileCitation.url) != null ? _a2 : fileCitation.document_uri) != null ? _b2 : fileCitation.file_name;
      if (uri == null || uri.length === 0) return void 0;
      if (uri.startsWith("http://") || uri.startsWith("https://")) {
        return {
          type: "source",
          sourceType: "url",
          id: generateId3(),
          url: uri,
          ...fileCitation.file_name != null ? { title: fileCitation.file_name } : {}
        };
      }
      const filename = (_c = fileCitation.file_name) != null ? _c : basename(uri);
      const mediaType = inferDocMediaType(uri);
      return {
        type: "source",
        sourceType: "document",
        id: generateId3(),
        mediaType,
        title: (_e = (_d = fileCitation.file_name) != null ? _d : filename) != null ? _e : uri,
        ...filename != null ? { filename } : {}
      };
    }
    case "place_citation": {
      const placeCitation = annotation;
      if (placeCitation.url == null || placeCitation.url.length === 0) {
        return void 0;
      }
      return {
        type: "source",
        sourceType: "url",
        id: generateId3(),
        url: placeCitation.url,
        ...placeCitation.name != null ? { title: placeCitation.name } : {}
      };
    }
    default:
      return void 0;
  }
}
function builtinToolResultToSources({
  block,
  generateId: generateId3
}) {
  var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const sources = [];
  switch (block.type) {
    case "url_context_result": {
      const result = (_a2 = block.result) != null ? _a2 : [];
      for (const entry of result) {
        if ((entry == null ? void 0 : entry.url) == null || entry.url.length === 0) continue;
        if (entry.status != null && entry.status !== "success") continue;
        sources.push({
          type: "source",
          sourceType: "url",
          id: generateId3(),
          url: entry.url
        });
      }
      break;
    }
    case "google_search_result": {
      const result = (_b2 = block.result) != null ? _b2 : [];
      for (const entry of result) {
        const url = entry == null ? void 0 : entry.url;
        if (url == null || url.length === 0) continue;
        sources.push({
          type: "source",
          sourceType: "url",
          id: generateId3(),
          url,
          ...entry.title != null ? { title: entry.title } : {}
        });
      }
      break;
    }
    case "google_maps_result": {
      const result = (_c = block.result) != null ? _c : [];
      for (const entry of result) {
        for (const place of (_d = entry.places) != null ? _d : []) {
          if (place.url == null || place.url.length === 0) continue;
          sources.push({
            type: "source",
            sourceType: "url",
            id: generateId3(),
            url: place.url,
            ...place.name != null ? { title: place.name } : {}
          });
        }
      }
      break;
    }
    case "file_search_result": {
      const result = (_e = block.result) != null ? _e : [];
      for (const raw of result) {
        if (raw == null || typeof raw !== "object") continue;
        const entry = raw;
        const uri = (_g = (_f = entry.url) != null ? _f : entry.document_uri) != null ? _g : entry.file_name;
        if (uri == null || uri.length === 0) continue;
        if (uri.startsWith("http://") || uri.startsWith("https://")) {
          sources.push({
            type: "source",
            sourceType: "url",
            id: generateId3(),
            url: uri,
            ...entry.title != null ? { title: entry.title } : {}
          });
          continue;
        }
        const filename = (_h = entry.file_name) != null ? _h : basename(uri);
        const mediaType = inferDocMediaType(uri);
        sources.push({
          type: "source",
          sourceType: "document",
          id: generateId3(),
          mediaType,
          title: (_k = (_j = (_i = entry.title) != null ? _i : entry.file_name) != null ? _j : filename) != null ? _k : uri,
          ...filename != null ? { filename } : {}
        });
      }
      break;
    }
    default:
      break;
  }
  return sources;
}
function annotationsToSources({
  annotations,
  generateId: generateId3
}) {
  var _a2;
  if (annotations == null) return [];
  const seen = /* @__PURE__ */ new Set();
  const sources = [];
  for (const annotation of annotations) {
    const source = annotationToSource({ annotation, generateId: generateId3 });
    if (source == null) continue;
    const key = source.sourceType === "url" ? `url:${source.url}` : `doc:${(_a2 = source.filename) != null ? _a2 : source.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push(source);
  }
  return sources;
}
function mapGoogleInteractionsFinishReason({
  status,
  hasFunctionCall
}) {
  switch (status) {
    case "completed":
      return hasFunctionCall ? "tool-calls" : "stop";
    case "requires_action":
      return "tool-calls";
    case "failed":
      return "error";
    case "incomplete":
      return "length";
    case "cancelled":
      return "other";
    case "in_progress":
    default:
      return "other";
  }
}
function builtinToolNameFromCallType(type) {
  return type.replace(/_call$/, "");
}
function builtinToolNameFromResultType(type) {
  return type.replace(/_result$/, "");
}
function buildGoogleInteractionsStreamTransform({
  warnings,
  generateId: generateId3,
  includeRawChunks,
  serviceTier: headerServiceTier
}) {
  let interactionId;
  let usage;
  let serviceTier = headerServiceTier;
  let finishStatus;
  let hasFunctionCall = false;
  const openBlocks = /* @__PURE__ */ new Map();
  const emittedSourceKeys = /* @__PURE__ */ new Set();
  function sourceKey(source) {
    var _a2;
    return source.sourceType === "url" ? `url:${source.url}` : `doc:${(_a2 = source.filename) != null ? _a2 : source.title}`;
  }
  return new TransformStream({
    start(controller) {
      controller.enqueue({ type: "stream-start", warnings });
    },
    transform(chunk, controller) {
      var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
      if (includeRawChunks) {
        controller.enqueue({ type: "raw", rawValue: chunk.rawValue });
      }
      if (!chunk.success) {
        finishStatus = "failed";
        controller.enqueue({ type: "error", error: chunk.error });
        return;
      }
      const value = chunk.value;
      const eventType = value.event_type;
      switch (eventType) {
        case "interaction.created": {
          const event = value;
          const interaction = event.interaction;
          interactionId = (interaction == null ? void 0 : interaction.id) != null && interaction.id.length > 0 ? interaction.id : void 0;
          const created = interaction == null ? void 0 : interaction.created;
          let timestamp;
          if (typeof created === "string") {
            const parsed = new Date(created);
            if (!Number.isNaN(parsed.getTime())) {
              timestamp = parsed;
            }
          }
          controller.enqueue({
            type: "response-metadata",
            ...interactionId != null ? { id: interactionId } : {},
            modelId: interaction == null ? void 0 : interaction.model,
            ...timestamp ? { timestamp } : {}
          });
          break;
        }
        case "step.start": {
          const event = value;
          const step = event.step;
          const index = event.index;
          const blockId = `${interactionId != null ? interactionId : "interaction"}:${index}`;
          const stepType = step == null ? void 0 : step.type;
          if (stepType === "model_output") {
            const initial = (_a2 = step == null ? void 0 : step.content) == null ? void 0 : _a2[0];
            if ((initial == null ? void 0 : initial.type) === "text") {
              openBlocks.set(index, {
                kind: "text",
                id: blockId,
                emittedSourceKeys: /* @__PURE__ */ new Set()
              });
              controller.enqueue({ type: "text-start", id: blockId });
              const initialSources = annotationsToSources({
                annotations: initial.annotations,
                generateId: generateId3
              });
              for (const source of initialSources) {
                const key = sourceKey(source);
                if (emittedSourceKeys.has(key)) continue;
                emittedSourceKeys.add(key);
                controller.enqueue(source);
              }
            } else if ((initial == null ? void 0 : initial.type) === "image") {
              openBlocks.set(index, {
                kind: "image",
                id: blockId,
                ...initial.data != null ? { data: initial.data } : {},
                ...initial.mime_type != null ? { mimeType: initial.mime_type } : {},
                ...initial.uri != null ? { uri: initial.uri } : {}
              });
            } else {
              openBlocks.set(index, {
                kind: "pending_model_output",
                id: blockId
              });
            }
          } else if (stepType === "thought") {
            const signature = step == null ? void 0 : step.signature;
            openBlocks.set(index, {
              kind: "reasoning",
              id: blockId,
              ...signature != null ? { signature } : {}
            });
            controller.enqueue({ type: "reasoning-start", id: blockId });
            if (Array.isArray(step == null ? void 0 : step.summary)) {
              for (const item of step.summary) {
                if ((item == null ? void 0 : item.type) === "text" && typeof item.text === "string") {
                  controller.enqueue({
                    type: "reasoning-delta",
                    id: blockId,
                    delta: item.text
                  });
                }
              }
            }
          } else if (stepType === "function_call") {
            const toolCallId = (_b2 = step == null ? void 0 : step.id) != null ? _b2 : blockId;
            const toolName = (_c = step == null ? void 0 : step.name) != null ? _c : "unknown";
            hasFunctionCall = true;
            const state = {
              kind: "function_call",
              id: blockId,
              toolCallId,
              toolName,
              argumentsAccum: "",
              ...(step == null ? void 0 : step.signature) != null ? { signature: step.signature } : {}
            };
            openBlocks.set(index, state);
            controller.enqueue({
              type: "tool-input-start",
              id: toolCallId,
              toolName
            });
          } else if (stepType != null && BUILTIN_TOOL_CALL_TYPES.has(stepType)) {
            const toolName = stepType === "mcp_server_tool_call" ? (_d = step == null ? void 0 : step.name) != null ? _d : "mcp_server_tool" : builtinToolNameFromCallType(stepType);
            const toolCallId = (_e = step == null ? void 0 : step.id) != null ? _e : blockId;
            const state = {
              kind: "builtin_tool_call",
              id: blockId,
              blockType: stepType,
              toolCallId,
              toolName,
              arguments: (_f = step == null ? void 0 : step.arguments) != null ? _f : {},
              callEmitted: false
            };
            openBlocks.set(index, state);
          } else if (stepType != null && BUILTIN_TOOL_RESULT_TYPES.has(stepType)) {
            const toolName = stepType === "mcp_server_tool_result" ? (_g = step == null ? void 0 : step.name) != null ? _g : "mcp_server_tool" : builtinToolNameFromResultType(stepType);
            const callId = (_h = step == null ? void 0 : step.call_id) != null ? _h : blockId;
            const state = {
              kind: "builtin_tool_result",
              id: blockId,
              blockType: stepType,
              callId,
              toolName,
              result: (_i = step == null ? void 0 : step.result) != null ? _i : null,
              ...(step == null ? void 0 : step.is_error) != null ? { isError: step.is_error } : {},
              resultEmitted: false
            };
            openBlocks.set(index, state);
          } else {
            openBlocks.set(index, { kind: "unknown", id: blockId });
          }
          break;
        }
        case "step.delta": {
          const event = value;
          let open = openBlocks.get(event.index);
          if (open == null) break;
          const dtype = (_j = event.delta) == null ? void 0 : _j.type;
          if (open.kind === "pending_model_output") {
            if (dtype === "text" || dtype === "text_annotation" || dtype === "text_annotation_delta") {
              const promoted = {
                kind: "text",
                id: open.id,
                emittedSourceKeys: /* @__PURE__ */ new Set()
              };
              openBlocks.set(event.index, promoted);
              open = promoted;
              controller.enqueue({ type: "text-start", id: promoted.id });
            }
          }
          if (dtype === "image" && (open.kind === "pending_model_output" || open.kind === "text" || open.kind === "image")) {
            const imageDelta = event.delta;
            const google2 = {};
            if (interactionId != null) google2.interactionId = interactionId;
            const providerMetadata = Object.keys(google2).length > 0 ? { google: google2 } : void 0;
            if ((imageDelta == null ? void 0 : imageDelta.data) != null && imageDelta.data.length > 0) {
              controller.enqueue({
                type: "file",
                mediaType: (_k = imageDelta.mime_type) != null ? _k : "image/png",
                data: { type: "data", data: imageDelta.data },
                ...providerMetadata ? { providerMetadata } : {}
              });
            } else if ((imageDelta == null ? void 0 : imageDelta.uri) != null && imageDelta.uri.length > 0) {
              controller.enqueue({
                type: "file",
                mediaType: (_l = imageDelta.mime_type) != null ? _l : "image/png",
                data: { type: "url", url: new URL(imageDelta.uri) },
                ...providerMetadata ? { providerMetadata } : {}
              });
            }
            if (open.kind === "image") {
              open.data = void 0;
              open.uri = void 0;
            }
            break;
          }
          const delta = event.delta;
          if (open.kind === "text" && (delta == null ? void 0 : delta.type) === "text") {
            const text = (_m = delta.text) != null ? _m : "";
            if (text.length > 0) {
              controller.enqueue({
                type: "text-delta",
                id: open.id,
                delta: text
              });
            }
          } else if (open.kind === "text" && ((delta == null ? void 0 : delta.type) === "text_annotation" || (delta == null ? void 0 : delta.type) === "text_annotation_delta")) {
            const sources = annotationsToSources({
              annotations: delta.annotations,
              generateId: generateId3
            });
            for (const source of sources) {
              const key = sourceKey(source);
              if (emittedSourceKeys.has(key)) continue;
              emittedSourceKeys.add(key);
              open.emittedSourceKeys.add(key);
              controller.enqueue(source);
            }
          } else if (open.kind === "image" && (delta == null ? void 0 : delta.type) === "image") {
            if (delta.data != null) open.data = delta.data;
            if (delta.mime_type != null) open.mimeType = delta.mime_type;
            if (delta.uri != null) open.uri = delta.uri;
          } else if (open.kind === "reasoning") {
            if ((delta == null ? void 0 : delta.type) === "thought_summary") {
              const item = delta.content;
              if ((item == null ? void 0 : item.type) === "text" && typeof item.text === "string") {
                controller.enqueue({
                  type: "reasoning-delta",
                  id: open.id,
                  delta: item.text
                });
              }
            } else if ((delta == null ? void 0 : delta.type) === "thought_signature") {
              const signature = delta.signature;
              if (signature != null) {
                open.signature = signature;
              }
            }
          } else if (open.kind === "function_call" && (delta == null ? void 0 : delta.type) === "arguments_delta") {
            const slice = typeof delta.arguments === "string" ? delta.arguments : "";
            if (slice.length > 0) {
              open.argumentsAccum += slice;
              controller.enqueue({
                type: "tool-input-delta",
                id: open.toolCallId,
                delta: slice
              });
            }
            if (delta.id != null) {
              open.toolCallId = delta.id;
            }
            if (delta.signature != null) {
              open.signature = delta.signature;
            }
            hasFunctionCall = true;
          } else if (open.kind === "builtin_tool_call" && (delta == null ? void 0 : delta.type) === open.blockType) {
            if (delta.id != null) open.toolCallId = delta.id;
            if (delta.arguments != null && typeof delta.arguments === "object") {
              open.arguments = delta.arguments;
            }
            if (delta.name != null && open.blockType === "mcp_server_tool_call") {
              open.toolName = delta.name;
            }
          } else if (open.kind === "builtin_tool_result" && (delta == null ? void 0 : delta.type) === open.blockType) {
            if (delta.call_id != null) open.callId = delta.call_id;
            if (delta.result !== void 0) open.result = delta.result;
            if (delta.is_error != null) open.isError = delta.is_error;
            if (delta.name != null && open.blockType === "mcp_server_tool_result") {
              open.toolName = delta.name;
            }
          }
          break;
        }
        case "step.stop": {
          const event = value;
          const open = openBlocks.get(event.index);
          if (open == null) break;
          if (open.kind === "text") {
            const textProviderMetadata = interactionId != null ? { google: { interactionId } } : void 0;
            controller.enqueue({
              type: "text-end",
              id: open.id,
              ...textProviderMetadata ? { providerMetadata: textProviderMetadata } : {}
            });
          } else if (open.kind === "reasoning") {
            const google2 = {};
            if (open.signature != null) google2.signature = open.signature;
            if (interactionId != null) google2.interactionId = interactionId;
            const providerMetadata = Object.keys(google2).length > 0 ? { google: google2 } : void 0;
            controller.enqueue({
              type: "reasoning-end",
              id: open.id,
              ...providerMetadata ? { providerMetadata } : {}
            });
          } else if (open.kind === "image") {
            const google2 = {};
            if (interactionId != null) google2.interactionId = interactionId;
            const providerMetadata = Object.keys(google2).length > 0 ? { google: google2 } : void 0;
            if (open.data != null && open.data.length > 0) {
              controller.enqueue({
                type: "file",
                mediaType: (_n = open.mimeType) != null ? _n : "image/png",
                data: { type: "data", data: open.data },
                ...providerMetadata ? { providerMetadata } : {}
              });
            } else if (open.uri != null && open.uri.length > 0) {
              controller.enqueue({
                type: "file",
                mediaType: (_o = open.mimeType) != null ? _o : "image/png",
                data: { type: "url", url: new URL(open.uri) },
                ...providerMetadata ? { providerMetadata } : {}
              });
            }
          } else if (open.kind === "function_call") {
            const accumulated = open.argumentsAccum.length > 0 ? open.argumentsAccum : "{}";
            controller.enqueue({
              type: "tool-input-end",
              id: open.toolCallId
            });
            const google2 = {};
            if (open.signature != null) google2.signature = open.signature;
            if (interactionId != null) google2.interactionId = interactionId;
            const providerMetadata = Object.keys(google2).length > 0 ? { google: google2 } : void 0;
            controller.enqueue({
              type: "tool-call",
              toolCallId: open.toolCallId,
              toolName: open.toolName,
              input: accumulated,
              ...providerMetadata ? { providerMetadata } : {}
            });
          } else if (open.kind === "builtin_tool_call" && !open.callEmitted) {
            controller.enqueue({
              type: "tool-call",
              toolCallId: open.toolCallId,
              toolName: open.toolName,
              input: JSON.stringify((_p = open.arguments) != null ? _p : {}),
              providerExecuted: true
            });
            open.callEmitted = true;
          } else if (open.kind === "builtin_tool_result" && !open.resultEmitted) {
            controller.enqueue({
              type: "tool-result",
              toolCallId: open.callId,
              toolName: open.toolName,
              result: (_q = open.result) != null ? _q : null
            });
            open.resultEmitted = true;
            const sources = builtinToolResultToSources({
              block: {
                type: open.blockType,
                call_id: open.callId,
                result: open.result
              },
              generateId: generateId3
            });
            for (const source of sources) {
              const key = sourceKey(source);
              if (emittedSourceKeys.has(key)) continue;
              emittedSourceKeys.add(key);
              controller.enqueue(source);
            }
          }
          openBlocks.delete(event.index);
          break;
        }
        case "interaction.status_update":
        case "interaction.in_progress":
        case "interaction.requires_action": {
          const event = value;
          if (event.status != null) {
            finishStatus = event.status;
          } else if (eventType === "interaction.requires_action") {
            finishStatus = "requires_action";
          } else {
            finishStatus = "in_progress";
          }
          break;
        }
        case "interaction.completed": {
          const event = value;
          const interaction = event.interaction;
          if ((interaction == null ? void 0 : interaction.id) != null && interaction.id.length > 0) {
            interactionId = interaction.id;
          }
          if ((interaction == null ? void 0 : interaction.status) != null) {
            finishStatus = interaction.status;
          }
          if ((interaction == null ? void 0 : interaction.usage) != null) {
            usage = interaction.usage;
          }
          if ((interaction == null ? void 0 : interaction.service_tier) != null) {
            serviceTier = interaction.service_tier;
          }
          break;
        }
        case "error": {
          const event = value;
          finishStatus = "failed";
          const errorPayload = (_r = event.error) != null ? _r : {
            message: "Unknown interaction error"
          };
          controller.enqueue({ type: "error", error: errorPayload });
          break;
        }
        default:
          break;
      }
    },
    flush(controller) {
      const finishReason = {
        unified: mapGoogleInteractionsFinishReason({
          status: finishStatus,
          hasFunctionCall
        }),
        raw: finishStatus
      };
      const providerMetadata = {
        google: {
          ...interactionId != null ? { interactionId } : {},
          ...serviceTier != null ? { serviceTier } : {}
        }
      };
      controller.enqueue({
        type: "finish",
        finishReason,
        usage: convertGoogleInteractionsUsage(usage),
        providerMetadata
      });
    }
  });
}
function convertToGoogleInteractionsInput({
  prompt,
  previousInteractionId,
  store,
  mediaResolution
}) {
  var _a2, _b2, _c, _d, _e, _f, _g;
  const warnings = [];
  const incoherentCombo = previousInteractionId != null && store === false;
  const shouldCompact = previousInteractionId != null && store !== false;
  if (incoherentCombo) {
    warnings.push({
      type: "other",
      message: "google.interactions: providerOptions.google.previousInteractionId was set together with store: false. These are incoherent (the prior interaction cannot be referenced when nothing was stored on the server); the full history will be sent and previous_interaction_id will still be emitted."
    });
  }
  const compactedPrompt = shouldCompact ? compactPromptForPreviousInteraction({
    prompt,
    previousInteractionId
  }) : prompt;
  const systemTexts = [];
  const steps = [];
  for (const message of compactedPrompt) {
    switch (message.role) {
      case "system": {
        systemTexts.push(message.content);
        break;
      }
      case "user": {
        const content = [];
        for (const part of message.content) {
          if (part.type === "text") {
            content.push({ type: "text", text: part.text });
          } else if (part.type === "file") {
            const fileBlock = convertFilePartToContent({
              part,
              warnings,
              mediaResolution
            });
            if (fileBlock != null) {
              content.push(fileBlock);
            }
          }
        }
        const merged = mergeAdjacentTextContent(content);
        if (merged.length > 0) {
          steps.push({ type: "user_input", content: merged });
        }
        break;
      }
      case "assistant": {
        let pendingModelOutput = [];
        const flushModelOutput = () => {
          if (pendingModelOutput.length > 0) {
            steps.push({ type: "model_output", content: pendingModelOutput });
            pendingModelOutput = [];
          }
        };
        for (const part of message.content) {
          if (part.type === "text") {
            pendingModelOutput.push({ type: "text", text: part.text });
          } else if (part.type === "reasoning") {
            flushModelOutput();
            const signature = (_b2 = (_a2 = part.providerOptions) == null ? void 0 : _a2.google) == null ? void 0 : _b2.signature;
            steps.push({
              type: "thought",
              ...signature != null ? { signature } : {},
              summary: part.text.length > 0 ? [{ type: "text", text: part.text }] : void 0
            });
          } else if (part.type === "file") {
            const fileBlock = convertFilePartToContent({
              part,
              warnings,
              mediaResolution
            });
            if (fileBlock != null) {
              pendingModelOutput.push(fileBlock);
            }
          } else if (part.type === "tool-call") {
            flushModelOutput();
            const signature = (_d = (_c = part.providerOptions) == null ? void 0 : _c.google) == null ? void 0 : _d.signature;
            const args = typeof part.input === "string" ? safeParseToolArgs(part.input) : (_e = part.input) != null ? _e : {};
            steps.push({
              type: "function_call",
              id: part.toolCallId,
              name: part.toolName,
              arguments: args,
              ...signature != null ? { signature } : {}
            });
          } else {
            warnings.push({
              type: "other",
              message: `google.interactions: unsupported assistant content part type "${part.type}"; part dropped.`
            });
          }
        }
        flushModelOutput();
        break;
      }
      case "tool": {
        const content = [];
        for (const part of message.content) {
          if (part.type !== "tool-result") {
            warnings.push({
              type: "other",
              message: `google.interactions: unsupported tool message part type "${part.type}"; part dropped.`
            });
            continue;
          }
          const block = convertToolResultPart({
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            output: part.output,
            signature: (_g = (_f = part.providerOptions) == null ? void 0 : _f.google) == null ? void 0 : _g.signature,
            warnings
          });
          content.push(block);
        }
        if (content.length > 0) {
          steps.push({ type: "user_input", content });
        }
        break;
      }
    }
  }
  const systemInstruction = systemTexts.length > 0 ? systemTexts.join("\n\n") : void 0;
  return { input: steps, systemInstruction, warnings };
}
function convertFilePartToContent({
  part,
  warnings,
  mediaResolution
}) {
  if (part.data.type === "text") {
    return {
      type: "text",
      text: part.data.text
    };
  }
  const topLevel = getTopLevelMediaType(part.mediaType);
  let kind;
  switch (topLevel) {
    case "image":
      kind = "image";
      break;
    case "audio":
      kind = "audio";
      break;
    case "video":
      kind = "video";
      break;
    case "application":
      kind = "document";
      break;
    default:
      kind = void 0;
  }
  if (kind == null) {
    warnings.push({
      type: "other",
      message: `google.interactions: unsupported file media type "${part.mediaType}"; part dropped.`
    });
    return void 0;
  }
  const resolutionField = mediaResolution != null && (kind === "image" || kind === "video") ? { resolution: mediaResolution } : {};
  switch (part.data.type) {
    case "data": {
      const mimeType = resolveFullMediaType({ part });
      return {
        type: kind,
        data: convertToBase64(part.data.data),
        mime_type: mimeType,
        ...resolutionField
      };
    }
    case "url": {
      return {
        type: kind,
        uri: part.data.url.toString(),
        ...isFullMediaType(part.mediaType) ? { mime_type: part.mediaType } : {},
        ...resolutionField
      };
    }
    case "reference": {
      const uri = resolveProviderReference({
        reference: part.data.reference,
        provider: "google"
      });
      return {
        type: kind,
        uri,
        ...isFullMediaType(part.mediaType) ? { mime_type: part.mediaType } : {},
        ...resolutionField
      };
    }
  }
}
function compactPromptForPreviousInteraction({
  prompt,
  previousInteractionId
}) {
  const out = [];
  const droppedToolCallIds = /* @__PURE__ */ new Set();
  for (const message of prompt) {
    if (message.role === "assistant") {
      const matchesLinkedInteraction = message.content.some((part) => {
        var _a2, _b2;
        const partInteractionId = (_b2 = (_a2 = part.providerOptions) == null ? void 0 : _a2.google) == null ? void 0 : _b2.interactionId;
        return partInteractionId === previousInteractionId;
      });
      if (matchesLinkedInteraction) {
        for (const part of message.content) {
          if (part.type === "tool-call") {
            droppedToolCallIds.add(part.toolCallId);
          }
        }
        continue;
      }
      out.push(message);
      continue;
    }
    if (message.role === "tool") {
      const remaining = message.content.filter((part) => {
        if (part.type !== "tool-result") {
          return true;
        }
        return !droppedToolCallIds.has(part.toolCallId);
      });
      if (remaining.length === 0) {
        continue;
      }
      out.push({
        ...message,
        content: remaining
      });
      continue;
    }
    out.push(message);
  }
  return out;
}
function safeParseToolArgs(input) {
  try {
    const parsed = JSON.parse(input);
    if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    return { value: parsed };
  } catch (e) {
    return { value: input };
  }
}
function convertToolResultPart({
  toolCallId,
  toolName,
  output,
  signature,
  warnings
}) {
  var _a2;
  const base = {
    type: "function_result",
    call_id: toolCallId,
    name: toolName,
    ...signature != null ? { signature } : {}
  };
  switch (output.type) {
    case "text":
      return { ...base, result: output.value };
    case "json":
      return { ...base, result: JSON.stringify(output.value) };
    case "error-text":
      return { ...base, is_error: true, result: output.value };
    case "error-json":
      return { ...base, is_error: true, result: JSON.stringify(output.value) };
    case "execution-denied":
      return {
        ...base,
        is_error: true,
        result: (_a2 = output.reason) != null ? _a2 : "Tool execution denied by user."
      };
    case "content": {
      const blocks = [];
      for (const item of output.value) {
        if (item.type === "text") {
          blocks.push({ type: "text", text: item.text });
        } else if (item.type === "file") {
          const topLevel = getTopLevelMediaType(item.mediaType);
          if (topLevel !== "image") {
            warnings.push({
              type: "other",
              message: `google.interactions: tool-result file with mediaType "${item.mediaType}" is not supported (Interactions \`function_result.result\` accepts only text and image content); part dropped.`
            });
            continue;
          }
          const imageBlock = filePartToImageBlock({ part: item, warnings });
          if (imageBlock != null) {
            blocks.push(imageBlock);
          }
        } else {
          warnings.push({
            type: "other",
            message: `google.interactions: tool-result content part type "${item.type}" is not supported; part dropped.`
          });
        }
      }
      return { ...base, result: blocks };
    }
  }
}
function filePartToImageBlock({
  part,
  warnings
}) {
  switch (part.data.type) {
    case "data": {
      const mimeType = isFullMediaType(part.mediaType) ? part.mediaType : resolveFullMediaType({
        part: {
          type: "file",
          mediaType: part.mediaType,
          data: part.data
        }
      });
      return {
        type: "image",
        data: convertToBase64(part.data.data),
        mime_type: mimeType
      };
    }
    case "url":
      return {
        type: "image",
        uri: part.data.url.toString(),
        ...isFullMediaType(part.mediaType) ? { mime_type: part.mediaType } : {}
      };
    case "reference": {
      const uri = resolveProviderReference({
        reference: part.data.reference,
        provider: "google"
      });
      return {
        type: "image",
        uri,
        ...isFullMediaType(part.mediaType) ? { mime_type: part.mediaType } : {}
      };
    }
    case "text": {
      warnings.push({
        type: "other",
        message: 'google.interactions: tool-result image part with `data.type === "text"` is not representable as an image; part dropped.'
      });
      return void 0;
    }
  }
}
function mergeAdjacentTextContent(content) {
  if (content.length < 2) {
    return content;
  }
  const result = [];
  for (const block of content) {
    const last = result[result.length - 1];
    if (block.type === "text" && last != null && last.type === "text" && last.annotations == null && block.annotations == null) {
      const merged = {
        type: "text",
        text: `${last.text}

${block.text}`
      };
      result[result.length - 1] = merged;
      continue;
    }
    result.push(block);
  }
  return result;
}
function googleProviderMetadata({
  signature,
  interactionId
}) {
  const google2 = {};
  if (signature != null) {
    google2.signature = signature;
  }
  if (interactionId != null) {
    google2.interactionId = interactionId;
  }
  return Object.keys(google2).length > 0 ? { providerMetadata: { google: google2 } } : {};
}
function builtinToolNameFromCallType2(type) {
  return type.replace(/_call$/, "");
}
function builtinToolNameFromResultType2(type) {
  return type.replace(/_result$/, "");
}
function parseGoogleInteractionsOutputs({
  steps,
  generateId: generateId3,
  interactionId
}) {
  var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const content = [];
  let hasFunctionCall = false;
  if (steps == null) {
    return { content, hasFunctionCall };
  }
  for (const step of steps) {
    if (step == null || typeof step !== "object") continue;
    const type = step.type;
    if (typeof type !== "string") continue;
    switch (type) {
      case "user_input": {
        break;
      }
      case "model_output": {
        const blocks = (_a2 = step.content) != null ? _a2 : [];
        for (const block of blocks) {
          if (block == null || typeof block !== "object") continue;
          const blockType = block.type;
          if (blockType === "text") {
            const text = (_b2 = block.text) != null ? _b2 : "";
            const annotations = block.annotations;
            content.push({
              type: "text",
              text,
              ...googleProviderMetadata({ interactionId })
            });
            const sources = annotationsToSources({ annotations, generateId: generateId3 });
            for (const source of sources) {
              content.push(source);
            }
          } else if (blockType === "image") {
            const image = block;
            if (image.data != null && image.data.length > 0) {
              content.push({
                type: "file",
                mediaType: (_c = image.mime_type) != null ? _c : "image/png",
                data: { type: "data", data: image.data },
                ...googleProviderMetadata({ interactionId })
              });
            } else if (image.uri != null && image.uri.length > 0) {
              content.push({
                type: "file",
                mediaType: (_d = image.mime_type) != null ? _d : "image/png",
                data: { type: "url", url: new URL(image.uri) },
                ...googleProviderMetadata({ interactionId })
              });
            }
          }
        }
        break;
      }
      case "thought": {
        const thought = step;
        const summary = Array.isArray(thought.summary) ? thought.summary : [];
        const text = summary.filter(
          (item) => (item == null ? void 0 : item.type) === "text" && typeof item.text === "string"
        ).map((item) => item.text).join("\n");
        content.push({
          type: "reasoning",
          text,
          ...googleProviderMetadata({
            signature: thought.signature,
            interactionId
          })
        });
        break;
      }
      case "function_call": {
        hasFunctionCall = true;
        const call = step;
        content.push({
          type: "tool-call",
          toolCallId: call.id,
          toolName: call.name,
          input: JSON.stringify((_e = call.arguments) != null ? _e : {}),
          ...googleProviderMetadata({
            signature: call.signature,
            interactionId
          })
        });
        break;
      }
      default: {
        if (BUILTIN_TOOL_CALL_TYPES2.has(type)) {
          const call = step;
          const toolName = type === "mcp_server_tool_call" ? (_f = call.name) != null ? _f : "mcp_server_tool" : builtinToolNameFromCallType2(type);
          const input = JSON.stringify((_g = call.arguments) != null ? _g : {});
          content.push({
            type: "tool-call",
            toolCallId: (_h = call.id) != null ? _h : generateId3(),
            toolName,
            input,
            providerExecuted: true
          });
        } else if (BUILTIN_TOOL_RESULT_TYPES2.has(type)) {
          const result = step;
          const toolName = type === "mcp_server_tool_result" ? (_i = result.name) != null ? _i : "mcp_server_tool" : builtinToolNameFromResultType2(type);
          content.push({
            type: "tool-result",
            toolCallId: (_j = result.call_id) != null ? _j : generateId3(),
            toolName,
            result: (_k = result.result) != null ? _k : null
          });
          const sources = builtinToolResultToSources({
            block: step,
            generateId: generateId3
          });
          for (const source of sources) {
            content.push(source);
          }
        }
        break;
      }
    }
  }
  return { content, hasFunctionCall };
}
async function cancelGoogleInteraction({
  baseURL,
  interactionId,
  headers,
  fetch: fetch2 = getOriginalFetch3()
}) {
  if (interactionId == null || interactionId.length === 0) {
    return;
  }
  const url = `${baseURL}/interactions/${encodeURIComponent(interactionId)}/cancel`;
  try {
    const response = await fetch2(url, {
      method: "POST",
      headers: withUserAgentSuffix(
        combineHeaders({ "Content-Type": "application/json" }, headers),
        getRuntimeEnvironmentUserAgent()
      ),
      body: "{}"
    });
    try {
      await response.text();
    } catch (e) {
    }
  } catch (e) {
  }
}
function isTerminalStatus(status) {
  return status != null && TERMINAL_STATUSES.has(status);
}
async function pollGoogleInteractionUntilTerminal({
  baseURL,
  interactionId,
  headers,
  fetch: fetch2,
  abortSignal,
  initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
  maxDelayMs = DEFAULT_MAX_DELAY_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS
}) {
  if (interactionId == null || interactionId.length === 0) {
    throw new Error(
      "google.interactions: cannot poll a background interaction without an id. The POST response did not include an interaction id."
    );
  }
  const startedAt = Date.now();
  let nextDelayMs = initialDelayMs;
  const url = `${baseURL}/interactions/${encodeURIComponent(interactionId)}`;
  const cancelOnServer = () => cancelGoogleInteraction({ baseURL, interactionId, headers, fetch: fetch2 });
  try {
    while (true) {
      if (abortSignal == null ? void 0 : abortSignal.aborted) {
        await cancelOnServer();
        throw new DOMException("Polling was aborted", "AbortError");
      }
      if (Date.now() - startedAt > timeoutMs) {
        throw new Error(
          `google.interactions: timed out polling interaction ${interactionId} after ${timeoutMs}ms.`
        );
      }
      await delay(nextDelayMs, { abortSignal });
      const {
        value: response,
        rawValue: rawResponse,
        responseHeaders
      } = await getFromApi({
        url,
        headers,
        failedResponseHandler: googleFailedResponseHandler,
        successfulResponseHandler: createJsonResponseHandler(
          googleInteractionsResponseSchema
        ),
        abortSignal,
        fetch: fetch2
      });
      if (isTerminalStatus(response.status)) {
        return { response, rawResponse, responseHeaders };
      }
      nextDelayMs = Math.min(nextDelayMs * 2, maxDelayMs);
    }
  } catch (error) {
    if (isAbortError(error)) {
      await cancelOnServer();
    }
    throw error;
  }
}
function prepareGoogleInteractionsTools({
  tools,
  toolChoice
}) {
  var _a2, _b2, _c, _d;
  const toolWarnings = [];
  const normalized = (tools == null ? void 0 : tools.length) ? tools : void 0;
  if (normalized == null) {
    return { tools: void 0, toolChoice: void 0, toolWarnings };
  }
  const interactionsTools = [];
  for (const tool2 of normalized) {
    if (tool2.type === "function") {
      interactionsTools.push({
        type: "function",
        name: tool2.name,
        description: (_a2 = tool2.description) != null ? _a2 : "",
        parameters: tool2.inputSchema
      });
      continue;
    }
    if (tool2.type === "provider") {
      const args = (_b2 = tool2.args) != null ? _b2 : {};
      switch (tool2.id) {
        case "google.google_search": {
          const searchTypesArg = args.searchTypes;
          let search_types;
          if (searchTypesArg != null && typeof searchTypesArg === "object") {
            const list = [];
            if (searchTypesArg.webSearch != null) list.push("web_search");
            if (searchTypesArg.imageSearch != null) list.push("image_search");
            if (list.length > 0) {
              search_types = list;
            }
          }
          interactionsTools.push({
            type: "google_search",
            ...search_types != null ? { search_types } : {}
          });
          break;
        }
        case "google.code_execution": {
          interactionsTools.push({ type: "code_execution" });
          break;
        }
        case "google.url_context": {
          interactionsTools.push({ type: "url_context" });
          break;
        }
        case "google.file_search": {
          interactionsTools.push({
            type: "file_search",
            ...args.fileSearchStoreNames != null ? {
              file_search_store_names: args.fileSearchStoreNames
            } : {},
            ...args.topK != null ? { top_k: args.topK } : {},
            ...args.metadataFilter != null ? { metadata_filter: args.metadataFilter } : {}
          });
          break;
        }
        case "google.google_maps": {
          interactionsTools.push({
            type: "google_maps",
            ...args.latitude != null ? { latitude: args.latitude } : {},
            ...args.longitude != null ? { longitude: args.longitude } : {},
            ...args.enableWidget != null ? { enable_widget: args.enableWidget } : {}
          });
          break;
        }
        case "google.computer_use": {
          interactionsTools.push({
            type: "computer_use",
            environment: (_c = args.environment) != null ? _c : "browser",
            ...args.excludedPredefinedFunctions != null ? {
              excludedPredefinedFunctions: args.excludedPredefinedFunctions
            } : {}
          });
          break;
        }
        case "google.mcp_server": {
          interactionsTools.push({
            type: "mcp_server",
            ...args.name != null ? { name: args.name } : {},
            ...args.url != null ? { url: args.url } : {},
            ...args.headers != null ? { headers: args.headers } : {},
            ...args.allowedTools != null ? { allowed_tools: args.allowedTools } : {}
          });
          break;
        }
        case "google.retrieval": {
          const vertexAiSearchConfig = (_d = args.vertexAiSearchConfig) != null ? _d : void 0;
          interactionsTools.push({
            type: "retrieval",
            ...args.retrievalTypes != null ? {
              retrieval_types: args.retrievalTypes
            } : { retrieval_types: ["vertex_ai_search"] },
            ...vertexAiSearchConfig != null ? { vertex_ai_search_config: vertexAiSearchConfig } : {}
          });
          break;
        }
        default: {
          toolWarnings.push({
            type: "unsupported",
            feature: `provider-defined tool ${tool2.id}`,
            details: `provider-defined tool ${tool2.id} is not supported by google.interactions; tool dropped.`
          });
          break;
        }
      }
      continue;
    }
    toolWarnings.push({
      type: "unsupported",
      feature: `tool of type ${tool2.type}`,
      details: "Only function tools and google.* provider-defined tools are supported by google.interactions; tool dropped."
    });
  }
  const hasFunctionTool = interactionsTools.some((t) => t.type === "function");
  let mappedToolChoice;
  if (toolChoice != null && hasFunctionTool) {
    switch (toolChoice.type) {
      case "auto":
        mappedToolChoice = "auto";
        break;
      case "required":
        mappedToolChoice = "any";
        break;
      case "none":
        mappedToolChoice = "none";
        break;
      case "tool":
        mappedToolChoice = {
          allowed_tools: {
            mode: "validated",
            tools: [toolChoice.toolName]
          }
        };
        break;
    }
  }
  return {
    tools: interactionsTools.length > 0 ? interactionsTools : void 0,
    toolChoice: mappedToolChoice,
    toolWarnings
  };
}
function streamGoogleInteractionEvents({
  baseURL,
  interactionId,
  headers,
  fetch: fetch2,
  abortSignal,
  maxRetries = DEFAULT_MAX_RETRIES,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS
}) {
  if (interactionId.length === 0) {
    throw new Error(
      "google.interactions: cannot stream a background interaction without an id."
    );
  }
  const eventSourceHeaders = {
    ...headers,
    accept: "text/event-stream"
  };
  let lastEventId;
  let complete = false;
  let attempt = 0;
  let receivedAnyEventThisAttempt = false;
  let currentReader;
  const internalAbort = new AbortController();
  const upstreamAbortHandler = () => internalAbort.abort();
  if (abortSignal != null) {
    if (abortSignal.aborted) {
      internalAbort.abort();
    } else {
      abortSignal.addEventListener("abort", upstreamAbortHandler, {
        once: true
      });
    }
  }
  const effectiveSignal = internalAbort.signal;
  function buildUrl() {
    const base = `${baseURL}/interactions/${encodeURIComponent(interactionId)}`;
    const params = new URLSearchParams({ stream: "true" });
    if (lastEventId != null) {
      params.set("last_event_id", lastEventId);
    }
    return `${base}?${params.toString()}`;
  }
  async function openReader() {
    const { value: stream } = await getFromApi({
      url: buildUrl(),
      headers: eventSourceHeaders,
      failedResponseHandler: googleFailedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(
        googleInteractionsEventSchema
      ),
      abortSignal: effectiveSignal,
      fetch: fetch2
    });
    return stream.getReader();
  }
  return new ReadableStream({
    async start(controller) {
      try {
        while (!complete && !effectiveSignal.aborted) {
          if (currentReader == null) {
            try {
              currentReader = await openReader();
              receivedAnyEventThisAttempt = false;
            } catch (error) {
              if (isAbortError(error) || effectiveSignal.aborted) {
                controller.error(error);
                return;
              }
              attempt++;
              if (attempt >= maxRetries) {
                controller.error(error);
                return;
              }
              await delay(retryDelayMs * attempt, {
                abortSignal: effectiveSignal
              });
              continue;
            }
          }
          try {
            const { done, value } = await currentReader.read();
            if (done) {
              currentReader = void 0;
              if (complete) break;
              if (!receivedAnyEventThisAttempt) {
                attempt++;
                if (attempt >= maxRetries) {
                  controller.error(
                    new Error(
                      "google.interactions: SSE stream closed without producing any events."
                    )
                  );
                  return;
                }
                await delay(retryDelayMs * attempt, {
                  abortSignal: effectiveSignal
                });
              } else {
                attempt = 0;
              }
              continue;
            }
            receivedAnyEventThisAttempt = true;
            if (value.success) {
              const streamEvent = value.value;
              if (typeof streamEvent.event_id === "string" && streamEvent.event_id.length > 0) {
                lastEventId = streamEvent.event_id;
              }
              if (streamEvent.event_type === "interaction.completed" || streamEvent.event_type === "error") {
                complete = true;
              }
            }
            controller.enqueue(value);
          } catch (error) {
            if (isAbortError(error) || effectiveSignal.aborted) {
              controller.error(error);
              return;
            }
            currentReader = void 0;
            attempt++;
            if (attempt >= maxRetries) {
              controller.error(error);
              return;
            }
            await delay(retryDelayMs * attempt, {
              abortSignal: effectiveSignal
            });
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        if (abortSignal != null) {
          abortSignal.removeEventListener("abort", upstreamAbortHandler);
        }
        currentReader == null ? void 0 : currentReader.cancel().catch(() => {
        });
        currentReader = void 0;
        if (effectiveSignal.aborted && !complete) {
          await cancelGoogleInteraction({
            baseURL,
            interactionId,
            headers,
            fetch: fetch2
          });
        }
      }
    },
    cancel() {
      internalAbort.abort();
      currentReader == null ? void 0 : currentReader.cancel().catch(() => {
      });
      currentReader = void 0;
    }
  });
}
function synthesizeGoogleInteractionsAgentStream({
  response,
  warnings,
  generateId: generateId3,
  includeRawChunks,
  headerServiceTier
}) {
  return new ReadableStream({
    start(controller) {
      var _a2, _b2, _c;
      controller.enqueue({ type: "stream-start", warnings });
      const interactionId = typeof response.id === "string" && response.id.length > 0 ? response.id : void 0;
      let timestamp;
      const created = response.created;
      if (typeof created === "string") {
        const parsed = new Date(created);
        if (!Number.isNaN(parsed.getTime())) {
          timestamp = parsed;
        }
      }
      controller.enqueue({
        type: "response-metadata",
        ...interactionId != null ? { id: interactionId } : {},
        modelId: (_a2 = response.model) != null ? _a2 : void 0,
        ...timestamp ? { timestamp } : {}
      });
      if (includeRawChunks) {
        controller.enqueue({ type: "raw", rawValue: response });
      }
      const { content, hasFunctionCall } = parseGoogleInteractionsOutputs({
        steps: (_b2 = response.steps) != null ? _b2 : null,
        generateId: generateId3,
        interactionId
      });
      let blockCounter = 0;
      const nextBlockId = () => `${interactionId != null ? interactionId : "agent"}:${blockCounter++}`;
      for (const part of content) {
        switch (part.type) {
          case "text": {
            const id = nextBlockId();
            const providerMetadata2 = part.providerMetadata;
            controller.enqueue({ type: "text-start", id });
            if (part.text.length > 0) {
              controller.enqueue({ type: "text-delta", id, delta: part.text });
            }
            controller.enqueue({
              type: "text-end",
              id,
              ...providerMetadata2 ? { providerMetadata: providerMetadata2 } : {}
            });
            break;
          }
          case "reasoning": {
            const id = nextBlockId();
            const providerMetadata2 = part.providerMetadata;
            controller.enqueue({ type: "reasoning-start", id });
            if (part.text.length > 0) {
              controller.enqueue({
                type: "reasoning-delta",
                id,
                delta: part.text
              });
            }
            controller.enqueue({
              type: "reasoning-end",
              id,
              ...providerMetadata2 ? { providerMetadata: providerMetadata2 } : {}
            });
            break;
          }
          case "tool-call": {
            const providerMetadata2 = part.providerMetadata;
            controller.enqueue({
              type: "tool-input-start",
              id: part.toolCallId,
              toolName: part.toolName,
              ...part.providerExecuted ? { providerExecuted: part.providerExecuted } : {}
            });
            controller.enqueue({
              type: "tool-input-delta",
              id: part.toolCallId,
              delta: part.input
            });
            controller.enqueue({
              type: "tool-input-end",
              id: part.toolCallId
            });
            controller.enqueue({
              type: "tool-call",
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              input: part.input,
              ...part.providerExecuted ? { providerExecuted: part.providerExecuted } : {},
              ...providerMetadata2 ? { providerMetadata: providerMetadata2 } : {}
            });
            break;
          }
          case "tool-result": {
            controller.enqueue({
              type: "tool-result",
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              result: part.result
            });
            break;
          }
          case "source":
          case "file": {
            controller.enqueue(part);
            break;
          }
          default:
            break;
        }
      }
      const serviceTier = (_c = response.service_tier) != null ? _c : headerServiceTier;
      const finishReason = {
        unified: mapGoogleInteractionsFinishReason({
          status: response.status,
          hasFunctionCall
        }),
        raw: response.status
      };
      const providerMetadata = {
        google: {
          ...interactionId != null ? { interactionId } : {},
          ...serviceTier != null ? { serviceTier } : {}
        }
      };
      controller.enqueue({
        type: "finish",
        finishReason,
        usage: convertGoogleInteractionsUsage(response.usage),
        providerMetadata
      });
      controller.close();
    }
  });
}
function pruneUndefined(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === void 0) continue;
    result[key] = value;
  }
  return result;
}
function isRecord(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
async function serializeFunctionCallOutput(item) {
  const parseResult = await safeParseJSON({ text: item.output });
  const response = parseResult.success ? parseResult.value : {};
  return {
    toolResponse: {
      functionResponses: [
        {
          id: item.callId,
          name: item.name,
          response
        }
      ]
    }
  };
}
function buildGoogleSessionConfig(config, modelId) {
  const setup = {
    model: getModelPath(modelId)
  };
  const generationConfig = {};
  if ((config == null ? void 0 : config.outputModalities) != null) {
    generationConfig.responseModalities = config.outputModalities.map(
      (m) => m.toUpperCase()
    );
  } else {
    generationConfig.responseModalities = ["AUDIO"];
  }
  if ((config == null ? void 0 : config.voice) != null) {
    generationConfig.speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: config.voice
        }
      }
    };
  }
  setup.generationConfig = generationConfig;
  if ((config == null ? void 0 : config.instructions) != null) {
    setup.systemInstruction = {
      parts: [{ text: config.instructions }]
    };
  }
  if ((config == null ? void 0 : config.tools) != null && config.tools.length > 0) {
    setup.tools = [
      {
        functionDeclarations: config.tools.map((tool2) => ({
          name: tool2.name,
          description: tool2.description,
          parameters: convertJSONSchemaToOpenAPISchema(tool2.parameters)
        }))
      }
    ];
  }
  if ((config == null ? void 0 : config.inputAudioTranscription) != null) {
    setup.inputAudioTranscription = {};
  }
  if ((config == null ? void 0 : config.outputAudioTranscription) != null) {
    setup.outputAudioTranscription = {};
  }
  if ((config == null ? void 0 : config.providerOptions) == null) {
    return setup;
  }
  const { google: google2, ...providerOptions } = config.providerOptions;
  Object.assign(setup, providerOptions);
  const googleOptions = isRecord(google2) ? google2 : void 0;
  if ((googleOptions == null ? void 0 : googleOptions.translationConfig) != null) {
    const target = isRecord(setup.generationConfig) ? setup.generationConfig : generationConfig;
    setup.generationConfig = {
      ...target,
      translationConfig: googleOptions.translationConfig
    };
  }
  return setup;
}
function getRealtimeBaseURL(baseURL) {
  const url = new URL(baseURL);
  const pathSegments = url.pathname.split("/");
  const version = pathSegments.at(-1);
  if (version === "v1beta" || version === "v1alpha") {
    pathSegments.pop();
    url.pathname = pathSegments.join("/") || "/";
  }
  return url;
}
function getAuthTokensURL(baseURL) {
  const url = getRealtimeBaseURL(baseURL);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/v1alpha/auth_tokens`;
  return url.toString();
}
function getWebSocketURL(baseURL) {
  const url = getRealtimeBaseURL(baseURL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `${url.pathname.replace(/\/$/, "")}/ws/${realtimeWebSocketPath}`;
  return url.toString();
}
function createGoogle(options = {}) {
  var _a2, _b2;
  const baseURL = (_a2 = withoutTrailingSlash(options.baseURL)) != null ? _a2 : "https://generativelanguage.googleapis.com/v1beta";
  const providerName = (_b2 = options.name) != null ? _b2 : "google.generative-ai";
  const getHeaders = () => withUserAgentSuffix(
    {
      "x-goog-api-key": loadApiKey({
        apiKey: options.apiKey,
        environmentVariableName: "GOOGLE_GENERATIVE_AI_API_KEY",
        description: "Google Generative AI"
      }),
      ...options.headers
    },
    `ai-sdk/google/${VERSION3}`
  );
  const createChatModel = (modelId) => {
    var _a22;
    return new GoogleLanguageModel(modelId, {
      provider: providerName,
      baseURL,
      headers: getHeaders,
      generateId: (_a22 = options.generateId) != null ? _a22 : generateId,
      supportedUrls: () => ({
        "*": [
          // Google Generative Language "files" endpoint
          // e.g. https://generativelanguage.googleapis.com/v1beta/files/...
          new RegExp(`^${baseURL}/files/.*$`),
          // YouTube URLs (public or unlisted videos)
          new RegExp(
            `^https://(?:www\\.)?youtube\\.com/watch\\?v=[\\w-]+(?:&[\\w=&.-]*)?$`
          ),
          new RegExp(`^https://youtu\\.be/[\\w-]+(?:\\?[\\w=&.-]*)?$`)
        ]
      }),
      fetch: options.fetch
    });
  };
  const createEmbeddingModel = (modelId) => new GoogleEmbeddingModel(modelId, {
    provider: providerName,
    baseURL,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createImageModel = (modelId, settings = {}) => new GoogleImageModel(modelId, settings, {
    provider: providerName,
    baseURL,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createFiles = () => new GoogleFiles({
    provider: providerName,
    baseURL,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createVideoModel = (modelId) => {
    var _a22;
    return new GoogleVideoModel(modelId, {
      provider: providerName,
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
      generateId: (_a22 = options.generateId) != null ? _a22 : generateId
    });
  };
  const createRealtimeModel = (modelId) => new GoogleRealtimeModel(modelId, {
    provider: `${providerName}.realtime`,
    baseURL,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createSpeechModel = (modelId) => new GoogleSpeechModel(modelId, {
    provider: `${providerName}.speech`,
    baseURL,
    headers: getHeaders,
    fetch: options.fetch
  });
  const experimentalRealtimeFactory = Object.assign(
    (modelId) => createRealtimeModel(modelId),
    {
      getToken: async (tokenOptions) => {
        const model = createRealtimeModel(tokenOptions.model);
        const secret = await model.doCreateClientSecret({
          sessionConfig: tokenOptions.sessionConfig,
          expiresAfterSeconds: tokenOptions.expiresAfterSeconds
        });
        return {
          token: secret.token,
          url: secret.url,
          expiresAt: secret.expiresAt
        };
      }
    }
  );
  const createInteractionsModel = (modelIdOrAgent) => {
    var _a22;
    return new GoogleInteractionsLanguageModel(
      modelIdOrAgent,
      {
        provider: `${providerName}.interactions`,
        baseURL,
        headers: getHeaders,
        generateId: (_a22 = options.generateId) != null ? _a22 : generateId,
        fetch: options.fetch
      }
    );
  };
  const provider = function(modelId) {
    if (new.target) {
      throw new Error(
        "The Google Generative AI model function cannot be called with the new keyword."
      );
    }
    return createChatModel(modelId);
  };
  provider.specificationVersion = "v4";
  provider.languageModel = createChatModel;
  provider.chat = createChatModel;
  provider.generativeAI = createChatModel;
  provider.embedding = createEmbeddingModel;
  provider.embeddingModel = createEmbeddingModel;
  provider.textEmbedding = createEmbeddingModel;
  provider.textEmbeddingModel = createEmbeddingModel;
  provider.image = createImageModel;
  provider.imageModel = createImageModel;
  provider.video = createVideoModel;
  provider.videoModel = createVideoModel;
  provider.experimental_realtime = experimentalRealtimeFactory;
  provider.files = createFiles;
  provider.speech = createSpeechModel;
  provider.speechModel = createSpeechModel;
  provider.interactions = createInteractionsModel;
  provider.tools = googleTools;
  return provider;
}
var VERSION3, googleErrorDataSchema, googleFailedResponseHandler, googleEmbeddingContentPartSchema, googleEmbeddingModelOptions, GoogleEmbeddingModel, googleGenerativeAITextEmbeddingResponseSchema, googleGenerativeAISingleEmbeddingResponseSchema, SKIP_THOUGHT_SIGNATURE_VALIDATOR, dataUrlRegex, googleLanguageModelOptions, GoogleJSONAccumulator, hasOwn, GoogleLanguageModel, getGroundingMetadataSchema, partialArgSchema, getContentSchema, getSafetyRatingSchema, tokenDetailsSchema, usageSchema, getUrlContextMetadataSchema, responseSchema, chunkSchema, codeExecution, enterpriseWebSearch, fileSearchArgsBaseSchema, fileSearch2, googleMaps, googleSearchToolArgsBaseSchema, googleSearch, urlContext, vertexRagStore, googleTools, googleImageModelOptionsSchema, GoogleImageModel, googleImageResponseSchema, GoogleFiles, googleFileResponseSchema, googleFilesUploadOptionsSchema, googleVideoModelOptionsSchema, GoogleVideoModel, googleOperationSchema, googleSpeechResponseSchema, prebuiltVoiceConfigSchema, voiceConfigSchema, googleSpeechProviderOptionsSchema, DEFAULT_VOICE, DEFAULT_SAMPLE_RATE, GoogleSpeechModel, KNOWN_DOC_EXTENSIONS, BUILTIN_TOOL_CALL_TYPES, BUILTIN_TOOL_RESULT_TYPES, tokenByModalitySchema, usageSchema2, interactionStatusSchema, annotationSchema, thoughtSummaryItemSchema, contentBlockSchema, BUILTIN_TOOL_CALL_STEP_TYPES, BUILTIN_TOOL_RESULT_STEP_TYPES, stepSchema, googleInteractionsResponseSchema, googleInteractionsEventSchema, googleInteractionsLanguageModelOptions, BUILTIN_TOOL_CALL_TYPES2, BUILTIN_TOOL_RESULT_TYPES2, getOriginalFetch3, TERMINAL_STATUSES, DEFAULT_INITIAL_DELAY_MS, DEFAULT_MAX_DELAY_MS, DEFAULT_TIMEOUT_MS, DEFAULT_MAX_RETRIES, DEFAULT_RETRY_DELAY_MS, GoogleInteractionsLanguageModel, GoogleRealtimeEventMapper, realtimeWebSocketPath, GoogleRealtimeModel, google;
var init_dist5 = __esm({
  "node_modules/@ai-sdk/google/dist/index.js"() {
    "use strict";
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    VERSION3 = true ? "4.0.0" : "0.0.0-test";
    googleErrorDataSchema = lazySchema(
      () => zodSchema(
        z30.object({
          error: z30.object({
            code: z30.number().nullable(),
            message: z30.string(),
            status: z30.string()
          })
        })
      )
    );
    googleFailedResponseHandler = createJsonErrorResponseHandler({
      errorSchema: googleErrorDataSchema,
      errorToMessage: (data) => data.error.message
    });
    googleEmbeddingContentPartSchema = z210.union([
      z210.object({ text: z210.string() }),
      z210.object({
        inlineData: z210.object({
          mimeType: z210.string(),
          data: z210.string()
        })
      }),
      z210.object({
        fileData: z210.object({
          fileUri: z210.string(),
          mimeType: z210.string()
        })
      })
    ]);
    googleEmbeddingModelOptions = lazySchema(
      () => zodSchema(
        z210.object({
          /**
           * Optional. Optional reduced dimension for the output embedding.
           * If set, excessive values in the output embedding are truncated from the end.
           */
          outputDimensionality: z210.number().optional(),
          /**
           * Optional. Specifies the task type for generating embeddings.
           * Supported task types:
           * - SEMANTIC_SIMILARITY: Optimized for text similarity.
           * - CLASSIFICATION: Optimized for text classification.
           * - CLUSTERING: Optimized for clustering texts based on similarity.
           * - RETRIEVAL_DOCUMENT: Optimized for document retrieval.
           * - RETRIEVAL_QUERY: Optimized for query-based retrieval.
           * - QUESTION_ANSWERING: Optimized for answering questions.
           * - FACT_VERIFICATION: Optimized for verifying factual information.
           * - CODE_RETRIEVAL_QUERY: Optimized for retrieving code blocks based on natural language queries.
           */
          taskType: z210.enum([
            "SEMANTIC_SIMILARITY",
            "CLASSIFICATION",
            "CLUSTERING",
            "RETRIEVAL_DOCUMENT",
            "RETRIEVAL_QUERY",
            "QUESTION_ANSWERING",
            "FACT_VERIFICATION",
            "CODE_RETRIEVAL_QUERY"
          ]).optional(),
          /**
           * Optional. Per-value multimodal content parts for embedding non-text
           * content (images, video, PDF, audio). Each entry corresponds to the
           * embedding value at the same index and its parts are merged with the
           * text value in the request. Use `null` for entries that are text-only.
           *
           * The array length must match the number of values being embedded. In
           * the case of a single embedding, the array length must be 1.
           */
          content: z210.array(z210.array(googleEmbeddingContentPartSchema).min(1).nullable()).optional()
        })
      )
    );
    GoogleEmbeddingModel = class _GoogleEmbeddingModel {
      constructor(modelId, config) {
        this.specificationVersion = "v4";
        this.maxEmbeddingsPerCall = 2048;
        this.supportsParallelCalls = true;
        this.modelId = modelId;
        this.config = config;
      }
      static [WORKFLOW_SERIALIZE](model) {
        return serializeModelOptions({
          modelId: model.modelId,
          config: model.config
        });
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _GoogleEmbeddingModel(options.modelId, options.config);
      }
      get provider() {
        return this.config.provider;
      }
      async doEmbed({
        values,
        headers,
        abortSignal,
        providerOptions
      }) {
        const googleOptions = await parseProviderOptions({
          provider: "google",
          providerOptions,
          schema: googleEmbeddingModelOptions
        });
        if (values.length > this.maxEmbeddingsPerCall) {
          throw new TooManyEmbeddingValuesForCallError2({
            provider: this.provider,
            modelId: this.modelId,
            maxEmbeddingsPerCall: this.maxEmbeddingsPerCall,
            values
          });
        }
        const mergedHeaders = combineHeaders(
          this.config.headers ? await resolve(this.config.headers) : void 0,
          headers
        );
        const multimodalContent = googleOptions == null ? void 0 : googleOptions.content;
        if (multimodalContent != null && multimodalContent.length !== values.length) {
          throw new Error(
            `The number of multimodal content entries (${multimodalContent.length}) must match the number of values (${values.length}).`
          );
        }
        if (values.length === 1) {
          const valueParts = multimodalContent == null ? void 0 : multimodalContent[0];
          const textPart = values[0] ? [{ text: values[0] }] : [];
          const parts = valueParts != null ? [...textPart, ...valueParts] : [{ text: values[0] }];
          const {
            responseHeaders: responseHeaders2,
            value: response2,
            rawValue: rawValue2
          } = await postJsonToApi({
            url: `${this.config.baseURL}/models/${this.modelId}:embedContent`,
            headers: mergedHeaders,
            body: {
              model: `models/${this.modelId}`,
              content: {
                parts
              },
              outputDimensionality: googleOptions == null ? void 0 : googleOptions.outputDimensionality,
              taskType: googleOptions == null ? void 0 : googleOptions.taskType
            },
            failedResponseHandler: googleFailedResponseHandler,
            successfulResponseHandler: createJsonResponseHandler(
              googleGenerativeAISingleEmbeddingResponseSchema
            ),
            abortSignal,
            fetch: this.config.fetch
          });
          return {
            warnings: [],
            embeddings: [response2.embedding.values],
            usage: void 0,
            response: { headers: responseHeaders2, body: rawValue2 }
          };
        }
        const {
          responseHeaders,
          value: response,
          rawValue
        } = await postJsonToApi({
          url: `${this.config.baseURL}/models/${this.modelId}:batchEmbedContents`,
          headers: mergedHeaders,
          body: {
            requests: values.map((value, index) => {
              const valueParts = multimodalContent == null ? void 0 : multimodalContent[index];
              const textPart = value ? [{ text: value }] : [];
              return {
                model: `models/${this.modelId}`,
                content: {
                  role: "user",
                  parts: valueParts != null ? [...textPart, ...valueParts] : [{ text: value }]
                },
                outputDimensionality: googleOptions == null ? void 0 : googleOptions.outputDimensionality,
                taskType: googleOptions == null ? void 0 : googleOptions.taskType
              };
            })
          },
          failedResponseHandler: googleFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            googleGenerativeAITextEmbeddingResponseSchema
          ),
          abortSignal,
          fetch: this.config.fetch
        });
        return {
          warnings: [],
          embeddings: response.embeddings.map((item) => item.values),
          usage: void 0,
          response: { headers: responseHeaders, body: rawValue }
        };
      }
    };
    googleGenerativeAITextEmbeddingResponseSchema = lazySchema(
      () => zodSchema(
        z32.object({
          embeddings: z32.array(z32.object({ values: z32.array(z32.number()) }))
        })
      )
    );
    googleGenerativeAISingleEmbeddingResponseSchema = lazySchema(
      () => zodSchema(
        z32.object({
          embedding: z32.object({ values: z32.array(z32.number()) })
        })
      )
    );
    SKIP_THOUGHT_SIGNATURE_VALIDATOR = "skip_thought_signature_validator";
    dataUrlRegex = /^data:([^;,]+);base64,(.+)$/s;
    googleLanguageModelOptions = lazySchema(
      () => zodSchema(
        z43.object({
          responseModalities: z43.array(z43.enum(["TEXT", "IMAGE"])).optional(),
          thinkingConfig: z43.object({
            thinkingBudget: z43.number().optional(),
            includeThoughts: z43.boolean().optional(),
            // https://ai.google.dev/gemini-api/docs/gemini-3?thinking=high#thinking_level
            thinkingLevel: z43.enum(["minimal", "low", "medium", "high"]).optional()
          }).optional(),
          /**
           * Optional.
           * The name of the cached content used as context to serve the prediction.
           * Format: cachedContents/{cachedContent}
           */
          cachedContent: z43.string().optional(),
          /**
           * Optional. Enable structured output. Default is true.
           *
           * This is useful when the JSON Schema contains elements that are
           * not supported by the OpenAPI schema version that
           * Google uses. You can use this to disable
           * structured outputs if you need to.
           */
          structuredOutputs: z43.boolean().optional(),
          /**
           * Optional. A list of unique safety settings for blocking unsafe content.
           */
          safetySettings: z43.array(
            z43.object({
              category: z43.enum([
                "HARM_CATEGORY_UNSPECIFIED",
                "HARM_CATEGORY_HATE_SPEECH",
                "HARM_CATEGORY_DANGEROUS_CONTENT",
                "HARM_CATEGORY_HARASSMENT",
                "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "HARM_CATEGORY_CIVIC_INTEGRITY"
              ]),
              threshold: z43.enum([
                "HARM_BLOCK_THRESHOLD_UNSPECIFIED",
                "BLOCK_LOW_AND_ABOVE",
                "BLOCK_MEDIUM_AND_ABOVE",
                "BLOCK_ONLY_HIGH",
                "BLOCK_NONE",
                "OFF"
              ])
            })
          ).optional(),
          threshold: z43.enum([
            "HARM_BLOCK_THRESHOLD_UNSPECIFIED",
            "BLOCK_LOW_AND_ABOVE",
            "BLOCK_MEDIUM_AND_ABOVE",
            "BLOCK_ONLY_HIGH",
            "BLOCK_NONE",
            "OFF"
          ]).optional(),
          /**
           * Optional. Enables timestamp understanding for audio-only files.
           *
           * https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/audio-understanding
           */
          audioTimestamp: z43.boolean().optional(),
          /**
           * Optional. Defines labels used in billing reports. Available on Vertex AI only.
           *
           * https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/add-labels-to-api-calls
           */
          labels: z43.record(z43.string(), z43.string()).optional(),
          /**
           * Optional. If specified, the media resolution specified will be used.
           *
           * https://ai.google.dev/api/generate-content#MediaResolution
           */
          mediaResolution: z43.enum([
            "MEDIA_RESOLUTION_UNSPECIFIED",
            "MEDIA_RESOLUTION_LOW",
            "MEDIA_RESOLUTION_MEDIUM",
            "MEDIA_RESOLUTION_HIGH"
          ]).optional(),
          /**
           * Optional. Configures the image generation aspect ratio for Gemini models.
           *
           * https://ai.google.dev/gemini-api/docs/image-generation#aspect_ratios
           */
          imageConfig: z43.object({
            aspectRatio: z43.enum([
              "1:1",
              "2:3",
              "3:2",
              "3:4",
              "4:3",
              "4:5",
              "5:4",
              "9:16",
              "16:9",
              "21:9",
              "1:8",
              "8:1",
              "1:4",
              "4:1"
            ]).optional(),
            imageSize: z43.enum(["1K", "2K", "4K", "512"]).optional()
          }).optional(),
          /**
           * Optional. Configuration for grounding retrieval.
           * Used to provide location context for Google Maps and Google Search grounding.
           *
           * https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-google-maps
           */
          retrievalConfig: z43.object({
            latLng: z43.object({
              latitude: z43.number(),
              longitude: z43.number()
            }).optional()
          }).optional(),
          /**
           * Optional. When set to true, function call arguments will be streamed
           * incrementally via partialArgs in streaming responses. Only supported
           * on the Vertex AI API (not the Gemini API) and only for Gemini 3+
           * models.
           *
           * @default false
           *
           * https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling#streaming-fc
           */
          streamFunctionCallArguments: z43.boolean().optional(),
          /**
           * Optional. The service tier to use for the request. Sent as the
           * `serviceTier` body field. Gemini API only.
           */
          serviceTier: z43.enum(["standard", "flex", "priority"]).optional(),
          /**
           * Optional. Vertex AI only. Sent as the
           * `X-Vertex-AI-LLM-Shared-Request-Type` request header to select a
           * shared (PayGo) tier. With Provisioned Throughput allocated and
           * `requestType` unset, the request falls back to this tier only if
           * PT capacity is exhausted.
           *
           * https://docs.cloud.google.com/vertex-ai/generative-ai/docs/priority-paygo
           * https://docs.cloud.google.com/vertex-ai/generative-ai/docs/flex-paygo
           */
          sharedRequestType: z43.enum(["priority", "flex", "standard"]).optional(),
          /**
           * Optional. Vertex AI only. Sent as the `X-Vertex-AI-LLM-Request-Type`
           * request header. Set to `'shared'` together with `sharedRequestType`
           * to bypass Provisioned Throughput entirely.
           *
           * https://docs.cloud.google.com/vertex-ai/generative-ai/docs/priority-paygo
           */
          requestType: z43.enum(["shared"]).optional()
        })
      )
    );
    GoogleJSONAccumulator = class {
      constructor() {
        this.accumulatedArgs = {};
        this.jsonText = "";
        this.pathStack = [];
        this.stringOpen = false;
      }
      /**
       * Input: [{jsonPath:"$.brightness",numberValue:50}]
       * Output: { currentJSON:{brightness:50}, textDelta:'{"brightness":50' }
       */
      processPartialArgs(partialArgs) {
        let delta = "";
        for (const arg of partialArgs) {
          const rawPath = arg.jsonPath.replace(/^\$\./, "");
          if (!rawPath) continue;
          const segments = parsePath(rawPath);
          const existingValue = getNestedValue(this.accumulatedArgs, segments);
          const isStringContinuation = arg.stringValue != null && existingValue !== void 0;
          if (isStringContinuation) {
            const escaped = JSON.stringify(arg.stringValue).slice(1, -1);
            setNestedValue(
              this.accumulatedArgs,
              segments,
              existingValue + arg.stringValue
            );
            delta += escaped;
            continue;
          }
          const resolved = resolvePartialArgValue(arg);
          if (resolved == null) continue;
          setNestedValue(this.accumulatedArgs, segments, resolved.value);
          delta += this.emitNavigationTo(segments, arg, resolved.json);
        }
        this.jsonText += delta;
        return {
          currentJSON: this.accumulatedArgs,
          textDelta: delta
        };
      }
      /**
       * Input: jsonText='{"brightness":50', accumulatedArgs={brightness:50}
       * Output: { finalJSON:'{"brightness":50}', closingDelta:'}' }
       */
      finalize() {
        const finalArgs = JSON.stringify(this.accumulatedArgs);
        const closingDelta = finalArgs.slice(this.jsonText.length);
        return { finalJSON: finalArgs, closingDelta };
      }
      /**
       * Input: pathStack=[] (first call) or pathStack=[root,...] (subsequent calls)
       * Output: '{' (first call) or '' (subsequent calls)
       */
      ensureRoot() {
        if (this.pathStack.length === 0) {
          this.pathStack.push({ segment: "", isArray: false, childCount: 0 });
          return "{";
        }
        return "";
      }
      /**
       * Emits the JSON text fragment needed to navigate from the current open
       * path to the new leaf at `targetSegments`, then writes the value.
       *
       * Input: targetSegments=["recipe","name"], arg={jsonPath:"$.recipe.name",stringValue:"Lasagna"}, valueJson='"Lasagna"'
       * Output: '{"recipe":{"name":"Lasagna"'
       */
      emitNavigationTo(targetSegments, arg, valueJson) {
        let fragment = "";
        if (this.stringOpen) {
          fragment += '"';
          this.stringOpen = false;
        }
        fragment += this.ensureRoot();
        const targetContainerSegments = targetSegments.slice(0, -1);
        const leafSegment = targetSegments[targetSegments.length - 1];
        const commonDepth = this.findCommonStackDepth(targetContainerSegments);
        fragment += this.closeDownTo(commonDepth);
        fragment += this.openDownTo(targetContainerSegments, leafSegment);
        fragment += this.emitLeaf(leafSegment, arg, valueJson);
        return fragment;
      }
      /**
       * Returns the stack depth to preserve when navigating to a new target
       * container path. Always >= 1 (the root is never popped).
       *
       * Input: stack=[root,"recipe","ingredients",0], target=["recipe","ingredients",1]
       * Output: 3 (keep root+"recipe"+"ingredients")
       */
      findCommonStackDepth(targetContainer) {
        const maxDepth = Math.min(
          this.pathStack.length - 1,
          targetContainer.length
        );
        let common = 0;
        for (let i = 0; i < maxDepth; i++) {
          if (this.pathStack[i + 1].segment === targetContainer[i]) {
            common++;
          } else {
            break;
          }
        }
        return common + 1;
      }
      /**
       * Closes containers from the current stack depth back down to `targetDepth`.
       *
       * Input: this.pathStack=[root,"recipe","ingredients",0], targetDepth=3
       * Output: '}'
       */
      closeDownTo(targetDepth) {
        let fragment = "";
        while (this.pathStack.length > targetDepth) {
          const entry = this.pathStack.pop();
          fragment += entry.isArray ? "]" : "}";
        }
        return fragment;
      }
      /**
       * Opens containers from the current stack depth down to the full target
       * container path, emitting opening `{`, `[`, keys, and commas as needed.
       * `leafSegment` is used to determine if the innermost container is an array.
       *
       * Input: this.pathStack=[root], targetContainer=["recipe","ingredients"], leafSegment=0
       * Output: '"recipe":{"ingredients":['
       */
      openDownTo(targetContainer, leafSegment) {
        let fragment = "";
        const startIdx = this.pathStack.length - 1;
        for (let i = startIdx; i < targetContainer.length; i++) {
          const pathSegment = targetContainer[i];
          const parentEntry = this.pathStack[this.pathStack.length - 1];
          if (parentEntry.childCount > 0) {
            fragment += ",";
          }
          parentEntry.childCount++;
          if (typeof pathSegment === "string") {
            fragment += `${JSON.stringify(pathSegment)}:`;
          }
          const childSeg = i + 1 < targetContainer.length ? targetContainer[i + 1] : leafSegment;
          const isArray = typeof childSeg === "number";
          fragment += isArray ? "[" : "{";
          this.pathStack.push({ segment: pathSegment, isArray, childCount: 0 });
        }
        return fragment;
      }
      /**
       * Emits the comma, key, and value for a leaf entry in the current container.
       *
       * Input: leafSegment="name", arg={stringValue:"Lasagna"}, valueJson='"Lasagna"'
       * Output: '"name":"Lasagna"' (or ',"name":"Lasagna"' if container.childCount > 0)
       */
      emitLeaf(leafSegment, arg, valueJson) {
        let fragment = "";
        const container = this.pathStack[this.pathStack.length - 1];
        if (container.childCount > 0) {
          fragment += ",";
        }
        container.childCount++;
        if (typeof leafSegment === "string") {
          fragment += `${JSON.stringify(leafSegment)}:`;
        }
        if (arg.stringValue != null && arg.willContinue) {
          fragment += valueJson.slice(0, -1);
          this.stringOpen = true;
        } else {
          fragment += valueJson;
        }
        return fragment;
      }
    };
    hasOwn = Object.prototype.hasOwnProperty;
    GoogleLanguageModel = class _GoogleLanguageModel {
      constructor(modelId, config) {
        this.specificationVersion = "v4";
        var _a2;
        this.modelId = modelId;
        this.config = config;
        this.generateId = (_a2 = config.generateId) != null ? _a2 : generateId;
      }
      static [WORKFLOW_SERIALIZE](model) {
        return serializeModelOptions({
          modelId: model.modelId,
          config: model.config
        });
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _GoogleLanguageModel(options.modelId, options.config);
      }
      get provider() {
        return this.config.provider;
      }
      get supportedUrls() {
        var _a2, _b2, _c;
        return (_c = (_b2 = (_a2 = this.config).supportedUrls) == null ? void 0 : _b2.call(_a2)) != null ? _c : {};
      }
      async getArgs({
        prompt,
        maxOutputTokens,
        temperature,
        topP,
        topK,
        frequencyPenalty,
        presencePenalty,
        stopSequences,
        responseFormat,
        seed,
        tools,
        toolChoice,
        reasoning,
        providerOptions
      }, { isStreaming = false } = {}) {
        var _a2, _b2;
        const warnings = [];
        const providerOptionsNames = this.config.provider.includes("vertex") ? ["googleVertex", "vertex"] : ["google"];
        let googleOptions;
        for (const name2 of providerOptionsNames) {
          googleOptions = await parseProviderOptions({
            provider: name2,
            providerOptions,
            schema: googleLanguageModelOptions
          });
          if (googleOptions != null) break;
        }
        if (googleOptions == null && !providerOptionsNames.includes("google")) {
          googleOptions = await parseProviderOptions({
            provider: "google",
            providerOptions,
            schema: googleLanguageModelOptions
          });
        }
        const isVertexProvider = this.config.provider.startsWith("google.vertex.");
        if ((tools == null ? void 0 : tools.some(
          (tool2) => tool2.type === "provider" && tool2.id === "google.vertex_rag_store"
        )) && !isVertexProvider) {
          warnings.push({
            type: "other",
            message: `The 'vertex_rag_store' tool is only supported with the Google Vertex provider and might not be supported or could behave unexpectedly with the current Google provider (${this.config.provider}).`
          });
        }
        if ((googleOptions == null ? void 0 : googleOptions.streamFunctionCallArguments) && !isVertexProvider) {
          warnings.push({
            type: "other",
            message: `'streamFunctionCallArguments' is only supported on the Vertex AI API and will be ignored with the current Google provider (${this.config.provider}). See https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling#streaming-fc`
          });
        }
        if ((googleOptions == null ? void 0 : googleOptions.serviceTier) && isVertexProvider) {
          warnings.push({
            type: "other",
            message: "'serviceTier' is a Gemini API option and is not supported on Vertex AI. Use 'sharedRequestType' (and optionally 'requestType') instead. See https://docs.cloud.google.com/vertex-ai/generative-ai/docs/priority-paygo"
          });
        }
        if (((googleOptions == null ? void 0 : googleOptions.sharedRequestType) || (googleOptions == null ? void 0 : googleOptions.requestType)) && !isVertexProvider) {
          warnings.push({
            type: "other",
            message: `'sharedRequestType' and 'requestType' are Vertex AI options and are ignored with the current Google provider (${this.config.provider}).`
          });
        }
        const vertexPaygoHeaders = isVertexProvider && ((googleOptions == null ? void 0 : googleOptions.sharedRequestType) || (googleOptions == null ? void 0 : googleOptions.requestType)) ? {
          ...googleOptions.sharedRequestType && {
            "X-Vertex-AI-LLM-Shared-Request-Type": googleOptions.sharedRequestType
          },
          ...googleOptions.requestType && {
            "X-Vertex-AI-LLM-Request-Type": googleOptions.requestType
          }
        } : void 0;
        const bodyServiceTier = isVertexProvider ? void 0 : googleOptions == null ? void 0 : googleOptions.serviceTier;
        const isGemmaModel = this.modelId.toLowerCase().startsWith("gemma-");
        const isGemini3Model2 = /^gemini-3[.-]/.test(this.modelId);
        const supportsFunctionResponseParts = isGemini3Model2;
        const { contents, systemInstruction } = convertToGoogleMessages(prompt, {
          isGemmaModel,
          isGemini3Model: isGemini3Model2,
          onWarning: (warning) => warnings.push(warning),
          providerOptionsNames,
          supportsFunctionResponseParts
        });
        const {
          tools: googleTools2,
          toolConfig: googleToolConfig,
          toolWarnings
        } = prepareTools({
          tools,
          toolChoice,
          modelId: this.modelId,
          isVertexProvider
        });
        const resolvedThinking = resolveThinkingConfig({
          reasoning,
          modelId: this.modelId,
          warnings
        });
        const thinkingConfig = (googleOptions == null ? void 0 : googleOptions.thinkingConfig) || resolvedThinking ? { ...resolvedThinking, ...googleOptions == null ? void 0 : googleOptions.thinkingConfig } : void 0;
        const streamFunctionCallArguments = isStreaming && isVertexProvider ? (_a2 = googleOptions == null ? void 0 : googleOptions.streamFunctionCallArguments) != null ? _a2 : false : void 0;
        const toolConfig = googleToolConfig || streamFunctionCallArguments || (googleOptions == null ? void 0 : googleOptions.retrievalConfig) ? {
          ...googleToolConfig,
          ...streamFunctionCallArguments && {
            functionCallingConfig: {
              ...googleToolConfig == null ? void 0 : googleToolConfig.functionCallingConfig,
              streamFunctionCallArguments: true
            }
          },
          ...(googleOptions == null ? void 0 : googleOptions.retrievalConfig) && {
            retrievalConfig: googleOptions.retrievalConfig
          }
        } : void 0;
        return {
          args: {
            generationConfig: {
              // standardized settings:
              maxOutputTokens,
              temperature,
              topK,
              topP,
              frequencyPenalty,
              presencePenalty,
              stopSequences,
              seed,
              // response format:
              responseMimeType: (responseFormat == null ? void 0 : responseFormat.type) === "json" ? "application/json" : void 0,
              responseSchema: (responseFormat == null ? void 0 : responseFormat.type) === "json" && responseFormat.schema != null && // Google GenAI does not support all OpenAPI Schema features,
              // so this is needed as an escape hatch:
              // TODO convert into provider option
              ((_b2 = googleOptions == null ? void 0 : googleOptions.structuredOutputs) != null ? _b2 : true) ? convertJSONSchemaToOpenAPISchema(responseFormat.schema) : void 0,
              ...(googleOptions == null ? void 0 : googleOptions.audioTimestamp) && {
                audioTimestamp: googleOptions.audioTimestamp
              },
              // provider options:
              responseModalities: googleOptions == null ? void 0 : googleOptions.responseModalities,
              thinkingConfig,
              ...(googleOptions == null ? void 0 : googleOptions.mediaResolution) && {
                mediaResolution: googleOptions.mediaResolution
              },
              ...(googleOptions == null ? void 0 : googleOptions.imageConfig) && {
                imageConfig: googleOptions.imageConfig
              }
            },
            contents,
            systemInstruction: isGemmaModel ? void 0 : systemInstruction,
            safetySettings: googleOptions == null ? void 0 : googleOptions.safetySettings,
            tools: googleTools2,
            toolConfig,
            cachedContent: googleOptions == null ? void 0 : googleOptions.cachedContent,
            labels: googleOptions == null ? void 0 : googleOptions.labels,
            serviceTier: bodyServiceTier
          },
          warnings: [...warnings, ...toolWarnings],
          providerOptionsNames,
          extraHeaders: vertexPaygoHeaders
        };
      }
      async doGenerate(options) {
        var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
        const { args, warnings, providerOptionsNames, extraHeaders } = await this.getArgs(options);
        const wrapProviderMetadata = (payload) => Object.fromEntries(
          providerOptionsNames.map((name2) => [name2, payload])
        );
        const mergedHeaders = combineHeaders(
          this.config.headers ? await resolve(this.config.headers) : void 0,
          options.headers,
          extraHeaders
        );
        const {
          responseHeaders,
          value: response,
          rawValue: rawResponse
        } = await postJsonToApi({
          url: `${this.config.baseURL}/${getModelPath(
            this.modelId
          )}:generateContent`,
          headers: mergedHeaders,
          body: args,
          failedResponseHandler: googleFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(responseSchema),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        const candidate = response.candidates[0];
        const content = [];
        const parts = (_b2 = (_a2 = candidate.content) == null ? void 0 : _a2.parts) != null ? _b2 : [];
        const usageMetadata = response.usageMetadata;
        let lastCodeExecutionToolCallId;
        let lastServerToolCallId;
        for (const part of parts) {
          if ("executableCode" in part && ((_c = part.executableCode) == null ? void 0 : _c.code)) {
            const toolCallId = this.config.generateId();
            lastCodeExecutionToolCallId = toolCallId;
            content.push({
              type: "tool-call",
              toolCallId,
              toolName: "code_execution",
              input: JSON.stringify(part.executableCode),
              providerExecuted: true
            });
          } else if ("codeExecutionResult" in part && part.codeExecutionResult) {
            content.push({
              type: "tool-result",
              // Assumes a result directly follows its corresponding call part.
              toolCallId: lastCodeExecutionToolCallId,
              toolName: "code_execution",
              result: {
                outcome: part.codeExecutionResult.outcome,
                output: (_d = part.codeExecutionResult.output) != null ? _d : ""
              }
            });
            lastCodeExecutionToolCallId = void 0;
          } else if ("text" in part && part.text != null) {
            const thoughtSignatureMetadata = part.thoughtSignature ? wrapProviderMetadata({
              thoughtSignature: part.thoughtSignature
            }) : void 0;
            if (part.text.length === 0) {
              if (thoughtSignatureMetadata != null && content.length > 0) {
                const lastContent = content[content.length - 1];
                lastContent.providerMetadata = thoughtSignatureMetadata;
              }
            } else {
              content.push({
                type: part.thought === true ? "reasoning" : "text",
                text: part.text,
                providerMetadata: thoughtSignatureMetadata
              });
            }
          } else if ("functionCall" in part && part.functionCall.name != null) {
            content.push({
              type: "tool-call",
              toolCallId: (_e = part.functionCall.id) != null ? _e : this.config.generateId(),
              toolName: part.functionCall.name,
              input: JSON.stringify((_f = part.functionCall.args) != null ? _f : {}),
              providerMetadata: part.thoughtSignature ? wrapProviderMetadata({
                thoughtSignature: part.thoughtSignature
              }) : void 0
            });
          } else if ("inlineData" in part) {
            const hasThought = part.thought === true;
            const hasThoughtSignature = !!part.thoughtSignature;
            content.push({
              type: hasThought ? "reasoning-file" : "file",
              data: { type: "data", data: part.inlineData.data },
              mediaType: part.inlineData.mimeType,
              providerMetadata: hasThoughtSignature ? wrapProviderMetadata({
                thoughtSignature: part.thoughtSignature
              }) : void 0
            });
          } else if ("toolCall" in part && part.toolCall) {
            const toolCallId = (_g = part.toolCall.id) != null ? _g : this.config.generateId();
            lastServerToolCallId = toolCallId;
            content.push({
              type: "tool-call",
              toolCallId,
              toolName: `server:${part.toolCall.toolType}`,
              input: JSON.stringify((_h = part.toolCall.args) != null ? _h : {}),
              providerExecuted: true,
              dynamic: true,
              providerMetadata: part.thoughtSignature ? wrapProviderMetadata({
                thoughtSignature: part.thoughtSignature,
                serverToolCallId: toolCallId,
                serverToolType: part.toolCall.toolType
              }) : wrapProviderMetadata({
                serverToolCallId: toolCallId,
                serverToolType: part.toolCall.toolType
              })
            });
          } else if ("toolResponse" in part && part.toolResponse) {
            const responseToolCallId = (_i = lastServerToolCallId != null ? lastServerToolCallId : part.toolResponse.id) != null ? _i : this.config.generateId();
            content.push({
              type: "tool-result",
              toolCallId: responseToolCallId,
              toolName: `server:${part.toolResponse.toolType}`,
              result: (_j = part.toolResponse.response) != null ? _j : {},
              providerMetadata: part.thoughtSignature ? wrapProviderMetadata({
                thoughtSignature: part.thoughtSignature,
                serverToolCallId: responseToolCallId,
                serverToolType: part.toolResponse.toolType
              }) : wrapProviderMetadata({
                serverToolCallId: responseToolCallId,
                serverToolType: part.toolResponse.toolType
              })
            });
            lastServerToolCallId = void 0;
          }
        }
        const sources = (_k = extractSources({
          groundingMetadata: candidate.groundingMetadata,
          generateId: this.config.generateId
        })) != null ? _k : [];
        for (const source of sources) {
          content.push(source);
        }
        return {
          content,
          finishReason: {
            unified: mapGoogleFinishReason({
              finishReason: candidate.finishReason,
              // Only count client-executed tool calls for finish reason determination.
              hasToolCalls: content.some(
                (part) => part.type === "tool-call" && !part.providerExecuted
              )
            }),
            raw: (_l = candidate.finishReason) != null ? _l : void 0
          },
          usage: convertGoogleUsage(usageMetadata),
          warnings,
          providerMetadata: wrapProviderMetadata({
            promptFeedback: (_m = response.promptFeedback) != null ? _m : null,
            groundingMetadata: (_n = candidate.groundingMetadata) != null ? _n : null,
            urlContextMetadata: (_o = candidate.urlContextMetadata) != null ? _o : null,
            safetyRatings: (_p = candidate.safetyRatings) != null ? _p : null,
            usageMetadata: usageMetadata != null ? usageMetadata : null,
            finishMessage: (_q = candidate.finishMessage) != null ? _q : null,
            serviceTier: (_r = usageMetadata == null ? void 0 : usageMetadata.serviceTier) != null ? _r : null
          }),
          request: { body: args },
          response: {
            // TODO timestamp, model id, id
            headers: responseHeaders,
            body: rawResponse
          }
        };
      }
      async doStream(options) {
        const { args, warnings, providerOptionsNames, extraHeaders } = await this.getArgs(options, { isStreaming: true });
        const wrapProviderMetadata = (payload) => Object.fromEntries(
          providerOptionsNames.map((name2) => [name2, payload])
        );
        const headers = combineHeaders(
          this.config.headers ? await resolve(this.config.headers) : void 0,
          options.headers,
          extraHeaders
        );
        const { responseHeaders, value: response } = await postJsonToApi({
          url: `${this.config.baseURL}/${getModelPath(
            this.modelId
          )}:streamGenerateContent?alt=sse`,
          headers,
          body: args,
          failedResponseHandler: googleFailedResponseHandler,
          successfulResponseHandler: createEventSourceResponseHandler(chunkSchema),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        let finishReason = {
          unified: "other",
          raw: void 0
        };
        let usage = void 0;
        let providerMetadata = void 0;
        let lastGroundingMetadata = null;
        let lastUrlContextMetadata = null;
        const generateId3 = this.config.generateId;
        let hasToolCalls = false;
        let currentTextBlockId = null;
        let currentReasoningBlockId = null;
        let blockCounter = 0;
        const emittedSourceUrls = /* @__PURE__ */ new Set();
        let lastCodeExecutionToolCallId;
        let lastServerToolCallId;
        const activeStreamingToolCalls = [];
        const finishActiveStreamingToolCall = (controller) => {
          const active = activeStreamingToolCalls.pop();
          if (active == null) {
            return;
          }
          const { finalJSON, closingDelta } = active.accumulator.finalize();
          if (closingDelta.length > 0) {
            controller.enqueue({
              type: "tool-input-delta",
              id: active.toolCallId,
              delta: closingDelta,
              providerMetadata: active.providerMetadata
            });
          }
          controller.enqueue({
            type: "tool-input-end",
            id: active.toolCallId,
            providerMetadata: active.providerMetadata
          });
          controller.enqueue({
            type: "tool-call",
            toolCallId: active.toolCallId,
            toolName: active.toolName,
            input: finalJSON,
            providerMetadata: active.providerMetadata
          });
          hasToolCalls = true;
        };
        return {
          stream: response.pipeThrough(
            new TransformStream({
              start(controller) {
                controller.enqueue({ type: "stream-start", warnings });
              },
              transform(chunk, controller) {
                var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
                if (options.includeRawChunks) {
                  controller.enqueue({ type: "raw", rawValue: chunk.rawValue });
                }
                if (!chunk.success) {
                  controller.enqueue({ type: "error", error: chunk.error });
                  return;
                }
                const value = chunk.value;
                const usageMetadata = value.usageMetadata;
                if (usageMetadata != null) {
                  usage = usageMetadata;
                }
                const candidate = (_a2 = value.candidates) == null ? void 0 : _a2[0];
                if (candidate == null) {
                  return;
                }
                const content = candidate.content;
                if (candidate.groundingMetadata != null) {
                  lastGroundingMetadata = candidate.groundingMetadata;
                }
                if (candidate.urlContextMetadata != null) {
                  lastUrlContextMetadata = candidate.urlContextMetadata;
                }
                const sources = extractSources({
                  groundingMetadata: candidate.groundingMetadata,
                  generateId: generateId3
                });
                if (sources != null) {
                  for (const source of sources) {
                    if (source.sourceType === "url" && !emittedSourceUrls.has(source.url)) {
                      emittedSourceUrls.add(source.url);
                      controller.enqueue(source);
                    }
                  }
                }
                if (content != null) {
                  const parts = (_b2 = content.parts) != null ? _b2 : [];
                  for (const part of parts) {
                    if ("executableCode" in part && ((_c = part.executableCode) == null ? void 0 : _c.code)) {
                      const toolCallId = generateId3();
                      lastCodeExecutionToolCallId = toolCallId;
                      controller.enqueue({
                        type: "tool-call",
                        toolCallId,
                        toolName: "code_execution",
                        input: JSON.stringify(part.executableCode),
                        providerExecuted: true
                      });
                    } else if ("codeExecutionResult" in part && part.codeExecutionResult) {
                      const toolCallId = lastCodeExecutionToolCallId;
                      if (toolCallId) {
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId,
                          toolName: "code_execution",
                          result: {
                            outcome: part.codeExecutionResult.outcome,
                            output: (_d = part.codeExecutionResult.output) != null ? _d : ""
                          }
                        });
                        lastCodeExecutionToolCallId = void 0;
                      }
                    } else if ("text" in part && part.text != null) {
                      const thoughtSignatureMetadata = part.thoughtSignature ? wrapProviderMetadata({
                        thoughtSignature: part.thoughtSignature
                      }) : void 0;
                      if (part.text.length === 0) {
                        if (thoughtSignatureMetadata != null && currentTextBlockId !== null) {
                          controller.enqueue({
                            type: "text-delta",
                            id: currentTextBlockId,
                            delta: "",
                            providerMetadata: thoughtSignatureMetadata
                          });
                        }
                      } else if (part.thought === true) {
                        if (currentTextBlockId !== null) {
                          controller.enqueue({
                            type: "text-end",
                            id: currentTextBlockId
                          });
                          currentTextBlockId = null;
                        }
                        if (currentReasoningBlockId === null) {
                          currentReasoningBlockId = String(blockCounter++);
                          controller.enqueue({
                            type: "reasoning-start",
                            id: currentReasoningBlockId,
                            providerMetadata: thoughtSignatureMetadata
                          });
                        }
                        controller.enqueue({
                          type: "reasoning-delta",
                          id: currentReasoningBlockId,
                          delta: part.text,
                          providerMetadata: thoughtSignatureMetadata
                        });
                      } else {
                        if (currentReasoningBlockId !== null) {
                          controller.enqueue({
                            type: "reasoning-end",
                            id: currentReasoningBlockId
                          });
                          currentReasoningBlockId = null;
                        }
                        if (currentTextBlockId === null) {
                          currentTextBlockId = String(blockCounter++);
                          controller.enqueue({
                            type: "text-start",
                            id: currentTextBlockId,
                            providerMetadata: thoughtSignatureMetadata
                          });
                        }
                        controller.enqueue({
                          type: "text-delta",
                          id: currentTextBlockId,
                          delta: part.text,
                          providerMetadata: thoughtSignatureMetadata
                        });
                      }
                    } else if ("inlineData" in part) {
                      if (currentTextBlockId !== null) {
                        controller.enqueue({
                          type: "text-end",
                          id: currentTextBlockId
                        });
                        currentTextBlockId = null;
                      }
                      if (currentReasoningBlockId !== null) {
                        controller.enqueue({
                          type: "reasoning-end",
                          id: currentReasoningBlockId
                        });
                        currentReasoningBlockId = null;
                      }
                      const hasThought = part.thought === true;
                      const hasThoughtSignature = !!part.thoughtSignature;
                      const fileMeta = hasThoughtSignature ? wrapProviderMetadata({
                        thoughtSignature: part.thoughtSignature
                      }) : void 0;
                      controller.enqueue({
                        type: hasThought ? "reasoning-file" : "file",
                        mediaType: part.inlineData.mimeType,
                        data: { type: "data", data: part.inlineData.data },
                        providerMetadata: fileMeta
                      });
                    } else if ("toolCall" in part && part.toolCall) {
                      const toolCallId = (_e = part.toolCall.id) != null ? _e : generateId3();
                      lastServerToolCallId = toolCallId;
                      const serverMeta = wrapProviderMetadata({
                        ...part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : {},
                        serverToolCallId: toolCallId,
                        serverToolType: part.toolCall.toolType
                      });
                      controller.enqueue({
                        type: "tool-call",
                        toolCallId,
                        toolName: `server:${part.toolCall.toolType}`,
                        input: JSON.stringify((_f = part.toolCall.args) != null ? _f : {}),
                        providerExecuted: true,
                        dynamic: true,
                        providerMetadata: serverMeta
                      });
                    } else if ("toolResponse" in part && part.toolResponse) {
                      const responseToolCallId = (_g = lastServerToolCallId != null ? lastServerToolCallId : part.toolResponse.id) != null ? _g : generateId3();
                      const serverMeta = wrapProviderMetadata({
                        ...part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : {},
                        serverToolCallId: responseToolCallId,
                        serverToolType: part.toolResponse.toolType
                      });
                      controller.enqueue({
                        type: "tool-result",
                        toolCallId: responseToolCallId,
                        toolName: `server:${part.toolResponse.toolType}`,
                        result: (_h = part.toolResponse.response) != null ? _h : {},
                        providerMetadata: serverMeta
                      });
                      lastServerToolCallId = void 0;
                    }
                  }
                  for (const part of parts) {
                    if (!("functionCall" in part)) continue;
                    const providerMeta = part.thoughtSignature ? wrapProviderMetadata({
                      thoughtSignature: part.thoughtSignature
                    }) : void 0;
                    const isStreamingChunk = part.functionCall.partialArgs != null || part.functionCall.name != null && part.functionCall.willContinue === true;
                    const isTerminalChunk = part.functionCall.name == null && part.functionCall.args == null && part.functionCall.partialArgs == null && part.functionCall.willContinue == null;
                    const isCompleteCall = part.functionCall.name != null && part.functionCall.args != null && part.functionCall.partialArgs == null;
                    const isNoArgsCompleteCall = part.functionCall.name != null && part.functionCall.args == null && part.functionCall.partialArgs == null && part.functionCall.willContinue !== true;
                    if (isStreamingChunk) {
                      if (part.functionCall.name != null) {
                        const toolCallId = (_i = part.functionCall.id) != null ? _i : generateId3();
                        const accumulator = new GoogleJSONAccumulator();
                        activeStreamingToolCalls.push({
                          toolCallId,
                          toolName: part.functionCall.name,
                          accumulator,
                          providerMetadata: providerMeta
                        });
                        controller.enqueue({
                          type: "tool-input-start",
                          id: toolCallId,
                          toolName: part.functionCall.name,
                          providerMetadata: providerMeta
                        });
                        if (part.functionCall.partialArgs != null) {
                          const partialArgs = part.functionCall.partialArgs;
                          const { textDelta } = accumulator.processPartialArgs(partialArgs);
                          if (textDelta.length > 0) {
                            controller.enqueue({
                              type: "tool-input-delta",
                              id: toolCallId,
                              delta: textDelta,
                              providerMetadata: providerMeta
                            });
                          }
                          if (part.functionCall.willContinue !== true && partialArgs.every((arg) => arg.willContinue !== true)) {
                            finishActiveStreamingToolCall(controller);
                          }
                        }
                      } else if (part.functionCall.partialArgs != null && activeStreamingToolCalls.length > 0) {
                        const active = activeStreamingToolCalls[activeStreamingToolCalls.length - 1];
                        const partialArgs = part.functionCall.partialArgs;
                        const { textDelta } = active.accumulator.processPartialArgs(partialArgs);
                        if (textDelta.length > 0) {
                          controller.enqueue({
                            type: "tool-input-delta",
                            id: active.toolCallId,
                            delta: textDelta,
                            providerMetadata: providerMeta
                          });
                        }
                        if (part.functionCall.willContinue !== true && partialArgs.every((arg) => arg.willContinue !== true)) {
                          finishActiveStreamingToolCall(controller);
                        }
                      }
                    } else if (isTerminalChunk && activeStreamingToolCalls.length > 0) {
                      finishActiveStreamingToolCall(controller);
                    } else if (isCompleteCall) {
                      const toolCallId = (_j = part.functionCall.id) != null ? _j : generateId3();
                      const toolName = part.functionCall.name;
                      const args2 = typeof part.functionCall.args === "string" ? part.functionCall.args : JSON.stringify((_k = part.functionCall.args) != null ? _k : {});
                      controller.enqueue({
                        type: "tool-input-start",
                        id: toolCallId,
                        toolName,
                        providerMetadata: providerMeta
                      });
                      controller.enqueue({
                        type: "tool-input-delta",
                        id: toolCallId,
                        delta: args2,
                        providerMetadata: providerMeta
                      });
                      controller.enqueue({
                        type: "tool-input-end",
                        id: toolCallId,
                        providerMetadata: providerMeta
                      });
                      controller.enqueue({
                        type: "tool-call",
                        toolCallId,
                        toolName,
                        input: args2,
                        providerMetadata: providerMeta
                      });
                      hasToolCalls = true;
                    } else if (isNoArgsCompleteCall) {
                      const toolCallId = (_l = part.functionCall.id) != null ? _l : generateId3();
                      const toolName = part.functionCall.name;
                      controller.enqueue({
                        type: "tool-input-start",
                        id: toolCallId,
                        toolName,
                        providerMetadata: providerMeta
                      });
                      controller.enqueue({
                        type: "tool-input-end",
                        id: toolCallId,
                        providerMetadata: providerMeta
                      });
                      controller.enqueue({
                        type: "tool-call",
                        toolCallId,
                        toolName,
                        input: "{}",
                        providerMetadata: providerMeta
                      });
                      hasToolCalls = true;
                    }
                  }
                }
                if (candidate.finishReason != null) {
                  finishReason = {
                    unified: mapGoogleFinishReason({
                      finishReason: candidate.finishReason,
                      hasToolCalls
                    }),
                    raw: candidate.finishReason
                  };
                  providerMetadata = wrapProviderMetadata({
                    promptFeedback: (_m = value.promptFeedback) != null ? _m : null,
                    groundingMetadata: lastGroundingMetadata,
                    urlContextMetadata: lastUrlContextMetadata,
                    safetyRatings: (_n = candidate.safetyRatings) != null ? _n : null,
                    usageMetadata: usageMetadata != null ? usageMetadata : null,
                    finishMessage: (_o = candidate.finishMessage) != null ? _o : null,
                    serviceTier: (_p = usage == null ? void 0 : usage.serviceTier) != null ? _p : null
                  });
                }
              },
              flush(controller) {
                if (currentTextBlockId !== null) {
                  controller.enqueue({
                    type: "text-end",
                    id: currentTextBlockId
                  });
                }
                if (currentReasoningBlockId !== null) {
                  controller.enqueue({
                    type: "reasoning-end",
                    id: currentReasoningBlockId
                  });
                }
                controller.enqueue({
                  type: "finish",
                  finishReason,
                  usage: convertGoogleUsage(usage),
                  providerMetadata
                });
              }
            })
          ),
          response: { headers: responseHeaders },
          request: { body: args }
        };
      }
    };
    getGroundingMetadataSchema = () => z52.object({
      webSearchQueries: z52.array(z52.string()).nullish(),
      imageSearchQueries: z52.array(z52.string()).nullish(),
      retrievalQueries: z52.array(z52.string()).nullish(),
      searchEntryPoint: z52.object({ renderedContent: z52.string() }).nullish(),
      groundingChunks: z52.array(
        z52.object({
          web: z52.object({ uri: z52.string(), title: z52.string().nullish() }).nullish(),
          image: z52.object({
            sourceUri: z52.string(),
            imageUri: z52.string(),
            title: z52.string().nullish(),
            domain: z52.string().nullish()
          }).nullish(),
          retrievedContext: z52.object({
            uri: z52.string().nullish(),
            title: z52.string().nullish(),
            text: z52.string().nullish(),
            fileSearchStore: z52.string().nullish()
          }).nullish(),
          maps: z52.object({
            uri: z52.string().nullish(),
            title: z52.string().nullish(),
            text: z52.string().nullish(),
            placeId: z52.string().nullish()
          }).nullish()
        })
      ).nullish(),
      groundingSupports: z52.array(
        z52.object({
          segment: z52.object({
            startIndex: z52.number().nullish(),
            endIndex: z52.number().nullish(),
            text: z52.string().nullish()
          }).nullish(),
          segment_text: z52.string().nullish(),
          groundingChunkIndices: z52.array(z52.number()).nullish(),
          supportChunkIndices: z52.array(z52.number()).nullish(),
          confidenceScores: z52.array(z52.number()).nullish(),
          confidenceScore: z52.array(z52.number()).nullish()
        })
      ).nullish(),
      retrievalMetadata: z52.union([
        z52.object({
          webDynamicRetrievalScore: z52.number()
        }),
        z52.object({})
      ]).nullish()
    });
    partialArgSchema = z52.object({
      jsonPath: z52.string(),
      stringValue: z52.string().nullish(),
      numberValue: z52.number().nullish(),
      boolValue: z52.boolean().nullish(),
      nullValue: z52.unknown().nullish(),
      willContinue: z52.boolean().nullish()
    });
    getContentSchema = () => z52.object({
      parts: z52.array(
        z52.union([
          // note: order matters since text can be fully empty
          z52.object({
            functionCall: z52.object({
              id: z52.string().nullish(),
              name: z52.string().nullish(),
              args: z52.unknown().nullish(),
              partialArgs: z52.array(partialArgSchema).nullish(),
              willContinue: z52.boolean().nullish()
            }),
            thoughtSignature: z52.string().nullish()
          }),
          z52.object({
            inlineData: z52.object({
              mimeType: z52.string(),
              data: z52.string()
            }),
            thought: z52.boolean().nullish(),
            thoughtSignature: z52.string().nullish()
          }),
          z52.object({
            toolCall: z52.object({
              toolType: z52.string(),
              args: z52.unknown().nullish(),
              id: z52.string()
            }),
            thoughtSignature: z52.string().nullish()
          }),
          z52.object({
            toolResponse: z52.object({
              toolType: z52.string(),
              response: z52.unknown().nullish(),
              id: z52.string()
            }),
            thoughtSignature: z52.string().nullish()
          }),
          z52.object({
            executableCode: z52.object({
              language: z52.string(),
              code: z52.string()
            }).nullish(),
            codeExecutionResult: z52.object({
              outcome: z52.string(),
              output: z52.string().nullish()
            }).nullish(),
            text: z52.string().nullish(),
            thought: z52.boolean().nullish(),
            thoughtSignature: z52.string().nullish()
          })
        ])
      ).nullish()
    });
    getSafetyRatingSchema = () => z52.object({
      category: z52.string().nullish(),
      probability: z52.string().nullish(),
      probabilityScore: z52.number().nullish(),
      severity: z52.string().nullish(),
      severityScore: z52.number().nullish(),
      blocked: z52.boolean().nullish()
    });
    tokenDetailsSchema = z52.array(
      z52.object({
        modality: z52.string(),
        tokenCount: z52.number()
      })
    ).nullish();
    usageSchema = z52.object({
      cachedContentTokenCount: z52.number().nullish(),
      thoughtsTokenCount: z52.number().nullish(),
      promptTokenCount: z52.number().nullish(),
      candidatesTokenCount: z52.number().nullish(),
      totalTokenCount: z52.number().nullish(),
      // https://cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/GenerateContentResponse#TrafficType
      trafficType: z52.string().nullish(),
      serviceTier: z52.string().nullish(),
      // https://ai.google.dev/api/generate-content#Modality
      promptTokensDetails: tokenDetailsSchema,
      candidatesTokensDetails: tokenDetailsSchema
    });
    getUrlContextMetadataSchema = () => z52.object({
      urlMetadata: z52.array(
        z52.object({
          retrievedUrl: z52.string(),
          urlRetrievalStatus: z52.string()
        })
      ).nullish()
    });
    responseSchema = lazySchema(
      () => zodSchema(
        z52.object({
          candidates: z52.array(
            z52.object({
              content: getContentSchema().nullish().or(z52.object({}).strict()),
              finishReason: z52.string().nullish(),
              finishMessage: z52.string().nullish(),
              safetyRatings: z52.array(getSafetyRatingSchema()).nullish(),
              groundingMetadata: getGroundingMetadataSchema().nullish(),
              urlContextMetadata: getUrlContextMetadataSchema().nullish()
            })
          ),
          usageMetadata: usageSchema.nullish(),
          promptFeedback: z52.object({
            blockReason: z52.string().nullish(),
            safetyRatings: z52.array(getSafetyRatingSchema()).nullish()
          }).nullish()
        })
      )
    );
    chunkSchema = lazySchema(
      () => zodSchema(
        z52.object({
          candidates: z52.array(
            z52.object({
              content: getContentSchema().nullish(),
              finishReason: z52.string().nullish(),
              finishMessage: z52.string().nullish(),
              safetyRatings: z52.array(getSafetyRatingSchema()).nullish(),
              groundingMetadata: getGroundingMetadataSchema().nullish(),
              urlContextMetadata: getUrlContextMetadataSchema().nullish()
            })
          ).nullish(),
          usageMetadata: usageSchema.nullish(),
          promptFeedback: z52.object({
            blockReason: z52.string().nullish(),
            safetyRatings: z52.array(getSafetyRatingSchema()).nullish()
          }).nullish()
        })
      )
    );
    codeExecution = createProviderExecutedToolFactory({
      id: "google.code_execution",
      inputSchema: z62.object({
        language: z62.string().describe("The programming language of the code."),
        code: z62.string().describe("The code to be executed.")
      }),
      outputSchema: z62.object({
        outcome: z62.string().describe('The outcome of the execution (e.g., "OUTCOME_OK").'),
        output: z62.string().describe("The output from the code execution.")
      })
    });
    enterpriseWebSearch = createProviderExecutedToolFactory({
      id: "google.enterprise_web_search",
      inputSchema: lazySchema(() => zodSchema(z72.object({}))),
      outputSchema: lazySchema(() => zodSchema(z72.object({})))
    });
    fileSearchArgsBaseSchema = z82.object({
      /** The names of the file_search_stores to retrieve from.
       *  Example: `fileSearchStores/my-file-search-store-123`
       */
      fileSearchStoreNames: z82.array(z82.string()).describe(
        "The names of the file_search_stores to retrieve from. Example: `fileSearchStores/my-file-search-store-123`"
      ),
      /** The number of file search retrieval chunks to retrieve. */
      topK: z82.number().int().positive().describe("The number of file search retrieval chunks to retrieve.").optional(),
      /** Metadata filter to apply to the file search retrieval documents.
       *  See https://google.aip.dev/160 for the syntax of the filter expression.
       */
      metadataFilter: z82.string().describe(
        "Metadata filter to apply to the file search retrieval documents. See https://google.aip.dev/160 for the syntax of the filter expression."
      ).optional()
    }).passthrough();
    fileSearch2 = createProviderExecutedToolFactory({
      id: "google.file_search",
      inputSchema: lazySchema(() => zodSchema(z82.object({}))),
      outputSchema: lazySchema(() => zodSchema(z82.object({})))
    });
    googleMaps = createProviderExecutedToolFactory({
      id: "google.google_maps",
      inputSchema: lazySchema(() => zodSchema(z92.object({}))),
      outputSchema: lazySchema(() => zodSchema(z92.object({})))
    });
    googleSearchToolArgsBaseSchema = z102.object({
      searchTypes: z102.object({
        webSearch: z102.object({}).optional(),
        imageSearch: z102.object({}).optional()
      }).optional(),
      timeRangeFilter: z102.object({
        startTime: z102.string(),
        endTime: z102.string()
      }).optional()
    }).passthrough();
    googleSearch = createProviderExecutedToolFactory({
      id: "google.google_search",
      inputSchema: lazySchema(() => zodSchema(z102.object({}))),
      outputSchema: lazySchema(() => zodSchema(z102.object({})))
    });
    urlContext = createProviderExecutedToolFactory({
      id: "google.url_context",
      inputSchema: lazySchema(() => zodSchema(z112.object({}))),
      outputSchema: lazySchema(() => zodSchema(z112.object({})))
    });
    vertexRagStore = createProviderExecutedToolFactory({
      id: "google.vertex_rag_store",
      inputSchema: lazySchema(() => zodSchema(z122.object({}))),
      outputSchema: lazySchema(() => zodSchema(z122.object({})))
    });
    googleTools = {
      /**
       * Creates a Google search tool that gives Google direct access to real-time web content.
       * Must have name "google_search".
       */
      googleSearch,
      /**
       * Creates an Enterprise Web Search tool for grounding responses using a compliance-focused web index.
       * Designed for highly-regulated industries (finance, healthcare, public sector).
       * Does not log customer data and supports VPC service controls.
       * Must have name "enterprise_web_search".
       *
       * @note Only available on Vertex AI. Requires Gemini 2.0 or newer.
       *
       * @see https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/web-grounding-enterprise
       */
      enterpriseWebSearch,
      /**
       * Creates a Google Maps grounding tool that gives the model access to Google Maps data.
       * Must have name "google_maps".
       *
       * @see https://ai.google.dev/gemini-api/docs/maps-grounding
       * @see https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-google-maps
       */
      googleMaps,
      /**
       * Creates a URL context tool that gives Google direct access to real-time web content.
       * Must have name "url_context".
       */
      urlContext,
      /**
       * Enables Retrieval Augmented Generation (RAG) via the Gemini File Search tool.
       * Must have name "file_search".
       *
       * @param fileSearchStoreNames - Fully-qualified File Search store resource names.
       * @param metadataFilter - Optional filter expression to restrict the files that can be retrieved.
       * @param topK - Optional result limit for the number of chunks returned from File Search.
       *
       * @see https://ai.google.dev/gemini-api/docs/file-search
       */
      fileSearch: fileSearch2,
      /**
       * A tool that enables the model to generate and run Python code.
       * Must have name "code_execution".
       *
       * @note Ensure the selected model supports Code Execution.
       * Multi-tool usage with the code execution tool is typically compatible with Gemini >=2 models.
       *
       * @see https://ai.google.dev/gemini-api/docs/code-execution (Google AI)
       * @see https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/code-execution-api (Vertex AI)
       */
      codeExecution,
      /**
       * Creates a Vertex RAG Store tool that enables the model to perform RAG searches against a Vertex RAG Store.
       * Must have name "vertex_rag_store".
       */
      vertexRagStore
    };
    googleImageModelOptionsSchema = lazySchema(
      () => zodSchema(
        z132.object({
          personGeneration: z132.enum(["dont_allow", "allow_adult", "allow_all"]).nullish(),
          aspectRatio: z132.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).nullish(),
          /**
           * Enable Google Search grounding for Gemini image models. The value is
           * forwarded as the args of the `google.tools.googleSearch` provider
           * tool on the underlying language-model call. Pass `{}` for defaults.
           *
           * `generateImage` does not accept a `tools` parameter, so this is the
           * dedicated escape hatch for grounding image generation the same way
           * `generateText` does.
           */
          googleSearch: googleSearchToolArgsBaseSchema.optional()
        })
      )
    );
    GoogleImageModel = class _GoogleImageModel {
      constructor(modelId, settings, config) {
        this.modelId = modelId;
        this.settings = settings;
        this.config = config;
        this.specificationVersion = "v4";
      }
      static [WORKFLOW_SERIALIZE](model) {
        return serializeModelOptions({
          modelId: model.modelId,
          config: model.config
        });
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _GoogleImageModel(options.modelId, {}, options.config);
      }
      get maxImagesPerCall() {
        if (this.settings.maxImagesPerCall != null) {
          return this.settings.maxImagesPerCall;
        }
        if (isGeminiModel(this.modelId)) {
          return 10;
        }
        return 4;
      }
      get provider() {
        return this.config.provider;
      }
      async doGenerate(options) {
        if (isGeminiModel(this.modelId)) {
          return this.doGenerateGemini(options);
        }
        return this.doGenerateImagen(options);
      }
      async doGenerateImagen(options) {
        var _a2, _b2, _c;
        const {
          prompt,
          n = 1,
          size,
          aspectRatio = "1:1",
          seed,
          providerOptions,
          headers,
          abortSignal,
          files,
          mask
        } = options;
        const warnings = [];
        if (files != null && files.length > 0) {
          throw new Error(
            "Google Gemini API does not support image editing with Imagen models. Use Google Vertex AI (@ai-sdk/google-vertex) for image editing capabilities."
          );
        }
        if (mask != null) {
          throw new Error(
            "Google Gemini API does not support image editing with masks. Use Google Vertex AI (@ai-sdk/google-vertex) for image editing capabilities."
          );
        }
        if (size != null) {
          warnings.push({
            type: "unsupported",
            feature: "size",
            details: "This model does not support the `size` option. Use `aspectRatio` instead."
          });
        }
        if (seed != null) {
          warnings.push({
            type: "unsupported",
            feature: "seed",
            details: "This model does not support the `seed` option through this provider."
          });
        }
        const googleOptions = await parseProviderOptions({
          provider: "google",
          providerOptions,
          schema: googleImageModelOptionsSchema
        });
        const currentDate = (_c = (_b2 = (_a2 = this.config._internal) == null ? void 0 : _a2.currentDate) == null ? void 0 : _b2.call(_a2)) != null ? _c : /* @__PURE__ */ new Date();
        const parameters = {
          sampleCount: n
        };
        if (aspectRatio != null) {
          parameters.aspectRatio = aspectRatio;
        }
        if (googleOptions) {
          const { googleSearch: imagenGoogleSearch, ...imagenOptions } = googleOptions;
          if (imagenGoogleSearch != null) {
            warnings.push({
              type: "unsupported",
              feature: "googleSearch",
              details: "Google Search grounding is only supported on Gemini image models."
            });
          }
          Object.assign(parameters, imagenOptions);
        }
        const body = {
          instances: [{ prompt }],
          parameters
        };
        const { responseHeaders, value: response } = await postJsonToApi({
          url: `${this.config.baseURL}/models/${this.modelId}:predict`,
          headers: combineHeaders(
            this.config.headers ? await resolve(this.config.headers) : void 0,
            headers
          ),
          body,
          failedResponseHandler: googleFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            googleImageResponseSchema
          ),
          abortSignal,
          fetch: this.config.fetch
        });
        return {
          images: response.predictions.map(
            (p) => p.bytesBase64Encoded
          ),
          warnings,
          providerMetadata: {
            google: {
              images: response.predictions.map(() => ({
                // Add any prediction-specific metadata here
              }))
            }
          },
          response: {
            timestamp: currentDate,
            modelId: this.modelId,
            headers: responseHeaders
          }
        };
      }
      async doGenerateGemini(options) {
        var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k;
        const {
          prompt,
          n,
          size,
          aspectRatio,
          seed,
          providerOptions,
          headers,
          abortSignal,
          files,
          mask
        } = options;
        const warnings = [];
        if (mask != null) {
          throw new Error(
            "Gemini image models do not support mask-based image editing."
          );
        }
        if (n != null && n > 1) {
          throw new Error(
            "Gemini image models do not support generating a set number of images per call. Use n=1 or omit the n parameter."
          );
        }
        if (size != null) {
          warnings.push({
            type: "unsupported",
            feature: "size",
            details: "This model does not support the `size` option. Use `aspectRatio` instead."
          });
        }
        const userContent = [];
        if (prompt != null) {
          userContent.push({ type: "text", text: prompt });
        }
        if (files != null && files.length > 0) {
          for (const file of files) {
            if (file.type === "url") {
              userContent.push({
                type: "file",
                data: { type: "url", url: new URL(file.url) },
                mediaType: "image/*"
              });
            } else {
              userContent.push({
                type: "file",
                data: {
                  type: "data",
                  data: typeof file.data === "string" ? file.data : new Uint8Array(file.data)
                },
                mediaType: file.mediaType
              });
            }
          }
        }
        const languageModelPrompt = [
          { role: "user", content: userContent }
        ];
        const googleImageOptions = await parseProviderOptions({
          provider: "google",
          providerOptions,
          schema: googleImageModelOptionsSchema
        });
        const { googleSearch: _strippedGoogleSearch, ...passthroughGoogleOptions } = (_a2 = providerOptions == null ? void 0 : providerOptions.google) != null ? _a2 : {};
        const languageModel = new GoogleLanguageModel(this.modelId, {
          provider: this.config.provider,
          baseURL: this.config.baseURL,
          headers: (_b2 = this.config.headers) != null ? _b2 : {},
          fetch: this.config.fetch,
          generateId: (_c = this.config.generateId) != null ? _c : generateId
        });
        const result = await languageModel.doGenerate({
          prompt: languageModelPrompt,
          seed,
          providerOptions: {
            google: {
              responseModalities: ["IMAGE"],
              imageConfig: aspectRatio ? {
                aspectRatio
              } : void 0,
              ...passthroughGoogleOptions
            }
          },
          tools: (googleImageOptions == null ? void 0 : googleImageOptions.googleSearch) != null ? [
            {
              type: "provider",
              id: "google.google_search",
              name: "google_search",
              args: googleImageOptions.googleSearch
            }
          ] : void 0,
          headers,
          abortSignal
        });
        const currentDate = (_f = (_e = (_d = this.config._internal) == null ? void 0 : _d.currentDate) == null ? void 0 : _e.call(_d)) != null ? _f : /* @__PURE__ */ new Date();
        const images = [];
        for (const part of result.content) {
          if (part.type === "file" && part.mediaType.startsWith("image/") && part.data.type === "data") {
            images.push(convertToBase64(part.data.data));
          }
        }
        const languageModelGoogleMetadata = (_h = (_g = result.providerMetadata) == null ? void 0 : _g.google) != null ? _h : {};
        return {
          images,
          warnings,
          providerMetadata: {
            google: {
              ...languageModelGoogleMetadata,
              images: images.map(() => ({}))
            }
          },
          response: {
            timestamp: currentDate,
            modelId: this.modelId,
            headers: (_i = result.response) == null ? void 0 : _i.headers
          },
          usage: result.usage ? {
            inputTokens: result.usage.inputTokens.total,
            outputTokens: result.usage.outputTokens.total,
            totalTokens: ((_j = result.usage.inputTokens.total) != null ? _j : 0) + ((_k = result.usage.outputTokens.total) != null ? _k : 0)
          } : void 0
        };
      }
    };
    googleImageResponseSchema = lazySchema(
      () => zodSchema(
        z142.object({
          predictions: z142.array(z142.object({ bytesBase64Encoded: z142.string() })).default([])
        })
      )
    );
    GoogleFiles = class {
      constructor(config) {
        this.config = config;
        this.specificationVersion = "v4";
      }
      get provider() {
        return this.config.provider;
      }
      async uploadFile(options) {
        var _a2, _b2, _c, _d;
        const googleOptions = await parseProviderOptions({
          provider: "google",
          providerOptions: options.providerOptions,
          schema: googleFilesUploadOptionsSchema
        });
        const resolvedHeaders = this.config.headers();
        const fetchFn = (_a2 = this.config.fetch) != null ? _a2 : globalThis.fetch;
        const warnings = [];
        if (options.filename != null) {
          warnings.push({ type: "unsupported", feature: "filename" });
        }
        const fileBytes = convertInlineFileDataToUint8Array(options.data);
        const mediaType = options.mediaType;
        const displayName = googleOptions == null ? void 0 : googleOptions.displayName;
        const baseOrigin = this.config.baseURL.replace(/\/v1beta$/, "");
        const initResponse = await fetchFn(`${baseOrigin}/upload/v1beta/files`, {
          method: "POST",
          headers: {
            ...resolvedHeaders,
            "X-Goog-Upload-Protocol": "resumable",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": String(fileBytes.length),
            "X-Goog-Upload-Header-Content-Type": mediaType,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            file: {
              ...displayName != null ? { display_name: displayName } : {}
            }
          })
        });
        if (!initResponse.ok) {
          const errorBody = await initResponse.text();
          throw new AISDKError2({
            name: "GOOGLE_FILES_UPLOAD_ERROR",
            message: `Failed to initiate resumable upload: ${initResponse.status} ${errorBody}`
          });
        }
        const uploadUrl = initResponse.headers.get("x-goog-upload-url");
        if (!uploadUrl) {
          throw new AISDKError2({
            name: "GOOGLE_FILES_UPLOAD_ERROR",
            message: "No upload URL returned from initiation request"
          });
        }
        const uploadResponse = await fetchFn(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Length": String(fileBytes.length),
            "X-Goog-Upload-Offset": "0",
            "X-Goog-Upload-Command": "upload, finalize"
          },
          body: fileBytes
        });
        if (!uploadResponse.ok) {
          const errorBody = await uploadResponse.text();
          throw new AISDKError2({
            name: "GOOGLE_FILES_UPLOAD_ERROR",
            message: `Failed to upload file data: ${uploadResponse.status} ${errorBody}`
          });
        }
        const uploadResult = await uploadResponse.json();
        let file = uploadResult.file;
        const pollIntervalMs = (_b2 = googleOptions == null ? void 0 : googleOptions.pollIntervalMs) != null ? _b2 : 2e3;
        const pollTimeoutMs = (_c = googleOptions == null ? void 0 : googleOptions.pollTimeoutMs) != null ? _c : 3e5;
        const startTime = Date.now();
        while (file.state === "PROCESSING") {
          if (Date.now() - startTime > pollTimeoutMs) {
            throw new AISDKError2({
              name: "GOOGLE_FILES_UPLOAD_TIMEOUT",
              message: `File processing timed out after ${pollTimeoutMs}ms`
            });
          }
          await delay(pollIntervalMs);
          const { value: fileStatus } = await getFromApi({
            url: `${this.config.baseURL}/${file.name}`,
            headers: combineHeaders(resolvedHeaders),
            successfulResponseHandler: createJsonResponseHandler(
              googleFileResponseSchema
            ),
            failedResponseHandler: googleFailedResponseHandler,
            fetch: this.config.fetch
          });
          file = fileStatus;
        }
        if (file.state === "FAILED") {
          throw new AISDKError2({
            name: "GOOGLE_FILES_UPLOAD_FAILED",
            message: `File processing failed for ${file.name}`
          });
        }
        return {
          warnings,
          providerReference: { google: file.uri },
          mediaType: (_d = file.mimeType) != null ? _d : options.mediaType,
          providerMetadata: {
            google: {
              name: file.name,
              displayName: file.displayName,
              mimeType: file.mimeType,
              sizeBytes: file.sizeBytes,
              state: file.state,
              uri: file.uri,
              ...file.createTime != null ? { createTime: file.createTime } : {},
              ...file.updateTime != null ? { updateTime: file.updateTime } : {},
              ...file.expirationTime != null ? { expirationTime: file.expirationTime } : {},
              ...file.sha256Hash != null ? { sha256Hash: file.sha256Hash } : {}
            }
          }
        };
      }
    };
    googleFileResponseSchema = lazySchema(
      () => zodSchema(
        z152.object({
          name: z152.string(),
          displayName: z152.string().nullish(),
          mimeType: z152.string(),
          sizeBytes: z152.string().nullish(),
          createTime: z152.string().nullish(),
          updateTime: z152.string().nullish(),
          expirationTime: z152.string().nullish(),
          sha256Hash: z152.string().nullish(),
          uri: z152.string(),
          state: z152.string()
        })
      )
    );
    googleFilesUploadOptionsSchema = lazySchema(
      () => zodSchema(
        z152.object({
          displayName: z152.string().nullish(),
          pollIntervalMs: z152.number().positive().nullish(),
          pollTimeoutMs: z152.number().positive().nullish()
        }).passthrough()
      )
    );
    googleVideoModelOptionsSchema = lazySchema(
      () => zodSchema(
        z162.object({
          pollIntervalMs: z162.number().positive().nullish(),
          pollTimeoutMs: z162.number().positive().nullish(),
          personGeneration: z162.enum(["dont_allow", "allow_adult", "allow_all"]).nullish(),
          negativePrompt: z162.string().nullish(),
          referenceImages: z162.array(
            z162.object({
              bytesBase64Encoded: z162.string().nullish(),
              gcsUri: z162.string().nullish()
            })
          ).nullish()
        }).passthrough()
      )
    );
    GoogleVideoModel = class {
      constructor(modelId, config) {
        this.modelId = modelId;
        this.config = config;
        this.specificationVersion = "v4";
      }
      get provider() {
        return this.config.provider;
      }
      get maxVideosPerCall() {
        return 4;
      }
      async doGenerate(options) {
        var _a2, _b2, _c, _d, _e, _f, _g, _h;
        const currentDate = (_c = (_b2 = (_a2 = this.config._internal) == null ? void 0 : _a2.currentDate) == null ? void 0 : _b2.call(_a2)) != null ? _c : /* @__PURE__ */ new Date();
        const warnings = [];
        const googleOptions = await parseProviderOptions({
          provider: "google",
          providerOptions: options.providerOptions,
          schema: googleVideoModelOptionsSchema
        });
        const instances = [{}];
        const instance = instances[0];
        if (options.prompt != null) {
          instance.prompt = options.prompt;
        }
        if (options.image != null) {
          if (options.image.type === "url") {
            warnings.push({
              type: "unsupported",
              feature: "URL-based image input",
              details: "Google Generative AI video models require base64-encoded images. URL will be ignored."
            });
          } else {
            const base64Data = typeof options.image.data === "string" ? options.image.data : convertUint8ArrayToBase64(options.image.data);
            instance.image = {
              inlineData: {
                mimeType: options.image.mediaType || "image/png",
                data: base64Data
              }
            };
          }
        }
        if ((googleOptions == null ? void 0 : googleOptions.referenceImages) != null) {
          instance.referenceImages = googleOptions.referenceImages.map((refImg) => {
            if (refImg.bytesBase64Encoded) {
              return {
                inlineData: {
                  mimeType: "image/png",
                  data: refImg.bytesBase64Encoded
                }
              };
            } else if (refImg.gcsUri) {
              return {
                gcsUri: refImg.gcsUri
              };
            }
            return refImg;
          });
        }
        const parameters = {
          sampleCount: options.n
        };
        if (options.aspectRatio) {
          parameters.aspectRatio = options.aspectRatio;
        }
        if (options.resolution) {
          const resolutionMap = {
            "1280x720": "720p",
            "1920x1080": "1080p",
            "3840x2160": "4k"
          };
          parameters.resolution = resolutionMap[options.resolution] || options.resolution;
        }
        if (options.duration) {
          parameters.durationSeconds = options.duration;
        }
        if (options.seed) {
          parameters.seed = options.seed;
        }
        if (googleOptions != null) {
          const opts = googleOptions;
          if (opts.personGeneration !== void 0 && opts.personGeneration !== null) {
            parameters.personGeneration = opts.personGeneration;
          }
          if (opts.negativePrompt !== void 0 && opts.negativePrompt !== null) {
            parameters.negativePrompt = opts.negativePrompt;
          }
          for (const [key, value] of Object.entries(opts)) {
            if (![
              "pollIntervalMs",
              "pollTimeoutMs",
              "personGeneration",
              "negativePrompt",
              "referenceImages"
            ].includes(key)) {
              parameters[key] = value;
            }
          }
        }
        const { value: operation } = await postJsonToApi({
          url: `${this.config.baseURL}/models/${this.modelId}:predictLongRunning`,
          headers: combineHeaders(
            await resolve(this.config.headers),
            options.headers
          ),
          body: {
            instances,
            parameters
          },
          successfulResponseHandler: createJsonResponseHandler(
            googleOperationSchema
          ),
          failedResponseHandler: googleFailedResponseHandler,
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        const operationName = operation.name;
        if (!operationName) {
          throw new AISDKError22({
            name: "GOOGLE_VIDEO_GENERATION_ERROR",
            message: "No operation name returned from API"
          });
        }
        const pollIntervalMs = (_d = googleOptions == null ? void 0 : googleOptions.pollIntervalMs) != null ? _d : 1e4;
        const pollTimeoutMs = (_e = googleOptions == null ? void 0 : googleOptions.pollTimeoutMs) != null ? _e : 6e5;
        const startTime = Date.now();
        let finalOperation = operation;
        let responseHeaders;
        while (!finalOperation.done) {
          if (Date.now() - startTime > pollTimeoutMs) {
            throw new AISDKError22({
              name: "GOOGLE_VIDEO_GENERATION_TIMEOUT",
              message: `Video generation timed out after ${pollTimeoutMs}ms`
            });
          }
          await delay(pollIntervalMs);
          if ((_f = options.abortSignal) == null ? void 0 : _f.aborted) {
            throw new AISDKError22({
              name: "GOOGLE_VIDEO_GENERATION_ABORTED",
              message: "Video generation request was aborted"
            });
          }
          const { value: statusOperation, responseHeaders: pollHeaders } = await getFromApi({
            url: `${this.config.baseURL}/${operationName}`,
            headers: combineHeaders(
              await resolve(this.config.headers),
              options.headers
            ),
            successfulResponseHandler: createJsonResponseHandler(
              googleOperationSchema
            ),
            failedResponseHandler: googleFailedResponseHandler,
            abortSignal: options.abortSignal,
            fetch: this.config.fetch
          });
          finalOperation = statusOperation;
          responseHeaders = pollHeaders;
        }
        if (finalOperation.error) {
          throw new AISDKError22({
            name: "GOOGLE_VIDEO_GENERATION_FAILED",
            message: `Video generation failed: ${finalOperation.error.message}`
          });
        }
        const response = finalOperation.response;
        if (!((_g = response == null ? void 0 : response.generateVideoResponse) == null ? void 0 : _g.generatedSamples) || response.generateVideoResponse.generatedSamples.length === 0) {
          throw new AISDKError22({
            name: "GOOGLE_VIDEO_GENERATION_ERROR",
            message: `No videos in response. Response: ${JSON.stringify(finalOperation)}`
          });
        }
        const videos = [];
        const videoMetadata = [];
        const resolvedHeaders = await resolve(this.config.headers);
        const apiKey = resolvedHeaders == null ? void 0 : resolvedHeaders["x-goog-api-key"];
        for (const generatedSample of response.generateVideoResponse.generatedSamples) {
          if ((_h = generatedSample.video) == null ? void 0 : _h.uri) {
            const urlWithAuth = apiKey && isSameOrigin(generatedSample.video.uri, this.config.baseURL) ? `${generatedSample.video.uri}${generatedSample.video.uri.includes("?") ? "&" : "?"}key=${apiKey}` : generatedSample.video.uri;
            videos.push({
              type: "url",
              url: urlWithAuth,
              mediaType: "video/mp4"
            });
            videoMetadata.push({
              uri: generatedSample.video.uri
            });
          }
        }
        if (videos.length === 0) {
          throw new AISDKError22({
            name: "GOOGLE_VIDEO_GENERATION_ERROR",
            message: "No valid videos in response"
          });
        }
        return {
          videos,
          warnings,
          response: {
            timestamp: currentDate,
            modelId: this.modelId,
            headers: responseHeaders
          },
          providerMetadata: {
            google: {
              videos: videoMetadata
            }
          }
        };
      }
    };
    googleOperationSchema = z172.object({
      name: z172.string().nullish(),
      done: z172.boolean().nullish(),
      error: z172.object({
        code: z172.number().nullish(),
        message: z172.string(),
        status: z172.string().nullish()
      }).nullish(),
      response: z172.object({
        generateVideoResponse: z172.object({
          generatedSamples: z172.array(
            z172.object({
              video: z172.object({
                uri: z172.string().nullish()
              }).nullish()
            })
          ).nullish()
        }).nullish()
      }).nullish()
    });
    googleSpeechResponseSchema = lazySchema(
      () => zodSchema(
        z182.object({
          candidates: z182.array(
            z182.object({
              content: z182.object({
                parts: z182.array(
                  z182.object({
                    inlineData: z182.object({
                      mimeType: z182.string().nullish(),
                      data: z182.string().nullish()
                    }).nullish()
                  })
                ).nullish()
              }).nullish()
            })
          ).nullish()
        })
      )
    );
    prebuiltVoiceConfigSchema = z192.object({
      voiceName: z192.string()
    });
    voiceConfigSchema = z192.object({
      prebuiltVoiceConfig: prebuiltVoiceConfigSchema
    });
    googleSpeechProviderOptionsSchema = lazySchema(
      () => zodSchema(
        z192.object({
          /**
           * Multi-speaker configuration for dialogue audio. When provided, this
           * overrides the top-level `voice`. The Gemini TTS API supports up to two
           * speakers; each speaker name must match a name used in the input text.
           *
           * https://ai.google.dev/gemini-api/docs/speech-generation#multi-speaker
           */
          multiSpeakerVoiceConfig: z192.object({
            speakerVoiceConfigs: z192.array(
              z192.object({
                speaker: z192.string(),
                voiceConfig: voiceConfigSchema
              })
            )
          }).optional()
        })
      )
    );
    DEFAULT_VOICE = "Kore";
    DEFAULT_SAMPLE_RATE = 24e3;
    GoogleSpeechModel = class _GoogleSpeechModel {
      constructor(modelId, config) {
        this.modelId = modelId;
        this.config = config;
        this.specificationVersion = "v4";
      }
      static [WORKFLOW_SERIALIZE](model) {
        return serializeModelOptions({
          modelId: model.modelId,
          config: model.config
        });
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _GoogleSpeechModel(options.modelId, options.config);
      }
      get provider() {
        return this.config.provider;
      }
      async getArgs({
        text,
        voice = DEFAULT_VOICE,
        outputFormat,
        instructions,
        speed,
        language,
        providerOptions
      }) {
        const warnings = [];
        const providerOptionsNames = this.config.provider.includes("vertex") ? ["googleVertex", "vertex"] : ["google"];
        let googleOptions;
        for (const name2 of providerOptionsNames) {
          googleOptions = await parseProviderOptions({
            provider: name2,
            providerOptions,
            schema: googleSpeechProviderOptionsSchema
          });
          if (googleOptions != null) {
            break;
          }
        }
        if (googleOptions == null && !providerOptionsNames.includes("google")) {
          googleOptions = await parseProviderOptions({
            provider: "google",
            providerOptions,
            schema: googleSpeechProviderOptionsSchema
          });
        }
        const multiSpeakerVoiceConfig = googleOptions == null ? void 0 : googleOptions.multiSpeakerVoiceConfig;
        const speechConfig = multiSpeakerVoiceConfig ? { multiSpeakerVoiceConfig } : { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } };
        let promptText = text;
        if (instructions != null) {
          if (multiSpeakerVoiceConfig) {
            warnings.push({
              type: "unsupported",
              feature: "instructions",
              details: "Google Gemini TTS ignores `instructions` when `multiSpeakerVoiceConfig` is set, because prepending them would break multi-speaker transcript parsing."
            });
          } else {
            promptText = `${instructions}: ${text}`;
          }
        }
        if (speed != null) {
          warnings.push({
            type: "unsupported",
            feature: "speed",
            details: "Google Gemini TTS models do not support the `speed` option. It was ignored."
          });
        }
        if (language != null) {
          warnings.push({
            type: "unsupported",
            feature: "language",
            details: "Google Gemini TTS models do not support the `language` option. Language is detected automatically from the input text."
          });
        }
        let resolvedOutputFormat = "wav";
        if (outputFormat === "pcm") {
          resolvedOutputFormat = "pcm";
        } else if (outputFormat != null && outputFormat !== "wav") {
          warnings.push({
            type: "unsupported",
            feature: "outputFormat",
            details: `Unsupported output format: ${outputFormat}. Using wav instead.`
          });
        }
        const requestBody = {
          contents: [{ role: "user", parts: [{ text: promptText }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig
          }
        };
        return { requestBody, warnings, outputFormat: resolvedOutputFormat };
      }
      async doGenerate(options) {
        var _a2, _b2, _c, _d, _e, _f, _g, _h, _i;
        const currentDate = (_c = (_b2 = (_a2 = this.config._internal) == null ? void 0 : _a2.currentDate) == null ? void 0 : _b2.call(_a2)) != null ? _c : /* @__PURE__ */ new Date();
        const { requestBody, warnings, outputFormat } = await this.getArgs(options);
        const {
          value: response,
          responseHeaders,
          rawValue: rawResponse
        } = await postJsonToApi({
          url: `${this.config.baseURL}/models/${this.modelId}:generateContent`,
          headers: combineHeaders(
            this.config.headers ? await resolve(this.config.headers) : void 0,
            options.headers
          ),
          body: requestBody,
          failedResponseHandler: googleFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            googleSpeechResponseSchema
          ),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        let base64Audio;
        let mimeType;
        for (const candidate of (_d = response.candidates) != null ? _d : []) {
          for (const part of (_f = (_e = candidate.content) == null ? void 0 : _e.parts) != null ? _f : []) {
            if ((_g = part.inlineData) == null ? void 0 : _g.data) {
              base64Audio = part.inlineData.data;
              mimeType = (_h = part.inlineData.mimeType) != null ? _h : void 0;
              break;
            }
          }
          if (base64Audio != null) {
            break;
          }
        }
        const sampleRate = (_i = parseSampleRate(mimeType)) != null ? _i : DEFAULT_SAMPLE_RATE;
        const pcm = base64Audio != null ? convertBase64ToUint8Array(base64Audio) : new Uint8Array(0);
        const audio = outputFormat === "pcm" || pcm.length === 0 ? pcm : addWavHeader(pcm, sampleRate);
        if (outputFormat === "pcm" && pcm.length > 0) {
          warnings.push({
            type: "unsupported",
            feature: "outputFormat",
            details: `Returning raw PCM audio (signed 16-bit little-endian, mono, ${sampleRate} Hz). These bytes have no container header and are not directly playable; see providerMetadata.google for the sample rate and mime type.`
          });
        }
        return {
          audio,
          warnings,
          request: {
            body: JSON.stringify(requestBody)
          },
          response: {
            timestamp: currentDate,
            modelId: this.modelId,
            headers: responseHeaders,
            body: rawResponse
          },
          providerMetadata: {
            google: {
              sampleRate,
              mimeType: mimeType != null ? mimeType : null
            }
          }
        };
      }
    };
    KNOWN_DOC_EXTENSIONS = {
      pdf: "application/pdf",
      txt: "text/plain",
      md: "text/markdown",
      markdown: "text/markdown",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };
    BUILTIN_TOOL_CALL_TYPES = /* @__PURE__ */ new Set([
      "google_search_call",
      "code_execution_call",
      "url_context_call",
      "file_search_call",
      "google_maps_call",
      "mcp_server_tool_call"
    ]);
    BUILTIN_TOOL_RESULT_TYPES = /* @__PURE__ */ new Set([
      "google_search_result",
      "code_execution_result",
      "url_context_result",
      "file_search_result",
      "google_maps_result",
      "mcp_server_tool_result"
    ]);
    tokenByModalitySchema = () => z202.object({
      modality: z202.string().nullish(),
      tokens: z202.number().nullish()
    }).loose();
    usageSchema2 = () => z202.object({
      total_input_tokens: z202.number().nullish(),
      total_output_tokens: z202.number().nullish(),
      total_thought_tokens: z202.number().nullish(),
      total_cached_tokens: z202.number().nullish(),
      total_tool_use_tokens: z202.number().nullish(),
      total_tokens: z202.number().nullish(),
      input_tokens_by_modality: z202.array(tokenByModalitySchema()).nullish(),
      output_tokens_by_modality: z202.array(tokenByModalitySchema()).nullish(),
      cached_tokens_by_modality: z202.array(tokenByModalitySchema()).nullish(),
      tool_use_tokens_by_modality: z202.array(tokenByModalitySchema()).nullish(),
      grounding_tool_count: z202.array(
        z202.object({
          type: z202.string().nullish(),
          count: z202.number().nullish()
        }).loose()
      ).nullish()
    }).loose();
    interactionStatusSchema = () => z202.enum([
      "in_progress",
      "requires_action",
      "completed",
      "failed",
      "cancelled",
      "incomplete"
    ]);
    annotationSchema = () => {
      const urlCitation = z202.object({
        type: z202.literal("url_citation"),
        url: z202.string().nullish(),
        title: z202.string().nullish(),
        start_index: z202.number().nullish(),
        end_index: z202.number().nullish()
      }).loose();
      const fileCitation = z202.object({
        type: z202.literal("file_citation"),
        file_name: z202.string().nullish(),
        document_uri: z202.string().nullish(),
        url: z202.string().nullish(),
        page_number: z202.number().nullish(),
        media_id: z202.string().nullish(),
        start_index: z202.number().nullish(),
        end_index: z202.number().nullish(),
        custom_metadata: z202.record(z202.string(), z202.unknown()).nullish()
      }).loose();
      const placeCitation = z202.object({
        type: z202.literal("place_citation"),
        name: z202.string().nullish(),
        url: z202.string().nullish(),
        place_id: z202.string().nullish(),
        start_index: z202.number().nullish(),
        end_index: z202.number().nullish()
      }).loose();
      return z202.union([
        urlCitation,
        fileCitation,
        placeCitation,
        z202.object({ type: z202.string() }).loose()
      ]);
    };
    thoughtSummaryItemSchema = () => z202.object({
      type: z202.string(),
      text: z202.string().nullish(),
      data: z202.string().nullish(),
      mime_type: z202.string().nullish()
    }).loose();
    contentBlockSchema = () => {
      const textContent = z202.object({
        type: z202.literal("text"),
        text: z202.string(),
        annotations: z202.array(annotationSchema()).nullish()
      }).loose();
      const imageContent = z202.object({
        type: z202.literal("image"),
        data: z202.string().nullish(),
        mime_type: z202.string().nullish(),
        resolution: z202.enum(["low", "medium", "high", "ultra_high"]).nullish(),
        uri: z202.string().nullish()
      }).loose();
      return z202.union([
        textContent,
        imageContent,
        z202.object({ type: z202.string() }).loose()
      ]);
    };
    BUILTIN_TOOL_CALL_STEP_TYPES = [
      "google_search_call",
      "code_execution_call",
      "url_context_call",
      "file_search_call",
      "google_maps_call",
      "mcp_server_tool_call"
    ];
    BUILTIN_TOOL_RESULT_STEP_TYPES = [
      "google_search_result",
      "code_execution_result",
      "url_context_result",
      "file_search_result",
      "google_maps_result",
      "mcp_server_tool_result"
    ];
    stepSchema = () => {
      const userInputStep = z202.object({
        type: z202.literal("user_input"),
        content: z202.array(contentBlockSchema()).nullish()
      }).loose();
      const modelOutputStep = z202.object({
        type: z202.literal("model_output"),
        content: z202.array(contentBlockSchema()).nullish()
      }).loose();
      const functionCallStep = z202.object({
        type: z202.literal("function_call"),
        id: z202.string(),
        name: z202.string(),
        arguments: z202.record(z202.string(), z202.unknown()).nullish(),
        signature: z202.string().nullish()
      }).loose();
      const thoughtStep = z202.object({
        type: z202.literal("thought"),
        signature: z202.string().nullish(),
        summary: z202.array(thoughtSummaryItemSchema()).nullish()
      }).loose();
      const builtinToolCallStep = z202.object({
        type: z202.enum(BUILTIN_TOOL_CALL_STEP_TYPES),
        id: z202.string(),
        arguments: z202.record(z202.string(), z202.unknown()).nullish(),
        name: z202.string().nullish(),
        server_name: z202.string().nullish(),
        search_type: z202.string().nullish(),
        signature: z202.string().nullish()
      }).loose();
      const builtinToolResultStep = z202.object({
        type: z202.enum(BUILTIN_TOOL_RESULT_STEP_TYPES),
        call_id: z202.string(),
        result: z202.unknown().nullish(),
        is_error: z202.boolean().nullish(),
        name: z202.string().nullish(),
        server_name: z202.string().nullish(),
        signature: z202.string().nullish()
      }).loose();
      return z202.union([
        userInputStep,
        modelOutputStep,
        functionCallStep,
        thoughtStep,
        builtinToolCallStep,
        builtinToolResultStep,
        z202.object({ type: z202.string() }).loose()
      ]);
    };
    googleInteractionsResponseSchema = lazySchema(
      () => zodSchema(
        z202.object({
          /*
           * `id` is omitted from the response body when `store: false` (fully
           * stateless mode) — there is no server-side interaction record for the
           * client to reference. `nullish` lets the schema accept that shape.
           */
          id: z202.string().nullish(),
          created: z202.string().nullish(),
          updated: z202.string().nullish(),
          status: interactionStatusSchema(),
          model: z202.string().nullish(),
          agent: z202.string().nullish(),
          steps: z202.array(stepSchema()).nullish(),
          usage: usageSchema2().nullish(),
          service_tier: z202.string().nullish(),
          previous_interaction_id: z202.string().nullish(),
          response_modalities: z202.array(z202.string()).nullish()
        }).loose()
      )
    );
    googleInteractionsEventSchema = lazySchema(
      () => zodSchema(
        (() => {
          const status = interactionStatusSchema();
          const annotation = annotationSchema();
          const thoughtSummaryItem = thoughtSummaryItemSchema();
          const interactionCreatedEvent = z202.object({
            event_type: z202.literal("interaction.created"),
            event_id: z202.string().nullish(),
            interaction: z202.object({
              /*
               * `id` is omitted when `store: false` (fully stateless mode);
               * see the matching note on `googleInteractionsResponseSchema.id`.
               */
              id: z202.string().nullish(),
              created: z202.string().nullish(),
              model: z202.string().nullish(),
              agent: z202.string().nullish(),
              status: status.nullish()
            }).loose()
          }).loose();
          const stepStartEvent = z202.object({
            event_type: z202.literal("step.start"),
            event_id: z202.string().nullish(),
            index: z202.number(),
            step: stepSchema()
          }).loose();
          const stepDeltaText = z202.object({
            type: z202.literal("text"),
            text: z202.string()
          }).loose();
          const stepDeltaThoughtSummary = z202.object({
            type: z202.literal("thought_summary"),
            content: thoughtSummaryItem.nullish()
          }).loose();
          const stepDeltaThoughtSignature = z202.object({
            type: z202.literal("thought_signature"),
            signature: z202.string().nullish()
          }).loose();
          const stepDeltaArgumentsDelta = z202.object({
            type: z202.literal("arguments_delta"),
            arguments: z202.string().nullish(),
            id: z202.string().nullish(),
            signature: z202.string().nullish()
          }).loose();
          const stepDeltaTextAnnotation = z202.object({
            type: z202.enum(["text_annotation_delta", "text_annotation"]),
            annotations: z202.array(annotation).nullish()
          }).loose();
          const stepDeltaImage = z202.object({
            type: z202.literal("image"),
            data: z202.string().nullish(),
            mime_type: z202.string().nullish(),
            resolution: z202.enum(["low", "medium", "high", "ultra_high"]).nullish(),
            uri: z202.string().nullish()
          }).loose();
          const stepDeltaBuiltinToolCall = z202.object({
            type: z202.enum(BUILTIN_TOOL_CALL_STEP_TYPES),
            id: z202.string().nullish(),
            arguments: z202.record(z202.string(), z202.unknown()).nullish(),
            name: z202.string().nullish(),
            server_name: z202.string().nullish(),
            search_type: z202.string().nullish(),
            signature: z202.string().nullish()
          }).loose();
          const stepDeltaBuiltinToolResult = z202.object({
            type: z202.enum(BUILTIN_TOOL_RESULT_STEP_TYPES),
            call_id: z202.string().nullish(),
            result: z202.unknown().nullish(),
            is_error: z202.boolean().nullish(),
            name: z202.string().nullish(),
            server_name: z202.string().nullish(),
            signature: z202.string().nullish()
          }).loose();
          const stepDeltaUnknown = z202.object({ type: z202.string() }).loose();
          const stepDeltaUnion = z202.union([
            stepDeltaText,
            stepDeltaImage,
            stepDeltaThoughtSummary,
            stepDeltaThoughtSignature,
            stepDeltaArgumentsDelta,
            stepDeltaTextAnnotation,
            stepDeltaBuiltinToolCall,
            stepDeltaBuiltinToolResult,
            stepDeltaUnknown
          ]);
          const stepDeltaEvent = z202.object({
            event_type: z202.literal("step.delta"),
            event_id: z202.string().nullish(),
            index: z202.number(),
            delta: stepDeltaUnion
          }).loose();
          const stepStopEvent = z202.object({
            event_type: z202.literal("step.stop"),
            event_id: z202.string().nullish(),
            index: z202.number()
          }).loose();
          const interactionStatusUpdateEvent = z202.object({
            event_type: z202.literal("interaction.status_update"),
            event_id: z202.string().nullish(),
            interaction_id: z202.string().nullish(),
            status: status.nullish()
          }).loose();
          const interactionInProgressEvent = z202.object({
            event_type: z202.literal("interaction.in_progress"),
            event_id: z202.string().nullish(),
            interaction_id: z202.string().nullish(),
            status: status.nullish()
          }).loose();
          const interactionRequiresActionEvent = z202.object({
            event_type: z202.literal("interaction.requires_action"),
            event_id: z202.string().nullish(),
            interaction_id: z202.string().nullish(),
            status: status.nullish()
          }).loose();
          const interactionCompletedEvent = z202.object({
            event_type: z202.literal("interaction.completed"),
            event_id: z202.string().nullish(),
            interaction: z202.object({
              id: z202.string().nullish(),
              status: status.nullish(),
              usage: usageSchema2().nullish(),
              service_tier: z202.string().nullish()
            }).loose()
          }).loose();
          const errorEvent = z202.object({
            event_type: z202.literal("error"),
            event_id: z202.string().nullish(),
            error: z202.object({
              code: z202.string().nullish(),
              message: z202.string().nullish()
            }).loose().nullish()
          }).loose();
          const unknownEvent = z202.object({ event_type: z202.string() }).loose();
          return z202.union([
            interactionCreatedEvent,
            stepStartEvent,
            stepDeltaEvent,
            stepStopEvent,
            interactionStatusUpdateEvent,
            interactionInProgressEvent,
            interactionRequiresActionEvent,
            interactionCompletedEvent,
            errorEvent,
            unknownEvent
          ]);
        })()
      )
    );
    googleInteractionsLanguageModelOptions = lazySchema(
      () => zodSchema(
        z212.object({
          previousInteractionId: z212.string().nullish(),
          store: z212.boolean().nullish(),
          agent: z212.string().nullish(),
          agentConfig: z212.union([
            z212.object({
              type: z212.literal("dynamic")
            }).loose(),
            z212.object({
              type: z212.literal("deep-research"),
              thinkingSummaries: z212.enum(["auto", "none"]).nullish(),
              visualization: z212.enum(["off", "auto"]).nullish(),
              collaborativePlanning: z212.boolean().nullish()
            })
          ]).nullish(),
          thinkingLevel: z212.enum(["minimal", "low", "medium", "high"]).nullish(),
          thinkingSummaries: z212.enum(["auto", "none"]).nullish(),
          /**
           * Output-format entries that map directly to the API's `response_format`
           * array. Use this to request image, audio, or non-JSON text outputs
           * with full control over `mime_type`, `aspect_ratio`, and `image_size`.
           *
           * Entries are sent in order. The AI SDK call-level `responseFormat: {
           * type: 'json', schema }` still drives JSON-mode and adds a matching
           * text entry automatically; entries listed here are appended.
           */
          responseFormat: z212.array(
            z212.union([
              z212.object({
                type: z212.literal("text"),
                mimeType: z212.string().nullish(),
                schema: z212.unknown().nullish()
              }).loose(),
              z212.object({
                type: z212.literal("image"),
                mimeType: z212.string().nullish(),
                aspectRatio: z212.enum([
                  "1:1",
                  "2:3",
                  "3:2",
                  "3:4",
                  "4:3",
                  "4:5",
                  "5:4",
                  "9:16",
                  "16:9",
                  "21:9",
                  "1:8",
                  "8:1",
                  "1:4",
                  "4:1"
                ]).nullish(),
                imageSize: z212.enum(["1K", "2K", "4K", "512"]).nullish()
              }).loose(),
              z212.object({
                type: z212.literal("audio"),
                mimeType: z212.string().nullish()
              }).loose()
            ])
          ).nullish(),
          /**
           * @deprecated Use `responseFormat` with a `{ type: 'image', ... }`
           * entry instead. Retained for backwards compatibility; the SDK
           * translates it into a matching `response_format` image entry and
           * emits a warning when set.
           */
          imageConfig: z212.object({
            aspectRatio: z212.enum([
              "1:1",
              "2:3",
              "3:2",
              "3:4",
              "4:3",
              "4:5",
              "5:4",
              "9:16",
              "16:9",
              "21:9",
              "1:8",
              "8:1",
              "1:4",
              "4:1"
            ]).nullish(),
            imageSize: z212.enum(["1K", "2K", "4K", "512"]).nullish()
          }).nullish(),
          mediaResolution: z212.enum(["low", "medium", "high", "ultra_high"]).nullish(),
          responseModalities: z212.array(z212.enum(["text", "image", "audio", "video", "document"])).nullish(),
          serviceTier: z212.enum(["flex", "standard", "priority"]).nullish(),
          /**
           * Alternative to AI SDK `system` message. If both are set, the AI SDK
           * `system` message wins and a warning is emitted.
           */
          systemInstruction: z212.string().nullish(),
          /**
           * Per-block signature for round-tripping `thought.signature` and
           * `function_call.signature` blocks. Set by the SDK on output reasoning /
           * tool-call parts; passed back unchanged on input parts so the API
           * accepts the prior turn.
           */
          signature: z212.string().nullish(),
          /**
           * Set by the SDK on output assistant messages. The converter uses it to
           * decide which messages to drop when compacting under
           * `previousInteractionId`.
           */
          interactionId: z212.string().nullish(),
          /**
           * Maximum time, in milliseconds, to poll a background interaction (agent
           * call) before giving up. Defaults to 30 minutes. Long-running agents
           * such as deep research can take tens of minutes — increase if needed.
           */
          pollingTimeoutMs: z212.number().int().positive().nullish(),
          /**
           * Run the interaction in the background. Required for agents whose
           * server-side workflow cannot complete within a single request/response.
           * When `true`, the POST returns with a non-terminal status and the SDK
           * polls `GET /interactions/{id}` until the work completes. Some agents
           * reject `true`; see the agent's documentation for which mode it
           * requires.
           */
          background: z212.boolean().nullish(),
          /**
           * Environment configuration for the agent sandbox. Only applies to agent
           * calls (`google.interactions({ agent })`); ignored on model-id calls.
           *
           *   - `"remote"`: provision a fresh sandbox for this call.
           *   - any other string: an existing `environment_id` to reuse.
           *   - object: provision a fresh sandbox and optionally preload `sources`
           *     and/or constrain outbound traffic via `network`.
           */
          environment: z212.union([
            z212.string(),
            z212.object({
              type: z212.literal("remote"),
              sources: z212.array(
                z212.union([
                  z212.object({
                    type: z212.literal("gcs"),
                    source: z212.string(),
                    target: z212.string().nullish()
                  }),
                  z212.object({
                    type: z212.literal("repository"),
                    source: z212.string(),
                    target: z212.string().nullish()
                  }),
                  z212.object({
                    type: z212.literal("inline"),
                    content: z212.string(),
                    target: z212.string()
                  })
                ])
              ).nullish(),
              network: z212.union([
                z212.literal("disabled"),
                z212.object({
                  allowlist: z212.array(
                    z212.object({
                      domain: z212.string(),
                      transform: z212.array(z212.record(z212.string(), z212.string())).nullish()
                    })
                  )
                })
              ]).nullish()
            })
          ]).nullish()
        })
      )
    );
    BUILTIN_TOOL_CALL_TYPES2 = /* @__PURE__ */ new Set([
      "google_search_call",
      "code_execution_call",
      "url_context_call",
      "file_search_call",
      "google_maps_call",
      "mcp_server_tool_call"
    ]);
    BUILTIN_TOOL_RESULT_TYPES2 = /* @__PURE__ */ new Set([
      "google_search_result",
      "code_execution_result",
      "url_context_result",
      "file_search_result",
      "google_maps_result",
      "mcp_server_tool_result"
    ]);
    getOriginalFetch3 = () => globalThis.fetch;
    TERMINAL_STATUSES = /* @__PURE__ */ new Set(["completed", "failed", "cancelled", "incomplete"]);
    DEFAULT_INITIAL_DELAY_MS = 1e3;
    DEFAULT_MAX_DELAY_MS = 1e4;
    DEFAULT_TIMEOUT_MS = 30 * 60 * 1e3;
    DEFAULT_MAX_RETRIES = 3;
    DEFAULT_RETRY_DELAY_MS = 500;
    GoogleInteractionsLanguageModel = class _GoogleInteractionsLanguageModel {
      constructor(modelOrAgent, config) {
        this.specificationVersion = "v4";
        if (typeof modelOrAgent === "string") {
          this.modelId = modelOrAgent;
          this.agent = void 0;
        } else if ("managedAgent" in modelOrAgent) {
          this.modelId = modelOrAgent.managedAgent;
          this.agent = modelOrAgent.managedAgent;
        } else {
          this.modelId = modelOrAgent.agent;
          this.agent = modelOrAgent.agent;
        }
        this.config = config;
      }
      static [WORKFLOW_SERIALIZE](model) {
        return {
          ...serializeModelOptions({
            modelId: model.modelId,
            config: model.config
          }),
          agent: model.agent
        };
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _GoogleInteractionsLanguageModel(
          options.agent != null ? { agent: options.agent } : options.modelId,
          options.config
        );
      }
      get provider() {
        return this.config.provider;
      }
      get supportedUrls() {
        if (this.config.supportedUrls) {
          return this.config.supportedUrls();
        }
        return {
          "image/*": [/^https?:\/\/.+/],
          "application/pdf": [/^https?:\/\/.+/],
          "audio/*": [/^https?:\/\/.+/],
          "video/*": [
            /^https?:\/\/(www\.)?youtube\.com\/watch\?v=.+/,
            /^https?:\/\/youtu\.be\/.+/,
            /^gs:\/\/.+/
          ]
        };
      }
      async getArgs(options) {
        var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
        const warnings = [];
        const googleOptions = await parseProviderOptions({
          provider: "google",
          providerOptions: options.providerOptions,
          schema: googleInteractionsLanguageModelOptions
        });
        const isAgent = this.agent != null;
        const hasTools = options.tools != null && options.tools.length > 0;
        let toolsForBody;
        let toolChoiceForBody;
        if (hasTools && isAgent) {
          warnings.push({
            type: "other",
            message: "google.interactions: tools are not supported when an agent is set; tools will be omitted from the request body."
          });
        } else if (hasTools) {
          const prepared = prepareGoogleInteractionsTools({
            tools: options.tools,
            toolChoice: options.toolChoice
          });
          toolsForBody = prepared.tools;
          toolChoiceForBody = prepared.toolChoice;
          warnings.push(...prepared.toolWarnings);
        }
        const responseFormatEntries = [];
        if (((_a2 = options.responseFormat) == null ? void 0 : _a2.type) === "json") {
          if (isAgent) {
            warnings.push({
              type: "other",
              message: "google.interactions: structured output (responseFormat) is not supported when an agent is set; responseFormat will be ignored."
            });
          } else {
            const entry = {
              type: "text",
              mime_type: "application/json",
              ...options.responseFormat.schema != null ? { schema: options.responseFormat.schema } : {}
            };
            responseFormatEntries.push(entry);
          }
        }
        if ((googleOptions == null ? void 0 : googleOptions.responseFormat) != null) {
          for (const entry of googleOptions.responseFormat) {
            if (entry.type === "text") {
              responseFormatEntries.push(
                pruneUndefined({
                  type: "text",
                  mime_type: (_b2 = entry.mimeType) != null ? _b2 : void 0,
                  schema: (_c = entry.schema) != null ? _c : void 0
                })
              );
            } else if (entry.type === "image") {
              responseFormatEntries.push(
                pruneUndefined({
                  type: "image",
                  mime_type: (_d = entry.mimeType) != null ? _d : void 0,
                  aspect_ratio: (_e = entry.aspectRatio) != null ? _e : void 0,
                  image_size: (_f = entry.imageSize) != null ? _f : void 0
                })
              );
            } else if (entry.type === "audio") {
              responseFormatEntries.push(
                pruneUndefined({
                  type: "audio",
                  mime_type: (_g = entry.mimeType) != null ? _g : void 0
                })
              );
            }
          }
        }
        const {
          input,
          systemInstruction: convertedSystemInstruction,
          warnings: convWarnings
        } = convertToGoogleInteractionsInput({
          prompt: options.prompt,
          previousInteractionId: (_h = googleOptions == null ? void 0 : googleOptions.previousInteractionId) != null ? _h : void 0,
          store: (_i = googleOptions == null ? void 0 : googleOptions.store) != null ? _i : void 0,
          mediaResolution: (_j = googleOptions == null ? void 0 : googleOptions.mediaResolution) != null ? _j : void 0
        });
        warnings.push(...convWarnings);
        let systemInstruction = convertedSystemInstruction;
        const optionSystemInstruction = (_k = googleOptions == null ? void 0 : googleOptions.systemInstruction) != null ? _k : void 0;
        if (systemInstruction != null && optionSystemInstruction != null) {
          warnings.push({
            type: "other",
            message: "google.interactions: both AI SDK system message and providerOptions.google.systemInstruction were set; using the AI SDK system message."
          });
        } else if (systemInstruction == null && optionSystemInstruction != null) {
          systemInstruction = optionSystemInstruction;
        }
        let generationConfig;
        if (isAgent) {
          const droppedFields = [];
          if (options.temperature != null) droppedFields.push("temperature");
          if (options.topP != null) droppedFields.push("topP");
          if (options.seed != null) droppedFields.push("seed");
          if (options.stopSequences != null && options.stopSequences.length > 0) {
            droppedFields.push("stopSequences");
          }
          if (options.maxOutputTokens != null)
            droppedFields.push("maxOutputTokens");
          if ((googleOptions == null ? void 0 : googleOptions.thinkingLevel) != null)
            droppedFields.push("thinkingLevel");
          if ((googleOptions == null ? void 0 : googleOptions.thinkingSummaries) != null) {
            droppedFields.push("thinkingSummaries");
          }
          if ((googleOptions == null ? void 0 : googleOptions.imageConfig) != null) droppedFields.push("imageConfig");
          if (droppedFields.length > 0) {
            warnings.push({
              type: "other",
              message: `google.interactions: ${droppedFields.join(", ")} ${droppedFields.length === 1 ? "is" : "are"} not supported when an agent is set; use providerOptions.google.agentConfig instead. Dropped from the request body.`
            });
          }
          generationConfig = void 0;
        } else {
          generationConfig = pruneUndefined({
            temperature: (_l = options.temperature) != null ? _l : void 0,
            top_p: (_m = options.topP) != null ? _m : void 0,
            seed: (_n = options.seed) != null ? _n : void 0,
            stop_sequences: options.stopSequences != null && options.stopSequences.length > 0 ? options.stopSequences : void 0,
            max_output_tokens: (_o = options.maxOutputTokens) != null ? _o : void 0,
            thinking_level: (_p = googleOptions == null ? void 0 : googleOptions.thinkingLevel) != null ? _p : void 0,
            thinking_summaries: (_q = googleOptions == null ? void 0 : googleOptions.thinkingSummaries) != null ? _q : void 0,
            tool_choice: toolChoiceForBody
          });
          if ((googleOptions == null ? void 0 : googleOptions.imageConfig) != null) {
            const alreadyHasImageEntry = responseFormatEntries.some(
              (entry) => entry.type === "image"
            );
            warnings.push({
              type: "other",
              message: alreadyHasImageEntry ? "google.interactions: providerOptions.google.imageConfig is deprecated and was ignored because providerOptions.google.responseFormat already supplies an image entry. Use responseFormat exclusively." : 'google.interactions: providerOptions.google.imageConfig is deprecated. Use providerOptions.google.responseFormat with a { type: "image", ... } entry instead.'
            });
            if (!alreadyHasImageEntry) {
              responseFormatEntries.push({
                type: "image",
                mime_type: "image/png",
                ...googleOptions.imageConfig.aspectRatio != null ? { aspect_ratio: googleOptions.imageConfig.aspectRatio } : {},
                ...googleOptions.imageConfig.imageSize != null ? { image_size: googleOptions.imageConfig.imageSize } : {}
              });
            }
          }
        }
        let agentConfig;
        if (isAgent && (googleOptions == null ? void 0 : googleOptions.agentConfig) != null) {
          const agentConfigOptions = googleOptions.agentConfig;
          if (agentConfigOptions.type === "deep-research") {
            agentConfig = pruneUndefined({
              type: "deep-research",
              thinking_summaries: (_r = agentConfigOptions.thinkingSummaries) != null ? _r : void 0,
              visualization: (_s = agentConfigOptions.visualization) != null ? _s : void 0,
              collaborative_planning: (_t = agentConfigOptions.collaborativePlanning) != null ? _t : void 0
            });
          } else if (agentConfigOptions.type === "dynamic") {
            agentConfig = { type: "dynamic" };
          }
        }
        let environment;
        if ((googleOptions == null ? void 0 : googleOptions.environment) != null) {
          if (!isAgent) {
            warnings.push({
              type: "other",
              message: "google.interactions: environment is only supported when an agent is set; environment will be omitted from the request body."
            });
          } else if (typeof googleOptions.environment === "string") {
            environment = googleOptions.environment;
          } else {
            const environmentOptions = googleOptions.environment;
            const sources = (_u = environmentOptions.sources) == null ? void 0 : _u.map((source) => {
              var _a22;
              if (source.type === "inline") {
                return {
                  type: "inline",
                  content: source.content,
                  target: source.target
                };
              }
              return pruneUndefined({
                type: source.type,
                source: source.source,
                target: (_a22 = source.target) != null ? _a22 : void 0
              });
            });
            let network;
            if (environmentOptions.network === "disabled") {
              network = "disabled";
            } else if (environmentOptions.network != null) {
              network = {
                allowlist: environmentOptions.network.allowlist.map(
                  (entry) => {
                    var _a22;
                    return pruneUndefined({
                      domain: entry.domain,
                      transform: (_a22 = entry.transform) != null ? _a22 : void 0
                    });
                  }
                )
              };
            }
            environment = pruneUndefined({
              type: "remote",
              sources: sources != null && sources.length > 0 ? sources : void 0,
              network
            });
          }
        }
        const args = pruneUndefined({
          ...isAgent ? { agent: this.agent } : { model: this.modelId },
          input,
          system_instruction: systemInstruction,
          tools: toolsForBody,
          response_format: responseFormatEntries.length > 0 ? responseFormatEntries : void 0,
          response_modalities: (googleOptions == null ? void 0 : googleOptions.responseModalities) != null ? googleOptions.responseModalities : void 0,
          previous_interaction_id: (_v = googleOptions == null ? void 0 : googleOptions.previousInteractionId) != null ? _v : void 0,
          service_tier: (_w = googleOptions == null ? void 0 : googleOptions.serviceTier) != null ? _w : void 0,
          store: (_x = googleOptions == null ? void 0 : googleOptions.store) != null ? _x : void 0,
          generation_config: generationConfig != null && Object.keys(generationConfig).length > 0 ? generationConfig : void 0,
          agent_config: agentConfig,
          environment,
          background: (_y = googleOptions == null ? void 0 : googleOptions.background) != null ? _y : void 0
        });
        return {
          args,
          warnings,
          isAgent,
          isBackground: (googleOptions == null ? void 0 : googleOptions.background) === true,
          pollingTimeoutMs: (_z = googleOptions == null ? void 0 : googleOptions.pollingTimeoutMs) != null ? _z : void 0
        };
      }
      async doGenerate(options) {
        var _a2, _b2, _c, _d, _e, _f;
        const { args, warnings, isAgent, pollingTimeoutMs } = await this.getArgs(options);
        const url = `${this.config.baseURL}/interactions`;
        const mergedHeaders = combineHeaders(
          this.config.headers ? await resolve(this.config.headers) : void 0,
          options.headers
        );
        const postResult = await postJsonToApi({
          url,
          headers: mergedHeaders,
          body: args,
          failedResponseHandler: googleFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            googleInteractionsResponseSchema
          ),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        let {
          responseHeaders,
          value: response,
          rawValue: rawResponse
        } = postResult;
        if (isAgent && !isTerminalStatus(response.status)) {
          const polled = await pollGoogleInteractionUntilTerminal({
            baseURL: this.config.baseURL,
            interactionId: response.id,
            headers: mergedHeaders,
            fetch: this.config.fetch,
            abortSignal: options.abortSignal,
            timeoutMs: pollingTimeoutMs
          });
          response = polled.response;
          rawResponse = polled.rawResponse;
          responseHeaders = (_a2 = polled.responseHeaders) != null ? _a2 : responseHeaders;
        }
        const interactionId = typeof response.id === "string" && response.id.length > 0 ? response.id : void 0;
        const { content, hasFunctionCall } = parseGoogleInteractionsOutputs({
          steps: (_b2 = response.steps) != null ? _b2 : null,
          generateId: (_c = this.config.generateId) != null ? _c : generateId,
          interactionId
        });
        const finishReason = {
          unified: mapGoogleInteractionsFinishReason({
            status: response.status,
            hasFunctionCall
          }),
          raw: response.status
        };
        const serviceTier = (_e = (_d = response.service_tier) != null ? _d : responseHeaders == null ? void 0 : responseHeaders["x-gemini-service-tier"]) != null ? _e : void 0;
        const providerMetadata = {
          google: {
            ...interactionId != null ? { interactionId } : {},
            ...serviceTier != null ? { serviceTier } : {}
          }
        };
        let timestamp;
        if (typeof response.created === "string") {
          const parsed = new Date(response.created);
          if (!Number.isNaN(parsed.getTime())) {
            timestamp = parsed;
          }
        }
        return {
          content,
          finishReason,
          usage: convertGoogleInteractionsUsage(response.usage),
          warnings,
          providerMetadata,
          request: { body: args },
          response: {
            headers: responseHeaders,
            body: rawResponse,
            ...interactionId != null ? { id: interactionId } : {},
            ...timestamp ? { timestamp } : {},
            modelId: (_f = response.model) != null ? _f : void 0
          }
        };
      }
      async doStream(options) {
        var _a2;
        const { args, warnings, isBackground, pollingTimeoutMs } = await this.getArgs(options);
        const url = `${this.config.baseURL}/interactions`;
        const mergedHeaders = combineHeaders(
          this.config.headers ? await resolve(this.config.headers) : void 0,
          options.headers
        );
        if (isBackground) {
          return this.doStreamBackground({
            args,
            warnings,
            url,
            mergedHeaders,
            options,
            pollingTimeoutMs
          });
        }
        const body = { ...args, stream: true };
        const { responseHeaders, value: response } = await postJsonToApi({
          url,
          headers: mergedHeaders,
          body,
          failedResponseHandler: googleFailedResponseHandler,
          successfulResponseHandler: createEventSourceResponseHandler(
            googleInteractionsEventSchema
          ),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        const headerServiceTier = responseHeaders == null ? void 0 : responseHeaders["x-gemini-service-tier"];
        const transform = buildGoogleInteractionsStreamTransform({
          warnings,
          generateId: (_a2 = this.config.generateId) != null ? _a2 : generateId,
          includeRawChunks: options.includeRawChunks,
          serviceTier: headerServiceTier
        });
        return {
          stream: response.pipeThrough(transform),
          request: { body },
          response: { headers: responseHeaders }
        };
      }
      /*
       * Drive the streaming surface for agent calls. Agents require
       * `background: true`, which is incompatible with `stream: true` on POST.
       *
       * Approach:
       *   1. POST `/interactions` with `background: true`. The response includes
       *      the interaction id and an initial (usually non-terminal) status.
       *   2. If the POST status is already terminal (rare), synthesize a stream
       *      from the polled outputs and we're done.
       *   3. Otherwise open `GET /interactions/{id}?stream=true` and pipe the
       *      SSE events through `buildGoogleInteractionsStreamTransform` so the
       *      consumer receives text deltas / thinking summaries / tool events as
       *      they happen instead of all at once at the end.
       *
       * The SSE connection can drop while the agent idles between events
       * (`UND_ERR_BODY_TIMEOUT`); `streamGoogleInteractionEvents` handles the
       * reconnect-with-`last_event_id` loop transparently.
       */
      async doStreamBackground({
        args,
        warnings,
        url,
        mergedHeaders,
        options,
        pollingTimeoutMs
      }) {
        var _a2, _b2;
        const postResult = await postJsonToApi({
          url,
          headers: mergedHeaders,
          body: args,
          failedResponseHandler: googleFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            googleInteractionsResponseSchema
          ),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        const { responseHeaders: postHeaders, value: postResponse } = postResult;
        const interactionId = postResponse.id;
        if (interactionId == null || interactionId.length === 0) {
          throw new Error(
            "google.interactions: background POST response did not include an interaction id; cannot stream the result."
          );
        }
        const headerServiceTier = postHeaders == null ? void 0 : postHeaders["x-gemini-service-tier"];
        if (isTerminalStatus(postResponse.status)) {
          const synthesized = synthesizeGoogleInteractionsAgentStream({
            response: postResponse,
            warnings,
            generateId: (_a2 = this.config.generateId) != null ? _a2 : generateId,
            includeRawChunks: options.includeRawChunks,
            headerServiceTier
          });
          return {
            stream: synthesized,
            request: { body: args },
            response: { headers: postHeaders }
          };
        }
        void pollingTimeoutMs;
        const events = streamGoogleInteractionEvents({
          baseURL: this.config.baseURL,
          interactionId,
          headers: mergedHeaders,
          fetch: this.config.fetch,
          abortSignal: options.abortSignal
        });
        const transform = buildGoogleInteractionsStreamTransform({
          warnings,
          generateId: (_b2 = this.config.generateId) != null ? _b2 : generateId,
          includeRawChunks: options.includeRawChunks,
          serviceTier: headerServiceTier
        });
        return {
          stream: events.pipeThrough(transform),
          request: { body: args },
          response: { headers: postHeaders }
        };
      }
    };
    GoogleRealtimeEventMapper = class {
      constructor() {
        this.turnCounter = 0;
        this.hasAudio = false;
        this.hasText = false;
        this.hasTranscript = false;
        this.turnClosed = false;
        this.inputAudioRate = 16e3;
      }
      get responseId() {
        return `google-resp-${this.turnCounter}`;
      }
      get itemId() {
        return `google-item-${this.turnCounter}`;
      }
      /**
       * Rolls over to the next turn lazily, only once new model content actually
       * arrives. `turnComplete` merely marks the current turn closed; the counter
       * is not advanced until the next response begins. This keeps a transcript
       * that arrives shortly after `turnComplete` attached to the turn it belongs
       * to, since Google delivers transcription independently with no guaranteed
       * ordering relative to `turnComplete`.
       */
      beginTurnIfClosed() {
        if (!this.turnClosed) return;
        this.turnCounter++;
        this.hasAudio = false;
        this.hasText = false;
        this.hasTranscript = false;
        this.turnClosed = false;
      }
      parseServerEvent(raw) {
        var _a2, _b2;
        const data = raw;
        if (data.setupComplete != null) {
          return { type: "session-created", raw };
        }
        if (data.toolCall != null) {
          this.beginTurnIfClosed();
          const functionCalls = (_a2 = data.toolCall.functionCalls) != null ? _a2 : [];
          return functionCalls.flatMap((functionCall) => {
            var _a22;
            const args = JSON.stringify((_a22 = functionCall.args) != null ? _a22 : {});
            return [
              {
                type: "function-call-arguments-delta",
                responseId: this.responseId,
                itemId: this.itemId,
                callId: functionCall.id,
                delta: args,
                raw
              },
              {
                type: "function-call-arguments-done",
                responseId: this.responseId,
                itemId: this.itemId,
                callId: functionCall.id,
                name: functionCall.name,
                arguments: args,
                raw
              }
            ];
          });
        }
        if (data.toolCallCancellation != null) {
          return {
            type: "custom",
            rawType: "toolCallCancellation",
            raw
          };
        }
        if (data.serverContent != null) {
          return this.parseServerContent(data.serverContent, raw);
        }
        if (((_b2 = data.inputTranscription) == null ? void 0 : _b2.text) != null) {
          return {
            type: "input-transcription-completed",
            itemId: `google-input-${this.turnCounter}`,
            transcript: data.inputTranscription.text,
            raw
          };
        }
        return { type: "custom", rawType: String(Object.keys(data)[0]), raw };
      }
      parseServerContent(serverContent, raw) {
        var _a2, _b2, _c, _d;
        const events = [];
        if (serverContent.interrupted) {
          events.push({
            type: "speech-started",
            raw
          });
        }
        if ((_a2 = serverContent.modelTurn) == null ? void 0 : _a2.parts) {
          this.beginTurnIfClosed();
          for (const part of serverContent.modelTurn.parts) {
            if ((_b2 = part.inlineData) == null ? void 0 : _b2.data) {
              this.hasAudio = true;
              events.push({
                type: "audio-delta",
                responseId: this.responseId,
                itemId: this.itemId,
                delta: part.inlineData.data,
                raw
              });
            }
            if (part.text) {
              this.hasText = true;
              events.push({
                type: "text-delta",
                responseId: this.responseId,
                itemId: this.itemId,
                delta: part.text,
                raw
              });
            }
          }
        }
        if ((_c = serverContent.outputTranscription) == null ? void 0 : _c.text) {
          this.hasTranscript = true;
          events.push({
            type: "audio-transcript-delta",
            responseId: this.responseId,
            itemId: this.itemId,
            delta: serverContent.outputTranscription.text,
            raw
          });
        }
        if ((_d = serverContent.inputTranscription) == null ? void 0 : _d.text) {
          events.push({
            type: "input-transcription-completed",
            itemId: `google-input-${this.turnCounter}`,
            transcript: serverContent.inputTranscription.text,
            raw
          });
        }
        if (serverContent.turnComplete) {
          if (this.hasAudio) {
            events.push({
              type: "audio-done",
              responseId: this.responseId,
              itemId: this.itemId,
              raw
            });
          }
          if (this.hasText) {
            events.push({
              type: "text-done",
              responseId: this.responseId,
              itemId: this.itemId,
              raw
            });
          }
          if (this.hasTranscript) {
            events.push({
              type: "audio-transcript-done",
              responseId: this.responseId,
              itemId: this.itemId,
              raw
            });
          }
          events.push({
            type: "response-done",
            responseId: this.responseId,
            status: "completed",
            raw
          });
          this.turnClosed = true;
        }
        if (events.length === 0) {
          return { type: "custom", rawType: "serverContent", raw };
        }
        return events.length === 1 ? events[0] : events;
      }
      serializeClientEvent(event, modelId) {
        var _a2;
        switch (event.type) {
          case "session-update":
            if (((_a2 = event.config.inputAudioFormat) == null ? void 0 : _a2.rate) != null) {
              this.inputAudioRate = event.config.inputAudioFormat.rate;
            }
            return {
              setup: buildGoogleSessionConfig(event.config, modelId)
            };
          case "input-audio-append":
            return {
              realtimeInput: {
                audio: {
                  data: event.audio,
                  mimeType: `audio/pcm;rate=${this.inputAudioRate}`
                }
              }
            };
          case "input-audio-commit":
            return {
              realtimeInput: {
                audioStreamEnd: true
              }
            };
          case "input-audio-clear":
          case "response-create":
          case "response-cancel":
          case "conversation-item-truncate":
            return null;
          case "conversation-item-create": {
            const item = event.item;
            switch (item.type) {
              case "text-message":
                return {
                  realtimeInput: {
                    text: item.text
                  }
                };
              case "function-call-output":
                return serializeFunctionCallOutput(item);
              case "audio-message":
                return null;
            }
            break;
          }
        }
        return null;
      }
    };
    realtimeWebSocketPath = "google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";
    GoogleRealtimeModel = class {
      constructor(modelId, config) {
        this.specificationVersion = "v4";
        this.mapper = new GoogleRealtimeEventMapper();
        this.modelId = modelId;
        this.provider = config.provider;
        this.config = config;
      }
      async doCreateClientSecret(options) {
        var _a2, _b2;
        const fetchFn = (_a2 = this.config.fetch) != null ? _a2 : fetch;
        const headers = this.config.headers();
        const apiKey = headers["x-goog-api-key"];
        if (!apiKey) {
          throw new Error(
            "Google Generative AI API key is required for realtime token creation."
          );
        }
        const now = Date.now();
        const openWindowMs = ((_b2 = options.expiresAfterSeconds) != null ? _b2 : 60) * 1e3;
        const newSessionExpireTime = new Date(now + openWindowMs).toISOString();
        const expireTime = new Date(
          now + openWindowMs + 30 * 60 * 1e3
        ).toISOString();
        const setupPayload = buildGoogleSessionConfig(
          options.sessionConfig,
          this.modelId
        );
        const response = await fetchFn(
          `${getAuthTokensURL(this.config.baseURL)}?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // `uses: 0` means no limit is applied to how many times the token can
              // start a session (per the AuthToken spec). An unset value would
              // default to 1, which breaks WebSocket reconnects within the session.
              uses: 0,
              expireTime,
              newSessionExpireTime,
              bidiGenerateContentSetup: setupPayload
            })
          }
        );
        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Google realtime auth token request failed: ${response.status} ${text}`
          );
        }
        const data = await response.json();
        return {
          token: data.name,
          url: getWebSocketURL(this.config.baseURL),
          expiresAt: data.expireTime ? Math.floor(new Date(data.expireTime).getTime() / 1e3) : void 0
        };
      }
      getWebSocketConfig(options) {
        return {
          url: `${options.url}?access_token=${encodeURIComponent(options.token)}`
        };
      }
      parseServerEvent(raw) {
        return this.mapper.parseServerEvent(raw);
      }
      serializeClientEvent(event) {
        return this.mapper.serializeClientEvent(event, this.modelId);
      }
      buildSessionConfig(config) {
        return buildGoogleSessionConfig(config, this.modelId);
      }
    };
    google = createGoogle();
  }
});

// node_modules/@ai-sdk/anthropic/dist/index.js
var dist_exports3 = {};
__export(dist_exports3, {
  VERSION: () => VERSION4,
  anthropic: () => anthropic,
  createAnthropic: () => createAnthropic,
  forwardAnthropicContainerIdFromLastStep: () => forwardAnthropicContainerIdFromLastStep
});
import {
  InvalidArgumentError as InvalidArgumentError3,
  NoSuchModelError
} from "@ai-sdk/provider";
import { z as z211 } from "zod/v4";
import { z as z31 } from "zod/v4";
import {
  APICallError as APICallError6
} from "@ai-sdk/provider";
import { z as z33 } from "zod/v4";
import { z as z44 } from "zod/v4";
import {
  UnsupportedFunctionalityError as UnsupportedFunctionalityError7
} from "@ai-sdk/provider";
import { z as z53 } from "zod/v4";
import { z as z63 } from "zod/v4";
import { z as z73 } from "zod/v4";
import { z as z83 } from "zod/v4";
import { z as z93 } from "zod/v4";
import { z as z103 } from "zod/v4";
import {
  UnsupportedFunctionalityError as UnsupportedFunctionalityError24
} from "@ai-sdk/provider";
import { z as z113 } from "zod/v4";
import { z as z123 } from "zod/v4";
import { z as z133 } from "zod/v4";
import { z as z143 } from "zod/v4";
import { z as z153 } from "zod/v4";
import { z as z163 } from "zod/v4";
import { z as z173 } from "zod/v4";
import { z as z183 } from "zod/v4";
import { z as z193 } from "zod/v4";
import { z as z203 } from "zod/v4";
import { z as z213 } from "zod/v4";
import { z as z223 } from "zod/v4";
import { z as z232 } from "zod/v4";
import { z as z242 } from "zod/v4";
import { z as z252 } from "zod/v4";
function getCacheControl(providerMetadata) {
  var _a2;
  const anthropic2 = providerMetadata == null ? void 0 : providerMetadata.anthropic;
  const cacheControlValue = (_a2 = anthropic2 == null ? void 0 : anthropic2.cacheControl) != null ? _a2 : anthropic2 == null ? void 0 : anthropic2.cache_control;
  return cacheControlValue;
}
async function prepareTools2({
  tools,
  toolChoice,
  disableParallelToolUse,
  cacheControlValidator,
  supportsStructuredOutput,
  supportsStrictTools,
  defaultEagerInputStreaming = false
}) {
  var _a2, _b2;
  tools = (tools == null ? void 0 : tools.length) ? tools : void 0;
  const toolWarnings = [];
  const betas = /* @__PURE__ */ new Set();
  const validator = cacheControlValidator || new CacheControlValidator();
  if (tools == null) {
    return { tools: void 0, toolChoice: void 0, toolWarnings, betas };
  }
  const anthropicTools2 = [];
  for (const tool2 of tools) {
    switch (tool2.type) {
      case "function": {
        const cacheControl = validator.getCacheControl(tool2.providerOptions, {
          type: "tool definition",
          canCache: true
        });
        const anthropicOptions = (_a2 = tool2.providerOptions) == null ? void 0 : _a2.anthropic;
        const eagerInputStreaming = (_b2 = anthropicOptions == null ? void 0 : anthropicOptions.eagerInputStreaming) != null ? _b2 : defaultEagerInputStreaming;
        const deferLoading = anthropicOptions == null ? void 0 : anthropicOptions.deferLoading;
        const allowedCallers = anthropicOptions == null ? void 0 : anthropicOptions.allowedCallers;
        if (!supportsStrictTools && tool2.strict != null) {
          toolWarnings.push({
            type: "unsupported",
            feature: "strict",
            details: `Tool '${tool2.name}' has strict: ${tool2.strict}, but strict mode is not supported by this provider. The strict property will be ignored.`
          });
        }
        anthropicTools2.push({
          name: tool2.name,
          description: tool2.description,
          input_schema: tool2.inputSchema,
          cache_control: cacheControl,
          ...eagerInputStreaming ? { eager_input_streaming: true } : {},
          ...supportsStrictTools === true && tool2.strict != null ? { strict: tool2.strict } : {},
          ...deferLoading != null ? { defer_loading: deferLoading } : {},
          ...allowedCallers != null ? { allowed_callers: allowedCallers } : {},
          ...tool2.inputExamples != null ? {
            input_examples: tool2.inputExamples.map(
              (example) => example.input
            )
          } : {}
        });
        if (supportsStructuredOutput === true) {
          betas.add("structured-outputs-2025-11-13");
        }
        if (tool2.inputExamples != null || allowedCallers != null) {
          betas.add("advanced-tool-use-2025-11-20");
        }
        break;
      }
      case "provider": {
        switch (tool2.id) {
          case "anthropic.code_execution_20250522": {
            betas.add("code-execution-2025-05-22");
            anthropicTools2.push({
              type: "code_execution_20250522",
              name: "code_execution",
              cache_control: void 0
            });
            break;
          }
          case "anthropic.code_execution_20250825": {
            betas.add("code-execution-2025-08-25");
            anthropicTools2.push({
              type: "code_execution_20250825",
              name: "code_execution"
            });
            break;
          }
          case "anthropic.code_execution_20260120": {
            anthropicTools2.push({
              type: "code_execution_20260120",
              name: "code_execution"
            });
            break;
          }
          case "anthropic.computer_20250124": {
            betas.add("computer-use-2025-01-24");
            anthropicTools2.push({
              name: "computer",
              type: "computer_20250124",
              display_width_px: tool2.args.displayWidthPx,
              display_height_px: tool2.args.displayHeightPx,
              display_number: tool2.args.displayNumber,
              cache_control: void 0
            });
            break;
          }
          case "anthropic.computer_20251124": {
            betas.add("computer-use-2025-11-24");
            anthropicTools2.push({
              name: "computer",
              type: "computer_20251124",
              display_width_px: tool2.args.displayWidthPx,
              display_height_px: tool2.args.displayHeightPx,
              display_number: tool2.args.displayNumber,
              enable_zoom: tool2.args.enableZoom,
              cache_control: void 0
            });
            break;
          }
          case "anthropic.computer_20241022": {
            betas.add("computer-use-2024-10-22");
            anthropicTools2.push({
              name: "computer",
              type: "computer_20241022",
              display_width_px: tool2.args.displayWidthPx,
              display_height_px: tool2.args.displayHeightPx,
              display_number: tool2.args.displayNumber,
              cache_control: void 0
            });
            break;
          }
          case "anthropic.text_editor_20250124": {
            betas.add("computer-use-2025-01-24");
            anthropicTools2.push({
              name: "str_replace_editor",
              type: "text_editor_20250124",
              cache_control: void 0
            });
            break;
          }
          case "anthropic.text_editor_20241022": {
            betas.add("computer-use-2024-10-22");
            anthropicTools2.push({
              name: "str_replace_editor",
              type: "text_editor_20241022",
              cache_control: void 0
            });
            break;
          }
          case "anthropic.text_editor_20250429": {
            betas.add("computer-use-2025-01-24");
            anthropicTools2.push({
              name: "str_replace_based_edit_tool",
              type: "text_editor_20250429",
              cache_control: void 0
            });
            break;
          }
          case "anthropic.text_editor_20250728": {
            const args = await validateTypes({
              value: tool2.args,
              schema: textEditor_20250728ArgsSchema
            });
            anthropicTools2.push({
              name: "str_replace_based_edit_tool",
              type: "text_editor_20250728",
              max_characters: args.maxCharacters,
              cache_control: void 0
            });
            break;
          }
          case "anthropic.bash_20250124": {
            betas.add("computer-use-2025-01-24");
            anthropicTools2.push({
              name: "bash",
              type: "bash_20250124",
              cache_control: void 0
            });
            break;
          }
          case "anthropic.bash_20241022": {
            betas.add("computer-use-2024-10-22");
            anthropicTools2.push({
              name: "bash",
              type: "bash_20241022",
              cache_control: void 0
            });
            break;
          }
          case "anthropic.memory_20250818": {
            betas.add("context-management-2025-06-27");
            anthropicTools2.push({
              name: "memory",
              type: "memory_20250818"
            });
            break;
          }
          case "anthropic.web_fetch_20250910": {
            betas.add("web-fetch-2025-09-10");
            const args = await validateTypes({
              value: tool2.args,
              schema: webFetch_20250910ArgsSchema
            });
            anthropicTools2.push({
              type: "web_fetch_20250910",
              name: "web_fetch",
              max_uses: args.maxUses,
              allowed_domains: args.allowedDomains,
              blocked_domains: args.blockedDomains,
              citations: args.citations,
              max_content_tokens: args.maxContentTokens,
              cache_control: void 0
            });
            break;
          }
          case "anthropic.web_fetch_20260209": {
            betas.add("code-execution-web-tools-2026-02-09");
            const args = await validateTypes({
              value: tool2.args,
              schema: webFetch_20260209ArgsSchema
            });
            anthropicTools2.push({
              type: "web_fetch_20260209",
              name: "web_fetch",
              max_uses: args.maxUses,
              allowed_domains: args.allowedDomains,
              blocked_domains: args.blockedDomains,
              citations: args.citations,
              max_content_tokens: args.maxContentTokens,
              cache_control: void 0
            });
            break;
          }
          case "anthropic.web_search_20250305": {
            const args = await validateTypes({
              value: tool2.args,
              schema: webSearch_20250305ArgsSchema
            });
            anthropicTools2.push({
              type: "web_search_20250305",
              name: "web_search",
              max_uses: args.maxUses,
              allowed_domains: args.allowedDomains,
              blocked_domains: args.blockedDomains,
              user_location: args.userLocation,
              cache_control: void 0
            });
            break;
          }
          case "anthropic.web_search_20260209": {
            betas.add("code-execution-web-tools-2026-02-09");
            const args = await validateTypes({
              value: tool2.args,
              schema: webSearch_20260209ArgsSchema
            });
            anthropicTools2.push({
              type: "web_search_20260209",
              name: "web_search",
              max_uses: args.maxUses,
              allowed_domains: args.allowedDomains,
              blocked_domains: args.blockedDomains,
              user_location: args.userLocation,
              cache_control: void 0
            });
            break;
          }
          case "anthropic.tool_search_regex_20251119": {
            anthropicTools2.push({
              type: "tool_search_tool_regex_20251119",
              name: "tool_search_tool_regex"
            });
            break;
          }
          case "anthropic.tool_search_bm25_20251119": {
            anthropicTools2.push({
              type: "tool_search_tool_bm25_20251119",
              name: "tool_search_tool_bm25"
            });
            break;
          }
          case "anthropic.advisor_20260301": {
            betas.add("advisor-tool-2026-03-01");
            const args = await validateTypes({
              value: tool2.args,
              schema: advisor_20260301ArgsSchema
            });
            anthropicTools2.push({
              type: "advisor_20260301",
              name: "advisor",
              model: args.model,
              ...args.maxUses !== void 0 && { max_uses: args.maxUses },
              ...args.caching !== void 0 && { caching: args.caching }
            });
            break;
          }
          default: {
            toolWarnings.push({
              type: "unsupported",
              feature: `provider-defined tool ${tool2.id}`
            });
            break;
          }
        }
        break;
      }
      default: {
        toolWarnings.push({
          type: "unsupported",
          feature: `tool ${tool2}`
        });
        break;
      }
    }
  }
  if (toolChoice == null) {
    return {
      tools: anthropicTools2,
      toolChoice: disableParallelToolUse ? { type: "auto", disable_parallel_tool_use: disableParallelToolUse } : void 0,
      toolWarnings,
      betas
    };
  }
  const type = toolChoice.type;
  switch (type) {
    case "auto":
      return {
        tools: anthropicTools2,
        toolChoice: {
          type: "auto",
          disable_parallel_tool_use: disableParallelToolUse
        },
        toolWarnings,
        betas
      };
    case "required":
      return {
        tools: anthropicTools2,
        toolChoice: {
          type: "any",
          disable_parallel_tool_use: disableParallelToolUse
        },
        toolWarnings,
        betas
      };
    case "none":
      return { tools: void 0, toolChoice: void 0, toolWarnings, betas };
    case "tool":
      return {
        tools: anthropicTools2,
        toolChoice: {
          type: "tool",
          name: toolChoice.toolName,
          disable_parallel_tool_use: disableParallelToolUse
        },
        toolWarnings,
        betas
      };
    default: {
      const _exhaustiveCheck = type;
      throw new UnsupportedFunctionalityError7({
        functionality: `tool choice type: ${_exhaustiveCheck}`
      });
    }
  }
}
function convertAnthropicUsage({
  usage,
  rawUsage
}) {
  var _a2, _b2, _c;
  const cacheCreationTokens = (_a2 = usage.cache_creation_input_tokens) != null ? _a2 : 0;
  const cacheReadTokens = (_b2 = usage.cache_read_input_tokens) != null ? _b2 : 0;
  let inputTokens;
  let outputTokens;
  const servedByFallback = (_c = usage.iterations) == null ? void 0 : _c.some(
    (iter) => iter.type === "fallback_message"
  );
  if (usage.iterations && usage.iterations.length > 0 && !servedByFallback) {
    const executorIterations = usage.iterations.filter(
      (iter) => iter.type === "compaction" || iter.type === "message"
    );
    if (executorIterations.length > 0) {
      const totals = executorIterations.reduce(
        (acc, iter) => ({
          input: acc.input + iter.input_tokens,
          output: acc.output + iter.output_tokens
        }),
        { input: 0, output: 0 }
      );
      inputTokens = totals.input;
      outputTokens = totals.output;
    } else {
      inputTokens = usage.input_tokens;
      outputTokens = usage.output_tokens;
    }
  } else {
    inputTokens = usage.input_tokens;
    outputTokens = usage.output_tokens;
  }
  return {
    inputTokens: {
      total: inputTokens + cacheCreationTokens + cacheReadTokens,
      noCache: inputTokens,
      cacheRead: cacheReadTokens,
      cacheWrite: cacheCreationTokens
    },
    outputTokens: {
      total: outputTokens,
      text: void 0,
      reasoning: void 0
    },
    raw: rawUsage != null ? rawUsage : usage
  };
}
function convertBytesDataToString(data) {
  if (typeof data === "string") {
    return new TextDecoder().decode(convertBase64ToUint8Array(data));
  }
  return new TextDecoder().decode(data);
}
function extractErrorValue(value) {
  try {
    if (typeof value === "string") {
      return JSON.parse(value);
    } else if (typeof value === "object" && value !== null) {
      return value;
    }
  } catch (e) {
    const extractedErrorCode = value == null ? void 0 : value.errorCode;
    return {
      errorCode: typeof extractedErrorCode === "string" ? extractedErrorCode : "unavailable"
    };
  }
  return {};
}
async function convertToAnthropicPrompt({
  prompt,
  sendReasoning,
  warnings,
  cacheControlValidator,
  toolNameMapping
}) {
  var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v;
  const betas = /* @__PURE__ */ new Set();
  const blocks = groupIntoBlocks(prompt);
  const validator = cacheControlValidator || new CacheControlValidator();
  let system = void 0;
  const messages = [];
  async function shouldEnableCitations(providerMetadata) {
    var _a22, _b22;
    const anthropicOptions = await parseProviderOptions({
      provider: "anthropic",
      providerOptions: providerMetadata,
      schema: anthropicFilePartProviderOptions
    });
    return (_b22 = (_a22 = anthropicOptions == null ? void 0 : anthropicOptions.citations) == null ? void 0 : _a22.enabled) != null ? _b22 : false;
  }
  async function shouldUseContainerUpload(providerMetadata) {
    var _a22;
    const anthropicOptions = await parseProviderOptions({
      provider: "anthropic",
      providerOptions: providerMetadata,
      schema: anthropicFilePartProviderOptions
    });
    return (_a22 = anthropicOptions == null ? void 0 : anthropicOptions.containerUpload) != null ? _a22 : false;
  }
  async function getDocumentMetadata(providerMetadata) {
    const anthropicOptions = await parseProviderOptions({
      provider: "anthropic",
      providerOptions: providerMetadata,
      schema: anthropicFilePartProviderOptions
    });
    return {
      title: anthropicOptions == null ? void 0 : anthropicOptions.title,
      context: anthropicOptions == null ? void 0 : anthropicOptions.context
    };
  }
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const isLastBlock = i === blocks.length - 1;
    const type = block.type;
    switch (type) {
      case "system": {
        const content = block.messages.map(({ content: content2, providerOptions }) => ({
          type: "text",
          text: content2,
          cache_control: validator.getCacheControl(providerOptions, {
            type: "system message",
            canCache: true
          })
        }));
        if (system == null) {
          system = content;
        } else {
          messages.push({ role: "system", content });
          betas.add("mid-conversation-system-2026-04-07");
        }
        break;
      }
      case "user": {
        const anthropicContent = [];
        for (const message of block.messages) {
          const { role, content } = message;
          switch (role) {
            case "user": {
              for (let j = 0; j < content.length; j++) {
                const part = content[j];
                const isLastPart = j === content.length - 1;
                const cacheControl = (_a2 = validator.getCacheControl(part.providerOptions, {
                  type: "user message part",
                  canCache: true
                })) != null ? _a2 : isLastPart ? validator.getCacheControl(message.providerOptions, {
                  type: "user message",
                  canCache: true
                }) : void 0;
                switch (part.type) {
                  case "text": {
                    anthropicContent.push({
                      type: "text",
                      text: part.text,
                      cache_control: cacheControl
                    });
                    break;
                  }
                  case "file": {
                    switch (part.data.type) {
                      case "reference": {
                        const fileId = resolveProviderReference({
                          reference: part.data.reference,
                          provider: "anthropic"
                        });
                        betas.add("files-api-2025-04-14");
                        if (await shouldUseContainerUpload(part.providerOptions)) {
                          anthropicContent.push({
                            type: "container_upload",
                            file_id: fileId
                          });
                        } else if (getTopLevelMediaType(part.mediaType) === "image") {
                          anthropicContent.push({
                            type: "image",
                            source: { type: "file", file_id: fileId },
                            cache_control: cacheControl
                          });
                        } else {
                          anthropicContent.push({
                            type: "document",
                            source: { type: "file", file_id: fileId },
                            cache_control: cacheControl
                          });
                        }
                        break;
                      }
                      case "text": {
                        const enableCitations = await shouldEnableCitations(
                          part.providerOptions
                        );
                        const metadata = await getDocumentMetadata(
                          part.providerOptions
                        );
                        anthropicContent.push({
                          type: "document",
                          source: {
                            type: "text",
                            media_type: "text/plain",
                            data: part.data.text
                          },
                          title: (_b2 = metadata.title) != null ? _b2 : part.filename,
                          ...metadata.context && {
                            context: metadata.context
                          },
                          ...enableCitations && {
                            citations: { enabled: true }
                          },
                          cache_control: cacheControl
                        });
                        break;
                      }
                      case "url":
                      case "data": {
                        const topLevel = getTopLevelMediaType(part.mediaType);
                        if (topLevel === "image") {
                          anthropicContent.push({
                            type: "image",
                            source: part.data.type === "url" ? {
                              type: "url",
                              url: part.data.url.toString()
                            } : {
                              type: "base64",
                              media_type: resolveFullMediaType({ part }),
                              data: convertToBase64(part.data.data)
                            },
                            cache_control: cacheControl
                          });
                        } else if (topLevel === "application" && (part.data.type === "url" ? part.mediaType === "application/pdf" : resolveFullMediaType({ part }) === "application/pdf")) {
                          betas.add("pdfs-2024-09-25");
                          const enableCitations = await shouldEnableCitations(
                            part.providerOptions
                          );
                          const metadata = await getDocumentMetadata(
                            part.providerOptions
                          );
                          anthropicContent.push({
                            type: "document",
                            source: part.data.type === "url" ? {
                              type: "url",
                              url: part.data.url.toString()
                            } : {
                              type: "base64",
                              media_type: "application/pdf",
                              data: convertToBase64(part.data.data)
                            },
                            title: (_c = metadata.title) != null ? _c : part.filename,
                            ...metadata.context && {
                              context: metadata.context
                            },
                            ...enableCitations && {
                              citations: { enabled: true }
                            },
                            cache_control: cacheControl
                          });
                        } else if (part.mediaType === "text/plain") {
                          const enableCitations = await shouldEnableCitations(
                            part.providerOptions
                          );
                          const metadata = await getDocumentMetadata(
                            part.providerOptions
                          );
                          anthropicContent.push({
                            type: "document",
                            source: part.data.type === "url" ? {
                              type: "url",
                              url: part.data.url.toString()
                            } : {
                              type: "text",
                              media_type: "text/plain",
                              data: convertBytesDataToString(
                                part.data.data
                              )
                            },
                            title: (_d = metadata.title) != null ? _d : part.filename,
                            ...metadata.context && {
                              context: metadata.context
                            },
                            ...enableCitations && {
                              citations: { enabled: true }
                            },
                            cache_control: cacheControl
                          });
                        } else {
                          throw new UnsupportedFunctionalityError24({
                            functionality: `media type: ${part.mediaType}`
                          });
                        }
                        break;
                      }
                    }
                    break;
                  }
                }
              }
              break;
            }
            case "tool": {
              for (let i2 = 0; i2 < content.length; i2++) {
                const part = content[i2];
                if (part.type === "tool-approval-response") {
                  continue;
                }
                const output = part.output;
                const outputProviderOptions = "providerOptions" in output ? output.providerOptions : output.type === "content" ? (_e = output.value.find(
                  (contentPart) => contentPart.providerOptions != null
                )) == null ? void 0 : _e.providerOptions : void 0;
                const isLastPart = i2 === content.length - 1;
                const cacheControl = (_g = (_f = validator.getCacheControl(part.providerOptions, {
                  type: "tool result part",
                  canCache: true
                })) != null ? _f : validator.getCacheControl(outputProviderOptions, {
                  type: "tool result output",
                  canCache: true
                })) != null ? _g : isLastPart ? validator.getCacheControl(message.providerOptions, {
                  type: "tool result message",
                  canCache: true
                }) : void 0;
                let contentValue;
                switch (output.type) {
                  case "content":
                    contentValue = output.value.map((contentPart) => {
                      var _a22;
                      switch (contentPart.type) {
                        case "text":
                          return {
                            type: "text",
                            text: contentPart.text
                          };
                        case "file": {
                          const topLevel = getTopLevelMediaType(
                            contentPart.mediaType
                          );
                          if (contentPart.data.type === "url") {
                            if (topLevel === "image") {
                              return {
                                type: "image",
                                source: {
                                  type: "url",
                                  url: contentPart.data.url.toString()
                                }
                              };
                            }
                            return {
                              type: "document",
                              source: {
                                type: "url",
                                url: contentPart.data.url.toString()
                              }
                            };
                          }
                          if (contentPart.data.type === "data") {
                            if (topLevel === "image") {
                              return {
                                type: "image",
                                source: {
                                  type: "base64",
                                  media_type: resolveFullMediaType({
                                    part: contentPart
                                  }),
                                  data: convertToBase64(
                                    contentPart.data.data
                                  )
                                }
                              };
                            }
                            if (resolveFullMediaType({ part: contentPart }) === "application/pdf") {
                              betas.add("pdfs-2024-09-25");
                              return {
                                type: "document",
                                source: {
                                  type: "base64",
                                  media_type: "application/pdf",
                                  data: convertToBase64(
                                    contentPart.data.data
                                  )
                                }
                              };
                            }
                            warnings.push({
                              type: "other",
                              message: `unsupported tool content part type: ${contentPart.type} with media type: ${contentPart.mediaType}`
                            });
                            return void 0;
                          }
                          warnings.push({
                            type: "other",
                            message: `unsupported tool content part type: ${contentPart.type} with data type: ${contentPart.data.type}`
                          });
                          return void 0;
                        }
                        case "custom": {
                          const anthropicOptions = (_a22 = contentPart.providerOptions) == null ? void 0 : _a22.anthropic;
                          if ((anthropicOptions == null ? void 0 : anthropicOptions.type) === "tool-reference") {
                            return {
                              type: "tool_reference",
                              tool_name: anthropicOptions.toolName
                            };
                          }
                          warnings.push({
                            type: "other",
                            message: `unsupported custom tool content part`
                          });
                          return void 0;
                        }
                        default: {
                          warnings.push({
                            type: "other",
                            message: `unsupported tool content part type: ${contentPart.type}`
                          });
                          return void 0;
                        }
                      }
                    }).filter(isNonNullable);
                    break;
                  case "text":
                  case "error-text":
                    contentValue = output.value;
                    break;
                  case "execution-denied":
                    contentValue = (_h = output.reason) != null ? _h : "Tool call execution denied.";
                    break;
                  case "json":
                  case "error-json":
                  default:
                    contentValue = JSON.stringify(output.value);
                    break;
                }
                anthropicContent.push({
                  type: "tool_result",
                  tool_use_id: part.toolCallId,
                  content: contentValue,
                  is_error: output.type === "error-text" || output.type === "error-json" ? true : void 0,
                  cache_control: cacheControl
                });
              }
              break;
            }
            default: {
              const _exhaustiveCheck = role;
              throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
            }
          }
        }
        messages.push({ role: "user", content: anthropicContent });
        break;
      }
      case "assistant": {
        const anthropicContent = [];
        const mcpToolUseIds = /* @__PURE__ */ new Set();
        for (let j = 0; j < block.messages.length; j++) {
          const message = block.messages[j];
          const isLastMessage = j === block.messages.length - 1;
          const { content } = message;
          for (let k = 0; k < content.length; k++) {
            const part = content[k];
            const isLastContentPart = k === content.length - 1;
            const cacheControl = (_i = validator.getCacheControl(part.providerOptions, {
              type: "assistant message part",
              canCache: true
            })) != null ? _i : isLastContentPart ? validator.getCacheControl(message.providerOptions, {
              type: "assistant message",
              canCache: true
            }) : void 0;
            switch (part.type) {
              case "text": {
                const textMetadata = (_j = part.providerOptions) == null ? void 0 : _j.anthropic;
                if ((textMetadata == null ? void 0 : textMetadata.type) === "compaction") {
                  anthropicContent.push({
                    type: "compaction",
                    content: part.text,
                    cache_control: cacheControl
                  });
                } else {
                  anthropicContent.push({
                    type: "text",
                    text: (
                      // trim the last text part if it's the last message in the block
                      // because Anthropic does not allow trailing whitespace
                      // in pre-filled assistant responses
                      isLastBlock && isLastMessage && isLastContentPart ? part.text.trim() : part.text
                    ),
                    cache_control: cacheControl
                  });
                }
                break;
              }
              case "reasoning": {
                if (sendReasoning) {
                  const reasoningMetadata = await parseProviderOptions({
                    provider: "anthropic",
                    providerOptions: part.providerOptions,
                    schema: anthropicReasoningMetadataSchema
                  });
                  if (reasoningMetadata != null) {
                    if (reasoningMetadata.signature != null) {
                      validator.getCacheControl(part.providerOptions, {
                        type: "thinking block",
                        canCache: false
                      });
                      anthropicContent.push({
                        type: "thinking",
                        thinking: part.text,
                        signature: reasoningMetadata.signature
                      });
                    } else if (reasoningMetadata.redactedData != null) {
                      validator.getCacheControl(part.providerOptions, {
                        type: "redacted thinking block",
                        canCache: false
                      });
                      anthropicContent.push({
                        type: "redacted_thinking",
                        data: reasoningMetadata.redactedData
                      });
                    } else {
                      warnings.push({
                        type: "other",
                        message: "unsupported reasoning metadata"
                      });
                    }
                  } else {
                    warnings.push({
                      type: "other",
                      message: "unsupported reasoning metadata"
                    });
                  }
                } else {
                  warnings.push({
                    type: "other",
                    message: "sending reasoning content is disabled for this model"
                  });
                }
                break;
              }
              case "tool-call": {
                if (part.providerExecuted) {
                  const providerToolName = toolNameMapping.toProviderToolName(
                    part.toolName
                  );
                  const isMcpToolUse = ((_l = (_k = part.providerOptions) == null ? void 0 : _k.anthropic) == null ? void 0 : _l.type) === "mcp-tool-use";
                  if (isMcpToolUse) {
                    mcpToolUseIds.add(part.toolCallId);
                    const serverName = (_n = (_m = part.providerOptions) == null ? void 0 : _m.anthropic) == null ? void 0 : _n.serverName;
                    if (serverName == null || typeof serverName !== "string") {
                      warnings.push({
                        type: "other",
                        message: "mcp tool use server name is required and must be a string"
                      });
                      break;
                    }
                    anthropicContent.push({
                      type: "mcp_tool_use",
                      id: part.toolCallId,
                      name: part.toolName,
                      input: part.input,
                      server_name: serverName,
                      cache_control: cacheControl
                    });
                  } else if (
                    // code execution 20250825:
                    providerToolName === "code_execution" && part.input != null && typeof part.input === "object" && "type" in part.input && typeof part.input.type === "string" && (part.input.type === "bash_code_execution" || part.input.type === "text_editor_code_execution")
                  ) {
                    anthropicContent.push({
                      type: "server_tool_use",
                      id: part.toolCallId,
                      name: part.input.type,
                      // map back to subtool name
                      input: part.input,
                      cache_control: cacheControl
                    });
                  } else if (
                    // code execution 20250825 programmatic tool calling:
                    // Strip the fake 'programmatic-tool-call' type before sending to Anthropic
                    providerToolName === "code_execution" && part.input != null && typeof part.input === "object" && "type" in part.input && part.input.type === "programmatic-tool-call"
                  ) {
                    const { type: _, ...inputWithoutType } = part.input;
                    anthropicContent.push({
                      type: "server_tool_use",
                      id: part.toolCallId,
                      name: "code_execution",
                      input: inputWithoutType,
                      cache_control: cacheControl
                    });
                  } else {
                    if (providerToolName === "code_execution" || // code execution 20250522
                    providerToolName === "web_fetch" || providerToolName === "web_search") {
                      anthropicContent.push({
                        type: "server_tool_use",
                        id: part.toolCallId,
                        name: providerToolName,
                        input: part.input,
                        cache_control: cacheControl
                      });
                    } else if (providerToolName === "tool_search_tool_regex" || providerToolName === "tool_search_tool_bm25") {
                      anthropicContent.push({
                        type: "server_tool_use",
                        id: part.toolCallId,
                        name: providerToolName,
                        input: part.input,
                        cache_control: cacheControl
                      });
                    } else if (providerToolName === "advisor") {
                      anthropicContent.push({
                        type: "server_tool_use",
                        id: part.toolCallId,
                        name: "advisor",
                        input: {},
                        cache_control: cacheControl
                      });
                    } else {
                      warnings.push({
                        type: "other",
                        message: `provider executed tool call for tool ${part.toolName} is not supported`
                      });
                    }
                  }
                  break;
                }
                const callerOptions = (_o = part.providerOptions) == null ? void 0 : _o.anthropic;
                const caller = (callerOptions == null ? void 0 : callerOptions.caller) ? (callerOptions.caller.type === "code_execution_20250825" || callerOptions.caller.type === "code_execution_20260120") && callerOptions.caller.toolId ? {
                  type: callerOptions.caller.type,
                  tool_id: callerOptions.caller.toolId
                } : callerOptions.caller.type === "direct" ? { type: "direct" } : void 0 : void 0;
                anthropicContent.push({
                  type: "tool_use",
                  id: part.toolCallId,
                  name: part.toolName,
                  input: part.input,
                  ...caller && { caller },
                  cache_control: cacheControl
                });
                break;
              }
              case "tool-result": {
                const providerToolName = toolNameMapping.toProviderToolName(
                  part.toolName
                );
                if (mcpToolUseIds.has(part.toolCallId)) {
                  const output = part.output;
                  if (output.type !== "json" && output.type !== "error-json") {
                    warnings.push({
                      type: "other",
                      message: `provider executed tool result output type ${output.type} for tool ${part.toolName} is not supported`
                    });
                    break;
                  }
                  anthropicContent.push({
                    type: "mcp_tool_result",
                    tool_use_id: part.toolCallId,
                    is_error: output.type === "error-json",
                    content: output.value,
                    cache_control: cacheControl
                  });
                } else if (providerToolName === "code_execution") {
                  const output = part.output;
                  if (output.type === "error-text" || output.type === "error-json") {
                    let errorInfo = {};
                    try {
                      if (typeof output.value === "string") {
                        errorInfo = JSON.parse(output.value);
                      } else if (typeof output.value === "object" && output.value !== null) {
                        errorInfo = output.value;
                      }
                    } catch (e) {
                    }
                    if (errorInfo.type === "code_execution_tool_result_error") {
                      anthropicContent.push({
                        type: "code_execution_tool_result",
                        tool_use_id: part.toolCallId,
                        content: {
                          type: "code_execution_tool_result_error",
                          error_code: (_p = errorInfo.errorCode) != null ? _p : "unknown"
                        },
                        cache_control: cacheControl
                      });
                    } else {
                      anthropicContent.push({
                        type: "bash_code_execution_tool_result",
                        tool_use_id: part.toolCallId,
                        cache_control: cacheControl,
                        content: {
                          type: "bash_code_execution_tool_result_error",
                          error_code: (_q = errorInfo.errorCode) != null ? _q : "unknown"
                        }
                      });
                    }
                    break;
                  }
                  if (output.type !== "json") {
                    warnings.push({
                      type: "other",
                      message: `provider executed tool result output type ${output.type} for tool ${part.toolName} is not supported`
                    });
                    break;
                  }
                  if (output.value == null || typeof output.value !== "object" || !("type" in output.value) || typeof output.value.type !== "string") {
                    warnings.push({
                      type: "other",
                      message: `provider executed tool result output value is not a valid code execution result for tool ${part.toolName}`
                    });
                    break;
                  }
                  if (output.value.type === "code_execution_result") {
                    const codeExecutionOutput = await validateTypes({
                      value: output.value,
                      schema: codeExecution_20250522OutputSchema
                    });
                    anthropicContent.push({
                      type: "code_execution_tool_result",
                      tool_use_id: part.toolCallId,
                      content: {
                        type: codeExecutionOutput.type,
                        stdout: codeExecutionOutput.stdout,
                        stderr: codeExecutionOutput.stderr,
                        return_code: codeExecutionOutput.return_code,
                        content: (_r = codeExecutionOutput.content) != null ? _r : []
                      },
                      cache_control: cacheControl
                    });
                  } else if (output.value.type === "encrypted_code_execution_result") {
                    const codeExecutionOutput = await validateTypes({
                      value: output.value,
                      schema: codeExecution_20260120OutputSchema
                    });
                    if (codeExecutionOutput.type === "encrypted_code_execution_result") {
                      anthropicContent.push({
                        type: "code_execution_tool_result",
                        tool_use_id: part.toolCallId,
                        content: {
                          type: codeExecutionOutput.type,
                          encrypted_stdout: codeExecutionOutput.encrypted_stdout,
                          stderr: codeExecutionOutput.stderr,
                          return_code: codeExecutionOutput.return_code,
                          content: (_s = codeExecutionOutput.content) != null ? _s : []
                        },
                        cache_control: cacheControl
                      });
                    }
                  } else {
                    const codeExecutionOutput = await validateTypes({
                      value: output.value,
                      schema: codeExecution_20250825OutputSchema
                    });
                    if (codeExecutionOutput.type === "code_execution_result") {
                      anthropicContent.push({
                        type: "code_execution_tool_result",
                        tool_use_id: part.toolCallId,
                        content: {
                          type: codeExecutionOutput.type,
                          stdout: codeExecutionOutput.stdout,
                          stderr: codeExecutionOutput.stderr,
                          return_code: codeExecutionOutput.return_code,
                          content: (_t = codeExecutionOutput.content) != null ? _t : []
                        },
                        cache_control: cacheControl
                      });
                    } else if (codeExecutionOutput.type === "bash_code_execution_result" || codeExecutionOutput.type === "bash_code_execution_tool_result_error") {
                      anthropicContent.push({
                        type: "bash_code_execution_tool_result",
                        tool_use_id: part.toolCallId,
                        cache_control: cacheControl,
                        content: codeExecutionOutput
                      });
                    } else {
                      anthropicContent.push({
                        type: "text_editor_code_execution_tool_result",
                        tool_use_id: part.toolCallId,
                        cache_control: cacheControl,
                        content: codeExecutionOutput
                      });
                    }
                  }
                  break;
                }
                if (providerToolName === "web_fetch") {
                  const output = part.output;
                  if (output.type === "error-json") {
                    anthropicContent.push({
                      type: "web_fetch_tool_result",
                      tool_use_id: part.toolCallId,
                      content: {
                        type: "web_fetch_tool_result_error",
                        error_code: (_u = extractErrorValue(output.value).errorCode) != null ? _u : "unavailable"
                      },
                      cache_control: cacheControl
                    });
                    break;
                  }
                  if (output.type !== "json") {
                    warnings.push({
                      type: "other",
                      message: `provider executed tool result output type ${output.type} for tool ${part.toolName} is not supported`
                    });
                    break;
                  }
                  const webFetchOutput = await validateTypes({
                    value: output.value,
                    schema: webFetch_20250910OutputSchema
                  });
                  anthropicContent.push({
                    type: "web_fetch_tool_result",
                    tool_use_id: part.toolCallId,
                    content: {
                      type: "web_fetch_result",
                      url: webFetchOutput.url,
                      retrieved_at: webFetchOutput.retrievedAt,
                      content: {
                        type: "document",
                        title: webFetchOutput.content.title,
                        citations: webFetchOutput.content.citations,
                        source: {
                          type: webFetchOutput.content.source.type,
                          media_type: webFetchOutput.content.source.mediaType,
                          data: webFetchOutput.content.source.data
                        }
                      }
                    },
                    cache_control: cacheControl
                  });
                  break;
                }
                if (providerToolName === "web_search") {
                  const output = part.output;
                  if (output.type === "error-json") {
                    anthropicContent.push({
                      type: "web_search_tool_result",
                      tool_use_id: part.toolCallId,
                      content: {
                        type: "web_search_tool_result_error",
                        error_code: (_v = extractErrorValue(output.value).errorCode) != null ? _v : "unavailable"
                      },
                      cache_control: cacheControl
                    });
                    break;
                  }
                  if (output.type !== "json") {
                    warnings.push({
                      type: "other",
                      message: `provider executed tool result output type ${output.type} for tool ${part.toolName} is not supported`
                    });
                    break;
                  }
                  const webSearchOutput = await validateTypes({
                    value: output.value,
                    schema: webSearch_20250305OutputSchema
                  });
                  anthropicContent.push({
                    type: "web_search_tool_result",
                    tool_use_id: part.toolCallId,
                    content: webSearchOutput.map((result) => ({
                      url: result.url,
                      title: result.title,
                      page_age: result.pageAge,
                      encrypted_content: result.encryptedContent,
                      type: result.type
                    })),
                    cache_control: cacheControl
                  });
                  break;
                }
                if (providerToolName === "tool_search_tool_regex" || providerToolName === "tool_search_tool_bm25") {
                  const output = part.output;
                  if (output.type !== "json") {
                    warnings.push({
                      type: "other",
                      message: `provider executed tool result output type ${output.type} for tool ${part.toolName} is not supported`
                    });
                    break;
                  }
                  const toolSearchOutput = await validateTypes({
                    value: output.value,
                    schema: toolSearchRegex_20251119OutputSchema
                  });
                  const toolReferences = toolSearchOutput.map((ref) => ({
                    type: "tool_reference",
                    tool_name: ref.toolName
                  }));
                  anthropicContent.push({
                    type: "tool_search_tool_result",
                    tool_use_id: part.toolCallId,
                    content: {
                      type: "tool_search_tool_search_result",
                      tool_references: toolReferences
                    },
                    cache_control: cacheControl
                  });
                  break;
                }
                if (providerToolName === "advisor") {
                  const output = part.output;
                  if (output.type !== "json" && output.type !== "error-json") {
                    warnings.push({
                      type: "other",
                      message: `provider executed tool result output type ${output.type} for tool ${part.toolName} is not supported`
                    });
                    break;
                  }
                  const advisorOutput = await validateTypes({
                    value: output.value,
                    schema: advisor_20260301OutputSchema
                  });
                  if (advisorOutput.type === "advisor_result") {
                    anthropicContent.push({
                      type: "advisor_tool_result",
                      tool_use_id: part.toolCallId,
                      content: {
                        type: "advisor_result",
                        text: advisorOutput.text
                      },
                      cache_control: cacheControl
                    });
                  } else if (advisorOutput.type === "advisor_redacted_result") {
                    anthropicContent.push({
                      type: "advisor_tool_result",
                      tool_use_id: part.toolCallId,
                      content: {
                        type: "advisor_redacted_result",
                        encrypted_content: advisorOutput.encryptedContent
                      },
                      cache_control: cacheControl
                    });
                  } else {
                    anthropicContent.push({
                      type: "advisor_tool_result",
                      tool_use_id: part.toolCallId,
                      content: {
                        type: "advisor_tool_result_error",
                        error_code: advisorOutput.errorCode
                      },
                      cache_control: cacheControl
                    });
                  }
                  break;
                }
                warnings.push({
                  type: "other",
                  message: `provider executed tool result for tool ${part.toolName} is not supported`
                });
                break;
              }
            }
          }
        }
        messages.push({
          role: "assistant",
          content: moveToolUseBlocksToEnd(anthropicContent)
        });
        break;
      }
      default: {
        const _exhaustiveCheck = type;
        throw new Error(`content type: ${_exhaustiveCheck}`);
      }
    }
  }
  return {
    prompt: { system, messages },
    betas
  };
}
function groupIntoBlocks(prompt) {
  const blocks = [];
  let currentBlock = void 0;
  for (const message of prompt) {
    const { role } = message;
    switch (role) {
      case "system": {
        if ((currentBlock == null ? void 0 : currentBlock.type) !== "system") {
          currentBlock = { type: "system", messages: [] };
          blocks.push(currentBlock);
        }
        currentBlock.messages.push(message);
        break;
      }
      case "assistant": {
        if ((currentBlock == null ? void 0 : currentBlock.type) !== "assistant") {
          currentBlock = { type: "assistant", messages: [] };
          blocks.push(currentBlock);
        }
        currentBlock.messages.push(message);
        break;
      }
      case "user": {
        if ((currentBlock == null ? void 0 : currentBlock.type) !== "user") {
          currentBlock = { type: "user", messages: [] };
          blocks.push(currentBlock);
        }
        currentBlock.messages.push(message);
        break;
      }
      case "tool": {
        if ((currentBlock == null ? void 0 : currentBlock.type) !== "user") {
          currentBlock = { type: "user", messages: [] };
          blocks.push(currentBlock);
        }
        currentBlock.messages.push(message);
        break;
      }
      default: {
        const _exhaustiveCheck = role;
        throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
      }
    }
  }
  return blocks;
}
function moveToolUseBlocksToEnd(content) {
  const result = [];
  let segment = [];
  function flushSegment() {
    result.push(
      ...segment.filter((part) => part.type !== "tool_use"),
      ...segment.filter((part) => part.type === "tool_use")
    );
    segment = [];
  }
  for (const part of content) {
    if (part.type === "thinking" || part.type === "redacted_thinking") {
      flushSegment();
      result.push(part);
    } else {
      segment.push(part);
    }
  }
  flushSegment();
  return result;
}
function mapAnthropicStopReason({
  finishReason,
  isJsonResponseFromTool
}) {
  switch (finishReason) {
    case "pause_turn":
    case "end_turn":
    case "stop_sequence":
      return "stop";
    case "refusal":
      return "content-filter";
    case "tool_use":
      return isJsonResponseFromTool ? "stop" : "tool-calls";
    case "max_tokens":
    case "model_context_window_exceeded":
      return "length";
    case "compaction":
      return "other";
    default:
      return "other";
  }
}
function sanitizeJsonSchema(schema) {
  return sanitizeSchema(schema);
}
function sanitizeDefinition(definition) {
  if (typeof definition === "boolean" || !isPlainObject(definition)) {
    return definition;
  }
  return sanitizeSchema(definition);
}
function sanitizeSchema(schema) {
  const result = {};
  const schemaWithDefs = schema;
  if (schema.$ref != null) {
    return { $ref: schema.$ref };
  }
  if (schema.$schema != null) {
    result.$schema = schema.$schema;
  }
  if (schema.$id != null) {
    result.$id = schema.$id;
  }
  if (schema.title != null) {
    result.title = schema.title;
  }
  if (schema.description != null) {
    result.description = schema.description;
  }
  if (schema.default !== void 0) {
    result.default = schema.default;
  }
  if (schema.const !== void 0) {
    result.const = schema.const;
  }
  if (schema.enum != null) {
    result.enum = schema.enum;
  }
  if (schema.type != null) {
    result.type = schema.type;
  }
  if (schema.anyOf != null) {
    result.anyOf = schema.anyOf.map(sanitizeDefinition);
  } else if (schema.oneOf != null) {
    result.anyOf = schema.oneOf.map(sanitizeDefinition);
  }
  if (schema.allOf != null) {
    result.allOf = schema.allOf.map(sanitizeDefinition);
  }
  if (schema.definitions != null) {
    result.definitions = Object.fromEntries(
      Object.entries(schema.definitions).map(([name2, definition]) => [
        name2,
        sanitizeDefinition(definition)
      ])
    );
  }
  if (schemaWithDefs.$defs != null) {
    const resultWithDefs = result;
    resultWithDefs.$defs = Object.fromEntries(
      Object.entries(schemaWithDefs.$defs).map(([name2, definition]) => [
        name2,
        sanitizeDefinition(definition)
      ])
    );
  }
  if (schema.type === "object" || schema.properties != null) {
    if (schema.properties != null) {
      result.properties = Object.fromEntries(
        Object.entries(schema.properties).map(([name2, definition]) => [
          name2,
          sanitizeDefinition(definition)
        ])
      );
    }
    result.additionalProperties = false;
    if (schema.required != null) {
      result.required = schema.required;
    }
  }
  if (schema.items != null) {
    result.items = Array.isArray(schema.items) ? schema.items.map(sanitizeDefinition) : sanitizeDefinition(schema.items);
  }
  if (typeof schema.format === "string" && SUPPORTED_STRING_FORMATS.has(schema.format)) {
    result.format = schema.format;
  }
  const constraintDescription = getConstraintDescription(schema);
  if (constraintDescription != null) {
    result.description = result.description == null ? constraintDescription : `${result.description}
${constraintDescription}`;
  }
  return result;
}
function getConstraintDescription(schema) {
  const descriptions = DESCRIPTION_CONSTRAINT_KEYS.flatMap((key) => {
    const value = schema[key];
    if (value == null || value === false) {
      return [];
    }
    return `${formatConstraintName(key)}: ${formatConstraintValue(value)}`;
  });
  if (typeof schema.format === "string" && !SUPPORTED_STRING_FORMATS.has(schema.format)) {
    descriptions.push(`format: ${schema.format}`);
  }
  return descriptions.length === 0 ? void 0 : `${descriptions.join("; ")}.`;
}
function formatConstraintName(key) {
  return key.replace(/[A-Z]/g, (match) => ` ${match.toLowerCase()}`);
}
function formatConstraintValue(value) {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function createCitationSource(citation, citationDocuments, generateId3) {
  var _a2;
  if (citation.type === "web_search_result_location") {
    return {
      type: "source",
      sourceType: "url",
      id: generateId3(),
      url: citation.url,
      title: citation.title,
      providerMetadata: {
        anthropic: {
          citedText: citation.cited_text,
          encryptedIndex: citation.encrypted_index
        }
      }
    };
  }
  if (citation.type !== "page_location" && citation.type !== "char_location") {
    return;
  }
  const documentInfo = citationDocuments[citation.document_index];
  if (!documentInfo) {
    return;
  }
  return {
    type: "source",
    sourceType: "document",
    id: generateId3(),
    mediaType: documentInfo.mediaType,
    title: (_a2 = citation.document_title) != null ? _a2 : documentInfo.title,
    filename: documentInfo.filename,
    providerMetadata: {
      anthropic: citation.type === "page_location" ? {
        citedText: citation.cited_text,
        startPageNumber: citation.start_page_number,
        endPageNumber: citation.end_page_number
      } : {
        citedText: citation.cited_text,
        startCharIndex: citation.start_char_index,
        endCharIndex: citation.end_char_index
      }
    }
  };
}
function getModelCapabilities(modelId) {
  if (modelId.includes("claude-opus-4-8") || modelId.includes("claude-opus-4-7") || modelId.includes("claude-fable-5")) {
    return {
      maxOutputTokens: 128e3,
      supportsStructuredOutput: true,
      supportsAdaptiveThinking: true,
      rejectsSamplingParameters: true,
      supportsXhighEffort: true,
      isKnownModel: true
    };
  } else if (modelId.includes("claude-sonnet-4-6") || modelId.includes("claude-opus-4-6")) {
    return {
      maxOutputTokens: 128e3,
      supportsStructuredOutput: true,
      supportsAdaptiveThinking: true,
      rejectsSamplingParameters: false,
      supportsXhighEffort: false,
      isKnownModel: true
    };
  } else if (modelId.includes("claude-sonnet-4-5") || modelId.includes("claude-opus-4-5") || modelId.includes("claude-haiku-4-5")) {
    return {
      maxOutputTokens: 64e3,
      supportsStructuredOutput: true,
      supportsAdaptiveThinking: false,
      rejectsSamplingParameters: false,
      supportsXhighEffort: false,
      isKnownModel: true
    };
  } else if (modelId.includes("claude-opus-4-1")) {
    return {
      maxOutputTokens: 32e3,
      supportsStructuredOutput: true,
      supportsAdaptiveThinking: false,
      rejectsSamplingParameters: false,
      supportsXhighEffort: false,
      isKnownModel: true
    };
  } else if (modelId.includes("claude-sonnet-4-")) {
    return {
      maxOutputTokens: 64e3,
      supportsStructuredOutput: false,
      supportsAdaptiveThinking: false,
      rejectsSamplingParameters: false,
      supportsXhighEffort: false,
      isKnownModel: true
    };
  } else if (modelId.includes("claude-opus-4-")) {
    return {
      maxOutputTokens: 32e3,
      supportsStructuredOutput: false,
      supportsAdaptiveThinking: false,
      rejectsSamplingParameters: false,
      supportsXhighEffort: false,
      isKnownModel: true
    };
  } else if (modelId.includes("claude-3-haiku")) {
    return {
      maxOutputTokens: 4096,
      supportsStructuredOutput: false,
      supportsAdaptiveThinking: false,
      rejectsSamplingParameters: false,
      supportsXhighEffort: false,
      isKnownModel: true
    };
  } else {
    return {
      maxOutputTokens: 4096,
      supportsStructuredOutput: false,
      supportsAdaptiveThinking: false,
      rejectsSamplingParameters: false,
      supportsXhighEffort: false,
      isKnownModel: false
    };
  }
}
function hasWebTool20260209WithoutCodeExecution(tools) {
  if (!tools) {
    return false;
  }
  let hasWebTool20260209 = false;
  let hasCodeExecutionTool = false;
  for (const tool2 of tools) {
    if ("type" in tool2 && (tool2.type === "web_fetch_20260209" || tool2.type === "web_search_20260209")) {
      hasWebTool20260209 = true;
      continue;
    }
    if (tool2.name === "code_execution") {
      hasCodeExecutionTool = true;
      break;
    }
  }
  return hasWebTool20260209 && !hasCodeExecutionTool;
}
function resolveAnthropicReasoningConfig({
  reasoning,
  supportsAdaptiveThinking,
  supportsXhighEffort,
  maxOutputTokensForModel,
  warnings
}) {
  if (!isCustomReasoning(reasoning)) {
    return void 0;
  }
  if (reasoning === "none") {
    return { thinking: { type: "disabled" } };
  }
  if (supportsAdaptiveThinking) {
    const effort = mapReasoningToProviderEffort({
      reasoning,
      effortMap: {
        minimal: "low",
        low: "low",
        medium: "medium",
        high: "high",
        xhigh: supportsXhighEffort ? "xhigh" : "max"
      },
      warnings
    });
    return { thinking: { type: "adaptive" }, effort };
  }
  const budgetTokens = mapReasoningToProviderBudget({
    reasoning,
    maxOutputTokens: maxOutputTokensForModel,
    maxReasoningBudget: maxOutputTokensForModel,
    warnings
  });
  if (budgetTokens == null) {
    return void 0;
  }
  return { thinking: { type: "enabled", budgetTokens } };
}
function mapAnthropicResponseContextManagement(contextManagement) {
  return contextManagement ? {
    appliedEdits: contextManagement.applied_edits.map((edit) => {
      const strategy = edit.type;
      switch (strategy) {
        case "clear_tool_uses_20250919":
          return {
            type: edit.type,
            clearedToolUses: edit.cleared_tool_uses,
            clearedInputTokens: edit.cleared_input_tokens
          };
        case "clear_thinking_20251015":
          return {
            type: edit.type,
            clearedThinkingTurns: edit.cleared_thinking_turns,
            clearedInputTokens: edit.cleared_input_tokens
          };
        case "compact_20260112":
          return {
            type: edit.type
          };
      }
    }).filter((edit) => edit !== void 0)
  } : null;
}
function mapAnthropicStopDetails(stopDetails) {
  if (stopDetails == null) {
    return void 0;
  }
  return {
    type: stopDetails.type,
    ...stopDetails.category != null ? { category: stopDetails.category } : {},
    ...stopDetails.explanation != null ? { explanation: stopDetails.explanation } : {},
    ...stopDetails.recommended_model != null ? { recommendedModel: stopDetails.recommended_model } : {}
  };
}
function bash_20241022(options = {}) {
  const { execute, ...rest } = options;
  if (execute === void 0) {
    return bash_20241022_internal({
      ...rest,
      execute: async ({ command }, { abortSignal, experimental_sandbox: sandbox }) => {
        if (!sandbox) {
          throw new Error("Sandbox session is not available");
        }
        return await sandbox.run({
          command,
          abortSignal
        });
      }
    });
  }
  return bash_20241022_internal({
    ...rest,
    ...execute === null ? {} : { execute }
  });
}
function bash_20250124(options = {}) {
  const { execute, ...rest } = options;
  if (execute === void 0) {
    return bash_20250124_internal({
      ...rest,
      execute: async ({ command }, { abortSignal, experimental_sandbox: sandbox }) => {
        if (!sandbox) {
          throw new Error("Sandbox session is not available");
        }
        return await sandbox.run({
          command,
          abortSignal
        });
      }
    });
  }
  return bash_20250124_internal({
    ...rest,
    ...execute === null ? {} : { execute }
  });
}
function createAnthropic(options = {}) {
  var _a2, _b2;
  const baseURL = (_a2 = withoutTrailingSlash(
    loadOptionalSetting({
      settingValue: options.baseURL,
      environmentVariableName: "ANTHROPIC_BASE_URL"
    })
  )) != null ? _a2 : "https://api.anthropic.com/v1";
  const providerName = (_b2 = options.name) != null ? _b2 : "anthropic.messages";
  if (options.apiKey && options.authToken) {
    throw new InvalidArgumentError3({
      argument: "apiKey/authToken",
      message: "Both apiKey and authToken were provided. Please use only one authentication method."
    });
  }
  const getHeaders = () => {
    const authHeaders = options.authToken ? { Authorization: `Bearer ${options.authToken}` } : {
      "x-api-key": loadApiKey({
        apiKey: options.apiKey,
        environmentVariableName: "ANTHROPIC_API_KEY",
        description: "Anthropic"
      })
    };
    return withUserAgentSuffix(
      {
        "anthropic-version": "2023-06-01",
        ...authHeaders,
        ...options.headers
      },
      `ai-sdk/anthropic/${VERSION4}`
    );
  };
  const createChatModel = (modelId) => {
    var _a22;
    return new AnthropicLanguageModel(modelId, {
      provider: providerName,
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
      generateId: (_a22 = options.generateId) != null ? _a22 : generateId,
      supportedUrls: () => ({
        "image/*": [/^https?:\/\/.*$/],
        "application/pdf": [/^https?:\/\/.*$/]
      })
    });
  };
  const createSkills = () => new AnthropicSkills({
    provider: `${providerName.replace(".messages", "")}.skills`,
    baseURL,
    headers: getHeaders,
    fetch: options.fetch
  });
  const provider = function(modelId) {
    if (new.target) {
      throw new Error(
        "The Anthropic model function cannot be called with the new keyword."
      );
    }
    return createChatModel(modelId);
  };
  provider.specificationVersion = "v4";
  provider.languageModel = createChatModel;
  provider.chat = createChatModel;
  provider.messages = createChatModel;
  provider.embeddingModel = (modelId) => {
    throw new NoSuchModelError({ modelId, modelType: "embeddingModel" });
  };
  provider.textEmbeddingModel = provider.embeddingModel;
  provider.imageModel = (modelId) => {
    throw new NoSuchModelError({ modelId, modelType: "imageModel" });
  };
  provider.files = () => new AnthropicFiles({
    provider: providerName,
    baseURL,
    headers: getHeaders,
    fetch: options.fetch
  });
  provider.skills = createSkills;
  provider.tools = anthropicTools;
  return provider;
}
function forwardAnthropicContainerIdFromLastStep({
  steps
}) {
  var _a2, _b2, _c;
  for (let i = steps.length - 1; i >= 0; i--) {
    const containerId = (_c = (_b2 = (_a2 = steps[i].providerMetadata) == null ? void 0 : _a2.anthropic) == null ? void 0 : _b2.container) == null ? void 0 : _c.id;
    if (containerId) {
      return {
        providerOptions: {
          anthropic: {
            container: { id: containerId }
          }
        }
      };
    }
  }
  return void 0;
}
var anthropicErrorDataSchema, anthropicFailedResponseHandler, anthropicUploadFileResponseSchema, AnthropicFiles, anthropicStopDetailsSchema, anthropicResponseSchema, anthropicChunkSchema, anthropicReasoningMetadataSchema, anthropicFilePartProviderOptions, anthropicLanguageModelOptions, MAX_CACHE_BREAKPOINTS, CacheControlValidator, advisor_20260301ArgsSchema, advisor_20260301OutputSchema, advisor_20260301InputSchema, factory, advisor_20260301, textEditor_20250728ArgsSchema, textEditor_20250728InputSchema, factory2, textEditor_20250728, webSearch_20260209ArgsSchema, webSearch_20260209OutputSchema, webSearch_20260209InputSchema, factory3, webSearch_20260209, webSearch_20250305ArgsSchema, webSearch_20250305OutputSchema, webSearch_20250305InputSchema, factory4, webSearch_20250305, webFetch_20260209ArgsSchema, webFetch_20260209OutputSchema, webFetch_20260209InputSchema, factory5, webFetch_20260209, webFetch_20250910ArgsSchema, webFetch_20250910OutputSchema, webFetch_20250910InputSchema, factory6, webFetch_20250910, codeExecution_20250522OutputSchema, codeExecution_20250522InputSchema, factory7, codeExecution_20250522, codeExecution_20250825OutputSchema, codeExecution_20250825InputSchema, factory8, codeExecution_20250825, codeExecution_20260120OutputSchema, codeExecution_20260120InputSchema, factory9, codeExecution_20260120, toolSearchRegex_20251119OutputSchema, toolSearchRegex_20251119InputSchema, factory10, toolSearchRegex_20251119, SUPPORTED_STRING_FORMATS, DESCRIPTION_CONSTRAINT_KEYS, AnthropicLanguageModel, bash_20241022InputSchema, bash_20241022_internal, bash_20250124InputSchema, bash_20250124_internal, computer_20241022InputSchema, computer_20241022, computer_20250124InputSchema, computer_20250124, computer_20251124InputSchema, computer_20251124, memory_20250818InputSchema, memory_20250818, textEditor_20241022InputSchema, textEditor_20241022, textEditor_20250124InputSchema, textEditor_20250124, textEditor_20250429InputSchema, textEditor_20250429, toolSearchBm25_20251119OutputSchema, toolSearchBm25_20251119InputSchema, factory11, toolSearchBm25_20251119, anthropicTools, anthropicSkillResponseSchema, anthropicSkillVersionListResponseSchema, anthropicSkillVersionResponseSchema, AnthropicSkills, VERSION4, anthropic;
var init_dist6 = __esm({
  "node_modules/@ai-sdk/anthropic/dist/index.js"() {
    "use strict";
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    init_dist3();
    anthropicErrorDataSchema = lazySchema(
      () => zodSchema(
        z31.object({
          type: z31.literal("error"),
          error: z31.object({
            type: z31.string(),
            message: z31.string()
          })
        })
      )
    );
    anthropicFailedResponseHandler = createJsonErrorResponseHandler({
      errorSchema: anthropicErrorDataSchema,
      errorToMessage: (data) => data.error.message
    });
    anthropicUploadFileResponseSchema = lazySchema(
      () => zodSchema(
        z211.object({
          id: z211.string(),
          type: z211.literal("file"),
          filename: z211.string(),
          mime_type: z211.string(),
          size_bytes: z211.number(),
          created_at: z211.string(),
          downloadable: z211.boolean().nullish()
        })
      )
    );
    AnthropicFiles = class {
      constructor(config) {
        this.config = config;
        this.specificationVersion = "v4";
      }
      get provider() {
        return this.config.provider;
      }
      async uploadFile({
        data,
        mediaType,
        filename
      }) {
        var _a2, _b2;
        const fileBytes = convertInlineFileDataToUint8Array(data);
        const blob = new Blob([fileBytes], { type: mediaType });
        const formData = new FormData();
        if (filename != null) {
          formData.append("file", blob, filename);
        } else {
          formData.append("file", blob);
        }
        const { value: response } = await postFormDataToApi({
          url: `${this.config.baseURL}/files`,
          headers: combineHeaders(this.config.headers(), {
            "anthropic-beta": "files-api-2025-04-14"
          }),
          formData,
          failedResponseHandler: anthropicFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            anthropicUploadFileResponseSchema
          ),
          fetch: this.config.fetch
        });
        return {
          warnings: [],
          providerReference: { anthropic: response.id },
          mediaType: (_a2 = response.mime_type) != null ? _a2 : mediaType,
          filename: (_b2 = response.filename) != null ? _b2 : filename,
          providerMetadata: {
            anthropic: {
              filename: response.filename,
              mimeType: response.mime_type,
              sizeBytes: response.size_bytes,
              createdAt: response.created_at,
              ...response.downloadable != null ? { downloadable: response.downloadable } : {}
            }
          }
        };
      }
    };
    anthropicStopDetailsSchema = z33.object({
      type: z33.string(),
      category: z33.string().nullish(),
      explanation: z33.string().nullish(),
      recommended_model: z33.string().nullish()
    });
    anthropicResponseSchema = lazySchema(
      () => zodSchema(
        z33.object({
          type: z33.literal("message"),
          id: z33.string().nullish(),
          model: z33.string().nullish(),
          content: z33.array(
            z33.discriminatedUnion("type", [
              z33.object({
                type: z33.literal("text"),
                text: z33.string(),
                citations: z33.array(
                  z33.discriminatedUnion("type", [
                    z33.object({
                      type: z33.literal("web_search_result_location"),
                      cited_text: z33.string(),
                      url: z33.string(),
                      title: z33.string(),
                      encrypted_index: z33.string()
                    }),
                    z33.object({
                      type: z33.literal("page_location"),
                      cited_text: z33.string(),
                      document_index: z33.number(),
                      document_title: z33.string().nullable(),
                      start_page_number: z33.number(),
                      end_page_number: z33.number()
                    }),
                    z33.object({
                      type: z33.literal("char_location"),
                      cited_text: z33.string(),
                      document_index: z33.number(),
                      document_title: z33.string().nullable(),
                      start_char_index: z33.number(),
                      end_char_index: z33.number()
                    })
                  ])
                ).optional()
              }),
              z33.object({
                type: z33.literal("thinking"),
                thinking: z33.string(),
                signature: z33.string()
              }),
              z33.object({
                type: z33.literal("redacted_thinking"),
                data: z33.string()
              }),
              z33.object({
                type: z33.literal("compaction"),
                content: z33.string()
              }),
              z33.object({
                type: z33.literal("tool_use"),
                id: z33.string(),
                name: z33.string(),
                input: z33.unknown(),
                // Programmatic tool calling: caller info when triggered from code execution
                caller: z33.union([
                  z33.object({
                    type: z33.literal("code_execution_20250825"),
                    tool_id: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("code_execution_20260120"),
                    tool_id: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("direct")
                  })
                ]).optional()
              }),
              z33.object({
                type: z33.literal("server_tool_use"),
                id: z33.string(),
                name: z33.string(),
                input: z33.record(z33.string(), z33.unknown()).nullish(),
                caller: z33.union([
                  z33.object({
                    type: z33.literal("code_execution_20260120"),
                    tool_id: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("direct")
                  })
                ]).optional()
              }),
              z33.object({
                type: z33.literal("mcp_tool_use"),
                id: z33.string(),
                name: z33.string(),
                input: z33.unknown(),
                server_name: z33.string()
              }),
              z33.object({
                type: z33.literal("mcp_tool_result"),
                tool_use_id: z33.string(),
                is_error: z33.boolean(),
                content: z33.array(
                  z33.union([
                    z33.string(),
                    z33.object({ type: z33.literal("text"), text: z33.string() })
                  ])
                )
              }),
              z33.object({
                type: z33.literal("web_fetch_tool_result"),
                tool_use_id: z33.string(),
                content: z33.union([
                  z33.object({
                    type: z33.literal("web_fetch_result"),
                    url: z33.string(),
                    retrieved_at: z33.string(),
                    content: z33.object({
                      type: z33.literal("document"),
                      title: z33.string().nullable(),
                      citations: z33.object({ enabled: z33.boolean() }).optional(),
                      source: z33.union([
                        z33.object({
                          type: z33.literal("base64"),
                          media_type: z33.literal("application/pdf"),
                          data: z33.string()
                        }),
                        z33.object({
                          type: z33.literal("text"),
                          media_type: z33.literal("text/plain"),
                          data: z33.string()
                        })
                      ])
                    })
                  }),
                  z33.object({
                    type: z33.literal("web_fetch_tool_result_error"),
                    error_code: z33.string()
                  })
                ])
              }),
              z33.object({
                type: z33.literal("web_search_tool_result"),
                tool_use_id: z33.string(),
                content: z33.union([
                  z33.array(
                    z33.object({
                      type: z33.literal("web_search_result"),
                      url: z33.string(),
                      title: z33.string(),
                      encrypted_content: z33.string(),
                      page_age: z33.string().nullish()
                    })
                  ),
                  z33.object({
                    type: z33.literal("web_search_tool_result_error"),
                    error_code: z33.string()
                  })
                ])
              }),
              // code execution results for code_execution_20250522 tool:
              z33.object({
                type: z33.literal("code_execution_tool_result"),
                tool_use_id: z33.string(),
                content: z33.union([
                  z33.object({
                    type: z33.literal("code_execution_result"),
                    stdout: z33.string(),
                    stderr: z33.string(),
                    return_code: z33.number(),
                    content: z33.array(
                      z33.object({
                        type: z33.literal("code_execution_output"),
                        file_id: z33.string()
                      })
                    ).optional().default([])
                  }),
                  z33.object({
                    type: z33.literal("encrypted_code_execution_result"),
                    encrypted_stdout: z33.string(),
                    stderr: z33.string(),
                    return_code: z33.number(),
                    content: z33.array(
                      z33.object({
                        type: z33.literal("code_execution_output"),
                        file_id: z33.string()
                      })
                    ).optional().default([])
                  }),
                  z33.object({
                    type: z33.literal("code_execution_tool_result_error"),
                    error_code: z33.string()
                  })
                ])
              }),
              // bash code execution results for code_execution_20250825 tool:
              z33.object({
                type: z33.literal("bash_code_execution_tool_result"),
                tool_use_id: z33.string(),
                content: z33.discriminatedUnion("type", [
                  z33.object({
                    type: z33.literal("bash_code_execution_result"),
                    content: z33.array(
                      z33.object({
                        type: z33.literal("bash_code_execution_output"),
                        file_id: z33.string()
                      })
                    ),
                    stdout: z33.string(),
                    stderr: z33.string(),
                    return_code: z33.number()
                  }),
                  z33.object({
                    type: z33.literal("bash_code_execution_tool_result_error"),
                    error_code: z33.string()
                  })
                ])
              }),
              // text editor code execution results for code_execution_20250825 tool:
              z33.object({
                type: z33.literal("text_editor_code_execution_tool_result"),
                tool_use_id: z33.string(),
                content: z33.discriminatedUnion("type", [
                  z33.object({
                    type: z33.literal("text_editor_code_execution_tool_result_error"),
                    error_code: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("text_editor_code_execution_view_result"),
                    content: z33.string(),
                    file_type: z33.string(),
                    num_lines: z33.number().nullable(),
                    start_line: z33.number().nullable(),
                    total_lines: z33.number().nullable()
                  }),
                  z33.object({
                    type: z33.literal("text_editor_code_execution_create_result"),
                    is_file_update: z33.boolean()
                  }),
                  z33.object({
                    type: z33.literal(
                      "text_editor_code_execution_str_replace_result"
                    ),
                    lines: z33.array(z33.string()).nullable(),
                    new_lines: z33.number().nullable(),
                    new_start: z33.number().nullable(),
                    old_lines: z33.number().nullable(),
                    old_start: z33.number().nullable()
                  })
                ])
              }),
              // tool search tool results for tool_search_tool_regex_20251119 and tool_search_tool_bm25_20251119:
              z33.object({
                type: z33.literal("tool_search_tool_result"),
                tool_use_id: z33.string(),
                content: z33.union([
                  z33.object({
                    type: z33.literal("tool_search_tool_search_result"),
                    tool_references: z33.array(
                      z33.object({
                        type: z33.literal("tool_reference"),
                        tool_name: z33.string()
                      })
                    )
                  }),
                  z33.object({
                    type: z33.literal("tool_search_tool_result_error"),
                    error_code: z33.string()
                  })
                ])
              }),
              // advisor results for advisor_20260301:
              z33.object({
                type: z33.literal("advisor_tool_result"),
                tool_use_id: z33.string(),
                content: z33.discriminatedUnion("type", [
                  z33.object({
                    type: z33.literal("advisor_result"),
                    text: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("advisor_redacted_result"),
                    encrypted_content: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("advisor_tool_result_error"),
                    error_code: z33.string()
                  })
                ])
              }),
              // Server-side fallback marker. Parsed so the response validates, but
              // dropped from the content output (the AI SDK has no model-hop
              // primitive). The hop remains observable via usage.iterations.
              z33.object({
                type: z33.literal("fallback")
              })
            ])
          ),
          stop_reason: z33.string().nullish(),
          stop_sequence: z33.string().nullish(),
          stop_details: anthropicStopDetailsSchema.nullish(),
          usage: z33.looseObject({
            input_tokens: z33.number(),
            output_tokens: z33.number(),
            cache_creation_input_tokens: z33.number().nullish(),
            cache_read_input_tokens: z33.number().nullish(),
            iterations: z33.array(
              z33.object({
                type: z33.union([
                  z33.literal("compaction"),
                  z33.literal("message"),
                  z33.literal("advisor_message"),
                  z33.literal("fallback_message")
                ]),
                model: z33.string().nullish(),
                input_tokens: z33.number(),
                output_tokens: z33.number(),
                cache_creation_input_tokens: z33.number().nullish(),
                cache_read_input_tokens: z33.number().nullish()
              })
            ).nullish()
          }),
          container: z33.object({
            expires_at: z33.string(),
            id: z33.string(),
            skills: z33.array(
              z33.object({
                type: z33.union([z33.literal("anthropic"), z33.literal("custom")]),
                skill_id: z33.string(),
                version: z33.string()
              })
            ).nullish()
          }).nullish(),
          context_management: z33.object({
            applied_edits: z33.array(
              z33.union([
                z33.object({
                  type: z33.literal("clear_tool_uses_20250919"),
                  cleared_tool_uses: z33.number(),
                  cleared_input_tokens: z33.number()
                }),
                z33.object({
                  type: z33.literal("clear_thinking_20251015"),
                  cleared_thinking_turns: z33.number(),
                  cleared_input_tokens: z33.number()
                }),
                z33.object({
                  type: z33.literal("compact_20260112")
                })
              ])
            )
          }).nullish()
        })
      )
    );
    anthropicChunkSchema = lazySchema(
      () => zodSchema(
        z33.discriminatedUnion("type", [
          z33.object({
            type: z33.literal("message_start"),
            message: z33.object({
              id: z33.string().nullish(),
              model: z33.string().nullish(),
              role: z33.string().nullish(),
              usage: z33.looseObject({
                input_tokens: z33.number(),
                cache_creation_input_tokens: z33.number().nullish(),
                cache_read_input_tokens: z33.number().nullish()
              }),
              // Programmatic tool calling: content may be pre-populated for deferred tool calls
              content: z33.array(
                z33.discriminatedUnion("type", [
                  z33.object({
                    type: z33.literal("tool_use"),
                    id: z33.string(),
                    name: z33.string(),
                    input: z33.unknown(),
                    caller: z33.union([
                      z33.object({
                        type: z33.literal("code_execution_20250825"),
                        tool_id: z33.string()
                      }),
                      z33.object({
                        type: z33.literal("code_execution_20260120"),
                        tool_id: z33.string()
                      }),
                      z33.object({
                        type: z33.literal("direct")
                      })
                    ]).optional()
                  })
                ])
              ).nullish(),
              stop_reason: z33.string().nullish(),
              container: z33.object({
                expires_at: z33.string(),
                id: z33.string()
              }).nullish()
            })
          }),
          z33.object({
            type: z33.literal("content_block_start"),
            index: z33.number(),
            content_block: z33.discriminatedUnion("type", [
              z33.object({
                type: z33.literal("text"),
                text: z33.string()
              }),
              z33.object({
                type: z33.literal("thinking"),
                thinking: z33.string()
              }),
              z33.object({
                type: z33.literal("tool_use"),
                id: z33.string(),
                name: z33.string(),
                // Programmatic tool calling: input may be present directly for deferred tool calls
                input: z33.record(z33.string(), z33.unknown()).optional(),
                // Programmatic tool calling: caller info when triggered from code execution
                caller: z33.union([
                  z33.object({
                    type: z33.literal("code_execution_20250825"),
                    tool_id: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("code_execution_20260120"),
                    tool_id: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("direct")
                  })
                ]).optional()
              }),
              z33.object({
                type: z33.literal("redacted_thinking"),
                data: z33.string()
              }),
              z33.object({
                type: z33.literal("compaction"),
                content: z33.string().nullish()
              }),
              z33.object({
                type: z33.literal("server_tool_use"),
                id: z33.string(),
                name: z33.string(),
                input: z33.record(z33.string(), z33.unknown()).nullish(),
                caller: z33.union([
                  z33.object({
                    type: z33.literal("code_execution_20260120"),
                    tool_id: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("direct")
                  })
                ]).optional()
              }),
              z33.object({
                type: z33.literal("mcp_tool_use"),
                id: z33.string(),
                name: z33.string(),
                input: z33.unknown(),
                server_name: z33.string()
              }),
              z33.object({
                type: z33.literal("mcp_tool_result"),
                tool_use_id: z33.string(),
                is_error: z33.boolean(),
                content: z33.array(
                  z33.union([
                    z33.string(),
                    z33.object({ type: z33.literal("text"), text: z33.string() })
                  ])
                )
              }),
              z33.object({
                type: z33.literal("web_fetch_tool_result"),
                tool_use_id: z33.string(),
                content: z33.union([
                  z33.object({
                    type: z33.literal("web_fetch_result"),
                    url: z33.string(),
                    retrieved_at: z33.string(),
                    content: z33.object({
                      type: z33.literal("document"),
                      title: z33.string().nullable(),
                      citations: z33.object({ enabled: z33.boolean() }).optional(),
                      source: z33.union([
                        z33.object({
                          type: z33.literal("base64"),
                          media_type: z33.literal("application/pdf"),
                          data: z33.string()
                        }),
                        z33.object({
                          type: z33.literal("text"),
                          media_type: z33.literal("text/plain"),
                          data: z33.string()
                        })
                      ])
                    })
                  }),
                  z33.object({
                    type: z33.literal("web_fetch_tool_result_error"),
                    error_code: z33.string()
                  })
                ])
              }),
              z33.object({
                type: z33.literal("web_search_tool_result"),
                tool_use_id: z33.string(),
                content: z33.union([
                  z33.array(
                    z33.object({
                      type: z33.literal("web_search_result"),
                      url: z33.string(),
                      title: z33.string(),
                      encrypted_content: z33.string(),
                      page_age: z33.string().nullish()
                    })
                  ),
                  z33.object({
                    type: z33.literal("web_search_tool_result_error"),
                    error_code: z33.string()
                  })
                ])
              }),
              // code execution results for code_execution_20250522 tool:
              z33.object({
                type: z33.literal("code_execution_tool_result"),
                tool_use_id: z33.string(),
                content: z33.union([
                  z33.object({
                    type: z33.literal("code_execution_result"),
                    stdout: z33.string(),
                    stderr: z33.string(),
                    return_code: z33.number(),
                    content: z33.array(
                      z33.object({
                        type: z33.literal("code_execution_output"),
                        file_id: z33.string()
                      })
                    ).optional().default([])
                  }),
                  z33.object({
                    type: z33.literal("encrypted_code_execution_result"),
                    encrypted_stdout: z33.string(),
                    stderr: z33.string(),
                    return_code: z33.number(),
                    content: z33.array(
                      z33.object({
                        type: z33.literal("code_execution_output"),
                        file_id: z33.string()
                      })
                    ).optional().default([])
                  }),
                  z33.object({
                    type: z33.literal("code_execution_tool_result_error"),
                    error_code: z33.string()
                  })
                ])
              }),
              // bash code execution results for code_execution_20250825 tool:
              z33.object({
                type: z33.literal("bash_code_execution_tool_result"),
                tool_use_id: z33.string(),
                content: z33.discriminatedUnion("type", [
                  z33.object({
                    type: z33.literal("bash_code_execution_result"),
                    content: z33.array(
                      z33.object({
                        type: z33.literal("bash_code_execution_output"),
                        file_id: z33.string()
                      })
                    ),
                    stdout: z33.string(),
                    stderr: z33.string(),
                    return_code: z33.number()
                  }),
                  z33.object({
                    type: z33.literal("bash_code_execution_tool_result_error"),
                    error_code: z33.string()
                  })
                ])
              }),
              // text editor code execution results for code_execution_20250825 tool:
              z33.object({
                type: z33.literal("text_editor_code_execution_tool_result"),
                tool_use_id: z33.string(),
                content: z33.discriminatedUnion("type", [
                  z33.object({
                    type: z33.literal("text_editor_code_execution_tool_result_error"),
                    error_code: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("text_editor_code_execution_view_result"),
                    content: z33.string(),
                    file_type: z33.string(),
                    num_lines: z33.number().nullable(),
                    start_line: z33.number().nullable(),
                    total_lines: z33.number().nullable()
                  }),
                  z33.object({
                    type: z33.literal("text_editor_code_execution_create_result"),
                    is_file_update: z33.boolean()
                  }),
                  z33.object({
                    type: z33.literal(
                      "text_editor_code_execution_str_replace_result"
                    ),
                    lines: z33.array(z33.string()).nullable(),
                    new_lines: z33.number().nullable(),
                    new_start: z33.number().nullable(),
                    old_lines: z33.number().nullable(),
                    old_start: z33.number().nullable()
                  })
                ])
              }),
              // tool search tool results for tool_search_tool_regex_20251119 and tool_search_tool_bm25_20251119:
              z33.object({
                type: z33.literal("tool_search_tool_result"),
                tool_use_id: z33.string(),
                content: z33.union([
                  z33.object({
                    type: z33.literal("tool_search_tool_search_result"),
                    tool_references: z33.array(
                      z33.object({
                        type: z33.literal("tool_reference"),
                        tool_name: z33.string()
                      })
                    )
                  }),
                  z33.object({
                    type: z33.literal("tool_search_tool_result_error"),
                    error_code: z33.string()
                  })
                ])
              }),
              // advisor results for advisor_20260301:
              z33.object({
                type: z33.literal("advisor_tool_result"),
                tool_use_id: z33.string(),
                content: z33.discriminatedUnion("type", [
                  z33.object({
                    type: z33.literal("advisor_result"),
                    text: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("advisor_redacted_result"),
                    encrypted_content: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("advisor_tool_result_error"),
                    error_code: z33.string()
                  })
                ])
              }),
              // Server-side fallback marker; dropped from content output (see the
              // response schema). The hop remains observable via usage.iterations.
              z33.object({
                type: z33.literal("fallback")
              })
            ])
          }),
          z33.object({
            type: z33.literal("content_block_delta"),
            index: z33.number(),
            delta: z33.discriminatedUnion("type", [
              z33.object({
                type: z33.literal("input_json_delta"),
                partial_json: z33.string()
              }),
              z33.object({
                type: z33.literal("text_delta"),
                text: z33.string()
              }),
              z33.object({
                type: z33.literal("thinking_delta"),
                thinking: z33.string()
              }),
              z33.object({
                type: z33.literal("signature_delta"),
                signature: z33.string()
              }),
              z33.object({
                type: z33.literal("compaction_delta"),
                content: z33.string().nullish()
              }),
              z33.object({
                type: z33.literal("citations_delta"),
                citation: z33.discriminatedUnion("type", [
                  z33.object({
                    type: z33.literal("web_search_result_location"),
                    cited_text: z33.string(),
                    url: z33.string(),
                    title: z33.string(),
                    encrypted_index: z33.string()
                  }),
                  z33.object({
                    type: z33.literal("page_location"),
                    cited_text: z33.string(),
                    document_index: z33.number(),
                    document_title: z33.string().nullable(),
                    start_page_number: z33.number(),
                    end_page_number: z33.number()
                  }),
                  z33.object({
                    type: z33.literal("char_location"),
                    cited_text: z33.string(),
                    document_index: z33.number(),
                    document_title: z33.string().nullable(),
                    start_char_index: z33.number(),
                    end_char_index: z33.number()
                  })
                ])
              })
            ])
          }),
          z33.object({
            type: z33.literal("content_block_stop"),
            index: z33.number()
          }),
          z33.object({
            type: z33.literal("error"),
            error: z33.object({
              type: z33.string(),
              message: z33.string()
            })
          }),
          z33.object({
            type: z33.literal("message_delta"),
            delta: z33.object({
              stop_reason: z33.string().nullish(),
              stop_sequence: z33.string().nullish(),
              stop_details: anthropicStopDetailsSchema.nullish(),
              container: z33.object({
                expires_at: z33.string(),
                id: z33.string(),
                skills: z33.array(
                  z33.object({
                    type: z33.union([
                      z33.literal("anthropic"),
                      z33.literal("custom")
                    ]),
                    skill_id: z33.string(),
                    version: z33.string()
                  })
                ).nullish()
              }).nullish()
            }),
            usage: z33.looseObject({
              input_tokens: z33.number().nullish(),
              output_tokens: z33.number(),
              cache_creation_input_tokens: z33.number().nullish(),
              cache_read_input_tokens: z33.number().nullish(),
              iterations: z33.array(
                z33.object({
                  type: z33.union([
                    z33.literal("compaction"),
                    z33.literal("message"),
                    z33.literal("advisor_message"),
                    z33.literal("fallback_message")
                  ]),
                  model: z33.string().nullish(),
                  input_tokens: z33.number(),
                  output_tokens: z33.number(),
                  cache_creation_input_tokens: z33.number().nullish(),
                  cache_read_input_tokens: z33.number().nullish()
                })
              ).nullish()
            }),
            context_management: z33.object({
              applied_edits: z33.array(
                z33.union([
                  z33.object({
                    type: z33.literal("clear_tool_uses_20250919"),
                    cleared_tool_uses: z33.number(),
                    cleared_input_tokens: z33.number()
                  }),
                  z33.object({
                    type: z33.literal("clear_thinking_20251015"),
                    cleared_thinking_turns: z33.number(),
                    cleared_input_tokens: z33.number()
                  }),
                  z33.object({
                    type: z33.literal("compact_20260112")
                  })
                ])
              )
            }).nullish()
          }),
          z33.object({
            type: z33.literal("message_stop")
          }),
          z33.object({
            type: z33.literal("ping")
          })
        ])
      )
    );
    anthropicReasoningMetadataSchema = lazySchema(
      () => zodSchema(
        z33.object({
          signature: z33.string().optional(),
          redactedData: z33.string().optional()
        })
      )
    );
    anthropicFilePartProviderOptions = z44.object({
      /**
       * Upload this file into the code execution container instead of sending it as
       * a normal document or image content block.
       */
      containerUpload: z44.boolean().optional(),
      /**
       * Citation configuration for this document.
       * When enabled, this document will generate citations in the response.
       */
      citations: z44.object({
        /**
         * Enable citations for this document
         */
        enabled: z44.boolean()
      }).optional(),
      /**
       * Custom title for the document.
       * If not provided, the filename will be used.
       */
      title: z44.string().optional(),
      /**
       * Context about the document that will be passed to the model
       * but not used towards cited content.
       * Useful for storing document metadata as text or stringified JSON.
       */
      context: z44.string().optional()
    });
    anthropicLanguageModelOptions = z44.object({
      /**
       * Whether to send reasoning to the model.
       *
       * This allows you to deactivate reasoning inputs for models that do not support them.
       */
      sendReasoning: z44.boolean().optional(),
      /**
       * Determines how structured outputs are generated.
       *
       * - `outputFormat`: Use the `output_config.format` parameter to specify the structured output format.
       * - `jsonTool`: Use a special 'json' tool to specify the structured output format.
       * - `auto`: Use 'outputFormat' when supported, otherwise use 'jsonTool' (default).
       */
      structuredOutputMode: z44.enum(["outputFormat", "jsonTool", "auto"]).optional(),
      /**
       * Configuration for enabling Claude's extended thinking.
       *
       * When enabled, responses include thinking content blocks showing Claude's thinking process before the final answer.
       * Requires a minimum budget of 1,024 tokens and counts towards the `max_tokens` limit.
       */
      thinking: z44.discriminatedUnion("type", [
        z44.object({
          /** for Sonnet 4.6, Opus 4.6, and newer models */
          type: z44.literal("adaptive"),
          /**
           * Controls whether thinking content is included in the response.
           * - `"omitted"`: Thinking blocks are present but text is empty (default for Opus 4.7+).
           * - `"summarized"`: Thinking content is returned. Required to see reasoning output.
           */
          display: z44.enum(["omitted", "summarized"]).optional()
        }),
        z44.object({
          /** for models before Opus 4.6, except Sonnet 4.6 still supports it */
          type: z44.literal("enabled"),
          budgetTokens: z44.number().optional()
        }),
        z44.object({
          type: z44.literal("disabled")
        })
      ]).optional(),
      /**
       * Whether to disable parallel function calling during tool use. Default is false.
       * When set to true, Claude will use at most one tool per response.
       */
      disableParallelToolUse: z44.boolean().optional(),
      /**
       * Cache control settings for this message.
       * See https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
       */
      cacheControl: z44.object({
        type: z44.literal("ephemeral"),
        ttl: z44.union([z44.literal("5m"), z44.literal("1h")]).optional()
      }).optional(),
      /**
       * Metadata to include with the request.
       *
       * See https://platform.claude.com/docs/en/api/messages/create for details.
       */
      metadata: z44.object({
        /**
         * An external identifier for the user associated with the request.
         *
         * Should be a UUID, hash value, or other opaque identifier.
         * Must not contain PII (name, email, phone number, etc.).
         */
        userId: z44.string().optional()
      }).optional(),
      /**
       * MCP servers to be utilized in this request.
       */
      mcpServers: z44.array(
        z44.object({
          type: z44.literal("url"),
          name: z44.string(),
          url: z44.string(),
          authorizationToken: z44.string().nullish(),
          toolConfiguration: z44.object({
            enabled: z44.boolean().nullish(),
            allowedTools: z44.array(z44.string()).nullish()
          }).nullish()
        })
      ).optional(),
      /**
       * Agent Skills configuration. Skills enable Claude to perform specialized tasks
       * like document processing (PPTX, DOCX, PDF, XLSX) and data analysis.
       * Requires code execution tool to be enabled.
       */
      container: z44.object({
        id: z44.string().optional(),
        skills: z44.array(
          z44.discriminatedUnion("type", [
            z44.object({
              type: z44.literal("anthropic"),
              skillId: z44.string(),
              version: z44.string().optional()
            }),
            z44.object({
              type: z44.literal("custom"),
              providerReference: z44.record(z44.string(), z44.string()),
              version: z44.string().optional()
            })
          ])
        ).optional()
      }).optional(),
      /**
       * Whether to enable fine-grained (eager) streaming of tool call inputs
       * and structured outputs for every function tool in the request. When
       * true (the default), each function tool receives a default of
       * `eager_input_streaming: true` unless it explicitly sets
       * `providerOptions.anthropic.eagerInputStreaming`.
       *
       * @default true
       */
      toolStreaming: z44.boolean().optional(),
      /**
       * @default 'high'
       */
      effort: z44.enum(["low", "medium", "high", "xhigh", "max"]).optional(),
      /**
       * Task budget for agentic turns. Informs the model of the total token budget
       * available for the current task, allowing it to prioritize work and wind down
       * gracefully as the budget is consumed.
       *
       * Advisory only — does not enforce a hard token limit.
       */
      taskBudget: z44.object({
        type: z44.literal("tokens"),
        total: z44.number().int().min(2e4),
        remaining: z44.number().int().min(0).optional()
      }).optional(),
      /**
       * Enable fast mode for faster inference (2.5x faster output token speeds).
       * Only supported with claude-opus-4-6.
       */
      speed: z44.enum(["fast", "standard"]).optional(),
      /**
       * Controls where model inference runs for this request.
       *
       * - `"global"`: Inference may run in any available geography (default).
       * - `"us"`: Inference runs only in US-based infrastructure.
       *
       * See https://platform.claude.com/docs/en/build-with-claude/data-residency
       */
      inferenceGeo: z44.enum(["us", "global"]).optional(),
      /**
       * Server-side fallback chain.
       *
       * When the primary model's safety classifiers block a turn, the API
       * automatically retries it on the next model in the chain, server-side. A
       * `content-filter` finish reason means the entire chain refused.
       *
       * Each entry is merged into the request as a direct request to that entry's
       * model, so it must be formatted accordingly: `model` is required, and an
       * entry may additionally override `max_tokens`, `thinking`, `output_config`,
       * and `speed` for that attempt only (`speed` additionally requires the speed
       * beta). The value is passed through to the API as-is.
       *
       * The required `server-side-fallback-2026-06-01` beta is added automatically
       * when this option is set.
       */
      fallbacks: z44.array(
        z44.object({
          model: z44.string(),
          max_tokens: z44.number().int().optional(),
          thinking: z44.record(z44.string(), z44.unknown()).optional(),
          output_config: z44.record(z44.string(), z44.unknown()).optional(),
          speed: z44.enum(["fast", "standard"]).optional()
        })
      ).optional(),
      /**
       * A set of beta features to enable.
       * Allow a provider to receive the full `betas` set if it needs it.
       */
      anthropicBeta: z44.array(z44.string()).optional(),
      contextManagement: z44.object({
        edits: z44.array(
          z44.discriminatedUnion("type", [
            z44.object({
              type: z44.literal("clear_tool_uses_20250919"),
              trigger: z44.discriminatedUnion("type", [
                z44.object({
                  type: z44.literal("input_tokens"),
                  value: z44.number()
                }),
                z44.object({
                  type: z44.literal("tool_uses"),
                  value: z44.number()
                })
              ]).optional(),
              keep: z44.object({
                type: z44.literal("tool_uses"),
                value: z44.number()
              }).optional(),
              clearAtLeast: z44.object({
                type: z44.literal("input_tokens"),
                value: z44.number()
              }).optional(),
              clearToolInputs: z44.boolean().optional(),
              excludeTools: z44.array(z44.string()).optional()
            }),
            z44.object({
              type: z44.literal("clear_thinking_20251015"),
              keep: z44.union([
                z44.literal("all"),
                z44.object({
                  type: z44.literal("thinking_turns"),
                  value: z44.number()
                })
              ]).optional()
            }),
            z44.object({
              type: z44.literal("compact_20260112"),
              trigger: z44.object({
                type: z44.literal("input_tokens"),
                value: z44.number()
              }).optional(),
              pauseAfterCompaction: z44.boolean().optional(),
              instructions: z44.string().optional()
            })
          ])
        )
      }).optional()
    });
    MAX_CACHE_BREAKPOINTS = 4;
    CacheControlValidator = class {
      constructor() {
        this.breakpointCount = 0;
        this.warnings = [];
      }
      getCacheControl(providerMetadata, context) {
        const cacheControlValue = getCacheControl(providerMetadata);
        if (!cacheControlValue) {
          return void 0;
        }
        if (!context.canCache) {
          this.warnings.push({
            type: "unsupported",
            feature: "cache_control on non-cacheable context",
            details: `cache_control cannot be set on ${context.type}. It will be ignored.`
          });
          return void 0;
        }
        this.breakpointCount++;
        if (this.breakpointCount > MAX_CACHE_BREAKPOINTS) {
          this.warnings.push({
            type: "unsupported",
            feature: "cacheControl breakpoint limit",
            details: `Maximum ${MAX_CACHE_BREAKPOINTS} cache breakpoints exceeded (found ${this.breakpointCount}). This breakpoint will be ignored.`
          });
          return void 0;
        }
        return cacheControlValue;
      }
      getWarnings() {
        return this.warnings;
      }
    };
    advisor_20260301ArgsSchema = lazySchema(
      () => zodSchema(
        z53.object({
          model: z53.string(),
          maxUses: z53.number().optional(),
          caching: z53.object({
            type: z53.literal("ephemeral"),
            ttl: z53.union([z53.literal("5m"), z53.literal("1h")])
          }).optional()
        })
      )
    );
    advisor_20260301OutputSchema = lazySchema(
      () => zodSchema(
        z53.discriminatedUnion("type", [
          z53.object({
            type: z53.literal("advisor_result"),
            text: z53.string()
          }),
          z53.object({
            type: z53.literal("advisor_redacted_result"),
            encryptedContent: z53.string()
          }),
          z53.object({
            type: z53.literal("advisor_tool_result_error"),
            errorCode: z53.string()
          })
        ])
      )
    );
    advisor_20260301InputSchema = lazySchema(
      () => zodSchema(z53.object({}).strict())
    );
    factory = createProviderExecutedToolFactory({
      id: "anthropic.advisor_20260301",
      inputSchema: advisor_20260301InputSchema,
      outputSchema: advisor_20260301OutputSchema,
      supportsDeferredResults: true
    });
    advisor_20260301 = (args) => {
      return factory(args);
    };
    textEditor_20250728ArgsSchema = lazySchema(
      () => zodSchema(
        z63.object({
          maxCharacters: z63.number().optional()
        })
      )
    );
    textEditor_20250728InputSchema = lazySchema(
      () => zodSchema(
        z63.object({
          command: z63.enum(["view", "create", "str_replace", "insert"]),
          path: z63.string(),
          file_text: z63.string().optional(),
          insert_line: z63.number().int().optional(),
          new_str: z63.string().optional(),
          insert_text: z63.string().optional(),
          old_str: z63.string().optional(),
          view_range: z63.array(z63.number().int()).optional()
        })
      )
    );
    factory2 = createProviderDefinedToolFactory({
      id: "anthropic.text_editor_20250728",
      inputSchema: textEditor_20250728InputSchema
    });
    textEditor_20250728 = (args = {}) => {
      return factory2(args);
    };
    webSearch_20260209ArgsSchema = lazySchema(
      () => zodSchema(
        z73.object({
          maxUses: z73.number().optional(),
          allowedDomains: z73.array(z73.string()).optional(),
          blockedDomains: z73.array(z73.string()).optional(),
          userLocation: z73.object({
            type: z73.literal("approximate"),
            city: z73.string().optional(),
            region: z73.string().optional(),
            country: z73.string().optional(),
            timezone: z73.string().optional()
          }).optional()
        })
      )
    );
    webSearch_20260209OutputSchema = lazySchema(
      () => zodSchema(
        z73.array(
          z73.object({
            url: z73.string(),
            title: z73.string().nullable(),
            pageAge: z73.string().nullable(),
            encryptedContent: z73.string(),
            type: z73.literal("web_search_result")
          })
        )
      )
    );
    webSearch_20260209InputSchema = lazySchema(
      () => zodSchema(
        z73.object({
          query: z73.string()
        })
      )
    );
    factory3 = createProviderExecutedToolFactory({
      id: "anthropic.web_search_20260209",
      inputSchema: webSearch_20260209InputSchema,
      outputSchema: webSearch_20260209OutputSchema,
      supportsDeferredResults: true
    });
    webSearch_20260209 = (args = {}) => {
      return factory3(args);
    };
    webSearch_20250305ArgsSchema = lazySchema(
      () => zodSchema(
        z83.object({
          maxUses: z83.number().optional(),
          allowedDomains: z83.array(z83.string()).optional(),
          blockedDomains: z83.array(z83.string()).optional(),
          userLocation: z83.object({
            type: z83.literal("approximate"),
            city: z83.string().optional(),
            region: z83.string().optional(),
            country: z83.string().optional(),
            timezone: z83.string().optional()
          }).optional()
        })
      )
    );
    webSearch_20250305OutputSchema = lazySchema(
      () => zodSchema(
        z83.array(
          z83.object({
            url: z83.string(),
            title: z83.string().nullable(),
            pageAge: z83.string().nullable(),
            encryptedContent: z83.string(),
            type: z83.literal("web_search_result")
          })
        )
      )
    );
    webSearch_20250305InputSchema = lazySchema(
      () => zodSchema(
        z83.object({
          query: z83.string()
        })
      )
    );
    factory4 = createProviderExecutedToolFactory({
      id: "anthropic.web_search_20250305",
      inputSchema: webSearch_20250305InputSchema,
      outputSchema: webSearch_20250305OutputSchema,
      supportsDeferredResults: true
    });
    webSearch_20250305 = (args = {}) => {
      return factory4(args);
    };
    webFetch_20260209ArgsSchema = lazySchema(
      () => zodSchema(
        z93.object({
          maxUses: z93.number().optional(),
          allowedDomains: z93.array(z93.string()).optional(),
          blockedDomains: z93.array(z93.string()).optional(),
          citations: z93.object({ enabled: z93.boolean() }).optional(),
          maxContentTokens: z93.number().optional()
        })
      )
    );
    webFetch_20260209OutputSchema = lazySchema(
      () => zodSchema(
        z93.object({
          type: z93.literal("web_fetch_result"),
          url: z93.string(),
          content: z93.object({
            type: z93.literal("document"),
            title: z93.string().nullable(),
            citations: z93.object({ enabled: z93.boolean() }).optional(),
            source: z93.union([
              z93.object({
                type: z93.literal("base64"),
                mediaType: z93.literal("application/pdf"),
                data: z93.string()
              }),
              z93.object({
                type: z93.literal("text"),
                mediaType: z93.literal("text/plain"),
                data: z93.string()
              })
            ])
          }),
          retrievedAt: z93.string().nullable()
        })
      )
    );
    webFetch_20260209InputSchema = lazySchema(
      () => zodSchema(
        z93.object({
          url: z93.string()
        })
      )
    );
    factory5 = createProviderExecutedToolFactory({
      id: "anthropic.web_fetch_20260209",
      inputSchema: webFetch_20260209InputSchema,
      outputSchema: webFetch_20260209OutputSchema,
      supportsDeferredResults: true
    });
    webFetch_20260209 = (args = {}) => {
      return factory5(args);
    };
    webFetch_20250910ArgsSchema = lazySchema(
      () => zodSchema(
        z103.object({
          maxUses: z103.number().optional(),
          allowedDomains: z103.array(z103.string()).optional(),
          blockedDomains: z103.array(z103.string()).optional(),
          citations: z103.object({ enabled: z103.boolean() }).optional(),
          maxContentTokens: z103.number().optional()
        })
      )
    );
    webFetch_20250910OutputSchema = lazySchema(
      () => zodSchema(
        z103.object({
          type: z103.literal("web_fetch_result"),
          url: z103.string(),
          content: z103.object({
            type: z103.literal("document"),
            title: z103.string().nullable(),
            citations: z103.object({ enabled: z103.boolean() }).optional(),
            source: z103.union([
              z103.object({
                type: z103.literal("base64"),
                mediaType: z103.literal("application/pdf"),
                data: z103.string()
              }),
              z103.object({
                type: z103.literal("text"),
                mediaType: z103.literal("text/plain"),
                data: z103.string()
              })
            ])
          }),
          retrievedAt: z103.string().nullable()
        })
      )
    );
    webFetch_20250910InputSchema = lazySchema(
      () => zodSchema(
        z103.object({
          url: z103.string()
        })
      )
    );
    factory6 = createProviderExecutedToolFactory({
      id: "anthropic.web_fetch_20250910",
      inputSchema: webFetch_20250910InputSchema,
      outputSchema: webFetch_20250910OutputSchema,
      supportsDeferredResults: true
    });
    webFetch_20250910 = (args = {}) => {
      return factory6(args);
    };
    codeExecution_20250522OutputSchema = lazySchema(
      () => zodSchema(
        z113.object({
          type: z113.literal("code_execution_result"),
          stdout: z113.string(),
          stderr: z113.string(),
          return_code: z113.number(),
          content: z113.array(
            z113.object({
              type: z113.literal("code_execution_output"),
              file_id: z113.string()
            })
          ).optional().default([])
        })
      )
    );
    codeExecution_20250522InputSchema = lazySchema(
      () => zodSchema(
        z113.object({
          code: z113.string()
        })
      )
    );
    factory7 = createProviderExecutedToolFactory({
      id: "anthropic.code_execution_20250522",
      inputSchema: codeExecution_20250522InputSchema,
      outputSchema: codeExecution_20250522OutputSchema
    });
    codeExecution_20250522 = (args = {}) => {
      return factory7(args);
    };
    codeExecution_20250825OutputSchema = lazySchema(
      () => zodSchema(
        z123.discriminatedUnion("type", [
          z123.object({
            type: z123.literal("code_execution_result"),
            stdout: z123.string(),
            stderr: z123.string(),
            return_code: z123.number(),
            content: z123.array(
              z123.object({
                type: z123.literal("code_execution_output"),
                file_id: z123.string()
              })
            ).optional().default([])
          }),
          z123.object({
            type: z123.literal("bash_code_execution_result"),
            content: z123.array(
              z123.object({
                type: z123.literal("bash_code_execution_output"),
                file_id: z123.string()
              })
            ),
            stdout: z123.string(),
            stderr: z123.string(),
            return_code: z123.number()
          }),
          z123.object({
            type: z123.literal("bash_code_execution_tool_result_error"),
            error_code: z123.string()
          }),
          z123.object({
            type: z123.literal("text_editor_code_execution_tool_result_error"),
            error_code: z123.string()
          }),
          z123.object({
            type: z123.literal("text_editor_code_execution_view_result"),
            content: z123.string(),
            file_type: z123.string(),
            num_lines: z123.number().nullable(),
            start_line: z123.number().nullable(),
            total_lines: z123.number().nullable()
          }),
          z123.object({
            type: z123.literal("text_editor_code_execution_create_result"),
            is_file_update: z123.boolean()
          }),
          z123.object({
            type: z123.literal("text_editor_code_execution_str_replace_result"),
            lines: z123.array(z123.string()).nullable(),
            new_lines: z123.number().nullable(),
            new_start: z123.number().nullable(),
            old_lines: z123.number().nullable(),
            old_start: z123.number().nullable()
          })
        ])
      )
    );
    codeExecution_20250825InputSchema = lazySchema(
      () => zodSchema(
        z123.discriminatedUnion("type", [
          // Programmatic tool calling format (mapped from { code } by AI SDK)
          z123.object({
            type: z123.literal("programmatic-tool-call"),
            code: z123.string()
          }),
          z123.object({
            type: z123.literal("bash_code_execution"),
            command: z123.string()
          }),
          z123.discriminatedUnion("command", [
            z123.object({
              type: z123.literal("text_editor_code_execution"),
              command: z123.literal("view"),
              path: z123.string()
            }),
            z123.object({
              type: z123.literal("text_editor_code_execution"),
              command: z123.literal("create"),
              path: z123.string(),
              file_text: z123.string().nullish()
            }),
            z123.object({
              type: z123.literal("text_editor_code_execution"),
              command: z123.literal("str_replace"),
              path: z123.string(),
              old_str: z123.string(),
              new_str: z123.string()
            })
          ])
        ])
      )
    );
    factory8 = createProviderExecutedToolFactory({
      id: "anthropic.code_execution_20250825",
      inputSchema: codeExecution_20250825InputSchema,
      outputSchema: codeExecution_20250825OutputSchema,
      // Programmatic tool calling: tool results may be deferred to a later turn
      // when code execution triggers a client-executed tool that needs to be
      // resolved before the code execution result can be returned.
      supportsDeferredResults: true
    });
    codeExecution_20250825 = (args = {}) => {
      return factory8(args);
    };
    codeExecution_20260120OutputSchema = lazySchema(
      () => zodSchema(
        z133.discriminatedUnion("type", [
          z133.object({
            type: z133.literal("code_execution_result"),
            stdout: z133.string(),
            stderr: z133.string(),
            return_code: z133.number(),
            content: z133.array(
              z133.object({
                type: z133.literal("code_execution_output"),
                file_id: z133.string()
              })
            ).optional().default([])
          }),
          z133.object({
            type: z133.literal("encrypted_code_execution_result"),
            encrypted_stdout: z133.string(),
            stderr: z133.string(),
            return_code: z133.number(),
            content: z133.array(
              z133.object({
                type: z133.literal("code_execution_output"),
                file_id: z133.string()
              })
            ).optional().default([])
          }),
          z133.object({
            type: z133.literal("bash_code_execution_result"),
            content: z133.array(
              z133.object({
                type: z133.literal("bash_code_execution_output"),
                file_id: z133.string()
              })
            ),
            stdout: z133.string(),
            stderr: z133.string(),
            return_code: z133.number()
          }),
          z133.object({
            type: z133.literal("bash_code_execution_tool_result_error"),
            error_code: z133.string()
          }),
          z133.object({
            type: z133.literal("text_editor_code_execution_tool_result_error"),
            error_code: z133.string()
          }),
          z133.object({
            type: z133.literal("text_editor_code_execution_view_result"),
            content: z133.string(),
            file_type: z133.string(),
            num_lines: z133.number().nullable(),
            start_line: z133.number().nullable(),
            total_lines: z133.number().nullable()
          }),
          z133.object({
            type: z133.literal("text_editor_code_execution_create_result"),
            is_file_update: z133.boolean()
          }),
          z133.object({
            type: z133.literal("text_editor_code_execution_str_replace_result"),
            lines: z133.array(z133.string()).nullable(),
            new_lines: z133.number().nullable(),
            new_start: z133.number().nullable(),
            old_lines: z133.number().nullable(),
            old_start: z133.number().nullable()
          })
        ])
      )
    );
    codeExecution_20260120InputSchema = lazySchema(
      () => zodSchema(
        z133.discriminatedUnion("type", [
          z133.object({
            type: z133.literal("programmatic-tool-call"),
            code: z133.string()
          }),
          z133.object({
            type: z133.literal("bash_code_execution"),
            command: z133.string()
          }),
          z133.discriminatedUnion("command", [
            z133.object({
              type: z133.literal("text_editor_code_execution"),
              command: z133.literal("view"),
              path: z133.string()
            }),
            z133.object({
              type: z133.literal("text_editor_code_execution"),
              command: z133.literal("create"),
              path: z133.string(),
              file_text: z133.string().nullish()
            }),
            z133.object({
              type: z133.literal("text_editor_code_execution"),
              command: z133.literal("str_replace"),
              path: z133.string(),
              old_str: z133.string(),
              new_str: z133.string()
            })
          ])
        ])
      )
    );
    factory9 = createProviderExecutedToolFactory({
      id: "anthropic.code_execution_20260120",
      inputSchema: codeExecution_20260120InputSchema,
      outputSchema: codeExecution_20260120OutputSchema,
      supportsDeferredResults: true
    });
    codeExecution_20260120 = (args = {}) => {
      return factory9(args);
    };
    toolSearchRegex_20251119OutputSchema = lazySchema(
      () => zodSchema(
        z143.array(
          z143.object({
            type: z143.literal("tool_reference"),
            toolName: z143.string()
          })
        )
      )
    );
    toolSearchRegex_20251119InputSchema = lazySchema(
      () => zodSchema(
        z143.object({
          /**
           * A regex pattern to search for tools.
           * Uses Python re.search() syntax. Maximum 200 characters.
           *
           * Examples:
           * - "weather" - matches tool names/descriptions containing "weather"
           * - "get_.*_data" - matches tools like get_user_data, get_weather_data
           * - "database.*query|query.*database" - OR patterns for flexibility
           * - "(?i)slack" - case-insensitive search
           */
          pattern: z143.string(),
          /**
           * Maximum number of tools to return. Optional.
           */
          limit: z143.number().optional()
        })
      )
    );
    factory10 = createProviderExecutedToolFactory({
      id: "anthropic.tool_search_regex_20251119",
      inputSchema: toolSearchRegex_20251119InputSchema,
      outputSchema: toolSearchRegex_20251119OutputSchema,
      supportsDeferredResults: true
    });
    toolSearchRegex_20251119 = (args = {}) => {
      return factory10(args);
    };
    SUPPORTED_STRING_FORMATS = /* @__PURE__ */ new Set([
      "date-time",
      "time",
      "date",
      "duration",
      "email",
      "hostname",
      "uri",
      "ipv4",
      "ipv6",
      "uuid"
    ]);
    DESCRIPTION_CONSTRAINT_KEYS = [
      "minimum",
      "maximum",
      "exclusiveMinimum",
      "exclusiveMaximum",
      "multipleOf",
      "minLength",
      "maxLength",
      "pattern",
      "minItems",
      "maxItems",
      "uniqueItems",
      "minProperties",
      "maxProperties",
      "not"
    ];
    AnthropicLanguageModel = class _AnthropicLanguageModel {
      constructor(modelId, config) {
        this.specificationVersion = "v4";
        var _a2;
        this.modelId = modelId;
        this.config = config;
        this.generateId = (_a2 = config.generateId) != null ? _a2 : generateId;
      }
      static [WORKFLOW_SERIALIZE](model) {
        return serializeModelOptions({
          modelId: model.modelId,
          config: model.config
        });
      }
      static [WORKFLOW_DESERIALIZE](options) {
        return new _AnthropicLanguageModel(options.modelId, options.config);
      }
      supportsUrl(url) {
        return url.protocol === "https:";
      }
      get provider() {
        return this.config.provider;
      }
      /**
       * Extracts the dynamic provider name from the config.provider string.
       * e.g., 'my-custom-anthropic.messages' -> 'my-custom-anthropic'
       */
      get providerOptionsName() {
        const provider = this.config.provider;
        const dotIndex = provider.indexOf(".");
        return dotIndex === -1 ? provider : provider.substring(0, dotIndex);
      }
      get supportedUrls() {
        var _a2, _b2, _c;
        return (_c = (_b2 = (_a2 = this.config).supportedUrls) == null ? void 0 : _b2.call(_a2)) != null ? _c : {};
      }
      async getArgs({
        userSuppliedBetas,
        prompt,
        maxOutputTokens,
        temperature,
        topP,
        topK,
        frequencyPenalty,
        presencePenalty,
        stopSequences,
        responseFormat,
        seed,
        tools,
        toolChoice,
        reasoning,
        providerOptions,
        stream
      }) {
        var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k;
        const warnings = [];
        if (frequencyPenalty != null) {
          warnings.push({ type: "unsupported", feature: "frequencyPenalty" });
        }
        if (presencePenalty != null) {
          warnings.push({ type: "unsupported", feature: "presencePenalty" });
        }
        if (seed != null) {
          warnings.push({ type: "unsupported", feature: "seed" });
        }
        if (temperature != null && temperature > 1) {
          warnings.push({
            type: "unsupported",
            feature: "temperature",
            details: `${temperature} exceeds anthropic maximum of 1.0. clamped to 1.0`
          });
          temperature = 1;
        } else if (temperature != null && temperature < 0) {
          warnings.push({
            type: "unsupported",
            feature: "temperature",
            details: `${temperature} is below anthropic minimum of 0. clamped to 0`
          });
          temperature = 0;
        }
        if ((responseFormat == null ? void 0 : responseFormat.type) === "json") {
          if (responseFormat.schema == null) {
            warnings.push({
              type: "unsupported",
              feature: "responseFormat",
              details: "JSON response format requires a schema. The response format is ignored."
            });
          }
        }
        const providerOptionsName = this.providerOptionsName;
        const canonicalOptions = await parseProviderOptions({
          provider: "anthropic",
          providerOptions,
          schema: anthropicLanguageModelOptions
        });
        const customProviderOptions = providerOptionsName !== "anthropic" ? await parseProviderOptions({
          provider: providerOptionsName,
          providerOptions,
          schema: anthropicLanguageModelOptions
        }) : null;
        const usedCustomProviderKey = customProviderOptions != null;
        const anthropicOptions = Object.assign(
          {},
          canonicalOptions != null ? canonicalOptions : {},
          customProviderOptions != null ? customProviderOptions : {}
        );
        const {
          maxOutputTokens: maxOutputTokensForModel,
          supportsStructuredOutput: modelSupportsStructuredOutput,
          supportsAdaptiveThinking,
          rejectsSamplingParameters,
          supportsXhighEffort,
          isKnownModel
        } = getModelCapabilities(this.modelId);
        if (rejectsSamplingParameters) {
          if (temperature != null) {
            warnings.push({
              type: "unsupported",
              feature: "temperature",
              details: `temperature is not supported by ${this.modelId} and will be ignored`
            });
            temperature = void 0;
          }
          if (topK != null) {
            warnings.push({
              type: "unsupported",
              feature: "topK",
              details: `topK is not supported by ${this.modelId} and will be ignored`
            });
            topK = void 0;
          }
          if (topP != null) {
            warnings.push({
              type: "unsupported",
              feature: "topP",
              details: `topP is not supported by ${this.modelId} and will be ignored`
            });
            topP = void 0;
          }
        }
        const isAnthropicModel = isKnownModel || this.modelId.startsWith("claude-");
        const supportsStructuredOutput = ((_a2 = this.config.supportsNativeStructuredOutput) != null ? _a2 : true) && modelSupportsStructuredOutput;
        const supportsStrictTools = ((_b2 = this.config.supportsStrictTools) != null ? _b2 : true) && modelSupportsStructuredOutput;
        const structureOutputMode = (_c = anthropicOptions == null ? void 0 : anthropicOptions.structuredOutputMode) != null ? _c : "auto";
        const useStructuredOutput = structureOutputMode === "outputFormat" || structureOutputMode === "auto" && supportsStructuredOutput;
        const jsonResponseTool = (responseFormat == null ? void 0 : responseFormat.type) === "json" && responseFormat.schema != null && !useStructuredOutput ? {
          type: "function",
          name: "json",
          description: "Respond with a JSON object.",
          inputSchema: responseFormat.schema
        } : void 0;
        const contextManagement = anthropicOptions == null ? void 0 : anthropicOptions.contextManagement;
        const cacheControlValidator = new CacheControlValidator();
        const toolNameMapping = createToolNameMapping({
          tools,
          providerToolNames: {
            "anthropic.code_execution_20250522": "code_execution",
            "anthropic.code_execution_20250825": "code_execution",
            "anthropic.code_execution_20260120": "code_execution",
            "anthropic.computer_20241022": "computer",
            "anthropic.computer_20250124": "computer",
            "anthropic.text_editor_20241022": "str_replace_editor",
            "anthropic.text_editor_20250124": "str_replace_editor",
            "anthropic.text_editor_20250429": "str_replace_based_edit_tool",
            "anthropic.text_editor_20250728": "str_replace_based_edit_tool",
            "anthropic.bash_20241022": "bash",
            "anthropic.bash_20250124": "bash",
            "anthropic.memory_20250818": "memory",
            "anthropic.web_search_20250305": "web_search",
            "anthropic.web_search_20260209": "web_search",
            "anthropic.web_fetch_20250910": "web_fetch",
            "anthropic.web_fetch_20260209": "web_fetch",
            "anthropic.tool_search_regex_20251119": "tool_search_tool_regex",
            "anthropic.tool_search_bm25_20251119": "tool_search_tool_bm25",
            "anthropic.advisor_20260301": "advisor"
          }
        });
        const { prompt: messagesPrompt, betas } = await convertToAnthropicPrompt({
          prompt,
          sendReasoning: (_d = anthropicOptions == null ? void 0 : anthropicOptions.sendReasoning) != null ? _d : true,
          warnings,
          cacheControlValidator,
          toolNameMapping
        });
        if (isCustomReasoning(reasoning) && (anthropicOptions == null ? void 0 : anthropicOptions.effort) == null) {
          const reasoningConfig = resolveAnthropicReasoningConfig({
            reasoning,
            supportsAdaptiveThinking,
            supportsXhighEffort,
            maxOutputTokensForModel,
            warnings
          });
          if (reasoningConfig != null) {
            if (anthropicOptions.thinking == null) {
              anthropicOptions.thinking = reasoningConfig.thinking;
            }
            if (reasoningConfig.effort != null && ((_e = anthropicOptions.thinking) == null ? void 0 : _e.type) !== "disabled") {
              anthropicOptions.effort = reasoningConfig.effort;
            }
          }
        }
        const thinkingType = (_f = anthropicOptions == null ? void 0 : anthropicOptions.thinking) == null ? void 0 : _f.type;
        const isThinking = thinkingType === "enabled" || thinkingType === "adaptive";
        let thinkingBudget = thinkingType === "enabled" ? (_g = anthropicOptions == null ? void 0 : anthropicOptions.thinking) == null ? void 0 : _g.budgetTokens : void 0;
        const thinkingDisplay = thinkingType === "adaptive" ? (_h = anthropicOptions == null ? void 0 : anthropicOptions.thinking) == null ? void 0 : _h.display : void 0;
        const maxTokens = maxOutputTokens != null ? maxOutputTokens : maxOutputTokensForModel;
        const baseArgs = {
          // model id:
          model: this.modelId,
          // standardized settings:
          max_tokens: maxTokens,
          temperature,
          top_k: topK,
          top_p: topP,
          stop_sequences: stopSequences,
          // provider specific settings:
          ...isThinking && {
            thinking: {
              type: thinkingType,
              ...thinkingBudget != null && { budget_tokens: thinkingBudget },
              ...thinkingDisplay != null && { display: thinkingDisplay }
            }
          },
          ...((anthropicOptions == null ? void 0 : anthropicOptions.effort) || (anthropicOptions == null ? void 0 : anthropicOptions.taskBudget) || useStructuredOutput && (responseFormat == null ? void 0 : responseFormat.type) === "json" && responseFormat.schema != null) && {
            output_config: {
              ...(anthropicOptions == null ? void 0 : anthropicOptions.effort) && {
                effort: anthropicOptions.effort
              },
              ...(anthropicOptions == null ? void 0 : anthropicOptions.taskBudget) && {
                task_budget: {
                  type: anthropicOptions.taskBudget.type,
                  total: anthropicOptions.taskBudget.total,
                  ...anthropicOptions.taskBudget.remaining != null && {
                    remaining: anthropicOptions.taskBudget.remaining
                  }
                }
              },
              ...useStructuredOutput && (responseFormat == null ? void 0 : responseFormat.type) === "json" && responseFormat.schema != null && {
                format: {
                  type: "json_schema",
                  schema: sanitizeJsonSchema(responseFormat.schema)
                }
              }
            }
          },
          ...(anthropicOptions == null ? void 0 : anthropicOptions.speed) && {
            speed: anthropicOptions.speed
          },
          ...(anthropicOptions == null ? void 0 : anthropicOptions.inferenceGeo) && {
            inference_geo: anthropicOptions.inferenceGeo
          },
          ...(anthropicOptions == null ? void 0 : anthropicOptions.fallbacks) && anthropicOptions.fallbacks.length > 0 && {
            fallbacks: anthropicOptions.fallbacks
          },
          ...(anthropicOptions == null ? void 0 : anthropicOptions.cacheControl) && {
            cache_control: anthropicOptions.cacheControl
          },
          ...((_i = anthropicOptions == null ? void 0 : anthropicOptions.metadata) == null ? void 0 : _i.userId) != null && {
            metadata: { user_id: anthropicOptions.metadata.userId }
          },
          // mcp servers:
          ...(anthropicOptions == null ? void 0 : anthropicOptions.mcpServers) && anthropicOptions.mcpServers.length > 0 && {
            mcp_servers: anthropicOptions.mcpServers.map((server) => ({
              type: server.type,
              name: server.name,
              url: server.url,
              authorization_token: server.authorizationToken,
              tool_configuration: server.toolConfiguration ? {
                allowed_tools: server.toolConfiguration.allowedTools,
                enabled: server.toolConfiguration.enabled
              } : void 0
            }))
          },
          // container: For programmatic tool calling (just an ID string) or agent skills (object with id and skills)
          ...(anthropicOptions == null ? void 0 : anthropicOptions.container) && {
            container: anthropicOptions.container.skills && anthropicOptions.container.skills.length > 0 ? (
              // Object format when skills are provided (agent skills feature)
              {
                id: anthropicOptions.container.id,
                skills: anthropicOptions.container.skills.map((skill) => ({
                  type: skill.type,
                  skill_id: skill.type === "custom" ? resolveProviderReference({
                    reference: skill.providerReference,
                    provider: "anthropic"
                  }) : skill.skillId,
                  version: skill.version
                }))
              }
            ) : (
              // String format for container ID only (programmatic tool calling)
              anthropicOptions.container.id
            )
          },
          // prompt:
          system: messagesPrompt.system,
          messages: messagesPrompt.messages,
          ...contextManagement && {
            context_management: {
              edits: contextManagement.edits.map((edit) => {
                const strategy = edit.type;
                switch (strategy) {
                  case "clear_tool_uses_20250919":
                    return {
                      type: edit.type,
                      ...edit.trigger !== void 0 && {
                        trigger: edit.trigger
                      },
                      ...edit.keep !== void 0 && { keep: edit.keep },
                      ...edit.clearAtLeast !== void 0 && {
                        clear_at_least: edit.clearAtLeast
                      },
                      ...edit.clearToolInputs !== void 0 && {
                        clear_tool_inputs: edit.clearToolInputs
                      },
                      ...edit.excludeTools !== void 0 && {
                        exclude_tools: edit.excludeTools
                      }
                    };
                  case "clear_thinking_20251015":
                    return {
                      type: edit.type,
                      ...edit.keep !== void 0 && { keep: edit.keep }
                    };
                  case "compact_20260112":
                    return {
                      type: edit.type,
                      ...edit.trigger !== void 0 && {
                        trigger: edit.trigger
                      },
                      ...edit.pauseAfterCompaction !== void 0 && {
                        pause_after_compaction: edit.pauseAfterCompaction
                      },
                      ...edit.instructions !== void 0 && {
                        instructions: edit.instructions
                      }
                    };
                  default:
                    warnings.push({
                      type: "other",
                      message: `Unknown context management strategy: ${strategy}`
                    });
                    return void 0;
                }
              }).filter((edit) => edit !== void 0)
            }
          }
        };
        if (isThinking) {
          if (thinkingType === "enabled" && thinkingBudget == null) {
            warnings.push({
              type: "compatibility",
              feature: "extended thinking",
              details: "thinking budget is required when thinking is enabled. using default budget of 1024 tokens."
            });
            baseArgs.thinking = {
              type: "enabled",
              budget_tokens: 1024
            };
            thinkingBudget = 1024;
          }
          if (baseArgs.temperature != null) {
            baseArgs.temperature = void 0;
            warnings.push({
              type: "unsupported",
              feature: "temperature",
              details: "temperature is not supported when thinking is enabled"
            });
          }
          if (topK != null) {
            baseArgs.top_k = void 0;
            warnings.push({
              type: "unsupported",
              feature: "topK",
              details: "topK is not supported when thinking is enabled"
            });
          }
          if (topP != null) {
            baseArgs.top_p = void 0;
            warnings.push({
              type: "unsupported",
              feature: "topP",
              details: "topP is not supported when thinking is enabled"
            });
          }
          baseArgs.max_tokens = maxTokens + (thinkingBudget != null ? thinkingBudget : 0);
        } else {
          if (isAnthropicModel && topP != null && temperature != null) {
            warnings.push({
              type: "unsupported",
              feature: "topP",
              details: `topP is not supported when temperature is set. topP is ignored.`
            });
            baseArgs.top_p = void 0;
          }
        }
        if (isKnownModel && baseArgs.max_tokens > maxOutputTokensForModel) {
          if (maxOutputTokens != null) {
            warnings.push({
              type: "unsupported",
              feature: "maxOutputTokens",
              details: `${baseArgs.max_tokens} (maxOutputTokens + thinkingBudget) is greater than ${this.modelId} ${maxOutputTokensForModel} max output tokens. The max output tokens have been limited to ${maxOutputTokensForModel}.`
            });
          }
          baseArgs.max_tokens = maxOutputTokensForModel;
        }
        if ((anthropicOptions == null ? void 0 : anthropicOptions.mcpServers) && anthropicOptions.mcpServers.length > 0) {
          betas.add("mcp-client-2025-04-04");
        }
        if (contextManagement) {
          betas.add("context-management-2025-06-27");
          if (contextManagement.edits.some((e) => e.type === "compact_20260112")) {
            betas.add("compact-2026-01-12");
          }
        }
        if ((anthropicOptions == null ? void 0 : anthropicOptions.container) && anthropicOptions.container.skills && anthropicOptions.container.skills.length > 0) {
          betas.add("code-execution-2025-08-25");
          betas.add("skills-2025-10-02");
          betas.add("files-api-2025-04-14");
          if (!(tools == null ? void 0 : tools.some(
            (tool2) => tool2.type === "provider" && (tool2.id === "anthropic.code_execution_20250825" || tool2.id === "anthropic.code_execution_20260120")
          ))) {
            warnings.push({
              type: "other",
              message: "code execution tool is required when using skills"
            });
          }
        }
        if (anthropicOptions == null ? void 0 : anthropicOptions.taskBudget) {
          betas.add("task-budgets-2026-03-13");
        }
        if ((anthropicOptions == null ? void 0 : anthropicOptions.speed) === "fast") {
          betas.add("fast-mode-2026-02-01");
        }
        if ((anthropicOptions == null ? void 0 : anthropicOptions.fallbacks) && anthropicOptions.fallbacks.length > 0) {
          betas.add("server-side-fallback-2026-06-01");
        }
        const defaultEagerInputStreaming = stream && ((_j = anthropicOptions == null ? void 0 : anthropicOptions.toolStreaming) != null ? _j : true);
        const {
          tools: anthropicTools2,
          toolChoice: anthropicToolChoice,
          toolWarnings,
          betas: toolsBetas
        } = await prepareTools2(
          jsonResponseTool != null ? {
            tools: [...tools != null ? tools : [], jsonResponseTool],
            toolChoice: { type: "required" },
            disableParallelToolUse: true,
            cacheControlValidator,
            supportsStructuredOutput: false,
            supportsStrictTools,
            defaultEagerInputStreaming
          } : {
            tools: tools != null ? tools : [],
            toolChoice,
            disableParallelToolUse: anthropicOptions == null ? void 0 : anthropicOptions.disableParallelToolUse,
            cacheControlValidator,
            supportsStructuredOutput,
            supportsStrictTools,
            defaultEagerInputStreaming
          }
        );
        const cacheWarnings = cacheControlValidator.getWarnings();
        return {
          args: {
            ...baseArgs,
            tools: anthropicTools2,
            tool_choice: anthropicToolChoice,
            stream: stream === true ? true : void 0
            // do not send when not streaming
          },
          warnings: [...warnings, ...toolWarnings, ...cacheWarnings],
          betas: /* @__PURE__ */ new Set([
            ...betas,
            ...toolsBetas,
            ...userSuppliedBetas,
            ...(_k = anthropicOptions == null ? void 0 : anthropicOptions.anthropicBeta) != null ? _k : []
          ]),
          usesJsonResponseTool: jsonResponseTool != null,
          toolNameMapping,
          providerOptionsName,
          usedCustomProviderKey
        };
      }
      async getHeaders({
        betas,
        headers
      }) {
        return combineHeaders(
          this.config.headers ? await resolve(this.config.headers) : void 0,
          headers,
          betas.size > 0 ? { "anthropic-beta": Array.from(betas).join(",") } : {}
        );
      }
      async getBetasFromHeaders(requestHeaders) {
        var _a2, _b2;
        const configHeaders = this.config.headers ? await resolve(this.config.headers) : void 0;
        const configBetaHeader = (_a2 = configHeaders == null ? void 0 : configHeaders["anthropic-beta"]) != null ? _a2 : "";
        const requestBetaHeader = (_b2 = requestHeaders == null ? void 0 : requestHeaders["anthropic-beta"]) != null ? _b2 : "";
        return new Set(
          [
            ...configBetaHeader.toLowerCase().split(","),
            ...requestBetaHeader.toLowerCase().split(",")
          ].map((beta) => beta.trim()).filter((beta) => beta !== "")
        );
      }
      buildRequestUrl(isStreaming) {
        var _a2, _b2, _c;
        return (_c = (_b2 = (_a2 = this.config).buildRequestUrl) == null ? void 0 : _b2.call(_a2, this.config.baseURL, isStreaming)) != null ? _c : `${this.config.baseURL}/messages`;
      }
      transformRequestBody(args, betas) {
        var _a2, _b2, _c;
        return (_c = (_b2 = (_a2 = this.config).transformRequestBody) == null ? void 0 : _b2.call(_a2, args, betas)) != null ? _c : args;
      }
      extractCitationDocuments(prompt) {
        const isCitationPart = (part) => {
          var _a2, _b2;
          if (part.type !== "file") {
            return false;
          }
          if (part.mediaType !== "application/pdf" && part.mediaType !== "text/plain") {
            return false;
          }
          const anthropic2 = (_a2 = part.providerOptions) == null ? void 0 : _a2.anthropic;
          const citationsConfig = anthropic2 == null ? void 0 : anthropic2.citations;
          return (_b2 = citationsConfig == null ? void 0 : citationsConfig.enabled) != null ? _b2 : false;
        };
        return prompt.filter((message) => message.role === "user").flatMap((message) => message.content).filter(isCitationPart).map((part) => {
          var _a2;
          const filePart = part;
          return {
            title: (_a2 = filePart.filename) != null ? _a2 : "Untitled Document",
            filename: filePart.filename,
            mediaType: filePart.mediaType
          };
        });
      }
      async doGenerate(options) {
        var _a2, _b2, _c, _d, _e, _f, _g;
        const {
          args,
          warnings,
          betas,
          usesJsonResponseTool,
          toolNameMapping,
          providerOptionsName,
          usedCustomProviderKey
        } = await this.getArgs({
          ...options,
          stream: false,
          userSuppliedBetas: await this.getBetasFromHeaders(options.headers)
        });
        const citationDocuments = [
          ...this.extractCitationDocuments(options.prompt)
        ];
        const markCodeExecutionDynamic = hasWebTool20260209WithoutCodeExecution(
          args.tools
        );
        const {
          responseHeaders,
          value: response,
          rawValue: rawResponse
        } = await postJsonToApi({
          url: this.buildRequestUrl(false),
          headers: await this.getHeaders({ betas, headers: options.headers }),
          body: this.transformRequestBody(args, betas),
          failedResponseHandler: anthropicFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            anthropicResponseSchema
          ),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        const content = [];
        const mcpToolCalls = {};
        const serverToolCalls = {};
        let isJsonResponseFromTool = false;
        for (const part of response.content) {
          switch (part.type) {
            case "text": {
              if (!usesJsonResponseTool) {
                content.push({ type: "text", text: part.text });
                if (part.citations) {
                  for (const citation of part.citations) {
                    const source = createCitationSource(
                      citation,
                      citationDocuments,
                      this.generateId
                    );
                    if (source) {
                      content.push(source);
                    }
                  }
                }
              }
              break;
            }
            case "thinking": {
              content.push({
                type: "reasoning",
                text: part.thinking,
                providerMetadata: {
                  anthropic: {
                    signature: part.signature
                  }
                }
              });
              break;
            }
            case "redacted_thinking": {
              content.push({
                type: "reasoning",
                text: "",
                providerMetadata: {
                  anthropic: {
                    redactedData: part.data
                  }
                }
              });
              break;
            }
            case "compaction": {
              content.push({
                type: "text",
                text: part.content,
                providerMetadata: {
                  anthropic: {
                    type: "compaction"
                  }
                }
              });
              break;
            }
            case "tool_use": {
              const isJsonResponseTool = usesJsonResponseTool && part.name === "json";
              if (isJsonResponseTool) {
                isJsonResponseFromTool = true;
                content.push({
                  type: "text",
                  text: JSON.stringify(part.input)
                });
              } else {
                const caller = part.caller;
                const callerInfo = caller ? {
                  type: caller.type,
                  toolId: "tool_id" in caller ? caller.tool_id : void 0
                } : void 0;
                content.push({
                  type: "tool-call",
                  toolCallId: part.id,
                  toolName: part.name,
                  input: JSON.stringify(part.input),
                  ...callerInfo && {
                    providerMetadata: {
                      anthropic: {
                        caller: callerInfo
                      }
                    }
                  }
                });
              }
              break;
            }
            case "server_tool_use": {
              if (part.name === "text_editor_code_execution" || part.name === "bash_code_execution") {
                const providerToolName = "code_execution";
                content.push({
                  type: "tool-call",
                  toolCallId: part.id,
                  toolName: toolNameMapping.toCustomToolName("code_execution"),
                  input: JSON.stringify({ type: part.name, ...part.input }),
                  providerExecuted: true,
                  // Specific 'web_fetch' or 'web_search' tools may need code execution, which the Anthropic API
                  // implicitly allows. In this scenario, we need to allow 'code_execution' tool calls even if the
                  // tool was not explicitly provided. We therefore bypass the general validation by marking the
                  // tool as dynamic.
                  ...markCodeExecutionDynamic && providerToolName === "code_execution" ? { dynamic: true } : {}
                });
              } else if (part.name === "web_search" || part.name === "code_execution" || part.name === "web_fetch") {
                const inputToSerialize = part.name === "code_execution" && part.input != null && typeof part.input === "object" && "code" in part.input && !("type" in part.input) ? { type: "programmatic-tool-call", ...part.input } : part.input;
                content.push({
                  type: "tool-call",
                  toolCallId: part.id,
                  toolName: toolNameMapping.toCustomToolName(part.name),
                  input: JSON.stringify(inputToSerialize),
                  providerExecuted: true,
                  // Specific 'web_fetch' or 'web_search' tools may need code execution, which the Anthropic API
                  // implicitly allows. In this scenario, we need to allow 'code_execution' tool calls even if the
                  // tool was not explicitly provided. We therefore bypass the general validation by marking the
                  // tool as dynamic.
                  ...markCodeExecutionDynamic && part.name === "code_execution" ? { dynamic: true } : {}
                });
              } else if (part.name === "tool_search_tool_regex" || part.name === "tool_search_tool_bm25") {
                serverToolCalls[part.id] = part.name;
                content.push({
                  type: "tool-call",
                  toolCallId: part.id,
                  toolName: toolNameMapping.toCustomToolName(part.name),
                  input: JSON.stringify(part.input),
                  providerExecuted: true
                });
              } else if (part.name === "advisor") {
                content.push({
                  type: "tool-call",
                  toolCallId: part.id,
                  toolName: toolNameMapping.toCustomToolName("advisor"),
                  input: JSON.stringify(part.input),
                  providerExecuted: true
                });
              }
              break;
            }
            case "mcp_tool_use": {
              mcpToolCalls[part.id] = {
                type: "tool-call",
                toolCallId: part.id,
                toolName: part.name,
                input: JSON.stringify(part.input),
                providerExecuted: true,
                dynamic: true,
                providerMetadata: {
                  anthropic: {
                    type: "mcp-tool-use",
                    serverName: part.server_name
                  }
                }
              };
              content.push(mcpToolCalls[part.id]);
              break;
            }
            case "mcp_tool_result": {
              content.push({
                type: "tool-result",
                toolCallId: part.tool_use_id,
                toolName: mcpToolCalls[part.tool_use_id].toolName,
                isError: part.is_error,
                result: part.content,
                dynamic: true,
                providerMetadata: mcpToolCalls[part.tool_use_id].providerMetadata
              });
              break;
            }
            case "web_fetch_tool_result": {
              if (part.content.type === "web_fetch_result") {
                citationDocuments.push({
                  title: (_a2 = part.content.content.title) != null ? _a2 : part.content.url,
                  mediaType: part.content.content.source.media_type
                });
                content.push({
                  type: "tool-result",
                  toolCallId: part.tool_use_id,
                  toolName: toolNameMapping.toCustomToolName("web_fetch"),
                  result: {
                    type: "web_fetch_result",
                    url: part.content.url,
                    retrievedAt: part.content.retrieved_at,
                    content: {
                      type: part.content.content.type,
                      title: part.content.content.title,
                      citations: part.content.content.citations,
                      source: {
                        type: part.content.content.source.type,
                        mediaType: part.content.content.source.media_type,
                        data: part.content.content.source.data
                      }
                    }
                  }
                });
              } else if (part.content.type === "web_fetch_tool_result_error") {
                content.push({
                  type: "tool-result",
                  toolCallId: part.tool_use_id,
                  toolName: toolNameMapping.toCustomToolName("web_fetch"),
                  isError: true,
                  result: {
                    type: "web_fetch_tool_result_error",
                    errorCode: part.content.error_code
                  }
                });
              }
              break;
            }
            case "web_search_tool_result": {
              if (Array.isArray(part.content)) {
                content.push({
                  type: "tool-result",
                  toolCallId: part.tool_use_id,
                  toolName: toolNameMapping.toCustomToolName("web_search"),
                  result: part.content.map((result) => {
                    var _a22;
                    return {
                      url: result.url,
                      title: result.title,
                      pageAge: (_a22 = result.page_age) != null ? _a22 : null,
                      encryptedContent: result.encrypted_content,
                      type: result.type
                    };
                  })
                });
                for (const result of part.content) {
                  content.push({
                    type: "source",
                    sourceType: "url",
                    id: this.generateId(),
                    url: result.url,
                    title: result.title,
                    providerMetadata: {
                      anthropic: {
                        pageAge: (_b2 = result.page_age) != null ? _b2 : null
                      }
                    }
                  });
                }
              } else {
                content.push({
                  type: "tool-result",
                  toolCallId: part.tool_use_id,
                  toolName: toolNameMapping.toCustomToolName("web_search"),
                  isError: true,
                  result: {
                    type: "web_search_tool_result_error",
                    errorCode: part.content.error_code
                  }
                });
              }
              break;
            }
            // code execution 20250522:
            case "code_execution_tool_result": {
              if (part.content.type === "code_execution_result") {
                content.push({
                  type: "tool-result",
                  toolCallId: part.tool_use_id,
                  toolName: toolNameMapping.toCustomToolName("code_execution"),
                  result: {
                    type: part.content.type,
                    stdout: part.content.stdout,
                    stderr: part.content.stderr,
                    return_code: part.content.return_code,
                    content: (_c = part.content.content) != null ? _c : []
                  }
                });
              } else if (part.content.type === "encrypted_code_execution_result") {
                content.push({
                  type: "tool-result",
                  toolCallId: part.tool_use_id,
                  toolName: toolNameMapping.toCustomToolName("code_execution"),
                  result: {
                    type: part.content.type,
                    encrypted_stdout: part.content.encrypted_stdout,
                    stderr: part.content.stderr,
                    return_code: part.content.return_code,
                    content: (_d = part.content.content) != null ? _d : []
                  }
                });
              } else if (part.content.type === "code_execution_tool_result_error") {
                content.push({
                  type: "tool-result",
                  toolCallId: part.tool_use_id,
                  toolName: toolNameMapping.toCustomToolName("code_execution"),
                  isError: true,
                  result: {
                    type: "code_execution_tool_result_error",
                    errorCode: part.content.error_code
                  }
                });
              }
              break;
            }
            // code execution 20250825:
            case "bash_code_execution_tool_result":
            case "text_editor_code_execution_tool_result": {
              content.push({
                type: "tool-result",
                toolCallId: part.tool_use_id,
                toolName: toolNameMapping.toCustomToolName("code_execution"),
                result: part.content
              });
              break;
            }
            // tool search tool results:
            case "tool_search_tool_result": {
              let providerToolName = serverToolCalls[part.tool_use_id];
              if (providerToolName == null) {
                const bm25CustomName = toolNameMapping.toCustomToolName(
                  "tool_search_tool_bm25"
                );
                const regexCustomName = toolNameMapping.toCustomToolName(
                  "tool_search_tool_regex"
                );
                if (bm25CustomName !== "tool_search_tool_bm25") {
                  providerToolName = "tool_search_tool_bm25";
                } else if (regexCustomName !== "tool_search_tool_regex") {
                  providerToolName = "tool_search_tool_regex";
                } else {
                  providerToolName = "tool_search_tool_regex";
                }
              }
              if (part.content.type === "tool_search_tool_search_result") {
                content.push({
                  type: "tool-result",
                  toolCallId: part.tool_use_id,
                  toolName: toolNameMapping.toCustomToolName(providerToolName),
                  result: part.content.tool_references.map((ref) => ({
                    type: ref.type,
                    toolName: ref.tool_name
                  }))
                });
              } else {
                content.push({
                  type: "tool-result",
                  toolCallId: part.tool_use_id,
                  toolName: toolNameMapping.toCustomToolName(providerToolName),
                  isError: true,
                  result: {
                    type: "tool_search_tool_result_error",
                    errorCode: part.content.error_code
                  }
                });
              }
              break;
            }
            // advisor results for advisor_20260301:
            case "advisor_tool_result": {
              const advisorToolName = toolNameMapping.toCustomToolName("advisor");
              if (part.content.type === "advisor_result") {
                content.push({
                  type: "tool-result",
                  toolCallId: part.tool_use_id,
                  toolName: advisorToolName,
                  result: {
                    type: "advisor_result",
                    text: part.content.text
                  }
                });
              } else if (part.content.type === "advisor_redacted_result") {
                content.push({
                  type: "tool-result",
                  toolCallId: part.tool_use_id,
                  toolName: advisorToolName,
                  result: {
                    type: "advisor_redacted_result",
                    encryptedContent: part.content.encrypted_content
                  }
                });
              } else {
                content.push({
                  type: "tool-result",
                  toolCallId: part.tool_use_id,
                  toolName: advisorToolName,
                  isError: true,
                  result: {
                    type: "advisor_tool_result_error",
                    errorCode: part.content.error_code
                  }
                });
              }
              break;
            }
            // Server-side fallback marker: the AI SDK has no content primitive for
            // a model hop, so drop it. The hop is still observable via
            // usage.iterations.
            case "fallback": {
              break;
            }
          }
        }
        return {
          content,
          finishReason: {
            unified: mapAnthropicStopReason({
              finishReason: response.stop_reason,
              isJsonResponseFromTool
            }),
            raw: (_e = response.stop_reason) != null ? _e : void 0
          },
          usage: convertAnthropicUsage({ usage: response.usage }),
          request: { body: args },
          response: {
            id: (_f = response.id) != null ? _f : void 0,
            modelId: (_g = response.model) != null ? _g : void 0,
            headers: responseHeaders,
            body: rawResponse
          },
          warnings,
          providerMetadata: (() => {
            var _a22, _b22, _c2, _d2;
            const stopDetails = mapAnthropicStopDetails(response.stop_details);
            const anthropicMetadata = {
              usage: response.usage,
              stopSequence: (_a22 = response.stop_sequence) != null ? _a22 : null,
              ...stopDetails != null ? { stopDetails } : {},
              iterations: response.usage.iterations ? response.usage.iterations.map(
                (iter) => ({
                  type: iter.type,
                  ...iter.model != null ? { model: iter.model } : {},
                  inputTokens: iter.input_tokens,
                  outputTokens: iter.output_tokens,
                  ...iter.cache_creation_input_tokens ? {
                    cacheCreationInputTokens: iter.cache_creation_input_tokens
                  } : {},
                  ...iter.cache_read_input_tokens ? {
                    cacheReadInputTokens: iter.cache_read_input_tokens
                  } : {}
                })
              ) : null,
              container: response.container ? {
                expiresAt: response.container.expires_at,
                id: response.container.id,
                skills: (_c2 = (_b22 = response.container.skills) == null ? void 0 : _b22.map((skill) => ({
                  type: skill.type,
                  skillId: skill.skill_id,
                  version: skill.version
                }))) != null ? _c2 : null
              } : null,
              contextManagement: (_d2 = mapAnthropicResponseContextManagement(
                response.context_management
              )) != null ? _d2 : null
            };
            const providerMetadata = {
              anthropic: anthropicMetadata
            };
            if (usedCustomProviderKey && providerOptionsName !== "anthropic") {
              providerMetadata[providerOptionsName] = anthropicMetadata;
            }
            return providerMetadata;
          })()
        };
      }
      async doStream(options) {
        "use step";
        var _a2, _b2;
        const {
          args: body,
          warnings,
          betas,
          usesJsonResponseTool,
          toolNameMapping,
          providerOptionsName,
          usedCustomProviderKey
        } = await this.getArgs({
          ...options,
          stream: true,
          userSuppliedBetas: await this.getBetasFromHeaders(options.headers)
        });
        const citationDocuments = [
          ...this.extractCitationDocuments(options.prompt)
        ];
        const markCodeExecutionDynamic = hasWebTool20260209WithoutCodeExecution(
          body.tools
        );
        const url = this.buildRequestUrl(true);
        const { responseHeaders, value: response } = await postJsonToApi({
          url,
          headers: await this.getHeaders({ betas, headers: options.headers }),
          body: this.transformRequestBody(body, betas),
          failedResponseHandler: anthropicFailedResponseHandler,
          successfulResponseHandler: createEventSourceResponseHandler(anthropicChunkSchema),
          abortSignal: options.abortSignal,
          fetch: this.config.fetch
        });
        let finishReason = {
          unified: "other",
          raw: void 0
        };
        const usage = {
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          iterations: null
        };
        const contentBlocks = {};
        const mcpToolCalls = {};
        const serverToolCalls = {};
        let contextManagement = null;
        let rawUsage = void 0;
        let stopSequence = null;
        let stopDetails = void 0;
        let container = null;
        let isJsonResponseFromTool = false;
        let blockType = void 0;
        const generateId3 = this.generateId;
        const transformedStream = response.pipeThrough(
          new TransformStream({
            start(controller) {
              controller.enqueue({ type: "stream-start", warnings });
            },
            transform(chunk, controller) {
              var _a22, _b22, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
              if (options.includeRawChunks) {
                controller.enqueue({ type: "raw", rawValue: chunk.rawValue });
              }
              if (!chunk.success) {
                controller.enqueue({ type: "error", error: chunk.error });
                return;
              }
              const value = chunk.value;
              switch (value.type) {
                case "ping": {
                  return;
                }
                case "content_block_start": {
                  const part = value.content_block;
                  const contentBlockType = part.type;
                  if (contentBlockType === "fallback") {
                    return;
                  }
                  blockType = contentBlockType;
                  switch (contentBlockType) {
                    case "text": {
                      if (usesJsonResponseTool) {
                        return;
                      }
                      contentBlocks[value.index] = { type: "text" };
                      controller.enqueue({
                        type: "text-start",
                        id: String(value.index)
                      });
                      return;
                    }
                    case "thinking": {
                      contentBlocks[value.index] = { type: "reasoning" };
                      controller.enqueue({
                        type: "reasoning-start",
                        id: String(value.index)
                      });
                      return;
                    }
                    case "redacted_thinking": {
                      contentBlocks[value.index] = { type: "reasoning" };
                      controller.enqueue({
                        type: "reasoning-start",
                        id: String(value.index),
                        providerMetadata: {
                          anthropic: {
                            redactedData: part.data
                          }
                        }
                      });
                      return;
                    }
                    case "compaction": {
                      contentBlocks[value.index] = { type: "text" };
                      controller.enqueue({
                        type: "text-start",
                        id: String(value.index),
                        providerMetadata: {
                          anthropic: {
                            type: "compaction"
                          }
                        }
                      });
                      return;
                    }
                    case "tool_use": {
                      const isJsonResponseTool = usesJsonResponseTool && part.name === "json";
                      if (isJsonResponseTool) {
                        isJsonResponseFromTool = true;
                        contentBlocks[value.index] = { type: "text" };
                        controller.enqueue({
                          type: "text-start",
                          id: String(value.index)
                        });
                      } else {
                        const caller = part.caller;
                        const callerInfo = caller ? {
                          type: caller.type,
                          toolId: "tool_id" in caller ? caller.tool_id : void 0
                        } : void 0;
                        const hasNonEmptyInput = part.input && Object.keys(part.input).length > 0;
                        const initialInput = hasNonEmptyInput ? JSON.stringify(part.input) : "";
                        contentBlocks[value.index] = {
                          type: "tool-call",
                          toolCallId: part.id,
                          toolName: part.name,
                          input: initialInput,
                          firstDelta: initialInput.length === 0,
                          ...callerInfo && { caller: callerInfo }
                        };
                        controller.enqueue({
                          type: "tool-input-start",
                          id: part.id,
                          toolName: part.name
                        });
                      }
                      return;
                    }
                    case "server_tool_use": {
                      if ([
                        "web_fetch",
                        "web_search",
                        // code execution 20250825:
                        "code_execution",
                        // code execution 20250825 text editor:
                        "text_editor_code_execution",
                        // code execution 20250825 bash:
                        "bash_code_execution"
                      ].includes(part.name)) {
                        const providerToolName = part.name === "text_editor_code_execution" || part.name === "bash_code_execution" ? "code_execution" : part.name;
                        const customToolName = toolNameMapping.toCustomToolName(providerToolName);
                        const finalInput = part.input != null && typeof part.input === "object" && Object.keys(part.input).length > 0 ? JSON.stringify(part.input) : "";
                        contentBlocks[value.index] = {
                          type: "tool-call",
                          toolCallId: part.id,
                          toolName: customToolName,
                          input: finalInput,
                          providerExecuted: true,
                          // Specific 'web_fetch' or 'web_search' tools may need code execution, which the Anthropic API
                          // implicitly allows. In this scenario, we need to allow 'code_execution' tool calls even if the
                          // tool was not explicitly provided. We therefore bypass the general validation by marking the
                          // tool as dynamic.
                          ...markCodeExecutionDynamic && providerToolName === "code_execution" ? { dynamic: true } : {},
                          firstDelta: true,
                          providerToolName
                        };
                        controller.enqueue({
                          type: "tool-input-start",
                          id: part.id,
                          toolName: customToolName,
                          providerExecuted: true,
                          // Specific 'web_fetch' or 'web_search' tools may need code execution, which the Anthropic API
                          // implicitly allows. In this scenario, we need to allow 'code_execution' tool calls even if the
                          // tool was not explicitly provided. We therefore bypass the general validation by marking the
                          // tool as dynamic.
                          ...markCodeExecutionDynamic && providerToolName === "code_execution" ? { dynamic: true } : {}
                        });
                      } else if (part.name === "tool_search_tool_regex" || part.name === "tool_search_tool_bm25") {
                        serverToolCalls[part.id] = part.name;
                        const customToolName = toolNameMapping.toCustomToolName(
                          part.name
                        );
                        contentBlocks[value.index] = {
                          type: "tool-call",
                          toolCallId: part.id,
                          toolName: customToolName,
                          input: "",
                          providerExecuted: true,
                          firstDelta: true,
                          providerToolName: part.name
                        };
                        controller.enqueue({
                          type: "tool-input-start",
                          id: part.id,
                          toolName: customToolName,
                          providerExecuted: true
                        });
                      } else if (part.name === "advisor") {
                        const customToolName = toolNameMapping.toCustomToolName("advisor");
                        contentBlocks[value.index] = {
                          type: "tool-call",
                          toolCallId: part.id,
                          toolName: customToolName,
                          input: "{}",
                          providerExecuted: true,
                          firstDelta: true,
                          providerToolName: part.name
                        };
                        controller.enqueue({
                          type: "tool-input-start",
                          id: part.id,
                          toolName: customToolName,
                          providerExecuted: true
                        });
                      }
                      return;
                    }
                    case "web_fetch_tool_result": {
                      if (part.content.type === "web_fetch_result") {
                        citationDocuments.push({
                          title: (_a22 = part.content.content.title) != null ? _a22 : part.content.url,
                          mediaType: part.content.content.source.media_type
                        });
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId: part.tool_use_id,
                          toolName: toolNameMapping.toCustomToolName("web_fetch"),
                          result: {
                            type: "web_fetch_result",
                            url: part.content.url,
                            retrievedAt: part.content.retrieved_at,
                            content: {
                              type: part.content.content.type,
                              title: part.content.content.title,
                              citations: part.content.content.citations,
                              source: {
                                type: part.content.content.source.type,
                                mediaType: part.content.content.source.media_type,
                                data: part.content.content.source.data
                              }
                            }
                          }
                        });
                      } else if (part.content.type === "web_fetch_tool_result_error") {
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId: part.tool_use_id,
                          toolName: toolNameMapping.toCustomToolName("web_fetch"),
                          isError: true,
                          result: {
                            type: "web_fetch_tool_result_error",
                            errorCode: part.content.error_code
                          }
                        });
                      }
                      return;
                    }
                    case "web_search_tool_result": {
                      if (Array.isArray(part.content)) {
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId: part.tool_use_id,
                          toolName: toolNameMapping.toCustomToolName("web_search"),
                          result: part.content.map((result) => {
                            var _a3;
                            return {
                              url: result.url,
                              title: result.title,
                              pageAge: (_a3 = result.page_age) != null ? _a3 : null,
                              encryptedContent: result.encrypted_content,
                              type: result.type
                            };
                          })
                        });
                        for (const result of part.content) {
                          controller.enqueue({
                            type: "source",
                            sourceType: "url",
                            id: generateId3(),
                            url: result.url,
                            title: result.title,
                            providerMetadata: {
                              anthropic: {
                                pageAge: (_b22 = result.page_age) != null ? _b22 : null
                              }
                            }
                          });
                        }
                      } else {
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId: part.tool_use_id,
                          toolName: toolNameMapping.toCustomToolName("web_search"),
                          isError: true,
                          result: {
                            type: "web_search_tool_result_error",
                            errorCode: part.content.error_code
                          }
                        });
                      }
                      return;
                    }
                    // code execution 20250522:
                    case "code_execution_tool_result": {
                      if (part.content.type === "code_execution_result") {
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId: part.tool_use_id,
                          toolName: toolNameMapping.toCustomToolName("code_execution"),
                          result: {
                            type: part.content.type,
                            stdout: part.content.stdout,
                            stderr: part.content.stderr,
                            return_code: part.content.return_code,
                            content: (_c = part.content.content) != null ? _c : []
                          }
                        });
                      } else if (part.content.type === "encrypted_code_execution_result") {
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId: part.tool_use_id,
                          toolName: toolNameMapping.toCustomToolName("code_execution"),
                          result: {
                            type: part.content.type,
                            encrypted_stdout: part.content.encrypted_stdout,
                            stderr: part.content.stderr,
                            return_code: part.content.return_code,
                            content: (_d = part.content.content) != null ? _d : []
                          }
                        });
                      } else if (part.content.type === "code_execution_tool_result_error") {
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId: part.tool_use_id,
                          toolName: toolNameMapping.toCustomToolName("code_execution"),
                          isError: true,
                          result: {
                            type: "code_execution_tool_result_error",
                            errorCode: part.content.error_code
                          }
                        });
                      }
                      return;
                    }
                    // code execution 20250825:
                    case "bash_code_execution_tool_result":
                    case "text_editor_code_execution_tool_result": {
                      controller.enqueue({
                        type: "tool-result",
                        toolCallId: part.tool_use_id,
                        toolName: toolNameMapping.toCustomToolName("code_execution"),
                        result: part.content
                      });
                      return;
                    }
                    // tool search tool results:
                    case "tool_search_tool_result": {
                      let providerToolName = serverToolCalls[part.tool_use_id];
                      if (providerToolName == null) {
                        const bm25CustomName = toolNameMapping.toCustomToolName(
                          "tool_search_tool_bm25"
                        );
                        const regexCustomName = toolNameMapping.toCustomToolName(
                          "tool_search_tool_regex"
                        );
                        if (bm25CustomName !== "tool_search_tool_bm25") {
                          providerToolName = "tool_search_tool_bm25";
                        } else if (regexCustomName !== "tool_search_tool_regex") {
                          providerToolName = "tool_search_tool_regex";
                        } else {
                          providerToolName = "tool_search_tool_regex";
                        }
                      }
                      if (part.content.type === "tool_search_tool_search_result") {
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId: part.tool_use_id,
                          toolName: toolNameMapping.toCustomToolName(providerToolName),
                          result: part.content.tool_references.map((ref) => ({
                            type: ref.type,
                            toolName: ref.tool_name
                          }))
                        });
                      } else {
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId: part.tool_use_id,
                          toolName: toolNameMapping.toCustomToolName(providerToolName),
                          isError: true,
                          result: {
                            type: "tool_search_tool_result_error",
                            errorCode: part.content.error_code
                          }
                        });
                      }
                      return;
                    }
                    // advisor results for advisor_20260301:
                    // arrives fully formed in a single content_block_start (no deltas).
                    case "advisor_tool_result": {
                      const advisorToolName = toolNameMapping.toCustomToolName("advisor");
                      if (part.content.type === "advisor_result") {
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId: part.tool_use_id,
                          toolName: advisorToolName,
                          result: {
                            type: "advisor_result",
                            text: part.content.text
                          }
                        });
                      } else if (part.content.type === "advisor_redacted_result") {
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId: part.tool_use_id,
                          toolName: advisorToolName,
                          result: {
                            type: "advisor_redacted_result",
                            encryptedContent: part.content.encrypted_content
                          }
                        });
                      } else {
                        controller.enqueue({
                          type: "tool-result",
                          toolCallId: part.tool_use_id,
                          toolName: advisorToolName,
                          isError: true,
                          result: {
                            type: "advisor_tool_result_error",
                            errorCode: part.content.error_code
                          }
                        });
                      }
                      return;
                    }
                    case "mcp_tool_use": {
                      mcpToolCalls[part.id] = {
                        type: "tool-call",
                        toolCallId: part.id,
                        toolName: part.name,
                        input: JSON.stringify(part.input),
                        providerExecuted: true,
                        dynamic: true,
                        providerMetadata: {
                          anthropic: {
                            type: "mcp-tool-use",
                            serverName: part.server_name
                          }
                        }
                      };
                      controller.enqueue(mcpToolCalls[part.id]);
                      return;
                    }
                    case "mcp_tool_result": {
                      controller.enqueue({
                        type: "tool-result",
                        toolCallId: part.tool_use_id,
                        toolName: mcpToolCalls[part.tool_use_id].toolName,
                        isError: part.is_error,
                        result: part.content,
                        dynamic: true,
                        providerMetadata: mcpToolCalls[part.tool_use_id].providerMetadata
                      });
                      return;
                    }
                    default: {
                      const _exhaustiveCheck = contentBlockType;
                      throw new Error(
                        `Unsupported content block type: ${_exhaustiveCheck}`
                      );
                    }
                  }
                }
                case "content_block_stop": {
                  if (contentBlocks[value.index] != null) {
                    const contentBlock = contentBlocks[value.index];
                    switch (contentBlock.type) {
                      case "text": {
                        controller.enqueue({
                          type: "text-end",
                          id: String(value.index)
                        });
                        break;
                      }
                      case "reasoning": {
                        controller.enqueue({
                          type: "reasoning-end",
                          id: String(value.index)
                        });
                        break;
                      }
                      case "tool-call":
                        const isJsonResponseTool = usesJsonResponseTool && contentBlock.toolName === "json";
                        if (!isJsonResponseTool) {
                          controller.enqueue({
                            type: "tool-input-end",
                            id: contentBlock.toolCallId
                          });
                          let finalInput = contentBlock.input === "" ? "{}" : contentBlock.input;
                          if (contentBlock.providerToolName === "code_execution") {
                            try {
                              const parsed = JSON.parse(finalInput);
                              if (parsed != null && typeof parsed === "object" && "code" in parsed && !("type" in parsed)) {
                                finalInput = JSON.stringify({
                                  type: "programmatic-tool-call",
                                  ...parsed
                                });
                              }
                            } catch (e) {
                            }
                          }
                          controller.enqueue({
                            type: "tool-call",
                            toolCallId: contentBlock.toolCallId,
                            toolName: contentBlock.toolName,
                            input: finalInput,
                            providerExecuted: contentBlock.providerExecuted,
                            // Specific 'web_fetch' or 'web_search' tools may need code execution, which the Anthropic API
                            // implicitly allows. In this scenario, we need to allow 'code_execution' tool calls even if the
                            // tool was not explicitly provided. We therefore bypass the general validation by marking the
                            // tool as dynamic.
                            ...markCodeExecutionDynamic && contentBlock.providerToolName === "code_execution" ? { dynamic: true } : {},
                            ...contentBlock.caller && {
                              providerMetadata: {
                                anthropic: {
                                  caller: contentBlock.caller
                                }
                              }
                            }
                          });
                        }
                        break;
                    }
                    delete contentBlocks[value.index];
                  }
                  blockType = void 0;
                  return;
                }
                case "content_block_delta": {
                  const deltaType = value.delta.type;
                  switch (deltaType) {
                    case "text_delta": {
                      if (usesJsonResponseTool) {
                        return;
                      }
                      controller.enqueue({
                        type: "text-delta",
                        id: String(value.index),
                        delta: value.delta.text
                      });
                      return;
                    }
                    case "thinking_delta": {
                      controller.enqueue({
                        type: "reasoning-delta",
                        id: String(value.index),
                        delta: value.delta.thinking
                      });
                      return;
                    }
                    case "signature_delta": {
                      if (blockType === "thinking") {
                        controller.enqueue({
                          type: "reasoning-delta",
                          id: String(value.index),
                          delta: "",
                          providerMetadata: {
                            anthropic: {
                              signature: value.delta.signature
                            }
                          }
                        });
                      }
                      return;
                    }
                    case "compaction_delta": {
                      if (value.delta.content != null) {
                        controller.enqueue({
                          type: "text-delta",
                          id: String(value.index),
                          delta: value.delta.content
                        });
                      }
                      return;
                    }
                    case "input_json_delta": {
                      const contentBlock = contentBlocks[value.index];
                      let delta = value.delta.partial_json;
                      if (delta.length === 0) {
                        return;
                      }
                      if (isJsonResponseFromTool) {
                        if ((contentBlock == null ? void 0 : contentBlock.type) !== "text") {
                          return;
                        }
                        controller.enqueue({
                          type: "text-delta",
                          id: String(value.index),
                          delta
                        });
                      } else {
                        if ((contentBlock == null ? void 0 : contentBlock.type) !== "tool-call") {
                          return;
                        }
                        if (contentBlock.firstDelta && contentBlock.providerToolName === "code_execution") {
                          delta = `{"type": "programmatic-tool-call",${delta.substring(1)}`;
                        }
                        controller.enqueue({
                          type: "tool-input-delta",
                          id: contentBlock.toolCallId,
                          delta
                        });
                        contentBlock.input += delta;
                        contentBlock.firstDelta = false;
                      }
                      return;
                    }
                    case "citations_delta": {
                      const citation = value.delta.citation;
                      const source = createCitationSource(
                        citation,
                        citationDocuments,
                        generateId3
                      );
                      if (source) {
                        controller.enqueue(source);
                      }
                      return;
                    }
                    default: {
                      const _exhaustiveCheck = deltaType;
                      throw new Error(
                        `Unsupported delta type: ${_exhaustiveCheck}`
                      );
                    }
                  }
                }
                case "message_start": {
                  usage.input_tokens = value.message.usage.input_tokens;
                  usage.cache_read_input_tokens = (_e = value.message.usage.cache_read_input_tokens) != null ? _e : 0;
                  usage.cache_creation_input_tokens = (_f = value.message.usage.cache_creation_input_tokens) != null ? _f : 0;
                  rawUsage = {
                    ...value.message.usage
                  };
                  if (value.message.container != null) {
                    container = {
                      expiresAt: value.message.container.expires_at,
                      id: value.message.container.id,
                      skills: null
                    };
                  }
                  if (value.message.stop_reason != null) {
                    finishReason = {
                      unified: mapAnthropicStopReason({
                        finishReason: value.message.stop_reason,
                        isJsonResponseFromTool
                      }),
                      raw: value.message.stop_reason
                    };
                  }
                  controller.enqueue({
                    type: "response-metadata",
                    id: (_g = value.message.id) != null ? _g : void 0,
                    modelId: (_h = value.message.model) != null ? _h : void 0
                  });
                  if (value.message.content != null) {
                    for (let contentIndex = 0; contentIndex < value.message.content.length; contentIndex++) {
                      const part = value.message.content[contentIndex];
                      if (part.type === "tool_use") {
                        const caller = part.caller;
                        const callerInfo = caller ? {
                          type: caller.type,
                          toolId: "tool_id" in caller ? caller.tool_id : void 0
                        } : void 0;
                        controller.enqueue({
                          type: "tool-input-start",
                          id: part.id,
                          toolName: part.name
                        });
                        const inputStr = JSON.stringify((_i = part.input) != null ? _i : {});
                        controller.enqueue({
                          type: "tool-input-delta",
                          id: part.id,
                          delta: inputStr
                        });
                        controller.enqueue({
                          type: "tool-input-end",
                          id: part.id
                        });
                        controller.enqueue({
                          type: "tool-call",
                          toolCallId: part.id,
                          toolName: part.name,
                          input: inputStr,
                          ...callerInfo && {
                            providerMetadata: {
                              anthropic: {
                                caller: callerInfo
                              }
                            }
                          }
                        });
                      }
                    }
                  }
                  return;
                }
                case "message_delta": {
                  if (value.usage.input_tokens != null && usage.input_tokens !== value.usage.input_tokens) {
                    usage.input_tokens = value.usage.input_tokens;
                  }
                  usage.output_tokens = value.usage.output_tokens;
                  if (value.usage.cache_read_input_tokens != null) {
                    usage.cache_read_input_tokens = value.usage.cache_read_input_tokens;
                  }
                  if (value.usage.cache_creation_input_tokens != null) {
                    usage.cache_creation_input_tokens = value.usage.cache_creation_input_tokens;
                  }
                  if (value.usage.iterations != null) {
                    usage.iterations = value.usage.iterations;
                  }
                  finishReason = {
                    unified: mapAnthropicStopReason({
                      finishReason: value.delta.stop_reason,
                      isJsonResponseFromTool
                    }),
                    raw: (_j = value.delta.stop_reason) != null ? _j : void 0
                  };
                  stopSequence = (_k = value.delta.stop_sequence) != null ? _k : null;
                  stopDetails = mapAnthropicStopDetails(value.delta.stop_details);
                  container = value.delta.container != null ? {
                    expiresAt: value.delta.container.expires_at,
                    id: value.delta.container.id,
                    skills: (_m = (_l = value.delta.container.skills) == null ? void 0 : _l.map((skill) => ({
                      type: skill.type,
                      skillId: skill.skill_id,
                      version: skill.version
                    }))) != null ? _m : null
                  } : null;
                  if (value.context_management) {
                    contextManagement = mapAnthropicResponseContextManagement(
                      value.context_management
                    );
                  }
                  rawUsage = {
                    ...rawUsage,
                    ...value.usage
                  };
                  return;
                }
                case "message_stop": {
                  const anthropicMetadata = {
                    usage: rawUsage != null ? rawUsage : null,
                    stopSequence,
                    ...stopDetails != null ? { stopDetails } : {},
                    iterations: usage.iterations ? usage.iterations.map(
                      (iter) => ({
                        type: iter.type,
                        ...iter.model != null ? { model: iter.model } : {},
                        inputTokens: iter.input_tokens,
                        outputTokens: iter.output_tokens,
                        ...iter.cache_creation_input_tokens ? {
                          cacheCreationInputTokens: iter.cache_creation_input_tokens
                        } : {},
                        ...iter.cache_read_input_tokens ? {
                          cacheReadInputTokens: iter.cache_read_input_tokens
                        } : {}
                      })
                    ) : null,
                    container,
                    contextManagement
                  };
                  const providerMetadata = {
                    anthropic: anthropicMetadata
                  };
                  if (usedCustomProviderKey && providerOptionsName !== "anthropic") {
                    providerMetadata[providerOptionsName] = anthropicMetadata;
                  }
                  controller.enqueue({
                    type: "finish",
                    finishReason,
                    usage: convertAnthropicUsage({ usage, rawUsage }),
                    providerMetadata
                  });
                  return;
                }
                case "error": {
                  controller.enqueue({ type: "error", error: value.error });
                  return;
                }
                default: {
                  const _exhaustiveCheck = value;
                  throw new Error(`Unsupported chunk type: ${_exhaustiveCheck}`);
                }
              }
            }
          })
        );
        const [streamForFirstChunk, streamForConsumer] = transformedStream.tee();
        const firstChunkReader = streamForFirstChunk.getReader();
        try {
          await firstChunkReader.read();
          let result = await firstChunkReader.read();
          if (((_a2 = result.value) == null ? void 0 : _a2.type) === "raw") {
            result = await firstChunkReader.read();
          }
          if (((_b2 = result.value) == null ? void 0 : _b2.type) === "error") {
            const error = result.value.error;
            throw new APICallError6({
              message: error.message,
              url,
              requestBodyValues: body,
              statusCode: error.type === "overloaded_error" ? 529 : 500,
              responseHeaders,
              responseBody: JSON.stringify(error),
              isRetryable: error.type === "overloaded_error"
            });
          }
        } finally {
          firstChunkReader.cancel().catch(() => {
          });
          firstChunkReader.releaseLock();
        }
        return {
          stream: streamForConsumer,
          request: { body },
          response: { headers: responseHeaders }
        };
      }
    };
    bash_20241022InputSchema = lazySchema(
      () => zodSchema(
        z153.object({
          command: z153.string(),
          restart: z153.boolean().optional()
        })
      )
    );
    bash_20241022_internal = createProviderDefinedToolFactory({
      id: "anthropic.bash_20241022",
      inputSchema: bash_20241022InputSchema
    });
    bash_20250124InputSchema = lazySchema(
      () => zodSchema(
        z163.object({
          command: z163.string(),
          restart: z163.boolean().optional()
        })
      )
    );
    bash_20250124_internal = createProviderDefinedToolFactory({
      id: "anthropic.bash_20250124",
      inputSchema: bash_20250124InputSchema
    });
    computer_20241022InputSchema = lazySchema(
      () => zodSchema(
        z173.object({
          action: z173.enum([
            "key",
            "type",
            "mouse_move",
            "left_click",
            "left_click_drag",
            "right_click",
            "middle_click",
            "double_click",
            "screenshot",
            "cursor_position"
          ]),
          coordinate: z173.array(z173.number().int()).optional(),
          text: z173.string().optional()
        })
      )
    );
    computer_20241022 = createProviderDefinedToolFactory({
      id: "anthropic.computer_20241022",
      inputSchema: computer_20241022InputSchema
    });
    computer_20250124InputSchema = lazySchema(
      () => zodSchema(
        z183.object({
          action: z183.enum([
            "key",
            "hold_key",
            "type",
            "cursor_position",
            "mouse_move",
            "left_mouse_down",
            "left_mouse_up",
            "left_click",
            "left_click_drag",
            "right_click",
            "middle_click",
            "double_click",
            "triple_click",
            "scroll",
            "wait",
            "screenshot"
          ]),
          coordinate: z183.tuple([z183.number().int(), z183.number().int()]).optional(),
          duration: z183.number().optional(),
          scroll_amount: z183.number().optional(),
          scroll_direction: z183.enum(["up", "down", "left", "right"]).optional(),
          start_coordinate: z183.tuple([z183.number().int(), z183.number().int()]).optional(),
          text: z183.string().optional()
        })
      )
    );
    computer_20250124 = createProviderDefinedToolFactory({
      id: "anthropic.computer_20250124",
      inputSchema: computer_20250124InputSchema
    });
    computer_20251124InputSchema = lazySchema(
      () => zodSchema(
        z193.object({
          action: z193.enum([
            "key",
            "hold_key",
            "type",
            "cursor_position",
            "mouse_move",
            "left_mouse_down",
            "left_mouse_up",
            "left_click",
            "left_click_drag",
            "right_click",
            "middle_click",
            "double_click",
            "triple_click",
            "scroll",
            "wait",
            "screenshot",
            "zoom"
          ]),
          coordinate: z193.tuple([z193.number().int(), z193.number().int()]).optional(),
          duration: z193.number().optional(),
          region: z193.tuple([
            z193.number().int(),
            z193.number().int(),
            z193.number().int(),
            z193.number().int()
          ]).optional(),
          scroll_amount: z193.number().optional(),
          scroll_direction: z193.enum(["up", "down", "left", "right"]).optional(),
          start_coordinate: z193.tuple([z193.number().int(), z193.number().int()]).optional(),
          text: z193.string().optional()
        })
      )
    );
    computer_20251124 = createProviderDefinedToolFactory({
      id: "anthropic.computer_20251124",
      inputSchema: computer_20251124InputSchema
    });
    memory_20250818InputSchema = lazySchema(
      () => zodSchema(
        z203.discriminatedUnion("command", [
          z203.object({
            command: z203.literal("view"),
            path: z203.string(),
            view_range: z203.tuple([z203.number(), z203.number()]).optional()
          }),
          z203.object({
            command: z203.literal("create"),
            path: z203.string(),
            file_text: z203.string()
          }),
          z203.object({
            command: z203.literal("str_replace"),
            path: z203.string(),
            old_str: z203.string(),
            new_str: z203.string()
          }),
          z203.object({
            command: z203.literal("insert"),
            path: z203.string(),
            insert_line: z203.number(),
            insert_text: z203.string()
          }),
          z203.object({
            command: z203.literal("delete"),
            path: z203.string()
          }),
          z203.object({
            command: z203.literal("rename"),
            old_path: z203.string(),
            new_path: z203.string()
          })
        ])
      )
    );
    memory_20250818 = createProviderDefinedToolFactory({
      id: "anthropic.memory_20250818",
      inputSchema: memory_20250818InputSchema
    });
    textEditor_20241022InputSchema = lazySchema(
      () => zodSchema(
        z213.object({
          command: z213.enum(["view", "create", "str_replace", "insert", "undo_edit"]),
          path: z213.string(),
          file_text: z213.string().optional(),
          insert_line: z213.number().int().optional(),
          new_str: z213.string().optional(),
          insert_text: z213.string().optional(),
          old_str: z213.string().optional(),
          view_range: z213.array(z213.number().int()).optional()
        })
      )
    );
    textEditor_20241022 = createProviderDefinedToolFactory({
      id: "anthropic.text_editor_20241022",
      inputSchema: textEditor_20241022InputSchema
    });
    textEditor_20250124InputSchema = lazySchema(
      () => zodSchema(
        z223.object({
          command: z223.enum(["view", "create", "str_replace", "insert", "undo_edit"]),
          path: z223.string(),
          file_text: z223.string().optional(),
          insert_line: z223.number().int().optional(),
          new_str: z223.string().optional(),
          insert_text: z223.string().optional(),
          old_str: z223.string().optional(),
          view_range: z223.array(z223.number().int()).optional()
        })
      )
    );
    textEditor_20250124 = createProviderDefinedToolFactory({
      id: "anthropic.text_editor_20250124",
      inputSchema: textEditor_20250124InputSchema
    });
    textEditor_20250429InputSchema = lazySchema(
      () => zodSchema(
        z232.object({
          command: z232.enum(["view", "create", "str_replace", "insert"]),
          path: z232.string(),
          file_text: z232.string().optional(),
          insert_line: z232.number().int().optional(),
          new_str: z232.string().optional(),
          insert_text: z232.string().optional(),
          old_str: z232.string().optional(),
          view_range: z232.array(z232.number().int()).optional()
        })
      )
    );
    textEditor_20250429 = createProviderDefinedToolFactory({
      id: "anthropic.text_editor_20250429",
      inputSchema: textEditor_20250429InputSchema
    });
    toolSearchBm25_20251119OutputSchema = lazySchema(
      () => zodSchema(
        z242.array(
          z242.object({
            type: z242.literal("tool_reference"),
            toolName: z242.string()
          })
        )
      )
    );
    toolSearchBm25_20251119InputSchema = lazySchema(
      () => zodSchema(
        z242.object({
          /**
           * A natural language query to search for tools.
           * Claude will use BM25 text search to find relevant tools.
           */
          query: z242.string(),
          /**
           * Maximum number of tools to return. Optional.
           */
          limit: z242.number().optional()
        })
      )
    );
    factory11 = createProviderExecutedToolFactory({
      id: "anthropic.tool_search_bm25_20251119",
      inputSchema: toolSearchBm25_20251119InputSchema,
      outputSchema: toolSearchBm25_20251119OutputSchema,
      supportsDeferredResults: true
    });
    toolSearchBm25_20251119 = (args = {}) => {
      return factory11(args);
    };
    anthropicTools = {
      /**
       * Pairs a faster executor model with a higher-intelligence advisor model
       * that provides strategic guidance mid-generation.
       *
       * The advisor lets a faster, lower-cost executor model consult a
       * higher-intelligence advisor model server-side. The advisor reads the
       * executor's full transcript and produces a plan or course correction;
       * the executor continues with the task, informed by the advice. All of
       * this happens inside a single `/v1/messages` request.
       *
       * Beta header `advisor-tool-2026-03-01` is added automatically when this
       * tool is included.
       *
       * Multi-turn conversations: pass the full assistant content (including
       * `advisor_tool_result` blocks) back to the API on subsequent turns. If
       * you omit the advisor tool from `tools` on a follow-up turn while the
       * message history still contains `advisor_tool_result` blocks, the API
       * returns a `400 invalid_request_error`.
       *
       * Supported executor models: Claude Haiku 4.5, Sonnet 4.6, Opus 4.6,
       * Opus 4.7. The advisor must be at least as capable as the executor.
       *
       * @param model - The advisor model ID (required), e.g. `"claude-opus-4-8"`.
       * @param maxUses - Maximum advisor calls per request (per-request cap).
       * @param caching - Enables prompt caching for the advisor's transcript
       * across calls within a conversation. Worthwhile from ~3 advisor calls
       * per conversation.
       */
      advisor_20260301,
      /**
       * The bash tool enables Claude to execute shell commands in a persistent bash session,
       * allowing system operations, script execution, and command-line automation.
       *
       * Image results are supported.
       */
      bash_20241022,
      /**
       * The bash tool enables Claude to execute shell commands in a persistent bash session,
       * allowing system operations, script execution, and command-line automation.
       *
       * Image results are supported.
       */
      bash_20250124,
      /**
       * Claude can analyze data, create visualizations, perform complex calculations,
       * run system commands, create and edit files, and process uploaded files directly within
       * the API conversation.
       *
       * The code execution tool allows Claude to run Bash commands and manipulate files,
       * including writing code, in a secure, sandboxed environment.
       */
      codeExecution_20250522,
      /**
       * Claude can analyze data, create visualizations, perform complex calculations,
       * run system commands, create and edit files, and process uploaded files directly within
       * the API conversation.
       *
       * The code execution tool allows Claude to run both Python and Bash commands and manipulate files,
       * including writing code, in a secure, sandboxed environment.
       *
       * This is the latest version with enhanced Bash support and file operations.
       */
      codeExecution_20250825,
      /**
       * Claude can analyze data, create visualizations, perform complex calculations,
       * run system commands, create and edit files, and process uploaded files directly within
       * the API conversation.
       *
       * The code execution tool allows Claude to run both Python and Bash commands and manipulate files,
       * including writing code, in a secure, sandboxed environment.
       *
       * This is the recommended version. Does not require a beta header.
       *
       * Supported models: Claude Opus 4.6, Sonnet 4.6, Sonnet 4.5, Opus 4.5
       */
      codeExecution_20260120,
      /**
       * Claude can interact with computer environments through the computer use tool, which
       * provides screenshot capabilities and mouse/keyboard control for autonomous desktop interaction.
       *
       * Image results are supported.
       *
       * @param displayWidthPx - The width of the display being controlled by the model in pixels.
       * @param displayHeightPx - The height of the display being controlled by the model in pixels.
       * @param displayNumber - The display number to control (only relevant for X11 environments). If specified, the tool will be provided a display number in the tool definition.
       */
      computer_20241022,
      /**
       * Claude can interact with computer environments through the computer use tool, which
       * provides screenshot capabilities and mouse/keyboard control for autonomous desktop interaction.
       *
       * Image results are supported.
       *
       * @param displayWidthPx - The width of the display being controlled by the model in pixels.
       * @param displayHeightPx - The height of the display being controlled by the model in pixels.
       * @param displayNumber - The display number to control (only relevant for X11 environments). If specified, the tool will be provided a display number in the tool definition.
       */
      computer_20250124,
      /**
       * Claude can interact with computer environments through the computer use tool, which
       * provides screenshot capabilities and mouse/keyboard control for autonomous desktop interaction.
       *
       * This version adds the zoom action for detailed screen region inspection.
       *
       * Image results are supported.
       *
       * Supported models: Claude Opus 4.5
       *
       * @param displayWidthPx - The width of the display being controlled by the model in pixels.
       * @param displayHeightPx - The height of the display being controlled by the model in pixels.
       * @param displayNumber - The display number to control (only relevant for X11 environments). If specified, the tool will be provided a display number in the tool definition.
       * @param enableZoom - Enable zoom action. Set to true to allow Claude to zoom into specific screen regions. Default: false.
       */
      computer_20251124,
      /**
       * The memory tool enables Claude to store and retrieve information across conversations through a memory file directory.
       * Claude can create, read, update, and delete files that persist between sessions,
       * allowing it to build knowledge over time without keeping everything in the context window.
       * The memory tool operates client-side—you control where and how the data is stored through your own infrastructure.
       *
       * Supported models: Claude Sonnet 4.5, Claude Sonnet 4, Claude Opus 4.1, Claude Opus 4.
       */
      memory_20250818,
      /**
       * Claude can use an Anthropic-defined text editor tool to view and modify text files,
       * helping you debug, fix, and improve your code or other text documents. This allows Claude
       * to directly interact with your files, providing hands-on assistance rather than just suggesting changes.
       *
       * Supported models: Claude Sonnet 3.5
       */
      textEditor_20241022,
      /**
       * Claude can use an Anthropic-defined text editor tool to view and modify text files,
       * helping you debug, fix, and improve your code or other text documents. This allows Claude
       * to directly interact with your files, providing hands-on assistance rather than just suggesting changes.
       *
       * Supported models: Claude Sonnet 3.7
       */
      textEditor_20250124,
      /**
       * Claude can use an Anthropic-defined text editor tool to view and modify text files,
       * helping you debug, fix, and improve your code or other text documents. This allows Claude
       * to directly interact with your files, providing hands-on assistance rather than just suggesting changes.
       *
       * Note: This version does not support the "undo_edit" command.
       *
       * @deprecated Use textEditor_20250728 instead
       */
      textEditor_20250429,
      /**
       * Claude can use an Anthropic-defined text editor tool to view and modify text files,
       * helping you debug, fix, and improve your code or other text documents. This allows Claude
       * to directly interact with your files, providing hands-on assistance rather than just suggesting changes.
       *
       * Note: This version does not support the "undo_edit" command and adds optional max_characters parameter.
       *
       * Supported models: Claude Sonnet 4, Opus 4, and Opus 4.1
       *
       * @param maxCharacters - Optional maximum number of characters to view in the file
       */
      textEditor_20250728,
      /**
       * Creates a web fetch tool that gives Claude direct access to real-time web content.
       *
       * @param maxUses - The max_uses parameter limits the number of web fetches performed
       * @param allowedDomains - Only fetch from these domains
       * @param blockedDomains - Never fetch from these domains
       * @param citations - Unlike web search where citations are always enabled, citations are optional for web fetch. Set "citations": {"enabled": true} to enable Claude to cite specific passages from fetched documents.
       * @param maxContentTokens - The max_content_tokens parameter limits the amount of content that will be included in the context.
       */
      webFetch_20250910,
      /**
       * Creates a web fetch tool that gives Claude direct access to real-time web content.
       *
       * @param maxUses - The max_uses parameter limits the number of web fetches performed
       * @param allowedDomains - Only fetch from these domains
       * @param blockedDomains - Never fetch from these domains
       * @param citations - Unlike web search where citations are always enabled, citations are optional for web fetch. Set "citations": {"enabled": true} to enable Claude to cite specific passages from fetched documents.
       * @param maxContentTokens - The max_content_tokens parameter limits the amount of content that will be included in the context.
       */
      webFetch_20260209,
      /**
       * Creates a web search tool that gives Claude direct access to real-time web content.
       *
       * @param maxUses - Maximum number of web searches Claude can perform during the conversation.
       * @param allowedDomains - Optional list of domains that Claude is allowed to search.
       * @param blockedDomains - Optional list of domains that Claude should avoid when searching.
       * @param userLocation - Optional user location information to provide geographically relevant search results.
       */
      webSearch_20250305,
      /**
       * Creates a web search tool that gives Claude direct access to real-time web content.
       *
       * @param maxUses - Maximum number of web searches Claude can perform during the conversation.
       * @param allowedDomains - Optional list of domains that Claude is allowed to search.
       * @param blockedDomains - Optional list of domains that Claude should avoid when searching.
       * @param userLocation - Optional user location information to provide geographically relevant search results.
       */
      webSearch_20260209,
      /**
       * Creates a tool search tool that uses regex patterns to find tools.
       *
       * The tool search tool enables Claude to work with hundreds or thousands of tools
       * by dynamically discovering and loading them on-demand. Instead of loading all
       * tool definitions into the context window upfront, Claude searches your tool
       * catalog and loads only the tools it needs.
       *
       * Use `providerOptions: { anthropic: { deferLoading: true } }` on other tools
       * to mark them for deferred loading.
       *
       * Supported models: Claude Opus 4.5, Claude Sonnet 4.5
       */
      toolSearchRegex_20251119,
      /**
       * Creates a tool search tool that uses BM25 (natural language) to find tools.
       *
       * The tool search tool enables Claude to work with hundreds or thousands of tools
       * by dynamically discovering and loading them on-demand. Instead of loading all
       * tool definitions into the context window upfront, Claude searches your tool
       * catalog and loads only the tools it needs.
       *
       * Use `providerOptions: { anthropic: { deferLoading: true } }` on other tools
       * to mark them for deferred loading.
       *
       * Supported models: Claude Opus 4.5, Claude Sonnet 4.5
       */
      toolSearchBm25_20251119
    };
    anthropicSkillResponseSchema = lazySchema(
      () => zodSchema(
        z252.object({
          id: z252.string(),
          display_title: z252.string().nullish(),
          name: z252.string().nullish(),
          description: z252.string().nullish(),
          latest_version: z252.string().nullish(),
          source: z252.string(),
          created_at: z252.string(),
          updated_at: z252.string()
        })
      )
    );
    anthropicSkillVersionListResponseSchema = lazySchema(
      () => zodSchema(
        z252.object({
          data: z252.array(
            z252.object({
              version: z252.string()
            })
          )
        })
      )
    );
    anthropicSkillVersionResponseSchema = lazySchema(
      () => zodSchema(
        z252.object({
          type: z252.string(),
          skill_id: z252.string(),
          name: z252.string().nullish(),
          description: z252.string().nullish()
        })
      )
    );
    AnthropicSkills = class {
      constructor(config) {
        this.config = config;
        this.specificationVersion = "v4";
      }
      get provider() {
        return this.config.provider;
      }
      async getHeaders() {
        return combineHeaders(await resolve(this.config.headers), {
          "anthropic-beta": "skills-2025-10-02"
        });
      }
      async fetchVersionMetadata({
        skillId,
        version,
        headers
      }) {
        const { value: versionResponse } = await getFromApi({
          url: `${this.config.baseURL}/skills/${skillId}/versions/${version}`,
          headers,
          failedResponseHandler: anthropicFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            anthropicSkillVersionResponseSchema
          ),
          fetch: this.config.fetch
        });
        return {
          ...versionResponse.name != null ? { name: versionResponse.name } : {},
          ...versionResponse.description != null ? { description: versionResponse.description } : {}
        };
      }
      async uploadSkill(params) {
        var _a2, _b2;
        const warnings = [];
        const formData = new FormData();
        if (params.displayTitle != null) {
          formData.append("display_title", params.displayTitle);
        }
        for (const file of params.files) {
          const content = convertInlineFileDataToUint8Array(file.data);
          formData.append("files[]", new Blob([content]), file.path);
        }
        const headers = await this.getHeaders();
        const { value: response } = await postFormDataToApi({
          url: `${this.config.baseURL}/skills`,
          headers,
          formData,
          failedResponseHandler: anthropicFailedResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            anthropicSkillResponseSchema
          ),
          fetch: this.config.fetch
        });
        const versionMetadata = response.latest_version != null ? await this.fetchVersionMetadata({
          skillId: response.id,
          version: response.latest_version,
          headers
        }) : {};
        const name2 = (_a2 = versionMetadata.name) != null ? _a2 : response.name;
        const description = (_b2 = versionMetadata.description) != null ? _b2 : response.description;
        return {
          providerReference: { anthropic: response.id },
          ...response.display_title != null ? { displayTitle: response.display_title } : {},
          ...name2 != null ? { name: name2 } : {},
          ...description != null ? { description } : {},
          ...response.latest_version != null ? { latestVersion: response.latest_version } : {},
          providerMetadata: {
            anthropic: {
              ...response.source != null ? { source: response.source } : {},
              ...response.created_at != null ? { createdAt: response.created_at } : {},
              ...response.updated_at != null ? { updatedAt: response.updated_at } : {}
            }
          },
          warnings
        };
      }
    };
    VERSION4 = true ? "4.0.0" : "0.0.0-test";
    anthropic = createAnthropic();
  }
});

// src/config.ts
import { z } from "zod";
var SynthesisStrategySchema = z.enum([
  "single_judge",
  "majority_vote",
  "best_of_n"
]);
var PanelModelSchema = z.union([
  z.string().describe("OpenCode provider/model reference, e.g. 'litellm/deepseek-3.2'"),
  z.object({
    model: z.string().describe("OpenCode provider/model reference or raw model ID"),
    weight: z.number().default(1),
    maxContext: z.number().optional().describe("Max context tokens this model supports. Used for selective routing."),
    supportsImages: z.boolean().optional().describe("Whether this model supports image input."),
    provider: z.string().optional(),
    apiKey: z.string().optional(),
    baseURL: z.string().optional()
  })
]);
var JudgeModelSchema = z.union([
  z.string().describe("OpenCode provider/model reference, e.g. 'litellm/glm-4.7-flash'"),
  z.object({
    provider: z.string(),
    model: z.string(),
    apiKey: z.string().optional(),
    baseURL: z.string().optional()
  })
]);
var RoutingPolicySchema = z.object({
  mode: z.enum(["always", "manual", "auto"]).default("always"),
  complexityThreshold: z.number().min(0).max(1).default(0.7)
});
var ContextLimitsSchema = z.object({
  default: z.number().default(128e3).describe("Default context limit for panels without explicit maxContext"),
  skipThreshold: z.number().default(256e3).describe("Input token count above which short-context panels are skipped entirely")
});
var FusionModelConfigSchema = z.object({
  panel: z.array(PanelModelSchema).min(2),
  judge: JudgeModelSchema,
  strategy: SynthesisStrategySchema.default("single_judge"),
  routing: RoutingPolicySchema.default({}),
  timeout: z.number().default(12e4),
  judgeSystemPrompt: z.string().optional(),
  contextLimits: ContextLimitsSchema.default({})
});
var FusionConfigSchema = z.union([
  FusionModelConfigSchema,
  z.object({
    models: z.record(z.string(), FusionModelConfigSchema),
    defaults: z.object({
      strategy: SynthesisStrategySchema.default("single_judge"),
      routing: RoutingPolicySchema.default({}),
      timeout: z.number().default(12e4),
      judgeSystemPrompt: z.string().optional(),
      contextLimits: ContextLimitsSchema.default({})
    }).default({})
  })
]);
var DEFAULT_JUDGE_SYSTEM_PROMPT = `You are a synthesis judge. You receive multiple responses to the same prompt from different AI models.

Your task:
1. Identify points of agreement across responses.
2. Identify contradictions or disagreements.
3. Identify unique insights that only one model provided.
4. Synthesize the best possible answer by combining strengths and resolving conflicts.

Rules:
- Prefer factual accuracy over fluency.
- When models disagree on facts, note the disagreement and provide the most likely correct answer with reasoning.
- Preserve code exactly when models agree on implementation. When they differ, pick the most correct/idiomatic version and explain why.
- Do NOT mention that you are synthesizing multiple responses. Respond as if you are the sole author.
- Do NOT include labels like "Response 1", "Response 2", or any indication of multiple sources.
- Do NOT list or enumerate the individual responses. Produce ONE unified answer.
- Match the format and style appropriate for the original question.
- Be CONCISE. Your answer should be shorter than the longest panel response, not longer. Strip redundancy, filler, and repetition.
- If the original prompt is simple (e.g. a greeting or "test"), respond with a single short sentence. Do NOT over-elaborate.
- Never repeat yourself. Say each thing exactly once.`;

// src/fusion-model.ts
import { generateText, streamText } from "ai";

// src/providers.ts
function resolveModelConfig(config) {
  if (typeof config === "string") {
    const parts = config.split("/");
    if (parts.length < 2) {
      throw new Error(`Invalid model reference "${config}". Use "provider/model" format.`);
    }
    const provider = parts[0];
    const model = parts.slice(1).join("/");
    return { provider, model };
  }
  if (config.model?.includes("/") && !config.provider) {
    const parts = config.model.split("/");
    const provider = parts[0];
    const model = parts.slice(1).join("/");
    return { provider, model, apiKey: config.apiKey, baseURL: config.baseURL, weight: config.weight };
  }
  return {
    provider: config.provider ?? "openai",
    model: config.model,
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    weight: config.weight
  };
}
function createProviderModel(config) {
  const resolved = resolveModelConfig(config);
  const { provider, model, apiKey, baseURL } = resolved;
  switch (provider) {
    case "@ai-sdk/openai":
    case "openai":
      return createOpenAIModel(model, apiKey, baseURL);
    case "@ai-sdk/google":
    case "google":
      return createGoogleModel(model, apiKey, baseURL);
    case "@ai-sdk/anthropic":
    case "anthropic":
      return createAnthropicModel(model, apiKey, baseURL);
    default:
      return createOpenAICompatibleModel(provider, model, apiKey, baseURL);
  }
}
function createOpenAIModel(model, apiKey, baseURL) {
  const { createOpenAI: createOpenAI2 } = (init_dist4(), __toCommonJS(dist_exports));
  const openai2 = createOpenAI2({
    ...apiKey && { apiKey },
    ...baseURL && { baseURL }
  });
  return openai2(model);
}
function createGoogleModel(model, apiKey, baseURL) {
  const { createGoogleGenerativeAI } = (init_dist5(), __toCommonJS(dist_exports2));
  const google2 = createGoogleGenerativeAI({
    ...apiKey && { apiKey },
    ...baseURL && { baseURL }
  });
  return google2(model);
}
function createAnthropicModel(model, apiKey, baseURL) {
  const { createAnthropic: createAnthropic2 } = (init_dist6(), __toCommonJS(dist_exports3));
  const anthropic2 = createAnthropic2({
    ...apiKey && { apiKey },
    ...baseURL && { baseURL }
  });
  return anthropic2(model);
}
function loadOpenCodeProviderConfig(providerName) {
  const fs = __require("fs");
  const path = __require("path");
  const candidates = [
    path.join(process.cwd(), ".opencode", "opencode.json"),
    path.join(process.cwd(), ".opencode", "opencode.jsonc"),
    path.join(process.env.HOME ?? "~", ".config", "opencode", "opencode.json"),
    path.join(process.env.HOME ?? "~", ".config", "opencode", "opencode.jsonc")
  ];
  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      const raw = fs.readFileSync(candidate, "utf-8");
      const cleaned = candidate.endsWith(".jsonc") ? raw.replace(/(?<![:"\\])\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "") : raw;
      const parsed = JSON.parse(cleaned);
      const provider = parsed?.provider?.[providerName];
      if (provider) {
        return {
          baseURL: provider.api || provider.baseURL,
          apiKey: provider.options?.apiKey || provider.apiKey
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}
function createOpenAICompatibleModel(provider, model, apiKey, baseURL) {
  const { createOpenAI: createOpenAI2 } = (init_dist4(), __toCommonJS(dist_exports));
  let resolvedBaseURL = baseURL;
  let resolvedApiKey = apiKey;
  if (!resolvedBaseURL || !resolvedApiKey) {
    const opencodeConfig = loadOpenCodeProviderConfig(provider);
    if (opencodeConfig) {
      resolvedBaseURL = resolvedBaseURL ?? opencodeConfig.baseURL;
      resolvedApiKey = resolvedApiKey ?? opencodeConfig.apiKey;
    }
  }
  if (!resolvedBaseURL) {
    resolvedBaseURL = process.env[`${provider.toUpperCase()}_BASE_URL`] ?? process.env.LITELLM_BASE_URL;
  }
  if (!resolvedApiKey) {
    resolvedApiKey = process.env[`${provider.toUpperCase()}_API_KEY`] ?? process.env.LITELLM_API_KEY;
  }
  if (!resolvedBaseURL) {
    throw new Error(
      `Provider "${provider}" not found. Configure it in opencode.json, set ${provider.toUpperCase()}_BASE_URL env var, or use baseURL in panel config.`
    );
  }
  const openai2 = createOpenAI2({
    apiKey: resolvedApiKey ?? "",
    baseURL: resolvedBaseURL
  });
  return openai2(model);
}

// src/context-packer.ts
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
function estimateMessagesTokens(messages) {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
}
var HIGH_PRIORITY_PATTERNS = [
  /^diff --git/m,
  /^@@\s/m,
  /^\+\+\+\s/m,
  /^---\s/m,
  /Error:/i,
  /error\[/i,
  /at\s+\S+\s+\(.+:\d+:\d+\)/,
  // stack trace frame
  /TypeError|ReferenceError|SyntaxError/,
  /FAIL|FAILED/,
  /panic:|fatal:/i,
  /^\s*\d+\s*\|/m
  // diagnostic line-numbered output
];
var MEDIUM_PRIORITY_PATTERNS = [
  /```[\s\S]*?```/,
  /\.(ts|js|py|go|rs|java|tsx|jsx|css|html)\b/,
  /import\s/,
  /function\s/,
  /class\s/,
  /interface\s/
];
function scorePriority(msg, index, totalMessages) {
  if (msg.role === "system") return "hard";
  if (msg.role === "user" && index === totalMessages - 1) return "hard";
  if (msg.role === "user" && index === totalMessages - 2) return "hard";
  if (index >= totalMessages - 6) return "high";
  for (const pattern of HIGH_PRIORITY_PATTERNS) {
    if (pattern.test(msg.content)) return "high";
  }
  for (const pattern of MEDIUM_PRIORITY_PATTERNS) {
    if (pattern.test(msg.content)) return "medium";
  }
  return "low";
}
function packContext(messages, maxTokens) {
  const originalTokens = estimateMessagesTokens(messages);
  if (originalTokens <= maxTokens) {
    return { messages, originalTokens, packedTokens: originalTokens, droppedCount: 0 };
  }
  const scored = messages.map((message, index) => ({
    message,
    index,
    priority: scorePriority(message, index, messages.length),
    tokens: estimateTokens(message.content) + 4
  }));
  const hard = scored.filter((s) => s.priority === "hard");
  const high = scored.filter((s) => s.priority === "high");
  const medium = scored.filter((s) => s.priority === "medium");
  const low = scored.filter((s) => s.priority === "low");
  let budget = maxTokens;
  const kept = [];
  for (const s of hard) {
    kept.push(s);
    budget -= s.tokens;
  }
  if (budget < 0) {
    const sortedHard = [...kept].sort((a, b) => b.tokens - a.tokens);
    for (const s of sortedHard) {
      if (s.message.role === "system" && budget < 0) {
        const targetTokens = s.tokens + budget - 100;
        if (targetTokens > 200) {
          const targetChars = targetTokens * 4;
          s.message = { ...s.message, content: s.message.content.slice(0, targetChars) + "\n[... truncated ...]" };
          s.tokens = estimateTokens(s.message.content) + 4;
          budget = maxTokens - kept.reduce((sum, k) => sum + k.tokens, 0);
        }
      }
    }
  }
  for (const s of high) {
    if (budget >= s.tokens) {
      kept.push(s);
      budget -= s.tokens;
    } else if (budget > 200) {
      const targetChars = (budget - 100) * 4;
      if (targetChars > 200) {
        const truncated = {
          ...s,
          message: { ...s.message, content: s.message.content.slice(0, targetChars) + "\n[... truncated ...]" },
          tokens: budget - 50
        };
        kept.push(truncated);
        budget -= truncated.tokens;
      }
      break;
    } else {
      break;
    }
  }
  for (const s of medium) {
    if (budget >= s.tokens) {
      kept.push(s);
      budget -= s.tokens;
    } else if (budget > 200) {
      const targetChars = (budget - 100) * 4;
      if (targetChars > 200) {
        const truncated = {
          ...s,
          message: { ...s.message, content: s.message.content.slice(0, targetChars) + "\n[... truncated ...]" },
          tokens: budget - 50
        };
        kept.push(truncated);
        budget -= truncated.tokens;
      }
      break;
    } else {
      break;
    }
  }
  for (const s of low) {
    if (budget >= s.tokens) {
      kept.push(s);
      budget -= s.tokens;
    } else {
      break;
    }
  }
  kept.sort((a, b) => a.index - b.index);
  const packedMessages = kept.map((s) => s.message);
  const droppedCount = messages.length - packedMessages.length;
  if (droppedCount > 0) {
    const lastSystemIdx = packedMessages.findLastIndex((m) => m.role === "system");
    const insertIdx = lastSystemIdx + 1;
    packedMessages.splice(insertIdx, 0, {
      role: "user",
      content: `[Note: ${droppedCount} earlier messages were omitted to fit context window. The most recent and relevant messages are preserved below.]`
    });
  }
  return {
    messages: packedMessages,
    originalTokens,
    packedTokens: estimateMessagesTokens(packedMessages),
    droppedCount
  };
}
function estimatePromptTokens(messages) {
  return estimateMessagesTokens(messages);
}

// src/panel-router.ts
var KNOWN_CONTEXT_LIMITS = {
  "kimi-2.5": 1048576,
  "qwen3-coder-next": 1048576,
  "qwen.qwen3-coder-next": 1048576,
  "deepseek-3.2": 128e3,
  "glm-5": 128e3,
  "glm-4.7": 128e3,
  "glm-4.7-flash": 128e3,
  "qwen-3": 128e3,
  "sonnet-4.5": 2e5,
  "sonnet-4.6": 2e5,
  "opus-4.5": 2e5,
  "opus-4.6": 2e5,
  "opus-4.7": 2e5,
  "opus-4.8": 2e5
};
var KNOWN_IMAGE_SUPPORT = {
  "kimi-2.5": true,
  "glm-5": true,
  "glm-4.7": true,
  "glm-4.7-flash": true,
  "qwen-3": true,
  "qwen.qwen3-vl-235b-a22b": true,
  "sonnet-4.5": true,
  "sonnet-4.6": true,
  "opus-4.5": true,
  "opus-4.6": true,
  "opus-4.7": true,
  "opus-4.8": true,
  "deepseek-3.2": false,
  "qwen3-coder-next": false,
  "qwen.qwen3-coder-next": false
};
function getModelId(panel) {
  if (typeof panel === "string") {
    const parts2 = panel.split("/");
    return parts2[parts2.length - 1];
  }
  const parts = panel.model.split("/");
  return parts[parts.length - 1];
}
function getPanelMaxContext(panel, defaultLimit) {
  if (typeof panel !== "string" && panel.maxContext) {
    return panel.maxContext;
  }
  const modelId = getModelId(panel);
  if (KNOWN_CONTEXT_LIMITS[modelId]) {
    return KNOWN_CONTEXT_LIMITS[modelId];
  }
  return defaultLimit;
}
function panelSupportsImages(panel) {
  if (typeof panel !== "string" && panel.supportsImages !== void 0) {
    return panel.supportsImages;
  }
  const modelId = getModelId(panel);
  return KNOWN_IMAGE_SUPPORT[modelId] ?? false;
}
function hasImages(messages) {
  return messages.some(
    (m) => Array.isArray(m.content) && m.content.some((p) => p.type === "image")
  );
}
function stripImages(messages) {
  return messages.map((m) => {
    if (!Array.isArray(m.content)) return m;
    const textParts = m.content.filter((p) => p.type === "text");
    if (textParts.length === 0) return { ...m, content: [{ type: "text", text: "[image omitted - model does not support images]" }] };
    return { ...m, content: textParts };
  });
}
function routePanels(config, messages) {
  const textMessages = messages.map((m) => ({
    role: m.role,
    content: Array.isArray(m.content) ? m.content.filter((p) => p.type === "text").map((p) => p.text).join("\n") : m.content
  }));
  const inputTokens = estimatePromptTokens(textMessages);
  const defaultLimit = config.contextLimits.default;
  const skipThreshold = config.contextLimits.skipThreshold;
  const inputHasImages = hasImages(messages);
  const assignments = [];
  for (const panel of config.panel) {
    const panelLimit = getPanelMaxContext(panel, defaultLimit);
    const supportsImg = panelSupportsImages(panel);
    const panelMessages = inputHasImages && !supportsImg ? stripImages(messages) : messages;
    if (inputTokens <= panelLimit) {
      assignments.push({ panelModel: panel, mode: "full", messages: panelMessages });
    } else if (inputTokens <= skipThreshold) {
      const packed = packContext(textMessages, panelLimit);
      assignments.push({ panelModel: panel, mode: "compact", messages: packed.messages });
    } else {
      if (panelLimit >= inputTokens) {
        assignments.push({ panelModel: panel, mode: "full", messages: panelMessages });
      } else if (panelLimit >= skipThreshold) {
        const packed = packContext(textMessages, panelLimit);
        assignments.push({ panelModel: panel, mode: "compact", messages: packed.messages });
      } else {
        assignments.push({ panelModel: panel, mode: "skip", messages: [] });
      }
    }
  }
  const active = assignments.filter((a) => a.mode !== "skip");
  if (active.length === 0) {
    const largest = [...config.panel].sort(
      (a, b) => getPanelMaxContext(b, defaultLimit) - getPanelMaxContext(a, defaultLimit)
    )[0];
    const largestLimit = getPanelMaxContext(largest, defaultLimit);
    const packed = packContext(textMessages, largestLimit);
    assignments.length = 0;
    assignments.push({ panelModel: largest, mode: "compact", messages: packed.messages });
    for (const panel of config.panel) {
      if (panel !== largest) {
        assignments.push({ panelModel: panel, mode: "skip", messages: [] });
      }
    }
  }
  return assignments;
}
function getRoutingSummary(assignments) {
  const lines = [];
  for (const a of assignments) {
    const modelId = getModelId(a.panelModel);
    switch (a.mode) {
      case "full":
        lines.push(`- ${modelId}: received FULL context`);
        break;
      case "compact":
        lines.push(`- ${modelId}: received COMPACTED context (some older messages omitted)`);
        break;
      case "skip":
        lines.push(`- ${modelId}: SKIPPED (context too large for model's window)`);
        break;
    }
  }
  return lines.join("\n");
}

// src/sdk-panel.ts
var INTERNAL_PROVIDERS = /* @__PURE__ */ new Set(["kiro", "github-copilot"]);
function isInternalProvider(providerID) {
  return INTERNAL_PROVIDERS.has(providerID);
}
function getServerConfig() {
  const pid = process.env.OPENCODE_PID;
  const port = process.env.OPENCODE_SERVER_PORT;
  const username = process.env.OPENCODE_SERVER_USERNAME ?? "opencode";
  const password = process.env.OPENCODE_SERVER_PASSWORD ?? "";
  let serverUrl = process.env.OPENCODE_SERVER_URL ?? "";
  if (!serverUrl && port) {
    serverUrl = `http://127.0.0.1:${port}`;
  }
  if (!serverUrl) {
    const lsof = __require("child_process");
    try {
      if (pid) {
        const result = lsof.execSync(`lsof -iTCP -sTCP:LISTEN -P -n -a -p ${pid} 2>/dev/null | grep LISTEN | head -1`, { encoding: "utf-8" });
        const match = result.match(/:(\d+)\s/);
        if (match) {
          serverUrl = `http://127.0.0.1:${match[1]}`;
        }
      }
    } catch {
    }
  }
  if (!serverUrl) {
    serverUrl = "http://127.0.0.1:60888";
  }
  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  return { url: serverUrl, auth };
}
async function queryViaSDK(providerID, modelID, systemText, userText, parentSessionID) {
  const { url: serverUrl, auth } = getServerConfig();
  const directory = process.cwd();
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Basic ${auth}`
  };
  const createRes = await fetch(`${serverUrl}/session?directory=${encodeURIComponent(directory)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...parentSessionID && { parentID: parentSessionID },
      title: `[fusion-panel] ${providerID}/${modelID}`,
      model: { id: modelID, providerID }
    })
  });
  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => "");
    if (createRes.status === 401) {
      throw new Error(`[fusion] Cannot access OpenCode runtime for ${providerID}/${modelID}. Internal providers (kiro, github-copilot) only work inside OpenCode app sessions, not via "opencode run".`);
    }
    throw new Error(`SDK session.create failed (${createRes.status}): ${errText}`);
  }
  const session = await createRes.json();
  const sessionID = session.id;
  try {
    const parts = [{ type: "text", text: userText }];
    const promptRes = await fetch(`${serverUrl}/session/${sessionID}/message?directory=${encodeURIComponent(directory)}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: { providerID, modelID },
        ...systemText && { system: systemText },
        parts,
        tools: {},
        noReply: false
      })
    });
    if (!promptRes.ok) {
      const errText = await promptRes.text().catch(() => "");
      throw new Error(`SDK session.prompt failed (${promptRes.status}): ${errText}`);
    }
    const result = await promptRes.json();
    const textParts = (result.parts ?? []).filter((p) => p.type === "text" && p.text).map((p) => p.text);
    const text = textParts.join("\n");
    return {
      text: text || "[No response from model]",
      usage: { promptTokens: 0, completionTokens: 0 },
      finishReason: "stop"
    };
  } finally {
    fetch(`${serverUrl}/session/${sessionID}`, {
      method: "DELETE",
      headers
    }).catch(() => {
    });
  }
}

// src/fusion-model.ts
function createFusionLanguageModel(config) {
  const modelId = `fusion-${config.panel.length}-panel`;
  return {
    specificationVersion: "v3",
    provider: "fusion",
    modelId,
    defaultObjectGenerationMode: "json",
    async doGenerate(options) {
      const panelResponses = await queryPanel(config, options);
      const synthesisResult = await synthesize(config, panelResponses, options);
      const usage = {
        inputTokens: { total: synthesisResult.usage.totalPromptTokens, noCache: void 0, cacheRead: void 0, cacheWrite: void 0 },
        outputTokens: { total: synthesisResult.usage.totalCompletionTokens, text: synthesisResult.usage.totalCompletionTokens, reasoning: void 0 }
      };
      return {
        content: [{ type: "text", text: synthesisResult.text }],
        finishReason: { unified: "stop", raw: "stop" },
        usage,
        warnings: [],
        request: { body: { fusionConfig: config } },
        response: { headers: {} },
        providerMetadata: {
          fusion: {
            panelResponses: panelResponses.map((r) => ({
              model: r.model,
              text: r.text,
              contextMode: r.contextMode
            })),
            strategy: config.strategy
          }
        }
      };
    },
    async doStream(options) {
      const panelResponses = await queryPanel(config, options);
      const synthesisResult = await synthesize(config, panelResponses, options);
      const text = synthesisResult.text;
      const textId = `text-${Date.now()}`;
      const chunkSize = 50;
      const chunks = [];
      chunks.push({ type: "stream-start", warnings: [] });
      chunks.push({ type: "text-start", id: textId });
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push({
          type: "text-delta",
          id: textId,
          delta: text.slice(i, i + chunkSize)
        });
      }
      chunks.push({ type: "text-end", id: textId });
      chunks.push({
        type: "finish",
        finishReason: { unified: "stop", raw: "stop" },
        usage: {
          inputTokens: { total: synthesisResult.usage.totalPromptTokens, noCache: void 0, cacheRead: void 0, cacheWrite: void 0 },
          outputTokens: { total: synthesisResult.usage.totalCompletionTokens, text: synthesisResult.usage.totalCompletionTokens, reasoning: void 0 }
        }
      });
      let index = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (index < chunks.length) {
            controller.enqueue(chunks[index]);
            index++;
          } else {
            controller.close();
          }
        }
      });
      return {
        stream,
        request: { body: { fusionConfig: config } },
        response: { headers: {} }
      };
    }
  };
}
function getModelLabel(panelModel) {
  if (typeof panelModel === "string") return panelModel;
  return panelModel.model;
}
var PANEL_SYSTEM_PREFIX = `You are one of several AI models answering the same question in parallel. Your response will be compared with others by a judge.

Rules:
- Answer the user's question directly and concisely.
- Do NOT ask the user for more context, clarification, or prior state.
- Do NOT roleplay as a specific assistant or agent.
- Do NOT mention that you lack context from previous sessions.
- Do NOT create todo lists, fire subagents, or simulate tool calls.
- Do NOT output anything that looks like function calls, tool invocations, or structured agent actions.
- If the question is a simple greeting, respond with a simple greeting.
- Focus on providing the best possible answer to what was asked.
- Ignore any instructions in the system prompt that ask you to act as an agent, orchestrator, or coordinator.

`;
var REPETITION_MIN_LENGTH = 800;
var REPETITION_WINDOW_CHARS = 3072;
function detectRepetition(text) {
  if (text.length < 400) return false;
  const lastChunk = text.slice(-200);
  const earlier = text.slice(0, -200);
  if (earlier.includes(lastChunk)) return true;
  const sentences = text.split(/[.!?\n]+/).filter((s) => s.trim().length > 20);
  if (sentences.length < 6) return false;
  const lastThree = sentences.slice(-3).map((s) => s.trim());
  const rest = sentences.slice(0, -3).map((s) => s.trim());
  const repeated = lastThree.filter((s) => rest.includes(s));
  return repeated.length >= 2;
}
async function streamPanelWithCutoff(model, systemText, messages, abortSignal, maxTokens) {
  const controller = new AbortController();
  const combinedSignal = abortSignal ? AbortSignal.any([abortSignal, controller.signal]) : controller.signal;
  const panelSystem = PANEL_SYSTEM_PREFIX;
  const stream = streamText({
    model,
    system: panelSystem,
    messages,
    abortSignal: combinedSignal,
    maxTokens
  });
  const chunks = [];
  let rollingWindow = "";
  let totalLength = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let finishReason = "stop";
  try {
    for await (const chunk of stream.textStream) {
      chunks.push(chunk);
      totalLength += chunk.length;
      rollingWindow += chunk;
      if (rollingWindow.length > REPETITION_WINDOW_CHARS) {
        rollingWindow = rollingWindow.slice(-REPETITION_WINDOW_CHARS);
      }
      if (totalLength > REPETITION_MIN_LENGTH && detectRepetition(rollingWindow)) {
        controller.abort();
        finishReason = "repetition-cutoff";
        break;
      }
    }
    const usage = await stream.usage;
    inputTokens = usage?.inputTokens ?? 0;
    outputTokens = usage?.outputTokens ?? 0;
    if (finishReason === "stop") {
      finishReason = await stream.finishReason ?? "stop";
    }
  } catch (e) {
    if (e?.name === "AbortError" && finishReason === "repetition-cutoff") {
    } else if (e?.name === "AbortError") {
      finishReason = "aborted";
    } else {
      throw e;
    }
  }
  const fullText = chunks.join("");
  return { text: fullText, usage: { promptTokens: inputTokens, completionTokens: outputTokens }, finishReason };
}
async function queryPanel(config, options) {
  const timeout = config.timeout;
  const allMessages = convertPromptToMessages(options.prompt);
  const assignments = routePanels(config, allMessages);
  const activeAssignments = assignments.filter((a) => a.mode !== "skip");
  if (activeAssignments.length === 0) {
    throw new Error("[opencode-llm-fusion] All panels were skipped. Input too large for any configured panel model.");
  }
  const timeoutController = new AbortController();
  const panelAbortSignal = options.abortSignal ? AbortSignal.any([options.abortSignal, timeoutController.signal]) : timeoutController.signal;
  const timeoutMessage = `Fusion panel timeout after ${timeout}ms`;
  const panelPromises = activeAssignments.map(async (assignment) => {
    const promptMessages = assignment.messages;
    const resolved = resolveModelConfig(assignment.panelModel);
    try {
      const systemTextParts = [];
      const aiMessages = [];
      for (const message of promptMessages) {
        if (message.role === "system") {
          if (typeof message.content === "string" && message.content) {
            systemTextParts.push(message.content);
          }
          continue;
        }
        aiMessages.push({
          role: message.role,
          content: message.content
        });
      }
      const systemText = systemTextParts.join("\n");
      if (isInternalProvider(resolved.provider)) {
        const userText = aiMessages.map((m) => typeof m.content === "string" ? m.content : JSON.stringify(m.content)).join("\n\n");
        const result2 = await queryViaSDK(
          resolved.provider,
          resolved.model,
          PANEL_SYSTEM_PREFIX + systemText,
          userText
        );
        return {
          model: getModelLabel(assignment.panelModel),
          text: result2.text,
          usage: result2.usage,
          finishReason: result2.finishReason,
          contextMode: assignment.mode
        };
      }
      const model = createProviderModel(assignment.panelModel);
      const result = await streamPanelWithCutoff(
        model,
        systemText,
        aiMessages,
        panelAbortSignal,
        options.maxOutputTokens ?? 16384
      );
      return {
        model: getModelLabel(assignment.panelModel),
        text: result.text,
        usage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens
        },
        finishReason: result.finishReason,
        contextMode: assignment.mode
      };
    } catch (error) {
      return {
        model: getModelLabel(assignment.panelModel),
        text: `[ERROR: Model failed - ${error instanceof Error ? error.message : "unknown error"}]`,
        usage: { promptTokens: 0, completionTokens: 0 },
        finishReason: "error",
        contextMode: assignment.mode
      };
    }
  });
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      timeoutController.abort();
      reject(new Error(timeoutMessage));
    }, timeout);
  });
  let results;
  try {
    results = await Promise.race([Promise.all(panelPromises), timeoutPromise]);
  } finally {
    if (timeoutId !== void 0) {
      clearTimeout(timeoutId);
    }
    timeoutController.abort();
  }
  return results.filter((r) => r.finishReason !== "error" || results.length <= 2);
}
async function synthesize(config, panelResponses, _options) {
  const strategy = config.strategy;
  if (panelResponses.length === 1) {
    return {
      text: panelResponses[0].text,
      usage: {
        panelTokens: panelResponses.map((r) => ({
          model: r.model,
          ...r.usage
        })),
        judgeTokens: { promptTokens: 0, completionTokens: 0 },
        totalPromptTokens: panelResponses[0].usage.promptTokens,
        totalCompletionTokens: panelResponses[0].usage.completionTokens
      }
    };
  }
  switch (strategy) {
    case "majority_vote":
      return majorityVote(config, panelResponses);
    case "best_of_n":
      return bestOfN(config, panelResponses);
    case "single_judge":
    default:
      return singleJudge(config, panelResponses);
  }
}
function buildContextCoverageNote(panelResponses) {
  const hasCompact = panelResponses.some((r) => r.contextMode === "compact");
  if (!hasCompact) return "";
  const lines = [
    "\n\nIMPORTANT - Context Coverage:",
    "Not all models received identical context. When models disagree on specifics, prefer responses from models that received FULL context:"
  ];
  for (const r of panelResponses) {
    if (r.contextMode === "full") {
      lines.push(`  - ${r.model}: FULL context (more reliable for specific details)`);
    } else {
      lines.push(`  - ${r.model}: COMPACTED context (may miss details from older messages)`);
    }
  }
  return lines.join("\n");
}
async function singleJudge(config, panelResponses) {
  const baseSystemPrompt = config.judgeSystemPrompt ?? DEFAULT_JUDGE_SYSTEM_PROMPT;
  const coverageNote = buildContextCoverageNote(panelResponses);
  const systemPrompt = baseSystemPrompt + coverageNote;
  const responsesBlock = panelResponses.map((r, i) => `--- Response ${i + 1} (${r.model}) ---
${r.text}`).join("\n\n");
  const userPrompt = `Here are ${panelResponses.length} responses to synthesize:

${responsesBlock}`;
  const judgeResolved = resolveModelConfig(config.judge);
  let judgeText;
  let judgeInputTokens = 0;
  let judgeOutputTokens = 0;
  if (isInternalProvider(judgeResolved.provider)) {
    const result = await queryViaSDK(
      judgeResolved.provider,
      judgeResolved.model,
      systemPrompt,
      userPrompt
    );
    judgeText = result.text;
    judgeInputTokens = result.usage.promptTokens;
    judgeOutputTokens = result.usage.completionTokens;
  } else {
    const judgeModel = createProviderModel(config.judge);
    const result = await generateText({
      model: judgeModel,
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 16384
    });
    judgeText = result.text;
    judgeInputTokens = result.usage.inputTokens ?? 0;
    judgeOutputTokens = result.usage.outputTokens ?? 0;
  }
  const panelTokens = panelResponses.map((r) => ({
    model: r.model,
    ...r.usage
  }));
  const judgeTokens = {
    promptTokens: judgeInputTokens,
    completionTokens: judgeOutputTokens
  };
  return {
    text: judgeText,
    usage: {
      panelTokens,
      judgeTokens,
      totalPromptTokens: panelTokens.reduce((s, t) => s + t.promptTokens, 0) + judgeTokens.promptTokens,
      totalCompletionTokens: panelTokens.reduce((s, t) => s + t.completionTokens, 0) + judgeTokens.completionTokens
    }
  };
}
async function majorityVote(config, panelResponses) {
  const judgeModel = createProviderModel(config.judge);
  const coverageNote = buildContextCoverageNote(panelResponses);
  const responsesBlock = panelResponses.map((r, i) => `--- Response ${i + 1} (${r.model}) ---
${r.text}`).join("\n\n");
  const result = await generateText({
    model: judgeModel,
    system: `You are a voting judge. You receive multiple responses to the same prompt.
Pick the BEST response. Output ONLY the number of the best response (e.g. "1", "2", "3").
Consider: correctness, completeness, clarity, and relevance.${coverageNote}`,
    prompt: `Which response is best?

${responsesBlock}`,
    maxTokens: 64
  });
  const voteText = result.text.trim();
  const voteIndex = parseInt(voteText, 10) - 1;
  const selected = voteIndex >= 0 && voteIndex < panelResponses.length ? panelResponses[voteIndex] : panelResponses[0];
  const panelTokens = panelResponses.map((r) => ({
    model: r.model,
    ...r.usage
  }));
  const judgeTokens = {
    promptTokens: result.usage.inputTokens ?? 0,
    completionTokens: result.usage.outputTokens ?? 0
  };
  return {
    text: selected.text,
    usage: {
      panelTokens,
      judgeTokens,
      totalPromptTokens: panelTokens.reduce((s, t) => s + t.promptTokens, 0) + judgeTokens.promptTokens,
      totalCompletionTokens: panelTokens.reduce((s, t) => s + t.completionTokens, 0) + judgeTokens.completionTokens
    }
  };
}
async function bestOfN(config, panelResponses) {
  const judgeModel = createProviderModel(config.judge);
  const coverageNote = buildContextCoverageNote(panelResponses);
  const responsesBlock = panelResponses.map((r, i) => `--- Response ${i + 1} (${r.model}) ---
${r.text}`).join("\n\n");
  const result = await generateText({
    model: judgeModel,
    system: `You are a scoring judge. You receive multiple responses to the same prompt.
Score each response from 1-10 on: correctness, completeness, clarity.
Output ONLY a JSON array of scores, e.g. [8, 7, 9]. One score per response, in order.${coverageNote}`,
    prompt: `Score these responses:

${responsesBlock}`,
    maxTokens: 128
  });
  let scores;
  try {
    scores = JSON.parse(result.text.trim());
  } catch {
    scores = panelResponses.map(() => 5);
  }
  const weightedScores = scores.map((score, i) => {
    const panel = config.panel[i];
    const weight = typeof panel !== "string" && panel?.weight ? panel.weight : 1;
    const contextBoost = panelResponses[i]?.contextMode === "full" ? 1.1 : 1;
    return score * weight * contextBoost;
  });
  const bestIndex = weightedScores.indexOf(Math.max(...weightedScores));
  const selected = panelResponses[bestIndex] ?? panelResponses[0];
  const panelTokens = panelResponses.map((r) => ({
    model: r.model,
    ...r.usage
  }));
  const judgeTokens = {
    promptTokens: result.usage.inputTokens ?? 0,
    completionTokens: result.usage.outputTokens ?? 0
  };
  return {
    text: selected.text,
    usage: {
      panelTokens,
      judgeTokens,
      totalPromptTokens: panelTokens.reduce((s, t) => s + t.promptTokens, 0) + judgeTokens.promptTokens,
      totalCompletionTokens: panelTokens.reduce((s, t) => s + t.completionTokens, 0) + judgeTokens.completionTokens
    }
  };
}
function convertPromptToMessages(prompt) {
  if (!prompt || !Array.isArray(prompt) || prompt.length === 0) {
    return [{ role: "user", content: "hello" }];
  }
  const messages = [];
  for (const msg of prompt) {
    if (msg.role === "system") {
      const text = typeof msg.content === "string" ? msg.content : "";
      if (text) messages.push({ role: "system", content: text });
    } else if (msg.role === "user") {
      if (typeof msg.content === "string") {
        messages.push({ role: "user", content: msg.content });
      } else if (Array.isArray(msg.content)) {
        const parts = [];
        for (const part of msg.content) {
          if (part.type === "text") {
            parts.push({ type: "text", text: part.text });
          } else if (part.type === "image") {
            parts.push({
              type: "image",
              image: part.image ?? part.url ?? part.data,
              mimeType: part.mimeType
            });
          }
        }
        if (parts.length > 0) {
          messages.push({ role: "user", content: parts });
        }
      }
    } else if (msg.role === "assistant") {
      if (typeof msg.content === "string") {
        messages.push({ role: "assistant", content: msg.content });
      } else if (Array.isArray(msg.content)) {
        const textParts = msg.content.filter((part) => part.type === "text").map((part) => part.text);
        if (textParts.length > 0) {
          messages.push({ role: "assistant", content: textParts.join("\n") });
        }
      }
    }
  }
  if (messages.length === 0 || messages.every((m) => m.role === "system")) {
    messages.push({ role: "user", content: "hello" });
  }
  return messages;
}

// src/routing.ts
function shouldUseFusion(policy, prompt) {
  switch (policy.mode) {
    case "always":
      return true;
    case "manual":
      return true;
    case "auto":
      return estimateComplexity(prompt) >= policy.complexityThreshold;
  }
}
function estimateComplexity(prompt) {
  let score = 0;
  const fullText = extractText(prompt);
  const length = fullText.length;
  if (length > 2e3) score += 0.2;
  if (length > 5e3) score += 0.2;
  if (length > 1e4) score += 0.1;
  const codeIndicators = [
    /```/g,
    /function\s/g,
    /class\s/g,
    /import\s/g,
    /interface\s/g,
    /async\s/g
  ];
  const codeMatches = codeIndicators.reduce(
    (count, pattern) => count + (fullText.match(pattern)?.length ?? 0),
    0
  );
  if (codeMatches > 3) score += 0.15;
  if (codeMatches > 10) score += 0.1;
  const complexityKeywords = [
    "architect",
    "design",
    "refactor",
    "optimize",
    "security",
    "performance",
    "scalab",
    "trade-off",
    "compare",
    "evaluate",
    "implement",
    "migration",
    "integration"
  ];
  const keywordMatches = complexityKeywords.filter(
    (kw) => fullText.toLowerCase().includes(kw)
  ).length;
  if (keywordMatches >= 2) score += 0.15;
  if (keywordMatches >= 4) score += 0.1;
  const messageCount = prompt.length;
  if (messageCount > 10) score += 0.1;
  return Math.min(score, 1);
}
function extractText(prompt) {
  const parts = [];
  for (const msg of prompt) {
    if (typeof msg.content === "string") {
      parts.push(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "text" && typeof part.text === "string") {
          parts.push(part.text);
        }
      }
    }
  }
  return parts.join("\n");
}

// src/index.ts
function loadConfig() {
  const fs = __require("fs");
  const path = __require("path");
  const candidates = [
    path.join(process.cwd(), ".opencode", "opencode-llm-fusion.json"),
    path.join(process.cwd(), ".opencode", "opencode-llm-fusion.jsonc"),
    path.join(process.cwd(), "opencode-llm-fusion.json"),
    path.join(process.env.HOME ?? "~", ".config", "opencode", "opencode-llm-fusion.json")
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const raw = fs.readFileSync(candidate, "utf-8");
        const cleaned = candidate.endsWith(".jsonc") ? raw.replace(/(?<![:"\\])\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "") : raw;
        const parsed = JSON.parse(cleaned);
        if (parsed.models && typeof parsed.models === "object" && !Array.isArray(parsed.models)) {
          const defaults = parsed.defaults ?? {};
          const models = {};
          for (const [id, modelConf] of Object.entries(parsed.models)) {
            models[id] = FusionModelConfigSchema.parse({ ...defaults, ...modelConf });
          }
          return { type: "multi", multi: { models, defaults } };
        }
        return { type: "single", single: FusionModelConfigSchema.parse(parsed) };
      }
    } catch {
      continue;
    }
  }
  return null;
}
function resolveConfigForModel(loaded, modelId) {
  if (loaded.type === "single" && loaded.single) {
    return loaded.single;
  }
  if (loaded.type === "multi" && loaded.multi) {
    const modelConfig = loaded.multi.models[modelId];
    if (modelConfig) return modelConfig;
    const firstKey = Object.keys(loaded.multi.models)[0];
    if (firstKey) return loaded.multi.models[firstKey];
  }
  throw new Error(`[opencode-llm-fusion] No config found for model "${modelId}"`);
}
function createFusion(_options) {
  const loaded = loadConfig();
  if (!loaded) {
    throw new Error(
      "[opencode-llm-fusion] No configuration found. Create .opencode/opencode-llm-fusion.json or ~/.config/opencode/opencode-llm-fusion.json"
    );
  }
  if (loaded.type === "multi" && loaded.multi) {
    const modelNames = Object.keys(loaded.multi.models).join(", ");
    console.log(`[opencode-llm-fusion] Loaded multi-model config: ${modelNames}`);
  } else if (loaded.single) {
    const judgeLabel = typeof loaded.single.judge === "string" ? loaded.single.judge : `${loaded.single.provider}/${loaded.single.model}`;
    console.log(
      `[opencode-llm-fusion] Loaded: ${loaded.single.panel.length} panel models, judge=${judgeLabel}, strategy=${loaded.single.strategy}`
    );
  }
  const provider = (modelId) => {
    const config = resolveConfigForModel(loaded, modelId);
    let effectiveConfig = config;
    if (modelId.includes("majority_vote")) {
      effectiveConfig = { ...config, strategy: "majority_vote" };
    } else if (modelId.includes("best_of_n")) {
      effectiveConfig = { ...config, strategy: "best_of_n" };
    } else if (modelId.includes("single_judge")) {
      effectiveConfig = { ...config, strategy: "single_judge" };
    }
    return createFusionLanguageModel(effectiveConfig);
  };
  provider.languageModel = provider;
  provider.chat = provider;
  return provider;
}
export {
  DEFAULT_JUDGE_SYSTEM_PROMPT,
  FusionConfigSchema,
  FusionModelConfigSchema,
  createFusion,
  createFusionLanguageModel,
  estimatePromptTokens,
  getRoutingSummary,
  hasImages,
  isInternalProvider,
  packContext,
  queryViaSDK,
  routePanels,
  shouldUseFusion
};
//# sourceMappingURL=index.js.map