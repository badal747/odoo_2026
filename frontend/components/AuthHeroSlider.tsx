"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, CreditCard, BarChart3, Clock, ShieldCheck, Trophy } from "lucide-react";
import api from "@/lib/api";

export const SLIDES = [
  {
    image: "/hero_slide_1.jpg",
    icon: CreditCard,
    tag: "STRENGTH & PAYROLL PRECISION",
    title: "Transform Your Workforce with Intelligent Automation",
    description:
      "Automated salary rule calculation, biometric attendance tracking, and compliant statutory bank transfer slips.",
  },
  {
    image: "/hero_slide_2.jpg",
    icon: BarChart3,
    tag: "OPERATIONS & ANALYTICS",
    title: "Real-Time Wage Analytics & Batch Processing",
    description:
      "Monitor labor cost trends, overtime deductions, and gross-to-net salary formulas across all departments.",
  },
  {
    image: "/hero_slide_3.jpg",
    icon: Clock,
    tag: "SMART ATTENDANCE & LEAVES",
    title: "Biometric Clock-In & Automated Leave Balancing",
    description:
      "Seamless check-in/out tracking with geolocation compliance, 20 PTO days allocation, and instant manager approvals.",
  },
  {
    image: "/hero_slide_4.jpg",
    icon: ShieldCheck,
    tag: "STATUTORY COMPLIANCE",
    title: "100% Tax Compliant Indian Payroll Engine",
    description:
      "Accurate Provident Fund (PF), Professional Tax (PT), and TDS deductions with strict negative salary safeguards.",
  },
  {
    image: "/hero_slide_5.jpg",
    icon: Trophy,
    tag: "ORGANIZATIONAL MILESTONES",
    title: "Empowering 15+ Active Organization Members",
    description:
      "Zero-friction onboarding, transparent monthly payslips, and 1-click bank transfer register exports.",
  },
];

export default function AuthHeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeEmployeesCount, setActiveEmployeesCount] = useState<number | null>(null);

  // Auto-cycle through the 5 slides every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Fetch real-time active employees count and synchronize every 10 seconds
  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const res = await api.get("/auth/public-stats");
        if (res.data && typeof res.data.active_employees_count === "number") {
          setActiveEmployeesCount(res.data.active_employees_count);
        }
      } catch {
        // Graceful fallback if network is temporarily unavailable
      }
    };

    fetchLiveStats();
    const statsPoll = setInterval(fetchLiveStats, 10000);
    return () => clearInterval(statsPoll);
  }, []);

  const slide = SLIDES[currentSlide];
  const IconComponent = slide.icon;

  const formattedCount =
    activeEmployeesCount !== null
      ? activeEmployeesCount >= 100
        ? `${activeEmployeesCount.toLocaleString()}+ Active Employees`
        : `${activeEmployeesCount} Active Employee${activeEmployeesCount === 1 ? "" : "s"}`
      : "Active Employees";

  return (
    <div className="hidden lg:flex lg:w-1/2 min-h-screen relative p-12 xl:p-16 flex-col justify-between overflow-hidden bg-slate-950 text-white select-none">
      {/* 5 Background Images with Cinematic Dissolve Fade */}
      {SLIDES.map((item, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
            currentSlide === idx ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
          }`}
          style={{
            backgroundImage: `url('${item.image}')`,
          }}
        />
      ))}

      {/* Elegant Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/50" />

      {/* Top Row: Brand Badge + Real-Time Active Employees Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
          <div className="w-6 h-6 rounded-lg bg-white text-slate-900 flex items-center justify-center font-black text-xs">
            P
          </div>
          <span className="text-xs font-bold tracking-tight text-white">PeoplePay360</span>
        </div>

        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-amber-300 font-medium shadow-sm transition-all">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>{formattedCount}</span>
        </div>
      </div>

      {/* Bottom Carousel Hero Content with Smooth Key Transition */}
      <div className="relative z-10 space-y-4 max-w-xl">
        {/* Category Tag */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-wider text-teal-300 transition-all">
          <IconComponent className="w-3 h-3" />
          <span>{slide.tag}</span>
        </div>

        {/* Dynamic Headline */}
        <h2 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-snug transition-all duration-500">
          {slide.title}
        </h2>

        {/* Dynamic Description */}
        <p className="text-xs xl:text-sm text-slate-200/90 leading-relaxed transition-all duration-500 min-h-[36px]">
          {slide.description}
        </p>

        {/* 5 Interactive Pagination Dots */}
        <div className="flex items-center space-x-2 pt-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`transition-all duration-300 h-1.5 rounded-full ${
                currentSlide === idx ? "w-8 bg-white shadow-sm" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
