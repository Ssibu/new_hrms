import React from 'react';
import { useConfig } from '../context/ConfigContext';

const Profile = () => {
  const { user, loading } = useConfig();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>No user data found.</div>;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6">My Profile</h2>
      <div className="space-y-4">
        <div>
          <span className="font-semibold">Name:</span> {user.name}
        </div>
        <div>
          <span className="font-semibold">Email:</span> {user.email}
        </div>
        <div>
          <span className="font-semibold">Role:</span> {user.role}
        </div>
        {/* Add more fields as needed */}
      </div>
    </div>
  );
};

export default Profile; 