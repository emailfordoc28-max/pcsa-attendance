# PCSA Attendance Deployment

Deployment is configured from the repository root in `render.yaml`. It defines the API and frontend services.

During Render setup, provide the MongoDB Atlas URL, frontend/API URLs, and Google OAuth client ID as service environment variables. Keep database credentials and email-provider keys in Render's environment settings; do not add them to the repository. Email sending also requires a verified sender address and ZeptoMail API key.
