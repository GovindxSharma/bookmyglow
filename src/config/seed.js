import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Service from "../models/Service.js";
import Customer from "../models/Customer.js";
import Appointment from "../models/Appointment.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";

export const seedDatabase = async () => {
  try {
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Service.deleteMany({}),
      Customer.deleteMany({}),
      Appointment.deleteMany({}),
      Payment.deleteMany({}),
      Attendance.deleteMany({}),
    ]);

    console.log("🌱 Seeding Aura Salon & Day Spa Data...");

    // 1. Create Default Users
    const adminPassword = await bcrypt.hash("admin123", 10);
    const recepPassword = await bcrypt.hash("recep123", 10);

    await User.create({
      name: "Salon Owner (Admin)",
      email: "admin@bookmyglow.com",
      password: adminPassword,
      role: "admin",
      phone: ["9876543210"],
      gender: "female",
      status: true,
      address: "Suite 101, Central Boulevard, Metro City",
    });

    await User.create({
      name: "Front Desk Receptionist",
      email: "reception@bookmyglow.com",
      password: recepPassword,
      role: "receptionist",
      phone: ["9876501234"],
      gender: "female",
      status: true,
      address: "Luxury Promenade, Metro City",
    });

    // 2. Create Stylists & Therapists
    const employees = await Employee.create([
      {
        name: "Rahul Sharma (Senior Hair Stylist)",
        phone: "9876543211",
        gender: "male",
        address: "Green Park Avenue, Metro City",
        status: true,
      },
      {
        name: "Pooja Patel (Skin & Facial Specialist)",
        phone: "9876543212",
        gender: "female",
        address: "Lotus Residency, Metro City",
        status: true,
      },
      {
        name: "Komal Jadeja (Bridal Makeup Artist)",
        phone: "9876543213",
        gender: "female",
        address: "Orchid Enclave, Metro City",
        status: true,
      },
      {
        name: "Amit Varma (Men's Grooming Expert)",
        phone: "9876543214",
        gender: "male",
        address: "Sunset Boulevard, Metro City",
        status: true,
      },
      {
        name: "Sneha Nair (Spa & Massage Therapist)",
        phone: "9876543215",
        gender: "female",
        address: "Palm Grove Avenue, Metro City",
        status: true,
      },
    ]);

    // 3. Create Clear, Meaningful Salon Services
    const services = await Service.create([
      {
        name: "Hair Styling & Care",
        description: "Professional haircuts, dimensional hair coloring, smoothening, and deep nourishing hair spa.",
        duration: "60 min",
        status: true,
        sub_services: [
          { name: "Haircut & Blowdry Styling", price: 450 },
          { name: "Global Hair Color & Highlights", price: 2500 },
          { name: "Keratin Protein Smoothing Treatment", price: 3500 },
          { name: "L'Oréal Deep Conditioning Hair Spa", price: 950 },
        ],
      },
      {
        name: "Skin Care & Facials",
        description: "Deep pore cleansing, instant glow facials, anti-tan therapy, and gentle organic cleanups.",
        duration: "45 min",
        status: true,
        sub_services: [
          { name: "Deep Cleansing Hydra Glow Facial", price: 1800 },
          { name: "Brightening Diamond Radiance Facial", price: 1400 },
          { name: "O3+ Anti-Tan & Skin Clarifying Cleanup", price: 850 },
          { name: "Herbal Fruit Express Cleanup", price: 550 },
        ],
      },
      {
        name: "Bridal & Occasion Makeup",
        description: "Complete bridal packages, engagement makeup, party glitz, and saree/dupatta draping.",
        duration: "90 min",
        status: true,
        sub_services: [
          { name: "Complete HD Bridal Makeup Package", price: 8500 },
          { name: "Engagement & Sangeet Party Makeup", price: 3200 },
          { name: "Occasion Glam Makeup & Hairstyling", price: 2200 },
          { name: "Professional Saree Draping & Styling", price: 400 },
        ],
      },
      {
        name: "Hands, Feet & Nails",
        description: "Relaxing foot soak, cuticle care, hand polishing, and durable gel nail enhancements.",
        duration: "45 min",
        status: true,
        sub_services: [
          { name: "Deluxe Rose Petal Spa Pedicure", price: 650 },
          { name: "Nourishing Manicure with Hand Massage", price: 450 },
          { name: "Gel Polish Application & Nail Art", price: 750 },
        ],
      },
      {
        name: "Men's Grooming & Barber",
        description: "Sharp haircuts, beard shaping, hot towel shave, and refreshing scalp detox.",
        duration: "30 min",
        status: true,
        sub_services: [
          { name: "Men's Haircut & Head Wash", price: 250 },
          { name: "Beard Trimming & Razor Lineup", price: 150 },
          { name: "Hot Towel Shave & Face Massage", price: 250 },
          { name: "Men's Charcoal Detox Cleanup", price: 600 },
        ],
      },
      {
        name: "Body Spa & Massage",
        description: "Full body relaxation therapy, soothing essential oils, and dead-skin body polish.",
        duration: "60 min",
        status: true,
        sub_services: [
          { name: "Aromatherapy Full Body Relaxation Massage", price: 2200 },
          { name: "Swedish Deep Tissue Stress Relief", price: 2500 },
          { name: "Exfoliating Coffee & Sugar Body Scrub", price: 1600 },
        ],
      },
    ]);

    // 4. Create Customers
    const customers = await Customer.create([
      {
        name: "Priyanka Sharma",
        phone: "9876500001",
        email: "priyanka.s@gmail.com",
        gender: "female",
        address: "Rosewood Heights, Metro City",
        source: "walk-in",
      },
      {
        name: "Vikram Mehta",
        phone: "9876500002",
        email: "vikram.m@yahoo.com",
        gender: "male",
        address: "Ocean View Avenue, Metro City",
        source: "online",
      },
      {
        name: "Anjali Dave",
        phone: "9876500003",
        email: "anjali.dave@gmail.com",
        gender: "female",
        address: "Magnolia Gardens, Metro City",
        source: "walk-in",
      },
      {
        name: "Deepak Patel",
        phone: "9876500004",
        email: "deepak.patel@gmail.com",
        gender: "male",
        address: "Emerald Towers, Metro City",
        source: "walk-in",
      },
      {
        name: "Neha Joshi",
        phone: "9876500005",
        email: "neha.joshi@gmail.com",
        gender: "female",
        address: "Silver Oak Boulevard, Metro City",
        source: "online",
      },
    ]);

    // 5. Create Today's Bookings & Payments
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const sampleAppointments = [
      {
        customer: customers[0],
        employee: employees[0],
        service: services[0],
        subService: services[0].sub_services[1],
        time: "10:30 AM",
        paymentMode: "upi",
        paymentStatus: "completed",
        serviceStatus: "completed",
        confirmed: true,
      },
      {
        customer: customers[1],
        employee: employees[3],
        service: services[4],
        subService: services[4].sub_services[0],
        time: "12:00 PM",
        paymentMode: "cash",
        paymentStatus: "completed",
        serviceStatus: "in_progress",
        confirmed: true,
      },
      {
        customer: customers[2],
        employee: employees[1],
        service: services[1],
        subService: services[1].sub_services[0],
        time: "02:30 PM",
        paymentMode: "card",
        paymentStatus: "completed",
        serviceStatus: "in_queue",
        confirmed: true,
      },
      {
        customer: customers[3],
        employee: employees[0],
        service: services[0],
        subService: services[0].sub_services[3],
        time: "04:00 PM",
        paymentMode: "upi",
        paymentStatus: "completed",
        serviceStatus: "completed",
        confirmed: true,
      },
      {
        customer: customers[4],
        employee: null,
        service: services[1],
        subService: services[1].sub_services[1],
        time: "05:30 PM",
        paymentMode: "",
        paymentStatus: "pending",
        serviceStatus: "in_queue",
        confirmed: false, // Inbound website request
      },
    ];

    for (const item of sampleAppointments) {
      const appt = await Appointment.create({
        customer_id: item.customer._id,
        services: [
          {
            service_id: item.service._id,
            sub_service_id: item.subService._id,
            employee_id: item.employee ? item.employee._id : null,
            price: item.subService.price,
            duration: item.service.duration,
          },
        ],
        date: today,
        appointment_time: item.time,
        amount: item.subService.price,
        service_status: item.serviceStatus,
        payment_mode: item.paymentMode,
        payment_status: item.paymentStatus,
        source: item.confirmed ? "walk-in" : "online",
        confirmation_status: item.confirmed,
        note: item.confirmed ? "Preferred mild fragrance shampoo" : "Requested evening appointment via website",
      });

      if (item.paymentStatus === "completed" && item.paymentMode) {
        await Payment.create({
          appointment_id: appt._id,
          customer_id: item.customer._id,
          amount: item.subService.price,
          payment_mode: item.paymentMode,
          status: "completed",
          date: today,
        });
      }
    }

    // 6. Generate Past Months Revenue History
    const now = new Date();
    const monthlyRevHistory = [42000, 48500, 56000, 62000, 71000, 78000];

    for (let m = 0; m < 6; m++) {
      const pastDate = new Date(now.getFullYear(), now.getMonth() - m, 15);
      const rev = monthlyRevHistory[m] || 50000;

      for (let k = 0; k < 4; k++) {
        const amt = Math.round(rev / 4);
        const dummyAppt = await Appointment.create({
          customer_id: customers[k % customers.length]._id,
          services: [
            {
              service_id: services[0]._id,
              sub_service_id: services[0].sub_services[0]._id,
              employee_id: employees[k % employees.length]._id,
              price: amt,
              duration: "45 min",
            },
          ],
          date: pastDate,
          appointment_time: "02:00 PM",
          amount: amt,
          payment_mode: k % 2 === 0 ? "card" : "upi",
          payment_status: "completed",
          source: "walk-in",
          confirmation_status: true,
        });

        await Payment.create({
          appointment_id: dummyAppt._id,
          customer_id: customers[k % customers.length]._id,
          amount: amt,
          payment_mode: k % 2 === 0 ? "card" : "upi",
          status: "completed",
          date: pastDate,
        });
      }
    }

    // 7. Seed Staff Attendance
    for (const emp of employees) {
      await Attendance.create({
        employee_id: emp._id,
        date: todayStr,
        leave: false,
      });
    }

    console.log("✨ Aura Salon & Day Spa dataset initialized!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
};
