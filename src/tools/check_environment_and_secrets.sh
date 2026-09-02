#!/usr/bin/env sh

set -eu

OPENSSL_RANDOM_PASSWORD_LENGTH=30
DOCKER_COMPOSE_DIR="$1"
ENV_EXAMPLE_PATH="$2"
SECRETS_DIR_PATH="$3"
ENV_FILE="${DOCKER_COMPOSE_DIR}/.env"

clean_up() {
  stty echo
}

trap clean_up EXIT INT TERM HUP

# This script used for generating prompt to user
# so they can easily setup and deploy the web application
# on their machine

# all path specified in this script is based on
# where it's being called
# this script was made to called by Makefile of
# this particular project. Hence all the relative paths
# should be base from the main docker-compose.yml direcotory
# because all the environments and secrets will be used
# by docker compose 


# we will use cd to have the same path as the 
# docker compose file first
printf "==================================\n"
printf "CHECK ENV AND SECRETS\n"

AUTOMATIC_INSTALL=0

printf "
This script will setup environments and secrets
required for this project.

Would u like to automaticaly setup?
- manually setup will ask you all the environment variable
and secrets.
- automatically setup will automatically use the default
values from .env.example file and randomly generate
password in secrets
yes(y) or no(n): "
read -r user_input || true
user_input="${user_input:-y}"

if [ "${user_input}" = "YES" ] || [ "${user_input}" = "Y" ] || [ "${user_input}" = "y" ] || [ "${user_input}" = "yes" ]; then
  AUTOMATIC_INSTALL=1
fi

if [ "${user_input}" = "NO" ] || [ "${user_input}" = "N" ] || [ "${user_input}" = "n" ] || [ "${user_input}" = "no" ]; then
  AUTOMATIC_INSTALL=0
fi



printf "script working directory: ${DOCKER_COMPOSE_DIR} \n"

if [ ! -f "${ENV_EXAMPLE_PATH}" ]; then
  printf "the env example: ${ENV_EXAMPLE_PATH} is required to build and check the .env\n"
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  touch "${ENV_FILE}"
fi

mkdir -p ${SECRETS_DIR_PATH}

# check if the port value is correct
check_port_function() {
  local port_num="$1"

  if [ -z "${port_num}" ]; then
    printf "check_port_function:: argument cannot empty\n" >&2
    return 1
  fi

  case "${port_num}" in
    ''|*[!0-9]*)
      printf "check_port_function:: ${port_num}::must be only digit\n" >&2
      return 1
      ;;
    *)
      return 0
      ;;
  esac
  return 0
}

check_normal_value_function() {
  local normal_value="$1"

  if [ -z "${normal_value}" ]; then
    printf "check_normal_value_function(): value must not empty\n" >&2
    return 1
  fi
  return 0
}

# find key in the .env file, error if not found
# or found duplicate same keys
find_key() {
  local the_env_path="$1"
  local key_to_find="$2"

  local count_key=$(grep -c "^${key_to_find}=" "${the_env_path}" 2>/dev/null || true)

  if [ "${count_key}" = 0 ]; then
    printf "find_key() ${key_to_find} in ${the_env_path}: not Found\n" >&2
    return 1
  fi
  
  if [ "${count_key}" = 1 ]; then
    printf "${key_to_find} found in ${the_env_path}\n"
  else
    printf "find_key() ${key_to_find} in ${the_env_path}: duplicate same keys is not allowed \n" >&2
    return 1
  fi

  return 0
}

USER_INPUT_OUT=""
check_env() {
  local in_key="$1"
  local in_value="$2"
  local check_value_function="$3"
  local retry_amount=4
  local retry_count=0
  local need_user_input=1
  local will_replace=0

  if find_key "${ENV_FILE}" "${in_key}"; then
    local env_line_read=$(grep -P "^${in_key}=.*$" "${ENV_FILE}")

    local env_line_value="${env_line_read#*=}"
    if ! ${check_value_function} "${env_line_value}"; then
      printf "key ${in_key} in .env file has invalid value\n"
      need_user_input=1
      will_replace=1
    else
      need_user_input=0
      will_replace=0
      USER_INPUT_OUT="${env_line_value}"
    fi
  fi

  if [ "${need_user_input}" = 1 ]; then
    while [ "${retry_count}" -le "${retry_amount}" ]; do
    if [ "${AUTOMATIC_INSTALL}" = 0 ]; then
    printf "Please Enter Your Value (the default value is: ${in_value})
enter empty string for default value\n"

    fi
     if [ "${AUTOMATIC_INSTALL}" = 1 ] && [ -n "${in_value}" ]; then
      user_input="${in_value}"

     else
      printf "${in_key}: "
      read -r user_input < /dev/tty
      if [ -z "${user_input}" ]; then
         if [ -z "${in_value}" ]; then
           printf "this key has no default value, cannot be empty, try again\n"
         else
           user_input="${in_value}"
         fi
      fi
     fi

     if [ -n "${user_input}" ]; then
      if ! ${check_value_function} "${user_input}"; then
        if [ "${retry_count}" = "${retry_amount}" ]; then
           printf "maximum amount of reties.. quiting\n" >&2
           return 1
        else
           printf "Invalid value.. please try again.\n"
        fi
      else
        if [ "${will_replace}" = 0 ]; then
          echo "${in_key}=${user_input}" >> "${ENV_FILE}"
        else
          sed -i -E "s|^(${in_key}=.*$)|\1${user_input}|" "${ENV_FILE}"
        fi
       USER_INPUT_OUT="${user_input}"
       break
      fi
     fi

     retry_count=$((retry_count + 1))
     USER_INPUT_OUT="${user_input}"
    done
  fi

  return 0
}



