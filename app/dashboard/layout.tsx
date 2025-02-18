import { ReactNode } from "react";
import Header from "../ui-comp/Header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="">
  
      <main className="">{children}</main>
    </div>
  );
}