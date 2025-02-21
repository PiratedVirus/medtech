import { ReactNode } from "react";
import Header from "../../components/ui/custom/cd-header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="">
  
      <main className="">{children}</main>
    </div>
  );
}