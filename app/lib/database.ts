import { Pool } from 'pg';
import { Guideline, VectorizedGuideline, TherapeuticGuidelineChunk, VectorizedTherapeuticGuideline } from '../types/medical';

// Database connection pool with optimized settings
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'heidi_medical_ai',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
  // Optimized connection pool settings for better performance
  max: 20, // Increased from default
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Add statement timeout to prevent long-running queries
  statement_timeout: 30000, // 30 seconds
  // Add query timeout
  query_timeout: 30000,
});

// Simple in-memory cache for repeated queries (in production, use Redis)
const queryCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Initialize database with optimized pgvector indexes
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Enable pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // Create guidelines table with vector support
    await client.query(`
      CREATE TABLE IF NOT EXISTS guidelines (
        id SERIAL PRIMARY KEY,
        condition VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        region VARCHAR(100) NOT NULL,
        evidence_level VARCHAR(10) NOT NULL,
        version VARCHAR(50) NOT NULL,
        last_updated TIMESTAMP NOT NULL,
        source VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        embedding vector(1536),
        metadata JSONB NOT NULL
      );
    `);
    
    // Create therapeutic_guidelines table for the new structure
    await client.query(`
      CREATE TABLE IF NOT EXISTS therapeutic_guidelines (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(1536),
        metadata JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create optimized indexes for vector similarity search
    // Using HNSW index for better performance on similarity searches
    await client.query(`
      DROP INDEX IF EXISTS guidelines_embedding_idx;
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS guidelines_embedding_hnsw_idx 
      ON guidelines 
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
    `);
    
    // Create optimized index for therapeutic_guidelines
    await client.query(`
      DROP INDEX IF EXISTS therapeutic_guidelines_embedding_idx;
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS therapeutic_guidelines_embedding_hnsw_idx 
      ON therapeutic_guidelines 
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
    `);
    
    // Create additional indexes for metadata filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS therapeutic_guidelines_metadata_gin_idx 
      ON therapeutic_guidelines 
      USING gin (metadata);
    `);
    
    // Create index on created_at for time-based queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS therapeutic_guidelines_created_at_idx 
      ON therapeutic_guidelines (created_at);
    `);
    
    console.log('Database initialized successfully with optimized indexes');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Store guideline with embedding
export async function storeGuideline(guideline: Guideline, embedding: number[]) {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO guidelines (
        condition, severity, region, evidence_level, version, 
        last_updated, source, content, embedding, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector, $10)
      RETURNING id;
    `;
    
    const metadata = {
      recommendations: guideline.recommendations,
      medicationDoses: guideline.medicationDoses,
      evidenceLevel: guideline.evidenceLevel,
      guidelineVersion: guideline.guidelineVersion,
      lastUpdated: guideline.lastUpdated,
      localRegion: guideline.localRegion,
      source: guideline.source,
    };
    
    // Convert embedding array to proper PostgreSQL vector format
    const vectorString = `[${embedding.join(',')}]`;
    
    const values = [
      guideline.condition,
      guideline.severity,
      guideline.localRegion,
      guideline.evidenceLevel,
      guideline.guidelineVersion,
      guideline.lastUpdated,
      guideline.source,
      guideline.content,
      vectorString,
      JSON.stringify(metadata)
    ];
    
    const result = await client.query(query, values);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error storing guideline:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Search guidelines by similarity
