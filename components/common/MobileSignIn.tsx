import SignIn from "@/components/common/SignIn";
import Image from "next/image";
export default function MobileSignInPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Section */}
      <div className="flex flex-col text-center items-center mt-16 mb-3">
        <Image
          src="/images/new-logo.png"
          alt="Logo"
          width={200}
          height={250}
          className="mb-4"
        />
        <h1 className="text-3xl font-bold text-black ">Care Diabetics: Sweet Life, Better Control</h1>
        <p className="text-lg mt-4 text-gray-600">
          India’s leading virtual platform for diabetes care.
        </p>
      </div>

      {/* SignIn Component */}
      <div className="flex-1">
        <SignIn />
      </div>
    </div>
  );
}