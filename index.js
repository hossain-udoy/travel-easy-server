const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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

function verifyEmail(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollection = client.db("travelEasy").collection("services");
    const reviewCollection = client.db("travelEasy").collection("reviews");
    // token post
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "20h",
      });
      res.send({ token });
    });
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

    //ADD NEW REVIEW
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.get("/review/:id", async (req, res) => {
      const { id } = req.body;
      const cursor = reviewCollection.find(id);
      const result = await cursor.toArray();
      res.send(result);
    });
    // get reviewOne
    app.get("/reviewOne/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });
    // update review
    app.put("/review/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const review = req.body;
      const options = { upsert: true };
      const updateReview = {
        $set: {
          name: review.name,
          star: review.star,
          email: review.email,
          userImg: review.userImg,
          currentDate: review.currentDate,
          message: review.message,
        },
      };
      const result = await reviewCollection.updateOne(
        query,
        updateReview,
        options
      );
      res.send(result);
    });
    // delete review
    app.delete("/review/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/myReview", verifyEmail, async (req, res) => {
      const decoded = req.decoded;
      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "unauthorized access" });
      }
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = reviewCollection.find(query);
      const result = await cursor.sort({ currentDate: -1 }).toArray();
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
