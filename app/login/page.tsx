import Header from "@/components/common/Header"
import SignIn from "@/components/common/SignIn"
import HeroSection from "@/components/common/HeroSection"

export default function Page() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />

      <main className="flex flex-1 overflow-hidden">
        <HeroSection />

        <div className="w-5/1">
          <SignIn />
        </div>
      </main>
    </div>
  )
}

