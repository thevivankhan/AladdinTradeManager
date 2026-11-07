import React, { useState, useRef } from 'react';
import { X, GraduationCap, Sparkles, RefreshCcw } from 'lucide-react';
import { countryCodes } from '../countryCodes';
import { openTelegramSupport } from '../lib/telegram';

export const ChatSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+91',
    phone: '',
    subject: '',
    message: '',
    isRobot: false
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = `Hello Aladdin AI Support!
Name: ${formData.name}
Mobile: ${formData.countryCode} ${formData.phone}
Email: ${formData.email}
Subject: ${formData.subject || 'General Inquiry'}
Message: ${formData.message}`;

    openTelegramSupport(text);
    
    setTimeout(() => {
      // Reset form and close chat
      setFormData({
        name: '',
        email: '',
        countryCode: '+91',
        phone: '',
        subject: '',
        message: '',
        isRobot: false
      });
      setIsOpen(false);
    }, 400);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/30 hover:scale-110 transition-all duration-300"
        >
          <span className="text-2xl">🎓</span>
          {isHovered && (
            <span className="absolute right-16 bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-slate-700">
              Chat Support
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[300px] max-w-[calc(100vw-1rem)] bg-[#0f172a] rounded-xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-[#0f2922] p-2 flex items-start justify-between border-b border-emerald-900/30">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm flex items-center gap-1">
                  Aladdin AI Chat Support <Sparkles className="w-3 h-3 text-yellow-400" />
                </h3>
                <p className="text-emerald-400 text-[10px] flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Body */}
          <div className="p-3 overflow-y-auto max-h-[calc(100vh-80px)] custom-scrollbar">
            <div className="text-center mb-3">
              <h4 className="text-emerald-400 font-bold text-base mb-1">We are here to help</h4>
              <p className="text-slate-300 text-[10px] leading-relaxed">
                Fill out the form below and our team will get back to you shortly.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-2"
            >
              <div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Name *"
                  required
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email *"
                  required
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div className="flex gap-1.5">
                <div className="relative w-1/3">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-1 py-1.5 text-xs text-white appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  >
                    {countryCodes.map((country) => (
                      <option key={`${country.code}-${country.name}`} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
                    <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                  placeholder="Phone *"
                  required
                  className="w-2/3 bg-[#1e293b] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Subject"
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Message *"
                  required
                  rows={2}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                ></textarea>
              </div>

              {/* reCAPTCHA Mock */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-colors ${formData.isRobot ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 bg-white'}`}
                    onClick={() => {
                        if (formData.isRobot) {
                            setFormData(prev => ({ ...prev, isRobot: false }));
                        } else if (!isVerifying) {
                            setIsVerifying(true);
                            setTimeout(() => {
                                setFormData(prev => ({ ...prev, isRobot: true }));
                                setIsVerifying(false);
                            }, 1000);
                        }
                    }}
                  >
                    {isVerifying ? (
                        <div className="w-3 h-3 border-2 border-t-transparent border-emerald-500 rounded-full animate-spin"></div>
                    ) : (
                        formData.isRobot && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    )}
                  </div>
                  <span className="text-white text-sm font-medium">I'm not a robot</span>
                </div>
                <div className="flex flex-col items-center">
                  <RefreshCcw className="w-6 h-6 text-blue-500 mb-0.5" />
                  <span className="text-[8px] text-slate-400">reCAPTCHA</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#00e699] hover:bg-[#00c985] text-slate-900 font-bold text-sm py-2 rounded-lg shadow-[0_0_10px_rgba(0,230,153,0.2)] hover:shadow-[0_0_15px_rgba(0,230,153,0.4)] transition-all duration-300 transform hover:-translate-y-0.5"
              >
                SEND MESSAGE
              </button>

              <div className="text-center mt-2 bg-[#1e293b] p-2 rounded-lg border border-slate-800">
                <p className="text-slate-400 text-[8px] leading-relaxed">
                  By submitting you agree to receive SMS or e-mails for the provided channel.
                </p>
              </div>
              
              <div className="text-center mt-2">
                <p className="text-slate-500 text-[8px] font-medium">
                  Powered by Aladdin Premium AI
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
