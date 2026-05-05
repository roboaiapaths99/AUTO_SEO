import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import AuthGuard from './components/auth/AuthGuard';
import { Toaster } from './components/ui/Toast';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import AddProjectPage from './pages/AddProjectPage';
import KeywordsPage from './pages/KeywordsPage';
import DomainOverviewPage from './pages/DomainOverviewPage';
import DomainComparePage from './pages/DomainComparePage';
import SiteAuditPage from './pages/SiteAuditPage';
import PositionTrackingPage from './pages/PositionTrackingPage';
import AIVisibilityPage from './pages/AIVisibilityPage';
import BacklinksPage from './pages/BacklinksPage';
import ContentPage from './pages/ContentPage';
import OrganicRankingsPage from './pages/OrganicRankingsPage';
import KeywordGapPage from './pages/KeywordGapPage';
import BacklinkGapPage from './pages/BacklinkGapPage';
import TopicResearchPage from './pages/TopicResearchPage';
import ReferringDomainsPage from './pages/ReferringDomainsPage';
import BacklinkAuditPage from './pages/BacklinkAuditPage';
import KeywordStrategyPage from './pages/KeywordStrategyPage';
import SettingsPage from './pages/SettingsPage';
import AIOToolPage from './pages/AIOToolPage';
import LinkGraphPage from './pages/LinkGraphPage';
import PPCBridgePage from './pages/PPCBridgePage';
import TimeMachinePage from './pages/TimeMachinePage';

/**
 * AutoSEO AI Platform — Root Application
 * ======================================
 * Defines the routing structure and protected access layers.
 */

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* ── Protected Routes ── */}
        <Route path="/" element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/add" element={<AddProjectPage />} />
          <Route path="domain-overview" element={<DomainOverviewPage />} />
          <Route path="domain-compare" element={<DomainComparePage />} />
          <Route path="keywords" element={<KeywordsPage />} />
          <Route path="audit" element={<SiteAuditPage />} />
          <Route path="tracking" element={<PositionTrackingPage />} />
          <Route path="backlinks" element={<BacklinksPage />} />
          <Route path="ai-visibility" element={<AIVisibilityPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="aio" element={<AIOToolPage />} />
          <Route path="link-graph" element={<LinkGraphPage />} />
          <Route path="ppc-bridge" element={<PPCBridgePage />} />
          <Route path="time-machine" element={<TimeMachinePage />} />
          <Route path="settings" element={<SettingsPage />} />
          
          <Route path="organic-rankings" element={<OrganicRankingsPage />} />
          <Route path="top-pages" element={<OrganicRankingsPage />} />
          <Route path="keyword-gap" element={<KeywordGapPage />} />
          <Route path="backlink-gap" element={<BacklinkGapPage />} />
          <Route path="keyword-magic" element={<KeywordsPage />} />
          <Route path="keyword-strategy" element={<KeywordStrategyPage />} />
          <Route path="topic-research" element={<TopicResearchPage />} />
          <Route path="content-template" element={<ContentPage />} />
          <Route path="referring-domains" element={<ReferringDomainsPage />} />
          <Route path="backlink-audit" element={<BacklinkAuditPage />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
