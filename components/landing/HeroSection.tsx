"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";

const menuItems = [
  { name: "About", href: "#about" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Why Clienova", href: "#why" },
  { name: "FAQ", href: "#faq" },
];

export const HeroSection = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [lastScrollY, setLastScrollY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      // Only apply scroll behavior on mobile (screen width < 768px)
      if (window.innerWidth >= 768) {
        setIsScrolled(false);
        return;
      }

      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide nav
        setIsScrolled(true);
      } else {
        // Scrolling up - show nav
        setIsScrolled(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div>
      <header>
        <nav
          data-state={menuState && "active"}
          className={`group fixed z-20 w-full md:border-b md:border-dashed bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 md:relative md:bg-white dark:bg-zinc-950/50 lg:dark:bg-transparent transition-transform duration-300 ${
            isScrolled ? '-translate-y-full' : 'translate-y-0'
          }`}
        >
          <div className="m-auto max-w-5xl px-6">
            <div className="flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
              <div className="flex w-full justify-between lg:w-auto">
                <Link href="/" aria-label="home" className="flex items-center space-x-2">
                  <Image
                    src="/images/bg-removed-logo.png"
                    alt="Clienova"
                    width={300}
                    height={100}
                    className="h-20 md:h-24 lg:h-28 w-auto object-contain"
                  />
                </Link>
                <button
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                  className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                >
                  <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200 text-gray-900" />
                  <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 text-gray-900" />
                </button>
              </div>
              <div className="bg-white/95 backdrop-blur-sm md:bg-white group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-gray-200 md:border-gray-300 p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                <div className="lg:pr-4">
                  <ul className="space-y-6 text-base lg:flex lg:gap-8 lg:space-y-0 lg:text-sm">
                    {menuItems.map((item, index) => (
                      <li key={index}>
                        <Link
                          href={item.href}
                          className="text-gray-900 hover:text-purple-600 block duration-150"
                        >
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:border-l lg:pl-6">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center text-gray-900"
                  >
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition text-center"
                  >
                    <span>Get Started</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <div
          aria-hidden
          className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block"
        >
          <div className="w-[35rem] h-[80rem] -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-[80rem] -translate-y-87.5 absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>

        <section className="overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 md:bg-white dark:bg-transparent">
          <div className="relative mx-auto max-w-5xl px-6 py-28 lg:py-24">
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <h1 className="text-balance text-4xl font-semibold md:text-5xl lg:text-6xl text-gray-900 animate-fade-in-up">
                Designed for Work That Grows
              </h1>
              <p className="mx-auto my-8 max-w-2xl text-xl text-gray-600 animate-fade-in-up-delay">
                The ultimate client management tool for freelancers and agencies. Manage clients, projects, payments, and deadlines all in one place.
              </p>
              <div className="mt-8 animate-fade-in-up-delay-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
          <div className="mx-auto -mt-20 max-w-7xl [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)] group">
            <div className="[perspective:1200px] [mask-image:linear-gradient(to_right,black_50%,transparent_100%)] -mr-16 pl-16 lg:-mr-56 lg:pl-56">
              <div className="[transform:rotateX(20deg);] transition-transform duration-500 group-hover:[transform:rotateX(15deg)_scale(1.05)]">
                <div className="lg:h-[44rem] relative skew-x-[.36rad] transition-all duration-500 group-hover:skew-x-[.3rad]">
                  <div className="relative bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden transition-all duration-500 group-hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.5)] group-hover:border-purple-500/50 group-hover:scale-[1.02]">
                    <div className="flex h-full">
                      {/* Sidebar */}
                      <div className="w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-6 space-y-6">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center transition-all duration-300 group-hover:bg-blue-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/50">
                          <svg className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-700 transition">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-700 transition">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-700 transition">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Main Content */}
                      <div className="flex-1 bg-gray-900 p-6">
                        <div className="mb-6">
                          <h2 className="text-2xl font-semibold text-white mb-2">Dashboard</h2>
                        </div>
                        
                        {/* Overview Section */}
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-white mb-1">Overview</h3>
                          <p className="text-sm text-gray-400 mb-4">Visualize your main activities data</p>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 transition-all duration-300 group-hover:border-purple-500/30 group-hover:bg-gray-750 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-purple-500/20">
                              <p className="text-xs text-gray-400 mb-2 transition-colors duration-300 group-hover:text-gray-300">New Orders</p>
                              <div className="flex items-center justify-between">
                                <p className="text-2xl font-bold text-white transition-transform duration-300 group-hover:scale-110">639400</p>
                                <div className="flex items-center gap-1 text-green-500 transition-all duration-300 group-hover:scale-110 group-hover:text-green-400">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                  </svg>
                                  <span className="text-xs font-medium">32%</span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 transition-all duration-300 group-hover:border-purple-500/30 group-hover:bg-gray-750 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-purple-500/20">
                              <p className="text-xs text-gray-400 mb-2 transition-colors duration-300 group-hover:text-gray-300">New Customers</p>
                              <div className="flex items-center justify-between">
                                <p className="text-2xl font-bold text-white transition-transform duration-300 group-hover:scale-110">478000</p>
                                <div className="flex items-center gap-1 text-red-500 transition-all duration-300 group-hover:scale-110 group-hover:text-red-400">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                  <span className="text-xs font-medium">15%</span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 transition-all duration-300 group-hover:border-purple-500/30 group-hover:bg-gray-750 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-purple-500/20">
                              <p className="text-xs text-gray-400 mb-2 transition-colors duration-300 group-hover:text-gray-300">Revenue</p>
                              <div className="flex items-center justify-between">
                                <p className="text-2xl font-bold text-white transition-transform duration-300 group-hover:scale-110">₹2.4L</p>
                                <div className="flex items-center gap-1 text-green-500 transition-all duration-300 group-hover:scale-110 group-hover:text-green-400">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                  </svg>
                                  <span className="text-xs font-medium">24%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Chart Section */}
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 transition-all duration-300 group-hover:border-purple-500/30 group-hover:bg-gray-750 group-hover:shadow-lg group-hover:shadow-purple-500/20">
                          <h3 className="text-lg font-semibold text-white mb-1 transition-colors duration-300 group-hover:text-purple-300">New Orders</h3>
                          <p className="text-sm text-gray-400 mb-4 transition-colors duration-300 group-hover:text-gray-300">Visualize your main activities data</p>
                          <div className="flex items-end justify-between h-32 gap-2">
                            {[5800, 5200, 4800, 4500, 4200, 4000, 3800, 3600, 3400, 3200, 3000, 2800].map((height, idx) => (
                              <div key={idx} className="flex-1 flex flex-col items-center group/bar">
                                <div 
                                  className="w-full bg-blue-600 rounded-t transition-all duration-500 group-hover/bar:bg-gradient-to-t group-hover/bar:from-blue-500 group-hover/bar:to-purple-500 group-hover/bar:shadow-lg group-hover/bar:shadow-blue-500/50 group-hover:scale-105"
                                  style={{ height: `${(height / 5800) * 100}%` }}
                                ></div>
                                <span className="text-xs text-gray-500 mt-1 transition-colors duration-300 group-hover:text-gray-400">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][idx]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background relative z-10 pt-4 pb-16 overflow-hidden">
          <div className="m-auto max-w-5xl px-6">
            <h2 className="text-center text-lg font-medium text-gray-700 mb-12">
              Trusted by freelancers and agencies worldwide
            </h2>
            
            {/* Scrolling Animation Container */}
            <div className="relative overflow-hidden">
              <div className="flex animate-scroll-left-to-right gap-6 md:gap-8">
                {/* Badge data array */}
                {(() => {
                  const badges = [
                    { text: "Freelancers", gradient: "from-purple-100 to-pink-100", color: "text-purple-700" },
                    { text: "Agencies", gradient: "from-blue-100 to-purple-100", color: "text-blue-700" },
                    { text: "Businesses", gradient: "from-green-100 to-emerald-100", color: "text-green-700" },
                    { text: "Project Management", gradient: "from-orange-100 to-red-100", color: "text-orange-700" },
                    { text: "Payment Tracking", gradient: "from-indigo-100 to-purple-100", color: "text-indigo-700" },
                    { text: "Client Portal", gradient: "from-pink-100 to-rose-100", color: "text-pink-700" },
                    { text: "Team Collaboration", gradient: "from-cyan-100 to-blue-100", color: "text-cyan-700" },
                    { text: "Invoice Generator", gradient: "from-violet-100 to-purple-100", color: "text-violet-700" },
                    { text: "Analytics", gradient: "from-amber-100 to-orange-100", color: "text-amber-700" },
                    { text: "Secure & Private", gradient: "from-teal-100 to-green-100", color: "text-teal-700" },
                  ];
                  
                  // Render badges twice for seamless loop
                  return [...badges, ...badges].map((badge, index) => (
                    <div key={`badge-${index}`} className="flex-shrink-0">
                      <div className={`px-4 py-2 bg-gradient-to-r ${badge.gradient} rounded-lg shadow-sm`}>
                        <span className={`text-sm font-semibold ${badge.color}`}>{badge.text}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

