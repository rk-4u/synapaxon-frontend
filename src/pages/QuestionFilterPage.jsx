import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { categories, subjectsByCategory, topicsBySubject } from "../data/questionData";

export default function QuestionFilterPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Basic Sciences");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [subjectCounts, setSubjectCounts] = useState({});
  const [topicCounts, setTopicCounts] = useState({});
  const [difficulty, setDifficulty] = useState("medium");
  const [useTimer, setUseTimer] = useState(false);
  const [testDuration, setTestDuration] = useState("90");
  const [numberOfItems, setNumberOfItems] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  const token = localStorage.getItem("token");

  // Fetch all questions based on current filters (category, subject, difficulty)
  const fetchQuestions = async () => {
    try {
      // Determine which subjects to fetch - if none selected, fetch all in the category
      const subjectsToFetch = selectedSubjects.length > 0 
        ? selectedSubjects.join(",") 
        : subjectsByCategory[selectedCategory]?.join(",") || "";
        
      const res = await axios.get(
        `https://synapaxon-backend.onrender.com/api/questions?category=${selectedCategory}&subject=${subjectsToFetch}&difficulty=${difficulty}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const allQuestions = res.data.data || [];
      
      // Apply topic filter if topics are selected
      const filteredByTopic = selectedTopics.length > 0
        ? allQuestions.filter(q => selectedTopics.includes(q.topic))
        : allQuestions;
        
      setQuestions(filteredByTopic);
      return filteredByTopic;
    } catch (err) {
      console.error("Error fetching questions:", err);
      return [];
    }
  };

  const fetchCounts = async () => {
    const subjects = subjectsByCategory[selectedCategory] || [];
    const subjectCountMap = {};
    const topicCountMap = {};

    await Promise.all(
      subjects.map(async (subject) => {
        try {
          const res = await axios.get(
            `https://synapaxon-backend.onrender.com/api/questions?category=${selectedCategory}&subject=${subject}&difficulty=${difficulty}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const subjectQuestions = res.data.data || [];
          subjectCountMap[subject] = subjectQuestions.length;

          // Topic counts under this subject
          const topics = topicsBySubject[subject] || [];
          for (const topic of topics) {
            const topicQuestions = subjectQuestions.filter((q) => q.topic === topic);
            topicCountMap[`${subject}||${topic}`] = topicQuestions.length;
          }
        } catch (err) {
          subjectCountMap[subject] = 0;
        }
      })
    );

    setSubjectCounts(subjectCountMap);
    setTopicCounts(topicCountMap);
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchCounts();
    fetchQuestions();
  }, [selectedCategory, difficulty]);

  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) => {
      const newSelection = prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject];
      
      // When a subject is deselected, remove its topics from selectedTopics
      if (prev.includes(subject) && !newSelection.includes(subject)) {
        const subjectTopics = topicsBySubject[subject] || [];
        setSelectedTopics(current => 
          current.filter(topic => !subjectTopics.includes(topic))
        );
      }
      
      return newSelection;
    });
  };

  const toggleTopic = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  // Update questions when subjects or topics change
  useEffect(() => {
    fetchQuestions();
  }, [selectedSubjects, selectedTopics]);

  const startTest = async () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject to start the test.");
      return;
    }

    setIsLoading(true);

    try {
      // Get filtered questions based on current selection
      const filteredQuestions = await fetchQuestions();
      
      if (filteredQuestions.length === 0) {
        alert("No questions available for the selected filters. Please adjust your selection.");
        setIsLoading(false);
        return;
      }

      // Shuffle the questions to get random selection
      const shuffledQuestions = filteredQuestions.sort(() => Math.random() - 0.5);
      
      // Select only the requested number of questions
      const selectedQuestions = shuffledQuestions.slice(0, Math.min(numberOfItems, filteredQuestions.length));
  
      // Format questions for the test session
      const formattedQuestions = selectedQuestions.map(q => ({
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        category: q.category,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        correctAnswer: q.correctAnswer // Make sure to include this if needed
      }));

      // Create the payload with the pre-filtered questions
      const payload = {
        category: selectedCategory,
        subjects: selectedSubjects,  
        topics: selectedTopics.length > 0 ? selectedTopics : [], // Send empty array if no topics selected
        difficulty,
        count: selectedQuestions.length, // Use actual count of selected questions
        duration: useTimer ? parseInt(testDuration) : 0,
        questions: formattedQuestions // Send the pre-filtered questions
      };

      console.log("Starting test with payload:", payload); // Debug log

      const res = await axios.post(
        "https://synapaxon-backend.onrender.com/api/tests/start",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (res.data.success) {
        const { testSessionId, questions: returnedQuestions } = res.data.data;
        
        // Use the questions we sent if the backend doesn't return the filtered ones
        const questionsToUse = returnedQuestions && returnedQuestions.length > 0 
          ? returnedQuestions 
          : formattedQuestions;

        if (!testSessionId || !questionsToUse || questionsToUse.length === 0) {
          throw new Error("No questions returned from server.");
        }

        navigate("/dashboard/test-runner", {
          state: {
            testSessionId,
            questions: questionsToUse,
            testDuration: useTimer ? testDuration : 0,
            selectedFilters: {
              category: selectedCategory,
              subjects: selectedSubjects,
              topics: selectedTopics,
              difficulty: difficulty
            }
          },
        });
      } else {
        alert("Test could not be started: " + (res.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error starting test:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
      alert(`Failed to start test: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex items-center p-4">
        {/* Difficulty Dropdown on Left */}
        <div className="flex-1">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="p-8">
        {/* Category Tabs */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2"></label>
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setSelectedSubjects([]); // reset selections on change
                  setSelectedTopics([]);
                }}
                className={`flex-1 py-3 text-center font-medium transition-colors rounded ${
                  selectedCategory === cat.name
                    ? "bg-blue-500 text-white"
                    : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Subjects */}
        {selectedCategory && (
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-blue-600 mb-4">Select Subjects</h2>
            <div className="flex flex-wrap gap-4">
              {(subjectsByCategory[selectedCategory] || []).map((subject) => {
                const count = subjectCounts[subject] || 0;
                const isSelected = selectedSubjects.includes(subject);
                return (
                  <label
                    key={subject}
                    className={`px-4 py-2 rounded border select-none flex items-center space-x-2 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600"
                        : count === 0
                        ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                        : "bg-white text-blue-600 border-blue-600 hover:bg-blue-100 cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={count === 0}
                      onChange={() => toggleSubject(subject)}
                      className="hidden"
                    />
                    <span>{subject}</span>
                    <span className={`${count > 0 ? "text-green-600" : "text-red-500"} font-bold`}>
                      Q{count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Topics - Only show for selected subjects */}
        {selectedSubjects.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-blue-600 mb-4">Select Topics (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">Leave topics unselected to include all topics from selected subjects</p>
            {selectedSubjects.map(subject => (
              <div key={subject} className="mb-4">
                <h3 className="text-md font-semibold text-gray-700 mb-3">{subject}</h3>
                <div className="flex flex-wrap gap-4 ml-4">
                  {(topicsBySubject[subject] || []).map((topic) => {
                    const key = `${subject}||${topic}`;
                    const count = topicCounts[key] || 0;
                    const isSelected = selectedTopics.includes(topic);

                    return (
                      <label
                        key={key}
                        className={`px-4 py-2 rounded border select-none flex items-center space-x-2 ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : count === 0
                            ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-blue-100 cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={count === 0}
                          onChange={() => toggleTopic(topic)}
                          className="hidden"
                        />
                        <span>{topic}</span>
                        <span className={`${count > 0 ? "text-green-600" : "text-red-500"} font-bold`}>
                          Q{count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Questions Preview */}
        {selectedSubjects.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-semibold text-green-700 mb-2">Available Questions</h3>
            <p className="text-green-600">
              {questions.length} questions available with current filters
              {numberOfItems > questions.length && (
                <span className="text-orange-600 ml-2">
                  (Requested {numberOfItems}, but only {questions.length} available)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Test Configuration */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Test Configuration</h2>
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="flex-1">
              <h3 className="font-medium text-gray-700 mb-4">Timer</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={useTimer}
                  onChange={() => setUseTimer(!useTimer)}
                  className="mr-2 h-4 w-4"
                  id="timerCheckbox"
                />
                <label htmlFor="timerCheckbox" className="cursor-pointer">
                  Use 90 second timer
                </label>
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
                max={questions.length || 100}
              />
              {questions.length > 0 && numberOfItems > questions.length && (
                <p className="text-sm text-orange-600 mt-1">
                  Max available: {questions.length}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded flex items-center"
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
          </button>

          <button
            onClick={startTest}
            disabled={isLoading || selectedSubjects.length === 0 || questions.length === 0}
            className={`${
              selectedSubjects.length > 0 && questions.length > 0
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-200 text-gray-700 cursor-not-allowed"
            } px-8 py-2 rounded`}
          >
            {isLoading ? "Starting..." : `Start Test (${Math.min(numberOfItems, questions.length)} questions)`}
          </button>
        </div>
      </div>
    </div>
  );
}