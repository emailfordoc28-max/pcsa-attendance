#!/bin/bash
set -euo pipefail

lan_ip="${1:-$(ipconfig getifaddr en0 2>/dev/null || true)}"
if [[ -z "$lan_ip" ]]; then
  echo "Could not find the Mac Wi-Fi address. Pass it as an argument, for example: npm run setup:lan-https -- 192.168.1.8" >&2
  exit 1
fi

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cert_dir="$project_dir/certs"
mkdir -p "$cert_dir"
chmod 700 "$cert_dir"

if [[ -e "$cert_dir/attendance-ca.key" || -e "$cert_dir/attendance-lan.key" ]]; then
  echo "Local HTTPS certificates already exist in $cert_dir. Move the old certs aside before regenerating them." >&2
  exit 1
fi

cat > "$cert_dir/ca.cnf" <<'EOF'
[req]
distinguished_name = dn
x509_extensions = v3_ca
prompt = no
[dn]
CN = Geo Attendance LAN Development CA
[v3_ca]
basicConstraints = critical,CA:TRUE
keyUsage = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash
EOF

cat > "$cert_dir/lan.ext" <<EOF
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = IP:$lan_ip,DNS:localhost,IP:127.0.0.1
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
EOF

openssl genrsa -out "$cert_dir/attendance-ca.key" 3072
openssl req -x509 -new -key "$cert_dir/attendance-ca.key" -sha256 -days 3650 \
  -config "$cert_dir/ca.cnf" -out "$cert_dir/attendance-ca.crt"
openssl genrsa -out "$cert_dir/attendance-lan.key" 2048
openssl req -new -key "$cert_dir/attendance-lan.key" -subj "/CN=$lan_ip" \
  -out "$cert_dir/attendance-lan.csr"
openssl x509 -req -in "$cert_dir/attendance-lan.csr" \
  -CA "$cert_dir/attendance-ca.crt" -CAkey "$cert_dir/attendance-ca.key" \
  -CAcreateserial -out "$cert_dir/attendance-lan.crt" -days 825 -sha256 \
  -extfile "$cert_dir/lan.ext"

chmod 600 "$cert_dir/attendance-ca.key" "$cert_dir/attendance-lan.key"
chmod 644 "$cert_dir/attendance-ca.crt" "$cert_dir/attendance-lan.crt"
echo "Created local HTTPS files for https://$lan_ip:3000"
echo "Only share attendance-ca.crt with devices that need to trust this local app. Never share either .key file."
