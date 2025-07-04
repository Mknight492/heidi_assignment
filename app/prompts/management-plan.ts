export const MANAGEMENT_PLAN_PROMPT = `
Generate a comprehensive management plan for this patient.

Patient: {patientInfo}
Condition: {condition}
Severity: {severity}
Medications: {medications}

Create a detailed management plan that includes:
1. Immediate management steps
2. Monitoring requirements
3. Follow-up recommendations
4. Patient education points
5. When to seek further medical attention

Return a comprehensive, well-structured management plan as plain text.
`;

export const MANAGEMENT_PLAN_SYSTEM_PROMPT = 'You are a medical AI assistant that creates comprehensive management plans. Provide clear, actionable recommendations.'; 