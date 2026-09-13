import { DashboardLayout } from "@/components/Layout";
import Landing from "@/pages/Landing";
import AIDashboard from "@/pages/dashboard/AIDashboard";
import Documents from "@/pages/dashboard/Documents";
import KnowledgeGraph from "@/pages/dashboard/KnowledgeGraph";
import Overview from "@/pages/dashboard/Overview";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Landing,
});

const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardLayout,
});

const overviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/",
  component: Overview,
});

const documentsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/documents",
  component: Documents,
});

const aiRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/ai",
  component: AIDashboard,
});

const knowledgeGraphRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/knowledge-graph",
  component: KnowledgeGraph,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  dashboardLayoutRoute.addChildren([
    overviewRoute,
    documentsRoute,
    aiRoute,
    knowledgeGraphRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
