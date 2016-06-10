#!/bin/bash

if [ $# -eq 0 ]; then
    docker run -ti --rm --net=host --privileged -v $(pwd):/ws jlekie/devenv-nodejs:5.x $USER `id -u $USER` `id -g $USER`
else
    if [ -t 1 ]; then
        docker run -ti --rm --net=host --privileged -v $(pwd):/ws jlekie/devenv-nodejs:5.x $USER `id -u $USER` `id -g $USER` $@
    else
        docker run -t --rm --net=host --privileged -v $(pwd):/ws jlekie/devenv-nodejs:5.x $USER `id -u $USER` `id -g $USER` $@
    fi
fi
