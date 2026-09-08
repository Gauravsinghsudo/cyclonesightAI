import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavItemId } from './components/Sidebar';
import { SubHeader } from './components/SubHeader';
import { MetricCards } from './components/MetricCards';
import { LiveSatelliteOverview } from './components/LiveSatelliteOverview';
import { ActiveCyclonesCard } from './components/ActiveCyclonesCard';
import { RapidIntensificationCard } from './components/RapidIntensificationCard';
import { ForecastSummaryCard } from './components/ForecastSummaryCard';
import { ImpactOverviewCard } from './components/ImpactOverviewCard';
import { CyclogenesisOutlookCard } from './components/CyclogenesisOutlookCard';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';

// Dedicated Full Views for all Sidebar Menu items
import { LiveMonitoringView } from './components/views/LiveMonitoringView';
import { CycloneTrackerView } from './components/views/CycloneTrackerView';
import { RapidIntensificationView } from './components/views/RapidIntensificationView';
import { ForecastModelsView } from './components/views/ForecastModelsView';
import { ImpactRiskMapView } from './components/views/ImpactRiskMapView';
import { AlertsNotificationsView } from './components/views/AlertsNotificationsView';
import { HistoricalCyclonesView } from './components/views/HistoricalCyclonesView';
import { AnalyticsReportsView } from './components/views/AnalyticsReportsView';
import { AICopilotView } from './components/views/AICopilotView';
import { SettingsView } from './components/views/SettingsView';
import { FeedbackView } from './components/views/FeedbackView';
import { AuthView } from './components/views/AuthView';

// Modals
import { AlertsModal } from './components/modals/AlertsModal';
import { DataSourcesModal } from './components/modals/DataSourcesModal';
import { CycloneDetailModal } from './components/modals/CycloneDetailModal';
import { FullMapModal } from './components/modals/FullMapModal';
import { AICopilotModal } from './components/modals/AICopilotModal';
import { HelpModal } from './components/modals/HelpModal';
import { AuthModal } from './components/modals/AuthModal';

