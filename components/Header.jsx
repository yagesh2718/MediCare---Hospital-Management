import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import HeaderAuth from './HeaderAuth'

const Header = () => {
  return (
    <header className='fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-10 supports-[backdrop-filter]:bg-background/60'>
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
            <Image
                src="/logo-single.png"
                alt="MediCare Logo"
                width={200}
                height={60}
                className="h-10 w-auto object-contain"
            />
        </Link>
        <HeaderAuth/>
      </nav>
    </header>
  )
}

export default Header
