import React from 'react';
import { useApp } from '../context/AppContext';
import { EXAMPLE_QUESTIONS } from '../utils/constants';

export default function EmptyState() {
  const { state, dispatch } = useApp();

  const questions = EXAMPLE_QUESTIONS[state.language] || EXAMPLE_QUESTIONS.en;

  const handleTapQuestion = (question) => {
    // Dispatch the question as if the user typed it — ChatInput will handle the rest
    // We'll dispatch the user message and trigger the send flow
    const event = new CustomEvent('weathergpt-send', { detail: question });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] px-4 animate-fade-in mt-16">
      <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)] mb-6">
        <span className="text-4xl">🌤️</span>
      </div>
      
      <h2 className="text-2xl font-heading font-semibold text-white mb-2 text-center drop-shadow-md">
        {state.language === 'en' ? 'What would you like to know?' :
         state.language === 'hi' ? 'आप क्या जानना चाहेंगे?' :
         state.language === 'as' ? 'আপুনি কি জানিব বিচাৰে?' :
         'আপনি কী জানতে চান?'}
      </h2>
      <p className="text-white/60 text-center mb-8 max-w-sm">
        {state.language === 'en' ? 'Tap a question below or type your own' :
         state.language === 'hi' ? 'नीचे एक सवाल टैप करें या अपना लिखें' :
         state.language === 'as' ? 'তলৰ প্ৰশ্ন এটা টিপক বা নিজৰ লিখক' :
         'নিচের একটি প্রশ্ন ট্যাপ করুন বা নিজের লিখুন'}
      </p>

      <div className="w-full flex flex-col gap-3">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleTapQuestion(q)}
            className="w-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors text-white py-3.5 px-6 rounded-2xl text-left text-[15px] shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
