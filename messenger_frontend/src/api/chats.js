import { apiDelete, apiGet, apiPost } from "./client";

/**
 * Expected REST contract (subject to backend implementation):
 * - GET    /chats            -> list chats/groups for user
 * - POST   /chats            -> create group { name, memberEmails? }
 * - GET    /chats/{chatId}   -> get chat details
 * - GET    /chats/{chatId}/messages
 * - POST   /chats/{chatId}/messages { text }
 * - GET    /chats/{chatId}/members
 * - POST   /chats/{chatId}/members { email }
 * - DELETE /chats/{chatId}/members/{userId}
 */

// PUBLIC_INTERFACE
export function listChats(token) {
  /** List chats/groups for the current user. */
  return apiGet("/chats", { token });
}

// PUBLIC_INTERFACE
export function createChat(token, { name, memberEmails }) {
  /** Create a new group chat. */
  return apiPost("/chats", { name, memberEmails }, { token });
}

// PUBLIC_INTERFACE
export function listMessages(token, chatId) {
  /** List messages for a chat. */
  return apiGet(`/chats/${encodeURIComponent(chatId)}/messages`, { token });
}

// PUBLIC_INTERFACE
export function sendMessage(token, chatId, { text }) {
  /** Send a message to a chat. */
  return apiPost(`/chats/${encodeURIComponent(chatId)}/messages`, { text }, { token });
}

// PUBLIC_INTERFACE
export function listMembers(token, chatId) {
  /** List members of a chat/group. */
  return apiGet(`/chats/${encodeURIComponent(chatId)}/members`, { token });
}

// PUBLIC_INTERFACE
export function addMember(token, chatId, { email }) {
  /** Add a member to a chat/group by email. */
  return apiPost(`/chats/${encodeURIComponent(chatId)}/members`, { email }, { token });
}

// PUBLIC_INTERFACE
export function removeMember(token, chatId, userId) {
  /** Remove a member from a chat/group by userId. */
  return apiDelete(`/chats/${encodeURIComponent(chatId)}/members/${encodeURIComponent(userId)}`, { token });
}
