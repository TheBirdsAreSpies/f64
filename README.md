# f64 Photo Gallery

A modern photo management application inspired by Koken, built with Nuxt 4, Nuxt UI 4, and MariaDB.

# Docker local tests
`docker build --build-arg DATABASE_URL="mysql://root:password@localhost:3306/f64" -t f64:test .`

```docker
docker run --rm -p 3000:3000 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_USER=root \
  -e DATABASE_PASSWORD=password \
  -e DATABASE_NAME=f64 \
  -e DATABASE_URL="mysql://root:password@host.docker.internal:3306/f64" \
  -e NUXT_SESSION_PASSWORD="your-32-character-session-password-here" \
  -e RUN_SEED=true \
  f64:test
```

## Features

### Admin Features ✅
- Dashboard with statistics and quick actions
- Upload photos with metadata
- Create and manage albums
- Tag system for albums and photos
- Photo visibility controls (public/private)
- Album visibility (public/private/password-protected)
- Granular permission system

### Public Features ✅
- Browse albums
- View photos with lightbox
- Like photos (registered users)
- Comment on photos (registered users)
- User registration with email verification
- Responsive image loading

## Setup

1. Install dependencies:
```bash
bun install
```

2. Configure environment variables in `.env` - check `env_example` for all needed variables.
```env
DATABASE_URL="mysql://user:password@localhost:3306/f64"
NUXT_SESSION_PASSWORD="your-32-character-secret-key"
```

3. Push database schema:
```bash
bun run prisma:push
```

4. Seed database (creates admin user):
```bash
bun run prisma:seed
```

Default admin credentials:
- Email: `admin@f64.com`
- Password: `test`

Default user credentials:
- Email: `user@f64.com`
- Password: `test`
