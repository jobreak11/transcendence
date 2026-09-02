#!/bin/bash

curl -X GET -i -k "https://localhost:4333/nestjs/auth/me" \
	-H "Authorization: Bearer $1"
