export interface DoseCalculationRequest {
  medication: string;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  dose: number;
  doseUnit: string;
  maxDose?: number;
  maxDoseUnit?: string;
  frequency: string;
  route: string;
  patientAge: number; // in months
  patientWeight: number; // in kg
  condition?: string;
}

export interface DoseCalculationResult {
  medication: string;
  calculatedDose: number;
  unit: string;
  frequency: string;
  route: string;
  doseRange: {
    min: number;
    max: number;
  };
  warnings: string[];
  safetyChecks: string[];
  confidence: number;
  rationale: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  patientWeight: number;
  patientAge: number;
}

export class DoseCalculator {


  private static readonly WEIGHT_CONVERSION = {
    lbsToKg: 0.453592,
    kgToLbs: 2.20462
  };

  /**
   * Calculate medication dose based on patient parameters and guidelines
   */
  static calculateDose(request: DoseCalculationRequest): DoseCalculationResult {
    const warnings: string[] = [];
    const safetyChecks: string[] = [];
    
    // Convert weight to kg if needed
    const weightInKg = request.weightUnit === 'lbs' 
      ? request.weight * this.WEIGHT_CONVERSION.lbsToKg 
      : request.weight;

    // Validate patient weight
    if (weightInKg <= 0) {
      throw new Error('Patient weight must be greater than 0');
    }

    // Calculate base dose
    let calculatedDose = this.calculateBaseDose(request, weightInKg);

    // Apply maximum dose limits
    if (request.maxDose) {
      const maxDoseInSameUnit = this.convertDoseUnits(request.maxDose, request.maxDoseUnit || request.doseUnit, request.doseUnit);
      if (calculatedDose > maxDoseInSameUnit) {
        calculatedDose = maxDoseInSameUnit;
        warnings.push(`Dose capped at maximum recommended dose of ${maxDoseInSameUnit} ${request.doseUnit}`);
      }
    }

    // Perform safety checks
    this.performSafetyChecks(request, calculatedDose, weightInKg, safetyChecks, warnings);

    // Calculate dose range
    const doseRange = this.calculateDoseRange(request, weightInKg);

    // Determine confidence based on available data
    const confidence = this.calculateConfidence(request, warnings.length);

    return {
      medication: request.medication,
      calculatedDose: Math.round(calculatedDose * 100) / 100, // Round to 2 decimal places
      unit: request.doseUnit,
      frequency: request.frequency,
      route: request.route,
      doseRange,
      warnings,
      safetyChecks,
      confidence,
      rationale: this.generateRationale(request, calculatedDose, weightInKg),
      evidenceLevel: this.determineEvidenceLevel(request),
      patientWeight: weightInKg,
      patientAge: request.patientAge
    };
  }

  /**
   * Calculate base dose using weight-based dosing
   */
  private static calculateBaseDose(request: DoseCalculationRequest, weightInKg: number): number {
    // Standard weight-based dosing: dose per kg * patient weight
    return request.dose * weightInKg;
  }

  /**
   * Convert dose units for comparison
   */
  private static convertDoseUnits(dose: number, fromUnit: string, toUnit: string): number {
    const unitConversions: { [key: string]: { [key: string]: number } } = {
      'mg': {
        'mcg': 1000,
        'g': 0.001
      },
      'mcg': {
        'mg': 0.001,
        'g': 0.000001
      },
      'g': {
        'mg': 1000,
        'mcg': 1000000
      },
      'ml': {
        'l': 0.001
      },
      'l': {
        'ml': 1000
      }
    };

    if (fromUnit === toUnit) return dose;
    
    const conversion = unitConversions[fromUnit]?.[toUnit];
    if (conversion) {
      return dose * conversion;
    }

    // If no conversion found, assume same unit
    return dose;
  }

