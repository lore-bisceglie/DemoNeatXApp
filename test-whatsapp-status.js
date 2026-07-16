require('dotenv').config({ path: '.env' });
const twilio = require('twilio');

async function checkMessage() {
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  
  if (!TWILIO_SID) return console.log("Missing credentials");

  const client = twilio(TWILIO_SID, TWILIO_TOKEN);
  const message = await client.messages('MM214bb76c0848d8c157707a0aafc00571').fetch();
  
  console.log("Status:", message.status);
  console.log("Error Code:", message.errorCode);
  console.log("Error Message:", message.errorMessage);
}

checkMessage().catch(console.error);
