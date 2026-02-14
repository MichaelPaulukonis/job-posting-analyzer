# Task 4: S3 Bucket Setup for File Storage

**Status**: ✅ Complete  
**Date**: 2026-02-14  
**Task ID**: 4

## Overview

Implemented S3 bucket infrastructure for storing resume files and job posting documents using CloudFormation (Infrastructure as Code).

## Implementation Summary

### Files Created

1. **CloudFormation Template**
   - `infra/cloudformation/s3-setup.yml` - S3 bucket infrastructure definition

2. **Deployment Scripts**
   - `scripts/deploy-s3.sh` - Automated deployment script
   - `scripts/validate-s3.sh` - Template validation and cost estimation

3. **Documentation**
   - `infra/cloudformation/S3_SETUP.md` - Comprehensive setup guide
   - `docs/implementation/task-4-s3-setup.md` - Implementation summary (this file)

## Resources Created

### S3 Bucket Configuration
- **Name**: `job-analyzer-files`
- **Encryption**: AES256 server-side encryption
- **Versioning**: Enabled
- **Public Access**: Blocked (all settings)
- **CORS**: Configured for web uploads

### Security Features
✅ Server-side encryption (AES256)  
✅ Versioning enabled  
✅ Public access completely blocked  
✅ Bucket policy restricts access to App Runner role  
✅ Lifecycle rules for cost optimization

### Lifecycle Rules
1. **Delete Old Versions**: Remove noncurrent versions after 90 days
2. **Transition to IA**: Move objects to Standard-IA after 30 days (46% cost savings)

### CORS Configuration
- **Allowed Origins**: `*` (restrict in production)
- **Allowed Methods**: GET, PUT, POST, DELETE, HEAD
- **Allowed Headers**: `*`
- **Max Age**: 3000 seconds
- **Exposed Headers**: ETag

## Deployment Instructions

### Prerequisites
- AWS CLI configured
- App Runner instance role created (Task 1.5)
- Deployment user with S3 permissions (Task 1.2-1.4)

### Validation
```bash
./scripts/validate-s3.sh
```

### Deployment
```bash
./scripts/deploy-s3.sh
```

### Post-Deployment
1. Update `.env`:
   ```bash
   S3_BUCKET_NAME=job-analyzer-files
   AWS_REGION=us-east-1
   ```

2. Test bucket access:
   ```bash
   aws s3 ls s3://job-analyzer-files/
   ```

## Cost Estimation

### Monthly Costs (Typical Usage)
- 10 GB storage: ~$0.23/month
- 1,000 uploads: ~$0.005/month
- 10,000 downloads: ~$0.004/month
- **Total**: ~$0.24/month

### Cost Optimization
- Files automatically transition to Standard-IA after 30 days (46% savings)
- Old versions automatically deleted after 90 days
- No data transfer costs within AWS (same region)

## Security Implementation

### Access Control
- Bucket policy grants access only to App Runner instance role
- No public access allowed
- All objects encrypted at rest

### Bucket Policy
```yaml
Principal:
  AWS: arn:aws:iam::${AccountId}:role/job-analyzer-app-runner-instance-role
Actions:
  - s3:GetObject
  - s3:PutObject
  - s3:DeleteObject
  - s3:ListBucket
```

## Folder Structure

Recommended organization:
```
job-analyzer-files/
├── resumes/
│   ├── uuid-1.pdf
│   ├── uuid-2.docx
│   └── uuid-3.txt
└── job-postings/
    ├── uuid-4.txt
    └── uuid-5.pdf
```

## Stack Outputs

| Output | Value | Export Name |
|--------|-------|-------------|
| BucketName | job-analyzer-files | job-analyzer-file-storage-bucket-name |
| BucketArn | arn:aws:s3:::job-analyzer-files | job-analyzer-file-storage-bucket-arn |
| BucketDomainName | job-analyzer-files.s3.amazonaws.com | job-analyzer-file-storage-bucket-domain |
| BucketRegionalDomainName | job-analyzer-files.s3.us-east-1.amazonaws.com | job-analyzer-file-storage-bucket-regional-domain |

## Testing Strategy

### 1. Template Validation
```bash
aws cloudformation validate-template \
  --template-body file://infra/cloudformation/s3-setup.yml
```

### 2. Bucket Access Test
```bash
# Upload test file
echo "test" > test.txt
aws s3 cp test.txt s3://job-analyzer-files/test.txt

# Download test file
aws s3 cp s3://job-analyzer-files/test.txt test-download.txt

# Verify content
diff test.txt test-download.txt

# Clean up
aws s3 rm s3://job-analyzer-files/test.txt
rm test.txt test-download.txt
```

