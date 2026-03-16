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
import MaterialDownloadModal from './components/MaterialDownloadModal';

function App() {
  useScrollReveal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="app-container">
      <GlobalNav onOpenModal={openModal} />
      <main>
        <Hero />
        <ProblemOverview />
        <WhyNow />
        <MidPageCTA />
        <SolutionFlow />
        <AdminVisibility />
        <DataIntelligence />
        <RolePermissions />
        <IntegrationEcosystem />
        <SecondaryCTA onOpenModal={openModal} />
        <Scenarios />
        <OnboardingProcess />
        <ExpectedOutcomes />
        <TrustProof />
        <FinalCTA onOpenModal={openModal} />
      </main>
      <MaterialDownloadModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}

export default App;
