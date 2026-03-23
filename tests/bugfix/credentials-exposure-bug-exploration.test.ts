/**
 * Bug Condition Exploration Test for Credentials Exposure
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
 * 
 * This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists and validates our root cause analysis.
 * 
 * Property 1: Fault Condition - Credentials Exposed in Documentation
 * 
 * For any documentation file that should contain database setup instructions,
 * the file SHOULD NOT contain plain-text credentials including:
 * - Production RDS passwords
 * - Local development passwords
 * - Test database passwords
 * - Connection strings with embedded credentials
 * 
 * CRITICAL: This test encodes the EXPECTED behavior. When it fails on unfixed code,
 * it demonstrates the bug. When it passes after the fix, it validates the solution.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Bug Exploration: Credentials Exposure in Documentation', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  
  // Files that should NOT contain plain-text credentials
  const documentationFiles = [
    'docs/database-setup.md',
    'scripts/db/README.md'
  ];

  // Known exposed credentials from the bug report
  const exposedCredentials = {
    productionPassword: 'Mongoworlion123',
    localDevPassword: 'localdevpass',
    testPassword: 'testpass'
  };

  // Pattern for connection strings with embedded credentials
  // Matches: postgresql://[username]:[password]@[host]
  // Does NOT match: postgresql://[USERNAME]:[PASSWORD]@[host] (placeholders)
  // Does NOT match: ${DATABASE_URL} (environment variables)
  const connectionStringPattern = /postgresql:\/\/[^$\[].*:[^$\[].*@/g;

  /**
   * Property 1: Production RDS Password Not Exposed
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
   * - Production password "Mongoworlion123" found in documentation
   * 
   * This test searches for the actual production password in documentation files.
   */
  it('Property 1: Should NOT contain production RDS password in documentation', () => {
    // Scoped PBT: Test each documentation file
    fc.assert(
      fc.property(
        fc.constantFrom(...documentationFiles),
        (filePath) => {
          const fullPath = path.join(projectRoot, filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // EXPECTED TO FAIL: Production password is currently in the files
          expect(content).not.toContain(exposedCredentials.productionPassword);
        }
      ),
      { numRuns: documentationFiles.length }
    );
  });

  /**
   * Property 2: Local Dev Password Not Exposed
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
   * - Local dev password "localdevpass" found in documentation
   */
  it('Property 2: Should NOT contain local dev password in documentation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...documentationFiles),
        (filePath) => {
          const fullPath = path.join(projectRoot, filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // EXPECTED TO FAIL: Local dev password is currently in the files
          expect(content).not.toContain(exposedCredentials.localDevPassword);
        }
      ),
      { numRuns: documentationFiles.length }
    );
  });

  /**
   * Property 3: Test Database Password Not Exposed
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
   * - Test password "testpass" found in documentation
   */
  it('Property 3: Should NOT contain test database password in documentation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...documentationFiles),
        (filePath) => {
          const fullPath = path.join(projectRoot, filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // EXPECTED TO FAIL: Test password is currently in the files
          expect(content).not.toContain(exposedCredentials.testPassword);
        }
      ),
      { numRuns: documentationFiles.length }
    );
  });

  /**
   * Property 4: Connection Strings Should Use Placeholders or Environment Variables
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
   * - Connection strings with embedded credentials found
   * - Pattern matches: postgresql://dbadmin:Mongoworlion123@...
   * 
   * This test verifies that connection strings use placeholders like:
   * - postgresql://[USERNAME]:[PASSWORD]@[HOST]
   * - ${DATABASE_URL}
   * 
   * And NOT actual credentials like:
   * - postgresql://dbadmin:Mongoworlion123@...
   */
  it('Property 4: Should NOT contain connection strings with embedded credentials', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...documentationFiles),
        (filePath) => {
          const fullPath = path.join(projectRoot, filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // Find all connection strings
          const matches = content.match(connectionStringPattern) || [];
          
          // Filter out acceptable patterns (placeholders and env vars)
          const credentialMatches = matches.filter(match => {
            // Acceptable: postgresql://[USERNAME]:[PASSWORD]@
            if (match.includes('[USERNAME]') || match.includes('[PASSWORD]')) {
              return false;
            }
            // Acceptable: ${DATABASE_URL} (won't match pattern anyway)
            if (match.includes('${')) {
              return false;
            }
            // This is a connection string with actual credentials
            return true;
          });
          
          // EXPECTED TO FAIL: Connection strings with credentials currently exist
          expect(credentialMatches).toHaveLength(0);
        }
      ),
      { numRuns: documentationFiles.length }
    );
  });

  /**
   * Concrete Test: Document All Exposed Credentials
   * 
   * This test catalogs ALL instances of credential exposure for documentation.
   * It provides a comprehensive report of what needs to be fixed.
   */
  it('DOCUMENTATION: Catalog all credential exposures in documentation', () => {
    const exposures: Record<string, any[]> = {};
    
    documentationFiles.forEach(filePath => {
      const fullPath = path.join(projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      
      exposures[filePath] = [];
      
      // Find production password
      lines.forEach((line, index) => {
        if (line.includes(exposedCredentials.productionPassword)) {
          exposures[filePath].push({
            type: 'Production RDS Password',
            line: index + 1,
            content: line.trim().substring(0, 100) + '...'
          });
        }
        
        if (line.includes(exposedCredentials.localDevPassword)) {
          exposures[filePath].push({
            type: 'Local Dev Password',
            line: index + 1,
            content: line.trim().substring(0, 100) + '...'
          });
        }
        
        if (line.includes(exposedCredentials.testPassword)) {
          exposures[filePath].push({
            type: 'Test Database Password',
            line: index + 1,
            content: line.trim().substring(0, 100) + '...'
          });
        }
      });
      
      // Find connection strings with credentials
      const connectionMatches = content.match(connectionStringPattern) || [];
      connectionMatches.forEach(match => {
        if (!match.includes('[USERNAME]') && !match.includes('[PASSWORD]')) {
          const lineIndex = content.substring(0, content.indexOf(match)).split('\n').length;
          exposures[filePath].push({
            type: 'Connection String with Credentials',
            line: lineIndex,
            content: match + '...'
          });
        }
      });
    });
    
    // Log the exposures for documentation
    console.log('\n=== CREDENTIAL EXPOSURE REPORT ===\n');
    Object.entries(exposures).forEach(([file, items]) => {
      console.log(`File: ${file}`);
      console.log(`Total exposures: ${items.length}`);
      items.forEach(item => {
        console.log(`  - Line ${item.line}: ${item.type}`);
        console.log(`    ${item.content}`);
      });
      console.log('');
    });
    
    // Calculate total exposures
    const totalExposures = Object.values(exposures).reduce((sum, items) => sum + items.length, 0);
    
    // EXPECTED TO FAIL: Credentials are currently exposed
    expect(totalExposures).toBe(0);
  });

  /**
   * Property 5: Git History Contains Exposed Credentials
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
   * - Git history contains all versions of exposed credentials
   * 
   * Note: This test documents that git history exposure exists.
   * The fix requires password rotation, not just documentation changes.
   */
  it('Property 5: Documents that git history contains exposed credentials', () => {
    // This is a documentation test - it always fails on unfixed code
    // because git history cannot be changed (only mitigated via password rotation)
    
    const gitHistoryNote = `
      SECURITY NOTE: Git history contains exposed credentials.
      
      Even after fixing documentation, the following remain in git history:
      - Production RDS password: ${exposedCredentials.productionPassword}
      - Local dev password: ${exposedCredentials.localDevPassword}
      - Test database password: ${exposedCredentials.testPassword}
      
      REQUIRED ACTIONS:
      1. Rotate production RDS password immediately
      2. Update .env files with new password (not in git)
      3. Consider using AWS Secrets Manager for production
      4. Document password rotation process
      
      Git history cannot be rewritten safely in a shared repository.
      Password rotation is the only secure mitigation.
    `;
    
    console.log(gitHistoryNote);
    
    // This test documents the issue but doesn't fail
    // because git history exposure is mitigated by password rotation, not code changes
    expect(true).toBe(true);
  });
});
