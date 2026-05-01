import Link from "next/link";
import { Zap, Star, MessageCircle, BarChart3, QrCode, ArrowRight, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">ReviewFlow AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-16 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-xs font-semibold text-blue-700 mb-6">
          <Star className="w-3.5 h-3.5 fill-blue-700" />
          The #1 Google Review Tool for Local Businesses
        </div>

        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Turn Every Customer Visit<br />
          Into a{" "}
          <span className="text-blue-600">5-Star Review</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          ReviewFlow AI automates WhatsApp review requests, captures private
          feedback before it hits Google, and builds your online reputation on
          autopilot.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-lg"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-gray-500">
            No credit card required · 14-day free trial
          </p>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="bg-gray-50 border-y border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { value: "3x", label: "More Google Reviews" },
            { value: "85%", label: "Open Rate on WhatsApp" },
            { value: "24h", label: "Automated Follow-up" },
            { value: "< 5min", label: "Setup Time" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">
            Everything You Need to Grow Your Reputation
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Built specifically for restaurants, salons, clinics, and other
            local businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: MessageCircle,
              color: "text-green-600",
              bg: "bg-green-50",
              title: "WhatsApp Automation",
              desc: "Send personalised review requests right after a visit. Automatic 24h reminder if they haven't responded.",
            },
            {
              icon: Star,
              color: "text-yellow-600",
              bg: "bg-yellow-50",
              title: "Smart Review Funnel",
              desc: "Filter unhappy customers privately before they reach Google. Redirect happy customers straight to your review page.",
            },
            {
              icon: QrCode,
              color: "text-blue-600",
              bg: "bg-blue-50",
              title: "QR Code & Unique Link",
              desc: "Get a branded review page with downloadable QR code. Display it at your counter or add it to receipts.",
            },
            {
              icon: BarChart3,
              color: "text-purple-600",
              bg: "bg-purple-50",
              title: "Analytics Dashboard",
              desc: "Track review requests, conversion rates, and private feedback trends in a clean, simple dashboard.",
            },
            {
              icon: Zap,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
              title: "AI Review Suggestions",
              desc: "Customers see pre-written 5-star review suggestions they can copy and paste in one click.",
            },
            {
              icon: CheckCircle,
              color: "text-teal-600",
              bg: "bg-teal-50",
              title: "Light CRM",
              desc: "Keep track of your customers, tag them as new or repeat visitors, and manage all interactions in one place.",
            },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 hover:shadow-sm transition-shadow"
            >
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Add Customer", desc: "Enter their name + WhatsApp number after their visit" },
              { step: "2", title: "Auto WhatsApp", desc: "ReviewFlow sends a personalised review request instantly" },
              { step: "3", title: "Smart Filter", desc: "4-5 stars → Google review. 1-3 stars → private feedback" },
              { step: "4", title: "Watch Reviews Grow", desc: "Reminders sent automatically. Track everything in your dashboard" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative text-center">
                <div className="w-10 h-10 bg-blue-600 text-white text-lg font-bold rounded-full flex items-center justify-center mx-auto mb-3">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Get More Google Reviews?
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Join local businesses already growing with ReviewFlow AI. Set up in
          under 5 minutes.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-lg"
        >
          Start Free Trial
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center">
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} ReviewFlow AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
