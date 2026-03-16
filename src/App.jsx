import React, { useState, useEffect } from 'react';
import './App.css';
import { useScrollReveal } from './hooks/useScrollReveal';
import GlobalNav from './components/GlobalNav';
import Hero from './components/Hero';
import ProblemOverview from './components/ProblemOverview';
import WhyNow from './components/WhyNow';
import SolutionFlow from './components/SolutionFlow';
import AdminVisibility from './components/AdminVisibility';
import RolePermissions from './components/RolePermissions';
import Scenarios from './components/Scenarios';
import ExpectedOutcomes from './components/ExpectedOutcomes';
import TrustProof from './components/TrustProof';
import FinalCTA from './components/FinalCTA';
import MidPageCTA from './components/MidPageCTA';
import DataIntelligence from './components/DataIntelligence';
import IntegrationEcosystem from './components/IntegrationEcosystem';
import SecondaryCTA from './components/SecondaryCTA';
import OnboardingProcess from './components/OnboardingProcess';
import Checklist from './components/Checklist';
import MaterialDownload from './components/MaterialDownload';
import MaterialDownloadModal from './components/MaterialDownloadModal';
import InquiryModal from './components/InquiryModal';

function App() {
  useScrollReveal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [inquiryMode, setInquiryMode] = useState(null); // 'consultation' | 'demo' | null
  const openConsultation = () => setInquiryMode('consultation');
  const openDemo = () => setInquiryMode('demo');
  const closeInquiry = () => setInquiryMode(null);

  return (
    <div className="app-container">
      <GlobalNav onOpenConsultation={openConsultation} onOpenDemo={openDemo} />
      <main>
        <Hero onOpenConsultation={openConsultation} onOpenDemo={openDemo} />
        <ProblemOverview />
        <WhyNow />
        <MidPageCTA onOpenConsultation={openConsultation} />
        <SolutionFlow />
        <AdminVisibility />
        <DataIntelligence />
        <RolePermissions />
        <IntegrationEcosystem />
        <SecondaryCTA onOpenModal={openModal} />
        <Scenarios />
        <OnboardingProcess />
        <Checklist />
        <MaterialDownload onOpenModal={openModal} />
        <ExpectedOutcomes />
        <TrustProof />
        <FinalCTA onOpenModal={openModal} onOpenConsultation={openConsultation} onOpenDemo={openDemo} />
      </main>
      <MaterialDownloadModal isOpen={isModalOpen} onClose={closeModal} />
      <InquiryModal isOpen={!!inquiryMode} onClose={closeInquiry} mode={inquiryMode || 'consultation'} />
    </div>
  );
}

export default App;
