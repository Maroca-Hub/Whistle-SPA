import { api } from "./api";

export interface ChatUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string | null;
}

export interface ChatDetails {
  id: string;
  task_id: string;
  executor_id: string;
  customer_id: string;
  customer_read_at: string | null;
  executor_read_at: string | null;
  task_status: string;
  executor: ChatUser;
  customer: ChatUser;
  created_at: string;
  updated_at: string | null;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
}

export const chatsService = {
  getChatDetails: (chatId: string) => api.get<ChatDetails>(`/chats/${chatId}`),
  getChatMessages: (chatId: string, page = 1, size = 20) =>
    api.get<ChatMessage[]>(
      `/chats/${chatId}/messages?page=${page}&size=${size}`,
    ),
  sendMessage: (chatId: string, content: string) =>
    api.post<ChatDetails>(`/chats/${chatId}/messages`, { content }),
};
