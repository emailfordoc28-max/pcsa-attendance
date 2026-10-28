# Attendance app on your Wi-Fi

Your Mac's current Wi-Fi address is `192.168.1.8`. The normal servers on ports 3000 and 5000 stay available for the Mac. The LAN versions use HTTPS on ports 3001 and 5001.

## Start the Wi-Fi versions

In one Terminal window:

```sh
cd /Users/ramanyadav/Downloads/geo-location-backend-main
npm run start:lan
```

In a second Terminal window:

```sh
cd /Users/ramanyadav/Downloads/geo-location-attendance-frontend-nishant-main
npm run start:lan
```

Students open `https://192.168.1.8:3001` while connected to the same Wi-Fi.

## Allow phone location access

Phone browsers require HTTPS for location. Before opening the app, install and trust `certs/attendance-ca.crt` on each test phone. Do not share `attendance-ca.key` or `attendance-lan.key`.

- **iPhone:** AirDrop the `.crt` file to the phone and install the downloaded profile in Settings. Then open **Settings → General → About → Certificate Trust Settings** and enable full trust for **Geo Attendance LAN Development CA**.
- **Android:** transfer the `.crt` file, then use **Settings → Security & privacy → More security settings → Encryption & credentials → Install a certificate → CA certificate**. Android menu names vary by phone. Confirm the certificate installation on the phone.

After trust is enabled, open the HTTPS address and allow location access when the browser asks. If macOS asks whether Node may accept incoming connections, allow it for the local development server.

This certificate is only for local testing. The CA private key stays on the Mac in the ignored `certs/` folder. If your Wi-Fi address changes, regenerate the certificate for the new address and update the LAN URL.
