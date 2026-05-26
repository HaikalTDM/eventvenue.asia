import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-12">
      <div className="container-custom">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Branding */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#EB4D4B] text-xs font-bold text-white">
                EV
              </span>
              EventVenue<span className="text-[#EB4D4B]">.Asia</span>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              The trusted marketplace for premium event venues across Southeast Asia.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Marketplace
            </h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/#venues" className="text-sm text-gray-600 hover:text-[#EB4D4B]">
                  Browse Venues
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-[#EB4D4B]">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Support
            </h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-[#EB4D4B]">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-sm text-gray-600 hover:text-[#EB4D4B]">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-[#EB4D4B]">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Legal
            </h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-[#EB4D4B]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-[#EB4D4B]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-[#EB4D4B]">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} EventVenue.Asia. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
