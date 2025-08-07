import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="">
  
      <main className="">{children}</main>
    </div>
  );
}