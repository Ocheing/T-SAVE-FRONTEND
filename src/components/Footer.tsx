import { Star, Youtube, Instagram, Twitter, Facebook } from "lucide-react";
import { Link } from "react-router-dom";
import { FaTiktok, FaPinterest } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-6">
          <div>
            <h3 className="font-bold mb-3 text-sm">About TembeaSave</h3>
            <p className="text-xs text-muted-foreground">
              Save smart, travel more. Your journey to dream destinations starts with every save.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">4.8 (2,450 reviews)</span>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-3 text-sm">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Privacy & Cookie Statement
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Help Centre
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-3 text-sm">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/trips" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Browse Trips
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  My Wishlist
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-3 text-sm">Follow Us</h3>
            <div className="flex flex-wrap gap-2">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" 
                className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                <FaTiktok className="h-4 w-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                <FaPinterest className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TembeaSave. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;