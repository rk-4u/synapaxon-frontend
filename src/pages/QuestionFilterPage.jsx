import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import axios from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import { categories, subjectsByCategory, topicsBySubject } from "../data/questionData";

export default function QuestionFilterPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || "");
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [selectedTopics, setSelectedTopics] = useState(new Map());
  const [categoryCounts, setCategoryCounts] = useState({});
  const [subjectCounts, setSubjectCounts] = useState({});
  const [topicCounts, setTopicCounts] = useState({});
  const [difficulty, setDifficulty] = useState("all");
  const [useTimer, setUseTimer] = useState(false);
  const [testDuration, setTestDuration] = useState("90");
  const [numberOfItems, setNumberOfItems] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [questionStatusFilter, setQuestionStatusFilter] = useState("all");
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const token = localStorage.getItem("token");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };
    window.addEventListener("storage", handleStorageChange);
    document.documentElement.classList.toggle("dark", theme === "dark");
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [theme]);

  // Reset subjects and topics when top-level filters change
  useEffect(() => {
    setSelectedSubjects(new Set());
    setSelectedTopics(new Map());
    setActiveSubject(null);
  }, [questionStatusFilter, difficulty, selectedCategory]);

  // Normalize StudentQuestion subjects to match Question schema
  const normalizeStudentQuestion = (sq) => {
    if (!sq || !sq.question) {
      console.warn("Skipping invalid student question:", sq);
      return null;
    }
    return {
      ...sq.question,
      _id: sq.question._id,
      subjects: (sq.subjects || []).map(name => ({
        name,
        topics: (sq.topics || []).filter(t => (topicsBySubject[name] || []).includes(t))
      })),
      isCorrect: sq.isCorrect,
      selectedAnswer: sq.selectedAnswer
    };
  };

  // Helper function to build query parameters
  const buildQueryParams = () => {
    const params = [];
    if (selectedCategory) params.push(`category=${selectedCategory}`);
    if (difficulty !== "all") params.push(`difficulty=${difficulty}`);
    if (selectedSubjects.size > 0) {
      params.push(`subjects=${Array.from(selectedSubjects).join(',')}`);
    }
    if (selectedTopics.size > 0) {
      const topics = Array.from(selectedTopics.values()).flat();
      if (topics.length > 0) params.push(`topics=${topics.join(',')}`);
    }
    return params.length > 0 ? `?${params.join('&')}` : '';
  };

  // Fetch counts for categories, subjects, and topics
  const fetchCounts = async () => {
    setErrorMessage("");
    const categoryCountMap = {};
    const subjectCountMap = {};
    const topicCountMap = {};

    try {
      if (!token) {
        throw new Error("Authentication token missing. Please log in.");
      }

      // Initialize counts for all categories
      categories.forEach((cat) => {
        categoryCountMap[cat.name] = { all: 0, correct: 0, incorrect: 0, unattempted: 0, flagged: 0 };
      });

      // Build API query for history (without difficulty)
      let historyQueryParams = [`category=${selectedCategory}`];
      if (selectedSubjects.size > 0) {
        historyQueryParams.push(`subjects=${Array.from(selectedSubjects).join(',')}`);
      }
      if (selectedTopics.size > 0) {
        const topics = Array.from(selectedTopics.values()).flat();
        if (topics.length > 0) historyQueryParams.push(`topics=${topics.join(',')}`);
      }
      const historyQuery = `/api/student-questions/history?${historyQueryParams.join('&')}`;
      const historyRes = await axios.get(historyQuery, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!historyRes.data.success) {
        throw new Error(historyRes.data.message || "Failed to fetch question history");
      }

      const historyQuestions = (historyRes.data.data || [])
        .map(normalizeStudentQuestion)
        .filter(Boolean);

      // Build API query for all questions
      const questionsQuery = `/api/questions?category=${selectedCategory}&createdBy=me${difficulty !== "all" ? `&difficulty=${difficulty}` : ""}${selectedSubjects.size > 0 ? `&subjects=${Array.from(selectedSubjects).join(',')}` : ""}${selectedTopics.size > 0 ? `&topics=${Array.from(selectedTopics.values()).flat().join(',')}` : ""}`;
      const allQuestionsRes = await axios.get(questionsQuery, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!allQuestionsRes.data.success) {
        throw new Error(allQuestionsRes.data.message || "Failed to fetch questions");
      }

      const allQuestions = allQuestionsRes.data.data || [];

      // Compute status counts
      const correctIds = historyQuestions
        .filter((q) => q.isCorrect)
        .map((q) => q._id.toString());
      const incorrectIds = historyQuestions
        .filter((q) => !q.isCorrect && q.selectedAnswer !== -1)
        .map((q) => q._id.toString());
      const flaggedIds = historyQuestions
        .filter((q) => q.selectedAnswer === -1)
        .map((q) => q._id.toString());
      const allIds = allQuestions.map((q) => q._id.toString());
      const unattemptedIds = allIds.filter(
        (id) => !correctIds.includes(id) && !incorrectIds.includes(id) && !flaggedIds.includes(id)
      );

      categoryCountMap[selectedCategory] = {
        all: allQuestions.length,
        correct: correctIds.length,
        incorrect: incorrectIds.length,
        unattempted: unattemptedIds.length,
        flagged: flaggedIds.length,
      };

      // Derive subjects and topics counts
      const subjects = [...new Set(allQuestions.flatMap((q) => q.subjects.map(s => s.name)))];

      subjects.forEach((subject) => {
        const subjectQuestions = allQuestions.filter((q) => q.subjects.some(s => s.name === subject));
        const subjectHistory = historyQuestions.filter((q) => q.subjects.some(s => s.name === subject));
        const subjectCorrectIds = subjectHistory
          .filter((q) => q.isCorrect)
          .map((q) => q._id.toString());
        const subjectIncorrectIds = subjectHistory
          .filter((q) => !q.isCorrect && q.selectedAnswer !== -1)
          .map((q) => q._id.toString());
        const subjectFlaggedIds = subjectHistory
          .filter((q) => q.selectedAnswer === -1)
          .map((q) => q._id.toString());
        const subjectAllIds = subjectQuestions.map((q) => q._id.toString());
        const subjectUnattemptedIds = subjectAllIds.filter(
          (id) =>
            !subjectCorrectIds.includes(id) &&
            !subjectIncorrectIds.includes(id) &&
            !subjectFlaggedIds.includes(id)
        );

        subjectCountMap[subject] =
          questionStatusFilter === "all"
            ? subjectQuestions.length
            : questionStatusFilter === "correct"
            ? subjectCorrectIds.length
            : questionStatusFilter === "incorrect"
            ? subjectIncorrectIds.length
            : questionStatusFilter === "unattempted"
            ? subjectUnattemptedIds.length
            : subjectFlaggedIds.length;

        const topics = [...new Set(subjectQuestions.flatMap((q) => 
          q.subjects.find(s => s.name === subject)?.topics || []
        ))];

        topics.forEach((topic) => {
          const topicQuestions = subjectQuestions.filter((q) => 
            q.subjects.some(s => s.name === subject && s.topics.includes(topic))
          );
          const topicHistory = subjectHistory.filter((q) => 
            q.subjects.some(s => s.name === subject && s.topics.includes(topic))
          );
          const topicCorrectIds = topicHistory
            .filter((q) => q.isCorrect)
            .map((q) => q._id.toString());
          const topicIncorrectIds = topicHistory
            .filter((q) => !q.isCorrect && q.selectedAnswer !== -1)
            .map((q) => q._id.toString());
          const topicFlaggedIds = topicHistory
            .filter((q) => q.selectedAnswer === -1)
            .map((q) => q._id.toString());
          const topicAllIds = topicQuestions.map((q) => q._id.toString());
          const topicUnattemptedIds = topicAllIds.filter(
            (id) =>
              !topicCorrectIds.includes(id) &&
              !topicIncorrectIds.includes(id) &&
              !topicFlaggedIds.includes(id)
          );

          topicCountMap[`${subject}||${topic}`] =
            questionStatusFilter === "all"
              ? topicQuestions.length
              : questionStatusFilter === "correct"
              ? topicCorrectIds.length
              : questionStatusFilter === "incorrect"
              ? topicIncorrectIds.length
              : questionStatusFilter === "unattempted"
              ? topicUnattemptedIds.length
              : topicFlaggedIds.length;
        });
      });

      setCategoryCounts(categoryCountMap);
      setSubjectCounts(subjectCountMap);
      setTopicCounts(topicCountMap);
      setTotalQuestions(allQuestions.length);
    } catch (err) {
      console.error("Error fetching counts:", err);
      setErrorMessage(err.message || "Failed to load question counts. Please try again.");
      setCategoryCounts(categoryCountMap);
      setSubjectCounts({});
      setTopicCounts({});
      setTotalQuestions(0);
    }
  };

  // Fetch questions based on top-level filters
  const fetchQuestions = async () => {
    setErrorMessage("");
    try {
      if (!token) {
        throw new Error("Authentication token missing. Please log in.");
      }

      setIsLoading(true);
      let allQuestions = [];

      // Build base history query without difficulty
      let baseHistoryQueryParams = [`category=${selectedCategory}`];
      if (selectedSubjects.size > 0) {
        baseHistoryQueryParams.push(`subjects=${Array.from(selectedSubjects).join(',')}`);
      }
      if (selectedTopics.size > 0) {
        const topics = Array.from(selectedTopics.values()).flat();
        if (topics.length > 0) baseHistoryQueryParams.push(`topics=${topics.join(',')}`);
      }
      const baseHistoryQuery = `/api/student-questions/history?${baseHistoryQueryParams.join('&')}`;

      if (questionStatusFilter === "correct") {
        const res = await axios.get(`${baseHistoryQuery}&isCorrect=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch correct questions");
        }
        allQuestions = res.data.data.map(normalizeStudentQuestion).filter(q => q !== null);
        setTotalQuestions(res.data.count || allQuestions.length);
      } else if (questionStatusFilter === "incorrect") {
        const res = await axios.get(`${baseHistoryQuery}&isCorrect=false&flagged=false`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch incorrect questions");
        }
        allQuestions = res.data.data.map(normalizeStudentQuestion).filter(q => q !== null);
        setTotalQuestions(res.data.count || allQuestions.length);
      } else if (questionStatusFilter === "flagged") {
        const res = await axios.get(`${baseHistoryQuery}&flagged=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch flagged questions");
        }
        allQuestions = res.data.data.map(normalizeStudentQuestion).filter(q => q !== null);
        setTotalQuestions(res.data.count || allQuestions.length);
      } else if (questionStatusFilter === "unattempted") {
        const allQuestionsRes = await axios.get(
          `/api/questions?category=${selectedCategory}&createdBy=me${difficulty !== "all" ? `&difficulty=${difficulty}` : ""}${selectedSubjects.size > 0 ? `&subjects=${Array.from(selectedSubjects).join(',')}` : ""}${selectedTopics.size > 0 ? `&topics=${Array.from(selectedTopics.values()).flat().join(',')}` : ""}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!allQuestionsRes.data.success) {
          throw new Error(allQuestionsRes.data.message || "Failed to fetch all questions");
        }
        const historyRes = await axios.get(baseHistoryQuery, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!historyRes.data.success) {
          throw new Error(historyRes.data.message || "Failed to fetch question history");
        }
        const allAvailableQuestions = allQuestionsRes.data.data || [];
        const historyQuestions = historyRes.data.data || [];
        const historyIds = historyQuestions.map((q) => q.question._id.toString());
        allQuestions = allAvailableQuestions.filter((q) => !historyIds.includes(q._id.toString()));
        setTotalQuestions(allQuestions.length);
      } else {
        const res = await axios.get(
          `/api/questions?category=${selectedCategory}&createdBy=me${difficulty !== "all" ? `&difficulty=${difficulty}` : ""}${selectedSubjects.size > 0 ? `&subjects=${Array.from(selectedSubjects).join(',')}` : ""}${selectedTopics.size > 0 ? `&topics=${Array.from(selectedTopics.values()).flat().join(',')}` : ""}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch questions");
        }
        allQuestions = res.data.data || [];
        setTotalQuestions(res.data.count || allQuestions.length);
      }

      setQuestions(allQuestions);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setErrorMessage(err.message || "Failed to load questions. Please try again.");
      setQuestions([]);
      setTotalQuestions(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchCounts();
      fetchQuestions();
    }
  }, [questionStatusFilter, difficulty, selectedCategory, selectedSubjects, selectedTopics]);

  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(subject)) {
        newSelection.delete(subject);
        setSelectedTopics((prevTopics) => {
          const newTopics = new Map(prevTopics);
          newTopics.delete(subject);
          return newTopics;
        });
      } else {
        newSelection.add(subject);
      }
      setActiveSubject(newSelection.size > 0 ? subject : null);
      return newSelection;
    });
  };

  const toggleTopic = (topic, subject) => {
    setSelectedTopics((prev) => {
      const newTopics = new Map(prev);
      const subjectTopics = newTopics.get(subject) || [];
      if (subjectTopics.includes(topic)) {
        newTopics.set(subject, subjectTopics.filter((t) => t !== topic));
      } else {
        newTopics.set(subject, [...subjectTopics, topic]);
      }
      if (newTopics.get(subject).length === 0) {
        newTopics.delete(subject);
      }
      return newTopics;
    });
  };

  const startTest = async () => {
    if (selectedSubjects.size === 0 || questions.length === 0) {
      setErrorMessage("Select at least one subject with available questions");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      if (!token) {
        throw new Error("Authentication token missing. Please log in.");
      }

      const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
      const maxQuestions = Math.min(numberOfItems, questions.length, 50);
      const selectedQuestions = shuffledQuestions.slice(0, maxQuestions);
      const questionIds = selectedQuestions.map((q) => q._id || q.question._id);

      const payload = {
        questionIds,
        difficulty: difficulty === "all" ? undefined : difficulty,
        count: questionIds.length,
        duration: useTimer ? parseInt(testDuration) : 0,
      };

      const res = await axios.post("/api/tests", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to create test session");
      }

      const { _id: testSessionId, questions: returnedQuestions } = res.data.data;
      if (!testSessionId || !returnedQuestions || returnedQuestions.length === 0) {
        throw new Error("Invalid test session data: Missing testSessionId or questions");
      }

      const testData = {
        testSessionId,
        questions: returnedQuestions,
        testDuration: useTimer ? parseInt(testDuration) : 0,
        selectedFilters: {
          category: selectedCategory,
          subjects: Array.from(selectedSubjects),
          topics: Array.from(selectedTopics.entries()).reduce(
            (acc, [subject, topics]) => ({ ...acc, [subject]: topics }),
            {}
          ),
          difficulty,
          questionStatus: questionStatusFilter,
        },
      };

      sessionStorage.setItem("testData", JSON.stringify(testData));
      navigate("/dashboard/test-runner", { state: testData });
    } catch (error) {
      console.error("Error starting test:", error);
      setErrorMessage(error.message || "Failed to start test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white/10 dark:bg-black/10 backdrop-blur-lg">
      {errorMessage && (
        <div className="bg-red-600/30 dark:bg-red-600/20 border border-red-500/40 dark:border-red-500/30 text-red-900 dark:text-red-200 p-4 m-4 rounded-lg backdrop-blur-md">
          {errorMessage}
          {errorMessage.includes("token") && (
            <button
              onClick={() => navigate("/login")}
              className="ml-2 underline text-blue-600 dark:text-blue-400"
            >
              Log in
            </button>
          )}
        </div>
      )}
      <div className="flex items-center p-4 bg-white/20 dark:bg-black/20 backdrop-blur-sm border-b border-white/40 dark:border-gray-800/20">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Question Status</h3>
          <div className="flex gap-2">
            {[
              { value: "all", label: `All (Q${categoryCounts[selectedCategory]?.all || 0})` },
              { value: "correct", label: `Correct (Q${categoryCounts[selectedCategory]?.correct || 0})` },
              { value: "incorrect", label: `Incorrect (Q${categoryCounts[selectedCategory]?.incorrect || 0})` },
              { value: "unattempted", label: `Unattempted (Q${categoryCounts[selectedCategory]?.unattempted || 0})` },
              { value: "flagged", label: `Flagged (Q${categoryCounts[selectedCategory]?.flagged || 0})` },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setQuestionStatusFilter(filter.value)}
                className={`flex-1 py-2 text-center font-medium transition-colors rounded ${
                  questionStatusFilter === filter.value
                    ? "bg-blue-600/90 dark:bg-blue-600/80 text-white"
                    : "bg-white/30 dark:bg-black/10 text-gray-900 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-black/20"
                } backdrop-blur-sm border border-white/40 dark:border-gray-700/30`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 ml-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Difficulty</h3>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2 border border-white/40 dark:border-gray-700/30 rounded-md bg-white/30 dark:bg-black/10 backdrop-blur-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-4">Select Category</h2>
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex-1 py-3 text-center font-medium transition-colors rounded ${
                  selectedCategory === cat.name
                    ? "bg-blue-600/90 dark:bg-blue-600/80 text-white"
                    : "bg-white/30 dark:bg-black/10 text-gray-900 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-black/20"
                } backdrop-blur-sm border border-white/40 dark:border-gray-700/30`}
              >
                {cat.name} (Q{categoryCounts[cat.name]?.[questionStatusFilter] || 0})
              </button>
            ))}
          </div>
        </div>

        {selectedCategory && (
          <div className="bg-white/20 dark:bg-black/20 rounded-lg p-6 mb-8 backdrop-blur-sm border border-white/40 dark:border-gray-800/20">
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Select Subjects</h2>
            <div className="flex flex-wrap gap-4">
              {(subjectsByCategory[selectedCategory] || []).map((subject) => {
                const count = subjectCounts[subject] || 0;
                const isSelected = selectedSubjects.has(subject);
                return (
                  <label
                    key={subject}
                    className={`px-4 py-2 rounded border select-none flex items-center space-x-2 backdrop-blur-sm ${
                      isSelected
                        ? "bg-blue-600/90 dark:bg-blue-600/80 text-white border-blue-600 dark:border-blue-400"
                        : count === 0
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600 cursor-not-allowed"
                        : "bg-white/30 dark:bg-black/10 text-gray-900 dark:text-gray-300 border-white/40 dark:border-gray-700/30 hover:bg-white/40 dark:hover:bg-black/20 cursor-pointer"
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
                    <span className={`${count > 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"} font-bold`}>
                      Q{count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {selectedSubjects.size > 0 && (
          <div className="bg-white/20 dark:bg-black/20 rounded-lg p-6 mb-8 backdrop-blur-sm border border-white/40 dark:border-gray-800/20">
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Select Topics (Optional)</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Leave topics unselected to include all topics from selected subjects
            </p>
            <div className="flex gap-4 mb-4">
              {Array.from(selectedSubjects).map((subject) => (
                <button
                  key={subject}
                  onClick={() => setActiveSubject(subject)}
                  className={`px-4 py-2 rounded backdrop-blur-sm border border-white/40 dark:border-gray-700/30 ${
                    activeSubject === subject
                      ? "bg-blue-600/90 dark:bg-blue-600/80 text-white"
                      : "bg-white/30 dark:bg-black/10 text-gray-900 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-black/20"
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
            {activeSubject && (
              <div className="ml-4">
                <h3 className="text-md font-semibold text-gray-900 dark:text-gray-200 mb-3">{activeSubject}</h3>
                <div className="flex flex-wrap gap-4">
                  {(topicsBySubject[activeSubject] || []).map((topic) => {
                    const key = `${activeSubject}||${topic}`;
                    const count = topicCounts[key] || 0;
                    const isSelected = (selectedTopics.get(activeSubject) || []).includes(topic);
                    return (
                      <label
                        key={key}
                        className={`px-4 py-2 rounded border select-none flex items-center space-x-2 backdrop-blur-sm ${
                          isSelected
                            ? "bg-blue-600/90 dark:bg-blue-600/80 text-white border-blue-600 dark:border-blue-400"
                            : count === 0
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600 cursor-not-allowed"
                            : "bg-white/30 dark:bg-black/10 text-gray-900  dark:text-gray-300 border-white/40 dark:border-gray-700/30 hover:bg-white/40 dark:hover:bg-black/20 cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={count === 0}
                          onChange={() => toggleTopic(topic, activeSubject)}
                          className="hidden"
                        />
                        <span>{topic}</span>
                        <span className={`${count > 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"} font-bold`}>
                          Q{count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mt-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-200 mb-3">Selected Filters</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedSubjects).map((subject) => (
                  <span
                    key={subject}
                    className="px-3 py-1 bg-blue-600/30 dark:bg-blue-600/20 text-gray-900 dark:text-gray-300 rounded-full text-sm border border-blue-500/40 dark:border-blue-500/30"
                  >
                    {subject}
                    {selectedTopics.get(subject)?.length > 0
                      ? ` → ${selectedTopics.get(subject).join(", ")}`
                      : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-green-600/30 dark:bg-green-600/20 rounded-lg p-4 mb-8 backdrop-blur-md border border-green-500/40 dark:border-green-500/30">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">Available Questions</h3>
          <p className="text-green-900 dark:text-green-300">
            {questions.length} questions available with current filters
          </p>
          <p className="text-green-900 dark:text-green-300 mt-1">
            {Math.min(numberOfItems, questions.length, 50)} questions selected for the test
            {numberOfItems > questions.length && (
              <span className="text-orange-600 dark:text-orange-400 ml-2">
                (Requested {numberOfItems}, but only {questions.length} available)
              </span>
            )}
            {numberOfItems > 50 && (
              <span className="text-orange-600 dark:text-orange-400 ml-2">
                (Limited to 50 questions maximum)
              </span>
            )}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-6">Test Configuration</h2>
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="flex items-center">
              <button
                onClick={() => setUseTimer(!useTimer)}
                className={`ml-0 relative inline-block w-12 h-6 rounded-full transition-all duration-300 bg-gradient-to-r bg-[length:200%_100%] ${
                  useTimer
                    ? "from-green-400 to-green-700 bg-right"
                    : "from-gray-300 to-gray-500 bg-left"
                } backdrop-blur-sm border border-white/40 dark:border-gray-700/30`}
                aria-label="Toggle timer"
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 bg-white shadow-md ${
                    useTimer ? "left-[calc(100%-1.25rem-0.125rem)]" : "left-0.5"
                  }`}
                ></span>
              </button>
              <label htmlFor="timerCheckbox" className="ml-3 cursor-pointer text-gray-900 dark:text-gray-300">
                Use timer
              </label>
              {useTimer && (
                <input
                  type="number"
                  value={testDuration}
                  onChange={(e) => setTestDuration(e.target.value || "90")}
                  className="ml-3 border border-white/40 dark:border-gray-700/30 rounded px-3 py-2 w-24 bg-white/30 dark:bg-black/10 backdrop-blur-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  min="10"
                  max="3600"
                  placeholder="Duration (seconds)"
                />
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-4">Number of Items</h3>
              <input
                type="number"
                value={numberOfItems}
                onChange={(e) => setNumberOfItems(Math.min(parseInt(e.target.value) || 1, 50))}
                className="border border-white/40 dark:border-gray-700/30 rounded px-3 py-2 w-24 bg-white/30 dark:bg-black/10 backdrop-blur-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                min="1"
                max="50"
              />
              {questions.length > 0 && numberOfItems > questions.length && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  Max available: {questions.length}
                </p>
              )}
              {numberOfItems > 50 && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  Max allowed: 50
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="border border-white/40 dark:border-gray-700/30 bg-white/30 dark:bg-black/10 text-gray-900 dark:text-gray-300 px-4 py-2 rounded flex items-center hover:bg-white/40 dark:hover:bg-black/20 backdrop-blur-sm"
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
          </button>

          <button
            onClick={startTest}
            disabled={isLoading || selectedSubjects.size === 0 || questions.length === 0}
            className={`px-8 py-2 rounded backdrop-blur-sm border border-white/40 dark:border-gray-700/20 ${
              selectedSubjects.size > 0 && questions.length > 0
                ? "bg-green-600/90 dark:bg-green-600/80 hover:bg-green-700/95 dark:hover:bg-green-500/90 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading
              ? "Starting..."
              : `Start Test (${Math.min(numberOfItems, questions.length, 50)} questions)`}
          </button>
        </div>
      </div>
    </div>
  );
}