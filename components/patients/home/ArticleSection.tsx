'use client'
import React, { useEffect, useState } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"

interface MediumPost {
  title: string
  link: string
  contentSnippet: string
  guid: string
  thumbnail?: string
  pubDate?: string
  description?: string
}

export default function MediumBlogCarousel() {
  const [posts, setPosts] = useState<MediumPost[]>([])

  useEffect(() => {
    const fetchMediumFeed = async () => {
      const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@kentcdodds")
      const data = await res.json()
      setPosts(
        data.items.slice(0, 3).map((item: any) => ({
          title: item.title || "",
          link: item.link || "#",
          contentSnippet: item.contentSnippet || "",
          guid: item.guid || "",
          thumbnail: item.content ? extractImageFromContent(item.content) || "/images/blog-card-1.png" : "/images/blog-card-1.png",
          pubDate: item.pubDate?.split(" ").slice(0, 3).join(" ") || ""
        }))
      )
    }

    const extractImageFromContent = (html: string): string | undefined => {
      const match = html.match(/<img[^>]+src="([^"]+)"/)
      return match ? match[1] : undefined
    }

    fetchMediumFeed()
  }, [])

  return (
    <div className="">
      <section className="max-w-full px-4 sm:px-6 lg:px-20 py-8">
        <div className="space-y-4 mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2c2e38]">
            Health Corner
          </h2>
          <p className="text-xl text-[#696969]">
          Explore insightful articles from leading diabetes specialists
          </p>
        </div>

        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {posts.map((post) => (
              <CarouselItem key={post.guid} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3">
                <Link href={post.link} className="group">
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md h-full flex flex-col">
                    <div className="relative h-64 w-full overflow-hidden">
                      <img
                        src={post.thumbnail || "/images/blog-card-1.png"}
                        alt={post.title}
                        width={400}
                        height={256}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* <div className="absolute bottom-0 left-0 p-4 text-lg font-medium">
                        <span className="text-[#2c2e38]">{post.pubDate}</span>
                      </div> */}
                    </div>
                    <div className="p-5 flex-1 flex items-center">
                      <h3 className="text-xl font-bold text-[#134f30] group-hover:text-[#56a67c] transition-colors duration-300">
                        {post.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </section>
    </div>
  )
}
