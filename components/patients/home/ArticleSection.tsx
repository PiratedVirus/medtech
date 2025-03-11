import Image from "next/image"
import Link from "next/link"

export default function ArticlesSection() {
  return (
    <section className="max-w-full px-20 py-8">
      <div className="space-y-4 mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-[#2c2e38]">
          Explore insightful articles from leading diabetes specialists
        </h2>
        <p className="text-xl text-[#696969]">
          Health articles that keep you informed about good health practices and achieve your goals.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Article Card 1 */}
        <Link href="#" className="group">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="relative h-64 overflow-hidden">
              <Image
                src="/placeholder.svg?height=300&width=400"
                alt="Doctor with a yellow mug"
                width={400}
                height={300}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 p-4 text-lg font-medium">
                <span className="text-[#2c2e38]">11 Aug, 2024</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold text-[#134f30] group-hover:text-[#56a67c] transition-colors duration-300">
                7 Tips to increase your immune system
              </h3>
            </div>
          </div>
        </Link>

        {/* Article Card 2 */}
        <Link href="#" className="group">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="relative h-64 overflow-hidden">
              <Image
                src="/placeholder.svg?height=300&width=400"
                alt="Hand holding a bowl with lemon water"
                width={400}
                height={300}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 p-4 text-lg font-medium">
                <span className="text-[#2c2e38]">11 Aug, 2024</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold text-[#134f30] group-hover:text-[#56a67c] transition-colors duration-300">
                7 Tips to increase your immune system
              </h3>
            </div>
          </div>
        </Link>

        {/* Article Card 3 */}
        <Link href="#" className="group">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="relative h-64 overflow-hidden">
              <Image
                src="/placeholder.svg?height=300&width=400"
                alt="Stethoscope on a white surface"
                width={400}
                height={300}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 p-4 text-lg font-medium">
                <span className="text-[#2c2e38]">11 Aug, 2024</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold text-[#134f30] group-hover:text-[#56a67c] transition-colors duration-300">
                7 Tips to increase your immune system
              </h3>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}

