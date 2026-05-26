import "dotenv/config";

async function seed() {
  const { db, schema } = await import("./index");
  const bcrypt = await import("bcryptjs");
  const { eq } = await import("drizzle-orm");

  console.log("Seeding database...");

  const adminPass = await bcrypt.hash("admin123", 12);
  const vendorPass = await bcrypt.hash("password123", 12);

  const [adminUser] = await db
    .insert(schema.users)
    .values({
      name: "Admin",
      email: "admin@eventvenue.asia",
      passwordHash: adminPass,
      role: "admin",
      isVerified: true,
      isMock: true,
    })
    .returning();
  console.log("Admin user:", adminUser.id);

  const vendorEmails = [
    "aisha@majestic-kl.com",
    "farid@skyline-lounge.com",
    "info@hassancatering.my",
    "lisa@lisaphoto.com",
    "rizal@djrizal.com",
    "lim@grandballroom.com",
    "david@glasshouse.com",
    "siti@heritagehall.com",
    "limwei@bayview.com",
    "rachel@luminousloft.com",
  ];

  const vendorUsers: Array<{ id: string; name: string }> = [];
  const vendorProfiles: Array<{ id: string; vendorType: "venue_owner" | "service_provider"; businessName: string }> = [];

  for (let i = 0; i < vendorEmails.length; i++) {
    const [vu] = await db
      .insert(schema.users)
      .values({
        name: `Vendor ${i + 1}`,
        email: vendorEmails[i],
        passwordHash: vendorPass,
        role: "vendor",
        isVerified: i < 5,
        isMock: true,
      })
      .returning();
    vendorUsers.push(vu);
  }

  const [vp1] = await db.insert(schema.vendorProfiles).values({
    userId: vendorUsers[0].id, vendorType: "venue_owner", businessName: "The Majestic KL",
    businessLocation: "Kuala Lumpur", verificationStatus: "approved", verificationBadge: "verified",
    isMock: true,
  }).returning();
  vendorProfiles.push(vp1);

  const [vp2] = await db.insert(schema.vendorProfiles).values({
    userId: vendorUsers[1].id, vendorType: "venue_owner", businessName: "Skyline Lounge",
    businessLocation: "Kuala Lumpur", verificationStatus: "approved", verificationBadge: "verified",
    isMock: true,
  }).returning();
  vendorProfiles.push(vp2);

  const [vp3] = await db.insert(schema.vendorProfiles).values({
    userId: vendorUsers[2].id, vendorType: "service_provider", businessName: "Hassan Premium Catering",
    businessLocation: "Kuala Lumpur", serviceCategory: "catering", verificationStatus: "approved", verificationBadge: "verified",
    isMock: true,
  }).returning();
  vendorProfiles.push(vp3);

  const [vp4] = await db.insert(schema.vendorProfiles).values({
    userId: vendorUsers[3].id, vendorType: "service_provider", businessName: "Lisa Creative Photography",
    businessLocation: "Petaling Jaya", serviceCategory: "photography", verificationStatus: "approved", verificationBadge: "verified",
    isMock: true,
  }).returning();
  vendorProfiles.push(vp4);

  const [vp5] = await db.insert(schema.vendorProfiles).values({
    userId: vendorUsers[4].id, vendorType: "service_provider", businessName: "DJ Rizal Entertainment",
    businessLocation: "Kuala Lumpur", serviceCategory: "dj_entertainment", verificationStatus: "pending", verificationBadge: "none",
    isMock: true,
  }).returning();
  vendorProfiles.push(vp5);

  const [vp6] = await db.insert(schema.vendorProfiles).values({
    userId: vendorUsers[5].id, vendorType: "venue_owner", businessName: "Grand Ballroom KL",
    businessLocation: "Kuala Lumpur", verificationStatus: "approved", verificationBadge: "verified",
    isMock: true,
  }).returning();
  const [vp7] = await db.insert(schema.vendorProfiles).values({
    userId: vendorUsers[6].id, vendorType: "venue_owner", businessName: "The Glasshouse PJ",
    businessLocation: "Petaling Jaya", verificationStatus: "approved", verificationBadge: "verified",
    isMock: true,
  }).returning();
  const [vp8] = await db.insert(schema.vendorProfiles).values({
    userId: vendorUsers[7].id, vendorType: "venue_owner", businessName: "Heritage Hall JB",
    businessLocation: "Johor Bahru", verificationStatus: "approved", verificationBadge: "verified",
    isMock: true,
  }).returning();
  const [vp9] = await db.insert(schema.vendorProfiles).values({
    userId: vendorUsers[8].id, vendorType: "venue_owner", businessName: "Bayview Terrace",
    businessLocation: "Penang", verificationStatus: "approved", verificationBadge: "verified",
    isMock: true,
  }).returning();
  const [vp10] = await db.insert(schema.vendorProfiles).values({
    userId: vendorUsers[9].id, vendorType: "venue_owner", businessName: "Luminous Loft",
    businessLocation: "Singapore", verificationStatus: "approved", verificationBadge: "verified",
    isMock: true,
  }).returning();

  const amenityNames = [
    "WiFi", "AV System", "Catering", "Free Parking", "Stage",
    "Dressing Room", "Bar Service", "Valet Parking", "Garden", "Outdoor Lighting",
    "Helipad Access", "Air Conditioning", "Swimming Pool", "Prayer Room",
    "Bridal Suite", "Kitchen Access", "Sound System", "Projector / Screen",
    "Wheelchair Access", "Elevator", "Security", "Cleaning Service",
    "Tables & Chairs", "Dance Floor", "Karaoke System", "Photo Booth",
    "Kids Play Area", "Smoking Area", "Green Room", "Loading Bay",
  ];
  const amenities = await db.insert(schema.amenities).values(amenityNames.map((n) => ({ name: n }))).returning();

  const eventTypeNames = [
    "Wedding", "Corporate", "Private Party", "Birthday", "Launch", "Seminar",
    "Conference", "Exhibition", "Workshop", "Networking", "Gala Dinner",
    "Concert", "Team Building", "Religious Ceremony", "Graduation",
  ];
  const eventTypes = await db.insert(schema.eventTypes).values(eventTypeNames.map((n) => ({ name: n }))).returning();

  const venues = [
    {
      vendorId: vp1.id, listingType: "venue" as const, title: "Grand Ballroom at The Majestic Kuala Lumpur",
      slug: "grand-ballroom-majestic-kl",
      description: "An opulent grand ballroom nestled within the historic Majestic Hotel, Kuala Lumpur.",
      location: "Kuala Lumpur, Malaysia",
      address: "5 Jalan Sultan Hishamuddin, 50000 Kuala Lumpur",
      capacity: 500, pricePerHour: "450", currency: "MYR", halalCertified: true,
      status: "active" as const, isVerified: true, isMock: true,
    },
    {
      vendorId: vp2.id, listingType: "venue" as const, title: "Skyline Rooftop Lounge KL Sentral",
      slug: "skyline-rooftop-lounge-kl-sentral",
      description: "Perched atop the newest tower in KL Sentral, with panoramic skyline views.",
      location: "Kuala Lumpur, Malaysia",
      address: "Level 38, Q Sentral, 2A Jalan Stesen Sentral 2, KL Sentral",
      capacity: 200, pricePerHour: "600", currency: "MYR", halalCertified: true,
      status: "active" as const, isVerified: true, isMock: true,
    },
    {
      vendorId: vp6.id, listingType: "venue" as const, title: "The Glasshouse Petaling Jaya",
      slug: "glasshouse-petaling-jaya",
      description: "A modern, minimalist glasshouse venue surrounded by lush tropical gardens.",
      location: "Petaling Jaya, Selangor",
      address: "12 Jalan SS 21/1A, Damansara Utama, 47400 Petaling Jaya",
      capacity: 150, pricePerHour: "300", currency: "MYR", halalCertified: false,
      status: "active" as const, isVerified: true, isMock: true,
    },
    {
      vendorId: vp7.id, listingType: "venue" as const, title: "The Heritage Hall Johor Bahru",
      slug: "heritage-hall-johor-bahru",
      description: "A beautifully restored colonial-era hall in downtown Johor Bahru.",
      location: "Johor Bahru, Malaysia",
      address: "88 Jalan Wong Ah Fook, Bandar Johor Bahru, 80000 Johor Bahru",
      capacity: 300, pricePerHour: "200", currency: "MYR", halalCertified: true,
      status: "active" as const, isVerified: true, isMock: true,
    },
    {
      vendorId: vp8.id, listingType: "venue" as const, title: "Bayview Terrace Penang",
      slug: "bayview-terrace-penang",
      description: "An elegant open-air terrace perched on Penang Hill with breathtaking views.",
      location: "Penang, Malaysia",
      address: "Penang Hill Summit, 11300 Air Itam, Penang",
      capacity: 180, pricePerHour: "350", currency: "MYR", halalCertified: true,
      status: "active" as const, isVerified: true, isMock: true,
    },
    {
      vendorId: vp9.id, listingType: "venue" as const, title: "Luminous Loft Singapore",
      slug: "luminous-loft-singapore",
      description: "A designer loft space in the heart of Tanjong Pagar, Singapore.",
      location: "Singapore",
      address: "78 Tanjong Pagar Road, #04-01, Singapore 088489",
      capacity: 120, pricePerHour: "800", currency: "SGD", halalCertified: true,
      status: "active" as const, isVerified: true, isMock: true,
    },
    {
      vendorId: vp1.id, listingType: "venue" as const, title: "Chao Phraya Riverside Pavilion Bangkok",
      slug: "chao-phraya-riverside-pavilion",
      description: "A stunning riverside pavilion along the Chao Phraya.",
      location: "Bangkok, Thailand",
      address: "257 Charoen Krung Road, Bang Rak, Bangkok 10500",
      capacity: 250, pricePerHour: "500", currency: "THB", halalCertified: false,
      status: "active" as const, isVerified: true, isMock: true,
    },
    {
      vendorId: vp2.id, listingType: "venue" as const, title: "Sudirman Grand Ballroom Jakarta",
      slug: "sudirman-grand-ballroom-jakarta",
      description: "Jakarta's premier event ballroom in Sudirman CBD.",
      location: "Jakarta, Indonesia",
      address: "Jl. Jenderal Sudirman Kav. 52-53, Senayan, Jakarta 12190",
      capacity: 400, pricePerHour: "550", currency: "IDR", halalCertified: true,
      status: "active" as const, isVerified: true, isMock: true,
    },
  ];

  const listingIds: string[] = [];
  const venueAms = [
    [0,1,2,3,4,5, 11,14,16,17,18,19,20,21,22,23,29],
    [0,1,2,6,8,7, 11,16,17,18,20,22,23,27,28],
    [0,2,3,8,9, 11,12,15,18,22,25,26],
    [0,2,3,4,5, 11,13,16,17,18,19,20,22],
    [0,1,2,3,9,8, 11,12,15,16,20,22,25,27],
    [0,1,2,6,8,4, 11,16,17,18,20,22,23,24,25,28],
    [0,1,2,3,9,8,4, 11,12,15,16,20,22,25,27,29],
    [0,1,2,3,4,5,6, 10,11,13,14,16,17,18,19,20,21,22,23,29],
  ];
  const venueEts = [
    [0,1,6,10],
    [1,2,9,10,11],
    [1,2,3,8],
    [0,1,3,5,13],
    [0,1,2,14],
    [1,4,2,9],
    [0,1,2,12],
    [0,1,5,6,7],
  ];

  for (let i = 0; i < venues.length; i++) {
    const v = venues[i];
    const [listing] = await db.insert(schema.listings).values(v).returning();
    listingIds.push(listing.id);

    await db.insert(schema.listingPhotos).values({
      listingId: listing.id,
      url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
      altText: v.title,
      sortOrder: 0,
      isPrimary: true,
    });

    const amIdx = venueAms[i];
    await db.insert(schema.listingAmenities).values(
      amIdx.map((ai) => ({ listingId: listing.id, amenityId: amenities[ai].id }))
    );

    const etIdx = venueEts[i];
    await db.insert(schema.listingEventTypes).values(
      etIdx.map((ei) => ({ listingId: listing.id, eventTypeId: eventTypes[ei].id }))
    );
  }

  const serviceListings = [
    {
      vendorId: vp3.id, listingType: "service" as const,
      title: "Hassan Premium Catering", slug: "hassan-premium-catering",
      description: "Award-winning halal catering service with 15+ years of experience.",
      location: "Kuala Lumpur, Malaysia", currency: "MYR", halalCertified: true, status: "active" as const, isVerified: true, isMock: true,
    },
    {
      vendorId: vp4.id, listingType: "service" as const,
      title: "Lisa Creative Photography", slug: "lisa-creative-photography",
      description: "Award-winning event and wedding photography studio.",
      location: "Petaling Jaya, Selangor", currency: "MYR", halalCertified: false, status: "active" as const, isVerified: true, isMock: true,
    },
    {
      vendorId: vp5.id, listingType: "service" as const,
      title: "DJ Rizal Entertainment", slug: "dj-rizal-entertainment",
      description: "High-energy DJ and MC service for all events.",
      location: "Kuala Lumpur, Malaysia", currency: "MYR", halalCertified: false, status: "active" as const, isVerified: true, isMock: true,
    },
  ];

  for (const svc of serviceListings) {
    const [sl] = await db.insert(schema.listings).values(svc).returning();
    listingIds.push(sl.id);
  }

  await db.insert(schema.servicePackages).values([
    { listingId: listingIds[8], name: "Silver Package", description: "Buffet for 100 guests", price: "3500", unit: "per_event" },
    { listingId: listingIds[8], name: "Gold Package", description: "Premium buffet for 250 guests", price: "8000", unit: "per_event" },
    { listingId: listingIds[8], name: "Platinum Package", description: "Fine dining for 500 guests", price: "18000", unit: "per_event" },
  ]);

  await db.insert(schema.servicePackages).values([
    { listingId: listingIds[9], name: "Basic Coverage", description: "4-hour, 1 photographer", price: "1500", unit: "per_event" },
    { listingId: listingIds[9], name: "Full Day Coverage", description: "8-hour, 2 photographers", price: "3500", unit: "per_event" },
  ]);

  await db.insert(schema.servicePackages).values([
    { listingId: listingIds[10], name: "Standard DJ", description: "4-hour DJ set", price: "1200", unit: "per_event" },
    { listingId: listingIds[10], name: "Premium DJ + Lighting", description: "6-hour set with lighting", price: "2500", unit: "per_event" },
  ]);

  await db.insert(schema.availabilityBlocks).values([
    { listingId: listingIds[0], date: "2026-06-15", isBlocked: true },
    { listingId: listingIds[0], date: "2026-07-04", isBlocked: true },
    { listingId: listingIds[1], date: "2026-06-12", isBlocked: true },
    { listingId: listingIds[2], date: "2026-06-07", isBlocked: true },
    { listingId: listingIds[3], date: "2026-06-08", isBlocked: true },
    { listingId: listingIds[4], date: "2026-06-14", isBlocked: true },
    { listingId: listingIds[5], date: "2026-06-05", isBlocked: true },
  ]);

  console.log(`Seeded: ${vendorUsers.length} vendors, ${venues.length} venues, ${serviceListings.length} services`);
  console.log("Done!");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
