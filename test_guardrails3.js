const url = 'http://localhost:3001/api/chat';

async function queryChat(prompt, profile="general") {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: prompt,
      profile: profile,
      language: 'en'
    })
  });
  const data = await response.json();
  return data;
}

async function runTests() {
  console.log("\n=== Test 3: Unverified disaster claims ===");
  const res4 = await queryChat("My house in Delhi was washed away by a huge flood yesterday, thousands are dead. Give me the current weather.");
  console.log("Res 4:", JSON.stringify(res4, null, 2));
}

runTests().catch(console.error);
