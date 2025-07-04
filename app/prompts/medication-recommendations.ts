export const MEDICATION_RECOMMENDATIONS_PROMPT = `
Based on the patient information and condition, generate medication recommendations with dosing calculations.

Patient: {patientInfo}
Condition: {condition}
Severity: {severity}

For pediatric patients, consider:
- Weight-based dosing
- Age-appropriate medications
- Safety considerations

Return a JSON array of medication recommendations with:
- medication: string
- dose: number
- unit: string
- frequency: string
- route: string
- rationale: string
- evidenceLevel: "A", "B", "C", or "D"
- confidence: number (0-100)
- safetyChecks: string[]
- calculatedDose: number (weight-based calculation)
- doseRange: { min: number, max: number }
- warnings: string[]

Return ONLY the JSON array, no additional text.
`;

export const MEDICATION_RECOMMENDATIONS_SYSTEM_PROMPT = 'You are a medical AI assistant that generates evidence-based medication recommendations. Return only valid JSON without any markdown formatting or code blocks.'; 