# some environments pairs with secrets such as name and password
# in which password must stored in secrets 
check_secret() {
  local secret_file_path="$1"
  local password_retry_max=3
  local password_retry_count=0


  if [ ! -f "${secret_file_path}" ]; then
    touch "${secret_file_path}"
  fi

  local password="$(cat ${secret_file_path})"

  while [ "${password_retry_count}" -le "${password_retry_max}" ]; do
    password_retry_count=$((password_retry_count + 1))


    if [ ${#password} -ge 8 ]; then
     # password than longer than 8 characters is allowed
      break
    fi

    if [ ${AUTOMATIC_INSTALL} = 1 ]; then
      printf "auto-generated password by openssl => ${secret_file_path}\n"
      password="$(openssl rand -base64 ${OPENSSL_RANDOM_PASSWORD_LENGTH})"
      break
    else
      printf "Please Enter Password for ${secret_file_path} (leave blank will auto generated using openssl)\n"
      printf "PASSWORD: "
      stty -echo
      read -r user_password_input < /dev/tty
      stty echo
      printf "\n"
      if [ -z "${user_password_input}" ]; then
        password="$(openssl rand -base64 ${OPENSSL_RANDOM_PASSWORD_LENGTH})"
        break
      else
        password="${user_password_input}"
      fi

      if [ ${#password} -lt 8 ]; then
        printf "Password cannot less than 8 characters\n"
      fi
    fi
  done

  if [ ${#password} -lt 8 ]; then
   # password than longer than 8 characters is allowed
   printf "failed to password => ${secret_file_path} \n" >&2
   return 1
  fi

  echo "${password}" > "${secret_file_path}"
}

line_count=0
while IFS= read -r line <&3 || [ -n "$line" ]; do
  line_count=$((line_count + 1))

  # only check if line is not an empty line
  if printf "%s\n" "${line}" | grep -Pq "^[[:space:]]*$"; then
    continue
  fi

  key=""
  value=""


  if printf "${line}" | grep -Pq "^[[:space:]]*#"; then
    printf "${line}\n"
  else
    if printf "${line}" | grep -Pq "^[[:space:]]+.*$"; then
      printf "line ${line_count}:: wrong format, key=value must container no trailing space\n" 1>&2
      exit 1
    fi

    key="${line%%=*}"
    value="${line#*=}"

    if [ -z "${key}" ]; then
      printf "line ${line_count}:: key is not found in this line\n" 1>&2
      exit 1
    fi

    # various checks based on each key
    if printf "${key}" | grep -qP "PORT"; then
      check_env "${key}" "${value}" "check_port_function"

    elif printf "${key}" | grep -qP "^DOCKER_SOCKET_PATH"; then
    # for DOCKER_SOCKET_PATH require specific treatment

      # need to check first if .env already has this key or not
      will_replace=0
      if find_key "${ENV_FILE}" "${key}"; then
        will_replace=1
      fi

      current_docker_socket_path="$(docker context inspect --format '{{.Endpoints.docker.Host}}' | cut -c 8-)"
      if [ "${will_replace}" = 0 ]; then
        echo "${key}=${current_docker_socket_path}" >> "${ENV_FILE}"
      else
        sed -i -E "s|(^${key}=).*$|\1${current_docker_socket_path}|" "${ENV_FILE}"
      fi
    
  
    elif printf "${key}" | grep -qP "^.*SECRET_FILENAME"; then
    # this will promt user to type the password or auto generate the password
    # using openssl
      check_env "${key}" "${value}" "check_normal_value_function"

      # then we get the value from the check_env that is the file name
      # and append like this
      combined_secret_path="${SECRETS_DIR_PATH}/${USER_INPUT_OUT}"

      check_secret "${combined_secret_path}"
       


    # we can use elif for each specific key that requires specific operation
    else
      check_env "${key}" "${value}" "check_normal_value_function"
    fi

  fi
done 3< "${ENV_EXAMPLE_PATH}"
