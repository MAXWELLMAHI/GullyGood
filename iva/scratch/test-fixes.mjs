// Node verification script
async function runTests() {
  console.log("=== Testing 1: Chat API ===");
  try {
    const postRes = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: "mock-books",
        message: "Testing verified message from donor",
        senderRole: "donor",
        senderName: "Asha Mehta",
      }),
    });
    const postData = await postRes.json();
    console.log("Chat POST response:", postRes.status, postData.success ? "SUCCESS" : postData);

    const getRes = await fetch("http://localhost:3001/api/chat?listingId=mock-books");
    const getData = await getRes.json();
    console.log("Chat GET messages count:", getData.messages?.length);
    const lastMsg = getData.messages?.[getData.messages.length - 1];
    console.log("Last message in chat:", lastMsg?.message);
  } catch (err) {
    console.error("Chat API test error:", err);
  }

  console.log("\n=== Testing 2: Donor Dashboard with Demo Role Cookie (No Runtime Cookie Crash) ===");
  try {
    const donorRes = await fetch("http://localhost:3001/donor/dashboard", {
      headers: {
        Cookie: "iva_demo_role=donor; mock_user_email=donor@iva.app",
      },
    });
    console.log("Donor Dashboard HTTP status:", donorRes.status);
    const text = await donorRes.text();
    const hasError = text.includes("Cookies can only be modified");
    console.log("Has Cookie Error:", hasError);
    console.log("Contains Dashboard Content:", text.includes("Donor dashboard") || text.includes("Keep essentials moving"));
  } catch (err) {
    console.error("Donor Dashboard test error:", err);
  }

  console.log("\n=== Testing 3: NGO Dashboard with Demo Role Cookie ===");
  try {
    const ngoRes = await fetch("http://localhost:3001/ngo/dashboard", {
      headers: {
        Cookie: "iva_demo_role=ngo; mock_user_email=ngo@iva.app",
      },
    });
    console.log("NGO Dashboard HTTP status:", ngoRes.status);
    const text = await ngoRes.text();
    console.log("Has Cookie Error:", text.includes("Cookies can only be modified"));
    console.log("Contains NGO Dashboard:", text.includes("NGO dashboard") || text.includes("Nearby live listings"));
    console.log("Contains product pictures (images.unsplash.com):", text.includes("images.unsplash.com"));
  } catch (err) {
    console.error("NGO Dashboard test error:", err);
  }

  console.log("\n=== Testing 4: Listing Details Page Product Pictures ===");
  try {
    const listingRes = await fetch("http://localhost:3001/ngo/listings/mock-books", {
      headers: {
        Cookie: "iva_demo_role=ngo; mock_user_email=ngo@iva.app",
      },
    });
    console.log("NGO Listing Detail HTTP status:", listingRes.status);
    const text = await listingRes.text();
    console.log("Contains product picture in detail:", text.includes("product") && text.includes("images.unsplash.com"));
    console.log("Contains Chat Panel:", text.includes("Live pickup chat") || text.includes("chat"));
  } catch (err) {
    console.error("Listing detail test error:", err);
  }
}

runTests();
