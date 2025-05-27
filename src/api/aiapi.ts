// src/api/aiApi.ts
import axios from 'axios';

// Determine the AI backend URL.
// In development, this might be http://localhost:8000
// In production, this will be the URL where your FastAPI AI service is deployed.
// It's good practice to use environment variables for this.
const AI_BACKEND_URL = 'https://syna-backend-hyty.onrender.com';

const aiApiClient = axios.create({
  baseURL: AI_BACKEND_URL,
  // You might not need to send the token here if the AI backend doesn't require it directly,
  // or if it's secured by other means (e.g., network, API Gateway).
  // If it *does* need a token (e.g., a shared API key for the AI service):
  // headers: {
  //   'X-AI-Service-Key': 'YOUR_SHARED_AI_SERVICE_KEY' // Example
  // }
});

// Interface for the expected successful response data structure
interface AIQuestionData {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number; // Index
  explanation: string;
}

interface AIGenerateQuestionsResponse {
  success: boolean;
  data: AIQuestionData[] | null;
  message?: string;
}

export const generateQuestionsFromDocumentAI = async (
  files: File[],
  userInstructions?: string
): Promise<AIGenerateQuestionsResponse> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file); // Key must match FastAPI endpoint's `files` parameter
  });

  if (userInstructions) {
    formData.append('user_instructions', userInstructions);
  }

  try {
    // The endpoint path defined in your FastAPI app
    const response = await aiApiClient.post<AIGenerateQuestionsResponse>(
      '/api/ai/generate-questions-from-document',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          // If your AI backend *does* require the main app's user token for some reason
          // (even if it doesn't validate it itself but passes it on, or for logging):
          // const token = localStorage.getItem('token');
          // if (token) {
          //   headers['Authorization'] = `Bearer ${token}`;
          // }
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error generating questions via AI:', error);
    if (axios.isAxiosError(error) && error.response) {
      // Return the error structure from the backend if available
      return error.response.data as AIGenerateQuestionsResponse || {
        success: false,
        data: null,
        message: error.response.data?.detail || error.response.data?.message || 'An unexpected error occurred with the AI service.',
      };
    }
    return {
      success: false,
      data: null,
      message: 'Failed to connect to the AI service or an unexpected error occurred.',
    };
  }
};

export const generateQuestionsFromTextAI = async (
  rawText: string,
  userInstructions?: string
): Promise<AIGenerateQuestionsResponse> => {
  try {
    const payload = {
      raw_text: rawText,
      user_instructions: userInstructions,
    };

    const response = await aiApiClient.post<AIGenerateQuestionsResponse>(
      '/api/ai/generate-questions-from-text', // New endpoint
      payload
      // No need for 'multipart/form-data' here, default is 'application/json'
      // Add Authorization header if this endpoint also needs it (see previous comments)
    );
    return response.data;
  } catch (error) {
    console.error('Error generating questions from text via AI:', error);
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as AIGenerateQuestionsResponse || {
        success: false,
        data: null,
        message: error.response.data?.detail || error.response.data?.message || 'An unexpected error occurred with the AI service.',
      };
    }
    return {
      success: false,
      data: null,
      message: 'Failed to connect to the AI service or an unexpected error occurred.',
    };
  }
};



interface AIExplainChoiceResponse {
  success: boolean;
  explanation: string | null;
  message?: string;
}

interface ExplanationRequestPayload {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  originalExplanation?: string;
  userQuery: string;
  targetOptionText?: string;
}

export const explainAnswerChoiceAI = async (
  payload: ExplanationRequestPayload
): Promise<AIExplainChoiceResponse> => {
  try {
    const response = await aiApiClient.post<AIExplainChoiceResponse>(
      '/api/ai/explain-answer-choice',
      payload
    );
    return response.data;
  } catch (error) {
    console.error('Error getting explanation from AI:', error);
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as AIExplainChoiceResponse || {
        success: false,
        explanation: null,
        message: error.response.data?.detail || error.response.data?.message || 'An unexpected error with the AI explanation service.',
      };
    }
    return {
      success: false,
      explanation: null,
      message: 'Failed to connect to the AI explanation service or an unexpected error occurred.',
    };
  }
};

export default aiApiClient;