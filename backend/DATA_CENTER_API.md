# Data Center API Endpoints

Complete CRUD (Create, Read, Update, Delete) API endpoints for Client, DataUser, Transaction, and TransactionalData models.

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

---

## Client Endpoints

### Create Client
**POST** `/api/clients`

**Request Body:**
```json
{
  "business_name": "ABC Company",
  "address": "123 Main St, City",
  "email": "contact@abc.com",
  "mobile": "1234567890",
  "is_active": true,         // optional, default: false
  "modules": "premium"        // optional, default: "basic"
}
```

**Response:** `201 Created`
```json
{
  "message": "Client created successfully",
  "client": {
    "id": "uuid-here",
    "business_name": "ABC Company",
    "address": "123 Main St, City",
    "email": "contact@abc.com",
    "mobile": "1234567890",
    "is_active": true,
    "modules": "premium",
    "created_at": "2026-01-30T12:00:00"
  }
}
```

### Get All Clients
**GET** `/api/clients`

**Response:** `200 OK`
```json
{
  "clients": [
    {
      "id": "uuid-here",
      "business_name": "ABC Company",
      "address": "123 Main St, City",
      "email": "contact@abc.com",
      "mobile": "1234567890",
      "is_active": true,
      "modules": "premium",
      "created_at": "2026-01-30T12:00:00"
    }
  ]
}
```

### Get Single Client
**GET** `/api/clients/<client_id>`

**Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "business_name": "ABC Company",
  "address": "123 Main St, City",
  "email": "contact@abc.com",
  "mobile": "1234567890",
  "is_active": true,
  "modules": "premium",
  "created_at": "2026-01-30T12:00:00"
}
```

### Update Client
**PUT** `/api/clients/<client_id>`

**Request Body:** (all fields optional)
```json
{
  "business_name": "ABC Corporation",
  "address": "456 New St, City",
  "email": "new@abc.com",
  "mobile": "9876543210",
  "is_active": false,
  "modules": "enterprise"
}
```

**Response:** `200 OK`
```json
{
  "message": "Client updated successfully",
  "client": { ... }
}
```

### Delete Client
**DELETE** `/api/clients/<client_id>`

**Response:** `200 OK`
```json
{
  "message": "Client deleted successfully"
}
```

---

## DataUser Endpoints

### Create DataUser
**POST** `/api/data-users`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123",
  "client_id": "client-uuid-here",
  "is_active": true              // optional, default: false
}
```

**Response:** `201 Created`
```json
{
  "message": "Data user created successfully",
  "user": {
    "id": "uuid-here",
    "username": "john_doe",
    "client_id": "client-uuid-here",
    "is_active": true,
    "created_at": "2026-01-30T12:00:00"
  }
}
```

### Get All DataUsers
**GET** `/api/data-users`

**Query Parameters:**
- `client_id` (optional) - Filter by client

**Example:** `/api/data-users?client_id=uuid-here`

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "uuid-here",
      "username": "john_doe",
      "client_id": "client-uuid-here",
      "is_active": true,
      "created_at": "2026-01-30T12:00:00"
    }
  ]
}
```

### Get Single DataUser
**GET** `/api/data-users/<user_id>`

**Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "username": "john_doe",
  "client_id": "client-uuid-here",
  "is_active": true,
  "created_at": "2026-01-30T12:00:00"
}
```

### Update DataUser
**PUT** `/api/data-users/<user_id>`

**Request Body:** (all fields optional)
```json
{
  "username": "jane_doe",
  "password": "newpassword123",
  "is_active": false,
  "client_id": "new-client-uuid"
}
```

**Response:** `200 OK`
```json
{
  "message": "Data user updated successfully",
  "user": { ... }
}
```

### Delete DataUser
**DELETE** `/api/data-users/<user_id>`

**Response:** `200 OK`
```json
{
  "message": "Data user deleted successfully"
}
```

---

## Transaction Endpoints

### Create Transaction
**POST** `/api/transactions`

**Request Body:**
```json
{
  "client_id": "client-uuid-here",
  "user_id": "user-uuid-here",
  "price": 150.50,
  "latitude": 40.7128,           // optional
  "longitude": -74.0060          // optional
}
```

**Response:** `201 Created`
```json
{
  "message": "Transaction created successfully",
  "transaction": {
    "id": "uuid-here",
    "client_id": "client-uuid-here",
    "user_id": "user-uuid-here",
    "price": 150.50,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "created_at": "2026-01-30T12:00:00"
  }
}
```