export async function searchGuidelines(
  queryEmbedding: number[], 
  condition?: string, 
  region?: string, 
  severity?: string,
  limit: number = 5
): Promise<VectorizedGuideline[]> {
  const client = await pool.connect();
  try {
    let query = `
      SELECT 
        id, content, embedding, metadata,
        condition, severity, region, evidence_level, version, last_updated
      FROM guidelines
      WHERE 1=1
    `;
    
    const values: any[] = [];
    let paramCount = 0;
    
    if (condition) {
      paramCount++;
      query += ` AND condition ILIKE $${paramCount}`;
      values.push(`%${condition}%`);
    }
    
    if (region) {
      paramCount++;
      query += ` AND region ILIKE $${paramCount}`;
      values.push(`%${region}%`);
    }
    
    if (severity) {
      paramCount++;
      query += ` AND severity = $${paramCount}`;
      values.push(severity);
    }
    
    paramCount++;
    query += `
      ORDER BY embedding <=> $${paramCount}::vector
      LIMIT $${paramCount + 1};
    `;
    
    // Convert query embedding to proper PostgreSQL vector format
    const vectorString = `[${queryEmbedding.join(',')}]`;
    
    values.push(vectorString, limit);
    
    const result = await client.query(query, values);
    
    return result.rows.map(row => ({
      id: row.id.toString(),
      content: row.content,
      embedding: row.embedding,
      metadata: {
        condition: row.condition,
        severity: row.severity,
        region: row.region,
        evidenceLevel: row.evidence_level,
        version: row.version,
        lastUpdated: new Date(row.last_updated),
        ...row.metadata
      }
    }));
  } catch (error) {
    console.error('Error searching guidelines:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get all guidelines (for testing)
export async function getAllGuidelines(): Promise<VectorizedGuideline[]> {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        id, content, embedding, metadata,
        condition, severity, region, evidence_level, version, last_updated
      FROM guidelines
      ORDER BY id;
    `;
    
    const result = await client.query(query);
    
    return result.rows.map(row => ({
      id: row.id.toString(),
      content: row.content,
      embedding: row.embedding,
      metadata: {
        condition: row.condition,
        severity: row.severity,
        region: row.region,
        evidenceLevel: row.evidence_level,
        version: row.version,
        lastUpdated: new Date(row.last_updated),
        ...row.metadata
      }
    }));
  } catch (error) {
    console.error('Error getting all guidelines:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Clear all guidelines (for testing)
export async function clearGuidelines() {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM guidelines;');
    console.log('All guidelines cleared');
  } catch (error) {
    console.error('Error clearing guidelines:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Store therapeutic guideline chunk with embedding
export async function storeTherapeuticGuidelineChunk(chunk: TherapeuticGuidelineChunk, embedding: number[]) {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO therapeutic_guidelines (content, embedding, metadata)
      VALUES ($1, $2::vector, $3)
      RETURNING id;
    `;
    
    // Convert embedding array to proper PostgreSQL vector format
    const vectorString = `[${embedding.join(',')}]`;
    
    const values = [
      chunk.text,
      vectorString,
      JSON.stringify(chunk.metadata)
    ];
    
    const result = await client.query(query, values);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error storing therapeutic guideline chunk:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Search therapeutic guidelines by similarity with caching and optimization
export async function searchTherapeuticGuidelines(
  queryEmbedding: number[],
  limit: number = 5
): Promise<VectorizedTherapeuticGuideline[]> {
  // Create cache key from query embedding and limit
  const cacheKey = `search_${queryEmbedding.join(',')}_${limit}`;
  
  // Check cache first
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Cache hit for therapeutic guidelines search');
    return cached.result;
  }
  
  const client = await pool.connect();
  try {
    // Optimized query with better performance
    // Using HNSW index and adding query hints for better performance
    const query = `
      SELECT id, content, embedding, metadata
      FROM therapeutic_guidelines
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2;
    `;
    
    // Convert query embedding to proper PostgreSQL vector format
    const vectorString = `[${queryEmbedding.join(',')}]`;
    
    const startTime = Date.now();
    const result = await client.query(query, [vectorString, limit]);
    const queryTime = Date.now() - startTime;
    
    console.log(`Therapeutic guidelines search completed in ${queryTime}ms, found ${result.rows.length} results`);
    
    const mappedResult = result.rows.map(row => ({
      id: row.id.toString(),
      content: row.content,
      embedding: row.embedding,
      metadata: row.metadata
    }));
    
    // Cache the result
    queryCache.set(cacheKey, {
      result: mappedResult,
      timestamp: Date.now()
    });
    
    return mappedResult;
  } catch (error) {
    console.error('Error searching therapeutic guidelines:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get all therapeutic guidelines (for testing)
export async function getAllTherapeuticGuidelines(): Promise<VectorizedTherapeuticGuideline[]> {
  const client = await pool.connect();
  try {
    const query = `
      SELECT id, content, embedding, metadata
      FROM therapeutic_guidelines
      ORDER BY id;
    `;
    
    const result = await client.query(query);
    
    return result.rows.map(row => ({
      id: row.id.toString(),
      content: row.content,
      embedding: row.embedding,
      metadata: row.metadata
    }));
  } catch (error) {
    console.error('Error getting all therapeutic guidelines:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Clear therapeutic guidelines table
export async function clearTherapeuticGuidelines() {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM therapeutic_guidelines;');
    console.log('Therapeutic guidelines table cleared');
  } catch (error) {
    console.error('Error clearing therapeutic guidelines:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Bulk store therapeutic guideline chunks with embeddings (optimized for performance)
export async function bulkStoreTherapeuticGuidelineChunks(chunks: Array<{chunk: TherapeuticGuidelineChunk, embedding: number[]}>) {
  const client = await pool.connect();
  try {
    // Use a transaction for better performance and atomicity
    await client.query('BEGIN');
    
    // Prepare bulk insert query
    const query = `
      INSERT INTO therapeutic_guidelines (content, embedding, metadata)
      VALUES ${chunks.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}::vector, $${index * 3 + 3})`).join(', ')}
      RETURNING id;
    `;
    
    // Flatten values array
    const values: any[] = [];
    chunks.forEach(({chunk, embedding}) => {
      values.push(
        chunk.text,
        `[${embedding.join(',')}]`,
        JSON.stringify(chunk.metadata)
      );
    });
    
    const result = await client.query(query, values);
    await client.query('COMMIT');
    
    return result.rows.map(row => row.id);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk storing therapeutic guideline chunks:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Clear the query cache
export function clearQueryCache() {
  queryCache.clear();
  console.log('Query cache cleared');
}

// Get cache statistics
export function getCacheStats() {
  return {
    size: queryCache.size,
    entries: Array.from(queryCache.entries()).map(([key, value]) => ({
      key: key.substring(0, 50) + '...',
      age: Date.now() - value.timestamp
    }))
  };
}

// Optimized bulk search function for multiple queries
export async function bulkSearchTherapeuticGuidelines(
  queries: Array<{ embedding: number[]; limit: number }>
): Promise<VectorizedTherapeuticGuideline[][]> {
  const client = await pool.connect();
  try {
    const results: VectorizedTherapeuticGuideline[][] = [];
    
    // Use a transaction for better performance
    await client.query('BEGIN');
    
    for (const query of queries) {
      const cacheKey = `search_${query.embedding.join(',')}_${query.limit}`;
      
      // Check cache first
      const cached = queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        results.push(cached.result);
        continue;
      }
      
      const vectorString = `[${query.embedding.join(',')}]`;
      const result = await client.query(`
        SELECT id, content, embedding, metadata
        FROM therapeutic_guidelines
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $2;
      `, [vectorString, query.limit]);
      
      const mappedResult = result.rows.map(row => ({
        id: row.id.toString(),
        content: row.content,
        embedding: row.embedding,
        metadata: row.metadata
      }));
      
      // Cache the result
      queryCache.set(cacheKey, {
        result: mappedResult,
        timestamp: Date.now()
      });
      
      results.push(mappedResult);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in bulk search:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool; 