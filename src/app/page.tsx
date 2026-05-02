"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Star, ArrowRight, Check, QrCode, BarChart3, Shield,
  MessageSquare, TrendingUp, ChevronDown, Sparkles,
  Globe, Lock
} from "lucide-react";

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-white/10 rounded-2xl overflow-hidden cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-6 py-5 bg-white/5 hover:bg-white/10 transition-colors">
        <p className="font-semibold text-white text-[15px] pr-4">{q}</p>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-40" : "max-h-0"}`}>
        <p className="px-6 py-4 text-sm text-gray-400 leading-relaxed border-t border-white/10 bg-white/[0.02]">
          {a}
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans overflow-x-hidden">

      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10">

        {/* Nav */}
        <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/40">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-bold text-white text-[15px] tracking-tight">ReviewFlow</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/sign-in" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block">
                Sign in
              </Link>
              <Link href="/sign-up" className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/30">
                Get started free
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-28 pb-28 px-6 text-center relative">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400 mb-10 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              AI-powered review automation for local businesses
            </div>

            <h1 className="text-[60px] md:text-[72px] font-black leading-[1.04] tracking-tight mb-7">
              <span className="text-white">Turn happy customers</span><br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                into Google reviews
              </span>
            </h1>

            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12">
              Share a QR code. Your customer rates their experience, gets an AI-written review draft, and lands on your Google page in one tap. No friction. No awkward asking.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link
                href="/sign-up"
                className="flex items-center gap-2.5 px-8 py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all text-base shadow-2xl shadow-blue-500/30 hover:shadow-blue-400/40 hover:-translate-y-0.5"
              >
                Start free â€” no credit card
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sign-in"
                className="flex items-center gap-2 px-8 py-4 bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-base border border-white/10 backdrop-blur-sm"
              >
                Sign in to dashboard
              </Link>
            </div>

            <p className="text-xs text-gray-500">Free forever on Starter Â· Setup in under 5 minutes</p>
          </div>

          {/* Dashboard mockup */}
          <div className="max-w-4xl mx-auto mt-20">
            <div className="rounded-2xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden bg-[#0f0f1a]">
              <div className="bg-[#161622] border-b border-white/10 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 mx-4 bg-white/5 rounded-md px-3 py-1.5 text-xs text-gray-500 border border-white/10 max-w-xs flex items-center gap-2">
                  <Lock className="w-3 h-3 text-green-500" />
                  app.reviewflow.ai/dashboard
                </div>
              </div>
              <div className="p-6 grid grid-cols-4 gap-4">
                {[
                  { label: "Total Reviews", value: "247", change: "+12 this week", color: "text-blue-400" },
                  { label: "Avg. Rating", value: "4.8â˜…", change: "â†‘ from 4.3", color: "text-yellow-400" },
                  { label: "Customers", value: "1,840", change: "+38 this month", color: "text-green-400" },
                  { label: "Conversion", value: "68%", change: "â†‘ from 51%", color: "text-violet-400" },
                ].map(({ label, value, change, color }) => (
                  <div key={label} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                    <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{change}</p>
                  </div>
                ))}
                <div className="col-span-3 bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                  <p className="text-xs text-gray-500 font-medium mb-3">Review requests â€” last 30 days</p>
                  <div className="flex items-end gap-1 h-14">
                    {[3,5,4,7,6,9,8,11,10,13,12,15,14,16,18,15,19,17,21,20,18,22,24,21,23,25,22,27,26,28].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{ height: `${(h / 28) * 100}%`, background: `rgba(59,130,246,${0.3 + (h / 28) * 0.5})` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                  <p className="text-xs text-gray-500 font-medium mb-2">Recent</p>
                  {[5,5,4,5,4].map((r, i) => (
                    <div key={i} className="flex gap-0.5 mb-1">
                      {Array.from({ length: r }).map((_, j) => (
                        <Star key={j} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <div className="border-y border-white/[0.06] bg-white/[0.02] py-10 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-xs font-bold text-gray-600 uppercase tracking-widest mb-8">
              Trusted by businesses worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-10">
              {["Marco&apos;s Pizza", "Glow Salon", "CityDent Clinic", "FitZone Gym", "Oak & Ember", "PureWax Studio"].map((name) => (
                <span key={name} className="text-sm font-semibold text-gray-600 tracking-tight">{name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Problem / Solution */}
        <section className="py-28 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-widest mb-5 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                The problem
              </span>
              <h2 className="text-4xl font-bold text-white leading-tight mb-6">
                You give great service.<br />
                <span className="text-gray-500">But nobody writes the review.</span>
              </h2>
              <div className="space-y-4 text-[15px] text-gray-400 leading-relaxed">
                <p>Customers mean to leave a review. Then they get home, open Google, stare at a blank box â€” and close the tab.</p>
                <p>Meanwhile your competitor with 300 reviews is ranking above you, even though your service is better.</p>
                <p>Asking face-to-face is awkward. Texting manually doesn&apos;t scale. You need a system.</p>
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-400 uppercase tracking-widest mb-5 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                The solution
              </span>
              <h2 className="text-4xl font-bold text-white leading-tight mb-6">
                Remove every barrier between<br />
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  your customer and the review.
                </span>
              </h2>
              <div className="space-y-3">
                {[
                  "One tap from a QR code â€” no app needed",
                  "AI writes a ready-to-copy review draft",
                  "Opens Google Reviews automatically",
                  "Unhappy customers go to private feedback",
                  "Automated follow-up reminder",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <p className="text-[15px] text-gray-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-6 border-y border-white/[0.06] bg-white/[0.01]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Features</span>
              <h2 className="text-4xl font-bold text-white mt-3 mb-4">Everything you need. Nothing you don&apos;t.</h2>
              <p className="text-gray-400 max-w-md mx-auto">No complicated setup. No integrations needed. Works for any local business out of the box.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: QrCode, gradient: "from-blue-500/20 to-blue-600/5", border: "border-blue-500/20", iconColor: "text-blue-400", title: "QR code + link", desc: "Print on receipts, display at checkout, or send via WhatsApp. Your branded review page works anywhere." },
                { icon: Sparkles, gradient: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/20", iconColor: "text-yellow-400", title: "AI review drafts", desc: "4â€“5 star customers see three copy-ready review drafts written specifically for your business. One click to Google." },
                { icon: Shield, gradient: "from-green-500/20 to-green-600/5", border: "border-green-500/20", iconColor: "text-green-400", title: "Smart rating filter", desc: "1â€“3 star customers are silently routed to private feedback. Protect your reputation before damage is done." },
                { icon: MessageSquare, gradient: "from-purple-500/20 to-purple-600/5", border: "border-purple-500/20", iconColor: "text-purple-400", title: "Private feedback", desc: "Unhappy customers vent to you â€” not online. Get actionable feedback and fix issues before they go public." },
                { icon: BarChart3, gradient: "from-indigo-500/20 to-indigo-600/5", border: "border-indigo-500/20", iconColor: "text-indigo-400", title: "Analytics", desc: "Open rates, daily conversions, average ratings, and customer trends â€” all in a clean minimal dashboard." },
                { icon: TrendingUp, gradient: "from-rose-500/20 to-rose-600/5", border: "border-rose-500/20", iconColor: "text-rose-400", title: "Customer CRM", desc: "Track visit history, tag new vs. loyal customers, add notes, and see each customer's full review history." },
              ].map(({ icon: Icon, gradient, border, iconColor, title, desc }) => (
                <div key={title} className={`relative rounded-2xl border ${border} p-6 bg-gradient-to-br ${gradient} hover:scale-[1.02] transition-transform duration-200 cursor-default backdrop-blur-sm`}>
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-4">
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">How it works</span>
              <h2 className="text-4xl font-bold text-white mt-3">Up and running in 5 minutes</h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              {[
                { step: "01", icon: Globe, title: "Create your account", desc: "Sign up, add your business info and Google Review URL." },
                { step: "02", icon: QrCode, title: "Display your QR code", desc: "Put it at the counter, on receipts, or send the link." },
                { step: "03", icon: Star, title: "Customer rates you", desc: "Happy customers see AI drafts. Unhappy ones give private feedback." },
                { step: "04", icon: TrendingUp, title: "Reviews grow", desc: "They copy the draft, Google opens automatically." },
              ].map(({ step, icon: Icon, title, desc }) => (
                <div key={step} className="text-center relative z-10">
                  <div className="relative inline-block mb-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#0a0a0f] border border-white/20 rounded-full text-xs font-bold text-gray-400 flex items-center justify-center">
                      {step}
                    </span>
                  </div>
                  <h3 className="font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 px-6 border-y border-white/[0.06] bg-white/[0.01]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Testimonials</span>
              <h2 className="text-4xl font-bold text-white mt-3">Real results from real businesses</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { name: "Sarah M.", role: "Owner, Glow Beauty Studio", av: "SM", col: "bg-pink-500/20 text-pink-300", quote: "We went from 41 reviews to 180 in 3 months. The AI drafts are shockingly good â€” customers actually use them. Game changer." },
                { name: "Tariq H.", role: "Manager, CityBite Restaurant", av: "TH", col: "bg-orange-500/20 text-orange-300", quote: "The private feedback feature caught a kitchen issue before it became a 1-star review. We fixed it and the customer came back." },
                { name: "Dr. Aisha K.", role: "Principal, SmileCare Dental", av: "AK", col: "bg-blue-500/20 text-blue-300", quote: "Our Google rating went from 4.1 to 4.7 in 6 weeks. Patients never knew how to write a review â€” the draft makes it effortless." },
              ].map(({ name, role, av, col, quote }) => (
                <div key={name} className="bg-white/[0.04] rounded-2xl border border-white/[0.08] p-6 hover:border-white/20 transition-colors">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-[15px] text-gray-300 leading-relaxed mb-6">&ldquo;{quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${col} flex items-center justify-center text-xs font-bold`}>{av}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{name}</p>
                      <p className="text-xs text-gray-500">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-28 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Pricing</span>
              <h2 className="text-4xl font-bold text-white mt-3 mb-3">Simple, honest pricing</h2>
              <p className="text-gray-400 text-sm">No hidden fees. No per-review charges. Cancel anytime.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-colors">
                <p className="text-sm font-semibold text-gray-400 mb-2">Starter</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-white">₹0</span>
                  <span className="text-gray-500 text-sm mb-2">/month</span>
                </div>
                <p className="text-xs text-gray-600 mb-7">Free forever</p>
                <Link href="/sign-up" className="block text-center py-3 px-4 border border-white/20 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-colors mb-7">
                  Get started free
                </Link>
                <ul className="space-y-3 text-sm text-gray-300">
                  {["1 business location", "Unlimited review requests", "QR code + share link", "AI review drafts", "Private feedback capture", "Basic analytics"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5"><Check className="w-4 h-4 text-green-400 shrink-0" />{f}</li>
                  ))}
                </ul>
              </div>
              <div className="relative rounded-2xl p-8 bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-500/30 border border-blue-400/30">
                <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">Most popular</div>
                <p className="text-sm font-semibold text-blue-200 mb-2">Pro</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-white">₹2,499</span>
                  <span className="text-blue-200 text-sm mb-2">/month</span>
                </div>
                <p className="text-xs text-blue-200/70 mb-7">Billed monthly</p>
                <Link href="/sign-up" className="block text-center py-3 px-4 bg-white rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors mb-7 shadow-lg">
                  Start 14-day free trial
                </Link>
                <ul className="space-y-3 text-sm text-white">
                  {["Everything in Starter", "Up to 5 locations", "WhatsApp automation", "Automated reminders", "Advanced analytics", "Customer CRM + tags", "Priority support"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-200 shrink-0" />{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 px-6 border-t border-white/[0.06]">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">FAQ</span>
              <h2 className="text-4xl font-bold text-white mt-3">Questions we get a lot</h2>
            </div>
            <div className="space-y-3">
              {[
                { q: "Does this violate Google's review policies?", a: "No. We never pay for reviews, post fake reviews, or incentivise ratings. We simply make it easier for genuinely happy customers to share their real experience â€” which is completely within Google's guidelines." },
                { q: "Do customers need to download an app?", a: "No app needed. They scan the QR code or tap the link â€” it opens directly in their browser. The whole process takes under 60 seconds." },
                { q: "What happens when a customer gives a low rating?", a: "Customers who rate 1â€“3 stars are quietly routed to a private feedback form. Their experience never reaches Google. You get the feedback directly so you can address it." },
                { q: "How good are the AI-written review drafts?", a: "Very specific. The AI knows your business name, location, and any details you add in settings. Customers can edit the draft or write their own â€” but most just copy it as-is." },
                { q: "Can I use it for multiple locations?", a: "Yes. The Pro plan supports up to 5 locations, each with their own review page, QR code, and analytics dashboard." },
                { q: "Is my data secure?", a: "Yes. All data is encrypted in transit and at rest. Authentication is handled by Clerk, a SOC 2 certified provider." },
              ].map(({ q, a }) => (
                <FAQItem key={q} q={q} a={a} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-28 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />
          <div className="max-w-xl mx-auto relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/40">
              <Star className="w-8 h-8 text-white fill-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
              Your next 50 Google reviews<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                are already out there
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 leading-relaxed">
              They just need an easy way to leave them. Set up ReviewFlow in 5 minutes.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all text-base shadow-2xl shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Get started for free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-gray-600 mt-5">No credit card Â· Free forever on Starter</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center shadow-md shadow-blue-500/30">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="font-bold text-white text-sm">ReviewFlow</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <Link href="/sign-in" className="hover:text-white transition-colors">Sign in</Link>
            </div>
            <p className="text-xs text-gray-600">Â© {new Date().getFullYear()} ReviewFlow AI. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
