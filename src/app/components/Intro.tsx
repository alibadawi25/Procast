"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { motion } from "framer-motion";

import {
  ArrowTrendingUpIcon,
  BoltIcon,
  ChartBarIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import BlueLogo from "../../imgs/Blue.png";

interface IntroProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
}

export default function Intro({ onLogin }: IntroProps) {
  const [demoOpen, setDemoOpen] = useState(false);
  const [trialOpen, setTrialOpen] = useState(false);
  const [trialEmail, setTrialEmail] = useState("");
  const [trialCompany, setTrialCompany] = useState("");
  const [demoName, setDemoName] = useState("");
  const [demoEmail, setDemoEmail] = useState("");
  const [demoCompany, setDemoCompany] = useState("");
  const [demoCountry, setDemoCountry] = useState("");
  const [demoPhone, setDemoPhone] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleTrialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrialOpen(false);
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoOpen(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      await onLogin({ email: loginEmail, password: loginPassword });
      setLoginOpen(false);
      setLoginPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const headlineStyle = {
    fontFamily: '"Space Grotesk", "ui-sans-serif", "system-ui"',
  } as const;

  const bodyStyle = {
    fontFamily: '"Work Sans", "ui-sans-serif", "system-ui"',
  } as const;

  return (
    <div
      className="relative min-h-screen bg-gradient-to-b from-[#f8f4ec] via-[#f2efe6] to-[#e7f3ef] text-foreground overflow-hidden"
      style={bodyStyle}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl opacity-70" />
        <div className="absolute top-56 -left-24 h-80 w-80 rounded-full bg-secondary/40 blur-3xl opacity-60" />
        <div className="absolute bottom-0 right-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl opacity-50" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center">
            <img src={BlueLogo} alt="Procast logo" className="h-10 w-auto object-contain" />
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a className="rounded-full px-3 py-1 hover:bg-[#1a3a52] hover:text-white transition-colors" href="#problem">
              Product
            </a>
            <a className="rounded-full px-3 py-1 hover:bg-[#1a3a52] hover:text-white transition-colors" href="#pricing">
              Pricing
            </a>
            <a className="rounded-full px-3 py-1 hover:bg-[#1a3a52] hover:text-white transition-colors" href="#case-studies">
              Case Studies
            </a>
          </nav>
          <div className="flex items-center">
            <Dialog
              open={loginOpen}
              onOpenChange={(nextOpen) => {
                setLoginOpen(nextOpen);
                if (!nextOpen) {
                  setLoginError("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="rounded-full bg-sidebar px-9 py-5 text-base text-sidebar-foreground hover:bg-sidebar-accent">
                  Log in
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] bg-card border-border shadow-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground text-center text-2xl">Log in</DialogTitle>
                <DialogDescription className="text-center">
                  Access your dashboards and forecast workspace.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLoginSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="loginEmail" className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <Input
                    id="loginEmail"
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="bg-input-background border-border"
                    disabled={isLoggingIn}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="loginPassword" className="text-sm font-medium text-muted-foreground">
                    Password
                  </label>
                  <Input
                    id="loginPassword"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="bg-input-background border-border"
                    disabled={isLoggingIn}
                    required
                  />
                </div>
                {loginError ? (
                  <p className="text-sm text-destructive">{loginError}</p>
                ) : null}
                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    className="w-full py-5 text-base rounded-xl bg-primary hover:bg-primary/90"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? "Signing in..." : "Continue"}
                  </Button>
                </DialogFooter>
                <p className="text-xs text-muted-foreground text-center">
                  Forgot your password? Contact support.
                </p>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </header>

      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground text-center text-2xl">Book a Demo</DialogTitle>
            <DialogDescription className="text-center">
              Tell us a bit about your business and we will tailor the walkthrough.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDemoSubmit} className="space-y-4 mt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="demoName" className="text-sm font-medium text-muted-foreground">
                  Full name
                </label>
                <Input
                  id="demoName"
                  type="text"
                  placeholder="Enter your name"
                  autoComplete="name"
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  className="bg-input-background border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="demoCountry" className="text-sm font-medium text-muted-foreground">
                  Country
                </label>
                <Input
                  id="demoCountry"
                  type="text"
                  placeholder="Country"
                  autoComplete="country-name"
                  value={demoCountry}
                  onChange={(e) => setDemoCountry(e.target.value)}
                  className="bg-input-background border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="demoPhone" className="text-sm font-medium text-muted-foreground">
                  Phone number
                </label>
                <Input
                  id="demoPhone"
                  type="tel"
                  placeholder="+20 1xx xxx xxxx"
                  inputMode="tel"
                  autoComplete="tel"
                  value={demoPhone}
                  onChange={(e) => setDemoPhone(e.target.value)}
                  className="bg-input-background border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="demoCompany" className="text-sm font-medium text-muted-foreground">
                  Company
                </label>
                <Input
                  id="demoCompany"
                  type="text"
                  placeholder="Company name"
                  autoComplete="organization"
                  value={demoCompany}
                  onChange={(e) => setDemoCompany(e.target.value)}
                  className="bg-input-background border-border"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="demoEmail" className="text-sm font-medium text-muted-foreground">
                Work email
              </label>
              <Input
                id="demoEmail"
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                className="bg-input-background border-border"
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full py-5 text-base rounded-xl bg-primary hover:bg-primary/90">
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hero */}
      <section id="product" className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-semibold tracking-tight"
              style={headlineStyle}
            >
              Move beyond spreadsheets to scalable forecasting.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl"
            >
              Procast enables FMCGs to deploy in days, unify data, and generate reliable Sales Group-level forecasts
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <Button
                className="px-10 py-6 text-base rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setDemoOpen(true)}
              >
                Book Demo
              </Button>
              <div className="text-xs text-muted-foreground">Setup in 48 hours • No consultants required</div>
            </motion.div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {[
                "Forecast accuracy +18%",
                "Stockouts -22%",
                "Planning time 4x faster",
                "SKU-level visibility",
              ].map((chip) => (
                <span key={chip} className="px-3 py-1 rounded-full border border-border bg-card">
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-r from-primary/10 to-secondary/40 opacity-70" />
            <div className="relative rounded-[28px] border border-border bg-card shadow-2xl p-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-medium text-foreground">Overview</span>
                </div>
                <span>EGP • FMCG Portfolio</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Executive summary and key metrics
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Sales Groups", value: "6" },
                  { label: "Forecasts", value: "2" },
                  { label: "Accuracy", value: "88.2%" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border bg-background p-3">
                    <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                    <div className="text-lg font-semibold text-foreground">{stat.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Aggregate Sales Trend</span>
                  <span>Last 12 months</span>
                </div>
                <div className="mt-3 h-24 rounded-xl border border-border bg-card p-3">
                  <div className="flex h-full items-end gap-1">
                    {[35, 48, 42, 60, 55, 68, 72, 64, 78, 86, 92, 88].map((h, i) => (
                      <div key={i} className="flex-1 rounded-full bg-primary/70" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-semibold text-center" style={headlineStyle}>
          Inefficient forecasting is quietly eroding revenue and working capital
        </h2>
        <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
          Modern FMCG teams need speed, accuracy, and a single source of truth.
        </p>
        <div className="mt-8 grid md:grid-cols-4 gap-5">
          {[
            {
              title: "Version chaos",
              desc: "Multiple spreadsheets, conflicting numbers, slow approvals.",
              icon: <ChartBarIcon className="h-6 w-6 text-primary" />,
            },
            {
              title: "Stockouts & overstocks",
              desc: "Lost revenue one week, tied-up cash the next.",
              icon: <BoltIcon className="h-6 w-6 text-primary" />,
            },
            {
              title: "Manual work",
              desc: "Forecasts depend on heroic planners and late nights.",
              icon: <UsersIcon className="h-6 w-6 text-primary" />,
            },
            {
              title: "Scaling pain",
              desc: "More SKUs and channels make Excel impossible to manage.",
              icon: <ArrowTrendingUpIcon className="h-6 w-6 text-primary" />,
            },
          ].map((item) => (
            <Card key={item.title} className="bg-card border-border">
              <CardContent className="p-6 space-y-3">
                <div>{item.icon}</div>
                <h3 className="text-lg text-foreground font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Why Not Enterprise Tools */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-semibold text-center" style={headlineStyle}>
          Why ProCast?
        </h2>
        <div className="mt-6 overflow-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Traditional enterprise tools</th>
                <th className="px-5 py-3">Procast</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ["6–12 months to launch", "Live in days"],
                ["Rigid data models", "Flexible to your processes"],
                ["Consultants required", "Self-serve onboarding"],
                ["Overbuilt UX", "Simple for S&OP teams"],
                ["High + unclear costs", "Predictable pricing"],
              ].map((row, idx) => (
                <tr key={idx} className="border-t border-border">
                  <td className="px-5 py-3">{row[0]}</td>
                  <td className="px-5 py-3 text-foreground font-medium">{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-semibold text-center" style={headlineStyle}>
          How it works
        </h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Connect your data",
              text: "Connect your historical sales data, inventory records, and market signals in minutes.",
              icon: <LightBulbIcon className="h-6 w-6 text-primary" />,
            },
            {
              step: "2",
              title: "Generate forecasts",
              text: "Our AI models analyze patterns and create accurate demand predictions for any horizon.",
              icon: <ArrowTrendingUpIcon className="h-6 w-6 text-primary" />,
            },
            {
              step: "3",
              title: "Act with confidence",
              text: "Export insights, share reports, and optimize your supply chain decisions confidently.",
              icon: <ShieldCheckIcon className="h-6 w-6 text-primary" />,
            },
          ].map((item) => (
            <Card key={item.title} className="bg-card border-border">
              <CardContent className="p-6 space-y-3">
                <div className="grid grid-cols-[auto,1fr,auto] items-center">
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    {item.step}
                  </div>
                  <div className="flex justify-center">{item.icon}</div>
                  <div className="h-9 w-9" />
                </div>
                <h3 className="text-foreground font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-semibold text-center" style={headlineStyle}>
          Pricing that scales with you
        </h2>
        <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
          Simple tiers designed for FMCG teams at every stage — no hidden costs, no surprises.
        </p>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Starter",
              price: "29$ / month",
              desc: "Launch fast with core forecasting.",
              points: ["Self-serve setup", "Analytics Dashboard", " 1 planner account", "Up to 10 Sales Groups"],
              cta: "Enroll",
            },
            {
              name: "Growth",
              price: "499$ Annually",
              desc: "Best for scaling SKUs and regions.",
              points: ["Embedded Gen-AI 'ProAsk' ", "Team workspaces", "Up to 2 planners accounts", "Up to 35 Sales Groups"],
              cta: "Book Demo",
              highlight: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              desc: "Complex supply chains and integrations.",
              points: ["ERP Integeration", "Custom data pipelines", "Priority support", "Unlimited Sales Groups"],
              cta: "Contact Sales",
            },
          ].map((tier) => (
            <Card
              key={tier.name}
              className={`relative overflow-hidden border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                tier.highlight
                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/15"
                  : "border-border bg-card"
              }`}
            >
              {tier.highlight && (
                <div className="absolute right-5 top-4 rounded-full bg-sidebar-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sidebar-primary-foreground">
                  Most Popular
                </div>
              )}
              <CardContent className="p-6 space-y-3">
                <div className="space-y-2">
                  <h3 className={`text-xl font-semibold ${tier.highlight ? "text-primary-foreground" : "text-foreground"}`}>
                    {tier.name}
                  </h3>
                  <p className={`text-sm ${tier.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {tier.price}
                  </p>
                </div>
                <p className={`text-sm ${tier.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {tier.desc}
                </p>
                <ul className={`text-sm space-y-2 ${tier.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {tier.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span
                        className={`mt-1 h-2 w-2 rounded-full ${
                          tier.highlight ? "bg-sidebar-primary" : "bg-primary"
                        }`}
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.highlight ? "secondary" : "outline"}
                  className={`w-full ${
                    tier.highlight
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                      : "border-primary/30 text-primary hover:bg-secondary"
                  }`}
                >
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section id="case-studies" className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
          {[
            "Kora Snacks",
            "Nile Distributors",
            "Sahara Dairy",
            "Coastline Retail",
            "Atlas Essentials",
          ].map((logo) => (
            <span key={logo} className="px-4 py-2 rounded-full border border-border bg-card">
              {logo}
            </span>
          ))}
        </div>
        <div className="mt-8 grid md:grid-cols-3 gap-5">
          {[
            {
              quote: "Reduced stockouts by 22% in one quarter after moving off spreadsheets.",
              name: "Operations Lead, Kora Snacks",
            },
            {
              quote: "Weekly demand reviews now take hours instead of two full days.",
              name: "Demand Planner, Coastline Retail",
            },
            {
              quote: "We aligned sales and supply on one forecast for the first time.",
              name: "Founder, Sahara Dairy",
            },
          ].map((item) => (
            <Card key={item.name} className="bg-card border-border">
              <CardContent className="p-6 text-sm text-muted-foreground">
                <p className="text-foreground font-medium">“{item.quote}”</p>
                <p className="mt-3 text-xs text-muted-foreground">{item.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ROI */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold" style={headlineStyle}>
              Business impact you can measure
            </h2>
            <p className="text-muted-foreground">
              Forecast accuracy improves within the first cycle, while stock levels stay lean.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { value: "+18%", label: "Forecast accuracy" },
                { value: "-22%", label: "Stockout losses" },
                { value: "-14%", label: "Excess inventory" },
              ].map((item) => (
                <Card key={item.label} className="bg-card border-border">
                  <CardContent className="p-4 text-center">
                    <div className="text-xl text-foreground font-semibold">{item.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-6 py-12 text-center">
        <div className="rounded-[32px] border border-border bg-card px-6 py-12">
          <h2 className="text-3xl md:text-4xl font-semibold" style={headlineStyle}>
            Forecast with confidence this quarter
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Join FMCG teams moving faster, reducing stockouts, and making every SKU count.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button className="px-10 py-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setDemoOpen(true)}>
              Book Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="resources" className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-5 gap-8 text-sm text-muted-foreground">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-semibold text-lg text-foreground" style={headlineStyle}>
              <span className="h-2 w-2 rounded-full bg-primary/90" />
              Procast
            </div>
            <p className="mt-3 max-w-sm">
              Demand forecasting for FMCG startups and SMEs. Replace Excel with a platform built for real-world speed.
            </p>
          </div>
          {[
            {
              title: "Product",
              links: ["Forecasting", "Integrations", "Security"],
            },
            {
              title: "Company",
              links: ["About", "Contact"],
            },
            {
              title: "Legal",
              links: ["Privacy", "Terms", "Compliance"],
            },
          ].map((group) => (
            <div key={group.title}>
              <div className="text-foreground font-semibold">{group.title}</div>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link}>
                    <a className="hover:text-foreground" href="#">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
