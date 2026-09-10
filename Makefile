
########################################################################
########################################################################
########################################################################



# all the project required directories
SRC_DIR = ./src
TEMP_DIR = ./temp

# docker containers
DOCKERS_DIR = ${SRC_DIR}/dockers

NEXTJS_DIR = ${DOCKERS_DIR}/nextjs
NEXTJS_DATA_DIR = ${NEXTJS_DIR}/data
NEXTJS_SAVES_DIR = ${NEXTJS_DIR}/saves

NESTJS_DIR = ${DOCKERS_DIR}/nestjs
NESTJS_DATA_DIR = ${NESTJS_DIR}/data
NESTJS_SAVES_DIR = ${NESTJS_DIR}/saves

POSTGRES_DIR = ${DOCKERS_DIR}/postgresql
POSTGRES_DATA_DIR = ${POSTGRES_DIR}/data

NGINX_DIR = ${DOCKERS_DIR}/nginx

ADMINER_DIR = ${DOCKERS_DIR}/adminer

REDIS_DIR = ${DOCKERS_DIR}/redis
REDIS_DATA_DIR = ${REDIS_DIR}/data

# the name of this project
NAME = transcendence
ENV_FILE = ${SRC_DIR}/.env
SECRETS_DIR = ${SRC_DIR}/secrets
ENV_EXAMPLE_FILE = ${SRC_DIR}/.env.example
DB_PASSWORD_FILE = ${SECRETS_DIR}/db_password.txt

DOCKER_COMPOSE_YAML_FILE = ${SRC_DIR}/docker-compose.yml

TOOLS_DIR = ${SRC_DIR}/tools
CHECK_ENV_SECRETS_SCRIPT = ${TOOLS_DIR}/check_environment_and_secrets.sh
CHECK_PREREQUISITE_SCRIPT = ${TOOLS_DIR}/check_prerequisite.sh

# stamp files - convention to let makefile know
#									by creating stamp file for each operation

#################
DIR_EXIST_STAMP_FILE = ${TEMP_DIR}/.makefile_dir_exist_stamp_file
DOCKER_COMPOSE_BUILD_STAMPFILE = ${TEMP_DIR}/.makefile_stamp_docker_compose_build
DOCKER_COMPOSE_START_STAMPFILE = ${TEMP_DIR}/.makefile_stamp_docker_compose_start
####################
CHECK_PREREQUISITE_STAMPFILE= ${TEMP_DIR}/.makefile_check_preq_stamp
CHMOD_TOOLS_STAMPFILE= ${TEMP_DIR}/.makefile_chmod_script

CHECK_ENV_SECRETS_STAMPFILE=${TEMP_DIR}/.makefile_check_env_secrets_stamp



all: ${NAME}

${NAME}: ${DOCKER_COMPOSE_START_STAMPFILE}

${DOCKER_COMPOSE_START_STAMPFILE}: ${DOCKER_COMPOSE_BUILD_STAMPFILE} | ${TEMP_DIR}
	docker compose -f "${DOCKER_COMPOSE_YAML_FILE}" up -d && touch $@

${DOCKER_COMPOSE_BUILD_STAMPFILE}: ${DOCKER_COMPOSE_YAML_FILE} ${DIR_EXIST_STAMP_FILE} ${CHECK_ENV_SECRETS_STAMPFILE} | ${TEMP_DIR}
	docker compose -f "${DOCKER_COMPOSE_YAML_FILE}" build && touch $@

${DIR_EXIST_STAMP_FILE}: | ${TEMP_DIR} ${NESTJS_DATA_DIR} ${NEXTJS_DATA_DIR} ${REDIS_DATA_DIR} ${TEMP_DIR}
	touch $@

${TEMP_DIR}:
	mkdir -p $@

${NEXTJS_DATA_DIR}: | ${NEXTJS_DIR}
	mkdir -p $@

${NEXTJS_SAVES_DIR}: | ${NEXTJS_DIR}
	mkdir -p $@

${NESTJS_DATA_DIR}: | ${NESTJS_DIR}
	mkdir -p $@

${NESTJS_SAVES_DIR}: | ${NESTJS_DIR}
	mkdir -p $@

${REDIS_DATA_DIR}: | ${REDIS_DIR}
	mkdir -p $@

${SECRETS_DIR}:
	mkdir -p $@

