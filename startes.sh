#!/bin/bash

mkdir esdata
CURRENT_DIR=$(pwd)

docker run \
      --rm --name elasticsearch \
      -v $CURRENT_DIR/esdata:/usr/share/elasticsearch/data:rw \
      -v $CURRENT_DIR/elasticsearch_dev_m1.yml:/usr/share/elasticsearch/config/elasticsearch.yml \
      --net elastic -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -t docker.elastic.co/elasticsearch/elasticsearch:8.6.2