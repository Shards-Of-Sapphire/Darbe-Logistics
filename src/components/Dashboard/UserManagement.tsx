import React, { useState, useEffect } from 'react';
import { UserCircle, Shield, User as UserIcon, Mail, Trash2, Edit2, Plus, X, Check } from 'lucide-react';
import { storage } from '../../lib/storage';
import { User, UserRole } from '../../types';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; role: UserRole }>({ name: '', role: 'Staff' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(storage.getRegisteredUsers());
  };

  const startEdit = (user: any) => {
    setIsEditing(user.id);
    setEditForm({ name: user.name, role: user.role });
  };

  const handleUpdate = () => {
    if (!isEditing) return;
    
    const userToUpdate = users.find(u => u.id === isEditing);
    if (userToUpdate) {
      storage.updateRegisteredUser({
        ...userToUpdate,
        name: editForm.name,
        role: editForm.role
      });
      toast.success('User updated successfully');
      setIsEditing(null);
      loadUsers();
    }
  };

  const handleDelete = (userId: string) => {
    const currentUser = storage.getUser();
    if (currentUser?.id === userId) {
      toast.error('You cannot delete your own account');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      storage.deleteRegisteredUser(userId);
      toast.success('User deleted');
      loadUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-olive-100 text-olive-600 rounded-xl">
            <UserCircle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <p className="text-xs text-gray-500 italic">Manage staff and admin access permissions.</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-olive-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    {isEditing === user.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="px-2 py-1 bg-white border border-olive-200 rounded text-sm font-semibold focus:ring-2 focus:ring-olive-500 outline-none"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          user.role === 'Admin' ? "bg-olive-100 text-olive-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {user.role === 'Admin' ? <Shield size={14} /> : <UserIcon size={14} />}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail size={12} />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isEditing === user.id ? (
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                        className="px-2 py-1 bg-white border border-olive-200 rounded text-sm font-semibold focus:ring-2 focus:ring-olive-500 outline-none"
                      >
                        <option value="Staff">Staff</option>
                        <option value="Admin">Admin</option>
                      </select>
                    ) : (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        user.role === 'Admin' ? "bg-olive-100 text-olive-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isEditing === user.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleUpdate}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => setIsEditing(null)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(user)}
                          className="p-1.5 text-olive-600 hover:bg-olive-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-12 text-center text-gray-400 italic text-sm">
              No other registered users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
