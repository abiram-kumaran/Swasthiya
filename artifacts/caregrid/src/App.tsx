import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import Login from '@/pages/login';
import PatientLayout from '@/pages/patient/layout';
import AdminLayout from '@/pages/admin/layout';
import FrontlineLayout from '@/pages/frontline/layout';
import DriverLayout from '@/pages/driver/layout';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function AppRouter() {
  return (
    <Switch>
      <Route path="/"           component={Login}         />
      <Route path="/patient/:rest*" component={PatientLayout} />
      <Route path="/patient"    component={PatientLayout} />
      <Route path="/admin/:rest*"   component={AdminLayout}   />
      <Route path="/admin"      component={AdminLayout}   />
      <Route path="/staff/:rest*"   component={FrontlineLayout} />
      <Route path="/staff"      component={FrontlineLayout} />
      <Route path="/driver/:rest*"  component={DriverLayout}  />
      <Route path="/driver"     component={DriverLayout}  />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRouter />
        </WouterRouter>
        <Toaster position="top-right" richColors
          toastOptions={{ classNames: { toast:'font-sans rounded-xl shadow-lg border', title:'font-bold text-xs', description:'text-[11px]' } }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
