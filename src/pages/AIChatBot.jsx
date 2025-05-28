import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
// Assuming '../api/aiapi' exists and handles API calls
import { sendChatMessageToAI } from '../api/aiapi';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(null); // NEW: Store thread_id
  const messagesEndRef = useRef(null);

  // Scroll to the bottom of the chat when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]); // Scroll whenever messages array updates

  // Toggle chat window visibility
  const toggleChat = () => {
    setIsOpen(!isOpen);
    // Optionally, you could clear currentThreadId here if you want every "new" chat window open to be a new thread
    // or persist it in localStorage to continue previous conversations.
    // For simplicity, let's allow continuing if thread_id exists.
    // If you want a fresh thread each time the empty chat opens:
    // if (!isOpen) setCurrentThreadId(null);
  };

  // Initialize chat with a welcome message when opened and messages are empty
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ type: 'ai', content: 'Hello! I am Synapax, your AI Medical Tutor. How can I assist you today?' }]);
    }
  }, [isOpen, messages.length]); // Dependencies ensure this runs when chat opens and messages are empty

  const sendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage = { type: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]); // Add user message instantly

    const currentInput = input; // Capture current input before clearing
    setInput(''); // Clear input field
    setIsLoading(true); // Show loading indicator

    try {
      // History for display is in `messages`. The agent uses checkpointer.
      // We don't strictly need to send `history` in payload if checkpointer handles it all.
      // However, sending recent history can be useful for the LLM's immediate context or if
      // the checkpointer mechanism has some latency or is only for longer-term persistence.
      // The `create_react_agent` primarily relies on the checkpointer.
      const historyForPayload = messages
        .filter(msg => msg.type === 'user' || msg.type === 'ai')
        .slice(0, -1) // Exclude the user message just added locally
        .slice(-6); // Send last 3 pairs of user/AI messages for context, adjust as needed

      const response = await sendChatMessageToAI({
        message: currentInput,
        history: historyForPayload, // Optional: for immediate context if desired by agent prompt
        thread_id: currentThreadId, // Send current thread_id
      });

      if (response.success && response.response) {
        const aiMessage = { type: 'ai', content: response.response };
        setMessages((prev) => [...prev, aiMessage]); // Add AI response
        if (response.thread_id && response.thread_id !== currentThreadId) {
          setCurrentThreadId(response.thread_id); // Update if backend assigned a new one
          // Optional: Persist thread_id for next session if desired
          // localStorage.setItem('aiChatThreadId', response.thread_id);
        }
      } else {
        const errorMessageContent = response.message || 'Sorry, I had trouble understanding that.';
        setMessages((prev) => [...prev, { type: 'ai', content: errorMessageContent }]);
      }
    } catch (error) {
      console.error('Error in sendMessage component:', error);
      setMessages((prev) => [...prev, { type: 'ai', content: 'Network error. Please try again.' }]);
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  // Custom component for links to apply Tailwind CSS classes
  const components = {
    a: ({ node, ...props }) => (
      <a
        {...props}
        className="text-blue-500 hover:underline dark:text-blue-300" // Added dark mode support
        target="_blank" // Open links in a new tab
        rel="noopener noreferrer" // Security best practice for target="_blank"
      />
    ),
    // You can add more custom components for other markdown elements if needed
    // For example, to style headings:
    // h1: ({node, ...props}) => <h1 {...props} className="text-xl font-bold my-2" />,
    // strong: ({node, ...props}) => <strong {...props} className="font-semibold" />,
  };

  return (
    <>
      <button
        onClick={toggleChat} // Correctly calling toggleChat here
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-50"
      >
        <MessageCircle size={24} />
      </button>
      {isOpen && (
        <div className="fixed bottom-16 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50">
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Chatbot</h3>
            <button
              onClick={toggleChat} // Correctly calling toggleChat here
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}
              >
                <span
                  className={`inline-block p-2 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                  // Add max-w-xs to prevent bubbles from getting too wide
                  style={{ maxWidth: '80%' }}
                >
                  {/* Use ReactMarkdown to render the content with custom components */}
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                    {msg.content}
                  </ReactMarkdown>
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="text-left">
                <span className="inline-block p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  Thinking...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} /> {/* Reference for auto-scrolling */}
          </div>
          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your question..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-gray-400"
                disabled={isLoading}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;