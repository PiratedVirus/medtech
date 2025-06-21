--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'PATIENT',
    'DOCTOR',
    'DIETICIAN',
    'LAB_TECH',
    'ADMIN',
    'SUPER_ADMIN',
    'NOT_SET'
);


--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'DELETED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Appointment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Appointment" (
    id integer NOT NULL,
    "patientId" integer NOT NULL,
    "doctorId" integer NOT NULL,
    "consultationType" text NOT NULL,
    "doctorAvailabilityId" integer NOT NULL,
    "prescriptionLink" text,
    "appointmentFor" text,
    "fullName" text,
    mobile text,
    email text,
    "isDietician" boolean,
    "appointmentDate" timestamp(3) without time zone,
    "appointmentLink" text,
    "subscriptionId" integer,
    status text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: Appointment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Appointment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Appointment_id_seq" OWNED BY public."Appointment".id;


--
-- Name: Clinic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Clinic" (
    id integer NOT NULL,
    name text NOT NULL,
    subdomain text,
    domain text,
    address text,
    "contactInfo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: ClinicSpecialization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ClinicSpecialization" (
    id integer NOT NULL,
    "clinicId" integer NOT NULL,
    name text NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: ClinicSpecialization_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ClinicSpecialization_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ClinicSpecialization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ClinicSpecialization_id_seq" OWNED BY public."ClinicSpecialization".id;


--
-- Name: Clinic_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Clinic_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Clinic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Clinic_id_seq" OWNED BY public."Clinic".id;


--
-- Name: Complaint; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Complaint" (
    id integer NOT NULL,
    text text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: Complaint_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Complaint_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Complaint_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Complaint_id_seq" OWNED BY public."Complaint".id;


--
-- Name: DieticianAvailability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DieticianAvailability" (
    id integer NOT NULL,
    "dieticianId" integer NOT NULL,
    "dayOfWeek" text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: DieticianAvailability_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DieticianAvailability_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DieticianAvailability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DieticianAvailability_id_seq" OWNED BY public."DieticianAvailability".id;


--
-- Name: DieticianProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DieticianProfile" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    specialty text,
    "yearsOfExperience" integer,
    certifications text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: DieticianProfile_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DieticianProfile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DieticianProfile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DieticianProfile_id_seq" OWNED BY public."DieticianProfile".id;


--
-- Name: DoctorAvailability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DoctorAvailability" (
    id integer NOT NULL,
    "doctorId" integer NOT NULL,
    date date NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    status text NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: DoctorAvailability_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DoctorAvailability_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DoctorAvailability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DoctorAvailability_id_seq" OWNED BY public."DoctorAvailability".id;


--
-- Name: DoctorProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DoctorProfile" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    specialty text NOT NULL,
    "yearsOfExperience" integer,
    "meetingRoomLink" text,
    "ownerToken1" text,
    "ownerToken2" text,
    "licenseNumber" text,
    "consultationFee" integer NOT NULL,
    rating double precision,
    type text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "extraInfo" text,
    "isDietician" boolean
);


--
-- Name: DoctorProfile_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DoctorProfile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DoctorProfile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DoctorProfile_id_seq" OWNED BY public."DoctorProfile".id;


--
-- Name: HealthMetric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HealthMetric" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "metricName" text NOT NULL,
    reading double precision NOT NULL,
    "recordedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: HealthMetric_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."HealthMetric_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: HealthMetric_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."HealthMetric_id_seq" OWNED BY public."HealthMetric".id;


--
-- Name: LabBooking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LabBooking" (
    id integer NOT NULL,
    "patientId" integer NOT NULL,
    "labTechId" integer,
    "labPackageId" integer NOT NULL,
    "appointmentFor" text,
    "fullName" text,
    mobile text,
    email text,
    address text,
    "paymentOption" text,
    status text NOT NULL,
    "labDate" timestamp(3) without time zone NOT NULL,
    "labResult" text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: LabBooking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."LabBooking_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: LabBooking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."LabBooking_id_seq" OWNED BY public."LabBooking".id;


--
-- Name: LabPackage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LabPackage" (
    id integer NOT NULL,
    name text NOT NULL,
    "shortDescription" text,
    description text,
    price integer NOT NULL,
    parameters jsonb,
    "criticalRequirements" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: LabPackage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."LabPackage_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: LabPackage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."LabPackage_id_seq" OWNED BY public."LabPackage".id;


--
-- Name: LabTechProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LabTechProfile" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    specialization text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: LabTechProfile_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."LabTechProfile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: LabTechProfile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."LabTechProfile_id_seq" OWNED BY public."LabTechProfile".id;


--
-- Name: Medicine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Medicine" (
    id integer NOT NULL,
    name text NOT NULL,
    category text,
    description text,
    price integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: Medicine_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Medicine_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Medicine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Medicine_id_seq" OWNED BY public."Medicine".id;


--
-- Name: PatientProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PatientProfile" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "subscriptionId" integer,
    "planId" integer,
    age integer NOT NULL,
    weight double precision,
    height double precision,
    gender text NOT NULL,
    "bloodGroup" text,
    allergies text,
    "medicalHistory" text,
    "emergencyContact" text,
    "dateOfBirth" timestamp(3) without time zone,
    address text,
    "profilePicture" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: PatientProfile_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PatientProfile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PatientProfile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PatientProfile_id_seq" OWNED BY public."PatientProfile".id;


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payment" (
    id integer NOT NULL,
    "appointmentId" integer,
    "labBookingId" integer,
    "subscriptionId" integer,
    "razorpayOrderId" text,
    "razorpayPaymentId" text,
    amount integer NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    "paymentStatus" text NOT NULL,
    "paymentMethod" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: Payment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Payment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Payment_id_seq" OWNED BY public."Payment".id;


--
-- Name: Plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Plan" (
    id integer NOT NULL,
    name text NOT NULL,
    duration text NOT NULL,
    price numeric(10,2),
    "discountPercentage" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: PlanFeature; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PlanFeature" (
    id integer NOT NULL,
    "planId" integer NOT NULL,
    "featureName" text NOT NULL,
    "occurrencesPerInterval" integer,
    "intervalInMonths" integer,
    parameters text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: PlanFeature_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PlanFeature_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PlanFeature_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PlanFeature_id_seq" OWNED BY public."PlanFeature".id;


--
-- Name: Plan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Plan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Plan_id_seq" OWNED BY public."Plan".id;


--
-- Name: SubscriptionTracker; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SubscriptionTracker" (
    "subscriptionId" integer NOT NULL,
    "patientId" integer NOT NULL,
    "planId" integer NOT NULL,
    "doctorConsultationDates" text[] DEFAULT ARRAY[]::text[],
    "dieticianConsultationDates" text[] DEFAULT ARRAY[]::text[],
    "labTestsDates" text[] DEFAULT ARRAY[]::text[],
    "ophthalmologistConsultationDates" text[] DEFAULT ARRAY[]::text[],
    "usedMedicines" text[] DEFAULT ARRAY[]::text[],
    "razorpayOrderId" text,
    "razorpayPaymentId" text,
    "paymentStatus" text DEFAULT 'PENDING'::text,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: SubscriptionTracker_subscriptionId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."SubscriptionTracker_subscriptionId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: SubscriptionTracker_subscriptionId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."SubscriptionTracker_subscriptionId_seq" OWNED BY public."SubscriptionTracker"."subscriptionId";


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    "clinicId" integer,
    "phoneNumber" text NOT NULL,
    email text,
    password text,
    name text NOT NULL,
    role public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "userProfilePicture" text
);


--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: Appointment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment" ALTER COLUMN id SET DEFAULT nextval('public."Appointment_id_seq"'::regclass);


--
-- Name: Clinic id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Clinic" ALTER COLUMN id SET DEFAULT nextval('public."Clinic_id_seq"'::regclass);


--
-- Name: ClinicSpecialization id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClinicSpecialization" ALTER COLUMN id SET DEFAULT nextval('public."ClinicSpecialization_id_seq"'::regclass);


--
-- Name: Complaint id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Complaint" ALTER COLUMN id SET DEFAULT nextval('public."Complaint_id_seq"'::regclass);


--
-- Name: DieticianAvailability id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DieticianAvailability" ALTER COLUMN id SET DEFAULT nextval('public."DieticianAvailability_id_seq"'::regclass);


--
-- Name: DieticianProfile id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DieticianProfile" ALTER COLUMN id SET DEFAULT nextval('public."DieticianProfile_id_seq"'::regclass);


--
-- Name: DoctorAvailability id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorAvailability" ALTER COLUMN id SET DEFAULT nextval('public."DoctorAvailability_id_seq"'::regclass);


