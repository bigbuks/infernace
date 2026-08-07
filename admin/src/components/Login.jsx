import React from 'react'
import { useState } from 'react';
import axios from 'axios'
import { backendUrl } from '../Config';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify'

const Login = ({setToken}) => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            const response = await axios.post(backendUrl + '/api/user/admin', {email,password})
            if (response.data.success) {
                setToken(response.data.token)
            } else {
               toast.error(response.data.message)
            }

        } catch (error) {
            console.error(error);
            toast.error(error.message)
        }
    }

    return (
        <div className='min-h-screen flex items-center justify-center w-full'>
            <div className='bg-white shadow-md rounded-lg px-8 py-6 max-w-md'>
                <h1 className='text-2xl font-bold mb-4'>Admin Panel</h1>
                <form onSubmit={onSubmitHandler}>
                    <div className='mb-3 min-w-72'>
                        <p className='text-sm font-medium text-gray-700 mb-2'>Email Address</p>
                        <input onChange={(e)=>setEmail(e.target.value)} value={email} className='rounded-md w-full px-3 py-2 border border-gray-300 outline-none' type="email" placeholder='your@email.com' required />
                    </div>
                    <div className='mb-3 min-w-72'>
                        <p className='text-sm font-medium text-gray-700 mb-2'>Password</p>
                        <div className='relative'>
                            <input 
                                onChange={(e)=>setPassword(e.target.value)} 
                                value={password} 
                                className='rounded-md w-full px-3 py-2 border border-gray-300 outline-none pr-10' 
                                type={showPassword ? "text" : "password"} 
                                placeholder='Enter your password' 
                                required 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600'
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>
                    <button className='mt-2 w-full py-2 px-4 rounded-md text-white bg-black cursor-pointer ' type="submit"> Login </button>
                </form>
            </div>
        </div>
    )
}

export default Login