import React from 'react'
import Hero from '../components/Hero'
import LatestCollection from '../components/LatestCollection'
import OtherCollection from '../components/OtherCollection'
import OurPolicy from '../components/OurPolicy'
import NewsletterBox from '../components/NewsletterBox'

const Home = () => {
  return (
    <div>
      <Hero />
      <LatestCollection />
      <OtherCollection />
      <OurPolicy />
      <NewsletterBox />
    </div>
  )
}

export default Home
