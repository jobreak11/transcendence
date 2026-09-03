#!/bin/bash

curl -X POST -i -k https://localhost:4333/nestjs/user/ \
	-H "Content-Type: application/json" \
	-d '{
		"email": "test22@example.com",
		"password": "yolo1234"
}'



