import React from "react";
import Link from "next/link";
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
    <div
      className=" flex flex-col sm:flex-row rounded-3xl overflow-hidden bg-gradient-to-t from-[#134F30] to-[#56A67C] shadow h-auto sm:h-80 px-4 pt-4 pb-0 sm:p-6 lg:p-8 lg:pb-0 text-white"
    >
      {/* Doctor Image */}
      <img
        src={imageUrl}
        alt={name}
        className="w-full max-h-96 sm:w-[205px] sm:max-h-[344px] object-cover"
      />

      {/* Right-side Text */}
      <div className="flex flex-col justify-center gap-3 p-4 w-full text-center sm:text-left">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-[#56a67c] to-[#33b46c] bg-clip-text text-slate-100">
          {name}
        </h3>
        <p className="text-base bg-gradient-to-r from-[#56a67c] to-[#33b46c] bg-clip-text text-white">
          {title}
          {extraTitle && (
            <>
              <br />
              <br />
              <span className="text-gray-100">{extraTitle}</span>
            </>
          )}
        </p>



        <Link href="/dashboard" className="mt-2 self-center sm:self-start">
          <button className="inline-flex w-full sm:w-52 justify-center items-center gap-2 px-5 py-3 rounded-xl bg-[#f5f7f9] border-none">
            <span className="bg-gradient-to-r from-[#56a67c] to-[#164E2F] bg-clip-text text-transparent font-semibold">
              Book appointment
            </span>
            <img
              className="w-4 h-4"
              alt="arrow"
              src="https://c.animaapp.com/gmTUL6Tf/img/vector.svg"
            />
          </button>
        </Link>
      </div>
    </div>
  );
}


export const MeetTeamSection = () => {
  // Define your doctor data
  const doctors = [
    {
      imageUrl: "https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1746005032/drnikhil_o81uyg.png",
      name: "Dr. Nikhil Gupta",
      title: "MBBS (AIIMS, New Delhi), MPH, DABIM, FACE",
      extraTitle:"American Board of Internal Medicine, Clinical Endocrinologist, EDM Institute, Toranto - Canada",
    },

    
    {
      imageUrl: "https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1746005030/drsetu_hfc9ya.png",
      name: "Dr. Setu Gupta",
      title: "MBBS, MD Medicine PGIMER, MRCSE (Endocrinology) - UK",
      extraTitle:"DM Endocrinology, AIIMS, New Delhi. Consultant, Sir Gangaram Hospital, New Delhi. Times 2025 Healthcare Leader award winner",

    },
    {
      imageUrl: "https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1746005030/drarun_cdayrd.png",
      name: "Dr. Arun Singh",
      title: "MBBS, Medicine MAMC Delhi",
      extraTitle:"DM Endocrinology, AIIMS, New Delhi.",

    },
    {
      imageUrl: "https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1746011772/awrv8fhemdpjxh3rq7cp.png",
      name: "Dr. Suvarna Domde Nitnaware",
      title: "Specializing  in IBS, diabetes, renal nutrition, and lifestyle management.  ",
      extraTitle:"Certified in Low FODMAP diet, nutrigenomics, and renal nutrition. Published author and recipient of the Nutristar Award 2024 Runner-Up.",

    },

  ];

  return (
    <div className="w-full mx-auto flex flex-col justify-center items-center px-4 sm:px-20 py-8">
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
            extraTitle={doc.extraTitle}
          />
        ))}
      </div>
    </div>
  );
};