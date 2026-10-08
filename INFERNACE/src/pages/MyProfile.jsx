
import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const MyProfile = () => {
  const { token, setToken, backendUrl, navigate } =
    useContext(ShopContext);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      const savedToken = token || localStorage.getItem('token');

      if (!savedToken) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.post(
          backendUrl + '/api/user/profile',
          {},
          {
            headers: { token: savedToken },
          }
        );

        if (response.data.success) {
          setUser(response.data.user);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.log(error);
        toast.error('Unable to load your profile');
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [token, backendUrl, navigate]);

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        Loading your profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        Unable to load your profile.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-16 px-4">
      <div className="mb-8">
        <p className="text-2xl font-prata">MY PROFILE</p>
        <hr className="w-12 mt-2 border-gray-800" />
      </div>

      <div className="border p-6 sm:p-8 space-y-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            Full Name
          </p>
          <p className="text-lg">{user.name}</p>
        </div>

        <hr />

        <div>
          <p className="text-sm text-gray-500 mb-1">
            Email Address
          </p>
          <p className="text-lg break-all">{user.email}</p>
        </div>

        <hr />

        <button
          onClick={() => navigate('/orders')}
          className="border border-black px-6 py-3 hover:bg-black hover:text-white transition"
        >
          View My Orders
        </button>

        <button
          onClick={logout}
          className="block bg-black text-white px-6 py-3 hover:bg-gray-800 transition"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default MyProfile;