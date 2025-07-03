# Next.js API Demo

This project demonstrates how to create API routes in Next.js and call them from the frontend.

## Project Structure

```
app/
├── api/
│   ├── hello/
│   │   └── route.ts          # Basic GET/POST API
│   └── users/
│       └── route.ts          # CRUD operations API
├── api-demo/
│   └── page.tsx              # Basic API demo page
├── users-demo/
│   └── page.tsx              # Users CRUD demo page
└── page.tsx                  # Home page with navigation
```

## API Routes

### 1. Basic API (`/api/hello`)

**GET /api/hello**
- Returns a simple greeting message
- Response: `{ message: "Hello from the API!", timestamp: "..." }`

**POST /api/hello**
- Accepts JSON data and echoes it back
- Request body: `{ message: "your message" }`
- Response: `{ message: "Data received successfully!", receivedData: {...}, timestamp: "..." }`

### 2. Users API (`/api/users`)

**GET /api/users**
- Returns all users
- Response: `{ users: [...] }`

**POST /api/users**
- Creates a new user
- Request body: `{ name: "John Doe", email: "john@example.com" }`
- Response: `{ message: "User created successfully", user: {...} }`

**PUT /api/users**
- Updates an existing user
- Request body: `{ id: 1, name: "Updated Name", email: "updated@example.com" }`
- Response: `{ message: "User updated successfully", user: {...} }`

**DELETE /api/users?id=1**
- Deletes a user by ID
- Query parameter: `id` (user ID)
- Response: `{ message: "User deleted successfully", user: {...} }`

## How to Create API Routes

1. **Create the directory structure**: `app/api/your-endpoint/`
2. **Create a `route.ts` file** in that directory
3. **Export HTTP method functions**:

```typescript
import { NextRequest, NextResponse } from 'next/server';

// GET request
export async function GET() {
  return NextResponse.json({ message: 'Hello!' });
}

// POST request
export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}

// PUT request
export async function PUT(request: NextRequest) {
  // Handle PUT logic
}

// DELETE request
export async function DELETE(request: NextRequest) {
  // Handle DELETE logic
}
```

## How to Call APIs from Frontend

### Using fetch() (Recommended)

```typescript
// GET request
const response = await fetch('/api/hello');
const data = await response.json();

// POST request
const response = await fetch('/api/hello', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: 'Hello!' }),
});
const data = await response.json();

// DELETE request with query parameters
const response = await fetch('/api/users?id=1', {
  method: 'DELETE',
});
const data = await response.json();
```

### Using React hooks

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hello');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      {loading ? 'Loading...' : JSON.stringify(data)}
    </div>
  );
}
```

## Error Handling

```typescript
// In your API route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Process the request...
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }
}

// In your frontend
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John' }),
});

if (!response.ok) {
  const error = await response.json();
  console.error('API Error:', error);
} else {
  const data = await response.json();
  console.log('Success:', data);
}
```

## Running the Demo

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Visit the demo pages**:
   - Home: `http://localhost:3000`
   - Basic API Demo: `http://localhost:3000/api-demo`
   - Users CRUD Demo: `http://localhost:3000/users-demo`

4. **Test the APIs directly**:
   - `http://localhost:3000/api/hello`
   - `http://localhost:3000/api/users`

## Key Features

- ✅ **App Router**: Uses Next.js 13+ App Router
- ✅ **TypeScript**: Full TypeScript support
- ✅ **Error Handling**: Proper error responses
- ✅ **HTTP Methods**: GET, POST, PUT, DELETE examples
- ✅ **Frontend Integration**: React components calling APIs
- ✅ **Real-time Updates**: UI updates after API calls
- ✅ **Loading States**: User feedback during API calls

## Next Steps

- Add database integration (e.g., PostgreSQL, MongoDB)
- Implement authentication and authorization
- Add input validation (e.g., with Zod)
- Add rate limiting
- Implement caching strategies
- Add API documentation (e.g., with Swagger) 