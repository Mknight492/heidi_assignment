import { Pool } from 'pg';
import { Guideline, VectorizedGuideline, TherapeuticGuidelineChunk, VectorizedTherapeuticGuideline } from '../types/medical';

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
    
    // Create index for vector similarity search on guidelines
    await client.query(`
      CREATE INDEX IF NOT EXISTS guidelines_embedding_idx 
      ON guidelines 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    
    // Create index for vector similarity search on therapeutic_guidelines
    await client.query(`
      CREATE INDEX IF NOT EXISTS therapeutic_guidelines_embedding_idx 
      ON therapeutic_guidelines 
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

// Search therapeutic guidelines by similarity
export async function searchTherapeuticGuidelines(
  queryEmbedding: number[],
  limit: number = 5
): Promise<VectorizedTherapeuticGuideline[]> {
  const client = await pool.connect();
  try {
    const query = `
      SELECT id, content, embedding, metadata
      FROM therapeutic_guidelines
      ORDER BY embedding <=> $1::vector
      LIMIT $2;
    `;
    
    // Convert query embedding to proper PostgreSQL vector format
    const vectorString = `[${queryEmbedding.join(',')}]`;
    
    const result = await client.query(query, [vectorString, limit]);
    
    return result.rows.map(row => ({
      id: row.id.toString(),
      content: row.content,
      embedding: row.embedding,
      metadata: row.metadata
    }));
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

export default pool; 