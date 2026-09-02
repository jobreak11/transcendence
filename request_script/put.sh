#!/bin/bash

set -eu

PROFILE_ID_TEST="$1"

curl -X PUT -i -k "https://localhost:4333/nestjs/profiles/${PROFILE_ID_TEST}" \
	-H "Content-Type: application/json" \
	-d '{
		"name": "mu",
		"description": "This is Javascript coder is a master of syntax, a weaver of the web, and a cosdflkaslkasnlkdnasdlknlsdkn asndfla"
}'