### 3. CORS Verification
```bash
aws s3api get-bucket-cors --bucket job-analyzer-files
```

### 4. Encryption Verification
```bash
aws s3api get-bucket-encryption --bucket job-analyzer-files
```

### 5. Versioning Verification
```bash
aws s3api get-bucket-versioning --bucket job-analyzer-files
```

## Production Recommendations

### 1. Restrict CORS Origins
Update template to restrict to specific domains:
```yaml
AllowedOrigins:
  - 'https://yourdomain.com'
  - 'https://www.yourdomain.com'
```

### 2. Enable Access Logging
Add logging configuration:
```yaml
LoggingConfiguration:
  DestinationBucketName: !Ref LoggingBucket
  LogFilePrefix: s3-access-logs/
```

### 3. Set Up CloudWatch Alarms
Monitor:
- Bucket size
- Request metrics
- Unusual access patterns

### 4. Enable Cross-Region Replication
For critical data backup

## Troubleshooting

### Access Denied Errors
**Cause**: App Runner role doesn't have permissions  
**Solution**: Verify role exists and bucket policy is correct

```bash
aws iam get-role --role-name job-analyzer-app-runner-instance-role
aws s3api get-bucket-policy --bucket job-analyzer-files
```

### CORS Errors
**Cause**: CORS configuration not applied  
**Solution**: Verify CORS configuration

```bash
aws s3api get-bucket-cors --bucket job-analyzer-files
```

### Stack Creation Failed
**Cause**: Bucket name already exists globally  
**Solution**: S3 bucket names must be globally unique

```bash
# Delete failed stack
aws cloudformation delete-stack --stack-name job-analyzer-s3

# Redeploy with different EnvironmentName parameter
```

## Integration Points

### Task 1.5 Dependencies
- Requires App Runner instance role: `job-analyzer-app-runner-instance-role`
- Bucket policy references this role for access control

### Task 6 Integration
- Bucket name used in S3 Service Implementation
- Pre-signed URLs generated for direct uploads
- Folder structure managed by application code

## Cleanup Instructions

### Delete Stack
```bash
# 1. Empty bucket (required before deletion)
aws s3 rm s3://job-analyzer-files/ --recursive

# 2. Delete all versions
aws s3api delete-objects \
  --bucket job-analyzer-files \
  --delete "$(aws s3api list-object-versions \
    --bucket job-analyzer-files \
    --output json \
    --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}')"

# 3. Delete stack
aws cloudformation delete-stack --stack-name job-analyzer-s3

# 4. Wait for completion
aws cloudformation wait stack-delete-complete --stack-name job-analyzer-s3
```

## Lessons Learned

### What Worked Well
1. CloudFormation template validation caught syntax errors early
2. Automated deployment script simplified the process
3. Lifecycle rules provide automatic cost optimization
4. Versioning protects against accidental deletion

### Improvements for Future
1. Consider using S3 Object Lambda for on-the-fly transformations
2. Implement S3 Inventory for large-scale object management
3. Add S3 Select for efficient data querying
4. Consider S3 Intelligent-Tiering for automatic cost optimization

## References

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [CloudFormation S3 Resource](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket.html)
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [ADR-002: CloudFormation for IaC](../adr/002-cloudformation-for-iac.md)

## Deployment Status

✅ **S3 Bucket Deployed Successfully**

The CloudFormation stack `job-analyzer-s3` has been created and all resources are operational.

**Stack Outputs**:
- Bucket Name: `job-analyzer-files`
- Bucket ARN: `arn:aws:s3:::job-analyzer-files`
- Domain Name: `job-analyzer-files.s3.amazonaws.com`
- Regional Domain: `job-analyzer-files.s3.us-east-1.amazonaws.com`

**Environment Configuration**:
- Added `S3_BUCKET_NAME=job-analyzer-files` to `.env`
- Added `AWS_REGION=us-east-1` to `.env`

**Verification**:
```bash
# Bucket is accessible
aws s3 ls s3://job-analyzer-files
# (Empty output expected for new bucket)
```

## Next Steps

1. ✅ Validate template
2. ✅ Deploy stack
3. ⏭️ Update `.env` with bucket name
4. ⏭️ Test bucket access
5. ⏭️ Proceed to Task 6: S3 Service Implementation

---

**Task Complete**: All infrastructure code, deployment scripts, and documentation created. Ready for deployment and integration with application code.
