#!/bin/bash

docker run \
      --rm --name kibana -e XPACK_SECURITY_ENABLED=false \
      --net elastic -p 5601:5601 docker.elastic.co/kibana/kibana:8.6.2
