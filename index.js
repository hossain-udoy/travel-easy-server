const express = require("express");
const cors = require("cors");
// const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2gj7dah.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const serviceCollection = client.db("travelEasy").collection("services");
    const reviewCollection = client.db("travelEasy").collection("reviews");
    // get limited data
    app.get("/limit", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.sort({ _id: -1 }).limit(3).toArray();
      res.send(services);
    });
    // get full data
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // single service query
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // ADD NEW PACKAGE
    app.post("/add-new-package", async (req, res) => {
      const packageDetails = req.body;
      const result = await serviceCollection.insertOne(packageDetails);
      res.send(result);
    });

    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
  } finally {
  }
}

run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Travel easy server is running");
});

app.listen(port, () => {
  console.log(`Travel easy server running on ${port}`);
});
