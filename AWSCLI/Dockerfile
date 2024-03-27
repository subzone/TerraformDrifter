FROM ghcr.io/opentofu/opentofu as base

FROM public.ecr.aws/aws-cli/aws-cli:latest as target
COPY --from=base /usr/local/bin/tofu /usr/local/bin/tofu
ENTRYPOINT ["/usr/local/bin/tofu"]