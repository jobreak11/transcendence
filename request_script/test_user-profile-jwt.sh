#!/bin/bash

curl -X GET -i -k "https://localhost:4333/nestjs/user/profile" \
	-H "Authorization: Bearer $1"
