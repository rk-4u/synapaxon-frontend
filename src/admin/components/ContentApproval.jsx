import { useState } from 'react';

const ContentApproval = () => {
  const [pendingQuestions, setPendingQuestions] = useState([
    {
      id: 1,
      question: "Which of the following is the most common cause of hypercalcemia in hospitalized patients?",
      topic: "Endocrinology",
      difficulty: "Medium",
      submittedBy: "student123",
      submittedOn: "2023-05-15"
    },
    {
      id: 2,
      question: "The most common site of metastasis for prostate cancer is:",
      topic: "Oncology",
      difficulty: "Hard",
      submittedBy: "medstudent42",
      submittedOn: "2023-05-14"
    },
    {
      id: 3,
      question: "Which cranial nerve is responsible for the pupillary light reflex?",
      topic: "Neurology",
      difficulty: "Easy",
      submittedBy: "futureMD",
      submittedOn: "2023-05-13"
    }
  ]);

  const [feedback, setFeedback] = useState({});
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const handleApprove = (id) => {
    setPendingQuestions(pendingQuestions.filter(q => q.id !== id));
  };

  const handleReject = (id) => {
    if (feedback[id]) {
      // In a real app, you would send this to the backend
      console.log(`Rejected question ${id} with feedback: ${feedback[id]}`);
      setPendingQuestions(pendingQuestions.filter(q => q.id !== id));
      setFeedback(prev => {
        const newFeedback = {...prev};
        delete newFeedback[id];
        return newFeedback;
      });
    }
  };

  const handleFeedbackChange = (id, value) => {
    setFeedback(prev => ({
      ...prev,
      [id]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Question Approvals</h2>
        
        {pendingQuestions.length === 0 ? (
          <p className="text-gray-500">No pending questions for approval.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingQuestions.map((question) => (
                  <tr key={question.id}>
                    <td className="px-6 py-4 whitespace-normal max-w-xs">
                      <button 
                        onClick={() => setSelectedQuestion(question)}
                        className="text-left text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {question.question.length > 100 ? `${question.question.substring(0, 100)}...` : question.question}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{question.topic}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{question.submittedBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{question.submittedOn}</td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleApprove(question.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(question.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        disabled={!feedback[question.id]}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedQuestion && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">Question Details</h3>
            <button
              onClick={() => setSelectedQuestion(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Question</p>
              <p className="mt-1 text-sm text-gray-900">{selectedQuestion.question}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Topic</p>
                <p className="mt-1 text-sm text-gray-900">{selectedQuestion.topic}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Difficulty</p>
                <p className="mt-1 text-sm text-gray-900">{selectedQuestion.difficulty}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Submitted By</p>
                <p className="mt-1 text-sm text-gray-900">{selectedQuestion.submittedBy}</p>
              </div>
            </div>
            <div>
              <label htmlFor={`feedback-${selectedQuestion.id}`} className="block text-sm font-medium text-gray-700">
                Rejection Feedback (required for rejection)
              </label>
              <textarea
                id={`feedback-${selectedQuestion.id}`}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={feedback[selectedQuestion.id] || ''}
                onChange={(e) => handleFeedbackChange(selectedQuestion.id, e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleApprove(selectedQuestion.id)}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(selectedQuestion.id)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                disabled={!feedback[selectedQuestion.id]}
              >
                Reject with Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentApproval;