import Dashboard from "./dashboard/page";
import Sidebar from "./sidebar/page";
export default function Home() {
  return (
    <div className="flex h-screen">
      <div className="w-1/5 bg-red-500">
        <Sidebar />
      </div>
      <div className="w-4/5 bg-blue-500">
        <Dashboard />
      </div>
    </div>
  );
}
