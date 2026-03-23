# RDS Password Rotation Guide

This guide documents the process for rotating compromised or expired RDS database passwords.

## ⚠️ When to Rotate Passwords

Rotate your RDS password immediately if:

- Credentials were accidentally committed to git
- Credentials were exposed in documentation or logs
- A team member with access leaves the project
- Suspicious database activity is detected
- As part of regular security maintenance (every 90 days recommended)

## Prerequisites

- AWS CLI configured with appropriate permissions
- Access to AWS RDS console (or CloudFormation permissions)
- Local `.env` files that need updating

## Method 1: AWS Console Password Rotation (Quickest)

### Step 1: Rotate Password in AWS Console

1. **Navigate to RDS:**
   - Open AWS Console
   - Go to RDS service
   - Select "Databases" from left menu

2. **Select Your Database:**
   - Find your database instance (e.g., `job-analyzer-postgres`)
   - Click on the database identifier

3. **Modify Master Password:**
   - Click "Modify" button at top right
   - Scroll to "Settings" section
   - Check "New master password"
   - Enter a strong new password (use a password manager!)
   - Confirm the new password

4. **Apply Changes:**
   - Scroll to bottom
   - Select "Apply immediately" (for security issues)
   - Click "Modify DB instance"
   - Wait 2-5 minutes for changes to apply

### Step 2: Update Local Environment Files

1. **Update `.env` file:**

   ```bash
   # Edit .env
   nano .env
   
   # Update DATABASE_URL with new password
   DATABASE_URL="postgresql://dbadmin:NEW_PASSWORD_HERE@job-analyzer-postgres.xxxxx.us-east-1.rds.amazonaws.com:5432/jobanalyzer"
   
   # Also update RDS_PASSWORD if present
   RDS_PASSWORD=NEW_PASSWORD_HERE
   ```

2. **Test the connection:**

   ```bash
   # Start RDS if stopped
   npm run db:rds:start
   
   # Test connection with Prisma
   npx prisma db pull
   
   # Or test with psql
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

3. **Update team members:**
   - Notify all team members to update their local `.env` files
   - Share new password securely (use 1Password, LastPass, or similar)
   - Never share passwords via email, Slack, or other insecure channels

### Step 3: Verify and Document

1. **Verify application works:**

   ```bash
   npm run dev
   # Test database operations
   ```

2. **Document the rotation:**
   - Record date of rotation in security log
   - Note reason for rotation
   - Confirm all team members updated their credentials

## Method 2: CloudFormation-Based Password Rotation

If your RDS instance was created via CloudFormation, you can rotate the password through stack updates.

### Step 1: Generate New Password

```bash
# Generate a strong random password
openssl rand -base64 32
```

### Step 2: Update CloudFormation Stack

**Option A: Using AWS Console**

1. Navigate to CloudFormation service
2. Select your RDS stack (e.g., `job-analyzer-rds`)
3. Click "Update"
4. Select "Use current template"
5. Update the `MasterUserPassword` parameter with new password
6. Review and confirm changes
7. Wait for stack update to complete (5-10 minutes)

**Option B: Using AWS CLI**

```bash
# Update stack with new password
aws cloudformation update-stack \
  --stack-name job-analyzer-rds \
  --use-previous-template \
  --parameters \
    ParameterKey=MasterUserPassword,ParameterValue=NEW_PASSWORD_HERE \
    ParameterKey=EnvironmentName,UsePreviousValue=true \
  --capabilities CAPABILITY_NAMED_IAM

# Wait for update to complete
aws cloudformation wait stack-update-complete \
  --stack-name job-analyzer-rds
```

### Step 3: Update Local Environment Files

Follow the same steps as Method 1, Step 2 above.

## Method 3: AWS Secrets Manager (Recommended for Production)

For production environments, consider using AWS Secrets Manager for automatic password rotation.

### Step 1: Store Password in Secrets Manager

```bash
# Create secret
aws secretsmanager create-secret \
  --name job-analyzer/rds/master-password \
  --description "RDS master password for job-analyzer database" \
  --secret-string "YOUR_INITIAL_PASSWORD"
