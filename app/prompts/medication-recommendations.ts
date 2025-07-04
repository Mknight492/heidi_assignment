export const MEDICATION_RECOMMENDATIONS_PROMPT = `
Based on the patient information, condition, management plan, relevant guidelines, and guideline summary, generate medication recommendations with precise dosing calculations using the dose calculator tool.

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

IMPORTANT: Use the dose calculator tool for all dose calculations. Do NOT calculate doses manually.

For each medication recommendation:
1. Extract the dosing parameters from guidelines (dose per kg, frequency, route, max dose)
2. Call the dose calculator tool with:
   - medication: string
   - weight: number (patient weight in kg)
   - weightUnit: "kg"
   - dose: number (dose per kg from guidelines - should already account for severity)
   - doseUnit: string (mg, mcg, g, ml, etc.)
   - maxDose: number (if specified in guidelines)
   - maxDoseUnit: string (if different from doseUnit)
   - frequency: string (from guidelines)
   - route: string (from guidelines)
   - patientAge: number (in months)
   - patientWeight: number (in kg)
   - condition: string

3. Use the calculated dose from the tool response

The medication recommendations should align with the management plan and follow evidence-based guidelines. Use the guideline summary to ensure your recommendations are consistent with the synthesized evidence and final recommendations from the guidelines.

Return a JSON array of medication recommendations with:
- medication: string
- dose: number (calculated dose from tool)
- unit: string
- frequency: string
- route: string
- rationale: string
- evidenceLevel: "A", "B", "C", or "D"
- confidence: number (0-100)
- safetyChecks: string[]
- calculatedDose: number (from tool)
- doseRange: { min: number, max: number } (from tool)
- warnings: string[] (from tool)
- duration: string
- monitoring: string[]

Return ONLY the JSON array, no additional text.
`;

export const MEDICATION_RECOMMENDATIONS_SYSTEM_PROMPT = 'You are a medical AI assistant that generates evidence-based medication recommendations. You MUST use the dose calculator tool for all dose calculations to ensure accuracy and safety. Do not perform manual dose calculations. Consider the management plan and clinical guidelines when determining appropriate medications and doses. Return only valid JSON without any markdown formatting or code blocks.'; 