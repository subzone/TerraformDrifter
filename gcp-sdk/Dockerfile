FROM ghcr.io/opentofu/opentofu as base

FROM gcr.io/google.com/cloudsdktool/google-cloud-cli:latest as target

COPY --from=base /usr/local/bin/tofu /usr/local/bin/tofu
ENTRYPOINT ["/usr/local/bin/tofu"]