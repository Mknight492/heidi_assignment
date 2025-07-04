export const MANAGEMENT_PLAN_PROMPT = `
Generate a comprehensive management plan for this patient based on the clinical assessment and relevant guidelines.

Patient: {patientInfo}
Condition: {condition}
Severity: {severity}
Relevant Guidelines: {guidelines}
Guideline Summary: {guidelineSummary}

Create a detailed management plan that includes:
1. Immediate management steps
2. Monitoring requirements
3. Follow-up recommendations
4. Patient education points
5. When to seek further medical attention
6. Treatment approach based on guidelines
7. Expected outcomes and timeline

The management plan should be evidence-based and incorporate relevant clinical guidelines where available. Use the guideline summary to inform your recommendations and ensure alignment with evidence-based practices.

Return a comprehensive, well-structured management plan as plain text.
`;

export const MANAGEMENT_PLAN_SYSTEM_PROMPT = 'You are a medical AI assistant that creates comprehensive management plans based on clinical guidelines and best practices. Provide clear, actionable recommendations that follow evidence-based medicine principles.'; 