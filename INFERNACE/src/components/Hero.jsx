import React from 'react'
import { assets } from '../assets/assets'
import { Link, NavLink } from 'react-router-dom'

const Hero = () => {
  return (
    <div className='flex flex-col sm:flex-row border border-gray-400'>
        {/* Hero Left Side */}
        <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
            <div className='text-[black]'>
                <div className='flex items-center gap-2'>
                    <p className='w-8 md:w-11 h-[2px] bg-[#414141]'></p>
                    <p className='font-medium lg:text-2xl text-sm md:text-base'>WELCOME TO</p>
                </div>
                <h1 className='text-3xl sm:py-3 lg:text-6xl leading-relaxed font-bold'>INFERNACE</h1>
                <div className='flex items-center gap-2 justify-center'>
                     <Link to='/collection' className='bg-black text-white px-6 py-2 rounded-sm text-lg'> 
                        Shop Now
                     </Link>
                </div>
            </div>
        </div>
        {/* Hero Right Side */}
        <img className='w-full h-[420px] sm:w-1/2' src={assets.newhero} alt="" />
    </div>
    
  )
}

export default Hero