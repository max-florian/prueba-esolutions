#!/bin/sh
# Genera config.js a partir de variables de entorno al arrancar el contenedor.
# La imagen nginx ejecuta los scripts de /docker-entrypoint.d/ antes de iniciar.
set -eu

envsubst < "$RUNTIME_CONFIG_TEMPLATE" > "$RUNTIME_CONFIG_OUTPUT"
echo "runtime-config: $RUNTIME_CONFIG_OUTPUT generado"
