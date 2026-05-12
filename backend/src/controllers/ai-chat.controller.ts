import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const getAIResponse = async (req: Request, res: Response) => {
  console.log('--- AI Chat Request Received ---');
  try {
    const { message, chatHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing in .env');
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Ensure history is correctly formatted for Gemini SDK
    // It must start with 'user' and alternate between 'user' and 'model'
    const formattedHistory = (chatHistory || []).map((h: any) => ({
      role: h.role,
      parts: h.parts
    }));

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const prompt = `You are a medical assistant specializing in lung cancer and general oncology. 
    Provide accurate information regarding lung cancer and other types of cancers. 
    Always provide reputable sources for your information (e.g., WHO, Mayo Clinic, Cancer.org).
    If a question is not related to cancer or medical information, politely redirect the user.
    Keep your tone professional, empathetic, and informative.
    
    User message: ${message}`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error: any) {
    console.error('AI Chat Error Details:', error);
    res.status(500).json({ 
      error: `Gemini Error: ${error.message || 'Unknown error'}`,
      details: error.stack
    });
  }
};
