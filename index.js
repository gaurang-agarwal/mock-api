const express = require("express");
const fs = require("fs");
const readline = require("readline");
const path = require("path");

const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const app = express();
const PORT = process.env.PORT || 3000;

// Load OpenAPI spec
const swaggerDocument = YAML.load(path.join(__dirname, "openapi.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Utility to read JSONL file
async function readJsonl(filePath) {
  const data = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) {
      data.push(JSON.parse(line));
    }
  }
  return data;
}

// Filtering and pagination utilities
function filterData(data, query) {
  return data.filter(item =>
    Object.keys(query).every(key => {
      if (!(key in item)) return true;
      const value = query[key];
      if (typeof item[key] === "string") return item[key] === value;
      if (typeof item[key] === "number") return item[key] == value;
      return true;
    })
  );
}

function paginate(data, page = 1, limit = 50) {
  page = parseInt(page);
  limit = parseInt(limit);
  const start = (page - 1) * limit;
  return data.slice(start, start + limit);
}

// Load JSONL data
let customers = [];
let subscriptions = [];
let invoices = [];
let plans = [];

(async () => {
  customers = await readJsonl(path.join(__dirname, "data/customers.jsonl"));
  subscriptions = await readJsonl(path.join(__dirname, "data/subscriptions.jsonl"));
  invoices = await readJsonl(path.join(__dirname, "data/invoices.jsonl"));
  plans = await readJsonl(path.join(__dirname, "data/plans.jsonl"));
  console.log("Data loaded successfully!");
})();

// ------------------- Endpoints -------------------

// Customers
app.get("/customers", (req, res) => {
  let result = filterData(customers, req.query);
  result = paginate(result, req.query.page, req.query.limit);
  res.json(result);
});

// Subscriptions
app.get("/subscriptions", (req, res) => {
  let result = filterData(subscriptions, req.query);
  result = paginate(result, req.query.page, req.query.limit);
  res.json(result);
});

// Invoices
app.get("/invoices", (req, res) => {
  let result = filterData(invoices, req.query);
  result = paginate(result, req.query.page, req.query.limit);
  res.json(result);
});

// Plans
app.get("/plans", (req, res) => {
  let result = filterData(plans, req.query);
  result = paginate(result, req.query.page, req.query.limit);
  res.json(result);
});

// Serve raw OpenAPI YAML
app.get("/api-docs.yaml", (req, res) => {
  res.type("yaml"); // Set content type
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});


// Root endpoint
app.get("/", (req, res) => {
  res.send("Subscription Mock API running. Visit /api-docs for Swagger UI.");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
