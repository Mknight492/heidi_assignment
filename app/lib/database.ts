import { Pool } from 'pg';
import { Guideline, VectorizedGuideline } from '../types/medical';

// Database connection pool
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'heidi_medical_ai',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database with pgvector extension
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
    
    // Create index for vector similarity search
    await client.query(`
      CREATE INDEX IF NOT EXISTS guidelines_embedding_idx 
      ON guidelines 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    
    console.log('Database initialized successfully');
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
    
    const values = [
      guideline.condition,
      guideline.severity,
      guideline.localRegion,
      guideline.evidenceLevel,
      guideline.guidelineVersion,
      guideline.lastUpdated,
      guideline.source,
      guideline.content,
      embedding,
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
      ORDER BY embedding <=> $${paramCount}
      LIMIT $${paramCount + 1};
    `;
    
    values.push(queryEmbedding, limit);
    
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

export default pool; 