  /**
   * Perform safety checks for pediatric dosing
   */
  private static performSafetyChecks(
    request: DoseCalculationRequest, 
    calculatedDose: number, 
    weightInKg: number,
    safetyChecks: string[],
    warnings: string[]
  ): void {
    // Age-based safety checks
    if (request.patientAge < 3) {
      warnings.push('Patient is under 3 months - extreme caution required');
      safetyChecks.push('Verify dose with pediatric specialist');
    } else if (request.patientAge < 12) {
      warnings.push('Patient is under 1 year - careful monitoring required');
      safetyChecks.push('Monitor for adverse effects closely');
    }

    // Weight-based safety checks
    if (weightInKg < 5) {
      warnings.push('Patient weight is very low - dose may need adjustment');
      safetyChecks.push('Consider lower dose range');
    } else if (weightInKg > 50) {
      safetyChecks.push('Patient weight suggests adolescent/adult dosing may be appropriate');
    }

    // Medication-specific safety checks
    const highRiskMedications = ['digoxin', 'theophylline', 'lithium', 'warfarin'];
    if (highRiskMedications.some(med => request.medication.toLowerCase().includes(med))) {
      warnings.push('High-risk medication - therapeutic drug monitoring may be required');
      safetyChecks.push('Monitor drug levels if available');
    }

    // Route-specific checks
    if (request.route.toLowerCase() === 'iv' || request.route.toLowerCase() === 'intravenous') {
      safetyChecks.push('IV administration requires careful monitoring');
    }
  }

  /**
   * Calculate dose range based on ±20% of calculated dose
   */
  private static calculateDoseRange(
    request: DoseCalculationRequest, 
    weightInKg: number
  ): { min: number; max: number } {
    const baseDose = request.dose * weightInKg;
    
    // Dose range is typically ±20% of calculated dose
    const rangeMultiplier = 0.2;
    const minDose = baseDose * (1 - rangeMultiplier);
    const maxDose = baseDose * (1 + rangeMultiplier);

    // Apply maximum dose limit if specified
    let finalMaxDose = maxDose;
    if (request.maxDose) {
      const maxDoseInSameUnit = this.convertDoseUnits(request.maxDose, request.maxDoseUnit || request.doseUnit, request.doseUnit);
      finalMaxDose = Math.min(maxDose, maxDoseInSameUnit);
    }

    return {
      min: Math.round(minDose * 100) / 100,
      max: Math.round(finalMaxDose * 100) / 100
    };
  }

  /**
   * Calculate confidence score based on available data and warnings
   */
  private static calculateConfidence(request: DoseCalculationRequest, warningCount: number): number {
    let confidence = 85; // Base confidence

    // Reduce confidence based on warnings
    confidence -= warningCount * 10;

    // Reduce confidence for very young patients
    if (request.patientAge < 3) {
      confidence -= 20;
    } else if (request.patientAge < 12) {
      confidence -= 10;
    }

    // Reduce confidence if weight is very low or very high
    if (request.patientWeight < 5 || request.patientWeight > 50) {
      confidence -= 5;
    }

    // Ensure confidence is within bounds
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Generate rationale for the dose calculation
   */
  private static generateRationale(
    request: DoseCalculationRequest, 
    calculatedDose: number, 
    weightInKg: number
  ): string {
    const baseDose = request.dose * weightInKg;
    
    return `Dose calculated as ${request.dose} ${request.doseUnit}/kg × ${weightInKg}kg = ${baseDose.toFixed(2)} ${request.doseUnit}. Final dose: ${calculatedDose.toFixed(2)} ${request.doseUnit}.`;
  }

  /**
   * Determine evidence level based on available data
   */
  private static determineEvidenceLevel(request: DoseCalculationRequest): 'A' | 'B' | 'C' | 'D' {
    // This is a simplified determination - in practice, this would be based on
    // the actual evidence from guidelines and clinical studies
    if (request.condition) {
      return 'B'; // Based on condition-specific guidelines
    }
    return 'C'; // General dosing principles
  }

  /**
   * Validate dose calculation request
   */
  static validateRequest(request: DoseCalculationRequest): string[] {
    const errors: string[] = [];

    if (!request.medication) {
      errors.push('Medication name is required');
    }

    if (!request.weight || request.weight <= 0) {
      errors.push('Valid patient weight is required');
    }

    if (!request.dose || request.dose <= 0) {
      errors.push('Valid dose per kg is required');
    }

    if (!request.doseUnit) {
      errors.push('Dose unit is required');
    }

    if (!request.frequency) {
      errors.push('Dosing frequency is required');
    }

    if (!request.route) {
      errors.push('Route of administration is required');
    }

    if (!request.patientAge || request.patientAge < 0) {
      errors.push('Valid patient age is required');
    }

    if (!request.patientWeight || request.patientWeight <= 0) {
      errors.push('Valid patient weight is required');
    }

    return errors;
  }
} 