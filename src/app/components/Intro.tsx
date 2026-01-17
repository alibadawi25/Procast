"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { motion } from "framer-motion";

import BriefcaseIcon from "@heroicons/react/24/outline/BriefcaseIcon";
import LifebuoyIcon from "@heroicons/react/24/outline/LifebuoyIcon";
import ChartBarIcon from "@heroicons/react/24/outline/ChartBarIcon";
import BoltIcon from "@heroicons/react/24/outline/BoltIcon";
import UsersIcon from "@heroicons/react/24/outline/UsersIcon";
import ArrowRightIcon from "@heroicons/react/24/outline/ArrowRightIcon";
import ArrowTrendingUpIcon from "@heroicons/react/24/outline/ArrowTrendingUpIcon";
import ShieldCheckIcon from "@heroicons/react/24/outline/ShieldCheckIcon";
import LightBulbIcon from "@heroicons/react/24/outline/LightBulbIcon";

export default function Intro({ onLogin }: { onLogin: () => void }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    onLogin();
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#1a3a52] to-[#2e4f6a] text-[#e8dcc8] overflow-hidden">
      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-12 text-center min-h-[65vh]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <img
            src="/src/imgs/Off white.png"
            alt="Procast"
            className="h-16 md:h-20"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 text-lg text-[#d4c5a9] max-w-xl mx-auto"
        >
          Anticipate demand, reduce risk, and make confident, data-driven
          decisions.
        </motion.p>

        {/* Animated tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-3 text-base text-sky-300 font-medium"
        >
          <motion.span
            key="tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: "mirror",
            }}
          >
            Forecast • Analyze • Optimize
          </motion.span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6 flex justify-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="px-12 py-6 text-lg rounded-2xl shadow-2xl bg-gradient-to-r from-sky-500 to-blue-400 hover:from-sky-400 hover:to-blue-300 transition-all duration-700"
                >
                  Log In
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white text-center text-2xl">
                    Log In to Procast
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="username"
                      className="text-sm font-medium text-[#d4c5a9]"
                    >
                      Username
                    </label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-[#d4c5a9]"
                    >
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full py-6 text-lg rounded-xl mt-6 bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400"
                  >
                    Sign In
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>
        </motion.div>
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
          <span className="text-sm text-[#d4c5a9] mb-2 tracking-wide">
            Scroll to explore
          </span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-[#d4c5a9]/60 rounded-full flex justify-center"
          >
            <div className="w-1.5 h-1.5 bg-[#d4c5a9] rounded-full mt-2" />
          </motion.div>
        </div>
      </section>

      {/* About Us */}
      <section className="max-w-7xl mx-auto px-6 py-12 z-10 relative">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-semibold text-white">About Us</h2>
            <p className="mt-4 text-[#d4c5a9] leading-normal">
              Procast was created to address the growing complexity of demand
              planning in modern organizations. Traditional tools struggle to
              scale, adapt, and explain forecast behavior.
            </p>
            <p className="mt-4 text-[#d4c5a9] leading-normal">
              Our platform combines advanced forecasting models with clear,
              interpretable analytics—bridging the gap between technical
              accuracy and business usability.
            </p>
          </motion.div>

          {/* Features Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-slate-900 border-slate-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <CardContent className="p-6 space-y-3">
                {[
                  {
                    icon: <ChartBarIcon className="h-6 w-6 text-sky-400" />,
                    text: "Advanced statistical and ML forecasting models",
                  },
                  {
                    icon: <BoltIcon className="h-6 w-6 text-yellow-400" />,
                    text: "Transparent accuracy and bias metrics",
                  },
                  {
                    icon: <UsersIcon className="h-6 w-6 text-green-400" />,
                    text: "Scalable architecture for enterprise datasets",
                  },
                  {
                    icon: <BriefcaseIcon className="h-6 w-6 text-purple-400" />,
                    text: "Built for planners, analysts, and executives",
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center space-x-3 text-[#d4c5a9] hover:text-white hover:scale-105 transition-all duration-300"
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-900/50 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-semibold text-white text-center"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-[#d4c5a9] text-center max-w-2xl mx-auto"
          >
            Get started with Procast in three simple steps
          </motion.p>

          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {[
              {
                step: "1",
                icon: <LightBulbIcon className="h-10 w-10 text-sky-400" />,
                title: "Upload Your Data",
                description:
                  "Connect your historical sales data, inventory records, and market signals in minutes.",
              },
              {
                step: "2",
                icon: (
                  <ArrowTrendingUpIcon className="h-10 w-10 text-green-400" />
                ),
                title: "Generate Forecasts",
                description:
                  "Our AI models analyze patterns and create accurate demand predictions for any horizon.",
              },
              {
                step: "3",
                icon: <ShieldCheckIcon className="h-10 w-10 text-yellow-400" />,
                title: "Take Action",
                description:
                  "Export insights, share reports, and optimize your supply chain decisions confidently.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                className="relative"
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                  {item.step}
                </div>
                <Card className="bg-slate-800/50 border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 pt-6 pb-5">
                  <CardContent className="flex flex-col items-center text-center px-4">
                    <div className="mb-4">{item.icon}</div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-[#d4c5a9]">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By / Stats */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-semibold text-white text-center"
          >
            Proven Business Impact
          </motion.h2>

          <div className="mt-6 grid md:grid-cols-3 gap-5">
            {[
              {
                value: "85%",
                label: "Forecast Accuracy",
                description:
                  "High-precision models tuned for short- and mid-term demand horizons.",
                icon: <ArrowTrendingUpIcon className="h-8 w-8 text-sky-400" />,
              },
              {
                value: "30%",
                label: "Cost Reduction",
                description:
                  "Lower inventory holding costs and fewer stockouts through better planning.",
                icon: <ShieldCheckIcon className="h-8 w-8 text-green-400" />,
              },
              {
                value: "Less than a minute",
                label: "Forecasting Time",
                description:
                  "Optimized for near-term operational and tactical decision-making.",
                icon: <ChartBarIcon className="h-8 w-8 text-yellow-400" />,
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-2xl p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex justify-center mb-3">{stat.icon}</div>
                <div className="text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-[#d4c5a9] mt-1">{stat.label}</div>
                <p className="mt-1 text-sm text-[#d4c5a9]">
                  {stat.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section className="bg-slate-900/70 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-semibold text-white text-center">
            Contact Us
          </h2>
          <p className="mt-4 text-[#d4c5a9] text-center max-w-2xl mx-auto">
            For enterprise inquiries, partnerships, or support requests, please
            contact us below.
          </p>

          <div className="mt-6 grid md:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="h-8 w-8 mb-2 text-sky-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                ),
                title: "General Inquiries",
                email: "info@procast.ai",
              },
              {
                icon: <BriefcaseIcon className="h-8 w-8 mb-2 text-green-400" />,
                title: "Enterprise Sales",
                email: "sales@procast.ai",
              },
              {
                icon: <LifebuoyIcon className="h-8 w-8 mb-2 text-yellow-400" />,
                title: "Support",
                email: "support@procast.ai",
              },
            ].map((c, idx) => (
              <Card
                key={idx}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                onClick={() => (window.location.href = `mailto:${c.email}`)}
              >
                <CardContent className="p-5 flex flex-col items-center text-center">
                  {c.icon}
                  <h3 className="font-medium text-white">{c.title}</h3>
                  <p className="mt-2 text-[#d4c5a9]">{c.email}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call To Action */}
      <section className="max-w-7xl mx-auto px-6 py-14 text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-semibold text-white"
        >
          Access the Platform
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-[#d4c5a9] max-w-xl mx-auto"
        >
          Sign in to Procast and start transforming how your organization plans
          for demand.
        </motion.p>

        <motion.div
          initial={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="mt-6 inline-block"
        >
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="px-14 py-6 text-lg rounded-2xl shadow-2xl bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 transition-all duration-700"
              >
                Log In to Procast
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white text-center text-2xl">
                  Log In to Procast
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label
                    htmlFor="username2"
                    className="text-sm font-medium text-[#d4c5a9]"
                  >
                    Username
                  </label>
                  <Input
                    id="username2"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="password2"
                    className="text-sm font-medium text-[#d4c5a9]"
                  >
                    Password
                  </label>
                  <Input
                    id="password2"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full py-6 text-lg rounded-xl mt-6 bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400"
                >
                  Sign In
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
      </section>
    </div>
  );
}
