'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function UsersDemo() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.users);
      setMessage('Users fetched successfully');
    } catch (error) {
      setMessage('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  // Create a new user
  const createUser = async () => {
    if (!newUser.name || !newUser.email) {
      setMessage('Name and email are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      
      if (response.ok) {
        setUsers([...users, data.user]);
        setNewUser({ name: '', email: '' });
        setMessage('User created successfully');
      } else {
        setMessage(data.error || 'Error creating user');
      }
    } catch (error) {
      setMessage('Error creating user');
    } finally {
      setLoading(false);
    }
  };

  // Update a user
  const updateUser = async () => {
    if (!editingUser) return;

    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });
      const data = await response.json();
      
      if (response.ok) {
        setUsers(users.map(user => 
          user.id === editingUser.id ? data.user : user
        ));
        setEditingUser(null);
        setMessage('User updated successfully');
      } else {
        setMessage(data.error || 'Error updating user');
      }
    } catch (error) {
      setMessage('Error updating user');
    } finally {
      setLoading(false);
    }
  };

  // Delete a user
  const deleteUser = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== id));
        setMessage('User deleted successfully');
      } else {
        setMessage(data.error || 'Error deleting user');
      }
    } catch (error) {
      setMessage('Error deleting user');
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Users API Demo</h1>
        
        {message && (
          <div className={`p-4 mb-6 rounded ${
            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create User Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Create New User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name:</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email:</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter email"
                />
              </div>
              <button
                onClick={createUser}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>

          {/* Users List Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Users List</h2>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
              >
                Refresh
              </button>
            </div>
            
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="border border-gray-200 p-3 rounded">
                  {editingUser?.id === user.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={updateUser}
                          disabled={loading}
                          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-2 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={loading}
                          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-2 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold">GET /api/users</h3>
              <p>Fetch all users</p>
            </div>
            <div>
              <h3 className="font-semibold">POST /api/users</h3>
              <p>Create a new user (requires name and email in body)</p>
            </div>
            <div>
              <h3 className="font-semibold">PUT /api/users</h3>
              <p>Update a user (requires id, name, and/or email in body)</p>
            </div>
            <div>
              <h3 className="font-semibold">DELETE /api/users?id=1</h3>
              <p>Delete a user (requires id as query parameter)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 