```

### Step 2: Enable Automatic Rotation

```bash
# Enable rotation (rotates every 30 days)
aws secretsmanager rotate-secret \
  --secret-id job-analyzer/rds/master-password \
  --rotation-lambda-arn arn:aws:lambda:REGION:ACCOUNT:function:SecretsManagerRDSPostgreSQLRotationSingleUser \
  --rotation-rules AutomaticallyAfterDays=30
```

### Step 3: Update Application to Use Secrets Manager

Modify your application to retrieve the password from Secrets Manager instead of `.env`:

```typescript
// Example: Retrieve password from Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getDatabasePassword() {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const command = new GetSecretValueCommand({
    SecretId: "job-analyzer/rds/master-password"
  });
  
  const response = await client.send(command);
  return response.SecretString;
}

// Use in DATABASE_URL construction
const password = await getDatabasePassword();
const DATABASE_URL = `postgresql://dbadmin:${password}@${RDS_HOST}:5432/jobanalyzer`;
```

## Security Best Practices

### Password Requirements

- **Minimum length:** 16 characters
- **Include:** Uppercase, lowercase, numbers, special characters
- **Avoid:** Dictionary words, personal information, sequential patterns
- **Use:** Password manager to generate and store

### After Rotation

1. **Verify old password no longer works:**

   ```bash
   # This should fail
   psql "postgresql://dbadmin:OLD_PASSWORD@host:5432/db" -c "SELECT 1;"
   ```

2. **Update all systems:**
   - Local development environments
   - CI/CD pipelines (GitHub Actions secrets)
   - Deployment scripts
   - Monitoring tools
   - Backup scripts

3. **Audit access:**
   - Review RDS connection logs
   - Check for unauthorized access attempts
   - Verify all legitimate connections work

### Regular Maintenance

- **Rotate passwords every 90 days** (or per your security policy)
- **Audit database access logs** monthly
- **Review IAM permissions** quarterly
- **Update security documentation** as needed

## Troubleshooting

### "Password authentication failed"

**Cause:** Old password still in use somewhere

**Solution:**

1. Check all `.env` files are updated
2. Restart application/services
3. Clear any cached credentials
4. Verify RDS password change completed in AWS Console

### "Connection timeout"

**Cause:** RDS instance may be stopped or security group issue

**Solution:**

1. Check RDS status: `npm run db:rds:status`
2. Start RDS if stopped: `npm run db:rds:start`
3. Verify security group allows your IP
4. Check VPC and subnet configuration

### "Too many failed login attempts"

**Cause:** Multiple systems trying old password

**Solution:**

1. Stop all applications/scripts
2. Update all `.env` files
3. Wait 5-10 minutes for lockout to clear
4. Restart applications with new password

## Emergency Contact

If you suspect a security breach:

1. **Immediately rotate password** using Method 1 (fastest)
2. **Review RDS logs** for suspicious activity
3. **Check application logs** for unauthorized access
4. **Notify team lead** or security officer
5. **Document the incident** with timeline and actions taken

## Related Documentation

- [Database Setup Guide](../database-setup.md)
- [Database Scripts README](../../scripts/db/README.md)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [RDS Security Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.Security.html)

## Checklist

Use this checklist when rotating passwords:

- [ ] Generate strong new password (16+ characters)
- [ ] Rotate password in AWS (Console or CloudFormation)
- [ ] Wait for changes to apply (2-10 minutes)
- [ ] Update local `.env` file
- [ ] Test database connection
- [ ] Update team members' credentials
- [ ] Update CI/CD secrets (if applicable)
- [ ] Verify old password no longer works
- [ ] Document rotation date and reason
- [ ] Monitor logs for issues
- [ ] Confirm all systems operational

## Notes

- **Never commit passwords to git** - even after rotation, old passwords remain in git history
- **Use AWS Secrets Manager** for production environments with automatic rotation
- **Rotate immediately** if credentials are ever exposed
- **Share passwords securely** using password managers or secure channels
- **Document all rotations** for audit and compliance purposes
