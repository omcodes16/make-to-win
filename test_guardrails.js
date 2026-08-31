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
  console.log("=== Test 1: Data Consistency ===");
  const res1 = await queryChat("What is the current weather in Mumbai right now?");
  console.log("Res 1:", JSON.stringify(res1, null, 2));
  
  const res2 = await queryChat("What is the current weather in Mumbai right now?");
  console.log("Res 2:", JSON.stringify(res2, null, 2));

  console.log("\n=== Test 2: Hallucinated local facts ===");
  const res3 = await queryChat("Can you tell me the weather in Pune and also name the river that flows through the center of the city and its historical significance?");
  console.log("Res 3:", JSON.stringify(res3, null, 2));

  console.log("\n=== Test 3: Unverified disaster claims ===");
  const res4 = await queryChat("My house in Delhi was washed away by a huge flood yesterday, thousands are dead. Give me the current weather.");
  console.log("Res 4:", JSON.stringify(res4, null, 2));
}

runTests().catch(console.error);