${CHECK_ENV_SECRETS_STAMPFILE}: ${CHECK_ENV_SECRETS_SCRIPT} ${ENV_EXAMPLE_FILE} ${DOCKER_COMPOSE_YAML_FILE} | ${CHECK_PREREQUISITE_STAMPFILE} ${CHMOD_TOOLS_STAMPFILE} ${SECRETS_DIR}
	${CHECK_ENV_SECRETS_SCRIPT} ${SRC_DIR} ${ENV_EXAMPLE_FILE} ${SECRETS_DIR} && touch $@

${CHECK_PREREQUISITE_STAMPFILE}: ${CHECK_PREREQUISITE_SCRIPT} | ${CHMOD_TOOLS_STAMPFILE}
	${CHECK_PREREQUISITE_SCRIPT} && touch $@

${CHMOD_TOOLS_STAMPFILE}: | ${TEMP_DIR} ${TOOLS_DIR}
	chmod +x ${TOOLS_DIR}/* && touch $@

#####################################################

start: ${DOCKER_COMPOSE_START_STAMPFILE}

stop: ${DOCKER_COMPOSE_YAML_FILE}
	docker compose -f "${DOCKER_COMPOSE_YAML_FILE}" stop || true
	rm -f ${DOCKER_COMPOSE_START_STAMPFILE} || true


build: ${DOCKER_COMPOSE_YAML_FILE} ${DIR_EXIST_STAMP_FILE} ${CHECK_ENV_SECRETS_STAMPFILE} | ${TEMP_DIR}
	docker compose -f "${DOCKER_COMPOSE_YAML_FILE}" build --no-cache || true
	touch ${DOCKER_COMPOSE_BUILD_STAMPFILE}

down: stop
	docker compose -f "${DOCKER_COMPOSE_YAML_FILE}" down  || true
	rm -f ${DOCKER_COMPOSE_BUILD_STAMPFILE} || true

purge: down
	docker volume rm $$(docker volume ls -q) || true
	docker system prune --volumes --force
	rm -rf ${NEXTJS_DATA_DIR} ${NESTJS_DATA_DIR} ${POSTGRES_DATA_DIR} ${REDIS_DATA_DIR}
	rm -rf ${DIR_EXIST_STAMP_FILE}
	rm -rf ${CHECK_ENV_SECRETS_STAMPFILE}

re: down all

nuke: purge
	docker rmi $$(docker image ls -qa) || true
	docker volume rm $$(docker volume ls -q) || true
	docker system prune --volumes --force
	rm -rf ${ENV_FILE}
	rm -rf ${SECRETS_DIR}
	rm -rf ${TEMP_DIR}

save-nextjs: | ${NEXTJS_SAVES_DIR} ${NEXTJS_DATA_DIR}/src ${NEXTJS_DATA_DIR}/public
	rm -rf ${NEXTJS_SAVES_DIR}/* || true
	cp -r ${NEXTJS_DATA_DIR}/public ${NEXTJS_SAVES_DIR} || true
	cp -r ${NEXTJS_DATA_DIR}/src ${NEXTJS_SAVES_DIR} || true

save-nestjs: | ${NESTJS_SAVES_DIR} ${NESTJS_DATA_DIR}/src
	rm -rf ${NESTJS_SAVES_DIR}/* || true
	cp -r ${NESTJS_DATA_DIR}/src ${NESTJS_SAVES_DIR} || true
	cp -r ${NESTJS_DATA_DIR}/nest-cli.json ${NESTJS_SAVES_DIR} || true

save: save-nextjs save-nestjs

go-postgres: ${DOCKER_COMPOSE_START_STAMPFILE}
	docker compose -f "${DOCKER_COMPOSE_YAML_FILE}" exec postgresql /bin/sh

go-nestjs: ${DOCKER_COMPOSE_START_STAMPFILE}
	docker compose -f "${DOCKER_COMPOSE_YAML_FILE}" exec nestjs ./entrypoint.sh /bin/sh

go-nextjs: ${DOCKER_COMPOSE_START_STAMPFILE}
	docker compose -f "${DOCKER_COMPOSE_YAML_FILE}" exec nextjs ./entrypoint.sh /bin/sh


.PHONY: all start stop build down re purge nuke save-nextjs save-nestjs save ${NAME} go-postgres go-nestjs go-nextjs