--
-- Name: DoctorProfile id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorProfile" ALTER COLUMN id SET DEFAULT nextval('public."DoctorProfile_id_seq"'::regclass);


--
-- Name: HealthMetric id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HealthMetric" ALTER COLUMN id SET DEFAULT nextval('public."HealthMetric_id_seq"'::regclass);


--
-- Name: LabBooking id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabBooking" ALTER COLUMN id SET DEFAULT nextval('public."LabBooking_id_seq"'::regclass);


--
-- Name: LabPackage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabPackage" ALTER COLUMN id SET DEFAULT nextval('public."LabPackage_id_seq"'::regclass);


--
-- Name: LabTechProfile id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabTechProfile" ALTER COLUMN id SET DEFAULT nextval('public."LabTechProfile_id_seq"'::regclass);


--
-- Name: Medicine id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Medicine" ALTER COLUMN id SET DEFAULT nextval('public."Medicine_id_seq"'::regclass);


--
-- Name: PatientProfile id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PatientProfile" ALTER COLUMN id SET DEFAULT nextval('public."PatientProfile_id_seq"'::regclass);


--
-- Name: Payment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment" ALTER COLUMN id SET DEFAULT nextval('public."Payment_id_seq"'::regclass);


--
-- Name: Plan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Plan" ALTER COLUMN id SET DEFAULT nextval('public."Plan_id_seq"'::regclass);


--
-- Name: PlanFeature id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlanFeature" ALTER COLUMN id SET DEFAULT nextval('public."PlanFeature_id_seq"'::regclass);


--
-- Name: SubscriptionTracker subscriptionId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubscriptionTracker" ALTER COLUMN "subscriptionId" SET DEFAULT nextval('public."SubscriptionTracker_subscriptionId_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Appointment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Appointment" (id, "patientId", "doctorId", "consultationType", "doctorAvailabilityId", "prescriptionLink", "appointmentFor", "fullName", mobile, email, "isDietician", "appointmentDate", "appointmentLink", "subscriptionId", status, "createdAt", "updatedAt", "deletedAt") FROM stdin;
3	18	4	Video	1	\N	self	Anjali Kulkarni	+919699787615		f	2025-05-06 18:30:00	\N	4	Scheduled	2025-05-05 07:44:34.461	2025-05-05 07:44:34.461	\N
\.


--
-- Data for Name: Clinic; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Clinic" (id, name, subdomain, domain, address, "contactInfo", "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	Padmaram Healthcare	\N	\N	Garkheda, CSN	8208534977	2025-04-30 09:45:04.285	2025-04-30 09:45:04.285	\N
\.


--
-- Data for Name: ClinicSpecialization; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ClinicSpecialization" (id, "clinicId", name, "deletedAt") FROM stdin;
\.


--
-- Data for Name: Complaint; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Complaint" (id, text, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: DieticianAvailability; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DieticianAvailability" (id, "dieticianId", "dayOfWeek", "startTime", "endTime", "deletedAt") FROM stdin;
\.


--
-- Data for Name: DieticianProfile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DieticianProfile" (id, "userId", specialty, "yearsOfExperience", certifications, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	6	Nutritionist	5	\N	2025-04-30 10:53:08.544	2025-04-30 10:53:08.544	\N
\.


--
-- Data for Name: DoctorAvailability; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DoctorAvailability" (id, "doctorId", date, "startTime", "endTime", status, "deletedAt") FROM stdin;
1	2	2025-05-06	11:00 AM	09:30 AM	booked	\N
3	3	2025-05-12	02:15 PM	02:30 PM	available	\N
5	2	2025-05-10	07:30 PM	08:00 PM	available	\N
4	4	2025-05-13	09:00 AM	09:30 AM	available	\N
6	1	2025-05-11	12:15 PM	12:30 PM	available	\N
7	4	2025-05-14	01:15 PM	02:00 PM	available	\N
8	1	2025-05-12	02:15 PM	02:45 PM	available	\N
12	7	2025-05-16	12:00 AM	12:15 AM	available	\N
13	2	2025-05-12	10:00 AM	10:30 AM	available	\N
15	7	2025-05-12	02:00 PM	03:00 PM	available	\N
16	7	2025-05-12	06:00 PM	07:00 PM	available	\N
18	2	2025-05-12	03:00 PM	03:30 PM	available	\N
9	7	2025-05-15	12:00 AM	12:15 AM	available	\N
14	7	2025-05-15	02:00 PM	03:00 PM	available	\N
19	7	2025-05-14	01:00 AM	01:15 AM	available	\N
20	7	2025-05-15	07:00 AM	07:15 AM	available	\N
17	7	2025-05-17	02:30 PM	03:00 PM	available	\N
21	2	2025-05-15	12:15 PM	01:15 PM	available	\N
2	2	2025-05-17	12:15 PM	12:45 PM	available	\N
\.


--
-- Data for Name: DoctorProfile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DoctorProfile" (id, "userId", specialty, "yearsOfExperience", "meetingRoomLink", "ownerToken1", "ownerToken2", "licenseNumber", "consultationFee", rating, type, "createdAt", "updatedAt", "deletedAt", "extraInfo", "isDietician") FROM stdin;
1	3	Endocrinology	8	https://care-diabieties-test.daily.co/doctor-3-1746008554687	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTMtMTc0NjAwODU1NDY4NyIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDYwMDg1NTZ9.Xd2DO5keViS1MrXb28eoFS42Ks49iBQzFB70lyf9Z1c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTMtMTc0NjAwODU1NDY4NyIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDYwMDg1NTZ9.Xd2DO5keViS1MrXb28eoFS42Ks49iBQzFB70lyf9Z1c	\N	999	\N	\N	2025-04-30 10:22:36.654	2025-05-15 20:23:09.924	\N	\N	f
2	4	Endocrinology	11	https://care-diabieties-test.daily.co/doctor-4-1746008632862	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTQtMTc0NjAwODYzMjg2MiIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDYwMDg2MzR9.70_j3A6cHoibrUbT8zpGpbVtjUzyJQKZ3dKY9H2RRZc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTQtMTc0NjAwODYzMjg2MiIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDYwMDg2MzR9.70_j3A6cHoibrUbT8zpGpbVtjUzyJQKZ3dKY9H2RRZc	\N	999	\N	\N	2025-04-30 10:23:54.69	2025-05-15 20:23:09.924	\N	\N	f
7	6	Nutritionst	6	https://care-diabieties-test.daily.co/doctor-6-1746989383241	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTYtMTc0Njk4OTM4MzI0MSIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDY5ODkzODR9.6arJH4FqRzB9IMXPC6G8NvPwuX8aVZ9J6wdLvvLDGD0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTYtMTc0Njk4OTM4MzI0MSIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDY5ODkzODV9.cSpbPUFDnMbsDETUzzPIY2n-C4qoNaMf7chSryDjTrA	\N	499	\N	\N	2025-05-11 18:49:45.16	2025-05-11 18:49:45.16	\N	\N	t
3	5	Endocrinology	16	https://care-diabieties-test.daily.co/doctor-5-1746008692141	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTUtMTc0NjAwODY5MjE0MSIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDYwMDg2OTN9.7ojw7CNFTcfxxyFaZAxtWaquzKK2GUeFR89xUSyWDAE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTUtMTc0NjAwODY5MjE0MSIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDYwMDg2OTN9.7ojw7CNFTcfxxyFaZAxtWaquzKK2GUeFR89xUSyWDAE	\N	999	\N	\N	2025-04-30 10:24:53.972	2025-05-15 20:23:09.924	\N	\N	f
4	22	Endocrinology	11	https://care-diabieties-test.daily.co/doctor-22-1746889439028	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTIyLTE3NDY4ODk0MzkwMjgiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ2ODg5NDQwfQ.fvnOtMzxRDpMwuP1-prWGFGGfiFziLEIL82t0Bnc-5M	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTIyLTE3NDY4ODk0MzkwMjgiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ2ODg5NDQwfQ.fvnOtMzxRDpMwuP1-prWGFGGfiFziLEIL82t0Bnc-5M	\N	500	\N	\N	2025-05-10 15:04:00.879	2025-05-12 05:26:44.029	\N	\N	f
8	19	MBBS	2	https://care-diabieties-test.daily.co/doctor-19-1747027273005	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTE5LTE3NDcwMjcyNzMwMDUiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ3MDI3MjczfQ.8vlnCpwlvCNbQK_6LPNDEL5a9bMHw0_KnXFNLC9PApc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTE5LTE3NDcwMjcyNzMwMDUiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ3MDI3MjczfQ.8vlnCpwlvCNbQK_6LPNDEL5a9bMHw0_KnXFNLC9PApc	\N	499	\N	\N	2025-05-12 05:21:13.571	2025-05-13 15:17:21.492	2025-05-13 15:17:21.491	\N	f
9	9	Multi	1	https://care-diabieties-test.daily.co/doctor-9-1747332392345	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTktMTc0NzMzMjM5MjM0NSIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDczMzIzOTR9.QABf0trw9TMkPpoimxVgpjDbBD0lw81p48gW_9fryDk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTktMTc0NzMzMjM5MjM0NSIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDczMzIzOTR9.QABf0trw9TMkPpoimxVgpjDbBD0lw81p48gW_9fryDk	\N	199	\N	\N	2025-05-15 18:06:34.938	2025-05-15 18:06:34.938	\N	\N	f
10	31	kk	99	https://care-diabieties-test.daily.co/doctor-31-1747334749269	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTMxLTE3NDczMzQ3NDkyNjkiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ3MzM0NzUxfQ.tX1b0frhB6N_ErdEfD4xYlcgVP5yrGnB40mkVaVFAlE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTMxLTE3NDczMzQ3NDkyNjkiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ3MzM0NzUxfQ.tX1b0frhB6N_ErdEfD4xYlcgVP5yrGnB40mkVaVFAlE	\N	999	\N	\N	2025-05-15 18:45:51.623	2025-05-15 18:45:51.623	\N	\N	f
5	23	Endocrinologist	15	https://care-diabieties-test.daily.co/doctor-23-1746894760625	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTIzLTE3NDY4OTQ3NjA2MjUiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ2ODk0NzYxfQ.vxsQOPKJEoINn79XUVC_fCzknxp5F-K2cJw3fYt9_nQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTIzLTE3NDY4OTQ3NjA2MjUiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ2ODk0NzYxfQ.vxsQOPKJEoINn79XUVC_fCzknxp5F-K2cJw3fYt9_nQ	\N	500	\N	\N	2025-05-10 16:32:41.177	2025-05-15 20:23:09.924	\N	\N	f
11	33	xx	44	https://care-diabieties-test.daily.co/doctor-33-1747372498988	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTMzLTE3NDczNzI0OTg5ODgiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ3MzcyNTAwfQ.PrT7-XJNDLqXjmi4bty5x0N4U56eXuH40_74rltr-jM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTMzLTE3NDczNzI0OTg5ODgiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ3MzcyNTAwfQ.PrT7-XJNDLqXjmi4bty5x0N4U56eXuH40_74rltr-jM	\N	200	\N	\N	2025-05-16 05:15:00.845	2025-05-16 06:26:17.869	2025-05-16 06:26:17.864	\N	t
\.


