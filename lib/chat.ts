import { authFetch } from "@/lib/api-client";

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMessages(response: unknown): ChatMessage[] {
  if (!Array.isArray(response)) {
    throw new Error("The chat service returned invalid conversation data.");
  }

  const messages = response.map((value): ChatMessage => {
    if (
      !isRecord(value) ||
      typeof value.id !== "string" ||
      typeof value.role !== "string" ||
      typeof value.content !== "string" ||
      typeof value.created_at !== "string" ||
      Number.isNaN(Date.parse(value.created_at))
    ) {
      throw new Error("The chat service returned invalid conversation data.");
    }

    return {
      id: value.id,
      role: value.role,
      content: value.content,
      created_at: value.created_at,
    };
  });

  return messages
    .map((message, index) => ({ message, index }))
    .sort((left, right) => {
      const difference =
        Date.parse(left.message.created_at) - Date.parse(right.message.created_at);
      return difference || left.index - right.index;
    })
    .map(({ message }) => message);
}

function requirePublicId(publicId: string) {
  if (!publicId.trim()) {
    throw new Error("A product ID was not provided.");
  }
}

const chatLoadRequests = new Map<string, Promise<ChatMessage[]>>();

export function loadChatSession(publicId: string): Promise<ChatMessage[]> {
  requirePublicId(publicId);

  const existingRequest = chatLoadRequests.get(publicId);
  if (existingRequest) {
    return existingRequest;
  }

  const request = authFetch<unknown>(
    `/Chat/Load-Chat?public_id=${encodeURIComponent(publicId)}`,
    { method: "GET" },
  )
    .then(parseMessages)
    .finally(() => {
      if (chatLoadRequests.get(publicId) === request) {
        chatLoadRequests.delete(publicId);
      }
    });

  chatLoadRequests.set(publicId, request);
  return request;
}

export async function loadProductChatMessages(chatSessionId: string): Promise<ChatMessage[]> {
  if (!chatSessionId.trim()) {
    throw new Error("A chat session ID was not provided.");
  }

  const response = await authFetch<unknown>(
    `/Products/get-chat-messages?chat_session_id=${encodeURIComponent(chatSessionId)}`,
    { method: "GET" },
  );

  return parseMessages(response);
}

export async function sendLunaMessage(publicId: string, message: string): Promise<string> {
  requirePublicId(publicId);

  const response = await authFetch<unknown>(
    `/Chat/Luna?public_id=${encodeURIComponent(publicId)}`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
  );

  if (typeof response !== "string" || !response.trim()) {
    throw new Error("The chat service returned an invalid response.");
  }

  return response;
}
