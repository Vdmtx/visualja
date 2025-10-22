import React, { useState } from 'react';

interface GeneratedContentDisplayProps {
  title: string;
  targetLanguageContent: string;
  conferenceContent: string;
  conferenceLanguageName: string;
}

const GeneratedContentDisplay: React.FC<GeneratedContentDisplayProps> = ({ title, targetLanguageContent, conferenceContent, conferenceLanguageName }) => {
  const [isConferenceVisible, setIsConferenceVisible] = useState(false);

  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-semibold mt-4 mb-2 text-qwen-secondary">{line.substring(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-bold mt-6 mb-3 text-qwen-secondary">{line.substring(3)}</h2>;
      }
      if (line.startsWith('* ')) {
        return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
      }
      return <p key={index} className="mb-2">{line}</p>;
    });
  };

  return (
    <div className="bg-qwen-background/50 rounded-lg p-6 mb-6">
      <h2 className="text-3xl font-bold text-qwen-secondary mb-4">{title}</h2>
      <div className="text-qwen-text-primary prose prose-invert max-w-none">
        {formatText(targetLanguageContent)}
      </div>
      <div className="mt-6 border-t border-qwen-border pt-4">
        <button
          onClick={() => setIsConferenceVisible(!isConferenceVisible)}
          className="text-qwen-secondary font-semibold hover:text-qwen-primary transition-colors duration-200 flex items-center"
        >
          {isConferenceVisible ? 'Ocultar' : 'Exibir'} Versão para Conferência ({conferenceLanguageName})
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-2 transition-transform duration-300 ${isConferenceVisible ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {isConferenceVisible && (
          <div className="mt-4 text-gray-300 prose prose-invert max-w-none bg-black/20 p-4 rounded-md">
            {formatText(conferenceContent)}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratedContentDisplay;