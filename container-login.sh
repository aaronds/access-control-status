#!/bin/bash

CONTAINER_CMD=$(which podman || which docker)

ssh -T registry.bristolhackspace.org 'hs-registry-token status-monitor-pull status-monitor-push' | $CONTAINER_CMD login --username oauth2 --password-stdin registry.bristolhackspace.org
