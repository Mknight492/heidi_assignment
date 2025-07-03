# Heidi Medical AI Specialist: Technical Take-home Assignment

### Intelligent clinical decision support

**Background**

Heidi aims to surface real-time, guideline-aligned recommendations during clinical encounters. Your task is to build a small, simple proof-of-concept that ingests a visit note (or a transcript) as an input, queries & references a local guideline, calculates a weight-based medication dose, and returns a detailed clinical decision support plan based on the local guideline & weight-based medication dose. Feel free to use any programming languages, LLM framework, and/or low-/no-code platforms.

Note: We do **not** expect this to be production-ready, scalable, cater to every edge case etc. It does not need to be perfect, we are mainly interested in seeing your technical thinking & approach to rapid-prototyping etc. Please feel free to reach out to [kieran@heidihealth.com](mailto:kieran@heidihealth.com) if you have any questions!

### **Brief**

<aside>
<img src="/icons/document_orange.svg" alt="/icons/document_orange.svg" width="40px" />

**Core concept**

Leverage clinical data and context to assist clinician’s needs in real time, by helping guide treatment decisions using up-to-date clinical guidelines & tool use.

**Key problems and opportunities**

- Clinical guidelines are dynamic and can vary across regions or hospitals.
- Clinicians face cognitive load trying to stay current and apply nuanced protocols.
- Heidi could serve as an intelligent assistant, surfacing contextually relevant recommendations within the flow of care.

**Strategic goal**

Build a decision support layer that is context-aware, evidence-aligned, and works with a basic clinical workflow.

**Example**

Pediatric croup - suggesting an appropriate approach to management as well as calculating the oral steroid dose (e.g. prednisone/dexamethasone) based on history, examination, and guideline references.

</aside>

### Deliverables

1. **Working prototype (MVP)**
    - Accepts unstructured clinical text (e.g. a note and/or transcript).
        - Here is an example note to use
            
            ```
            Patient: Jack T.
            DOB: 12/03/2022
            Age: 3 years
            Weight: 14.2 kg
            
            Presenting complaint:
            Jack presented with a 2-day history of barky cough, hoarse voice, and low-grade fever. Symptoms worsened overnight, with increased work of breathing and stridor noted at rest this morning. No history of choking, foreign body aspiration, or recent travel. No known sick contacts outside the household. 
            
            History:
            - Onset of URTI symptoms 2 days ago, including rhinorrhoea and dry cough
            - Barking cough began yesterday evening, hoarseness and intermittent inspiratory stridor overnight
            - Mild fever (up to 38.4°C) controlled with paracetamol
            - No cyanosis or apnoea reported
            - Fully vaccinated and developmentally appropriate for age
            - No history of asthma or other chronic respiratory illness
            - No previous episodes of croup
            - No drug allergies
            
            Examination:
            - Alert, mildly distressed, sitting upright with audible inspiratory stridor at rest
            - Barky cough noted during assessment
            - Mild suprasternal and intercostal recession
            - RR 32, HR 124, SpO2 97% on room air, T 37.9°C
            - Chest: clear air entry bilaterally, no wheeze or crackles
            - ENT: mild erythema of oropharynx, no tonsillar exudate
            - CVS: normal S1/S2, no murmurs
            - Neurological: alert, interactive, normal tone and reflexes
            
            Assessment:
            Jack presents with classic features of moderate croup (laryngotracheobronchitis), likely viral in origin. No signs of severe respiratory distress or impending airway obstruction. No signs suggestive of bacterial tracheitis or other differentials (e.g. foreign body, epiglottitis).
            
            Plan:
            - Administer corticosteroids
            - Plan as per local guidelines for croup
            
            ```
            
    - Queries & retrieves the relevant local guideline using basic RAG or similar.
    - Calculates a weight & evidence-based medication dose via an external calculator or self-built logic tool.
    - Returns a detailed management plan for the case grounded in the relevant clinical guidelines and using the result from the dose calculation logic.
    - **Hosting options:**
        - Provide a live URL, or
        - Include setup and run instructions that let us test locally on macOS in under 10 minutes.
2. **Architecture diagram**
    - One-page PNG/PDF (Excalidraw/Canva/Miro etc)
    - Show major components and data flow from input to output.
    - Label & briefly explan every service, API, or framework you’ve used & what it does.
    - Add a one-line rationale for each choice.
3. **Walk-through video**
    - Loom or MP4, 5-10 minutes.
    - Demonstrate the prototype on at least two test cases. (e.g. different weights,
    - Explain key design decisions, trade-offs, and known limitations.

**Timeline**

- Assignment sent Thursday Afternoon AEST.
- Submit via email to [kieran@heidihealth.com](mailto:kieran@heidihealth.com) by **5pm Monday AEST** - estimated 8-12 hours of focused work.

**Submission checklist**

- Hosted link to your MVP, GitHub repo link or zipped project folder.
- Architecture diagram file/link.
- Loom or Video link.

### Good luck, we look forward to seeing what you build!