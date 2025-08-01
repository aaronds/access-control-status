export SQS_POWER_URL="https://sqs.eu-west-2.amazonaws.com/123/pro-power"
export SQS_MODE_URL="https://sqs.eu-west-2.amazonaws.com/123/pro-mode"
export webClientRole=arn:aws:iam::123:role/ROLE
export PROMETHEUS_RW_URL="http://localhost:8090/api/v1/push"
export ACS_SITE=site
export ACS_ORG_ID=org

export AWS_ACCESS_KEY_ID=""
export AWS_SECRET_ACCESS_KEY=""
export AWS_SESSION_TOKEN=""


node pull-mode.mjs
