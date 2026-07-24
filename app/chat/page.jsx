export default function ChatPage() {
    return (
      <div className="chat-page__empty">
        <div className="chat-page__empty-content">
          <div className="chat-page__empty-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.42 9.42 0 0 1-4-.9L3 21l1.9-4.5A8.38 8.38 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" />
              <path d="M8 12h.01M12 12h.01M16 12h.01" />
            </svg>
          </div>
  
          <h1>Your conversations</h1>
  
          <p>
            Select a conversation from the sidebar to continue your discussion
            about a property.
          </p>
  
          <div className="chat-page__empty-hint">
            <span>⌘</span>
            <span>Choose a conversation to get started</span>
          </div>
        </div>
      </div>
    );
  }