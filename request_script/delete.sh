#!/bin/bash

set -eu

USER_ID_TEST="$1"

curl -X DELETE -i -k "https://localhost:4333/nestjs/profiles/${USER_ID_TEST}"
