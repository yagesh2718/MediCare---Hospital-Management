import React from 'react'

const Footer = () => {
  return (
    <div>
      <footer className="bg-gray-900 text-white py-8">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      <div>
        <h3 className="text-xl font-semibold mb-2">MediCare</h3>
        <p className="text-sm text-gray-400">
          Your trusted platform for easy appointments, video consultations, and 24/7 healthcare access.
        </p>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-2">Contact Us</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>Phone: +91-9876543210</li>
          <li>Email: support@medicare.com</li>
          <li>Address: Street No. 12, Prayagraj, Uttar Pradesh</li>
        </ul>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-2">Complaints</h4>
        <p className="text-sm text-gray-300">
          For any issues or concerns, please write to us at:
        </p>
        <a href="mailto:complaints@hospitalcare.com" className="text-blue-400 hover:underline">
          complaints@medicare.com
        </a>
      </div>

    </div>

    <div className="border-t border-gray-700 mt-8 pt-4 text-sm text-gray-500 text-center">
      &copy; {new Date().getFullYear()} MediCare. All rights reserved.
    </div>
  </div>
</footer>

    </div>
  )
}

export default Footer