--
-- Data for Name: HealthMetric; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."HealthMetric" (id, "userId", "metricName", reading, "recordedAt", "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	13	Blood Glucose	200	2025-05-05 03:20:00	2025-05-05 03:20:39.072	2025-05-05 03:30:02.223	\N
2	13	Blood Glucose	180	2025-04-05 03:20:00	2025-05-05 03:20:58.659	2025-05-05 03:30:07.512	\N
3	9	Blood Glucose	204	2025-05-06 18:34:00	2025-05-05 13:04:50.336	2025-05-05 13:04:50.336	\N
4	9	Blood Glucose	204	2025-05-06 18:34:00	2025-05-05 13:04:51.846	2025-05-05 13:04:51.846	\N
5	9	Body Fat	32	2025-05-05 13:05:37.293	2025-05-05 13:05:37.332	2025-05-05 13:05:37.332	\N
6	9	Muscle Mass	24	2025-05-05 13:05:52.672	2025-05-05 13:05:52.673	2025-05-05 13:05:52.673	\N
7	9	BMI	23	2025-05-05 13:06:14.247	2025-05-05 13:06:14.249	2025-05-05 13:06:14.249	\N
8	9	Visceral Fat	12	2025-05-05 13:06:29.492	2025-05-05 13:06:29.493	2025-05-05 13:06:29.493	\N
\.


--
-- Data for Name: LabBooking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LabBooking" (id, "patientId", "labTechId", "labPackageId", "appointmentFor", "fullName", mobile, email, address, "paymentOption", status, "labDate", "labResult", "createdAt", "updatedAt", "deletedAt") FROM stdin;
4	12	\N	2	self	Ram Aurange	+918149306224	ram@gmail.com	6,Sector no.93,Vrundawan Colony,	clinic	Scheduled	2025-05-07 00:00:00	{https://7cgjyrzzbjeb6kff.public.blob.vercel-storage.com/Ram-Aurange-labReport-4-padmaram%20logo_20250426_192811_0000.pdf}	2025-05-05 03:00:11.436	2025-05-16 06:51:16.391	\N
\.


--
-- Data for Name: LabPackage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LabPackage" (id, name, "shortDescription", description, price, parameters, "criticalRequirements", "createdAt", "updatedAt", "deletedAt") FROM stdin;
2	Basic		In this Lab test you will get tested for HbA1C, FBS, 2 hr PP the basic test needed for diabetes testing and management.	499	"{\\"Basic\\":[\\"Fasting Plasma Glucose\\", \\"HbA1C\\", \\"Glucose Post Prandial\\"]}"	Fasting Required, Package	2025-05-01 14:41:52.88	2025-05-11 15:47:56.865	\N
3	Blood glucose			149	"{\\"Basic\\":[\\"Fasting Plasma Glucose\\", \\"Glucose Post Prandial\\"]}"	Fasting required	2025-05-05 12:30:39.745	2025-05-05 12:32:04.026	\N
1	Care+		CBC: Detects infections, anemia, and blood disorders\t. \t•LFT: Assesses liver health (ALT, AST, Bilirubin, etc.). \t•\tKFT: Checks kidney function (Creatinine, Urea, Electrolytes). \t•\tThyroid Panel: Evaluates thyroid issues (TSH, T3, T4). \t•\tLipid Profile: Measures cholesterol and heart risk. \t•\tBlood Sugar & HbA1c: Detects and monitors diabetes.  Urine Panel \t•\tUrinalysis: Screens for infections, kidney issues, diabetes. \t•\tMicroalbumin: Early detection of diabetic kidney damage.  \t•Vitamin B12 status  \t•Vit D status.	1999	"{   \\"FBS\\": [\\"Fasting Plasma Glucose\\"], \\"HbA1C\\": [\\"HbA1C (Glycosylated Hemoglobin)\\"], \\"2 hour PP\\": [\\"Glucose Post Prandial\\"], \\"LFT (Liver function test)\\": [     \\"Serum Bilirubin (Indirect)\\", \\"SGOT / AST\\", \\"SGPT / ALT\\", \\"Total Protein\\", \\"Albumin\\", \\"Albumin Globulin A/G Ratio\\", \\"Alkaline Phosphatase\\", \\"AST / ALT Ratio\\", \\"Bilirubin Direct\\", \\"Bilirubin Total\\", \\"Globulin\\"   ], \\"KFT (Kidney function test)\\": [     \\"Urea\\", \\"Blood Urea\\", \\"Blood Urea Nitrogen (BUN)\\", \\"Creatinine\\", \\"BUN Creatinine Ratio\\", \\"Uric Acid\\", \\"Electrolytes (Na/K/Cl)\\", \\"Sodium\\", \\"Potassium\\", \\"Chloride\\", \\"Total Protein\\", \\"Albumin\\", \\"Globulin\\", \\"Albumin Globulin A/G Ratio\\", \\"pH Level\\", \\"Specific Gravity\\", \\"Remarks\\", \\"Bilirubin\\", \\"Urobilinogen\\", \\"Nitrite\\", \\"Pus Cells, Urine\\", \\"RBC, Urine\\", \\"Epithelial Cells, Urine\\", \\"Colour, Urine\\", \\"Appearance\\", \\"Casts\\", \\"Crystals\\", \\"Bacteria\\", \\"Blood\\", \\"Glucose\\", \\"Protein\\", \\"Ketones\\"   ], \\"Lipid Profile\\": [     \\"Total Cholesterol\\", \\"Triglycerides\\", \\"HDL Cholesterol\\", \\"VLDL Cholesterol\\", \\"LDL Cholesterol (Calculated)\\", \\"HDL/LDL Ratio\\", \\"HDL/Total Cholesterol Ratio\\"   ], \\"Urine ACR\\": [     \\"Microalbumin, Urine\\", \\"Creatinine, Urine\\", \\"Albumin Creatinine Ratio\\"   ], \\"Throid Profile Test\\": [     \\"TSH\\", \\"T3\\", \\"T4\\"   ], \\"Urine R/M\\": [     \\"Colour\\", \\"Odour\\", \\"pH\\", \\"Specific gravity\\"   ], \\"CBC\\": [     \\"Haemoglobin (Hb)\\", \\"Total WBC Count / TLC\\", \\"RBC Count\\", \\"PCV / Hematocrit\\", \\"MCV\\", \\"MCH\\", \\"MCHC\\", \\"RDW (Red Cell Distribution Width)\\", \\"DLC (Differential Leucocyte Count)\\", \\"Platelet Count\\", \\"MPV (Mean Platelet Volume)\\", \\"Absolute Neutrophil Count (ANC)\\", \\"Absolute Eosinophil Count (AEC)\\", \\"Absolute Lymphocyte Count\\", \\"Absolute Monocyte Count\\", \\"Absolute Basophil Count\\", \\"Meta Myelocytes\\", \\"Myelocytes\\", \\"Blasts / Atypical Cells\\", \\"Atypical Lymphocytes\\", \\"Neutrophils\\", \\"Lymphocytes\\", \\"Monocytes\\", \\"Basophils\\", \\"Eosinophils\\", \\"Band Forms\\", \\"Pro Myelocytes\\", \\"Pro Lymphocytes\\", \\"Plasma Cells\\", \\"Nucleated RBC Count\\"   ], \\"Vitamin D\\": [\\"Vitamin D 25 - Hydroxy\\"], \\"Vitamin B12\\": [\\"Vitamin B12\\"] }"	Fasting required, Package	2025-05-01 09:49:18.163	2025-05-11 15:49:04.544	\N
4	Care		CBC: Detects infections, anemia, and blood disorders\t. \t•LFT: Assesses liver health (ALT, AST, Bilirubin, etc.). \t•\tKFT: Checks kidney function (Creatinine, Urea, Electrolytes). \t•\tThyroid Panel: Evaluates thyroid issues (TSH, T3, T4). \t•\tLipid Profile: Measures cholesterol and heart risk. \t•\tBlood Sugar & HbA1c: Detects and monitors diabetes.  Urine Panel \t•\tUrinalysis: Screens for infections, kidney issues, diabetes. \t•\tMicroalbumin: Early detection of diabetic kidney damage.  	1499	"{   \\"FBS\\": [\\"Fasting Plasma Glucose\\"], \\"HbA1C\\": [\\"HbA1C (Glycosylated Hemoglobin)\\"], \\"2 hour PP\\": [\\"Glucose Post Prandial\\"], \\"LFT (Liver function test)\\": [     \\"Serum Bilirubin (Indirect)\\", \\"SGOT / AST\\", \\"SGPT / ALT\\", \\"Total Protein\\", \\"Albumin\\", \\"Albumin Globulin A/G Ratio\\", \\"Alkaline Phosphatase\\", \\"AST / ALT Ratio\\", \\"Bilirubin Direct\\", \\"Bilirubin Total\\", \\"Globulin\\"   ], \\"KFT (Kidney function test)\\": [     \\"Urea\\", \\"Blood Urea\\", \\"Blood Urea Nitrogen (BUN)\\", \\"Creatinine\\", \\"BUN Creatinine Ratio\\", \\"Uric Acid\\", \\"Electrolytes (Na/K/Cl)\\", \\"Sodium\\", \\"Potassium\\", \\"Chloride\\", \\"pH\\", \\"Specific Gravity\\", \\"Remarks\\", \\"Urobilinogen\\", \\"Nitrite\\", \\"Pus Cells, Urine\\", \\"RBC, Urine\\", \\"Epithelial Cells, Urine\\", \\"Colour\\", \\"Odour\\", \\"Appearance\\", \\"Casts\\", \\"Crystals\\", \\"Bacteria\\", \\"Blood\\", \\"Glucose\\", \\"Protein\\", \\"Ketones\\"   ], \\"Lipid Profile\\": [     \\"Total Cholesterol\\", \\"Triglycerides\\", \\"HDL Cholesterol\\", \\"VLDL Cholesterol\\", \\"LDL Cholesterol (Calculated)\\", \\"HDL/LDL Ratio\\", \\"HDL/Total Cholesterol Ratio\\"   ], \\"Urine ACR\\": [     \\"Microalbumin, Urine\\", \\"Creatinine, Urine\\", \\"Albumin Creatinine Ratio\\"   ], \\"Thyroid Profile Test\\": [\\"TSH\\", \\"T3\\", \\"T4\\"], \\"CBC\\": [     \\"Haemoglobin (Hb)\\", \\"Total WBC Count / TLC\\", \\"RBC Count\\", \\"PCV / Hematocrit\\", \\"MCV\\", \\"MCH\\", \\"MCHC\\", \\"RDW (Red Cell Distribution Width)\\", \\"DLC (Differential Leucocyte Count)\\", \\"Platelet Count\\", \\"MPV (Mean Platelet Volume)\\", \\"Absolute Neutrophil Count (ANC)\\", \\"Absolute Eosinophil Count (AEC)\\", \\"Absolute Lymphocyte Count\\", \\"Absolute Monocyte Count\\", \\"Absolute Basophil Count\\", \\"Meta Myelocytes\\", \\"Myelocytes\\", \\"Blasts / Atypical Cells\\", \\"Atypical Lymphocytes\\", \\"Neutrophils\\", \\"Lymphocytes\\", \\"Monocytes\\", \\"Basophils\\", \\"Eosinophils\\", \\"Band Forms\\", \\"Pro Myelocytes\\", \\"Pro Lymphocytes\\", \\"Plasma Cells\\", \\"Nucleated RBC Count\\"   ] }"	Fasting required, Package	2025-05-06 10:36:10.217	2025-05-11 15:49:35.352	\N
\.


--
-- Data for Name: LabTechProfile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LabTechProfile" (id, "userId", specialization, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: Medicine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Medicine" (id, name, category, description, price, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: PatientProfile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PatientProfile" (id, "userId", "subscriptionId", "planId", age, weight, height, gender, "bloodGroup", allergies, "medicalHistory", "emergencyContact", "dateOfBirth", address, "profilePicture", "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	2	\N	\N	27	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-04-30 09:45:40.047	2025-04-30 09:45:40.047	\N
2	7	\N	\N	55	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-04-30 12:30:46.858	2025-04-30 12:30:46.858	\N
4	10	\N	\N	24	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-01 05:27:16.564	2025-05-01 05:27:16.564	\N
5	11	\N	\N	23	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-01 09:58:16.13	2025-05-01 09:58:16.13	\N
6	12	1	2	56	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-01 15:52:49.433	2025-05-01 15:57:11.54	\N
7	13	\N	\N	23	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-02 07:47:31.726	2025-05-02 07:47:31.726	\N
8	14	\N	\N	24	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-02 07:50:42.959	2025-05-02 07:50:42.959	\N
9	16	\N	\N	56	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-02 13:01:43.21	2025-05-02 13:01:43.21	\N
10	17	\N	\N	78	\N	\N	Female	\N	\N	\N	\N	\N	\N	\N	2025-05-02 19:20:18.121	2025-05-02 19:20:18.121	\N
11	18	4	1	22	\N	\N	Female	\N	\N	\N	\N	\N	\N	\N	2025-05-05 04:44:12.105	2025-05-05 05:33:02.353	\N
12	20	\N	\N	37	\N	\N	Female	\N	\N	\N	\N	\N	\N	\N	2025-05-09 05:58:12.029	2025-05-09 05:58:12.029	\N
13	21	\N	\N	57	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-09 12:56:41.192	2025-05-09 12:56:41.192	\N
14	26	\N	\N	58	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-11 09:52:06.208	2025-05-11 09:52:06.208	\N
15	29	\N	\N	20	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-13 16:12:46.878	2025-05-13 16:12:46.878	\N
16	30	\N	\N	18	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-15 04:48:53.222	2025-05-15 04:48:53.222	\N
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payment" (id, "appointmentId", "labBookingId", "subscriptionId", "razorpayOrderId", "razorpayPaymentId", amount, currency, "paymentStatus", "paymentMethod", "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	\N	\N	1	order_QPinrEqvJM2VPk	pay_QPioURqpDetSOY	599900	INR	Paid	upi	2025-05-01 15:57:11.089	2025-05-01 15:57:11.089	\N
2	\N	4	\N	\N	\N	49900	INR	Pending	offline	2025-05-05 03:00:11.587	2025-05-05 03:00:11.587	\N
3	\N	\N	2	order_QR7WJrwLoiMN43	pay_QR7WSFO2KlgoQ0	100	INR	Paid	upi	2025-05-05 04:46:06.593	2025-05-05 04:46:06.593	\N
4	\N	\N	3	order_QR83I9VaKOwF54	pay_QR83NFHUAHsMhd	100	INR	Paid	upi	2025-05-05 05:17:10.519	2025-05-05 05:17:10.519	\N
5	\N	\N	4	order_QR8IrHP6cfPGga	pay_QR8IyG3qHvZKEQ	100	INR	Paid	upi	2025-05-05 05:33:02.207	2025-05-05 05:33:02.207	\N
\.


--
-- Data for Name: Plan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Plan" (id, name, duration, price, "discountPercentage", "createdAt", "updatedAt", "deletedAt") FROM stdin;
2	Care	6months	5999.00	25	2025-04-30 10:01:18.897	2025-05-07 04:53:46.138	\N
4	Basic	12months	4999.00	15	2025-04-30 10:05:43.026	2025-05-10 16:26:13.133	\N
1	Basic	6months	2599.00	15	2025-04-30 09:57:14.599	2025-05-10 16:26:42.575	\N
5	Care	12months	9999.00	25	2025-04-30 10:07:10.579	2025-05-11 15:35:22.131	\N
6	Care+	12months	16999.00	35	2025-04-30 10:08:20.891	2025-05-11 15:35:54.087	\N
3	Care+	6months	9999.00	35	2025-04-30 10:04:06.011	2025-05-06 08:25:34.878	\N
\.


--
-- Data for Name: PlanFeature; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PlanFeature" (id, "planId", "featureName", "occurrencesPerInterval", "intervalInMonths", parameters, notes, "createdAt", "updatedAt", "deletedAt") FROM stdin;
461	6	Lab Tests	1	3	    {   "FBS": ["Fasting Plasma Glucose"],   "HbA1C": ["HbA1C (Glycosylated Hemoglobin)"],   "2 hour PP": ["Glucose Post Prandial"],   "LFT (Liver function test)": [     "Serum Bilirubin (Indirect)",     "SGOT / AST",     "SGPT / ALT",     "Total Protein",     "Albumin",     "Albumin Globulin A/G Ratio",     "Alkaline Phosphatase",     "AST / ALT Ratio",     "Bilirubin Direct",     "Bilirubin Total",     "Globulin"   ],   "KFT (Kidney function test)": [     "Urea",     "Blood Urea",     "Blood Urea Nitrogen (BUN)",     "Creatinine",     "BUN Creatinine Ratio",     "Uric Acid",     "Electrolytes (Na/K/Cl)",     "Sodium",     "Potassium",     "Chloride",     "Total Protein",     "Albumin",     "Globulin",     "Albumin Globulin A/G Ratio",     "pH Level",     "Specific Gravity",     "Remarks",     "Bilirubin",     "Urobilinogen",     "Nitrite",     "Pus Cells, Urine",     "RBC, Urine",     "Epithelial Cells, Urine",     "Colour, Urine",     "Appearance",     "Casts",     "Crystals",     "Bacteria",     "Blood",     "Glucose",     "Protein",     "Ketones"   ],   "Lipid Profile": [     "Total Cholesterol",     "Triglycerides",     "HDL Cholesterol",     "VLDL Cholesterol",     "LDL Cholesterol (Calculated)",     "HDL/LDL Ratio",     "HDL/Total Cholesterol Ratio"   ],   "Urine ACR": [     "Microalbumin, Urine",     "Creatinine, Urine",     "Albumin Creatinine Ratio"   ],   "Throid Profile Test": [     "TSH",     "T3",     "T4"   ],   "Urine R/M": [     "Colour",     "Odour",     "pH",     "Specific gravity"   ],   "CBC": [     "Haemoglobin (Hb)",     "Total WBC Count / TLC",     "RBC Count",     "PCV / Hematocrit",     "MCV",     "MCH",     "MCHC",     "RDW (Red Cell Distribution Width)",     "DLC (Differential Leucocyte Count)",     "Platelet Count",     "MPV (Mean Platelet Volume)",     "Absolute Neutrophil Count (ANC)",     "Absolute Eosinophil Count (AEC)",     "Absolute Lymphocyte Count",     "Absolute Monocyte Count",     "Absolute Basophil Count",     "Meta Myelocytes",     "Myelocytes",     "Blasts / Atypical Cells",     "Atypical Lymphocytes",     "Neutrophils",     "Lymphocytes",     "Monocytes",     "Basophils",     "Eosinophils",     "Band Forms",     "Pro Myelocytes",     "Pro Lymphocytes",     "Plasma Cells",     "Nucleated RBC Count"   ],   "Vitamin D": ["Vitamin D 25 - Hydroxy"],   "Vitamin B12": ["Vitamin B12"] }	1 complete blood test + urine every 3 months	2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
462	6	Medicines	\N	\N		Upto 35%	2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
463	6	Biosthesiometer Test (Nerve Sensitivity Test)	1	3			2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
464	6	BP,  Body  Composition   Analysis  test	1	3			2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
367	2	Lab Tests	1	3	{   "FBS": ["Fasting Plasma Glucose"],   "HbA1C": ["HbA1C (Glycosylated Hemoglobin)"],   "2 hour PP": ["Glucose Post Prandial"],   "LFT (Liver function test)": [     "Serum Bilirubin (Indirect)",     "SGOT / AST",     "SGPT / ALT",     "Total Protein",     "Albumin",     "Albumin Globulin A/G Ratio",     "Alkaline Phosphatase",     "AST / ALT Ratio",     "Bilirubin Direct",     "Bilirubin Total",     "Globulin"   ],   "KFT (Kidney function test)": [     "Urea",     "Blood Urea",     "Blood Urea Nitrogen (BUN)",     "Creatinine",     "BUN Creatinine Ratio",     "Uric Acid",     "Electrolytes (Na/K/Cl)",     "Sodium",     "Potassium",     "Chloride",     "pH",     "Specific Gravity",     "Remarks",     "Urobilinogen",     "Nitrite",     "Pus Cells, Urine",     "RBC, Urine",     "Epithelial Cells, Urine",     "Colour",     "Odour",     "Appearance",     "Casts",     "Crystals",     "Bacteria",     "Blood",     "Glucose",     "Protein",     "Ketones"   ],   "Lipid Profile": [     "Total Cholesterol",     "Triglycerides",     "HDL Cholesterol",     "VLDL Cholesterol",     "LDL Cholesterol (Calculated)",     "HDL/LDL Ratio",     "HDL/Total Cholesterol Ratio"   ],   "Urine ACR": [     "Microalbumin, Urine",     "Creatinine, Urine",     "Albumin Creatinine Ratio"   ],   "Thyroid Profile Test": ["TSH", "T3", "T4"],   "CBC": [     "Haemoglobin (Hb)",     "Total WBC Count / TLC",     "RBC Count",     "PCV / Hematocrit",     "MCV",     "MCH",     "MCHC",     "RDW (Red Cell Distribution Width)",     "DLC (Differential Leucocyte Count)",     "Platelet Count",     "MPV (Mean Platelet Volume)",     "Absolute Neutrophil Count (ANC)",     "Absolute Eosinophil Count (AEC)",     "Absolute Lymphocyte Count",     "Absolute Monocyte Count",     "Absolute Basophil Count",     "Meta Myelocytes",     "Myelocytes",     "Blasts / Atypical Cells",     "Atypical Lymphocytes",     "Neutrophils",     "Lymphocytes",     "Monocytes",     "Basophils",     "Eosinophils",     "Band Forms",     "Pro Myelocytes",     "Pro Lymphocytes",     "Plasma Cells",     "Nucleated RBC Count"   ] }	1 complete blood panel and urine test + 1 FBS, HbA1c, 2hr PP	2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
368	2	Doctor Consultation	1	3			2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
369	2	Dietician Consultation	1	3			2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
370	2	Ophthalmologist Consultation	1	6			2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
371	2	Medicines	\N	\N		Upto 25% off	2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
372	2	BP,  Body  Composition  Analysis  test	1	3			2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
373	2	Biosthesiometer Test (Nerve Sensitivity Test)	1	3			2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
437	5	Lab Tests	1	3	{   "FBS": ["Fasting Plasma Glucose"],   "HbA1C": ["HbA1C (Glycosylated Hemoglobin)"],   "2 hour PP": ["Glucose Post Prandial"],   "LFT (Liver function test)": [     "Serum Bilirubin (Indirect)",     "SGOT / AST",     "SGPT / ALT",     "Total Protein",     "Albumin",     "Albumin Globulin A/G Ratio",     "Alkaline Phosphatase",     "AST / ALT Ratio",     "Bilirubin Direct",     "Bilirubin Total",     "Globulin"   ],   "KFT (Kidney function test)": [     "Urea",     "Blood Urea",     "Blood Urea Nitrogen (BUN)",     "Creatinine",     "BUN Creatinine Ratio",     "Uric Acid",     "Electrolytes (Na/K/Cl)",     "Sodium",     "Potassium",     "Chloride",     "pH",     "Specific Gravity",     "Remarks",     "Urobilinogen",     "Nitrite",     "Pus Cells, Urine",     "RBC, Urine",     "Epithelial Cells, Urine",     "Colour",     "Odour",     "Appearance",     "Casts",     "Crystals",     "Bacteria",     "Blood",     "Glucose",     "Protein",     "Ketones"   ],   "Lipid Profile": [     "Total Cholesterol",     "Triglycerides",     "HDL Cholesterol",     "VLDL Cholesterol",     "LDL Cholesterol (Calculated)",     "HDL/LDL Ratio",     "HDL/Total Cholesterol Ratio"   ],   "Urine ACR": [     "Microalbumin, Urine",     "Creatinine, Urine",     "Albumin Creatinine Ratio"   ],   "Thyroid Profile Test": ["TSH", "T3", "T4"],   "CBC": [     "Haemoglobin (Hb)",     "Total WBC Count / TLC",     "RBC Count",     "PCV / Hematocrit",     "MCV",     "MCH",     "MCHC",     "RDW (Red Cell Distribution Width)",     "DLC (Differential Leucocyte Count)",     "Platelet Count",     "MPV (Mean Platelet Volume)",     "Absolute Neutrophil Count (ANC)",     "Absolute Eosinophil Count (AEC)",     "Absolute Lymphocyte Count",     "Absolute Monocyte Count",     "Absolute Basophil Count",     "Meta Myelocytes",     "Myelocytes",     "Blasts / Atypical Cells",     "Atypical Lymphocytes",     "Neutrophils",     "Lymphocytes",     "Monocytes",     "Basophils",     "Eosinophils",     "Band Forms",     "Pro Myelocytes",     "Pro Lymphocytes",     "Plasma Cells",     "Nucleated RBC Count"   ] }	1 complete blood andurine test + 1 FBS, HbA1C, 2hr PP every 3 months	2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
438	5	Doctor Consultation	1	3			2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
439	5	Dietician Consultation	1	3			2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
440	5	Ophthalmologist Consultation	1	12			2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
441	5	Medicines	\N	\N		Upto 25%	2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
442	5	Biosthesiometer Test (Nerve Sensitivity Test)	1	3			2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
443	5	BP,  Body  Composition   Analysis  test	1	3			2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
458	6	Ophthalmologist Consultation	1	12			2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
459	6	Doctor Consultation	1	3			2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
460	6	Dietician Consultation	1	3			2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
409	4	Doctor Consultation	1	3			2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
410	4	Dietician Consultation	\N	\N			2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
411	4	Lab Tests	1	3	{"Basic":["Fasting Plasma Glucose" ,"HbA1C", "Glucose Post Prandial "]}	1 complete blood test + urine	2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
412	4	Ophthalmologist Consultation	\N	\N			2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
413	4	Medicines	\N	\N		Upto 15% off	2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
414	4	BP,  Body  Composition   Analysis  test	1	3			2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
415	4	Biosthesiometer Test (Nerve Sensitivity Test)	1	3			2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
416	1	Doctor Consultation	1	3		-------	2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
417	1	Dietician Consultation	\N	\N			2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
418	1	Lab Tests	1	3	{"Basic":["Fasting Plasma Glucose" ,"HbA1C", "Glucose Post Prandial "]}		2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
419	1	Ophthalmologist Consultation	\N	0			2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
420	1	Medicines	\N	\N		Upto 15% off	2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
421	1	BP,  Body  Composition  Analysis  test	1	3			2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
422	1	Biosthesiometer Test (Nerve Sensitivity Test)	1	3			2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
283	3	Lab Tests	1	3	  {   "FBS": ["Fasting Plasma Glucose"],   "HbA1C": ["HbA1C (Glycosylated Hemoglobin)"],   "2 hour PP": ["Glucose Post Prandial"],   "LFT (Liver function test)": [     "Serum Bilirubin (Indirect)",     "SGOT / AST",     "SGPT / ALT",     "Total Protein",     "Albumin",     "Albumin Globulin A/G Ratio",     "Alkaline Phosphatase",     "AST / ALT Ratio",     "Bilirubin Direct",     "Bilirubin Total",     "Globulin"   ],   "KFT (Kidney function test)": [     "Urea",     "Blood Urea",     "Blood Urea Nitrogen (BUN)",     "Creatinine",     "BUN Creatinine Ratio",     "Uric Acid",     "Electrolytes (Na/K/Cl)",     "Sodium",     "Potassium",     "Chloride",     "Total Protein",     "Albumin",     "Globulin",     "Albumin Globulin A/G Ratio",     "pH Level",     "Specific Gravity",     "Remarks",     "Bilirubin",     "Urobilinogen",     "Nitrite",     "Pus Cells, Urine",     "RBC, Urine",     "Epithelial Cells, Urine",     "Colour, Urine",     "Appearance",     "Casts",     "Crystals",     "Bacteria",     "Blood",     "Glucose",     "Protein",     "Ketones"   ],   "Lipid Profile": [     "Total Cholesterol",     "Triglycerides",     "HDL Cholesterol",     "VLDL Cholesterol",     "LDL Cholesterol (Calculated)",     "HDL/LDL Ratio",     "HDL/Total Cholesterol Ratio"   ],   "Urine ACR": [     "Microalbumin, Urine",     "Creatinine, Urine",     "Albumin Creatinine Ratio"   ],   "Throid Profile Test": [     "TSH",     "T3",     "T4"   ],   "Urine R/M": [     "Colour",     "Odour",     "pH",     "Specific gravity"   ],   "CBC": [     "Haemoglobin (Hb)",     "Total WBC Count / TLC",     "RBC Count",     "PCV / Hematocrit",     "MCV",     "MCH",     "MCHC",     "RDW (Red Cell Distribution Width)",     "DLC (Differential Leucocyte Count)",     "Platelet Count",     "MPV (Mean Platelet Volume)",     "Absolute Neutrophil Count (ANC)",     "Absolute Eosinophil Count (AEC)",     "Absolute Lymphocyte Count",     "Absolute Monocyte Count",     "Absolute Basophil Count",     "Meta Myelocytes",     "Myelocytes",     "Blasts / Atypical Cells",     "Atypical Lymphocytes",     "Neutrophils",     "Lymphocytes",     "Monocytes",     "Basophils",     "Eosinophils",     "Band Forms",     "Pro Myelocytes",     "Pro Lymphocytes",     "Plasma Cells",     "Nucleated RBC Count"   ],   "Vitamin D": ["Vitamin D 25 - Hydroxy"],   "Vitamin B12": ["Vitamin B12"] }	1 complete blood test + urine every 3 months	2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
284	3	Dietician Consultation	1	3			2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
285	3	Ophthalmologist Consultation	1	6			2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
286	3	Doctor Consultation	1	3			2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
287	3	Medicines	\N	\N		upto 35%	2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
288	3	BP,  Body  Composition   Analysis  test	1	3			2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
289	3	Biosthesiometer Test (Nerve Sensitivity Test)	1	3			2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
\.


--
-- Data for Name: SubscriptionTracker; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SubscriptionTracker" ("subscriptionId", "patientId", "planId", "doctorConsultationDates", "dieticianConsultationDates", "labTestsDates", "ophthalmologistConsultationDates", "usedMedicines", "razorpayOrderId", "razorpayPaymentId", "paymentStatus", "startDate", "endDate", "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	6	2	{2025-05-01T15:57:10.632Z,2025-08-01T15:57:10.632Z}	{2025-05-01T15:57:10.632Z,2025-08-01T15:57:10.632Z}	{2025-05-01T15:57:10.632Z,2025-08-01T15:57:10.632Z}	{2025-05-01T15:57:10.633Z}	{}	order_QPinrEqvJM2VPk	pay_QPioURqpDetSOY	PAID	2025-05-01 15:57:10.634	2025-11-01 15:57:10.634	t	2025-05-01 15:57:10.636	2025-05-01 15:57:10.636	\N
2	11	1	{2025-05-05T04:46:06.463Z,2025-08-05T04:46:06.463Z}	{}	{2025-05-05T04:46:06.464Z,2025-08-05T04:46:06.464Z}	{2025-05-05T04:46:06.464Z}	{}	order_QR7WJrwLoiMN43	pay_QR7WSFO2KlgoQ0	PAID	2025-05-05 04:46:06.465	2025-11-05 04:46:06.465	f	2025-05-05 04:46:06.467	2025-05-05 05:14:12.571	\N
3	11	1	{2025-05-05T05:17:10.377Z,2025-08-05T05:17:10.377Z}	{}	{2025-05-05T05:17:10.378Z,2025-08-05T05:17:10.378Z}	{2025-05-05T05:17:10.378Z}	{}	order_QR83I9VaKOwF54	pay_QR83NFHUAHsMhd	PAID	2025-05-05 05:17:10.378	2025-11-05 05:17:10.378	f	2025-05-05 05:17:10.381	2025-05-05 05:29:06.211	\N
4	11	1	{2025-05-05T05:33:02.055Z,""}	{2025-05-08T15:57:10.632Z}	{2025-05-05T05:33:02.056Z,2025-08-05T05:33:02.056Z}	{2025-05-05T05:33:02.056Z}	{}	order_QR8IrHP6cfPGga	pay_QR8IyG3qHvZKEQ	PAID	2025-05-05 05:33:02.058	2025-11-05 05:33:02.058	t	2025-05-05 05:33:02.061	2025-05-16 07:14:53.344	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, "clinicId", "phoneNumber", email, password, name, role, status, "createdAt", "updatedAt", "deletedAt", "userProfilePicture") FROM stdin;
26	1	+917721886665	\N		Nagesh	PATIENT	ACTIVE	2025-05-11 09:52:06.208	2025-05-11 21:31:57.352	\N	\N
31	1	81493062233	s@s.com	123	Saurabh	DOCTOR	DELETED	2025-05-15 18:44:31.086	2025-05-16 05:09:59.064	2025-05-15 20:03:21.9	https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1747334670/aulnyu0qgo1falkkpkxx.jpg
5	1	+911212343458	arun.singh@gmail.com	Test@123	Arun Singh	DOCTOR	ACTIVE	2025-04-30 10:13:38.613	2025-04-30 11:53:47.546	\N	https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1746005030/drarun_cdayrd.png
4	1	+911212343457	setu.gupta@gmail.com	Test@123	Setu Gupta	DOCTOR	ACTIVE	2025-04-30 10:13:07.207	2025-04-30 11:54:02.606	\N	https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1746005030/drsetu_hfc9ya.png
3	1	+911212343456	nikhil.gupta@gmail.com	Test@123	Nikhil Gupta	DOCTOR	ACTIVE	2025-04-30 10:12:26.11	2025-04-30 11:54:16.373	\N	https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1746005032/drnikhil_o81uyg.png
7	1	+919421300873	\N	\N	Sudhir Kulkarni 	PATIENT	ACTIVE	2025-04-30 12:30:46.858	2025-04-30 12:30:46.858	\N	\N
10	1	+919763139329	\N	\N	Atharv Joshi	PATIENT	ACTIVE	2025-05-01 05:27:16.564	2025-05-01 05:27:16.564	\N	\N
11	1	+919322393149	\N	\N	Ganesh	PATIENT	ACTIVE	2025-05-01 09:58:16.13	2025-05-01 09:58:16.13	\N	\N
13	1	+919028137344	\N	\N	Hemanshu	PATIENT	ACTIVE	2025-05-02 07:47:31.726	2025-05-02 07:47:31.726	\N	\N
14	1	+919503773091	\N	\N	Hemanshu Rathod	PATIENT	ACTIVE	2025-05-02 07:50:42.959	2025-05-02 07:50:42.959	\N	\N
17	1	+919921651111	\N	\N	Pushpaben joshi	PATIENT	ACTIVE	2025-05-02 19:20:18.121	2025-05-02 19:20:18.121	\N	\N
18	1	+919699787615	\N	\N	Anjali Kulkarni	PATIENT	ACTIVE	2025-05-05 04:44:12.105	2025-05-05 04:44:12.105	\N	\N
22	1	8226762281	abh@gmail.com	12345	Dr Kishore Kharche	DOCTOR	ACTIVE	2025-05-10 14:03:13.16	2025-05-12 05:26:43.592	\N	\N
29	1	+919322251891	\N	\N	Ved Pingle 	PATIENT	ACTIVE	2025-05-13 16:12:46.878	2025-05-13 16:12:46.878	\N	\N
20	1	+918483834033	\N	\N	Suvarna	PATIENT	ACTIVE	2025-05-09 05:58:12.029	2025-05-09 05:58:12.029	\N	\N
21	1	+919860435240	\N	\N	Ramesh wagh 	PATIENT	ACTIVE	2025-05-09 12:56:41.192	2025-05-09 12:56:41.192	\N	\N
23	1	9100277812			Dr. Bukan	DOCTOR	ACTIVE	2025-05-10 16:30:57.444	2025-05-10 16:30:57.444	\N	\N
30	1	+919022499484	\N	\N	Krish	PATIENT	ACTIVE	2025-05-15 04:48:53.222	2025-05-15 04:48:53.222	\N	\N
6	1	+911212343459	suvarna@gmail.com	Test@123	Suvarna Domde	DOCTOR	ACTIVE	2025-04-30 10:26:25.446	2025-05-11 18:44:41.854	\N	https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1746011772/awrv8fhemdpjxh3rq7cp.png
16	1	+917875322847	\N	\N	Ram	PATIENT	ACTIVE	2025-05-02 13:01:43.21	2025-05-15 18:01:14.953	\N	\N
2	1	+918149306224	saurabhk201@gmail.com	\N	Saurabh Kulkarni	PATIENT	ACTIVE	2025-04-30 09:45:40.047	2025-05-15 18:38:46.132	2025-05-15 18:38:46.129	\N
19	1	7875322847	aurangeabhinav777@gmail.com		Dr Abhinav	DOCTOR	ACTIVE	2025-05-06 09:32:49.33	2025-05-15 20:03:49.514	\N	https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1747027149/xbyiypo0izjnsjb2cp0b.jpg
9	1	+918208531234	\N		Dr.Abhinav Aurange	DOCTOR	DELETED	2025-04-30 19:12:05.199	2025-05-15 20:13:15.214	2025-05-15 20:08:29.386	\N
12	1	+918208534977	ram@gmail.com	\N	Ram Aurange	PATIENT	ACTIVE	2025-05-01 15:52:49.433	2025-05-15 20:13:38.288	\N	\N
33	1	1231235119	sa@sa.com	111	Sample Dr	NOT_SET	ACTIVE	2025-05-16 05:14:35.418	2025-05-16 06:26:18.014	\N	\N
\.


--
-- Name: Appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Appointment_id_seq"', 3, true);


--
-- Name: ClinicSpecialization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ClinicSpecialization_id_seq"', 1, false);


--
-- Name: Clinic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Clinic_id_seq"', 1, true);


--
-- Name: Complaint_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Complaint_id_seq"', 1, false);


--
-- Name: DieticianAvailability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."DieticianAvailability_id_seq"', 1, false);


--
-- Name: DieticianProfile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."DieticianProfile_id_seq"', 1, true);


--
-- Name: DoctorAvailability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."DoctorAvailability_id_seq"', 21, true);


--
-- Name: DoctorProfile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."DoctorProfile_id_seq"', 11, true);


--
-- Name: HealthMetric_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."HealthMetric_id_seq"', 8, true);


--
-- Name: LabBooking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."LabBooking_id_seq"', 4, true);


--
-- Name: LabPackage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."LabPackage_id_seq"', 4, true);


--
-- Name: LabTechProfile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."LabTechProfile_id_seq"', 1, false);


--
-- Name: Medicine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Medicine_id_seq"', 1, false);


--
-- Name: PatientProfile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PatientProfile_id_seq"', 16, true);


--
-- Name: Payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Payment_id_seq"', 5, true);


--
-- Name: PlanFeature_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PlanFeature_id_seq"', 464, true);


--
-- Name: Plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Plan_id_seq"', 6, true);


--
-- Name: SubscriptionTracker_subscriptionId_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."SubscriptionTracker_subscriptionId_seq"', 4, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."User_id_seq"', 33, true);


--
-- Name: Appointment Appointment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY (id);


--
-- Name: ClinicSpecialization ClinicSpecialization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClinicSpecialization"
    ADD CONSTRAINT "ClinicSpecialization_pkey" PRIMARY KEY (id);


--
-- Name: Clinic Clinic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Clinic"
    ADD CONSTRAINT "Clinic_pkey" PRIMARY KEY (id);


--
-- Name: Complaint Complaint_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Complaint"
    ADD CONSTRAINT "Complaint_pkey" PRIMARY KEY (id);


--
-- Name: DieticianAvailability DieticianAvailability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DieticianAvailability"
    ADD CONSTRAINT "DieticianAvailability_pkey" PRIMARY KEY (id);


--
-- Name: DieticianProfile DieticianProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DieticianProfile"
    ADD CONSTRAINT "DieticianProfile_pkey" PRIMARY KEY (id);


--
-- Name: DoctorAvailability DoctorAvailability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorAvailability"
    ADD CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY (id);


--
-- Name: DoctorProfile DoctorProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorProfile"
    ADD CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY (id);


--
-- Name: HealthMetric HealthMetric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HealthMetric"
    ADD CONSTRAINT "HealthMetric_pkey" PRIMARY KEY (id);


--
-- Name: LabBooking LabBooking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabBooking"
    ADD CONSTRAINT "LabBooking_pkey" PRIMARY KEY (id);


--
-- Name: LabPackage LabPackage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabPackage"
    ADD CONSTRAINT "LabPackage_pkey" PRIMARY KEY (id);


--
-- Name: LabTechProfile LabTechProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabTechProfile"
    ADD CONSTRAINT "LabTechProfile_pkey" PRIMARY KEY (id);


--
-- Name: Medicine Medicine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Medicine"
    ADD CONSTRAINT "Medicine_pkey" PRIMARY KEY (id);


--
-- Name: PatientProfile PatientProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PatientProfile"
    ADD CONSTRAINT "PatientProfile_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PlanFeature PlanFeature_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlanFeature"
    ADD CONSTRAINT "PlanFeature_pkey" PRIMARY KEY (id);


--
-- Name: Plan Plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Plan"
    ADD CONSTRAINT "Plan_pkey" PRIMARY KEY (id);


--
-- Name: SubscriptionTracker SubscriptionTracker_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubscriptionTracker"
    ADD CONSTRAINT "SubscriptionTracker_pkey" PRIMARY KEY ("subscriptionId");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Appointment_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_deletedAt_idx" ON public."Appointment" USING btree ("deletedAt");


--
-- Name: ClinicSpecialization_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ClinicSpecialization_deletedAt_idx" ON public."ClinicSpecialization" USING btree ("deletedAt");


--
-- Name: Clinic_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Clinic_deletedAt_idx" ON public."Clinic" USING btree ("deletedAt");


--
-- Name: Clinic_domain_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Clinic_domain_key" ON public."Clinic" USING btree (domain);


--
-- Name: Clinic_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Clinic_name_key" ON public."Clinic" USING btree (name);


--
-- Name: Clinic_subdomain_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Clinic_subdomain_key" ON public."Clinic" USING btree (subdomain);


--
-- Name: Complaint_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Complaint_deletedAt_idx" ON public."Complaint" USING btree ("deletedAt");


--
-- Name: Complaint_text_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Complaint_text_key" ON public."Complaint" USING btree (text);


--
-- Name: DieticianAvailability_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DieticianAvailability_deletedAt_idx" ON public."DieticianAvailability" USING btree ("deletedAt");


--
-- Name: DieticianProfile_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DieticianProfile_deletedAt_idx" ON public."DieticianProfile" USING btree ("deletedAt");


--
-- Name: DieticianProfile_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DieticianProfile_userId_key" ON public."DieticianProfile" USING btree ("userId");


--
-- Name: DoctorAvailability_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DoctorAvailability_deletedAt_idx" ON public."DoctorAvailability" USING btree ("deletedAt");


--
-- Name: DoctorProfile_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DoctorProfile_deletedAt_idx" ON public."DoctorProfile" USING btree ("deletedAt");


--
-- Name: DoctorProfile_licenseNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DoctorProfile_licenseNumber_key" ON public."DoctorProfile" USING btree ("licenseNumber");


--
-- Name: DoctorProfile_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON public."DoctorProfile" USING btree ("userId");


--
-- Name: HealthMetric_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "HealthMetric_deletedAt_idx" ON public."HealthMetric" USING btree ("deletedAt");


--
-- Name: HealthMetric_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "HealthMetric_userId_idx" ON public."HealthMetric" USING btree ("userId");


--
-- Name: LabBooking_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LabBooking_deletedAt_idx" ON public."LabBooking" USING btree ("deletedAt");


--
-- Name: LabPackage_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LabPackage_deletedAt_idx" ON public."LabPackage" USING btree ("deletedAt");


--
-- Name: LabPackage_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LabPackage_name_key" ON public."LabPackage" USING btree (name);


--
-- Name: LabTechProfile_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LabTechProfile_deletedAt_idx" ON public."LabTechProfile" USING btree ("deletedAt");


--
-- Name: LabTechProfile_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LabTechProfile_userId_key" ON public."LabTechProfile" USING btree ("userId");


--
-- Name: Medicine_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Medicine_deletedAt_idx" ON public."Medicine" USING btree ("deletedAt");


--
-- Name: Medicine_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Medicine_name_key" ON public."Medicine" USING btree (name);


--
-- Name: PatientProfile_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PatientProfile_deletedAt_idx" ON public."PatientProfile" USING btree ("deletedAt");


--
-- Name: PatientProfile_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PatientProfile_userId_key" ON public."PatientProfile" USING btree ("userId");


--
-- Name: Payment_appointmentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payment_appointmentId_key" ON public."Payment" USING btree ("appointmentId");


--
-- Name: Payment_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Payment_deletedAt_idx" ON public."Payment" USING btree ("deletedAt");


--
-- Name: Payment_labBookingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payment_labBookingId_key" ON public."Payment" USING btree ("labBookingId");


--
-- Name: Payment_subscriptionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payment_subscriptionId_key" ON public."Payment" USING btree ("subscriptionId");


--
-- Name: PlanFeature_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlanFeature_deletedAt_idx" ON public."PlanFeature" USING btree ("deletedAt");


--
-- Name: Plan_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Plan_deletedAt_idx" ON public."Plan" USING btree ("deletedAt");


--
-- Name: SubscriptionTracker_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SubscriptionTracker_deletedAt_idx" ON public."SubscriptionTracker" USING btree ("deletedAt");


--
-- Name: User_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_deletedAt_idx" ON public."User" USING btree ("deletedAt");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_phoneNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_phoneNumber_key" ON public."User" USING btree ("phoneNumber");


--
-- Name: Appointment Appointment_doctorAvailabilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_doctorAvailabilityId_fkey" FOREIGN KEY ("doctorAvailabilityId") REFERENCES public."DoctorAvailability"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public."SubscriptionTracker"("subscriptionId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClinicSpecialization ClinicSpecialization_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClinicSpecialization"
    ADD CONSTRAINT "ClinicSpecialization_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DieticianAvailability DieticianAvailability_dieticianId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DieticianAvailability"
    ADD CONSTRAINT "DieticianAvailability_dieticianId_fkey" FOREIGN KEY ("dieticianId") REFERENCES public."DieticianProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DieticianProfile DieticianProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DieticianProfile"
    ADD CONSTRAINT "DieticianProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DoctorAvailability DoctorAvailability_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorAvailability"
    ADD CONSTRAINT "DoctorAvailability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."DoctorProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DoctorProfile DoctorProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorProfile"
    ADD CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HealthMetric HealthMetric_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HealthMetric"
    ADD CONSTRAINT "HealthMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LabBooking LabBooking_labPackageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabBooking"
    ADD CONSTRAINT "LabBooking_labPackageId_fkey" FOREIGN KEY ("labPackageId") REFERENCES public."LabPackage"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LabBooking LabBooking_labTechId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabBooking"
    ADD CONSTRAINT "LabBooking_labTechId_fkey" FOREIGN KEY ("labTechId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LabBooking LabBooking_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabBooking"
    ADD CONSTRAINT "LabBooking_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LabTechProfile LabTechProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabTechProfile"
    ADD CONSTRAINT "LabTechProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PatientProfile PatientProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PatientProfile"
    ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_labBookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_labBookingId_fkey" FOREIGN KEY ("labBookingId") REFERENCES public."LabBooking"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public."SubscriptionTracker"("subscriptionId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PlanFeature PlanFeature_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlanFeature"
    ADD CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubscriptionTracker SubscriptionTracker_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubscriptionTracker"
    ADD CONSTRAINT "SubscriptionTracker_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubscriptionTracker SubscriptionTracker_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubscriptionTracker"
    ADD CONSTRAINT "SubscriptionTracker_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

