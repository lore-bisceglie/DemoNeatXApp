require("dotenv").config();

async function testIG() {
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = process.env.META_PERMANENT_TOKEN;
  
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${accountId}?fields=username,name,profile_picture_url&access_token=${token}`);
    const data = await res.json();
    console.log("IG Info:", data);
  } catch (e) {
    console.error(e);
  }
}

testIG();
