"""
RDS Auto-Stop Lambda Function

Checks the /jobanalyzer/db-keep-running SSM parameter and stops the
RDS instance if the parameter is 'false'. Intended to run on a schedule
to prevent AWS from auto-restarting a stopped instance after 7 days.

Environment variables:
  DB_IDENTIFIER        - RDS instance identifier (required)
  SSM_PARAMETER_NAME   - SSM parameter path (default: /jobanalyzer/db-keep-running)
"""

import boto3
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

SSM_PARAMETER_NAME = os.environ.get("SSM_PARAMETER_NAME", "/jobanalyzer/db-keep-running")
DB_IDENTIFIER = os.environ.get("DB_IDENTIFIER", "")


def lambda_handler(event, context):
    if not DB_IDENTIFIER:
        logger.error("DB_IDENTIFIER environment variable is not set")
        return {"statusCode": 400, "body": "DB_IDENTIFIER environment variable is required but not set"}

    ssm = boto3.client("ssm")
    rds = boto3.client("rds")

    # Check SSM parameter
    try:
        response = ssm.get_parameter(Name=SSM_PARAMETER_NAME)
        keep_running = response["Parameter"]["Value"].strip().lower()
        logger.info("SSM parameter %s = '%s'", SSM_PARAMETER_NAME, keep_running)
    except ssm.exceptions.ParameterNotFound:
        logger.warning("SSM parameter %s not found; defaulting to allow stop", SSM_PARAMETER_NAME)
        keep_running = "false"
    except Exception as e:
        logger.error("Error reading SSM parameter: %s", str(e))
        return {"statusCode": 500, "body": f"Error reading SSM parameter: {str(e)}"}

    if keep_running == "true":
        logger.info("db-keep-running is true — skipping stop")
        return {"statusCode": 200, "body": "db-keep-running is true. No action taken."}

    # Describe instance to get current state and engine type
    try:
        response = rds.describe_db_instances(DBInstanceIdentifier=DB_IDENTIFIER)
        instance = response["DBInstances"][0]
        current_status = instance["DBInstanceStatus"]
        engine = instance.get("Engine", "")
        logger.info("RDS instance %s: status=%s engine=%s", DB_IDENTIFIER, current_status, engine)
    except Exception as e:
        logger.error("Error describing RDS instance %s: %s", DB_IDENTIFIER, str(e))
        return {"statusCode": 500, "body": f"Error describing RDS instance: {str(e)}"}

    if current_status != "available":
        msg = f"Instance {DB_IDENTIFIER} is not in 'available' state (current: {current_status}). No action taken."
        logger.info(msg)
        return {"statusCode": 200, "body": msg}

    # Stop the instance (Aurora cluster vs regular RDS)
    try:
        if engine.startswith("aurora"):
            cluster_id = instance.get("DBClusterIdentifier", DB_IDENTIFIER)
            logger.info("Stopping Aurora cluster %s", cluster_id)
            rds.stop_db_cluster(DBClusterIdentifier=cluster_id)
            msg = f"Successfully initiated stop of Aurora cluster {cluster_id}"
        else:
            logger.info("Stopping RDS instance %s", DB_IDENTIFIER)
            rds.stop_db_instance(DBInstanceIdentifier=DB_IDENTIFIER)
            msg = f"Successfully initiated stop of RDS instance {DB_IDENTIFIER}"

        logger.info(msg)
        return {"statusCode": 200, "body": msg}

    except Exception as e:
        logger.error("Error stopping RDS instance %s: %s", DB_IDENTIFIER, str(e))
        return {"statusCode": 500, "body": f"Error stopping RDS instance: {str(e)}"}
