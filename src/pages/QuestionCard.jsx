import { useState } from 'react';

const QuestionCard = ({ question, isSelected, onToggleSelect }) => {
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Handle difficulty badge color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    }`}>
      <div className="p-5">
        {/* Question header with ID and difficulty */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-gray-500">Question ID: {question._id}</div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty || 'Unspecified'}
          </div>
        </div>
        
        {/* Question content */}
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">{question.text}</h3>
          
          {/* Options */}
          <div className="space-y-2 mt-3">
            {question.options?.map((option, index) => (
              <div 
                key={index} 
                className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full mr-3 flex-shrink-0">
                  {String.fromCharCode(65 + index)}
                </div>
                <div>{option}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {question.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Category, Subject, Topic */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
          {question.category && (
            <div>
              <span className="font-semibold">Category:</span> {question.category}
            </div>
          )}
          {question.subject && (
            <div>
              <span className="font-semibold">Subject:</span> {question.subject}
            </div>
          )}
          {question.topic && (
            <div>
              <span className="font-semibold">Topic:</span> {question.topic}
            </div>
          )}
        </div>
        
        {/* Explanation (conditionally shown) */}
        {showExplanation && question.explanation && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-1">Explanation:</h4>
            <p className="text-gray-600">{question.explanation}</p>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
          >
            {showExplanation ? 'Hide Explanation' : 'View Explanation'}
          </button>
          
          <button
            onClick={onToggleSelect}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isSelected
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {isSelected ? 'Remove from Test' : 'Add to Test'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;