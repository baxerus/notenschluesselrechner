FROM node:20

ARG TZ
ENV TZ="$TZ"

# Install basic development tools
RUN apt-get update \
&& apt-get install -y --no-install-recommends \
    less \
    git \
    procps \
    sudo \
    fzf \
    zsh \
    man-db \
    unzip \
    gnupg2 \
    gh \
    jq \
    nano \
    vim \
&& apt-get clean \
&& rm -rf /var/lib/apt/lists/*

# Ensure default node user has access to /usr/local/share
RUN mkdir -p /usr/local/share/npm-global \
&& chown -R node:node /usr/local/share

ARG USERNAME=node

# Persist bash history.
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
&& mkdir /commandhistory \
&& touch /commandhistory/.bash_history \
&& chown -R $USERNAME /commandhistory

# Set `DEVCONTAINER` environment variable to help with orientation
ENV DEVCONTAINER=true

# Create workspace and config directories and set permissions
RUN mkdir -p /workspace /home/node/.opencode \
&& chown -R node:node /workspace /home/node/.opencode

WORKDIR /workspace

ARG GIT_DELTA_VERSION=0.18.2
RUN ARCH=$(dpkg --print-architecture) \
&& wget "https://github.com/dandavison/delta/releases/download/${GIT_DELTA_VERSION}/git-delta_${GIT_DELTA_VERSION}_${ARCH}.deb" \
&& sudo dpkg -i "git-delta_${GIT_DELTA_VERSION}_${ARCH}.deb" \
&& rm "git-delta_${GIT_DELTA_VERSION}_${ARCH}.deb"

# Install playwright-cli globally
RUN npm --verbose install --global \
  playwright \
  @playwright/cli@latest

# Install Chrome browser for playwright-cli
# (It seems like other browsers like "webkit" do not work with "playwright-cli" in the moment)
RUN npx --verbose --yes playwright install --with-deps chrome
ENV PLAYWRIGHT_MCP_BROWSER=chrome
ENV PLAYWRIGHT_MCP_SANDBOX=false

# Install playwright-cli skills to .opencode folder
RUN mkdir -p /tmp/playwright-cli-skills \
&& cd /tmp/playwright-cli-skills/ \
&& playwright-cli install --skills \
&& mkdir -p /home/node/.opencode/skills \
&& mv /tmp/playwright-cli-skills/.claude/skills/playwright-cli /home/node/.opencode/skills/ \
&& rm -rf /tmp/playwright-cli-skills

# Set up non-root user
USER node

# Install global packages
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# Set the default shell to zsh rather than sh
ENV SHELL=/bin/zsh

# Set the default editor and visual
ENV EDITOR=nano
ENV VISUAL=nano

# Default powerline10k theme
ARG ZSH_IN_DOCKER_VERSION=1.2.1
RUN sh -c "$(wget -O- https://github.com/deluan/zsh-in-docker/releases/download/v${ZSH_IN_DOCKER_VERSION}/zsh-in-docker.sh)" -- \
  -p git \
  -p fzf \
  -a "source /usr/share/doc/fzf/examples/key-bindings.zsh" \
  -a "source /usr/share/doc/fzf/examples/completion.zsh" \
  -a "export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
  -x

# Install OpenCode
ARG OPENCODE_VERSION=latest
RUN npm --verbose install --global opencode-ai@${OPENCODE_VERSION}

# Install Get Shit Done Plugin for OpenCode
ARG GSD_VERSION=latest
RUN npx --verbose --yes get-shit-done-cc@${GSD_VERSION} --opencode --global
