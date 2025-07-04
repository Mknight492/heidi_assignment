import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, clearQueryCache, getCacheStats } from '../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'reinitialize':
        console.log('Reinitializing database with optimized indexes...');
        await initializeDatabase();
        return NextResponse.json({
          success: true,
          message: 'Database reinitialized with optimized HNSW indexes',
          timestamp: new Date().toISOString()
        });
        
      case 'clear-cache':
        clearQueryCache();
        return NextResponse.json({
          success: true,
          message: 'Query cache cleared',
          timestamp: new Date().toISOString()
        });
        
      case 'cache-stats':
        const stats = getCacheStats();
        return NextResponse.json({
          success: true,
          cacheStats: stats,
          timestamp: new Date().toISOString()
        });
        
      case 'optimize':
        // Perform full optimization
        console.log('Performing full database optimization...');
        await initializeDatabase();
        clearQueryCache();
        
        return NextResponse.json({
          success: true,
          message: 'Database fully optimized with new indexes and cleared cache',
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: reinitialize, clear-cache, cache-stats, or optimize',
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Database optimization error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 