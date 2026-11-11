#!/usr/bin/env sh

set -eu

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <target_server_key_path> <target_server_crt_path> [common_name]" >&2
    exit 1
fi

TARGET_SERVER_KEY_PATH="${1}"
TARGET_SERVER_CRT_PATH="${2}"
COMMON_NAME="${3:-localhost}"
DAYS_VALID="${DAYS_VALID:-365}"
# Set ENABLE_PQC_CERT=1 only if the client & server explicitly support pure ML-DSA leaf certs
ENABLE_PQC_CERT="${ENABLE_PQC_CERT:-0}"

# Exit early if both key and certificate already exist
if [ -f "${TARGET_SERVER_KEY_PATH}" ] && [ -f "${TARGET_SERVER_CRT_PATH}" ]; then
    echo "[INFO] Key (${TARGET_SERVER_KEY_PATH}) and Certificate (${TARGET_SERVER_CRT_PATH}) already exist. Skipping."
    exit 0
fi

mkdir -p "$(dirname "${TARGET_SERVER_KEY_PATH}")"
mkdir -p "$(dirname "${TARGET_SERVER_CRT_PATH}")"

supports_ec_curve() {
    curve="$1"
    openssl genpkey -algorithm EC -pkeyopt "ec_paramgen_curve:${curve}" -out /dev/null >/dev/null 2>&1
}

supports_algorithm() {
    alg="$1"
    openssl genpkey -algorithm "${alg}" -out /dev/null >/dev/null 2>&1
}

# Generate private key if it does not exist
if [ ! -f "${TARGET_SERVER_KEY_PATH}" ]; then
    echo "[INFO] Detecting OpenSSL capabilities ($(openssl version))..."
    umask 077

    if [ "${ENABLE_PQC_CERT}" = "1" ] && supports_algorithm "ML-DSA-87"; then
        KEY_TYPE="ML-DSA-87 (Post-Quantum NIST Level 5)"
        openssl genpkey -algorithm ML-DSA-87 \
            -out "${TARGET_SERVER_KEY_PATH}"
    elif supports_ec_curve "P-384"; then
        KEY_TYPE="ECDSA P-384 (CNSA 2.0 / Browser Gold Standard)"
        openssl genpkey -algorithm EC \
            -pkeyopt ec_paramgen_curve:P-384 \
            -pkeyopt ec_param_enc:named_curve \
            -out "${TARGET_SERVER_KEY_PATH}"
    elif supports_ec_curve "P-256"; then
        KEY_TYPE="ECDSA P-256 (Universal ECC)"
        openssl genpkey -algorithm EC \
            -pkeyopt ec_paramgen_curve:P-256 \
            -pkeyopt ec_param_enc:named_curve \
            -out "${TARGET_SERVER_KEY_PATH}"
    else
        KEY_TYPE="RSA-4096 (Legacy Fallback)"
        openssl genpkey -algorithm RSA \
            -pkeyopt rsa_keygen_bits:4096 \
            -out "${TARGET_SERVER_KEY_PATH}"
    fi

    echo "[INFO] Generated private key using ${KEY_TYPE} -> ${TARGET_SERVER_KEY_PATH}"
else
    echo "[INFO] Private key already exists at ${TARGET_SERVER_KEY_PATH}. Reusing key."
fi

# Generate self-signed X.509 certificate if it does not exist
if [ ! -f "${TARGET_SERVER_CRT_PATH}" ]; then
    echo "[INFO] Generating self-signed certificate -> ${TARGET_SERVER_CRT_PATH}"

    if openssl req -help 2>&1 | grep -q -- "-addext"; then
        openssl req -new -x509 -sha384 \
            -key "${TARGET_SERVER_KEY_PATH}" \
            -out "${TARGET_SERVER_CRT_PATH}" \
            -days "${DAYS_VALID}" \
            -subj "/CN=${COMMON_NAME}" \
            -addext "subjectAltName=DNS:${COMMON_NAME},DNS:localhost,IP:127.0.0.1,IP:::1" \
            -addext "basicConstraints=critical,CA:FALSE" \
            -addext "keyUsage=critical,digitalSignature" \
            -addext "extendedKeyUsage=serverAuth"
    else
        openssl req -new -x509 -sha384 \
            -key "${TARGET_SERVER_KEY_PATH}" \
            -out "${TARGET_SERVER_CRT_PATH}" \
            -days "${DAYS_VALID}" \
            -subj "/CN=${COMMON_NAME}"
    fi

    chmod 0644 "${TARGET_SERVER_CRT_PATH}"
    echo "[INFO] Successfully generated certificate at ${TARGET_SERVER_CRT_PATH}"
fi
