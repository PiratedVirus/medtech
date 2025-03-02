import { ReactNode } from "react";
import Header from "../../components/common/Header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="">
  
      <main className="">{children}</main>
    </div>
  );
}