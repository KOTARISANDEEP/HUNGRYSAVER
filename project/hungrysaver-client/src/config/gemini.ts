/**
 * Gemini API Configuration
 * 
 * This file provides access to the Gemini API key from environment variables.
 * The API key should be set in the .env file as VITE_GEMINI_API_KEY
 */

export const getGeminiApiKey = (): string => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY is not set in environment variables');
    return '';
  }
  
  return apiKey;
};

export const GEMINI_API_KEY = getGeminiApiKey();

// Gemini API endpoint
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

