import React, { useState } from 'react';
import { MessageCircle, X, HelpCircle, Bot } from 'lucide-react';
import { chatbotFAQs, FAQItem } from '../config/chatbotData';

interface ChatbotProps {
  className?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<FAQItem | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const handleOpenChat = () => {
    setIsOpen(true);
    setSelectedQuestion(null);
    setShowAnswer(false);
    setIsThinking(false);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setSelectedQuestion(null);
    setShowAnswer(false);
    setIsThinking(false);
  };

  const handleQuestionClick = (faq: FAQItem) => {
    // Reset states
    setSelectedQuestion(faq);
    setShowAnswer(false);
    setIsThinking(true);

    // After 2 seconds, show the answer
    setTimeout(() => {
      setIsThinking(false);
      setShowAnswer(true);
    }, 2000);
  };

  // Ensure we have FAQs
  if (!chatbotFAQs || chatbotFAQs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Error: Chatbot FAQs not loaded</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Chatbot</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Get instant answers to common questions about Hungry Saver.
        </p>
      </div>

      {/* Chat with Hungry Saver Button/Card */}
      {!isOpen && (
        <div className="flex justify-center">
          <button
            onClick={handleOpenChat}
            type="button"
            className="bg-gradient-to-r from-[#eaa640] to-[#ecae53] hover:from-[#ecae53] hover:to-[#eeb766] text-black px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-3 cursor-pointer"
          >
            <MessageCircle className="h-6 w-6" />
            <span>Chat with Hungry Saver</span>
          </button>
        </div>
      )}

      {/* Chat Interface - Split Screen */}
      {isOpen && (
        <div className="relative">
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleCloseChat}
              type="button"
              className="text-gray-400 hover:text-white transition-colors text-sm flex items-center space-x-1 cursor-pointer"
            >
              <span>Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Split Screen Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
            {/* Left Side - Questions List */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700 p-4 overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Select a Question</h3>
              <div className="space-y-2">
                {chatbotFAQs.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => handleQuestionClick(faq)}
                    type="button"
                    className={`w-full px-4 py-3 text-left rounded-lg transition-all duration-200 cursor-pointer ${
                      selectedQuestion?.id === faq.id
                        ? 'bg-[#eaa640]/20 border-2 border-[#eaa640] text-[#eaa640]'
                        : 'bg-gray-800/50 border border-gray-700 text-white hover:bg-gray-700/50 hover:border-[#eaa640]/50'
                    }`}
                  >
                    <span className="text-sm font-medium">{faq.question}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side - Selected Question & Answer */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700 p-6 overflow-y-auto">
              {!selectedQuestion ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-16 w-16 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">Select a question from the left to see the answer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Question */}
                  <div className="bg-[#eaa640]/10 border border-[#eaa640]/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#eaa640] rounded-full p-2 flex-shrink-0">
                        <HelpCircle className="h-5 w-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{selectedQuestion.question}</p>
                      </div>
                    </div>
                  </div>

                  {/* Answer Section */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    {isThinking ? (
                      <div className="flex items-center space-x-3">
                        <div className="bg-[#eaa640] rounded-full p-2 flex-shrink-0">
                          <Bot className="h-5 w-5 text-black animate-pulse" />
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-[#eaa640] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-[#eaa640] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-[#eaa640] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-gray-400 text-sm">Thinking...</span>
                      </div>
                    ) : showAnswer ? (
                      <div className="flex items-start space-x-3">
                        <div className="bg-[#eaa640] rounded-full p-2 flex-shrink-0">
                          <Bot className="h-5 w-5 text-black" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-300 leading-relaxed">{selectedQuestion.answer}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
