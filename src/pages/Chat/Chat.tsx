import { useEffect, useRef, useState } from "react";
import { BottomNav } from "../../components/BottomNav/BottomNav";
import { useUser } from "../../hooks/useUser";
import {
  chatsService,
  type ChatDetails,
  type ChatMessage,
} from "../../services/chats.service";
import styles from "./Chat.module.css";

interface ChatPageProps {
  chatId: string;
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatPage({ chatId }: ChatPageProps) {
  const { user } = useUser();
  const [chat, setChat] = useState<ChatDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [chatData, messagesData] = await Promise.all([
          chatsService.getChatDetails(chatId),
          chatsService.getChatMessages(chatId),
        ]);
        if (isMounted) {
          setChat(chatData);
          setMessages([...messagesData].reverse());
        }
      } catch {
        if (isMounted) setError("Não foi possível carregar o chat.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [chatId]);

  const currentUserId = user?.id || chat?.customer_id || chat?.executor_id;

  const partner = chat
    ? chat.customer_id === currentUserId
      ? chat.executor
      : chat.customer
    : null;

  const partnerName = partner
    ? `${partner.first_name} ${partner.last_name}`.trim()
    : "";
  const canSendMessages = chat?.task_status === "IN_PROGRESS";

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    if (!canSendMessages) {
      setSendError("Não é mais possível enviar mensagem nesse chat.");
      return;
    }

    if (text.length > 300) {
      setSendError("Cada mensagem pode ter no máximo 300 caracteres.");
      return;
    }

    setSendError(null);
    setIsSending(true);

    try {
      await chatsService.sendMessage(chatId, text);
      const updatedMessages = await chatsService.getChatMessages(chatId);
      setMessages([...updatedMessages].reverse());
      setInputText("");
      inputRef.current?.focus();
    } catch {
      setSendError("Não foi possível enviar a mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <main className={styles.container}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            aria-label="Voltar"
            onClick={() => navigate(`/tasks/${chat?.task_id}`)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className={styles.headerInfo}>
            {partner?.profile_picture && (
              <div className={styles.partnerAvatar}>
                <img src={partner.profile_picture} alt={partnerName} />
              </div>
            )}
            <p className={styles.partnerName}>{partnerName}</p>
          </div>
        </header>

        {isLoading && <p className={styles.feedback}>Carregando...</p>}
        {!isLoading && error && <p className={styles.feedback}>{error}</p>}
        {!isLoading && !error && sendError && (
          <p className={styles.feedback}>{sendError}</p>
        )}

        {!isLoading && !error && (
          <div className={styles.messagesWrapper}>
            <div className={styles.messageList}>
              {messages.map((msg) => {
                const fromMe = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`${styles.messageRow} ${fromMe ? styles.messageRowRight : styles.messageRowLeft}`}
                  >
                    <div className={styles.messageBubbleWrap}>
                      <div
                        className={`${styles.bubble} ${fromMe ? styles.bubbleSent : styles.bubbleReceived}`}
                      >
                        <p className={styles.bubbleText}>{msg.content}</p>
                      </div>
                      <div
                        className={`${styles.messageMeta} ${fromMe ? styles.messageMetaRight : styles.messageMetaLeft}`}
                      >
                        <span className={styles.messageTime}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className={styles.inputBar}>
        <input
          ref={inputRef}
          type="text"
          className={styles.textInput}
          placeholder={
            canSendMessages
              ? "Escreva sua mensagem..."
              : "Essa conversa foi encerrada."
          }
          value={inputText}
          disabled={isSending || !canSendMessages}
          maxLength={300}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={styles.sendButton}
          aria-label="Enviar"
          disabled={isSending || !inputText.trim() || !canSendMessages}
          onClick={handleSend}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </footer>

      <BottomNav active="tasks" />
    </main>
  );
}
