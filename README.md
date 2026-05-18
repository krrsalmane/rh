# Maya HR Platform

A centralised HRMS web application for managing documents, employees, time records, absences, leave, notifications, and admin workflows.

## Docker Quick Start

The repository now includes a Docker Compose setup for the frontend, backend, and MySQL database.

### Start the stack

```bash
docker compose up --build
```

### Services

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- MySQL: localhost:3307

### Default seeded login

- Email: admin@hrms.com
- Password: Admin@1234

### Notes

- Backend migrations and seed files run automatically when the backend container starts.
- Uploaded documents are stored in a persistent Docker volume.
- If you want to use different secrets or ports, override the defaults in your shell before running Compose.
