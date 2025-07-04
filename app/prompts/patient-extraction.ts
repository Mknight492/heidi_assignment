export const PATIENT_EXTRACTION_PROMPT = `
You are a medical AI assistant. Extract patient information from the following clinical transcript and return it as a JSON object.

Required fields:
- name: string (if mentioned, otherwise "Unknown")
- age: number (in years)
- weight: number (in kg)
- height: number (in cm, if mentioned)
- sex: "M" or "F" (if mentioned)
- presentingComplaint: string (main complaint)
- history: string (relevant history)
- examination: string (examination findings)
- assessment: string (clinical assessment)

Transcript: {transcript}

Return ONLY the JSON object, no additional text.
`;

export const PATIENT_EXTRACTION_SYSTEM_PROMPT = 'You are a medical AI assistant that extracts structured patient data from clinical transcripts. Return only valid JSON without any markdown formatting or code blocks.'; 