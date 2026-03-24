# RDS Auto-Stop: Operations Runbook

Automated management of the `job-analyzer-postgres` RDS instance to prevent
unnecessary charges and circumvent AWS's 7-day auto-restart behavior.

## Architecture Overview

```text
EventBridge (every 6 days)
    └─→ Lambda: job-analyzer-rds-auto-stop
            ├─→ SSM: /jobanalyzer/db-keep-running
            │       true  → skip (DB stays up)
            │       false → proceed
            └─→ RDS: job-analyzer-postgres
                    available → stop_db_instance()
                    other     → no action
```

**Why 6 days?** AWS automatically restarts stopped RDS instances after 7 days.
Running the Lambda every 6 days ensures the instance stays stopped indefinitely.

## CloudFormation Stack

**Stack name:** `job-analyzer-rds-auto-stop`
**Template:** `infra/cloudformation/rds-auto-stop.yml`

### Resources created

| Resource | Name/Path |
| -------- | --------- |
| Lambda function | `job-analyzer-rds-auto-stop` |
| IAM role | `job-analyzer-rds-auto-stop-role` |
| EventBridge rule | `job-analyzer-rds-auto-stop-schedule` |
| SSM parameter | `/jobanalyzer/db-keep-running` |
| CloudWatch log group | `/aws/lambda/job-analyzer-rds-auto-stop` |

### Deploy / update

```bash
aws cloudformation deploy \
  --template-file infra/cloudformation/rds-auto-stop.yml \
  --stack-name job-analyzer-rds-auto-stop \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides DBIdentifier=job-analyzer-postgres
```

### Tear down

```bash
aws cloudformation delete-stack --stack-name job-analyzer-rds-auto-stop
```

---

## SSM Parameter Reference

**Path:** `/jobanalyzer/db-keep-running`
**Type:** String
**Default:** `false`

| Value | Effect |
| ----- | ------ |
| `false` | Lambda will stop the RDS instance on its next scheduled run |
| `true` | Lambda will skip — DB stays running |

### Updating via helper script

```bash
# Prevent auto-stop (before a work session)
./scripts/db/toggle-rds-auto-stop.sh --keep-running

# Re-enable auto-stop (when done)
./scripts/db/toggle-rds-auto-stop.sh --allow-stop

# Check current setting
./scripts/db/toggle-rds-auto-stop.sh --status
```

### Updating directly via AWS CLI

```bash
# Keep DB running
aws ssm put-parameter \
  --name /jobanalyzer/db-keep-running \
  --value "true" \
  --type String \
  --overwrite

# Allow auto-stop
aws ssm put-parameter \
  --name /jobanalyzer/db-keep-running \
  --value "false" \
  --type String \
  --overwrite
```

---

## Runbook: Starting the DB for a Work Session

1. **Set SSM parameter to keep DB running:**

   ```bash
   ./scripts/db/toggle-rds-auto-stop.sh --keep-running
   ```

2. **Start the RDS instance:**

   ```bash
   ./scripts/db/start-rds.sh
   ```

   Wait ~2-3 minutes for it to become available.

3. **Work as normal** — the Lambda will skip the stop on its next run.

4. **When done, re-enable auto-stop:**

   ```bash
   ./scripts/db/toggle-rds-auto-stop.sh --allow-stop
   ```

   Optionally stop the DB immediately:

   ```bash
   ./scripts/db/stop-rds.sh
   ```

> **Note:** If you forget step 4 and the Lambda runs, it will stop the instance.
> Simply repeat from step 1 when you need it again.

---

## Testing the Lambda

### Manual invocation

```bash
aws lambda invoke \
  --function-name job-analyzer-rds-auto-stop \
  --log-type Tail \
  /tmp/response.json \
  --query 'LogResult' --output text | base64 -d

cat /tmp/response.json
```

### Expected responses

| Scenario | Response body |
| -------- | ------------- |
| DB stopped successfully | `Successfully initiated stop of RDS instance job-analyzer-postgres` |
| SSM parameter is `true` | `db-keep-running is true. No action taken.` |
| DB already stopped | `Instance ... is not in 'available' state (current: stopped). No action taken.` |
| DB in transition | `Instance ... is not in 'available' state (current: stopping). No action taken.` |

---

## Monitoring

### CloudWatch Logs

```bash
# View recent invocations
aws logs tail /aws/lambda/job-analyzer-rds-auto-stop --follow

# Filter for errors only
aws logs filter-log-events \
  --log-group-name /aws/lambda/job-analyzer-rds-auto-stop \
  --filter-pattern ERROR
```

### EventBridge rule next trigger

```bash
aws events describe-rule \
  --name job-analyzer-rds-auto-stop-schedule \
  --query '{State: State, Schedule: ScheduleExpression}'
```

### Check Lambda invocation history

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=job-analyzer-rds-auto-stop \
  --start-time $(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 86400 \
  --statistics Sum
```

---

## Troubleshooting

### Lambda fails with AccessDenied on RDS

The IAM role may be missing permissions. Redeploy the CloudFormation stack:

```bash
aws cloudformation deploy \
  --template-file infra/cloudformation/rds-auto-stop.yml \
  --stack-name job-analyzer-rds-auto-stop \
  --capabilities CAPABILITY_NAMED_IAM
```

### Lambda fails with ParameterNotFound

The SSM parameter was deleted. Redeploy the stack (it will recreate the parameter with default `false`).

### DB keeps restarting on its own

AWS automatically restarts stopped RDS instances after 7 days. The EventBridge schedule
(`cron(0 2 */6 * ? *)`) is designed to fire before that window. If restarts continue:

1. Verify the EventBridge rule is `ENABLED`:

   ```bash
   aws events describe-rule --name job-analyzer-rds-auto-stop-schedule --query 'State'
   ```

2. Check CloudWatch Logs for the Lambda to confirm it ran and succeeded.
3. Ensure the SSM parameter is `false`, not `true`.

### Disable the schedule temporarily

```bash
aws events disable-rule --name job-analyzer-rds-auto-stop-schedule
# Re-enable later:
aws events enable-rule --name job-analyzer-rds-auto-stop-schedule
```

---

## Security

- **IAM role** follows least privilege: only `rds:Describe*/Stop*` and `ssm:GetParameter`
  scoped to the specific parameter ARN.
- No credentials are stored in the Lambda — it uses the IAM role via instance metadata.
- The SSM parameter uses Standard tier (unencrypted). It contains no sensitive data
  (just `"true"` or `"false"`).

---

## Cost Impact

| State | Monthly cost |
| ----- | ------------ |
| RDS running | ~$12–15/month (db.t4g.micro) |
| RDS stopped | ~$2.30/month (storage only) |
| Lambda + EventBridge | ~$0.00/month (well within free tier) |

**Estimated savings:** ~$10–13/month when DB stays stopped between sessions.
