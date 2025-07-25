import Header from "@/components/common/Header";
import SignIn from "@/components/common/SignIn";
import HeroSection from "@/components/common/HeroSection";
import MobileSignIn from "@/components/common/MobileSignIn";

export default function Page() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <main className="flex flex-1 overflow-hidden">
        {/* For larger screens */}
        <div className="hidden md:flex w-full">
          <HeroSection />
          <div className="w-5/1">
            <SignIn />
          </div>
        </div>

        {/* For mobile screens */}
        <div className="flex md:hidden w-full">
          <MobileSignIn />
          {/* <p>Mobile View</p> */}
        </div>
      </main>
    </div>
  );
}