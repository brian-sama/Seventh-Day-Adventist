import React from 'react';
import './GooeyFooter.css';

const GooeyFooter = () => {
  return (
    <footer className="footer-section">
      <div className="footer-content">
        <div className="column">
          <h4 className="font-bold text-white mb-4">
            <a href="https://magwegwewestsda.co.zw/" target="_blank" rel="noopener noreferrer" className="hover:text-sda-gold transition-colors">
              Magwegwe West Seventh Day Adventist Church
            </a>
          </h4>
          <a href="https://magwegwewestsda.co.zw/#/about" target="_blank" rel="noopener noreferrer" className="hover:text-sda-red transition-colors">About Us</a>
          <a href="#" className="hover:text-sda-red transition-colors">Our Beliefs</a>
          <a href="#" className="hover:text-sda-red transition-colors">Contact</a>
        </div>
        <div className="column">
          <h4 className="font-bold text-white mb-4">Resources</h4>
          <a href="#" className="hover:text-sda-red transition-colors">Service Requests</a>
          <a href="#" className="hover:text-sda-red transition-colors">Calendar</a>
          <a href="#" className="hover:text-sda-red transition-colors">Support</a>
        </div>
        <div className="column">
          <h4 className="font-bold text-white mb-4">Connect</h4>
          <a href="#" className="hover:text-sda-red transition-colors">YouTube</a>
          <a href="#" className="hover:text-sda-red transition-colors">Facebook</a>
          <a href="#" className="hover:text-sda-red transition-colors">Instagram</a>
        </div>
      </div>
      <div className="footer-bottom border-t border-white/10 mt-8 pt-8 text-center text-white/50 text-sm">
        <p>&copy; {new Date().getFullYear()} Magwegwe West Seventh Day Adventist Church. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default GooeyFooter;
