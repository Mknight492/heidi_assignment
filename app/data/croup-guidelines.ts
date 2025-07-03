import { Guideline } from '../types/medical';

// Sample croup guidelines from different regions
export const croupGuidelines: Guideline[] = [
  {
    condition: 'croup',
    severity: 'mild',
    recommendations: [
      'Provide reassurance and education to parents',
      'Encourage oral fluids',
      'Monitor for worsening symptoms',
      'Consider humidified air (though evidence is limited)',
      'Return if symptoms worsen or persist beyond 3-4 days'
    ],
    medicationDoses: [
      {
        medication: 'dexamethasone',
        dose: 0.15,
        unit: 'mg/kg',
        frequency: 'single dose',
        route: 'oral',
        rationale: 'Reduces airway inflammation and symptoms',
        evidenceLevel: 'A',
        confidence: 0.95,
        safetyChecks: [
          'Check for steroid allergies',
          'Ensure no active infection',
          'Monitor for side effects'
        ],
        minAge: 6, // months
        maxAge: 144, // 12 years
        minWeight: 5, // kg
        maxWeight: 50 // kg
      }
    ],
    evidenceLevel: 'A',
    guidelineVersion: '2023.1',
    lastUpdated: new Date('2023-06-15'),
    localRegion: 'Australia',
    source: 'RCH Melbourne Clinical Practice Guidelines',
    content: `Mild Croup Management Guidelines (Australia)

Mild croup is characterized by:
- Barking cough
- Mild stridor (only with agitation)
- No respiratory distress at rest
- Normal color and mental status

Management:
1. Provide reassurance and education to parents
2. Encourage oral fluids to maintain hydration
3. Monitor for worsening symptoms
4. Consider humidified air (though evidence is limited)
5. Return if symptoms worsen or persist beyond 3-4 days

Medication:
- Dexamethasone 0.15 mg/kg oral (single dose)
- Evidence Level A - Strong recommendation based on multiple RCTs
- Reduces symptoms and need for return visits
- Safe for children 6 months and older

Safety considerations:
- Check for steroid allergies
- Ensure no active infection
- Monitor for side effects (rare in single dose)

Follow-up:
- Return if symptoms worsen
- Return if symptoms persist beyond 3-4 days
- Return if new symptoms develop`
  },
  {
    condition: 'croup',
    severity: 'moderate',
    recommendations: [
      'Administer corticosteroids (dexamethasone or prednisone)',
      'Consider nebulized epinephrine for severe symptoms',
      'Monitor closely for signs of respiratory distress',
      'Provide humidified air if available',
      'Consider hospital admission if symptoms persist or worsen'
    ],
    medicationDoses: [
      {
        medication: 'dexamethasone',
        dose: 0.6,
        unit: 'mg/kg',
        frequency: 'single dose',
        route: 'oral',
        rationale: 'Higher dose for moderate symptoms, reduces airway inflammation',
        evidenceLevel: 'A',
        confidence: 0.90,
        safetyChecks: [
          'Check for steroid allergies',
          'Ensure no active infection',
          'Monitor for side effects',
          'Assess for signs of severe respiratory distress'
        ],
        minAge: 6,
        maxAge: 144,
        minWeight: 5,
        maxWeight: 50
      },
      {
        medication: 'prednisone',
        dose: 1,
        unit: 'mg/kg',
        frequency: 'once daily for 3 days',
        route: 'oral',
        rationale: 'Alternative to dexamethasone, longer course for moderate symptoms',
        evidenceLevel: 'B',
        confidence: 0.85,
        safetyChecks: [
          'Check for steroid allergies',
          'Ensure no active infection',
          'Monitor for side effects',
          'Assess for signs of severe respiratory distress'
        ],
        minAge: 6,
        maxAge: 144,
        minWeight: 5,
        maxWeight: 50
      }
    ],
    evidenceLevel: 'A',
    guidelineVersion: '2023.1',
    lastUpdated: new Date('2023-06-15'),
    localRegion: 'Australia',
    source: 'RCH Melbourne Clinical Practice Guidelines',
    content: `Moderate Croup Management Guidelines (Australia)

Moderate croup is characterized by:
- Barking cough
- Stridor at rest
- Mild to moderate respiratory distress
- Suprasternal and/or intercostal recession
- Normal color and mental status

Management:
1. Administer corticosteroids (dexamethasone or prednisone)
2. Consider nebulized epinephrine for severe symptoms
3. Monitor closely for signs of respiratory distress
4. Provide humidified air if available
5. Consider hospital admission if symptoms persist or worsen

Medication Options:
Option 1: Dexamethasone 0.6 mg/kg oral (single dose)
- Evidence Level A - Strong recommendation
- Higher dose than mild croup
- Reduces symptoms and need for return visits

Option 2: Prednisone 1 mg/kg oral once daily for 3 days
- Evidence Level B - Good evidence
- Alternative to dexamethasone
- Longer course for moderate symptoms

Safety considerations:
- Check for steroid allergies
- Ensure no active infection
- Monitor for side effects
- Assess for signs of severe respiratory distress

Follow-up:
- Monitor closely for 2-4 hours
- Return if symptoms worsen
- Consider hospital admission if symptoms persist`
  },
  {
    condition: 'croup',
    severity: 'severe',
    recommendations: [
      'Immediate medical attention required',
      'Administer high-dose corticosteroids',
      'Nebulized epinephrine for immediate relief',
      'Consider intubation if severe respiratory distress',
      'Hospital admission and monitoring required'
    ],
    medicationDoses: [
      {
        medication: 'dexamethasone',
        dose: 0.6,
        unit: 'mg/kg',
        frequency: 'single dose',
        route: 'oral or IV',
        rationale: 'High-dose steroids for severe inflammation',
        evidenceLevel: 'A',
        confidence: 0.95,
        safetyChecks: [
          'Check for steroid allergies',
          'Ensure no active infection',
          'Monitor for side effects',
          'Assess airway patency',
          'Prepare for potential intubation'
        ],
        minAge: 6,
        maxAge: 144,
        minWeight: 5,
        maxWeight: 50
      },
      {
        medication: 'epinephrine',
        dose: 0.5,
        unit: 'ml/kg',
        frequency: 'every 20 minutes as needed',
        route: 'nebulized',
        rationale: 'Immediate relief of airway obstruction',
        evidenceLevel: 'A',
        confidence: 0.90,
        safetyChecks: [
          'Monitor heart rate and blood pressure',
          'Assess for rebound symptoms',
          'Prepare for potential intubation',
          'Monitor for arrhythmias'
        ],
        minAge: 6,
        maxAge: 144,
        minWeight: 5,
        maxWeight: 50
      }
    ],
    evidenceLevel: 'A',
    guidelineVersion: '2023.1',
    lastUpdated: new Date('2023-06-15'),
    localRegion: 'Australia',
    source: 'RCH Melbourne Clinical Practice Guidelines',
    content: `Severe Croup Management Guidelines (Australia)

Severe croup is characterized by:
- Barking cough
- Stridor at rest
- Severe respiratory distress
- Marked suprasternal and intercostal recession
- Agitation or lethargy
- Cyanosis or decreased oxygen saturation

EMERGENCY MANAGEMENT:
1. Immediate medical attention required
2. Administer high-dose corticosteroids
3. Nebulized epinephrine for immediate relief
4. Consider intubation if severe respiratory distress
5. Hospital admission and monitoring required

Medication:
1. Dexamethasone 0.6 mg/kg oral or IV (single dose)
   - Evidence Level A - Strong recommendation
   - High-dose steroids for severe inflammation
   - Reduces need for intubation

2. Nebulized Epinephrine 0.5 ml/kg (1:1000)
   - Evidence Level A - Strong recommendation
   - Immediate relief of airway obstruction
   - Can be repeated every 20 minutes as needed
   - Monitor for rebound symptoms

Safety considerations:
- Check for steroid allergies
- Ensure no active infection
- Monitor for side effects
- Assess airway patency
- Prepare for potential intubation
- Monitor heart rate and blood pressure
- Assess for rebound symptoms
- Monitor for arrhythmias

Hospital admission required for:
- Severe respiratory distress
- Need for repeated epinephrine
- Poor response to initial treatment
- Concerns about airway patency`
  },
  {
    condition: 'croup',
    severity: 'mild',
    recommendations: [
      'Provide reassurance and education to parents',
      'Encourage oral fluids',
      'Monitor for worsening symptoms',
      'Return if symptoms worsen or persist beyond 3-4 days'
    ],
    medicationDoses: [
      {
        medication: 'dexamethasone',
        dose: 0.15,
        unit: 'mg/kg',
        frequency: 'single dose',
        route: 'oral',
        rationale: 'Reduces airway inflammation and symptoms',
        evidenceLevel: 'A',
        confidence: 0.95,
        safetyChecks: [
          'Check for steroid allergies',
          'Ensure no active infection',
          'Monitor for side effects'
        ],
        minAge: 6,
        maxAge: 144,
        minWeight: 5,
        maxWeight: 50
      }
    ],
    evidenceLevel: 'A',
    guidelineVersion: '2022.2',
    lastUpdated: new Date('2022-12-01'),
    localRegion: 'United Kingdom',
    source: 'NICE Clinical Guidelines',
    content: `Mild Croup Management Guidelines (UK)

Mild croup is characterized by:
- Barking cough
- Mild stridor (only with agitation)
- No respiratory distress at rest
- Normal color and mental status

Management:
1. Provide reassurance and education to parents
2. Encourage oral fluids to maintain hydration
3. Monitor for worsening symptoms
4. Return if symptoms worsen or persist beyond 3-4 days

Medication:
- Dexamethasone 0.15 mg/kg oral (single dose)
- Evidence Level A - Strong recommendation based on multiple RCTs
- Reduces symptoms and need for return visits
- Safe for children 6 months and older

Safety considerations:
- Check for steroid allergies
- Ensure no active infection
- Monitor for side effects (rare in single dose)

Follow-up:
- Return if symptoms worsen
- Return if symptoms persist beyond 3-4 days
- Return if new symptoms develop

Note: UK guidelines emphasize conservative management for mild cases.`
  },
  {
    condition: 'croup',
    severity: 'moderate',
    recommendations: [
      'Administer corticosteroids (dexamethasone preferred)',
      'Monitor closely for signs of respiratory distress',
      'Consider hospital admission if symptoms persist',
      'Provide humidified air if available'
    ],
    medicationDoses: [
      {
        medication: 'dexamethasone',
        dose: 0.6,
        unit: 'mg/kg',
        frequency: 'single dose',
        route: 'oral',
        rationale: 'Higher dose for moderate symptoms, reduces airway inflammation',
        evidenceLevel: 'A',
        confidence: 0.90,
        safetyChecks: [
          'Check for steroid allergies',
          'Ensure no active infection',
          'Monitor for side effects',
          'Assess for signs of severe respiratory distress'
        ],
        minAge: 6,
        maxAge: 144,
        minWeight: 5,
        maxWeight: 50
      }
    ],
    evidenceLevel: 'A',
    guidelineVersion: '2022.2',
    lastUpdated: new Date('2022-12-01'),
    localRegion: 'United Kingdom',
    source: 'NICE Clinical Guidelines',
    content: `Moderate Croup Management Guidelines (UK)

Moderate croup is characterized by:
- Barking cough
- Stridor at rest
- Mild to moderate respiratory distress
- Suprasternal and/or intercostal recession
- Normal color and mental status

Management:
1. Administer corticosteroids (dexamethasone preferred)
2. Monitor closely for signs of respiratory distress
3. Consider hospital admission if symptoms persist
4. Provide humidified air if available

Medication:
- Dexamethasone 0.6 mg/kg oral (single dose)
- Evidence Level A - Strong recommendation
- Higher dose than mild croup
- Reduces symptoms and need for return visits
- Preferred over prednisone due to longer half-life

Safety considerations:
- Check for steroid allergies
- Ensure no active infection
- Monitor for side effects
- Assess for signs of severe respiratory distress

Follow-up:
- Monitor closely for 2-4 hours
- Return if symptoms worsen
- Consider hospital admission if symptoms persist

Note: UK guidelines prefer dexamethasone over prednisone for moderate croup.`
  }
]; 