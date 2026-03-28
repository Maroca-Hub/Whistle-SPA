import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { BottomNav } from "../../components/BottomNav/BottomNav";
import { useUser } from "../../hooks/useUser";
import {
  chatsService,
  type ChatDetails,
  type ChatMessage,
} from "../../services/chats.service";
import { wsService } from "../../services/ws.service";
import styles from "./Chat.module.css";

interface ChatPageProps {
  chatId: string;
}

const PAGE_SIZE = 20;

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
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const scrollToBottomRef = useRef(false);
  const isAtBottomRef = useRef(true);
  const scrollRestoreRef = useRef<{
    prevHeight: number;
    prevTop: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      setCurrentPage(1);
      setHasMoreMessages(true);
      try {
        const [chatData, messagesData] = await Promise.all([
          chatsService.getChatDetails(chatId),
          chatsService.getChatMessages(chatId, 1, PAGE_SIZE),
        ]);
        if (isMounted) {
          setChat(chatData);
          setMessages([...messagesData].reverse());
          setHasMoreMessages(messagesData.length === PAGE_SIZE);
          scrollToBottomRef.current = true;
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

  useLayoutEffect(() => {
    if (isLoading) return;
    const container = messageListRef.current;
    if (!container) return;

    if (scrollRestoreRef.current) {
      const { prevHeight, prevTop } = scrollRestoreRef.current;
      container.scrollTop = container.scrollHeight - prevHeight + prevTop;
      scrollRestoreRef.current = null;
      return;
    }

    if (scrollToBottomRef.current) {
      container.scrollTop = container.scrollHeight;
      scrollToBottomRef.current = false;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    wsService.connect();

    const subscribe = wsService.onMessage((event) => {
      try {
        const parsedData = JSON.parse(event.data);

        if (
          parsedData.type === "MESSAGE_RECEIVED" &&
          parsedData.data.chat_id === chatId
        ) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((msg) => msg.id));
            if (existingIds.has(parsedData.data.id)) {
              return prev;
            }
            return [...prev, parsedData.data];
          });
          scrollToBottomRef.current = isAtBottomRef.current;
        }
      } catch (err) {
        console.error("Erro ao processar mensagem do websocket:", err);
      }
    });

    return () => {
      subscribe();
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

  const loadOlderMessages = useCallback(async () => {
    if (isLoading || isLoadingOlder || !hasMoreMessages) return;

    const container = messageListRef.current;
    const prevHeight = container?.scrollHeight ?? 0;
    const prevTop = container?.scrollTop ?? 0;
    const nextPage = currentPage + 1;

    setIsLoadingOlder(true);
    try {
      const olderPage = await chatsService.getChatMessages(
        chatId,
        nextPage,
        PAGE_SIZE,
      );
      const olderMessages = [...olderPage].reverse();

      let appendedCount = 0;

      scrollRestoreRef.current = { prevHeight, prevTop };
      setMessages((prev) => {
        const existingIds = new Set(prev.map((msg) => msg.id));
        const toPrepend = olderMessages.filter(
          (msg) => !existingIds.has(msg.id),
        );
        appendedCount = toPrepend.length;
        return [...toPrepend, ...prev];
      });

      if (appendedCount === 0) {
        setHasMoreMessages(false);
        return;
      }

      setCurrentPage(nextPage);
      setHasMoreMessages(olderPage.length === PAGE_SIZE);
    } catch {
      setSendError("Não foi possível carregar mensagens antigas.");
    } finally {
      setIsLoadingOlder(false);
    }
  }, [chatId, currentPage, hasMoreMessages, isLoading, isLoadingOlder]);

  const handleMessagesScroll = () => {
    const container = messageListRef.current;
    if (!container) return;

    isAtBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    if (container.scrollTop <= 60) {
      void loadOlderMessages();
    }
  };

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
      const latestPage = await chatsService.getChatMessages(
        chatId,
        1,
        PAGE_SIZE,
      );
      const latestMessages = [...latestPage].reverse();
      setMessages((prev) => {
        const existingIds = new Set(prev.map((msg) => msg.id));
        const toAppend = latestMessages.filter(
          (msg) => !existingIds.has(msg.id),
        );
        return [...prev, ...toAppend];
      });
      setInputText("");
      scrollToBottomRef.current = true;
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
            {isLoadingOlder && (
              <p className={styles.feedback}>Carregando mensagens antigas...</p>
            )}
            <div
              ref={messageListRef}
              className={styles.messageList}
              onScroll={handleMessagesScroll}
            >
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