import { INITIAL_CYCLONES, HISTORICAL_MODEL_RECORDS, IMPACT_AREAS, DATA_SOURCES, NOTIFICATIONS } from './data/cycloneData';
import { CycloneData } from './types';
import { authService, UserProfile } from './services/authService';
import {
  getMosdacArchiveYears,
  getMosdacLiveAlert,
  getMosdacCycloneTrack,
  convertMosdacTrackToCycloneData,
  MosdacYearGroup,
} from './services/mosdacService';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavItemId>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [cyclones, setCyclones] = useState<CycloneData[]>(INITIAL_CYCLONES);
  const [alerts, setAlerts] = useState(NOTIFICATIONS);
  const [dataSources] = useState(DATA_SOURCES);
  const [impactAreas] = useState(IMPACT_AREAS);

  // MOSDAC SCORPIO Year & Cyclone Archive State
  const [yearGroups, setYearGroups] = useState<MosdacYearGroup[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [selectedCycloneName, setSelectedCycloneName] = useState<string>('DANA');
  const [mosdacAlertText, setMosdacAlertText] = useState<string>('No Cyclone in Indian Ocean');

  const [selectedCycloneId, setSelectedCycloneId] = useState<string | null>('MOSDAC-DANA');
  const [lastUpdated, setLastUpdated] = useState('23 Oct 2024, 00:00 UTC (INSAT-3DS)');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [dataSourcesModalOpen, setDataSourcesModalOpen] = useState(false);
  const [cycloneDetailModalOpen, setCycloneDetailModalOpen] = useState(false);
  const [fullMapModalOpen, setFullMapModalOpen] = useState(false);
  const [aiCopilotModalOpen, setAiCopilotModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // User Profile & Database Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // 1. Fetch official cyclone year list and live alert on boot
  useEffect(() => {
    // Check authenticated session in persistent database
    authService.getMe().then((u) => {
      if (u) setCurrentUser(u);
    });

    getMosdacArchiveYears().then((groups) => {
      if (groups && groups.length > 0) {
        setYearGroups(groups);
      }
    });

    getMosdacLiveAlert().then((info) => {
      if (info && info.alert) {
        setMosdacAlertText(info.alert);
      }
    });
  }, []);

  // Available years list (e.g. Recent, 2025, 2024, 2023...)
  const availableYears = useMemo(() => {
    if (yearGroups.length === 0) return ['Recent', '2025', '2024', '2023', '2022', '2021', '2020'];
    return yearGroups.map((g) => g.Year);
  }, [yearGroups]);

  // Cyclones available in selected year
  const availableCyclonesInYear = useMemo(() => {
    const group = yearGroups.find((g) => g.Year === selectedYear);
    if (group && group.Cyclonelist) {
      return group.Cyclonelist;
    }
    if (selectedYear === '2024') return ['DANA', 'REMAL', 'ASNA', 'FENGAL'];
    if (selectedYear === '2023') return ['BIPARJOY', 'MOCHA', 'MICHAUNG', 'TEJ'];
    if (selectedYear === '2020') return ['AMPHAN', 'NISARGA', 'NIVAR', 'BUREVI'];
    return ['DANA', 'REMAL'];
  }, [yearGroups, selectedYear]);

  // 2. Load cyclones for selected year or cyclone
  const loadCycloneRecord = useCallback(async (cycloneName: string) => {
    setIsRefreshing(true);
    try {
      const track = await getMosdacCycloneTrack(cycloneName);
      if (track) {
        const converted = convertMosdacTrackToCycloneData(cycloneName, track);
        setCyclones((prev) => {
          const existing = prev.filter((c) => c.name.toLowerCase() !== converted.name.toLowerCase());
          return [converted, ...existing];
        });
        setSelectedCycloneId(converted.id);
        setLastUpdated(`Live Synced: ${converted.trajectoryPoints[converted.trajectoryPoints.length - 1]?.time || 'INSAT-3DS'}`);
      }
    } catch (err) {
      console.warn(`Could not load cyclone record for ${cycloneName}:`, err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Load multiple archived tracks at once for side-by-side trajectory comparison.
  const loadHistoricalCyclones = useCallback(async (cycloneNames: string[]): Promise<string[]> => {
    const names = [...new Set(cycloneNames.map((name) => name.trim().toUpperCase()).filter(Boolean))];
    if (names.length === 0) return [];

    setIsRefreshing(true);
    try {
      const records = await Promise.all(names.map(async (name) => {
        const track = await getMosdacCycloneTrack(name);
        return track ? convertMosdacTrackToCycloneData(name, track) : null;
      }));
      const loaded = records.filter((record): record is CycloneData => record !== null);
      if (loaded.length > 0) {
        setCyclones((previous) => {
          const loadedIds = new Set(loaded.map((cyclone) => cyclone.id));
          return [...loaded, ...previous.filter((cyclone) => !loadedIds.has(cyclone.id))];
        });
        setSelectedCycloneId(loaded[0].id);
        setLastUpdated(`Loaded ${loaded.length} historical trajectory${loaded.length === 1 ? '' : 'ies'} from MOSDAC archive`);
      }
      return loaded.map((cyclone) => cyclone.id);
    } catch (err) {
      console.warn('Could not load historical cyclone trajectories:', err);
      return [];
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Handle year change
  const handleSelectYear = (year: string) => {
    setSelectedYear(year);
    const group = yearGroups.find((g) => g.Year === year);
    const firstInYear = group?.Cyclonelist?.[0] || 'DANA';
    setSelectedCycloneName(firstInYear);
    loadCycloneRecord(firstInYear);
  };

  // Handle cyclone name change from dropdown
  const handleSelectCycloneName = (name: string) => {
    setSelectedCycloneName(name);
    loadCycloneRecord(name);
  };

  // Search filter
  const filteredCyclones = useMemo(() => {
    if (!searchQuery.trim()) return cyclones;
    const q = searchQuery.toLowerCase();
    return cyclones.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.basin.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [cyclones, searchQuery]);

  // Archive tracks remain available in the Tracker and Historical Cyclones views,
  // but must never be presented as live storms on the dashboard.
  const activeDashboardCyclones = useMemo(
    () => filteredCyclones.filter((cyclone) => cyclone.isActive === true),
    [filteredCyclones]
  );

  const activeDashboardCyclone = useMemo(
    () => activeDashboardCyclones.find((cyclone) => cyclone.id === selectedCycloneId) || activeDashboardCyclones[0] || null,
    [activeDashboardCyclones, selectedCycloneId]
  );

  const activeSelectedCyclone = useMemo(() => {
    return cyclones.find((c) => c.id === selectedCycloneId) || cyclones[0] || null;
  }, [cyclones, selectedCycloneId]);

  const unreadAlertsCount = useMemo(() => {
    return alerts.filter((a) => !a.isRead).length;
  }, [alerts]);

  // Refresh live data directly from MOSDAC endpoints
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const alertInfo = await getMosdacLiveAlert();
      if (alertInfo) {
        setMosdacAlertText(alertInfo.alert);
      }
      if (selectedCycloneName) {
        await loadCycloneRecord(selectedCycloneName);
      }
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(`Synced: ${timeStr} IST`);
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectCyclone = (id: string) => {
    setSelectedCycloneId(id);
  };

  const handleOpenCycloneDetails = (id?: string) => {
    if (id) setSelectedCycloneId(id);
    setCycloneDetailModalOpen(true);
  };

  const handleMarkAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClearAlerts = () => {
    setAlerts([]);
  };

  // Switch sidebar items
  const handleSelectNavTab = (id: NavItemId) => {
    setActiveTab(id);
  };

  // Load a historical cyclone into active focus
  const handleLoadHistoricalCyclone = (cData: CycloneData) => {
    setCyclones((prev) => {
      const existing = prev.filter((c) => c.id !== cData.id);
      return [cData, ...existing];
    });
    setSelectedCycloneId(cData.id);
    setActiveTab('dashboard');
  };

  return (
    <div className="h-dvh overflow-hidden bg-[#080d1a] text-slate-100 flex flex-col font-sans">
      {/* Offline PWA Floating Indicator */}
      <OfflineIndicator />

      {/* Main Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        unreadAlertCount={unreadAlertsCount}
        onOpenAlerts={() => setAlertsModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => {
          // A sign-in dialog must never compete with a map modal for the screen.
          setFullMapModalOpen(false);
          setAuthModalOpen(true);
        }}
      />

      {/* Main Layout (Sidebar + Content) */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectNavTab}
          onOpenDataSources={() => setDataSourcesModalOpen(true)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main
          id="main-dashboard-canvas"
          className="flex-1 min-w-0 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col justify-between"
        >
          <div className="space-y-6">
            {/* View Switcher based on activeTab */}
            {activeTab === 'dashboard' && (
              <>
                {/* SubHeader: Welcome greeting, MOSDAC Archive Bar, Refresh */}
                <SubHeader
                  years={availableYears}
                  selectedYear={selectedYear}
                  onSelectYear={handleSelectYear}
                  availableCyclonesInYear={availableCyclonesInYear}
                  selectedCycloneName={selectedCycloneName}
                  onSelectCycloneName={handleSelectCycloneName}
                  lastUpdatedText={lastUpdated}
                  isRefreshing={isRefreshing}
                  onRefresh={handleRefreshData}
                  mosdacAlertText={mosdacAlertText}
                />

                {/* Top 4 KPI Metric Cards */}
                <MetricCards
                  activeCycloneCount={activeDashboardCyclones.length}
                  alertsCount={unreadAlertsCount}
                  riRiskCount={1}
                  dataSourcesOnline={9}
                  totalDataSources={9}
                  onViewCyclones={() => handleOpenCycloneDetails(activeDashboardCyclone?.id)}
                  onViewAlerts={() => setAlertsModalOpen(true)}
                  onViewRI={() => handleOpenCycloneDetails(activeDashboardCyclone?.id)}
                  onViewDataSources={() => setDataSourcesModalOpen(true)}
                />

                <CyclogenesisOutlookCard
                  currentCyclone={activeDashboardCyclone}
                  historicalCyclones={HISTORICAL_MODEL_RECORDS}
                  onOpenForecastModels={() => setActiveTab('forecast-models')}
                />

                {/* Middle Row: Live Satellite Overview (2/3) + Active Cyclones (1/3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <LiveSatelliteOverview
                      cyclones={activeDashboardCyclones}
                      selectedCycloneId={activeDashboardCyclone?.id || null}
                      onSelectCyclone={handleSelectCyclone}
                      onOpenFullMap={() => setFullMapModalOpen(true)}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <ActiveCyclonesCard
                      cyclones={activeDashboardCyclones}
                      selectedCycloneId={activeDashboardCyclone?.id || null}
                      onSelectCyclone={handleSelectCyclone}
                      onViewAll={() => handleOpenCycloneDetails(activeSelectedCyclone?.id)}
                      onOpenTracker={() => setActiveTab('cyclone-tracker')}
                    />
                  </div>
                </div>

                {/* Bottom Row (3 Columns): Rapid Intensification Risk, Forecast Summary (5 Days), Impact Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Col 1: Rapid Intensification Risk */}
                  <RapidIntensificationCard
                    activeCyclone={activeSelectedCyclone}
                    onViewAll={() => setActiveTab('rapid-intensification')}
                  />

                  {/* Col 2: Forecast Summary (Next 5 Days) */}
                  <ForecastSummaryCard
                    cyclones={cyclones}
                    onViewAll={() => setActiveTab('forecast-models')}
                  />

                  {/* Col 3: Impact Overview */}
                  <ImpactOverviewCard
                    impactAreas={impactAreas}
                    onOpenRiskMap={() => setActiveTab('impact-risk-map')}
                  />
                </div>
              </>
            )}

            {activeTab === 'live-monitoring' && (
              <LiveMonitoringView
                cyclones={cyclones}
                selectedCycloneId={selectedCycloneId}
                onSelectCyclone={handleSelectCyclone}
                onRefresh={handleRefreshData}
                isRefreshing={isRefreshing}
                mosdacAlertText={mosdacAlertText}
              />
            )}

            {activeTab === 'cyclone-tracker' && (
              <CycloneTrackerView
                cyclones={cyclones}
                selectedCycloneId={selectedCycloneId}
                onSelectCyclone={handleSelectCyclone}
                archiveYearGroups={yearGroups.length > 0 ? yearGroups : [
                  { Year: '2025', Cyclonelist: ['SHAKHTI', 'MONTHA', 'SENYAR', 'DITWAH'] },
                  { Year: '2024', Cyclonelist: ['REMAL', 'ASNA', 'DANA', 'FENGAL'] },
                  { Year: '2023', Cyclonelist: ['BIPARJOY', 'MOCHA', 'MICHAUNG', 'TEJ', 'HAMOON', 'MIDHILI'] },
                  { Year: '2022', Cyclonelist: ['ASANI', 'SITRANG', 'MANDOUS'] },
                  { Year: '2021', Cyclonelist: ['TAUKTAE', 'YAAS', 'GULAB', 'SHAHEEN', 'JAWAD'] },
                  { Year: '2020', Cyclonelist: ['AMPHAN', 'NISARGA', 'NIVAR', 'BUREVI'] },
                ]}
                onLoadHistoricalCyclones={loadHistoricalCyclones}
              />
            )}

            {activeTab === 'rapid-intensification' && (
              <RapidIntensificationView activeCyclone={activeSelectedCyclone} />
            )}

            {activeTab === 'forecast-models' && (
              <ForecastModelsView activeCyclone={activeSelectedCyclone} />
            )}

            {activeTab === 'impact-risk-map' && (
              <ImpactRiskMapView
                cyclones={cyclones}
                selectedCycloneId={selectedCycloneId}
                onSelectCyclone={handleSelectCyclone}
              />
            )}

            {activeTab === 'alerts-notifications' && (
              <AlertsNotificationsView alerts={alerts} onDismissAlert={handleDismissAlert} onClearAlerts={handleClearAlerts} />
            )}

            {activeTab === 'historical-cyclones' && (
              <HistoricalCyclonesView onLoadCycloneToActive={handleLoadHistoricalCyclone} />
            )}

            {activeTab === 'analytics-reports' && (
              <AnalyticsReportsView cyclones={cyclones} />
            )}

            {activeTab === 'ai-copilot' && (
              <AICopilotView
                key={`chat-${currentUser?.role || 'public'}`}
                activeCyclone={activeSelectedCyclone}
                userRole={currentUser?.role}
              />
            )}

            {activeTab === 'auth' && (
              <AuthView
                currentUser={currentUser}
                onUserChanged={setCurrentUser}
                cyclones={cyclones}
                onSelectCyclone={handleSelectCyclone}
              />
            )}

            {activeTab === 'settings' && <SettingsView />}

            {activeTab === 'feedback' && <FeedbackView />}
          </div>

          {/* Footer with Data Sources, CYCLONE SIGHT AI & AI Operational status */}
          <div className="mt-8">
            <Footer
              onOpenDataSources={() => setDataSourcesModalOpen(true)}
              onOpenAICopilot={() => setActiveTab('ai-copilot')}
            />
          </div>
        </main>
      </div>

      {/* Modals & Dialogs */}
      <AlertsModal
        alerts={alerts}
        isOpen={alertsModalOpen}
        onClose={() => setAlertsModalOpen(false)}
        onMarkAllRead={handleMarkAllAlertsRead}
        onClearAll={handleClearAlerts}
        onSelectCyclone={handleSelectCyclone}
      />

      <DataSourcesModal
        dataSources={dataSources}
        isOpen={dataSourcesModalOpen}
        onClose={() => setDataSourcesModalOpen(false)}
      />

      <CycloneDetailModal
        cyclone={activeSelectedCyclone}
        isOpen={cycloneDetailModalOpen}
        onClose={() => setCycloneDetailModalOpen(false)}
      />

      <FullMapModal
        isOpen={fullMapModalOpen}
        onClose={() => setFullMapModalOpen(false)}
        cyclones={activeDashboardCyclones}
        onSelectCyclone={handleSelectCyclone}
      />

      <AICopilotModal
        isOpen={aiCopilotModalOpen}
        onClose={() => setAiCopilotModalOpen(false)}
        cyclones={cyclones}
      />

      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={setCurrentUser}
      />
    </div>
  );
}
