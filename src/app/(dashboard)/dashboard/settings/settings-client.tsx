"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Sparkles, X } from "lucide-react";

const AI_CONTEXT_TEMPLATE = `Business Name: [Your Business Name]
Business Type: [e.g. Restaurant / Hair Salon / Dental Clinic / Tech Company / Gym / Retail Shop]
Location: [City, Neighbourhood, State/Country]
Established: [Year you opened]

What We Do:
[Describe your core service or product in 1-2 sentences. Be specific.]

Our Specialties / Signature Offerings:
- [Top item, service, or product #1]
- [Top item, service, or product #2]
- [Top item, service, or product #3]

What Makes Us Unique:
[What sets you apart? Awards, techniques, story, sourcing, people, values — be honest and specific.]

Atmosphere & Experience:
[Describe the vibe. e.g. "Warm and cozy family atmosphere", "Modern minimalist studio", "Fast and professional", "Luxury spa-like experience"]

Who We Serve Best:
[e.g. "Families and couples on date nights", "Small business owners", "Athletes and fitness enthusiasts", "Professionals needing fast service"]

Our Team:
[Mention key staff by first name if comfortable. e.g. "Led by Chef Marco who trained in Naples" or "Our lead stylist Priya has 12 years of experience"]

Things Customers Always Rave About:
[What do regulars love most? Be specific — these details make reviews sound real and trustworthy.]

Local SEO Keywords to Include in Reviews:
[Optional: e.g. "best pizza in Brooklyn", "top-rated hair salon in Dubai", "affordable dental clinic near downtown Austin"]`;


type TenantSettings = {
  name: string;
  googleReviewUrl: string;
  phone: string;
  email: string;
  address: string;
  aiContext: string;
};

export default function SettingsClient() {
  const [form, setForm] = useState<TenantSettings>({
    name: "",
    googleReviewUrl: "",
    phone: "",
    email: "",
    address: "",
    aiContext: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/tenants/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setForm({
            name: json.data.name ?? "",
            googleReviewUrl: json.data.googleReviewUrl ?? "",
            phone: json.data.phone ?? "",
            email: json.data.email ?? "",
            address: json.data.address ?? "",
            aiContext: json.data.aiContext ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/tenants/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully." });
      } else {
        const json = await res.json();
        setMessage({ type: "error", text: json.error ?? "Failed to save." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update your business profile and review settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-800">
            Business Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main St, City, State"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+15555550100"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="hello@yourbusiness.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Google Review */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">
            Google Review Link
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Review URL *
            </label>
            <input
              type="url"
              required
              value={form.googleReviewUrl}
              onChange={(e) =>
                setForm({ ...form, googleReviewUrl: e.target.value })
              }
              placeholder="https://g.page/r/YOUR_PLACE_ID/review"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="bg-blue-50 rounded-lg px-4 py-3 text-xs text-blue-700">
            <strong>How to get your Google Review link:</strong> Go to Google
            Business Profile → Get more reviews → Copy the link.
          </div>
        </div>

        {/* AI Context */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">✨ AI Review Context</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Describe your business in detail. The AI uses this to write specific, relevant review drafts for your customers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
            >
              <Sparkles className="w-3 h-3" />
              Use Template
            </button>
          </div>
          <div>
            <textarea
              value={form.aiContext}
              onChange={(e) => setForm({ ...form, aiContext: e.target.value })}
              rows={6}
              maxLength={2000}
              placeholder={`Tell the AI everything about your business. For example:\n\n"We are a family-owned Italian restaurant in downtown Austin, TX. Known for our wood-fired Neapolitan pizza and house-made pasta. Our head chef Marco trained in Naples. We're famous for our Margherita pizza and tiramisu. Cozy 40-seat dining room, romantic atmosphere, great for date nights and family dinners. Open since 2018."`}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-700 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.aiContext.length}/2000</p>
          </div>
          <div className="bg-amber-50 rounded-lg px-4 py-3 text-xs text-amber-700 space-y-1">
            <p><strong>💡 Tips for great AI reviews:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Mention your specialty dishes / services / products</li>
              <li>Include what makes you unique (awards, techniques, history)</li>
              <li>Describe the atmosphere and who it&apos;s best for</li>
              <li>Add staff names or highlights customers often mention</li>
            </ul>
          </div>
        </div>

        {/* Save */}
        {message && (
          <div
            className={`px-4 py-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <h3 className="text-base font-semibold text-gray-900">AI Context Template</h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Replace the bracketed text with your real business details</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template preview */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <pre className="text-xs text-gray-700 font-mono leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-200">
                {AI_CONTEXT_TEMPLATE}
              </pre>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400">This will replace your current context</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...form, aiContext: AI_CONTEXT_TEMPLATE });
                    setShowTemplateModal(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
