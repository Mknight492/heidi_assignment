import { NextRequest, NextResponse } from 'next/server';
import { DoseCalculator, DoseCalculationRequest } from '../../lib/dose-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const validationErrors = DoseCalculator.validateRequest(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validationErrors 
        },
        { status: 400 }
      );
    }

    // Calculate the dose
    const result = DoseCalculator.calculateDose(body);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dose Calculator API Error:', error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to calculate dose',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Dose Calculator API is running. Send a POST request with medication dosing parameters to calculate precise doses.',
    status: 'ready',
    requiredFields: [
      'medication',
      'weight',
      'weightUnit',
      'dose',
      'doseUnit',
      'frequency',
      'route',
      'patientAge',
      'patientWeight'
    ],
    optionalFields: [
      'maxDose',
      'maxDoseUnit',
      'condition'
    ]
  });
} 