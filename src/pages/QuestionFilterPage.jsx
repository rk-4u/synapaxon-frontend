import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function QuestionFilterPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Test');
  const [selectedCategory, setSelectedCategory] = useState('Basic Sciences');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [testDuration, setTestDuration] = useState('60');
  const [numberOfItems, setNumberOfItems] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = [
    { name: 'Basic Sciences' },
    { name: 'Organ Systems' },
    { name: 'Clinical Specialties' },
  ];

  const subjectsByCategory = {
    'Basic Sciences': ['Neuroscience', 'Physiology', 'Anatomy', 'Immunology', 'Histology', 'Microbiology'],
    'Organ Systems': ['Respiratory System', 'Renal System'],
    'Clinical Specialties': ['Pharmacology', 'Cardiology'],
  };

  const topicsBySubject = {
    Neuroscience: ['Autonomic Nervous System', 'Cranial Nerves'],
    Physiology: ['Endocrine System'],
    Anatomy: ['Cerebral Circulation'],
    Immunology: ['Hypersensitivity Reactions'],
    Histology: ['Respiratory Epithelium'],
    Microbiology: ['Antibiotics'],
    'Respiratory System': ['Pulmonary Physiology'],
    'Renal System': ['Nephrotic Syndrome'],
    Pharmacology: ['Cardiovascular Drugs'],
    Cardiology: ['Ischemic Heart Disease'],
  };

  // Toggle Subject selection WITHOUT clearing topics automatically
  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subject)) {
        // Removing subject - also remove any selected topics belonging to this subject
        const updatedSubjects = prev.filter((s) => s !== subject);

        // Remove topics that belong to the removed subject
        const subjectTopics = topicsBySubject[subject] || [];
        const updatedTopics = selectedTopics.filter((t) => !subjectTopics.includes(t));

        setSelectedTopics(updatedTopics);
        sessionStorage.setItem('selectedTopics', JSON.stringify(updatedTopics));
        sessionStorage.setItem('selectedSubjects', JSON.stringify(updatedSubjects));
        return updatedSubjects;
      } else {
        // Adding subject - keep existing topics untouched
        const updatedSubjects = [...prev, subject];
        sessionStorage.setItem('selectedSubjects', JSON.stringify(updatedSubjects));
        return updatedSubjects;
      }
    });
  };

  // Toggle Topic selection
  const toggleTopic = (topic) => {
    setSelectedTopics((prev) => {
      const updated = prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic];
      sessionStorage.setItem('selectedTopics', JSON.stringify(updated));
      return updated;
    });
  };

  // On category change, reset subjects and topics and questions
  const onCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedSubjects([]);
    setSelectedTopics([]);
    setQuestions([]);
    sessionStorage.setItem('selectedSubjects', JSON.stringify([]));
    sessionStorage.setItem('selectedTopics', JSON.stringify([]));
  };

  // Load saved selections from sessionStorage on mount
  useEffect(() => {
    const savedSubjects = JSON.parse(sessionStorage.getItem('selectedSubjects') || '[]');
    const savedTopics = JSON.parse(sessionStorage.getItem('selectedTopics') || '[]');
    setSelectedSubjects(savedSubjects);
    setSelectedTopics(savedTopics);
  }, []);

  // Fetch questions based on filters whenever they change
  useEffect(() => {
    if (!selectedCategory || selectedSubjects.length === 0) {
      setQuestions([]);
      return;
    }

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        // Use selectedTopics only if any topics selected, else fetch questions for all topics under subject(s)
        const params = new URLSearchParams({
          category: selectedCategory,
          subjects: selectedSubjects.join(','),
          topic: selectedTopics.length > 0 ? selectedTopics.join(',') : '',
          tags: 'MCQ',
          difficulty: 'medium',
          page: '1',
          limit: numberOfItems.toString(),
        });

        const res = await axios.get(`http://localhost:5000/api/questions?${params.toString()}`);
        setQuestions(res.data.success ? res.data.data : []);
      } catch (err) {
        console.error(err);
        setQuestions([]);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [selectedCategory, selectedSubjects, selectedTopics, numberOfItems]);

  // Start Test API call with your requested format
  const startTest = async () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject to start the test.");
      return;
    }
    if (questions.length === 0) {
      alert("No questions available to start the test. Please adjust your filters.");
      return;
    }

    setIsLoading(true);

    try {
      // Build payload per your example: if topics selected, send them, else empty array for topics
      const payload = {
        category: selectedCategory,
        subject: selectedSubjects.length === 1 ? selectedSubjects[0] : selectedSubjects, // Send single or array
        topic: selectedTopics.length > 0 ? (selectedTopics.length === 1 ? selectedTopics[0] : selectedTopics) : [],
        tags: ['neurotransmitter', 'ANS'], // Example fixed tags, you might want to customize or remove this
        difficulty: 'medium',
        count: numberOfItems,
      };

      // For backward compatibility, if only one subject, send string, else array
      // Same for topic

      // POST to /api/tests/start per your request
      const response = await axios.post('http://localhost:5000/api/tests/start', payload);

      if (response.data.success) {
        navigate('/test-runner', {
          state: {
            testSessionId: response.data.testSessionId,
            questions,
            duration: parseInt(testDuration),
          },
        });
      } else {
        throw new Error(response.data.message || "Failed to start test");
      }
    } catch (err) {
      console.error("Error starting test:", err);
      alert("Failed to start test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const viewTestHistory = () => navigate('/test-history');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Synapaxon</h1>
        <button onClick={viewTestHistory} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
          View Test History
        </button>
      </header>

      <div className="bg-blue-800 text-white px-4 pb-2">
        <div className="inline-flex rounded-t-lg bg-white p-1">
          {['Test', 'Create Question'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 font-medium rounded-md ${
                activeTab === tab ? 'bg-blue-100 text-blue-800' : 'text-gray-600'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row p-8 gap-8">
        <div className="flex-1">
          {/* Category */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-blue-600 mb-4">Basic Science Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <label key={cat.name} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat.name}
                    onChange={() => onCategoryChange(cat.name)}
                    className="w-5 h-5"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Subjects */}
          {selectedCategory && (
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Select Subjects</h2>
              <div className="flex flex-wrap gap-4">
                {(subjectsByCategory[selectedCategory] || []).map((subject) => {
                  const isSelected = selectedSubjects.includes(subject);
                  return (
                    <label
                      key={subject}
                      className={`cursor-pointer px-4 py-2 rounded border select-none ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isSelected}
                        onChange={() => toggleSubject(subject)}
                      />
                      {subject}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Topics */}
          {selectedSubjects.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Select Topics</h2>
              <div className="flex flex-wrap gap-4">
                {selectedSubjects.flatMap((subject) =>
                  (topicsBySubject[subject] || []).map((topic) => (
                    <label
                      key={`${subject}-${topic}`}
                      className={`px-4 py-2 rounded cursor-pointer select-none border ${
                        selectedTopics.includes(topic)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedTopics.includes(topic)}
                        onChange={() => toggleTopic(topic)}
                      />
                      {topic}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Test Config */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Test Configuration</h2>
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="flex-1">
                <h3 className="font-medium text-gray-700 mb-4">Test Duration</h3>
                <div className="flex space-x-4">
                  {['60', '90', '120'].map((value) => (
                    <label key={value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="duration"
                        value={value}
                        checked={testDuration === value}
                        onChange={() => setTestDuration(value)}
                        className="mr-2 h-4 w-4"
                      />
                      ⏱️ {value} seconds
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-medium text-gray-700 mb-4">Number of Items</h3>
                <input
                  type="number"
                  value={numberOfItems}
                  onChange={(e) => setNumberOfItems(parseInt(e.target.value) || 1)}
                  className="border border-gray-300 rounded px-3 py-2 w-24"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </button>
            <button
              onClick={startTest}
              disabled={isLoading || questions.length === 0 || selectedSubjects.length === 0}
              className={`${
                questions.length > 0 && selectedSubjects.length > 0
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-200 text-gray-700 cursor-not-allowed'
              } px-8 py-2 rounded`}
            >
              {isLoading ? 'Starting...' : 'Start Test'}
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex-1 bg-white rounded-lg shadow p-6 overflow-auto max-h-[80vh]">
          <h2 className="text-xl font-bold mb-4">Selected Filters & Questions</h2>
          <div className="mb-6">
            <p><strong>Category:</strong> {selectedCategory}</p>
            <p><strong>Subjects:</strong> {selectedSubjects.join(', ') || 'None'}</p>
            <p><strong>Topics:</strong> {selectedTopics.join(', ') || 'None'}</p>
          </div>

          <h3 className="text-lg font-semibold mb-2">Questions</h3>
          {loading ? <p>Loading...</p> : questions.length === 0 ? <p>No questions found.</p> : (
            <ul className="space-y-6">
              {questions.map((q) => (
                <li key={q._id} className="border rounded p-4">
                  <h3 className="font-semibold mb-2">{q.questionText}</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {q.tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-200 text-blue-800 text-xs font-semibold px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600"><strong>Topic:</strong> {q.topic}</p>
                  <p className="text-sm text-gray-600"><strong>Difficulty:</strong> {q.difficulty}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
