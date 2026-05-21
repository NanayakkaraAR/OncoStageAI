import { Request, Response } from 'express';
import axios from 'axios';

export const textToSpeech = async (req: Request, res: Response) => {
  try {
    const { text, language = 'en-US' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Using Google Cloud Text-to-Speech API
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
      console.error('Google Cloud API Key is not set');
      return res.status(500).json({ error: 'TTS service is not configured - missing API key' });
    }

    console.log('TTS Request:', { text: text.substring(0, 50), language });

    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        input: { text },
        voice: {
          languageCode: language,
          name: getVoiceName(language),
          ssmlGender: 'NEUTRAL',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0,
        },
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('TTS Response status:', response.status);

    if (response.data && response.data.audioContent) {
      // Return audio as base64
      res.json({
        audioContent: response.data.audioContent,
        status: 'success',
      });
    } else {
      console.error('No audio content in response:', response.data);
      res.status(500).json({ error: 'Failed to generate speech - no audio content' });
    }
  } catch (error: any) {
    console.error('TTS Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code
    });
    res.status(500).json({
      error: `TTS Error: ${error.response?.data?.error?.message || error.message || 'Unknown error'}`,
    });
  }
};

const getVoiceName = (languageCode: string): string => {
  const voiceMap: { [key: string]: string } = {
    'en-US': 'en-US-Neural2-C', // Female voice
    'en-GB': 'en-GB-Neural2-B', // Female voice
    'si': 'si-LK-Standard-A', // Sinhala
    'si-LK': 'si-LK-Standard-A', // Sinhala
    'ta': 'ta-IN-Standard-A', // Tamil
    'ta-IN': 'ta-IN-Standard-A', // Tamil
  };
  return voiceMap[languageCode] || 'en-US-Neural2-C';
};
