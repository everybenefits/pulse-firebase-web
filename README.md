# @everybenefits/firebase-web

Firebase callables, mappers, and query helpers for Pulse web clients.

For User / Org / Roles product operations, prefer **`@everybenefits/client`**
(`createPulseClient`) — see ADR-014 in pulse-web. This package remains the
transport layer (`callCloudFunction`, profile mappers, `watchRolePermissions`).
`createAdminRepository` / `createAgencyRepository` stay available here for one
minor version; new apps should import them from `@everybenefits/client`.

## Install

```ini
# .npmrc
@everybenefits:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

```bash
pnpm add @everybenefits/firebase-web@^0.1.0
```

## Publish

Tag `v*` triggers GitHub Actions publish to GitHub Packages.
