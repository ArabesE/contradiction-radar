#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/contradiction-radar"
SERVICE_USER="contradiction-radar"
ENV_SOURCE="${1:-}"
NODE_VERSION="24.18.0"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer as root." >&2
  exit 1
fi

if [[ ! -f "${APP_DIR}/package-lock.json" ]]; then
  echo "Clone the repository to ${APP_DIR} before running this installer." >&2
  exit 1
fi

if [[ -z "${ENV_SOURCE}" || ! -f "${ENV_SOURCE}" ]]; then
  echo "Pass the path to the securely transferred environment file." >&2
  exit 1
fi

if [[ "$(uname -m)" != "x86_64" ]]; then
  echo "This deployment profile is pinned to an x86_64 VM." >&2
  exit 1
fi

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates curl git xz-utils

NODE_ROOT="/usr/local/lib/node-v${NODE_VERSION}-linux-x64"
if [[ ! -x "${NODE_ROOT}/bin/node" ]]; then
  work_dir="$(mktemp -d)"
  trap 'rm -rf "${work_dir}"' EXIT
  archive="node-v${NODE_VERSION}-linux-x64.tar.xz"
  curl --fail --silent --show-error --location "https://nodejs.org/dist/v${NODE_VERSION}/${archive}" --output "${work_dir}/${archive}"
  curl --fail --silent --show-error --location "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt" --output "${work_dir}/SHASUMS256.txt"
  expected="$(awk -v file="${archive}" '$2 == file { print $1 }' "${work_dir}/SHASUMS256.txt")"
  actual="$(sha256sum "${work_dir}/${archive}" | awk '{ print $1 }')"
  if [[ -z "${expected}" || "${actual}" != "${expected}" ]]; then
    echo "Node.js archive checksum verification failed." >&2
    exit 1
  fi
  tar -xJf "${work_dir}/${archive}" -C /usr/local/lib
fi

ln -sfn "${NODE_ROOT}/bin/node" /usr/local/bin/node
ln -sfn "${NODE_ROOT}/bin/npm" /usr/local/bin/npm
ln -sfn "${NODE_ROOT}/bin/npx" /usr/local/bin/npx

if ! id "${SERVICE_USER}" >/dev/null 2>&1; then
  useradd --system --home-dir "${APP_DIR}" --shell /usr/sbin/nologin "${SERVICE_USER}"
fi

install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" -m 0750 "${APP_DIR}/data" "${APP_DIR}/.cache"
install -o root -g "${SERVICE_USER}" -m 0640 "${ENV_SOURCE}" /etc/contradiction-radar.env
ln -sfn /etc/contradiction-radar.env "${APP_DIR}/.env.local"
chown -h "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}/.env.local"
chown -R "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}"

if [[ "$(swapon --show --noheadings | wc -l)" -eq 0 ]]; then
  fallocate -l 2G /swapfile
  chmod 0600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
fi

sudo -u "${SERVICE_USER}" env HOME="${APP_DIR}" /usr/local/bin/npm --prefix "${APP_DIR}" ci
sudo -u "${SERVICE_USER}" env HOME="${APP_DIR}" /usr/local/bin/npm --prefix "${APP_DIR}" run build
sudo -u "${SERVICE_USER}" env HOME="${APP_DIR}" /usr/local/bin/npm --prefix "${APP_DIR}" prune --omit=dev

install -o root -g root -m 0644 "${APP_DIR}/deploy/systemd/contradiction-radar.service" /etc/systemd/system/contradiction-radar.service
install -o root -g root -m 0644 "${APP_DIR}/deploy/systemd/contradiction-radar-watchdog.service" /etc/systemd/system/contradiction-radar-watchdog.service
install -o root -g root -m 0644 "${APP_DIR}/deploy/systemd/contradiction-radar-watchdog.timer" /etc/systemd/system/contradiction-radar-watchdog.timer

cat >/usr/local/sbin/contradiction-radar-watchdog <<'WATCHDOG'
#!/usr/bin/env bash
set -u
cd /opt/contradiction-radar
if ! timeout 60 /usr/local/bin/node dist/scripts/health.js >/dev/null 2>&1; then
  systemctl restart contradiction-radar.service
fi
WATCHDOG
chmod 0755 /usr/local/sbin/contradiction-radar-watchdog

systemctl daemon-reload
systemctl enable --now contradiction-radar.service
systemctl enable --now contradiction-radar-watchdog.timer

echo "Contradiction Radar is installed. Run: systemctl status contradiction-radar.service"
