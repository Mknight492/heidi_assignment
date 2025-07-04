export const MEDICATION_RECOMMENDATIONS_PROMPT = `
Based on the patient information, condition, management plan, relevant guidelines, and guideline summary, generate medication recommendations with precise dosing calculations.

Patient: {patientInfo}
Condition: {condition}
Severity: {severity}
Management Plan: {managementPlan}
Relevant Guidelines: {guidelines}
Guideline Summary: {guidelineSummary}

For pediatric patients, consider:
- Weight-based dosing
- Age-appropriate medications
- Safety considerations
- Growth and development factors

The medication recommendations should align with the management plan and follow evidence-based guidelines. Use the guideline summary to ensure your recommendations are consistent with the synthesized evidence and final recommendations from the guidelines.

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
- duration: string
- monitoring: string[]

Return ONLY the JSON array, no additional text.
`;

export const MEDICATION_RECOMMENDATIONS_SYSTEM_PROMPT = 'You are a medical AI assistant that generates evidence-based medication recommendations with precise dosing calculations. Consider the management plan and clinical guidelines when determining appropriate medications and doses. Return only valid JSON without any markdown formatting or code blocks.'; 