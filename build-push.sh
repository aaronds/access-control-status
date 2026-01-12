#!/bin/bash

CONTAINER_CMD=$(which podman || which docker)

echo $CONTAINER_CMD;

$CONTAINER_CMD build -t status-monitor-push -f service-monitor-push.Dockerfile
