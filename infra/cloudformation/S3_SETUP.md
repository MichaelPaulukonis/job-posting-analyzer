# S3 Bucket Setup for Job Posting Analyzer

This CloudFormation template creates and configures an S3 bucket for storing resume files and job posting documents.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    S3 File Storage                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  job-analyzer-files                                  │  │
│  │                                                      │  │
│  │  ├── /resumes/                                      │  │
│  │  │   ├── uuid-1.pdf                                │  │
│  │  │   ├── uuid-2.docx                               │  │
│  │  │   └── uuid-3.txt                                │  │
│  │  │                                                  │  │
│  │  └── /job-postings/                                │  │
│  │      ├── uuid-4.txt                                │  │
│  │      └── uuid-5.pdf                                │  │
│  │                                                      │  │
│  │  Features:                                          │  │
│  │  • Server-side encryption (AES256)                 │  │
│  │  • Versioning enabled                              │  │
│  │  • Lifecycle rules (IA after 30 days)             │  │
│  │  • CORS configured for web uploads                 │  │
│  │  • Public access blocked                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ▲                                 │
│                           │                                 │
│                    Bucket Policy                            │
│                           │                                 │
│              ┌────────────┴────────────┐                   │
│              │                         │                    │
│         App Runner              Deployment User             │
│      Instance Role                (job-analyzer-dev)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Resources Created

### 1. S3 Bucket (`FileStorageBucket`)
- **Name**: `job-analyzer-files`
- **Purpose**: Store resume files and job posting documents
- **Encryption**: AES256 server-side encryption
- **Versioning**: Enabled for data protection
- **Public Access**: Blocked (all public access disabled)

### 2. Bucket Policy (`FileStorageBucketPolicy`)
- **Purpose**: Grant access to App Runner service role
- **Permissions**: GetObject, PutObject, DeleteObject, ListBucket
- **Scope**: Limited to App Runner instance role

## Configuration Details

### Encryption
- **Type**: Server-side encryption with AES256
- **Automatic**: All objects encrypted by default
- **Key Management**: AWS-managed keys (no additional cost)

### Versioning
- **Status**: Enabled
- **Purpose**: Protect against accidental deletion
- **Lifecycle**: Old versions deleted after 90 days

### Lifecycle Rules

#### Rule 1: Delete Old Versions
- **ID**: DeleteOldVersions
- **Action**: Delete noncurrent versions after 90 days
- **Purpose**: Cost optimization

#### Rule 2: Transition to Infrequent Access
- **ID**: TransitionToIA
- **Action**: Move objects to Standard-IA after 30 days
- **Purpose**: Reduce storage costs for older files
- **Savings**: ~46% cost reduction after 30 days

### CORS Configuration
```json
{
  "AllowedOrigins": ["*"],
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "MaxAge": 3000,
  "ExposedHeaders": ["ETag"]
}
```

**⚠️ Production Note**: Restrict `AllowedOrigins` to your specific domain(s)

### Public Access Block
All public access is blocked:
- ✅ BlockPublicAcls: true
- ✅ BlockPublicPolicy: true
- ✅ IgnorePublicAcls: true
- ✅ RestrictPublicBuckets: true

## Deployment

### Prerequisites
1. AWS CLI configured with appropriate credentials
2. App Runner instance role created (Task 1.5)
3. Deployment user with S3 permissions (Task 1.2-1.4)

### Validation
```bash
./scripts/validate-s3.sh
```

This will:
- Validate CloudFormation template syntax
- Display template parameters and outputs
- Show cost estimates
- Summarize security configuration

### Deployment
```bash
./scripts/deploy-s3.sh
```

This will:
1. Validate the CloudFormation template
2. Deploy the stack with appropriate parameters
3. Display stack outputs (bucket name, ARN, domain)
4. Provide next steps

### Manual Deployment (Alternative)
```bash
aws cloudformation deploy \
  --stack-name job-analyzer-s3 \
  --template-file infra/cloudformation/s3-setup.yml \
  --parameter-overrides \
    EnvironmentName=job-analyzer \
  --tags \
    Project=job-posting-analyzer \
    Environment=job-analyzer \
    ManagedBy=CloudFormation
```

## Post-Deployment Configuration

### 1. Update Environment Variables
Add to `.env`:
```bash
S3_BUCKET_NAME=job-analyzer-files
AWS_REGION=us-east-1
```

### 2. Verify Bucket Access
```bash
# List bucket (should be empty initially)
aws s3 ls s3://job-analyzer-files/

# Test upload
echo "test" > test.txt
aws s3 cp test.txt s3://job-analyzer-files/test.txt

# Test download
aws s3 cp s3://job-analyzer-files/test.txt test-download.txt

# Clean up test file
aws s3 rm s3://job-analyzer-files/test.txt
rm test.txt test-download.txt
```

