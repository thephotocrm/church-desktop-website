import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { Menu, X, Sun, Moon, Cross } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/beliefs", label: "Our Beliefs" },
  { href: "/leadership", label: "Leadership" },
  { href: "/ministries", label: "Ministries" },
  { href: "/events", label: "Events" },
  { href: "/live", label: "Live Stream" },
  { href: "/connect", label: "Connect" },
  { href: "/give", label: "Give" },
];

export function Navigation() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = location === "/";
  const navBg = scrolled || !isHome
    ? "bg-background/95 dark:bg-background/95 backdrop-blur-md border-b"
    : "bg-transparent";

  const textColor = scrolled || !isHome
    ? "text-foreground"
    : "text-white";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}
      data-testid="navigation-bar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-20 md:h-20">
          <Link href="/" data-testid="link-home-logo">
            <div className="flex items-center gap-3 md:gap-2 cursor-pointer">
              <div className="w-11 h-11 md:w-10 md:h-10 rounded-md bg-accent flex items-center justify-center">
                <Cross className="w-7 h-7 md:w-6 md:h-6 text-accent-foreground" />
              </div>
              <div className="flex flex-col">
                <span className={`text-base md:text-base font-bold leading-tight tracking-wide ${textColor}`}>
                  First Pentecostal
                </span>
                <span className={`text-sm md:text-xs leading-tight font-body ${scrolled || !isHome ? "text-muted-foreground" : "text-white/70"}`}>
                  Church of Dallas
                </span>
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`px-3 py-2 text-sm font-body font-medium rounded-md cursor-pointer transition-colors ${
                    location === link.href
                      ? "text-gold"
                      : scrolled || !isHome
                        ? "text-foreground/80 hover:text-foreground"
                        : "text-white/80 hover:text-white"
                  }`}
                  data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 md:gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              className={scrolled || !isHome ? "" : "text-white hover:text-white"}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="!w-7 !h-7 md:!w-5 md:!h-5" /> : <Moon className="!w-7 !h-7 md:!w-5 md:!h-5" />}
            </Button>

            <div className="lg:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={scrolled || !isHome ? "" : "text-white hover:text-white"}
                    data-testid="button-mobile-menu"
                  >
                    <Menu className="!w-8 !h-8" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-background">
                  <div className="flex flex-col gap-2 mt-8">
                    <div className="flex items-center gap-2 mb-6 px-2">
                      <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
                        <Cross className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">First Pentecostal</p>
                        <p className="text-xs text-muted-foreground font-body">Church of Dallas</p>
                      </div>
                    </div>
                    {navLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <span
                          onClick={() => setOpen(false)}
                          className={`block px-4 py-3 rounded-md font-body text-base cursor-pointer transition-colors ${
                            location === link.href
                              ? "bg-accent text-accent-foreground font-semibold"
                              : "text-foreground/80 hover-elevate"
                          }`}
                          data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          {link.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
