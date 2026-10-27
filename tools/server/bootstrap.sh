#!/usr/bin/env bash
# One-time setup of a fresh Hetzner Ubuntu 24.04 server for Bibi (ADR 0013, docs/runbooks/deploy.md).
# Run as root on the server:  bash bootstrap.sh
# Idempotent: safe to run again. At the end it prints the values for the GitHub `production` environment.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then echo "Run as root" >&2; exit 1; fi

echo "==> System updates and unattended security upgrades"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq unattended-upgrades fail2ban curl ca-certificates
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> SSH: keys only"
cat > /etc/ssh/sshd_config.d/10-bibi.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
sshd -t
# Ubuntu 26.04 starts sshd per connection (ssh.socket), so there may be nothing to reload.
systemctl reload ssh 2> /dev/null || true

echo "==> deploy user: the GitHub runner may only tunnel to Coolify (localhost:8000)"
id deploy > /dev/null 2>&1 || useradd --create-home --shell /usr/sbin/nologin deploy
install -o deploy -g deploy -m 700 -d /home/deploy/.ssh
if [ ! -s /home/deploy/.ssh/authorized_keys ]; then
  key_dir="$(mktemp -d)"
  ssh-keygen -q -t ed25519 -N "" -C github-deploy -f "$key_dir/id"
  echo "restrict,port-forwarding,permitopen=\"localhost:8000\" $(cat "$key_dir/id.pub")" \
    > /home/deploy/.ssh/authorized_keys
  chown deploy:deploy /home/deploy/.ssh/authorized_keys
  chmod 600 /home/deploy/.ssh/authorized_keys
fi

echo "==> Coolify"
if [ ! -d /data/coolify ]; then
  curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
fi

ip="$(curl -fsS -4 https://ifconfig.me)"
echo
if [ -n "${key_dir:-}" ]; then
  echo "DEPLOY_SSH_KEY (copy everything between the dashes; shown once, then deleted):"
  echo "-----"; cat "$key_dir/id"; echo "-----"
  rm -rf "$key_dir"
fi
echo "DEPLOY_HOST: ${ip}"
echo "DEPLOY_SSH_KNOWN_HOSTS: $(ssh-keyscan -t ed25519 localhost 2>/dev/null | sed "s/^localhost/${ip}/")"
echo "Coolify UI (from your Mac): ssh -L 8000:localhost:8000 -L 6001:localhost:6001 -L 6002:localhost:6002 root@${ip}, then open http://localhost:8000"
