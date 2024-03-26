FROM ghcr.io/opentofu/opentofu
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
ENTRYPOINT ["/usr/local/bin/tofu"]