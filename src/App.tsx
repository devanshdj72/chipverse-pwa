import { Switch, Route, Router as WouterRouter } from "wouter";
import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import OdysseyGuard from "@/components/OdysseyGuard";
import AIAssistant from "@/components/AIAssistant";
import CustomCursor from "@/components/CustomCursor";

import Landing           from "@/pages/Landing";
import Odyssey           from "@/pages/Odyssey";
import Login             from "@/pages/Login";
import AuthCallback      from "@/pages/AuthCallback";
import NotFound          from "@/pages/not-found";
import Subscription      from "@/pages/Subscription";
import AdminSubscription from "@/pages/admin/AdminSubscription";
import AdminLogin        from "@/pages/admin/AdminLogin";
import AdminDashboard    from "@/pages/admin/AdminDashboard";
import AdminResources    from "@/pages/admin/AdminResources";

const Domains            = lazy(() => import("@/pages/Domains"));
const Dashboard          = lazy(() => import("@/pages/Dashboard"));
const Leaderboard        = lazy(() => import("@/pages/Leaderboard"));
const BattleField        = lazy(() => import("@/pages/BattleField"));
const BattleRoom         = lazy(() => import("@/pages/BattleRoom"));
const Achievements       = lazy(() => import("@/pages/Achievements"));
const Placement          = lazy(() => import("@/pages/Placement"));
const Profile            = lazy(() => import("@/pages/Profile"));
const Messages           = lazy(() => import("@/pages/Messages"));
const DomainReport       = lazy(() => import("@/pages/DomainReport"));
const RTLPath            = lazy(() => import("@/pages/paths/RTLPath"));
const VerificationPath   = lazy(() => import("@/pages/paths/VerificationPath"));
const PhysicalDesignPath = lazy(() => import("@/pages/paths/PhysicalDesignPath"));
const AnalogPath         = lazy(() => import("@/pages/paths/AnalogPath"));
const FPGAPath           = lazy(() => import("@/pages/paths/FPGAPath"));
const EmbeddedPath       = lazy(() => import("@/pages/paths/EmbeddedPath"));
const DFTPath            = lazy(() => import("@/pages/paths/DFTPath"));
const ResearchPath       = lazy(() => import("@/pages/paths/ResearchPath"));

const isAdminRoute   = () => window.location.pathname.startsWith("/admin");
const isOdysseyRoute = () => window.location.pathname.includes("/odyssey");
const hideChrome     = () => isAdminRoute() || isOdysseyRoute();

const Spinner = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      {!hideChrome() && <Navbar />}
      <OdysseyGuard>
        <main className="min-h-screen bg-black pt-14 cv-main">
          <Suspense fallback={<Spinner />}>
            <Switch>
              <Route path="/"                          component={Landing} />
              <Route path="/odyssey"                   component={Odyssey} />
              <Route path="/login"                     component={Login} />
              <Route path="/auth/callback"             component={AuthCallback} />
              <Route path="/domains"                   component={Domains} />
              <Route path="/dashboard"                 component={Dashboard} />
              <Route path="/leaderboard"               component={Leaderboard} />
              <Route path="/battlefield"               component={BattleField} />
              <Route path="/battle/:battleId"          component={BattleRoom} />
              <Route path="/achievements"              component={Achievements} />
              <Route path="/placement"                 component={Placement} />
              <Route path="/profile"                   component={Profile} />
              <Route path="/messages"                  component={Messages} />
              <Route path="/subscription"              component={Subscription} />
              <Route path="/report/share/:shareToken"  component={DomainReport} />
              <Route path="/report/:domainId"          component={DomainReport} />
              <Route path="/path/rtl"                  component={RTLPath} />
              <Route path="/path/verification"         component={VerificationPath} />
              <Route path="/path/physical-design"      component={PhysicalDesignPath} />
              <Route path="/path/analog"               component={AnalogPath} />
              <Route path="/path/fpga"                 component={FPGAPath} />
              <Route path="/path/embedded"             component={EmbeddedPath} />
              <Route path="/path/dft"                  component={DFTPath} />
              <Route path="/path/research"             component={ResearchPath} />
              <Route path="/admin/login"               component={AdminLogin} />
              <Route path="/admin/dashboard"           component={AdminDashboard} />
              <Route path="/admin/resources"           component={AdminResources} />
              <Route path="/admin/subscription"        component={AdminSubscription} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </main>
      </OdysseyGuard>
      {!hideChrome() && <AIAssistant />}
      <CustomCursor />
    </WouterRouter>
  );
}
