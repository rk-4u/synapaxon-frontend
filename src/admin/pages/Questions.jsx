import QuestionManagement from '../components/QuestionManagement';

const Questions = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Question Bank</h2>
      <p className="text-sm text-gray-500 mb-6">Manage all questions in the question bank</p>
      <QuestionManagement />
    </div>
  );
};

export default Questions;