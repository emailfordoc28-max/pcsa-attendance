# PCSA Attendance App

Geo-location attendance app for Patanjali Civil Services Academy.

## Project folders

- `frontend/` — React web app and installable mobile PWA.
- `backend/` — Express API and MongoDB connection.

## Deployment

The root `render.yaml` defines the frontend and API services. Render will ask for these values during setup:

- `MONGO_URL` — MongoDB Atlas connection string (keep this private; enter it in Render only).
- `CLIENT_ORIGINS` — the frontend's public URL, with no trailing slash.
- `REACT_APP_URL` — the API's public URL ending in `/api`.
- `REACT_APP_GOOGLE_CLIENT_ID` — Google OAuth web client ID.

Do not add `.env` files, certificates, or database credentials to GitHub.
