// QuestionFilterPage.jsx - UPDATED
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function QuestionFilterPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Test");
  const [selectedCategory, setSelectedCategory] = useState("Basic Sciences");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [testDuration, setTestDuration] = useState("60");
  const [numberOfItems, setNumberOfItems] = useState(5);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { name: "Basic Sciences" },
    { name: "Organ Systems" },
    { name: "Clinical Specialties" },
  ];

  const subjectsByCategory = {
    "Basic Sciences": [
      "Neuroscience",
      "Physiology",
      "Anatomy",
      "Immunology",
      "Histology",
      "Microbiology",
    ],
    "Organ Systems": ["Respiratory System", "Renal System"],
    "Clinical Specialties": ["Pharmacology", "Cardiology"],
  };

  const topicsBySubject = {
    Neuroscience: ["Autonomic Nervous System", "Cranial Nerves"],
    Physiology: ["Endocrine System"],
    Anatomy: ["Cerebral Circulation"],
    Immunology: ["Hypersensitivity Reactions"],
    Histology: ["Respiratory Epithelium"],
    Microbiology: ["Antibiotics"],
    "Respiratory System": ["Pulmonary Physiology"],
    "Renal System": ["Nephrotic Syndrome"],
    Pharmacology: ["Cardiovascular Drugs"],
    Cardiology: ["Ischemic Heart Disease"],
  };

  const toggleSubject = (subject) => {
    setSelectedSubjects((prevSubjects) => {
      const isSelected = prevSubjects.includes(subject);
      const updatedSubjects = isSelected
        ? prevSubjects.filter((s) => s !== subject)
        : [...prevSubjects, subject];

      if (isSelected) {
        const subjectTopics = topicsBySubject[subject] || [];
        const updatedTopics = selectedTopics.filter(
          (t) => !subjectTopics.includes(t)
        );
        setSelectedTopics(updatedTopics);
      }

      return updatedSubjects;
    });
  };

  const toggleTopic = (topic) => {
    setSelectedTopics((prev) => {
      const updated = prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic];
      return updated;
    });
  };

  const onCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedSubjects([]);
    setSelectedTopics([]);
    setQuestions([]);
  };

  useEffect(() => {
    if (
      !selectedCategory ||
      selectedSubjects.length === 0 ||
      selectedTopics.length === 0
    ) {
      setQuestions([]);
      return;
    }

    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          category: selectedCategory,
          subjects: selectedSubjects.join(","),
          tags: "MCQ",
          page: "1",
          limit: numberOfItems.toString(),
        });

        if (selectedTopics.length > 0) {
          params.append("topic", selectedTopics.join(","));
        }

        if (difficulty) {
          params.append("difficulty", difficulty);
        }

        if (selectedTopics.length > 0) {
          params.append("topic", selectedTopics.join(","));
        }

        const token = localStorage.getItem("authToken");
        const res = await axios.get(
          `https://synapaxon-backend.onrender.com/api/questions?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setQuestions(res.data.success ? res.data.data : []);
      } catch (error) {
        console.error("Failed to fetch questions:", error);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedCategory, selectedSubjects, selectedTopics, numberOfItems]);

  const startTest = async () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject to start the test.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        category: selectedCategory,
        subject: selectedSubjects[0] || "", // send string
        topic: selectedTopics[0] || "", // send string
        tags: ["MCQ"],
        difficulty: "medium",
        count: numberOfItems,
        duration: parseInt(testDuration),
      };

      const token = localStorage.getItem("authToken");
      const res = await axios.post(
        "https://synapaxon-backend.onrender.com/api/tests/start",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        const { testSessionId, questions = [] } = res.data.data;

        if (!testSessionId || questions.length === 0) {
          throw new Error("Invalid test session or empty questions.");
        }

        // Use React Router's navigate with state instead of sessionStorage
        navigate("/dashboard/test-runner", {
          state: {
            testSessionId,
            questions,
            testDuration,
          },
        });
      } else {
        throw new Error(res.data.message || "Test start failed");
      }
    } catch (err) {
      console.error("Error starting test:", err);
      alert("Failed to start test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const viewTestHistory = () => navigate("/test-history");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      

      

      <div className="flex flex-col md:flex-row p-8 gap-8">
        <div className="flex-1">
          {/* Category */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-blue-600 mb-4">
              Basic Science Categories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <label
                  key={cat.name}
                  className="flex items-center space-x-2 cursor-pointer"
                >
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
              <h2 className="text-xl font-bold text-blue-600 mb-4">
                Select Subjects
              </h2>
              <div className="flex flex-wrap gap-4">
                {(subjectsByCategory[selectedCategory] || []).map((subject) => {
                  const isSelected = selectedSubjects.includes(subject);
                  return (
                    <label
                      key={subject}
                      className={`cursor-pointer px-4 py-2 rounded border select-none ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-blue-600 border-blue-600 hover:bg-blue-100"
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
              <h2 className="text-xl font-bold text-blue-600 mb-4">
                Select Topics
              </h2>
              <div className="flex flex-wrap gap-4">
                {selectedSubjects.flatMap((subject) =>
                  (topicsBySubject[subject] || []).map((topic) => (
                    <label
                      key={`${subject}-${topic}`}
                      className={`px-4 py-2 rounded cursor-pointer select-none border ${
                        selectedTopics.includes(topic)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-blue-100"
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
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Test Configuration
            </h2>
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="flex-1">
                <h3 className="font-medium text-gray-700 mb-4">
                  Test Duration
                </h3>
                <div className="flex space-x-4">
                  {["60", "90", "120"].map((value) => (
                    <label
                      key={value}
                      className="flex items-center cursor-pointer"
                    >
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
                <h3 className="font-medium text-gray-700 mb-4">Difficulty</h3>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="flex-1">
                <h3 className="font-medium text-gray-700 mb-4">
                  Number of Items
                </h3>
                <input
                  type="number"
                  value={numberOfItems}
                  onChange={(e) =>
                    setNumberOfItems(parseInt(e.target.value) || 1)
                  }
                  className="border border-gray-300 rounded px-3 py-2 w-24"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </button>
            <button
              onClick={startTest}
              disabled={isLoading || selectedSubjects.length === 0 || selectedTopics.length === 0}
              className={`${
                selectedSubjects.length > 0
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-200 text-gray-700 cursor-not-allowed"
              } px-8 py-2 rounded`}
            >
              {isLoading ? "Starting..." : "Start Test"}
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex-1 bg-white rounded-lg shadow p-6 overflow-auto max-h-[80vh]">
          <h2 className="text-xl font-bold mb-4">
            Selected Filters & Questions
          </h2>
          <div className="mb-6">
            <p>
              <strong>Category:</strong> {selectedCategory}
            </p>
            <p>
              <strong>Subjects:</strong> {selectedSubjects.join(", ") || "None"}
            </p>
            <p>
              <strong>Topics:</strong> {selectedTopics.join(", ") || "None"}
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-2">Questions</h3>
          {loading ? (
            <p>Loading...</p>
          ) : questions.length === 0 ? (
            <p>No questions found.</p>
          ) : (
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

                  <p className="text-sm text-gray-600">
                    <strong>Subject:</strong> {q.subject}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Topic:</strong> {q.topic}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Difficulty:</strong> {q.difficulty}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
