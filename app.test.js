const request = require("supertest");
const app = require("./app");

test("full route test", async () => {
  const response = await request(app).get("/api/feature/featureid/space-probability");
  expect(response.status).toBe(200);
  expect(response.body).toBe(null);
})
