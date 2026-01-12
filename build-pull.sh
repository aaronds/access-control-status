#!/bin/bash

CONTAINER_CMD=$(which podman || which docker)

echo $CONTAINER_CMD;

cd service-monitor-pull;

$CONTAINER_CMD build -t status-monitor-pull .
