FROM    alpine:3.22 AS base

RUN     apk update \
        && apk install -y --no-install-recommends \
        rm -rf /var/lib/apt/lists/*
        