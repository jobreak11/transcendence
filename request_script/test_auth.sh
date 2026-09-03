#!/bin/bash

set -eu

curl -X POST -i -k "https://localhost:4333/nestjs/auth/login" \
	-H "Content-Type: application/json" \
	-d '{
	"email": "test@example.com",
	"password": "yolo1234"

}'
