#!/bin/bash

curl -X POST -i -k https://localhost:4333/nestjs/items/ \
	-H "Content-Type: application/json" \
	-d '{
		"name": "First item",
		"public": true
}'