### 3. Create Folder Structure
```bash
# Create folder prefixes (S3 doesn't have real folders)
aws s3api put-object \
  --bucket job-analyzer-files \
  --key resumes/

aws s3api put-object \
  --bucket job-analyzer-files \
  --key job-postings/
```

## Cost Estimation

### Storage Costs
- **S3 Standard**: $0.023 per GB/month
- **S3 Standard-IA** (after 30 days): $0.0125 per GB/month

### Request Costs
- **PUT/POST**: $0.005 per 1,000 requests
- **GET**: $0.0004 per 1,000 requests

### Data Transfer
- **Out to Internet**: $0.09 per GB (first 10 TB)
- **Within AWS**: Free (same region)

### Example Monthly Cost
For typical usage:
- 10 GB storage: ~$0.23/month
- 1,000 uploads: ~$0.005/month
- 10,000 downloads: ~$0.004/month
- **Total**: ~$0.24/month

## Security Best Practices

### ✅ Implemented
1. Server-side encryption enabled
2. Versioning enabled for data protection
3. Public access completely blocked
4. Bucket policy restricts access to specific IAM role
5. Lifecycle rules for automatic cleanup

### ⚠️ Production Recommendations
1. **CORS**: Restrict `AllowedOrigins` to your domain
   ```yaml
   AllowedOrigins:
     - 'https://yourdomain.com'
     - 'https://www.yourdomain.com'
   ```

2. **Logging**: Enable S3 access logging
   ```yaml
   LoggingConfiguration:
     DestinationBucketName: !Ref LoggingBucket
     LogFilePrefix: s3-access-logs/
   ```

3. **Monitoring**: Set up CloudWatch alarms
   - Monitor bucket size
   - Track request metrics
   - Alert on unusual access patterns

4. **Backup**: Enable cross-region replication for critical data

## Troubleshooting

### Issue: Access Denied
**Cause**: App Runner role doesn't have permissions
**Solution**: Verify App Runner instance role exists and matches policy

```bash
# Check if role exists
aws iam get-role --role-name job-analyzer-app-runner-instance-role

# Verify bucket policy
aws s3api get-bucket-policy --bucket job-analyzer-files
```

### Issue: CORS Errors
**Cause**: CORS configuration not applied or incorrect
**Solution**: Verify CORS configuration

```bash
aws s3api get-bucket-cors --bucket job-analyzer-files
```

### Issue: Stack Creation Failed
**Cause**: Bucket name already exists globally
**Solution**: S3 bucket names must be globally unique. Change `EnvironmentName` parameter

```bash
aws cloudformation delete-stack --stack-name job-analyzer-s3
# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name job-analyzer-s3
# Redeploy with different name
```

## Stack Outputs

After deployment, the following outputs are available:

| Output | Description | Export Name |
|--------|-------------|-------------|
| BucketName | S3 bucket name | job-analyzer-file-storage-bucket-name |
| BucketArn | S3 bucket ARN | job-analyzer-file-storage-bucket-arn |
| BucketDomainName | Bucket domain name | job-analyzer-file-storage-bucket-domain |
| BucketRegionalDomainName | Regional domain name | job-analyzer-file-storage-bucket-regional-domain |

### Using Outputs in Other Stacks
```yaml
# Reference bucket name in another CloudFormation template
BucketName: !ImportValue job-analyzer-file-storage-bucket-name
```

## Integration with Application

### Environment Variables
```bash
# .env
S3_BUCKET_NAME=job-analyzer-files
AWS_REGION=us-east-1
```

### Application Code
See Task 6 (S3 Service Implementation) for:
- File upload service
- Pre-signed URL generation
- File download and deletion
- Folder structure management

## Cleanup

### Delete Stack
```bash
# Empty bucket first (required)
aws s3 rm s3://job-analyzer-files/ --recursive

# Delete all versions
aws s3api delete-objects \
  --bucket job-analyzer-files \
  --delete "$(aws s3api list-object-versions \
    --bucket job-analyzer-files \
    --output json \
    --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}')"

# Delete stack
aws cloudformation delete-stack --stack-name job-analyzer-s3

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name job-analyzer-s3
```

## References

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [S3 Bucket Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)
- [S3 CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
- [S3 Lifecycle Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [S3 Encryption](https://docs.aws.amazon.com/AmazonS3/latest/userguide/serv-side-encryption.html)
- [ADR-002: CloudFormation for IaC](../../docs/adr/002-cloudformation-for-iac.md)

## Next Steps

1. ✅ Validate template: `./scripts/validate-s3.sh`
2. ✅ Deploy stack: `./scripts/deploy-s3.sh`
3. ✅ Update `.env` with bucket name
4. ✅ Test bucket access
5. ➡️ Proceed to Task 6: S3 Service Implementation
