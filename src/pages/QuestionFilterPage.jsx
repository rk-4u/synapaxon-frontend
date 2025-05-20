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
  const [testDuration, setTestDuration] = useState("60");
  const [numberOfItems, setNumberOfItems] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("authToken");

  const fetchCounts = async () => {
    const subjects = subjectsByCategory[selectedCategory] || [];
    const subjectCountMap = {};
    const topicCountMap = {};

    await Promise.all(
      subjects.map(async (subject) => {
        try {
          const res = await axios.get(
            `http://localhost:5000/api/questions?category=${selectedCategory}&subject=${subject}&difficulty=${difficulty}`,
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

  useEffect(() => {
    setSelectedSubjects([]);
    setSelectedTopics([]);
    fetchCounts();
  }, [selectedCategory, difficulty]);

  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const toggleTopic = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const startTest = async () => {
    if (selectedSubjects.length === 0 || selectedTopics.length === 0) {
      alert("Please select at least one subject and one topic to start the test.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
            category: selectedCategory,
            subjects: selectedSubjects,  
            topics: selectedTopics,     
            difficulty,
            count: numberOfItems,
            duration: parseInt(testDuration),
          };


      const res = await axios.post(
        "http://localhost:5000/api/tests/start",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        const { testSessionId, questions } = res.data.data;
        if (!testSessionId || questions.length === 0) {
          throw new Error("No questions returned.");
        }

        navigate("/dashboard/test-runner", {
          state: {
            testSessionId,
            questions,
            testDuration,
          },
        });
      } else {
        alert("Test could not be started.");
      }
    } catch (error) {
      console.error("Error starting test:", error);
      alert("Failed to start test.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
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

        {/* Topics */}
        {selectedSubjects.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-blue-600 mb-4">Select Topics</h2>
            <div className="flex flex-wrap gap-4">
              {selectedSubjects.flatMap((subject) =>
                (topicsBySubject[subject] || []).map((topic) => {
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
                })
              )}
            </div>
          </div>
        )}

        {/* Test Configuration */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Test Configuration</h2>
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="flex-1">
              <h3 className="font-medium text-gray-700 mb-4">Test Duration (seconds)</h3>
              <div className="flex space-x-4">
                {["60", "90", "120"].map((value) => (
                  <label key={value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="duration"
                      value={value}
                      checked={testDuration === value}
                      onChange={() => setTestDuration(value)}
                      className="mr-2 h-4 w-4"
                    />
                    {value}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-medium text-gray-700 mb-4">Difficulty</h3>
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
            disabled={
              isLoading || selectedSubjects.length === 0 || selectedTopics.length === 0
            }
            className={`${
              selectedSubjects.length > 0 && selectedTopics.length > 0
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-200 text-gray-700 cursor-not-allowed"
            } px-8 py-2 rounded`}
          >
            {isLoading ? "Starting..." : "Start Test"}
          </button>
        </div>
      </div>
    </div>
  );
}
