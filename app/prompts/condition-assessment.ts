export const CONDITION_ASSESSMENT_PROMPT = `
Based on the patient information and transcript, determine the primary condition and severity.

Patient Info: {patientInfo}
Transcript: {transcript}

Return a JSON object with:
- condition: string (primary diagnosis)
- severity: "mild", "moderate", or "severe"
- confidence: number (0-100)

Return ONLY the JSON object, no additional text.
`;

export const CONDITION_ASSESSMENT_SYSTEM_PROMPT = 'You are a medical AI assistant that determines conditions and severity from clinical data. Return only valid JSON without any markdown formatting or code blocks.'; 