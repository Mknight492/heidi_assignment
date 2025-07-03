import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getAllGuidelines, clearGuidelines } from '../../lib/database';

export async function GET(request: NextRequest) {
  try {
    // Test database connection and initialization
    await initializeDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'init':
        await initializeDatabase();
        return NextResponse.json({
          success: true,
          message: 'Database initialized successfully',
          timestamp: new Date().toISOString()
        });
        
      case 'clear':
        await clearGuidelines();
        return NextResponse.json({
          success: true,
          message: 'All guidelines cleared',
          timestamp: new Date().toISOString()
        });
        
      case 'list':
        const guidelines = await getAllGuidelines();
        return NextResponse.json({
          success: true,
          guidelines,
          count: guidelines.length,
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: init, clear, or list',
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Database action error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 