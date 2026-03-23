/**
 * Database connection utility with IAM authentication support
 * 
 * Supports both local development (password) and RDS production (IAM tokens)
 */

import { Signer } from '@aws-sdk/rds-signer';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string; // Only for local development
}

/**
 * Get database configuration based on environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const isLocal = process.env.NODE_ENV === 'development' || 
                  process.env.DATABASE_URL?.includes('localhost');

  if (isLocal) {
    // Local Docker: Use simple password from .env
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5434'),
      database: process.env.DB_NAME || 'jobanalyzer',
      username: process.env.DB_USER || 'dbadmin',
      password: process.env.DB_PASSWORD || 'localdevpass'
    };
  }

  // RDS Production: Use IAM authentication (no password)
  return {
    host: process.env.RDS_HOST!,
    port: parseInt(process.env.RDS_PORT || '5432'),
    database: process.env.RDS_DATABASE || 'jobanalyzer',
    username: process.env.RDS_USERNAME || 'dbadmin'
    // No password - will use IAM token
  };
}

/**
 * Generate IAM authentication token for RDS
 * Token is valid for 15 minutes
 */
export async function generateRDSAuthToken(config: DatabaseConfig): Promise<string> {
  const signer = new Signer({
    hostname: config.host,
    port: config.port,
    username: config.username,
    region: process.env.AWS_REGION || 'us-east-1'
  });

  // Generate token (valid for 15 minutes)
  const token = await signer.getAuthToken();
  return token;
}

/**
 * Get database connection URL with appropriate authentication
 */
export async function getDatabaseUrl(): Promise<string> {
  const config = getDatabaseConfig();

  // Local development: Use password from .env
  if (config.password) {
    return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }

  // RDS Production: Generate IAM token
  const token = await generateRDSAuthToken(config);
  return `postgresql://${config.username}:${token}@${config.host}:${config.port}/${config.database}?sslmode=require`;
}

/**
 * Example usage with Prisma
 */
export async function getPrismaClient() {
  const { PrismaClient } = await import('@prisma/client');
  
  const databaseUrl = await getDatabaseUrl();
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });
}
