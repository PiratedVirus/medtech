import Header from "../ui-comp/Header"
import SignIn from "../ui-comp/SignIn"
import LeftSection from "../ui-comp/LeftSection"

export default function Page() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />

      <main className="flex flex-1 overflow-hidden">
        <LeftSection />

        {/* Right section (5/12) */}
        <div className="w-5/1">
          <SignIn />
        </div>
      </main>
    </div>
  )
}

