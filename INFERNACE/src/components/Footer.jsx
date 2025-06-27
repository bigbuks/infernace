import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
            <img src={assets.infernacelogo} className='mb-5 w-37' alt="" />
            <p className='w-full md:w-2/3 text-gray-600'>
             Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a gallery of type and scrambled it to make a type specimen book.
            </p>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>COMPANY</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li>Home</li>
                <li>Collection</li>
                <li>About</li>
                <li>Contact</li>
            </ul>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-2 text-gray-600'>
                <li><a href="" className='flex flex-row gap-1'><i className='bx bx-phone text-xl'></i>+234-080-1234-5678</a></li> 
                <li><a href="" className='flex flex-row gap-1'><i className='bx bx-envelope text-xl'></i>contact@infernace.com</a></li>
                    <ul className='flex flex-row gap-3 mt-2'>         
                        <li><a href="#" className="text-gray-400 hover:text-blue-400 transition"><i className='bx bxl-twitter text-xl'></i></a></li>
                        <li><a href="#" className="text-gray-400 hover:text-green-500 transition"><i className='bx bxl-whatsapp text-xl'></i></a></li>
                        <li><a href="#" className="text-gray-400 hover:text-pink-500 transition"><i className='bx bxl-instagram-alt text-xl'></i></a></li>
                        <li><a href="#" className="text-gray-400 hover:text-blue-500 transition"><i className='bx bxl-discord-alt text-xl'></i></a></li>
                    </ul>
                    
            </ul>
        </div>

      </div>
    </div>
  )
}

export default Footer
