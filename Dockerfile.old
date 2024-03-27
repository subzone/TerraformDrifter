FROM ghcr.io/opentofu/opentofu as base

FROM mcr.microsoft.com/azure-cli as target
COPY --from=base /usr/local/bin/tofu /usr/local/bin/tofu
ENTRYPOINT ["/usr/local/bin/tofu"]