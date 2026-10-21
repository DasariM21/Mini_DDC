import assert from "node:assert/strict";

const baseUrl = process.env.MINIDSP_BASE_URL ?? "http://localhost:3000";
const loginResponse = await fetch(new URL("/login", baseUrl));
const signupResponse = await fetch(new URL("/signup", baseUrl));
const protectedResponse = await fetch(baseUrl, { redirect: "manual" });
const apiForm = new FormData();
apiForm.append("file", new Blob(["synthetic smoke input"]), "smoke.txt");
const apiResponse = await fetch(new URL("/api/scan", baseUrl), {
  method: "POST",
  body: apiForm,
  redirect: "manual"
});

assert.equal(loginResponse.status, 200, "login page should render");
assert.equal(signupResponse.status, 200, "signup page should render");
assert.equal(protectedResponse.status, 307, "unauthenticated scanner access should redirect");
assert.ok([401, 503].includes(apiResponse.status), "unauthenticated scan API should deny access or report missing config");

console.log(`HTTP auth smoke passed: login=${loginResponse.status}, signup=${signupResponse.status}, scanner=${protectedResponse.status}, API=${apiResponse.status}.`);