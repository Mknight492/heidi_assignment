import { NextRequest, NextResponse } from 'next/server';

// Mock database - in a real app, you'd use a real database
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

// GET - Fetch all users
export async function GET() {
  return NextResponse.json({ users });
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const newUser = {
      id: users.length + 1,
      name,
      email,
    };

    users.push(newUser);

    return NextResponse.json(
      { message: 'User created successfully', user: newUser },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }
}

// PUT - Update a user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    users[userIndex] = { ...users[userIndex], ...(name && { name }), ...(email && { email }) };

    return NextResponse.json({
      message: 'User updated successfully',
      user: users[userIndex]
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }
}

// DELETE - Delete a user
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  const userId = parseInt(id);
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  const deletedUser = users.splice(userIndex, 1)[0];

  return NextResponse.json({
    message: 'User deleted successfully',
    user: deletedUser
  });
} 