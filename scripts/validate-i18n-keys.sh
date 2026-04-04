#!/usr/bin/env bash
# Thin wrapper — delegates to the Node.js ESM implementation
exec node scripts/validate-i18n-keys.mjs "$@"
