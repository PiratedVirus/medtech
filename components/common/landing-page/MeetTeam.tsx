import React from "react";

/**
 * Single Doctor Card component
 */
function DoctorCard({
  imageUrl,
  name,
  title,
  extraTitle,
}: {
  imageUrl: string;
  name: string;
  title: string;
  extraTitle?: string;
}) {
  return (
    <div className="flex rounded-3xl h-80 shadow overflow-hidden bg-gradient-to-t from-[#134F30] to-[#56A67C] px-4 pt-4 pb-0 sm:p-6 lg:p-8 lg:pb-0 text-white">
      {/* Doctor Image */}
      <img
        src={imageUrl}
        alt={name}
        className="w-[205px] h-[344px] object-cover"
      />

      {/* Right-side Text */}
      <div className="flex flex-col justify-center gap-3 p-4">
        {/* Doctor Name */}
        <h3 className="text-2xl font-bold bg-gradient-to-r from-[#56a67c] to-[#33b46c] text-white bg-clip-text">
          {name}
        </h3>
        {/* Title/Subheading */}
        <p className="text-base bg-gradient-to-r from-[#56a67c] to-[#33b46c] text-white bg-clip-text">
          {title}
          {extraTitle && <br />}
          {extraTitle}
        </p>

        {/* "Know more>" link */}
        <a
          href="#"
          className="underline text-base bg-gradient-to-r from-[#56a67c] to-[#33b46c] text-white bg-clip-text"
        >
          Know more
        </a>

        {/* "Book appointment" Button */}
        <button className="inline-flex w-52 items-center gap-2 px-5 py-3 rounded-xl bg-[#f5f7f9] border-none">
          <span className="bg-gradient-to-r from-[#56a67c] to-[#164E2F] bg-clip-text text-transparent font-semibold">
            Book appointment
          </span>
          <img
            className="w-4 h-4"
            alt="arrow"
            src="https://c.animaapp.com/gmTUL6Tf/img/vector.svg"
          />
        </button>
      </div>
    </div>
  );
}

export const MeetTeamSection = () => {
  // Define your doctor data
  const doctors = [
    {
      imageUrl: "https://c.animaapp.com/gmTUL6Tf/img/image-3-3@2x.png",
      name: "Dr. Satish Ghansala",
      title: "Management Representee & Head Dental",
    },
    {
      imageUrl: "https://c.animaapp.com/gmTUL6Tf/img/image-3-3@2x.png",
      name: "Dr. Shanu Ghansala",
      title: "Medical Superintendent and Senior Consultant (General Medicine)",
    },
    {
      imageUrl: "https://c.animaapp.com/gmTUL6Tf/img/image-3-3@2x.png",
      name: "Dr. Manish Ghansala",
      title: "Medical Director Senior Consultant & Head (Respiratory Medicine)",
    },
    {
      imageUrl: "https://c.animaapp.com/gmTUL6Tf/img/image-3-3@2x.png",
      name: "Dr. Mohit Ghansala",
      title: "Medical Superintendent and Senior Consultant (General Medicine)",
    },
  ];

  return (
    <div className="w-full mx-auto flex flex-col justify-center items-center px-20 py-8">
            <div className="text-4xl pb-8 font-medium leading-normal text-[#2C2E38]">
                Meet the{" "}
                <span className="bg-gradient-to-r from-[#164E2F] to-[#33B46C] bg-clip-text text-transparent">
                  Team
                </span>
              </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
  
        {doctors.map((doc, idx) => (
          <DoctorCard
            key={idx}
            imageUrl={doc.imageUrl}
            name={doc.name}
            title={doc.title}
          />
        ))}
      </div>
    </div>
  );
};