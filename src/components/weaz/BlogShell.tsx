"use client";

import { useCallback, useState, type ReactNode } from "react";
import Navbar from "@/components/weaz/Navbar";
import Footer from "@/components/weaz/Footer";
import WhatsAppFab from "@/components/weaz/WhatsAppFab";
import { EnrollmentModal } from "@/components/weaz/EnrollmentModal";

export function BlogShell({ children }: { children: ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);

  const openEnrollment = useCallback(() => setModalOpen(true), []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0F0B14] text-white">
      <div
        className="blob blob-purple"
        style={{ width: 480, height: 480, top: -180, right: -180 }}
      />
      <Navbar onEnroll={openEnrollment} />
      <main className="relative z-10">{children}</main>
      <Footer />
      <EnrollmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultProgram=""
      />
      <WhatsAppFab />
    </div>
  );
}