### Get All Transactions
**GET** `/api/transactions`

**Query Parameters:**
- `client_id` (optional) - Filter by client
- `user_id` (optional) - Filter by user

**Example:** `/api/transactions?client_id=uuid-here&user_id=uuid-here`

**Response:** `200 OK`
```json
{
  "transactions": [
    {
      "id": "uuid-here",
      "client_id": "client-uuid-here",
      "user_id": "user-uuid-here",
      "price": 150.50,
      "latitude": 40.7128,
      "longitude": -74.0060,
      "created_at": "2026-01-30T12:00:00"
    }
  ]
}
```

### Get Single Transaction
**GET** `/api/transactions/<transaction_id>`

**Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "client_id": "client-uuid-here",
  "user_id": "user-uuid-here",
  "price": 150.50,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "created_at": "2026-01-30T12:00:00"
}
```

### Update Transaction
**PUT** `/api/transactions/<transaction_id>`

**Request Body:** (all fields optional)
```json
{
  "price": 200.00,
  "latitude": 41.0000,
  "longitude": -75.0000,
  "client_id": "new-client-uuid",
  "user_id": "new-user-uuid"
}
```

**Response:** `200 OK`
```json
{
  "message": "Transaction updated successfully",
  "transaction": { ... }
}
```

### Delete Transaction
**DELETE** `/api/transactions/<transaction_id>`

**Response:** `200 OK`
```json
{
  "message": "Transaction deleted successfully"
}
```

---

## TransactionalData Endpoints

### Create TransactionalData
**POST** `/api/transactional-data`

**Request Body:**
```json
{
  "transaction_id": "transaction-uuid-here",
  "item_name": "Product ABC",
  "item_type": "electronics",
  "quantity": 5
}
```

**Response:** `201 Created`
```json
{
  "message": "Transactional data created successfully",
  "data": {
    "id": "uuid-here",
    "transaction_id": "transaction-uuid-here",
    "item_name": "Product ABC",
    "item_type": "electronics",
    "quantity": 5
  }
}
```

### Get All TransactionalData
**GET** `/api/transactional-data`

**Query Parameters:**
- `transaction_id` (optional) - Filter by transaction

**Example:** `/api/transactional-data?transaction_id=uuid-here`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid-here",
      "transaction_id": "transaction-uuid-here",
      "item_name": "Product ABC",
      "item_type": "electronics",
      "quantity": 5
    }
  ]
}
```

### Get Single TransactionalData
**GET** `/api/transactional-data/<data_id>`

**Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "transaction_id": "transaction-uuid-here",
  "item_name": "Product ABC",
  "item_type": "electronics",
  "quantity": 5
}
```

### Update TransactionalData
**PUT** `/api/transactional-data/<data_id>`

**Request Body:** (all fields optional)
```json
{
  "item_name": "Product XYZ",
  "item_type": "clothing",
  "quantity": 10,
  "transaction_id": "new-transaction-uuid"
}
```

**Response:** `200 OK`
```json
{
  "message": "Transactional data updated successfully",
  "data": { ... }
}
```

### Delete TransactionalData
**DELETE** `/api/transactional-data/<data_id>`

**Response:** `200 OK`
```json
{
  "message": "Transactional data deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Field 'business_name' is required"
}
```

### 401 Unauthorized
```json
{
  "msg": "Missing Authorization Header"
}
```

### 404 Not Found
```json
{
  "error": "Client not found"
}
```

### 409 Conflict
```json
{
  "error": "Business name already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database error message"
}
```

---

## Testing the API

### Using curl

**Login to get token:**
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

**Create a client:**
```bash
curl -X POST http://localhost:5000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "business_name": "Test Company",
    "address": "123 Test St",
    "email": "test@test.com",
    "mobile": "1234567890"
  }'
```

**Get all clients:**
```bash
curl -X GET http://localhost:5000/api/clients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman or Insomnia

1. **Login** to get access token
2. Add **Authorization** header: `Bearer <token>`
3. Send requests to the appropriate endpoints

---

## Notes

- All endpoints require JWT authentication
- UUIDs are automatically generated for new records
- Timestamps are automatically set on creation
- Foreign key relationships are validated
- Duplicate checks are performed for unique fields
- All responses return JSON format
- Database transactions are rolled back on errors
