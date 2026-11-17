'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';
import type { Conversation, ConversationMessage } from '../lib/api-client';

type KnowledgeBaseChatProps = {
  accessToken: string | null;
  knowledgeBaseId: string;
};

export function KnowledgeBaseChat({ accessToken, knowledgeBaseId }: KnowledgeBaseChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken || !knowledgeBaseId) return;
    setIsLoading(true);
    setError('');
    apiClient
      .listConversations(accessToken, knowledgeBaseId)
      .then((nextConversations) => {
        const sortedConversations = [...nextConversations].sort(
          (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
        );
        setConversations(sortedConversations);
        setConversationId(sortedConversations[0]?.id ?? null);
        setMessages([]);
      })
      .catch((requestError: unknown) => setError(getErrorMessage(requestError)))
      .finally(() => setIsLoading(false));
  }, [accessToken, knowledgeBaseId]);

  useEffect(() => {
    if (!accessToken || !conversationId) return;
    setIsLoadingMessages(true);
    setError('');
    apiClient
      .listConversationMessages(accessToken, conversationId)
      .then(setMessages)
      .catch((requestError: unknown) => setError(getErrorMessage(requestError)))
      .finally(() => setIsLoadingMessages(false));
  }, [accessToken, conversationId]);

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
    setError('');
  }

  async function selectConversation(nextConversationId: string) {
    setConversationId(nextConversationId);
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!accessToken || !message || isSending) return;

    setIsSending(true);
    setError('');
    setDraft('');
    const temporaryUserMessage: ConversationMessage = {
      id: `temporary-${Date.now()}`,
      conversationId: conversationId ?? 'temporary',
      role: 'user',
      content: message,
      sources: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, temporaryUserMessage]);

    try {
      const response = await apiClient.sendChatMessage(
        accessToken,
        knowledgeBaseId,
        message,
        conversationId ?? undefined,
      );
      setConversationId(response.conversationId);
      const nextMessages = await apiClient.listConversationMessages(
        accessToken,
        response.conversationId,
      );
      setMessages(nextMessages);
      const nextConversations = await apiClient.listConversations(accessToken, knowledgeBaseId);
      setConversations(nextConversations);
    } catch (requestError) {
      setMessages((current) => current.filter((item) => item.id !== temporaryUserMessage.id));
      setDraft(message);
      setError(getErrorMessage(requestError));
    } finally {
      setIsSending(false);
    }
  }

  async function deleteCurrentConversation() {
    if (!accessToken || !conversationId) return;
    try {
      await apiClient.deleteConversation(accessToken, conversationId);
      setConversations((current) => current.filter((item) => item.id !== conversationId));
      startNewConversation();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <section className="chat-shell" aria-labelledby="chat-title">
      <div className="chat-sidebar">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Conversations</p>
            <h2 id="chat-title">Ask your documents</h2>
          </div>
          <button
            className="ghost-button compact-button"
            type="button"
            onClick={startNewConversation}
          >
            New
          </button>
        </div>
        {isLoading ? (
          <p className="chat-muted">Loading conversations…</p>
        ) : conversations.length === 0 ? (
          <p className="chat-muted">No conversations yet.</p>
        ) : (
          <div className="conversation-list">
            {conversations.map((conversation) => (
              <button
                className={
                  conversation.id === conversationId
                    ? 'conversation-item active'
                    : 'conversation-item'
                }
                key={conversation.id}
                type="button"
                onClick={() => void selectConversation(conversation.id)}
              >
                <span>{conversation.title}</span>
                <small>{conversation._count?.messages ?? 0} messages</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="chat-panel">
        <div className="chat-panel-header">
          <div>
            <p className="eyebrow">Grounded answers</p>
            <h2>{conversationId ? 'Conversation' : 'New conversation'}</h2>
          </div>
          {conversationId && (
            <button
              className="icon-button"
              type="button"
              onClick={() => void deleteCurrentConversation()}
            >
              ×
            </button>
          )}
        </div>

        <div className="chat-messages" aria-live="polite">
          {isLoadingMessages && messages.length === 0 ? (
            <p className="chat-muted">Loading messages…</p>
          ) : messages.length === 0 && !isSending ? (
            <div className="chat-empty">
              <p>Ask a question about the documents in this knowledge base.</p>
              <span>The answer will include the most relevant sources.</span>
            </div>
          ) : (
            messages.map((message) => <ChatMessageView key={message.id} message={message} />)
          )}
          {isSending && (
            <div className="chat-message assistant-message">
              <span className="message-role">Assistant</span>
              <p>Thinking…</p>
            </div>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}
        <form className="chat-composer" onSubmit={sendMessage}>
          <textarea
            aria-label="Message"
            rows={3}
            placeholder="Ask a question about your documents…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button className="primary-button" disabled={isSending || !draft.trim()} type="submit">
            {isSending ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </section>
  );
}

function ChatMessageView({ message }: { message: ConversationMessage }) {
  const isAssistant = message.role === 'assistant';
  return (
    <article
      className={isAssistant ? 'chat-message assistant-message' : 'chat-message user-message'}
    >
      <span className="message-role">{isAssistant ? 'Assistant' : 'You'}</span>
      <p>{message.content}</p>
    </article>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}
