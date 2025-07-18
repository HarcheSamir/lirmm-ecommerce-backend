# Use a base Jenkins agent image
FROM jenkins/agent:latest

# Switch to root user to install packages
USER root

# Install necessary dependencies for Docker, kubectl, and kind
RUN apt-get update && apt-get install -y \
    gettext \
    curl \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release --no-install-recommends

# Install Docker CLI
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
RUN echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
RUN apt-get update && apt-get install -y docker-ce-cli

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install kind
RUN curl -Lo ./kind "https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64" && \
    chmod +x ./kind && \
    mv ./kind /usr/local/bin/kind

# Clean up apt cache
RUN rm -rf /var/lib/apt/lists/*

# Switch back to the jenkins user
USER jenkins