#!/usr/bin/env sh

printf "$0\n"
printf "checking prerequisites requires for This project\n"
printf "using 'which' command to check only\n"

checkWhich() {
  commandName="$1"

  if [ -z "${commandName}" ]; then
    printf "checkWhich::Error::commandName is required for this function\n" >&2
    return 1
  fi

  if which "${commandName}" > /dev/null 2>&1 ; then
    printf "command: %s Found\n" "${commandName}"
    return 0
  else
    printf "command: %s Not Found  please install this package \n" "${commandName}"
    return 1
  fi

  return 0
}

checkWhich openssl
checkWhich docker
checkWhich grep
checkWhich sed
checkWhich make
