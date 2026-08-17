# Foundation Health API

ApplyGauge exposes two small public operational endpoints. Neither endpoint implements product
behavior or requires authentication.

## `GET /api/v1/health`

Purpose: process liveness. It verifies that the FastAPI application is running and able to serve an
HTTP request. It does not query PostgreSQL.

Successful response: HTTP 200

```json
{
  "status": "ok"
}
```

## `GET /api/v1/health/ready`

Purpose: service readiness. It opens a SQLAlchemy connection and executes `SELECT 1` against the
configured PostgreSQL database.

Successful response: HTTP 200

```json
{
  "status": "ready"
}
```

When PostgreSQL cannot be reached, the endpoint returns HTTP 503:

```json
{
  "detail": "Database is unavailable."
}
```

## Why both exist

A process may be alive while its required database is unavailable. Liveness answers whether the API
process can respond; readiness answers whether it can currently support database-backed requests.
This distinction supports local diagnosis and future deployment health checks without coupling the
checks to product tables.
