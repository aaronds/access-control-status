#!/bin/bash

CONTAINER_CMD=$(which podman || which docker)

$CONTAINER_CMD tag localhost/status-monitor-push:latest registry.bristolhackspace.org/status-monitor-push:latest
$CONTAINER_CMD push registry.bristolhackspace.org/status-monitor-push:latest

$CONTAINER_CMD tag localhost/status-monitor-pull:latest registry.bristolhackspace.org/status-monitor-pull:latest
$CONTAINER_CMD push registry.bristolhackspace.org/status-monitor-pull:latest

