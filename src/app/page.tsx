"use client";

import React, { useState, useCallback, useEffect } from "react";
import { peekAuthIntent } from "@/lib/auth-intent";
import { useAuth } from "@/providers/AuthProvider";
import Navbar from "@/components/weaz/Navbar";
import Hero from "@/components/weaz/Hero";
import { AiFutureBanner } from "@/components/weaz/AiFutureBanner";
import { CompanyMarquee } from "@/components/weaz/CompanyMarquee";
import About from "@/components/weaz/About";
import ProgramsOrbit from "@/components/weaz/ProgramsOrbit";
import ProgramDeepDives from "@/components/weaz/ProgramDeepDives";
import ComparisonTable from "@/components/weaz/ComparisonTable";
import CareerOutcomes from "@/components/weaz/CareerOutcomes";
import Testimonials from "@/components/weaz/Testimonials";
import FinalCTA from "@/components/weaz/FinalCTA";
import Footer from "@/components/weaz/Footer";
import { EnrollmentModal } from "@/components/weaz/EnrollmentModal";
import WhatsAppFab from "@/components/weaz/WhatsAppFab";

export default function Home() {
  const { user, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultProgram, setDefaultProgram] = useState("");

  const openModal = useCallback((program = "") => {
    setDefaultProgram(program);
    setModalOpen(true);
  }, []);

  // Someone who signed in from the enrollment form comes back here. Reopen it
  // so they carry on instead of landing on a blank homepage. The modal itself
  // consumes the stored intent to restore the program and typed details.
  useEffect(() => {
    if (loading || !user) return;
    // A single render after the OAuth redirect is the intended effect here,
    // and the stored intent is consumed by the modal so this cannot repeat.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (peekAuthIntent()?.type === "enrollment") openModal("");
  }, [loading, openModal, user]);

  return (
    <div
      data-testid="landing-root"
      className="relative min-h-screen bg-[#0F0B14] text-white overflow-x-hidden"
    >
      {/* Ambient background glows */}
      <div
        className="blob blob-purple"
        style={{ width: 520, height: 520, top: -180, left: -180 }}
      />
      <div
        className="blob blob-purple"
        style={{ width: 420, height: 420, top: 900, right: -160 }}
      />
      <div
        className="blob blob-gold hidden md:block"
        style={{ width: 380, height: 380, top: 1700, left: -100 }}
      />
      <div
        className="blob blob-purple"
        style={{ width: 500, height: 500, top: 2800, right: -160 }}
      />

      <Navbar onEnroll={() => openModal("")} />

      <main className="relative z-10">
        <Hero onEnroll={() => openModal("")} />
        <CompanyMarquee />
        <AiFutureBanner />
        <About />
        <ProgramsOrbit onEnroll={(p) => openModal(p)} />
        <ProgramDeepDives onEnroll={(p) => openModal(p)} />
        <ComparisonTable onEnroll={(p) => openModal(p)} />
        <CareerOutcomes />
        <Testimonials />
        <FinalCTA onEnroll={() => openModal("")} />
        <Footer />
      </main>

      <EnrollmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultProgram={defaultProgram}
      />
      <WhatsAppFab />
    </div>
  );
}
