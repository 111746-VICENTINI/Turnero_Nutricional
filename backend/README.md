# Turnero Nutricional Backend

Minimal JWT login/roles setup for Spring Boot + MySQL.

## Prerequisites
- Java 17
- MySQL running

## Quick start
1. Set the JWT secret (at least 32 chars).
2. Run the application.

```powershell
$env:JWT_SECRET="ChangeThisSecretKeyAtLeast32Chars";
.\mvnw spring-boot:run
```

## Default admin user
- username: `admin`
- password: `Admin123!`

## Endpoints
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/password/forgot`
- `POST /api/v1/auth/password/reset`

Role-protected examples:
- `GET /api/v1/admin/dashboard` (ADMIN)
- `GET /api/v1/secretary/dashboard` (SECRETARY)
- `GET /api/v1/professional/dashboard` (PROFESSIONAL)

Admin management:
- `POST /api/v1/admin/users`
- `GET /api/v1/admin/users`
- `POST /api/v1/admin/roles`
- `GET /api/v1/admin/roles`

