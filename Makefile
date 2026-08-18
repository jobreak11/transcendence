
########################################################################
########################################################################
########################################################################



# all the project required directories
SRC_DIR = ./src
TEMP_DIR = ./temp

# docker containers
DOCKERS_DIR = ${SRC_DIR}/dockers

NEXTJS_DIR = ${DOCKERS_DIR}/nextjs
NEXTJS_DATA_DIR = ${NEXTJS_DIR}/nextjs
NEXTJS_SAVES_DIR = ${NEXTJS_DIR}/saves

# the name of this project
NAME = transcendence
ENV_FILE = ${SRC_DIR}/.env
DOCKER_COMPOSE_YAML_FILE = ${SRC_DIR}/docker-compose.yml

# stamp files - convention to let makefile know
#									by creating stamp file for each operation

DOCKER_COMPOSE_UP_STAMPFILE=${TEMP_DIR}/.makefile_stamp_docker_compose_up


all: ${NAME}

${NAME}: ${DOCKER_COMPOSE_UP_STAMPFILE}


${TEMP_DIR}:
	mkdir -p $@

${NEXTJS_DATA_DIR}:
	mkdir -p $@
	chmod -R 777 $@

${DOCKER_COMPOSE_UP_STAMPFILE}: ${DOCKER_COMPOSE_YAML_FILE} | ${TEMP_DIR} ${NEXTJS_DATA_DIR}
	docker compose -f "${DOCKER_COMPOSE_YAML_FILE}" up --build -d
	touch $@

clean:
	docker compose -f "${DOCKER_COMPOSE_YAML_FILE}" stop
	rm -rf ${DOCKER_COMPOSE_UP_STAMPFILE}

fclean: clean
	docker compose -f "${DOCKER_COMPOSE_YAML_FILE}" down

re: fclean all

purge: fclean
	rm -rf ${NEXTJS_DATA_DIR}

nuke: purge
	rm -rf ${ENV_FILE}

save-nextjs: | ${NEXTJS_SAVES_DIR} ${NEXTJS_DATA_DIR}/app ${NEXTJS_DATA_DIR}/public
	cp -r ${NEXTJS_DATA_DIR}/app/* ${NEXTJS_SAVES_DIR}/app/ || true
	cp -r ${NEXTJS_DATA_DIR}/public/* ${NEXTJS_SAVES_DIR}/public/ || true
	chmod -R 777 ${NEXTJS_SAVES_DIR}

${NEXTJS_SAVES_DIR}:
	mkdir -p $@

.PHONY: all clean fclean re purge nuke save-nextjs ${name}
