// import axios from "axios";

// export const sendWhatsAppMessage = async (req, res) => {
//   const { phone, message } = req.body;

//   try {
//     const url = `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_ID}/messages`;

//     await axios.post(
//       url,
//       {
//         messaging_product: "whatsapp",
//         to: phone,
//         type: "text",
//         text: { body: message },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return res.json({ success: true, message: "WhatsApp message sent ✅" });
//   } catch (error) {
//     console.error("WA error", error?.response?.data);
//     return res.status(500).json({ error: "Failed to send message" });
//   }
// };
