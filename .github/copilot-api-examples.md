# API Usage Examples

## Start Scene

```bash
curl -X POST http://localhost:3000/api/control/scene/start/1
```

```typescript
// Response
{ "success": true, "message": "Scene 1 started" }
```

## Get Events

```bash
curl http://localhost:3000/api/control/scene/events
```

```typescript
// Response - events are consumed (removed from queue)
{
  "success": true,
  "data": [
    { "event_type": "LOYLY_THROW", "run_at": 1731695123456 }
  ]
}
```

## Get Status

```bash
curl http://localhost:3000/api/control/status
```

```typescript
{
  "success": true,
  "data": {
    "scene": 1,
    "enabled": true,
    "info": {
      "temp": 85.5,
      "humidity": 45.2,
      "presence": true,
      "loyly": false
    }
  }
}
```

## Purchase Product

```bash
curl -X POST http://localhost:3000/api/owned-products/purchase/user_001/1
```

```typescript
// Response includes new balance
{
  "success": true,
  "data": {
    "transaction": {
      "price_paid": 1299,
      "previous_balance": 10000,
      "new_balance": 8701
    }
  }
}
```

## Get User

```bash
curl http://localhost:3000/api/users/user_001
```

```typescript
{
  "success": true,
  "data": {
    "id": "user_001",
    "username": "demo_user",
    "money": 10000
  }
}
```

## Reset Database

```bash
curl -X POST http://localhost:3000/api/database/reset
```

## Restart Backend

```bash
cd saunachimp && docker compose restart backend
```

