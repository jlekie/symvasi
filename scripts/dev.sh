#!/bin/bash

docker run -ti --rm --net=host --privileged -v $(pwd):/ws jlekie/devenv-nodejs:5.x $USER `id -u $USER` `id -g $USER`