import React, { useState, useRef } from "react";
import { X, Send, Sparkles, RefreshCw, Check, GraduationCap } from "lucide-react";
import { openTelegramSupport } from "../lib/telegram";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMessage?: string;
}

const COUNTRY_CODES = [
  { code: "🇺🇸 +1", name: "USA/Canada" },
  { code: "🇷🇺 +7", name: "Russia/Kazakhstan" },
  { code: "🇪🇬 +20", name: "Egypt" },
  { code: "🇿🇦 +27", name: "South Africa" },
  { code: "🇬🇷 +30", name: "Greece" },
  { code: "🇳🇱 +31", name: "Netherlands" },
  { code: "🇧🇪 +32", name: "Belgium" },
  { code: "🇫🇷 +33", name: "France" },
  { code: "🇪🇸 +34", name: "Spain" },
  { code: "🇭🇺 +36", name: "Hungary" },
  { code: "🇮🇹 +39", name: "Italy" },
  { code: "🇷🇴 +40", name: "Romania" },
  { code: "🇨🇭 +41", name: "Switzerland" },
  { code: "🇦🇹 +43", name: "Austria" },
  { code: "🇬🇧 +44", name: "United Kingdom" },
  { code: "🇩🇰 +45", name: "Denmark" },
  { code: "🇸🇪 +46", name: "Sweden" },
  { code: "🇳🇴 +47", name: "Norway" },
  { code: "🇵🇱 +48", name: "Poland" },
  { code: "🇩🇪 +49", name: "Germany" },
  { code: "🇵🇪 +51", name: "Peru" },
  { code: "🇲🇽 +52", name: "Mexico" },
  { code: "🇨🇺 +53", name: "Cuba" },
  { code: "🇦🇷 +54", name: "Argentina" },
  { code: "🇧🇷 +55", name: "Brazil" },
  { code: "🇨🇱 +56", name: "Chile" },
  { code: "🇨🇴 +57", name: "Colombia" },
  { code: "🇻🇪 +58", name: "Venezuela" },
  { code: "🇲🇾 +60", name: "Malaysia" },
  { code: "🇦🇺 +61", name: "Australia" },
  { code: "🇮🇩 +62", name: "Indonesia" },
  { code: "🇵🇭 +63", name: "Philippines" },
  { code: "🇳🇿 +64", name: "New Zealand" },
  { code: "🇸🇬 +65", name: "Singapore" },
  { code: "🇹🇭 +66", name: "Thailand" },
  { code: "🇯🇵 +81", name: "Japan" },
  { code: "🇰🇷 +82", name: "South Korea" },
  { code: "🇻🇳 +84", name: "Vietnam" },
  { code: "🇨🇳 +86", name: "China" },
  { code: "🇹🇷 +90", name: "Turkey" },
  { code: "🇮🇳 +91", name: "India" },
  { code: "🇵🇰 +92", name: "Pakistan" },
  { code: "🇦🇫 +93", name: "Afghanistan" },
  { code: "🇱🇰 +94", name: "Sri Lanka" },
  { code: "🇲🇲 +95", name: "Myanmar" },
  { code: "🇮🇷 +98", name: "Iran" },
  { code: "🇲🇦 +212", name: "Morocco" },
  { code: "🇩🇿 +213", name: "Algeria" },
  { code: "🇹🇳 +216", name: "Tunisia" },
  { code: "🇱🇾 +218", name: "Libya" },
  { code: "🇬🇲 +220", name: "Gambia" },
  { code: "🇸🇳 +221", name: "Senegal" },
  { code: "🇲🇷 +222", name: "Mauritania" },
  { code: "🇲🇱 +223", name: "Mali" },
  { code: "🇬🇳 +224", name: "Guinea" },
  { code: "🇨🇮 +225", name: "Ivory Coast" },
  { code: "🇧🇫 +226", name: "Burkina Faso" },
  { code: "🇳🇪 +227", name: "Niger" },
  { code: "🇹🇬 +228", name: "Togo" },
  { code: "🇧🇯 +229", name: "Benin" },
  { code: "🇲🇺 +230", name: "Mauritius" },
  { code: "🇱🇷 +231", name: "Liberia" },
  { code: "🇸🇱 +232", name: "Sierra Leone" },
  { code: "🇬🇭 +233", name: "Ghana" },
  { code: "🇳🇬 +234", name: "Nigeria" },
  { code: "🇹🇩 +235", name: "Chad" },
  { code: "🇨🇫 +236", name: "Central African Republic" },
  { code: "🇨🇲 +237", name: "Cameroon" },
  { code: "🇨🇻 +238", name: "Cape Verde" },
  { code: "🇸🇹 +239", name: "Sao Tome and Principe" },
  { code: "🇬🇶 +240", name: "Equatorial Guinea" },
  { code: "🇬🇦 +241", name: "Gabon" },
  { code: "🇨🇬 +242", name: "Republic of the Congo" },
  { code: "🇨🇩 +243", name: "DR Congo" },
  { code: "🇦🇴 +244", name: "Angola" },
  { code: "🇬🇼 +245", name: "Guinea-Bissau" },
  { code: "🇸🇨 +248", name: "Seychelles" },
  { code: "🇸🇩 +249", name: "Sudan" },
  { code: "🇷🇼 +250", name: "Rwanda" },
  { code: "🇪🇹 +251", name: "Ethiopia" },
  { code: "🇸🇴 +252", name: "Somalia" },
  { code: "🇩🇯 +253", name: "Djibouti" },
  { code: "🇰🇪 +254", name: "Kenya" },
  { code: "🇹🇿 +255", name: "Tanzania" },
  { code: "🇺🇬 +256", name: "Uganda" },
  { code: "🇧🇮 +257", name: "Burundi" },
  { code: "🇲🇿 +258", name: "Mozambique" },
  { code: "🇿🇲 +260", name: "Zambia" },
  { code: "🇲🇬 +261", name: "Madagascar" },
  { code: "🇿🇼 +263", name: "Zimbabwe" },
  { code: "🇳🇦 +264", name: "Namibia" },
  { code: "🇲🇼 +265", name: "Malawi" },
  { code: "🇱🇸 +266", name: "Lesotho" },
  { code: "🇧🇼 +267", name: "Botswana" },
  { code: "🇸🇿 +268", name: "Swaziland" },
  { code: "🇰🇲 +269", name: "Comoros" },
  { code: "🇵🇹 +351", name: "Portugal" },
  { code: "🇱🇺 +352", name: "Luxembourg" },
  { code: "🇮🇪 +353", name: "Ireland" },
  { code: "🇮🇸 +354", name: "Iceland" },
  { code: "🇦🇱 +355", name: "Albania" },
  { code: "🇲🇹 +356", name: "Malta" },
  { code: "🇨🇾 +357", name: "Cyprus" },
  { code: "🇫🇮 +358", name: "Finland" },
  { code: "🇧🇬 +359", name: "Bulgaria" },
  { code: "🇱🇹 +370", name: "Lithuania" },
  { code: "🇱🇻 +371", name: "Latvia" },
  { code: "🇪🇪 +372", name: "Estonia" },
  { code: "🇲🇩 +373", name: "Moldova" },
  { code: "🇦🇲 +374", name: "Armenia" },
  { code: "🇧🇾 +375", name: "Belarus" },
  { code: "🇦🇩 +376", name: "Andorra" },
  { code: "🇺🇦 +380", name: "Ukraine" },
  { code: "🇷🇸 +381", name: "Serbia" },
  { code: "🇲🇪 +382", name: "Montenegro" },
  { code: "🇭🇷 +385", name: "Croatia" },
  { code: "🇸🇮 +386", name: "Slovenia" },
  { code: "🇧🇦 +387", name: "Bosnia and Herzegovina" },
  { code: "🇲🇰 +389", name: "Macedonia" },
  { code: "🇨🇿 +420", name: "Czech Republic" },
  { code: "🇸🇰 +421", name: "Slovakia" },
  { code: "🇱🇮 +423", name: "Liechtenstein" },
  { code: "🇧🇩 +880", name: "Bangladesh" },
  { code: "🇹🇼 +886", name: "Taiwan" },
  { code: "🇲🇻 +960", name: "Maldives" },
  { code: "🇱🇧 +961", name: "Lebanon" },
  { code: "🇯🇴 +962", name: "Jordan" },
  { code: "🇸🇾 +963", name: "Syria" },
  { code: "🇮🇶 +964", name: "Iraq" },
  { code: "🇰🇼 +965", name: "Kuwait" },
  { code: "🇸🇦 +966", name: "Saudi Arabia" },
  { code: "🇾🇪 +967", name: "Yemen" },
  { code: "🇴🇲 +968", name: "Oman" },
  { code: "🇵🇸 +970", name: "Palestine" },
  { code: "🇦🇪 +971", name: "UAE" },
  { code: "🇧🇭 +973", name: "Bahrain" },
  { code: "🇶🇦 +974", name: "Qatar" },
  { code: "🇧🇹 +975", name: "Bhutan" },
  { code: "🇲🇳 +976", name: "Mongolia" },
  { code: "🇳🇵 +977", name: "Nepal" },
  { code: "🇹🇯 +992", name: "Tajikistan" },
  { code: "🇹🇲 +993", name: "Turkmenistan" },
  { code: "🇦🇿 +994", name: "Azerbaijan" },
  { code: "🇬🇪 +995", name: "Georgia" },
  { code: "🇰🇬 +996", name: "Kyrgyzstan" },
  { code: "🇺🇿 +998", name: "Uzbekistan" }
].sort((a, b) => a.name.localeCompare(b.name));

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, defaultMessage = "" }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("🇮🇳 +91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Auto-verify if user didn't check mock box
    if (!isCaptchaVerified) {
      setIsCaptchaVerified(true);
    }

    // Gather Device OS and Browser Info invisibly
    const userAgent = navigator.userAgent;
    let browserName = "Unknown Browser";
    let osName = "Unknown OS";

    if (userAgent.indexOf("Win") !== -1) osName = "Windows";
    if (userAgent.indexOf("Mac") !== -1) osName = "MacOS";
    if (userAgent.indexOf("Linux") !== -1) osName = "Linux";
    if (userAgent.indexOf("Android") !== -1) osName = "Android";
    if (userAgent.indexOf("like Mac") !== -1) osName = "iOS";

    if (userAgent.indexOf("Firefox") !== -1) browserName = "Firefox";
    else if (userAgent.indexOf("Opera") !== -1 || userAgent.indexOf("OPR") !== -1) browserName = "Opera";
    else if (userAgent.indexOf("Edg") !== -1) browserName = "Edge";
    else if (userAgent.indexOf("Chrome") !== -1) browserName = "Chrome";
    else if (userAgent.indexOf("Safari") !== -1) browserName = "Safari";

    const deviceInfo = `${osName} / ${browserName}`;

    const phone = phoneNumber ? `${countryCode} ${phoneNumber}` : "";
    const text = `Support Request:\nName: ${name}\nEmail/ID: ${email}\nPhone: ${phone || "N/A"}\nSubject: ${subject || "N/A"}\nDevice: ${deviceInfo}\n\nMessage:\n${message}`;

    openTelegramSupport(text);

    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-[#0B1320]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111823] border border-[#1E293B] rounded-[20px] w-full max-w-[380px] overflow-hidden shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1E293B] flex justify-between items-start bg-[#0F1621]">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <GraduationCap className="text-[#0F1621] w-5 h-5" fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5 leading-none mb-1">
                Aladdin AI Chat Support
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-emerald-500 font-medium text-[11px] tracking-wide">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <div className="text-center mb-5">
            <h2 className="text-emerald-500 text-lg font-bold mb-1">We are here to help</h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Fill out the form below and our team will get back to you shortly.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            <div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1A2234] border border-[#2A3449] focus:border-emerald-500 rounded-lg px-3 h-[42px] text-sm text-white focus:outline-none transition-colors placeholder:text-slate-500"
                placeholder="Name *"
              />
            </div>
            
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A2234] border border-[#2A3449] focus:border-emerald-500 rounded-lg px-3 h-[42px] text-sm text-white focus:outline-none transition-colors placeholder:text-slate-500"
                placeholder="Email *"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-[80px] bg-[#1A2234] border border-[#2A3449] focus:border-emerald-500 rounded-lg px-2 h-[42px] text-sm text-white focus:outline-none transition-colors cursor-pointer outline-none placeholder:text-slate-500"
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code + c.name} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-[#1A2234] border border-[#2A3449] focus:border-emerald-500 rounded-lg px-3 h-[42px] text-sm text-white focus:outline-none transition-colors placeholder:text-slate-500"
                placeholder="Phone (Optional)"
              />
            </div>

            <div>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#1A2234] border border-[#2A3449] focus:border-emerald-500 rounded-lg px-3 h-[42px] text-sm text-white focus:outline-none transition-colors placeholder:text-slate-500"
                placeholder="Subject *"
              />
            </div>
            
            <div>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full bg-[#1A2234] border border-[#2A3449] focus:border-emerald-500 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors resize-none placeholder:text-slate-500"
                placeholder="Message *"
              />
            </div>

            {/* Mock Recaptcha */}
            <div className={`bg-[#222222] border ${captchaError ? 'border-red-500 animate-pulse ring-2 ring-red-500/20' : 'border-[#444444] shadow-md'} rounded-[3px] p-2 pr-3 flex items-center justify-between mt-4 transition-all duration-300 w-full h-[74px]`}>
              <div className="flex items-center gap-3 ml-2">
                <button
                  type="button"
                  onClick={() => setIsCaptchaVerified(!isCaptchaVerified)}
                  className={`w-[28px] h-[28px] rounded-[2px] flex items-center justify-center border-[2px] transition-all bg-white relative ${isCaptchaVerified ? 'border-transparent' : 'border-[#C1C1C1]'}`}
                >
                  {isCaptchaVerified && <Check className="w-[18px] h-[18px] text-[#009E55] absolute" strokeWidth={4} />}
                </button>
                <span className="text-[#f9f9f9] text-[14px]">I'm not a robot</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-0 mr-1">
                <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="w-[32px] mb-1 opacity-90" />
                <div className="text-[10px] text-[#9b9b9b] leading-none flex flex-col items-center">
                  <span>reCAPTCHA</span>
                  <div className="text-[8px] flex gap-1 mt-1">
                    <a href="#" className="hover:underline">Privacy</a> - <a href="#" className="hover:underline">Terms</a>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-lg transition-colors tracking-wide text-sm uppercase mt-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              Send Message
            </button>
            
            {/* Disclaimer */}
            <div className="mt-3 bg-[#141B29] p-3 rounded-lg text-center">
              <p className="text-[#8899B6] text-[10px] leading-relaxed">
                By submitting you agree to receive SMS or e-mails for the provided channel.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="pb-4 pt-1 text-center">
          <p className="text-[#4E6287] text-[10px] font-medium tracking-wide">
            Powered by Aladdin Premium AI
          </p>
        </div>
      </div>
    </div>
  );
};
