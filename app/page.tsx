"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Check, ArrowRight, Users, FolderKanban, CreditCard, TrendingUp, Clock, FileText, Shield, Instagram, Building2 } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header - Sticky */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/images/clienzo-logo.png"
            alt="Clienzo"
            width={120}
            height={40}
            className="object-contain"
          />
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#about" className="text-gray-700 hover:text-purple-600 transition">
            About
          </Link>
          <Link href="#how-it-works" className="text-gray-700 hover:text-purple-600 transition">
            How It Works
          </Link>
          <Link href="#why" className="text-gray-700 hover:text-purple-600 transition">
            Why Clienzo
          </Link>
          <Link href="#pricing" className="text-gray-700 hover:text-purple-600 transition">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/login"
            className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-700 hover:text-purple-600 transition"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-4 md:px-6 py-2 text-sm md:text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition"
          >
            Get Started
          </Link>
        </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-8 md:py-20">
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          <div className="text-left w-full">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-3 md:mb-4 font-medium">
              Hello agency owners and freelancers 👋
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              Client Management
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Made Easy
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-4 md:mb-8">
              Simplify client and project management for freelancers and agencies.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 md:px-8 py-2.5 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm md:text-lg font-semibold hover:shadow-xl transition mb-4 md:mb-8 w-full sm:w-auto justify-center sm:justify-start"
            >
              Get Started
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
            <div className="space-y-2 md:space-y-3">
              {[
                "Track clients & projects",
                "Manage payments effortlessly",
                "Stay on top of your follow-ups",
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center justify-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm md:text-base text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-end">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 md:p-12 w-full max-w-md">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Clients</h3>
                    <p className="text-sm text-gray-600">Organize all client information</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <FolderKanban className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Track Projects</h3>
                    <p className="text-sm text-gray-600">Monitor project progress</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Handle Payments</h3>
                    <p className="text-sm text-gray-600">Track all transactions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Clienzo For Section */}
      <section id="about" className="container mx-auto px-4 sm:px-6 py-12 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
            What is Clienzo For?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 md:mb-12 max-w-3xl mx-auto">
            Clienzo is designed for <strong className="text-gray-900">freelancers and agencies</strong> who want to streamline their client management, 
            track projects efficiently, and never miss a payment. Whether you&apos;re a solo freelancer or running a growing agency, 
            Clienzo helps you stay organized and focused on what matters most - delivering great work.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
              <Users className="w-10 h-10 text-purple-600 mb-4 mx-auto" />
              <h3 className="font-semibold text-gray-900 mb-2">For Freelancers</h3>
              <p className="text-sm text-gray-600">
                Perfect for independent professionals managing multiple clients and projects on their own.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
              <FolderKanban className="w-10 h-10 text-blue-600 mb-4 mx-auto" />
              <h3 className="font-semibold text-gray-900 mb-2">For Agencies</h3>
              <p className="text-sm text-gray-600">
                Ideal for agencies managing teams, multiple clients, and complex project workflows.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 sm:col-span-2 md:col-span-1">
              <TrendingUp className="w-10 h-10 text-green-600 mb-4 mx-auto" />
              <h3 className="font-semibold text-gray-900 mb-2">For Growing Businesses</h3>
              <p className="text-sm text-gray-600">
                Scale your operations with tools that grow with your business needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Clienzo Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
              How Clienzo Works
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes and manage your clients like a pro
            </p>
          </div>
          <div className="space-y-8 md:space-y-12">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Sign Up & Complete Your Profile</h3>
                <p className="text-gray-600 mb-4">
                  Create your account in seconds. Tell us if you&apos;re a freelancer or agency, and we&apos;ll customize your experience.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Quick signup with email or Google</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Simple profile setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Start with free plan - no credit card required</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Add Your Clients</h3>
                <p className="text-gray-600 mb-4">
                  Start by adding your clients. Store their contact information, notes, and important details all in one place.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Add client name, email, phone, and notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Organize all client information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Access client details anytime, anywhere</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Create Projects & Track Progress</h3>
                <p className="text-gray-600 mb-4">
                  Link projects to clients, set deadlines, track status, and monitor progress. Keep everything organized and visible.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Create projects linked to clients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Set deadlines and track project status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Monitor project progress at a glance</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Track Payments & Revenue</h3>
                <p className="text-gray-600 mb-4">
                  Record payments, calculate pending amounts, and get insights into your revenue. Never miss a payment again.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Record payments per project</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>See pending payments clearly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Get revenue insights (Pro feature)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Clienzo Section */}
      <section id="why" className="container mx-auto px-4 sm:px-6 py-12 md:py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
              Why Choose Clienzo?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your clients, projects, and payments in one simple platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Centralized Client Management</h3>
              <p className="text-gray-600">
                Keep all your client information, contact details, and notes in one organized place. No more searching through emails or spreadsheets.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                <FolderKanban className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Project Tracking Made Simple</h3>
              <p className="text-gray-600">
                Link projects to clients, set deadlines, track status, and monitor progress. See everything at a glance on your dashboard.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Never Miss a Payment</h3>
              <p className="text-gray-600">
                Track all payments, calculate pending amounts, and get alerts. With Pro, you get payment analytics and revenue insights.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Stay on Top of Follow-ups</h3>
              <p className="text-gray-600">
                Set reminders for important dates and deadlines. Pro users get in-app reminders to never miss a follow-up.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Revenue Insights</h3>
              <p className="text-gray-600">
                Get a clear view of your business with monthly revenue tracking, pending payments summary, and project-wise earnings (Pro feature).
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Your data is secure with Firebase&apos;s enterprise-grade security. All your information is encrypted and private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="text-left md:text-center mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">Choose Your Plan</h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">Start free, upgrade when you need more</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border-2 border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
            <p className="text-4xl font-bold mb-6">
              ₹0<span className="text-lg text-gray-500">/month</span>
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Up to 3 Clients",
                "Up to 3 Active Projects",
                "Basic Dashboard",
                "Manual payment entry",
                "Web access",
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Get Started
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 shadow-xl text-white relative border-2 border-yellow-400">
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
              🔥 LIMITED DEAL
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-4xl font-bold mb-2">
              ₹39<span className="text-lg opacity-90">/month</span>
            </p>
            <p className="text-sm opacity-90 mb-2">
              or ₹468/year
            </p>
            <p className="text-xs opacity-75 mb-2">
              Save 0% with yearly billing (12 months)
            </p>
            <p className="text-xs bg-yellow-500/30 text-yellow-100 px-2 py-1 rounded mb-6 inline-block font-semibold">
              ⚡ Limited time offer - Special launch price!
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Unlimited Clients",
                "Unlimited Projects",
                "Payment Analytics",
                "Follow-up Reminders",
                "Export Data",
                "Revenue Insights",
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Upgrade to Pro
            </Link>
          </div>

          {/* Agency Plan */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 shadow-xl text-white relative">
            <div className="absolute top-4 right-4 bg-green-400 text-green-900 px-3 py-1 rounded-full text-sm font-semibold">
              Best Value
            </div>
            <h3 className="text-2xl font-bold mb-2">Agency</h3>
            <p className="text-4xl font-bold mb-2">
              ₹499<span className="text-lg opacity-90">/year</span>
            </p>
            <p className="text-sm opacity-90 mb-6">
              ₹{Math.round(499 / 12)}/month billed annually
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Unlimited Clients",
                "Unlimited Projects",
                "Payment Analytics",
                "Follow-up Reminders",
                "Export Data",
                "Revenue Insights",
                "Team Collaboration",
                "White-label Options",
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Choose Agency Plan
            </Link>
          </div>
        </div>
      </section>

      {/* Provided By Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 md:mb-6">
            Provided by
          </p>
          <div className="flex justify-center items-center mb-2 md:mb-3">
            <Image
              src="/images/appsetz.png"
              alt="Appsetz"
              width={400}
              height={100}
              className="object-contain w-full max-w-md md:max-w-lg lg:max-w-xl"
              priority
            />
          </div>
          <div className="max-w-2xl mx-auto">
            <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-4 md:mb-6 leading-relaxed">
              <strong className="text-gray-900">Appsetz</strong> is a development agency that developed Clienzo to help other agencies and freelancers scale their businesses. 
              We understand the challenges of managing clients, projects, and payments, which is why we built this comprehensive solution.
            </p>
            <a
              href="https://www.instagram.com/appsetz?igsh=MXc4OXNuYms3eGg4OA=="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              <Instagram className="w-5 h-5" />
              Follow Appsetz on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 py-8 md:py-12 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/images/clienzo-logo.png"
                alt="Clienzo"
                width={100}
                height={33}
                className="object-contain"
              />
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-black mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="/dashboard" className="hover:text-purple-600">Dashboard</Link></li>
              <li><Link href="/clients" className="hover:text-purple-600">Clients</Link></li>
              <li><Link href="/projects" className="hover:text-purple-600">Projects</Link></li>
              <li><Link href="/payments" className="hover:text-purple-600">Payments</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-black mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="#" className="hover:text-purple-600">Help Center</Link></li>
              <li><Link href="#" className="hover:text-purple-600">Support</Link></li>
              <li><Link href="#" className="hover:text-purple-600">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-black mb-4">Contact Us</h4>
            <ul className="space-y-2 text-gray-600">
              <li>hello@clienzo.com</li>
              <li>+91 98765 43210</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-gray-600 pt-8 border-t border-gray-200">
          <div className="flex flex-col items-center gap-4">
            <p>&copy; 2024 Clienzo. All rights reserved.</p>
            <div className="flex items-center gap-3 text-base text-gray-500">
              <span>Powered by</span>
              <Image
                src="/images/appsetz.png"
                alt="Appsetz"
                width={150}
                height={40}
                className="object-contain opacity-80 hover:opacity-100 transition"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

