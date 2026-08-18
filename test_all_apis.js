// bookmyglow/test_all_apis.js
import axios from "axios";

const BASE_URL = "http://localhost:5001";
let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} -> ${details}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n🧪 ========================================================");
  console.log("   AURA SALON & DAY SPA — COMPLETE API TEST SUITE");
  console.log("========================================================\n");

  let adminToken = "";
  let recepToken = "";
  let sampleServiceId = "";
  let sampleSubServiceId = "";
  let sampleEmployeeId = "";
  let sampleAppointmentId = "";
  let sampleAttendanceId = "";

  // 1. HEALTH & SALON INFO
  console.log("▶ 1. Server Health & Salon Info");
  try {
    const health = await axios.get(`${BASE_URL}/health`);
    assert(health.status === 200 && health.data.status === "ok", "GET /health returns 200 OK");
    assert(health.data.salon.name.includes("Aura Salon"), "Health returns Aura Salon brand");

    const info = await axios.get(`${BASE_URL}/salon-info`);
    assert(info.data.success === true, "GET /salon-info returns success");
  } catch (err) {
    assert(false, "Health Check", err.message);
  }

  // 2. AUTHENTICATION
  console.log("\n▶ 2. Authentication & Authorization");
  try {
    // Admin login
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@bookmyglow.com",
      password: "admin123",
    });
    assert(adminLogin.data.token && adminLogin.data.role === "admin", "Admin Login with valid credentials");
    adminToken = adminLogin.data.token;

    // Receptionist login
    const recepLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: "reception@bookmyglow.com",
      password: "recep123",
    });
    assert(recepLogin.data.token && recepLogin.data.role === "receptionist", "Receptionist Login with valid credentials");
    recepToken = recepLogin.data.token;

    // Wrong credentials
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: "admin@bookmyglow.com",
        password: "wrongpassword999",
      });
      assert(false, "Rejects wrong password");
    } catch (err) {
      assert(err.response?.status === 400 || err.response?.status === 401, "Rejects invalid credentials properly");
    }

    // Protected Route
    const profile = await axios.get(`${BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(profile.data.success === true && profile.data.user.role === "admin", "Protected /api/profile with Admin Token");
  } catch (err) {
    assert(false, "Auth Flow", err.message);
  }

  const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
  const recepHeaders = { headers: { Authorization: `Bearer ${recepToken}` } };

  // 3. SERVICES CATALOG
  console.log("\n▶ 3. Services Catalog Management");
  try {
    const servicesRes = await axios.get(`${BASE_URL}/services`);
    assert(Array.isArray(servicesRes.data) && servicesRes.data.length > 0, "GET /services returns service list");

    if (servicesRes.data.length > 0) {
      const first = servicesRes.data[0];
      sampleServiceId = first._id;
      sampleSubServiceId = first.sub_services?.[0]?._id;
      assert(first.name && first.sub_services.length > 0, `Service category contains sub-services (${first.name})`);
    }

    // Create a new test service
    const createServ = await axios.post(
      `${BASE_URL}/services`,
      {
        name: "Test Aromatherapy Express",
        description: "Temporary test category",
        sub_services: [{ name: "Express Back Massage", price: 799 }],
      },
      adminHeaders
    );
    assert(createServ.status === 201 || createServ.status === 200, "POST /services creates new category");
    const testServId = createServ.data._id || createServ.data.service?._id;

    // Update it
    if (testServId) {
      const updateServ = await axios.put(
        `${BASE_URL}/services/${testServId}`,
        {
          name: "Test Aromatherapy Updated",
          description: "Updated test description",
          sub_services: [{ name: "Express Back Massage", price: 899 }],
        },
        adminHeaders
      );
      assert(updateServ.status === 200, "PUT /services/:id updates category");

      // Delete test service
      const delServ = await axios.delete(`${BASE_URL}/services/${testServId}`, adminHeaders);
      assert(delServ.status === 200, "DELETE /services/:id removes category");
    }
  } catch (err) {
    assert(false, "Services Catalog", err.message);
  }

  // 4. EMPLOYEE / STYLIST ROSTER
  console.log("\n▶ 4. Stylist & Employee Management");
  try {
    const empRes = await axios.get(`${BASE_URL}/employee`, adminHeaders);
    const empList = empRes.data.employees || [];
    assert(Array.isArray(empList) && empList.length > 0, `GET /employee returns ${empList.length} stylists`);

    if (empList.length > 0) {
      sampleEmployeeId = empList[0]._id;
    }

    // Create test employee
    const createEmp = await axios.post(
      `${BASE_URL}/employee`,
      {
        name: "Test Stylist Guest",
        phone: "+919999900000",
        gender: "female",
        address: "Test Avenue",
        status: true,
      },
      adminHeaders
    );
    assert(createEmp.status === 200 || createEmp.status === 201, "POST /employee adds new stylist");
    const testEmpId = createEmp.data.employee?._id || createEmp.data._id;

    if (testEmpId) {
      // Toggle status
      const updateEmp = await axios.put(
        `${BASE_URL}/employee/${testEmpId}`,
        { status: false },
        adminHeaders
      );
      assert(updateEmp.status === 200, "PUT /employee/:id updates status");

      // Delete test employee
      const delEmp = await axios.delete(`${BASE_URL}/employee/${testEmpId}`, adminHeaders);
      assert(delEmp.status === 200, "DELETE /employee/:id deletes stylist");
    }
  } catch (err) {
    assert(false, "Employee Suite", err.message);
  }

  // 5. APPOINTMENTS, AVAILABILITY & COLLISION TESTS
  console.log("\n▶ 5. Appointments & Slot Collision Detection");
  try {
    const targetDate = "2026-09-01";
    const testTime = "02:00 PM";

    // A. Check availability before booking
    const availBefore = await axios.get(
      `${BASE_URL}/appointments/availability?date=${targetDate}&employee_id=${sampleEmployeeId}`
    );
    assert(availBefore.data.success === true, "GET /appointments/availability returns 200");
    const slotObjBefore = availBefore.data.slots.find((s) => s.time === testTime);
    assert(slotObjBefore?.available === true, "Target slot initially available");

    // B. Book the slot for sample employee
    const appointmentPayload = {
      name: "Meera Sen",
      phone: "9876599999",
      email: "meera.sen@example.com",
      gender: "female",
      source: "online",
      date: targetDate,
      appointment_time: testTime,
      employee_id: sampleEmployeeId,
      amount: 1450,
      payment_mode: "upi",
      services: [
        {
          service_id: sampleServiceId,
          sub_service_id: sampleSubServiceId,
          employee_id: sampleEmployeeId,
          price: 1450,
        },
      ],
    };

    const createApt = await axios.post(`${BASE_URL}/appointments`, appointmentPayload);
    assert(createApt.status === 201 || createApt.status === 200, "POST /appointments successfully books slot");
    sampleAppointmentId = createApt.data.appointment?._id;

    // C. Check availability after booking (Must now be booked)
    const availAfter = await axios.get(
      `${BASE_URL}/appointments/availability?date=${targetDate}&employee_id=${sampleEmployeeId}`
    );
    const slotObjAfter = availAfter.data.slots.find((s) => s.time === testTime);
    assert(slotObjAfter?.available === false, "Slot now correctly marked as Booked / Busy");

    // D. Attempt duplicate booking for same stylist at same time (Must return 409 Conflict)
    try {
      await axios.post(`${BASE_URL}/appointments`, appointmentPayload);
      assert(false, "Rejects collision on duplicate stylist slot");
    } catch (err) {
      assert(
        err.response?.status === 409 && err.response?.data?.conflict === true,
        `Collision Prevention: 409 Conflict returned (${err.response?.data?.message})`
      );
      assert(
        !!err.response?.data?.nextAvailableSlot,
        `Recommends Next Available Slot (${err.response?.data?.nextAvailableSlot})`
      );
    }

    // Clean up test appointment
    if (sampleAppointmentId) {
      await axios.delete(`${BASE_URL}/appointments/${sampleAppointmentId}`, adminHeaders);
    }
  } catch (err) {
    assert(false, "Appointments & Collision Suite", err.message);
  }

  // 6. PAYMENTS & ANALYTICS
  console.log("\n▶ 6. Payments & Revenue Analytics");
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    const todayPayments = await axios.get(`${BASE_URL}/payments/date/${todayStr}`, adminHeaders);
    assert(Array.isArray(todayPayments.data), "GET /payments/date/:date returns daily transaction list");

    const groupedPayments = await axios.get(`${BASE_URL}/payments/grouped`, adminHeaders);
    assert(Array.isArray(groupedPayments.data), "GET /payments/grouped returns monthly aggregation");

    if (sampleEmployeeId) {
      const stylistDayPay = await axios.get(
        `${BASE_URL}/payments/employee/${sampleEmployeeId}/${todayStr}`,
        adminHeaders
      );
      assert(
        typeof stylistDayPay.data.total_employee_amount === "number",
        "GET /payments/employee/:id/:date returns stylist day metrics"
      );
    }
  } catch (err) {
    assert(false, "Payments Suite", err.message);
  }

  // 7. ATTENDANCE SYSTEM
  console.log("\n▶ 7. Staff Attendance Logging");
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    if (sampleEmployeeId) {
      const markAtt = await axios.post(
        `${BASE_URL}/attendance`,
        {
          employee_id: sampleEmployeeId,
          date: todayStr,
          leave: false,
        },
        recepHeaders
      );
      assert(markAtt.status === 200 || markAtt.status === 201, "POST /attendance logs daily attendance record");
      sampleAttendanceId = markAtt.data.attendance?._id || markAtt.data._id;

      const empAtt = await axios.get(`${BASE_URL}/attendance/employee/${sampleEmployeeId}`, recepHeaders);
      assert(Array.isArray(empAtt.data), "GET /attendance/employee/:id returns stylist calendar records");

      if (sampleAttendanceId) {
        const updateAtt = await axios.put(
          `${BASE_URL}/attendance/${sampleAttendanceId}`,
          {
            leave: false,
          },
          recepHeaders
        );
        assert(updateAtt.status === 200, "PUT /attendance/:id updates attendance status");
      }
    }
  } catch (err) {
    assert(false, "Attendance Suite", err.message);
  }

  // TEST SUMMARY
  console.log("\n========================================================");
  console.log(`🏁 API TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
