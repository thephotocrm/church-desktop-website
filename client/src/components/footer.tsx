import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Cross, MapPin, Phone, Mail, Clock } from "lucide-react";
import { SiFacebook, SiInstagram, SiYoutube } from "react-icons/si";

export function Footer() {
  const { data: socialLinks } = useQuery<{ youtube: string | null; facebook: string | null }>({
    queryKey: ["/api/social-links"],
    staleTime: 60000,
  });

  return (
    <footer className="bg-navy text-white" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-md bg-gold flex items-center justify-center">
                <Cross className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-base">First Pentecostal</p>
                <p className="text-xs text-white/60 font-body">Church of Dallas</p>
              </div>
            </div>
            <p className="text-white/70 font-body text-sm leading-relaxed">
              A Spirit-filled community of believers committed to worshipping God, reaching the lost, and making disciples for Jesus Christ.
            </p>
            <div className="flex gap-3 mt-6">
              <a href={socialLinks?.facebook || "https://facebook.com"} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center hover:bg-gold transition-colors" data-testid="link-facebook">
                <SiFacebook className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center hover:bg-gold transition-colors" data-testid="link-instagram">
                <SiInstagram className="w-4 h-4" />
              </a>
              <a href={socialLinks?.youtube || "https://youtube.com"} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center hover:bg-gold transition-colors" data-testid="link-youtube">
                <SiYoutube className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-base mb-4 text-gold">Quick Links</h3>
            <ul className="space-y-3 font-body text-sm">
              {[
                { href: "/about", label: "About Us" },
                { href: "/beliefs", label: "Our Beliefs" },
                { href: "/leadership", label: "Leadership" },
                { href: "/ministries", label: "Ministries" },
                { href: "/events", label: "Events" },
                { href: "/live", label: "Live Stream" },
                { href: "/past-streams", label: "Past Services" },
                { href: "/give", label: "Give" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-white/70 hover:text-gold cursor-pointer transition-colors" data-testid={`link-footer-${link.label.toLowerCase().replace(/\s/g, "-")}`}>
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-base mb-4 text-gold">Service Times</h3>
            <ul className="space-y-4 font-body text-sm">
              <li className="flex gap-3">
                <Clock className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-white font-semibold">Sunday Morning</p>
                  <p className="text-white/60">10:00 AM - Worship Service</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Clock className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-white font-semibold">Sunday Evening</p>
                  <p className="text-white/60">6:00 PM - Study & Fellowship</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Clock className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-white font-semibold">Wednesday</p>
                  <p className="text-white/60">7:00 PM - Bible Study</p>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-base mb-4 text-gold">Contact Info</h3>
            <ul className="space-y-4 font-body text-sm">
              <li className="flex gap-3">
                <MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span className="text-white/70">110 Security Ct<br />Wylie, TX 75098</span>
              </li>
              <li className="flex gap-3">
                <Phone className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span className="text-white/70">(214) 555-0123</span>
              </li>
              <li className="flex gap-3">
                <Mail className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span className="text-white/70">info@fpcdallas.org</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 font-body text-xs">
            &copy; {new Date().getFullYear()} First Pentecostal Church of Dallas. All rights reserved.
          </p>
          <div className="flex gap-6 font-body text-xs text-white/50">
            <Link href="/privacy-policy"><span className="hover:text-gold cursor-pointer transition-colors">Privacy Policy</span></Link>
            <Link href="/terms-of-service"><span className="hover:text-gold cursor-pointer transition-colors">Terms of Service</span></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
